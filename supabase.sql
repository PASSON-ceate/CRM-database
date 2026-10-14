-- รันใน Supabase > SQL Editor (ครั้งเดียว)
create table if not exists public.docs (
  collection text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

alter table public.docs enable row level security;

-- เฉพาะผู้ใช้ที่ล็อกอินแล้ว และอีเมลลงท้าย @entech.co.th เท่านั้น
drop policy if exists "entech all" on public.docs;
create policy "entech all" on public.docs
  for all to authenticated
  using      ((auth.jwt() ->> 'email') ilike '%@entech.co.th')
  with check ((auth.jwt() ->> 'email') ilike '%@entech.co.th');

-- update แบบ merge ฟิลด์ (ใช้แทน doc.update ของ Artifact)
create or replace function public.docs_merge(c text, i text, d jsonb)
returns void language sql security invoker as $$
  insert into public.docs(collection,id,data) values (c,i,d)
  on conflict (collection,id) do update
    set data = public.docs.data || excluded.data, updated_at = now();
$$;

-- realtime
alter table public.docs replica identity full;
alter publication supabase_realtime add table public.docs;
