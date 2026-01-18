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
  // Same rule as Dashboard.tsx: local dev calls direct, prod calls via Worker proxy.
  const apiBase = useMemo(() => {
    const host = window.location.hostname;
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
    return isLocal ? "" : "/proxy";
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
    // Public URL people will actually use in prod:
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

  async function singleRequest() {
    const controller = new AbortController();
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

      const latencyMs = nowMs() - startedAt;
      const xPjCache = res.headers.get("x-pj-cache");
      const cfCacheStatus = res.headers.get("cf-cache-status");
      const retryAfter = res.headers.get("retry-after");
      const bodyText = await res.text();

      setRows((prev) =>
        [
          {
            id: (prev[0]?.id ?? 0) + 1,
            startedAt,
            latencyMs,
            status: res.status,
            xPjCache,
            cfCacheStatus,
            retryAfter,
            error: res.ok ? undefined : bodyText.slice(0, 400),
          },
          ...prev,
        ].slice(0, 100),
      );

      // Helpful to correlate UI clicks with what the edge is doing
      // eslint-disable-next-line no-console
      console.log("[API Test] Response", {
        url,
        status: res.status,
        xPjCache,
        cfCacheStatus,
        retryAfter,
        bodyPreview: bodyText.slice(0, 600),
      });
    } catch (e: any) {
      const latencyMs = nowMs() - startedAt;
      setRows((prev) =>
        [
          {
            id: (prev[0]?.id ?? 0) + 1,
            startedAt,
            latencyMs,
            status: "ERROR",
            error: e?.message || String(e),
          },
          ...prev,
        ].slice(0, 100),
      );
    }
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
      ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))]
      : 0;

    const cacheHit = all.filter((r) => (r.xPjCache || "").toUpperCase() === "HIT").length;
    const cacheMiss = all.filter((r) => (r.xPjCache || "").toUpperCase() === "MISS").length;

    const lastStatusCounts: Record<string, number> = {};
    for (const r of all) {
      const key = String(r.status);
      lastStatusCounts[key] = (lastStatusCounts[key] || 0) + 1;
    }

    return { total, ok, errors, avgLatency, p95Latency, cacheHit, cacheMiss, lastStatusCounts };
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

        // Drain body so the browser fully completes the request (important for realism)
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

        // Update summary every completion
        const s = computeSummary(allResults);
        setSummary((prev) => ({ ...prev, ...s }));
      }
    };

    const startWall = Date.now();

    // Scheduler loop
    while (!controller.signal.aborted) {
      const elapsedMs = Date.now() - startWall;
      if (elapsedMs >= dur * 1000) break;
      if (issued >= totalRequests) break;

      // Respect concurrency cap
      if (inFlight < conc) {
        issued += 1;
        void enqueueOne(issued);
      }

      // pace issuance
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    // Wait for all in-flight to finish
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
            Integrate our justification engine directly into your workflow.
          </p>
        </div>

        <Tabs defaultValue="v1" className="w-full">
          <TabsList>
            <TabsTrigger value="v1">v1.0 (Proxy)</TabsTrigger>
            <TabsTrigger value="beta">Beta (Unstable)</TabsTrigger>
          </TabsList>

          <TabsContent value="v1" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="font-mono text-lg">GET /proxy/routes/jaas</CardTitle>
                    <CardDescription>
                      Generates a justification. This is the current public path that stays same-origin
                      and benefits from Cloudflare caching.
                    </CardDescription>
                  </div>
                  <Badge>Public</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Query Parameters</h3>
                  <div className="border rounded-md divide-y">
                    <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                      <div className="font-mono font-semibold">topic</div>
                      <div className="text-muted-foreground">string</div>
                      <div className="text-muted-foreground">Optional</div>
                      <div className="text-muted-foreground">Category (e.g., budget)</div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                      <div className="font-mono font-semibold">tone</div>
                      <div className="text-muted-foreground">string</div>
                      <div className="text-muted-foreground">Optional</div>
                      <div className="text-muted-foreground">Tone (e.g., snarky)</div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                      <div className="font-mono font-semibold">intensity</div>
                      <div className="text-muted-foreground">integer</div>
                      <div className="text-muted-foreground">Optional</div>
                      <div className="text-muted-foreground">Level 1-5 (e.g., 3)</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Example (PowerShell-friendly)</h3>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <span className="text-purple-400">curl.exe</span>{" "}
                    <span className="text-green-400">"{exampleUrl}"</span>{" "}
                    <span className="text-blue-400">-H</span>{" "}
                    <span className="text-green-400">"Accept: application/json"</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Note: In Windows PowerShell, plain <span className="font-mono">curl</span> is an alias for
                    Invoke-WebRequest. Use <span className="font-mono">curl.exe</span>.
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
                  This runs calls from the browser so you can validate real user behavior: caching,
                  CORS, cookies, and in-flight overlap.
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
                      onChange={(e) => setIntensity(clampInt(Number(e.target.value), 1, 5))}
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
                        <div className="text-xs text-muted-foreground">Last status</div>
                        <div className="font-mono">{rows[0]?.status ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Latency</div>
                        <div className="font-mono">
                          {rows[0] ? `${Math.round(rows[0].latencyMs)} ms` : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">x-pj-cache</div>
                        <div className="font-mono">{rows[0]?.xPjCache ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">cf-cache-status</div>
                        <div className="font-mono">{rows[0]?.cfCacheStatus ?? "-"}</div>
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
                      Generates browser-driven traffic with a concurrency cap. This is the closest
                      thing to real user load without external tooling.
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
                      onChange={(e) => setDurationSec(clampInt(Number(e.target.value), 1, 3600))}
                      disabled={isRunning}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rps">Target req/sec</Label>
                    <In
