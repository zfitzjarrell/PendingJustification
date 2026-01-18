import { useEffect, useMemo, useRef, useState } from "react";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

type ApiResult = {
  ok: boolean;
  status?: number;
  ms?: number;
  url?: string;
  json?: any;
  text?: string;
  error?: string;
};

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

function ms(n?: number) {
  if (typeof n !== "number") return "—";
  return `${Math.round(n)} ms`;
}

function clampInt(v: string | number | null | undefined, def: number, min: number, max: number) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

async function safeReadJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (ct.includes("application/json")) {
    try {
      return { json: JSON.parse(text), text };
    } catch {
      return { json: null, text };
    }
  }
  return { json: null, text };
}

export default function Admin() {
  // -------------------------
  // Lightweight password gate
  // -------------------------
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("pj_admin_unlocked");
    if (saved === "1") setUnlocked(true);
  }, []);

  const unlock = () => {
    // Client-side only. DO NOT treat this as real security.
    // Use Cloudflare Zero Trust Access to actually protect /admin.
    if (!pw.trim()) {
      toast.error("Enter the admin password.");
      return;
    }
    sessionStorage.setItem("pj_admin_unlocked", "1");
    setUnlocked(true);
    toast.success("Admin unlocked (client-side).");
  };

  const lock = () => {
    sessionStorage.removeItem("pj_admin_unlocked");
    setUnlocked(false);
    setPw("");
  };

  // -------------------------
  // API Tester state
  // -------------------------
  const [topic, setTopic] = useState("budget");
  const [tone, setTone] = useState("snarky");
  const [intensity, setIntensity] = useState<number>(3);
  const [context, setContext] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [running, setRunning] = useState(false);

  const proxyBase = useMemo(() => {
    // Always hit your site origin (so it goes through Worker + logging)
    return `${window.location.origin}/proxy/routes/jaas`;
  }, []);

  const buildUrl = () => {
    const u = new URL(proxyBase);
    if (topic.trim()) u.searchParams.set("topic", topic.trim());
    if (tone.trim()) u.searchParams.set("tone", tone.trim());
    u.searchParams.set("intensity", String(intensity));
    if (context.trim()) u.searchParams.set("context", context.trim());
    return u.toString();
  };

  const runSingle = async () => {
    const url = buildUrl();
    setRunning(true);
    setResult(null);

    const started = performance.now();
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-PJ-Source": "admin-ui",
        },
        credentials: "include",
      });

      const { json, text } = await safeReadJson(res);
      const ended = performance.now();

      setResult({
        ok: res.ok,
        status: res.status,
        ms: ended - started,
        url,
        json: json ?? undefined,
        text: json ? undefined : text,
      });

      if (res.ok) toast.success(`200 OK (${ms(ended - started)})`);
      else toast.error(`${res.status} (${ms(ended - started)})`);
    } catch (e: any) {
      const ended = performance.now();
      setResult({
        ok: false,
        ms: ended - started,
        url,
        error: e?.message || String(e),
      });
      toast.error("Request failed. Check console.");
      console.error("[Admin API Test] fetch failed", e);
    } finally {
      setRunning(false);
    }
  };

  // -------------------------
  // Browser load test (UI-like)
  // -------------------------
  const [ltTotal, setLtTotal] = useState(30);
  const [ltConcurrency, setLtConcurrency] = useState(3);
  const [ltDelayMs, setLtDelayMs] = useState(150);
  const [ltResults, setLtResults] = useState<{ ok: boolean; status: number; ms: number }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const stopLoadTest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
    toast.message("Load test stopped.");
  };

  const runLoadTest = async () => {
    const url = buildUrl();
    setLtResults([]);
    setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let sent = 0;
    let completed = 0;

    const sleep = (n: number) => new Promise((r) => setTimeout(r, n));

    const worker = async () => {
      while (!controller.signal.aborted) {
        const i = sent++;
        if (i >= ltTotal) return;

        const started = performance.now();
        try {
          const res = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-PJ-Source": "admin-ui",
            },
            credentials: "include",
            signal: controller.signal,
          });
          const ended = performance.now();
          setLtResults((prev) => [...prev, { ok: res.ok, status: res.status, ms: ended - started }]);
        } catch (e: any) {
          if (controller.signal.aborted) return;
          const ended = performance.now();
          setLtResults((prev) => [...prev, { ok: false, status: 0, ms: ended - started }]);
        } finally {
          completed++;
          if (ltDelayMs > 0) await sleep(ltDelayMs);
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: ltConcurrency }, () => worker()));
      toast.success("Load test complete.");
    } finally {
      abortRef.current = null;
      setRunning(false);
    }
  };

  const ltSummary = useMemo(() => {
    if (!ltResults.length) return null;
    const ok = ltResults.filter((r) => r.ok).length;
    const total = ltResults.length;
    const avg = ltResults.reduce((a, r) => a + r.ms, 0) / total;
    const p95 = [...ltResults]
      .map((r) => r.ms)
      .sort((a, b) => a - b)[Math.floor(total * 0.95)] ?? 0;

    const byStatus = ltResults.reduce<Record<string, number>>((acc, r) => {
      const k = String(r.status);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return { ok, total, avg, p95, byStatus };
  }, [ltResults]);

  // -------------------------
  // Logs viewer state
  // -------------------------
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  const [filterSource, setFilterSource] = useState("");
  const [filterPath, setFilterPath] = useState("/proxy/");
  const [filterIp, setFilterIp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  const fetchStats = async () => {
    try {
      const res = await fetch("/admin/api/stats", {
        method: "GET",
        headers: { Accept: "application/json", "X-PJ-Source": "admin-ui" },
        credentials: "include",
      });
      const { json, text } = await safeReadJson(res);
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      setStats(json as StatsResponse);
    } catch (e: any) {
      console.error("[Admin] stats fetch failed", e);
      toast.error("Failed to load stats. Confirm Worker /admin/api/stats is deployed.");
    }
  };

  const fetchLogs = async (newOffset?: number) => {
    setLogsLoading(true);
    try {
      const o = typeof newOffset === "number" ? newOffset : offset;

      const u = new URL(`${window.location.origin}/admin/api/logs`);
      u.searchParams.set("limit", String(limit));
      u.searchParams.set("offset", String(o));
      if (filterSource.trim()) u.searchParams.set("source", filterSource.trim());
      if (filterPath.trim()) u.searchParams.set("path", filterPath.trim());
      if (filterIp.trim()) u.searchParams.set("ip", filterIp.trim());
      if (filterStatus.trim()) u.searchParams.set("status", filterStatus.trim());

      const res = await fetch(u.toString(), {
        method: "GET",
        headers: { Accept: "application/json", "X-PJ-Source": "admin-ui" },
        credentials: "include",
      });
      const { json, text } = await safeReadJson(res);
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      setOffset(o);
      setLogs(json as LogsResponse);
    } catch (e: any) {
      console.error("[Admin] logs fetch failed", e);
      toast.error("Failed to load logs. Confirm Worker /admin/api/logs is deployed.");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (!unlocked) return;
    fetchStats();
    fetchLogs(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  // -------------------------
  // Render
  // -------------------------
  return (
    <EnterpriseLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Admin</h1>
            <p className="text-muted-foreground">
              UI-based API testing and live request logs (from Cloudflare Worker + D1).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unlocked ? (
              <Button variant="outline" onClick={lock}>Lock</Button>
            ) : null}
          </div>
        </div>

        {!unlocked ? (
          <Card>
            <CardHeader>
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>
                This gate is client-side only. Protect <span className="font-mono">/admin</span> with Cloudflare Zero Trust Access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="pw">Admin password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Enter password…"
                />
              </div>
              <Button onClick={unlock}>Unlock</Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="tester" className="w-full">
            <TabsList>
              <TabsTrigger value="tester">API Tester</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            {/* ----------------- */}
            {/* API TESTER TAB     */}
            {/* ----------------- */}
            <TabsContent value="tester" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Single Request</CardTitle>
                  <CardDescription>
                    Runs a request from the browser (closest to real user behavior).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tone">Tone</Label>
                      <Input id="tone" value={tone} onChange={(e) => setTone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Intensity: <span className="font-mono">{intensity}</span></Label>
                      <Slider value={[intensity]} min={1} max={5} step={1} onValueChange={(v) => setIntensity(v[0] ?? 3)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="context">Context (optional)</Label>
                      <Input
                        id="context"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Short free-text context..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={runSingle} disabled={running}>
                      {running ? "Running..." : "Run"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const u = buildUrl();
                        navigator.clipboard.writeText(u);
                        toast.success("Copied URL");
                      }}
                    >
                      Copy URL
                    </Button>
                    <div className="text-sm text-muted-foreground font-mono break-all">
                      {buildUrl()}
                    </div>
                  </div>

                  {result ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={result.ok ? "default" : "destructive"}>
                          {result.status ?? "ERR"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{ms(result.ms)}</span>
                      </div>

                      <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        {result.error
                          ? `ERROR: ${result.error}\nURL: ${result.url}`
                          : JSON.stringify(result.json ?? result.text, null, 2)}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Browser Load Test</CardTitle>
                  <CardDescription>
                    Replays requests from the UI with controlled concurrency and pacing. This will hit your Worker and write logs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total">Total requests</Label>
                      <Input
                        id="total"
                        type="number"
                        value={ltTotal}
                        onChange={(e) => setLtTotal(clampInt(e.target.value, 30, 1, 5000))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conc">Concurrency</Label>
                      <Input
                        id="conc"
                        type="number"
                        value={ltConcurrency}
                        onChange={(e) => setLtConcurrency(clampInt(e.target.value, 3, 1, 50))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delay">Delay per request (ms)</Label>
                      <Input
                        id="delay"
                        type="number"
                        value={ltDelayMs}
                        onChange={(e) => setLtDelayMs(clampInt(e.target.value, 150, 0, 5000))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={runLoadTest} disabled={running}>Run load test</Button>
                    <Button variant="outline" onClick={stopLoadTest} disabled={!running}>Stop</Button>
                  </div>

                  {ltSummary ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge>{ltSummary.ok}/{ltSummary.total} OK</Badge>
                        <span className="text-sm text-muted-foreground">Avg: {ms(ltSummary.avg)}</span>
                        <span className="text-sm text-muted-foreground">P95: {ms(ltSummary.p95)}</span>
                        <span className="text-sm text-muted-foreground font-mono">
                          Status: {Object.entries(ltSummary.byStatus).map(([k, v]) => `${k}:${v}`).join("  ")}
                        </span>
                      </div>

                      <div className="max-h-64 overflow-auto border rounded-md">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-background">
                            <tr className="text-left">
                              <th className="p-2">#</th>
                              <th className="p-2">Status</th>
                              <th className="p-2">OK</th>
                              <th className="p-2">Latency</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ltResults.slice().reverse().slice(0, 300).map((r, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="p-2 font-mono">{ltResults.length - idx}</td>
                                <td className="p-2 font-mono">{r.status}</td>
                                <td className="p-2">{r.ok ? "yes" : "no"}</td>
                                <td className="p-2 font-mono">{ms(r.ms)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Tip: if you want these load-test requests to never cache, append a cache buster like <span className="font-mono">&_t=Date.now()</span>.
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No load test results yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ----------------- */}
            {/* LOGS TAB           */}
            {/* ----------------- */}
            <TabsContent value="logs" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Stats</CardTitle>
                  <CardDescription>From D1 request logs (last hour / last day).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={fetchStats}>Refresh stats</Button>
                    {stats ? (
                      <>
                        <Badge>Total: {stats.total}</Badge>
                        <Badge>Last hour: {stats.lastHour}</Badge>
                        <Badge>Last day: {stats.lastDay}</Badge>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">No stats loaded.</span>
                    )}
                  </div>

                  {stats?.bySource?.length ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-background">
                          <tr className="text-left">
                            <th className="p-2">Source</th>
                            <th className="p-2">Count (24h)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.bySource.map((s) => (
                            <tr key={s.source} className="border-t">
                              <td className="p-2 font-mono">{s.source}</td>
                              <td className="p-2 font-mono">{s.v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Request Logs</CardTitle>
                  <CardDescription>
                    Pulls from <span className="font-mono">/admin/api/logs</span>. Filter and page through.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="space-y-2">
                      <Label>source</Label>
                      <Input value={filterSource} onChange={(e) => setFilterSource(e.target.value)} placeholder="admin-ui / ui / unknown" />
                    </div>
                    <div className="space-y-2">
                      <Label>path</Label>
                      <Input value={filterPath} onChange={(e) => setFilterPath(e.target.value)} placeholder="/proxy/routes/jaas" />
                    </div>
                    <div className="space-y-2">
                      <Label>ip</Label>
                      <Input value={filterIp} onChange={(e) => setFilterIp(e.target.value)} placeholder="x.x.x.x" />
                    </div>
                    <div className="space-y-2">
                      <Label>status</Label>
                      <Input value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} placeholder="200 / 429" />
                    </div>
                    <div className="space-y-2">
                      <Label>limit</Label>
                      <Input
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(clampInt(e.target.value, 100, 1, 500))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => fetchLogs(0)} disabled={logsLoading}>Apply filters</Button>
                    <Button variant="outline" onClick={() => fetchLogs(offset)} disabled={logsLoading}>Refresh</Button>
                    <div className="text-sm text-muted-foreground">
                      {logs ? (
                        <>
                          Showing <span className="font-mono">{logs.rows.length}</span> of{" "}
                          <span className="font-mono">{logs.total}</span>
                        </>
                      ) : (
                        "No logs loaded."
                      )}
                    </div>
                  </div>

                  {logs?.rows?.length ? (
                    <>
                      <div className="border rounded-md overflow-auto">
                        <table className="w-full text-sm min-w-[1100px]">
                          <thead className="sticky top-0 bg-background">
                            <tr className="text-left">
                              <th className="p-2">id</th>
                              <th className="p-2">ts</th>
                              <th className="p-2">ip</th>
                              <th className="p-2">source</th>
                              <th className="p-2">method</th>
                              <th className="p-2">path</th>
                              <th className="p-2">status</th>
                              <th className="p-2">ms</th>
                              <th className="p-2">cache</th>
                              <th className="p-2">ua</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logs.rows.map((r) => (
                              <tr key={r.id} className="border-t">
                                <td className="p-2 font-mono">{r.id}</td>
                                <td className="p-2 font-mono">{r.ts}</td>
                                <td className="p-2 font-mono">{r.ip}</td>
                                <td className="p-2 font-mono">{r.source}</td>
                                <td className="p-2 font-mono">{r.method}</td>
                                <td className="p-2 font-mono">{r.path}</td>
                                <td className="p-2 font-mono">
                                  <Badge variant={r.status >= 400 ? "destructive" : "default"}>{r.status}</Badge>
                                </td>
                                <td className="p-2 font-mono">{r.latency_ms}</td>
                                <td className="p-2 font-mono">{r.cache}</td>
                                <td className="p-2 font-mono truncate max-w-[360px]" title={r.user_agent}>
                                  {r.user_agent}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          disabled={offset <= 0 || logsLoading}
                          onClick={() => fetchLogs(Math.max(0, offset - limit))}
                        >
                          Prev
                        </Button>

                        <div className="text-sm text-muted-foreground">
                          Offset: <span className="font-mono">{offset}</span>
                        </div>

                        <Button
                          variant="outline"
                          disabled={!logs || offset + limit >= logs.total || logsLoading}
                          onClick={() => fetchLogs(offset + limit)}
                        >
                          Next
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {logsLoading ? "Loading logs..." : "No matching logs yet."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </EnterpriseLayout>
  );
}
