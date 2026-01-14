import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { TICKET_DATA, Ticket } from "utils/ticket-data";

export default function Tickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);

    useEffect(() => {
        // Randomly select 3-6 tickets
        const count = Math.floor(Math.random() * 4) + 3; // 3 to 6
        const shuffled = [...TICKET_DATA].sort(() => 0.5 - Math.random());
        setTickets(shuffled.slice(0, count));
    }, []);

    return (
        <EnterpriseLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
                    <p className="text-muted-foreground">Manage and track your hopeless requests.</p>
                </div>

                <div className="space-y-6">
                    {tickets.map((ticket) => (
                        <Card key={ticket.id} className="overflow-hidden">
                            <CardHeader className="bg-slate-100 dark:bg-slate-800 py-3 px-6 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
                                    <span className="font-medium">{ticket.summary}</span>
                                </div>
                                <Badge variant={ticket.status === "Under Review" ? "secondary" : "destructive"}>
                                    {ticket.status}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-3 space-y-6">
                                         <div className="space-y-4">
                                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Activity Log</h3>
                                            <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                                {ticket.comments.map((comment, idx) => (
                                                    <div key={idx} className="relative">
                                                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-semibold text-sm">{comment.user}</span>
                                                            <span className="text-xs text-muted-foreground">{comment.date}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded border">
                                                            {comment.text}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                         </div>
                                    </div>
                                    <div className="space-y-4 text-sm">
                                        <div>
                                            <span className="block text-muted-foreground text-xs font-semibold uppercase">Reporter</span>
                                            <span>{ticket.reporter}</span>
                                        </div>
                                        <div>
                                            <span className="block text-muted-foreground text-xs font-semibold uppercase">Created</span>
                                            <span>{ticket.created}</span>
                                        </div>
                                        <div>
                                            <span className="block text-muted-foreground text-xs font-semibold uppercase">Updated</span>
                                            <span>{ticket.updated}</span>
                                        </div>
                                        <div>
                                            <span className="block text-muted-foreground text-xs font-semibold uppercase">Priority</span>
                                            <span className="text-yellow-600 font-medium">Low (Default)</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    
                    <div className="flex justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground bg-slate-50/50">
                        <p>End of list. Older tickets have been archived to /dev/null for performance reasons.</p>
                    </div>
                </div>
            </div>
        </EnterpriseLayout>
    );
}
