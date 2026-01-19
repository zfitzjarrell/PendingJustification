
# Pending Justification as a Service (JaaS)

Because you shouldn’t have to explain the obvious more than once.

Pending Justification is a small API that generates clear, professional justifications for security, audit, vendor, and compliance scenarios. It exists for one reason:

**The work keeps asking for explanations.
The explanations keep saying the same thing.
So we automated them.**

---

## What this does

JaaS generates structured, defensible justification text for situations like:

* Vendor security questionnaires
* Audit evidence requests
* Risk acceptances and exceptions
* Control deferrals
* “Why isn’t this implemented yet?”
* “Please explain your decision”

It doesn’t replace judgment.
It replaces repetition.

---

## What this does *not* do

* It does not make decisions for you
* It does not approve risk
* It does not guarantee audit outcomes
* It does not pretend compliance is fun

It gives you a solid, reasonable explanation so you can move on.

---

## Why this exists

Because:

* Auditors ask the same questions every year
* Vendors want justification nobody reads
* Security teams rewrite the same paragraph forever
* “Pending justification” has become a permanent state

This API exists so humans don’t have to keep typing the same answer with different nouns.

---

## How it works

You send context.
You get justification.

That’s it.

### Example request

```bash
curl -X POST https://pendingjustification.com/api/justify \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "vendor_security",
    "context": "Vendor does not support SSO",
    "risk_level": "medium",
    "audience": "third_party"
  }'
```

### Example response

```json
{
  "justification": "The vendor does not currently support SSO integration. This limitation has been reviewed and accepted based on the vendor’s limited access scope, compensating controls, and contractual obligations. The risk is documented and will be reassessed during the next review cycle or upon material change."
}
```

That’s the whole idea.

---

## Common use cases

* Copy-paste into a vendor portal
* Drop into an audit response
* Attach to a Jira or ServiceNow ticket
* Add to a risk register
* Paste into Slack and close the thread

Anywhere someone asks “why,” this answers it.

---

## API design philosophy

* Simple inputs
* Predictable outputs
* No dashboards required
* No workflow assumptions
* Works with whatever mess you already have

If you can make an HTTP request, you can use this.

---

## Who this is for

* Security teams
* GRC teams
* IT managers
* Audit survivors
* Anyone tired of rewriting “acceptable risk”

If you’ve ever sighed before typing “due to compensating controls…”, you’re the audience.

---

## Is this serious?

Yes.

Is there humor in it?
Also yes.

Compliance is absurd sometimes. This just acknowledges it quietly and moves on.

---

## Roadmap (loose, honest)

* More scenario presets
* Better tone controls
* Optional Slack integration
* Browser helper for vendor portals
* Nothing enterprise-y unless it actually helps

No promises. No hype.

---

## Disclaimer

All outputs are informational and should be reviewed by a human.
If you blindly paste this into an audit and blame the API, that’s on you.

---

## TL;DR

You already know what the justification is.
This just writes it down for you.

