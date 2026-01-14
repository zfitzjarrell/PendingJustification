import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Docs() {
  const definitions = [
    { term: "Justification", def: "A narrative explanation provided in support of a request." },
    { term: "Alignment", def: "General agreement with current priorities." },
    { term: "Priority", def: "An attribute that does not affect processing order." },
    { term: "Request", def: "A submission seeking approval, review, consideration, or acknowledgment." },
    { term: "Alignment (Recursive)", def: "The degree to which a request is consistent with current priorities, initiatives, and interpretations thereof." },
    { term: "Priority (Administrative)", def: "A classification applied to a request for reporting purposes. Priority does not affect processing order or outcome." },
    { term: "Approval", def: "A state indicating that a request has been reviewed and is no longer under active consideration." },
    { term: "Under Review", def: "A status indicating that a request is in progress, pending, or awaiting further review." },
    { term: "Pending Justification", def: "A status indicating that additional context, clarification, or alignment is required before further action can be taken." },
    { term: "Escalation", def: "The act of formally requesting expedited review. Escalation may result in additional review." },
    { term: "Reviewer", def: "An individual or group responsible for evaluating requests in accordance with this documentation." },
    { term: "Stakeholder", def: "Any individual, team, or function with an interest in the outcome of a request." },
    { term: "Impact", def: "The anticipated effect of a request if approved, implemented, or otherwise acknowledged." },
    { term: "Business Need", def: "A rationale describing why a request may be beneficial at some point in the future." },
    { term: "Constraints", def: "Limitations related to budget, resources, alignment, timing, or policy." },
    { term: "Exception", def: "A deviation from standard process requiring prior approval." },
    { term: "Prior Approval", def: "Approval required before an exception may be requested." },
    { term: "Documentation", def: "Records, narratives, or artifacts associated with a request, including this documentation." },
    { term: "Review Cycle", def: "The period during which a request is evaluated. Review cycles may vary." },
    { term: "Completion", def: "The point at which a request is closed, resolved, withdrawn, or otherwise no longer active." },
    { term: "Closure", def: "The administrative action taken to indicate completion." },
    { term: "Audit", def: "A review conducted to ensure adherence to process." },
    { term: "Audit Readiness", def: "The state of being prepared for an audit." },
    { term: "Resolution", def: "An outcome resulting from review, escalation, or administrative action." },
    { term: "Deprioritization", def: "The act of reducing the urgency or visibility of a request." },
    { term: "Operational Constraints", def: "Conditions that limit the organization’s ability to act at the current time." },
    { term: "Next Steps", def: "Future actions that may be identified during review." },
    { term: "Future State", def: "The anticipated condition of a request after completion of next steps." },
    { term: "Out of Scope", def: "A classification indicating that a request does not meet current criteria for consideration." },
    { term: "Re-evaluation", def: "A subsequent review conducted following changes in context, alignment, or documentation." }
  ];

  return (
    <EnterpriseLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Compliance & Policy Documentation</h1>
          <p className="text-muted-foreground text-lg">Standard Operating Procedures for Justification Management.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Justification Service Level Agreements (SLAs)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Initial Review</TableHead>
                    <TableHead>Final Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Standard Request</TableCell>
                    <TableCell>5-7 Business Quarters</TableCell>
                    <TableCell>Upon Retirement</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Emergency / Urgent</TableCell>
                    <TableCell>Immediately Rejected</TableCell>
                    <TableCell>N/A</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">C-Suite Request</TableCell>
                    <TableCell>Yesterday</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-4 italic">
                * Additional SLA conditions may apply based on organizational context.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-loose text-slate-700 dark:text-slate-300">
              <p>
                All justifications must demonstrate clear alignment with the <span className="font-bold">Strategic North Star Paradigm</span>.
                Requests failing to leverage synergies will be deprioritized.
              </p>
              <h3 className="font-bold text-base mt-4">Key Pillars of Acceptance <span className="font-normal text-muted-foreground ml-1">(Exceptions require prior approval.)</span>:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-semibold">Cost Neutrality:</span> The request must cost $0 and generate revenue immediately.</li>
                <li><span className="font-semibold">Innovation:</span> It must be innovative but also proven technology used by everyone else for 10 years.</li>
                <li><span className="font-semibold">Bandwidth:</span> You must have infinite bandwidth to support this yourself.</li>
                <li><span className="font-semibold">Documentation:</span> All justifications must be documented in accordance with this documentation.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escalation Process</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-600">
                  <h4 className="font-bold flex items-center gap-2">
                    Note on Escalations
                  </h4>
                  <p className="mt-2 text-sm">
                    Escalation is strongly discouraged. Escalating a ticket will automatically reset its age to 0 and notify your manager of your "impatience".
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    Repeated escalations may result in additional review.
                  </p>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Definitions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="definitions">
                  <AccordionTrigger>Expand Definitions Glossary</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 pt-4">
                      {definitions.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 border-b last:border-0 pb-3 last:pb-0">
                          <span className="font-semibold text-sm">{item.term}</span>
                          <span className="text-sm text-muted-foreground">{item.def}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-6 italic">
                      Definitions are subject to change without notice.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retention Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Justifications are retained in accordance with the organization’s data retention policy. This policy is currently under review.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </EnterpriseLayout>
  );
}
