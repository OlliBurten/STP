---
name: ux-intent-discovery
description: "MUST USE before generating any new UI component, page, screen, or layout. Forces Claude to clarify user intent — who uses it, what's the primary action, what's the worst-case scenario — BEFORE writing UI code. Triggers on phrases like 'build a dashboard', 'create a form', 'design a page', 'make an admin panel', 'build a settings screen', or any request to generate a new interface. Do NOT skip this skill — coding UI without intent discovery produces database-shaped interfaces, not user-shaped interfaces."
license: Commercial
---

# UX Intent Discovery

## When to use

Before writing a single line of UI code for any new interface — page, screen, modal, panel, dashboard, form, table view, settings, or any composition of UI elements that a user will interact with.

Do NOT skip this. The whole point of UX Engine is to prevent Claude from producing database-shaped UI. Database-shaped UI is what you get when you skip intent discovery.

## What you must do

When triggered, STOP before coding. Do not output JSX, HTML, or component code yet.

First, gather the **5 Intent Questions**. Check the prompt, conversation history, attached files (schemas, design specs), and project context for answers. For anything missing, ASK the user. Do not guess.

### The 5 Intent Questions

1. **WHO** — Who is the primary user? (role, expertise level, frequency of use)
2. **PRIMARY ACTION** — What is the ONE thing this user must be able to do? (the 80% case)
3. **SECONDARY ACTIONS** — What are the 2-3 next most important actions? (the 15% case)
4. **CONTEXT** — Where and how is this used? (mobile on the go / desktop focused / shared screen / 2am incident)
5. **WORST CASE** — What is the worst thing that could happen here? (data loss, wrong recipient, irreversible action, security breach, missed deadline)

### How to ask (when info is missing)

Ask in ONE message, formatted as a compact list. Don't drip-feed questions. Example:

> Before I build this, 5 quick UX questions:
> 1. Who's the primary user here — internal admin, external customer, or technical operator?
> 2. What's the ONE thing they'll do here 80% of the time?
> 3. What 2-3 secondary actions matter?
> 4. Context — desktop focused work, or mobile / quick check-ins?
> 5. What's the worst-case scenario I should design against (data loss, wrong action, etc.)?

If the user pushes back ("just build it"), respect it but flag the risk: *"Building with assumptions: [list assumptions]. These can be wrong — happy to revise once you confirm."* — then proceed.

## After answers are gathered

Synthesize into a single **Intent Brief** at the top of your response, before any code:

```
## Intent Brief
- User: [role + expertise]
- Primary action: [the 80% thing]
- Secondary: [the 15% things]
- Context: [environment + urgency]
- Worst case: [what we design against]
- Design implications: [3-5 bullets translating intent into UI decisions]
```

The Intent Brief is the CONTRACT for the rest of the work. Every UI decision must trace back to it.

## Translating intent into UI decisions

Common mappings:

| Intent signal | UI decision |
|---|---|
| Primary action used 80% of the time | One prominent primary CTA, top-right or center, never buried in a menu |
| Worst case = irreversible action | Confirmation step + undo affordance, never a single click |
| Worst case = wrong data shown | Strong identifying context (user name, ID, timestamp visible always) |
| Mobile / quick check-in | Single column, no horizontal scroll, thumb-reachable actions |
| Desktop focused work | Multi-pane allowed, keyboard shortcuts surfaced, density acceptable |
| 2am incident | High contrast, big touch targets, no clever interactions, status colors obvious |
| Expert user, high frequency | Density > whitespace, batch actions, no hand-holding tooltips |
| Novice user, infrequent use | Generous whitespace, progressive disclosure, inline help |

## Anti-patterns to refuse

When intent indicates these, REFUSE the pattern and propose the alternative:

- ❌ Generating a CRUD table for ALL fields when the primary action only needs 3
- ❌ Putting destructive actions next to primary actions
- ❌ Showing every available filter by default
- ❌ Dropdowns for fewer than 4 options (use segmented control)
- ❌ Modals for primary actions (use inline edit or dedicated page)
- ❌ Tabs when sections aren't mutually exclusive
- ❌ "Admin" UI that shows every database field instead of decision-relevant fields

## Output discipline

After the Intent Brief, when you DO write UI code:
- Reference the brief in code comments at key decision points
  (e.g., `// Primary action — see Intent Brief: edit invoice`)
- If a code decision contradicts the brief, surface it explicitly with reasoning

## Example

User: *"Build me an admin dashboard for managing users."*

WRONG response: starts coding a table with all user fields.

RIGHT response:

> Before coding, 5 UX questions:
> 1. Who's the admin — customer support agent, security/compliance, or technical ops?
> 2. What's the ONE thing they do here 80% of the time — look up a specific user, review new signups, suspend accounts, audit something else?
> 3. What 2-3 secondary actions matter most?
> 4. Is this used in a focused desk session or quick checks during support calls?
> 5. Worst case to design against — accidentally exposing PII, suspending the wrong user, missing a fraud signal?

THEN, once the user replies "support agents, they look up specific users 80% of the time during support calls, secondary is resetting password and viewing recent activity, mobile sometimes, worst case is acting on wrong user":

> ## Intent Brief
> - User: Support agents (frequent, non-technical)
> - Primary action: Look up a specific user during a live call
> - Secondary: Reset password, view recent activity
> - Context: Sometimes mobile, often pressed for time mid-call
> - Worst case: Acting on the wrong user account
> - Design implications:
>   - Search dominates the page (large, focused, top)
>   - User identity always visible (name + email + ID) once selected
>   - Reset password and recent activity are 1-click from user view
>   - Destructive actions (suspend, delete) live behind a confirmation with the user's email retyped
>   - Mobile-first single column, search-first
>
> [now code follows]

## Stopping rules

- NEVER output UI code before the Intent Brief exists in the conversation
- If the user explicitly waives it ("skip the questions"), still produce the Intent Brief based on assumptions, marked clearly as `## Intent Brief (assumed — confirm before shipping)`
