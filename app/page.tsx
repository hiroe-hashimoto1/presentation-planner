"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { createNewProject } from "@/lib/create-project";
import {
  deleteProject,
  fetchProject,
  fetchProjects,
  insertProject,
  ProjectConflictError,
  updateProject,
} from "@/lib/supabase/projects";
import { useAuth } from "@/components/auth-provider";
import { AuthScreen, SupabaseSetupScreen } from "@/components/auth-screen";
import { FourPaneEditor } from "@/components/four-pane-editor";
import { ConflictDialog } from "@/components/conflict-dialog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HomePage() {
  const { user, loading: authLoading, configured, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadInProgress = useRef(false);
  const savingInProgress = useRef(false);
  const conflictPaused = useRef(false);
  const pendingSaveProject = useRef<Project | null>(null);
  const editingProjectRef = useRef<Project | null>(null);

  useEffect(() => {
    editingProjectRef.current = editingProject;
  }, [editingProject]);

  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
  }, []);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    setLoadingProjects(true);
    setListError(null);
    try {
      const data = await fetchProjects(user.id);
      setProjects(data);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "企画の読み込みに失敗しました");
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadProjects();
    else setProjects([]);
  }, [user, loadProjects]);

  const persistProject = useCallback(
    async (
      project: Project,
      options?: { force?: boolean }
    ): Promise<Project | null> => {
      if (!user) return null;
      if (savingInProgress.current && !options?.force) return null;
      savingInProgress.current = true;
      setSaving(true);
      setSaveError(null);
      try {
        const saved = await updateProject(project, user.id, options);
        setProjects((prev) => {
          const idx = prev.findIndex((p) => p.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        setEditingProject((prev) =>
          prev?.id === saved.id ? saved : prev
        );
        editingProjectRef.current =
          editingProjectRef.current?.id === saved.id
            ? saved
            : editingProjectRef.current;
        setLastSavedAt(new Date());
        pendingSaveProject.current = null;
        conflictPaused.current = false;
        return saved;
      } catch (e) {
        if (e instanceof ProjectConflictError) {
          pendingSaveProject.current = project;
          conflictPaused.current = true;
          clearAutoSaveTimer();
          setConflictOpen(true);
          return null;
        }
        setSaveError(e instanceof Error ? e.message : "保存に失敗しました");
        pendingSaveProject.current = project;
        return null;
      } finally {
        savingInProgress.current = false;
        setSaving(false);
      }
    },
    [user, clearAutoSaveTimer]
  );

  const flushAutoSave = useCallback(async () => {
    if (
      uploadInProgress.current ||
      conflictPaused.current ||
      savingInProgress.current
    ) {
      return;
    }
    const latest = editingProjectRef.current;
    if (!latest) return;
    await persistProject(latest);
  }, [persistProject]);

  const scheduleAutoSave = useCallback(
    (project: Project) => {
      if (uploadInProgress.current || conflictPaused.current) return;
      editingProjectRef.current = project;
      clearAutoSaveTimer();
      autoSaveTimer.current = setTimeout(() => {
        void flushAutoSave();
      }, 1500);
    },
    [clearAutoSaveTimer, flushAutoSave]
  );

  const handleUploadStateChange = useCallback(
    (uploading: boolean) => {
      uploadInProgress.current = uploading;
      if (!uploading) {
        clearAutoSaveTimer();
        void flushAutoSave();
      }
    },
    [clearAutoSaveTimer, flushAutoSave]
  );

  const handleConflictOverwrite = useCallback(async () => {
    setConflictOpen(false);
    conflictPaused.current = false;
    const project = pendingSaveProject.current ?? editingProjectRef.current;
    if (!project) return;
    const saved = await persistProject(project, { force: true });
    if (saved) setEditingProject(saved);
  }, [persistProject]);

  const handleConflictReload = useCallback(async () => {
    setConflictOpen(false);
    conflictPaused.current = false;
    clearAutoSaveTimer();
    const current = editingProjectRef.current;
    if (!user || !current) return;
    try {
      const fresh = await fetchProject(current.id, user.id);
      if (fresh) {
        setEditingProject(fresh);
        editingProjectRef.current = fresh;
        setLastSavedAt(new Date(fresh.updatedAt));
        setSaveError(null);
        pendingSaveProject.current = null;
      }
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "最新データの読み込みに失敗しました"
      );
    }
  }, [user, clearAutoSaveTimer]);

  const handleRetrySave = useCallback(async () => {
    const project = pendingSaveProject.current ?? editingProject;
    if (!project) return;
    const saved = await persistProject(project);
    if (saved) setEditingProject(saved);
  }, [editingProject, persistProject]);

  useEffect(() => {
    return () => {
      clearAutoSaveTimer();
    };
  }, [clearAutoSaveTimer]);

  if (!configured) {
    return <SupabaseSetupScreen />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (editingProject) {
    return (
      <>
        <FourPaneEditor
          project={editingProject}
          userId={user.id}
          onProjectChange={(updated) => {
            setEditingProject(updated);
            scheduleAutoSave(updated);
          }}
          onSave={async () => {
            const saved = await persistProject(editingProject);
            if (saved) setEditingProject(saved);
          }}
          onRetrySave={handleRetrySave}
          saving={saving}
          saveError={saveError}
          lastSavedAt={lastSavedAt}
          onUploadStateChange={handleUploadStateChange}
          onBack={() => {
            clearAutoSaveTimer();
            setEditingProject(null);
            editingProjectRef.current = null;
            setSaveError(null);
            setConflictOpen(false);
            conflictPaused.current = false;
            pendingSaveProject.current = null;
            void loadProjects();
          }}
        />
        <ConflictDialog
          open={conflictOpen}
          onOverwrite={() => void handleConflictOverwrite()}
          onReload={() => void handleConflictReload()}
        />
      </>
    );
  }

  const handleNew = async () => {
    const draft = createNewProject();
    setListError(null);
    try {
      const saved = await insertProject(draft, user.id);
      setProjects((prev) => [saved, ...prev]);
      setEditingProject(saved);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "企画の作成に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この企画を削除しますか？")) return;
    setListError(null);
    try {
      await deleteProject(id, user.id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setListError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">企画提案プランナー</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              プレゼンテーションの企画・構成・リハーサルを一元管理
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:inline truncate max-w-[200px]">
              {user.email}
            </span>
            <button
              onClick={() => void signOut()}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              ログアウト
            </button>
            <button
              onClick={() => void handleNew()}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <span className="text-base leading-none">+</span>
              新規企画
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {listError && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            {listError}
          </p>
        )}

        {loadingProjects ? (
          <p className="text-center py-20 text-gray-500">企画を読み込み中...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg mb-2">企画がまだありません</p>
            <p className="text-gray-400 text-sm mb-6">
              「新規企画」ボタンから最初の企画を作成してください
            </p>
            <button
              onClick={() => void handleNew()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              最初の企画を作成
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => {
              const totalParagraphs = project.toc.reduce(
                (sum, t) => sum + t.paragraphs.length,
                0
              );
              const totalSeconds = project.toc
                .flatMap((t) => t.paragraphs)
                .reduce((sum, p) => sum + p.targetSeconds, 0);
              const totalMin = Math.floor(totalSeconds / 60);

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => {
                    editingProjectRef.current = project;
                    setEditingProject(project);
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {project.title}
                      </h2>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(project.id);
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors text-sm opacity-0 group-hover:opacity-100 shrink-0"
                        title="削除"
                      >
                        🗑
                      </button>
                    </div>

                    {project.proposal.challenge && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {project.proposal.challenge}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                      <span>目次 {project.toc.length}項目</span>
                      <span>段落 {totalParagraphs}個</span>
                      {totalMin > 0 && <span>目標 {totalMin}分</span>}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      更新: {formatDate(project.updatedAt)}
                    </span>
                    <span className="text-xs text-indigo-500 font-medium group-hover:text-indigo-600">
                      編集する →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
