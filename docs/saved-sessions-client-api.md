# Saved sessions client integration

Core exports `SessionProvider`, `useSessions` from `components/brand/sessions/SessionProvider`.

Wrap the editor with `<SessionProvider userId={clerkUserId ?? null} authLoading={!isLoaded} workspaceType={mode} supportedWorkspaces={supportedModeIds} onWorkspaceChange={setMode}>`. `supportedWorkspaces` is required and must contain ONLY fully integrated builders. Private identity changes automatically remount/clear private state. Anonymous-to-signed-in drafts are preserved by default (set `preserveAnonymousDraftOnSignIn={false}` to opt out). `authLoading` defers identity transitions, preventing initial Clerk hydration from clearing anonymous edits. Provider remounts children on open/restore/team change; no separate React key required. Anonymous editing works.

`useSessions()` returns:
- `teams`, `user`, `activeTeamId`, `workspaceType`, `supported`, `dirty`, `saving`, `loading`, `error`, `conflict`, `thumbnailWarning`, `epoch`, `currentSession`, `sessions`.
- async `refreshTeams()`, `createTeam(name)`, `selectTeam(id|null)`, `list(archived=false)`.
- async `save({name?, copy?, thumbnail?:()=>Promise<Blob|null>} = {})` returns Session. New/copy needs name; existing defaults to current name. `saveCopy(name, thumbnail?)`.
- async `duplicate(id, name?)` duplicates the persisted library session directly, defaults to `Original name (Copy)`, and creates an active session even when the original is archived. It never opens/remounts the editor or changes current unsaved work. Use this for library duplication; `saveCopy` copies the current editor draft instead.
- async `open(id)`, `history(id?)`, `restoreVersion(revision)` (loads without saving; keeps current revision), `rename(id, revision, name)`, `archive(id, revision, archived=true)`.
- `confirmNavigation(): boolean` prompts if dirty; use BEFORE external mode/navigation changes. `navigateWorkspace(mode): boolean` guards and calls onWorkspaceChange. `clearError()`.
- `await prepareSignIn()` explicitly preserves ANONYMOUS drafts before navigating to a sign-in route that unmounts the editor. It stores a one-use, 30-minute tab-local snapshot (including portable local images), consumed on provider remount. Storage/quota failures reject visibly: do not navigate on failure. Prefer Clerk modal sign-in to keep large drafts mounted without storage limits. Never call this for signed-in users.
- `members()`, `invite(email)`, `revokeInvite(id)`, `removeMember(userId)` for active team.

All async failures reject AND appear in `error`; catch at event handlers to avoid unhandled rejections. Revision 409 additionally sets `conflict`; local edits remain untouched. Opening/team change requires confirmation. Team/library calls require cookie auth, no token arguments. `refreshTeams` runs on identity change; list refresh runs on team change and window focus.

`captureSessionThumbnail(element)` from `sessionAssets` returns a Blob. Supply the actual preview element explicitly; no form/DOM scraping. Thumbnail failure is nonfatal and exposed as `thumbnailWarning`.

`useSessionState<T>(key, initial)` from `useSessionState` is the durable useState replacement. Functional setters and lazy defaults work; outside provider/unsupported modes it behaves as normal useState. On loaded sessions missing keys default fresh (lazy initializers should not read browser persistence). JSON-compatible values only; explicitly convert Sets to arrays. Drafts are isolated by workspace, and unmounted registered fields stay in draft.