import { useState, useMemo, useEffect, useRef, useCallback } from "react";

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

const ACCOUNTS=[{id:1,username:"admin",password:hash("Vforge@2026"),name:"Quan",role:"admin"},{id:2,username:"sales",password:hash("Sales@2026"),name:"Thu Trang",role:"sales"},{id:3,username:"reception",password:hash("Letan@2026"),name:"Minh Anh",role:"reception"}];
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
const LEAD_ST=[{id:"new",label:"Mới",color:V.accent,bg:V.accentDim},{id:"unreachable",label:"Chưa liên hệ được",color:V.amber,bg:V.amberDim},{id:"testing",label:"Làm test đầu vào",color:V.blue,bg:V.blueDim},{id:"enrolled",label:"Đã đăng ký",color:V.purple,bg:V.purpleDim},{id:"paid",label:"Đóng học phí",color:V.mint,bg:V.mintDim},{id:"negotiating",label:"Đang thương lượng",color:V.cyan,bg:V.cyanDim},{id:"renew",label:"ĐK khóa tiếp",color:V.vred,bg:V.vredDim}];
const CLASS_ST=[{id:"upcoming",label:"Sắp diễn ra",color:V.amber},{id:"active",label:"Đang diễn ra",color:V.mint},{id:"paused",label:"Tạm dừng",color:V.purple},{id:"completed",label:"Đã kết thúc",color:V.textDim},{id:"cancelled",label:"Đã hủy",color:V.red}];
const PAY_ST=[{id:"pending",label:"Chờ TT",color:V.amber},{id:"partial",label:"Đặt cọc",color:V.cyan},{id:"paid",label:"Đã TT",color:V.mint},{id:"overdue",label:"Quá hạn",color:V.red}];

const I_LEADS=[
  {id:1,parentName:"Chị Thu",studentName:"Gia Hân",phone:"0904332181",email:"giahan0@gmail.com",course:"start_1",source:"Facebook Ads",format:"offline",status:"unreachable",notes:"",referrer:"",createdAt:"2026-07-05"},
  {id:2,parentName:"Chị Thu",studentName:"Anh Thư",phone:"0986379402",email:"anhthư1@yahoo.com",course:"up_3",source:"Zalo",format:"offline",status:"renew",notes:"",referrer:"",createdAt:"2026-04-28",assignedClass:"CU-03"},
  {id:3,parentName:"Anh Khoa",studentName:"Bảo An",phone:"0959407816",email:"",course:"up_3",source:"Khác",format:"online",status:"paid",notes:"",referrer:"",createdAt:"2026-07-31",assignedClass:"CU-03"},
  {id:4,parentName:"Chị Huyền",studentName:"Hoàng Sơn",phone:"0913164752",email:"hoàngsơn3@gmail.com",course:"proplus_2",source:"Giới thiệu",format:"offline",status:"paid",notes:"",referrer:"Đức Anh",createdAt:"2026-03-16",assignedClass:"PP-02"},
  {id:5,parentName:"Chị Nga",studentName:"Kim Ngân",phone:"0983503056",email:"kimngan4@gmail.com",course:"proplus_1",source:"Walk-in",format:"online",status:"unreachable",notes:"Chuyển từ trung tâm khác",referrer:"",createdAt:"2026-06-08"},
  {id:6,parentName:"Chị Thảo",studentName:"Đức Anh",phone:"0988496965",email:"",course:"up_1",source:"Event/Workshop",format:"online",status:"new",notes:"Đang cân nhắc",referrer:"",createdAt:"2026-02-13",lostReason:"Khác",lostNote:"Chưa rõ lý do cụ thể"},
  {id:7,parentName:"Anh Đức",studentName:"Bảo Châu",phone:"0916697848",email:"bảochau6@gmail.com",course:"proplus_2",source:"Walk-in",format:"offline",status:"paid",notes:"Hỏi giảm học phí",referrer:"",createdAt:"2026-06-18",assignedClass:"PP-02"},
  {id:8,parentName:"Anh Bình",studentName:"Thùy Linh",phone:"0927048281",email:"thùylinh7@yahoo.com",course:"proplus_2",source:"Event/Workshop",format:"offline",status:"unreachable",notes:"",referrer:"",createdAt:"2026-08-15",lostReason:"Chọn nơi khác"},
  {id:9,parentName:"Anh Vũ",studentName:"Minh Đức",phone:"0995701543",email:"",course:"proplus_1",source:"Facebook Ads",format:"offline",status:"paid",notes:"",referrer:"",createdAt:"2026-08-28",assignedClass:"PP-01"},
  {id:10,parentName:"Chị Thảo",studentName:"Thảo Nguyên",phone:"0978248963",email:"thảonguyên9@outlook.com",course:"proplus_3",source:"Zalo",format:"online",status:"enrolled",notes:"Chuyển từ trung tâm khác",referrer:"",createdAt:"2026-07-22"},
  {id:11,parentName:"Chị Diệp",studentName:"Đăng Khoa",phone:"0971331509",email:"dangkhoa10@outlook.com",course:"up_2",source:"Facebook Ads",format:"offline",status:"paid",notes:"Quan tâm khóa học",referrer:"",createdAt:"2026-02-16",assignedClass:"CU-02"},
  {id:12,parentName:"Chị Mai",studentName:"Đăng Khoa",phone:"0934738299",email:"dangkhoa11@yahoo.com",course:"pro_1",source:"Zalo",format:"offline",status:"new",notes:"Đã đóng cọc",referrer:"",createdAt:"2026-05-22",lostReason:"Khác",lostNote:"Chưa rõ lý do cụ thể"},
  {id:13,parentName:"Anh Tuấn",studentName:"Thảo Nguyên",phone:"0910651333",email:"thảonguyên12@gmail.com",course:"pro_1",source:"Zalo",format:"online",status:"paid",notes:"Bạn bè giới thiệu tốt",referrer:"",createdAt:"2026-02-20",assignedClass:"CP-01"},
  {id:14,parentName:"Anh Tuấn",studentName:"Gia Huy",phone:"0980132677",email:"",course:"pro_1",source:"Facebook Ads",format:"offline",status:"enrolled",notes:"Chuyển từ trung tâm khác",referrer:"",createdAt:"2026-05-11"},
  {id:15,parentName:"Anh Bình",studentName:"Thùy Linh",phone:"0987234309",email:"thùylinh14@gmail.com",course:"proplus_3",source:"Giới thiệu",format:"offline",status:"new",notes:"Quan tâm khóa học",referrer:"Lan Anh",createdAt:"2026-06-03",lostReason:"Học phí"},
  {id:16,parentName:"Anh Quân",studentName:"Thanh Tùng",phone:"0919136193",email:"thanhtùng15@gmail.com",course:"proplus_1",source:"Facebook Ads",format:"online",status:"paid",notes:"Con thích lập trình",referrer:"",createdAt:"2026-06-25",assignedClass:"PP-01"},
  {id:17,parentName:"Anh Phong",studentName:"Anh Thư",phone:"0953462475",email:"anhthư16@gmail.com",course:"start_1",source:"Website",format:"offline",status:"new",notes:"Đang cân nhắc",referrer:"",createdAt:"2026-03-27",lostReason:"Học phí"},
  {id:18,parentName:"Chị Diệp",studentName:"Đức Anh",phone:"0954278498",email:"",course:"pro_3",source:"Giới thiệu",format:"offline",status:"renew",notes:"Bạn bè giới thiệu tốt",referrer:"",createdAt:"2026-03-07",assignedClass:"CP-03"},
  {id:19,parentName:"Chị Nga",studentName:"Hoàng Sơn",phone:"0993534874",email:"hoàngsơn18@gmail.com",course:"start_2",source:"Walk-in",format:"online",status:"negotiating",notes:"",referrer:"",createdAt:"2026-02-12",lostReason:"Khác",lostNote:"Chưa rõ lý do cụ thể"},
  {id:20,parentName:"Chị Nga",studentName:"Thanh Tùng",phone:"0978680112",email:"thanhtùng19@yahoo.com",course:"proplus_1",source:"Event/Workshop",format:"offline",status:"paid",notes:"Quan tâm khóa học",referrer:"",createdAt:"2026-02-11",assignedClass:"PP-01"},
  {id:21,parentName:"Chị Lan",studentName:"Thảo Nguyên",phone:"0931586923",email:"thảonguyên20@gmail.com",course:"pro_1",source:"Facebook Ads",format:"offline",status:"paid",notes:"Đã đóng cọc",referrer:"",createdAt:"2026-04-27",assignedClass:"CP-01"},
  {id:22,parentName:"Chị Nga",studentName:"Thanh Tùng",phone:"0916073375",email:"thanhtùng21@gmail.com",course:"up_2",source:"Facebook Ads",format:"offline",status:"enrolled",notes:"Con thích lập trình",referrer:"",createdAt:"2026-04-13"},
  {id:23,parentName:"Anh Minh",studentName:"Gia Huy",phone:"0986850142",email:"giahuy22@yahoo.com",course:"start_1",source:"Facebook Ads",format:"online",status:"enrolled",notes:"Xem quảng cáo FB",referrer:"",createdAt:"2026-08-21"},
  {id:24,parentName:"Chị Trang",studentName:"Gia Hân",phone:"0969340608",email:"giahan23@outlook.com",course:"proplus_2",source:"Walk-in",format:"offline",status:"enrolled",notes:"Hỏi giảm học phí",referrer:"",createdAt:"2026-02-18"},
  {id:25,parentName:"Anh Long",studentName:"Khánh Linh",phone:"0914846564",email:"khánhlinh24@gmail.com",course:"pro_1",source:"Walk-in",format:"online",status:"paid",notes:"Con thích lập trình",referrer:"",createdAt:"2026-03-17",assignedClass:"CP-01"},
  {id:26,parentName:"Anh Hùng",studentName:"Khôi Nguyên",phone:"0904436995",email:"khôinguyên25@yahoo.com",course:"proplus_2",source:"Zalo",format:"online",status:"negotiating",notes:"Hỏi lịch học",referrer:"",createdAt:"2026-08-23"},
  {id:27,parentName:"Anh Phong",studentName:"Gia Huy",phone:"0995134332",email:"",course:"up_2",source:"Website",format:"offline",status:"paid",notes:"Đã đóng cọc",referrer:"",createdAt:"2026-07-12",assignedClass:"CU-02"},
  {id:28,parentName:"Chị Linh",studentName:"Đức Anh",phone:"0920163287",email:"",course:"up_2",source:"Khác",format:"offline",status:"paid",notes:"Bạn bè giới thiệu tốt",referrer:"",createdAt:"2026-08-25",assignedClass:"CU-02"},
  {id:29,parentName:"Chị Huyền",studentName:"Việt Anh",phone:"0979868727",email:"việtanh28@gmail.com",course:"proplus_2",source:"Giới thiệu",format:"online",status:"paid",notes:"Con thích lập trình",referrer:"Anh Thư",createdAt:"2026-04-12",assignedClass:"PP-02"},
  {id:30,parentName:"Chị Yến",studentName:"Việt Anh",phone:"0981223623",email:"",course:"pro_1",source:"Giới thiệu",format:"online",status:"enrolled",notes:"Xem quảng cáo FB",referrer:"Gia Bảo",createdAt:"2026-03-25"},
  {id:31,parentName:"Chị Vân",studentName:"Minh Đức",phone:"0996705466",email:"minhdức30@outlook.com",course:"pro_3",source:"Khác",format:"offline",status:"paid",notes:"Quan tâm khóa học",referrer:"",createdAt:"2026-04-11",assignedClass:"CP-03"},
  {id:32,parentName:"Chị Yến",studentName:"Thảo Nguyên",phone:"0962729806",email:"thảonguyên31@outlook.com",course:"start_1",source:"Facebook Ads",format:"online",status:"new",notes:"",referrer:"",createdAt:"2026-05-30"},
  {id:33,parentName:"Chị Yến",studentName:"Phương Anh",phone:"0975564641",email:"phươnganh32@outlook.com",course:"pro_3",source:"Facebook Ads",format:"online",status:"unreachable",notes:"Quan tâm khóa học",referrer:"",createdAt:"2026-02-18",lostReason:"Xa nhà"},
  {id:34,parentName:"Chị Lan",studentName:"Khôi Nguyên",phone:"0909232719",email:"khôinguyên33@yahoo.com",course:"proplus_3",source:"Giới thiệu",format:"online",status:"unreachable",notes:"",referrer:"Anh Thư",createdAt:"2026-07-06",lostReason:"Lịch không phù hợp"},
  {id:35,parentName:"Anh Khoa",studentName:"Minh Khôi",phone:"0904966319",email:"minhkhôi34@outlook.com",course:"up_2",source:"Facebook Ads",format:"online",status:"negotiating",notes:"Xem quảng cáo FB",referrer:"",createdAt:"2026-07-04",lostReason:"Lịch không phù hợp"},
  {id:36,parentName:"Anh Hùng",studentName:"Thùy Linh",phone:"0951850671",email:"thùylinh35@yahoo.com",course:"proplus_2",source:"Khác",format:"online",status:"paid",notes:"",referrer:"",createdAt:"2026-05-23",assignedClass:"PP-02"},
  {id:37,parentName:"Anh Long",studentName:"Bình An",phone:"0987769453",email:"bìnhan36@gmail.com",course:"up_3",source:"Website",format:"offline",status:"paid",notes:"Đã đóng cọc",referrer:"",createdAt:"2026-06-26",assignedClass:"CU-03"},
  {id:38,parentName:"Chị Hương",studentName:"Hà Vy",phone:"0952735454",email:"hàvy37@outlook.com",course:"up_3",source:"Event/Workshop",format:"offline",status:"paid",notes:"",referrer:"",createdAt:"2026-03-21",assignedClass:"CU-03"},
  {id:39,parentName:"Anh Sơn",studentName:"Tuệ Anh",phone:"0937770143",email:"tuệanh38@gmail.com",course:"up_3",source:"Walk-in",format:"online",status:"paid",notes:"Bạn bè giới thiệu tốt",referrer:"",createdAt:"2026-06-16",assignedClass:"CU-03"},
  {id:40,parentName:"Anh Minh",studentName:"Anh Thư",phone:"0974443135",email:"",course:"pro_3",source:"Khác",format:"offline",status:"unreachable",notes:"Xem quảng cáo FB",referrer:"",createdAt:"2026-08-09",lostReason:"Chọn nơi khác"},
  {id:41,parentName:"Anh Long",studentName:"Hoàng Sơn",phone:"0913435240",email:"hoàngsơn40@gmail.com",course:"up_3",source:"Facebook Ads",format:"offline",status:"paid",notes:"Chuyển từ trung tâm khác",referrer:"",createdAt:"2026-07-29",assignedClass:"CU-03"},
  {id:42,parentName:"Anh Quân",studentName:"Minh Đức",phone:"0994777520",email:"minhdức41@yahoo.com",course:"start_2",source:"Khác",format:"offline",status:"enrolled",notes:"Quan tâm khóa học",referrer:"",createdAt:"2026-02-19"},
  {id:43,parentName:"Chị Thảo",studentName:"Quang Minh",phone:"0994131869",email:"quangminh42@outlook.com",course:"up_2",source:"Khác",format:"online",status:"paid",notes:"Xem quảng cáo FB",referrer:"",createdAt:"2026-05-25",assignedClass:"CU-02"},
  {id:44,parentName:"Anh Bình",studentName:"Minh Khôi",phone:"0990913341",email:"",course:"up_1",source:"Event/Workshop",format:"offline",status:"unreachable",notes:"Xem quảng cáo FB",referrer:"",createdAt:"2026-05-16",lostReason:"Học phí"},
  {id:45,parentName:"Anh Hải",studentName:"Hoàng Sơn",phone:"0947134936",email:"",course:"up_2",source:"Walk-in",format:"offline",status:"renew",notes:"",referrer:"",createdAt:"2026-03-09",assignedClass:"CU-02"},
  {id:46,parentName:"Anh Kiên",studentName:"Hoàng Sơn",phone:"0999471746",email:"hoàngsơn45@outlook.com",course:"pro_3",source:"Website",format:"online",status:"new",notes:"Hỏi giảm học phí",referrer:"",createdAt:"2026-02-11",lostReason:"Học phí"},
  {id:47,parentName:"Chị Mai",studentName:"Đức Anh",phone:"0999049027",email:"dứcanh46@yahoo.com",course:"up_3",source:"Zalo",format:"online",status:"paid",notes:"Chuyển từ trung tâm khác",referrer:"",createdAt:"2026-06-06",assignedClass:"CU-03"},
  {id:48,parentName:"Anh Đức",studentName:"Khánh Linh",phone:"0951256746",email:"khánhlinh47@outlook.com",course:"start_1",source:"Website",format:"offline",status:"enrolled",notes:"",referrer:"",createdAt:"2026-04-24"},
  {id:49,parentName:"Chị Huyền",studentName:"Gia Bảo",phone:"0980876038",email:"giabảo48@yahoo.com",course:"proplus_2",source:"Website",format:"offline",status:"unreachable",notes:"",referrer:"",createdAt:"2026-06-21"},
  {id:50,parentName:"Chị Diệp",studentName:"Anh Thư",phone:"0971093248",email:"",course:"pro_1",source:"Facebook Ads",format:"offline",status:"renew",notes:"Hỏi lịch học",referrer:"",createdAt:"2026-03-02",assignedClass:"CP-01"},
  {id:51,parentName:"Anh Sơn",studentName:"Kim Ngân",phone:"0948467737",email:"kimngan50@yahoo.com",course:"up_2",source:"Event/Workshop",format:"offline",status:"negotiating",notes:"Đã đóng cọc",referrer:"",createdAt:"2026-04-12"},
  {id:52,parentName:"Anh Kiên",studentName:"Đăng Khoa",phone:"0940449972",email:"dangkhoa51@yahoo.com",course:"up_4",source:"Giới thiệu",format:"online",status:"paid",notes:"Đã đóng cọc",referrer:"Anh Thư",createdAt:"2026-04-24",assignedClass:"CU-04"},
  {id:53,parentName:"Anh Quân",studentName:"Ngọc Ánh",phone:"0960576627",email:"ngọcánh52@gmail.com",course:"pro_3",source:"Event/Workshop",format:"online",status:"negotiating",notes:"",referrer:"",createdAt:"2026-05-24",lostReason:"Học phí"},
  {id:54,parentName:"Anh Tùng",studentName:"Quang Minh",phone:"0962174596",email:"quangminh53@yahoo.com",course:"proplus_2",source:"Khác",format:"online",status:"renew",notes:"Chuyển từ trung tâm khác",referrer:"",createdAt:"2026-07-11",assignedClass:"PP-02"},
  {id:55,parentName:"Anh Long",studentName:"Hải Đăng",phone:"0934316117",email:"",course:"up_3",source:"Facebook Ads",format:"offline",status:"enrolled",notes:"Hỏi giảm học phí",referrer:"",createdAt:"2026-02-15"},
  {id:56,parentName:"Anh Đức",studentName:"Quang Minh",phone:"0938692221",email:"quangminh55@yahoo.com",course:"proplus_1",source:"Walk-in",format:"offline",status:"paid",notes:"",referrer:"",createdAt:"2026-06-30",assignedClass:"PP-01"},
  {id:57,parentName:"Chị Thu",studentName:"Minh Anh",phone:"0974074821",email:"minhanh56@yahoo.com",course:"proplus_1",source:"Giới thiệu",format:"online",status:"paid",notes:"Chuyển từ trung tâm khác",referrer:"Phương Anh",createdAt:"2026-05-28",assignedClass:"PP-01"},
  {id:58,parentName:"Anh Hải",studentName:"Gia Bảo",phone:"0995944064",email:"",course:"proplus_2",source:"Khác",format:"offline",status:"renew",notes:"Con thích lập trình",referrer:"",createdAt:"2026-08-10",assignedClass:"PP-02"},
  {id:59,parentName:"Anh Long",studentName:"Bình An",phone:"0953394210",email:"bìnhan58@yahoo.com",course:"start_1",source:"Event/Workshop",format:"online",status:"paid",notes:"Hỏi giảm học phí",referrer:"",createdAt:"2026-02-24",assignedClass:"CS-02"},
  {id:60,parentName:"Anh Dũng",studentName:"Phương Anh",phone:"0928588424",email:"phươnganh59@yahoo.com",course:"up_3",source:"Walk-in",format:"online",status:"negotiating",notes:"Đang cân nhắc",referrer:"",createdAt:"2026-05-31",lostReason:"Xa nhà"},
  {id:61,parentName:"Anh Quân",studentName:"Thảo Nguyên",phone:"0968516048",email:"",course:"up_4",source:"Walk-in",format:"online",status:"paid",notes:"Hỏi lịch học",referrer:"",createdAt:"2026-07-14",assignedClass:"CU-04"},
  {id:62,parentName:"Anh Sơn",studentName:"Minh Đức",phone:"0998593174",email:"minhdức61@gmail.com",course:"up_1",source:"Facebook Ads",format:"offline",status:"enrolled",notes:"",referrer:"",createdAt:"2026-06-07"},
  {id:63,parentName:"Anh Hải",studentName:"Việt Anh",phone:"0982675869",email:"việtanh62@gmail.com",course:"pro_1",source:"Walk-in",format:"offline",status:"negotiating",notes:"Con thích lập trình",referrer:"",createdAt:"2026-07-08"},
  {id:64,parentName:"Anh Minh",studentName:"Phương Anh",phone:"0977351585",email:"",course:"up_3",source:"Zalo",format:"offline",status:"renew",notes:"",referrer:"",createdAt:"2026-05-28",assignedClass:"CU-03"},
  {id:65,parentName:"Chị Thu",studentName:"Gia Huy",phone:"0990053293",email:"",course:"pro_3",source:"Zalo",format:"offline",status:"negotiating",notes:"Đang cân nhắc",referrer:"",createdAt:"2026-04-01",lostReason:"Chọn nơi khác"},
  {id:66,parentName:"Chị Hương",studentName:"Minh Anh",phone:"0922842102",email:"",course:"up_2",source:"Event/Workshop",format:"online",status:"new",notes:"",referrer:"",createdAt:"2026-04-09",lostReason:"Chọn nơi khác"},
  {id:67,parentName:"Anh Khoa",studentName:"Đức Minh",phone:"0917758917",email:"dứcminh66@outlook.com",course:"start_1",source:"Walk-in",format:"online",status:"paid",notes:"",referrer:"",createdAt:"2026-02-08",assignedClass:"CS-02"},
  {id:68,parentName:"Anh Quân",studentName:"Gia Bảo",phone:"0961771159",email:"",course:"up_1",source:"Giới thiệu",format:"online",status:"enrolled",notes:"Đã đóng cọc",referrer:"Nhật Minh",createdAt:"2026-07-03"},
  {id:69,parentName:"Anh Khoa",studentName:"Bình An",phone:"0918367365",email:"bìnhan68@yahoo.com",course:"pro_1",source:"Walk-in",format:"offline",status:"enrolled",notes:"Hỏi giảm học phí",referrer:"",createdAt:"2026-04-22"},
  {id:70,parentName:"Chị Thảo",studentName:"Thảo Nguyên",phone:"0971111615",email:"thảonguyên69@outlook.com",course:"start_1",source:"Event/Workshop",format:"online",status:"paid",notes:"Đã đóng cọc",referrer:"",createdAt:"2026-05-17",assignedClass:"CS-01"},
  {id:71,parentName:"Anh Bình",studentName:"Bảo Châu",phone:"0945198327",email:"",course:"start_2",source:"Giới thiệu",format:"online",status:"new",notes:"Bạn bè giới thiệu tốt",referrer:"Bình An",createdAt:"2026-04-13",lostReason:"Chọn nơi khác"},
  {id:72,parentName:"Anh Long",studentName:"Thảo Nguyên",phone:"0980940244",email:"thảonguyên71@yahoo.com",course:"start_1",source:"Zalo",format:"offline",status:"paid",notes:"",referrer:"",createdAt:"2026-05-14",assignedClass:"CS-01"},
  {id:73,parentName:"Chị Mai",studentName:"Đức Minh",phone:"0983667525",email:"dứcminh72@yahoo.com",course:"proplus_1",source:"Event/Workshop",format:"offline",status:"negotiating",notes:"",referrer:"",createdAt:"2026-03-12",lostReason:"Khác",lostNote:"Chưa rõ lý do cụ thể"},
  {id:74,parentName:"Chị Mai",studentName:"Minh Anh",phone:"0976797643",email:"minhanh73@gmail.com",course:"up_4",source:"Website",format:"offline",status:"unreachable",notes:"Bạn bè giới thiệu tốt",referrer:"",createdAt:"2026-07-24",lostReason:"Học phí"},
  {id:75,parentName:"Anh Hải",studentName:"Gia Bảo",phone:"0990034324",email:"giabảo74@gmail.com",course:"start_1",source:"Website",format:"online",status:"unreachable",notes:"Muốn học thử trước",referrer:"",createdAt:"2026-05-09",lostReason:"Khác",lostNote:"Chưa rõ lý do cụ thể"},
  {id:76,parentName:"Anh Kiên",studentName:"Bảo An",phone:"0916060715",email:"bảoan75@outlook.com",course:"pro_1",source:"Walk-in",format:"online",status:"unreachable",notes:"",referrer:"",createdAt:"2026-05-15"},
  {id:77,parentName:"Anh Kiên",studentName:"Bảo Châu",phone:"0975161369",email:"bảochau76@gmail.com",course:"pro_1",source:"Khác",format:"online",status:"paid",notes:"Đang cân nhắc",referrer:"",createdAt:"2026-03-29",assignedClass:"CP-01"},
  {id:78,parentName:"Chị Trang",studentName:"Gia Huy",phone:"0918835523",email:"",course:"up_3",source:"Zalo",format:"offline",status:"paid",notes:"Hỏi lịch học",referrer:"",createdAt:"2026-08-14",assignedClass:"CU-03"},
  {id:79,parentName:"Chị Huyền",studentName:"Gia Huy",phone:"0977997995",email:"giahuy78@outlook.com",course:"up_4",source:"Zalo",format:"online",status:"new",notes:"Con thích lập trình",referrer:"",createdAt:"2026-05-25",lostReason:"Lịch không phù hợp"},
  {id:80,parentName:"Chị Trang",studentName:"Hải Đăng",phone:"0947700541",email:"hảidang79@gmail.com",course:"proplus_1",source:"Event/Workshop",format:"online",status:"paid",notes:"Quan tâm khóa học",referrer:"",createdAt:"2026-06-22",assignedClass:"PP-01"},
  {id:81,parentName:"Anh Vũ",studentName:"Bình An",phone:"0993597820",email:"bìnhan80@yahoo.com",course:"proplus_3",source:"Facebook Ads",format:"offline",status:"new",notes:"Chuyển từ trung tâm khác",referrer:"",createdAt:"2026-08-01",lostReason:"Chọn nơi khác"},
  {id:82,parentName:"Anh Dũng",studentName:"Bảo An",phone:"0954665905",email:"",course:"start_2",source:"Event/Workshop",format:"online",status:"unreachable",notes:"Xem quảng cáo FB",referrer:"",createdAt:"2026-08-05",lostReason:"Lịch không phù hợp"},
  {id:83,parentName:"Chị Mai",studentName:"Minh Khôi",phone:"0925462914",email:"minhkhôi82@outlook.com",course:"up_4",source:"Khác",format:"offline",status:"paid",notes:"Bạn bè giới thiệu tốt",referrer:"",createdAt:"2026-08-09",assignedClass:"CU-04"},
  {id:84,parentName:"Chị Thu",studentName:"Thảo Nguyên",phone:"0968505423",email:"thảonguyên83@yahoo.com",course:"up_2",source:"Zalo",format:"offline",status:"unreachable",notes:"Hỏi lịch học",referrer:"",createdAt:"2026-04-17",lostReason:"Chọn nơi khác"},
  {id:85,parentName:"Chị Xuân",studentName:"Đức Minh",phone:"0980592962",email:"",course:"proplus_3",source:"Khác",format:"offline",status:"paid",notes:"Muốn học thử trước",referrer:"",createdAt:"2026-02-12",assignedClass:"PP-03"}
];
const I_STU=[
  {id:1,name:"Anh Thư",parentName:"Chị Thu",parentPhone:"0986379402",course:"up_3",classId:"CU-03",enrollDate:"2026-04-28",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:2,name:"Bảo An",parentName:"Anh Khoa",parentPhone:"0959407816",course:"up_3",classId:"CU-03",enrollDate:"2026-07-31",paymentStatus:"partial",amountPaid:1000000,totalFee:2400000,note:""},
  {id:3,name:"Hoàng Sơn",parentName:"Chị Huyền",parentPhone:"0913164752",course:"proplus_2",classId:"PP-02",enrollDate:"2026-03-16",paymentStatus:"paid",amountPaid:3800000,totalFee:3800000,note:""},
  {id:4,name:"Bảo Châu",parentName:"Anh Đức",parentPhone:"0916697848",course:"proplus_2",classId:"PP-02",enrollDate:"2026-06-18",paymentStatus:"paid",amountPaid:3800000,totalFee:3800000,note:""},
  {id:5,name:"Minh Đức",parentName:"Anh Vũ",parentPhone:"0995701543",course:"proplus_1",classId:"PP-01",enrollDate:"2026-08-28",paymentStatus:"pending",amountPaid:0,totalFee:3800000,note:""},
  {id:6,name:"Đăng Khoa",parentName:"Chị Diệp",parentPhone:"0971331509",course:"up_2",classId:"CU-02",enrollDate:"2026-02-16",paymentStatus:"partial",amountPaid:500000,totalFee:2400000,note:""},
  {id:7,name:"Thảo Nguyên",parentName:"Anh Tuấn",parentPhone:"0910651333",course:"pro_1",classId:"CP-01",enrollDate:"2026-02-20",paymentStatus:"paid",amountPaid:3200000,totalFee:3200000,note:""},
  {id:8,name:"Thanh Tùng",parentName:"Anh Quân",parentPhone:"0919136193",course:"proplus_1",classId:"PP-01",enrollDate:"2026-06-25",paymentStatus:"pending",amountPaid:0,totalFee:3800000,note:""},
  {id:9,name:"Đức Anh",parentName:"Chị Diệp",parentPhone:"0954278498",course:"pro_3",classId:"CP-03",enrollDate:"2026-03-07",paymentStatus:"pending",amountPaid:0,totalFee:3200000,note:""},
  {id:10,name:"Thanh Tùng",parentName:"Chị Nga",parentPhone:"0978680112",course:"proplus_1",classId:"PP-01",enrollDate:"2026-02-11",paymentStatus:"paid",amountPaid:3800000,totalFee:3800000,note:""},
  {id:11,name:"Thảo Nguyên",parentName:"Chị Lan",parentPhone:"0931586923",course:"pro_1",classId:"CP-01",enrollDate:"2026-04-27",paymentStatus:"paid",amountPaid:3200000,totalFee:3200000,note:""},
  {id:12,name:"Khánh Linh",parentName:"Anh Long",parentPhone:"0914846564",course:"pro_1",classId:"CP-01",enrollDate:"2026-03-17",paymentStatus:"paid",amountPaid:3200000,totalFee:3200000,note:""},
  {id:13,name:"Gia Huy",parentName:"Anh Phong",parentPhone:"0995134332",course:"up_2",classId:"CU-02",enrollDate:"2026-07-12",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:14,name:"Đức Anh",parentName:"Chị Linh",parentPhone:"0920163287",course:"up_2",classId:"CU-02",enrollDate:"2026-08-25",paymentStatus:"pending",amountPaid:0,totalFee:2400000,note:""},
  {id:15,name:"Việt Anh",parentName:"Chị Huyền",parentPhone:"0979868727",course:"proplus_2",classId:"PP-02",enrollDate:"2026-04-12",paymentStatus:"partial",amountPaid:1500000,totalFee:3800000,note:""},
  {id:16,name:"Minh Đức",parentName:"Chị Vân",parentPhone:"0996705466",course:"pro_3",classId:"CP-03",enrollDate:"2026-04-11",paymentStatus:"paid",amountPaid:3200000,totalFee:3200000,note:""},
  {id:17,name:"Thùy Linh",parentName:"Anh Hùng",parentPhone:"0951850671",course:"proplus_2",classId:"PP-02",enrollDate:"2026-05-23",paymentStatus:"paid",amountPaid:3800000,totalFee:3800000,note:""},
  {id:18,name:"Bình An",parentName:"Anh Long",parentPhone:"0987769453",course:"up_3",classId:"CU-03",enrollDate:"2026-06-26",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:19,name:"Hà Vy",parentName:"Chị Hương",parentPhone:"0952735454",course:"up_3",classId:"CU-03",enrollDate:"2026-03-21",paymentStatus:"partial",amountPaid:1500000,totalFee:2400000,note:""},
  {id:20,name:"Tuệ Anh",parentName:"Anh Sơn",parentPhone:"0937770143",course:"up_3",classId:"CU-03",enrollDate:"2026-06-16",paymentStatus:"pending",amountPaid:0,totalFee:2400000,note:""},
  {id:21,name:"Hoàng Sơn",parentName:"Anh Long",parentPhone:"0913435240",course:"up_3",classId:"CU-03",enrollDate:"2026-07-29",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:22,name:"Quang Minh",parentName:"Chị Thảo",parentPhone:"0994131869",course:"up_2",classId:"CU-02",enrollDate:"2026-05-25",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:23,name:"Hoàng Sơn",parentName:"Anh Hải",parentPhone:"0947134936",course:"up_2",classId:"CU-02",enrollDate:"2026-03-09",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:24,name:"Đức Anh",parentName:"Chị Mai",parentPhone:"0999049027",course:"up_3",classId:"CU-03",enrollDate:"2026-06-06",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:25,name:"Anh Thư",parentName:"Chị Diệp",parentPhone:"0971093248",course:"pro_1",classId:"CP-01",enrollDate:"2026-03-02",paymentStatus:"paid",amountPaid:3200000,totalFee:3200000,note:""},
  {id:26,name:"Đăng Khoa",parentName:"Anh Kiên",parentPhone:"0940449972",course:"up_4",classId:"CU-04",enrollDate:"2026-04-24",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:27,name:"Quang Minh",parentName:"Anh Tùng",parentPhone:"0962174596",course:"proplus_2",classId:"PP-02",enrollDate:"2026-07-11",paymentStatus:"paid",amountPaid:3800000,totalFee:3800000,note:""},
  {id:28,name:"Quang Minh",parentName:"Anh Đức",parentPhone:"0938692221",course:"proplus_1",classId:"PP-01",enrollDate:"2026-06-30",paymentStatus:"partial",amountPaid:500000,totalFee:3800000,note:""},
  {id:29,name:"Minh Anh",parentName:"Chị Thu",parentPhone:"0974074821",course:"proplus_1",classId:"PP-01",enrollDate:"2026-05-28",paymentStatus:"pending",amountPaid:0,totalFee:3800000,note:""},
  {id:30,name:"Gia Bảo",parentName:"Anh Hải",parentPhone:"0995944064",course:"proplus_2",classId:"PP-02",enrollDate:"2026-08-10",paymentStatus:"paid",amountPaid:3800000,totalFee:3800000,note:""},
  {id:31,name:"Bình An",parentName:"Anh Long",parentPhone:"0953394210",course:"start_1",classId:"CS-02",enrollDate:"2026-02-24",paymentStatus:"paid",amountPaid:1800000,totalFee:1800000,note:""},
  {id:32,name:"Thảo Nguyên",parentName:"Anh Quân",parentPhone:"0968516048",course:"up_4",classId:"CU-04",enrollDate:"2026-07-14",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:33,name:"Phương Anh",parentName:"Anh Minh",parentPhone:"0977351585",course:"up_3",classId:"CU-03",enrollDate:"2026-05-28",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:34,name:"Đức Minh",parentName:"Anh Khoa",parentPhone:"0917758917",course:"start_1",classId:"CS-02",enrollDate:"2026-02-08",paymentStatus:"paid",amountPaid:1800000,totalFee:1800000,note:""},
  {id:35,name:"Thảo Nguyên",parentName:"Chị Thảo",parentPhone:"0971111615",course:"start_1",classId:"CS-01",enrollDate:"2026-05-17",paymentStatus:"paid",amountPaid:1800000,totalFee:1800000,note:""},
  {id:36,name:"Thảo Nguyên",parentName:"Anh Long",parentPhone:"0980940244",course:"start_1",classId:"CS-01",enrollDate:"2026-05-14",paymentStatus:"paid",amountPaid:1800000,totalFee:1800000,note:""},
  {id:37,name:"Bảo Châu",parentName:"Anh Kiên",parentPhone:"0975161369",course:"pro_1",classId:"CP-01",enrollDate:"2026-03-29",paymentStatus:"pending",amountPaid:0,totalFee:3200000,note:""},
  {id:38,name:"Gia Huy",parentName:"Chị Trang",parentPhone:"0918835523",course:"up_3",classId:"CU-03",enrollDate:"2026-08-14",paymentStatus:"paid",amountPaid:2400000,totalFee:2400000,note:""},
  {id:39,name:"Hải Đăng",parentName:"Chị Trang",parentPhone:"0947700541",course:"proplus_1",classId:"PP-01",enrollDate:"2026-06-22",paymentStatus:"paid",amountPaid:3800000,totalFee:3800000,note:""},
  {id:40,name:"Minh Khôi",parentName:"Chị Mai",parentPhone:"0925462914",course:"up_4",classId:"CU-04",enrollDate:"2026-08-09",paymentStatus:"pending",amountPaid:0,totalFee:2400000,note:""},
  {id:41,name:"Đức Minh",parentName:"Chị Xuân",parentPhone:"0980592962",course:"proplus_3",classId:"PP-03",enrollDate:"2026-02-12",paymentStatus:"partial",amountPaid:1500000,totalFee:3800000,note:""}
];
const I_CLS=[
  {id:"CS-01",name:"Code Start 1 - Lớp A",course:"start_1",instructor:"Vân Anh",schedule:[{day:"CN",time:"09:00-11:00"}],maxStudents:10,startDate:"2026-05-10",status:"active"},
  {id:"CS-02",name:"Code Start 1 - Lớp B",course:"start_1",instructor:"Vân Anh",schedule:[{day:"T7",time:"09:00-11:00"}],maxStudents:10,startDate:"2026-08-24",status:"upcoming"},
  {id:"CS-03",name:"Code Start 2 - Lớp A",course:"start_2",instructor:"Vân Anh",schedule:[{day:"CN",time:"14:00-16:00"}],maxStudents:10,startDate:"2026-08-18",status:"upcoming"},
  {id:"CU-01",name:"Code Up 1 - Lớp A",course:"up_1",instructor:"Thuận",schedule:[{day:"T7",time:"09:00-11:00"}],maxStudents:8,startDate:"2026-03-07",status:"active"},
  {id:"CU-02",name:"Code Up 2 - Lớp A",course:"up_2",instructor:"Thuận",schedule:[{day:"T7",time:"14:00-16:00"}],maxStudents:8,startDate:"2026-08-24",status:"upcoming"},
  {id:"CU-03",name:"Code Up 3 - Lớp A",course:"up_3",instructor:"Thuận",schedule:[{day:"CN",time:"09:00-11:00"}],maxStudents:8,startDate:"2026-04-05",status:"active"},
  {id:"CU-04",name:"Code Up 4 - Lớp A",course:"up_4",instructor:"Thuận",schedule:[{day:"CN",time:"14:00-16:00"}],maxStudents:8,startDate:"2026-08-24",status:"upcoming"},
  {id:"CP-01",name:"Code Pro 1 - Lớp A",course:"pro_1",instructor:"Hạnh",schedule:[{day:"T7",time:"14:00-16:30"}],maxStudents:6,startDate:"2026-02-14",status:"active"},
  {id:"CP-02",name:"Code Pro 2 - Lớp A",course:"pro_2",instructor:"Hạnh",schedule:[{day:"CN",time:"14:00-16:30"}],maxStudents:6,startDate:"2026-08-24",status:"upcoming"},
  {id:"CP-03",name:"Code Pro 3 - Lớp A",course:"pro_3",instructor:"Hạnh",schedule:[{day:"T7",time:"17:00-19:30"}],maxStudents:6,startDate:"2026-09-01",status:"upcoming"},
  {id:"PP-01",name:"Code Pro+ 1 - Lớp A",course:"proplus_1",instructor:"Hạnh",schedule:[{day:"CN",time:"09:00-11:30"}],maxStudents:6,startDate:"2026-03-15",status:"active"},
  {id:"PP-02",name:"Code Pro+ 2 - Lớp A",course:"proplus_2",instructor:"Hạnh",schedule:[{day:"T7",time:"09:00-11:30"}],maxStudents:6,startDate:"2026-09-01",status:"upcoming"},
  {id:"PP-03",name:"Code Pro+ 3 - Lớp A",course:"proplus_3",instructor:"Hạnh",schedule:[{day:"CN",time:"14:00-16:30"}],maxStudents:6,startDate:"2026-09-01",status:"upcoming"},
];
const I_ATT=[{id:1,classId:"CU-03",studentId:1,date:"2026-04-11",status:"present",note:""},{id:2,classId:"CU-03",studentId:2,date:"2026-04-11",status:"present",note:""},{id:3,classId:"CU-03",studentId:18,date:"2026-04-11",status:"present",note:""},{id:4,classId:"CU-03",studentId:19,date:"2026-04-11",status:"present",note:""},{id:5,classId:"CU-03",studentId:1,date:"2026-04-18",status:"present",note:""},{id:6,classId:"CU-03",studentId:2,date:"2026-04-18",status:"present",note:""},{id:7,classId:"CU-03",studentId:18,date:"2026-04-18",status:"present",note:""},{id:8,classId:"CU-03",studentId:19,date:"2026-04-18",status:"present",note:""},{id:9,classId:"CU-03",studentId:1,date:"2026-04-25",status:"present",note:""},{id:10,classId:"CU-03",studentId:2,date:"2026-04-25",status:"present",note:""},{id:11,classId:"CU-03",studentId:18,date:"2026-04-25",status:"present",note:""},{id:12,classId:"CU-03",studentId:19,date:"2026-04-25",status:"present",note:""},{id:13,classId:"CP-01",studentId:7,date:"2026-02-21",status:"present",note:""},{id:14,classId:"CP-01",studentId:11,date:"2026-02-21",status:"absent",note:""},{id:15,classId:"CP-01",studentId:12,date:"2026-02-21",status:"present",note:""},{id:16,classId:"CP-01",studentId:25,date:"2026-02-21",status:"present",note:""},{id:17,classId:"CP-01",studentId:7,date:"2026-02-28",status:"present",note:""},{id:18,classId:"CP-01",studentId:11,date:"2026-02-28",status:"late",note:""},{id:19,classId:"CP-01",studentId:12,date:"2026-02-28",status:"present",note:""},{id:20,classId:"CP-01",studentId:25,date:"2026-02-28",status:"present",note:""},{id:21,classId:"CP-01",studentId:7,date:"2026-03-07",status:"late",note:""},{id:22,classId:"CP-01",studentId:11,date:"2026-03-07",status:"present",note:""},{id:23,classId:"CP-01",studentId:12,date:"2026-03-07",status:"absent",note:""},{id:24,classId:"CP-01",studentId:25,date:"2026-03-07",status:"present",note:""},{id:25,classId:"PP-01",studentId:5,date:"2026-03-22",status:"present",note:""},{id:26,classId:"PP-01",studentId:8,date:"2026-03-22",status:"present",note:""},{id:27,classId:"PP-01",studentId:10,date:"2026-03-22",status:"present",note:""},{id:28,classId:"PP-01",studentId:28,date:"2026-03-22",status:"absent",note:""},{id:29,classId:"PP-01",studentId:5,date:"2026-03-29",status:"present",note:""},{id:30,classId:"PP-01",studentId:8,date:"2026-03-29",status:"present",note:""},{id:31,classId:"PP-01",studentId:10,date:"2026-03-29",status:"present",note:""},{id:32,classId:"PP-01",studentId:28,date:"2026-03-29",status:"present",note:""},{id:33,classId:"PP-01",studentId:5,date:"2026-04-05",status:"present",note:""},{id:34,classId:"PP-01",studentId:8,date:"2026-04-05",status:"present",note:""},{id:35,classId:"PP-01",studentId:10,date:"2026-04-05",status:"present",note:""},{id:36,classId:"PP-01",studentId:28,date:"2026-04-05",status:"present",note:""},{id:37,classId:"CS-01",studentId:35,date:"2026-05-17",status:"present",note:""},{id:38,classId:"CS-01",studentId:36,date:"2026-05-17",status:"present",note:""},{id:39,classId:"CS-01",studentId:35,date:"2026-05-24",status:"present",note:""},{id:40,classId:"CS-01",studentId:36,date:"2026-05-24",status:"present",note:""}];
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
  const[adminPw,setAdminPw]=useState(()=>load("adminPw",hash("vforge2026")));
  const[auditLog,setAuditLog]=useState(()=>load("audit",[]));

  // Session timeout
  const lastActivity=useRef(Date.now());
  const checkTimeout=useCallback(()=>{if(user&&Date.now()-lastActivity.current>SESSION_TIMEOUT){setUser(null);save("user",null);alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")}},[ user]);
  useEffect(()=>{const t=setInterval(checkTimeout,60000);const reset=()=>{lastActivity.current=Date.now()};window.addEventListener("mousemove",reset);window.addEventListener("keydown",reset);return()=>{clearInterval(t);window.removeEventListener("mousemove",reset);window.removeEventListener("keydown",reset)}},[checkTimeout]);

  // Audit helper
  const log=(action,detail)=>{const entry={id:Date.now(),user:user?.name||"System",role:user?.role||"",action,detail,time:now()};setAuditLog(p=>{const n=[entry,...p].slice(0,200);return n})};

  // Auto-save on change
  useEffect(()=>save("user",user),[user]);
  useEffect(()=>save("accounts",accounts),[accounts]);
  useEffect(()=>save("leads",leads),[leads]);
  useEffect(()=>save("students",students),[students]);
  useEffect(()=>save("classes",classes),[classes]);
  useEffect(()=>save("attendance",attendance),[attendance]);
  useEffect(()=>save("adminPw",adminPw),[adminPw]);
  useEffect(()=>save("audit",auditLog),[auditLog]);

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
        <div>Admin: <b>admin</b> / Vforge@2026</div><div>Sales: <b>sales</b> / Sales@2026</div><div>Lễ tân: <b>reception</b> / Letan@2026</div>
      </div>
    </div></div>);
    function doLogin(){const f=accounts.find(a=>a.username===u&&a.password===hash(p));if(f){setUser(f);setTab("dashboard");lastActivity.current=Date.now();const entry={id:Date.now(),user:f.name,role:f.role,action:"Đăng nhập",detail:"",time:now()};setAuditLog(prev=>[entry,...prev].slice(0,200))}else setE("Sai tên đăng nhập hoặc mật khẩu")}};
    return<Login/>}

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
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}><h2 style={{color:V.text,margin:0,fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>📞 Quản lý <span style={{color:V.accent}}>Sales</span></h2><Btn onClick={()=>setModal("add_lead")}><Ic.Plus/> Thêm Lead</Btn></div>
    <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center"}}><div style={{position:"relative",flex:1,minWidth:"200px"}}><div style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:V.textFaint}}><Ic.Search/></div><input placeholder="Tìm lead..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"9px 14px 9px 36px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"8px",color:V.text,fontSize:"13px",outline:"none",boxSizing:"border-box"}}/></div><div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}><Btn small variant={leadF==="all"?"primary":"ghost"} onClick={()=>setLeadF("all")}>Tất cả ({leads.length})</Btn>{LEAD_ST.map(s=><Btn key={s.id} small variant={leadF===s.id?"primary":"ghost"} onClick={()=>setLeadF(s.id)}>{s.label} ({lbySt[s.id]?.length||0})</Btn>)}</div></div>
    <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:"1380px"}}><thead><tr><TH>Phụ huynh</TH><TH>Học viên</TH><TH>SĐT</TH><TH>Email</TH><TH>Trạng thái</TH><TH>Nguồn</TH><TH>Hình thức</TH><TH>Trình độ</TH><TH>Xếp lớp</TH><TH>Lý do chưa chốt</TH><TH>Ghi chú</TH><TH>Người GT</TH>{user.role==="admin"&&<TH></TH>}</tr></thead>
    <tbody>{fl.map(l=>{const st=LEAD_ST.find(s=>s.id===l.status);const co=COURSES.find(c=>c.id===l.course);const isPaid=l.status==="paid"||l.status==="renew";const ac=classes.filter(c=>c.course===l.course&&["upcoming","active"].includes(c.status));const bc=bestCls(l.course);return<tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background=V.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <TD style={{color:V.text,fontWeight:600}}>{l.parentName}</TD><TD style={{color:V.text,fontWeight:600}}>{l.studentName}</TD><TD>{l.phone}</TD><TD style={{fontSize:"12px"}}>{l.email||"—"}</TD>
      <TD><select value={l.status} onChange={e=>{const ns=e.target.value;setLeads(p=>p.map(x=>x.id===l.id?{...x,status:ns}:x));if(ns==="paid"){const b=bestCls(l.course);if(b&&!students.find(s=>s.name===l.studentName&&s.course===l.course)){setStudents(p=>[...p,{id:Date.now(),name:l.studentName,parentName:l.parentName,parentPhone:l.phone,course:l.course,classId:b.id,enrollDate:tod(),paymentStatus:"paid",amountPaid:co?.fee||0,totalFee:co?.fee||0,note:"Auto-assign"}]);setLeads(p=>p.map(x=>x.id===l.id?{...x,assignedClass:b.id}:x))}}}} style={{padding:"4px 8px",background:st?.bg,border:`1px solid ${st?.color}44`,borderRadius:"6px",color:st?.color,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{LEAD_ST.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></TD>
      <TD><select value={l.source} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,source:e.target.value}:x))} style={{padding:"4px 8px",background:V.surface2,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.textMid,fontSize:"11px",fontWeight:600,outline:"none",cursor:"pointer"}}>{LEAD_SRC.map(s=><option key={s} value={s}>{s}</option>)}</select></TD>
      <TD><select value={l.format||"offline"} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,format:e.target.value}:x))} style={{padding:"4px 8px",background:`${LEARN_FORMAT.find(f=>f.id===(l.format||"offline"))?.color}18`,border:`1px solid ${LEARN_FORMAT.find(f=>f.id===(l.format||"offline"))?.color}44`,borderRadius:"6px",color:LEARN_FORMAT.find(f=>f.id===(l.format||"offline"))?.color,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{LEARN_FORMAT.map(lf=><option key={lf.id} value={lf.id}>{lf.label}</option>)}</select></TD>
      <TD><select value={l.course} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,course:e.target.value}:x))} style={{padding:"4px 8px",background:`${gCC(co)}18`,border:`1px solid ${gCC(co)}44`,borderRadius:"6px",color:gCC(co),fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{COURSE_LEVELS.map(lv=><optgroup key={lv.id} label={`${lv.icon} ${lv.name}`}>{COURSES.filter(c=>c.level===lv.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</select></TD>
      <TD>{isPaid?(()=>{const stu=students.find(s=>s.name===l.studentName&&s.course===l.course);const assignedCls=classes.find(c=>c.id===(stu?.classId||l.assignedClass));if(user.role==="admin"){return ac.length>0?<select value={stu?.classId||bc?.id||""} onChange={e=>{const cid=e.target.value;setLeads(p=>p.map(x=>x.id===l.id?{...x,assignedClass:cid}:x));if(!stu){setStudents(p=>[...p,{id:Date.now(),name:l.studentName,parentName:l.parentName,parentPhone:l.phone,course:l.course,classId:cid,enrollDate:tod(),paymentStatus:"paid",amountPaid:co?.fee||0,totalFee:co?.fee||0,note:""}])}else{setStudents(p=>p.map(s=>s.id===stu.id?{...s,classId:cid}:s))}log("Đổi lớp (Admin)",`${l.studentName} → ${classes.find(c=>c.id===cid)?.name}`)}} style={{padding:"4px 8px",background:V.mintDim,border:`1px solid ${V.mint}44`,borderRadius:"6px",color:V.mint,fontSize:"11px",fontWeight:700,outline:"none",cursor:"pointer"}}>{ac.map(c=><option key={c.id} value={c.id}>{c.name} ({clsSC(c.id)}/{c.maxStudents})</option>)}</select>:<span style={{color:V.amber,fontSize:"11px",fontWeight:600}}>⚠ Chưa có lớp phù hợp</span>}
      return assignedCls?<Badge color={V.mint} bg={V.mintDim}>{assignedCls.name}</Badge>:(ac.length>0?<span style={{color:V.textFaint,fontSize:"11px"}}>Đang xử lý...</span>:<span style={{color:V.amber,fontSize:"11px",fontWeight:600}}>⚠ Chưa có lớp phù hợp</span>)})():<span style={{color:V.textGhost,fontSize:"11px"}}>Cần đóng HP</span>}</TD>
      <TD>{!isPaid&&l.status!=="renew"?<div style={{display:"flex",flexDirection:"column",gap:"4px"}}><select value={l.lostReason||""} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,lostReason:e.target.value}:x))} style={{padding:"4px 8px",background:V.surface2,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.textMid,fontSize:"11px",outline:"none",cursor:"pointer"}}><option value="">-- Chọn --</option>{LOST_REASONS.map(r=><option key={r} value={r}>{r}</option>)}</select>{l.lostReason==="Khác"&&<input value={l.lostNote||""} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,lostNote:e.target.value}:x))} placeholder="Ghi chú..." style={{padding:"4px 8px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.text,fontSize:"11px",outline:"none",width:"100%",boxSizing:"border-box"}}/>}</div>:<span style={{color:V.textGhost,fontSize:"11px"}}>—</span>}</TD>
      <TD style={{maxWidth:"130px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:"12px",color:V.textDim}}>{l.notes||"—"}</TD>
      <TD style={{color:l.referrer?V.accent:V.textGhost,fontWeight:l.referrer?600:400,fontSize:"12px"}}>{l.referrer||"—"}</TD>
      {user.role==="admin"&&<TD><Btn small variant="danger" onClick={()=>{if(confirm(`Xóa lead "${l.studentName}"?`)){setLeads(p=>p.filter(x=>x.id!==l.id));log("Xóa lead",`${l.studentName} (${l.parentName})`)}}}><Ic.Trash/></Btn></TD>}
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
  const SetP=()=>{const[np,setNp]=useState(adminPw);const[sv,setSv]=useState(false);
  const[showAdd,setShowAdd]=useState(false);const[nf,setNf]=useState({name:"",username:"",password:"",role:"sales"});const[delConfirm,setDelConfirm]=useState(null);
  return(<div><h2 style={{color:V.text,margin:"0 0 24px",fontSize:"22px",fontWeight:800,fontFamily:"'Glory',sans-serif"}}>⚙️ <span style={{color:V.accent}}>Cài đặt</span></h2>
    <div style={{maxWidth:"600px"}}>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px",marginBottom:"20px"}}><h3 style={{color:V.text,margin:"0 0 16px",fontSize:"15px",fontWeight:700}}>🔐 Mật khẩu chuyển lớp</h3><p style={{color:V.textDim,fontSize:"13px",marginBottom:"16px"}}>Dùng khi Sales muốn chuyển HV sang lớp khác thay vì lớp tự động.</p><Inp label="Mật khẩu mới" value={np} onChange={e=>{setNp(e.target.value);setSv(false)}}/><Btn onClick={()=>{if(np.length<6){alert("Mật khẩu tối thiểu 6 ký tự!");return}setAdminPw(hash(np));log("Đổi MK chuyển lớp","");setSv(true)}}>{sv?"✅ Đã lưu":"💾 Lưu"}</Btn></div>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}><h3 style={{color:V.text,margin:0,fontSize:"15px",fontWeight:700}}>👥 Tài khoản hệ thống</h3><Btn small onClick={()=>setShowAdd(!showAdd)}>{showAdd?"✕ Đóng":"+ Tạo TK"}</Btn></div>
        {showAdd&&<div style={{background:V.bg,borderRadius:"10px",padding:"16px",marginBottom:"16px",border:`1px solid ${V.border}`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Inp label="Họ tên" value={nf.name} onChange={e=>setNf({...nf,name:e.target.value})} placeholder="VD: Nguyễn Văn A"/>
            <Inp label="Tên đăng nhập" value={nf.username} onChange={e=>setNf({...nf,username:e.target.value})} placeholder="VD: nguyenvana"/>
            <Inp label="Mật khẩu" value={nf.password} onChange={e=>setNf({...nf,password:e.target.value})} placeholder="Tối thiểu 6 ký tự"/>
            <Sel label="Vai trò" value={nf.role} onChange={e=>setNf({...nf,role:e.target.value})}><option value="admin">Admin</option><option value="sales">Sales</option><option value="reception">Lễ tân</option></Sel>
          </div>
          <Btn onClick={()=>{if(!nf.name||!nf.username||!nf.password)return;if(nf.password.length<6){alert("Mật khẩu tối thiểu 6 ký tự!");return}if(accounts.find(a=>a.username===nf.username)){alert("Username đã tồn tại!");return}setAccounts(p=>[...p,{id:Date.now(),name:sanitize(nf.name),username:sanitize(nf.username),password:hash(nf.password),role:nf.role}]);log("Tạo tài khoản",`${nf.name} (@${nf.username}) - ${ROLE_CFG[nf.role]?.label}`);setNf({name:"",username:"",password:"",role:"sales"});setShowAdd(false)}} style={{width:"100%"}}>✅ Tạo tài khoản</Btn>
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
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px",marginTop:"20px"}}><h3 style={{color:V.text,margin:"0 0 16px",fontSize:"15px",fontWeight:700}}>🔑 Đổi mật khẩu tài khoản</h3>
        {accounts.map(a=>{const[show,setShow]=useState(false);const[newPw,setNewPw2]=useState("");
        return<div key={a.id} style={{padding:"10px 0",borderBottom:`1px solid ${V.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:"8px"}}><Badge color={ROLE_CFG[a.role]?.color}>{ROLE_CFG[a.role]?.label}</Badge><span style={{color:V.text,fontSize:"14px",fontWeight:600}}>{a.name}</span><span style={{color:V.textFaint,fontSize:"12px"}}>@{a.username}</span></div><Btn small variant="ghost" onClick={()=>setShow(!show)}>Đổi MK</Btn></div>
        {show&&<div style={{display:"flex",gap:"8px",marginTop:"8px"}}><input type="password" value={newPw} onChange={e=>setNewPw2(e.target.value)} placeholder="Mật khẩu mới (6+ ký tự)" style={{flex:1,padding:"8px 12px",background:V.bg,border:`1px solid ${V.border}`,borderRadius:"6px",color:V.text,fontSize:"13px",outline:"none"}}/><Btn small onClick={()=>{if(newPw.length<6){alert("Tối thiểu 6 ký tự!");return}setAccounts(p=>p.map(x=>x.id===a.id?{...x,password:hash(newPw)}:x));log("Đổi MK",`@${a.username}`);setShow(false);setNewPw2("")}}>Lưu</Btn></div>}</div>})}
      </div>
      <div style={{background:V.surface,border:`1px solid ${V.border}`,borderRadius:"14px",padding:"24px",marginTop:"20px"}}>
        <h3 style={{color:V.text,margin:"0 0 16px",fontSize:"15px",fontWeight:700}}>🔄 Dữ liệu</h3>
        <p style={{color:V.textDim,fontSize:"13px",marginBottom:"12px"}}>Reset về dữ liệu mẫu ban đầu (8 lead, 5 học viên, 7 lớp).</p>
        <Btn variant="secondary" onClick={()=>{if(confirm("Xác nhận reset về dữ liệu mẫu?")){setLeads(I_LEADS);setStudents(I_STU);setClasses(I_CLS);setAttendance(I_ATT);setAccounts(ACCOUNTS);setAdminPw(hash("vforge2026"));setAuditLog([]);log("Reset về dữ liệu mẫu","")}}} style={{marginBottom:"20px"}}>↩️ Reset về mẫu</Btn>
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
      <div style={{display:"flex",gap:"8px",alignItems:"center"}}><div style={{textAlign:"right",marginRight:"8px"}}><div style={{color:V.text,fontSize:"13px",fontWeight:600}}>{user.name}</div><Badge color={ROLE_CFG[user.role]?.color}>{ROLE_CFG[user.role]?.label}</Badge></div>{can("sales")&&<Btn small onClick={()=>setModal("add_lead")}><Ic.Plus/> Lead</Btn>}<Btn small variant="ghost" onClick={()=>{log("Đăng xuất","");setUser(null)}}><Ic.Logout/></Btn></div>
    </div></div>
    <div style={{maxWidth:"1200px",margin:"0 auto",padding:"24px"}}>{can(tab)?pg[tab]:<div style={{textAlign:"center",padding:"60px",color:V.textFaint}}>Không có quyền truy cập</div>}</div>
    {modal==="add_lead"&&<AddLead/>}{modal?.type==="enroll"&&<Enroll lead={modal.lead}/>}{modal==="attendance"&&<Attend/>}{modal==="add_class"&&<AddCls/>}{modal?.type==="edit_class"&&<AddCls editClass={modal.classData}/>}{modal?.type==="view_class"&&<ViewClassStudents classId={modal.classId}/>}
  </div>);
}
