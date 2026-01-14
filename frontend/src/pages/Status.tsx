import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, AlertTriangle, Info, Clock, AlertCircle } from "lucide-react";

export default function Status() {
    const services = [
        { 
            name: "Justification Engine", 
            status: "Operational", 
            uptime: "99.999%",
            color: "bg-green-500",
            textColor: "text-green-600"
        },
        { 
            name: "Excuse Generator", 
            status: "Operational", 
            uptime: "100.003%",
            color: "bg-emerald-500", // Slight inconsistency
            textColor: "text-emerald-600"
        },
        { 
            name: "Alignment API", 
            status: "Degraded Performance", 
            uptime: "12.000%", 
            note: "Alignment is hard",
            color: "bg-yellow-500",
            textColor: "text-yellow-600",
            tooltip: "Service is functioning within expected organizational constraints.",
            subtext: "Measured subjectively"
        },
        { 
            name: "Bureaucracy Layer", 
            status: "Operational", 
            uptime: "99.997%",
            color: "bg-amber-500", // Amber but operational
            textColor: "text-green-600" // Text says green/operational
        },
        { 
            name: "Hope Crusher", 
            status: "Operational", 
            uptime: "99.999%",
            color: "bg-green-500",
            textColor: "text-green-600"
        }
    ];

    return (
        <EnterpriseLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                     <div className="inline-flex items-center justify-center p-4 bg-green-100 text-green-800 rounded-full mb-4">
                        <CheckCircle2 className="h-8 w-8 mr-2" />
                        <span className="text-xl font-bold">All Systems Operational</span>
                     </div>
                     
                     <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last checked: Just now</span>
                        <span>Status updated: 3 minutes ago</span>
                        <span>Next update: TBD</span>
                     </div>

                     <p className="text-muted-foreground text-sm">
                        Incidents reported in the last 90 days: 0. 
                        Incidents ignored in the last 90 days: 4,129.
                     </p>
                </div>

                <div className="grid gap-4">
                    <TooltipProvider>
                        {services.map((service) => (
                            <div key={service.name} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-lg shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={`h-3 w-3 ${service.color} rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{service.name}</h3>
                                            {service.tooltip && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{service.tooltip}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        {service.note && <p className="text-xs text-yellow-600 dark:text-yellow-400">{service.note}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`font-mono font-medium ${service.textColor}`}>
                                        {service.status}
                                    </span>
                                    <div className="flex flex-col items-end">
                                        <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                                        {service.subtext && <p className="text-[10px] text-muted-foreground italic">{service.subtext}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </TooltipProvider>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Scheduled Maintenance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4">Justifications may experience delays during the following events:</p>
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                <li>Quarterly planning sessions (2 weeks ± 6 weeks)</li>
                                <li>Re-orgs (Ongoing, Phase 3 of Phase 2)</li>
                                <li>Leadership offsites in Bali (Timezone dependent)</li>
                                <li>Mercury retrograde (As per astrology team)</li>
                                <li>Whenever the printer is jammed (Unpredictable)</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="history" className="border px-4 rounded-lg bg-white dark:bg-slate-900">
                            <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline hover:text-foreground">
                                Past Incidents
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground italic">
                                No incidents meet the criteria for reporting.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </EnterpriseLayout>
    );
}
