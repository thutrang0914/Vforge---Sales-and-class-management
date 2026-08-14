import { useState, useMemo } from "react";

// ============================================
// VFORGE — QUẢN LÝ SALES & LỚP HỌC
// Coding & Robotics Education Center — Hanoi
// ============================================

// --- BRAND TOKENS (Vforge Identity: #EF4136 Red + #00A79D Teal, Font: Glory) ---
const V = {
  bg: "#f7f8fa", surface: "#ffffff", surface2: "#f0f2f5", surface3: "#e8ebf0",
  border: "#e0e4ea", border2: "#d0d5dd",
  accent: "#00A79D", accentDim: "rgba(0,167,157,0.08)", accentGlow: "rgba(0,167,157,0.15)",
  vred: "#EF4136", vredDim: "rgba(239,65,54,0.08)",
  mint: "#059669", mintDim: "rgba(5,150,105,0.08)",
  amber: "#d97706", amberDim: "rgba(217,119,6,0.08)",
  red: "#EF4136", redDim: "rgba(239,65,54,0.08)",
  purple: "#7c3aed", purpleDim: "rgba(124,58,237,0.08)",
  cyan: "#00A79D", cyanDim: "rgba(0,167,157,0.08)",
  text: "#1a1a2e", textMid: "#3d4558", textDim: "#6b7280", textFaint: "#9ca3af", textGhost: "#d1d5db",
};

const formatVND = (n) => n == null ? "0đ" : new Intl.NumberFormat("vi-VN").format(n) + "đ";
const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "";
const today = () => new Date().toISOString().split("T")[0];
const thisMonth = () => today().slice(0, 7);

// --- COURSE STRUCTURE ---
const COURSES = [
  { id: "scratch", name: "Scratch & Block Coding", ageRange: "8-11", level: "Starter", duration: "3 tháng", fee: 1990000, color: V.amber },
  { id: "python_basic", name: "Python Fundamentals", ageRange: "12-14", level: "Beginner", duration: "4 tháng", fee: 2490000, color: V.mint },
  { id: "python_adv", name: "Python Advanced + AI", ageRange: "14-16", level: "Intermediate", duration: "4 tháng", fee: 2990000, color: V.accent },
  { id: "cpp", name: "C++ & Competitive Prog", ageRange: "14-18", level: "Advanced", duration: "6 tháng", fee: 3490000, color: V.vred },
  { id: "robotics", name: "Robotics & IoT", ageRange: "12-16", level: "All Levels", duration: "4 tháng", fee: 2990000, color: V.cyan },
  { id: "webdev", name: "Web Development", ageRange: "15-18+", level: "Intermediate", duration: "4 tháng", fee: 2990000, color: V.accent },
];

const LEAD_SOURCES = ["Facebook Ads", "Zalo", "Giới thiệu", "Website", "Event/Workshop", "Walk-in", "Khác"];
const LEAD_STATUSES = [
  { id: "new", label: "Mới", color: V.accent, bg: V.accentDim },
  { id: "contacted", label: "Đã liên hệ", color: V.amber, bg: V.amberDim },
  { id: "trial", label: "Học thử", color: V.purple, bg: V.purpleDim },
  { id: "negotiating", label: "Đang thương lượng", color: V.cyan, bg: V.cyanDim },
  { id: "enrolled", label: "Đã đăng ký", color: V.mint, bg: V.mintDim },
  { id: "lost", label: "Mất lead", color: V.red, bg: V.redDim },
];

const PAYMENT_STATUSES = [
  { id: "pending", label: "Chờ thanh toán", color: V.amber },
  { id: "partial", label: "Đã đặt cọc", color: V.cyan },
  { id: "paid", label: "Đã thanh toán", color: V.mint },
  { id: "overdue", label: "Quá hạn", color: V.red },
];

const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// --- SAMPLE DATA ---
const INITIAL_LEADS = [
  { id: 1, parentName: "Chị Hương", parentPhone: "0901234567", studentName: "Minh Đức", studentAge: 13, course: "python_basic", source: "Facebook Ads", status: "new", notes: "Quan tâm khóa Python, hỏi lịch học T7", createdAt: "2026-08-10", lastContact: null },
  { id: 2, parentName: "Anh Tuấn", parentPhone: "0912345678", studentName: "Bảo Ngọc", studentAge: 15, course: "cpp", source: "Giới thiệu", status: "contacted", notes: "Con đang thi HSG Tin, muốn luyện thêm C++", createdAt: "2026-08-08", lastContact: "2026-08-11" },
  { id: 3, parentName: "Chị Mai", parentPhone: "0923456789", studentName: "Hải Đăng", studentAge: 10, course: "scratch", source: "Website", status: "trial", notes: "Đã book lịch học thử 17/8", createdAt: "2026-08-05", lastContact: "2026-08-12" },
  { id: 4, parentName: "Anh Khoa", parentPhone: "0934567890", studentName: "Gia Hân", studentAge: 14, course: "robotics", source: "Event/Workshop", status: "negotiating", notes: "Rất thích workshop Robotics, hỏi giảm học phí cho 2 con", createdAt: "2026-08-03", lastContact: "2026-08-13" },
  { id: 5, parentName: "Chị Thảo", parentPhone: "0945678901", studentName: "Quang Minh", studentAge: 16, course: "webdev", source: "Zalo", status: "enrolled", notes: "Đã đóng full 3 tháng", createdAt: "2026-07-28", lastContact: "2026-08-01" },
  { id: 6, parentName: "Anh Dũng", parentPhone: "0956789012", studentName: "Thanh Tùng", studentAge: 12, course: "python_basic", source: "Walk-in", status: "enrolled", notes: "Walk-in, đăng ký luôn tại quầy", createdAt: "2026-08-01", lastContact: "2026-08-01" },
  { id: 7, parentName: "Chị Lan", parentPhone: "0967890123", studentName: "Phương Anh", studentAge: 9, course: "scratch", source: "Facebook Ads", status: "lost", notes: "Quá xa nhà, không tiện đưa đón", createdAt: "2026-07-20", lastContact: "2026-07-25" },
  { id: 8, parentName: "Anh Hải", parentPhone: "0978901234", studentName: "Đức Anh", studentAge: 15, course: "python_adv", source: "Giới thiệu", status: "contacted", notes: "Bạn Quang Minh giới thiệu, đang cân nhắc", createdAt: "2026-08-12", lastContact: "2026-08-13" },
];

const INITIAL_STUDENTS = [
  { id: 1, name: "Quang Minh", age: 16, parentName: "Chị Thảo", parentPhone: "0945678901", course: "webdev", classId: "WEB-01", enrollDate: "2026-08-01", paymentStatus: "paid", amountPaid: 8970000, totalFee: 8970000, note: "Founding student" },
  { id: 2, name: "Thanh Tùng", age: 12, parentName: "Anh Dũng", parentPhone: "0956789012", course: "python_basic", classId: "PY-01", enrollDate: "2026-08-01", paymentStatus: "paid", amountPaid: 2490000, totalFee: 2490000, note: "" },
  { id: 3, name: "Minh Anh", age: 14, parentName: "Chị Nga", parentPhone: "0989012345", course: "python_basic", classId: "PY-01", enrollDate: "2026-07-25", paymentStatus: "partial", amountPaid: 1000000, totalFee: 2490000, note: "Đặt cọc 1tr, trả nốt khi khai giảng" },
  { id: 4, name: "Hoàng Sơn", age: 15, parentName: "Anh Bình", parentPhone: "0990123456", course: "cpp", classId: "CPP-01", enrollDate: "2026-07-20", paymentStatus: "paid", amountPaid: 3490000, totalFee: 3490000, note: "HSG cấp quận 2025" },
  { id: 5, name: "Khánh Linh", age: 10, parentName: "Chị Yến", parentPhone: "0912345000", course: "scratch", classId: "SCR-01", enrollDate: "2026-08-05", paymentStatus: "pending", amountPaid: 0, totalFee: 1990000, note: "Chờ thanh toán sau buổi học thử" },
];

const INITIAL_CLASSES = [
  { id: "PY-01", name: "Python Cơ bản - Lớp 1", course: "python_basic", instructor: "Thuận", schedule: [{ day: "T7", time: "09:00 - 11:00" }], maxStudents: 8, startDate: "2026-08-17", status: "active" },
  { id: "CPP-01", name: "C++ Nâng cao - Lớp 1", course: "cpp", instructor: "Hạnh", schedule: [{ day: "T7", time: "14:00 - 16:30" }], maxStudents: 6, startDate: "2026-08-17", status: "active" },
  { id: "WEB-01", name: "Web Dev - Lớp 1", course: "webdev", instructor: "Thuận", schedule: [{ day: "CN", time: "09:00 - 11:30" }], maxStudents: 8, startDate: "2026-08-18", status: "active" },
  { id: "SCR-01", name: "Scratch - Lớp 1", course: "scratch", instructor: "Vân Anh", schedule: [{ day: "CN", time: "14:00 - 16:00" }], maxStudents: 10, startDate: "2026-08-18", status: "upcoming" },
  { id: "ROB-01", name: "Robotics - Lớp 1", course: "robotics", instructor: "Thuận", schedule: [{ day: "T6", time: "17:00 - 19:00" }], maxStudents: 8, startDate: "2026-09-01", status: "upcoming" },
];

const INITIAL_ATTENDANCE = [
  { id: 1, classId: "PY-01", studentId: 2, date: "2026-08-17", status: "present", note: "" },
  { id: 2, classId: "PY-01", studentId: 3, date: "2026-08-17", status: "present", note: "" },
  { id: 3, classId: "CPP-01", studentId: 4, date: "2026-08-17", status: "present", note: "Làm bài tập rất tốt" },
  { id: 4, classId: "WEB-01", studentId: 1, date: "2026-08-18", status: "present", note: "" },
];

const INSTRUCTORS = [
  { id: 1, name: "Thuận", role: "Co-founder / Lead Instructor", courses: ["python_basic", "webdev", "robotics"], phone: "0901111111" },
  { id: 2, name: "Vân Anh", role: "Co-founder / Instructor", courses: ["scratch", "python_basic"], phone: "0902222222" },
  { id: 3, name: "Hạnh", role: "Head of Academics", courses: ["cpp", "python_adv"], phone: "0903333333" },
];

// --- ICONS ---
const Ico = {
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Phone: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  Arrow: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>,
  Dash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Sales: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Class: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Students: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

// --- UI COMPONENTS ---
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",backdropFilter:"blur(8px)"}}/>
    <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"16px",width:"100%",maxWidth:wide?"820px":"540px",maxHeight:"88vh",overflow:"auto",boxShadow:`0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px ${V.border}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:`1px solid ${V.border}`,position:"sticky",top:0,background:V.surface,zIndex:1,borderRadius:"16px 16px 0 0"}}>
        <h3 style={{margin:0,color:V.accent,fontSize:"16px",fontWeight:700}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",color:V.textFaint,cursor:"pointer",padding:"4px"}}><Ico.Close/></button>
      </div>
      <div style={{padding:"24px"}}>{children}</div>
    </div>
  </div>
);

const Input = ({ label, ...p }) => (
  <div style={{marginBottom:"14px"}}>
    {label && <label style={{display:"block",color:V.textDim,fontSize:"11px",marginBottom:"5px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>{label}</label>}
    <input {...p} style={{width:"100%",padding:"10px 14px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"14px",outline:"none",boxSizing:"border-box",transition:"border 0.2s",...(p.style||{})}} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
  </div>
);

const Select = ({ label, children, ...p }) => (
  <div style={{marginBottom:"14px"}}>
    {label && <label style={{display:"block",color:V.textDim,fontSize:"11px",marginBottom:"5px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>{label}</label>}
    <select {...p} style={{width:"100%",padding:"10px 14px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"14px",outline:"none",boxSizing:"border-box",...(p.style||{})}}>{children}</select>
  </div>
);

const Textarea = ({ label, ...p }) => (
  <div style={{marginBottom:"14px"}}>
    {label && <label style={{display:"block",color:V.textDim,fontSize:"11px",marginBottom:"5px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>{label}</label>}
    <textarea {...p} style={{width:"100%",padding:"10px 14px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"14px",outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:"60px",...(p.style||{})}}/>
  </div>
);

const Btn = ({ children, variant="primary", small, ...p }) => {
  const s = {
    primary: {background:`linear-gradient(135deg,#00A79D,#008F86)`,color:"#fff",fontWeight:700},
    secondary: {background:V.surface2,color:V.accent,border:`1px solid ${V.border2}`},
    danger: {background:V.redDim,color:V.red,border:`1px solid rgba(239,68,68,0.25)`},
    ghost: {background:"transparent",color:V.textDim},
    mint: {background:V.mintDim,color:V.mint,border:`1px solid rgba(52,211,153,0.25)`},
  };
  return <button {...p} style={{padding:small?"7px 14px":"10px 20px",borderRadius:"8px",border:"none",fontSize:small?"12px":"13px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px",transition:"all 0.2s",...s[variant],...(p.style||{})}}>{children}</button>;
};

const Badge = ({ children, color = V.accent, bg }) => (
  <span style={{display:"inline-block",padding:"3px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:700,background:bg||`${color}18`,color,letterSpacing:"0.3px"}}>{children}</span>
);

const Stat = ({ label, value, sub, icon, color = V.accent }) => (
  <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"18px 20px",flex:1,minWidth:"170px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
      <span style={{color:V.textFaint,fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>{label}</span>
      <span style={{fontSize:"18px"}}>{icon}</span>
    </div>
    <div style={{color,fontSize:"26px",fontWeight:800,fontFamily:"'Glory','JetBrains Mono',sans-serif",lineHeight:1.1}}>{value}</div>
    {sub && <div style={{color:V.textFaint,fontSize:"11px",marginTop:"8px"}}>{sub}</div>}
  </div>
);

// ============================================
// MAIN APP
// ============================================
export default function VforgeApp() {
  const [tab, setTab] = useState("dashboard");
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [modal, setModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");

  // --- COMPUTED ---
  const totalRevenue = students.reduce((s, st) => s + st.amountPaid, 0);
  const pendingRevenue = students.reduce((s, st) => s + (st.totalFee - st.amountPaid), 0);
  const enrolledCount = students.length;
  const activeLeads = leads.filter(l => !["enrolled", "lost"].includes(l.status)).length;
  const conversionRate = leads.length > 0 ? ((leads.filter(l => l.status === "enrolled").length / leads.length) * 100).toFixed(0) : 0;

  const leadsByStatus = useMemo(() => {
    const map = {};
    LEAD_STATUSES.forEach(s => map[s.id] = leads.filter(l => l.status === s.id));
    return map;
  }, [leads]);

  // --- ADD LEAD MODAL ---
  const AddLeadModal = () => {
    const [f, setF] = useState({ parentName: "", parentPhone: "", studentName: "", studentAge: "", course: COURSES[0].id, source: LEAD_SOURCES[0], notes: "" });
    return (
      <Modal title="➕ Thêm Lead mới" onClose={() => setModal(null)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <Input label="Tên phụ huynh" value={f.parentName} onChange={e=>setF({...f,parentName:e.target.value})} placeholder="VD: Chị Hương"/>
          <Input label="Số điện thoại" value={f.parentPhone} onChange={e=>setF({...f,parentPhone:e.target.value})} placeholder="09xxxxxxxx"/>
          <Input label="Tên học viên" value={f.studentName} onChange={e=>setF({...f,studentName:e.target.value})} placeholder="Tên con"/>
          <Input label="Tuổi học viên" type="number" value={f.studentAge} onChange={e=>setF({...f,studentAge:e.target.value})} placeholder="VD: 14"/>
          <Select label="Khóa học quan tâm" value={f.course} onChange={e=>setF({...f,course:e.target.value})}>
            {COURSES.map(c=><option key={c.id} value={c.id}>{c.name} ({c.ageRange} tuổi)</option>)}
          </Select>
          <Select label="Nguồn lead" value={f.source} onChange={e=>setF({...f,source:e.target.value})}>
            {LEAD_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <Textarea label="Ghi chú" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Ghi chú cuộc trao đổi..."/>
        <Btn onClick={()=>{
          if(!f.parentName||!f.studentName)return;
          setLeads(prev=>[...prev,{id:Date.now(),status:"new",createdAt:today(),lastContact:null,...f,studentAge:Number(f.studentAge)}]);
          setModal(null);
        }} style={{width:"100%"}}>💾 Lưu Lead</Btn>
      </Modal>
    );
  };

  // --- ENROLL MODAL ---
  const EnrollModal = ({ lead }) => {
    const course = COURSES.find(c=>c.id===lead.course);
    const availableClasses = classes.filter(c=>c.course===lead.course);
    const [f, setF] = useState({ classId: availableClasses[0]?.id || "", amountPaid: "", paymentStatus: "pending", note: "" });
    return (
      <Modal title={`✅ Đăng ký — ${lead.studentName}`} onClose={() => setModal(null)}>
        <div style={{background:V.accentDim,borderRadius:"10px",padding:"14px 16px",marginBottom:"16px"}}>
          <div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{course?.name}</div>
          <div style={{color:V.textDim,fontSize:"12px",marginTop:"4px"}}>Học phí: <span style={{color:V.accent,fontWeight:700}}>{formatVND(course?.fee)}</span>/tháng · {course?.duration}</div>
        </div>
        <Select label="Xếp vào lớp" value={f.classId} onChange={e=>setF({...f,classId:e.target.value})}>
          {availableClasses.length > 0 ? availableClasses.map(c=><option key={c.id} value={c.id}>{c.name} ({c.schedule.map(s=>`${s.day} ${s.time}`).join(", ")})</option>) : <option value="">Chưa có lớp phù hợp</option>}
        </Select>
        <Input label="Số tiền đã thanh toán (VNĐ)" type="number" value={f.amountPaid} onChange={e=>setF({...f,amountPaid:e.target.value})} placeholder="0"/>
        <Select label="Trạng thái thanh toán" value={f.paymentStatus} onChange={e=>setF({...f,paymentStatus:e.target.value})}>
          {PAYMENT_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
        <Input label="Ghi chú" value={f.note} onChange={e=>setF({...f,note:e.target.value})}/>
        <Btn onClick={()=>{
          setStudents(prev=>[...prev,{id:Date.now(),name:lead.studentName,age:lead.studentAge,parentName:lead.parentName,parentPhone:lead.parentPhone,course:lead.course,classId:f.classId,enrollDate:today(),paymentStatus:f.paymentStatus,amountPaid:Number(f.amountPaid)||0,totalFee:course?.fee||0,note:f.note}]);
          setLeads(prev=>prev.map(l=>l.id===lead.id?{...l,status:"enrolled",lastContact:today()}:l));
          setModal(null);
        }} style={{width:"100%"}}>✅ Xác nhận đăng ký</Btn>
      </Modal>
    );
  };

  // --- ATTENDANCE MODAL ---
  const AttendanceModal = () => {
    const [selClass, setSelClass] = useState(classes.filter(c=>c.status==="active")[0]?.id || "");
    const [date, setDate] = useState(today());
    const classStudents = students.filter(s=>s.classId===selClass);
    const [marks, setMarks] = useState({});
    return (
      <Modal title="📋 Điểm danh" onClose={() => setModal(null)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <Select label="Lớp" value={selClass} onChange={e=>{setSelClass(e.target.value);setMarks({});}}>
            {classes.filter(c=>c.status==="active").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Ngày" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
        <div style={{marginTop:"8px"}}>
          {classStudents.length === 0 && <div style={{color:V.textFaint,textAlign:"center",padding:"20px"}}>Lớp chưa có học viên</div>}
          {classStudents.map(st => (
            <div key={st.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${V.border}`}}>
              <div>
                <div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{st.name}</div>
                <div style={{color:V.textFaint,fontSize:"12px"}}>{st.age} tuổi</div>
              </div>
              <div style={{display:"flex",gap:"6px"}}>
                {[{id:"present",label:"✅",c:V.mint},{id:"absent",label:"❌",c:V.red},{id:"late",label:"⏰",c:V.amber}].map(s=>(
                  <button key={s.id} onClick={()=>setMarks({...marks,[st.id]:s.id})} style={{
                    width:"36px",height:"36px",borderRadius:"8px",border:`2px solid ${marks[st.id]===s.id?s.c:V.border}`,
                    background:marks[st.id]===s.id?`${s.c}20`:V.bg,cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"all 0.15s"
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {classStudents.length > 0 && (
          <Btn onClick={()=>{
            const newRecords = classStudents.filter(st=>marks[st.id]).map(st=>({id:Date.now()+st.id,classId:selClass,studentId:st.id,date,status:marks[st.id],note:""}));
            setAttendance(prev=>[...prev,...newRecords]);
            setModal(null);
          }} style={{width:"100%",marginTop:"16px"}}>💾 Lưu điểm danh</Btn>
        )}
      </Modal>
    );
  };

  // ====== DASHBOARD ======
  const DashboardPage = () => (
    <div>
      <div style={{marginBottom:"24px"}}>
        <h2 style={{color:V.text,margin:"0 0 4px",fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>Dashboard <span style={{color:"#EF4136"}}>V</span><span style={{color:V.accent}}>forge</span></h2>
        <p style={{color:V.textFaint,margin:0,fontSize:"13px"}}>{new Date().toLocaleDateString("vi-VN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"14px",marginBottom:"24px"}}>
        <Stat label="Doanh thu đã thu" value={formatVND(totalRevenue)} icon="💰" color={V.mint} sub={`Còn phải thu: ${formatVND(pendingRevenue)}`}/>
        <Stat label="Học viên" value={enrolledCount} icon="🎓" color={V.accent} sub={`${classes.filter(c=>c.status==="active").length} lớp đang hoạt động`}/>
        <Stat label="Lead đang xử lý" value={activeLeads} icon="📞" color={V.amber} sub={`Tỷ lệ chuyển đổi: ${conversionRate}%`}/>
        <Stat label="Tổng Lead" value={leads.length} icon="📊" color={V.purple} sub={`${leads.filter(l=>l.status==="enrolled").length} đã đăng ký`}/>
      </div>

      {/* Sales Pipeline */}
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px",marginBottom:"20px"}}>
        <h3 style={{color:V.accent,margin:"0 0 16px",fontSize:"14px",fontWeight:700}}>🔄 Sales Pipeline</h3>
        <div style={{display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"4px"}}>
          {LEAD_STATUSES.map(s => {
            const count = leadsByStatus[s.id]?.length || 0;
            return (
              <div key={s.id} style={{flex:1,minWidth:"100px",textAlign:"center",padding:"14px 10px",background:s.bg,borderRadius:"10px",border:`1px solid ${s.color}22`}}>
                <div style={{color:s.color,fontSize:"28px",fontWeight:800,fontFamily:"'JetBrains Mono','SF Mono',monospace"}}>{count}</div>
                <div style={{color:V.textDim,fontSize:"11px",fontWeight:600,marginTop:"4px"}}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display:"flex",flexWrap:"wrap",gap:"16px"}}>
        {/* Recent leads */}
        <div style={{flex:1,minWidth:"300px",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px"}}>
          <h3 style={{color:V.accent,margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>📞 Lead gần đây</h3>
          {leads.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5).map(l => {
            const st = LEAD_STATUSES.find(s=>s.id===l.status);
            const course = COURSES.find(c=>c.id===l.course);
            return (
              <div key={l.id} style={{padding:"10px 0",borderBottom:`1px solid ${V.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{color:V.text,fontSize:"13px",fontWeight:600}}>{l.studentName} <span style={{color:V.textFaint,fontWeight:400}}>({l.parentName})</span></div>
                  <div style={{color:V.textFaint,fontSize:"11px",marginTop:"2px"}}>{course?.name} · {l.source}</div>
                </div>
                <Badge color={st?.color} bg={st?.bg}>{st?.label}</Badge>
              </div>
            );
          })}
        </div>

        {/* Upcoming classes */}
        <div style={{flex:1,minWidth:"300px",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px"}}>
          <h3 style={{color:V.accent,margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>📅 Lịch lớp học</h3>
          {classes.map(c => {
            const course = COURSES.find(co=>co.id===c.course);
            const studentCount = students.filter(s=>s.classId===c.id).length;
            return (
              <div key={c.id} style={{padding:"10px 0",borderBottom:`1px solid ${V.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{color:V.text,fontSize:"13px",fontWeight:600}}>{c.name}</div>
                  <div style={{color:V.textFaint,fontSize:"11px",marginTop:"2px"}}>{c.schedule.map(s=>`${s.day} ${s.time}`).join(", ")} · GV: {c.instructor}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:course?.color,fontSize:"13px",fontWeight:700}}>{studentCount}/{c.maxStudents}</div>
                  <Badge color={c.status==="active"?V.mint:V.amber}>{c.status==="active"?"Đang học":"Sắp mở"}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ====== SALES / LEADS ======
  const SalesPage = () => {
    const filtered = leads
      .filter(l => leadFilter === "all" || l.status === leadFilter)
      .filter(l => searchTerm === "" || l.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || l.parentName.toLowerCase().includes(searchTerm.toLowerCase()) || l.parentPhone.includes(searchTerm));

    return (
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
          <h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>📞 Quản lý <span style={{color:V.accent}}>Sales</span></h2>
          <Btn onClick={()=>setModal("add_lead")}><Ico.Plus/> Thêm Lead</Btn>
        </div>

        {/* Filters */}
        <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:1,minWidth:"200px"}}>
            <div style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:V.textFaint}}><Ico.Search/></div>
            <input placeholder="Tìm lead..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{width:"100%",padding:"9px 14px 9px 36px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
            <Btn small variant={leadFilter==="all"?"primary":"ghost"} onClick={()=>setLeadFilter("all")}>Tất cả ({leads.length})</Btn>
            {LEAD_STATUSES.filter(s=>!["enrolled","lost"].includes(s.id)).map(s=>(
              <Btn key={s.id} small variant={leadFilter===s.id?"primary":"ghost"} onClick={()=>setLeadFilter(s.id)}>{s.label} ({leadsByStatus[s.id]?.length||0})</Btn>
            ))}
          </div>
        </div>

        {/* Lead cards */}
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {filtered.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(l => {
            const st = LEAD_STATUSES.find(s=>s.id===l.status);
            const course = COURSES.find(c=>c.id===l.course);
            return (
              <div key={l.id} style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"12px",padding:"16px 20px",transition:"border 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=V.border2}
                onMouseLeave={e=>e.currentTarget.style.borderColor=V.border}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px",flexWrap:"wrap",gap:"8px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <span style={{color:V.text,fontSize:"15px",fontWeight:700}}>{l.studentName}</span>
                      <span style={{color:V.textFaint,fontSize:"13px"}}>{l.studentAge} tuổi</span>
                      <Badge color={st?.color} bg={st?.bg}>{st?.label}</Badge>
                    </div>
                    <div style={{display:"flex",gap:"12px",marginTop:"6px",color:V.textDim,fontSize:"12px",flexWrap:"wrap"}}>
                      <span style={{display:"flex",alignItems:"center",gap:"4px"}}><Ico.User/> {l.parentName}</span>
                      <span style={{display:"flex",alignItems:"center",gap:"4px"}}><Ico.Phone/> {l.parentPhone}</span>
                      <span style={{display:"flex",alignItems:"center",gap:"4px"}}><Ico.Calendar/> {formatDate(l.createdAt)}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <Badge color={course?.color}>{course?.name}</Badge>
                    <div style={{color:V.textFaint,fontSize:"11px",marginTop:"4px"}}>{l.source}</div>
                  </div>
                </div>
                {l.notes && <div style={{color:V.textDim,fontSize:"12px",padding:"8px 12px",background:V.bg,borderRadius:"8px",marginBottom:"10px"}}>{l.notes}</div>}
                <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                  {l.status !== "enrolled" && l.status !== "lost" && (
                    <>
                      <Select value={l.status} onChange={e=>setLeads(prev=>prev.map(x=>x.id===l.id?{...x,status:e.target.value,lastContact:today()}:x))} style={{marginBottom:0,padding:"6px 10px",fontSize:"12px",width:"auto",minWidth:"140px"}}>
                        {LEAD_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                      </Select>
                      {(l.status === "negotiating" || l.status === "trial") && (
                        <Btn small variant="mint" onClick={()=>setModal({type:"enroll",lead:l})}>✅ Đăng ký</Btn>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <div style={{textAlign:"center",padding:"40px",color:V.textFaint}}>Không tìm thấy lead nào</div>}
      </div>
    );
  };

  // ====== CLASSES ======
  const ClassesPage = () => (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
        <h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>📚 Quản lý <span style={{color:V.accent}}>Lớp học</span></h2>
        <Btn variant="secondary" onClick={()=>setModal("attendance")}><Ico.Check/> Điểm danh</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:"14px",marginBottom:"28px"}}>
        {classes.map(c => {
          const course = COURSES.find(co=>co.id===c.course);
          const classStudents = students.filter(s=>s.classId===c.id);
          const instructor = INSTRUCTORS.find(i=>i.name===c.instructor);
          const attendanceRecords = attendance.filter(a=>a.classId===c.id);
          return (
            <div key={c.id} style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",overflow:"hidden"}}>
              <div style={{padding:"4px 0",background:`linear-gradient(90deg,${course?.color}44,transparent)`}}/>
              <div style={{padding:"18px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                  <div>
                    <div style={{color:V.text,fontWeight:700,fontSize:"15px"}}>{c.name}</div>
                    <div style={{color:V.textFaint,fontSize:"12px",marginTop:"2px"}}>{course?.name}</div>
                  </div>
                  <Badge color={c.status==="active"?V.mint:V.amber}>{c.status==="active"?"Đang học":"Sắp mở"}</Badge>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
                  <div>
                    <div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700,letterSpacing:"0.5px"}}>Lịch học</div>
                    <div style={{color:V.textMid,fontSize:"13px",fontWeight:600,marginTop:"2px"}}>{c.schedule.map(s=>`${s.day} ${s.time}`).join(", ")}</div>
                  </div>
                  <div>
                    <div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700,letterSpacing:"0.5px"}}>Giảng viên</div>
                    <div style={{color:V.textMid,fontSize:"13px",fontWeight:600,marginTop:"2px"}}>{c.instructor}</div>
                  </div>
                  <div>
                    <div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700,letterSpacing:"0.5px"}}>Sĩ số</div>
                    <div style={{color:classStudents.length>=c.maxStudents?V.red:V.accent,fontSize:"18px",fontWeight:800,fontFamily:"'JetBrains Mono',monospace",marginTop:"2px"}}>{classStudents.length}<span style={{color:V.textFaint,fontSize:"13px",fontWeight:400}}>/{c.maxStudents}</span></div>
                  </div>
                  <div>
                    <div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700,letterSpacing:"0.5px"}}>Khai giảng</div>
                    <div style={{color:V.textMid,fontSize:"13px",fontWeight:600,marginTop:"2px"}}>{formatDate(c.startDate)}</div>
                  </div>
                </div>
                {classStudents.length > 0 && (
                  <div style={{borderTop:`1px solid ${V.border}`,paddingTop:"10px"}}>
                    <div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700,letterSpacing:"0.5px",marginBottom:"6px"}}>Học viên</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                      {classStudents.map(st => (
                        <span key={st.id} style={{padding:"3px 10px",background:V.bg,borderRadius:"6px",fontSize:"12px",color:V.textMid,fontWeight:500}}>{st.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructors */}
      <h3 style={{color:V.accent,fontSize:"15px",fontWeight:700,marginBottom:"14px"}}>👨‍🏫 Giảng viên</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"12px"}}>
        {INSTRUCTORS.map(inst => {
          const teachingClasses = classes.filter(c=>c.instructor===inst.name);
          return (
            <div key={inst.id} style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"12px",padding:"16px 20px"}}>
              <div style={{color:V.text,fontWeight:700,fontSize:"15px"}}>{inst.name}</div>
              <div style={{color:V.textFaint,fontSize:"12px",marginTop:"2px"}}>{inst.role}</div>
              <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"10px"}}>
                {inst.courses.map(cId => {
                  const course = COURSES.find(c=>c.id===cId);
                  return <Badge key={cId} color={course?.color}>{course?.name}</Badge>;
                })}
              </div>
              <div style={{marginTop:"10px",color:V.textDim,fontSize:"12px"}}>{teachingClasses.length} lớp đang dạy · {inst.phone}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ====== STUDENTS ======
  const StudentsPage = () => (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
        <h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>🎓 <span style={{color:V.accent}}>Học viên</span></h2>
        <div style={{display:"flex",gap:"8px"}}>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",color:V.textFaint}}><Ico.Search/></div>
            <input placeholder="Tìm..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{padding:"8px 12px 8px 32px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"13px",outline:"none",width:"180px",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>

      {/* Payment summary */}
      <div style={{display:"flex",flexWrap:"wrap",gap:"14px",marginBottom:"24px"}}>
        <Stat label="Đã thu" value={formatVND(totalRevenue)} icon="✅" color={V.mint}/>
        <Stat label="Chờ thu" value={formatVND(pendingRevenue)} icon="⏳" color={V.amber}/>
        <Stat label="Tổng học viên" value={enrolledCount} icon="🎓" color={V.accent}/>
      </div>

      {/* Student table */}
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:"800px"}}>
            <thead>
              <tr>{["Học viên","Tuổi","Phụ huynh","Khóa học","Lớp","Học phí","Đã thanh toán","Trạng thái","Ngày ĐK"].map((h,i)=>(
                <th key={i} style={{textAlign:"left",padding:"12px 14px",color:V.textFaint,fontSize:"10px",fontWeight:700,borderBottom:`1px solid ${V.border}`,textTransform:"uppercase",letterSpacing:"0.8px",background:V.surface2}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {students.filter(s=>searchTerm===""||s.name.toLowerCase().includes(searchTerm.toLowerCase())||s.parentName.toLowerCase().includes(searchTerm.toLowerCase())).map(st => {
                const course = COURSES.find(c=>c.id===st.course);
                const ps = PAYMENT_STATUSES.find(p=>p.id===st.paymentStatus);
                const cls = classes.find(c=>c.id===st.classId);
                return (
                  <tr key={st.id} style={{borderBottom:`1px solid ${V.border}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=V.surface2}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 14px",color:V.text,fontSize:"13px",fontWeight:600}}>{st.name}</td>
                    <td style={{padding:"12px 14px",color:V.textDim,fontSize:"13px"}}>{st.age}</td>
                    <td style={{padding:"12px 14px"}}>
                      <div style={{color:V.textMid,fontSize:"13px"}}>{st.parentName}</div>
                      <div style={{color:V.textFaint,fontSize:"11px"}}>{st.parentPhone}</div>
                    </td>
                    <td style={{padding:"12px 14px"}}><Badge color={course?.color}>{course?.name}</Badge></td>
                    <td style={{padding:"12px 14px",color:V.textDim,fontSize:"13px"}}>{cls?.name||st.classId||"—"}</td>
                    <td style={{padding:"12px 14px",color:V.accent,fontSize:"13px",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{formatVND(st.totalFee)}</td>
                    <td style={{padding:"12px 14px",color:V.mint,fontSize:"13px",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{formatVND(st.amountPaid)}</td>
                    <td style={{padding:"12px 14px"}}><Badge color={ps?.color}>{ps?.label}</Badge></td>
                    <td style={{padding:"12px 14px",color:V.textFaint,fontSize:"12px"}}>{formatDate(st.enrollDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ====== NAVIGATION ======
  const tabs = [
    { id: "dashboard", label: "Tổng quan", icon: <Ico.Dash/> },
    { id: "sales", label: "Sales", icon: <Ico.Sales/> },
    { id: "classes", label: "Lớp học", icon: <Ico.Class/> },
    { id: "students", label: "Học viên", icon: <Ico.Students/> },
  ];

  const pages = { dashboard: <DashboardPage/>, sales: <SalesPage/>, classes: <ClassesPage/>, students: <StudentsPage/> };

  return (
    <div style={{fontFamily:"'Glory','Inter','Segoe UI',sans-serif",background:V.bg,color:V.text,minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Glory:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        * { scrollbar-width: thin; scrollbar-color: ${V.border} ${V.bg}; }
        *::-webkit-scrollbar { width: 6px; height: 6px; }
        *::-webkit-scrollbar-track { background: ${V.bg}; }
        *::-webkit-scrollbar-thumb { background: ${V.border2}; border-radius: 3px; }
        input[type="date"]::-webkit-calendar-picker-indicator, input[type="month"]::-webkit-calendar-picker-indicator { filter: none; }
      `}</style>

      {/* Top nav */}
      <div style={{background:V.surface,borderBottom:`1px solid ${V.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"14px 0"}}>
              {/* Vforge Logo - Accurate Brand Recreation */}
              <svg width="120" height="36" viewBox="0 0 260 80" xmlns="http://www.w3.org/2000/svg">
                {/* V shape in teal */}
                <path d="M5 8 L32 72 L40 72 L22 28 L36 28 L36 8 L26 8 L26 22 L18 8 Z" fill="#00A79D"/>
                {/* F shape in red, integrated */}
                <path d="M26 8 L26 22 L36 22 L36 8 Z" fill="#EF4136"/>
                <path d="M30 12 L44 12 L44 8 L36 8 L36 22 L30 22 Z" fill="#EF4136"/>
                <path d="M30 16 L42 16 L42 20 L30 20 Z" fill="#EF4136"/>
                {/* "orge" text */}
                <text x="48" y="62" fontFamily="'Glory',sans-serif" fontSize="58" fontWeight="700" fill="#00A79D" letterSpacing="1">orge</text>
              </svg>
              <div>
                <div style={{color:V.textFaint,fontSize:"9px",letterSpacing:"2.5px",textTransform:"uppercase",fontFamily:"'Glory',sans-serif",marginTop:"2px"}}>WIRE THE CORE</div>
              </div>
            </div>
            <nav style={{display:"flex",gap:"2px"}}>
              {tabs.map(t => (
                <button key={t.id} onClick={()=>{setTab(t.id);setSearchTerm("");setLeadFilter("all");}} style={{
                  display:"flex",alignItems:"center",gap:"6px",padding:"14px 16px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:600,
                  background:"transparent",color:tab===t.id?V.accent:V.textDim,borderBottom:`2px solid ${tab===t.id?V.accent:"transparent"}`,transition:"all 0.2s"
                }}>{t.icon}<span style={{display:"inline"}}>{t.label}</span></button>
              ))}
            </nav>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <Btn small variant="ghost" onClick={()=>setModal("attendance")}>📋 Điểm danh</Btn>
            <Btn small onClick={()=>setModal("add_lead")}><Ico.Plus/> Lead</Btn>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"24px"}}>
        {pages[tab]}
      </div>

      {/* Modals */}
      {modal === "add_lead" && <AddLeadModal/>}
      {modal?.type === "enroll" && <EnrollModal lead={modal.lead}/>}
      {modal === "attendance" && <AttendanceModal/>}
    </div>
  );
}
