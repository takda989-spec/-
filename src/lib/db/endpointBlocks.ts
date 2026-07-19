/**
 * Domain module for endpoint blocking
 * Manages blocked endpoints for access control
 */

import { getDbInstance } from "./core.ts";

export interface EndpointBlock {
  id: number;
  endpoint: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEndpointBlockInput {
  endpoint: string;
  description?: string;
}

/**
 * Get all blocked endpoints
 */
export function getAllEndpointBlocks(): EndpointBlock[] {
  const db = getDbInstance();
  const stmt = db.prepare("SELECT * FROM endpoint_blocks ORDER BY endpoint ASC");
  return stmt.all() as EndpointBlock[];
}

/**
 * Check if an endpoint is blocked
 */
export function isEndpointBlocked(endpoint: string): boolean {
  const db = getDbInstance();
  const stmt = db.prepare("SELECT COUNT(*) as count FROM endpoint_blocks WHERE endpoint = ?");
  const result = stmt.get(endpoint) as { count: number };
  return result.count > 0;
}

/**
 * Add a blocked endpoint
 */
export function addEndpointBlock(input: CreateEndpointBlockInput): EndpointBlock {
  const db = getDbInstance();
  const stmt = db.prepare(`
    INSERT INTO endpoint_blocks (endpoint, description)
    VALUES (?, ?)
  `);
  const info = stmt.run(input.endpoint, input.description ?? null);
  const selectStmt = db.prepare("SELECT * FROM endpoint_blocks WHERE id = ?");
  return selectStmt.get(info.lastInsertRowid) as EndpointBlock;
}

/**
 * Remove a blocked endpoint
 */
export function removeEndpointBlock(id: number): boolean {
  const db = getDbInstance();
  const stmt = db.prepare("DELETE FROM endpoint_blocks WHERE id = ?");
  const info = stmt.run(id);
  return info.changes > 0;
}

/**
 * Update a blocked endpoint
 */
export function updateEndpointBlock(
  id: number,
  input: Partial<CreateEndpointBlockInput>
): EndpointBlock | null {
  const db = getDbInstance();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.endpoint !== undefined) {
    updates.push("endpoint = ?");
    values.push(input.endpoint);
  }
  if (input.description !== undefined) {
    updates.push("description = ?");
    values.push(input.description);
  }
  updates.push("updated_at = datetime('now')");

  if (updates.length === 1) {
    return getEndpointBlockById(id);
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE endpoint_blocks SET ${updates.join(", ")} WHERE id = ?`);
  stmt.run(...values);
  return getEndpointBlockById(id);
}

/**
 * Get endpoint block by ID
 */
export function getEndpointBlockById(id: number): EndpointBlock | null {
  const db = getDbInstance();
  const stmt = db.prepare("SELECT * FROM endpoint_blocks WHERE id = ?");
  return (stmt.get(id) as EndpointBlock) ?? null;
}
