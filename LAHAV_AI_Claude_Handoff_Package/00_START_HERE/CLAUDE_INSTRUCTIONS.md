# Claude Code Operating Instructions

## First command / message

Use the exact prompt in `PROMPT_TO_PASTE_IN_CLAUDE.txt`.

## Stage discipline

1. Architecture review first.
2. Wait for approval.
3. Implement only the approved architecture.
4. QA before deployment.
5. Deployment/handoff only after QA approval.

Do not silently skip or merge these gates.

## Decision labels

Every architecture review must clearly distinguish:

- **Client Requirement** - explicitly required by the approved project sources.
- **Architecture Recommendation** - Claude's proposed implementation choice.
- **Technical Verification Required** - platform/API/cost/legal/capability item not yet verified.

Never present a recommendation as if it were a client requirement.

## Visual rule

Claude has permission to upgrade the Stitch art direction materially. The requirement is to preserve the business structure and brand, not to reproduce every pixel.
