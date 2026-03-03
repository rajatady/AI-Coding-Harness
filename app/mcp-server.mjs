#!/usr/bin/env node
/**
 * Canvas MCP Server — exposes design tools over MCP protocol.
 * Uses WebSocket to bridge to the running browser app (same WASM instance).
 * Tool definitions match tools.ts exactly — single source of truth.
 *
 * Transport: stdio (Claude Code ↔ MCP server) + WebSocket (MCP server ↔ browser)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WebSocketServer } from 'ws';
import { z } from 'zod';

const WS_PORT = 3100;

// ─── WebSocket server (browser connects to this) ────────────────────

const wss = new WebSocketServer({ port: WS_PORT });
let browserSocket = null;
let pendingCalls = new Map(); // id → { resolve, reject, timer }
let callId = 0;

wss.on('connection', (ws) => {
    browserSocket = ws;
    ws.on('message', (data) => {
        try {
            const { id, result } = JSON.parse(data.toString());
            const pending = pendingCalls.get(id);
            if (pending) {
                clearTimeout(pending.timer);
                pendingCalls.delete(id);
                pending.resolve(result);
            }
        } catch {}
    });
    ws.on('close', () => { if (browserSocket === ws) browserSocket = null; });
});

function callBrowser(tool, args, timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (!browserSocket || browserSocket.readyState !== 1) {
            return resolve({ error: 'App not running. Open http://localhost:3011 in a browser first.' });
        }
        const id = ++callId;
        const timer = setTimeout(() => {
            pendingCalls.delete(id);
            resolve({ error: 'Tool call timed out (10s)' });
        }, timeout);
        pendingCalls.set(id, { resolve, reject, timer });
        browserSocket.send(JSON.stringify({ id, tool, args }));
    });
}

// ─── MCP Server ─────────────────────────────────────────────────────

const server = new McpServer({
    name: 'canvas',
    version: '1.0.0',
}, {
    capabilities: { tools: {} }
});

// Register tools — schemas match tools.ts TOOL_DEFS exactly.
// We define them here in zod format for the MCP SDK, but the EXECUTION
// goes to tools.ts via the WebSocket bridge (single source of truth).

server.tool('get_page_structure',
    'List all pages and the layer tree for the current page. Call this first to understand what exists on the canvas.',
    {},
    async () => {
        const result = await callBrowser('get_page_structure', {});
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool('get_node_details',
    'Get detailed properties of a node: position, size, fill, stroke, opacity, effects, text content, etc.',
    { node_name: z.string().describe('Exact name of the node') },
    async ({ node_name }) => {
        const result = await callBrowser('get_node_details', { node_name });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool('create_node',
    'Create a new design node on the canvas.',
    {
        type: z.enum(['rectangle', 'ellipse', 'frame', 'text', 'star', 'line']),
        name: z.string().describe('Unique descriptive name'),
        parent: z.string().optional().describe('Name of parent frame/group to insert into. Omit for top-level.'),
        x: z.number(), y: z.number(),
        width: z.number(), height: z.number(),
        fill: z.string().optional().describe('Hex color like #FF0000. Default #888888'),
        text_content: z.string().optional().describe('Text content (text nodes only)'),
        font_size: z.number().optional().describe('Font size in px (text nodes, default 16)'),
        font_weight: z.number().optional().describe('Font weight (100-900, text nodes)'),
        star_points: z.number().optional().describe('Point count (star nodes, default 5)'),
    },
    async (args) => {
        const result = await callBrowser('create_node', args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
);

server.tool('edit_node',
    'Edit properties of an existing node. Only include properties you want to change.',
    {
        node_name: z.string().describe('Name of the node to edit'),
        x: z.number().optional(), y: z.number().optional(),
        width: z.number().optional(), height: z.number().optional(),
        fill: z.string().optional().describe('Hex color'),
        opacity: z.number().optional().describe('0.0 to 1.0'),
        new_name: z.string().optional().describe('Rename the node'),
        text_content: z.string().optional().describe('New text (text nodes only)'),
        font_size: z.number().optional(),
        font_weight: z.number().optional().describe('100-900'),
        letter_spacing: z.number().optional(),
        line_height: z.number().optional(),
        corner_radius: z.number().optional(),
        rotation: z.number().optional().describe('Degrees'),
        stroke_color: z.string().optional().describe('Hex stroke color'),
        stroke_weight: z.number().optional(),
    },
    async (args) => {
        const result = await callBrowser('edit_node', args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
);

server.tool('delete_node',
    'Delete a node by name.',
    { node_name: z.string() },
    async ({ node_name }) => {
        const result = await callBrowser('delete_node', { node_name });
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
);

server.tool('switch_page',
    'Switch to a different page by index.',
    { page_index: z.number().describe('Zero-based page index') },
    async ({ page_index }) => {
        const result = await callBrowser('switch_page', { page_index });
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
);

server.tool('render',
    'Force a canvas re-render. Use after batch operations.',
    {},
    async () => {
        const result = await callBrowser('screenshot', {});
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
);

// ─── Start ──────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
