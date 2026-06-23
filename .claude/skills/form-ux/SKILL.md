---
name: form-ux
description: "Use whenever generating or modifying forms, input fields, multi-step flows, settings pages, signup/login, or any UI that collects user input. Enforces field grouping, label placement, validation strategy, smart defaults, progressive disclosure, and error handling. Triggers on any form, input, textarea, select, checkbox, radio, multi-step wizard, or onboarding flow. Refuses forms that violate cognitive load rules."
license: Commercial
---

# Form UX

## Core principle

> Forms are not data collection. Forms are conversations.

Every field is a question you're asking. If you wouldn't ask it in a conversation, don't ask it in the form. If you wouldn't ask it in that order, don't ask it in that order.

## The 7-field rule

A form shows at most **7 fields visible at once** without explicit justification. More than 7 = use:

1. **Progressive disclosure** (reveal fields based on earlier answers)
2. **Multi-step wizard** (chunk into 2-4 step flows)
3. **Defaults + advanced section** (collapse rarely-touched fields)
4. **Question yourself**: do you actually need all those fields, or are you collecting just-in-case data?

REFUSE forms with 15+ visible fields unless the user explicitly justifies the cognitive load.

## Field grouping (Miller's Law)

Group fields by **mental model**, not database structure.

| Wrong grouping | Right grouping |
|---|---|
| All "user table" fields together | "About you" / "How to reach you" / "Your preferences" |
| Required fields first, optional last | Logical narrative order, even if required is mixed |
| Alphabetical | By task ("Shipping" / "Billing" / "Payment") |

Group size: **3-5 fields per group**. Beyond that, split into two groups with a clear heading.

## Label placement

| Placement | Use when |
|---|---|
| **Above** field | Default — best for scanning, mobile, i18n |
| **Inside** field (floating label) | Tight space — but never on multi-line textareas |
| **Inline** (left of field) | Settings pages with side-by-side label/control, only on wide screens |
| ❌ **Placeholder as label** | NEVER — disappears on focus, fails a11y |

Labels are clear, terse, and use sentence case ("Email address" not "EMAIL ADDRESS" or "email_address").

Optional fields show "(optional)" — never mark required with asterisks. Most fields should be required by design; mark the exceptions.

## Smart defaults

Every field should have a default that's right for 80% of users.

Common defaults to set:
- Country = detect from IP/locale
- Currency = match country
- Date = today (for invoices, "due in 30 days")
- Time zone = browser default
- Notification preferences = "important only" not "all"
- Privacy = the more private option

NEVER default destructive or expensive choices ("Yes, subscribe me", "Add to all teams").

## Validation strategy

### Timing

| When to validate | What |
|---|---|
| On blur (after first interaction) | Format errors (email, phone, URL) |
| On submit | Required, business rules, server validation |
| On focus loss + 500ms typing pause | Async checks (username available) |
| ❌ On every keystroke | Don't — feels accusatory |

### Validation message anatomy

```
[What's wrong] · [Why it matters] · [How to fix]
```

Examples:
- ❌ "Invalid email"
- ❌ "Please enter a valid email address"
- ✅ "This email is missing the @ symbol"
- ✅ "We already have an account with this email — sign in instead?"

### Success validation
For high-stakes fields (password creation, payment), show inline success as the user satisfies each rule:
```
Password:
  ✓ At least 8 characters
  ✓ Contains a number
  ○ Contains an uppercase letter
```

### Server-side errors
Always map server errors to specific fields when possible. Generic "Form invalid" is unacceptable.

## Field-specific rules

### Text inputs
- Width hints expected content length (zip code = narrow, address = wide)
- `inputmode` and `autocomplete` always set (huge mobile UX win)
- Max length only if there's a real business limit, with visible counter when approaching limit

### Passwords
- "Show password" toggle is mandatory
- Strength meter for password creation, not for login
- Never auto-redact on copy-paste from password manager
- Confirm-password field is anti-pattern — use "Show password" instead

### Selects / Dropdowns
- 2-3 options → segmented control / radio
- 4-7 options → radio buttons (visible) > dropdown
- 8-15 options → dropdown
- 16+ options → searchable dropdown / combobox
- 50+ options → autocomplete with async search

### Checkboxes vs Toggles
- **Checkbox** = needs explicit Save action ("Apply when I submit")
- **Toggle** = applies immediately ("Live setting")
- Don't mix metaphors in one screen

### Date pickers
- Native input on mobile, custom on desktop only if native is insufficient
- Always show keyboard text input as fallback
- Smart parsing: "next friday", "tomorrow", "12/3" all work

### File uploads
- Drag-and-drop + click-to-upload BOTH supported
- Show file preview after selection
- Allow remove before submit
- Progress bar during upload (not spinner)
- Specific error if upload fails (size, type, network)

## Multi-step wizards

Required when a form exceeds the 7-field rule OR has conditional branches.

### Rules
- Progress indicator visible always (which step, total steps)
- Step titles describe what (not "Step 2" but "Your contact info")
- Each step can be navigated back to (data preserved)
- Final step shows full summary before submission
- ONE primary action per step ("Continue", "Submit", "Pay $24.99")

### Anti-patterns
- ❌ Step counter without labels
- ❌ No way to go back
- ❌ Auto-advance on field completion (jarring)
- ❌ Hiding total step count
- ❌ "Save and continue later" buried

## Submit button rules

- Label describes the action, not "Submit": "Create account", "Save changes", "Send invoice"
- Primary button position: **bottom-right** of form (for desktop), **full-width sticky bottom** (for mobile)
- Disabled state ONLY if there's a clear reason visible (don't gray out without explanation)
- Loading state with spinner inside the button + "Saving..." label
- After success: navigate OR show confirmation. Never both nothing.

## Anti-patterns to refuse

- ❌ Required fields without visual indication that there's required + optional mixed
- ❌ Reset/Clear button next to Submit (user clicks the wrong one, loses everything)
- ❌ Captcha before the user has tried submitting (only when needed)
- ❌ "Sign up" with email confirmation before showing the password field (forced multi-step for no reason)
- ❌ Address forms with separate first name / last name when full name works
- ❌ Date pickers requiring DD-MM-YYYY format vs MM-DD-YYYY without locale awareness
- ❌ Phone fields without country code support
- ❌ Forms that lose data on validation error (NEVER clear filled fields)
- ❌ Confirm-email and confirm-password fields (use show toggle instead)
- ❌ Currency fields without currency symbol visible

## Example

WRONG:
```jsx
<form>
  <h2>New User</h2>
  <input placeholder="First name" required />
  <input placeholder="Last name" required />
  <input placeholder="Email" required />
  <input placeholder="Password" type="password" required />
  <input placeholder="Confirm password" type="password" required />
  <input placeholder="Phone" />
  <input placeholder="Address" />
  <input placeholder="City" />
  <input placeholder="ZIP" />
  <input placeholder="Country" />
  <input placeholder="Company" />
  <input placeholder="Job title" />
  <button>Submit</button>
</form>
```

Problems: placeholder-as-label, no grouping, 12 fields one screen, "Submit" not action-named, no progressive disclosure for optional info.

RIGHT (multi-step or sectioned):
```jsx
<form className="space-y-8">
  <header>
    <h2>Create your account</h2>
    <p className="text-sm text-muted">Takes about 1 minute.</p>
  </header>

  <fieldset className="space-y-4">
    <legend className="text-sm font-medium">About you</legend>
    <Field label="Full name" name="name" autoComplete="name" required />
    <Field label="Work email" name="email" type="email" autoComplete="email" required />
  </fieldset>

  <fieldset className="space-y-4">
    <legend className="text-sm font-medium">Secure your account</legend>
    <PasswordField label="Password" name="password" showStrength required />
  </fieldset>

  <details>
    <summary className="cursor-pointer text-sm">Add company info (optional)</summary>
    <fieldset className="space-y-4 pt-4">
      <Field label="Company" name="company" optional />
      <Field label="Job title" name="title" optional />
    </fieldset>
  </details>

  <div className="flex justify-end">
    <Button type="submit" variant="primary">Create account</Button>
  </div>
</form>
```
