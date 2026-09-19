-- Học phí / học viên theo từng lớp (Code Pro, Code Pro+). Chạy 1 lần trên Supabase > SQL Editor.
alter table classes add column if not exists fee double precision;
