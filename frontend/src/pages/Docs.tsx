import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Docs() {
  const definitions = [
    {
      term: "Justification",
      def: "A narrative explanation created to give the appearance that a decision was derived from logic rather than momentum, habit, or vibes.",
    },
    {
      term: "Alignment",
      def: "A temporary state in which no one actively disagrees, often because the meeting ended.",
    },
    {
      term: "Priority",
      def: "An attribute that does not affect processing order.",
    },
    {
      term: "Request",
      def: "A formal submission that initiates a process, conversation, or silence.",
    },
    {
      term: "Alignment (Recursive)",
      def: "The ongoing effort to ensure a request aligns with priorities that are themselves pending alignment.",
    },
    {
      term: "Priority (Administrative)",
      def: "A classification applied to a request for reporting purposes. Priority does not affect processing order or outcome.",
    },
    {
      term: "Approval",
      def: "A state indicating that a request has been reviewed and is no longer under active consideration.",
    },
    {
      term: "Under Review",
      def: "A status indicating that a request exists somewhere within the system and is therefore not allowed to progress.",
    },
    {
      term: "Pending Justification",
      def: "A status indicating that the request is missing something unspecified that will become clear only after it is provided.",
    },
    {
      term: "Escalation",
      def: "The act of formally requesting expedited review. Escalation may result in additional review.",
    },
    {
      term: "Reviewer",
      def: "An individual or group tasked with ensuring the request conforms to expectations that may not be documented or consistent.",
    },
    {
      term: "Stakeholder",
      def: "Anyone who might later ask why they were not consulted.",
    },
    {
      term: "Impact",
      def: "A speculative description of outcomes that will not be revisited once the request is closed.",
    },
    {
      term: "Business Need",
      def: "A reason something should happen eventually, ideally after current priorities change.",
    },
    {
      term: "Constraints",
      def: "Widely cited limitations that shift depending on who is asking.",
    },
    {
      term: "Exception",
      def: "A special case requiring confirmation that the process can, in fact, be ignored.",
    },
    {
      term: "Prior Approval",
      def: "Approval required to request approval.",
    },
    {
      term: "Documentation",
      def: "Written material produced to demonstrate that sufficient written material exists.",
    },
    {
      term: "Review Cycle",
      def: "An undefined period of time during which nothing measurable occurs.",
    },
    {
      term: "Completion",
      def: "The moment a request stops generating notifications.",
    },
    {
      term: "Closure",
      def: "The administrative act of making a request disappear.",
    },
    {
      term: "Audit",
      def: "A retrospective examination of decisions that were unavoidable.",
    },
    {
      term: "Audit Readiness",
      def: "A state of confidence that documentation exists somewhere.",
    },
    {
      term: "Resolution",
      def: "An outcome that allows the system to move on without addressing the original issue.",
    },
    {
      term: "Deprioritization",
      def: "The act of reducing the urgency or visibility of a request.",
    },
    {
      term: "Operational Constraints",
      def: "Conditions that prevent action today but may be lifted tomorrow, pending alignment.",
    },
    {
      term: "Next Steps",
      def: "Actions identified to demonstrate progress without committing to execution.",
    },
    {
      term: "Future State",
      def: "A conceptual version of reality in which this request has been successfully forgotten.",
    },
    {
      term: "Out of Scope",
      def: "A determination that the request makes sense, just not here.",
    },
    {
      term: "Re-evaluation",
      def: "A repeat of the original review conducted with renewed optimism and identical results.",
    },
  ];

  return (
    <EnterpriseLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Compliance &amp; Policy Documentation
          </h1>
          <p className="text-muted-foreground text-lg">
            Standard Operating Procedures for Justification Management.
          </p>
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
                All justifications must demonstrate clear alignment with the{" "}
                <span className="font-bold">Strategic North Star Paradigm</span>.
                Requests failing to leverage synergies will be deprioritized.
              </p>
              <h3 className="font-bold text-base mt-4">
                Key Pillars of Acceptance{" "}
                <span className="font-normal text-muted-foreground ml-1">
                  (Exceptions require prior approval.)
                </span>
                :
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Cost Neutrality:</span> The request
                  must cost $0 and generate revenue immediately.
                </li>
                <li>
                  <span className="font-semibold">Innovation:</span> It must be
                  innovative but also proven technology used by everyone else for 10
                  years.
                </li>
                <li>
                  <span className="font-semibold">Bandwidth:</span> You must have
                  infinite bandwidth to support this yourself.
                </li>
                <li>
                  <span className="font-semibold">Documentation:</span> All
                  justifications must be documented in accordance with this
                  documentation.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escalation Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-600">
                <h4 className="font-bold flex items-center gap-2">Note on Escalations</h4>
                <p className="mt-2 text-sm">
                  Escalation is strongly discouraged. Escalating a ticket will
                  automatically reset its age to 0 and notify your manager of your
                  "impatience".
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
                        <div
                          key={idx}
                          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 border-b last:border-0 pb-3 last:pb-0"
                        >
                          <span className="font-semibold text-sm">{item.term}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.def}
                          </span>
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
                Justifications are retained in accordance with the organization’s data
                retention policy. This policy is currently under review.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </EnterpriseLayout>
  );
}
