---
name: feedback-and-affordance
description: "Use whenever generating interactive elements — buttons, links, destructive actions, hover states, focus states, drag-and-drop, or any user-triggered action. Enforces feedback within 100ms, confirmation for destructive actions, clear affordance (clickable looks clickable), and accessibility states. Refuses interfaces with silent actions or unclear interactivity."
license: Commercial
---

# Feedback & Affordance

## The two laws

### Law 1: Every user action gets feedback within 100ms
If feedback takes longer than 100ms, the user doubts whether their click registered. Either:
- Make feedback instant (button depresses, loading spinner appears, state changes locally)
- Or pre-empt with a loading state at click time, even if the actual work takes longer

### Law 2: Affordance must be unambiguous
If you have to wonder whether something is clickable, the affordance failed. Clickable things look clickable. Decorative things don't.

## Interactive state coverage

Every interactive element must visibly handle ALL of these states:

| State | Visual indicator |
|---|---|
| **Default** | Resting appearance |
| **Hover** | Cursor change + visual lift (shadow, color shift, underline) |
| **Focus (keyboard)** | Distinct focus ring — 2px outline, offset from element |
| **Active (pressed)** | Brief scale-down or color darken |
| **Disabled** | 50% opacity + cursor: not-allowed + aria-disabled |
| **Loading** | Spinner inside, original text becomes "Saving…" or similar |

If a button doesn't visibly change on hover/focus/active, it's broken. No exceptions.

### Focus state specifics
- Default browser outline is acceptable if styled visibly
- Custom focus ring: 2px solid, offset 2px from element, brand color
- NEVER `outline: none` without a replacement focus indicator (a11y violation)
- Focus must be visible on dark and light backgrounds (test both)

## Affordance rules

### Buttons look like buttons
- Filled or outlined shape
- Solid background color (primary) or border (secondary)
- Padding makes them tappable (min 44×44px touch target)
- Cursor: pointer on hover
- Text inside is action-oriented ("Save changes", not "Click here")

### Links look like links
- Underlined OR distinct color (preferably both for non-blue colors)
- Cursor: pointer
- Visited state distinguishable from unvisited on long-form content
- Inline links: underlined to distinguish from surrounding text
- Navigation links: can drop underline if container clearly nav

### Don't lie about affordance
- Don't style non-clickable text in link blue
- Don't style decorative icons identically to action icons
- Don't make whole rows clickable AND have buttons inside (event conflict)
- If a card is clickable, ENTIRE card is clickable + has cursor pointer on hover

## Destructive actions

Destructive = anything irreversible OR expensive to undo: delete, suspend, charge, send, publish.

### Treatment levels

| Risk | Pattern |
|---|---|
| Low (clear undo path) | Single click + toast with undo affordance: "Deleted. Undo (5s)" |
| Medium (some recovery) | Confirmation modal with destructive button styled red |
| High (real consequences) | Confirmation modal requiring TYPED confirmation ("Type DELETE to confirm") |
| Critical (cannot recover) | Confirmation + password/2FA re-entry |

### Confirmation modal anatomy
- Title states what will happen ("Delete invoice #1247?")
- Body explains consequences ("This will permanently delete the invoice and notify the customer.")
- Primary button is the destructive action (red), labeled with the verb ("Delete invoice")
- Secondary button is cancel
- Focus defaults to CANCEL, not the destructive action

### Undo affordance
For undoable actions (most things):
- Toast appears: "Deleted invoice #1247"
- Includes "Undo" button
- Visible for 5-10 seconds (longer for destructive)
- Undo restores exact previous state

If you can offer undo, prefer it over confirmation modal. Confirmation modals add friction.

## Hover state rules

Hover states reinforce affordance but should NEVER be the only signal of interactivity. Touch devices have no hover.

- Use hover to enhance, not to reveal critical info
- Tooltip hover delay: 300-500ms (instant tooltips feel jumpy)
- Tooltip-only info must also be reachable by keyboard focus
- Hover that triggers heavy actions (auto-play video, etc) is anti-pattern

## Click target sizing

Mobile and accessibility require generous targets.

| Element | Minimum size |
|---|---|
| Buttons | 44×44px (iOS HIG / WCAG AAA) |
| Icon buttons | 44×44px touch zone, even if visual icon is smaller |
| Form field tap target | 48px height |
| Adjacent buttons | 8px gap minimum between targets |
| Text links in body | Natural sizing OK, but isolate from other links |

If a target is smaller than 44×44 visually, ensure padding extends the touch zone.

## Loading feedback specifics

### Button loading
```
[Save changes]  →  [⟳ Saving...]
```
- Spinner replaces or precedes label
- Label changes to verb-ing form
- Button stays the same width (prevent layout shift) — fix with min-width
- Button is disabled during loading (prevent double-submit)

### Optimistic updates
For low-risk actions (like toggle, favorite, vote), update UI immediately, then sync. Revert with explanation if server fails. This is the gold standard for perceived speed.

### Long operations (>3s)
- Show progress when measurable
- Allow cancel
- Show ETA when known
- For background ops, surface a notification when complete

## Error feedback on actions

When an action fails:
- Inline message near the trigger (not in a corner toast for action-related errors)
- Specific error ("Couldn't save — your changes are too large") not generic
- Retry affordance present
- Original state preserved (don't lose user input)

## Accessibility-as-affordance

Accessibility states ARE affordance states:

- `aria-pressed` for toggle buttons (state visible to screen readers)
- `aria-busy` during loading
- `aria-disabled` for disabled (always paired with visual treatment)
- `aria-live="polite"` for status updates ("Saved" toast)
- Role attributes match the semantic role (button is `<button>`, link is `<a>`)

## Anti-patterns to refuse

- ❌ Click without visible feedback (Mystery: did it work?)
- ❌ Hover-only reveal of important actions (touch users locked out)
- ❌ Disabled buttons with no explanation of why
- ❌ "Click here" link text (label the action: "View invoice")
- ❌ Destructive actions styled like primary actions
- ❌ Confirmation modals with destructive action as default focus
- ❌ Removed focus outlines without replacement
- ❌ Decorative items styled like interactive items (looks clickable, isn't)
- ❌ Tooltip-only critical information (mobile + a11y fail)
- ❌ Auto-dismissing success notifications for important actions (no time to read)
- ❌ Icon-only buttons without aria-label

## Example

WRONG:
```jsx
<div onClick={handleDelete} className="text-red-500">
  Delete
</div>
```
Problems: not a button, no hover/focus/active states, no confirmation, no feedback.

RIGHT:
```jsx
function DeleteButton({ invoice, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(invoice.id);
      toast.success(`Deleted invoice #${invoice.number}`, {
        action: { label: 'Undo', onClick: () => restore(invoice) },
        duration: 8000,
      });
    } catch (err) {
      toast.error(`Couldn't delete: ${err.userMessage}`);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost-destructive"
        onClick={() => setShowConfirm(true)}
        aria-label={`Delete invoice ${invoice.number}`}
      >
        <TrashIcon /> Delete
      </Button>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={`Delete invoice #${invoice.number}?`}
        body="This will permanently delete the invoice. You'll have 8 seconds to undo."
        confirmLabel="Delete invoice"
        confirmVariant="destructive"
        defaultFocus="cancel"
        loading={isDeleting}
        onConfirm={handleConfirm}
      />
    </>
  );
}
```
