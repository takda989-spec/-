-- Migration 127: Endpoint Blocks
-- Purpose: Store blocked endpoints for access control

CREATE TABLE IF NOT EXISTS endpoint_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_endpoint_blocks_endpoint ON endpoint_blocks(endpoint);
