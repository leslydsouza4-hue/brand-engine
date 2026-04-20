// Multi-project memory store for Brand Brain (localStorage-backed).

export interface StoredAttachment {
  id: string;
  kind: "image" | "pdf" | "text" | "gdoc";
  name: string;
  size?: number;
  base64?: string;
  mediaType?: string;
  previewUrl?: string;
  text?: string;
  docImages?: Array<{ mediaType: string; data: string }>;
  loading?: boolean;
  error?: string;
}

export interface StoredMessage {
  role: "user" | "assistant";
  text: string;
  attachments?: StoredAttachment[];
  // Optional generated-asset history attached to an assistant message
  generatedAssets?: Array<{
    format: "square" | "portrait" | "horizontal";
    aspect: string;
    html?: string;
    error?: string;
  }>;
  ts: number;
}

export interface BrandBrainProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
}

const PROJECTS_KEY = "brand-brain-projects-v1";
const ACTIVE_KEY = "brand-brain-active-project-v1";
const EVT = "brand-brain-projects-updated";

function uid() { return `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }

// localStorage has a ~5MB ceiling. Strip large base64 from messages before persisting,
// keep only previews for images so chips still render after a reload.
function stripForStorage(msgs: StoredMessage[]): StoredMessage[] {
  return msgs.map((m) => ({
    ...m,
    attachments: m.attachments?.map((a) => {
      const slim: StoredAttachment = { ...a };
      // Drop heavy payloads — they were already sent to Claude on the original turn.
      slim.base64 = undefined;
      slim.docImages = undefined;
      // Keep text for gdoc/text attachments but cap to 30k chars.
      if (slim.text && slim.text.length > 30000) slim.text = slim.text.slice(0, 30000) + "\n…(truncated)";
      // Strip data: URLs except for tiny image previews
      if (slim.previewUrl && slim.previewUrl.length > 200_000) slim.previewUrl = undefined;
      return slim;
    }),
  }));
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT));
}

export function listProjects(): BrandBrainProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as BrandBrainProject[];
    return Array.isArray(arr) ? arr.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

function saveAll(projects: BrandBrainProject[]) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    emit();
  } catch (e) {
    // Quota exceeded — try once more with a more aggressive prune.
    try {
      const pruned = projects.map((p) => ({ ...p, messages: stripForStorage(p.messages).slice(-40) }));
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(pruned));
      emit();
    } catch {
      console.warn("Brand Brain: failed to save projects (storage full)");
    }
  }
}

export function createProject(name?: string): BrandBrainProject {
  const projects = listProjects();
  const project: BrandBrainProject = {
    id: uid(),
    name: name?.trim() || "New project",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
  saveAll([project, ...projects]);
  setActiveProjectId(project.id);
  return project;
}

export function deleteProject(id: string) {
  const projects = listProjects().filter((p) => p.id !== id);
  saveAll(projects);
  if (getActiveProjectId() === id) {
    setActiveProjectId(projects[0]?.id || null);
  }
}

export function renameProject(id: string, name: string) {
  const projects = listProjects().map((p) => (p.id === id ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() } : p));
  saveAll(projects);
}

export function updateProjectMessages(id: string, messages: StoredMessage[]) {
  const projects = listProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx < 0) return;
  projects[idx] = { ...projects[idx], messages: stripForStorage(messages), updatedAt: Date.now() };
  saveAll(projects);
}

export function getProject(id: string): BrandBrainProject | null {
  return listProjects().find((p) => p.id === id) || null;
}

export function getActiveProjectId(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}
export function setActiveProjectId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
    emit();
  } catch {}
}

// Auto-name a project from the first user message
export function autoNameFromMessage(msg: string): string {
  const cleaned = msg.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New project";
  return cleaned.length > 38 ? cleaned.slice(0, 38) + "…" : cleaned;
}

export const PROJECTS_EVENT = EVT;
