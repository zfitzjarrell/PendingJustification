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

export default function Api() {
  return (
    <EnterpriseLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">API Reference</h1>
          <p className="text-muted-foreground">
            Integrate the Justification-as-a-Service (JaaS) engine directly into your workflow.
          </p>
        </div>

        <Tabs defaultValue="v1" className="w-full">
          <TabsList>
            <TabsTrigger value="v1">v1.0 (Stable)</TabsTrigger>
            <TabsTrigger value="beta">Beta (Unstable)</TabsTrigger>
          </TabsList>

          {/* ===================== */}
          {/* v1 – STABLE */}
          {/* ===================== */}
          <TabsContent value="v1" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="font-mono text-lg">
                      GET /proxy/routes/jaas
                    </CardTitle>
                    <CardDescription>
                      Generates a justification using query-based parameters.
                    </CardDescription>
                  </div>
                  <Badge>Public</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Parameters */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Query Parameters</h3>
                  <div className="border rounded-md divide-y">
                    <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                      <div className="font-mono font-semibold">topic</div>
                      <div className="text-muted-foreground">string</div>
                      <div className="text-muted-foreground">Optional</div>
                      <div className="text-muted-foreground">
                        Category (e.g. <code>budget</code>, <code>staffing</code>)
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                      <div className="font-mono font-semibold">tone</div>
                      <div className="text-muted-foreground">string</div>
                      <div className="text-muted-foreground">Optional</div>
                      <div className="text-muted-foreground">
                        Style of response (e.g. <code>snarky</code>, <code>corporate</code>)
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                      <div className="font-mono font-semibold">intensity</div>
                      <div className="text-muted-foreground">integer</div>
                      <div className="text-muted-foreground">Default: 3</div>
                      <div className="text-muted-foreground">
                        Scale 1–5 (polite → career-limiting)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example Request */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Example Request</h3>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <span className="text-purple-400">curl.exe</span>{" "}
                    <span className="text-blue-400">-X</span>{" "}
                    <span className="text-green-400">GET</span>{" "}
                    <span className="text-green-400">
                      "https://pendingjustification.com/proxy/routes/jaas?topic=budget&amp;tone=snarky&amp;intensity=3"
                    </span>
                    <br />
                    <span className="text-blue-400">-H</span>{" "}
                    <span className="text-green-400">"Accept: application/json"</span>
                  </div>
                </div>

                {/* Example Response */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Example Response</h3>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
{`{
  "justification": "Due to budget constraints and shifting priorities, this request cannot be approved at this time.",
  "topic": "budget",
  "tone": "snarky",
  "meta": {
    "source": "jaas",
    "id": "req-8f3a21"
  }
}`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== */}
          {/* BETA */}
          {/* ===================== */}
          <TabsContent value="beta">
            <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Additional endpoints pending justification.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </EnterpriseLayout>
  );
}
