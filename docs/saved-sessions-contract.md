# Saved Sessions implementation contract

Shared editable projects are private to application teams. Clerk supplies identity; application tables supply team membership (not Clerk Organizations). Existing anonymous editing remains available; saving/library require sign-in and membership. Any signed-in person can create their own isolated team. Team admins can invite verified email addresses; matching verified users join through the teams endpoint. No globally claimable admin role.

## HTTP (under /api, cookie auth)

Errors: `{ error: string, code?: string }`, 401 unauthenticated, 403 nonmember, 404 missing, 409 stale revision. Validate all requests server-side. Do not trust client author identity.

- GET `/session-teams` -> `{ teams: [{id,name,role}], user: {id,name} }`; accepts pending invites for verified email only.
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
- GET `/session-teams/:teamId/sessions/:id/versions` -> `{versions:[{revision,name,updatedAt,updatedByName}]}`.
- GET `/session-teams/:teamId/sessions/:id/versions/:revision` -> `{session: Session}`. Frontend loads historical state with CURRENT session revision then saves as new version or copy (never overwrites history).
- POST `/session-teams/:teamId/assets` body `{name,contentType,size}` -> `{assetId,uploadURL}`; direct presigned PUT only; max 25MB, image types allowlist.
- POST `/session-teams/:teamId/assets/:assetId/complete` -> `{assetId}` verifies uploaded size/type before marking ready.
- GET `/session-teams/:teamId/assets/:assetId` streams private asset with membership check and no public caching. Header-based mime sniff safety for SVG.

SessionSummary: `{id,teamId,name,workspaceType,schemaVersion,revision,createdByName,updatedByName,createdAt,updatedAt,archived,thumbnailAssetId:string|null}`. Session adds `state: Record<string,unknown>`.

Saved state is JSON only. Images uploaded/generated as data/blob URLs must be uploaded to App Storage before saving; persist a tagged object `{__brandAsset: assetId}` instead of bytes/temporary URLs. Resolve these to authenticated same-origin asset serving URLs on load. Existing static asset URLs remain unchanged. Reject raw data/blob strings and cross-team/missing asset references server-side. Authenticated serving URLs must also convert back to tags on the next save. Assets must be complete before save. No startup DDL: Drizzle schema and dev push only.

## Frontend integration contract

Directory `artifacts/brand-engine/src/components/brand/sessions/`.

Core implements and exports `useSessionState<T>(key:string, initial:T|(()=>T)): [T, React.Dispatch<React.SetStateAction<T>>]` in `useSessionState.ts`. It is a drop-in replacement for durable state only (not transient loading/drag/modal state). Keys are explicit and prefixed by builder, e.g. `spotlight.headline`. Must work normally outside provider. Any existing browser-persisted state being converted should default fresh when opening a saved session. Preserve functional setters and lazy initializers. Asset arrays/nested records supported; Sets should be serialized deliberately.

Core `SessionProvider` wraps BrandEngine. A remount epoch on open/restore ensures all builder local state initializes from loaded data. Drafts isolated by workspace. Expose `useSessions()` from `SessionProvider.tsx` with types discoverable by UI agent. Core and UI agent coordinate directly via files/messages; UI agent owns App.tsx auth, BrandEngine.tsx integration and sessions UI. Core owns hook/provider/client/assets utilities only. Builder agents own only assigned workspace files.

Explicit saves, dirty tracking, unsaved navigation/reload guard; keep edits made during an in-flight save dirty. Save must not capture an empty/unregistered builder. No silent failure or DOM/form scraping. Opening a revision does not silently save it. Supported modes registry must match integrated builders, not advertise unsupported ones.