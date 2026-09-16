-- VForge CRM — chuyển sang Supabase Auth
-- Chạy SAU schema.sql. Dán vào SQL Editor > Run.

-- 1) Bảng profiles: 1 dòng cho mỗi user đăng nhập (tên hiển thị + vai trò)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text not null default 'sales' check (role in ('admin','sales','reception'))
);

-- Tự tạo profile khi có user mới (tên/vai trò lấy từ user metadata nếu có)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name, role)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          coalesce(new.raw_user_meta_data->>'role', 'sales'))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill cho user đã tạo trước đó
insert into profiles (id, email, name, role)
select id, email, split_part(email,'@',1), 'sales' from auth.users
on conflict (id) do nothing;

-- 2) Hàm kiểm tra admin (dùng trong policy)
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- 3) RLS: chỉ user đã đăng nhập mới đọc/ghi; anon bị chặn hoàn toàn
do $$
declare t text;
begin
  foreach t in array array['leads','students','classes','attendance','audit_log'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('drop policy if exists "auth_all" on %I', t);
    execute format('create policy "auth_all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

alter table settings enable row level security;
drop policy if exists "anon_all" on settings;
drop policy if exists "settings_read" on settings;
drop policy if exists "settings_admin_write" on settings;
create policy "settings_read" on settings for select to authenticated using (true);
create policy "settings_admin_write" on settings for all to authenticated using (is_admin()) with check (is_admin());

alter table profiles enable row level security;
drop policy if exists "profiles_read" on profiles;
drop policy if exists "profiles_admin_write" on profiles;
create policy "profiles_read" on profiles for select to authenticated using (true);
create policy "profiles_admin_write" on profiles for all to authenticated using (is_admin()) with check (is_admin());

-- 4) Bảng accounts cũ (mật khẩu tự quản) không dùng nữa
drop table if exists accounts;

-- 5) Realtime cho profiles
do $$ begin
  execute 'alter publication supabase_realtime add table profiles';
exception when duplicate_object then null; end $$;

-- 6) ĐẶT ADMIN: sửa email bên dưới thành email tài khoản admin của bạn rồi chạy
-- update profiles set role = 'admin', name = 'Quan' where email = 'admin@vforge.edu.vn';
