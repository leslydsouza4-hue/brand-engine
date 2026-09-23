---
name: Shared-session boundaries
description: Product constraints and handoff lessons for shared editable Brand Engine work.
---

Shared saved work is team-private; ordinary graphic editing remains usable without signing in. Start with explicit saves and recoverable versions, not live simultaneous editing.

**Why:** The requested use case is one marketer handing editable work to another on a later day. Silently overwriting someone else's changes would defeat that purpose. A public shared library would expose team uploads.

**How to apply:** Every additional builder needs complete durable field coverage, portable image assets, stale-async-write protection, and a real cross-user reopen check. Do not claim support merely because a Save button appears. Initial empty/default drafts are not cloud-saved projects.

For automated Clerk handoff tests, the programmatic sign-in ticket must be consumed on the application's sign-in route, not the public editor root.

**Why:** Navigating the test helper's ticket to the root left Clerk loaded but signed out; the sign-in route successfully consumed the same ticket.

**How to apply:** Use the actual sign-in route with the helper-provided query and never log the ticket. Do not change auth secrets or weaken authentication to work around this test setup.