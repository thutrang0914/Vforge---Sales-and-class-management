-- Xoá DỮ LIỆU MẪU, giữ lại dữ liệu bạn tự nhập.
-- Quy tắc: dữ liệu mẫu có id nhỏ (1..85); dữ liệu bạn nhập có id = timestamp (~1.7e12)
-- hoặc lớp có id bắt đầu bằng "CLS-".

-- 1) Xem trước: còn lại bao nhiêu dòng "thật"
select 'leads' t, count(*) filter (where id >= 1e12) keep, count(*) filter (where id < 1e12) sample from leads
union all select 'students', count(*) filter (where id >= 1e12), count(*) filter (where id < 1e12) from students
union all select 'attendance', count(*) filter (where id >= 1e12), count(*) filter (where id < 1e12) from attendance
union all select 'classes', count(*) filter (where id like 'CLS-%'), count(*) filter (where id not like 'CLS-%') from classes;

-- 2) Xoá mẫu
delete from attendance where id < 1e12;
delete from students   where id < 1e12;
delete from leads      where id < 1e12;
-- lớp mẫu: chỉ xoá lớp không còn học viên / lead thật nào tham chiếu
delete from classes c
 where c.id not like 'CLS-%'
   and not exists (select 1 from students s where s.class_id = c.id)
   and not exists (select 1 from leads l where l.assigned_class = c.id);
delete from audit_log;
