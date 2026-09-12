-- Cosmic Vinyl user spaces schema for Supabase
-- Run in a Supabase project after Auth is enabled.
-- This schema keeps every user's spaces private via Row Level Security.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.music_spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Cosmic Space',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.space_tracks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.music_spaces(id) on delete cascade,
  position integer not null default 0,
  name text not null,
  artist text not null,
  album text,
  duration text,
  preview_url text,
  artwork_url text,
  itunes_query text,
  is_custom boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists music_spaces_user_id_idx
  on public.music_spaces(user_id);

create index if not exists space_tracks_space_id_position_idx
  on public.space_tracks(space_id, position);

alter table public.profiles enable row level security;
alter table public.music_spaces enable row level security;
alter table public.space_tracks enable row level security;

create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can view their own spaces"
  on public.music_spaces
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own spaces"
  on public.music_spaces
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own spaces"
  on public.music_spaces
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own spaces"
  on public.music_spaces
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view tracks in their own spaces"
  on public.space_tracks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.music_spaces
      where music_spaces.id = space_tracks.space_id
        and music_spaces.user_id = (select auth.uid())
    )
  );

create policy "Users can create tracks in their own spaces"
  on public.space_tracks
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.music_spaces
      where music_spaces.id = space_tracks.space_id
        and music_spaces.user_id = (select auth.uid())
    )
  );

create policy "Users can update tracks in their own spaces"
  on public.space_tracks
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.music_spaces
      where music_spaces.id = space_tracks.space_id
        and music_spaces.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.music_spaces
      where music_spaces.id = space_tracks.space_id
        and music_spaces.user_id = (select auth.uid())
    )
  );

create policy "Users can delete tracks in their own spaces"
  on public.space_tracks
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.music_spaces
      where music_spaces.id = space_tracks.space_id
        and music_spaces.user_id = (select auth.uid())
    )
  );
