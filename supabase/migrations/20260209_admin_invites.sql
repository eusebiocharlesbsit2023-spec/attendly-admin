-- Admin invite tokens
create extension if not exists "pgcrypto";

create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  is_active boolean not null default true,

  constraint admin_invites_email_chk check (position('@' in email) > 1)
);

create unique index if not exists admin_invites_email_active_uq
  on public.admin_invites (email)
  where is_active = true;

create unique index if not exists admin_invites_token_uq
  on public.admin_invites (token);

alter table public.admin_invites enable row level security;

revoke all on table public.admin_invites from anon, authenticated;

create or replace function public.create_admin_invite(invitee_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  if invitee_email is null or length(trim(invitee_email)) = 0 then
    raise exception 'invitee_email is required';
  end if;

  update public.admin_invites
    set is_active = false
  where email = lower(invitee_email)
    and is_active = true;

  insert into public.admin_invites (email)
  values (lower(invitee_email))
  returning token into v_token;

  return v_token;
end;
$$;

grant execute on function public.create_admin_invite(text) to anon, authenticated;

create or replace function public.verify_admin_invite(p_token uuid)
returns table (email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select ai.email
  from public.admin_invites ai
  where ai.token = p_token
    and ai.is_active = true
    and ai.used_at is null
    and ai.expires_at > now();
end;
$$;

grant execute on function public.verify_admin_invite(uuid) to anon, authenticated;

create or replace function public.register_invited_admin_profile(
  p_token uuid,
  p_full_name text,
  p_username text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite_id uuid;
  v_email text;
  v_user_id uuid;
begin
  if p_token is null or p_full_name is null or p_username is null then
    raise exception 'token, full_name, username are required';
  end if;

  select id, email
    into v_invite_id, v_email
  from public.admin_invites
  where token = p_token
    and is_active = true
    and used_at is null
    and expires_at > now();

  if v_invite_id is null then
    raise exception 'Invalid or expired invite';
  end if;

  select auth.uid() into v_user_id;
  if v_user_id is null then
    raise exception 'No authenticated user';
  end if;

  insert into public.admins (id, username, admin_name, role, status)
  values (v_user_id, p_username, p_full_name, 'Admin', 'Active');

  update public.admin_invites
    set used_at = now(), is_active = false
  where id = v_invite_id;
end;
$$;

grant execute on function public.register_invited_admin_profile(uuid, text, text) to anon, authenticated;

create or replace function public.register_invited_professor_profile(
  p_token uuid,
  p_full_name text,
  p_department text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite_id uuid;
  v_email text;
  v_user_id uuid;
begin
  if p_token is null or p_full_name is null or p_department is null then
    raise exception 'token, full_name, department are required';
  end if;

  select id, email
    into v_invite_id, v_email
  from public.admin_invites
  where token = p_token
    and is_active = true
    and used_at is null
    and expires_at > now();

  if v_invite_id is null then
    raise exception 'Invalid or expired invite';
  end if;

  select auth.uid() into v_user_id;
  if v_user_id is null then
    raise exception 'No authenticated user';
  end if;

  insert into public.professors (id, professor_name, email, department, status, archived)
  values (v_user_id, p_full_name, v_email, p_department, 'Active', false);

  update public.admin_invites
    set used_at = now(), is_active = false
  where id = v_invite_id;
end;
$$;

grant execute on function public.register_invited_professor_profile(uuid, text, text) to anon, authenticated;
