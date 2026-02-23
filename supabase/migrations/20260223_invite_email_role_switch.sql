-- Allow role re-invite for the same email by replacing any active invite.
-- This supports "nagkamali lang ng role" flows.

create or replace function public.create_user_invite(
  invitee_email text,
  invite_user_type text
)
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

  if invite_user_type is null or invite_user_type not in ('admin', 'professor', 'student') then
    raise exception 'invite_user_type must be admin, professor, or student';
  end if;

  -- Deactivate any existing active invite for this email, regardless of role.
  update public.user_invites
    set is_active = false
  where email = lower(invitee_email)
    and is_active = true;

  insert into public.user_invites (email, user_type)
  values (lower(invitee_email), invite_user_type)
  returning token into v_token;

  return v_token;
end;
$$;

grant execute on function public.create_user_invite(text, text) to anon, authenticated;


create or replace function public.create_admin_invite(invitee_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.create_user_invite(invitee_email, 'admin');
end;
$$;

grant execute on function public.create_admin_invite(text) to anon, authenticated;

