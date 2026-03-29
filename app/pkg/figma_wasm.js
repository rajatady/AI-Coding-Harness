/* @ts-self-types="./figma_wasm.d.ts" */

export class FigmaApp {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FigmaAppFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_figmaapp_free(ptr, 0);
    }
    /**
     * Add a layer blur effect to a node.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} radius
     * @returns {boolean}
     */
    add_blur(counter, client_id, radius) {
        const ret = wasm.figmaapp_add_blur(this.__wbg_ptr, counter, client_id, radius);
        return ret !== 0;
    }
    /**
     * Add a comment at world position (x, y). Returns the comment ID.
     * @param {number} x
     * @param {number} y
     * @param {string} text
     * @param {string} author
     * @returns {number}
     */
    add_comment(x, y, text, author) {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(author, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_comment(this.__wbg_ptr, x, y, ptr0, len0, ptr1, len1);
        return ret >>> 0;
    }
    /**
     * Add a drop shadow effect to a node.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @param {number} ox
     * @param {number} oy
     * @param {number} blur
     * @param {number} spread
     * @returns {boolean}
     */
    add_drop_shadow(counter, client_id, r, g, b, a, ox, oy, blur, spread) {
        const ret = wasm.figmaapp_add_drop_shadow(this.__wbg_ptr, counter, client_id, r, g, b, a, ox, oy, blur, spread);
        return ret !== 0;
    }
    /**
     * Add an ellipse. Returns node ID as [counter, client_id].
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @returns {Uint32Array}
     */
    add_ellipse(name, x, y, width, height, r, g, b, a) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_ellipse(this.__wbg_ptr, ptr0, len0, x, y, width, height, r, g, b, a);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * Add a frame.
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @returns {Uint32Array}
     */
    add_frame(name, x, y, w, h, r, g, b, a) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_frame(this.__wbg_ptr, ptr0, len0, x, y, w, h, r, g, b, a);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * Add a rectangle with a linear gradient fill.
     * stop_positions and stop_colors are parallel arrays. Each color is [r, g, b, a].
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} start_x
     * @param {number} start_y
     * @param {number} end_x
     * @param {number} end_y
     * @param {Float32Array} stop_positions
     * @param {Float32Array} stop_colors
     * @returns {Uint32Array}
     */
    add_gradient_rectangle(name, x, y, width, height, start_x, start_y, end_x, end_y, stop_positions, stop_colors) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(stop_positions, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF32ToWasm0(stop_colors, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_gradient_rectangle(this.__wbg_ptr, ptr0, len0, x, y, width, height, start_x, start_y, end_x, end_y, ptr1, len1, ptr2, len2);
        var v4 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v4;
    }
    /**
     * Add an image node from raw RGBA pixel data.
     * Returns node ID as [counter, client_id].
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {Uint8Array} image_data
     * @param {number} image_width
     * @param {number} image_height
     * @returns {Uint32Array}
     */
    add_image(name, x, y, width, height, image_data, image_width, image_height) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(image_data, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_image(this.__wbg_ptr, ptr0, len0, x, y, width, height, ptr1, len1, image_width, image_height);
        var v3 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v3;
    }
    /**
     * Add a rectangle with an image fill (URL-based, loaded by renderer).
     * `path` is relative to /imports/ (e.g. "starbucks.png").
     * `scale_mode`: "fill", "fit", "tile", "stretch".
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {string} path
     * @param {string} scale_mode
     * @param {number} opacity
     * @returns {Uint32Array}
     */
    add_image_fill(name, x, y, width, height, path, scale_mode, opacity) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(scale_mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_image_fill(this.__wbg_ptr, ptr0, len0, x, y, width, height, ptr1, len1, ptr2, len2, opacity);
        var v4 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v4;
    }
    /**
     * Add an inner shadow effect to a node.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @param {number} ox
     * @param {number} oy
     * @param {number} blur
     * @param {number} spread
     * @returns {boolean}
     */
    add_inner_shadow(counter, client_id, r, g, b, a, ox, oy, blur, spread) {
        const ret = wasm.figmaapp_add_inner_shadow(this.__wbg_ptr, counter, client_id, r, g, b, a, ox, oy, blur, spread);
        return ret !== 0;
    }
    /**
     * Add a line from (x1,y1) to (x2,y2) with stroke color.
     * @param {string} name
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @param {number} stroke_width
     * @returns {Uint32Array}
     */
    add_line(name, x1, y1, x2, y2, r, g, b, a, stroke_width) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_line(this.__wbg_ptr, ptr0, len0, x1, y1, x2, y2, r, g, b, a, stroke_width);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * Append a solid fill to existing fills (for multiple fills per node).
     * @param {number} counter
     * @param {number} client_id
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @returns {boolean}
     */
    add_node_fill(counter, client_id, r, g, b, a) {
        const ret = wasm.figmaapp_add_node_fill(this.__wbg_ptr, counter, client_id, r, g, b, a);
        return ret !== 0;
    }
    /**
     * Append a linear gradient fill to existing fills.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} start_x
     * @param {number} start_y
     * @param {number} end_x
     * @param {number} end_y
     * @param {Float32Array} stop_positions
     * @param {Float32Array} stop_colors
     * @returns {boolean}
     */
    add_node_linear_gradient(counter, client_id, start_x, start_y, end_x, end_y, stop_positions, stop_colors) {
        const ptr0 = passArrayF32ToWasm0(stop_positions, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(stop_colors, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_node_linear_gradient(this.__wbg_ptr, counter, client_id, start_x, start_y, end_x, end_y, ptr0, len0, ptr1, len1);
        return ret !== 0;
    }
    /**
     * Append a radial gradient fill to existing fills.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} center_x
     * @param {number} center_y
     * @param {number} radius
     * @param {Float32Array} stop_positions
     * @param {Float32Array} stop_colors
     * @returns {boolean}
     */
    add_node_radial_gradient(counter, client_id, center_x, center_y, radius, stop_positions, stop_colors) {
        const ptr0 = passArrayF32ToWasm0(stop_positions, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(stop_colors, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_node_radial_gradient(this.__wbg_ptr, counter, client_id, center_x, center_y, radius, ptr0, len0, ptr1, len1);
        return ret !== 0;
    }
    /**
     * Add a new page and return its index.
     * @param {string} name
     * @returns {number}
     */
    add_page(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_page(this.__wbg_ptr, ptr0, len0);
        return ret >>> 0;
    }
    /**
     * Add a prototype link from source node to target node.
     * trigger: "click" | "hover" | "drag"
     * animation: "instant" | "dissolve" | "slide"
     * @param {number} src_counter
     * @param {number} src_client
     * @param {number} dst_counter
     * @param {number} dst_client
     * @param {string} trigger
     * @param {string} animation
     * @returns {boolean}
     */
    add_prototype_link(src_counter, src_client, dst_counter, dst_client, trigger, animation) {
        const ptr0 = passStringToWasm0(trigger, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(animation, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_prototype_link(this.__wbg_ptr, src_counter, src_client, dst_counter, dst_client, ptr0, len0, ptr1, len1);
        return ret !== 0;
    }
    /**
     * Add a rectangle. Returns node ID as [counter, client_id].
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @returns {Uint32Array}
     */
    add_rectangle(name, x, y, width, height, r, g, b, a) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_rectangle(this.__wbg_ptr, ptr0, len0, x, y, width, height, r, g, b, a);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * Add a rounded rectangle. Returns node ID as [counter, client_id].
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @param {number} radius
     * @returns {Uint32Array}
     */
    add_rounded_rect(name, x, y, width, height, r, g, b, a, radius) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_rounded_rect(this.__wbg_ptr, ptr0, len0, x, y, width, height, r, g, b, a, radius);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * Add a star/polygon. `points` = number of outer points (3=triangle, 5=star, 6=hexagon).
     * `inner_ratio` = inner radius / outer radius (0.0..1.0). Use 1.0 for regular polygon.
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @param {number} points
     * @param {number} inner_ratio
     * @returns {Uint32Array}
     */
    add_star(name, x, y, width, height, r, g, b, a, points, inner_ratio) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_star(this.__wbg_ptr, ptr0, len0, x, y, width, height, r, g, b, a, points, inner_ratio);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * Add a text node. Returns node ID as [counter, client_id].
     * @param {string} name
     * @param {string} content
     * @param {number} x
     * @param {number} y
     * @param {number} font_size
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @returns {Uint32Array}
     */
    add_text(name, content, x, y, font_size, r, g, b, a) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_text(this.__wbg_ptr, ptr0, len0, ptr1, len1, x, y, font_size, r, g, b, a);
        var v3 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v3;
    }
    /**
     * Add a vector shape from flat path data.
     * Format: each command is [type, ...args]
     *   0, x, y           = MoveTo
     *   1, x, y           = LineTo
     *   2, c1x, c1y, c2x, c2y, x, y = CubicTo
     *   3                 = Close
     * `width`/`height` = bounding box for hit-testing.
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @param {Float32Array} path_data
     * @returns {Uint32Array}
     */
    add_vector(name, x, y, width, height, r, g, b, a, path_data) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(path_data, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_add_vector(this.__wbg_ptr, ptr0, len0, x, y, width, height, r, g, b, a, ptr1, len1);
        var v3 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v3;
    }
    /**
     * Align selected nodes. direction: 0=left, 1=center-h, 2=right, 3=top, 4=center-v, 5=bottom
     * @param {number} direction
     * @returns {boolean}
     */
    align_selected(direction) {
        const ret = wasm.figmaapp_align_selected(this.__wbg_ptr, direction);
        return ret !== 0;
    }
    /**
     * Apply remote operations (JSON array of Operation).
     * Returns number of ops applied.
     * @param {string} json
     * @returns {number}
     */
    apply_remote_ops(json) {
        const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_apply_remote_ops(this.__wbg_ptr, ptr0, len0);
        return ret >>> 0;
    }
    /**
     * Combine selected nodes with a boolean operation.
     * Creates a BooleanOp parent, moves selected nodes under it.
     * op: 0=Union, 1=Subtract, 2=Intersect, 3=Exclude
     * @param {number} op
     * @returns {boolean}
     */
    boolean_op(op) {
        const ret = wasm.figmaapp_boolean_op(this.__wbg_ptr, op);
        return ret !== 0;
    }
    /**
     * Bring selected nodes forward one step in z-order.
     * @returns {boolean}
     */
    bring_forward() {
        const ret = wasm.figmaapp_bring_forward(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Bring selected nodes to front (top of z-order within their parent).
     * @returns {boolean}
     */
    bring_to_front() {
        const ret = wasm.figmaapp_bring_to_front(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Cancel creation mode.
     */
    cancel_creating() {
        wasm.figmaapp_cancel_creating(this.__wbg_ptr);
    }
    /**
     * Clear insert parent — subsequent adds go to page root.
     */
    clear_insert_parent() {
        wasm.figmaapp_clear_insert_parent(this.__wbg_ptr);
    }
    /**
     * Get comment count.
     * @returns {number}
     */
    comment_count() {
        const ret = wasm.figmaapp_comment_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Copy selected nodes to internal clipboard.
     * @returns {number}
     */
    copy_selected() {
        const ret = wasm.figmaapp_copy_selected(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Create a component from selected nodes (wraps them like group, but NodeKind::Component).
     * Returns component node ID as [counter, client_id], or empty on failure.
     * @returns {Uint32Array}
     */
    create_component() {
        const ret = wasm.figmaapp_create_component(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Create an instance of a component. Deep-clones the component's children.
     * Returns instance node ID as [counter, client_id], or empty on failure.
     * @param {number} comp_counter
     * @param {number} comp_client_id
     * @returns {Uint32Array}
     */
    create_instance(comp_counter, comp_client_id) {
        const ret = wasm.figmaapp_create_instance(this.__wbg_ptr, comp_counter, comp_client_id);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Get current page index.
     * @returns {number}
     */
    current_page_index() {
        const ret = wasm.figmaapp_current_page_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Delete a comment by ID.
     * @param {number} comment_id
     * @returns {boolean}
     */
    delete_comment(comment_id) {
        const ret = wasm.figmaapp_delete_comment(this.__wbg_ptr, comment_id);
        return ret !== 0;
    }
    /**
     * Delete all selected nodes.
     * @returns {boolean}
     */
    delete_selected() {
        const ret = wasm.figmaapp_delete_selected(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Detach an instance: convert it to a plain Frame, keeping its children.
     * Returns true on success.
     * @returns {boolean}
     */
    detach_instance() {
        const ret = wasm.figmaapp_detach_instance(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Distribute selected nodes evenly. direction: 0=horizontal, 1=vertical
     * @param {number} direction
     * @returns {boolean}
     */
    distribute_selected(direction) {
        const ret = wasm.figmaapp_distribute_selected(this.__wbg_ptr, direction);
        return ret !== 0;
    }
    /**
     * Number of items drawn in last render frame (for diagnostics).
     * @returns {number}
     */
    drawn_count() {
        const ret = wasm.figmaapp_drawn_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Duplicate selected nodes in-place (copy + paste in one step).
     * @returns {number}
     */
    duplicate_selected() {
        const ret = wasm.figmaapp_duplicate_selected(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Exit the currently entered group. Selects the group itself.
     */
    exit_group() {
        wasm.figmaapp_exit_group(this.__wbg_ptr);
    }
    /**
     * Export the entire document as JSON for persistence.
     * @returns {string}
     */
    export_document_json() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_export_document_json(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Export the canvas at 1:1 scale without selection overlay.
     * Returns raw RGBA pixel data. JS converts to PNG via canvas.
     * @param {number} width
     * @param {number} height
     * @returns {Uint8Array}
     */
    export_pixels(width, height) {
        const ret = wasm.figmaapp_export_pixels(this.__wbg_ptr, width, height);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Export the current page as SVG string.
     * @param {number} width
     * @param {number} height
     * @returns {string}
     */
    export_svg(width, height) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_export_svg(this.__wbg_ptr, width, height);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Find nodes by name substring. Returns JSON array of {counter, client_id, name, info}.
     * @param {string} query
     * @returns {string}
     */
    find_nodes_by_name(query) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(query, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.figmaapp_find_nodes_by_name(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Find nodes that use a specific image key. Returns JSON array of {counter, client_id, name}.
     * @param {string} image_key
     * @returns {string}
     */
    find_nodes_with_image(image_key) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(image_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.figmaapp_find_nodes_with_image(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Flatten selected node to a vector path (Cmd+E).
     * Converts rectangles, ellipses, polygons, etc. to their path representation.
     * Returns true on success.
     * @returns {boolean}
     */
    flatten_selected() {
        const ret = wasm.figmaapp_flatten_selected(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get all image assets on the current page.
     * Returns JSON array: [{type:"node"|"fill", key:string, name:string, counter:u64, client_id:u32}]
     * "node" = NodeKind::Image (raw pixels), "fill" = Paint::Image (referenced by path).
     * @returns {string}
     */
    get_all_image_keys() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_all_image_keys(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get current camera state as [cam_x, cam_y, zoom].
     * @returns {Float32Array}
     */
    get_camera() {
        const ret = wasm.figmaapp_get_camera(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Get all comments as JSON array.
     * @returns {string}
     */
    get_comments() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_comments(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get creation preview rectangle [x, y, w, h] in world coords during drag.
     * Returns empty vec if not currently dragging a creation.
     * @returns {Float32Array}
     */
    get_creation_preview() {
        const ret = wasm.figmaapp_get_creation_preview(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Returns the entered group's counter and client_id, or (-1, -1) if none.
     * @returns {BigInt64Array}
     */
    get_entered_group() {
        const ret = wasm.figmaapp_get_entered_group(this.__wbg_ptr);
        var v1 = getArrayI64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * Get image bytes extracted from a .fig ZIP by path.
     * Returns the raw PNG/JPEG bytes, or empty vec if not found.
     * @param {string} path
     * @returns {Uint8Array}
     */
    get_imported_image(path) {
        const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_get_imported_image(this.__wbg_ptr, ptr0, len0);
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
    /**
     * Get layer list as JSON array: [{"id":[counter,client_id],"name":"..."}]
     * @returns {string}
     */
    get_layers() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_layers(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get a range of layers as JSON: [{"id":[counter,client_id],"name":"..."}]
     * `start` is 0-based index, `count` is max items to return.
     * @param {number} start
     * @param {number} count
     * @returns {string}
     */
    get_layers_range(start, count) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_layers_range(this.__wbg_ptr, start, count);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the current marquee selection rectangle in world coords, or empty if not dragging.
     * Format: [min_x, min_y, max_x, max_y]. Used by TypeScript to draw the selection overlay.
     * @returns {Float32Array}
     */
    get_marquee_rect() {
        const ret = wasm.figmaapp_get_marquee_rect(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Get children of a specific node as JSON: [{"name":"...","type":"frame","id":[counter,client_id]}]
     * Returns empty array if node has no children or doesn't exist.
     * @param {number} counter
     * @param {number} client_id
     * @returns {string}
     */
    get_node_children(counter, client_id) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_node_children(this.__wbg_ptr, counter, client_id);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get properties of the selected node as JSON.
     * Returns empty string if nothing is selected.
     * @param {number} counter
     * @param {number} client_id
     * @returns {string}
     */
    get_node_info(counter, client_id) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_node_info(this.__wbg_ptr, counter, client_id);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get a node's name by ID. Returns empty string if not found.
     * @param {number} counter
     * @param {number} client_id
     * @returns {string}
     */
    get_node_name(counter, client_id) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_node_name(this.__wbg_ptr, counter, client_id);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get a node's world-space bounding box: [x, y, width, height].
     * Accounts for all parent transforms (works at any nesting depth).
     * @param {number} counter
     * @param {number} client_id
     * @returns {Float32Array}
     */
    get_node_world_bounds(counter, client_id) {
        const ret = wasm.figmaapp_get_node_world_bounds(this.__wbg_ptr, counter, client_id);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Get pages as JSON: [{"index":0,"name":"Page 1"},...]
     * @returns {string}
     */
    get_pages() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_pages(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get pending ops as JSON and clear the queue.
     * @returns {string}
     */
    get_pending_ops() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_pending_ops(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get all prototype links as JSON array.
     * @returns {string}
     */
    get_prototype_links() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_prototype_links(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get selected node IDs. Returns flat array: [counter0, client0, counter1, client1, ...].
     * @returns {Uint32Array}
     */
    get_selected() {
        const ret = wasm.figmaapp_get_selected(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Get current snap grid size.
     * @returns {number}
     */
    get_snap_grid() {
        const ret = wasm.figmaapp_get_snap_grid(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get text-on-arc parameters for a node. Returns [radius, start_angle, letter_spacing] or empty.
     * @param {number} counter
     * @param {number} client_id
     * @returns {Float32Array}
     */
    get_text_arc(counter, client_id) {
        const ret = wasm.figmaapp_get_text_arc(this.__wbg_ptr, counter, client_id);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Get layer tree as flat DFS list with depth info.
     * `expanded_ids` is comma-separated "counter:client" pairs for expanded nodes.
     * Returns JSON: [{"id":[c,cl],"name":"...","depth":N,"hasChildren":bool,"kind":"frame"|...}]
     * Only descends into expanded nodes. Supports virtualized rendering.
     * @param {string} expanded_ids
     * @param {number} start
     * @param {number} count
     * @returns {Uint32Array}
     */
    get_tree_layers(expanded_ids, start, count) {
        const ptr0 = passStringToWasm0(expanded_ids, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_get_tree_layers(this.__wbg_ptr, ptr0, len0, start, count);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * Get vector network data for a vector node as JSON.
     * Returns vertices + segments representation (graph-based, not sequential paths).
     * This is the Figma vector network format: vertices share positions,
     * segments connect pairs of vertices with bezier tangent handles.
     * @param {number} counter
     * @param {number} client_id
     * @returns {string}
     */
    get_vector_network(counter, client_id) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_vector_network(this.__wbg_ptr, counter, client_id);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get image fills visible in the current viewport as JSON.
     * Returns: [[path, screenX, screenY, screenW, screenH, opacity], ...]
     * JS uses this to overlay HTMLImageElements after WASM renders the scene.
     * @param {number} width
     * @param {number} height
     * @returns {string}
     */
    get_visible_image_fills(width, height) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_get_visible_image_fills(this.__wbg_ptr, width, height);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Group selected nodes into a Frame.
     * @returns {boolean}
     */
    group_selected() {
        const ret = wasm.figmaapp_group_selected(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Handle explicit double-click from browser dblclick event.
     * Enters group or vector editing mode for the node under cursor.
     * This avoids timing-based double-click detection which can fail
     * when the browser event loop adds latency between mousedown events.
     * @param {number} sx
     * @param {number} sy
     * @returns {boolean}
     */
    handle_double_click(sx, sy) {
        const ret = wasm.figmaapp_handle_double_click(this.__wbg_ptr, sx, sy);
        return ret !== 0;
    }
    /**
     * Import a document from JSON snapshot, replacing the current document.
     * Returns status JSON: {"ok":true,"pages":N,"nodes":N} or {"ok":false,"error":"..."}
     * @param {string} json
     * @returns {string}
     */
    import_document_json(json) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.figmaapp_import_document_json(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Import a .fig binary directly. No external tools needed.
     * Returns JSON: {"pages":N,"nodes":N,"images":[path,...],"errors":[...]}
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    import_fig_binary(bytes) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.figmaapp_import_fig_binary(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Import a .fig file's JSON (from fig2json) into the document.
     * Returns JSON: {"pages": N, "nodes": N, "errors": [...]}
     * @param {string} json_str
     * @param {string} image_base
     * @returns {string}
     */
    import_fig_json(json_str, image_base) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(json_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(image_base, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.figmaapp_import_fig_json(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            deferred3_0 = ret[0];
            deferred3_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Import a single page from fig JSON (for large files).
     * JS should parse the full JSON, extract each page object, and stringify it individually.
     * @param {string} page_json
     * @param {string} image_base
     * @returns {string}
     */
    import_fig_page_json(page_json, image_base) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(page_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(image_base, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.figmaapp_import_fig_page_json(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            deferred3_0 = ret[0];
            deferred3_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Whether we're in creation mode (waiting for mousedown).
     * @returns {boolean}
     */
    is_creating() {
        const ret = wasm.figmaapp_is_creating(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Check if screen coords are in the rotation zone (outside resize handles).
     * @param {number} sx
     * @param {number} sy
     * @returns {boolean}
     */
    is_rotation_zone(sx, sy) {
        const ret = wasm.figmaapp_is_rotation_zone(this.__wbg_ptr, sx, sy);
        return ret !== 0;
    }
    /**
     * Whether we're in vector point editing mode.
     * @returns {boolean}
     */
    is_vector_editing() {
        const ret = wasm.figmaapp_is_vector_editing(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Total number of layers (children of root).
     * @returns {number}
     */
    layer_count() {
        const ret = wasm.figmaapp_layer_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Handle mouse down. Coordinates are SCREEN space.
     * shift=true adds/removes from selection instead of replacing.
     * Returns true if something was selected.
     * @param {number} sx
     * @param {number} sy
     * @param {boolean} shift
     * @returns {boolean}
     */
    mouse_down(sx, sy, shift) {
        const ret = wasm.figmaapp_mouse_down(this.__wbg_ptr, sx, sy, shift);
        return ret !== 0;
    }
    /**
     * Handle mouse move (drag/resize). Coordinates are SCREEN space.
     * @param {number} sx
     * @param {number} sy
     */
    mouse_move(sx, sy) {
        wasm.figmaapp_mouse_move(this.__wbg_ptr, sx, sy);
    }
    /**
     * Handle mouse up. Emits CRDT ops for any drag/resize that happened.
     */
    mouse_up() {
        wasm.figmaapp_mouse_up(this.__wbg_ptr);
    }
    /**
     * Check if a re-render is needed.
     * @returns {boolean}
     */
    needs_render() {
        const ret = wasm.figmaapp_needs_render(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {string} name
     * @param {number} client_id
     */
    constructor(name, client_id) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_new(ptr0, len0, client_id);
        this.__wbg_ptr = ret >>> 0;
        FigmaAppFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    node_count() {
        const ret = wasm.figmaapp_node_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get number of pages.
     * @returns {number}
     */
    page_count() {
        const ret = wasm.figmaapp_page_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Stop panning.
     */
    pan_end() {
        wasm.figmaapp_pan_end(this.__wbg_ptr);
    }
    /**
     * Continue panning.
     * @param {number} screen_x
     * @param {number} screen_y
     */
    pan_move(screen_x, screen_y) {
        wasm.figmaapp_pan_move(this.__wbg_ptr, screen_x, screen_y);
    }
    /**
     * Start panning (called on middle-click down or space+click).
     * @param {number} screen_x
     * @param {number} screen_y
     */
    pan_start(screen_x, screen_y) {
        wasm.figmaapp_pan_start(this.__wbg_ptr, screen_x, screen_y);
    }
    /**
     * Paste clipboard nodes offset by (10,10). Selects the pasted nodes.
     * @returns {number}
     */
    paste() {
        const ret = wasm.figmaapp_paste(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Cancel pen tool and discard the path.
     */
    pen_cancel() {
        wasm.figmaapp_pen_cancel(this.__wbg_ptr);
    }
    /**
     * Finish pen path as closed path (click on first anchor).
     */
    pen_finish_closed() {
        wasm.figmaapp_pen_finish_closed(this.__wbg_ptr);
    }
    /**
     * Finish pen path as open path (double-click or Enter).
     */
    pen_finish_open() {
        wasm.figmaapp_pen_finish_open(this.__wbg_ptr);
    }
    /**
     * Get pen path data for overlay rendering.
     * Returns JSON: { anchors: [{x,y,hox,hoy,hix,hiy}], cursor: {x,y}, closed: false }
     * @returns {string}
     */
    pen_get_state() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_pen_get_state(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Is the pen tool currently active?
     * @returns {boolean}
     */
    pen_is_active() {
        const ret = wasm.figmaapp_pen_is_active(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Mouse down in pen mode (screen coords). Adds an anchor.
     * If clicking near the first anchor, closes the path.
     * @param {number} sx
     * @param {number} sy
     */
    pen_mouse_down(sx, sy) {
        wasm.figmaapp_pen_mouse_down(this.__wbg_ptr, sx, sy);
    }
    /**
     * Mouse drag in pen mode (screen coords). Creates curve handles.
     * @param {number} sx
     * @param {number} sy
     */
    pen_mouse_drag(sx, sy) {
        wasm.figmaapp_pen_mouse_drag(this.__wbg_ptr, sx, sy);
    }
    /**
     * Mouse move in pen mode (for preview line).
     * @param {number} sx
     * @param {number} sy
     */
    pen_mouse_move(sx, sy) {
        wasm.figmaapp_pen_mouse_move(this.__wbg_ptr, sx, sy);
    }
    /**
     * Mouse up in pen mode.
     */
    pen_mouse_up() {
        wasm.figmaapp_pen_mouse_up(this.__wbg_ptr);
    }
    /**
     * Enter pen drawing mode.
     */
    pen_start() {
        wasm.figmaapp_pen_start(this.__wbg_ptr);
    }
    /**
     * Get prototype link count.
     * @returns {number}
     */
    prototype_link_count() {
        const ret = wasm.figmaapp_prototype_link_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Redo the last undone action. Returns true if something was redone.
     * @returns {boolean}
     */
    redo() {
        const ret = wasm.figmaapp_redo(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Remove auto-layout from a frame.
     * @param {number} counter
     * @param {number} client_id
     * @returns {boolean}
     */
    remove_auto_layout(counter, client_id) {
        const ret = wasm.figmaapp_remove_auto_layout(this.__wbg_ptr, counter, client_id);
        return ret !== 0;
    }
    /**
     * Remove all strokes from a node.
     * @param {number} counter
     * @param {number} client_id
     * @returns {boolean}
     */
    remove_node_stroke(counter, client_id) {
        const ret = wasm.figmaapp_remove_node_stroke(this.__wbg_ptr, counter, client_id);
        return ret !== 0;
    }
    /**
     * Remove all prototype links from a source node.
     * @param {number} counter
     * @param {number} client_id
     * @returns {boolean}
     */
    remove_prototype_links(counter, client_id) {
        const ret = wasm.figmaapp_remove_prototype_links(this.__wbg_ptr, counter, client_id);
        return ret !== 0;
    }
    /**
     * Rename a page.
     * @param {number} index
     * @param {string} name
     * @returns {boolean}
     */
    rename_page(index, name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_rename_page(this.__wbg_ptr, index, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Raster render — returns raw RGBA pixel buffer. Used for PNG export and fallback.
     * @param {number} width
     * @param {number} height
     * @returns {Uint8Array}
     */
    render(width, height) {
        const ret = wasm.figmaapp_render(this.__wbg_ptr, width, height);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Canvas 2D vector render — draws directly to a browser canvas context.
     * GPU-accelerated, no pixel buffer transfer.
     * `dpr` is the device pixel ratio for crisp Retina rendering.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     * @param {number} dpr
     */
    render_canvas2d(ctx, width, height, dpr) {
        wasm.figmaapp_render_canvas2d(this.__wbg_ptr, ctx, width, height, dpr);
    }
    /**
     * Resolve or unresolve a comment.
     * @param {number} comment_id
     * @param {boolean} resolved
     * @returns {boolean}
     */
    resolve_comment(comment_id, resolved) {
        const ret = wasm.figmaapp_resolve_comment(this.__wbg_ptr, comment_id, resolved);
        return ret !== 0;
    }
    /**
     * Select all direct children of the current page root.
     */
    select_all() {
        wasm.figmaapp_select_all(this.__wbg_ptr);
    }
    /**
     * Select a node by ID (from layers panel click). Replaces current selection.
     * @param {number} counter
     * @param {number} client_id
     */
    select_node(counter, client_id) {
        wasm.figmaapp_select_node(this.__wbg_ptr, counter, client_id);
    }
    /**
     * Send selected nodes backward one step in z-order.
     * @returns {boolean}
     */
    send_backward() {
        const ret = wasm.figmaapp_send_backward(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Send selected nodes to back (bottom of z-order within their parent).
     * @returns {boolean}
     */
    send_to_back() {
        const ret = wasm.figmaapp_send_to_back(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Set auto-layout on a frame node.
     * direction: 0=Horizontal, 1=Vertical
     * After setting, compute_layout is called to position children.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} direction
     * @param {number} spacing
     * @param {number} pad_top
     * @param {number} pad_right
     * @param {number} pad_bottom
     * @param {number} pad_left
     * @returns {boolean}
     */
    set_auto_layout(counter, client_id, direction, spacing, pad_top, pad_right, pad_bottom, pad_left) {
        const ret = wasm.figmaapp_set_auto_layout(this.__wbg_ptr, counter, client_id, direction, spacing, pad_top, pad_right, pad_bottom, pad_left);
        return ret !== 0;
    }
    /**
     * Set camera position and zoom directly.
     * @param {number} x
     * @param {number} y
     * @param {number} zoom
     */
    set_camera(x, y, zoom) {
        wasm.figmaapp_set_camera(this.__wbg_ptr, x, y, zoom);
    }
    /**
     * Set dash pattern on a node's stroke.
     * @param {number} counter
     * @param {number} client_id
     * @param {Float32Array} dashes
     * @returns {boolean}
     */
    set_dash_pattern(counter, client_id, dashes) {
        const ptr0 = passArrayF32ToWasm0(dashes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_dash_pattern(this.__wbg_ptr, counter, client_id, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Set image fill on an existing node (replace all fills with an image fill).
     * @param {number} counter
     * @param {number} client_id
     * @param {string} path
     * @param {string} scale_mode
     * @param {number} opacity
     * @returns {boolean}
     */
    set_image_fill(counter, client_id, path, scale_mode, opacity) {
        const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(scale_mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_image_fill(this.__wbg_ptr, counter, client_id, ptr0, len0, ptr1, len1, opacity);
        return ret !== 0;
    }
    /**
     * Set parent for subsequent add_* calls (children go inside this node).
     * @param {number} counter
     * @param {number} client_id
     */
    set_insert_parent(counter, client_id) {
        wasm.figmaapp_set_insert_parent(this.__wbg_ptr, counter, client_id);
    }
    /**
     * Set letter spacing on a text node (in pixels).
     * @param {number} counter
     * @param {number} client_id
     * @param {number} spacing
     * @returns {boolean}
     */
    set_letter_spacing(counter, client_id, spacing) {
        const ret = wasm.figmaapp_set_letter_spacing(this.__wbg_ptr, counter, client_id, spacing);
        return ret !== 0;
    }
    /**
     * Set line height on a text node (in pixels, 0 = auto).
     * @param {number} counter
     * @param {number} client_id
     * @param {number} height
     * @returns {boolean}
     */
    set_line_height(counter, client_id, height) {
        const ret = wasm.figmaapp_set_line_height(this.__wbg_ptr, counter, client_id, height);
        return ret !== 0;
    }
    /**
     * Set angular (conic) gradient fill on any node. Replaces existing fills.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} center_x
     * @param {number} center_y
     * @param {number} start_angle
     * @param {Float32Array} stop_positions
     * @param {Float32Array} stop_colors
     * @returns {boolean}
     */
    set_node_angular_gradient(counter, client_id, center_x, center_y, start_angle, stop_positions, stop_colors) {
        const ptr0 = passArrayF32ToWasm0(stop_positions, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(stop_colors, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_node_angular_gradient(this.__wbg_ptr, counter, client_id, center_x, center_y, start_angle, ptr0, len0, ptr1, len1);
        return ret !== 0;
    }
    /**
     * Set blend mode on a node. mode: 0=Normal, 1=Multiply, 2=Screen, 3=Overlay,
     * 4=Darken, 5=Lighten, 6=ColorDodge, 7=ColorBurn, 8=HardLight, 9=SoftLight,
     * 10=Difference, 11=Exclusion, 12=Hue, 13=Saturation, 14=Color, 15=Luminosity.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} mode
     * @returns {boolean}
     */
    set_node_blend_mode(counter, client_id, mode) {
        const ret = wasm.figmaapp_set_node_blend_mode(this.__wbg_ptr, counter, client_id, mode);
        return ret !== 0;
    }
    /**
     * Set constraints on a node. h: 0=left, 1=right, 2=leftRight, 3=center, 4=scale
     * v: 0=top, 1=bottom, 2=topBottom, 3=center, 4=scale
     * @param {number} counter
     * @param {number} client_id
     * @param {number} h
     * @param {number} v
     * @returns {boolean}
     */
    set_node_constraints(counter, client_id, h, v) {
        const ret = wasm.figmaapp_set_node_constraints(this.__wbg_ptr, counter, client_id, h, v);
        return ret !== 0;
    }
    /**
     * Set corner radius on a rectangle or frame node.
     * If all four values are the same, uses uniform radius. Otherwise per-corner.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} tl
     * @param {number} tr
     * @param {number} br
     * @param {number} bl
     * @returns {boolean}
     */
    set_node_corner_radius(counter, client_id, tl, tr, br, bl) {
        const ret = wasm.figmaapp_set_node_corner_radius(this.__wbg_ptr, counter, client_id, tl, tr, br, bl);
        return ret !== 0;
    }
    /**
     * Set node fill color (RGBA 0-1 range).
     * For text nodes, also updates the per-run text color.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @returns {boolean}
     */
    set_node_fill(counter, client_id, r, g, b, a) {
        const ret = wasm.figmaapp_set_node_fill(this.__wbg_ptr, counter, client_id, r, g, b, a);
        return ret !== 0;
    }
    /**
     * Set all fills on a node from a JSON array. Handles solid, gradient, and image fills.
     * JSON format: [{"type":"solid","r":255,"g":0,"b":0,"a":1.0}, {"type":"linear","startX":0,...,"stops":[...]}, ...]
     * @param {number} counter
     * @param {number} client_id
     * @param {string} fills_json
     * @returns {boolean}
     */
    set_node_fills_json(counter, client_id, fills_json) {
        const ptr0 = passStringToWasm0(fills_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_node_fills_json(this.__wbg_ptr, counter, client_id, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Set font family on a text node (e.g. "Inter", "Roboto", "Poppins").
     * @param {number} counter
     * @param {number} client_id
     * @param {string} family
     * @returns {boolean}
     */
    set_node_font_family(counter, client_id, family) {
        const ptr0 = passStringToWasm0(family, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_node_font_family(this.__wbg_ptr, counter, client_id, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Set font size of a text node.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} size
     * @returns {boolean}
     */
    set_node_font_size(counter, client_id, size) {
        const ret = wasm.figmaapp_set_node_font_size(this.__wbg_ptr, counter, client_id, size);
        return ret !== 0;
    }
    /**
     * Set font weight on a text node (300=Light, 400=Regular, 500=Medium, 600=Semibold, 700=Bold).
     * @param {number} counter
     * @param {number} client_id
     * @param {number} weight
     * @returns {boolean}
     */
    set_node_font_weight(counter, client_id, weight) {
        const ret = wasm.figmaapp_set_node_font_weight(this.__wbg_ptr, counter, client_id, weight);
        return ret !== 0;
    }
    /**
     * Set linear gradient fill on any node. Replaces existing fills.
     * start/end are in 0..1 normalized coordinates (relative to node bounds).
     * @param {number} counter
     * @param {number} client_id
     * @param {number} start_x
     * @param {number} start_y
     * @param {number} end_x
     * @param {number} end_y
     * @param {Float32Array} stop_positions
     * @param {Float32Array} stop_colors
     * @returns {boolean}
     */
    set_node_linear_gradient(counter, client_id, start_x, start_y, end_x, end_y, stop_positions, stop_colors) {
        const ptr0 = passArrayF32ToWasm0(stop_positions, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(stop_colors, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_node_linear_gradient(this.__wbg_ptr, counter, client_id, start_x, start_y, end_x, end_y, ptr0, len0, ptr1, len1);
        return ret !== 0;
    }
    /**
     * Set or unset the mask flag on a node.
     * When true, the node's shape clips all subsequent siblings until the parent ends.
     * @param {number} counter
     * @param {number} client_id
     * @param {boolean} is_mask
     * @returns {boolean}
     */
    set_node_mask(counter, client_id, is_mask) {
        const ret = wasm.figmaapp_set_node_mask(this.__wbg_ptr, counter, client_id, is_mask);
        return ret !== 0;
    }
    /**
     * Set node name.
     * @param {number} counter
     * @param {number} client_id
     * @param {string} name
     * @returns {boolean}
     */
    set_node_name(counter, client_id, name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_node_name(this.__wbg_ptr, counter, client_id, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Set opacity on a node (0.0 to 1.0).
     * @param {number} counter
     * @param {number} client_id
     * @param {number} opacity
     * @returns {boolean}
     */
    set_node_opacity(counter, client_id, opacity) {
        const ret = wasm.figmaapp_set_node_opacity(this.__wbg_ptr, counter, client_id, opacity);
        return ret !== 0;
    }
    /**
     * Set node position from the properties panel.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    set_node_position(counter, client_id, x, y) {
        const ret = wasm.figmaapp_set_node_position(this.__wbg_ptr, counter, client_id, x, y);
        return ret !== 0;
    }
    /**
     * Set radial gradient fill on any node. Replaces existing fills.
     * center is in 0..1 normalized coordinates. radius is 0..1 (1.0 = full extent).
     * @param {number} counter
     * @param {number} client_id
     * @param {number} center_x
     * @param {number} center_y
     * @param {number} radius
     * @param {Float32Array} stop_positions
     * @param {Float32Array} stop_colors
     * @returns {boolean}
     */
    set_node_radial_gradient(counter, client_id, center_x, center_y, radius, stop_positions, stop_colors) {
        const ptr0 = passArrayF32ToWasm0(stop_positions, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(stop_colors, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_node_radial_gradient(this.__wbg_ptr, counter, client_id, center_x, center_y, radius, ptr0, len0, ptr1, len1);
        return ret !== 0;
    }
    /**
     * Set node rotation in degrees. Preserves scale.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} degrees
     * @returns {boolean}
     */
    set_node_rotation(counter, client_id, degrees) {
        const ret = wasm.figmaapp_set_node_rotation(this.__wbg_ptr, counter, client_id, degrees);
        return ret !== 0;
    }
    /**
     * Set node size from the properties panel.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} w
     * @param {number} h
     * @returns {boolean}
     */
    set_node_size(counter, client_id, w, h) {
        const ret = wasm.figmaapp_set_node_size(this.__wbg_ptr, counter, client_id, w, h);
        return ret !== 0;
    }
    /**
     * Set stroke on a node (color + weight). Replaces all existing strokes.
     * @param {number} counter
     * @param {number} client_id
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @param {number} weight
     * @returns {boolean}
     */
    set_node_stroke(counter, client_id, r, g, b, a, weight) {
        const ret = wasm.figmaapp_set_node_stroke(this.__wbg_ptr, counter, client_id, r, g, b, a, weight);
        return ret !== 0;
    }
    /**
     * Set the text content of a text node.
     * @param {number} counter
     * @param {number} client_id
     * @param {string} text
     * @returns {boolean}
     */
    set_node_text(counter, client_id, text) {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_node_text(this.__wbg_ptr, counter, client_id, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Set snap-to-grid size. 0 = disabled, typical values: 1, 4, 8, 16, 32.
     * @param {number} size
     */
    set_snap_grid(size) {
        wasm.figmaapp_set_snap_grid(this.__wbg_ptr, size);
    }
    /**
     * Set stroke alignment: "inside", "center", or "outside".
     * @param {number} counter
     * @param {number} client_id
     * @param {string} align
     * @returns {boolean}
     */
    set_stroke_align(counter, client_id, align) {
        const ptr0 = passStringToWasm0(align, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_stroke_align(this.__wbg_ptr, counter, client_id, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Set text horizontal alignment: "left", "center", "right".
     * @param {number} counter
     * @param {number} client_id
     * @param {string} align
     * @returns {boolean}
     */
    set_text_align(counter, client_id, align) {
        const ptr0 = passStringToWasm0(align, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_text_align(this.__wbg_ptr, counter, client_id, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Set text-on-arc parameters. radius=0 removes arc rendering.
     * start_angle is in radians (−PI/2 = top of circle, PI/2 = bottom).
     * @param {number} counter
     * @param {number} client_id
     * @param {number} radius
     * @param {number} start_angle
     * @param {number} letter_spacing
     */
    set_text_arc(counter, client_id, radius, start_angle, letter_spacing) {
        wasm.figmaapp_set_text_arc(this.__wbg_ptr, counter, client_id, radius, start_angle, letter_spacing);
    }
    /**
     * Set text decoration: "none", "underline", or "strikethrough".
     * @param {number} counter
     * @param {number} client_id
     * @param {string} decoration
     * @returns {boolean}
     */
    set_text_decoration(counter, client_id, decoration) {
        const ptr0 = passStringToWasm0(decoration, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_text_decoration(this.__wbg_ptr, counter, client_id, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Set gradient fill on text (all runs). Type: "linear" or "radial".
     * For linear: extra = [start_x, start_y, end_x, end_y]. For radial: extra = [center_x, center_y, radius].
     * @param {number} counter
     * @param {number} client_id
     * @param {string} gradient_type
     * @param {Float32Array} extra
     * @param {Float32Array} stop_positions
     * @param {Float32Array} stop_colors
     * @returns {boolean}
     */
    set_text_gradient_fill(counter, client_id, gradient_type, extra, stop_positions, stop_colors) {
        const ptr0 = passStringToWasm0(gradient_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(extra, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF32ToWasm0(stop_positions, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArrayF32ToWasm0(stop_colors, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_text_gradient_fill(this.__wbg_ptr, counter, client_id, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        return ret !== 0;
    }
    /**
     * Set text vertical alignment: "top", "center", or "bottom".
     * @param {number} counter
     * @param {number} client_id
     * @param {string} align
     * @returns {boolean}
     */
    set_text_vertical_align(counter, client_id, align) {
        const ptr0 = passStringToWasm0(align, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.figmaapp_set_text_vertical_align(this.__wbg_ptr, counter, client_id, ptr0, len0);
        return ret !== 0;
    }
    /**
     * @param {number} width
     * @param {number} height
     */
    set_viewport(width, height) {
        wasm.figmaapp_set_viewport(this.__wbg_ptr, width, height);
    }
    /**
     * Start shape creation mode. Next mousedown+drag will create the shape.
     * shape_type: "rect", "ellipse", "frame", "star", "text"
     * @param {string} shape_type
     */
    start_creating(shape_type) {
        const ptr0 = passStringToWasm0(shape_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.figmaapp_start_creating(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Switch to a different page by index.
     * @param {number} index
     * @returns {boolean}
     */
    switch_page(index) {
        const ret = wasm.figmaapp_switch_page(this.__wbg_ptr, index);
        return ret !== 0;
    }
    /**
     * Toggle a node in/out of the selection (shift-click in layers panel).
     * @param {number} counter
     * @param {number} client_id
     */
    toggle_select_node(counter, client_id) {
        wasm.figmaapp_toggle_select_node(this.__wbg_ptr, counter, client_id);
    }
    /**
     * @returns {number}
     */
    total_node_count() {
        const ret = wasm.figmaapp_total_node_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Undo the last action. Returns true if something was undone.
     * @returns {boolean}
     */
    undo() {
        const ret = wasm.figmaapp_undo(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Ungroup: move children of selected group to its parent, remove the group.
     * @returns {boolean}
     */
    ungroup_selected() {
        const ret = wasm.figmaapp_ungroup_selected(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Exit vector editing mode (from JS, e.g. Escape key).
     */
    vector_edit_exit() {
        wasm.figmaapp_vector_edit_exit(this.__wbg_ptr);
    }
    /**
     * Get vector edit state as JSON for overlay rendering.
     * Returns: {"anchors":[{x,y,hox,hoy,hix,hiy}],"selected":N,"closed":bool,"tx":F,"ty":F}
     * @returns {string}
     */
    vector_edit_get_state() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.figmaapp_vector_edit_get_state(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Zoom centered on a screen point. delta > 0 zooms in, < 0 zooms out.
     * @param {number} delta
     * @param {number} screen_x
     * @param {number} screen_y
     */
    zoom(delta, screen_x, screen_y) {
        wasm.figmaapp_zoom(this.__wbg_ptr, delta, screen_x, screen_y);
    }
    /**
     * Zoom to fit all content on the current page.
     * @returns {boolean}
     */
    zoom_to_fit() {
        const ret = wasm.figmaapp_zoom_to_fit(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) FigmaApp.prototype[Symbol.dispose] = FigmaApp.prototype.free;

export class FigmaBench {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FigmaBenchFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_figmabench_free(ptr, 0);
    }
    /**
     * Return a zero-copy Float32Array view into WASM linear memory.
     * SAFETY: The view is invalidated if WASM memory grows (e.g. new allocations).
     * Caller must use it immediately within the same JS turn.
     * @returns {Float32Array}
     */
    data_view() {
        const ret = wasm.figmabench_data_view(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} count
     * @param {number} width
     * @param {number} height
     */
    constructor(count, width, height) {
        const ret = wasm.figmabench_new(count, width, height);
        this.__wbg_ptr = ret >>> 0;
        FigmaBenchFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    rect_count() {
        const ret = wasm.figmabench_rect_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Update all positions in WASM. Tight loop, no JS calls, no GC.
     */
    update() {
        wasm.figmabench_update(this.__wbg_ptr);
    }
}
if (Symbol.dispose) FigmaBench.prototype[Symbol.dispose] = FigmaBench.prototype.free;

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_is_undefined_4a711ea9d2e1ef93: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_throw_df03e93053e0f4bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_addColorStop_abf759328b865517: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.addColorStop(arg1, getStringFromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_apply_a87a4a7e4cedccd4: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.apply(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_beginPath_d8467bd6787c3918: function(arg0) {
            arg0.beginPath();
        },
        __wbg_bezierCurveTo_fe77a9ee00434195: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.bezierCurveTo(arg1, arg2, arg3, arg4, arg5, arg6);
        },
        __wbg_clearRect_0ed862e87163bb0b: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.clearRect(arg1, arg2, arg3, arg4);
        },
        __wbg_clip_fa80a1ad0a83ae55: function(arg0) {
            arg0.clip();
        },
        __wbg_clip_faea63f5ffce00a8: function(arg0, arg1) {
            arg0.clip(__wbindgen_enum_CanvasWindingRule[arg1]);
        },
        __wbg_closePath_7f47338589541fe8: function(arg0) {
            arg0.closePath();
        },
        __wbg_createElement_d42cc1dfefad50dc: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.createElement(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_createLinearGradient_ff710f88ed7fa696: function(arg0, arg1, arg2, arg3, arg4) {
            const ret = arg0.createLinearGradient(arg1, arg2, arg3, arg4);
            return ret;
        },
        __wbg_createRadialGradient_2d781c9d5ab3852c: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            const ret = arg0.createRadialGradient(arg1, arg2, arg3, arg4, arg5, arg6);
            return ret;
        }, arguments); },
        __wbg_document_6359a1a8cf0c0ccc: function(arg0) {
            const ret = arg0.document;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_drawImage_c96652b01f2d6d10: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.drawImage(arg1, arg2, arg3, arg4, arg5);
        }, arguments); },
        __wbg_ellipse_145d125129ce961b: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            arg0.ellipse(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        }, arguments); },
        __wbg_fillRect_42dc04b231eb4973: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.fillRect(arg1, arg2, arg3, arg4);
        },
        __wbg_fillText_4af4ca42b56bb1c4: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.fillText(getStringFromWasm0(arg1, arg2), arg3, arg4);
        }, arguments); },
        __wbg_fill_7475633c307ba496: function(arg0) {
            arg0.fill();
        },
        __wbg_fill_d72410c566b82eda: function(arg0, arg1) {
            arg0.fill(__wbindgen_enum_CanvasWindingRule[arg1]);
        },
        __wbg_getContext_3be9714e8c10edf9: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_get_d0e1306db90b68d9: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_instanceof_CanvasRenderingContext2d_69d767b4c5e9e82e: function(arg0) {
            let result;
            try {
                result = arg0 instanceof CanvasRenderingContext2D;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_HtmlCanvasElement_6745c30e85c23ab2: function(arg0) {
            let result;
            try {
                result = arg0 instanceof HTMLCanvasElement;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Window_0cc62e4f32542cc4: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_lineTo_7a7f80179348e0ad: function(arg0, arg1, arg2) {
            arg0.lineTo(arg1, arg2);
        },
        __wbg_measureText_b530757b6e56d914: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.measureText(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_moveTo_bea3a416f4bdd0d7: function(arg0, arg1, arg2) {
            arg0.moveTo(arg1, arg2);
        },
        __wbg_new_66075f8c2ea6575e: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_with_length_dcbae6a2d9e5ad30: function(arg0) {
            const ret = new Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_u8_clamped_array_and_sh_d404c83358b4f8a7: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = new ImageData(getClampedArrayU8FromWasm0(arg0, arg1), arg2 >>> 0, arg3 >>> 0);
            return ret;
        }, arguments); },
        __wbg_now_81a04fc60f4b9917: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_push_960865cda81df836: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_putImageData_93c24c88613e11ba: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.putImageData(arg1, arg2, arg3);
        }, arguments); },
        __wbg_quadraticCurveTo_5daf7409ae30f1eb: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.quadraticCurveTo(arg1, arg2, arg3, arg4);
        },
        __wbg_rect_df309f70c984b669: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.rect(arg1, arg2, arg3, arg4);
        },
        __wbg_restore_263aaa4baf4a26db: function(arg0) {
            arg0.restore();
        },
        __wbg_rotate_4fd37526ba6f85fc: function() { return handleError(function (arg0, arg1) {
            arg0.rotate(arg1);
        }, arguments); },
        __wbg_save_e95755e3808c0780: function(arg0) {
            arg0.save();
        },
        __wbg_setLineDash_97410463aeb1bc50: function() { return handleError(function (arg0, arg1) {
            arg0.setLineDash(arg1);
        }, arguments); },
        __wbg_setTransform_fcd23162493ccdd7: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.setTransform(arg1, arg2, arg3, arg4, arg5, arg6);
        }, arguments); },
        __wbg_set_7bf9e2df46e7632c: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_8326741805409e83: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_fillStyle_0cd31d96091dfd1e: function(arg0, arg1) {
            arg0.fillStyle = arg1;
        },
        __wbg_set_fillStyle_775a6deb19d03394: function(arg0, arg1, arg2) {
            arg0.fillStyle = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_fillStyle_a9efb3ec424ec922: function(arg0, arg1) {
            arg0.fillStyle = arg1;
        },
        __wbg_set_font_1ea300c83eaa282e: function(arg0, arg1, arg2) {
            arg0.font = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_globalAlpha_b772a677c8b80c69: function(arg0, arg1) {
            arg0.globalAlpha = arg1;
        },
        __wbg_set_globalCompositeOperation_c29edb1b7d350cd9: function() { return handleError(function (arg0, arg1, arg2) {
            arg0.globalCompositeOperation = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_height_7dd5e784e99d750f: function(arg0, arg1) {
            arg0.height = arg1 >>> 0;
        },
        __wbg_set_lineCap_c7fc78e7a6984681: function(arg0, arg1, arg2) {
            arg0.lineCap = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_lineJoin_210ddc20e0eb3e13: function(arg0, arg1, arg2) {
            arg0.lineJoin = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_lineWidth_01bbd4e3e45c2cd3: function(arg0, arg1) {
            arg0.lineWidth = arg1;
        },
        __wbg_set_shadowBlur_d916f81fe4bf91a7: function(arg0, arg1) {
            arg0.shadowBlur = arg1;
        },
        __wbg_set_shadowColor_4dead2bf50396457: function(arg0, arg1, arg2) {
            arg0.shadowColor = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_shadowOffsetX_d26db50e8c2f1328: function(arg0, arg1) {
            arg0.shadowOffsetX = arg1;
        },
        __wbg_set_shadowOffsetY_bac360480f9ed5a1: function(arg0, arg1) {
            arg0.shadowOffsetY = arg1;
        },
        __wbg_set_strokeStyle_54968f3be3e6e4bc: function(arg0, arg1, arg2) {
            arg0.strokeStyle = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_strokeStyle_e3b3b03ff8807803: function(arg0, arg1) {
            arg0.strokeStyle = arg1;
        },
        __wbg_set_textAlign_c386ce7e7bb57e0a: function(arg0, arg1, arg2) {
            arg0.textAlign = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_textBaseline_e5fda01062baa2e9: function(arg0, arg1, arg2) {
            arg0.textBaseline = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_width_de6a14a7fd9b3fdf: function(arg0, arg1) {
            arg0.width = arg1 >>> 0;
        },
        __wbg_static_accessor_GLOBAL_THIS_6614f2f4998e3c4c: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_d8e8a2fefe80bc1d: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_e29eaf7c465526b1: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_66e7ca3eef30585a: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_strokeRect_51eefe6ff9cb3c2d: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.strokeRect(arg1, arg2, arg3, arg4);
        },
        __wbg_stroke_47773dc273da9866: function(arg0) {
            arg0.stroke();
        },
        __wbg_translate_f702312781dae660: function() { return handleError(function (arg0, arg1, arg2) {
            arg0.translate(arg1, arg2);
        }, arguments); },
        __wbg_width_b3201d2c2fe1bb6d: function(arg0) {
            const ret = arg0.width;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(F32)) -> NamedExternref("Float32Array")`.
            const ret = getArrayF32FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./figma_wasm_bg.js": import0,
    };
}

const __wbindgen_enum_CanvasWindingRule = ["nonzero", "evenodd"];
const FigmaAppFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_figmaapp_free(ptr >>> 0, 1));
const FigmaBenchFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_figmabench_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayI64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getBigInt64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedBigInt64ArrayMemory0 = null;
function getBigInt64ArrayMemory0() {
    if (cachedBigInt64ArrayMemory0 === null || cachedBigInt64ArrayMemory0.byteLength === 0) {
        cachedBigInt64ArrayMemory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64ArrayMemory0;
}

function getClampedArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ClampedArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedUint8ClampedArrayMemory0 = null;
function getUint8ClampedArrayMemory0() {
    if (cachedUint8ClampedArrayMemory0 === null || cachedUint8ClampedArrayMemory0.byteLength === 0) {
        cachedUint8ClampedArrayMemory0 = new Uint8ClampedArray(wasm.memory.buffer);
    }
    return cachedUint8ClampedArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedBigInt64ArrayMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    cachedUint8ClampedArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('figma_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
