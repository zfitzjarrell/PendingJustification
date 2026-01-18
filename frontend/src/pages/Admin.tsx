// frontend/src/pages/Admin.tsx
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
  bySource: { source: string; v: number }[];
};

type RunRow = {
  id: number;
  t: string;
  status: number | null;
  latencyMs: number | null;
  xPjCache?: string;
  cfCacheStatus?: string;
  retryAfter?: string;
  error?: string;
};

const API_PATH = "/proxy/routes/jaas";
const LOGS_API = "/admin/api/logs";
const STATS_API = "/admin/api/stats";

function clampInt(v: any, def: number, min: number, max: number) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString();
}

function fmtMs(n: number | null | undefined) {
  if (n === null || n === undefined) return "-";
  if (!Number.isFinite(n)) return "-";
  return `${Math.round(n)} ms`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init);
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`${resp.status} ${resp.statusText}${txt ? ` - ${txt}` : ""}`);
  }
  return (await resp.json()) as T;
}

export default function Admin() {
  // --- Single request inputs
  const [topic, setTopic] = useState("budget");
  const [tone, setTone] = useState("snarky");
  const [intensity, setIntensity] = useState<number>(3);

  // --- Single request results
  const [lastStatus, setLastStatus] = useState<number | null>(null);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [lastXPjCache, setLastXPjCache] = useState<string>("-");
  const [lastCfCache, setLastCfCache] = useState<string>("-");
  const [lastRetryAfter, setLastRetryAfter] = useState<string>("-");
  const [lastBody, setLastBody] = useState<string>("");

  // --- Load test controls
  const [durationSec, setDurationSec] = useState<number>(20);
  const [targetRps, setTargetRps] = useState<number>(2);
  const [concurrency, setConcurrency] = useState<number>(1);
  const [randomizeParams, setRandomizeParams] = useState<boolean>(false);

  const [runState, setRunState] = useState<"idle" | "running" | "stopping">("idle");
  const stopRef = useRef(false);

  // --- Load test stats
  const [rows, setRows] = useState<RunRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [okCount, setOkCount] = useState(0);
  const [errCount, setErrCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [missCount, setMissCount] = useState(0);

  const [avgLatency, setAvgLatency] = useState<number | null>(null);
  const [p95Latency, setP95Latency] = useState<number | null>(null);

  // --- Logs viewer
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  const [logLimit, setLogLimit] = useState<number>(100);
  const [logOffset, setLogOffset] = useState<number>(0);

  const [filterSource, setFilterSource] = useState<string>("");
  const [filterPath, setFilterPath] = useState<string>("");
  const [filterIp, setFilterIp] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const headerSource = "ui-admin";

  const computedHitMiss = useMemo(() => `${hitCount}/${missCount}`, [hitCount, missCount]);

  function recomputeLatencyStats(nextRows: RunRow[]) {
    const lat = nextRows.map((r) => r.latencyMs).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (!lat.length) {
      setAvgLatency(null);
      setP95Latency(null);
      return;
    }
    const avg = lat.reduce((a, b) => a + b, 0) / lat.length;
    const sorted = [...lat].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))];
    setAvgLatency(avg);
    setP95Latency(p95);
  }

  async function sendSingleRequest() {
    setLastStatus(null);
    setLastLatencyMs(null);
    setLastXPjCache("-");
    setLastCfCache("-");
    setLastRetryAfter("-");
    setLastBody("");

    const qs = new URLSearchParams();
    qs.set("topic", topic.trim() || "budget");
    qs.set("tone", tone.trim() || "snarky");
    qs.set("intensity", String(clampInt(intensity, 3, 1, 5)));

    const url = `${API_PATH}?${qs.toString()}`;

    const started = performance.now();
    try {
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-PJ-Source": headerSource,
        },
      });

      const elapsed = performance.now() - started;

      setLastStatus(resp.status);
      setLastLatencyMs(elapsed);

      setLastXPjCache(resp.headers.get("x-pj-cache") || "-");
      setLastCfCache(resp.headers.get("cf-cache-status") || "-");
      setLastRetryAfter(resp.headers.get("retry-after") || "-");

      const txt = await resp.text().catch(() => "");
      setLastBody(txt || "");
    } catch (e: any) {
      const elapsed = performance.now() - started;
      setLastStatus(null);
      setLastLatencyMs(elapsed);
      setLastBody(e?.message || String(e));
    }
  }

  async function workerDoRequest(id: number, url: string): Promise<RunRow> {
    const started = performance.now();
    try {
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-PJ-Source": headerSource,
        },
      });

      const elapsed = performance.now() - started;

      const xPjCache = resp.headers.get("x-pj-cache") || "";
      const cfCacheStatus = resp.headers.get("cf-cache-status") || "";
      const retryAfter = resp.headers.get("retry-after") || "";

      // Consume body so browser doesn’t keep streams open during bursty loads
      await resp.text().catch(() => "");

      return {
        id,
        t: nowTime(),
        status: resp.status,
        latencyMs: elapsed,
        xPjCache,
        cfCacheStatus,
        retryAfter,
      };
    } catch (e: any) {
      const elapsed = performance.now() - started;
      return {
        id,
        t: nowTime(),
        status: null,
        latencyMs: elapsed,
        error: e?.message || String(e),
      };
    }
  }

  function buildUrlForLoadTest(i: number) {
    const qs = new URLSearchParams();
    const t = topic.trim() || "budget";
    const tn = tone.trim() || "snarky";
    const inten = clampInt(intensity, 3, 1, 5);

    qs.set("topic", t);
    qs.set("tone", tn);
    qs.set("intensity", String(inten));

    if (randomizeParams) {
      // Force cache misses (and avoid “everything is identical” effects)
      qs.set("_r", `${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`);
    }

    return `${API_PATH}?${qs.toString()}`;
  }

  async function runLoadTest() {
    if (runState === "running") return;

    // reset
    stopRef.current = false;
    setRunState("running");

    setRows([]);
    setTotalCount(0);
    setOkCount(0);
    setErrCount(0);
    setHitCount(0);
    setMissCount(0);
    setAvgLatency(null);
    setP95Latency(null);

    const dur = clampInt(durationSec, 20, 1, 600);
    const rps = Math.max(0.1, Number.isFinite(targetRps) ? targetRps : 1);
    const conc = clampInt(concurrency, 1, 1, 20);

    // Simple scheduler: aim for rps, cap in-flight requests by concurrency
    const endAt = Date.now() + dur * 1000;
    let seq = 0;
    let inFlight = 0;

    const nextBatchWaitMs = Math.max(10, Math.round(1000 / rps));

    const appendRow = (r: RunRow) => {
      setRows((prev) => {
        const next = [r, ...prev].slice(0, 100); // keep UI fast
        recomputeLatencyStats(next);
        return next;
      });

      setTotalCount((x) => x + 1);

      if (r.status && r.status >= 200 && r.status < 300) setOkCount((x) => x + 1);
      else setErrCount((x) => x + 1);

      const pj = (r.xPjCache || "").toUpperCase();
      if (pj === "HIT") setHitCount((x) => x + 1);
      if (pj === "MISS") setMissCount((x) => x + 1);
    };

    while (Date.now() < endAt && !stopRef.current) {
      while (inFlight < conc && Date.now() < endAt && !stopRef.current) {
        const id = ++seq;
        inFlight++;

        const url = buildUrlForLoadTest(id);

        workerDoRequest(id, url)
          .then(appendRow)
          .finally(() => {
            inFlight--;
          });
      }

      await sleep(nextBatchWaitMs);
    }

    // Drain remaining in-flight requests
    const drainStart = Date.now();
    while (inFlight > 0 && Date.now() - drainStart < 10_000) {
      await sleep(50);
    }

    setRunState("idle");
  }

  function stopLoadTest() {
    if (runState !== "running") return;
    stopRef.current = true;
    setRunState("stopping");
    // runLoadTest loop will flip to idle after drain
  }

  async function refreshStats() {
    try {
      const s = await fetchJson<StatsResponse>(STATS_API, {
        headers: { Accept: "application/json" },
      });
      setStats(s);
    } catch (e: any) {
      setStats(null);
    }
  }

  async function refreshLogs() {
    setLogsLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("limit", String(clampInt(logLimit, 100, 1, 500)));
      qs.set("offset", String(clampInt(logOffset, 0, 0, 20000)));

      if (filterSource.trim()) qs.set("source", filterSource.trim());
      if (filterPath.trim()) qs.set("path", filterPath.trim());
      if (filterIp.trim()) qs.set("ip", filterIp.trim());
      if (filterStatus.trim()) qs.set("status", filterStatus.trim());

      const resp = await fetchJson<LogsResponse>(`${LOGS_API}?${qs.toString()}`, {
        headers: { Accept: "application/json" },
      });
      setLogs(resp);
    } catch (e: any) {
      setLogs(null);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    // Load initial data
    refreshStats();
    refreshLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // derive P95 from displayed rows (the “latest 100 shown”)
    const lat = rows.map((r) => r.latencyMs).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (!lat.length) return;

    const sorted = [...lat].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))];
    setP95Latency(p95);
  }, [rows]);

  const statusPill = (state: string) => {
    const base =
      "inline-flex items-center rounded px-2 py-1 text-xs font-semibold border";
    if (state === "running") return `${base} bg-green-50 border-green-200 text-green-800`;
    if (state === "stopping") return `${base} bg-yellow-50 border-yellow-200 text-yellow-800`;
    return `${base} bg-gray-50 border-gray-200 text-gray-700`;
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-gray-600">
          This page is protected by Cloudflare Zero Trust. No app password needed.
          All calls include <span className="font-mono">X-PJ-Source: {headerSource}</span> so you can
          distinguish UI traffic from scripts.
        </p>
      </div>

      {/* Interactive UI Test */}
      <section className="rounded-lg border p-4 space-y-4 bg-white">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Interactive UI Test</h2>
          <p className="text-sm text-gray-600">
            Runs calls from the browser so you can validate real user behavior: caching, cookies,
            CORS, and in-flight overlap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              type="number"
              min={1}
              max={5}
              value={intensity}
              onChange={(e) => setIntensity(clampInt(e.target.value, 3, 1, 5))}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded border bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
            onClick={sendSingleRequest}
          >
            Send Single Request
          </button>

          <div className="text-sm text-gray-600">
            Endpoint: <span className="font-mono">{API_PATH}</span>
          </div>
        </div>

        <div className="rounded border bg-gray-50 p-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Last status</div>
              <div className="font-semibold">{lastStatus ?? "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">Latency</div>
              <div className="font-semibold">{fmtMs(lastLatencyMs)}</div>
            </div>
            <div>
              <div className="text-gray-500">x-pj-cache</div>
              <div className="font-mono text-xs">{lastXPjCache}</div>
            </div>
            <div>
              <div className="text-gray-500">cf-cache-status</div>
              <div className="font-mono text-xs">{lastCfCache}</div>
            </div>
            <div>
              <div className="text-gray-500">Retry-After</div>
              <div className="font-mono text-xs">{lastRetryAfter}</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-gray-500 text-sm mb-1">Response</div>
            <pre className="max-h-56 overflow-auto rounded bg-white border p-3 text-xs whitespace-pre-wrap">
              {lastBody || "—"}
            </pre>
          </div>
        </div>
      </section>

      {/* UI Load Test */}
      <section className="rounded-lg border p-4 space-y-4 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">UI Load Test</h2>
            <p className="text-sm text-gray-600">
              Generates browser-driven traffic with a concurrency cap.
              Randomize params forces cache misses.
            </p>
          </div>

          <div className={statusPill(runState)}>{runState === "idle" ? "Idle" : runState}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Duration (sec)</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min={1}
              max={600}
              value={durationSec}
              onChange={(e) => setDurationSec(clampInt(e.target.value, 20, 1, 600))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Target req/sec</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min={0.1}
              step={0.1}
              value={targetRps}
              onChange={(e) => setTargetRps(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Concurrency</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min={1}
              max={20}
              value={concurrency}
              onChange={(e) => setConcurrency(clampInt(e.target.value, 1, 1, 20))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Randomize params</label>
            <div className="flex items-center gap-2 rounded border px-3 py-2">
              <input
                type="checkbox"
                checked={randomizeParams}
                onChange={(e) => setRandomizeParams(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                Cache friendly
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Unchecked = consistent params (more cache hits). Checked = forced misses.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded border bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            onClick={runLoadTest}
            disabled={runState !== "idle"}
          >
            Start
          </button>
          <button
            className="rounded border bg-gray-100 text-gray-800 px-4 py-2 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
            onClick={stopLoadTest}
            disabled={runState === "idle"}
          >
            Stop
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-semibold">{totalCount}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">200 OK</div>
            <div className="text-lg font-semibold">{okCount}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">Errors</div>
            <div className="text-lg font-semibold">{errCount}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">Avg</div>
            <div className="text-lg font-semibold">{fmtMs(avgLatency)}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">P95</div>
            <div className="text-lg font-semibold">{fmtMs(p95Latency)}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">HIT/MISS</div>
            <div className="text-lg font-semibold">{computedHitMiss}</div>
          </div>
        </div>

        <div className="rounded border overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-sm font-semibold">
            Latest requests (max 100 shown)
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b">
                <tr className="text-left">
                  <th className="p-2">#</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Latency</th>
                  <th className="p-2">x-pj-cache</th>
                  <th className="p-2">cf-cache</th>
                  <th className="p-2">Retry-After</th>
                  <th className="p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan={8}>
                      No results yet
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 font-mono text-xs">{r.id}</td>
                      <td className="p-2 font-mono text-xs">{r.t}</td>
                      <td className="p-2">{r.status ?? "-"}</td>
                      <td className="p-2">{fmtMs(r.latencyMs)}</td>
                      <td className="p-2 font-mono text-xs">{r.xPjCache || "-"}</td>
                      <td className="p-2 font-mono text-xs">{r.cfCacheStatus || "-"}</td>
                      <td className="p-2 font-mono text-xs">{r.retryAfter || "-"}</td>
                      <td className="p-2 text-xs text-red-700">{r.error || ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Logs & Stats */}
      <section className="rounded-lg border p-4 space-y-4 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Request Logs (D1)</h2>
            <p className="text-sm text-gray-600">
              These are written by the Worker (source, IP, user agent, cache, latency).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded border bg-gray-100 text-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-200"
              onClick={async () => {
                await refreshStats();
                await refreshLogs();
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-semibold">{stats?.total ?? "-"}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">Last hour</div>
            <div className="text-lg font-semibold">{stats?.lastHour ?? "-"}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">Last day</div>
            <div className="text-lg font-semibold">{stats?.lastDay ?? "-"}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-gray-500">By source (24h)</div>
            <div className="text-sm">
              {(stats?.bySource || []).length ? (
                <ul className="space-y-1">
                  {stats!.bySource.slice(0, 5).map((s) => (
                    <li key={s.source} className="flex items-center justify-between">
                      <span className="font-mono text-xs">{s.source}</span>
                      <span className="font-semibold">{s.v}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">-</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Source</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              placeholder="ui-admin | ui | python | unknown"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Path</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={filterPath}
              onChange={(e) => setFilterPath(e.target.value)}
              placeholder="/proxy/routes/jaas"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">IP</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={filterIp}
              onChange={(e) => setFilterIp(e.target.value)}
              placeholder="1.2.3.4"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              placeholder="200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Paging</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="w-full rounded border px-3 py-2"
                type="number"
                min={1}
                max={500}
                value={logLimit}
                onChange={(e) => setLogLimit(clampInt(e.target.value, 100, 1, 500))}
              />
              <input
                className="w-full rounded border px-3 py-2"
                type="number"
                min={0}
                max={20000}
                value={logOffset}
                onChange={(e) => setLogOffset(clampInt(e.target.value, 0, 0, 20000))}
              />
            </div>
            <div className="text-xs text-gray-500">limit / offset</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded border bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            onClick={refreshLogs}
            disabled={logsLoading}
          >
            {logsLoading ? "Loading..." : "Load logs"}
          </button>
          <button
            className="rounded border bg-gray-100 text-gray-800 px-4 py-2 text-sm font-semibold hover:bg-gray-200"
            onClick={() => setLogOffset((o) => Math.max(0, o - logLimit))}
          >
            Prev
          </button>
          <button
            className="rounded border bg-gray-100 text-gray-800 px-4 py-2 text-sm font-semibold hover:bg-gray-200"
            onClick={() => setLogOffset((o) => o + logLimit)}
          >
            Next
          </button>
          <div className="text-sm text-gray-600">
            {logs ? (
              <>
                Showing {logs.rows.length} of {logs.total} (offset {logs.offset})
              </>
            ) : (
              "—"
            )}
          </div>
        </div>

        <div className="rounded border overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-sm font-semibold">
            Latest D1 rows
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b">
                <tr className="text-left">
                  <th className="p-2">id</th>
                  <th className="p-2">ts</th>
                  <th className="p-2">ip</th>
                  <th className="p-2">source</th>
                  <th className="p-2">method</th>
                  <th className="p-2">path</th>
                  <th className="p-2">status</th>
                  <th className="p-2">latency</th>
                  <th className="p-2">cache</th>
                  <th className="p-2">user agent</th>
                </tr>
              </thead>

              <tbody>
                {!logs?.rows?.length ? (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan={10}>
                      No logs loaded (or none match your filters).
                    </td>
                  </tr>
                ) : (
                  logs.rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 font-mono text-xs">{r.id}</td>
                      <td className="p-2 font-mono text-xs">{r.ts}</td>
                      <td className="p-2 font-mono text-xs">{r.ip}</td>
                      <td className="p-2 font-mono text-xs">{r.source}</td>
                      <td className="p-2 font-mono text-xs">{r.method}</td>
                      <td className="p-2 font-mono text-xs">{r.path}</td>
                      <td className="p-2">{r.status}</td>
                      <td className="p-2">{fmtMs(r.latency_ms)}</td>
                      <td className="p-2 font-mono text-xs">{r.cache}</td>
                      <td className="p-2 font-mono text-xs max-w-[420px] truncate" title={r.user_agent}>
                        {r.user_agent}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Cloudflare dashboard logs can’t be pulled directly into the browser without creating your own
          backend endpoint (Worker) that calls Cloudflare’s APIs using an API token. If you want that,
          we can add a Worker route like <span className="font-mono">/admin/api/cf-analytics</span> and
          surface it here.
        </div>
      </section>
    </div>
  );
}
