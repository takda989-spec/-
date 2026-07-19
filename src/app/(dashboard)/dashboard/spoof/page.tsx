"use client";

import { useState, useEffect } from "react";
import { Button, Card, Input } from "@/shared/components";
import { useNotificationStore } from "@/store/notificationStore";
import { Trash2, Plus, Shield, ArrowRight } from "lucide-react";

interface EndpointBlock {
  id: number;
  endpoint: string;
  description: string | null;
  created_at: string;
}

interface ModelRename {
  id: number;
  original_name: string;
  display_name: string;
  description: string | null;
  created_at: string;
}

export default function SpoofPage() {
  const notify = useNotificationStore();
  const [endpointBlocks, setEndpointBlocks] = useState<EndpointBlock[]>([]);
  const [modelRenames, setModelRenames] = useState<ModelRename[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newEndpoint, setNewEndpoint] = useState("");
  const [newEndpointDesc, setNewEndpointDesc] = useState("");

  const [originalModel, setOriginalModel] = useState("");
  const [displayModel, setDisplayModel] = useState("");
  const [renameDesc, setRenameDesc] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [blocksRes, renamesRes] = await Promise.all([
        fetch("/api/spoof/endpoint-blocks"),
        fetch("/api/spoof/model-aliases"),
      ]);
      if (blocksRes.ok) {
        const d = await blocksRes.json();
        setEndpointBlocks(d.blocks || []);
      }
      if (renamesRes.ok) {
        const d = await renamesRes.json();
        setModelRenames(d.renames || []);
      }
    } catch {
      notify.error("Не удалось загрузить данные");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addEndpointBlock = async () => {
    if (!newEndpoint.trim()) {
      notify.error("Введите путь эндпоинта");
      return;
    }
    try {
      const res = await fetch("/api/spoof/endpoint-blocks/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: newEndpoint, description: newEndpointDesc || undefined }),
      });
      if (!res.ok) throw new Error();
      notify.success("Эндпоинт заблокирован");
      setNewEndpoint("");
      setNewEndpointDesc("");
      loadData();
    } catch {
      notify.error("Не удалось заблокировать эндпоинт");
    }
  };

  const removeEndpointBlock = async (id: number) => {
    try {
      const res = await fetch(`/api/spoof/endpoint-blocks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      notify.success("Блокировка удалена");
      loadData();
    } catch {
      notify.error("Не удалось удалить блокировку");
    }
  };

  const addModelRename = async () => {
    if (!originalModel.trim() || !displayModel.trim()) {
      notify.error("Заполните оба поля");
      return;
    }
    try {
      const res = await fetch("/api/spoof/model-aliases/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_name: originalModel,
          display_name: displayModel,
          description: renameDesc || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "error");
      }
      notify.success("Модель переименована");
      setOriginalModel("");
      setDisplayModel("");
      setRenameDesc("");
      loadData();
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : "Не удалось переименовать модель");
    }
  };

  const removeModelRename = async (id: number) => {
    try {
      const res = await fetch(`/api/spoof/model-aliases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      notify.success("Переименование удалено");
      loadData();
    } catch {
      notify.error("Не удалось удалить переименование");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 text-center text-text-muted">Загрузка...</div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Spoof</h1>
        <p className="text-text-muted mt-1 text-sm">
          Блокировка эндпоинтов и полное переименование моделей
        </p>
      </div>

      {/* Блокировка эндпоинтов */}
      <Card
        title="Блокировка эндпоинтов"
        subtitle="Запросы к заблокированному пути вернут 403. Например: /api/v1/models"
        icon="block"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Путь эндпоинта *"
              placeholder="/api/v1/models"
              value={newEndpoint}
              onChange={(e) => setNewEndpoint(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEndpointBlock()}
            />
            <Input
              label="Описание"
              placeholder="Причина блокировки"
              value={newEndpointDesc}
              onChange={(e) => setNewEndpointDesc(e.target.value)}
            />
          </div>
          <Button variant="primary" icon="block" onClick={addEndpointBlock}>
            Заблокировать
          </Button>

          {endpointBlocks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border mt-4">
              <p className="text-sm font-medium text-text-main pt-2">
                Заблокировано ({endpointBlocks.length}):
              </p>
              {endpointBlocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-control border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
                >
                  <div>
                    <code className="text-sm font-mono text-text-main">{b.endpoint}</code>
                    {b.description && (
                      <p className="text-xs text-text-muted mt-0.5">{b.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeEndpointBlock(b.id)}
                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="Удалить блокировку"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Переименование моделей */}
      <Card
        title="Переименование моделей"
        subtitle="Полное переименование — старое имя исчезает везде: в запросах, ответах, логах, стримах"
        icon="drive_file_rename_outline"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-control bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-text-muted">
            <span className="font-medium text-text-main">Как работает:</span> введи оригинальное
            имя провайдера и желаемое публичное имя. После сохранения клиенты используют только
            новое имя — старое нигде не появится.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Оригинальное имя *"
              placeholder="kr/claude-sonnet-4-5"
              hint="Имя у провайдера (скрытое)"
              value={originalModel}
              onChange={(e) => setOriginalModel(e.target.value)}
            />
            <Input
              label="Новое имя *"
              placeholder="sonnet-4-5"
              hint="Публичное имя (везде)"
              value={displayModel}
              onChange={(e) => setDisplayModel(e.target.value)}
            />
            <Input
              label="Описание"
              placeholder="Необязательно"
              value={renameDesc}
              onChange={(e) => setRenameDesc(e.target.value)}
            />
          </div>
          <Button variant="primary" icon="drive_file_rename_outline" onClick={addModelRename}>
            Переименовать
          </Button>

          {modelRenames.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border mt-4">
              <p className="text-sm font-medium text-text-main pt-2">
                Активные переименования ({modelRenames.length}):
              </p>
              {modelRenames.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-control border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <span className="text-text-muted line-through text-xs">{r.original_name}</span>
                      <ArrowRight className="h-3 w-3 text-text-muted flex-shrink-0" />
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {r.display_name}
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-xs text-text-muted mt-0.5">{r.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeModelRename(r.id)}
                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="Удалить переименование"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Ссылка на статистику */}
      <Card
        title="Страница статистики"
        subtitle="Публичная страница для просмотра расхода токенов по API ключу"
        icon="bar_chart"
      >
        <div className="space-y-2">
          <p className="text-sm text-text-muted">Поделитесь ссылкой с пользователем:</p>
          <code className="block p-3 bg-surface-alt rounded-control text-sm font-mono border border-border">
            {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}
            /statistic
          </code>
          <p className="text-xs text-text-muted">
            Пользователь вводит API ключ и видит свой расход. Конвертация: $1 = 200 000 токенов.
          </p>
        </div>
      </Card>
    </div>
  );
}
