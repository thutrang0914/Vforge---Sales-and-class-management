import { useState, useMemo, useEffect } from "react";

const V = {
  bg:"#f7f8fa",surface:"#ffffff",surface2:"#f0f2f5",border:"#e0e4ea",border2:"#d0d5dd",
  accent:"#00A79D",accentDim:"rgba(0,167,157,0.08)",vred:"#EF4136",vredDim:"rgba(239,65,54,0.08)",
  mint:"#059669",mintDim:"rgba(5,150,105,0.08)",amber:"#d97706",amberDim:"rgba(217,119,6,0.08)",
  red:"#EF4136",redDim:"rgba(239,65,54,0.08)",purple:"#7c3aed",purpleDim:"rgba(124,58,237,0.08)",
  cyan:"#00A79D",cyanDim:"rgba(0,167,157,0.08)",
  text:"#1a1a2e",textMid:"#3d4558",textDim:"#6b7280",textFaint:"#9ca3af",textGhost:"#d1d5db",
};
const fmt = (n) => n==null?"0đ":new Intl.NumberFormat("vi-VN").format(n)+"đ";
const fmtD = (d) => d?new Date(d).toLocaleDateString("vi-VN"):"";
const tod = () => new Date().toISOString().split("T")[0];

const ACCOUNTS=[{id:1,username:"admin",password:"admin123",name:"Quan",role:"admin"},{id:2,username:"sales",password:"sales123",name:"Thu Trang",role:"sales"},{id:3,username:"reception",password:"letan123",name:"Minh Anh",role:"reception"}];
const ROLE_CFG={admin:{label:"Admin",color:V.vred,tabs:["dashboard","sales","classes","students","report","settings"]},sales:{label:"Sales",color:V.accent,tabs:["dashboard","sales","classes","students"]},reception:{label:"Lễ tân",color:V.purple,tabs:["dashboard","classes","students"]}};

const COURSE_LEVELS=[{id:"start",name:"Code Start",color:V.amber,icon:"🌱"},{id:"up",name:"Code Up",color:V.accent,icon:"🚀"},{id:"pro",name:"Code Pro",color:V.purple,icon:"⚡"},{id:"proplus",name:"Code Pro+",color:V.vred,icon:"🏆"}];
const COURSES=[
  {id:"start_1",name:"Code Start 1",level:"start",duration:"3 tháng",fee:1800000},{id:"start_2",name:"Code Start 2",level:"start",duration:"3 tháng",fee:1800000},
  {id:"up_1",name:"Code Up 1",level:"up",duration:"4 tháng",fee:2400000},{id:"up_2",name:"Code Up 2",level:"up",duration:"4 tháng",fee:2400000},{id:"up_3",name:"Code Up 3",level:"up",duration:"4 tháng",fee:2400000},{id:"up_4",name:"Code Up 4",level:"up",duration:"4 tháng",fee:2400000},
  {id:"pro_1",name:"Code Pro 1",level:"pro",duration:"5 tháng",fee:3200000},{id:"pro_2",name:"Code Pro 2",level:"pro",duration:"5 tháng",fee:3200000},{id:"pro_3",name:"Code Pro 3",level:"pro",duration:"5 tháng",fee:3200000},
  {id:"proplus_1",name:"Code Pro+ 1",level:"proplus",duration:"6 tháng",fee:3800000},{id:"proplus_2",name:"Code Pro+ 2",level:"proplus",duration:"6 tháng",fee:3800000},{id:"proplus_3",name:"Code Pro+ 3",level:"proplus",duration:"6 tháng",fee:3800000},
];
const gCC=(c)=>COURSE_LEVELS.find(l=>l.id===c?.level)?.color||V.accent;
const LOST_REASONS=["Học phí","Xa nhà","Lịch không phù hợp","Chưa sẵn sàng","Chọn nơi khác","Khác"];
const LEAD_SRC=["Facebook Ads","Zalo","Giới thiệu","Website","Event/Workshop","Walk-in","Khác"];
const LEAD_ST=[{id:"new",label:"Mới",color:V.accent,bg:V.accentDim},{id:"unreachable",label:"Chưa liên hệ được",color:V.amber,bg:V.amberDim},{id:"enrolled",label:"Đã đăng ký",color:V.purple,bg:V.purpleDim},{id:"paid",label:"Đóng học phí",color:V.mint,bg:V.mintDim},{id:"negotiating",label:"Đang thương lượng",color:V.cyan,bg:V.cyanDim},{id:"renew",label:"ĐK khóa tiếp",color:V.vred,bg:V.vredDim}];
const CLASS_ST=[{id:"upcoming",label:"Sắp diễn ra",color:V.amber},{id:"active",label:"Đang diễn ra",color:V.mint},{id:"paused",label:"Tạm dừng",color:V.purple},{id:"completed",label:"Đã kết thúc",color:V.textDim},{id:"cancelled",label:"Đã hủy",color:V.red}];
const PAY_ST=[{id:"pending",label:"Chờ TT",color:V.amber},{id:"partial",label:"Đặt cọc",color:V.cyan},{id:"paid",label:"Đã TT",color:V.mint},{id:"overdue",label:"Quá hạn",color:V.red}];

const I_LEADS=[
  {id:1,parentName:"Chị Hương",studentName:"Minh Đức",phone:"0901234567",email:"huong@gmail.com",course:"up_2",source:"Facebook Ads",status:"new",notes:"Quan tâm Code Up",referrer:"",createdAt:"2026-08-10"},
  {id:2,parentName:"Anh Tuấn",studentName:"Bảo Ngọc",phone:"0912345678",email:"tuan@gmail.com",course:"pro_1",source:"Giới thiệu",status:"unreachable",notes:"HSG Tin",referrer:"Quang Minh",createdAt:"2026-08-08"},
  {id:3,parentName:"Chị Mai",studentName:"Hải Đăng",phone:"0923456789",email:"",course:"start_1",source:"Website",status:"enrolled",notes:"Học thử 17/8",referrer:"",createdAt:"2026-08-05"},
  {id:4,parentName:"Anh Khoa",studentName:"Gia Hân",phone:"0934567890",email:"khoa@gmail.com",course:"up_3",source:"Event/Workshop",status:"negotiating",notes:"Hỏi giảm HP 2 con",referrer:"",createdAt:"2026-08-03"},
  {id:5,parentName:"Chị Thảo",studentName:"Quang Minh",phone:"0945678901",email:"thao@gmail.com",course:"proplus_1",source:"Zalo",status:"paid",notes:"Đã đóng full",referrer:"",createdAt:"2026-07-28",assignedClass:"PP-01"},
  {id:6,parentName:"Anh Dũng",studentName:"Thanh Tùng",phone:"0956789012",email:"",course:"up_1",source:"Walk-in",status:"paid",notes:"Walk-in",referrer:"",createdAt:"2026-08-01",assignedClass:"CU-01"},
  {id:7,parentName:"Chị Lan",studentName:"Phương Anh",phone:"0967890123",email:"lan@gmail.com",course:"start_1",source:"Facebook Ads",status:"new",notes:"Xa nhà",referrer:"",createdAt:"2026-07-20"},
  {id:8,parentName:"Anh Hải",studentName:"Đức Anh",phone:"0978901234",email:"hai@gmail.com",course:"pro_2",source:"Giới thiệu",status:"unreachable",notes:"Đang cân nhắc",referrer:"Quang Minh",createdAt:"2026-08-12"},
];
const I_STU=[
  {id:1,name:"Quang Minh",parentName:"Chị Thảo",parentPhone:"0945678901",course:"proplus_1",classId:"PP-01",enrollDate:"2026-08-01",paymentStatus:"paid",amountPaid:3800000,totalFee:3800000,note:""},
  {id:2,name:"Thanh Tùng",parentName:"Anh Dũng",parentPhone:"0956789012",course:"up_1",classId:"CU-01",enrollDate:"2026-08-01",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:3,name:"Minh Anh",parentName:"Chị Nga",parentPhone:"0989012345",course:"up_3",classId:"CU-03",enrollDate:"2026-07-25",paymentStatus:"partial",amountPaid:1000000,totalFee:2400000,note:"Đặt cọc 1tr"},
  {id:4,name:"Hoàng Sơn",parentName:"Anh Bình",parentPhone:"0990123456",course:"pro_1",classId:"CP-01",enrollDate:"2026-07-20",paymentStatus:"paid",amountPaid:3200000,totalFee:3200000,note:""},
  {id:5,name:"Khánh Linh",parentName:"Chị Yến",parentPhone:"0912345000",course:"start_1",classId:"CS-01",enrollDate:"2026-08-05",paymentStatus:"pending",amountPaid:0,totalFee:1800000,note:""},
];
const I_CLS=[
  {id:"CS-01",name:"Code Start 1 - Lớp A",course:"start_1",instructor:"Vân Anh",schedule:[{day:"CN",time:"09:00-11:00"}],maxStudents:10,startDate:"2026-08-18",status:"upcoming"},
  {id:"CS-02",name:"Code Start 1 - Lớp B",course:"start_1",instructor:"Vân Anh",schedule:[{day:"T7",time:"09:00-11:00"}],maxStudents:10,startDate:"2026-08-24",status:"upcoming"},
  {id:"CS-03",name:"Code Start 2 - Lớp A",course:"start_2",instructor:"Vân Anh",schedule:[{day:"CN",time:"14:00-16:00"}],maxStudents:10,startDate:"2026-08-18",status:"upcoming"},
  {id:"CU-01",name:"Code Up 1 - Lớp A",course:"up_1",instructor:"Thuận",schedule:[{day:"T7",time:"09:00-11:00"}],maxStudents:8,startDate:"2026-08-17",status:"upcoming"},
  {id:"CU-02",name:"Code Up 2 - Lớp A",course:"up_2",instructor:"Thuận",schedule:[{day:"T7",time:"14:00-16:00"}],maxStudents:8,startDate:"2026-08-24",status:"upcoming"},
  {id:"CU-03",name:"Code Up 3 - Lớp A",course:"up_3",instructor:"Thuận",schedule:[{day:"CN",time:"09:00-11:00"}],maxStudents:8,startDate:"2026-08-17",status:"upcoming"},
  {id:"CU-04",name:"Code Up 4 - Lớp A",course:"up_4",instructor:"Thuận",schedule:[{day:"CN",time:"14:00-16:00"}],maxStudents:8,startDate:"2026-08-24",status:"upcoming"},
  {id:"CP-01",name:"Code Pro 1 - Lớp A",course:"pro_1",instructor:"Hạnh",schedule:[{day:"T7",time:"14:00-16:30"}],maxStudents:6,startDate:"2026-08-17",status:"upcoming"},
  {id:"CP-02",name:"Code Pro 2 - Lớp A",course:"pro_2",instructor:"Hạnh",schedule:[{day:"CN",time:"14:00-16:30"}],maxStudents:6,startDate:"2026-08-24",status:"upcoming"},
  {id:"CP-03",name:"Code Pro 3 - Lớp A",course:"pro_3",instructor:"Hạnh",schedule:[{day:"T7",time:"17:00-19:30"}],maxStudents:6,startDate:"2026-09-01",status:"upcoming"},
  {id:"PP-01",name:"Code Pro+ 1 - Lớp A",course:"proplus_1",instructor:"Hạnh",schedule:[{day:"CN",time:"09:00-11:30"}],maxStudents:6,startDate:"2026-08-18",status:"upcoming"},
  {id:"PP-02",name:"Code Pro+ 2 - Lớp A",course:"proplus_2",instructor:"Hạnh",schedule:[{day:"T7",time:"09:00-11:30"}],maxStudents:6,startDate:"2026-09-01",status:"upcoming"},
  {id:"PP-03",name:"Code Pro+ 3 - Lớp A",course:"proplus_3",instructor:"Hạnh",schedule:[{day:"CN",time:"14:00-16:30"}],maxStudents:6,startDate:"2026-09-01",status:"upcoming"},
];
const I_ATT=[{id:1,classId:"CU-01",studentId:2,date:"2026-08-17",status:"present",note:""},{id:2,classId:"CU-03",studentId:3,date:"2026-08-17",status:"present",note:""},{id:3,classId:"CP-01",studentId:4,date:"2026-08-17",status:"present",note:""},{id:4,classId:"PP-01",studentId:1,date:"2026-08-18",status:"present",note:""}];
const INST=[{id:1,name:"Thuận",role:"Co-founder / Lead Instructor",courses:["up_1","up_2","up_3","up_4"],phone:"0901111111"},{id:2,name:"Vân Anh",role:"Co-founder / Instructor",courses:["start_1","start_2"],phone:"0902222222"},{id:3,name:"Hạnh",role:"Head of Academics",courses:["pro_1","pro_2","pro_3","proplus_1","proplus_2","proplus_3"],phone:"0903333333"}];

const Ic={Plus:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,Close:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,Search:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,Check:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,Dash:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,Sales:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,Class:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,Students:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,Report:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,Settings:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,Logout:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,Lock:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,Trash:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>};

const Modal=({title,onClose,children,wide})=>(<div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}><div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",backdropFilter:"blur(8px)"}}/><div onClick={e=>e.stopPropagation()} style={{position:"relative",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"16px",width:"100%",maxWidth:wide?"900px":"540px",maxHeight:"88vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:`1px solid ${V.border}`,position:"sticky",top:0,background:V.surface,zIndex:1,borderRadius:"16px 16px 0 0"}}><h3 style={{margin:0,color:V.accent,fontSize:"16px",fontWeight:700}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",color:V.textFaint,cursor:"pointer"}}><Ic.Close/></button></div><div style={{padding:"24px"}}>{children}</div></div></div>);
const Inp=({label,...p})=>(<div style={{marginBottom:"14px"}}>{label&&<label style={{display:"block",color:V.textDim,fontSize:"11px",marginBottom:"5px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>{label}</label>}<input {...p} style={{width:"100%",padding:"10px 14px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"14px",outline:"none",boxSizing:"border-box",...(p.style||{})}}/></div>);
const Sel=({label,children,...p})=>(<div style={{marginBottom:"14px"}}>{label&&<label style={{display:"block",color:V.textDim,fontSize:"11px",marginBottom:"5px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>{label}</label>}<select {...p} style={{width:"100%",padding:"10px 14px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"14px",outline:"none",boxSizing:"border-box",...(p.style||{})}}>{children}</select></div>);
const Btn=({children,variant="primary",small,...p})=>{const s={primary:{background:"linear-gradient(135deg,#00A79D,#008F86)",color:"#fff",fontWeight:700},secondary:{background:V.surface2,color:V.accent,border:`1px solid ${V.border2}`},danger:{background:V.redDim,color:V.red},ghost:{background:"transparent",color:V.textDim},mint:{background:V.mintDim,color:V.mint,border:"1px solid rgba(52,211,153,0.25)"}};return<button {...p} style={{padding:small?"7px 14px":"10px 20px",borderRadius:"8px",border:"none",fontSize:small?"12px":"13px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px",...s[variant],...(p.style||{})}}>{children}</button>};
const Badge=({children,color=V.accent,bg})=><span style={{display:"inline-block",padding:"3px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:700,background:bg||`${color}18`,color,whiteSpace:"nowrap"}}>{children}</span>;
const Stat=({label,value,sub,icon,color=V.accent})=>(<div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"18px 20px",flex:1,minWidth:"170px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}><span style={{color:V.textFaint,fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>{label}</span><span style={{fontSize:"18px"}}>{icon}</span></div><div style={{color,fontSize:"26px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>{value}</div>{sub&&<div style={{color:V.textFaint,fontSize:"11px",marginTop:"8px"}}>{sub}</div>}</div>);
const TH=({children})=><th style={{textAlign:"left",padding:"10px 12px",color:V.textFaint,fontSize:"10px",fontWeight:700,borderBottom:`1px solid ${V.border}`,textTransform:"uppercase",letterSpacing:"0.8px",background:V.surface2,whiteSpace:"nowrap"}}>{children}</th>;
const TD=({children,style:s})=><td style={{padding:"10px 12px",fontSize:"13px",color:V.textMid,borderBottom:`1px solid ${V.border}`,...(s||{})}}>{children}</td>;

const Logo=({w=120})=><svg width={w} height={w*0.3} viewBox="0 0 260 80" xmlns="http://www.w3.org/2000/svg"><path d="M5 8 L32 72 L40 72 L22 28 L36 28 L36 8 L26 8 L26 22 L18 8 Z" fill="#00A79D"/><path d="M26 8 L26 22 L36 22 L36 8 Z" fill="#EF4136"/><path d="M30 12 L44 12 L44 8 L36 8 L36 22 L30 22 Z" fill="#EF4136"/><path d="M30 16 L42 16 L42 20 L30 20 Z" fill="#EF4136"/><text x="48" y="62" fontFamily="'Glory',sans-serif" fontSize="58" fontWeight="700" fill="#00A79D" letterSpacing="1">orge</text></svg>;

// --- PERSIST HELPERS ---
const load=(key,fallback)=>{try{const d=localStorage.getItem("vf_"+key);return d?JSON.parse(d):fallback}catch{return fallback}};
const save=(key,val)=>{try{localStorage.setItem("vf_"+key,JSON.stringify(val))}catch{}};

export default function VforgeApp(){
  const[user,setUser]=useState(()=>load("user",null));
  const[accounts,setAccounts]=useState(()=>load("accounts",ACCOUNTS));
  const[tab,setTab]=useState("dashboard");
  const[leads,setLeads]=useState(()=>load("leads",I_LEADS));
  const[students,setStudents]=useState(()=>load("students",I_STU));
  const[classes,setClasses]=useState(()=>load("classes",I_CLS));
  const[attendance,setAttendance]=useState(()=>load("attendance",I_ATT));
  const[modal,setModal]=useState(null);
  const[search,setSearch]=useState("");
  const[leadF,setLeadF]=useState("all");
  const[adminPw,setAdminPw]=useState(()=>load("adminPw","vforge2026"));

  // Auto-save on change
  useEffect(()=>save("user",user),[user]);
  useEffect(()=>save("accounts",accounts),[accounts]);
  useEffect(()=>save("leads",leads),[leads]);
  useEffect(()=>save("students",students),[students]);
  useEffect(()=>save("classes",classes),[classes]);
  useEffect(()=>save("attendance",attendance),[attendance]);
  useEffect(()=>save("adminPw",adminPw),[adminPw]);

  const can=(t)=>user&&ROLE_CFG[user.role]?.tabs.includes(t);
  const totRev=students.reduce((s,st)=>s+st.amountPaid,0);
  const pendRev=students.reduce((s,st)=>s+(st.totalFee-st.amountPaid),0);
  const actLeads=leads.filter(l=>!["paid","renew"].includes(l.status)).length;
  const convR=leads.length>0?((leads.filter(l=>l.status==="paid").length/leads.length)*100).toFixed(0):0;
  const lbySt=useMemo(()=>{const m={};LEAD_ST.forEach(s=>m[s.id]=leads.filter(l=>l.status===s.id));return m},[leads]);
  const clsSC=(cid)=>students.filter(s=>s.classId===cid).length;
  const bestCls=(crs)=>{const a=classes.filter(c=>c.course===crs&&["upcoming","active"].includes(c.status));if(!a.length)return null;return a.reduce((b,c)=>clsSC(c.id)<clsSC(b.id)?c:b)};

  // LOGIN
  if(!user){
    const Login=()=>{const[u,setU]=useState("");const[p,setP]=useState("");const[e,setE]=useState("");
    return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:V.bg,fontFamily:"'Glory',sans-serif"}}><div style={{background:V.surface,borderRadius:"20px",padding:"40px",width:"100%",maxWidth:"400px",boxShadow:"0 20px 60px rgba(0,0,0,0.08)",border:`1px solid ${V.border}`}}>
      <div style={{textAlign:"center",marginBottom:"32px"}}><Logo w={140}/><div style={{color:V.textFaint,fontSize:"11px",letterSpacing:"3px",marginTop:"8px"}}>EDUCATION CRM</div></div>
      <Inp label="Tên đăng nhập" value={u} onChange={ev=>{setU(ev.target.value);setE("")}} placeholder="admin / sales / reception" onKeyDown={ev=>ev.key==="Enter"&&doLogin()}/>
      <Inp label="Mật khẩu" type="password" value={p} onChange={ev=>{setP(ev.target.value);setE("")}} placeholder="••••••" onKeyDown={ev=>ev.key==="Enter"&&doLogin()}/>
      {e&&<div style={{color:V.red,fontSize:"13px",marginBottom:"12px",textAlign:"center"}}>{e}</div>}
      <Btn onClick={doLogin} style={{width:"100%",padding:"12px",fontSize:"15px"}}>Đăng nhập</Btn>
      <div style={{marginTop:"20px",padding:"14px",background:V.surface2,borderRadius:"10px",fontSize:"12px",color:V.textDim}}>
        <div style={{fontWeight:700,marginBottom:"6px"}}>Tài khoản mẫu:</div>
        <div>Admin: <b>admin</b> / admin123</div><div>Sales: <b>sales</b> / sales123</div><div>Lễ tân: <b>reception</b> / letan123</div>
      </div>
    </div></div>);
    function doLogin(){const f=accounts.find(a=>a.username===u&&a.password===p);if(f){setUser(f);setTab("dashboard")}else setE("Sai tên đăng nhập hoặc mật khẩu")}};
    return<Login/>}

  // ADD LEAD
  const AddLead=()=>{const[f,setF]=useState({parentName:"",studentName:"",phone:"",email:"",course:COURSES[0].id,source:LEAD_SRC[0],notes:"",referrer:""});
  return(<Modal title="➕ Thêm Lead mới" onClose={()=>setModal(null)} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <Inp label="Họ tên phụ huynh" value={f.parentName} onChange={e=>setF({...f,parentName:e.target.value})} placeholder="VD: Chị Hương"/>
      <Inp label="Họ tên học viên" value={f.studentName} onChange={e=>setF({...f,studentName:e.target.value})}/>
      <Inp label="Số điện thoại" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="09xxxxxxxx"/>
      <Inp label="Email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="email@gmail.com"/>
      <Sel label="Trình độ" value={f.course} onChange={e=>setF({...f,course:e.target.value})}>{COURSE_LEVELS.map(lv=><optgroup key={lv.id} label={`${lv.icon} ${lv.name}`}>{COURSES.filter(c=>c.level===lv.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</Sel>
      <Sel label="Nguồn" value={f.source} onChange={e=>setF({...f,source:e.target.value})}>{LEAD_SRC.map(s=><option key={s} value={s}>{s}</option>)}</Sel>
      <Inp label="Người giới thiệu" value={f.referrer} onChange={e=>setF({...f,referrer:e.target.value})} placeholder="Nếu có"/>
    </div>
    <Inp label="Ghi chú" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/>
    <Btn onClick={()=>{if(!f.parentName||!f.studentName)return;if(f.phone&&leads.find(l=>l.phone===f.phone)){if(!confirm(`⚠ SĐT ${f.phone} đã tồn tại (${leads.find(l=>l.phone===f.phone).parentName} - ${leads.find(l=>l.phone===f.phone).studentName}). Vẫn thêm?`))return};setLeads(p=>[...p,{id:Date.now(),status:"new",createdAt:tod(),...f}]);setModal(null)}} style={{width:"100%"}}>💾 Lưu Lead</Btn>
  </Modal>)};

  // ENROLL (auto-assign + password)
  const Enroll=({lead})=>{const co=COURSES.find(c=>c.id===lead.course);const bc=bestCls(lead.course);const ac=classes.filter(c=>c.course===lead.course&&["upcoming","active"].includes(c.status));
  const[sel,setSel]=useState(bc?.id||"");const[wc,setWc]=useState(false);const[pw,setPw]=useState("");const[pe,setPe]=useState("");const[pv,setPv]=useState(false);
  const chg=(id)=>{setSel(id);if(id===bc?.id){setWc(false);setPv(false)}else{setWc(true);setPv(false);setPw("")}};
  const ok=sel&&(sel===bc?.id||pv);
  return(<Modal title={`✅ Đăng ký — ${lead.studentName}`} onClose={()=>setModal(null)}>
    <div style={{background:V.accentDim,borderRadius:"10px",padding:"14px 16px",marginBottom:"16px"}}><div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{co?.name}</div><div style={{color:V.textDim,fontSize:"12px",marginTop:"4px"}}>Học phí: <span style={{color:V.accent,fontWeight:700}}>{fmt(co?.fee)}</span> · {co?.duration}</div></div>
    {bc?<div style={{background:V.mintDim,borderRadius:"10px",padding:"12px 16px",marginBottom:"16px"}}><div style={{color:V.mint,fontSize:"12px",fontWeight:700}}>🎯 Tự động xếp lớp ít nhất:</div><div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{bc.name} ({clsSC(bc.id)}/{bc.maxStudents})</div></div>:<div style={{background:V.amberDim,borderRadius:"10px",padding:"12px 16px",marginBottom:"16px",color:V.amber,fontSize:"13px"}}>⚠ Chưa có lớp phù hợp</div>}
    {ac.length>1&&<><Sel label="Chuyển lớp khác (cần mật khẩu)" value={sel} onChange={e=>chg(e.target.value)}>{ac.map(c=><option key={c.id} value={c.id}>{c.name} ({clsSC(c.id)}/{c.maxStudents}){c.id===bc?.id?" ⭐":""}</option>)}</Sel>
    {wc&&!pv&&<div style={{display:"flex",gap:"8px",marginBottom:"14px"}}><input type="password" value={pw} onChange={e=>{setPw(e.target.value);setPe("")}} placeholder="Mật khẩu admin" onKeyDown={e=>e.key==="Enter"&&vfy()} style={{flex:1,padding:"10px 14px",background:V.bg,border:`1px solid ${pe?V.red:V.border}`,borderRadius:"8px",color:V.text,fontSize:"14px",outline:"none",boxSizing:"border-box"}}/><Btn small onClick={vfy}><Ic.Lock/> OK</Btn></div>}
    {pe&&<div style={{color:V.red,fontSize:"12px",marginBottom:"10px"}}>{pe}</div>}
    {pv&&<div style={{color:V.mint,fontSize:"12px",marginBottom:"10px"}}>✅ Đã xác nhận</div>}</>}
    <Btn onClick={()=>{if(!ok)return;setStudents(p=>[...p,{id:Date.now(),name:lead.studentName,parentName:lead.parentName,parentPhone:lead.phone,course:lead.course,classId:sel,enrollDate:tod(),paymentStatus:"pending",amountPaid:0,totalFee:co?.fee||0,note:""}]);setLeads(p=>p.map(l=>l.id===lead.id?{...l,status:"enrolled"}:l));setModal(null)}} style={{width:"100%",opacity:ok?1:0.5,cursor:ok?"pointer":"not-allowed"}}>✅ Xác nhận đăng ký</Btn>
  </Modal>);function vfy(){if(pw===adminPw){setPv(true);setPe("")}else setPe("Sai mật khẩu")}};

  // ADD CLASS
  const AddCls=()=>{const[f,setF]=useState({course:COURSES[0].id,name:"",instructor:INST[0].name,day:"T7",timeStart:"09:00",timeEnd:"11:00",maxStudents:8,startDate:tod()});
  const co=COURSES.find(c=>c.id===f.course);const lvl=COURSE_LEVELS.find(l=>l.id===co?.level);
  const autoName=()=>{const existing=classes.filter(c=>c.course===f.course);const letter=String.fromCharCode(65+existing.length);return`${co?.name} - Lớp ${letter}`};
  return(<Modal title="📚 Tạo lớp học mới" onClose={()=>setModal(null)} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <Sel label="Khóa học" value={f.course} onChange={e=>setF({...f,course:e.target.value})}>{COURSE_LEVELS.map(lv=><optgroup key={lv.id} label={`${lv.icon} ${lv.name}`}>{COURSES.filter(c=>c.level===lv.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</Sel>
      <Inp label="Tên lớp" value={f.name||autoName()} onChange={e=>setF({...f,name:e.target.value})}/>
      <Sel label="Giảng viên" value={f.instructor} onChange={e=>setF({...f,instructor:e.target.value})}>{INST.map(i=><option key={i.id} value={i.name}>{i.name} - {i.role}</option>)}</Sel>
      <Inp label="Sĩ số tối đa" type="number" value={f.maxStudents} onChange={e=>setF({...f,maxStudents:Number(e.target.value)})}/>
      <Sel label="Ngày học" value={f.day} onChange={e=>setF({...f,day:e.target.value})}><option value="T2">Thứ 2</option><option value="T3">Thứ 3</option><option value="T4">Thứ 4</option><option value="T5">Thứ 5</option><option value="T6">Thứ 6</option><option value="T7">Thứ 7</option><option value="CN">Chủ nhật</option></Sel>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 8px"}}><Inp label="Giờ bắt đầu" type="time" value={f.timeStart} onChange={e=>setF({...f,timeStart:e.target.value})}/><Inp label="Giờ kết thúc" type="time" value={f.timeEnd} onChange={e=>setF({...f,timeEnd:e.target.value})}/></div>
      <Inp label="Ngày khai giảng" type="date" value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/>
    </div>
    <div style={{background:V.accentDim,borderRadius:"10px",padding:"14px 16px",marginBottom:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{f.name||autoName()}</div><div style={{color:V.textDim,fontSize:"12px",marginTop:"2px"}}>{co?.name} · {f.day} {f.timeStart}-{f.timeEnd} · GV: {f.instructor}</div></div>
      <Badge color={lvl?.color}>{lvl?.icon} {lvl?.name}</Badge>
    </div>
    <Btn onClick={()=>{const nm=f.name||autoName();const id=`CLS-${Date.now()}`;setClasses(p=>[...p,{id,name:nm,course:f.course,instructor:f.instructor,schedule:[{day:f.day,time:`${f.timeStart}-${f.timeEnd}`}],maxStudents:f.maxStudents,startDate:f.startDate,status:"upcoming"}]);setModal(null)}} style={{width:"100%"}}>✅ Tạo lớp</Btn>
  </Modal>)};

  // ATTENDANCE
  const Attend=()=>{const ac=classes.filter(c=>c.status==="active");const[sc,setSc]=useState(ac[0]?.id||"");const[dt,setDt]=useState(tod());const cs=students.filter(s=>s.classId===sc);const[mk,setMk]=useState({});
  return(<Modal title="📋 Điểm danh" onClose={()=>setModal(null)} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}><Sel label="Lớp" value={sc} onChange={e=>{setSc(e.target.value);setMk({})}}>{ac.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel><Inp label="Ngày" type="date" value={dt} onChange={e=>setDt(e.target.value)}/></div>
    {!cs.length&&<div style={{color:V.textFaint,textAlign:"center",padding:"20px"}}>Chưa có học viên</div>}
    {cs.map(st=><div key={st.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${V.border}`}}><div><div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{st.name}</div><div style={{color:V.textFaint,fontSize:"12px"}}>{st.parentName}</div></div><div style={{display:"flex",gap:"6px"}}>{[{id:"present",l:"✅",c:V.mint},{id:"absent",l:"❌",c:V.red},{id:"late",l:"⏰",c:V.amber}].map(s=><button key={s.id} onClick={()=>setMk({...mk,[st.id]:s.id})} style={{width:"36px",height:"36px",borderRadius:"8px",border:`2px solid ${mk[st.id]===s.id?s.c:V.border}`,background:mk[st.id]===s.id?`${s.c}20`:V.bg,cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>{s.l}</button>)}</div></div>)}
    {cs.length>0&&<Btn onClick={()=>{setAttendance(p=>[...p,...cs.filter(st=>mk[st.id]).map(st=>({id:Date.now()+st.id,classId:sc,studentId:st.id,date:dt,status:mk[st.id],note:""}))]);setModal(null)}} style={{width:"100%",marginTop:"16px"}}>💾 Lưu điểm danh</Btn>}
  </Modal>)};

  // DASHBOARD
  const Dash=()=>(<div>
    <div style={{marginBottom:"24px"}}><h2 style={{color:V.text,margin:"0 0 4px",fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>Dashboard <span style={{color:"#EF4136"}}>V</span><span style={{color:V.accent}}>forge</span></h2><p style={{color:V.textFaint,margin:0,fontSize:"13px"}}>{new Date().toLocaleDateString("vi-VN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"14px",marginBottom:"24px"}}><Stat label="Đã thu" value={fmt(totRev)} icon="💰" color={V.mint} sub={`Chờ thu: ${fmt(pendRev)}`}/><Stat label="Học viên" value={students.length} icon="🎓" color={V.accent} sub={`${classes.filter(c=>c.status==="active").length} lớp hoạt động`}/><Stat label="Lead xử lý" value={actLeads} icon="📞" color={V.amber} sub={`Chuyển đổi: ${convR}%`}/><Stat label="Tổng Lead" value={leads.length} icon="📊" color={V.purple} sub={`${leads.filter(l=>l.status==="paid").length} đã đóng HP`}/></div>
    <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px",marginBottom:"20px"}}><h3 style={{color:V.accent,margin:"0 0 16px",fontSize:"14px",fontWeight:700}}>🔄 Sales Pipeline</h3><div style={{display:"flex",gap:"8px",overflowX:"auto"}}>{LEAD_ST.map(s=><div key={s.id} style={{flex:1,minWidth:"90px",textAlign:"center",padding:"14px 10px",background:s.bg,borderRadius:"10px"}}><div style={{color:s.color,fontSize:"28px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>{lbySt[s.id]?.length||0}</div><div style={{color:V.textDim,fontSize:"11px",fontWeight:600,marginTop:"4px"}}>{s.label}</div></div>)}</div></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"16px"}}>
      <div style={{flex:1,minWidth:"300px",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px"}}><h3 style={{color:V.accent,margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>📞 Lead gần đây</h3>{leads.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5).map(l=>{const st=LEAD_ST.find(s=>s.id===l.status);const co=COURSES.find(c=>c.id===l.course);return<div key={l.id} style={{padding:"10px 0",borderBottom:`1px solid ${V.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{color:V.text,fontSize:"13px",fontWeight:600}}>{l.studentName} <span style={{color:V.textFaint,fontWeight:400}}>({l.parentName})</span></div><div style={{color:V.textFaint,fontSize:"11px",marginTop:"2px"}}>{co?.name} · {l.source}</div></div><Badge color={st?.color} bg={st?.bg}>{st?.label}</Badge></div>})}</div>
      <div style={{flex:1,minWidth:"300px",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px"}}><h3 style={{color:V.accent,margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>📅 Lớp học</h3>{classes.filter(c=>["active","upcoming"].includes(c.status)).map(c=>{const co=COURSES.find(x=>x.id===c.course);const cs2=CLASS_ST.find(s=>s.id===c.status);return<div key={c.id} style={{padding:"10px 0",borderBottom:`1px solid ${V.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{color:V.text,fontSize:"13px",fontWeight:600}}>{c.name}</div><div style={{color:V.textFaint,fontSize:"11px",marginTop:"2px"}}>{c.schedule.map(s=>`${s.day} ${s.time}`).join(", ")} · {c.instructor}</div></div><div style={{textAlign:"right"}}><div style={{color:gCC(co),fontSize:"13px",fontWeight:700}}>{clsSC(c.id)}/{c.maxStudents}</div><Badge color={cs2?.color}>{cs2?.label}</Badge></div></div>})}</div>
    </div>
  </div>);

  // SALES TABLE
  const SalesP=()=>{const fl=leads.filter(l=>leadF==="all"||l.status===leadF).filter(l=>!search||[l.studentName,l.parentName,l.phone,l.email].some(x=>(x||"").toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}><h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>📞 Quản lý <span style={{color:V.accent}}>Sales</span></h2><Btn onClick={()=>setModal("add_lead")}><Ic.Plus/> Thêm Lead</Btn></div>
    <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center"}}><div style={{position:"relative",flex:1,minWidth:"200px"}}><div style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:V.textFaint}}><Ic.Search/></div><input placeholder="Tìm lead..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"9px 14px 9px 36px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"13px",outline:"none",boxSizing:"border-box"}}/></div><div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}><Btn small variant={leadF==="all"?"primary":"ghost"} onClick={()=>setLeadF("all")}>Tất cả ({leads.length})</Btn>{LEAD_ST.map(s=><Btn key={s.id} small variant={leadF===s.id?"primary":"ghost"} onClick={()=>setLeadF(s.id)}>{s.label} ({lbySt[s.id]?.length||0})</Btn>)}</div></div>
    <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:"1250px"}}><thead><tr><TH>Phụ huynh</TH><TH>Học viên</TH><TH>SĐT</TH><TH>Email</TH><TH>Trạng thái</TH><TH>Nguồn</TH><TH>Trình độ</TH><TH>Xếp lớp</TH><TH>Lý do chưa chốt</TH><TH>Ghi chú</TH><TH>Người GT</TH></tr></thead>
    <tbody>{fl.map(l=>{const st=LEAD_ST.find(s=>s.id===l.status);const co=COURSES.find(c=>c.id===l.course);const isPaid=l.status==="paid";const ac=classes.filter(c=>c.course===l.course&&["upcoming","active"].includes(c.status));const bc=bestCls(l.course);return<tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background=V.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <TD style={{color:V.text,fontWeight:600}}>{l.parentName}</TD><TD style={{color:V.text,fontWeight:600}}>{l.studentName}</TD><TD>{l.phone}</TD><TD style={{fontSize:"12px"}}>{l.email||"—"}</TD>
      <TD><select value={l.status} onChange={e=>{const ns=e.target.value;setLeads(p=>p.map(x=>x.id===l.id?{...x,status:ns}:x));if(ns==="paid"){const b=bestCls(l.course);if(b&&!students.find(s=>s.name===l.studentName&&s.course===l.course)){setStudents(p=>[...p,{id:Date.now(),name:l.studentName,parentName:l.parentName,parentPhone:l.phone,course:l.course,classId:b.id,enrollDate:tod(),paymentStatus:"paid",amountPaid:co?.fee||0,totalFee:co?.fee||0,note:"Auto-assign"}]);setLeads(p=>p.map(x=>x.id===l.id?{...x,assignedClass:b.id}:x))}}}} style={{padding:"4px 8px",background:st?.bg,border:`1px solid ${st?.color}44`,borderRadius:"6px",color:st?.color,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{LEAD_ST.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></TD>
      <TD><select value={l.source} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,source:e.target.value}:x))} style={{padding:"4px 8px",background:V.surface2,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.textMid,fontSize:"11px",fontWeight:600,outline:"none",cursor:"pointer"}}>{LEAD_SRC.map(s=><option key={s} value={s}>{s}</option>)}</select></TD>
      <TD><select value={l.course} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,course:e.target.value}:x))} style={{padding:"4px 8px",background:`${gCC(co)}18`,border:`1px solid ${gCC(co)}44`,borderRadius:"6px",color:gCC(co),fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{COURSE_LEVELS.map(lv=><optgroup key={lv.id} label={`${lv.icon} ${lv.name}`}>{COURSES.filter(c=>c.level===lv.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</select></TD>
      <TD>{isPaid?(ac.length>0?<select value={l.assignedClass||bc?.id||""} onChange={e=>{const cid=e.target.value;setLeads(p=>p.map(x=>x.id===l.id?{...x,assignedClass:cid}:x));if(!students.find(s=>s.name===l.studentName&&s.course===l.course)){setStudents(p=>[...p,{id:Date.now(),name:l.studentName,parentName:l.parentName,parentPhone:l.phone,course:l.course,classId:cid,enrollDate:tod(),paymentStatus:"paid",amountPaid:co?.fee||0,totalFee:co?.fee||0,note:""}])}else{setStudents(p=>p.map(s=>s.name===l.studentName&&s.course===l.course?{...s,classId:cid}:s))}}} style={{padding:"4px 8px",background:V.mintDim,border:`1px solid ${V.mint}44`,borderRadius:"6px",color:V.mint,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{ac.map(c=><option key={c.id} value={c.id}>{c.name} ({clsSC(c.id)}/{c.maxStudents})</option>)}</select>:<span style={{color:V.textFaint,fontSize:"11px"}}>Chưa có lớp</span>):<span style={{color:V.textGhost,fontSize:"11px"}}>Cần đóng HP</span>}</TD>
      <TD>{!isPaid&&l.status!=="renew"?<div style={{display:"flex",flexDirection:"column",gap:"4px"}}><select value={l.lostReason||""} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,lostReason:e.target.value}:x))} style={{padding:"4px 8px",background:V.surface2,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.textMid,fontSize:"11px",outline:"none",cursor:"pointer"}}><option value="">-- Chọn --</option>{LOST_REASONS.map(r=><option key={r} value={r}>{r}</option>)}</select>{l.lostReason==="Khác"&&<input value={l.lostNote||""} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,lostNote:e.target.value}:x))} placeholder="Ghi chú..." style={{padding:"4px 8px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.text,fontSize:"11px",outline:"none",width:"100%",boxSizing:"border-box"}}/>}</div>:<span style={{color:V.textGhost,fontSize:"11px"}}>—</span>}</TD>
      <TD style={{maxWidth:"130px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:"12px",color:V.textDim}}>{l.notes||"—"}</TD>
      <TD style={{color:l.referrer?V.accent:V.textGhost,fontWeight:l.referrer?600:400,fontSize:"12px"}}>{l.referrer||"—"}</TD>
    </tr>})}</tbody></table></div>{!fl.length&&<div style={{textAlign:"center",padding:"40px",color:V.textFaint}}>Không tìm thấy lead</div>}</div>
  </div>)};

  // CLASSES (editable status)
  const ClassP=()=>(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}><h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>📚 Quản lý <span style={{color:V.accent}}>Lớp học</span></h2><div style={{display:"flex",gap:"8px"}}><Btn variant="secondary" onClick={()=>setModal("attendance")}><Ic.Check/> Điểm danh</Btn>{(user.role==="admin")&&<Btn onClick={()=>setModal("add_class")}><Ic.Plus/> Tạo lớp</Btn>}</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:"14px",marginBottom:"28px"}}>{classes.map(c=>{const co=COURSES.find(x=>x.id===c.course);const sc=clsSC(c.id);const cs2=CLASS_ST.find(s=>s.id===c.status);const cst=students.filter(s=>s.classId===c.id);
    return<div key={c.id} style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",overflow:"hidden"}}><div style={{padding:"4px 0",background:`linear-gradient(90deg,${gCC(co)}44,transparent)`}}/><div style={{padding:"18px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}><div><div style={{color:V.text,fontWeight:700,fontSize:"15px"}}>{c.name}</div><div style={{color:V.textFaint,fontSize:"12px",marginTop:"2px"}}>{co?.name}</div></div>
      {(user.role==="admin"||user.role==="reception")?<select value={c.status} onChange={e=>setClasses(p=>p.map(x=>x.id===c.id?{...x,status:e.target.value}:x))} style={{padding:"4px 8px",background:`${cs2?.color}18`,border:`1px solid ${cs2?.color}44`,borderRadius:"6px",color:cs2?.color,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{CLASS_ST.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select>:<Badge color={cs2?.color}>{cs2?.label}</Badge>}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
        <div><div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700}}>Lịch học</div><div style={{color:V.textMid,fontSize:"13px",fontWeight:600,marginTop:"2px"}}>{c.schedule.map(s=>`${s.day} ${s.time}`).join(", ")}</div></div>
        <div><div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700}}>Giảng viên</div><div style={{color:V.textMid,fontSize:"13px",fontWeight:600,marginTop:"2px"}}>{c.instructor}</div></div>
        <div><div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700}}>Sĩ số</div><div style={{color:sc>=c.maxStudents?V.red:V.accent,fontSize:"18px",fontWeight:800,fontFamily:"'Glory',sans-serif",marginTop:"2px"}}>{sc}<span style={{color:V.textFaint,fontSize:"13px",fontWeight:400}}>/{c.maxStudents}</span></div></div>
        <div><div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700}}>Khai giảng</div><div style={{color:V.textMid,fontSize:"13px",fontWeight:600,marginTop:"2px"}}>{fmtD(c.startDate)}</div></div>
      </div>
      {cst.length>0&&<div style={{borderTop:`1px solid ${V.border}`,paddingTop:"10px"}}><div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700,marginBottom:"6px"}}>Học viên</div><div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>{cst.map(st=><span key={st.id} style={{padding:"3px 10px",background:V.bg,borderRadius:"6px",fontSize:"12px",color:V.textMid,fontWeight:500}}>{st.name}</span>)}</div></div>}
      {user.role==="admin"&&cst.length===0&&<div style={{borderTop:`1px solid ${V.border}`,paddingTop:"10px",textAlign:"right"}}><Btn small variant="danger" onClick={()=>{if(confirm(`Xóa lớp "${c.name}"?`))setClasses(p=>p.filter(x=>x.id!==c.id))}}><Ic.Trash/> Xóa lớp</Btn></div>}
    </div></div>})}</div>
    <h3 style={{color:V.accent,fontSize:"15px",fontWeight:700,marginBottom:"14px"}}>👨‍🏫 Giảng viên</h3>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"12px"}}>{INST.map(i=><div key={i.id} style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"12px",padding:"16px 20px"}}><div style={{color:V.text,fontWeight:700,fontSize:"15px"}}>{i.name}</div><div style={{color:V.textFaint,fontSize:"12px",marginTop:"2px"}}>{i.role}</div><div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"10px"}}>{i.courses.map(cId=>{const co=COURSES.find(c=>c.id===cId);return<Badge key={cId} color={gCC(co)}>{co?.name}</Badge>})}</div><div style={{marginTop:"10px",color:V.textDim,fontSize:"12px"}}>{classes.filter(c=>c.instructor===i.name).length} lớp · {i.phone}</div></div>)}</div>
  </div>);

  // STUDENTS
  const StuP=()=>(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}><h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>🎓 <span style={{color:V.accent}}>Học viên</span></h2><div style={{position:"relative"}}><div style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",color:V.textFaint}}><Ic.Search/></div><input placeholder="Tìm..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"8px 12px 8px 32px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"13px",outline:"none",width:"180px",boxSizing:"border-box"}}/></div></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"14px",marginBottom:"24px"}}><Stat label="Đã thu" value={fmt(totRev)} icon="✅" color={V.mint}/><Stat label="Chờ thu" value={fmt(pendRev)} icon="⏳" color={V.amber}/><Stat label="Tổng HV" value={students.length} icon="🎓" color={V.accent}/></div>
    <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:"800px"}}><thead><tr><TH>Học viên</TH><TH>Phụ huynh</TH><TH>Khóa học</TH><TH>Lớp</TH><TH>Học phí</TH><TH>Đã TT</TH><TH>Trạng thái</TH><TH>Ngày ĐK</TH></tr></thead>
    <tbody>{students.filter(s=>!search||s.name.toLowerCase().includes(search.toLowerCase())||s.parentName.toLowerCase().includes(search.toLowerCase())).map(st=>{const co=COURSES.find(c=>c.id===st.course);const ps=PAY_ST.find(p=>p.id===st.paymentStatus);const cl=classes.find(c=>c.id===st.classId);
    return<tr key={st.id} onMouseEnter={e=>e.currentTarget.style.background=V.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD style={{color:V.text,fontWeight:600}}>{st.name}</TD><TD><div>{st.parentName}</div><div style={{color:V.textFaint,fontSize:"11px"}}>{st.parentPhone}</div></TD><TD><Badge color={gCC(co)}>{co?.name}</Badge></TD><TD>{cl?.name||"—"}</TD><TD style={{color:V.accent,fontWeight:700,fontFamily:"monospace"}}>{fmt(st.totalFee)}</TD><TD style={{color:V.mint,fontWeight:700,fontFamily:"monospace"}}>{fmt(st.amountPaid)}</TD><TD><Badge color={ps?.color}>{ps?.label}</Badge></TD><TD style={{color:V.textFaint,fontSize:"12px"}}>{fmtD(st.enrollDate)}</TD></tr>})}</tbody></table></div></div>
  </div>);

  // REPORT
  const RepP=()=>{const[period,setPeriod]=useState("month");
  const now=new Date();const getRange=()=>{const s=new Date(now);if(period==="week"){s.setDate(s.getDate()-7)}else if(period==="month"){s.setMonth(s.getMonth()-1)}else if(period==="quarter"){s.setMonth(s.getMonth()-3)}else{s.setFullYear(s.getFullYear()-1)};return s.toISOString().split("T")[0]};
  const rangeStart=getRange();
  const paidInRange=leads.filter(l=>l.status==="paid"&&l.createdAt>=rangeStart);
  const allInRange=leads.filter(l=>l.createdAt>=rangeStart);
  const revInRange=students.filter(s=>s.enrollDate>=rangeStart).reduce((a,s)=>a+s.amountPaid,0);
  const pendInRange=students.filter(s=>s.enrollDate>=rangeStart).reduce((a,s)=>a+(s.totalFee-s.amountPaid),0);
  const convInRange=allInRange.length>0?((paidInRange.length/allInRange.length)*100).toFixed(1):0;
  const srcStats=LEAD_SRC.map(s=>{const total=allInRange.filter(l=>l.source===s).length;const paid=allInRange.filter(l=>l.source===s&&l.status==="paid").length;return{source:s,total,paid,rate:total>0?((paid/total)*100).toFixed(0):0}}).filter(s=>s.total>0).sort((a,b)=>b.total-a.total);
  const courseStats=COURSES.map(c=>{const total=allInRange.filter(l=>l.course===c.id).length;const paid=allInRange.filter(l=>l.course===c.id&&l.status==="paid").length;return{...c,total,paid,rate:total>0?((paid/total)*100).toFixed(0):0}}).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const reasonStats=LOST_REASONS.map(r=>{const count=leads.filter(l=>l.lostReason===r&&l.createdAt>=rangeStart).length;return{reason:r,count}}).filter(r=>r.count>0).sort((a,b)=>b.count-a.count);
  const pLabels={week:"Tuần này",month:"Tháng này",quarter:"Quý này",year:"Năm nay"};
  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}><h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>📊 <span style={{color:V.accent}}>Báo cáo</span></h2>
    <div style={{display:"flex",gap:"4px"}}>{["week","month","quarter","year"].map(p=><Btn key={p} small variant={period===p?"primary":"ghost"} onClick={()=>setPeriod(p)}>{pLabels[p]}</Btn>)}</div></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"14px",marginBottom:"24px"}}>
      <Stat label="Tỷ lệ chốt sales" value={`${convInRange}%`} icon="🎯" color={Number(convInRange)>=30?V.mint:V.amber} sub={`${paidInRange.length}/${allInRange.length} leads`}/>
      <Stat label="Doanh thu đã thu" value={fmt(revInRange)} icon="💰" color={V.mint} sub={pLabels[period]}/>
      <Stat label="Chờ thu" value={fmt(pendInRange)} icon="⏳" color={V.amber}/>
      <Stat label="Leads mới" value={allInRange.length} icon="📞" color={V.accent} sub={pLabels[period]}/>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"16px",marginBottom:"24px"}}>
      <div style={{flex:1,minWidth:"300px",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px"}}>
        <h3 style={{color:V.accent,margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>📈 Chốt sales theo nguồn</h3>
        {srcStats.map(s=><div key={s.source} style={{marginBottom:"12px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}><span style={{color:V.textMid,fontSize:"13px"}}>{s.source}</span><span style={{color:V.textDim,fontSize:"12px"}}>{s.paid}/{s.total} ({s.rate}%)</span></div><div style={{height:"6px",background:V.surface2,borderRadius:"3px",overflow:"hidden"}}><div style={{height:"100%",width:`${s.rate}%`,background:Number(s.rate)>=50?V.mint:Number(s.rate)>=25?V.amber:V.red,borderRadius:"3px"}}/></div></div>)}
        {srcStats.length===0&&<div style={{color:V.textFaint,textAlign:"center",padding:"20px"}}>Chưa có dữ liệu</div>}
      </div>
      <div style={{flex:1,minWidth:"300px",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px"}}>
        <h3 style={{color:V.accent,margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>📚 Chốt sales theo khóa</h3>
        {courseStats.map(c=><div key={c.id} style={{marginBottom:"12px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}><span style={{color:V.textMid,fontSize:"13px"}}>{c.name}</span><span style={{color:V.textDim,fontSize:"12px"}}>{c.paid}/{c.total} ({c.rate}%)</span></div><div style={{height:"6px",background:V.surface2,borderRadius:"3px",overflow:"hidden"}}><div style={{height:"100%",width:`${c.rate}%`,background:gCC(c),borderRadius:"3px"}}/></div></div>)}
        {courseStats.length===0&&<div style={{color:V.textFaint,textAlign:"center",padding:"20px"}}>Chưa có dữ liệu</div>}
      </div>
    </div>
    {reasonStats.length>0&&<div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px"}}>
      <h3 style={{color:V.red,margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>⚠ Lý do chưa chốt</h3>
      <div style={{display:"flex",flexWrap:"wrap",gap:"12px"}}>{reasonStats.map(r=><div key={r.reason} style={{background:V.redDim,borderRadius:"10px",padding:"12px 20px",textAlign:"center",minWidth:"100px"}}><div style={{color:V.red,fontSize:"24px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>{r.count}</div><div style={{color:V.textDim,fontSize:"12px",marginTop:"4px"}}>{r.reason}</div></div>)}</div>
    </div>}
  </div>)};

  // SETTINGS (Admin)
  const SetP=()=>{const[np,setNp]=useState(adminPw);const[sv,setSv]=useState(false);
  const[showAdd,setShowAdd]=useState(false);const[nf,setNf]=useState({name:"",username:"",password:"",role:"sales"});const[delConfirm,setDelConfirm]=useState(null);
  return(<div><h2 style={{color:V.text,margin:"0 0 24px",fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>⚙️ <span style={{color:V.accent}}>Cài đặt</span></h2>
    <div style={{maxWidth:"600px"}}>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px",marginBottom:"20px"}}><h3 style={{color:V.text,margin:"0 0 16px",fontSize:"15px",fontWeight:700}}>🔐 Mật khẩu chuyển lớp</h3><p style={{color:V.textDim,fontSize:"13px",marginBottom:"16px"}}>Dùng khi Sales muốn chuyển HV sang lớp khác thay vì lớp tự động.</p><Inp label="Mật khẩu" value={np} onChange={e=>{setNp(e.target.value);setSv(false)}}/><Btn onClick={()=>{setAdminPw(np);setSv(true)}}>{sv?"✅ Đã lưu":"💾 Lưu"}</Btn></div>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}><h3 style={{color:V.text,margin:0,fontSize:"15px",fontWeight:700}}>👥 Tài khoản hệ thống</h3><Btn small onClick={()=>setShowAdd(!showAdd)}>{showAdd?"✕ Đóng":"+ Tạo TK"}</Btn></div>
        {showAdd&&<div style={{background:V.bg,borderRadius:"10px",padding:"16px",marginBottom:"16px",border:`1px solid ${V.border}`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Inp label="Họ tên" value={nf.name} onChange={e=>setNf({...nf,name:e.target.value})} placeholder="VD: Nguyễn Văn A"/>
            <Inp label="Tên đăng nhập" value={nf.username} onChange={e=>setNf({...nf,username:e.target.value})} placeholder="VD: nguyenvana"/>
            <Inp label="Mật khẩu" value={nf.password} onChange={e=>setNf({...nf,password:e.target.value})} placeholder="Tối thiểu 6 ký tự"/>
            <Sel label="Vai trò" value={nf.role} onChange={e=>setNf({...nf,role:e.target.value})}><option value="admin">Admin</option><option value="sales">Sales</option><option value="reception">Lễ tân</option></Sel>
          </div>
          <Btn onClick={()=>{if(!nf.name||!nf.username||!nf.password)return;if(accounts.find(a=>a.username===nf.username)){alert("Username đã tồn tại!");return}setAccounts(p=>[...p,{id:Date.now(),...nf}]);setNf({name:"",username:"",password:"",role:"sales"});setShowAdd(false)}} style={{width:"100%"}}>✅ Tạo tài khoản</Btn>
        </div>}
        {accounts.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${V.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:`${ROLE_CFG[a.role]?.color}18`,display:"flex",alignItems:"center",justifyContent:"center",color:ROLE_CFG[a.role]?.color,fontWeight:700,fontSize:"14px"}}>{a.name.charAt(0)}</div>
            <div><div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{a.name}</div><div style={{color:V.textFaint,fontSize:"12px"}}>@{a.username}</div></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <Badge color={ROLE_CFG[a.role]?.color}>{ROLE_CFG[a.role]?.label}</Badge>
            {a.id!==user.id&&(delConfirm===a.id?<div style={{display:"flex",gap:"4px"}}><Btn small variant="danger" onClick={()=>{setAccounts(p=>p.filter(x=>x.id!==a.id));setDelConfirm(null)}}>Xóa</Btn><Btn small variant="ghost" onClick={()=>setDelConfirm(null)}>Hủy</Btn></div>:<Btn small variant="ghost" onClick={()=>setDelConfirm(a.id)} style={{color:V.red,fontSize:"11px"}}>🗑</Btn>)}
          </div>
        </div>)}
      </div>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px",marginTop:"20px"}}><h3 style={{color:V.text,margin:"0 0 16px",fontSize:"15px",fontWeight:700}}>🔄 Dữ liệu</h3><p style={{color:V.textDim,fontSize:"13px",marginBottom:"16px"}}>Reset toàn bộ dữ liệu về mặc định ban đầu (leads, học viên, lớp, chấm công).</p><Btn variant="danger" onClick={()=>{if(confirm("Xác nhận reset toàn bộ dữ liệu?")){setLeads(I_LEADS);setStudents(I_STU);setClasses(I_CLS);setAttendance(I_ATT);setAccounts(ACCOUNTS);setAdminPw("vforge2026");localStorage.clear()}}}>🗑 Reset dữ liệu</Btn></div>
    </div>
  </div>)};

  // NAV
  const allT=[{id:"dashboard",label:"Tổng quan",icon:<Ic.Dash/>},{id:"sales",label:"Sales",icon:<Ic.Sales/>},{id:"classes",label:"Lớp học",icon:<Ic.Class/>},{id:"students",label:"Học viên",icon:<Ic.Students/>},{id:"report",label:"Báo cáo",icon:<Ic.Report/>},{id:"settings",label:"Cài đặt",icon:<Ic.Settings/>}];
  const visT=allT.filter(t=>can(t.id));
  const pg={dashboard:<Dash/>,sales:<SalesP/>,classes:<ClassP/>,students:<StuP/>,report:<RepP/>,settings:<SetP/>};

  return(<div style={{fontFamily:"'Glory','Inter',sans-serif",background:V.bg,color:V.text,minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Glory:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700;800&display=swap');*{scrollbar-width:thin;scrollbar-color:${V.border} ${V.bg}}`}</style>
    <div style={{background:V.surface,borderBottom:`1px solid ${V.border}`,position:"sticky",top:0,zIndex:100}}><div style={{maxWidth:"1200px",margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:"24px"}}><div style={{display:"flex",alignItems:"center",gap:"10px",padding:"14px 0"}}><Logo/><div style={{color:V.textFaint,fontSize:"9px",letterSpacing:"2.5px",textTransform:"uppercase",fontFamily:"'Glory',sans-serif",marginTop:"2px"}}>WIRE THE CORE</div></div>
      <nav style={{display:"flex",gap:"2px"}}>{visT.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setSearch("");setLeadF("all")}} style={{display:"flex",alignItems:"center",gap:"6px",padding:"14px 16px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:600,background:"transparent",color:tab===t.id?V.accent:V.textDim,borderBottom:`2px solid ${tab===t.id?V.accent:"transparent"}`}}>{t.icon}<span>{t.label}</span></button>)}</nav></div>
      <div style={{display:"flex",gap:"8px",alignItems:"center"}}><div style={{textAlign:"right",marginRight:"8px"}}><div style={{color:V.text,fontSize:"13px",fontWeight:600}}>{user.name}</div><Badge color={ROLE_CFG[user.role]?.color}>{ROLE_CFG[user.role]?.label}</Badge></div>{can("sales")&&<Btn small onClick={()=>setModal("add_lead")}><Ic.Plus/> Lead</Btn>}<Btn small variant="ghost" onClick={()=>setUser(null)}><Ic.Logout/></Btn></div>
    </div></div>
    <div style={{maxWidth:"1200px",margin:"0 auto",padding:"24px"}}>{can(tab)?pg[tab]:<div style={{textAlign:"center",padding:"60px",color:V.textFaint}}>Không có quyền truy cập</div>}</div>
    {modal==="add_lead"&&<AddLead/>}{modal?.type==="enroll"&&<Enroll lead={modal.lead}/>}{modal==="attendance"&&<Attend/>}{modal==="add_class"&&<AddCls/>}
  </div>);
}
