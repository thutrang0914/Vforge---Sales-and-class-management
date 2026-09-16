import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSynced, useSyncedValue } from "./lib/useSynced";
import { sb, hasSupabase } from "./lib/supabase";
import { load } from "./lib/useSynced";
import { stable, SAMPLE_LEADS, SAMPLE_STUDENTS, SAMPLE_CLASSES, SAMPLE_ATTENDANCE } from "./lib/sampleKeys";

const V = {
  bg:"#f7f8fa",surface:"#ffffff",surface2:"#f0f2f5",border:"#e0e4ea",border2:"#d0d5dd",
  accent:"#00A79D",accentDim:"rgba(0,167,157,0.08)",vred:"#EF4136",vredDim:"rgba(239,65,54,0.08)",
  mint:"#059669",mintDim:"rgba(5,150,105,0.08)",amber:"#d97706",amberDim:"rgba(217,119,6,0.08)",
  red:"#EF4136",redDim:"rgba(239,65,54,0.08)",purple:"#7c3aed",purpleDim:"rgba(124,58,237,0.08)",
  cyan:"#00A79D",cyanDim:"rgba(0,167,157,0.08)",blue:"#2563eb",blueDim:"rgba(37,99,235,0.08)",
  text:"#1a1a2e",textMid:"#3d4558",textDim:"#6b7280",textFaint:"#9ca3af",textGhost:"#d1d5db",
};
const fmt = (n) => n==null?"0đ":new Intl.NumberFormat("vi-VN").format(n)+"đ";
const fmtD = (d) => d?new Date(d).toLocaleDateString("vi-VN"):"";
const tod = () => new Date().toISOString().split("T")[0];
const now = () => new Date().toISOString();

// --- SECURITY HELPERS ---
const hash=(s)=>{let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return"h_"+Math.abs(h).toString(36)};
const sanitize=(s)=>typeof s==="string"?s.replace(/<[^>]*>/g,"").trim():"";
const validPhone=(p)=>/^0\d{9}$/.test(p);
const validEmail=(e)=>!e||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const SESSION_TIMEOUT=30*60*1000; // 30 phút
const PROJECT_REF=(import.meta.env.VITE_SUPABASE_URL||"").replace(/^https?:\/\//,"").split(".")[0];

const ROLE_CFG={admin:{label:"Admin",color:V.vred,tabs:["dashboard","sales","classes","students","report","settings"]},sales:{label:"Sales",color:V.accent,tabs:["dashboard","sales","classes","students"]},reception:{label:"Lễ tân",color:V.purple,tabs:["dashboard","classes","students"]}};

const COURSE_LEVELS=[{id:"start",name:"Code Start",color:V.amber,icon:"🌱"},{id:"up",name:"Code Up",color:V.accent,icon:"🚀"},{id:"pro",name:"Code Pro",color:V.purple,icon:"⚡"},{id:"proplus",name:"Code Pro+",color:V.vred,icon:"🏆"}];
const COURSES=[
  {id:"start_1",name:"Code Start 1",level:"start",duration:"3 tháng",fee:1800000},{id:"start_2",name:"Code Start 2",level:"start",duration:"3 tháng",fee:1800000},
  {id:"up_1",name:"Code Up 1",level:"up",duration:"4 tháng",fee:2400000},{id:"up_2",name:"Code Up 2",level:"up",duration:"4 tháng",fee:2400000},{id:"up_3",name:"Code Up 3",level:"up",duration:"4 tháng",fee:2400000},{id:"up_4",name:"Code Up 4",level:"up",duration:"4 tháng",fee:2400000},
  {id:"pro_1",name:"Code Pro 1",level:"pro",duration:"5 tháng",fee:3200000},{id:"pro_2",name:"Code Pro 2",level:"pro",duration:"5 tháng",fee:3200000},{id:"pro_3",name:"Code Pro 3",level:"pro",duration:"5 tháng",fee:3200000},
  {id:"proplus_1",name:"Code Pro+ 1",level:"proplus",duration:"6 tháng",fee:3800000},{id:"proplus_2",name:"Code Pro+ 2",level:"proplus",duration:"6 tháng",fee:3800000},{id:"proplus_3",name:"Code Pro+ 3",level:"proplus",duration:"6 tháng",fee:3800000},
];
const gCC=(c)=>COURSE_LEVELS.find(l=>l.id===c?.level)?.color||V.accent;
const getFillTag=(count,max)=>{const pct=max>0?(count/max)*100:0;if(pct>=80)return{tag:"green",color:V.mint,bg:V.mintDim,label:"🟢"};if(pct>=50)return{tag:"yellow",color:V.amber,bg:V.amberDim,label:"🟡"};return{tag:"red",color:V.red,bg:V.redDim,label:"🔴"}};
const LOST_REASONS=["Học phí","Xa nhà","Lịch không phù hợp","Chưa sẵn sàng","Chọn nơi khác","Khác"];
const LEAD_SRC=["Facebook Ads","Zalo","Giới thiệu","Website","Event/Workshop","Walk-in","Khác"];
const LEARN_FORMAT=[{id:"offline",label:"Offline",color:V.accent},{id:"online",label:"Online",color:V.purple}];
const LEAD_ST=[{id:"new",label:"Mới",color:V.accent,bg:V.accentDim},{id:"unreachable",label:"Chưa liên hệ được",color:V.amber,bg:V.amberDim},{id:"testing",label:"Làm test đầu vào",color:V.blue,bg:V.blueDim},{id:"no_test",label:"Không làm test",color:V.textDim,bg:V.surface2},{id:"enrolled",label:"Đã đăng ký",color:V.purple,bg:V.purpleDim},{id:"paid",label:"Đóng học phí",color:V.mint,bg:V.mintDim},{id:"negotiating",label:"Đang thương lượng",color:V.cyan,bg:V.cyanDim},{id:"renew",label:"ĐK khóa tiếp",color:V.vred,bg:V.vredDim}];
const CLASS_ST=[{id:"upcoming",label:"Sắp diễn ra",color:V.amber},{id:"active",label:"Đang diễn ra",color:V.mint},{id:"paused",label:"Tạm dừng",color:V.purple},{id:"completed",label:"Đã kết thúc",color:V.textDim},{id:"cancelled",label:"Đã hủy",color:V.red}];
const PAY_ST=[{id:"pending",label:"Chờ TT",color:V.amber},{id:"partial",label:"Đặt cọc",color:V.cyan},{id:"paid",label:"Đã TT",color:V.mint},{id:"overdue",label:"Quá hạn",color:V.red}];

const I_LEADS=[];
const I_STU=[];
const I_CLS=[];
const I_ATT=[];
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

// --- PERSIST: Supabase (xem src/lib/useSynced.js), fallback localStorage khi chưa cấu hình .env.local ---

function Crm({user,onLogout}){
  const[profiles,setProfiles,syProf]=useSynced("profiles",[]);
  const[tab,setTab]=useState("dashboard");
  const[leads,setLeads,syLeads]=useSynced("leads",I_LEADS);
  const[students,setStudents,syStu]=useSynced("students",I_STU);
  const[classes,setClasses,syCls]=useSynced("classes",I_CLS);
  const[attendance,setAttendance,syAtt]=useSynced("attendance",I_ATT);
  const[modal,setModal]=useState(null);
  const[search,setSearch]=useState("");
  const[leadF,setLeadF]=useState("all");
  const[selL,setSelL]=useState(()=>new Set()); // lead đang chọn (xoá hàng loạt)
  const[adminPw,setAdminPw,syPw]=useSyncedValue("adminPw",hash("vforge2026"));
  const[auditLog,setAuditLog,syAud]=useSynced("audit_log",[],{ren:{user:"user_name"},localKey:"audit"});
  const syncs=[syProf,syLeads,syStu,syCls,syAtt,syPw,syAud];
  const dataReady=syncs.every(x=>x.ready);
  const syncError=syncs.map(x=>x.error).find(Boolean);

  // Session timeout
  const lastActivity=useRef(Date.now());
  const checkTimeout=useCallback(()=>{if(user&&Date.now()-lastActivity.current>SESSION_TIMEOUT){alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");onLogout()}},[user]);
  useEffect(()=>{const t=setInterval(checkTimeout,60000);const reset=()=>{lastActivity.current=Date.now()};window.addEventListener("mousemove",reset);window.addEventListener("keydown",reset);return()=>{clearInterval(t);window.removeEventListener("mousemove",reset);window.removeEventListener("keydown",reset)}},[checkTimeout]);

  // Audit helper
  const log=(action,detail)=>{const entry={id:Date.now(),user:user?.name||"System",role:user?.role||"",action,detail,time:now()};setAuditLog(p=>{const n=[entry,...p].slice(0,200);return n})};

  // Auto-save on change

  const can=(t)=>user&&ROLE_CFG[user.role]?.tabs.includes(t);
  const totRev=students.reduce((s,st)=>s+st.amountPaid,0);
  const pendRev=students.reduce((s,st)=>s+(st.totalFee-st.amountPaid),0);
  const actLeads=leads.filter(l=>!["paid","renew"].includes(l.status)).length;
  const convR=leads.length>0?((leads.filter(l=>l.status==="paid").length/leads.length)*100).toFixed(0):0;
  const lbySt=useMemo(()=>{const m={};LEAD_ST.forEach(s=>m[s.id]=leads.filter(l=>l.status===s.id));return m},[leads]);
  const clsSC=(cid)=>students.filter(s=>s.classId===cid).length;
  const bestCls=(crs)=>{
    const avail=classes.filter(c=>c.course===crs&&["upcoming","active"].includes(c.status));
    if(!avail.length)return null;
    const tagged=avail.map(c=>({c,fill:clsSC(c.id),pct:c.maxStudents>0?(clsSC(c.id)/c.maxStudents)*100:0}));
    const reds=tagged.filter(t=>t.pct<50);
    if(reds.length)return reds.reduce((b,t)=>t.pct>b.pct?t:b).c; // gần đầy nhất trong nhóm đỏ
    const yellows=tagged.filter(t=>t.pct>=50&&t.pct<80);
    if(yellows.length)return yellows.reduce((b,t)=>t.pct>b.pct?t:b).c; // gần đầy nhất trong nhóm vàng
    return null; // không có lớp đỏ/vàng phù hợp
  };

  // AUTO-SYNC: đảm bảo mọi lead đã đóng HP (paid/renew) đều có student record + lớp thật,
  // kể cả khi lúc đổi trạng thái chưa có lớp phù hợp và Admin tạo lớp sau đó.
  useEffect(()=>{
    if(!dataReady)return;
    const toSync=leads.filter(l=>(l.status==="paid"||l.status==="renew")&&!students.find(s=>s.name===l.studentName&&s.course===l.course));
    if(toSync.length===0)return;
    const newStudents=[];
    const leadUpdates={};
    toSync.forEach(l=>{
      const b=bestCls(l.course);
      if(b){
        const co=COURSES.find(c=>c.id===l.course);
        newStudents.push({id:Date.now()+Math.random(),name:l.studentName,parentName:l.parentName,parentPhone:l.phone,course:l.course,classId:b.id,enrollDate:tod(),paymentStatus:"paid",amountPaid:co?.fee||0,totalFee:co?.fee||0,note:"Auto-sync"});
        leadUpdates[l.id]=b.id;
      }
    });
    if(newStudents.length>0){
      setStudents(p=>[...p,...newStudents]);
      setLeads(p=>p.map(x=>leadUpdates[x.id]?{...x,assignedClass:leadUpdates[x.id]}:x));
    }
  },[leads,classes]);

  // LOADING / SYNC ERROR
  if(syncError)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:V.bg,fontFamily:"'Glory',sans-serif"}}><div style={{background:V.surface,border:`1px solid ${V.red}55`,borderRadius:"16px",padding:"28px 32px",maxWidth:"520px"}}><div style={{color:V.red,fontWeight:800,fontSize:"16px",marginBottom:"8px"}}>⚠ Lỗi kết nối Supabase</div><div style={{color:V.textMid,fontSize:"13px",wordBreak:"break-word"}}>{syncError}</div><div style={{color:V.textFaint,fontSize:"12px",marginTop:"12px"}}>Kiểm tra: đã chạy <code>supabase/schema.sql</code> trong SQL Editor chưa, và <code>.env.local</code> đúng URL/anon key chưa. Sau đó tải lại trang.</div></div></div>);
  if(!dataReady)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:V.bg,fontFamily:"'Glory',sans-serif"}}><div style={{textAlign:"center"}}><Logo w={140}/><div style={{color:V.textDim,fontSize:"13px",marginTop:"16px"}}>Đang tải dữ liệu từ Supabase…</div></div></div>);


  // ADD LEAD
  const AddLead=()=>{const[f,setF]=useState({parentName:"",studentName:"",phone:"",email:"",course:COURSES[0].id,source:LEAD_SRC[0],format:"offline",notes:"",referrer:"",createdAt:tod()});
  const[err,setErr]=useState("");const[dupWarn,setDupWarn]=useState(null);
  const checkDup=(ph)=>{if(!ph)return null;return leads.find(l=>l.phone===ph)};
  const doSave=()=>{
    const pn=sanitize(f.parentName),sn=sanitize(f.studentName),ph=sanitize(f.phone),em=sanitize(f.email);
    if(!pn||!sn||!ph){setErr("Vui lòng điền đầy đủ: Tên PH, Tên HV, SĐT");return}
    if(!validPhone(ph)){setErr("SĐT không hợp lệ (cần 10 số, bắt đầu bằng 0)");return}
    if(em&&!validEmail(em)){setErr("Email không hợp lệ");return}
    const dup=checkDup(ph);
    if(dup&&!dupWarn){setDupWarn(dup);return}
    const cleaned={...f,parentName:pn,studentName:sn,phone:ph,email:em,notes:sanitize(f.notes),referrer:sanitize(f.referrer)};
    setLeads(p=>[...p,{id:Date.now(),status:"new",...cleaned}]);log("Thêm lead",`${sn} (${pn}) - ${ph}`);setModal(null)};
  return(<Modal title="➕ Thêm Lead mới" onClose={()=>setModal(null)} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <Inp label="Họ tên phụ huynh *" value={f.parentName} onChange={e=>{setF({...f,parentName:e.target.value});setErr("")}} placeholder="VD: Chị Hương"/>
      <Inp label="Họ tên học viên *" value={f.studentName} onChange={e=>{setF({...f,studentName:e.target.value});setErr("")}} placeholder="Tên con"/>
      <Inp label="Số điện thoại *" value={f.phone} onChange={e=>{setF({...f,phone:e.target.value});setErr("");setDupWarn(null)}} placeholder="09xxxxxxxx"/>
      <Inp label="Email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="email@gmail.com"/>
      <Sel label="Trình độ" value={f.course} onChange={e=>setF({...f,course:e.target.value})}>{COURSE_LEVELS.map(lv=><optgroup key={lv.id} label={`${lv.icon} ${lv.name}`}>{COURSES.filter(c=>c.level===lv.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</Sel>
      <Sel label="Nguồn *" value={f.source} onChange={e=>setF({...f,source:e.target.value})}>{LEAD_SRC.map(s=><option key={s} value={s}>{s}</option>)}</Sel>
      <Sel label="Hình thức học" value={f.format} onChange={e=>setF({...f,format:e.target.value})}>{LEARN_FORMAT.map(lf=><option key={lf.id} value={lf.id}>{lf.label}</option>)}</Sel>
      <Inp label="Ngày nhập lead" type="date" value={f.createdAt} onChange={e=>setF({...f,createdAt:e.target.value})}/>
      <Inp label="Người giới thiệu" value={f.referrer} onChange={e=>setF({...f,referrer:e.target.value})} placeholder="Nếu có"/>
    </div>
    <Inp label="Ghi chú" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/>
    {err&&<div style={{background:V.redDim,border:`1px solid ${V.red}33`,borderRadius:"8px",padding:"10px 14px",marginBottom:"14px",color:V.red,fontSize:"13px",fontWeight:600}}>⚠ {err}</div>}
    {dupWarn&&<div style={{background:V.amberDim,border:`1px solid ${V.amber}33`,borderRadius:"8px",padding:"10px 14px",marginBottom:"14px",color:V.amber,fontSize:"13px"}}><strong>⚠ SĐT đã tồn tại!</strong><div style={{marginTop:"4px"}}>PH: {dupWarn.parentName} · HV: {dupWarn.studentName} · Trạng thái: {LEAD_ST.find(s=>s.id===dupWarn.status)?.label}</div><div style={{marginTop:"8px",display:"flex",gap:"8px"}}><Btn small variant="danger" onClick={()=>{setDupWarn(null);setLeads(p=>[...p,{id:Date.now(),status:"new",createdAt:tod(),...f}]);setModal(null)}}>Vẫn thêm</Btn><Btn small variant="ghost" onClick={()=>setDupWarn(null)}>Hủy</Btn></div></div>}
    {!dupWarn&&<Btn onClick={doSave} style={{width:"100%"}}>💾 Lưu Lead</Btn>}
  </Modal>)};

  // EDIT LEAD (Admin + Sales — chỉ sửa tên PH/HV + SĐT/email)
  const EditLead=({lead})=>{const[ef,setEf]=useState({parentName:lead.parentName,studentName:lead.studentName,phone:lead.phone,email:lead.email||""});const[eerr,setEerr]=useState("");
  const doSave=()=>{
    const pn=sanitize(ef.parentName),sn=sanitize(ef.studentName),ph=sanitize(ef.phone),em=sanitize(ef.email);
    if(!pn||!sn||!ph){setEerr("Vui lòng điền đầy đủ: Tên PH, Tên HV, SĐT");return}
    if(!validPhone(ph)){setEerr("SĐT không hợp lệ (cần 10 số, bắt đầu bằng 0)");return}
    if(em&&!validEmail(em)){setEerr("Email không hợp lệ");return}
    const dup=leads.find(l=>l.phone===ph&&l.id!==lead.id);
    if(dup){setEerr(`SĐT đã tồn tại ở lead khác (${dup.parentName} - ${dup.studentName})`);return}
    setLeads(p=>p.map(x=>x.id===lead.id?{...x,parentName:pn,studentName:sn,phone:ph,email:em}:x));
    log("Sửa lead",`${lead.studentName} → ${sn}`);
    setModal(null)};
  return(<Modal title={`✏️ Sửa thông tin — ${lead.studentName}`} onClose={()=>setModal(null)}>
    <Inp label="Họ tên phụ huynh *" value={ef.parentName} onChange={e=>{setEf({...ef,parentName:e.target.value});setEerr("")}}/>
    <Inp label="Họ tên học viên *" value={ef.studentName} onChange={e=>{setEf({...ef,studentName:e.target.value});setEerr("")}}/>
    <Inp label="Số điện thoại *" value={ef.phone} onChange={e=>{setEf({...ef,phone:e.target.value});setEerr("")}}/>
    <Inp label="Email" value={ef.email} onChange={e=>{setEf({...ef,email:e.target.value});setEerr("")}}/>
    {eerr&&<div style={{background:V.redDim,border:`1px solid ${V.red}33`,borderRadius:"8px",padding:"10px 14px",marginBottom:"14px",color:V.red,fontSize:"13px",fontWeight:600}}>⚠ {eerr}</div>}
    <Btn onClick={doSave} style={{width:"100%"}}>💾 Lưu thay đổi</Btn>
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
  </Modal>);function vfy(){if(hash(pw)===adminPw){setPv(true);setPe("")}else setPe("Sai mật khẩu")}};

  // ADD CLASS
  const AddCls=({editClass})=>{const existingStudentCount=editClass?students.filter(s=>s.classId===editClass.id).length:0;
  const initSchedule=editClass?.schedule?.length?editClass.schedule.map(s=>{const[ts,te]=(s.time||"09:00-11:00").split("-");return{day:s.day,timeStart:ts,timeEnd:te}}):[{day:"T7",timeStart:"09:00",timeEnd:"11:00"}];
  const initF=editClass?{level:COURSES.find(c=>c.id===editClass.course)?.level||COURSE_LEVELS[0].id,course:editClass.course,name:editClass.name,instructor:editClass.instructor,maxStudents:editClass.maxStudents,startDate:editClass.startDate,format:editClass.format||"offline"}:{level:COURSE_LEVELS[0].id,course:COURSES.find(c=>c.level===COURSE_LEVELS[0].id).id,name:"",instructor:INST[0].name,maxStudents:8,startDate:tod(),format:"offline"};
  const[f,setF]=useState(initF);const[sched,setSched]=useState(initSchedule);const[err,setErr]=useState("");
  const co=COURSES.find(c=>c.id===f.course);const lvl=COURSE_LEVELS.find(l=>l.id===f.level);
  const coursesInLevel=COURSES.filter(c=>c.level===f.level);
  const autoName=()=>{const existing=classes.filter(c=>c.course===f.course&&c.id!==editClass?.id);const letter=String.fromCharCode(65+existing.length);return`${co?.name} - Lớp ${letter}`};
  const updateSched=(i,field,val)=>setSched(p=>p.map((s,idx)=>idx===i?{...s,[field]:val}:s));
  const addSchedRow=()=>setSched(p=>[...p,{day:"T2",timeStart:"09:00",timeEnd:"11:00"}]);
  const removeSchedRow=(i)=>setSched(p=>p.filter((_,idx)=>idx!==i));
  const doSubmit=()=>{
    if(f.maxStudents<existingStudentCount){setErr(`Sĩ số tối đa không thể nhỏ hơn ${existingStudentCount} (số HV hiện có trong lớp)`);return}
    if(sched.length===0){setErr("Cần ít nhất 1 buổi học");return}
    const nm=f.name||autoName();
    const scheduleData=sched.map(s=>({day:s.day,time:`${s.timeStart}-${s.timeEnd}`}));
    if(editClass){setClasses(p=>p.map(c=>c.id===editClass.id?{...c,name:nm,course:f.course,instructor:f.instructor,schedule:scheduleData,maxStudents:f.maxStudents,startDate:f.startDate,format:f.format}:c));log("Sửa lớp",nm)}
    else{const id=`CLS-${Date.now()}`;setClasses(p=>[...p,{id,name:nm,course:f.course,instructor:f.instructor,schedule:scheduleData,maxStudents:f.maxStudents,startDate:f.startDate,format:f.format,status:"upcoming"}]);log("Tạo lớp",nm)}
    setModal(null)};
  return(<Modal title={editClass?`✏️ Sửa lớp — ${editClass.name}`:"📚 Tạo lớp học mới"} onClose={()=>setModal(null)} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <Sel label="Level" value={f.level} onChange={e=>{const newLevel=e.target.value;const firstCourse=COURSES.find(c=>c.level===newLevel);setF({...f,level:newLevel,course:firstCourse.id,name:""})}}>{COURSE_LEVELS.map(lv=><option key={lv.id} value={lv.id}>{lv.icon} {lv.name}</option>)}</Sel>
      <Sel label="Khóa" value={f.course} onChange={e=>setF({...f,course:e.target.value,name:""})}>{coursesInLevel.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel>
      <Inp label="Sĩ số lớp tối đa" type="number" value={f.maxStudents} onChange={e=>{setF({...f,maxStudents:Number(e.target.value)});setErr("")}}/>
      <Inp label="Tên lớp" value={f.name||autoName()} onChange={e=>setF({...f,name:e.target.value})}/>
      <Sel label="Giáo viên" value={f.instructor} onChange={e=>setF({...f,instructor:e.target.value})}>{INST.map(i=><option key={i.id} value={i.name}>{i.name} - {i.role}</option>)}</Sel>
      <Inp label="Ngày khai giảng" type="date" value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/>
      <Sel label="Hình thức học" value={f.format} onChange={e=>setF({...f,format:e.target.value})}>{LEARN_FORMAT.map(lf=><option key={lf.id} value={lf.id}>{lf.label}</option>)}</Sel>
    </div>
    <div style={{marginBottom:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
        <label style={{color:V.textDim,fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>Thời gian học ({sched.length} buổi/tuần)</label>
        <Btn small variant="secondary" onClick={addSchedRow}><Ic.Plus/> Thêm buổi</Btn>
      </div>
      {sched.map((s,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:"8px",marginBottom:"8px",alignItems:"end"}}>
          <Sel label={i===0?"Ngày":""} value={s.day} onChange={e=>updateSched(i,"day",e.target.value)} style={{marginBottom:0}}><option value="T2">Thứ 2</option><option value="T3">Thứ 3</option><option value="T4">Thứ 4</option><option value="T5">Thứ 5</option><option value="T6">Thứ 6</option><option value="T7">Thứ 7</option><option value="CN">Chủ nhật</option></Sel>
          <Inp label={i===0?"Giờ bắt đầu":""} type="time" value={s.timeStart} onChange={e=>updateSched(i,"timeStart",e.target.value)} style={{marginBottom:0}}/>
          <Inp label={i===0?"Giờ kết thúc":""} type="time" value={s.timeEnd} onChange={e=>updateSched(i,"timeEnd",e.target.value)} style={{marginBottom:0}}/>
          {sched.length>1&&<Btn small variant="danger" onClick={()=>removeSchedRow(i)}><Ic.Trash/></Btn>}
        </div>
      ))}
    </div>
    {editClass&&existingStudentCount>0&&<div style={{background:V.amberDim,borderRadius:"8px",padding:"10px 14px",marginBottom:"14px",color:V.amber,fontSize:"12px"}}>⚠ Lớp đang có {existingStudentCount} học viên — sĩ số tối đa không thể thấp hơn số này.</div>}
    {err&&<div style={{background:V.redDim,border:`1px solid ${V.red}33`,borderRadius:"8px",padding:"10px 14px",marginBottom:"14px",color:V.red,fontSize:"13px",fontWeight:600}}>⚠ {err}</div>}
    <div style={{background:V.accentDim,borderRadius:"10px",padding:"14px 16px",marginBottom:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{f.name||autoName()}</div><div style={{color:V.textDim,fontSize:"12px",marginTop:"2px"}}>{co?.name} · {sched.map(s=>`${s.day} ${s.timeStart}-${s.timeEnd}`).join(", ")} · GV: {f.instructor} · Tối đa {f.maxStudents} HV</div></div>
      <div style={{display:"flex",flexDirection:"column",gap:"4px",alignItems:"flex-end"}}><Badge color={lvl?.color}>{lvl?.icon} {lvl?.name}</Badge><Badge color={LEARN_FORMAT.find(lf=>lf.id===f.format)?.color}>{LEARN_FORMAT.find(lf=>lf.id===f.format)?.label}</Badge></div>
    </div>
    <Btn onClick={doSubmit} style={{width:"100%"}}>{editClass?"💾 Lưu thay đổi":"✅ Tạo lớp"}</Btn>
  </Modal>)};

  // ATTENDANCE
  // VIEW CLASS STUDENTS
  const ViewClassStudents=({classId})=>{const c=classes.find(x=>x.id===classId);const co=COURSES.find(x=>x.id===c?.course);const cst=students.filter(s=>s.classId===classId);const sc=cst.length;const ft=getFillTag(sc,c?.maxStudents||1);
  const attRecs=attendance.filter(a=>a.classId===classId).sort((a,b)=>b.date.localeCompare(a.date));
  const attStatusLabel={present:"✅ Có mặt",absent:"❌ Vắng",late:"⏰ Trễ"};
  return(<Modal title={`👥 Học viên — ${c?.name}`} onClose={()=>setModal(null)} wide>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:ft.bg,borderRadius:"10px",padding:"12px 16px",marginBottom:"16px"}}>
      <div><div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{co?.name}</div><div style={{color:V.textDim,fontSize:"12px",marginTop:"2px"}}>{c?.schedule.map(s=>`${s.day} ${s.time}`).join(", ")} · GV: {c?.instructor}</div></div>
      <div style={{textAlign:"right"}}><div style={{color:ft.color,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>{ft.label} {sc}/{c?.maxStudents}</div></div>
    </div>
    <h4 style={{color:V.accent,fontSize:"13px",fontWeight:700,margin:"0 0 10px"}}>Danh sách học viên</h4>
    {cst.length===0?<div style={{textAlign:"center",padding:"24px",color:V.textFaint}}>Chưa có học viên nào trong lớp này</div>:
    <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>{cst.map((st,i)=><div key={st.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",background:V.surface2,borderRadius:"8px"}}><span style={{color:V.textFaint,fontSize:"12px",width:"20px"}}>{i+1}</span><div><div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{st.name}</div><div style={{color:V.textDim,fontSize:"12px"}}>PH: {st.parentName}</div></div></div>)}</div>}
    {attRecs.length>0&&<>
      <h4 style={{color:V.accent,fontSize:"13px",fontWeight:700,margin:"0 0 10px"}}>Lịch sử điểm danh</h4>
      <div style={{display:"flex",flexDirection:"column",gap:"6px",maxHeight:"200px",overflow:"auto"}}>{attRecs.map(a=>{const stu=students.find(s=>s.id===a.studentId);return<div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:V.bg,borderRadius:"6px"}}><div style={{display:"flex",gap:"10px",alignItems:"center"}}><span style={{color:V.textFaint,fontSize:"12px"}}>{fmtD(a.date)}</span><span style={{color:V.text,fontSize:"13px",fontWeight:600}}>{stu?.name||"—"}</span><span style={{fontSize:"12px"}}>{attStatusLabel[a.status]}</span></div>{user.role==="admin"&&<Btn small variant="ghost" onClick={()=>{setAttendance(p=>p.filter(x=>x.id!==a.id));log("Xóa điểm danh",`${stu?.name} - ${fmtD(a.date)}`)}} style={{color:V.red,padding:"2px 8px"}}><Ic.Trash/></Btn>}</div>})}</div>
    </>}
  </Modal>)};

  // ATTENDANCE
  const Attend=()=>{const ac=classes.filter(c=>c.status==="active");const[sc,setSc]=useState(ac[0]?.id||"");const[dt,setDt]=useState(tod());const cs=students.filter(s=>s.classId===sc);const[mk,setMk]=useState({});
  return(<Modal title="📋 Điểm danh" onClose={()=>setModal(null)} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}><Sel label="Lớp" value={sc} onChange={e=>{setSc(e.target.value);setMk({})}}>{ac.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel><Inp label="Ngày" type="date" value={dt} onChange={e=>setDt(e.target.value)}/></div>
    {!cs.length&&<div style={{color:V.textFaint,textAlign:"center",padding:"20px"}}>Chưa có học viên</div>}
    {cs.map(st=><div key={st.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${V.border}`}}><div><div style={{color:V.text,fontSize:"14px",fontWeight:600}}>{st.name}</div><div style={{color:V.textFaint,fontSize:"12px"}}>{st.parentName}</div></div><div style={{display:"flex",gap:"6px"}}>{[{id:"present",l:"✅",c:V.mint},{id:"absent",l:"❌",c:V.red},{id:"late",l:"⏰",c:V.amber}].map(s=><button key={s.id} onClick={()=>setMk({...mk,[st.id]:s.id})} style={{width:"36px",height:"36px",borderRadius:"8px",border:`2px solid ${mk[st.id]===s.id?s.c:V.border}`,background:mk[st.id]===s.id?`${s.c}20`:V.bg,cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>{s.l}</button>)}</div></div>)}
    {cs.length>0&&<Btn onClick={()=>{setAttendance(p=>[...p,...cs.filter(st=>mk[st.id]).map(st=>({id:Date.now()+st.id,classId:sc,studentId:st.id,date:dt,status:mk[st.id],note:""}))]);setModal(null)}} style={{width:"100%",marginTop:"16px"}}>💾 Lưu điểm danh</Btn>}
  </Modal>)};

  // CHANGE PASSWORD (own account)
  const ChangePw=({onClose})=>{const[p1,setP1]=useState("");const[p2,setP2]=useState("");const[msg,setMsg]=useState(null);const[busy,setBusy]=useState(false);
  const doChange=async()=>{if(p1.length<6){setMsg({e:"Mật khẩu tối thiểu 6 ký tự"});return}if(p1!==p2){setMsg({e:"Hai mật khẩu không khớp"});return}setBusy(true);const{error}=await sb.auth.updateUser({password:p1});setBusy(false);if(error)setMsg({e:error.message});else{setMsg({ok:"Đã đổi mật khẩu"});log("Đổi mật khẩu","");setTimeout(onClose,900)}};
  return(<Modal title="🔑 Đổi mật khẩu của tôi" onClose={onClose}>
    <div style={{color:V.textDim,fontSize:"13px",marginBottom:"14px"}}>{user.email}</div>
    <Inp label="Mật khẩu mới" type="password" value={p1} onChange={e=>{setP1(e.target.value);setMsg(null)}}/>
    <Inp label="Nhập lại mật khẩu mới" type="password" value={p2} onChange={e=>{setP2(e.target.value);setMsg(null)}} onKeyDown={e=>e.key==="Enter"&&doChange()}/>
    {msg?.e&&<div style={{color:V.red,fontSize:"13px",marginBottom:"12px"}}>⚠ {msg.e}</div>}{msg?.ok&&<div style={{color:V.mint,fontSize:"13px",marginBottom:"12px"}}>✅ {msg.ok}</div>}
    <Btn onClick={doChange} disabled={busy} style={{width:"100%"}}>{busy?"Đang lưu…":"💾 Lưu"}</Btn>
  </Modal>)};

  // DASHBOARD
  const Dash=()=>(<div>
    <div style={{marginBottom:"24px"}}><h2 style={{color:V.text,margin:"0 0 4px",fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>Dashboard <span style={{color:"#EF4136"}}>V</span><span style={{color:V.accent}}>forge</span></h2><p style={{color:V.textFaint,margin:0,fontSize:"13px"}}>{new Date().toLocaleDateString("vi-VN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"14px",marginBottom:"24px"}}><Stat label="Đã thu" value={fmt(totRev)} icon="💰" color={V.mint} sub={`Chờ thu: ${fmt(pendRev)}`}/><Stat label="Học viên" value={students.length} icon="🎓" color={V.accent} sub={`${classes.filter(c=>c.status==="active").length} lớp hoạt động`}/><Stat label="Lead xử lý" value={actLeads} icon="📞" color={V.amber} sub={`Chuyển đổi: ${convR}%`}/><Stat label="Tổng Lead" value={leads.length} icon="📊" color={V.purple} sub={`${leads.filter(l=>l.status==="paid").length} đã đóng HP`}/></div>
    <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px",marginBottom:"20px"}}><h3 style={{color:V.accent,margin:"0 0 16px",fontSize:"14px",fontWeight:700}}>🔄 Sales Pipeline</h3><div style={{display:"flex",gap:"8px",overflowX:"auto"}}>{LEAD_ST.map(s=><div key={s.id} style={{flex:1,minWidth:"90px",textAlign:"center",padding:"14px 10px",background:s.bg,borderRadius:"10px"}}><div style={{color:s.color,fontSize:"28px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>{lbySt[s.id]?.length||0}</div><div style={{color:V.textDim,fontSize:"11px",fontWeight:600,marginTop:"4px"}}>{s.label}</div></div>)}</div></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"16px"}}>
      <div style={{flex:1,minWidth:"300px",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px"}}><h3 style={{color:V.accent,margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>📞 Lead gần đây</h3>{leads.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5).map(l=>{const st=LEAD_ST.find(s=>s.id===l.status);const co=COURSES.find(c=>c.id===l.course);return<div key={l.id} style={{padding:"10px 0",borderBottom:`1px solid ${V.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{color:V.text,fontSize:"13px",fontWeight:600}}>{l.studentName} <span style={{color:V.textFaint,fontWeight:400}}>({l.parentName})</span></div><div style={{color:V.textFaint,fontSize:"11px",marginTop:"2px"}}>{co?.name} · {l.source}</div></div><Badge color={st?.color} bg={st?.bg}>{st?.label}</Badge></div>})}</div>
      <div style={{flex:1,minWidth:"300px",background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"20px"}}><h3 style={{color:V.accent,margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>📅 Lớp học</h3>{classes.filter(c=>["active","upcoming"].includes(c.status)).map(c=>{const co=COURSES.find(x=>x.id===c.course);const cs2=CLASS_ST.find(s=>s.id===c.status);const sc2=clsSC(c.id);const ft=getFillTag(sc2,c.maxStudents);return<div key={c.id} style={{padding:"10px 0",borderBottom:`1px solid ${V.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:"8px"}}><span>{ft.label}</span><div><div style={{color:V.text,fontSize:"13px",fontWeight:600}}>{c.name}</div><div style={{color:V.textFaint,fontSize:"11px",marginTop:"2px"}}>{c.schedule.map(s=>`${s.day} ${s.time}`).join(", ")} · {c.instructor}</div></div></div><div style={{textAlign:"right"}}><div style={{color:ft.color,fontSize:"13px",fontWeight:700}}>{sc2}/{c.maxStudents}</div><Badge color={cs2?.color}>{cs2?.label}</Badge></div></div>})}</div>
    </div>
  </div>);

  // SALES TABLE
  const SalesP=()=>{const fl=leads.filter(l=>leadF==="all"||l.status===leadF).filter(l=>!search||[l.studentName,l.parentName,l.phone,l.email].some(x=>(x||"").toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}><h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>📞 Quản lý <span style={{color:V.accent}}>Sales</span></h2><div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>{user.role==="admin"&&<>
      <Btn small variant="secondary" onClick={()=>{const ids=leads.filter(l=>SAMPLE_LEADS.has(stable(l))).map(l=>l.id);setSelL(new Set(ids));if(!ids.length)alert("Không còn lead mẫu (chưa sửa) nào.")}}>🧪 Chọn lead mẫu</Btn>
      <Btn small variant="secondary" onClick={()=>setSelL(selL.size===fl.length?new Set():new Set(fl.map(l=>l.id)))}>{selL.size===fl.length&&fl.length?"Bỏ chọn":"Chọn tất cả đang hiện"}</Btn>
      {selL.size>0&&<Btn small variant="danger" onClick={()=>{if(!confirm(`Xoá ${selL.size} lead đã chọn? Không thể hoàn tác.`))return;setLeads(p=>p.filter(l=>!selL.has(l.id)));log("Xoá hàng loạt lead",`${selL.size} lead`);setSelL(new Set())}}>🗑 Xoá {selL.size} đã chọn</Btn>}
    </>}<Btn onClick={()=>setModal("add_lead")}><Ic.Plus/> Thêm Lead</Btn></div></div>
    <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center"}}><div style={{position:"relative",flex:1,minWidth:"200px"}}><div style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:V.textFaint}}><Ic.Search/></div><input placeholder="Tìm lead..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"9px 14px 9px 36px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"13px",outline:"none",boxSizing:"border-box"}}/></div><div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}><Btn small variant={leadF==="all"?"primary":"ghost"} onClick={()=>setLeadF("all")}>Tất cả ({leads.length})</Btn>{LEAD_ST.map(s=><Btn key={s.id} small variant={leadF===s.id?"primary":"ghost"} onClick={()=>setLeadF(s.id)}>{s.label} ({lbySt[s.id]?.length||0})</Btn>)}</div></div>
    <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:"1420px"}}><thead><tr>{user.role==="admin"&&<TH></TH>}<TH>Phụ huynh</TH><TH>Học viên</TH><TH>SĐT</TH><TH>Email</TH><TH>Trạng thái</TH><TH>Nguồn</TH><TH>Hình thức</TH><TH>Trình độ</TH><TH>Xếp lớp</TH><TH>Lý do chưa chốt</TH><TH>Ghi chú</TH><TH>Người GT</TH>{(user.role==="admin"||user.role==="sales")&&<TH></TH>}</tr></thead>
    <tbody>{fl.map(l=>{const st=LEAD_ST.find(s=>s.id===l.status);const co=COURSES.find(c=>c.id===l.course);const isPaid=l.status==="paid"||l.status==="renew";const ac=classes.filter(c=>c.course===l.course&&["upcoming","active"].includes(c.status));const bc=bestCls(l.course);return<tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background=V.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"} style={{background:selL.has(l.id)?V.redDim:"transparent"}}>
      {user.role==="admin"&&<TD style={{width:"28px"}}><input type="checkbox" checked={selL.has(l.id)} onChange={()=>setSelL(p=>{const n=new Set(p);n.has(l.id)?n.delete(l.id):n.add(l.id);return n})} style={{cursor:"pointer",width:"16px",height:"16px"}}/></TD>}
      <TD style={{color:V.text,fontWeight:600}}>{l.parentName}</TD><TD style={{color:V.text,fontWeight:600}}>{l.studentName}</TD><TD>{l.phone}</TD><TD style={{fontSize:"12px"}}>{l.email||"—"}</TD>
      <TD><select value={l.status} onChange={e=>{const ns=e.target.value;setLeads(p=>p.map(x=>x.id===l.id?{...x,status:ns}:x));if(ns==="paid"){const b=bestCls(l.course);if(b&&!students.find(s=>s.name===l.studentName&&s.course===l.course)){setStudents(p=>[...p,{id:Date.now(),name:l.studentName,parentName:l.parentName,parentPhone:l.phone,course:l.course,classId:b.id,enrollDate:tod(),paymentStatus:"paid",amountPaid:co?.fee||0,totalFee:co?.fee||0,note:"Auto-assign"}]);setLeads(p=>p.map(x=>x.id===l.id?{...x,assignedClass:b.id}:x))}}}} style={{padding:"4px 8px",background:st?.bg,border:`1px solid ${st?.color}44`,borderRadius:"6px",color:st?.color,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{LEAD_ST.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></TD>
      <TD><select value={l.source} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,source:e.target.value}:x))} style={{padding:"4px 8px",background:V.surface2,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.textMid,fontSize:"11px",fontWeight:600,outline:"none",cursor:"pointer"}}>{LEAD_SRC.map(s=><option key={s} value={s}>{s}</option>)}</select></TD>
      <TD><select value={l.format||"offline"} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,format:e.target.value}:x))} style={{padding:"4px 8px",background:`${LEARN_FORMAT.find(f=>f.id===(l.format||"offline"))?.color}18`,border:`1px solid ${LEARN_FORMAT.find(f=>f.id===(l.format||"offline"))?.color}44`,borderRadius:"6px",color:LEARN_FORMAT.find(f=>f.id===(l.format||"offline"))?.color,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{LEARN_FORMAT.map(lf=><option key={lf.id} value={lf.id}>{lf.label}</option>)}</select></TD>
      <TD><select value={l.course} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,course:e.target.value}:x))} style={{padding:"4px 8px",background:`${gCC(co)}18`,border:`1px solid ${gCC(co)}44`,borderRadius:"6px",color:gCC(co),fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{COURSE_LEVELS.map(lv=><optgroup key={lv.id} label={`${lv.icon} ${lv.name}`}>{COURSES.filter(c=>c.level===lv.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</select></TD>
      <TD>{isPaid?(()=>{const stu=students.find(s=>s.name===l.studentName&&s.course===l.course);const assignedCls=classes.find(c=>c.id===(stu?.classId||l.assignedClass));if(user.role==="admin"){return ac.length>0?<select value={stu?.classId||bc?.id||""} onChange={e=>{const cid=e.target.value;setLeads(p=>p.map(x=>x.id===l.id?{...x,assignedClass:cid}:x));if(!stu){setStudents(p=>[...p,{id:Date.now(),name:l.studentName,parentName:l.parentName,parentPhone:l.phone,course:l.course,classId:cid,enrollDate:tod(),paymentStatus:"paid",amountPaid:co?.fee||0,totalFee:co?.fee||0,note:""}])}else{setStudents(p=>p.map(s=>s.id===stu.id?{...s,classId:cid}:s))}log("Đổi lớp (Admin)",`${l.studentName} → ${classes.find(c=>c.id===cid)?.name}`)}} style={{padding:"4px 8px",background:V.mintDim,border:`1px solid ${V.mint}44`,borderRadius:"6px",color:V.mint,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{ac.map(c=><option key={c.id} value={c.id}>{c.name} ({clsSC(c.id)}/{c.maxStudents})</option>)}</select>:<span style={{color:V.amber,fontSize:"11px",fontWeight:600}}>⚠ Chưa có lớp phù hợp</span>}
      return assignedCls?<Badge color={V.mint} bg={V.mintDim}>{assignedCls.name}</Badge>:(ac.length>0?<span style={{color:V.textFaint,fontSize:"11px"}}>Đang xử lý...</span>:<span style={{color:V.amber,fontSize:"11px",fontWeight:600}}>⚠ Chưa có lớp phù hợp</span>)})():<span style={{color:V.textGhost,fontSize:"11px"}}>Cần đóng HP</span>}</TD>
      <TD>{!isPaid&&l.status!=="renew"?<div style={{display:"flex",flexDirection:"column",gap:"4px"}}><select value={l.lostReason||""} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,lostReason:e.target.value}:x))} style={{padding:"4px 8px",background:V.surface2,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.textMid,fontSize:"11px",outline:"none",cursor:"pointer"}}><option value="">-- Chọn --</option>{LOST_REASONS.map(r=><option key={r} value={r}>{r}</option>)}</select>{l.lostReason==="Khác"&&<input value={l.lostNote||""} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,lostNote:e.target.value}:x))} placeholder="Ghi chú..." style={{padding:"4px 8px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.text,fontSize:"11px",outline:"none",width:"100%",boxSizing:"border-box"}}/>}</div>:<span style={{color:V.textGhost,fontSize:"11px"}}>—</span>}</TD>
      <TD style={{maxWidth:"130px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:"12px",color:V.textDim,cursor:l.notes?"help":"default"}} title={l.notes||""}>{l.notes||"—"}</TD>
      <TD style={{color:l.referrer?V.accent:V.textGhost,fontWeight:l.referrer?600:400,fontSize:"12px"}}>{l.referrer||"—"}</TD>
      {user.role==="admin"&&<TD><div style={{display:"flex",gap:"4px"}}><Btn small variant="secondary" onClick={()=>setModal({type:"edit_lead",lead:l})}>✏️</Btn><Btn small variant="danger" onClick={()=>{if(confirm(`Xóa lead "${l.studentName}"?`)){setLeads(p=>p.filter(x=>x.id!==l.id));log("Xóa lead",`${l.studentName} (${l.parentName})`)}}}><Ic.Trash/></Btn></div></TD>}
      {user.role==="sales"&&<TD><Btn small variant="secondary" onClick={()=>setModal({type:"edit_lead",lead:l})}>✏️ Sửa</Btn></TD>}
    </tr>})}</tbody></table></div>{!fl.length&&<div style={{textAlign:"center",padding:"40px",color:V.textFaint}}>Không tìm thấy lead</div>}</div>
  </div>)};

  // CLASSES (editable status)
  const ClassP=()=>(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}><h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>📚 Quản lý <span style={{color:V.accent}}>Lớp học</span></h2><div style={{display:"flex",gap:"8px"}}><Btn variant="secondary" onClick={()=>setModal("attendance")}><Ic.Check/> Điểm danh</Btn>{(user.role==="admin")&&<Btn onClick={()=>setModal("add_class")}><Ic.Plus/> Tạo lớp</Btn>}</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:"14px",marginBottom:"28px"}}>{classes.map(c=>{const co=COURSES.find(x=>x.id===c.course);const sc=clsSC(c.id);const cs2=CLASS_ST.find(s=>s.id===c.status);const cst=students.filter(s=>s.classId===c.id);const ft=getFillTag(sc,c.maxStudents);
    return<div key={c.id} style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",overflow:"hidden",cursor:"pointer"}} onClick={()=>setModal({type:"view_class",classId:c.id})}><div style={{padding:"4px 0",background:`linear-gradient(90deg,${gCC(co)}44,transparent)`}}/><div style={{padding:"18px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}><span title={`${ft.tag==="green"?"Xanh ≥80%":ft.tag==="yellow"?"Vàng 50-79%":"Đỏ <50%"}`} style={{fontSize:"14px"}}>{ft.label}</span><div><div style={{color:V.text,fontWeight:700,fontSize:"15px"}}>{c.name}</div><div style={{color:V.textFaint,fontSize:"12px",marginTop:"2px",display:"flex",alignItems:"center",gap:"6px"}}>{co?.name}<Badge color={LEARN_FORMAT.find(lf=>lf.id===(c.format||"offline"))?.color}>{LEARN_FORMAT.find(lf=>lf.id===(c.format||"offline"))?.label}</Badge></div></div></div>
      {(user.role==="admin"||user.role==="reception")?<select onClick={e=>e.stopPropagation()} value={c.status} onChange={e=>{setClasses(p=>p.map(x=>x.id===c.id?{...x,status:e.target.value}:x));log("Đổi trạng thái lớp",`${c.name} → ${CLASS_ST.find(s=>s.id===e.target.value)?.label}`)}} style={{padding:"4px 8px",background:`${cs2?.color}18`,border:`1px solid ${cs2?.color}44`,borderRadius:"6px",color:cs2?.color,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{CLASS_ST.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select>:<Badge color={cs2?.color}>{cs2?.label}</Badge>}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
        <div><div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700}}>Lịch học</div><div style={{color:V.textMid,fontSize:"13px",fontWeight:600,marginTop:"2px"}}>{c.schedule.map(s=>`${s.day} ${s.time}`).join(", ")}</div></div>
        <div><div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700}}>Giảng viên</div><div style={{color:V.textMid,fontSize:"13px",fontWeight:600,marginTop:"2px"}}>{c.instructor}</div></div>
        <div><div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700}}>Sĩ số</div><div style={{color:ft.color,fontSize:"18px",fontWeight:800,fontFamily:"'Glory',sans-serif",marginTop:"2px"}}>{sc}<span style={{color:V.textFaint,fontSize:"13px",fontWeight:400}}>/{c.maxStudents}</span></div></div>
        <div><div style={{color:V.textGhost,fontSize:"10px",textTransform:"uppercase",fontWeight:700}}>Khai giảng</div><div style={{color:V.textMid,fontSize:"13px",fontWeight:600,marginTop:"2px"}}>{fmtD(c.startDate)}</div></div>
      </div>
      <div style={{borderTop:`1px solid ${V.border}`,paddingTop:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:V.accent,fontSize:"12px",fontWeight:600}}>👁 Xem {sc} học viên</span>
        {user.role==="admin"&&<div style={{display:"flex",gap:"6px"}}><Btn small variant="secondary" onClick={e=>{e.stopPropagation();setModal({type:"edit_class",classData:c})}}>✏️ Sửa</Btn>{cst.length===0&&<Btn small variant="danger" onClick={e=>{e.stopPropagation();if(confirm(`Xóa lớp "${c.name}"?`)){setClasses(p=>p.filter(x=>x.id!==c.id));log("Xóa lớp",c.name)}}}><Ic.Trash/></Btn>}</div>}
      </div>
    </div></div>})}</div>
    <h3 style={{color:V.accent,fontSize:"15px",fontWeight:700,marginBottom:"14px"}}>👨‍🏫 Giảng viên</h3>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"12px"}}>{INST.map(i=><div key={i.id} style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"12px",padding:"16px 20px"}}><div style={{color:V.text,fontWeight:700,fontSize:"15px"}}>{i.name}</div><div style={{color:V.textFaint,fontSize:"12px",marginTop:"2px"}}>{i.role}</div><div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"10px"}}>{i.courses.map(cId=>{const co=COURSES.find(c=>c.id===cId);return<Badge key={cId} color={gCC(co)}>{co?.name}</Badge>})}</div><div style={{marginTop:"10px",color:V.textDim,fontSize:"12px"}}>{classes.filter(c=>c.instructor===i.name).length} lớp · {i.phone}</div></div>)}</div>
  </div>);

  // STUDENTS
  const StuP=()=>(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}><h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>🎓 <span style={{color:V.accent}}>Học viên</span></h2><div style={{position:"relative"}}><div style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",color:V.textFaint}}><Ic.Search/></div><input placeholder="Tìm..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"8px 12px 8px 32px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"13px",outline:"none",width:"180px",boxSizing:"border-box"}}/></div></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"14px",marginBottom:"24px"}}><Stat label="Đã thu" value={fmt(totRev)} icon="✅" color={V.mint}/><Stat label="Chờ thu" value={fmt(pendRev)} icon="⏳" color={V.amber}/><Stat label="Tổng HV" value={students.length} icon="🎓" color={V.accent}/></div>
    <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:"800px"}}><thead><tr><TH>Học viên</TH><TH>Phụ huynh</TH><TH>Khóa học</TH><TH>Lớp</TH><TH>Học phí</TH><TH>Đã TT</TH><TH>Trạng thái</TH><TH>Ngày ĐK</TH>{user.role==="admin"&&<TH></TH>}</tr></thead>
    <tbody>{students.filter(s=>!search||s.name.toLowerCase().includes(search.toLowerCase())||s.parentName.toLowerCase().includes(search.toLowerCase())).map(st=>{const co=COURSES.find(c=>c.id===st.course);const ps=PAY_ST.find(p=>p.id===st.paymentStatus);const cl=classes.find(c=>c.id===st.classId);
    return<tr key={st.id} onMouseEnter={e=>e.currentTarget.style.background=V.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD style={{color:V.text,fontWeight:600}}>{st.name}</TD><TD><div>{st.parentName}</div><div style={{color:V.textFaint,fontSize:"11px"}}>{st.parentPhone}</div></TD><TD><Badge color={gCC(co)}>{co?.name}</Badge></TD><TD>{cl?.name||"—"}</TD><TD style={{color:V.accent,fontWeight:700,fontFamily:"monospace"}}>{fmt(st.totalFee)}</TD><TD style={{color:V.mint,fontWeight:700,fontFamily:"monospace"}}>{fmt(st.amountPaid)}</TD><TD><Badge color={ps?.color}>{ps?.label}</Badge></TD><TD style={{color:V.textFaint,fontSize:"12px"}}>{fmtD(st.enrollDate)}</TD>{user.role==="admin"&&<TD><Btn small variant="danger" onClick={()=>{if(confirm(`Xóa học viên "${st.name}"? Hành động này không thể hoàn tác.`)){setStudents(p=>p.filter(x=>x.id!==st.id));log("Xóa học viên",`${st.name} (${st.parentName})`)}}}><Ic.Trash/></Btn></TD>}</tr>})}</tbody></table></div></div>
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
  const SetP=()=>{const[np,setNp]=useState("");const[sv,setSv]=useState(false);
  return(<div><h2 style={{color:V.text,margin:"0 0 24px",fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>⚙️ <span style={{color:V.accent}}>Cài đặt</span></h2>
    <div style={{maxWidth:"600px"}}>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px",marginBottom:"20px"}}><h3 style={{color:V.text,margin:"0 0 16px",fontSize:"15px",fontWeight:700}}>🔐 Mật khẩu chuyển lớp</h3><p style={{color:V.textDim,fontSize:"13px",marginBottom:"16px"}}>Dùng khi Sales muốn chuyển HV sang lớp khác thay vì lớp tự động.</p><Inp label="Mật khẩu mới" type="password" value={np} onChange={e=>{setNp(e.target.value);setSv(false)}} placeholder="Nhập mật khẩu mới (6+ ký tự)"/><Btn onClick={()=>{if(np.length<6){alert("Mật khẩu tối thiểu 6 ký tự!");return}setAdminPw(hash(np));log("Đổi MK chuyển lớp","");setSv(true)}}>{sv?"✅ Đã lưu":"💾 Lưu"}</Btn></div>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}><h3 style={{color:V.text,margin:0,fontSize:"15px",fontWeight:700}}>👥 Tài khoản hệ thống</h3><a href={`https://supabase.com/dashboard/project/${PROJECT_REF}/auth/users`} target="_blank" rel="noreferrer" style={{fontSize:"12px",color:V.accent,fontWeight:600}}>+ Tạo / xoá / reset MK trên Supabase ↗</a></div>
        <p style={{color:V.textDim,fontSize:"12px",marginBottom:"14px"}}>Tạo tài khoản mới trong Supabase (Authentication → Users → Add user, tick "Auto Confirm"). Tài khoản mới mặc định vai trò <b>Sales</b> — đổi vai trò và tên hiển thị tại đây.</p>
        {profiles.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${V.border}`,gap:"12px",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:`${ROLE_CFG[a.role]?.color}18`,display:"flex",alignItems:"center",justifyContent:"center",color:ROLE_CFG[a.role]?.color,fontWeight:700,fontSize:"14px"}}>{(a.name||"?").charAt(0)}</div>
            <div><input value={a.name||""} onChange={e=>setProfiles(p=>p.map(x=>x.id===a.id?{...x,name:e.target.value}:x))} onBlur={()=>log("Đổi tên TK",a.email)} style={{color:V.text,fontSize:"14px",fontWeight:600,border:"none",borderBottom:`1px dashed ${V.border2}`,background:"transparent",outline:"none",width:"180px"}}/><div style={{color:V.textFaint,fontSize:"12px"}}>{a.email}</div></div>
          </div>
          <select value={a.role} disabled={a.id===user.id} onChange={e=>{setProfiles(p=>p.map(x=>x.id===a.id?{...x,role:e.target.value}:x));log("Đổi vai trò",`${a.email} → ${ROLE_CFG[e.target.value]?.label}`)}} style={{padding:"6px 10px",borderRadius:"6px",border:`1px solid ${V.border}`,background:V.bg,color:ROLE_CFG[a.role]?.color,fontWeight:700,fontSize:"12px"}}><option value="admin">Admin</option><option value="sales">Sales</option><option value="reception">Lễ tân</option></select>
        </div>)}
      </div>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px",marginTop:"20px"}}>
        <h3 style={{color:V.text,margin:"0 0 16px",fontSize:"15px",fontWeight:700}}>🔄 Dữ liệu</h3>
        <p style={{color:V.textDim,fontSize:"13px",marginBottom:"8px"}}>Xoá các dòng <b>dữ liệu mẫu chưa từng sửa</b> (lead, học viên, lớp, điểm danh). Dòng bạn đã sửa hoặc tự nhập được giữ nguyên.</p>
        <Btn variant="danger" onClick={()=>{
          const dl=leads.filter(l=>SAMPLE_LEADS.has(stable(l))),ds=students.filter(x=>SAMPLE_STUDENTS.has(stable(x))),da=attendance.filter(x=>SAMPLE_ATTENDANCE.has(stable(x)));
          const keepS=students.filter(x=>!ds.includes(x)),keepL=leads.filter(x=>!dl.includes(x));
          const refd=new Set(keepS.map(x=>x.classId).concat(keepL.map(x=>x.assignedClass)).filter(Boolean));
          const dc=classes.filter(c=>SAMPLE_CLASSES.has(stable(c))&&!refd.has(c.id));
          if(!dl.length&&!ds.length&&!dc.length&&!da.length){alert("Không còn dữ liệu mẫu chưa sửa.");return}
          if(!confirm(`Xoá dữ liệu mẫu: ${dl.length} lead, ${ds.length} học viên, ${dc.length} lớp, ${da.length} điểm danh?`))return;
          setLeads(keepL);setStudents(keepS);setAttendance(p=>p.filter(x=>!da.includes(x)));setClasses(p=>p.filter(c=>!dc.includes(c)));
          log("Xoá dữ liệu mẫu",`${dl.length} lead, ${ds.length} HV, ${dc.length} lớp, ${da.length} điểm danh`)}} style={{marginBottom:"20px"}}>🧹 Xoá dữ liệu mẫu chưa sửa</Btn>
        <p style={{color:V.textDim,fontSize:"13px",marginBottom:"8px"}}>Khôi phục từ bản lưu cũ trong trình duyệt này (localStorage). Chỉ thêm các dòng chưa có trên Supabase; các dòng mẫu chưa từng sửa sẽ bị bỏ qua.</p>
        <Btn variant="secondary" onClick={()=>{
          const pick=(key,cur,sample)=>{const loc=load(key,null);if(!Array.isArray(loc))return[];const have=new Set(cur.map(r=>r.id));return loc.filter(r=>!have.has(r.id)&&!sample.has(stable(r)))};
          const nl=pick("leads",leads,SAMPLE_LEADS),ns=pick("students",students,SAMPLE_STUDENTS),na=pick("attendance",attendance,SAMPLE_ATTENDANCE);
          const allCls=load("classes",null)||[];const haveC=new Set(classes.map(c=>c.id));
          const refd=new Set([...students,...ns].map(x=>x.classId).concat([...leads,...nl].map(x=>x.assignedClass)).filter(Boolean));
          const nc=allCls.filter(c=>!haveC.has(c.id)&&(refd.has(c.id)||!SAMPLE_CLASSES.has(stable(c))));
          if(!nl.length&&!ns.length&&!nc.length&&!na.length){alert("Không có gì để khôi phục (trình duyệt này không có bản lưu cũ, hoặc đã có đủ trên Supabase).");return}
          if(!confirm(`Khôi phục: ${nl.length} lead, ${ns.length} học viên, ${nc.length} lớp, ${na.length} điểm danh?`))return;
          if(nc.length)setClasses(p=>[...p,...nc]);if(ns.length)setStudents(p=>[...p,...ns]);if(nl.length)setLeads(p=>[...p,...nl]);if(na.length)setAttendance(p=>[...p,...na]);
          log("Khôi phục từ localStorage",`${nl.length} lead, ${ns.length} HV, ${nc.length} lớp, ${na.length} điểm danh`);alert("Đã khôi phục. Kiểm tra lại các tab.")}} style={{marginBottom:"20px"}}>♻️ Khôi phục từ bản lưu trình duyệt</Btn>
        <p style={{color:V.red,fontSize:"13px",marginBottom:"12px",fontWeight:600}}>⚠ Xóa sạch toàn bộ — không còn lead, học viên, lớp học nào. Chỉ giữ lại tài khoản đăng nhập.</p>
        <Btn variant="danger" onClick={()=>{if(confirm("XÓA SẠCH toàn bộ dữ liệu thật (lead, học viên, lớp, điểm danh)? Hành động KHÔNG thể hoàn tác!")){if(confirm("Xác nhận lần 2: bạn chắc chắn muốn xóa sạch?")){setLeads([]);setStudents([]);setClasses([]);setAttendance([]);setAuditLog([]);log("Xóa sạch toàn bộ dữ liệu","")}}}}>🗑 Xóa sạch dữ liệu</Btn>
      </div>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px",marginTop:"20px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}><h3 style={{color:V.text,margin:0,fontSize:"15px",fontWeight:700}}>📋 Nhật ký hoạt động</h3><span style={{color:V.textFaint,fontSize:"12px"}}>{auditLog.length} bản ghi</span></div>
        <div style={{maxHeight:"300px",overflow:"auto"}}>{auditLog.slice(0,50).map(e=><div key={e.id} style={{padding:"8px 0",borderBottom:`1px solid ${V.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{color:V.text,fontSize:"13px",fontWeight:600}}>{e.action}</span>{e.detail&&<span style={{color:V.textDim,fontSize:"12px",marginLeft:"8px"}}>{e.detail}</span>}</div><div style={{textAlign:"right"}}><div style={{color:V.textFaint,fontSize:"11px"}}>{e.user} <Badge color={ROLE_CFG[e.role]?.color||V.textDim}>{ROLE_CFG[e.role]?.label||e.role}</Badge></div><div style={{color:V.textGhost,fontSize:"10px"}}>{new Date(e.time).toLocaleString("vi-VN")}</div></div></div>)}{auditLog.length===0&&<div style={{color:V.textFaint,textAlign:"center",padding:"20px"}}>Chưa có hoạt động</div>}</div>
      </div>
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
      <div style={{display:"flex",gap:"8px",alignItems:"center"}}><div style={{textAlign:"right",marginRight:"8px"}}><div style={{color:V.text,fontSize:"13px",fontWeight:600}}>{user.name}</div><Badge color={ROLE_CFG[user.role]?.color}>{ROLE_CFG[user.role]?.label}</Badge></div>{can("sales")&&<Btn small onClick={()=>setModal("add_lead")}><Ic.Plus/> Lead</Btn>}<Btn small variant="ghost" onClick={()=>setModal("change_pw")} title="Đổi mật khẩu"><Ic.Lock/></Btn><Btn small variant="ghost" onClick={()=>{log("Đăng xuất","");onLogout()}}><Ic.Logout/></Btn></div>
    </div></div>
    <div style={{maxWidth:"1200px",margin:"0 auto",padding:"24px"}}>{can(tab)?pg[tab]:<div style={{textAlign:"center",padding:"60px",color:V.textFaint}}>Không có quyền truy cập</div>}</div>
    {modal==="change_pw"&&<ChangePw onClose={()=>setModal(null)}/>}{modal==="add_lead"&&<AddLead/>}{modal?.type==="edit_lead"&&<EditLead lead={modal.lead}/>}{modal?.type==="enroll"&&<Enroll lead={modal.lead}/>}{modal==="attendance"&&<Attend/>}{modal==="add_class"&&<AddCls/>}{modal?.type==="edit_class"&&<AddCls editClass={modal.classData}/>}{modal?.type==="view_class"&&<ViewClassStudents classId={modal.classId}/>}
  </div>);
}

// ====== AUTH GATE (Supabase Auth) ======
const Center=({children})=>(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:V.bg,fontFamily:"'Glory',sans-serif"}}>{children}</div>);

function Login({onDone}){
  const[u,setU]=useState("");const[p,setP]=useState("");const[e,setE]=useState("");const[busy,setBusy]=useState(false);
  const doLogin=async()=>{if(!u||!p){setE("Nhập email và mật khẩu");return}setBusy(true);setE("");const{error}=await sb.auth.signInWithPassword({email:u.trim(),password:p});setBusy(false);if(error)setE(/invalid/i.test(error.message)?"Sai email hoặc mật khẩu":error.message);else onDone?.()};
  return(<Center><div style={{background:V.surface,borderRadius:"20px",padding:"40px",width:"100%",maxWidth:"400px",boxShadow:"0 20px 60px rgba(0,0,0,0.08)",border:`1px solid ${V.border}`}}>
    <div style={{textAlign:"center",marginBottom:"32px"}}><Logo w={140}/><div style={{color:V.textFaint,fontSize:"11px",letterSpacing:"3px",marginTop:"8px"}}>EDUCATION CRM</div></div>
    <Inp label="Email" type="email" value={u} onChange={ev=>{setU(ev.target.value);setE("")}} placeholder="ten@vforge.edu.vn" onKeyDown={ev=>ev.key==="Enter"&&doLogin()}/>
    <Inp label="Mật khẩu" type="password" value={p} onChange={ev=>{setP(ev.target.value);setE("")}} placeholder="••••••" onKeyDown={ev=>ev.key==="Enter"&&doLogin()}/>
    {e&&<div style={{color:V.red,fontSize:"13px",marginBottom:"12px",textAlign:"center"}}>{e}</div>}
    <Btn onClick={doLogin} disabled={busy} style={{width:"100%",padding:"12px",fontSize:"15px"}}>{busy?"Đang đăng nhập…":"Đăng nhập"}</Btn>
    <div style={{marginTop:"16px",fontSize:"12px",color:V.textFaint,textAlign:"center"}}>Quên mật khẩu? Liên hệ Admin để đặt lại.</div>
  </div></Center>);
}

export default function VforgeApp(){
  const[session,setSession]=useState(undefined); // undefined = đang kiểm tra
  const[user,setUser]=useState(null);
  const[err,setErr]=useState(null);

  useEffect(()=>{
    if(!hasSupabase)return;
    sb.auth.getSession().then(({data})=>setSession(data.session??null));
    const{data:sub}=sb.auth.onAuthStateChange((_e,s)=>setSession(s??null));
    return()=>sub.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session){setUser(null);return}
    let alive=true;
    (async()=>{
      const{data,error}=await sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle();
      if(!alive)return;
      if(error){setErr(error.message);return}
      if(!data){setErr("Tài khoản chưa có profile. Hãy chạy supabase/auth.sql rồi đăng nhập lại.");return}
      setUser({id:data.id,email:data.email||session.user.email,name:data.name||session.user.email,role:data.role});
      const entry={id:Date.now(),user_name:data.name||session.user.email,role:data.role,action:"Đăng nhập",detail:"",time:now()};
      sb.from("audit_log").insert(entry).then(()=>{});
    })();
    return()=>{alive=false};
  },[session?.user?.id]);

  const logout=()=>{sb.auth.signOut();setUser(null)};

  if(!hasSupabase)return(<Center><div style={{background:V.surface,border:`1px solid ${V.red}55`,borderRadius:"16px",padding:"28px 32px",maxWidth:"520px",color:V.textMid,fontSize:"13px"}}><div style={{color:V.red,fontWeight:800,fontSize:"16px",marginBottom:"8px"}}>⚠ Chưa cấu hình Supabase</div>Tạo file <code>.env.local</code> với <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code> (xem <code>.env.example</code>) rồi chạy lại.</div></Center>);
  if(err)return(<Center><div style={{background:V.surface,border:`1px solid ${V.red}55`,borderRadius:"16px",padding:"28px 32px",maxWidth:"520px"}}><div style={{color:V.red,fontWeight:800,fontSize:"16px",marginBottom:"8px"}}>⚠ Lỗi đăng nhập</div><div style={{color:V.textMid,fontSize:"13px"}}>{err}</div><Btn small variant="secondary" onClick={()=>{setErr(null);logout()}} style={{marginTop:"14px"}}>Đăng xuất</Btn></div></Center>);
  if(session===undefined)return(<Center><div style={{textAlign:"center"}}><Logo w={140}/><div style={{color:V.textDim,fontSize:"13px",marginTop:"16px"}}>Đang kiểm tra phiên đăng nhập…</div></div></Center>);
  if(!session)return<Login/>;
  if(!user)return(<Center><div style={{textAlign:"center"}}><Logo w={140}/><div style={{color:V.textDim,fontSize:"13px",marginTop:"16px"}}>Đang tải thông tin tài khoản…</div></div></Center>);
  return<Crm key={user.id} user={user} onLogout={logout}/>;
}
