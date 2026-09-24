// Public, deterministic sample-only data for the extracted Saved Sessions UI.
// No account, team, session, thumbnail, or API data is read from the app.
export interface SampleSession {
  id: string;
  teamId: string;
  name: string;
  workspaceType: string;
  schemaVersion: 1;
  revision: number;
  createdByName: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  thumbnailAssetId: null;
}

export const SAMPLE_TEAM = { id: "sample-projects", name: "Sample projects", role: "admin" } as const;

export const SAMPLE_SESSIONS: SampleSession[] = [
  { id: "sample-01", teamId: SAMPLE_TEAM.id, name: "Spring campaign launch", workspaceType: "bizdev-templates", schemaVersion: 1, revision: 3, createdByName: "Alex Morgan", updatedByName: "Alex Morgan", createdAt: "2026-03-04T10:00:00Z", updatedAt: "2026-03-18T14:30:00Z", archived: false, thumbnailAssetId: null },
  { id: "sample-02", teamId: SAMPLE_TEAM.id, name: "April master class", workspaceType: "master-class", schemaVersion: 1, revision: 2, createdByName: "Taylor Lee", updatedByName: "Jordan Park", createdAt: "2026-03-08T12:00:00Z", updatedAt: "2026-03-17T09:45:00Z", archived: false, thumbnailAssetId: null },
  { id: "sample-03", teamId: SAMPLE_TEAM.id, name: "Partner spotlight", workspaceType: "spotlight-sessions", schemaVersion: 1, revision: 5, createdByName: "Jordan Park", updatedByName: "Jordan Park", createdAt: "2026-03-01T16:20:00Z", updatedAt: "2026-03-15T11:00:00Z", archived: false, thumbnailAssetId: null },
  { id: "sample-04", teamId: SAMPLE_TEAM.id, name: "Q2 email series", workspaceType: "email-templates", schemaVersion: 1, revision: 1, createdByName: "Alex Morgan", updatedByName: "Alex Morgan", createdAt: "2026-03-10T08:00:00Z", updatedAt: "2026-03-13T17:15:00Z", archived: false, thumbnailAssetId: null },
  { id: "sample-05", teamId: SAMPLE_TEAM.id, name: "Summer kickoff", workspaceType: "events", schemaVersion: 1, revision: 4, createdByName: "Taylor Lee", updatedByName: "Alex Morgan", createdAt: "2026-02-21T10:30:00Z", updatedAt: "2026-03-11T13:00:00Z", archived: false, thumbnailAssetId: null },
  { id: "sample-06", teamId: SAMPLE_TEAM.id, name: "Winter leaderboard", workspaceType: "affiliate-leaderboard", schemaVersion: 1, revision: 2, createdByName: "Jordan Park", updatedByName: "Jordan Park", createdAt: "2026-01-08T09:00:00Z", updatedAt: "2026-02-19T15:20:00Z", archived: true, thumbnailAssetId: null },
];