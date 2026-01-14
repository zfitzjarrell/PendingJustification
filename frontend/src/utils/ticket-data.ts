export interface Comment {
  user: string;
  text: string;
  date: string;
}

export interface Ticket {
  id: string;
  summary: string;
  reporter: string;
  status: string;
  created: string;
  updated: string;
  comments: Comment[];
  priority?: string;
}

export const TICKET_DATA: Ticket[] = [
  {
    id: "TKT-2023-8849",
    summary: "Request for dual-monitor setup",
    reporter: "J. Smith (Marketing)",
    status: "Pending Justification",
    created: "2023-11-12",
    updated: "2 days ago",
    comments: [
      { user: "System", text: "Request flagged for excessive pixel consumption. Please justify.", date: "2023-11-12" },
      { user: "J. Smith", text: "I need to see email and Slack at the same time.", date: "2023-11-13" },
      { user: "Admin", text: "Justification insufficient. Have you considered alt-tab?", date: "2023-12-01" }
    ]
  },
  {
    id: "TKT-2017-0042",
    summary: "Coffee machine firmware update",
    reporter: "Office Ops",
    status: "Under Review",
    created: "2017-04-12",
    updated: "Just now",
    comments: [
      { user: "System", text: "Ticket created.", date: "2017-04-12" },
      { user: "System", text: "Automated follow-up: Still relevant?", date: "2018-04-12" },
      { user: "System", text: "Automated follow-up: Still relevant?", date: "2019-04-12" },
      { user: "System", text: "Automated follow-up: Still relevant?", date: "2024-01-01" }
    ]
  },
  {
    id: "TKT-2024-0001",
    summary: "Access to 'Internet' needed",
    reporter: "New Intern",
    status: "Rejected",
    created: "2024-01-15",
    updated: "2024-01-15",
    comments: [
      { user: "New Intern", text: "I can't load Google.", date: "2024-01-15" },
      { user: "Security", text: "Internet access is restricted to L4+ employees. Use the intranet wiki.", date: "2024-01-15" }
    ]
  },
  {
    id: "TKT-2023-9999",
    summary: "Upgrade laptop RAM to 16GB",
    reporter: "Dev Team Lead",
    status: "Budget Freeze",
    created: "2023-10-01",
    updated: "Yesterday",
    comments: [
      { user: "Finance", text: "All hardware upgrades are paused until Q5.", date: "2023-10-05" },
      { user: "Dev Team Lead", text: "My IDE crashes if I open more than 3 files.", date: "2023-10-06" },
      { user: "Finance", text: "Please optimize your code to use less RAM.", date: "2023-10-07" }
    ]
  },
  {
    id: "INC-2020-5555",
    summary: "Printer on 4th floor is emitting smoke",
    reporter: "Anonymous",
    status: "Won't Fix",
    created: "2020-03-10",
    updated: "2020-03-12",
    comments: [
      { user: "Facilities", text: "It's a feature, not a bug. It's the new steam-cleaning cycle.", date: "2020-03-11" },
      { user: "Anonymous", text: "It smells like burning plastic.", date: "2020-03-12" },
      { user: "Facilities", text: "Ticket closed. Please stop sending tickets.", date: "2020-03-12" }
    ]
  },
  {
    id: "REQ-2024-1111",
    summary: "Install 'Spotify' on work laptop",
    reporter: "S. Johnson",
    status: "Security Risk",
    created: "2024-02-01",
    updated: "2024-02-01",
    comments: [
      { user: "System", text: "Software unauthorized.", date: "2024-02-01" },
      { user: "Security", text: "Streaming music introduces potential subliminal messaging vectors. Denied.", date: "2024-02-01" }
    ]
  },
  {
    id: "TKT-2022-4321",
    summary: "Keyboard spacebar sticky",
    reporter: "H. Granger",
    status: "Pending User Info",
    created: "2022-06-15",
    updated: "2023-01-01",
    comments: [
      { user: "Helpdesk", text: "Have you tried not eating improved productivity snacks over the keyboard?", date: "2022-06-16" },
      { user: "System", text: "Ticket auto-closed due to lack of shame.", date: "2023-01-01" }
    ]
  },
  {
    id: "TKT-2021-1234",
    summary: "Need admin rights to install font",
    reporter: "Design Team",
    status: "Awaiting Committee",
    created: "2021-09-01",
    updated: "Today",
    comments: [
      { user: "Design Team", text: "We need Helvetica Neue for the new pitch deck.", date: "2021-09-01" },
      { user: "IT", text: "Comic Sans is pre-installed. Use that.", date: "2021-09-02" },
      { user: "Design Team", text: "Please.", date: "2021-09-02" },
      { user: "IT", text: "Escalated to Font Governance Board.", date: "2021-09-03" }
    ]
  },
  {
    id: "TKT-0000-0001",
    summary: "Reset password for 'admin'",
    reporter: "CTO",
    status: "Critical",
    created: "1999-12-31",
    updated: "1999-12-31",
    comments: [
      { user: "System", text: "Error: Y2K Bug detected.", date: "1999-12-31" }
    ]
  },
  {
    id: "TKT-2023-5678",
    summary: "Chair squeaks loudly",
    reporter: "M. Scott",
    status: "Vendor Review",
    created: "2023-05-20",
    updated: "2023-08-01",
    comments: [
      { user: "Facilities", text: "We need to bid this out to squeak remediation specialists.", date: "2023-05-25" },
      { user: "Facilities", text: "RFP sent to 3 vendors.", date: "2023-06-01" }
    ]
  },
  {
    id: "TKT-2024-2020",
    summary: "Zoom background won't blur",
    reporter: "Remote Employee",
    status: "User Error",
    created: "2024-01-10",
    updated: "2024-01-10",
    comments: [
      { user: "Helpdesk", text: "Your room is just messy. Clean it.", date: "2024-01-10" }
    ]
  },
  {
    id: "TKT-2023-7777",
    summary: "Request for standing desk",
    reporter: "Healthy Person",
    status: "Pending Medical Review",
    created: "2023-11-01",
    updated: "2023-12-01",
    comments: [
      { user: "HR", text: "Please provide a doctor's note proving you have legs.", date: "2023-11-05" }
    ]
  },
  {
    id: "TKT-2022-8888",
    summary: "Mouse cursor moving by itself",
    reporter: "Paranoid Dev",
    status: "Ghost Protocol",
    created: "2022-10-31",
    updated: "2022-10-31",
    comments: [
      { user: "Security", text: "It's probably just a ghost. Closing ticket.", date: "2022-10-31" }
    ]
  },
  {
    id: "TKT-2024-3333",
    summary: "Need license for 'WinRAR'",
    reporter: "Honest User",
    status: "Flagged",
    created: "2024-02-14",
    updated: "2024-02-14",
    comments: [
      { user: "IT", text: "Nobody pays for WinRAR. Suspicious activity reported.", date: "2024-02-14" }
    ]
  },
  {
    id: "TKT-2023-4444",
    summary: "WiFi slow in the bathroom",
    reporter: "Productivity Champion",
    status: "Ignored",
    created: "2023-07-07",
    updated: "2023-07-07",
    comments: [
      { user: "Network", text: "Working as intended.", date: "2023-07-07" }
    ]
  },
  {
    id: "TKT-2024-5555",
    summary: "VPN won't connect from Bermuda",
    reporter: "Remote 'Working'",
    status: "Investigating",
    created: "2024-01-20",
    updated: "2024-01-21",
    comments: [
      { user: "Security", text: "Are you on vacation?", date: "2024-01-20" },
      { user: "Reporter", text: "No, this is a strategic offsite.", date: "2024-01-21" }
    ]
  },
  {
    id: "TKT-2023-1112",
    summary: "Slack emoji request: :blob-sad:",
    reporter: "Culture Committee",
    status: "Approved",
    created: "2023-03-01",
    updated: "2023-03-01",
    comments: [
      { user: "Admin", text: "This is the only thing we will approve this year.", date: "2023-03-01" }
    ]
  },
  {
    id: "TKT-2022-2222",
    summary: "Replace broken headset",
    reporter: "Sales",
    status: "Backordered",
    created: "2022-05-05",
    updated: "2024-01-01",
    comments: [
      { user: "Procurement", text: "Headsets are on backorder until 2025. Please shout louder.", date: "2022-05-06" }
    ]
  },
  {
    id: "TKT-2023-6666",
    summary: "Server room too cold",
    reporter: "Datacenter Guy",
    status: "Won't Fix",
    created: "2023-08-08",
    updated: "2023-08-08",
    comments: [
      { user: "Facilities", text: "The servers are comfortable. Put on a sweater.", date: "2023-08-08" }
    ]
  },
  {
    id: "TKT-2024-9001",
    summary: "AI taking my job",
    reporter: "Copywriter",
    status: "Pending Automation",
    created: "2024-02-28",
    updated: "2024-02-28",
    comments: [
      { user: "AI Bot", text: "I can help you with that ticket.", date: "2024-02-28" }
    ]
  },
  {
    id: "TKT-2023-1010",
    summary: "Request to use 'Notepad++'",
    reporter: "Junior Dev",
    status: "Approved",
    created: "2023-09-09",
    updated: "2023-09-09",
    comments: [
      { user: "IT", text: "Fine.", date: "2023-09-09" }
    ]
  },
  {
    id: "TKT-2022-1212",
    summary: "Monitor stand wobble",
    reporter: "Q. Tarantino",
    status: "Deferred",
    created: "2022-12-12",
    updated: "2022-12-13",
    comments: [
      { user: "Facilities", text: "Use a coaster.", date: "2022-12-13" }
    ]
  },
  {
    id: "TKT-2024-0404",
    summary: "404 Page Not Found",
    reporter: "User",
    status: "Not Found",
    created: "2024-04-04",
    updated: "2024-04-04",
    comments: [
      { user: "System", text: "Ticket not found.", date: "2024-04-04" }
    ]
  },
  {
    id: "TKT-2023-0505",
    summary: "Need access to production DB",
    reporter: "Intern",
    status: "Auto-Rejected",
    created: "2023-05-05",
    updated: "2023-05-05",
    comments: [
      { user: "System", text: "LOL.", date: "2023-05-05" }
    ]
  },
  {
    id: "TKT-2022-0606",
    summary: "Smell of fish in microwave",
    reporter: "Everyone",
    status: "Escalated",
    created: "2022-06-06",
    updated: "2022-06-06",
    comments: [
      { user: "HR", text: "We are launching a full investigation.", date: "2022-06-06" }
    ]
  },
  {
    id: "TKT-2023-0707",
    summary: "Request for 'Dark Mode' in Excel",
    reporter: "Analyst",
    status: "Pending Microsoft",
    created: "2023-07-07",
    updated: "2023-07-07",
    comments: [
      { user: "IT", text: "Wear sunglasses.", date: "2023-07-07" }
    ]
  },
  {
    id: "TKT-2024-0808",
    summary: "Meeting room double booked",
    reporter: "PM",
    status: "Resolved",
    created: "2024-08-08",
    updated: "2024-08-08",
    comments: [
      { user: "Facilities", text: "Fight for it.", date: "2024-08-08" }
    ]
  },
  {
    id: "TKT-2023-0909",
    summary: "Need new stapler",
    reporter: "Milton",
    status: "Ignored",
    created: "2023-09-09",
    updated: "2023-09-09",
    comments: [
      { user: "Admin", text: "We moved your desk to the basement.", date: "2023-09-09" }
    ]
  },
  {
    id: "TKT-2022-1010",
    summary: "Fax machine error PC LOAD LETTER",
    reporter: "Michael Bolton",
    status: "Hardware Destruction",
    created: "2022-10-10",
    updated: "2022-10-10",
    comments: [
      { user: "IT", text: "Did you take a baseball bat to it?", date: "2022-10-10" }
    ]
  },
  {
    id: "TKT-2023-1111",
    summary: "Request for more meetings",
    reporter: "Middle Manager",
    status: "Approved",
    created: "2023-11-11",
    updated: "2023-11-11",
    comments: [
      { user: "Management", text: "Great initiative!", date: "2023-11-11" }
    ]
  },
  {
    id: "TKT-2024-1212",
    summary: "Reduce meeting load",
    reporter: "Engineer",
    status: "Denied",
    created: "2024-12-12",
    updated: "2024-12-12",
    comments: [
      { user: "Management", text: "We need to schedule a meeting to discuss this.", date: "2024-12-12" }
    ]
  },
  {
    id: "TKT-2023-1313",
    summary: "Elevator music is depressing",
    reporter: "Sales",
    status: "Wont Fix",
    created: "2023-01-01",
    updated: "2023-01-01",
    comments: [
      { user: "Facilities", text: "It matches the company culture.", date: "2023-01-01" }
    ]
  },
  {
    id: "TKT-2022-1414",
    summary: "Request for ergonomic mousepad",
    reporter: "Designer",
    status: "Pending Budget",
    created: "2022-02-02",
    updated: "2024-02-02",
    comments: [
      { user: "Finance", text: "We can offer you a folded piece of cardboard.", date: "2022-02-03" }
    ]
  },
  {
    id: "TKT-2023-1515",
    summary: "Slack notification sound annoying",
    reporter: "Dev",
    status: "User Training",
    created: "2023-03-03",
    updated: "2023-03-03",
    comments: [
      { user: "Helpdesk", text: "Turn off your speakers.", date: "2023-03-03" }
    ]
  },
  {
    id: "TKT-2024-1616",
    summary: "Need faster internet",
    reporter: "Video Editor",
    status: "Bandwidth Cap",
    created: "2024-04-04",
    updated: "2024-04-04",
    comments: [
      { user: "Network", text: "Stop downloading 4K cat videos.", date: "2024-04-04" }
    ]
  },
  {
    id: "TKT-2023-1717",
    summary: "Request for Mac Pro",
    reporter: "Receptionist",
    status: "Denied",
    created: "2023-05-05",
    updated: "2023-05-05",
    comments: [
      { user: "IT", text: "You only use Word.", date: "2023-05-05" }
    ]
  },
  {
    id: "TKT-2022-1818",
    summary: "Coffee is too weak",
    reporter: "Dev Team",
    status: "Vendor Issue",
    created: "2022-06-06",
    updated: "2022-06-06",
    comments: [
      { user: "Ops", text: "It's technically 'coffee-flavored beverage'.", date: "2022-06-06" }
    ]
  },
  {
    id: "TKT-2023-1919",
    summary: "Request for nap pod",
    reporter: "Sleepy Dev",
    status: "Reviewing",
    created: "2023-07-07",
    updated: "2023-07-07",
    comments: [
      { user: "HR", text: "Under your desk is free.", date: "2023-07-07" }
    ]
  },
  {
    id: "TKT-2024-2021",
    summary: "Zoom filter stuck on 'Cat'",
    reporter: "Lawyer",
    status: "Viral",
    created: "2024-08-08",
    updated: "2024-08-08",
    comments: [
      { user: "Support", text: "I am not a cat.", date: "2024-08-08" }
    ]
  },
  {
    id: "TKT-2023-2121",
    summary: "Need second monitor",
    reporter: "Sales",
    status: "Approved",
    created: "2023-09-09",
    updated: "2023-09-09",
    comments: [
      { user: "IT", text: "Here is a 15-inch CRT.", date: "2023-09-09" }
    ]
  },
  {
    id: "TKT-2022-2223",
    summary: "Keyboard missing 'E' key",
    reporter: "Writer",
    status: "Rplacmnt Ordrd",
    created: "2022-10-10",
    updated: "2022-10-10",
    comments: [
      { user: "Usr", text: "Plas hlp.", date: "2022-10-10" }
    ]
  },
  {
    id: "TKT-2023-2323",
    summary: "Request for emotional support dog",
    reporter: "Team Lead",
    status: "Policy Check",
    created: "2023-11-11",
    updated: "2023-11-11",
    comments: [
      { user: "HR", text: "Is the dog agile certified?", date: "2023-11-11" }
    ]
  },
  {
    id: "TKT-2024-2424",
    summary: "Cannot print to PDF",
    reporter: "Boomer",
    status: "Training Required",
    created: "2024-12-12",
    updated: "2024-12-12",
    comments: [
      { user: "Helpdesk", text: "Click 'Save as PDF'.", date: "2024-12-12" }
    ]
  },
  {
    id: "TKT-2023-2525",
    summary: "Screen is black",
    reporter: "User",
    status: "Resolved",
    created: "2023-01-01",
    updated: "2023-01-01",
    comments: [
      { user: "Helpdesk", text: "Is it plugged in?", date: "2023-01-01" },
      { user: "User", text: "Oh.", date: "2023-01-01" }
    ]
  },
  {
    id: "TKT-2022-2626",
    summary: "Mouse too fast",
    reporter: "Senior VP",
    status: "High Priority",
    created: "2022-02-02",
    updated: "2022-02-02",
    comments: [
      { user: "IT", text: "Lowered DPI setting. Sir.", date: "2022-02-02" }
    ]
  },
  {
    id: "TKT-2023-2727",
    summary: "Need admin to install 'BonziBuddy'",
    reporter: "Nostalgic User",
    status: "Security Threat",
    created: "2023-03-03",
    updated: "2023-03-03",
    comments: [
      { user: "Security", text: "Absolutely not.", date: "2023-03-03" }
    ]
  },
  {
    id: "TKT-2024-2828",
    summary: "Request for 'Hacker Mode'",
    reporter: "Script Kiddie",
    status: "Denied",
    created: "2024-04-04",
    updated: "2024-04-04",
    comments: [
      { user: "IT", text: "Green text on black background enabled.", date: "2024-04-04" }
    ]
  },
  {
    id: "TKT-2023-2929",
    summary: "Coffee machine speaking Russian",
    reporter: "Ops",
    status: "IoTHack",
    created: "2023-05-05",
    updated: "2023-05-05",
    comments: [
      { user: "Security", text: "Disconnecting from network.", date: "2023-05-05" }
    ]
  },
  {
    id: "TKT-2022-3030",
    summary: "Need more RAM",
    reporter: "Chrome User",
    status: "Pending",
    created: "2022-06-06",
    updated: "2022-06-06",
    comments: [
      { user: "IT", text: "Close some tabs.", date: "2022-06-06" }
    ]
  },
  {
    id: "TKT-2023-3131",
    summary: "Request for 'Boss Key'",
    reporter: "Gamer",
    status: "Approved",
    created: "2023-07-07",
    updated: "2023-07-07",
    comments: [
      { user: "IT", text: "Alt+Tab is free.", date: "2023-07-07" }
    ]
  },
  {
    id: "TKT-2024-3232",
    summary: "Spreadsheet crashed",
    reporter: "Finance",
    status: "Data Loss",
    created: "2024-08-08",
    updated: "2024-08-08",
    comments: [
      { user: "IT", text: "Did you save?", date: "2024-08-08" },
      { user: "Finance", text: "No.", date: "2024-08-08" }
    ]
  },
  {
    id: "TKT-2023-3333",
    summary: "Need color printer",
    reporter: "Marketing",
    status: "Budget Denied",
    created: "2023-09-09",
    updated: "2023-09-09",
    comments: [
      { user: "Finance", text: "Black and white builds character.", date: "2023-09-09" }
    ]
  },
  {
    id: "TKT-2022-3434",
    summary: "Request for standing desk converter",
    reporter: "Dev",
    status: "Approved",
    created: "2022-10-10",
    updated: "2022-10-10",
    comments: [
      { user: "Facilities", text: "Delivered one (1) cardboard box.", date: "2022-10-10" }
    ]
  },
  {
    id: "TKT-2023-3535",
    summary: "Zoom audio echo",
    reporter: "Remote",
    status: "User Error",
    created: "2023-11-11",
    updated: "2023-11-11",
    comments: [
      { user: "Helpdesk", text: "Mute yourself.", date: "2023-11-11" }
    ]
  },
  {
    id: "TKT-2024-3636",
    summary: "Laptop fan loud",
    reporter: "Dev",
    status: "Compiling",
    created: "2024-12-12",
    updated: "2024-12-12",
    comments: [
      { user: "IT", text: "It's preparing for takeoff.", date: "2024-12-12" }
    ]
  },
  {
    id: "TKT-2023-3737",
    summary: "Forgot password again",
    reporter: "CEO",
    status: "Urgent",
    created: "2023-01-01",
    updated: "2023-01-01",
    comments: [
      { user: "IT", text: "Reset to 'Password123'.", date: "2023-01-01" }
    ]
  },
  {
    id: "TKT-2022-3838",
    summary: "Monitor flickering",
    reporter: "Ops",
    status: "Ghost",
    created: "2022-02-02",
    updated: "2022-02-02",
    comments: [
      { user: "Facilities", text: "Poltergeist confirmed.", date: "2022-02-02" }
    ]
  },
  {
    id: "TKT-2023-3939",
    summary: "Request for mechanical keyboard",
    reporter: "Hipster Dev",
    status: "Noise Complaint",
    created: "2023-03-03",
    updated: "2023-03-03",
    comments: [
      { user: "HR", text: "Your coworkers hate you.", date: "2023-03-03" }
    ]
  },
  {
    id: "TKT-2024-4040",
    summary: "Internet is down",
    reporter: "Everyone",
    status: "Panic",
    created: "2024-04-04",
    updated: "2024-04-04",
    comments: [
      { user: "Network", text: "Unplugging and replugging...", date: "2024-04-04" }
    ]
  },
  {
    id: "TKT-2023-4141",
    summary: "Need access to Facebook",
    reporter: "Social Media Mgr",
    status: "Approved",
    created: "2023-05-05",
    updated: "2023-05-05",
    comments: [
      { user: "Security", text: "Reluctantly granted.", date: "2023-05-05" }
    ]
  },
  {
    id: "TKT-2024-4242",
    summary: "Can't find the 'Any' key",
    reporter: "User",
    status: "Resolved",
    created: "2024-06-06",
    updated: "2024-06-06",
    comments: [
      { user: "Helpdesk", text: "It's the spacebar. Or enter. Or literally any key.", date: "2024-06-06" }
    ]
  },
  {
    id: "TKT-2023-4343",
    summary: "Request for office treadmill",
    reporter: "Fitness Enthusiast",
    status: "Denied",
    created: "2023-07-07",
    updated: "2023-07-07",
    comments: [
      { user: "HR", text: "Liability concern. Also, sweating.", date: "2023-07-07" }
    ]
  },
  {
    id: "TKT-2022-4444",
    summary: "Laptop smells like burnt toast",
    reporter: "User",
    status: "Critical",
    created: "2022-08-08",
    updated: "2022-08-08",
    comments: [
      { user: "IT", text: "Did you put bread in the CD drive?", date: "2022-08-08" },
      { user: "User", text: "Maybe.", date: "2022-08-08" }
    ]
  },
  {
    id: "TKT-2023-4545",
    summary: "Need admin to install 'CryptoMiner.exe'",
    reporter: "Enterprising Intern",
    status: "Terminated",
    created: "2023-09-09",
    updated: "2023-09-09",
    comments: [
      { user: "Security", text: "User has been escorted from the building.", date: "2023-09-09" }
    ]
  },
  {
    id: "TKT-2024-4646",
    summary: "Teams status won't change from 'Away'",
    reporter: "Manager",
    status: "Irony",
    created: "2024-10-10",
    updated: "2024-10-10",
    comments: [
      { user: "IT", text: "Maybe you are away?", date: "2024-10-10" }
    ]
  },
  {
    id: "TKT-2023-4747",
    summary: "Request for unlimited Google Drive storage",
    reporter: "Data Hoarder",
    status: "Denied",
    created: "2023-11-11",
    updated: "2023-11-11",
    comments: [
      { user: "IT", text: "Delete your 500GB of 'backups'.", date: "2023-11-11" }
    ]
  },
  {
    id: "TKT-2022-4848",
    summary: "Keyboard letters rubbed off",
    reporter: "Heavy Typer",
    status: "Replacement Sent",
    created: "2022-12-12",
    updated: "2022-12-12",
    comments: [
      { user: "IT", text: "Sending you a mechanical keyboard. Good luck.", date: "2022-12-12" }
    ]
  },
  {
    id: "TKT-2023-4949",
    summary: "Need access to the 'Dark Web'",
    reporter: "Curious Dev",
    status: "Security Alert",
    created: "2023-01-01",
    updated: "2023-01-01",
    comments: [
      { user: "Security", text: "Why?", date: "2023-01-01" },
      { user: "Dev", text: "Research.", date: "2023-01-01" }
    ]
  },
  {
    id: "TKT-2024-5050",
    summary: "Mouse ball needs cleaning",
    reporter: "Time Traveler",
    status: "Confused",
    created: "2024-02-02",
    updated: "2024-02-02",
    comments: [
      { user: "IT", text: "What year is it?", date: "2024-02-02" }
    ]
  },
  {
    id: "TKT-2023-5151",
    summary: "Request for 8K monitor",
    reporter: "Graphic Design",
    status: "Budget Laugh",
    created: "2023-03-03",
    updated: "2023-03-03",
    comments: [
      { user: "Finance", text: "No.", date: "2023-03-03" }
    ]
  },
  {
    id: "TKT-2022-5252",
    summary: "WiFi password changed?",
    reporter: "User",
    status: "Resolved",
    created: "2022-04-04",
    updated: "2022-04-04",
    comments: [
      { user: "IT", text: "It's on the whiteboard. In giant letters.", date: "2022-04-04" }
    ]
  },
  {
    id: "TKT-2023-5353",
    summary: "Need VPN on smart fridge",
    reporter: "IoT Enthusiast",
    status: "Denied",
    created: "2023-05-05",
    updated: "2023-05-05",
    comments: [
      { user: "Security", text: "Your milk does not need encryption.", date: "2023-05-05" }
    ]
  },
  {
    id: "TKT-2024-5454",
    summary: "Laptop won't turn on",
    reporter: "User",
    status: "Battery Empty",
    created: "2024-06-06",
    updated: "2024-06-06",
    comments: [
      { user: "Helpdesk", text: "Please charge it.", date: "2024-06-06" }
    ]
  },
  {
    id: "TKT-2023-5555",
    summary: "Request for office parrot",
    reporter: "Pirate",
    status: "HR Violation",
    created: "2023-07-07",
    updated: "2023-07-07",
    comments: [
      { user: "HR", text: "No birds allowed.", date: "2023-07-07" }
    ]
  },
  {
    id: "TKT-2022-5656",
    summary: "Printer says 'PC LOAD LETTER'",
    reporter: "Everyone",
    status: "Known Issue",
    created: "2022-08-08",
    updated: "2022-08-08",
    comments: [
      { user: "IT", text: "It means load letter paper. We only have A4.", date: "2022-08-08" }
    ]
  },
  {
    id: "TKT-2023-5757",
    summary: "Need admin rights to update Adobe",
    reporter: "Designer",
    status: "Approved",
    created: "2023-09-09",
    updated: "2023-09-09",
    comments: [
      { user: "IT", text: "Granted for 15 minutes.", date: "2023-09-09" }
    ]
  },
  {
    id: "TKT-2024-5858",
    summary: "Computer making beeping noises",
    reporter: "User",
    status: "Hardware Failure",
    created: "2024-10-10",
    updated: "2024-10-10",
    comments: [
      { user: "IT", text: "Backup your data. Now.", date: "2024-10-10" }
    ]
  },
  {
    id: "TKT-2023-5959",
    summary: "Request for 'Cool' status",
    reporter: "Uncool User",
    status: "Impossible",
    created: "2023-11-11",
    updated: "2023-11-11",
    comments: [
      { user: "Admin", text: "System error: Attribute not found.", date: "2023-11-11" }
    ]
  },
  {
    id: "TKT-2022-6060",
    summary: "Need to download the internet",
    reporter: "Archivist",
    status: "Storage Full",
    created: "2022-12-12",
    updated: "2022-12-12",
    comments: [
      { user: "IT", text: "We don't have enough floppies.", date: "2022-12-12" }
    ]
  }
];
