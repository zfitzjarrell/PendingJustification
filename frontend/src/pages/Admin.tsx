import React, { useEffect, useMemo, useRef, useState } from "react";

type LogRow = {
  id: number;
  ts: string;
  ip: string;
  source: string;
  method: string;
  path: string;
  status: number;
  latency_ms: number;
  cache: string;
  user_agent: string;
};

type LogsResponse = {
  ok: boolean;
  limit: number;
  offset: number;
  total: number;
  rows: LogRow[];
};

type StatsResponse = {
  ok: boolean;
  total: number;
  lastHour: number;
  lastDay: number;
  bySource: Array<{ source: string; v: number }>;
};

type SingleResult = {
  ok: boolean;
  status: number;
  latencyMs: number;
  bodyText: string;
  json?: any;
  headers: {
    xPjCache?: string | null;
    cfCacheStatus?: string | null;
    retryAfter?: string | null;
  };
  error?: string;
};

type LoadRow = {
  id: string;
  ts: string;
  status?: number;
  latencyMs?: number;
  xPjCache?: string | null;
  cfCacheStatus?: string | null;
  retryAfter?: string | null;
  error?: string;
};

const clampInt = (v: any, def: number, min: number, max: number) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
};

const clampFloat = (v: any, def: number, min: number, max: number) => {
  const n = Number.parseFloat(String(v ?? ""));
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
};

const nowIso = () => new Date().toISOString();

const fmtMs = (n?: number) => (typeof n === "number" ? `${n} ms` : "-");

export default function Admin() {
  // -------------------------
  // UI Test (single request)
  // -------------------------
  const [topic, setTopic] = useState("budget");
  const [tone, setTone] = useState("snarky");
  const [intensity, setIntensity] = useState(3);

  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<SingleResult | null>(null);

  // -------------------------
  // UI Load Test
  // -------------------------
  const [durationSec, setDurationSec] = useState(20);
  const [targetRps, setTargetRps] = useState(2);
  const [concurrency, setConcurrency] = useState(1);
  const [cacheFriendly, setCacheFriendly] = useState(true);

  const [loadState, setLoadState] = useState<"idle" | "running" | "stopping" | "done">("idle");
  const [loadRows, setLoadRows] = useState<LoadRow[]>([]);
  const [loadTotals, setLoadTotals] = useState({
    total: 0,
    ok200: 0,
    errors: 0,
    hit: 0,
    miss: 0,
    avg: 0,
    p95: 0,
  });

  const loadAbortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(0);
  const latenciesRef = useRef<number[]>([]);

  // -------------------------
  // Logs (D1 via Worker)
  // -------------------------
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);

  const [logLimit, setLogLimit] = useState(100);
  const [logOffset, setLogOffset] = useState(0);

  const [filterSource, setFilterSource] = useState("");
  const [filterPath, setFilterPath] = useState("");
  const [filterIp, setFilterIp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const endpoint = "/proxy/routes/jaas";

  const buildQuery = (opts?: { forceMiss?: boolean }) => {
    const sp = new URLSearchParams();
    sp.set("topic", topic.trim() || "budget");
    sp.set("tone", tone.trim() || "snarky");
    sp.set("intensity", String(clampInt(intensity, 3, 1, 5)));

    // Force cache miss by adding a nonce (or changing values) when not cache-friendly
    if (opts?.forceMiss) {
      sp.set("_", `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    }

    return sp.toString();
  };

  const parseHeaders = (resp: Response) => ({
    xPjCache: resp.headers.get("x-pj-cache"),
    cfCacheStatus: resp.headers.get("cf-cache-status") || resp.headers.get("Cache-Status"),
    retryAfter: resp.headers.get("retry-after"),
  });

  const safeJson = async (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  };

  const sendSingle = async () => {
    setSingleLoading(true);
    setSingleResult(null);

    const started = performance.now();
    try {
      const qs = buildQuery({ forceMiss: false });
      const resp = await fetch(`${endpoint}?${qs}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-PJ-Source": "ui-admin",
        },
        credentials: "omit",
      });
      const latencyMs = Math.round(performance.now() - started);
      const bodyText = await resp.text();
      const json = await safeJson(bodyText);

      setSingleResult({
        ok: resp.ok,
        status: resp.status,
        latencyMs,
        bodyText,
        json,
        headers: parseHeaders(resp),
      });
    } catch (e: any) {
      const latencyMs = Math.round(performance.now() - started);
      setSingleResult({
        ok: false,
        status: 0,
        latencyMs,
        bodyText: "",
        headers: {},
        error: e?.message || String(e),
      });
    } finally {
      setSingleLoading(false);
    }
  };

  const resetLoad = () => {
    setLoadRows([]);
    setLoadTotals({ total: 0, ok200: 0, errors: 0, hit: 0, miss: 0, avg: 0, p95: 0 });
    latenciesRef.current = [];
    inFlightRef.current = 0;
  };

  const computeStats = (latencies: number[]) => {
    if (!latencies.length) return { avg: 0, p95: 0 };
    const sorted = [...latencies].sort((a, b) => a - b);
    const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
    const p95Index = Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95) - 1));
    const p95 = Math.round(sorted[p95Index] ?? sorted[sorted.length - 1]);
    return { avg, p95 };
  };

  const addLoadRow = (row: LoadRow) => {
    setLoadRows((prev) => {
      const next = [row, ...prev];
      return next.slice(0, 100);
    });
  };

  const bumpTotals = (update: Partial<typeof loadTotals>) => {
    setLoadTotals((prev) => {
      const next = { ...prev, ...update };
      return next;
    });
  };

  const startLoadTest = async () => {
    if (loadState === "running") return;

    resetLoad();
    setLoadState("running");

    const dur = clampInt(durationSec, 20, 1, 600);
    const rps = clampFloat(targetRps, 2, 0.1, 50);
    const conc = clampInt(concurrency, 1, 1, 50);

    setDurationSec(dur);
    setTargetRps(rps);
    setConcurrency(conc);

    const abort = new AbortController();
    loadAbortRef.current = abort;

    const endAt = Date.now() + dur * 1000;
    const intervalMs = Math.max(50, Math.round(1000 / rps)); // schedule tick based on target rps

    const tick = async () => {
      if (abort.signal.aborted) return;
      if (Date.now() >= endAt) {
        setLoadState("done");
        return;
      }

      // Respect concurrency cap
      if (inFlightRef.current >= conc) return;

      inFlightRef.current += 1;
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const started = performance.now();

      const forceMiss = !cacheFriendly;
      const qs = buildQuery({ forceMiss });
      const url = `${endpoint}?${qs}`;

      try {
        const resp = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-PJ-Source": "ui-admin-loadtest",
          },
          credentials: "omit",
          signal: abort.signal,
        });

        const latencyMs = Math.round(performance.now() - started);
        latenciesRef.current.push(latencyMs);

        const hdrs = parseHeaders(resp);
        const xpj = (hdrs.xPjCache || "").toUpperCase();
        const isHit = xpj === "HIT";
        const isMiss = xpj === "MISS";

        addLoadRow({
          id,
          ts: nowIso(),
          status: resp.status,
          latencyMs,
          xPjCache: hdrs.xPjCache,
          cfCacheStatus: hdrs.cfCacheStatus,
          retryAfter: hdrs.retryAfter,
        });

        const { avg, p95 } = computeStats(latenciesRef.current);
        bumpTotals({
          total: loadTotals.total + 1,
          ok200: loadTotals.ok200 + (resp.status === 200 ? 1 : 0),
          errors: loadTotals.errors + (resp.status >= 400 ? 1 : 0),
          hit: loadTotals.hit + (isHit ? 1 : 0),
          miss: loadTotals.miss + (isMiss ? 1 : 0),
          avg,
          p95,
        });
      } catch (e: any) {
        const latencyMs = Math.round(performance.now() - started);

        addLoadRow({
          id,
          ts: nowIso(),
          error: e?.message || String(e),
          latencyMs,
        });

        const { avg, p95 } = computeStats(latenciesRef.current);
        bumpTotals({
          total: loadTotals.total + 1,
          errors: loadTotals.errors + 1,
          avg,
          p95,
        });
      } finally {
        inFlightRef.current -= 1;
      }
    };

    // schedule ticks
    const timer = window.setInterval(tick, intervalMs);

    // hard stop at end
    window.setTimeout(() => {
      if (!abort.signal.aborted) {
        window.clearInterval(timer);
        setLoadState("done");
      }
    }, dur * 1000 + 50);
  };

  const stopLoadTest = () => {
    if (loadState !== "running") return;
    setLoadState("stopping");
    loadAbortRef.current?.abort();
    setTimeout(() => setLoadState("done"), 200);
  };

  const buildLogsUrl = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(clampInt(logLimit, 100, 1, 500)));
    sp.set("offset", String(clampInt(logOffset, 0, 0, 20000)));
    if (filterSource.trim()) sp.set("source", filterSource.trim());
    if (filterPath.trim()) sp.set("path", filterPath.trim());
    if (filterIp.trim()) sp.set("ip", filterIp.trim());
    if (filterStatus.trim()) sp.set("status", filterStatus.trim());
    return `/admin/api/logs?${sp.toString()}`;
  }, [logLimit, logOffset, filterSource, filterPath, filterIp, filterStatus]);

  const refreshLogs = async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const resp = await fetch(buildLogsUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const text = await resp.text();
      const json = await safeJson(text);

      if (!resp.ok) {
        setLogsError((json?.error as string) || `Failed to load logs (${resp.status})`);
        setLogs(null);
        return;
      }
      setLogs(json as LogsResponse);
    } catch (e: any) {
      setLogsError(e?.message || String(e));
      setLogs(null);
    } finally {
      setLogsLoading(false);
    }
  };

  const refreshStats = async () => {
    setStatsLoading(true);
    try {
      const resp = await fetch("/admin/api/stats", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const text = await resp.text();
      const json = await safeJson(text);
      if (!resp.ok) {
        setStats(null);
        return;
      }
      setStats(json as StatsResponse);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    // Load logs/stats on entry
    refreshLogs();
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = useMemo(() => {
    const total = logs?.total ?? 0;
    return total > 0 ? Math.ceil(total / logLimit) : 1;
  }, [logs?.total, logLimit]);

  const currentPage = useMemo(() => {
    return Math.floor(logOffset / logLimit) + 1;
  }, [logOffset, logLimit]);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-gray-600">
          This page is protected by Cloudflare Zero Trust Access. It contains browser-driven API testing and
          request logging views.
        </p>
      </div>

      {/* Interactive UI Test */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Interactive UI Test</h2>
          <p className="text-sm text-gray-600">
            Runs calls from the browser so you can validate real user behavior: caching, cookies, CORS, and in-flight overlap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Topic</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="budget"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tone</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="snarky"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Intensity (1-5)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={intensity}
              onChange={(e) => setIntensity(clampInt(e.target.value, 3, 1, 5))}
              type="number"
              min={1}
              max={5}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded border bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-60"
            onClick={sendSingle}
            disabled={singleLoading}
          >
            {singleLoading ? "Sending..." : "Send Single Request"}
          </button>

          <div className="text-sm text-gray-600">
            Endpoint: <span className="font-mono">{endpoint}</span>
          </div>
        </div>

        <div className="rounded border bg-gray-50 p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Last status</div>
              <div className="font-medium">{singleResult ? singleResult.status : "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">Latency</div>
              <div className="font-medium">{singleResult ? fmtMs(singleResult.latencyMs) : "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">x-pj-cache</div>
              <div className="font-medium">{singleResult?.headers?.xPjCache ?? "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">cf-cache-status</div>
              <div className="font-medium">{singleResult?.headers?.cfCacheStatus ?? "-"}</div>
            </div>
          </div>

          {singleResult?.error ? (
            <div className="mt-3 text-sm text-red-600">Error: {singleResult.error}</div>
          ) : null}

          {singleResult ? (
            <pre className="mt-3 max-h-64 overflow-auto rounded bg-white p-3 text-xs">
              {singleResult.json ? JSON.stringify(singleResult.json, null, 2) : singleResult.bodyText}
            </pre>
          ) : null}
        </div>
      </div>

      {/* UI Load Test */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">UI Load Test</h2>
            <p className="text-sm text-gray-600">
              Generates browser-driven traffic with a concurrency cap. Cache friendly keeps params stable. Unchecking forces cache misses.
            </p>
          </div>
          <div className="text-xs rounded bg-gray-100 px-2 py-1">{loadState.toUpperCase()}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Duration (sec)</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min={1}
              max={600}
              value={durationSec}
              onChange={(e) => setDurationSec(clampInt(e.target.value, 20, 1, 600))}
              disabled={loadState === "running"}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Target req/sec</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              step="0.1"
              min={0.1}
              max={50}
              value={targetRps}
              onChange={(e) => setTargetRps(clampFloat(e.target.value, 2, 0.1, 50))}
              disabled={loadState === "running"}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Concurrency</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min={1}
              max={50}
              value={concurrency}
              onChange={(e) => setConcurrency(clampInt(e.target.value, 1, 1, 50))}
              disabled={loadState === "running"}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Randomize params</label>
            <label className="flex items-center gap-2 rounded border px-3 py-2">
              <input
                type="checkbox"
                checked={cacheFriendly}
                onChange={(e) => setCacheFriendly(e.target.checked)}
                disabled={loadState === "running"}
              />
              <span className="text-sm">Cache friendly</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded border bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-60"
            onClick={startLoadTest}
            disabled={loadState === "running"}
          >
            Start
          </button>
          <button
            className="rounded border bg-gray-200 px-4 py-2 text-sm disabled:opacity-60"
            onClick={stopLoadTest}
            disabled={loadState !== "running"}
          >
            Stop
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatBox label="Total" value={loadTotals.total} />
          <StatBox label="200 OK" value={loadTotals.ok200} />
          <StatBox label="Errors" value={loadTotals.errors} />
          <StatBox label="Avg" value={loadTotals.total ? `${loadTotals.avg} ms` : "-"} />
          <StatBox label="P95" value={loadTotals.total ? `${loadTotals.p95} ms` : "-"} />
          <StatBox label="HIT/MISS" value={`${loadTotals.hit}/${loadTotals.miss}`} />
        </div>

        <div className="rounded border">
          <div className="px-3 py-2 text-sm font-medium bg-gray-50 border-b">
            Latest requests (max 100 shown)
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white sticky top-0">
                <tr className="text-left border-b">
                  <th className="p-2">#</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Latency</th>
                  <th className="p-2">x-pj-cache</th>
                  <th className="p-2">cf-cache</th>
                  <th className="p-2">Retry-After</th>
                  <th className="p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {loadRows.length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan={7}>
                      No results yet
                    </td>
                  </tr>
                ) : (
                  loadRows.map((r, idx) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-2 font-mono text-xs">{idx + 1}</td>
                      <td className="p-2">{r.status ?? "-"}</td>
                      <td className="p-2">{fmtMs(r.latencyMs)}</td>
                      <td className="p-2">{r.xPjCache ?? "-"}</td>
                      <td className="p-2">{r.cfCacheStatus ?? "-"}</td>
                      <td className="p-2">{r.retryAfter ?? "-"}</td>
                      <td className="p-2 text-red-600">{r.error ?? ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Request Logs (D1)</h2>
            <p className="text-sm text-gray-600">
              These are the logs written by the Worker. Use filters to see UI vs programmatic usage.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded border bg-gray-100 px-3 py-2 text-sm disabled:opacity-60"
              onClick={refreshStats}
              disabled={statsLoading}
            >
              {statsLoading ? "Refreshing..." : "Refresh Stats"}
            </button>
            <button
              className="rounded border bg-gray-100 px-3 py-2 text-sm disabled:opacity-60"
              onClick={refreshLogs}
              disabled={logsLoading}
            >
              {logsLoading ? "Refreshing..." : "Refresh Logs"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatBox label="Total" value={stats?.total ?? "-"} />
          <StatBox label="Last hour" value={stats?.lastHour ?? "-"} />
          <StatBox label="Last day" value={stats?.lastDay ?? "-"} />
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">Top sources (last day)</div>
            <div className="mt-2 space-y-1 text-sm">
              {(stats?.bySource ?? []).slice(0, 6).map((s) => (
                <div key={s.source} className="flex justify-between">
                  <span className="font-mono text-xs">{s.source || "unknown"}</span>
                  <span>{s.v}</span>
                </div>
              ))}
              {(stats?.bySource ?? []).length === 0 ? <div className="text-gray-500">-</div> : null}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="space-y-1 md:col-span-1">
            <label className="text-sm font-medium">Limit</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min={1}
              max={500}
              value={logLimit}
              onChange={(e) => setLogLimit(clampInt(e.target.value, 100, 1, 500))}
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-sm font-medium">Offset</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min={0}
              max={20000}
              value={logOffset}
              onChange={(e) => setLogOffset(clampInt(e.target.value, 0, 0, 20000))}
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-sm font-medium">Source</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              placeholder="ui-admin"
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-sm font-medium">Path</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={filterPath}
              onChange={(e) => setFilterPath(e.target.value)}
              placeholder="/proxy/routes/jaas"
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-sm font-medium">IP</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={filterIp}
              onChange={(e) => setFilterIp(e.target.value)}
              placeholder="1.2.3.4"
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-sm font-medium">Status</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              placeholder="200"
            />
          </div>
        </div>

        {logsError ? <div className="text-sm text-red-600">{logsError}</div> : null}

        <div className="text-sm text-gray-600">
          Showing page {currentPage} of {totalPages} (total rows: {logs?.total ?? 0})
        </div>

        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b">
                <th className="p-2">id</th>
                <th className="p-2">ts</th>
                <th className="p-2">ip</th>
                <th className="p-2">source</th>
                <th className="p-2">method</th>
                <th className="p-2">path</th>
                <th className="p-2">status</th>
                <th className="p-2">latency</th>
                <th className="p-2">cache</th>
                <th className="p-2">user_agent</th>
              </tr>
            </thead>
            <tbody>
              {(logs?.rows ?? []).length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={10}>
                    {logsLoading ? "Loading..." : "No rows returned (try Refresh Logs)."}
                  </td>
                </tr>
              ) : (
                (logs?.rows ?? []).map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2 font-mono text-xs">{r.id}</td>
                    <td className="p-2 font-mono text-xs">{r.ts}</td>
                    <td className="p-2 font-mono text-xs">{r.ip}</td>
                    <td className="p-2 font-mono text-xs">{r.source}</td>
                    <td className="p-2 font-mono text-xs">{r.method}</td>
                    <td className="p-2 font-mono text-xs">{r.path}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2">{fmtMs(r.latency_ms_
