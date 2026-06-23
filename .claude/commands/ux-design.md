---
description: Design UI before coding. Pass a feature description. Invokes the ux-designer sub-agent to produce wireframe + spec BEFORE implementation.
---

You are about to design UI before implementation. Invoke the `ux-designer` sub-agent.

Feature to design:

$ARGUMENTS

Instructions to the ux-designer agent:
1. Gather the 5 intent answers using `ux-intent-discovery` skill. Ask the user if missing.
2. Produce the full output: Intent Brief, Design Rationale, ASCII Wireframe, Component Spec, States Checklist, A11y callouts, Open Questions.
3. Do NOT write production code. The design artifact is the deliverable.
4. After you complete the design, the user will decide whether to proceed to implementation.
