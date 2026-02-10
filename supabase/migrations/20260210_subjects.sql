create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  department text not null,
  course_code text not null,
  course_name text not null
);

create index if not exists subjects_department_idx on public.subjects (department);
create index if not exists subjects_course_code_idx on public.subjects (course_code);
