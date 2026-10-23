-- blurrr initial schema
-- Run in the Supabase SQL Editor.
-- Storage bucket is private. The API service role manages objects after server-side authorization.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  guest_token_hash text not null unique check (char_length(guest_token_hash) = 64),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'pending_deletion')),
  created_at timestamptz not null default now()
);

create index if not exists events_admin_user_id_idx on public.events(admin_user_id);
create index if not exists events_status_idx on public.events(status);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 150),
  created_at timestamptz not null default now()
);

create index if not exists photos_event_id_created_at_idx
  on public.photos(event_id, created_at desc);

alter table public.events enable row level security;
alter table public.photos enable row level security;

-- Direct browser access to event/photo rows is intentionally denied.
-- Browser clients use the backend API. The backend uses the service-role key and MUST
-- perform explicit auth + ownership checks in every privileged handler.
revoke all on public.events from anon, authenticated;
revoke all on public.photos from anon, authenticated;

-- Private bucket. Storage objects are accessed through server-issued short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-photos', 'event-photos', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- No storage.objects policies are added for anon/authenticated users.
-- Server-side service-role operations are protected by the API's authorization layer.
