---
description: Review the current diff through a UX lens before merge. Catches state coverage gaps, hierarchy issues, missing affordance, bad copy.
---

You are about to review a code change for UX quality. Invoke the `ux-reviewer` sub-agent.

Optional scope from user:

$ARGUMENTS

Instructions to the ux-reviewer agent:
1. Get the current diff. Use `git diff` (uncommitted) or `git diff main...HEAD` (PR scope) depending on context.
2. Identify UI files in the diff (.tsx, .jsx, .vue, .svelte, .html, .css, etc.)
3. For each UI change, apply the 6-section UX review checklist:
   - State coverage
   - Hierarchy & action priority
   - Affordance & feedback
   - Forms (if applicable)
   - Copy
   - Accessibility
4. Produce the output in required format: Must fix (P0/P1), Should fix (P2), Nice to fix (P3), What works.
5. Reference specific file:line locations. Propose specific fixes, not generic advice.

Skip code style, architecture, performance, and tests — those are outside the UX review scope.
