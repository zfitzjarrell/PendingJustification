import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Api() {
    return (
        <EnterpriseLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">API Reference</h1>
                    <p className="text-muted-foreground">Integrate our justification engine directly into your workflow.</p>
                </div>

                <Tabs defaultValue="v1" className="w-full">
                    <TabsList>
                        <TabsTrigger value="v1">v1.0 (Stable)</TabsTrigger>
                        <TabsTrigger value="beta">Beta (Unstable)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="v1" className="space-y-6 mt-6">
                        
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="font-mono text-lg">GET /api/v1/justify</CardTitle>
                                        <CardDescription>Generates a justification based on provided parameters.</CardDescription>
                                    </div>
                                    <Badge>Public</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm">Parameters</h3>
                                    <div className="border rounded-md divide-y">
                                        <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                                            <div className="font-mono font-semibold">topic</div>
                                            <div className="text-muted-foreground">string</div>
                                            <div className="text-muted-foreground">Optional</div>
                                            <div className="text-muted-foreground">Category (e.g., 'budget')</div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                                            <div className="font-mono font-semibold">tone</div>
                                            <div className="text-muted-foreground">string</div>
                                            <div className="text-muted-foreground">Optional</div>
                                            <div className="text-muted-foreground">Tone (e.g., 'corporate')</div>
                                        </div>
                                         <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                                            <div className="font-mono font-semibold">intensity</div>
                                            <div className="text-muted-foreground">integer</div>
                                            <div className="text-muted-foreground">Default: 3</div>
                                            <div className="text-muted-foreground">Level 1-5</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm">Example Request</h3>
                                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
                                        <span className="text-purple-400">curl</span> https://pendingjustification.com/api/v1/justify \
                                        <br/>&nbsp;&nbsp;<span className="text-blue-400">-d</span> <span className="text-green-400">"topic=change_request&tone=corporate"</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm">Example Response</h3>
                                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
{`{
  "justification": "We need to align on alignment before proceeding.",
  "meta": {
    "id": "corp-001",
    "latency": "200ms"
  }
}`}
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
