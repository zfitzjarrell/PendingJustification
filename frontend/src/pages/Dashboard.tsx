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

  // Option A: use the GET endpoint that actually works in the Databutton app
  const jaasUrl = useMemo(
    () => `${stripTrailingSlash(apiBase)}/routes/jaas`,
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
      // Build query params for the GET endpoint
      const params = new URLSearchParams();
      if (topic) params.set("topic", topic);
      if (context) params.set("context", context);
      if (tone) params.set("tone", tone);
      params.set("intensity", String(intensity[0]));
      params.set("format", "json"); // matches your working Databutton call

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

  const topics = topicsData?.topics ?? [];
  const tones = tonesData?.tones ?? [];

  const lookupsReady = !topicsLoading && !tonesLoading;
  const lookupsFailed = topicsIsError || tonesIsError;

  return (
    <EnterpriseLayout>
      {/* rest of your component unchanged */}
      <TooltipProvider>
        {/* ... */}
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
