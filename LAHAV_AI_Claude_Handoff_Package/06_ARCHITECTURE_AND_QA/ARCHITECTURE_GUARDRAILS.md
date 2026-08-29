# Architecture Guardrails and Technical Verification

## Hard product constraints

- V1 Hebrew only, native RTL.
- Additional recurring software cost should ideally be ₪0 except the domain.
- A paid dependency is allowed only if technically necessary and explicitly approved after explaining why, the cheapest viable option and recurring cost.
- Do not sacrifice basic security, reliability or ownership solely to save money.
- Blog/CMS capability is required even if no articles are public at launch.
- AI may assist drafting content, but public publishing requires human review/approval. Autonomous AI publishing is out of scope.
- Website internal CRM is out of scope.
- English V1, e-commerce, client portal/login, public fixed pricing/direct checkout, newsletter, floating WhatsApp, heavy popup strategy and chatbot are out of scope unless later approved.

## Security requirements

- Public marketing website is public.
- Admin/content editing is protected by real authentication/access control, not hidden URLs.
- Only authorized users can edit/publish.
- Public forms cannot grant admin access.
- Apply least privilege.
- One admin/editor is enough initially; architecture should allow additional users/roles later without rebuild.
- MFA/2FA should be evaluated if free/reasonable.

## Technical verification required before implementation decisions are locked

1. Existing repository and stack: inspect first; do not assume a framework.
2. Hosting/deployment platform and free-tier limits.
3. CMS choice: create/edit/publish, human approval, secure admin, low/no cost.
4. Contact form backend, spam protection, delivery destination and data retention.
5. Booking/scheduling provider or workflow; free preferred.
6. WhatsApp destination number.
7. Domain and DNS/provider details.
8. Analytics: whether GA/Search Console or another solution is approved.
9. Cookie/privacy impact of the actual production stack.
10. CRM/lead destination for Contact/Discovery submissions.
11. Founder story and approved photography.
12. Real article inventory.
13. Whether Projects/Work can be enabled (requires at least two genuine publishable items).
14. Legal privacy/accessibility requirements and final legal text.
15. Contact email/phone/address/legal entity details, if any will be public.

## Architecture principle

Prefer the simplest maintainable architecture that satisfies the requirements. Use native platform/framework capabilities before adding custom infrastructure or paid services.
