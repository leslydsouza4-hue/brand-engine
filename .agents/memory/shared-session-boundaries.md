---
name: Shared-session boundaries
description: Product constraints and handoff lessons for shared editable Brand Engine work.
---

Shared saved work is accessible to ALL signed-in accounts, including outside email addresses, by the user's explicit confirmation. Existing formerly team-private sessions are included. Ordinary graphic editing remains usable without signing in. Keep explicit saves and recoverable versions, not live simultaneous editing.

**Why:** The user explicitly rejected invitation/team-dependent access because collaborators may be unavailable. Authentication is still mandatory for saved sessions, history, writes, and assets. Never restore the old team-isolation policy without a new user decision.

Active sessions never expire. Archive starts a 30-day retention timer; edits and repeated archive do not extend it. Unarchive clears the timer. Permanent deletion removes the session/history for everyone and requires UI confirmation plus revision checks. Expiry is enforced with request-driven cleanup under the shared library transaction lock, not a process timer. Physical session cleanup happens on the next successful library request, not a guaranteed wall-clock job. Asset metadata is revoked when no surviving session/version references it; private storage bytes are not garbage-collected yet. Old archived rows without archivedAt use updatedAt as their initial timer. Publish applies the nullable archived_at column; no production DDL/startup migrations.

**How to apply:** Every additional builder needs complete durable field coverage, portable image assets, stale-async-write protection, and a real cross-user reopen check. Do not claim support merely because a Save button appears. Initial empty/default drafts are not cloud-saved projects.

For automated Clerk handoff tests, the programmatic sign-in ticket must be consumed on the application's sign-in route, not the public editor root.

**Why:** Navigating the test helper's ticket to the root left Clerk loaded but signed out; the sign-in route successfully consumed the same ticket.

**How to apply:** Use the actual sign-in route with the helper-provided query and never log the ticket. Do not change auth secrets or weaken authentication to work around this test setup.