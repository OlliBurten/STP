---
description: Audit existing UI for UX issues. Pass a file path, URL, or describe the screen. Returns a prioritized, actionable audit report.
---

You are about to audit a UI. Use the `ux-auditor` skill.

The user's audit target follows:

$ARGUMENTS

Steps:
1. Determine the input type (code file, URL, screenshot, description)
2. If a file path is given, Read it
3. If a URL is given and WebFetch is available, fetch it
4. If a screenshot is referenced, view it
5. If only a description is given, ask for a screenshot or code (one chance), then proceed if user insists
6. Apply the full `ux-auditor` skill protocol
7. Output the audit in the required format (Intent recovery, Issues table, Top 3 fixes, What's working)

Do NOT skip the intent recovery step. Do NOT produce vague advice. Every issue must be specific and every fix must be actionable.
