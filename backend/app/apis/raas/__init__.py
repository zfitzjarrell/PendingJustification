from fastapi import APIRouter, Query, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict
import random
import time
import uuid
import hashlib
from collections import deque
from enum import Enum

router = APIRouter()

# --- Global State for Advanced Selection Logic ---
# Monotonic counter for cooldown tracking
REQUEST_COUNTER = 0

# Global rolling window of recent response IDs (for frequency caps)
GLOBAL_WINDOW_SIZE = 1000
GLOBAL_ROLLING_WINDOW: deque = deque(maxlen=GLOBAL_WINDOW_SIZE)

# Cooldowns: {template_id: available_at_request_index}
COOLDOWNS: Dict[str, int] = {}

# Constants for Special Handling
BEES_ID = "unhinged-001"
NO_VARIANTS = {
    "deadpan-001", "deadpan-001-v2", "deadpan-001-v3", "deadpan-001-v4"
}

# --- Rate Limiting & History ---

# Simple in-memory store: {ip: {timestamp: float, count: int}}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 60 # per window
rate_limit_store: Dict[str, Dict[str, float]] = {}

# Simple in-memory history: {ip: [id1, id2, ...]}
HISTORY_SIZE = 50  # Increased from 10 to 50 to reduce repetition
recent_history: Dict[str, List[str]] = {}

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Clean up old entries occasionally? 
    # For MVP, we'll just check specific user logic to keep it simple and efficient enough.
    
    user_record = rate_limit_store.get(client_ip)
    
    if not user_record:
        rate_limit_store[client_ip] = {"start_time": current_time, "count": 1}
        return

    # Check if window expired
    if current_time - user_record["start_time"] > RATE_LIMIT_WINDOW:
        # Reset
        rate_limit_store[client_ip] = {"start_time": current_time, "count": 1}
    else:
        # Increment
        if user_record["count"] >= RATE_LIMIT_MAX_REQUESTS:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
        user_record["count"] += 1

def update_history(ip: str, rationale_id: str):
    if ip not in recent_history:
        recent_history[ip] = []
    
    history = recent_history[ip]
    history.append(rationale_id)
    if len(history) > HISTORY_SIZE:
        history.pop(0) # Keep it a rolling window

def get_history(ip: str) -> List[str]:
    return recent_history.get(ip, [])

# --- Enums & Models ---

class Tone(str, Enum):
    snarky = "snarky"
    absurd = "absurd"
    deadpan = "deadpan"
    corporate_parody = "corporate-parody"
    unhinged = "unhinged"

class Topic(str, Enum):
    change_request = "change_request"
    security_exception = "security_exception"
    budget = "budget"
    priority = "priority"
    meeting = "meeting"
    vendor_request = "vendor_request"
    process_policy = "process_policy"
    staffing = "staffing"
    timeline = "timeline"
    generic = "generic"

class Length(str, Enum):
    one_liner = "one_liner"
    short = "short"
    medium = "medium"

class Format(str, Enum):
    plain = "plain"
    json = "json"

class RationaleMeta(BaseModel):
    id: str
    source: str
    safe_for_work: bool

class RationaleResponse(BaseModel):
    rationale: str
    topic: Optional[Topic] = None
    tone: Tone
    intensity: int
    meta: RationaleMeta

class RationaleEntry(BaseModel):
    id: str
    text: str
    tone: Tone
    topics: List[str] # Keep as strings for flexibility, or migrate to Topic enum
    intensity: int
    length: Length
    safe_for_work: bool = True
    source: str = "library"

# --- Data (Curated Library) ---
# Updating topics to match new Enums where possible
RATIONALES: List[RationaleEntry] = [
    RationaleEntry(
        id="corp-001",
        text="We’re deprioritizing that until the next alignment on alignment.",
        tone=Tone.corporate_parody,
        topics=["priority", "roadmap", "meeting"],
        intensity=2,
        length=Length.one_liner
    ),
    RationaleEntry(
        id="corp-002",
        text="Let's circle back to this when we have more bandwidth to leverage our synergies.",
        tone=Tone.corporate_parody,
        topics=["meeting", "roadmap", "budget"],
        intensity=1,
        length=Length.one_liner
    ),
    # Micro-variants for Alignment (corp-001)
    RationaleEntry(
        id="corp-001-v2",
        text="This has been deprioritized pending a future alignment on alignment.",
        tone=Tone.corporate_parody,
        topics=["priority", "roadmap", "meeting"],
        intensity=2,
        length=Length.one_liner
    ),
    RationaleEntry(
        id="corp-001-v3",
        text="Leadership agreed this should wait until alignment is realigned.",
        tone=Tone.corporate_parody,
        topics=["priority", "roadmap", "meeting"],
        intensity=2,
        length=Length.one_liner
    ),
    RationaleEntry(
        id="corp-001-v4",
        text="Alignment remains unresolved, so this cannot proceed.",
        tone=Tone.corporate_parody,
        topics=["priority", "roadmap", "meeting"],
        intensity=2,
        length=Length.one_liner
    ),
     RationaleEntry(
        id="absurd-001",
        text="The moon is in retrograde and the firewall has feelings today.",
        tone=Tone.absurd,
        topics=["security_exception", "change_request"],
        intensity=4,
        length=Length.one_liner
    ),
    RationaleEntry(
        id="absurd-002",
        text="Our cloud provider is currently migrating to a potato-based infrastructure.",
        tone=Tone.absurd,
        topics=["change_request", "timeline"],
        intensity=5,
        length=Length.short
    ),
    RationaleEntry(
        id="snarky-001",
        text="I could do that, but then I'd have to care, and that's not in the budget.",
        tone=Tone.snarky,
        topics=["budget", "staffing"],
        intensity=3,
        length=Length.one_liner
    ),
    # Variants for No (deadpan-001)
    RationaleEntry(
        id="deadpan-001",
        text="No.",
        tone=Tone.deadpan,
        topics=["generic"],
        intensity=2,  # Changed from 5 to 2
        length=Length.one_liner
    ),
    RationaleEntry(
        id="deadpan-001-v2",
        text="Negative.",
        tone=Tone.deadpan,
        topics=["generic"],
        intensity=2,  # Changed from 5 to 2
        length=Length.one_liner
    ),
    RationaleEntry(
        id="deadpan-001-v3",
        text="Not happening.",
        tone=Tone.deadpan,
        topics=["generic"],
        intensity=2,  # Changed from 5 to 2
        length=Length.one_liner
    ),
    RationaleEntry(
        id="deadpan-001-v4",
        text="Denied.",
        tone=Tone.deadpan,
        topics=["generic"],
        intensity=2,  # Changed from 5 to 2
        length=Length.one_liner
    ),
    RationaleEntry(
        id="deadpan-002",
        text="That is not going to happen.",
        tone=Tone.deadpan,
        topics=["generic"],
        intensity=3,
        length=Length.one_liner
    ),
    RationaleEntry(
        id="unhinged-001",
        text="THE BEES ARE IN THE SERVER ROOM AGAIN!",
        tone=Tone.unhinged,
        topics=["change_request", "security_exception"],
        intensity=5,
        length=Length.one_liner
    ),
    RationaleEntry(
        id="security-001",
        text="Security says no because you didn't say the magic word (which is a 64-character hex string).",
        tone=Tone.snarky,
        topics=["security_exception"],
        intensity=3,
        length=Length.short
    ),
    # Variants for Security Magic Word
    RationaleEntry(
        id="security-001-v2",
        text="Access denied. You failed to recite the 64-character hex string of power.",
        tone=Tone.snarky,
        topics=["security_exception"],
        intensity=3,
        length=Length.short
    ),
    RationaleEntry(
        id="security-001-v3",
        text="Did you submit the hex string in the comments? No? Then no.",
        tone=Tone.snarky,
        topics=["security_exception"],
        intensity=3,
        length=Length.short
    ),
    RationaleEntry(
        id="budget-001",
        text="The CFO laughed for a solid five minutes when I asked.",
        tone=Tone.deadpan,
        topics=["budget", "vendor_request"],
        intensity=4,
        length=Length.short
    ),
     # Variants for Budget Laughter
    RationaleEntry(
        id="budget-001-v2",
        text="I mentioned this to Finance and they are still laughing.",
        tone=Tone.deadpan,
        topics=["budget", "vendor_request"],
        intensity=4,
        length=Length.short
    ),
    RationaleEntry(
        id="budget-001-v3",
        text="The request was rejected due to excessive hilarity in the finance department.",
        tone=Tone.deadpan,
        topics=["budget", "vendor_request"],
        intensity=4,
        length=Length.short
    )
]

# --- Template Engine Data ---

# Organized by Topic for better relevance
THINGS_BY_TOPIC = {
    Topic.change_request: [
        "this change request", "your deployment", "the emergency fix", 
        "that hotfix", "the CAB ticket", "your PR"
    ],
    Topic.security_exception: [
        "this security exception", "your risk acceptance", "that firewall rule", 
        "admin access", "the audit finding", "compliance check"
    ],
    Topic.budget: [
        "this budget request", "the expense report", "funding for this", 
        "the procurement", "your license request", "the credit card charge"
    ],
    Topic.priority: [
        "this feature", "your ticket", "that user story", 
        "the roadmap item", "this initiative", "the quarterly goal"
    ],
    Topic.meeting: [
        "that meeting invite", "the standup", "the sync", 
        "your calendar hold", "the workshop", "the brainstorm"
    ],
    Topic.vendor_request: [
        "this new tool", "the SaaS renewal", "that vendor demo", 
        "the POC", "another license", "this subscription"
    ],
    Topic.process_policy: [
        "this procedure", "the policy waiver", "your request", 
        "the new process", "skipping the step", "the governance review"
    ],
    Topic.staffing: [
        "the new headcount", "your hiring request", "the backfill", 
        "more resources", "the contractor", "expanding the team"
    ],
    Topic.timeline: [
        "the deadline", "your timeline", "the launch date", 
        "the schedule", "delivery by Friday", "the milestone"
    ],
    Topic.generic: [
        "this request", "your ticket", "that thing", 
        "the item", "your ask", "the deliverable"
    ]
}

SLOTS = {
    # THING is now handled dynamically based on Topic
    "ABSURD_REASON": [
        "the VPN is allergic to Thursdays", "Mercury is in retrograde", 
        "the firewall has feelings", "the datacenter is haunted", 
        "our astrological charts don't align", "the wifi runs on hopes and dreams",
        "the server hamsters are on strike", "entropy is increasing too fast",
        "the coffee machine is updating its firmware", "solar flares are interfering with the Jira ticket",
        "the blockchain is too heavy", "I'm currently mining bitcoin on the production server",
        "the AI became sentient and said no", "we ran out of cloud"
    ],
    "CORPORATE_BS": [
        "we need to align on alignment", "the synergies aren't synergistic enough",
        "it's not in the Q4 strategic pillar", "we are pivoting to a new paradigm",
        "cross-functional stakeholders have not signed off", "the bandwidth is constrained",
        "we are right-sizing the resource allocation", "it's below the cut-line",
        "we need to socialize this with leadership first", "the ROI is not fully realized"
    ],
    "SNARKY_RETORT": [
        "I just don't want to", "that sounds like a 'you' problem",
        "my care cup is empty", "I'm busy doing literally anything else",
        "read the manual", "I'm on a coffee break until 2025",
        "it works on my machine", "ticket closed: won't fix"
    ],
    "AUTHORITY": [
        "Legal", "The Change Advisory Council", "The vibes", 
        "The ancient ones", "Compliance", "Security", "HR", 
        "The Algorithm", "Chat-GPT", "The Senior Architect", 
        "The Board of Directors", "My cat", "The intern"
    ],
    "DECREE": [
        "absolutely not", "try again after Mercury calms down", 
        "it is forbidden", "we must wait for the stars to align",
        "computer says no", "maybe in Q5", "it is not the way",
        "ask again in the next life", "error 418: I'm a teapot",
        "reply hazy, try again"
    ]
}

class Template(BaseModel):
    text: str
    tone: Tone
    intensity: int
    length: Length

TEMPLATES: List[Template] = [
    Template(
        text="We can't approve {THING} because {ABSURD_REASON}, and {AUTHORITY} already said {DECREE}.",
        tone=Tone.absurd,
        intensity=4,
        length=Length.medium
    ),
    # Variants for Absurd Refusal
    Template(
        text="{AUTHORITY} has decreed that {THING} is forbidden because {ABSURD_REASON}.",
        tone=Tone.absurd,
        intensity=4,
        length=Length.medium
    ),
    Template(
        text="Unless {ABSURD_REASON}, {THING} will not happen, says {AUTHORITY}.",
        tone=Tone.absurd,
        intensity=4,
        length=Length.medium
    ),
    
    Template(
        text="{AUTHORITY} has decided that {THING} is out of scope until {CORPORATE_BS}.",
        tone=Tone.corporate_parody,
        intensity=3,
        length=Length.medium
    ),
    # Variants for Corporate Scope
    Template(
        text="We are pausing {THING} to ensure {CORPORATE_BS}.",
        tone=Tone.corporate_parody,
        intensity=3,
        length=Length.medium
    ),
    Template(
        text="Regarding {THING}: {CORPORATE_BS}, so we must circle back later.",
        tone=Tone.corporate_parody,
        intensity=3,
        length=Length.medium
    ),

    Template(
        text="Sorry, {THING} is blocked because {SNARKY_RETORT}.",
        tone=Tone.snarky,
        intensity=2,
        length=Length.short
    ),
    # Variants for Snarky Block
    Template(
        text="I'm not doing {THING}. {SNARKY_RETORT}.",
        tone=Tone.snarky,
        intensity=2,
        length=Length.short
    ),
    Template(
        text="Status of {THING}: Blocked. Why? {SNARKY_RETORT}.",
        tone=Tone.snarky,
        intensity=2,
        length=Length.short
    ),

    Template(
        text="I asked {AUTHORITY} about {THING} and they said {DECREE}.",
        tone=Tone.deadpan,
        intensity=3,
        length=Length.short
    ),
    # Variants for Deadpan Authority
    Template(
        text="{AUTHORITY} reviewed {THING}: {DECREE}.",
        tone=Tone.deadpan,
        intensity=3,
        length=Length.short
    ),
     Template(
        text="Update on {THING} from {AUTHORITY}: {DECREE}.",
        tone=Tone.deadpan,
        intensity=3,
        length=Length.short
    ),
    
    # NEW: Unhinged Templates (Intensity 5)
    Template(
        text="I tried to process {THING} but the {ABSURD_REASON} and now everything is on fire!",
        tone=Tone.unhinged,
        intensity=5,
        length=Length.medium
    ),
    Template(
        text="DO NOT ASK ABOUT {THING}! {AUTHORITY} is watching us!",
        tone=Tone.unhinged,
        intensity=5,
        length=Length.medium
    ),
    Template(
        text="WHY WOULD YOU WANT {THING}?? The prophecy explicitly forbids it!",
        tone=Tone.unhinged,
        intensity=5,
        length=Length.medium
    ),
    Template(
        text="{THING}?? In this economy?? With these {ABSURD_REASON}?? ABSOLUTELY NOT!",
        tone=Tone.unhinged,
        intensity=5,
        length=Length.medium
    )
]

# --- Helper Functions ---

def generate_from_template(
    template: Template,
    topic: Topic = Topic.generic,
    context: Optional[str] = None
) -> RationaleEntry:
    # Basic slot filling
    text = template.text
    
    # Handle THING slot specially
    if "{THING}" in text:
        if context:
            # If context is provided, use it (maybe sanitized or prefixed)
            # User wants "context is sprinkled into templates"
            # We'll just assume context acts as the "THING"
            val = context
        else:
            # Fallback to topic-specific list
            options = THINGS_BY_TOPIC.get(topic, THINGS_BY_TOPIC[Topic.generic])
            val = random.choice(options)
        
        text = text.replace("{THING}", val)

    # Handle other slots
    for key, values in SLOTS.items():
        if f"{{{key}}}" in text:
            val = random.choice(values)
            text = text.replace(f"{{{key}}}", val)
    
    # Generate a deterministic ID based on the content
    content_hash = hashlib.md5(text.encode("utf-8")).hexdigest()[:8]
    
    return RationaleEntry(
        id=f"tpl-{content_hash}",
        text=text,
        tone=template.tone,
        topics=[topic.value],
        intensity=template.intensity,
        length=template.length,
        safe_for_work=True,
        source="template"
    )

def infer_topic(context: str) -> Topic:
    c = context.lower()
    if any(w in c for w in ["cab", "deploy", "freeze", "release", "fix"]):
        return Topic.change_request
    if any(w in c for w in ["budget", "cost", "price", "pay", "buy", "card"]):
        return Topic.budget
    if any(w in c for w in ["firewall", "access", "risk", "security", "audit"]):
        return Topic.security_exception
    if any(w in c for w in ["tool", "vendor", "saas", "license", "sub"]):
        return Topic.vendor_request
    if any(w in c for w in ["hire", "staff", "team", "resource", "headcount"]):
        return Topic.staffing
    if any(w in c for w in ["meet", "sync", "calendar", "invite"]):
        return Topic.meeting
    
    return Topic.generic

def apply_systemic_filters(candidates: List[RationaleEntry]) -> List[RationaleEntry]:
    """
    Applies hard constraints that can NEVER be bypassed (Caps, Cooldowns).
    """
    global REQUEST_COUNTER
    
    # Pre-calculate counts for caps
    no_variant_count = sum(1 for x in GLOBAL_ROLLING_WINDOW if x in NO_VARIANTS)
    no_cap_reached = no_variant_count >= 10  # Max 1% (10 per 1000)
    
    eligible = []
    for r in candidates:
        # 1. Cooldowns
        if r.id in COOLDOWNS:
            if REQUEST_COUNTER < COOLDOWNS[r.id]:
                # print(f"DEBUG: Dropping {r.id} (Cooldown until {COOLDOWNS[r.id]})")
                continue
        
        # 2. Hard Frequency Caps (No. Variants)
        if r.id in NO_VARIANTS:
            if no_cap_reached:
                # print(f"DEBUG: Dropping {r.id} (Cap Reached: {no_variant_count})")
                continue
                
        eligible.append(r)
    return eligible

def get_candidates(
    topic: Topic,
    context: Optional[str],
    tone: Optional[Tone],
    intensity: Optional[int],
    length: Optional[Length]
) -> List[RationaleEntry]:
    candidates = []
    
    # 1. Library Candidates
    lib_candidates = RATIONALES
    if tone:
        lib_candidates = [r for r in lib_candidates if r.tone == tone]
    if length:
        lib_candidates = [r for r in lib_candidates if r.length == length]
    
    # Topic Filtering
    if topic != Topic.generic:
        topic_val = topic.value
        lib_candidates = [r for r in lib_candidates if topic_val in r.topics or "generic" in r.topics]
    
    # Intensity Filtering & Gating
    if intensity is not None:
        if intensity >= 4:
            # High intensity: Strict floor > 2
            lib_candidates = [r for r in lib_candidates if r.intensity > 2]
            # Preference match
            lib_candidates = [r for r in lib_candidates if abs(r.intensity - intensity) <= 1]
            
        elif intensity <= 2:
            # Low intensity: Strict ceiling < 4
            lib_candidates = [r for r in lib_candidates if r.intensity < 4]
            lib_candidates = [r for r in lib_candidates if abs(r.intensity - intensity) <= 1]
        else:
            # Mid intensity
            lib_candidates = [r for r in lib_candidates if abs(r.intensity - intensity) <= 1]
            
    # SPECIAL RULE: "No." variants only eligible if deadpan AND intensity <= 2
    # This cleans the pool before systemic filters
    if tone == Tone.deadpan and intensity is not None and intensity <= 2:
        pass # Eligible
    elif tone is None and intensity is not None and intensity <= 2:
         # If tone not specified but intensity low, eligible if they match other criteria
         pass
    else:
        # If tone is NOT deadpan OR intensity > 2, remove No variants
        lib_candidates = [r for r in lib_candidates if r.id not in NO_VARIANTS]

    candidates.extend(lib_candidates)
    
    # 2. Template Candidates
    matching_templates = TEMPLATES
    if tone:
        matching_templates = [t for t in matching_templates if t.tone == tone]
    if length:
        matching_templates = [t for t in matching_templates if t.length == length]
        
    if intensity is not None:
        if intensity >= 4:
            matching_templates = [t for t in matching_templates if t.intensity > 2]
            matching_templates = [t for t in matching_templates if abs(t.intensity - intensity) <= 1]
        elif intensity <= 2:
            matching_templates = [t for t in matching_templates if t.intensity < 4]
            matching_templates = [t for t in matching_templates if abs(t.intensity - intensity) <= 1]
        else:
             matching_templates = [t for t in matching_templates if abs(t.intensity - intensity) <= 1]
    
    # Generate virtual candidates
    for tpl in matching_templates:
        candidates.append(generate_from_template(tpl, topic, context))
        
    return candidates

def select_rationale(
    client_ip: str,
    topic: Topic,
    context: Optional[str],
    tone: Optional[Tone],
    intensity: Optional[int],
    length: Optional[Length]
) -> RationaleEntry:
    
    history = get_history(client_ip)
    
    # --- Level 1: Strict Match ---
    # print("DEBUG: Level 1 (Strict)")
    candidates = get_candidates(topic, context, tone, intensity, length)
    filtered = apply_systemic_filters(candidates)
    final_pool = [c for c in filtered if c.id not in history]
    
    if final_pool:
        return random.choice(final_pool)
        
    # --- Level 2: Relax User History ---
    # print("DEBUG: Level 2 (Relax History)")
    # If we are here, either strict pool was empty OR all strict candidates were in history
    # We still use strict candidates, just ignore history
    if filtered:
        return random.choice(filtered)
        
    # --- Level 3: Relax Topic ---
    # print("DEBUG: Level 3 (Relax Topic)")
    # Try generic topic, keep other strict constraints
    candidates = get_candidates(Topic.generic, context, tone, intensity, length)
    filtered = apply_systemic_filters(candidates)
    # Try history filter first
    final_pool = [c for c in filtered if c.id not in history]
    if final_pool:
        return random.choice(final_pool)
    if filtered:
        return random.choice(filtered)

    # --- Level 4: Relax Intensity (Broaden Range) ---
    # print("DEBUG: Level 4 (Relax Intensity)")
    # For this implementation, we just call get_candidates with intensity=None
    # But we should try to keep it somewhat close.
    # Simpler: just clear intensity but keep Tone
    candidates = get_candidates(Topic.generic, context, tone, None, length)
    filtered = apply_systemic_filters(candidates)
    # Filter high/low crossing if possible? 
    # If user asked for 5, we shouldn't give 1.
    # But apply_systemic_filters will at least strip "No." if it shouldn't be there? 
    # Wait, "No." stripping happens in get_candidates.
    # If we pass intensity=None, "No." might appear.
    # So we must manually ensure "No." doesn't leak if original intent was High Intensity.
    
    if intensity and intensity >= 4:
         # Manually strip low intensity stuff if we can, or just trust the randomness
         # Better: Filter candidates to be >= 3
         filtered = [c for c in filtered if c.intensity >= 3]
         
    final_pool = [c for c in filtered if c.id not in history]
    if final_pool:
        return random.choice(final_pool)
    if filtered:
        return random.choice(filtered)

    # --- Level 5: Relax Tone (Last Resort) ---
    # print("DEBUG: Level 5 (Relax Tone)")
    candidates = get_candidates(Topic.generic, context, None, None, length)
    filtered = apply_systemic_filters(candidates)
    
    if not filtered:
        # Fallback of last resort: Generate a fresh safe template
        # ensuring it doesn't violate systemic rules (ID generation)
        # But wait, generate_from_template creates a new ID.
        # So we can just pick a random template and generate.
        tpl = random.choice(TEMPLATES)
        return generate_from_template(tpl, Topic.generic, context)
        
    return random.choice(filtered)

# --- Endpoints ---

@router.get("/raas")
def get_rationale(
    request: Request,
    topic: Optional[Topic] = Query(None, description="Preset topic category"),
    context: Optional[str] = Query(None, description="Specific context (e.g. 'DB migration', 'Q4 budget')"),
    tone: Optional[Tone] = Query(None, description="Tone of the response"),
    intensity: Optional[int] = Query(None, ge=1, le=5, description="Intensity level 1-5"),
    length: Optional[Length] = Query(None, description="Length of the rationale"),
    format: Format = Query(Format.json, description="Response format: json or plain")
):
    check_rate_limit(request)
    client_ip = request.client.host if request.client else "unknown"
    
    # Global Counter Increment
    global REQUEST_COUNTER
    REQUEST_COUNTER += 1
    
    effective_topic = topic
    if not effective_topic:
        if context:
            effective_topic = infer_topic(context)
        else:
            effective_topic = Topic.generic

    # Use robust selector
    selected = select_rationale(client_ip, effective_topic, context, tone, intensity, length)

    # Post-Selection Updates
    
    # 1. Update Global Window
    GLOBAL_ROLLING_WINDOW.append(selected.id)
    
    # 2. Update Cooldowns
    if selected.id == BEES_ID:
        COOLDOWNS[BEES_ID] = REQUEST_COUNTER + 200
        # print(f"DEBUG: BEES selected. Cooldown until {COOLDOWNS[BEES_ID]}")

    # 3. Update User History
    update_history(client_ip, selected.id)

    if format == Format.plain:
        return selected.text

    return RationaleResponse(
        rationale=selected.text,
        topic=effective_topic, 
        tone=selected.tone,
        intensity=selected.intensity,
        meta=RationaleMeta(
            id=selected.id,
            source=selected.source,
            safe_for_work=selected.safe_for_work
        )
    )

@router.get("/raas/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}

@router.get("/raas/topics")
def list_topics():
    # Aggregate all unique topics
    all_topics = set()
    for r in RATIONALES:
        all_topics.update(r.topics)
    return {"topics": sorted(list(all_topics))}

@router.get("/raas/tones")
def list_tones():
    return {"tones": [t.value for t in Tone]}
