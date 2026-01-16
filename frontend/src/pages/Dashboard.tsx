import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Loader2, Copy, AlertCircle, Info } from "lucide-react";

// Import Types (keep as-is from your project)
import { Topic, Tone } from "types";

// Import Experience Engine (keep as-is)
import { useExperience } from "utils/experience-context";
import { getCopy } from "utils/copy-engine";

type TopicsResponse = { topics: string[] };
type TonesResponse = { tones: string[] };

type JustificationResponse = {
  justification?: string;
  topic?: string;
  tone?: string;
  meta?: {
    id?: string;
    source?: string;
    [k: string]: any;
  };
  [k: string]: any;
};

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    console.error("[Dashboard] Non-OK response", {
      url,
      status: res.status,
      contentType,
      bodyPreview: text.slice(0, 400),
    });
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }

  if (!contentType.includes("application/json")) {
    console.error("[Dashboard] Expected JSON but got:", {
      url,
      contentType,
      bodyPreview: text.slice(0, 600),
    });
    throw new Error(`Expected JSON but got ${contentType || "unknown type"} for ${url}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("[Dashboard] JSON parse error", {
      url,
      bodyPreview: text.slice(0, 600),
      error: e,
    });
    throw new Error(`Failed to parse JSON for ${url}`);
  }
}

// Cache dropdown lookups
const DROPDOWN_STALE_TIME_MS = 1000 * 60 * 60 * 24; // 24 hours
const DROPDOWN_CACHE_TIME_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export default function Dashboard() {
  const navigate = useNavigate();
  const { experience } = useExperience();

  const [topic, setTopic] = useState<Topic | "">("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<Tone | "">("");
  const [intensity, setIntensity] = useState<number[]>([3]);

  const [justification, setJustification] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // API base:
  // - Local dev: "" (calls /routes/... and Vite proxy can forward)
  // - Prod: "/proxy" (same-origin -> Cloudflare Worker)
  const apiBase = useMemo(() => {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
    return isLocal ? "" : "/proxy";
  }, []);

  const topicsUrl = useMemo(
    () => `${stripTrailingSlash(apiBase)}/routes/jaas/topics`,
    [apiBase],
  );

  const tonesUrl = useMemo(
    () => `${stripTrailingSlash(apiBase)}/routes/jaas/tones`,
    [apiBase],
  );

  // Option A: GET endpoint that works in Databutton-hosted app
  const jaasUrl = useMemo(
    () => `${stripTrailingSlash(apiBase)}/routes/jaas`,
    [apiBase],
  );

  // Modern ITSM: State loss logic
  useEffect(() => {
    if (experience === "modern" && topic) setTone("");
  }, [topic, experience]);

  useEffect(() => {
    if (experience === "modern") setContext("");
  }, [intensity, experience]);

  const {
    data: topicsData,
    isLoading: topicsLoading,
    isFetching: topicsFetching,
    isError: topicsIsError,
    error: topicsError,
    refetch: refetchTopics,
  } = useQuery({
    queryKey: ["topics", topicsUrl],
    queryFn: () => fetchJson<TopicsResponse>(topicsUrl),
    staleTime: DROPDOWN_STALE_TIME_MS,
    gcTime: DROPDOWN_CACHE_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const {
    data: tonesData,
    isLoading: tonesLoading,
    isFetching: tonesFetching,
    isError: tonesIsError,
    error: tonesError,
    refetch: refetchTones,
  } = useQuery({
    queryKey: ["tones", tonesUrl],
    queryFn: () => fetchJson<TonesResponse>(tonesUrl),
    staleTime: DROPDOWN_STALE_TIME_MS,
    gcTime: DROPDOWN_CACHE_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  useEffect(() => {
    if (topicsIsError && topicsError) console.error("[Dashboard] Topics load failed:", topicsError);
  }, [topicsIsError, topicsError]);

  useEffect(() => {
    if (tonesIsError && tonesError) console.error("[Dashboard] Tones load failed:", tonesError);
  }, [tonesIsError, tonesError]);

  const topics = topicsData?.topics ?? [];
  const tones = tonesData?.tones ?? [];

  // IMPORTANT: Never blank the page. Only show loading inside the card.
  const lookupsReady = !topicsLoading && !tonesLoading;
  const lookupsFailed = topicsIsError || tonesIsError;
  const lookupsWorking = topicsFetching || tonesFetching;

  const canGenerate =
    lookupsReady &&
    !lookupsFailed &&
    !!topic &&
    (experience === "modern" ? true : true); // keep simple; your UX rules can be expanded

  const handleGenerate = async () => {
    if (!lookupsReady) return;

    setIsGenerating(true);
    setJustification(null);
    setMeta(null);

    // Keep your deliberate “processing feel”
    if (experience === "modern") {
      await new Promise((resolve) => setTimeout(resolve, 300));
    } else if (experience === "legacy") {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      const params = new URLSearchParams();
      if (topic) params.set("topic", topic);
      if (context) params.set("context", context);
      if (tone) params.set("tone", tone);
      params.set("intensity", String(intensity[0]));
      params.set("format", "json");

      const url = `${jaasUrl}?${params.toString()}`;
      const data = await fetchJson<JustificationResponse>(url);

      setJustification((data.justification ?? "").trim());
      setMeta(data);

      if (!data.justification) {
        toast.message("Request succeeded, but no justification field was returned.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate justification.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!justification) return;
    try {
      await navigator.clipboard.writeText(justification);
      toast.success("Copied to clipboard");
    } catch (e) {
      toast.error("Copy failed (browser blocked clipboard).");
    }
  };

  return (
    <EnterpriseLayout>
      <TooltipProvider>
        <div className="mx-auto w-full max-w-5xl p-4 md:p-8">
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">
                {getCopy("dashboard.title", experience) ?? "Justification Generator"}
              </h1>

              <div className="flex items-center gap-2">
                {lookupsWorking ? (
                  <Badge variant="secondary" className="gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading
                  </Badge>
                ) : lookupsFailed ? (
                  <Badge variant="destructive" className="gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    API Error
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-2">
                    <Info className="h-3.5 w-3.5" />
                    Ready
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {getCopy("dashboard.subtitle", experience) ??
                "Generate consistent, auditable justifications based on topic, tone, and intensity."}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>
                Pick a topic and tune the output. In Modern mode, tone/context may be restricted by design.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Topic */}
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select
                  value={topic || ""}
                  onValueChange={(v) => setTopic(v as Topic)}
                  disabled={!lookupsReady || lookupsFailed}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={lookupsReady ? "Select a topic" : "Loading topics..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tone</Label>
                  {experience === "modern" ? (
                    <Badge variant="secondary">Auto</Badge>
                  ) : null}
                </div>

                <Select
                  value={tone || ""}
                  onValueChange={(v) => setTone(v as Tone)}
                  disabled={!lookupsReady || lookupsFailed || experience === "modern"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={experience === "modern" ? "Auto-selected" : "Select a tone"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Context */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Context</Label>
                  {experience === "modern" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="cursor-default">
                          Locked
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Modern mode intentionally ignores free-form context.
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>

                <Input
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Optional: a short sentence with relevant details"
                  disabled={experience === "modern"}
                />
              </div>

              {/* Intensity */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Intensity</Label>
                  <Badge variant="secondary">{intensity[0]}</Badge>
                </div>

                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>

              {/* Error panel if lookups fail */}
              {lookupsFailed ? (
                <div className="md:col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <div className="mb-2 flex items-center gap-2 font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load configuration
                  </div>
                  <div className="text-muted-foreground">
                    Topics or tones could not be loaded. Retry the lookups.
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" onClick={() => refetchTopics()}>
                      Retry Topics
                    </Button>
                    <Button variant="outline" onClick={() => refetchTones()}>
                      Retry Tones
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>

            <CardFooter className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-muted-foreground">
                Endpoint: <span className="font-mono">{jaasUrl}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className="min-w-[160px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>

                <Button variant="outline" onClick={() => navigate("/tickets")}>
                  Tickets
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Output */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Output
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    disabled={!justification}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </CardTitle>
                <CardDescription>
                  Generated justification text and metadata.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {!justification && !isGenerating ? (
                  <div className="text-sm text-muted-foreground">
                    Nothing generated yet.
                  </div>
                ) : null}

                {isGenerating ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Working…
                  </div>
                ) : null}

                {justification ? (
                  <div className="mt-3 whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-6">
                    {justification}
                  </div>
                ) : null}

                {meta ? (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                      Metadata
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                      {JSON.stringify(meta, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    </EnterpriseLayout>
  );
}
