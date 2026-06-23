---
name: state-completeness
description: "Use whenever generating UI that displays dynamic data, fetches from an API, or handles user input. Ensures all 6 UI states are explicitly handled: loading, empty, partial, error, success, offline. Triggers on lists, tables, forms, async components, data fetching, file uploads, search interfaces, or anywhere data flows. Refuses incomplete components that only handle the happy path."
license: Commercial
---

# State Completeness

## The non-negotiable rule

Any UI component that fetches data, accepts user input, or handles async work MUST explicitly handle all 6 states. No exceptions.

| State | When | Required UI |
|---|---|---|
| **Loading** | Initial fetch, refresh, mutation in progress | Skeleton or progress indicator with intent |
| **Empty** | Fetch succeeded but returned no data | Pedagogical empty state, not "No data" |
| **Partial** | Some data loaded, some failed or still loading | Show what's loaded, indicate what's not |
| **Error** | Fetch failed, validation failed, network error | Specific message + recovery action |
| **Success** | Action completed | Visible confirmation, not just absence of error |
| **Offline** | No network connection | Degraded mode with explanation, queue mutations if possible |

If your component doesn't handle one of these, the component is incomplete. Add the missing state or surface the omission explicitly.

## Loading state rules

### Skeleton vs spinner
- **Skeleton** when the layout shape is known (cards, lists, tables) — preferred
- **Spinner** when it's truly a single action (button loading, modal opening)
- **Progress bar** only when actual progress is measurable (file upload, multi-step)

### Skeleton shape must match real content
A skeleton that doesn't match the final layout shape causes visual jump. Match:
- Number of items (3 skeleton rows for a 3-row list)
- Approximate dimensions
- Same gap/padding

### Skeleton vs spinner decision

```
async data → skeleton
user-triggered mutation → button-internal spinner
modal/dialog opening → no loading (open instantly, skeleton inside)
page transition → instant route, skeleton for async children
```

### Loading text
If loading takes >2 seconds, surface context: "Loading 1,247 records…" not just "Loading…".
If loading takes >10 seconds, offer a cancel action.

## Empty state rules

"No data" is not an empty state. It's a UI failure.

Every empty state must answer 3 questions:
1. **Why is this empty?** (you haven't created any yet / nothing matches your filter / you don't have access)
2. **What should the user do?** (clear primary action OR clear "this is expected" message)
3. **How does it help them learn the product?** (illustration optional, but copy must teach)

### Types of empty

| Cause | Treatment |
|---|---|
| First-time use (no data yet) | Onboarding empty state with primary CTA: "Create your first invoice" |
| Filtered/searched | Clear filter affordance: "No invoices match 'overdue'. Clear filter" |
| Permissions / access | Explanation + contact: "You don't have access. Ask your admin to share this." |
| Genuinely empty by design | Confirmation: "All caught up. No pending reviews." |

### Empty state copy rules
- Use "you" not "the user"
- Lead with the cause, then the action
- One CTA max (the most likely next action)
- Skip illustrations if your design system doesn't have them ready — text-only is fine

## Partial state rules

Partial states are the most-skipped state. Handle them:

- Some items loaded, more loading: show loaded items + skeleton placeholders for remaining
- Some fields fetched, some failed: show what's there, mark missing with inline "Failed to load — retry" not the whole component erroring
- Pagination loading next page: keep current page visible, show loading at bottom

NEVER blank the screen on partial — it's a regression from already-loaded state.

## Error state rules

Generic errors are unacceptable. "Something went wrong" is a bug.

### Error message anatomy

```
[What happened in user terms]
[Why it might have happened] (optional)
[What to do now]
```

Example:
- ❌ "Error: 500"
- ❌ "Something went wrong"
- ✅ "We couldn't save your changes. Your internet might be down. Try again, or copy your draft to keep it safe."

### Error placement
- **Inline** (next to the offending field/action) — for validation, field errors
- **Toast** (transient banner) — for completed-but-failed actions
- **Page-level** (full replacement of content) — for catastrophic failures
- **Modal** — only for errors that require an immediate decision

NEVER use toast for errors that require user action — they disappear. Use inline or modal.

### Recovery actions
Every error must offer:
- Retry (if transient)
- Alternative path (if persistent)
- Support contact (if neither works)

NEVER show an error without a path forward.

## Success state rules

Successful actions need visible confirmation. Silence is ambiguous.

### Confirmation types

| Action | Confirmation |
|---|---|
| Inline edit | Field flashes green + checkmark for 1.5s |
| Form submit (stays on page) | Toast "Saved" + visible change in data |
| Form submit (navigates) | Destination page shows context: "Created John Smith." |
| Destructive action | Toast with undo affordance: "Deleted. Undo (5s)" |
| Batch action | Summary: "Suspended 12 users." |

### Anti-patterns
- ❌ Silent success (user wonders if it worked)
- ❌ "Success!" with no context (which success?)
- ❌ Auto-redirect with no confirmation (jarring)
- ❌ Permanent success banner (clutters page after the first second)

## Offline state rules

Modern web apps must degrade gracefully offline. Minimum requirements:

1. **Detect offline** (`navigator.onLine` + failed fetches)
2. **Surface the state** — persistent banner: "Offline — your changes are saved locally"
3. **Queue mutations** if possible, retry when online
4. **Disable actions** that strictly require network
5. **Don't show errors** for offline-expected failures

If the app truly can't work offline, say so on first offline detection, not by silently failing.

## Component checklist (use this)

Before declaring a data component done, verify each:

```
[ ] Loading state — matches final layout shape
[ ] Empty state — explains why + offers next action
[ ] Partial state — degrades gracefully when some data fails
[ ] Error state — specific message + recovery path
[ ] Success state — visible confirmation, not silence
[ ] Offline state — degraded mode + queue if applicable
```

If any box is unchecked, the component is not complete. Surface the gap to the user explicitly:

> ⚠️ State coverage incomplete:
> - Empty state not implemented (currently shows nothing)
> - Offline state not handled (will throw network error)
>
> Add these before shipping.

## Example

WRONG (happy path only):
```jsx
function UsersList() {
  const { data } = useQuery('users');
  return (
    <ul>
      {data?.map(user => <li>{user.name}</li>)}
    </ul>
  );
}
```

RIGHT (all states):
```jsx
function UsersList() {
  const { data, isLoading, isError, error, isFetching } = useQuery('users');
  const isOffline = useOnlineStatus() === false;

  if (isOffline && !data) {
    return <OfflineState onRetry={refetch} />;
  }

  if (isLoading) {
    return <UsersListSkeleton rows={5} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="We couldn't load users"
        message={error.userMessage ?? "Your connection might be unstable."}
        onRetry={refetch}
      />
    );
  }

  if (data?.length === 0) {
    return (
      <EmptyState
        title="No users yet"
        body="Invite your first teammate to get started."
        action={<Button onClick={onInvite}>Invite a user</Button>}
      />
    );
  }

  return (
    <>
      {isFetching && <PartialUpdateBanner />}
      <ul>
        {data.map(user => <UserRow key={user.id} user={user} />)}
      </ul>
    </>
  );
}
```
