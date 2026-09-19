-- VForge CRM — schema Supabase
-- Dán toàn bộ file này vào Supabase > SQL Editor > Run

create table if not exists leads (
  id double precision primary key,
  parent_name text, student_name text, phone text, email text,
  course text, source text, format text, status text,
  notes text, referrer text, created_at text,
  assigned_class text, lost_reason text, lost_note text,
  course_count integer default 1 check (course_count between 1 and 4),
  discount integer default 0 check (discount in (0,5,8,10,15))
);

create table if not exists students (
  id double precision primary key,
  name text, parent_name text, parent_phone text,
  course text, class_id text, enroll_date text,
  payment_status text, amount_paid double precision, total_fee double precision, note text
);

create table if not exists classes (
  id text primary key,
  name text, course text, instructor text, schedule jsonb,
  max_students integer, start_date text, status text, format text,
  fee double precision
);

create table if not exists attendance (
  id double precision primary key,
  class_id text, student_id double precision, date text, status text, note text
);

create table if not exists accounts (
  id double precision primary key,
  username text, password text, name text, role text
);

create table if not exists audit_log (
  id double precision primary key,
  user_name text, role text, action text, detail text, time text
);

create table if not exists settings (
  key text primary key,
  value jsonb
);

-- Row Level Security: cho phép anon key đọc/ghi (app dùng đăng nhập nội bộ riêng)
do $$
declare t text;
begin
  foreach t in array array['leads','students','classes','attendance','accounts','audit_log','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Realtime: đồng bộ giữa nhiều người dùng
do $$
declare t text;
begin
  foreach t in array array['leads','students','classes','attendance','accounts','audit_log','settings'] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
