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
  MessageSquare,
  HelpCircle,
  Send,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// If you have shadcn Dialog + Textarea components, use them.
// If not, this file still compiles because we implement a lightweight modal + textarea fallback below.
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Textarea } from "@/components/ui/textarea";

// Import Types
import { Topic, Tone } from "types";

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
    headers: { Accept: "application/json" },
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

type FeedbackPayload = {
  email?: string | null;
  comments: string;
  page: string;
  experience: string;
};

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

  // Feedback UI state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [showActualFeedbackForm, setShowActualFeedbackForm] = useState(false);
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackComments, setFeedbackComments] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Safe copy wrapper: NEVER crash the render tree because a copy key is missing.
  const t = (key: string, fallback?: string) => {
    try {
      const val = getCopy(experience as any, key);
      if (typeof val === "string" && val.trim().length > 0) return val;
      return fallback ?? key;
    } catch (e) {
      console.warn("[Dashboard] getCopy failed:", { experience, key, error: e });
      return fallback ?? key;
    }
  };

  // API base:
  // - Local dev: "" (so calls are /routes/... and your Vite proxy can forward)
  // - Prod: "/proxy" (so calls are same-origin and hit your Cloudflare Worker route)
  const apiBase = useMemo(() => {
    const host = window.location.hostname;
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
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

  // Use the GET endpoint that mirrors the Databutton-hosted app call
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
    if (topicsIsError && topicsError) {
      console.error("[Dashboard] Topics load failed:", topicsError);
    }
  }, [topicsIsError, topicsError]);

  useEffect(() => {
    if (tonesIsError && tonesError) {
      console.error("[Dashboard] Tones load failed:", tonesError);
    }
  }, [tonesIsError, tonesError]);

  const topics = topicsData?.topics ?? [];
  const tones = tonesData?.tones ?? [];

  const lookupsReady = !topicsLoading && !tonesLoading;
  const lookupsFailed = topicsIsError || tonesIsError;

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
      const params = new URLSearchParams();
      if (topic) params.set("topic", topic);
      if (context) params.set("context", context);
      if (tone) params.set("tone", tone);
      params.set("intensity", String(intensity[0]));
      params.set("format", "json");

      const url = `${jaasUrl}?${params.toString()}`;
      const data = await fetchJson<JustificationResponse>(url);

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

  const openFeedback = () => {
    setFeedbackOpen(true);
    setShowActualFeedbackForm(false);
    setFeedbackEmail("");
    setFeedbackComments("");
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
    setShowActualFeedbackForm(false);
  };

  async function submitFeedback() {
    const comments = feedbackComments.trim();
    const email = feedbackEmail.trim();

    if (!comments) {
      toast.error("Please add a comment. Or don’t. But then nothing happens.");
      return;
    }

    setFeedbackSubmitting(true);
    try {
      const payload: FeedbackPayload = {
        email: email.length ? email : null,
        comments,
        page: window.location.pathname || "/",
        experience: String(experience || "unknown"),
      };

      const res = await fetch("/feedback", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-PJ-Source": "ui",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        console.error("[Feedback] Non-OK response", {
          status: res.status,
          contentType,
          bodyPreview: text.slice(0, 1200),
        });
        toast.error("Feedback failed to submit. Classic.");
        return;
      }

      if (contentType.includes("application/json")) {
        try {
          JSON.parse(text);
        } catch {
          // ignore parse errors, not critical
        }
      }

      toast.success("Feedback submitted. It will be reviewed in 3–9 business centuries.");
      closeFeedback();
    } catch (e) {
      console.error("[Feedback] Submit failed:", e);
      toast.error("Feedback submission failed. Probably budget.");
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  return (
    <EnterpriseLayout>
      <TooltipProvider>
        {/* Lightweight modal overlay for Feedback */}
        {feedbackOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
              // click outside closes
              if (e.target === e.currentTarget) closeFeedback();
            }}
          >
            <div className="w-full max-w-2xl rounded-xl border bg-background shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <div className="font-semibold">Help Center</div>
                </div>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={closeFeedback}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-5 space-y-4">
                {!showActualFeedbackForm ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Before you submit anything, please review these highly relevant FAQs.
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg border p-3">
                        <div className="text-sm font-medium">Why is my request taking so long?</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Because it is currently pending.
                        </div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-sm font-medium">Can I expedite this?</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Absolutely. Please submit the same request again in all caps.
                        </div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-sm font-medium">I need help right now.</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Great. This FAQ acknowledges your urgency.
                        </div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-sm font-medium">Where can I find more documentation?</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          In the documentation repository. (Not linked.)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-muted-foreground">
                        If this is not your problem, it’s probably something else.
                      </div>
                      <Button
                        onClick={() => setShowActualFeedbackForm(true)}
                        className="bg-blue-700 hover:bg-blue-800"
                      >
                        It’s something else
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Fine. You found the actual form.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fb-email">Email (optional)</Label>
                        <Input
                          id="fb-email"
                          placeholder="you@company.com"
                          value={feedbackEmail}
                          onChange={(e) => setFeedbackEmail(e.target.value)}
                          autoComplete="email"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Only used if you want a response. Or if I panic.
                        </p>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="fb-comments">Comments</Label>
                        <textarea
                          id="fb-comments"
                          className="min-h-[140px] w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="Describe the issue, idea, or grievance."
                          value={feedbackComments}
                          onChange={(e) => setFeedbackComments(e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Be specific. Or don’t. I’ll still log it.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowActualFeedbackForm(false)}
                        disabled={feedbackSubmitting}
                      >
                        Back to unhelpful FAQ
                      </Button>

                      <Button
                        onClick={submitFeedback}
                        disabled={feedbackSubmitting}
                        className="bg-blue-700 hover:bg-blue-800"
                      >
                        {feedbackSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit feedback
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {t("pending_label", "Pending")}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{t("pending_label", "Pending")}</TooltipContent>
                  </Tooltip>
                )}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>{t("tooltip_text", "Info")}</TooltipContent>
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
                {t("wait_time_label", "Wait time")}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{t("wait_time_label", "Wait time")}</TooltipContent>
                  </Tooltip>
                )}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>{t("tooltip_text", "Info")}</TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">183 Days</div>
              <p className="text-xs text-muted-foreground">Within acceptable limits</p>
            </CardContent>
          </Card>

          <Card
            className="card cursor-pointer hover:bg-slate-50 transition-colors dark:hover:bg-slate-900"
            onClick={() => navigate("/tickets/approved")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {t("approved_label", "Approved")}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{t("approved_label", "Approved")}</TooltipContent>
                  </Tooltip>
                )}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>{t("tooltip_text", "Info")}</TooltipContent>
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
                {t("uptime_label", "Uptime")}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{t("uptime_label", "Uptime")}</TooltipContent>
                  </Tooltip>
                )}
                {experience === "modern" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>{t("tooltip_text", "Info")}</TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.999%</div>
              <p className="text-xs text-muted-foreground">No incidents reported</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-4 space-y-6">
            <Card className="card border-t-4 border-t-blue-600 shadow-sm">
              <CardHeader>
                <CardTitle>Justification Generator</CardTitle>
                <CardDescription>
                  Select your parameters to generate a compliant excuse for your delay or request.
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
                    <div className="font-semibold">Lookup data failed to load</div>
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
                      {t("topic_label", "Topic")}
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
                            topicsLoading ? "Loading topics..." : "Select a topic..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">Generic / Any</SelectItem>
                        {topics.map((tt: string) => (
                          <SelectItem key={tt} value={tt}>
                            {tt.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                        {!topicsLoading && topics.length === 0 && !topicsIsError && (
                          <div className="px-3 py-2 text-xs text-muted-foreground">
                            No topics returned
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone" className="flex items-center gap-2">
                      {t("tone_label", "Tone")}
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
                          placeholder={tonesLoading ? "Loading tones..." : "Select a tone..."}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((tt: string) => (
                          <SelectItem key={tt} value={tt}>
                            {tt.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                        {!tonesLoading && tones.length === 0 && !tonesIsError && (
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
                    placeholder={t("context_placeholder", "Add optional context…")}
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
                      Intensity Level: {intensity[0]}
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
                    t("generate_btn", "Generate")
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
                        {t("secondary_action", "Secondary")}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{t("secondary_tooltip", "Not available")}</TooltipContent>
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
            {/* Feedback / Help card */}
            <Card className="card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Need help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  If something is broken, confusing, or suspiciously working… tell me.
                </div>
                <Button
                  onClick={openFeedback}
                  className="w-full bg-blue-700 hover:bg-blue-800"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Feedback
                </Button>
                <div className="text-[11px] text-muted-foreground">
                  This button may or may not lead to help.
                </div>
              </CardContent>
            </Card>

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
                            : t("ticket_update", "Ticket updated")}
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
                  {t("blocker_title", "Top blockers")}
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
          {t("footer_note", "pendingjustification.com")}
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
