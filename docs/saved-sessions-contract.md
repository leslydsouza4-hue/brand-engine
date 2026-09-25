# Saved Sessions implementation contract

Shared editable projects are accessible to ALL signed-in accounts, including external email addresses, as explicitly authorized by the user. Clerk supplies identity; anonymous editing remains available, but saved sessions, history, assets, and writes require sign-in. Existing session IDs, team IDs, and snapshots are retained. Team IDs in library URLs are compatibility namespaces, NOT isolation boundaries. Legacy membership/admin endpoints remain restricted to actual members/admins and are no longer part of the library UI.

## HTTP (under /api, cookie auth)

Errors: `{ error: string, code?: string }`, 401 unauthenticated, 403 invalid mutation origin or unauthorized legacy team management, 404 missing/expired, 409 stale revision. Validate all requests server-side. Do not trust client author identity.

- GET `/session-teams` -> `{ teams: [{id,name,role}], user: {id,name} }`; returns a single shared library (ID `00000000-0000-4000-8000-000000000001`), automatically selected by the client. Does not expose member lists or accept invites.
- POST `/session-teams` body `{name}` -> `{team:{id,name,role}}`.
- GET `/session-teams/:teamId/members` -> `{members:[{userId,name,role}], invites:[{id,email}]}`.
- POST `/session-teams/:teamId/invites` body `{email}` -> `{ok:true}`. Admin only. No email sending: teammate signs up using this email.
- DELETE `/session-teams/:teamId/invites/:inviteId` -> `{ok:true}`. Admin only.
- DELETE `/session-teams/:teamId/members/:userId` -> `{ok:true}`. Admin only; disallow removing self/last admin.
- GET `/session-teams/:teamId/sessions?archived=false` -> `{sessions: SessionSummary[]}`.
- POST `/session-teams/:teamId/sessions` body `{name,workspaceType,schemaVersion:1,state,thumbnailAssetId?:string|null}` -> `{session: Session}`.
- GET `/session-teams/:teamId/sessions/:id` -> `{session: Session}`.
- PUT `/session-teams/:teamId/sessions/:id` body `{name,workspaceType,schemaVersion:1,state,thumbnailAssetId?:string|null,revision}` -> `{session: Session}`. Atomic optimistic concurrency, immutable revision snapshot in same transaction.
- PATCH `/session-teams/:teamId/sessions/:id` body `{revision,name?:string,archived?:boolean}` -> `{session: Session}`. Also revision-check and record snapshot.
- DELETE `/session-teams/:teamId/sessions/:id` body `{revision}` -> `{ok:true}`. Permanent deletion for everyone, concurrency checked; history cascades. UI confirmation required.
- GET `/session-teams/:teamId/sessions/:id/versions` -> `{versions:[{revision,name,updatedAt,updatedByName}]}`.
- GET `/session-teams/:teamId/sessions/:id/versions/:revision` -> `{session: Session}`. Frontend loads historical state with CURRENT session revision then saves as new version or copy (never overwrites history).
- POST `/session-teams/:teamId/assets` body `{name,contentType,size}` -> `{assetId,uploadURL}`; direct presigned PUT only; max 25MB, image types allowlist.
- POST `/session-teams/:teamId/assets/:assetId/complete` -> `{assetId}` verifies uploaded size/type before marking ready.
- GET `/session-teams/:teamId/assets/:assetId` streams private asset with authentication and no public caching. Header-based mime sniff safety for SVG.

SessionSummary: `{id,teamId,name,workspaceType,schemaVersion,revision,createdByName,updatedByName,createdAt,updatedAt,archived,archivedAt:string|null,thumbnailAssetId:string|null}`. Session adds `state: Record<string,unknown>`. Historical snapshots may omit archivedAt.

Archive sets archivedAt once; subsequent edits/repeated archive retain it. Unarchive clears it; archiving again starts a new timer. Active sessions never expire. Archived rows expire at 30 days (inclusive), with updatedAt fallback for historical archived rows. Every authenticated library operation locks a shared row and removes expired sessions/history before reading or writing, so autoscale does not depend on an always-running timer. Physical database cleanup occurs on the next successful request. Deletion revokes asset metadata only if no remaining session or historical version references it; private App Storage bytes are retained pending future garbage collection, not publicly readable.

Saved state is JSON only. Images uploaded/generated as data/blob URLs must be uploaded to App Storage before saving; persist a tagged object `{__brandAsset: assetId}` instead of bytes/temporary URLs. Resolve these to authenticated same-origin asset serving URLs on load. Existing static asset URLs remain unchanged. Reject raw data/blob strings and missing/incomplete asset references server-side. Historical cross-team asset references are allowed within the shared library. Authenticated serving URLs must also convert back to tags on the next save. Assets must be complete before save. No startup DDL: Drizzle schema and dev push only.

## Frontend integration contract

Directory `artifacts/brand-engine/src/components/brand/sessions/`.

Core implements and exports `useSessionState<T>(key:string, initial:T|(()=>T)): [T, React.Dispatch<React.SetStateAction<T>>]` in `useSessionState.ts`. It is a drop-in replacement for durable state only (not transient loading/drag/modal state). Keys are explicit and prefixed by builder, e.g. `spotlight.headline`. Must work normally outside provider. Any existing browser-persisted state being converted should default fresh when opening a saved session. Preserve functional setters and lazy initializers. Asset arrays/nested records supported; Sets should be serialized deliberately.

Core `SessionProvider` wraps BrandEngine. A remount epoch on open/restore ensures all builder local state initializes from loaded data. Drafts isolated by workspace. Expose `useSessions()` from `SessionProvider.tsx` with types discoverable by UI agent. Core and UI agent coordinate directly via files/messages; UI agent owns App.tsx auth, BrandEngine.tsx integration and sessions UI. Core owns hook/provider/client/assets utilities only. Builder agents own only assigned workspace files.

Explicit saves, dirty tracking, unsaved navigation/reload guard; keep edits made during an in-flight save dirty. Save must not capture an empty/unregistered builder. No silent failure or DOM/form scraping. Opening a revision does not silently save it. Supported modes registry must match integrated builders, not advertise unsupported ones.