-- 企画提案プランナー: projects テーブルと RLS
-- Supabase Dashboard → SQL Editor で実行してください

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '新しい企画',
  proposal jsonb not null default '{}'::jsonb,
  toc jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_updated_at_idx on public.projects (updated_at desc);

alter table public.projects enable row level security;

create policy "projects_select_own"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects_insert_own"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects_update_own"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "projects_delete_own"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Storage: project-images バケット（非公開 + RLS）
-- パス形式: {user_id}/{project_id}/{slide_id}/{uuid}.ext

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', false)
on conflict (id) do update set public = false;

create policy "project_images_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "project_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "project_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "project_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );
