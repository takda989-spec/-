-- Migration 128: Model Renames (полное переименование)
-- original_name = внутреннее имя провайдера (kr/claude-sonnet-4-5)
-- display_name  = публичное имя (sonnet-4-5)
-- Старое имя нигде не видно снаружи

CREATE TABLE IF NOT EXISTS model_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_name TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL UNIQUE,
  description   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_model_aliases_original ON model_aliases(original_name);
CREATE INDEX IF NOT EXISTS idx_model_aliases_display  ON model_aliases(display_name);
