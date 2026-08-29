# Parking Lot — deferred items with explicit triggers

ACTIVE document. Supersedes `docs/approved/PARKING_LOT.md` (legacy, historical).
Nothing here is implemented in V1. Nothing here is forgotten.

## Preserved future items (F-18)

| # | Item | Trigger — revisit when | Rules that survive into the future |
|---|---|---|---|
| **PL-1** | **Projects / Case Studies** (index + detail) | After V1 launch **AND** at least **two real, publishable projects** exist with sufficient approved material (F-3) | No invented ROI · no invented metrics · no fake client logos · no fake testimonials · **in-progress projects must be clearly labelled as in progress** · Baan Thai may not be shown as complete or as a proven result until genuinely complete and cleared |
| **PL-2** | **Custom paid domain** | Production-launch readiness (F-5) | The only accepted recurring expense. Attaching it requires DNS plus one hosting setting — no rebuild. Privacy policy and email sender must be re-checked at that point |
| **PL-3** | **GA4** | Optional future analytics expansion (F-9) | Adding GA4 makes a cookie-consent banner necessary and changes the privacy policy. Cloudflare Web Analytics stays the V1 choice |
| **PL-4** | **Additional admin / editor users and roles** | If the team grows (F-13) | Architecture already supports it: invite a collaborator and add them to the allow-list. Least privilege stays. No redesign permitted as a reason to defer it |

## Other deferred items carried forward

| # | Item | Trigger |
|---|---|---|
| PL-5 | English version of the site | Post-V1 business decision. Structure must not block it; no multilingual infrastructure is built now |
| PL-6 | Large-scale SEO / content campaign | After launch, once the article workflow is running |
| PL-7 | Campaign or service-specific landing pages | If paid campaigns start |
| PL-8 | Productized AI systems sold in a structured way | Business decision |
| PL-9 | Chatbots as a **capability inside a relevant service page** | Only if factually justified. **Never as a sixth top-level service** (F-2) |
| PL-10 | Accessibility statement page | Conditional on the legal verification (O-5) |
| PL-11 | Terms of service | Not a V1 priority; add if genuinely required |
| PL-12 | Lead-to-CRM integration | Only when lead volume justifies it. No full CRM in V1 (F-10) |
| PL-13 | MFA/2FA beyond the GitHub account's own 2FA | If the auth model ever changes |
| PL-14 | Auto Publish (Mode 2) running truly unattended | Requires B-1 (LLM API spend approval) and O-9 (safety model approval) |

## Review discipline
This file is re-read at the QA gate and again before production launch. An item may only be closed
by an explicit client decision, never by being quietly implemented or quietly dropped.
