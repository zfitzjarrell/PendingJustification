import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { toast } from "sonner";
import {
  Loader2,
  Copy,
  AlertCircle,
  Clock,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import Types
import { Topic, Tone, Format } from "types";

// Import Experience Engine
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
    headers: {
      Accept: "application/json",
    },
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
    throw new Error(
      `Expected JSON but got ${contentType || "unknown type"} for ${url}`,
    );
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

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    console.error("[Dashboard] Non-OK response", {
      url,
      status: res.status,
      contentType,
      bodyPreview: text.slice(0, 800),
    });
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }

  if (!contentType.includes("application/json")) {
    console.error("[Dashboard] Expected JSON but got:", {
      url,
      contentType,
      bodyPreview: text.slice(0, 1200),
    });
    throw new Error(
      `Expected JSON but got ${contentType || "unknown type"} for ${url}`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("[Dashboard] JSON parse error", {
      url,
      bodyPreview: text.slice(0, 1200),
      error: e,
    });
    throw new Error(`Failed to parse JSON for ${url}`);
  }
}

// Cache dropdown lookups so they don’t “pop in” late every single visit.
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
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  // API base:
  // - Local dev: "" (so calls are /routes/... and your Vite proxy can forward)
  // - Prod: "/proxy" (so calls are same-origin and hit your Cloudflare Worker route)
  const apiBase = useMemo(() => {
    const host = window.location.hostname;
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
    const prodProxyPrefix = "/proxy";
    return isLocal ? "" : prodProxyPrefix;
  }, []);

  const topicsUrl = useMemo(
    () => `${stripTrailingSlash(apiBase)}/routes/jaas/topics`,
    [apiBase],
  );

  const tonesUrl = useMemo(
    () => `${stripTrailingSlash(apiBase)}/routes/jaas/tones`,
    [apiBase],
  );

  const justificationUrl = useMemo(
    () => `${stripTrailingSlash(apiBase)}/routes/jaas/justification`,
    [apiBase],
  );

  // Modern ITSM: State loss logic
  useEffect(() => {
    if (experience === "modern" && topic) {
      setTone("");
    }
  }, [topic, experience]);

  useEffect(() => {
    if (experience === "modern") {
      setContext("");
    }
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
    if (topicsIsError && topicsError) {
      console.error("[Dashboard] Topics load failed:", topicsError);
    }
  }, [topicsIsError, topicsError]);

  useEffect(() => {
    if (tonesIsError && tonesError) {
      console.error("[Dashboard] Tones load failed:", tonesError);
    }
  }, [tonesIsError, tonesError]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setJustification(null);
    setMeta(null);

    if (experience === "modern") {
      await new Promise((resolve) => setTimeout(resolve, 300));
    } else if (experience === "legacy") {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      // IMPORTANT:
      // Use the same-origin proxy for the POST too.
      // This avoids brain-client base URL drift and matches how topics/tones are loaded.
      const payload = {
        topic: topic || undefined,
        context: context || undefined,
        tone: tone || undefined,
        intensity: intensity[0],
        format: Format.Json,
      };

      const data = await postJson<JustificationResponse>(justificationUrl, payload);

      setJustification(data.justification ?? "");
      setMeta(data);
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to generate justification. The system might be down for maintenance (indefinitely).",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (justification) {
      navigator.clipboard.writeText(justification);
      toast.success("Copied to clipboard");
    }
  };

  const LegacyStatus = [
    "PENDING_SYNC",
    "AWAITING_BACKEND",
    "STATE_UNKNOWN",
    "REC_MODIFIED",
  ];

  const topics = topicsData?.topics ?? [];
  const tones = tonesData?.tones ?? [];

  const lookupsReady = !topicsLoading && !tonesLoading;
  const lookupsFailed = topicsIsError || tonesIsError;

  return (
    <EnterpriseLayout>
      <TooltipProvider>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getCopy(experience, "pending_label")}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {getCopy(experience, "pending_label")}
                    </TooltipContent>
                  </Tooltip>
                )}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {getCopy(experience, "tooltip_text")}
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4,892</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getCopy(experience, "wait_time_label")}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {getCopy(experience, "wait_time_label")}
                    </TooltipContent>
                  </Tooltip>
                )}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {getCopy(experience, "tooltip_text")}
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">183 Days</div>
              <p className="text-xs text-muted-foreground">
                Within acceptable limits
              </p>
            </CardContent>
          </Card>

          <Card
            className="card cursor-pointer hover:bg-slate-50 transition-colors dark:hover:bg-slate-900"
            onClick={() => navigate("/tickets/approved")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getCopy(experience, "approved_label")}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {getCopy(experience, "approved_label")}
                    </TooltipContent>
                  </Tooltip>
                )}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {getCopy(experience, "tooltip_text")}
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Target met</p>
            </CardContent>
          </Card>

          <Card className="card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getCopy(experience, "uptime_label")}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {getCopy(experience, "uptime_label")}
                    </TooltipContent>
                  </Tooltip>
                )}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {getCopy(experience, "tooltip_text")}
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.999%</div>
              <p className="text-xs text-muted-foreground">
                No incidents reported
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-4 space-y-6">
            <Card className="card border-t-4 border-t-blue-600 shadow-sm">
              <CardHeader>
                {experience === "classic" && (
                  <div className="flex gap-1 mb-4 border-b border-slate-300">
                    <div className="bg-white border border-slate-300 border-b-0 px-4 py-1 text-xs font-bold relative top-[1px] z-10">
                      General
                    </div>
                    <div className="bg-slate-100 border border-slate-300 border-b-0 px-4 py-1 text-xs text-slate-500">
                      Audit
                    </div>
                    <div className="bg-slate-100 border border-slate-300 border-b-0 px-4 py-1 text-xs text-slate-500">
                      Relations
                    </div>
                  </div>
                )}
                <CardTitle>Justification Generator</CardTitle>
                <CardDescription>
                  Select your parameters to generate a compliant excuse for your
                  delay or request.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {!lookupsReady && !lookupsFailed && (
                  <div className="rounded-md border bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Loading dropdowns…</span>
                      <span className="text-muted-foreground">
                        {topicsFetching || tonesFetching ? "(syncing)" : ""}
                      </span>
                    </div>
                  </div>
                )}

                {lookupsFailed && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <div className="font-semibold">
                      Lookup data failed to load
                    </div>
                    <div className="mt-1">
                      Open DevTools Console to see the response body preview.
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8"
                        onClick={() => {
                          refetchTopics();
                          refetchTones();
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="flex items-center gap-2">
                      {getCopy(experience, "topic_label")}
                      {experience === "modern" && (
                        <Info className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Label>

                    <Select
                      value={topic}
                      onValueChange={(val) => setTopic(val as Topic)}
                      disabled={!lookupsReady || lookupsFailed}
                    >
                      <SelectTrigger id="topic">
                        <SelectValue
                          placeholder={
                            topicsLoading
                              ? "Loading topics..."
                              : "Select a topic..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">Generic / Any</SelectItem>
                        {topics.map((t: string) => (
                          <SelectItem key={t} value={t}>
                            {t
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                        {!topicsLoading &&
                          topics.length === 0 &&
                          !topicsIsError && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                              No topics returned
                            </div>
                          )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone" className="flex items-center gap-2">
                      {getCopy(experience, "tone_label")}
                      {experience === "modern" && (
                        <Info className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Label>

                    <Select
                      value={tone}
                      onValueChange={(val) => setTone(val as Tone)}
                      disabled={!lookupsReady || lookupsFailed}
                    >
                      <SelectTrigger id="tone">
                        <SelectValue
                          placeholder={
                            tonesLoading ? "Loading tones..." : "Select a tone..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((t: string) => (
                          <SelectItem key={t} value={t}>
                            {t
                              .replace("-", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                        {!tonesLoading &&
                          tones.length === 0 &&
                          !tonesIsError && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                              No tones returned
                            </div>
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context" className="flex items-center gap-2">
                    Context (Optional)
                    {experience === "modern" && (
                      <Info className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Label>
                  <Input
                    id="context"
                    placeholder={getCopy(experience, "context_placeholder")}
                    value={context}
                    onChange={(e) =>
                      setContext(
                        experience === "legacy"
                          ? e.target.value.toUpperCase()
                          : e.target.value,
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {experience === "amateur"
                      ? "Please provide additional details if applicable. If unsure, leave blank."
                      : "Provide specific details to personalize the rejection."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="flex items-center gap-2">
                      Intensity Level: {intensity}
                      {experience === "modern" && (
                        <Info className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {intensity[0] === 1
                        ? "Polite"
                        : intensity[0] === 5
                          ? "Career Limiting"
                          : "Standard"}
                    </span>
                  </div>

                  <Slider
                    value={intensity}
                    onValueChange={setIntensity}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>

              <CardFooter className="gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full bg-blue-700 hover:bg-blue-800 btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    getCopy(experience, "generate_btn")
                  )}
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        variant="outline"
                        disabled={experience !== "classic"}
                        className={`w-full btn ${
                          experience === "legacy" || experience === "modern"
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        } ${
                          experience === "classic"
                            ? "text-primary border-primary bg-background hover:bg-slate-100"
                            : ""
                        }`}
                      >
                        {getCopy(experience, "secondary_action")}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {getCopy(experience, "secondary_tooltip")}
                  </TooltipContent>
                </Tooltip>
              </CardFooter>
            </Card>

            {justification && (
              <Card className="card bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Generated Response</CardTitle>
                    <div className="flex gap-2">
                      {meta?.topic && <Badge variant="outline">{meta.topic}</Badge>}
                      {meta?.tone && <Badge variant="secondary">{meta.tone}</Badge>}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="p-4 bg-white dark:bg-black rounded-md border shadow-inner">
                    <p className="text-lg font-medium leading-relaxed font-serif text-slate-800 dark:text-slate-200">
                      "{justification}"
                    </p>
                  </div>

                  {meta && (
                    <div className="mt-4 text-xs text-muted-foreground flex gap-4">
                      <span>
                        ID: <span className="font-mono">{meta.meta?.id}</span>
                      </span>
                      <span>Source: {meta.meta?.source}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={copyToClipboard}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div className="md:col-span-3 space-y-6">
            <Card className="card">
              <CardHeader>
                <CardTitle className="text-base">Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm pb-3 border-b last:border-0 last:pb-0"
                    >
                      <div className="h-2 w-2 mt-1.5 rounded-full bg-yellow-500 shrink-0" />
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          Ticket #{10234 + i} Update
                        </p>
                        <p className="text-slate-500 text-xs">
                          {experience === "legacy"
                            ? LegacyStatus[i % LegacyStatus.length]
                            : getCopy(experience, "ticket_update")}
                        </p>
                        <p className="text-slate-400 text-[10px] mt-1">
                          {i * 12} mins ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="text-base">
                  {getCopy(experience, "blocker_title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Alignment Issues</span>
                      <span>84%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 w-[84%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Budget Constraints</span>
                      <span>12%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-[12%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Mercury Retrograde</span>
                      <span>4%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[4%]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-muted-foreground font-mono">
          {getCopy(experience, "footer_note")}
        </div>
      </TooltipProvider>
    </EnterpriseLayout>
  );
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
