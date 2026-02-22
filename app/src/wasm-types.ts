/**
 * Type declarations for the WASM module.
 * This is the BOUNDARY CONTRACT between TypeScript and Rust.
 *
 * If a WASM function signature changes, update HERE FIRST.
 * TypeScript strict mode will catch all callers.
 */

export interface FigmaApp {
    free(): void;
    set_viewport(width: number, height: number): void;
    add_rectangle(name: string, x: number, y: number, width: number, height: number, r: number, g: number, b: number, a: number): Uint32Array;
    add_ellipse(name: string, x: number, y: number, width: number, height: number, r: number, g: number, b: number, a: number): Uint32Array;
    add_gradient_rectangle(name: string, x: number, y: number, width: number, height: number, start_x: number, start_y: number, end_x: number, end_y: number, stop_positions: Float32Array, stop_colors: Float32Array): Uint32Array;
    add_frame(name: string, x: number, y: number, w: number, h: number): Uint32Array;
    mouse_down(x: number, y: number): boolean;
    mouse_move(x: number, y: number): void;
    mouse_up(): void;
    delete_selected(): boolean;
    get_selected(): Uint32Array;
    render(width: number, height: number): Uint8Array;
    needs_render(): boolean;
    node_count(): number;
    get_pending_ops(): string;
    apply_remote_ops(json: string): number;
}

export interface FigmaAppConstructor {
    new(name: string, client_id: number): FigmaApp;
}

export interface WasmModule {
    default: () => Promise<void>;
    FigmaApp: FigmaAppConstructor;
}
