//! Figma Clone Server — Axum-based, serves static files + WebSocket sync.
//!
//! Architecture:
//! - Serves the frontend (static files from /app directory)
//! - Serves WASM artifacts from /pkg
//! - WebSocket endpoint for CRDT operation relay
//!
//! The server is a RELAY — it stores and broadcasts raw JSON ops
//! without interpreting their structure. The CRDT logic lives
//! entirely in the client (WASM).

use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    extract::State,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tower_http::services::ServeDir;

/// Shared application state.
struct AppState {
    /// Active documents with their raw operation history
    documents: RwLock<HashMap<String, Vec<serde_json::Value>>>,
    /// Broadcast channel for real-time sync
    tx: broadcast::Sender<SyncMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SyncMessage {
    doc_id: String,
    ops: Vec<serde_json::Value>,
}

#[derive(Serialize)]
struct DocInfo {
    id: String,
    op_count: usize,
}

#[tokio::main]
async fn main() {
    let (tx, _) = broadcast::channel::<SyncMessage>(256);

    let state = Arc::new(AppState {
        documents: RwLock::new(HashMap::new()),
        tx,
    });

    let app = Router::new()
        .route("/api/docs", get(list_docs))
        .route("/api/ws/{doc_id}", get(ws_handler))
        // Serve WASM artifacts
        .nest_service("/pkg", ServeDir::new("pkg"))
        // Serve frontend (fallback to index.html for SPA routing)
        .fallback_service(ServeDir::new("app").fallback(ServeDir::new("app")))
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".into());
    let addr = format!("0.0.0.0:{port}");
    println!("Server: http://localhost:{port}");

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// List all documents.
async fn list_docs(State(state): State<Arc<AppState>>) -> Json<Vec<DocInfo>> {
    let docs = state.documents.read().await;
    let list: Vec<DocInfo> = docs
        .iter()
        .map(|(id, ops)| DocInfo {
            id: id.clone(),
            op_count: ops.len(),
        })
        .collect();
    Json(list)
}

/// WebSocket handler for real-time sync.
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
    axum::extract::Path(doc_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, state, doc_id))
}

async fn handle_ws(mut socket: WebSocket, state: Arc<AppState>, doc_id: String) {
    // Send existing operations first (initial sync)
    {
        let docs = state.documents.read().await;
        if let Some(ops) = docs.get(&doc_id) {
            if !ops.is_empty() {
                let msg = SyncMessage {
                    doc_id: doc_id.clone(),
                    ops: ops.clone(),
                };
                let _ = socket
                    .send(Message::Text(serde_json::to_string(&msg).unwrap().into()))
                    .await;
            }
        }
    }

    // Subscribe to broadcast
    let mut rx = state.tx.subscribe();

    loop {
        tokio::select! {
            // Receive ops from client
            Some(Ok(msg)) = socket.recv() => {
                if let Message::Text(text) = msg {
                    if let Ok(ops) = serde_json::from_str::<Vec<serde_json::Value>>(&text) {
                        // Store
                        {
                            let mut docs = state.documents.write().await;
                            let doc_ops = docs.entry(doc_id.clone()).or_default();
                            doc_ops.extend(ops.clone());
                        }
                        // Broadcast to all subscribers
                        let _ = state.tx.send(SyncMessage {
                            doc_id: doc_id.clone(),
                            ops,
                        });
                    }
                }
            }
            // Forward broadcast to this client
            Ok(sync_msg) = rx.recv() => {
                if sync_msg.doc_id == doc_id {
                    let json = serde_json::to_string(&sync_msg).unwrap();
                    if socket.send(Message::Text(json.into())).await.is_err() {
                        break;
                    }
                }
            }
            else => break,
        }
    }
}
