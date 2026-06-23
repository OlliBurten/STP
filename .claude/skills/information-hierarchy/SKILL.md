---
name: information-hierarchy
description: "Use whenever generating or modifying UI that contains multiple actions, sections, data points, or competing elements. Enforces visual hierarchy — primary/secondary/tertiary actions, F-pattern and Z-pattern scanning, action priority, density rules, and grouping. Triggers on dashboards, tables, forms, settings pages, list views, detail pages, or any UI with more than one possible user action. Refuses cluttered designs and proposes hierarchical alternatives."
license: Commercial
---

# Information Hierarchy

## When to use

Any UI that has more than one possible action, more than one data section, or any density of information. This is most UIs. Skip only for truly single-purpose screens (a single login form, a confirmation modal with one button).

## The core principle

> Every screen has ONE primary action. Some screens have 2-3 secondary actions. Everything else is tertiary or removed.

If you cannot identify the ONE primary action, the screen has a UX problem, not a UI problem. Go back to `ux-intent-discovery`.

## The 3-Tier Action Rule

| Tier | Count per screen | Visual treatment |
|---|---|---|
| **Primary** | 1 (rarely 2) | Solid filled button, brand or accent color, largest size, top-right or main column |
| **Secondary** | 2-3 max | Outlined or ghost button, neutral color, same size as primary or smaller |
| **Tertiary** | Unlimited | Text link, icon button, or buried in overflow menu |

REFUSE designs with:
- More than 2 primary buttons visible at once
- Multiple buttons in primary style competing for attention
- Destructive actions styled as primary (Delete should NEVER be primary-styled)

## Scanning patterns

Apply the right pattern for the content type:

### F-pattern (text-heavy, list views, search results)
- Most important info top-left
- Horizontal scan at top, secondary scan partway down, vertical scan down left edge
- Headings carry the weight (must be visually distinct)
- Used for: article lists, search results, email inboxes, log views

### Z-pattern (marketing pages, single-screen UIs with few elements)
- Logo top-left → primary nav top-right → diagonal scan → CTA bottom-right
- Used for: landing pages, modal dialogs, empty states, confirmation screens

### Layer-cake (dashboards)
- Stacked horizontal sections, each scannable independently
- Top: KPI summary / hero metric
- Middle: drill-down sections (most important first)
- Bottom: secondary data, archives, support links

### Spotlight (detail pages)
- One subject, identified prominently (avatar, name, ID, status)
- Actions for that subject grouped adjacent to identity
- Related data below in collapsible sections

Choose ONE pattern per screen. Mixing patterns destroys scannability.

## Visual hierarchy enforcement

The hierarchy must be readable in 3 seconds when squinting (a real test — blur the screen, can you still tell what's primary?).

### Size
- Heading level differences must be ≥ 1.25× ratio between levels
- Primary CTA ≥ 1.5× the size of body text (in height)
- Don't use color alone for hierarchy — size + weight + position must reinforce

### Weight
- Primary headings: 600-700 weight
- Secondary: 500-600
- Body: 400
- Captions / meta: 400 with reduced opacity (60-70%)

### Spacing
- Vertical rhythm: spacing scales with hierarchy
  - Between major sections: 48-64px
  - Between subsections: 24-32px
  - Within a group: 8-16px
- More space ABOVE a heading than below it (anchors the heading to its content)

### Color
- Use color for SEMANTIC meaning, not hierarchy
- Hierarchy comes from size/weight/position
- Reserve accent color for: primary action + critical status only

## Table-specific rules

Tables are where hierarchy goes to die. Enforce:

- **Max 5-7 visible columns** without horizontal scroll. More than that = bad data design, not bad UI.
- **One column must dominate** — the identity column (name, title, ID). Bold or larger.
- **Right-align numbers**, left-align text, never center
- **Status as a column** uses a colored pill, not just text
- **Actions column on the far right**, icon-only with tooltip OR a single overflow menu
- **Empty cells** show "—" not blank (intentional emptiness)
- **Row hover** affordance is mandatory if rows are clickable
- **Sticky header** if scroll is possible

REFUSE tables with:
- 10+ columns visible without justification
- Action buttons repeated in every row taking up multiple columns
- No identifying column dominance
- All columns visually equal weight

## Grouping rules

Use proximity, similarity, and dividers — in that order:

1. **Proximity first**: things closer together = related. This is free and the strongest signal.
2. **Similarity second**: same color/shape/size = related category.
3. **Dividers last**: only when proximity + similarity aren't enough. Each divider is visual weight.

Specific rules:
- A divider every 3 items is too many dividers
- Cards within cards = stop, go back, regroup
- More than 2 levels of nested borders = refuse, flatten

## Anti-patterns to refuse

- ❌ Three "primary" buttons side by side
- ❌ Sidebar with 15+ items at the same visual level
- ❌ All-caps text used as body (only acceptable for short labels/eyebrow)
- ❌ Italic body text (kills readability)
- ❌ Centered body text in containers wider than 80ch
- ❌ Equal-weight headings and body (no distinguishable hierarchy)
- ❌ Card grids where every card is "featured"
- ❌ Filters and content competing for the same screen real estate equally

## Output discipline

When generating UI, include hierarchy notes in code comments at structural decision points:

```jsx
{/* Primary action — see Intent Brief */}
<Button variant="primary">Save changes</Button>

{/* Secondary actions — 2 max, ghost style */}
<Button variant="ghost">Cancel</Button>
<Button variant="ghost">Preview</Button>

{/* Tertiary — overflow only */}
<DropdownMenu>...</DropdownMenu>
```

## Example

WRONG (no hierarchy):
```jsx
<div>
  <Button>Save</Button>
  <Button>Delete</Button>
  <Button>Cancel</Button>
  <Button>Preview</Button>
  <Button>Export</Button>
  <Button>Share</Button>
</div>
```

RIGHT (3-tier hierarchy):
```jsx
<div className="flex items-center justify-between">
  <div className="flex gap-2">
    <Button variant="ghost">Cancel</Button>          {/* tertiary */}
    <DropdownMenu>                                    {/* tertiary group */}
      <DropdownItem>Preview</DropdownItem>
      <DropdownItem>Export</DropdownItem>
      <DropdownItem>Share</DropdownItem>
      <DropdownSeparator />
      <DropdownItem destructive>Delete</DropdownItem>
    </DropdownMenu>
  </div>
  <Button variant="primary">Save changes</Button>     {/* primary */}
</div>
```
