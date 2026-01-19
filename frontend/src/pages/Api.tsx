import { useMemo, useState } from "react";
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

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export default function Api() {
  // Keep consistent with your app: always go through the Worker proxy path.
  const proxyBase = useMemo(() => "/proxy", []);

  // These are only used to generate the example URL shown in docs (no testing).
  const [topic] = useState("budget");
  const [tone] = useState("snarky");
  const [intensity] = useState(3);

  const endpointPath = "/routes/jaas";

  const exampleUrl = useMemo(() => {
    const params = new URLSearchParams({
      topic: topic || "budget",
      tone: tone || "snarky",
      intensity: String(clampInt(intensity, 1, 5)),
    });
    return `https://pendingjustification.com${proxyBase}${endpointPath}?${params.toString()}`;
  }, [topic, tone, intensity, proxyBase]);

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
                      GET {proxyBase}
                      {endpointPath}
                    </CardTitle>
                    <CardDescription>
                      Same-origin endpoint routed through your Cloudflare Worker
                      proxy. Use this from browsers and scripts.
                    </CardDescription>
                  </div>
                  <Badge>Public</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Query parameters</h3>
                  <div className="rounded-md border p-4 space-y-2 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-mono">topic</div>
                      <div className="text-muted-foreground">
                        Category of request. Example: budget, staffing,
                        timeline, security_exception
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-mono">tone</div>
                      <div className="text-muted-foreground">
                        Output style. Example: snarky, absurd, deadpan,
                        corporate-parody, unhinged
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-mono">intensity</div>
                      <div className="text-muted-foreground">
                        1 to 5. Higher = more aggressive / stylized.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">
                    Example (PowerShell friendly)
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
                  <h3 className="font-semibold text-sm">Example response</h3>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
{`{
  "justification": "Sorry, the expense report is blocked because read the manual.",
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
          </TabsContent>

          <TabsContent value="beta">
            <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Documentation pending.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </EnterpriseLayout>
  );
}
