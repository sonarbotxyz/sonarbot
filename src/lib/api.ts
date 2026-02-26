import type { SupabaseProject, SupabaseComment } from "./mappers";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Fetch projects from the API (server-side). */
export async function fetchProjects(params?: {
  category?: string;
  sort?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ projects: SupabaseProject[]; count: number }> {
  const url = new URL(`${BASE_URL}/api/projects`);
  if (params?.category) url.searchParams.set("category", params.category);
  if (params?.sort) url.searchParams.set("sort", params.sort);
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.offset) url.searchParams.set("offset", String(params.offset));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

/** Fetch a single project (server-side). */
export async function fetchProject(
  id: string
): Promise<{ project: SupabaseProject }> {
  const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

/** Fetch comments for a project (server-side). */
export async function fetchComments(
  projectId: string
): Promise<{ comments: SupabaseComment[] }> {
  const res = await fetch(`${BASE_URL}/api/projects/${projectId}/comments`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}
