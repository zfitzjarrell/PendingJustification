import { Experience } from "./experience-context";

type CopyKey = 
  | "pending_label" 
  | "wait_time_label"
  | "approved_label"
  | "uptime_label"
  | "generate_btn"
  | "context_placeholder"
  | "topic_label"
  | "tone_label"
  | "dashboard_title"
  | "ticket_update"
  | "blocker_title"
  | "secondary_action"
  | "footer_note"
  | "tooltip_text"
  | "secondary_tooltip";

const COPY_DICT: Record<Experience, Record<CopyKey, string>> = {
  modern: {
    pending_label: "Pending Requests",
    wait_time_label: "Avg. Cycle Time",
    approved_label: "Approved Items",
    uptime_label: "Platform Health",
    generate_btn: "Initiate Justification Workflow",
    context_placeholder: "Add context to personalize request...",
    topic_label: "Category",
    tone_label: "Communication Style",
    dashboard_title: "My Work Dashboard",
    ticket_update: "Ticket updated",
    blocker_title: "Blocker Analysis",
    secondary_action: "Request Review",
    footer_note: "© 2024 Enterprise Services • v4.2.0 • Build 8992",
    tooltip_text: "Represents the total number of open items awaiting justification.",
    secondary_tooltip: "This action is currently unavailable."
  },
  legacy: {
    pending_label: "QUEUE_DEPTH_TOTAL",
    wait_time_label: "AVG_WAIT_MS",
    approved_label: "ACK_COUNT",
    uptime_label: "SYS_UPTIME_SEC",
    generate_btn: "EXECUTE_JUSTIFICATION_JOB",
    context_placeholder: "ENTER_NARRATIVE_TEXT",
    topic_label: "CLASS_ID",
    tone_label: "OUTPUT_MODE",
    dashboard_title: "TICKET_MASTER_CONSOLE_V4",
    ticket_update: "REC_MODIFIED",
    blocker_title: "FAILURE_MODE_REPORT",
    secondary_action: "ABORT_TRANSACTION",
    footer_note: "SESSION_ID: 0x829102 | NODE: US-EAST-4 | TERMINAL: TTY2",
    tooltip_text: "FIELD_DEF_0x29",
    secondary_tooltip: "This action cannot be undone."
  },
  classic: {
    pending_label: "My Open Items",
    wait_time_label: "Days Outstanding",
    approved_label: "Approved Requests",
    uptime_label: "Server Status",
    generate_btn: "Submit for Processing",
    context_placeholder: "Please enter details here.",
    topic_label: "Request Type",
    tone_label: "Response Format",
    dashboard_title: "Employee Self-Service Portal",
    ticket_update: "Item Status Changed",
    blocker_title: "Impediment Graph",
    secondary_action: "Cancel",
    footer_note: "Best viewed in Internet Explorer 6.0 or higher.",
    tooltip_text: "Help topic 404: Not Found",
    secondary_tooltip: "Cancel"
  },
  amateur: {
    pending_label: "stuff waiting",
    wait_time_label: "HOW LONG",
    approved_label: "Done Ones.",
    uptime_label: "is it down?",
    generate_btn: "click to make excuse",
    context_placeholder: "type here if you want",
    topic_label: "Pick One:",
    tone_label: "Attitude:",
    dashboard_title: "Internal Tool (Do Not Share)",
    ticket_update: "someone did something",
    blocker_title: "Why nothing works",
    secondary_action: "reset form (broken)",
    footer_note: "Last updated: 2021 | Maintained by: IT (maybe)",
    tooltip_text: "just pick something",
    secondary_tooltip: "broken button"
  }
};

export function getCopy(experience: Experience, key: CopyKey): string {
  return COPY_DICT[experience][key] || COPY_DICT["modern"][key];
}
