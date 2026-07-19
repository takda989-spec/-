/**
 * Model renaming — полное переименование модели.
 *
 * Логика:
 * - original_name = внутреннее имя провайдера (kr/claude-sonnet-4-5)
 * - display_name  = публичное имя (sonnet-4-5)
 *
 * Входящий запрос: display_name → original_name (для роутинга к провайдеру)
 * Исходящий ответ: original_name → display_name (везде, всегда)
 * Логи: original_name → display_name (везде, всегда)
 *
 * Старое имя (original_name) НИГДЕ не должно быть видно снаружи.
 */

import { getDbInstance } from "./core.ts";

export interface ModelRename {
  id: number;
  original_name: string;
  display_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateModelRenameInput {
  original_name: string;
  display_name: string;
  description?: string;
}

/** Кеш в памяти для горячего пути — сбрасывается при каждом изменении */
let _cache: { origToDisplay: Map<string, string>; displayToOrig: Map<string, string> } | null =
  null;

function loadCache() {
  if (_cache) return _cache;
  const db = getDbInstance();
  const rows = db.prepare("SELECT original_name, display_name FROM model_aliases").all() as {
    original_name: string;
    display_name: string;
  }[];
  const origToDisplay = new Map<string, string>();
  const displayToOrig = new Map<string, string>();
  for (const r of rows) {
    origToDisplay.set(r.original_name, r.display_name);
    displayToOrig.set(r.display_name, r.original_name);
  }
  _cache = { origToDisplay, displayToOrig };
  return _cache;
}

export function invalidateModelRenameCache() {
  _cache = null;
}

/**
 * Входящий запрос: клиент присылает display_name → возвращаем original_name для роутинга.
 * Если имя не переименовано — возвращаем как есть.
 */
export function resolveIncomingModel(name: string): string {
  const { displayToOrig } = loadCache();
  return displayToOrig.get(name) ?? name;
}

/**
 * Исходящий ответ / логи: original_name → display_name.
 * Если имя не переименовано — возвращаем как есть.
 */
export function resolveOutgoingModel(name: string): string {
  const { origToDisplay } = loadCache();
  return origToDisplay.get(name) ?? name;
}

/** Получить все переименования */
export function getAllModelAliases(): ModelRename[] {
  const db = getDbInstance();
  return db
    .prepare("SELECT * FROM model_aliases ORDER BY original_name ASC")
    .all() as ModelRename[];
}

/** Добавить переименование */
export function addModelAlias(input: CreateModelRenameInput): ModelRename {
  const db = getDbInstance();
  const info = db
    .prepare(
      "INSERT INTO model_aliases (original_name, display_name, description) VALUES (?, ?, ?)"
    )
    .run(input.original_name, input.display_name, input.description ?? null);
  invalidateModelRenameCache();
  return db
    .prepare("SELECT * FROM model_aliases WHERE id = ?")
    .get(info.lastInsertRowid) as ModelRename;
}

/** Удалить переименование */
export function removeModelAlias(id: number): boolean {
  const db = getDbInstance();
  const info = db.prepare("DELETE FROM model_aliases WHERE id = ?").run(id);
  invalidateModelRenameCache();
  return info.changes > 0;
}

/** Получить по ID */
export function getModelAliasById(id: number): ModelRename | null {
  const db = getDbInstance();
  return (db.prepare("SELECT * FROM model_aliases WHERE id = ?").get(id) as ModelRename) ?? null;
}
