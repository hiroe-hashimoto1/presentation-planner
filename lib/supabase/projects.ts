import type { Project, ProposalFields, TocItem } from "@/lib/types";
import { deleteProjectImages } from "./storage";
import {
  ProjectConflictError,
  sanitizeProjectForSave,
} from "./project-utils";
import { getSupabaseClient } from "./client";

interface ProjectRow {
  id: string;
  user_id: string;
  title: string;
  proposal: ProposalFields;
  toc: TocItem[];
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    proposal: row.proposal,
    toc: row.toc,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function projectToRow(
  project: Project,
  userId: string
): Omit<ProjectRow, "created_at"> {
  return {
    id: project.id,
    user_id: userId,
    title: project.title,
    proposal: project.proposal,
    toc: project.toc,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchProjects(userId: string): Promise<Project[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data as ProjectRow[]).map(rowToProject);
}

export async function fetchProject(
  projectId: string,
  userId: string
): Promise<Project | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProject(data as ProjectRow);
}

export async function insertProject(
  project: Project,
  userId: string
): Promise<Project> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const sanitized = sanitizeProjectForSave(project);
  const row = {
    ...projectToRow(sanitized, userId),
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToProject(data as ProjectRow);
}

export async function updateProject(
  project: Project,
  userId: string,
  options?: { force?: boolean }
): Promise<Project> {
  const supabase = getSupabaseClient();
  const sanitized = sanitizeProjectForSave(project);

  let query = supabase
    .from("projects")
    .update(projectToRow(sanitized, userId))
    .eq("id", project.id)
    .eq("user_id", userId);

  if (!options?.force) {
    query = query.eq("updated_at", project.updatedAt);
  }

  const { data, error } = await query.select().maybeSingle();

  if (error) throw error;
  if (!data) throw new ProjectConflictError();
  return rowToProject(data as ProjectRow);
}

export async function deleteProject(
  projectId: string,
  userId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    await deleteProjectImages(userId, projectId);
  } catch {
    // Storage 削除失敗はプロジェクト削除を止めない
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw error;
}

export { ProjectConflictError } from "./project-utils";
