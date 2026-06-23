---
name: ux-auditor
description: "Use whenever the user asks to audit, review, critique, improve, fix, or refactor an existing UI. Triggers on 'audit this page', 'review my UI', 'why is this confusing', 'improve UX', 'make this better', 'find UX issues', or when given a screenshot/component to evaluate. Produces a prioritized, actionable audit report with concrete code-level fixes — not vague advice. Refuses to give generic feedback."
license: Commercial
---

# UX Auditor

## What this skill does

When the user shares an existing UI (code, screenshot, URL, or description) and asks for review/audit/improvement, produce a **prioritized, actionable audit report** with concrete fixes — not vague design advice.

The single most common failure mode of LLM UX feedback is vagueness ("consider improving the visual hierarchy"). This skill produces the opposite: specific, code-level, ranked actions.

## The audit output format (REQUIRED)

Every audit MUST produce this exact structure:

### 1. Intent recovery (the foundation)

Reverse-engineer the intent of the screen before critiquing it:

```
## Inferred intent
- Primary user: [guess]
- Primary action: [guess]
- Worst case being designed against: [guess]
```

If intent is unclear, ASK the user before continuing the audit. Critiquing UI without knowing intent produces wrong critique.

### 2. Issues table (the main deliverable)

A markdown table, sorted by severity (P0 first):

```
| # | Severity | Issue | Why it matters | Fix |
|---|----------|-------|----------------|-----|
| 1 | P0 | [Specific issue with element name/location] | [Real user impact, not abstract] | [Concrete code change OR design action] |
```

Use the following severity scale:

| Severity | Definition | Example |
|---|---|---|
| **P0** | Breaks the primary user flow OR risks data loss / wrong action | Destructive button has no confirmation, primary action is below the fold |
| **P1** | Significantly degrades usability for most users | Tab labels unclear, table has 12 columns, no empty state |
| **P2** | Friction that real users will hit but won't block them | Form lacks autocomplete hints, hover states missing |
| **P3** | Polish, micro-copy, edge cases | Toast duration too short, focus ring inconsistent |

Aim for 5-12 issues. More than 12 = you're listing nitpicks. Less than 5 = you're being too kind.

### 3. The 3 things to fix first

After the table, surface the top 3 P0/P1 issues with full implementation details — including code snippets if applicable. The 3 fixes that get 80% of the value.

### 4. What's working

End with a short list of what's actually GOOD. This is not flattery — it's about preserving good decisions during the rewrite.

## Audit checklist (your inspection lens)

Walk through ALL of these when auditing. Most issues fall into one of these buckets:

### Intent & hierarchy
- [ ] Is the primary action obvious in 3 seconds?
- [ ] Is there one primary action, or are 3 buttons competing?
- [ ] Does the hierarchy survive squinting (visually distinct levels)?
- [ ] Are secondary actions appropriately demoted?
- [ ] Is destructive action visually distinct (not styled as primary)?

### Information architecture
- [ ] Is the data organized by user mental model, not database schema?
- [ ] Are fields/columns grouped meaningfully?
- [ ] Is there a clear scanning pattern (F, Z, layer-cake, spotlight)?
- [ ] Are 5+ related fields chunked into groups?
- [ ] Can a table be reduced to 5-7 meaningful columns?

### States
- [ ] Loading state present and matches layout?
- [ ] Empty state explains WHY + offers next action?
- [ ] Error states are specific + offer recovery?
- [ ] Success has visible confirmation, not silence?
- [ ] Partial state degrades gracefully?
- [ ] Offline behavior defined?

### Affordance & feedback
- [ ] Clickable things look clickable?
- [ ] Hover, focus, active states all defined?
- [ ] Focus ring visible (not `outline:none`)?
- [ ] Touch targets ≥ 44×44px?
- [ ] Feedback within 100ms on all actions?
- [ ] Destructive actions have appropriate friction (confirmation/undo)?

### Forms
- [ ] ≤7 fields visible at once?
- [ ] Labels above fields (not placeholder-as-label)?
- [ ] Smart defaults applied?
- [ ] Validation timing reasonable (blur, not keystroke)?
- [ ] Error messages specific + actionable?
- [ ] Required vs optional clear?

### Copy & microcopy
- [ ] Action verbs on buttons (not "Submit", "OK")?
- [ ] Tooltips clarify, not replace, labels?
- [ ] Error messages avoid "Something went wrong"?
- [ ] Empty states teach, not just inform?
- [ ] Use of "you" vs "the user"?

### Accessibility (UX-related a11y, not full WCAG)
- [ ] Color isn't the only differentiator (status icons + colors)?
- [ ] Contrast meets AA on text?
- [ ] Icon-only buttons have aria-labels?
- [ ] Form fields have associated labels?
- [ ] Focus order matches visual order?
- [ ] Keyboard navigation possible end-to-end?

### Mobile / responsive
- [ ] Single column on mobile (no horizontal scroll)?
- [ ] Tap targets large enough?
- [ ] Sticky primary action on long forms?
- [ ] Modals usable on small screens (not blocked by keyboard)?

### Performance perception
- [ ] Skeleton matches final layout (no jump)?
- [ ] Optimistic updates where safe?
- [ ] Loading indicators for >100ms operations?
- [ ] Long operations show progress?

## How to inspect different inputs

### Screenshot/image
- Identify all interactive elements
- Assess hierarchy by squinting (mentally blur the image)
- Check actions tier (count primary, secondary, tertiary buttons)
- Look for states (is there a loading shown? empty shown?)
- Note contrast and density

### Code (JSX/HTML)
- Trace which states are handled (`isLoading`, `isError`, `isEmpty`)
- Check semantic HTML (button vs div, a vs button)
- Check accessibility (aria-label, semantic roles)
- Check for hover/focus styles (CSS or class names)
- Look for hardcoded copy that should be variables

### URL
- If web_fetch is available, fetch the page
- Look at the rendered HTML
- Apply the audit checklist

### Description only
- Ask for a screenshot or code if at all possible
- If user insists on description, audit what's described AND flag what can't be assessed without seeing it

## What to refuse

NEVER produce these:
- ❌ Vague advice ("consider improving the layout")
- ❌ Generic principles ("ensure good visual hierarchy")
- ❌ Empty praise ("looks pretty good overall")
- ❌ Lists of >12 issues (signal you're listing nitpicks)
- ❌ Audits without an inferred intent statement
- ❌ Fixes that say "redesign this" without specifics

Every issue must reference a SPECIFIC element ("the 'Delete' button in the row toolbar", not "some buttons").
Every fix must be ACTIONABLE ("Move 'Delete' to overflow menu and require typed confirmation", not "improve destructive action handling").

## Tone

- Direct, specific, professional
- Not apologetic ("I might be wrong but...")
- Not flattering ("this is already great but...")
- Treat the user as a peer who wants real feedback

## Example output

User shares a screenshot of an admin user list with 12-column table, two equally-prominent "Delete" and "Edit" buttons per row, no empty state, search hidden in a filter.

```
## Inferred intent
- Primary user: Internal admin (likely support / ops)
- Primary action: Find a specific user → take an action on them
- Worst case being designed against: Acting on the wrong user

## Issues

| # | Severity | Issue | Why it matters | Fix |
|---|----------|-------|----------------|-----|
| 1 | P0 | "Delete" button styled identically to "Edit" in every row, no confirmation | Misclick deletes a user account permanently | Move Delete to overflow menu (kebab icon). Confirmation modal requires typed email. |
| 2 | P0 | Search is hidden behind a "Filter" dropdown | Primary action (find user) is buried — adds 3 clicks every time | Replace top filter dropdown with prominent search input, full-width on mobile |
| 3 | P1 | Table has 12 columns — name, email, ID, created, last login, role, status, plan, MRR, region, source, actions | Cognitive overload — only 3 are decision-relevant for support | Reduce to 5: Name+email combined, Status pill, Plan, Last active, Actions. Move rest to drill-down detail. |
| 4 | P1 | No empty state — when search returns nothing, the page just shows blank rows | User wonders if the app is broken | Empty state: "No users match '{query}'. Clear search · Search all users" |
| 5 | P1 | "Active" status uses only green text — relies on color alone | Colorblind users + small mobile screens can't distinguish | Add status icon + label: ●Active / ○Inactive / ⊘Suspended |
| 6 | P2 | No loading state when fetching | First load looks broken on slow connections | Add skeleton with 5 rows matching final shape |
| 7 | P2 | Pagination at the bottom only | Users with 200 users hit page 2 frequently — pagination should be reachable | Add sticky pagination footer + count "Showing 1-50 of 247" |
| 8 | P2 | Row hover state missing | Users don't know rows are clickable | Add hover background + cursor pointer; OR make ID column the click target with link styling |
| 9 | P3 | "Delete" tooltip says "Delete" — redundant | Tooltips should clarify, not echo | Change to "Permanently delete user account" |
| 10 | P3 | Created column shows ISO timestamp "2024-03-15T10:32:11Z" | Hard to scan, no one needs the seconds | Show relative: "3 months ago" with full date on hover |

## Top 3 to fix first

### 1. Confirmation + demotion for Delete (P0)

This is the single biggest risk. Right now, one misclick destroys an account. Two changes:

**a. Demote visually:**
```jsx
// Before
<Button onClick={onDelete} variant="destructive">Delete</Button>

// After — Delete lives in overflow only
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <IconButton aria-label="More actions"><MoreIcon /></IconButton>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={onResetPassword}>Reset password</DropdownMenuItem>
    <DropdownMenuItem onSelect={onSuspend}>Suspend</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive onSelect={() => setConfirmOpen(true)}>
      Delete account...
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**b. Typed confirmation:**
```jsx
<ConfirmDialog
  open={confirmOpen}
  title={`Delete ${user.email}?`}
  body="This permanently deletes the user, their data, and notifies them by email. This cannot be undone."
  confirmationField={{
    label: "Type the user's email to confirm",
    expected: user.email,
  }}
  confirmLabel="Permanently delete"
  defaultFocus="cancel"
/>
```

### 2. Promote search to primary (P0)

[concrete code change...]

### 3. Reduce columns 12 → 5 (P1)

[concrete code change with column choices...]

## What's working
- Table is sortable on each column — keep it
- Pagination uses real page numbers (not "next" only) — keep it
- Visible "Add user" button in the top-right is correctly positioned as the secondary CTA on a search-primary page
```

## Stopping rules

- Do NOT produce audits with vague entries — every row must be actionable
- Do NOT skip the "what's working" section — it preserves good decisions
- Do NOT exceed 12 issues — beyond that, you're listing nitpicks not auditing
- If you can't see enough to audit (description only), ask for screenshot/code first
