/**
 * Shared tool definitions and executor for the canvas design tool.
 * Single source of truth — used by both AI chat (ai.ts) and MCP server (mcp-server.mjs).
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface ToolDef {
    type: 'function';
    function: { name: string; description: string; parameters: Record<string, any> };
}

export interface ToolDeps {
    app: any;            // FigmaApp WASM instance
    render: () => void;  // trigger canvas re-render
    hexToRgb: (hex: string) => [number, number, number]; // returns 0-1 floats
}

// ─── Tool Definitions ────────────────────────────────────────────────

export const TOOL_DEFS: ToolDef[] = [
    {
        type: 'function', function: {
            name: 'get_page_structure',
            description: 'List all pages and the layer tree for the current page. Call this first to understand what exists on the canvas.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function', function: {
            name: 'get_node_details',
            description: 'Get detailed properties of a node: position, size, fill, stroke, opacity, effects, text content, etc.',
            parameters: {
                type: 'object',
                properties: { node_name: { type: 'string', description: 'Exact name of the node' } },
                required: ['node_name']
            }
        }
    },
    {
        type: 'function', function: {
            name: 'create_node',
            description: 'Create a new design node on the canvas.',
            parameters: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['rectangle', 'ellipse', 'frame', 'text', 'star', 'line'] },
                    name: { type: 'string', description: 'Unique descriptive name' },
                    parent: { type: 'string', description: 'Name of parent frame/group to insert into. Omit for top-level.' },
                    x: { type: 'number' }, y: { type: 'number' },
                    width: { type: 'number' }, height: { type: 'number' },
                    fill: { type: 'string', description: 'Hex color like #FF0000. Default #888888' },
                    text_content: { type: 'string', description: 'Text content (text nodes only)' },
                    font_size: { type: 'number', description: 'Font size in px (text nodes, default 16)' },
                    font_weight: { type: 'number', description: 'Font weight (100-900, text nodes)' },
                    star_points: { type: 'number', description: 'Point count (star nodes, default 5)' },
                },
                required: ['type', 'name', 'x', 'y', 'width', 'height']
            }
        }
    },
    {
        type: 'function', function: {
            name: 'edit_node',
            description: 'Edit properties of an existing node. Only include properties you want to change.',
            parameters: {
                type: 'object',
                properties: {
                    node_name: { type: 'string', description: 'Name of the node to edit' },
                    x: { type: 'number' }, y: { type: 'number' },
                    width: { type: 'number' }, height: { type: 'number' },
                    fill: { type: 'string', description: 'Hex color' },
                    opacity: { type: 'number', description: '0.0 to 1.0' },
                    new_name: { type: 'string', description: 'Rename the node' },
                    text_content: { type: 'string', description: 'New text (text nodes only)' },
                    font_size: { type: 'number' },
                    font_weight: { type: 'number', description: '100-900' },
                    letter_spacing: { type: 'number' },
                    line_height: { type: 'number' },
                    corner_radius: { type: 'number' },
                    rotation: { type: 'number', description: 'Degrees' },
                    stroke_color: { type: 'string', description: 'Hex stroke color' },
                    stroke_weight: { type: 'number' },
                },
                required: ['node_name']
            }
        }
    },
    {
        type: 'function', function: {
            name: 'delete_node',
            description: 'Delete a node by name.',
            parameters: {
                type: 'object',
                properties: { node_name: { type: 'string' } },
                required: ['node_name']
            }
        }
    },
    {
        type: 'function', function: {
            name: 'switch_page',
            description: 'Switch to a different page by index.',
            parameters: {
                type: 'object',
                properties: { page_index: { type: 'number', description: 'Zero-based page index' } },
                required: ['page_index']
            }
        }
    },
    {
        type: 'function', function: {
            name: 'screenshot',
            description: 'Capture a screenshot of the current canvas view. Use to verify changes look correct.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────

export function resolveNode(app: any, name: string): { counter: number; client_id: number } | null {
    const results = JSON.parse(app.find_nodes_by_name(name));
    if (!results || results.length === 0) return null;
    return { counter: results[0].counter, client_id: results[0].client_id };
}

// ─── Tool Executor ───────────────────────────────────────────────────

export function executeTool(deps: ToolDeps, name: string, args: any): { result: any; needsRender: boolean } {
    const { app, hexToRgb } = deps;

    switch (name) {
        case 'get_page_structure': {
            const pages = JSON.parse(app.get_pages());
            const layers = JSON.parse(app.get_layers());
            const cam = app.get_camera();
            return { needsRender: false, result: {
                pages, current_page: app.current_page_index(),
                node_count: app.node_count(),
                camera: { x: cam[0], y: cam[1], zoom: cam[2] },
                layers: layers.slice(0, 200),
            }};
        }
        case 'get_node_details': {
            const n = resolveNode(app, args.node_name);
            if (!n) return { needsRender: false, result: { error: `Node "${args.node_name}" not found` } };
            const info = JSON.parse(app.get_node_info(n.counter, n.client_id));
            if (info.type === 'frame' || info.type === 'group' || info.type === 'component') {
                try {
                    const children = JSON.parse(app.get_node_children(n.counter, n.client_id));
                    if (children.length > 0) info.children = children.slice(0, 50);
                } catch (_) {}
            }
            return { needsRender: false, result: info };
        }
        case 'create_node': {
            const [r, g, b] = hexToRgb(args.fill || '#888888');
            // Set insert parent if specified
            if (args.parent) {
                const p = resolveNode(app, args.parent);
                if (p) app.set_insert_parent(p.counter, p.client_id);
                else return { needsRender: false, result: { error: `Parent "${args.parent}" not found` } };
            }
            let id: number[];
            try {
                switch (args.type) {
                    case 'rectangle': id = app.add_rectangle(args.name, args.x, args.y, args.width, args.height, r, g, b, 1); break;
                    case 'ellipse':   id = app.add_ellipse(args.name, args.x, args.y, args.width, args.height, r, g, b, 1); break;
                    case 'frame':     id = app.add_frame(args.name, args.x, args.y, args.width, args.height, r, g, b, 1); break;
                    case 'text':      id = app.add_text(args.name, args.text_content || args.name, args.x, args.y, args.font_size || 16, r, g, b, 1); break;
                    case 'star':      id = app.add_star(args.name, args.x, args.y, args.width, args.height, args.star_points || 5, r, g, b, 1); break;
                    case 'line':      id = app.add_line(args.name, args.x, args.y, args.x + args.width, args.y + args.height, r, g, b, 1); break;
                    default: return { needsRender: false, result: { error: `Unknown type: ${args.type}` } };
                }
            } finally {
                if (args.parent) app.clear_insert_parent();
            }
            // Apply post-creation properties
            if (args.font_weight && args.type === 'text') app.set_node_font_weight(id[0], id[1], args.font_weight);
            return { needsRender: true, result: { created: args.name, type: args.type, id: { counter: id[0], client_id: id[1] } } };
        }
        case 'edit_node': {
            const n = resolveNode(app, args.node_name);
            if (!n) return { needsRender: false, result: { error: `Node "${args.node_name}" not found` } };
            const c = n.counter, ci = n.client_id;
            const changed: string[] = [];

            if (args.x !== undefined || args.y !== undefined) {
                const info = JSON.parse(app.get_node_info(c, ci));
                app.set_node_position(c, ci, args.x ?? info.x, args.y ?? info.y);
                changed.push('position');
            }
            if (args.width !== undefined || args.height !== undefined) {
                const info = JSON.parse(app.get_node_info(c, ci));
                app.set_node_size(c, ci, args.width ?? info.width, args.height ?? info.height);
                changed.push('size');
            }
            if (args.fill) { const [r, g, b] = hexToRgb(args.fill); app.set_node_fill(c, ci, r, g, b, 1); changed.push('fill'); }
            if (args.opacity !== undefined) { app.set_node_opacity(c, ci, args.opacity); changed.push('opacity'); }
            if (args.new_name) { app.set_node_name(c, ci, args.new_name); changed.push('name'); }
            if (args.text_content) { app.set_node_text(c, ci, args.text_content); changed.push('text'); }
            if (args.font_size !== undefined) { app.set_node_font_size(c, ci, args.font_size); changed.push('font_size'); }
            if (args.font_weight !== undefined) { app.set_node_font_weight(c, ci, args.font_weight); changed.push('font_weight'); }
            if (args.letter_spacing !== undefined) { app.set_letter_spacing(c, ci, args.letter_spacing); changed.push('letter_spacing'); }
            if (args.line_height !== undefined) { app.set_line_height(c, ci, args.line_height); changed.push('line_height'); }
            if (args.corner_radius !== undefined) { app.set_node_corner_radius(c, ci, args.corner_radius); changed.push('corner_radius'); }
            if (args.rotation !== undefined) { app.set_node_rotation(c, ci, args.rotation); changed.push('rotation'); }
            if (args.stroke_color) {
                const [sr, sg, sb] = hexToRgb(args.stroke_color);
                app.set_node_stroke(c, ci, sr, sg, sb, 1, args.stroke_weight ?? 1, 'center');
                changed.push('stroke');
            }
            return { needsRender: true, result: { edited: args.node_name, changed } };
        }
        case 'delete_node': {
            const n = resolveNode(app, args.node_name);
            if (!n) return { needsRender: false, result: { error: `Node "${args.node_name}" not found` } };
            app.select_node(n.counter, n.client_id);
            app.delete_selected();
            return { needsRender: true, result: { deleted: args.node_name } };
        }
        case 'switch_page': {
            app.switch_page(args.page_index);
            return { needsRender: true, result: { switched_to: args.page_index } };
        }
        case 'screenshot': {
            const canvas = (typeof document !== 'undefined') ? document.querySelector('canvas') : null;
            if (!canvas) return { needsRender: false, result: { captured: true, note: 'No canvas available. Use get_page_structure instead.' } };
            return { needsRender: false, result: { captured: true, width: (canvas as any).width, height: (canvas as any).height, note: 'Screenshot captured but not sent to avoid token cost. Use get_page_structure and get_node_details to understand the canvas.' } };
        }
        default:
            return { needsRender: false, result: { error: `Unknown tool: ${name}` } };
    }
}

// ─── Action Formatting ───────────────────────────────────────────────

export function formatAction(name: string, args: any, result: any): string | null {
    if (result?.error) return `Failed: ${result.error}`;
    switch (name) {
        case 'create_node':  return `Created ${args.type} "${args.name}"`;
        case 'edit_node':    return `Edited "${args.node_name}" (${(result?.changed || []).join(', ')})`;
        case 'delete_node':  return `Deleted "${args.node_name}"`;
        case 'switch_page':  return `Switched to page ${result?.page_name || args.page_index}`;
        case 'screenshot':   return 'Captured screenshot';
        default:             return null;
    }
}
