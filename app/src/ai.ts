/**
 * Canvas AI — OpenRouter + Claude tool-calling integration.
 * Wires the in-app AI chat panel to Claude via OpenRouter,
 * giving the AI tools to read, create, edit, and delete design nodes.
 */

import { TOOL_DEFS, executeTool, formatAction, type ToolDeps } from './tools';

// ─── Types ───────────────────────────────────────────────────────────

type ChatEntry = { role: 'user' | 'ai'; text: string; actions?: string[] };

// Re-export ToolDeps as AIDeps for backward compat
type AIDeps = ToolDeps;

// ─── Config ──────────────────────────────────────────────────────────

const AI_MODEL = 'anthropic/claude-sonnet-4.5';
const MAX_TOOL_ITERATIONS = 25;
const MAX_TOKENS = 16384;

function getKey(): string | null { return localStorage.getItem('openrouter_api_key'); }
function setKey(key: string) { localStorage.setItem('openrouter_api_key', key); }

// ─── System Prompt ───────────────────────────────────────────────────

function buildSystemPrompt(app: any): string {
    const pages = JSON.parse(app.get_pages());
    const currentIdx = app.current_page_index();
    const currentPage = pages.find((p: any) => p.index === currentIdx);
    const layers = JSON.parse(app.get_layers());
    const layerNames = layers.slice(0, 30).map((l: any) => l.name).join(', ');
    return `You are Canvas AI, an assistant inside a Figma-like design tool. You create, edit, and delete design elements using tools.

Current page: "${currentPage?.name || 'Untitled'}" (index ${currentIdx})
Total pages: ${pages.length} | Nodes on page: ${app.node_count()}
${layerNames ? `Top-level layers: ${layerNames}` : 'This page is empty.'}

CRITICAL RULES:
- Coordinates are canvas pixels. (0,0) is top-left.
- Colors are hex strings like #FF0000.
- ONLY reference nodes that exist on the CURRENT page. Previous conversation may mention nodes from other pages — ignore those.
- Before editing/deleting a node, verify it exists by calling get_node_details. Do NOT assume nodes exist from memory.
- Work incrementally: create nodes in batches of 3-5 per tool call round. Do NOT plan 20+ nodes and try to create them all at once.
- If the user asks for something complex, focus on the most important elements first, then add detail.
- Keep your final text response SHORT (2-3 sentences). The action log shows what you did.
- Use unique, descriptive node names.`;
}

// ─── OpenRouter API ──────────────────────────────────────────────────

async function callAPI(key: string, messages: any[]): Promise<any> {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Canvas AI',
        },
        body: JSON.stringify({ model: AI_MODEL, messages, tools: TOOL_DEFS, max_tokens: MAX_TOKENS }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
    }
    return res.json();
}

// ─── Main Export ─────────────────────────────────────────────────────

export function initAI(deps: AIDeps): void {
    const { app } = deps;

    const aiMessages = document.getElementById('ai-messages')!;
    const aiInput = document.getElementById('ai-input') as HTMLInputElement;
    const aiSendBtn = document.getElementById('ai-send-btn')!;

    const history: ChatEntry[] = [
        { role: 'ai', text: 'Hello! I\'m Canvas AI powered by Claude. I can create, edit, and inspect your design.\n\nTry "Add a blue header" or "What\'s on this page?"\n\nSet your key with `/key YOUR_OPENROUTER_KEY`' },
    ];
    let processing = false;

    function renderMessages(): void {
        let html = '';
        for (const msg of history) {
            if (msg.role === 'ai') {
                html += `<div class="ai-msg-ai">
                    <div class="ai-msg-avatar">✦</div>
                    <div style="flex:1">
                        <p class="ai-msg-text">${escapeHtml(msg.text)}</p>
                        ${(msg.actions || []).map(a => `<div class="ai-msg-action"><span style="color:var(--green)">✓</span> ${escapeHtml(a)}</div>`).join('')}
                    </div>
                </div>`;
            } else {
                html += `<div class="ai-msg-user"><div class="ai-msg-user-bubble">${escapeHtml(msg.text)}</div></div>`;
            }
        }
        if (processing) {
            html += `<div class="ai-msg-ai"><div class="ai-msg-avatar ai-thinking">✦</div><div style="flex:1"><p class="ai-msg-text ai-dots">Thinking</p></div></div>`;
        }
        aiMessages.innerHTML = html;
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    function escapeHtml(s: string): string {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }

    async function send(): Promise<void> {
        const text = aiInput.value.trim();
        if (!text || processing) return;

        // /key command
        if (text.startsWith('/key ')) {
            setKey(text.slice(5).trim());
            history.push({ role: 'user', text: '/key ****' });
            history.push({ role: 'ai', text: 'API key saved. You can now chat with me!' });
            aiInput.value = '';
            renderMessages();
            return;
        }

        const key = getKey();
        if (!key) {
            history.push({ role: 'user', text });
            history.push({ role: 'ai', text: 'No API key set. Use `/key YOUR_OPENROUTER_KEY` to configure.\nGet one at openrouter.ai' });
            aiInput.value = '';
            renderMessages();
            return;
        }

        history.push({ role: 'user', text });
        aiInput.value = '';
        aiSendBtn.classList.remove('active');
        processing = true;
        (window as any)._aiProcessing = true; // Block auto-save during AI ops
        renderMessages();

        try {
            // Build conversation for the API — only send the current user message
            // plus the last few exchanges. Sending old history causes the AI to
            // reference nodes from previous pages/prompts that no longer exist.
            const messages: any[] = [{ role: 'system', content: buildSystemPrompt(app) }];
            const recent = history.slice(-6); // last 3 exchanges max
            for (const msg of recent) {
                // Strip action details from old AI messages to avoid node name confusion
                messages.push({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.text });
            }

            const allActions: string[] = [];
            let iters = 0;

            while (iters++ < MAX_TOOL_ITERATIONS) {
                const data = await callAPI(key, messages);
                console.log('[AI] API response:', JSON.stringify(data).slice(0, 500));
                const choice = data.choices?.[0];
                if (!choice) throw new Error('Empty response');
                const msg = choice.message;

                // Handle truncated response (ran out of tokens)
                if (choice.finish_reason === 'length') {
                    const partial = msg.content || '';
                    history.push({ role: 'ai', text: partial + '\n\n(Response was truncated. Try a simpler request.)', actions: allActions.length ? allActions : undefined });
                    break;
                }

                if (msg.tool_calls?.length) {
                    // Add assistant's tool-calling message
                    messages.push({ role: 'assistant', content: msg.content || null, tool_calls: msg.tool_calls });

                    // Execute each tool, batch render at end
                    let batchNeedsRender = false;
                    let wasmCorrupted = false;
                    for (const tc of msg.tool_calls) {
                        let toolArgs: any = {};
                        try {
                            const raw = tc.function.arguments;
                            toolArgs = (!raw || raw === '') ? {} : (typeof raw === 'string' ? JSON.parse(raw) : raw);
                        } catch (parseErr) {
                            console.warn('[AI] Failed to parse tool args:', tc.function.name, tc.function.arguments, parseErr);
                            toolArgs = {};
                        }
                        console.log('[AI] Tool call:', tc.function.name, toolArgs);
                        let result: any;
                        try {
                            const out = executeTool(deps, tc.function.name, toolArgs);
                            result = out.result;
                            if (out.needsRender) batchNeedsRender = true;
                        } catch (execErr: any) {
                            console.error('[AI] Tool exec error:', tc.function.name, execErr);
                            result = { error: execErr.message };
                            // Detect WASM borrow corruption — stop immediately
                            if (execErr.message?.includes('recursive use of an object')) {
                                wasmCorrupted = true;
                            }
                        }
                        console.log('[AI] Tool result:', tc.function.name, typeof result === 'object' ? JSON.stringify(result).slice(0, 200) : result);
                        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });

                        const label = formatAction(tc.function.name, toolArgs, result);
                        if (label) allActions.push(label);

                        if (wasmCorrupted) break;
                    }
                    // Single render after all tools in this batch
                    if (batchNeedsRender) deps.render();

                    if (wasmCorrupted) {
                        history.push({ role: 'ai', text: 'WASM engine crashed (borrow conflict). Changes made before the crash were applied. Please reload the page to continue.', actions: allActions });
                        break;
                    }
                    continue;
                }

                // Final text response
                history.push({ role: 'ai', text: msg.content || 'Done.', actions: allActions.length ? allActions : undefined });
                break;
            }

            if (iters >= MAX_TOOL_ITERATIONS) {
                history.push({ role: 'ai', text: 'Reached tool call limit. Changes so far have been applied.', actions: allActions });
            }
        } catch (err: any) {
            history.push({ role: 'ai', text: `Error: ${err.message}` });
        } finally {
            processing = false;
            (window as any)._aiProcessing = false; // Re-enable auto-save
            renderMessages();
        }
    }

    renderMessages();

    aiSendBtn.addEventListener('click', () => send());
    aiInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') { send(); e.preventDefault(); }
    });
    aiInput.addEventListener('input', () => {
        aiSendBtn.classList.toggle('active', aiInput.value.trim().length > 0);
    });
    document.querySelectorAll('.ai-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            aiInput.value = btn.textContent || '';
            aiSendBtn.classList.add('active');
            aiInput.focus();
        });
    });
}
