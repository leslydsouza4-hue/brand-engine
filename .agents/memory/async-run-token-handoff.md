---
name: async run-token hand-off
description: How to share a stale-run token between a parent async op and a sub-op it awaits, so the parent's post-await checks stay truthful.
---

# Async run-token hand-off

When an async operation (e.g. a doc import) delegates to a sub-operation it awaits
(e.g. a sequential batch generator), and BOTH use a "stale run" token (a ref the
parent bumps on theme/section/route changes to abandon in-flight work), create the
token ONCE at the top of the parent and **pass it into the sub-op**. Do not let the
sub-op bump its own token.

**Why:** if the sub-op does `const job = ++ref.current` itself, the parent's own
`job` is now different from `ref.current`, so the parent's post-`await` "am I still
current?" check is *always* stale (or always fresh against the wrong value) — its
completion message / cleanup fires incorrectly. A single shared token keeps the
parent's checks meaningful.

**How to apply:**
- Parent: `const job = ++ref.current; const stale = () => ref.current !== job;`
- Check `stale()` **before every state write**, including right after each `await`
  resolves (the fetch may land after the user navigated away).
- Pass `job` to the sub-op; sub-op uses `() => ref.current !== job` too.
- Bump the token in a `useEffect` on each invalidating dependency (theme AND
  section/route), not just one.
- Exception: a component's OWN loading flag (e.g. `importing`) should usually be
  cleared unconditionally in `finally` — guarding it behind `stale()` can leave a
  spinner stuck after the invalidating change, and a new run sets it again anyway.
