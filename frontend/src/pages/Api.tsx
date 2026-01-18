import { useMemo, useRef, useState } from "react";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TestRow = {
  id: number;
  startedAt: number;
  latencyMs: number;
  status: number | "ERROR";
  xPjCache?: string | null;
  cfCacheStatus?: string | null;
  retryAfter?: string | null;
  error?: string;
};

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export default function Api() {
  // Prod uses Worker proxy; local dev can still call "/proxy" if you have a local proxy.
  const apiBase = useMemo(() => {
    // Keep it simple: always use the proxy path in this site.
    return "/proxy";
  }, []);

  const [topic, setTopic] = useState("budget");
  const [tone, setTone] = useState("snarky");
  const [intensity, setIntensity] = useState(3);

  // Load test controls
  const [durationSec, setDurationSec] = useState(20);
  const [rateRps, setRateRps] = useState(2);
  const [concurrency, setConcurrency] = useState(1);
  const [randomizeParams, setRandomizeParams] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [rows, setRows] = useState<TestRow[]>([]);
  const [summary, setSummary] = useState<{
    startedAt?: number;
    finishedAt?: number;
    total?: number;
    ok?: number;
    errors?: number;
    avgLatency?: number;
    p95Latency?: number;
    cacheHit?: number;
    cacheMiss?: number;
    lastStatusCounts?: Record<string, number>;
  }>({});

  const abortRef = useRef<AbortController | null>(null);

  const endpointPath = "/routes/jaas";
  const endpointUrl = useMemo(() => {
    const base = apiBase.replace(/\/+$/, "");
    return `${base}${endpointPath}`;
  }, [apiBase]);

  const exampleUrl = useMemo(() => {
    const params = new URLSearchParams({
      topic: topic || "budget",
      tone: tone || "snarky",
      intensity: String(clampInt(intensity, 1, 5)),
    });
    return `https://pendingjustification.com/proxy${endpointPath}?${params.toString()}`;
  }, [topic, tone, intensity]);

  function buildParams() {
    const topics = [
      "change_request",
      "security_exception",
      "budget",
      "priority",
      "meeting",
      "vendor_request",
      "process_policy",
      "staffing",
      "timeline",
      "generic",
    ];
    const tones = ["snarky", "absurd", "deadpan", "corporate-parody", "unhinged"];

    const t = randomizeParams
      ? topics[Math.floor(Math.random() * topics.length)]
      : topic;

    const tn = randomizeParams
      ? tones[Math.floor(Math.random() * tones.length)]
      : tone;

    const i = randomizeParams
      ? clampInt(1 + Math.floor(Math.random() * 5), 1, 5)
      : clampInt(intensity, 1, 5);

    return { topic: t || "budget", tone: tn || "snarky", intensity: String(i) };
  }

  function computeSummary(all: TestRow[]) {
    const total = all.length;
    const ok = all.filter((r) => r.status === 200).length;
    const errors = total - ok;

    const latencies = all
      .map((r) => r.latencyMs)
      .filter((n) => typeof n === "number" && Number.isFinite(n))
      .sort((a, b) => a - b);

    const avgLatency = latencies.length
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    const p95Latency = latencies.length
      ? latencies[
          Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))
        ]
      : 0;

    const cacheHit = all.filter(
      (r) => (r.xPjCache || "").toUpperCase() === "HIT",
    ).length;
    const cacheMiss = all.filter(
      (r) => (r.xPjCache || "").toUpperCase() === "MISS",
    ).length;

    const lastStatusCounts: Record<string, number> = {};
    for (const r of all) {
      const key = String(r.status);
      lastStatusCounts[key] = (lastStatusCounts[key] || 0) + 1;
    }

    return {
      total,
      ok,
      errors,
      avgLatency,
      p95Latency,
      cacheHit,
      cacheMiss,
      lastStatusCounts,
    };
  }

  async function singleRequest() {
    const startedAt = nowMs();
    const params = new URLSearchParams(buildParams());
    const url = `${endpointUrl}?${params.toString()}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const latencyMs = nowMs() - startedAt;
      const xPjCache = res.headers.get("x-pj-cache");
      const cfCacheStatus = res.headers.get("cf-cache-status");
      const retryAfter = res.headers.get("retry-after");
      const bodyText = await res.text();

      const row: TestRow = {
        id: (rows[0]?.id ?? 0) + 1,
        startedAt,
        latencyMs,
        status: res.status,
        xPjCache,
        cfCacheStatus,
        retryAfter,
        error: res.ok ? undefined : bodyText.slice(0, 400),
      };

      setRows((prev) => [row, ...prev].slice(0, 100));

      // Helpful when validating actual browser behavior
      // eslint-disable-next-line no-console
      console.log("[API UI Test]", {
        url,
        status: res.status,
        xPjCache,
        cfCacheStatus,
        retryAfter,
        bodyPreview: bodyText.slice(0, 600),
      });
    } catch (e: any) {
      const latencyMs = nowMs() - startedAt;
      const row: TestRow = {
        id: (rows[0]?.id ?? 0) + 1,
        startedAt,
        latencyMs,
        status: "ERROR",
        error: e?.message || String(e),
      };
      setRows((prev) => [row, ...prev].slice(0, 100));
    }
  }

  async function runLoadTest() {
    if (isRunning) return;

    const dur = Math.max(1, clampInt(durationSec, 1, 3600));
    const rps = Math.max(0.1, Number(rateRps) || 1);
    const conc = clampInt(concurrency, 1, 20);

    setIsRunning(true);
    setRows([]);
    setSummary({ startedAt: Date.now() });

    const controller = new AbortController();
    abortRef.current = controller;

    const totalRequests = Math.max(1, Math.floor(dur * rps));
    const intervalMs = 1000 / rps;

    let issued = 0;
    let completed = 0;
    let inFlight = 0;

    const allResults: TestRow[] = [];

    const enqueueOne = async (id: number) => {
      inFlight += 1;
      const startedAt = nowMs();
      const params = new URLSearchParams(buildParams());
      const url = `${endpointUrl}?${params.toString()}`;

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          credentials: "include",
        });

        // drain body for realism
        await res.text();

        const latencyMs = nowMs() - startedAt;
        const row: TestRow = {
          id,
          startedAt,
          latencyMs,
          status: res.status,
          xPjCache: res.headers.get("x-pj-cache"),
          cfCacheStatus: res.headers.get("cf-cache-status"),
          retryAfter: res.headers.get("retry-after"),
        };

        allResults.push(row);
        setRows((prev) => [row, ...prev].slice(0, 100));
      } catch (e: any) {
        const latencyMs = nowMs() - startedAt;
        const row: TestRow = {
          id,
          startedAt,
          latencyMs,
          status: "ERROR",
          error: e?.message || String(e),
        };
        allResults.push(row);
        setRows((prev) => [row, ...prev].slice(0, 100));
      } finally {
        inFlight -= 1;
        completed += 1;
        const s = computeSummary(allResults);
        setSummary((prev) => ({ ...prev, ...s }));
      }
    };

    const startWall = Date.now();

    while (!controller.signal.aborted) {
      const elapsedMs = Date.now() - startWall;
      if (elapsedMs >= dur * 1000) break;
      if (issued >= totalRequests) break;

      if (inFlight < conc) {
        issued += 1;
        void enqueueOne(issued);
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    while (!controller.signal.aborted && completed < issued) {
      await new Promise((r) => setTimeout(r, 50));
    }

    setSummary((prev) => ({ ...prev, finishedAt: Date.now() }));
    setIsRunning(false);
    abortRef.current = null;
  }

  function stopLoadTest() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  }

  return (
    <EnterpriseLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">API Reference</h1>
          <p className="text-muted-foreground">
            Integrate the justification engine into your workflow.
          </p>
        </div>

        <Tabs defaultValue="v1" className="w-full">
          <TabsList>
            <TabsTrigger value="v1">v1.0 (Proxy)</TabsTrigger>
            <TabsTrigger value="beta">Beta</TabsTrigger>
          </TabsList>

          <TabsContent value="v1" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="font-mono text-lg">
                      GET /proxy/routes/jaas
                    </CardTitle>
                    <CardDescription>
                      Same-origin endpoint that routes through Cloudflare Worker
                      proxy. Supports query params: topic, tone, intensity.
                    </CardDescription>
                  </div>
                  <Badge>Public</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">
                    Example (PowerShell-friendly)
                  </h3>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <span className="text-purple-400">curl.exe</span>{" "}
                    <span className="text-green-400">"{exampleUrl}"</span>{" "}
                    <span className="text-blue-400">-H</span>{" "}
                    <span className="text-green-400">
                      "Accept: application/json"
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    In Windows PowerShell, plain curl is an alias for
                    Invoke-WebRequest. Use curl.exe.
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Example Response</h3>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
{`{
  "justification": "I could do that, but then I'd have to care.",
  "topic": "budget",
  "tone": "snarky",
  "intensity": 3,
  "meta": {
    "id": "tpl-026cf435",
    "source": "template",
    "safe_for_work": true
  }
}`}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interactive UI Test</CardTitle>
                <CardDescription>
                  Runs calls from the browser so you can validate real user
                  behavior: caching, cookies, CORS, and in-flight overlap.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="budget"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Input
                      id="tone"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="snarky"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intensity">Intensity (1-5)</Label>
                    <Input
                      id="intensity"
                      type="number"
                      min={1}
                      max={5}
                      value={intensity}
                      onChange={(e) =>
                        setIntensity(clampInt(Number(e.target.value), 1, 5))
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={singleRequest} disabled={isRunning}>
                    Send Single Request
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-muted-foreground">
                    Endpoint: <span className="font-mono">{endpointUrl}</span>
                  </div>
                  <div className="p-3 text-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Last status
                        </div>
                        <div className="font-mono">{rows[0]?.status ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Latency
                        </div>
                        <div className="font-mono">
                          {rows[0]
                            ? `${Math.round(rows[0].latencyMs)} ms`
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          x-pj-cache
                        </div>
                        <div className="font-mono">
                          {rows[0]?.xPjCache ?? "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          cf-cache-status
                        </div>
                        <div className="font-mono">
                          {rows[0]?.cfCacheStatus ?? "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>UI Load Test</CardTitle>
                    <CardDescription>
                      Generates browser-driven traffic with a concurrency cap.
                      Randomize params forces cache misses.
                    </CardDescription>
                  </div>
                  <Badge variant={isRunning ? "default" : "secondary"}>
                    {isRunning ? "Running" : "Idle"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (sec)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      max={3600}
                      value={durationSec}
                      onChange={(e) =>
                        setDurationSec(clampInt(Number(e.target.value), 1, 3600))
                      }
                      disabled={isRunning}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rps">Target req/sec</Label>
                    <Input
                      id="rps"
                      type="number"
                      step={0.1}
                      min={0.1}
                      value={rateRps}
                      onChange={(e) => setRateRps(Number(e.target.value))}
                      disabled={isRunning}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="concurrency">Concurrency</Label>
                    <Input
                      id="concurrency"
                      type="number"
                      min={1}
                      max={20}
                      value={concurrency}
                      onChange={(e) =>
                        setConcurrency(clampInt(Number(e.target.value), 1, 20))
                      }
                      disabled={isRunning}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Randomize params</Label>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border">
                      <input
                        type="checkbox"
                        checked={randomizeParams}
                        onChange={(e) => setRandomizeParams(e.target.checked)}
                        disabled={isRunning}
                      />
                      <span className="text-sm text-muted-foreground">
                        {randomizeParams ? "Mostly cache MISS" : "Cache friendly"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={runLoadTest} disabled={isRunning}>
                    Start
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopLoadTest}
                    disabled={!isRunning}
                  >
                    Stop
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="font-mono text-lg">{summary.total ?? 0}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">200 OK</div>
                    <div className="font-mono text-lg">{summary.ok ?? 0}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Errors</div>
                    <div className="font-mono text-lg">{summary.errors ?? 0}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Avg</div>
                    <div className="font-mono text-lg">
                      {summary.avgLatency
                        ? `${Math.round(summary.avgLatency)} ms`
                        : "-"}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">P95</div>
                    <div className="font-mono text-lg">
                      {summary.p95Latency
                        ? `${Math.round(summary.p95Latency)} ms`
                        : "-"}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">HIT/MISS</div>
                    <div className="font-mono text-lg">
                      {(summary.cacheHit ?? 0) + "/" + (summary.cacheMiss ?? 0)}
                    </div>
                  </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-muted-foreground">
                    Latest requests (max 100 shown)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted-foreground">
                        <tr className="border-b">
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Latency</th>
                          <th className="text-left p-2">x-pj-cache</th>
                          <th className="text-left p-2">cf-cache</th>
                          <th className="text-left p-2">Retry-After</th>
                          <th className="text-left p-2">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-3 text-muted-foreground">
                              No results yet
                            </td>
                          </tr>
                        )}
                        {rows.map((r) => (
                          <tr key={r.id} className="border-b last:border-b-0">
                            <td className="p-2 font-mono">{r.id}</td>
                            <td className="p-2 font-mono">{String(r.status)}</td>
                            <td className="p-2 font-mono">
                              {Math.round(r.latencyMs)} ms
                            </td>
                            <td className="p-2 font-mono">{r.xPjCache ?? "-"}</td>
                            <td className="p-2 font-mono">{r.cfCacheStatus ?? "-"}</td>
                            <td className="p-2 font-mono">{r.retryAfter ?? "-"}</td>
                            <td className="p-2 font-mono text-xs text-muted-foreground">
                              {r.error ? r.error.slice(0, 80) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="beta">
            <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Documentation pending justification.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </EnterpriseLayout>
  );
}
