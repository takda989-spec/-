/**
 * Public Statistics Page — /statistic
 * Shows token usage for an API key. $1 = 200,000 tokens.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input } from "@/shared/components";
import { Loader2 } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

interface UsageStats {
  totalTokens: number;
  totalInput: number;
  totalOutput: number;
  totalRequests: number;
  totalCost: number;
  apiKeyName: string;
  periodStart: string;
  periodEnd: string;
}

const TOKENS_PER_DOLLAR = 200_000;

function StatisticPageInner() {
  const notify = useNotificationStore();
  const searchParams = useSearchParams();
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    const queryKey = searchParams.get("apikey");
    if (queryKey) {
      setApiKey(queryKey);
      loadStats(queryKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async (key?: string) => {
    const keyToUse = key || apiKey;
    if (!keyToUse.trim()) {
      notify.error("Введите API ключ");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/statistic/usage?apikey=${encodeURIComponent(keyToUse)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message || "Ошибка");
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Не удалось загрузить статистику");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Login form ──────────────────────────────────────────────────────────────
  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <Card
          title="Статистика использования"
          subtitle="Введите API ключ для просмотра"
          className="w-full max-w-sm"
        >
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadStats()}
            />
            <Button variant="primary" onClick={() => loadStats()} disabled={isLoading} fullWidth>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                "Показать"
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Stats view ──────────────────────────────────────────────────────────────
  const periodLabel = new Date(stats.periodStart).toLocaleString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-main">Использование токенов</h1>
            <p className="text-xs text-text-muted mt-0.5">{periodLabel} · {stats.apiKeyName}</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => { setStats(null); setApiKey(""); }}
          >
            Выйти
          </Button>
        </div>

        {/* Main token counter */}
        <Card padding="md">
          <p className="text-sm text-text-muted mb-1">Потрачено токенов</p>
          <p className="text-4xl font-bold text-text-main tabular-nums">
            {stats.totalTokens.toLocaleString("ru-RU")}
          </p>
          <p className="text-xs text-text-muted mt-2">
            ≈ ${(stats.totalTokens / TOKENS_PER_DOLLAR).toFixed(4)} USD
          </p>
        </Card>

      </div>
    </div>
  );
}

function CalcWidget() {
  const [dollars, setDollars] = useState("");
  const [tokens, setTokens] = useState("");

  const onDollarsChange = (v: string) => {
    setDollars(v);
    const n = parseFloat(v);
    setTokens(isNaN(n) ? "" : Math.round(n * TOKENS_PER_DOLLAR).toLocaleString("ru-RU"));
  };

  const onTokensChange = (v: string) => {
    // strip spaces/commas from formatted value
    const raw = v.replace(/[\s,]/g, "");
    setTokens(v);
    const n = parseInt(raw, 10);
    setDollars(isNaN(n) ? "" : (n / TOKENS_PER_DOLLAR).toFixed(4));
  };

  return (
    <div className="space-y-2">
      <Input
        label="Доллары ($)"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={dollars}
        onChange={(e) => onDollarsChange(e.target.value)}
      />
      <Input
        label="Токены"
        type="text"
        placeholder="0"
        value={tokens}
        onChange={(e) => onTokensChange(e.target.value)}
      />
    </div>
  );
}

export default function StatisticPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
        </div>
      }
    >
      <StatisticPageInner />
    </Suspense>
  );
}
