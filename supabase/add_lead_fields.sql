-- Thêm cột "Số khóa" cho leads (1-4). Chạy 1 lần trên Supabase > SQL Editor.
alter table leads add column if not exists course_count integer default 1 check (course_count between 1 and 4);
-- Giảm giá (%) của lead: 0, 5, 8, 10, 15
alter table leads add column if not exists discount integer default 0 check (discount in (0,5,8,10,15));
