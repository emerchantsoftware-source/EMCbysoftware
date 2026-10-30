'use strict';
/* ============================================================
   Helpdesk Office 3D — office-3d.js
   วางไฟล์นี้ไว้โฟลเดอร์เดียวกับ office-3d.html
   (ต้องโหลดหลัง three.js r128)
   ============================================================ */

/* ---------- helpers ---------- */
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.random()*a.length|0];
const shuf=a=>a.slice().sort(()=>Math.random()-.5);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clampN=THREE.MathUtils.clamp;
const now=()=>performance.now()/1000;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function wpick(arr,fn){let s=0;const w=arr.map(a=>{const v=Math.max(0,fn(a));s+=v;return v});if(s<=0)return null;let r=Math.random()*s;for(let i=0;i<arr.length;i++){r-=w[i];if(r<=0)return arr[i]}return arr[arr.length-1]}

/* ---------- data ---------- */
const TEAM={Software:'#6fbf4a',Makro:'#f2b630',CFW:'#e8693f',B2B:'#4fa3dc'};
const SHIRT={Software:0x4f9a3a,Makro:0xe0a526,CFW:0xd2603a,B2B:0x4a8fd0};
// [key,nick,full,team,role,female,hair,glasses]
const PPL=[
['waraporn','Ying','Waraporn Suksan','Software','Supervisor',1,0x1a1a1a,1],['thinnaphat','Aon','Thinnaphat Chopkha','Software','Senior',0,0x222222],
['thanakorn','Ouk','Thanakorn Techkriangkraikul','Software','Staff',0,0x151515],['peerapat','James','Peerapat Taeng-on','Software','Staff',0,0x2a1d14],
['phanu','Bas','Phanu Kaewwongwan','Software','Staff',0,0x111111],['jittiphat','Phat','Jittiphat Witthayachaisaeng','Software','Staff',0,0x3a2418],
['sittiporn','Sun','Sittiporn Boonfueang','Software','Staff',0,0x0d0d0d],['laemin','Boat','Laemin Khunsopanet','Software','Intern',0,0x222222],
['khanet','Check','Khanet Chainarong','Software','Intern',0,0x1a1a1a],
['phakjira','Gun','Phakjira Iamchai','Makro','Staff',1,0x111111],['krittiya','Not','Krittiya Nasueb','Makro','Staff',1,0x3a2418],
['patipol','Teen','Patipol Wongprasert','Makro','Staff',0,0x111111],
['narawan','Cake','Narawan Hengmee','CFW','Senior',1,0x2a1d14],['jeerawan','Jee','Jeerawan Prabnongbua','CFW','Senior',1,0x5a2e1a],
['taweelap','Book','Taweelap Boonphokaew','CFW','Staff',0,0x151515],['settawut','Top','Settawut Karompraj','CFW','Staff',0,0x111111,1],
['kraiyut','Few','Kraiyut Kaewkajorn','B2B','Staff',0,0x151515],['paweena','Cat','Paweena Totian','B2B','Staff',1,0x0d0d0d]];

// ที่นั่งเริ่มต้นตามรูป: [คอลัมน์ 0-3 (ซ้าย→ขวา), แถว 0-4 (หลังห้อง→หน้าห้อง)]
const SEAT0={
 James:[0,0],
 Boat:[0,1],Check:[1,1],
 Jee:[0,2],Cake:[1,2],
 Gun:[0,3],Not:[1,3],
 Sun:[0,4],Aon:[1,4],
 Book:[2,0],Top:[3,0],
 Teen:[3,1],
 Few:[2,2],Cat:[3,2],
 Ouk:[2,3],Bas:[3,3],
 Phat:[2,4],Ying:[3,4]};

// บุคลิกแต่ละคน: talk=ความถี่ที่พูด, busy=ความขยันพิมพ์, calm=นิ่ง
const STYLE={
 Ying:{talk:.9},
 Aon:{talk:.06,calm:1},
 Ouk:{talk:.5,busy:1.6},
 James:{talk:.5},
 Bas:{talk:.3,busy:1.8},
 Not:{talk:1.2},
 Teen:{talk:0,calm:1,busy:1.2}};

/* ---------- บทพูด ---------- */
const GEN=['ลูกค้าโทรเข้ามาอีกแล้ว ☎️','Ticket นี้ปิดแล้วนะ ✅','พักเที่ยงกินอะไรดี 🍜','กาแฟไหม ☕','วันนี้ Ticket เยอะมาก 😵','เดี๋ยวส่งต่อให้ทีมที่เกี่ยวข้องดูนะ','ขอดู log ให้หน่อยได้ไหม','มีเคสด่วนเข้ามานะ 🚨','ใครว่างช่วยดูเคสนี้หน่อย'];
const TL={
 Software:[
  'POS ร้านนี้รีโมตเข้าไปแก้ให้แล้วนะ 🖥️','Price Checker สาขานี้ค้างอยู่ เดี๋ยวรีโมตเข้าไปดู','เครื่องพิมพ์ใบเสร็จไม่ออก เดี๋ยวรีโมตเข้าไปเช็ก 🖨️',
  'Digital Signage ไม่ขึ้นภาพ ขอรีโมตเข้าไปดูนะ 📺','เครื่องชั่งน้ำหนักอ่านค่าเพี้ยน เดี๋ยวรีโมตไปตั้งค่าใหม่ ⚖️','เครื่อง Fingerscan สแกนนิ้วไม่ติด เดี๋ยวรีโมตเข้าไปแก้ให้ 👆',
  'ลูกค้าให้ส่ง AnyDesk มาให้หน่อย','POS เด้ง error ตอนตัดบิล เดี๋ยวรีโมตเข้าไปดูให้'],
 Makro:[
  'แก้ไข user ให้สาขานี้เสร็จแล้วนะ ✏️','ขอสร้าง user ใหม่ให้พนักงานเข้าใหม่ 👤','ลูกค้าขอแก้ Promotion เดี๋ยวเข้าไปปรับให้ 🏷️',
  'Promotion ยังไม่ขึ้นในระบบ ต้องแก้ใหม่','user นี้สิทธิ์ไม่ครบ เดี๋ยวแก้ให้','สร้าง user ให้ลูกค้าเสร็จแล้วนะ ✅'],
 CFW:[
  'เปิดงานให้ช่างเข้าไปตรวจสอบสาขานี้แล้วนะ 🔧','Unlock User ให้ลูกค้าแล้วนะ 🔓','Reset Password เรียบร้อย ส่งให้ลูกค้าแล้ว 🔑',
  'ประสานทีมอื่นช่วยตรวจสอบอยู่นะ รอแป๊บ','ปิด Ticket นี้ได้แล้ว ✅','ช่างเข้าหน้างานแล้ว เดี๋ยวตามผลให้'],
 B2B:[
  'เช็กข้อมูลสินค้าให้ลูกค้าแล้ว 📋','ตรวจสอบ stock สินค้าตัวนี้ให้หน่อย 📦','ลูกค้าขอแก้ที่อยู่จัดส่งสินค้า 🚚',
  'ข้อมูลลูกค้ารายนี้ผิด เดี๋ยวแก้ไขให้','ประสานทีม Axons ช่วยแก้ไขอยู่นะ','ตอบแชท LINE ลูกค้าอยู่ 💬','ลูกค้าทักไลน์มาถามสต็อกอีกแล้ว']};
const REP=['ได้เลย!','โอเค เดี๋ยวช่วยดู 👍','555','เจอเหมือนกันเลย','รับทราบ','เดี๋ยวตามไปนะ','ขอบคุณนะ 🙏','จริงด้วย 😂'];
const XR={ // ตอบข้ามทีม
 Software:['เดี๋ยวรีโมตเข้าไปดูให้ 🖥️','ขอ AnyDesk ลูกค้าหน่อยนะ'],
 Makro:['เดี๋ยวเข้าไปเช็ก user/โปรให้ 🏷️'],
 CFW:['เดี๋ยวเปิดงานให้ช่างเข้าไปดู 🔧'],
 B2B:['เดี๋ยวเช็กข้อมูลสินค้าให้ 📋']};
const NG_A=['เมื่อวานดูซีรีส์ถึงตอนไหนแล้ว','หิวข้าวแล้ว…','เย็นนี้กินหมูกระทะกันไหม','ร้านข้าวปากซอยอร่อยนะ','เห็นร้านชานมเปิดใหม่ไหม','ง่วงจัง กินอะไรดี','วันนี้ฝนจะตกไหมนะ'];
const NG_B=['จริงเหรอ 555','เอาด้วยๆ!','ไปๆ','หิวเหมือนกัน 😂','ดูแล้ว สนุกมาก','บอกแล้ว 555','ง่วงเหมือนกันเลย'];
const OUK_L=['ตรงนี้ลองเช็กอีกทีนะ','เคสนี้เสร็จหรือยัง','ช่วยกันดูหน่อย','เรียบร้อยดีนะ 👍'];
const ANS={ // คนอื่นตอบเวลา Ying ถามหา
 door:['เห็นเดินออกไปข้างนอกนะ','เมื่อกี้ยังอยู่เลย','เดี๋ยวก็กลับมา 555'],
 screen:['ยืนดูจออยู่ตรงโน้นแหละ'],tour:['เดินดูงานคนอื่นอยู่แถวนี้แหละ'],
 food:['ไปซื้อข้าวมั้ง 🍱'],water:['ไปซื้อน้ำมั้ง 🧋'],
 _:['เมื่อกี้ยังอยู่เลย','ไม่รู้เหมือนกัน','เดินไปแถวนั้นมั้ง']};

document.getElementById('legend').innerHTML=Object.entries(TEAM).map(([k,c])=>`<span><i style="background:${c}"></i>${k}</span>`).join('');

/* ---------- renderer / scene ---------- */
const PX=innerWidth<700?2:3;   // ความหนาพิกเซล (ยิ่งมากยิ่งเป็นก้อน)
const R=new THREE.WebGLRenderer({antialias:false});R.setPixelRatio(1/PX);R.shadowMap.enabled=true;
document.body.appendChild(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color(0x9bd4f5);S.fog=new THREE.Fog(0x9bd4f5,48,95);
const C=new THREE.PerspectiveCamera(45,1,.1,100);
const HL=new THREE.HemisphereLight(0xfff4dc,0x7a6a4a,.95);S.add(HL);
const sun=new THREE.DirectionalLight(0xffe2b0,.75);sun.position.set(6,14,8);sun.castShadow=true;sun.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);
Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:50});S.add(sun);

const mat=(c,o={})=>{const r=Object.assign({},o);delete r.roughness;delete r.metalness;return new THREE.MeshLambertMaterial(Object.assign({color:c},r))};
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
function add(par,geo,m,x,y,z,seat){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;if(seat)o.userData.seat=seat;par.add(o);return o}
function canvasTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t}

/* ---------- room ---------- */
const X0=-4.85,X1=4.85,ZB=-10.5,ZF=7.5,D0=-1.9,D1=1.6,ZC=(ZB+ZF)/2,WL=ZF-ZB;
const DZ=(D0+D1)/2;                       // กึ่งกลางประตู (ผนังซ้าย)
const tile=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#6e4524';g.fillRect(0,0,w,h);const C=['#b87a44','#a96d3a','#c4864c','#b07440'];
 for(let r=0;r<8;r++){const y=r*16,o=(r*37)%64;for(let k=-1;k<3;k++){const x=o+k*64;g.fillStyle=C[(r*3+k+5)%4];g.fillRect(x+1,y+1,62,14);
  for(let i=0;i<5;i++){g.fillStyle='rgba(255,230,180,.22)';g.fillRect(x+4+Math.random()*52|0,y+3+Math.random()*10|0,5,1)}}}});
tile.wrapS=tile.wrapT=THREE.RepeatWrapping;tile.repeat.set(4,8);
add(S,box(X1-X0+.4,.2,WL),mat(0xffffff,{map:tile}),0,-.1,ZC);
const CUT=[];   // ผนังทึบ: จางลงเมื่อกล้องอยู่นอกห้อง จะได้ยังมองเข้ามาได้
const wallTex=(w,h)=>canvasTex(w,h,(g,W,H)=>{g.fillStyle='#e6c98f';g.fillRect(0,0,W,H);g.fillStyle='#dcbb7c';for(let x=0;x<W;x+=24)g.fillRect(x,0,12,H*.62);
 const y0=H*.62|0;g.fillStyle='#8a5a30';g.fillRect(0,y0,W,H-y0);g.fillStyle='#7a4c26';for(let x=0;x<W;x+=20)g.fillRect(x,y0,2,H-y0);
 g.fillStyle='#5a3418';g.fillRect(0,y0-3,W,5);g.fillStyle='#c79a5a';g.fillRect(0,y0-5,W,2)});
const cutMat=(c,test,map)=>{const m=mat(c,{transparent:true,map});m.userData.test=test;CUT.push(m);return m};
const WM=cutMat(0xffffff,()=>C.position.z<ZB-.3,wallTex(512,180)),WR=cutMat(0xf0e0c0,()=>C.position.x>X1+.3,wallTex(1024,192)),FR=mat(0x4a2e18);
add(S,box(X1-X0+.4,3.4,.2),WM,0,1.7,ZB);
const seg=(x,m,a,b)=>add(S,box(.2,3.4,b-a),m,x,1.7,(a+b)/2);
seg(X1,WR,ZB,ZF);const GL=mat(0xa8e0d8,{transparent:true,opacity:.16,roughness:.05,metalness:.2,depthWrite:false,side:THREE.DoubleSide}),GF=mat(0x7a4a24),FZ=mat(0xfff0c8,{transparent:true,opacity:.35,depthWrite:false});
const gl=(w,h,d,x,y,z,m)=>{const o=add(S,box(w,h,d),m,x,y,z);o.castShadow=o.receiveShadow=false;return o};
[[ZB,D0],[D1,ZF]].forEach(([a,b])=>{const L=b-a,c=(a+b)/2,n=Math.max(1,Math.round(L/2.2));
 gl(.06,3.2,L,X0,1.7,c,GL);gl(.1,.07,L,X0,3.35,c,GF);gl(.1,.07,L,X0,.04,c,GF);gl(.08,.3,L,X0,1.25,c,FZ);
 for(let i=0;i<=n;i++)gl(.1,3.4,.06,X0,1.7,a+L*i/n,GF)});
{const W=X1-X0+.2;gl(W,3.2,.06,0,1.7,ZF,GL);gl(W,.07,.1,0,3.35,ZF,GF);gl(W,.07,.1,0,.04,ZF,GF);gl(W,.3,.08,0,1.25,ZF,FZ);
 for(let i=0;i<=4;i++)gl(.06,3.4,.1,X0-.1+W*i/4,1.7,ZF,GF)}
[D0,D1].forEach(z=>add(S,box(.25,3.2,.12),FR,X0,1.6,z));add(S,box(.25,.2,D1-D0+.12),FR,X0,3.1,(D0+D1)/2);add(S,box(.1,.1,D1-D0),new THREE.MeshBasicMaterial({color:0xf2c14e}),X0,2.9,(D0+D1)/2);
const board=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#e9d9b8';g.fillRect(0,0,w/2,h);g.fillStyle='#4fc3a1';[[90,80,60],[140,150,45],[70,170,40],[190,60,30]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill()});
 g.fillStyle='#f8c9c0';g.fillRect(w/2,0,w/2,h);g.fillStyle='#1fae7a';g.fillRect(w/2,0,w/2,28);g.fillStyle='#fff';g.fillRect(w/2+10,8,100,10);
 for(let i=0;i<9;i++){g.fillStyle='#b05a5a';g.fillRect(w/2+14,44+i*22,60,8);g.fillStyle='#2fbe73';g.fillRect(w/2+110+i%3*30,42+i*22,14,12)}});
add(S,box(4.6,2.4,.06),FR,0,1.9,ZB+.08);add(S,box(4.4,2.2,.08),mat(0xffffff,{map:board}),0,1.9,ZB+.12);

/* ---------- Stardew scenery: สนามหญ้า ทางเดิน ต้นไม้ ดอกไม้ พรม ---------- */
{const gt=canvasTex(64,64,(g,w,h)=>{g.fillStyle='#6fae3f';g.fillRect(0,0,w,h);for(let i=0;i<90;i++){g.fillStyle=pick(['#5f9e34','#7cbd4a','#68a63a']);g.fillRect(Math.random()*w|0,Math.random()*h|0,2,2)}
  for(let i=0;i<6;i++){g.fillStyle='#4f8a2a';const x=Math.random()*60|0,y=Math.random()*60|0;g.fillRect(x,y+2,1,2);g.fillRect(x+2,y,1,4)}});
 gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(70,70);add(S,box(220,.2,220),mat(0xffffff,{map:gt}),0,-.3,ZC).castShadow=false;
 add(S,box(12,.02,2.6),mat(0x9c7a46),X0-6.1,-.2,DZ).castShadow=false;add(S,box(12,.02,2.0),mat(0xc9a56b),X0-6.1,-.19,DZ).castShadow=false;
 add(S,box(1,.02,1.8),mat(0xa33b2b),X0+.7,.011,DZ).castShadow=false;
 const rug=canvasTex(64,512,(g,w,h)=>{g.fillStyle='#8f2f26';g.fillRect(0,0,w,h);g.fillStyle='#e8c46a';g.fillRect(3,3,w-6,h-6);g.fillStyle='#b8442e';g.fillRect(6,6,w-12,h-12);
  for(let y=24;y<h-20;y+=32){g.fillStyle='#e8c46a';g.fillRect(28,y,8,8);g.fillStyle='#4f9a3a';g.fillRect(20,y+12,24,2)}});
 add(S,box(2.2,.02,16.4),mat(0xffffff,{map:rug}),0,.011,ZC).castShadow=false;
 const tree=(x,z,k)=>{const g=new THREE.Group();g.position.set(x,-.2,z);S.add(g);add(g,box(.5*k,1.6*k,.5*k),mat(0x6b4423),0,.8*k,0);
  const L=[0x3f8f3a,0x4fa545,0x5fb853];[[2.2,1.8],[1.7,2.6],[1.1,3.3]].forEach(([w,y],i)=>add(g,box(w*k,.9*k,w*k),mat(L[i]),0,y*k,0))};
 [[-9,-9.5,1.1],[-10.5,-4.5,1.3],[-9,4.5,1],[-10.2,8.5,1.2],[-5,-13.5,1.2],[0,-14.5,1.4],[5,-13.2,1.1],[9,-10,1.2],[9.8,-4,1],[9,2,1.3],[10,6.5,1.1],[7,11,1.1],[-7,11.5,1.2],[-12.5,-1.5,1.2]].forEach(a=>tree(...a));
 const FC=[0xe8483a,0xf5d442,0xf08acb,0xffffff,0x8a7cf0];
 for(let i=0;i<110;i++){const x=rnd(-15,15),z=rnd(-17,13);if(Math.abs(x)<6.2&&z>-11.6&&z<8.6)continue;if(x<X0&&Math.abs(z-DZ)<1.5)continue;
  const f=new THREE.Mesh(box(.12,.12,.12),mat(pick(FC)));f.position.set(x,-.05,z);S.add(f);const l=new THREE.Mesh(box(.04,.14,.04),mat(0x3f8f3a));l.position.set(x,-.15,z);S.add(l)}}

/* ---------- desks ---------- */
const scrTex=canvasTex(128,80,(g,w,h)=>{g.fillStyle='#f6e9c8';g.fillRect(0,0,w,h);g.fillStyle='#7a4c26';g.fillRect(0,0,w,10);for(let i=0;i<7;i++){g.fillStyle=i%3?'#c9a878':'#2fbe73';g.fillRect(6,18+i*9,40+(i*17)%70,4)}});
const M={white:mat(0xc98d50),panel:mat(0x93602f),black:mat(0x3a2414),shirt:mat(0x3b93f5),pants:mat(0x3d4f8a),scr:new THREE.MeshBasicMaterial({map:scrTex}),bottle:mat(0x7fc0ff,{transparent:true,opacity:.6}),cush:mat(0xb8442e),clay:mat(0xd9733c),leaf:mat(0x4f9a3a)};
const SKIN=[0xf3c9a5,0xe8b78d,0xd9a579];
const P=[],seats=[],DESKS=[];
function desk(sx,sz,both){
 const g=new THREE.Group();g.position.set(sx,0,sz);S.add(g);const A=(geo,m,x,y,z)=>add(g,geo,m,x,y,z);
 A(box(1.6,.05,.85),M.white,0,.75,0);A(box(.05,.75,.8),M.white,-.75,.375,0);A(box(.05,.75,.8),M.white,.75,.375,0);
 A(box(1.6,.55,.05),M.panel,0,1.05,-.45);
 if(both)A(box(.05,.55,.85),M.panel,-.8,1.05,-.03);
 A(box(.05,.55,.85),M.panel,.8,1.05,-.03);
 A(box(.5,.32,.04),M.black,0,1.02,-.15);A(box(.06,.14,.06),M.black,0,.85,-.15);
 const sk=document.createElement('canvas');sk.width=128;sk.height=80;const stx=new THREE.CanvasTexture(sk);DESKS.push({cv:sk.getContext('2d'),tx:stx,seed:Math.random()*100});
 const sc=new THREE.Mesh(new THREE.PlaneGeometry(.45,.27),new THREE.MeshBasicMaterial({map:stx}));sc.position.set(0,1.02,-.128);g.add(sc);
 A(box(.4,.02,.14),M.black,0,.785,.22);A(box(.16,.05,.14),M.black,-.55,.8,0);
 A(box(.12,.1,.12),M.clay,-.5,.83,-.32);A(box(.08,.1,.08),M.leaf,-.5,.92,-.32);A(box(.06,.06,.06),mat(pick([0xe8483a,0xf5d442,0xf08acb,0xffffff])),-.5,1,-.32);
 A(new THREE.CylinderGeometry(.04,.04,.2,8),M.bottle,.55,.88,.1);
}
const XS=[-4,-2.4,2.4,4],ROWZ=[-9,-6.2,-3.4,2.4,5.2];   // 5 แถว x 4 ที่นั่ง = 20 (เว้นประตูระหว่างแถว 3-4)
const SLOTS=[];ROWZ.forEach(z=>XS.forEach(x=>SLOTS.push([x,z])));
SLOTS.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
SLOTS.forEach(([x,z])=>desk(x,z,XS.indexOf(x)%2==0));
const slotAt=(xi,zi)=>SLOTS.findIndex(s=>s[0]===XS[xi]&&s[1]===ROWZ[zi]);

/* ---------- people ---------- */
function person(d,i){
 const [key,nick,full,team,role,fem,hair,gl]=d;const g=new THREE.Group();
 const p={d,g,fem,nick,team,st:Object.assign({talk:1,busy:1,calm:0},STYLE[nick]),ph:Math.random()*6,
  talkUntil:0,lookUntil:0,look:null,bub:'',bubUntil:0,bubFx:false,
  mode:'work',sit:true,q:[],cur:null,px:0,pz:0,yawT:0,walking:false,wph:0,lg:0,hand:null,out:false,why:'',
  nextAct:now()+rnd(12,60),cool:10,modeUntil:0,fxAt:0,nodUntil:0,sighAt:-99,startleAt:-99,pointUntil:0,pointTo:null,boostUntil:0,watch:false,
  foodUntil:0,cupUntil:0,awaySince:-99,askedAt:-99,ab:[1.2,1.2],ringUntil:0,callUntil:0};
 g.userData.p=p;Object.assign(p,{vel:0,sitK:1,bubShown:'',bubW:0,bubH:0});const skin=mat(SKIN[i%3]),sh=mat(SHIRT[team]);
 // เก้าอี้ (แยกกลุ่มเพื่อให้เลื่อนออกเวลาลุก)
 const chair=new THREE.Group();g.add(chair);p.chair=chair;
 const Ch=(geo,m,x,y,z)=>add(chair,geo,m,x,y,z,g);
 Ch(box(.5,.06,.5),M.cush,0,.48,.85);Ch(box(.5,.55,.06),M.black,0,.82,1.12);Ch(new THREE.CylinderGeometry(.04,.04,.4,8),M.black,0,.25,.85);
 // ตัวคน (กลุ่ม bd ย้าย/หมุนได้อิสระ)
 const bd=new THREE.Group();bd.position.set(0,0,.8);bd.rotation.order='YXZ';g.add(bd);p.bd=bd;
 const B=(geo,m,x,y,z)=>add(bd,geo,m,x,y,z,g);
 p.torso=B(box(.42,.5,.24),sh,0,.8,0);
 const ls=new THREE.Group();bd.add(ls);p.legsSit=ls;
 [-1,1].forEach(s=>{add(ls,box(.16,.14,.5),M.pants,s*.1,.6,-.25,g);add(ls,box(.14,.5,.14),M.pants,s*.1,.3,-.5,g)});
 const lt=new THREE.Group();lt.visible=false;bd.add(lt);p.legsStand=lt;
 p.legPv=[-1,1].map(s=>{const pv=new THREE.Group();pv.position.set(s*.1,.58,0);add(pv,box(.14,.58,.14),M.pants,0,-.29,0,g);lt.add(pv);return pv});
 p.arms=[-1,1].map(s=>{const pv=new THREE.Group();pv.position.set(s*.27,1.02,0);add(pv,box(.09,.55,.09),sh,0,-.275,0,g);add(pv,box(.1,.1,.1),skin,0,-.56,0,g);bd.add(pv);return pv});
 // ของในมือ (ถุงข้าว / แก้วน้ำ)
 const bag=new THREE.Group();bag.position.set(0,-.6,0);bag.visible=false;p.arms[1].add(bag);p.bagG=bag;
 add(bag,box(.16,.18,.08),mat(0xffffff),0,-.1,0,g);add(bag,new THREE.TorusGeometry(.045,.008,6,10),mat(0xd0d0d0),0,.02,0,g);
 const cup=new THREE.Group();cup.position.set(0,-.62,0);cup.visible=false;p.arms[1].add(cup);p.cupG=cup;
 add(cup,new THREE.CylinderGeometry(.045,.035,.13,10),mat(0xf4efe4),0,-.02,0,g);add(cup,new THREE.CylinderGeometry(.048,.048,.02,10),mat(0xe8483a),0,.05,0,g);
 // ของบนโต๊ะ
 const food=new THREE.Group();food.position.set(-.45,.8,.32);food.visible=false;g.add(food);p.food=food;
 add(food,box(.2,.05,.13),mat(0xffffff),0,0,0,g);add(food,box(.2,.015,.13),mat(0xe85d3a),0,.032,0,g);
 const cp2=new THREE.Group();cp2.position.set(.45,.85,.3);cp2.visible=false;g.add(cp2);p.cp2=cp2;
 add(cp2,new THREE.CylinderGeometry(.04,.032,.12,10),mat(0xf4efe4),0,0,0,g);add(cp2,new THREE.CylinderGeometry(.043,.043,.02,10),mat(0xe8483a),0,.07,0,g);
 // หัว
 const ph=new THREE.Group();ph.position.set(.58,.775,-.2);g.add(ph);p.phone=ph;add(ph,box(.14,.04,.2),M.black||mat(0x1b1f1e),0,.02,0,g);
 p.led=new THREE.Mesh(new THREE.SphereGeometry(.016,6,6),new THREE.MeshBasicMaterial({color:0x333333}));p.led.position.set(.04,.05,.07);ph.add(p.led);
 p.hs=add(g,box(.05,.03,.17),M.black||mat(0x1b1f1e),.58,.83,-.2,g);
 const head=new THREE.Group();head.position.set(0,1.2,0);bd.add(head);
 add(head,box(.32,.3,.3),skin,0,0,0,g);
 const hm=mat(hair);
 if(fem){add(head,box(.38,.44,.12),hm,0,-.07,.17,g);add(head,box(.36,.12,.34),hm,0,.17,.01,g);add(head,box(.34,.07,.04),hm,0,.1,-.16,g);[-1,1].forEach(s=>add(head,box(.04,.3,.2),hm,s*.18,-.05,.06,g))}
 else{add(head,box(.35,.13,.34),hm,0,.17,.01,g);add(head,box(.35,.22,.08),hm,0,.03,.16,g);add(head,box(.34,.06,.04),hm,0,.11,-.16,g)}
 const eye=mat(0x111111);[-1,1].forEach(s=>add(head,box(.05,.07,.02),eye,s*.075,.02,-.155,g));
 const mouth=add(head,box(.07,.02,.01),mat(0x8a2f2f),0,-.08,-.155,g);[-1,1].forEach(s=>add(head,box(.05,.035,.01),mat(0xf08a7a),s*.1,-.04,-.152,g));
 if(gl)[-1,1].forEach(s=>add(head,new THREE.TorusGeometry(.05,.01,4,4),mat(0x111111),s*.075,.025,-.163,g));
 if(role==='Supervisor')add(head,new THREE.CylinderGeometry(.3,.3,.03,10),mat(0xe8c868),0,.25,0,g);add(head,new THREE.CylinderGeometry(.17,.19,.12,10),mat(0xe8c868),0,.31,0,g);add(head,new THREE.CylinderGeometry(.19,.19,.03,10),mat(0xb23a2a),0,.27,0,g);
 // หูฟัง
 const hp=new THREE.Group();hp.visible=false;head.add(hp);p.hp=hp;
 add(hp,new THREE.TorusGeometry(.2,.018,6,18,Math.PI),mat(0x222222),0,0,0,g);
 [-1,1].forEach(s=>{const c=add(hp,new THREE.CylinderGeometry(.065,.065,.05,12),mat(0x2FBE73),s*.2,0,0,g);c.rotation.z=Math.PI/2});
 p.head=head;p.mouth=mouth;
 const ring=new THREE.Mesh(new THREE.RingGeometry(.9,.98,32),new THREE.MeshBasicMaterial({color:0xf5d442,transparent:true,opacity:0}));ring.rotation.x=-Math.PI/2;ring.position.set(0,.02,.5);g.add(ring);p.ring=ring;
 p.tag=document.createElement('div');p.tag.className='tag';p.tag.innerHTML=`<i style="background:${TEAM[team]}"></i>${nick}`;document.body.appendChild(p.tag);
 p.bubEl=document.createElement('div');p.bubEl.className='bub';document.body.appendChild(p.bubEl);
 S.add(g);P.push(p);seats.push(g);
}
PPL.forEach(person);

/* ---------- seating ---------- */
const place=(g,inst)=>{const s=SLOTS[g.userData.slot],u=g.userData;u.tx=s[0];u.tz=s[1];if(inst){g.position.x=s[0];g.position.z=s[1]}};
function resetSeats(inst){seats.forEach(g=>{const p=g.userData.p;cancelAct(p);const [xi,zi]=SEAT0[p.nick];g.userData.slot=slotAt(xi,zi);place(g,inst)})}
function snap(g){let n=0,b=1e9;SLOTS.forEach((s,i)=>{const d=(s[0]-g.userData.tx)**2+(s[1]-g.userData.tz)**2;if(d<b){b=d;n=i}});
 const o=seats.find(q=>q!==g&&q.userData.slot===n);if(o){cancelAct(o.userData.p);o.userData.slot=g.userData.slot;place(o)}g.userData.slot=n;place(g)}
resetSeats(true);
const KEY='hd3d4';   // เปลี่ยน key เพื่อไม่ให้ที่นั่งเก่าที่เคยบันทึกไว้มาทับผังใหม่
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.length===seats.length&&new Set(s).size===s.length&&s.every(n=>n>=0&&n<20)){seats.forEach((g,i)=>g.userData.slot=s[i]);seats.forEach(g=>place(g,true))}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(seats.map(g=>g.userData.slot)))}catch(e){}};

/* ---------- chat core ---------- */
let chatOn=true;
function say(p,txt,dur,fx){
 if(!fx&&!chatOn)return;
 if(!fx&&P.filter(q=>q!==p&&!q.bubFx&&now()<q.bubUntil).length>=3)return;   // ไม่ให้ฟองคำพูดขึ้นพร้อมกันเกิน 3
 const t=now();p.bub=txt;p.bubUntil=t+dur;p.bubFx=!!fx;if(!fx)p.talkUntil=t+dur;
}
const nod=(p,t)=>{p.nodUntil=t+1.1};
const seatedFree=p=>p.mode==='work'&&p.sit&&!p.g.userData.drag;
const ks=p=>p.fem?'ค่ะ':'ครับ';

function convo(){
 const t=now(),free=P.filter(seatedFree);if(free.length<2)return;
 const a=wpick(free,q=>q.st.talk);if(!a)return;
 let b=null;
 if(a.nick==='Not'&&Math.random()<.55)b=free.find(q=>q.nick==='Gun');
 else if(a.nick==='Gun'&&Math.random()<.35)b=free.find(q=>q.nick==='Not');
 if(b&&(a.nick==='Not'||a.nick==='Gun')){pairChat(a,b,t);return}
 if(!b)b=pick(free.filter(q=>q!==a).sort((x,y)=>dist(x.g.position,a.g.position)-dist(y.g.position,a.g.position)).slice(0,3));
 if(Math.random()<.1){ring(a,t);return}
 say(a,Math.random()<.68?pick(TL[a.team]):pick(GEN),2.8);
 a.look=b;a.lookUntil=t+3;b.look=a;b.lookUntil=t+4.2;
 setTimeout(()=>{
  if(!seatedFree(b))return;
  if(b.nick==='Teen'){nod(b,now());return}                          // Teen เงียบ ทำได้แค่พยักหน้า
  if(Math.random()<clampN(b.st.talk*1.1,.12,1))
   say(b,(a.team!==b.team&&Math.random()<.4)?pick(XR[b.team]):pick(REP),2.2);
  else nod(b,now());
 },1500);
}
function pairChat(a,b,t){          // Not ⇄ Gun คุยเล่นกัน
 if(!seatedFree(a)||!seatedFree(b))return;
 const x=shuf(NG_A),y=shuf(NG_B);
 a.look=b;a.lookUntil=t+5;b.look=a;b.lookUntil=t+5;
 [[a,x[0],0],[b,y[0],2.2]].forEach(([s,txt,d])=>setTimeout(()=>{if(seatedFree(s))say(s,txt,2.4)},d*1000));
}
document.getElementById('bChat').onclick=e=>{const b=e.currentTarget;chatOn=!chatOn;b.classList.toggle('on',chatOn);if(!chatOn)P.forEach(p=>{if(!p.bubFx)p.bubUntil=0;p.talkUntil=0})};
document.getElementById('bReset').onclick=()=>{resetSeats();save()};

/* ---------- เดิน / คิวกิจกรรม ---------- */
const SPD=1.4;
const ACT={
 st:()=>({k:'stand'}),
 w:(x,z)=>({k:'walk',x,z}),
 wait:s=>({k:'wait',s}),
 face:(x,z,s,watch)=>({k:'face',x,z,s,watch}),
 call:fn=>({k:'call',fn}),
 hand:h=>({k:'call',fn:p=>{p.hand=h}}),
 sit:()=>({k:'sit'})};
const walks=pts=>pts.map(([x,z])=>ACT.w(x,z));

// เส้นทางจากที่นั่งไป dest — 'door' | 'screen' | {seat:g}
// ออกทางช่องว่างข้างเก้าอี้ → ทางเดินหลังเก้าอี้ → ทางเดินกลางห้อง (ไม่เดินทะลุโต๊ะ)
function outPts(p,dest){
 const gp=p.g.position,x=gp.x,z=gp.z,s=Math.sign(x),inner=Math.abs(x)<3,gx=s*(inner?1.2:3.2),la=z+1.9;
 const pts=[[gx,z+.8]];
 const same=dest.seat&&Math.abs(dest.seat.position.z-z)<.1;
 if(!inner||same)pts.push([gx,la]);
 if(dest==='door'){
  if(!(la>-1.7&&la<1.7)){if(!inner)pts.push([s*1.2,la]);pts.push([s*1.2,DZ])}   // แถวที่ 3 ทางเดินอยู่ในช่องประตูแล้ว
  pts.push([X0+.45,DZ],[-5.3,DZ]);
 }else if(dest==='screen'){
  if(!inner)pts.push([s*1.2,la]);
  pts.push([0,-9.4]);
 }else{
  const q=dest.seat.position;
  if(!same){if(!inner)pts.push([s*1.2,la]);pts.push([s*1.2,q.z+1.9])}
  pts.push([q.x,q.z+1.65]);
 }
 return pts;
}
function startAct(p,list){p.q=list;p.cur=null;p.mode='act';p.nextAct=1e9;p.px=p.g.position.x;p.pz=p.g.position.z+.8}
function cancelAct(p){
 p.q=[];p.cur=null;p.mode='work';p.sit=true;p.hand=null;p.yawT=0;p.walking=false;p.watch=false;p.out=false;
 p.chair.position.z=0;p.bd.rotation.y=0;p.look=null;p.pointUntil=0;p.nextAct=now()+rnd(4,8);
}
function finishAct(p,t){p.mode='work';p.sit=true;p.hand=null;p.yawT=0;p.watch=false;p.nextAct=t+p.cool}
function stepTo(p,x,z,dt,last){      // เร่งออกตัว/ชะลอก่อนถึงจุดหมาย ไม่หักมุมกระชาก
 const dx=x-p.px,dz=z-p.pz,d=Math.hypot(dx,dz),v=last?Math.min(p.vel,Math.max(.25,d*2.2)):p.vel,s=v*dt;
 p.walking=true;
 if(d<=s){p.px=x;p.pz=z;return true}
 p.px+=dx/d*s;p.pz+=dz/d*s;p.yawT=Math.atan2(-dx,-dz);p.wph+=dt*9*clampN(v/SPD,.25,1.2);return false;
}
function runQ(p,t,dt){
 if(!p.cur){p.cur=p.q.shift();if(!p.cur){finishAct(p,t);return}p.cur.t0=t;p.cur.ph=0}
 const a=p.cur;let done=false;
 if(!(a.k==='walk'||(a.k==='sit'&&!a.ph)))p.walking=false;
 switch(a.k){
  case 'stand':if(!a.ph){a.ph=1;p.sit=false;p.awaySince=t}if(t-a.t0>.55)done=true;break;
  case 'walk':done=stepTo(p,a.x,a.z,dt,!(p.q[0]&&p.q[0].k==='walk'));break;
  case 'wait':done=t-a.t0>=a.s;break;
  case 'face':if(!a.ph){a.ph=1;p.yawT=Math.atan2(-(a.x-p.px),-(a.z-p.pz));p.watch=!!a.watch}
   if(t-a.t0>=a.s){p.watch=false;done=true}break;
  case 'call':a.fn(p,t);done=true;break;
  case 'sit':{
   const hx=p.g.position.x,hz=p.g.position.z+.8;
   if(!a.ph){if(stepTo(p,hx,hz,dt,true)){a.ph=1;a.t1=t;p.sit=true;p.yawT=0}else p.yawT=0}
   else if(t-a.t1>.5)done=true;
   break}
 }
 if(done)p.cur=null;
}

/* ---------- พฤติกรรมเฉพาะตัว ---------- */
function sigh(p,t){p.sighAt=t;say(p,pick(['เฮ้อ…','เฮ้อออ… 😮‍💨','ฮ้าาา…','เฮ้อ ทำไมงานเยอะจัง']),2.3,true)}
function ack(q){                      // รับคำสั่งจาก Ying
 const t=now();
 if(q.nick==='Teen'){nod(q,t);say(q,'👍',1.6,true);return}
 if(q.nick==='Bas'){q.boostUntil=t+10;say(q,pick(['รับทราบครับ!','ครับ เดี๋ยวเช็กเลยครับ','ได้ครับ กำลังดูครับ']),2.2);return}
 if(q.nick==='Aon'){say(q,pick(['ครับ','อืม ครับ']),1.6);return}
 say(q,pick(['รับทราบ'+ks(q),'ได้'+ks(q)+' เดี๋ยวดูให้'+ks(q)]),2.2);
}
function endMode(p,t){p.mode='work';p.nextAct=t+p.cool}
function wake(q,t){
 if(q.mode!=='sleep'&&q.mode!=='music')return;
 const wasSleep=q.mode==='sleep';endMode(q,t);q.startleAt=t;
 say(q,wasSleep?'ฮะ! ไม่ได้หลับนะ 😅':'หา? พูดอะไรนะ 🎧',2.4);
}
function giveOrder(p,t){
 const sleepers=P.filter(q=>q.mode==='sleep'||q.mode==='music');
 const cand=P.filter(q=>q!==p&&seatedFree(q));
 let q=null;
 if(sleepers.length&&(Math.random()<.45||!cand.length))q=pick(sleepers);
 else if(cand.length)q=wpick(cand,x=>x.nick==='Bas'?3:x.team==='Software'?1.6:1);
 if(!q){sigh(p,t);return}
 const n=q.nick;
 say(p,pick([`${n} ช่วยเช็กเคสนี้หน่อย`,`${n} ตรวจสอบให้หน่อยนะ ลูกค้ารออยู่`,`${n} เคสนี้ไปดูหน่อย`,`${n} ตามเรื่องนี้ให้หน่อย`,`${n} อัปเดตสถานะให้ด้วยนะ`,`${n} ดู Ticket ค้างหน่อย`]),2.8);
 p.look=q;p.lookUntil=t+3;p.pointTo={x:q.g.position.x,z:q.g.position.z+.8};p.pointUntil=t+2.4;
 if(q.mode!=='work'){setTimeout(()=>wake(q,now()),1300);return}
 q.look=p;q.lookUntil=t+3;
 setTimeout(()=>{if(seatedFree(q))ack(q)},1500);
 if(Math.random()<.25)setTimeout(()=>{if(seatedFree(p))sigh(p,now())},3600);
}
function askFor(p,q,t){               // ถามหาคนที่ไม่อยู่โต๊ะ
 q.askedAt=t;
 say(p,pick([`${q.nick} ไปไหนอีกแล้ว?`,`ใครเห็น ${q.nick} บ้าง?`,`${q.nick} หายไปไหนอ่ะ`,`${q.nick} ไม่อยู่เหรอ ลูกค้ารออยู่นะ`]),3);
 p.look=q;p.lookUntil=t+3;
 const rs=P.filter(x=>x!==p&&x!==q&&seatedFree(x)&&x.st.talk>.2).sort((a,b)=>dist(a.g.position,q.g.position)-dist(b.g.position,q.g.position));
 if(rs.length){const r=rs[0];setTimeout(()=>{if(!seatedFree(r))return;say(r,pick(ANS[q.why]||ANS._),2.6);r.look=p;r.lookUntil=now()+2.5},1800)}
}
function outing(p,t,kind){            // Not ออกไปซื้อข้าว / น้ำ
 const out=outPts(p,'door'),back=out.slice().reverse(),food=kind==='food',gun=P.find(q=>q.nick==='Gun');
 p.why=kind;p.cool=rnd(55,95);
 if(chatOn){
  say(p,food?'ไปซื้อข้าวนะ 🍱':'ไปซื้อน้ำนะ 🧋',2.4);
  if(gun&&gun!==p&&seatedFree(gun)){gun.look=p;gun.lookUntil=t+3;setTimeout(()=>{if(seatedFree(gun))say(gun,pick(['ฝากด้วยๆ','ซื้อให้ด้วยสิ','มีอะไรฝากมั้ย 555']),2.2)},1400)}
 }
 startAct(p,[ACT.st(),...walks(out),ACT.wait(rnd(10,18)),ACT.hand(food?'bag':'cup'),...walks(back),ACT.sit(),
  ACT.call((q,tt)=>{q.hand=null;if(food)q.foodUntil=tt+14;else q.cupUntil=tt+40;say(q,food?'กินข้าวก่อนนะ 😋':'น้ำเย็นๆ ชื่นใจ 🧋',2.4)})]);
}
const BEH={
 Ying(p,t){
  p.nextAct=t+rnd(16,28);const r=Math.random();
  if(!chatOn){if(r<.4)sigh(p,t);return}
  const gone=P.filter(q=>q!==p&&q.mode==='act'&&!q.sit&&t-q.awaySince>4&&t-q.askedAt>40);
  if(gone.length&&r<.55){askFor(p,pick(gone),t);return}
  if(r<.88){giveOrder(p,t);return}
  sigh(p,t);
 },
 Aon(p,t){p.nextAct=t+rnd(45,90);if(chatOn)say(p,pick(['อืม…','ครับ','โอเค','เดี๋ยวดูให้']),1.8)},
 Bas(p,t){p.nextAct=t+rnd(40,70);if(chatOn)say(p,pick(['กำลังเช็กอยู่ครับ','รอแป๊บนะครับ','เดี๋ยวอัปเดตให้ครับ']),2.2)},
 Teen(p,t){p.nextAct=t+999},
 James(p,t){
  const r=Math.random();
  if(r<.3){p.mode='sleep';p.modeUntil=t+rnd(9,18);p.cool=rnd(25,45);p.fxAt=t+1;return}
  if(r<.55){p.mode='music';p.modeUntil=t+rnd(15,30);p.cool=rnd(25,45);p.fxAt=t;return}
  const door=Math.random()<.55,out=outPts(p,door?'door':'screen'),back=out.slice().reverse();
  p.why=door?'door':'screen';p.cool=rnd(30,55);
  if(door&&chatOn&&Math.random()<.6)say(p,pick(['ไปห้องน้ำแป๊บ','ไปสูดอากาศแป๊บนะ','เดี๋ยวมา']),2.2);
  startAct(p,[ACT.st(),...walks(out),door?ACT.wait(rnd(10,20)):ACT.face(0,-12,rnd(8,13)),...walks(back),ACT.sit()]);
 },
 Ouk(p,t){
  const cand=P.filter(q=>q!==p&&seatedFree(q));
  if(!cand.length){p.nextAct=t+10;return}
  const tp=wpick(cand,q=>1/(1+dist(p.g.position,q.g.position))),out=outPts(p,{seat:tp.g}),back=out.slice().reverse();
  p.why='tour';p.cool=rnd(60,100);
  startAct(p,[ACT.st(),...walks(out),ACT.call(()=>{if(chatOn&&Math.random()<.5)say(p,pick(OUK_L),2.4)}),
   ACT.face(tp.g.position.x,tp.g.position.z,rnd(4,7),true),...walks(back),ACT.sit()]);
 },
 Not(p,t){
  p.nextAct=t+rnd(22,38);const r=Math.random(),gun=P.find(q=>q.nick==='Gun');
  if(r<.5){if(chatOn&&gun)pairChat(p,gun,t);return}
  if(r<.65)outing(p,t,'food');
  else if(r<.8)outing(p,t,'water');
 }
};

/* ---------- camera / input ---------- */
let az=.3,pol=.9,dist_=22,tAz=az,tPol=pol,tD=dist_;const tgt=new THREE.Vector3(0,.8,-1.5),tTgt=tgt.clone();
function cam(dt){const k=1-Math.exp(-dt*8);az+=(tAz-az)*k;pol+=(tPol-pol)*k;dist_+=(tD-dist_)*k;tgt.lerp(tTgt,k);C.position.set(tgt.x+dist_*Math.sin(pol)*Math.sin(az),tgt.y+dist_*Math.cos(pol),tgt.z+dist_*Math.sin(pol)*Math.cos(az));C.lookAt(tgt);fpsBlend(dt)}
function size(){R.setSize(innerWidth,innerHeight);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix();if(innerWidth<700){tD=Math.max(tD,30);dist_=Math.max(dist_,30)}}
addEventListener('resize',size);size();
const rc=new THREE.Raycaster(),mv=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
let drag=null,off=new THREE.Vector3(),orb=null;const cv=R.domElement,tip=document.getElementById('tip');
function ray(e){mv.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);rc.setFromCamera(mv,C)}
function pickSeat(e){ray(e);const h=rc.intersectObjects(seats,true).find(x=>x.object.userData.seat&&x.object.visible!==false&&(x.object.parent?x.object.parent.visible!==false:true));return h&&h.object.userData.seat}
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);const s=fps.on?null:pickSeat(e);
 if(s){cancelAct(s.userData.p);drag=s;s.userData.drag=1;ray(e);rc.ray.intersectPlane(plane,hit);off.copy(s.position).sub(hit);cv.style.cursor='grabbing';tip.style.display='none'}
 else{orb={x:e.clientX,y:e.clientY}}});
cv.addEventListener('pointermove',e=>{
 if(drag){ray(e);if(rc.ray.intersectPlane(plane,hit)){const x=hit.x+off.x,z=hit.z+off.z;drag.userData.tx=clampN(x,-4.4,4.4);drag.userData.tz=clampN(z,-10.2,7)}}
 else if(orb){if(fps.on){fps.tYaw-=(e.clientX-orb.x)*.0045;fps.tPitch=clampN(fps.tPitch-(e.clientY-orb.y)*.0045,-1.25,1.25)}else{tAz-=(e.clientX-orb.x)*.006;tPol=clampN(tPol-(e.clientY-orb.y)*.005,.35,1.45)}orb={x:e.clientX,y:e.clientY}}
 else if(e.pointerType==='mouse'&&!fps.on){const s=pickSeat(e);cv.style.cursor=s?'grab':'default';if(s&&s.userData.p.d){const d=s.userData.p.d;tip.innerHTML=`<b>${d[2]}</b>${d[1]} · ${d[3]} · ${d[4]}`;tip.style.display='block';tip.style.left=e.clientX+14+'px';tip.style.top=e.clientY+14+'px'}else tip.style.display='none'}});
const up=()=>{if(drag){snap(drag);drag.userData.drag=0;drag=null;save()}orb=null;cv.style.cursor='grab'};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();if(fps.on)return;tD=clampN(tD*Math.exp(clampN(e.deltaY,-120,120)*.0009),8,38)},{passive:false});


/* ---------- มุมมอง FPS (บุคคลที่หนึ่ง) ---------- */
const EYE=1.6,COARSE=matchMedia('(pointer:coarse)').matches;
const fps={on:false,x:0,z:6.2,yaw:0,pitch:0,tYaw:0,tPitch:0,vx:0,vz:0,ph:0,bob:0,blend:0,keys:{},joy:{x:0,y:0}};
const FBLK=SLOTS.map(([x,z])=>[x-.85,x+.85,z-.5,z+1.2]),FRAD=.28;     // โต๊ะ+เก้าอี้+คนนั่ง
const fHit=(x,z)=>x<X0+.35||x>X1-.35||z<ZB+.35||z>ZF-.35||FBLK.some(b=>{const dx=x-clampN(x,b[0],b[1]),dz=z-clampN(z,b[2],b[3]);return dx*dx+dz*dz<FRAD*FRAD});
const K=k=>fps.keys[k]?1:0;
const _po=new THREE.Vector3(),_pf=new THREE.Vector3(),_qo=new THREE.Quaternion(),_qf=new THREE.Quaternion(),_ef=new THREE.Euler(0,0,0,'YXZ');
function fpsUpdate(dt){
 const kl=1-Math.exp(-dt*14);fps.yaw+=(fps.tYaw-fps.yaw)*kl;fps.pitch+=(fps.tPitch-fps.pitch)*kl;
 let sp=0;
 if(fps.on){
  fps.tYaw+=(K('arrowleft')-K('arrowright'))*dt*1.8;
  const f=K('w')+K('arrowup')-K('s')-K('arrowdown')-fps.joy.y,r=K('d')-K('a')+fps.joy.x,l=Math.hypot(f,r),sc=l>1?1/l:1,speed=K('shift')?3.6:2.1;
  const sn=Math.sin(fps.yaw),cs=Math.cos(fps.yaw),wx=(-sn*f+cs*r)*sc*speed,wz=(-cs*f-sn*r)*sc*speed,kv=1-Math.exp(-dt*9);
  fps.vx+=(wx-fps.vx)*kv;fps.vz+=(wz-fps.vz)*kv;
  const nx=fps.x+fps.vx*dt,nz=fps.z+fps.vz*dt;
  if(!fHit(nx,fps.z))fps.x=nx;else fps.vx=0;
  if(!fHit(fps.x,nz))fps.z=nz;else fps.vz=0;
  sp=Math.hypot(fps.vx,fps.vz);
 }
 fps.ph+=sp*dt*3.2;fps.bob=Math.sin(fps.ph)*.022*Math.min(1,sp/1.5);
}
function fpsBlend(dt){            // เลื่อนกล้องเข้า/ออกจากมุม FPS แบบนุ่ม
 const tg=fps.on?1:0;fps.blend+=(tg-fps.blend)*(1-Math.exp(-dt*4.5));if(Math.abs(tg-fps.blend)<.003)fps.blend=tg;
 const b=fps.blend,e=b*b*(3-2*b);
 if(b>0){_po.copy(C.position);_qo.copy(C.quaternion);_ef.set(fps.pitch,fps.yaw,0);_qf.setFromEuler(_ef);_pf.set(fps.x,EYE+fps.bob,fps.z);
  C.position.lerpVectors(_po,_pf,e);C.quaternion.copy(_qo).slerp(_qf,e)}
 const fv=45+27*e;if(Math.abs(C.fov-fv)>.01){C.fov=fv;C.updateProjectionMatrix()}
}
const hintEl=document.querySelector('.sub'),hint0=hintEl.textContent,bFps=document.getElementById('bFps');
const joy=document.createElement('div');joy.style.cssText='position:fixed;left:22px;bottom:calc(150px + env(safe-area-inset-bottom,0px));width:110px;height:110px;border-radius:50%;background:rgba(90,52,24,.6);border:3px solid #8b4513;display:none;touch-action:none;z-index:4';
const knob=document.createElement('div');knob.style.cssText='position:absolute;left:35px;top:35px;width:40px;height:40px;border-radius:50%;background:rgba(255,211,92,.95);pointer-events:none';
joy.appendChild(knob);document.body.appendChild(joy);
let jid=null;
const jset=e=>{const r=joy.getBoundingClientRect();let dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2);const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}fps.joy.x=dx;fps.joy.y=dy;knob.style.transform=`translate(${dx*35}px,${dy*35}px)`};
const jend=e=>{if(e.pointerId!==jid)return;jid=null;fps.joy.x=fps.joy.y=0;knob.style.transform='translate(0,0)'};
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(e.pointerId);jset(e);e.stopPropagation()});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)jset(e)});
joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);
function fpsEnter(){
 if(fps.on)return;fps.on=true;fps.x=0;fps.z=6.2;fps.yaw=fps.tYaw=0;fps.pitch=fps.tPitch=-.06;fps.vx=fps.vz=0;
 bFps.classList.add('on');tip.style.display='none';joy.style.display=COARSE?'block':'none';
 hintEl.textContent=COARSE?'มุม FPS: จอยสติ๊กซ้ายล่างเพื่อเดิน · ลากหน้าจอเพื่อมองรอบๆ':'มุม FPS: W A S D เดิน · ลากเมาส์เพื่อมอง · ←/→ หมุนตัว · Shift วิ่ง · Esc ออก';
}
function fpsExit(){
 if(!fps.on)return;fps.on=false;fps.vx=fps.vz=0;fps.joy.x=fps.joy.y=0;knob.style.transform='translate(0,0)';
 bFps.classList.remove('on');joy.style.display='none';hintEl.textContent=hint0;
}
bFps.onclick=()=>fps.on?fpsExit():fpsEnter();
addEventListener('keydown',e=>{const k=e.key.toLowerCase();fps.keys[k]=1;if(fps.on&&['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape')fpsExit()});
addEventListener('keyup',e=>{fps.keys[e.key.toLowerCase()]=0});
addEventListener('blur',()=>{fps.keys={}});

/* ---------- per-person update ---------- */
const DOWN=new THREE.Vector3(0,-1,0),_d=new THREE.Vector3(),vp=new THREE.Vector3(),_q=new THREE.Quaternion(),_e=new THREE.Euler();
function tickP(p,t,dt){
 const g=p.g,bd=p.bd,dr=g.userData.drag;
 // ---- state machine
 if(!dr){
  if(p.mode==='work'){if(t>p.nextAct){
   const f=BEH[p.nick]||GENB;
   const crowd=P.some(q=>q!==p&&q.mode==='act')||P.filter(q=>q!==p&&q.mode!=='work').length>=2;
   if(p.nick!=='Ying'&&crowd)p.nextAct=t+rnd(6,12);else f(p,t);
  }}
  else if(p.mode==='sleep'||p.mode==='music'){
   if(t>p.modeUntil)endMode(p,t);
   else if(t>p.fxAt){
    p.fxAt=t+(p.mode==='sleep'?4.8:4.2);
    say(p,p.mode==='sleep'?pick(['Zzz…','💤 Zzz','z z Z…']):pick(['🎧 ♪ ♫','♫ ♪ ♬','♪ ♪ ♫']),2.3,true);
   }
  }else if(p.mode==='act')runQ(p,t,dt);
 }
 const act=p.mode==='act';if(!act)p.walking=false;
 p.vel+=((p.walking?SPD:0)-p.vel)*(1-Math.exp(-dt*(p.walking?4:10)));
 p.out=act&&p.px<-5.0;
 const tk=t<p.talkUntil&&!p.out;
 {const u=g.userData,kp=1-Math.exp(-dt*(dr?20:7)),ky=1-Math.exp(-dt*12);
  g.position.x+=(u.tx-g.position.x)*kp;g.position.z+=(u.tz-g.position.z)*kp;
  g.position.y+=((dr?.25:0)-g.position.y)*ky;p.ring.material.opacity+=((dr?.9:0)-p.ring.material.opacity)*ky}
 // ---- body placement
 if(act)bd.position.set(p.px-g.position.x,0,p.pz-g.position.z);else{bd.position.set(0,0,.8);p.px=g.position.x;p.pz=g.position.z+.8}
 bd.visible=!p.out;
 p.chair.position.z+=((p.sit?0:.32)-p.chair.position.z)*Math.min(1,dt*8);
 {const st=p.sit?1:0;p.sitK+=(st-p.sitK)*Math.min(1,dt*9);if(Math.abs(st-p.sitK)<.01)p.sitK=st}
 // ---- yaw / look
 let lookA=null;
 if(p.look&&t<p.lookUntil)lookA=Math.atan2(-(p.look.px-p.px),-(p.look.pz-p.pz));
 let yawT=act?p.yawT:(lookA!==null?clampN(wrap(lookA)*.4,-.5,.5):0);
 if(p.mode==='sleep')yawT=0;
 bd.rotation.y+=wrap(yawT-bd.rotation.y)*Math.min(1,dt*7);
 // ---- head
 const sitWork=p.sit&&!act;
 let hy=Math.sin(t*.5+p.ph)*(p.st.calm?.04:.1),hx,hz=0;
 if(lookA!==null)hy=clampN(wrap(lookA-bd.rotation.y),-1.5,1.5);
 if(p.mode==='sleep'){hx=-.8+Math.sin(t*1.3)*.03;hy=.25;hz=.2}
 else{
  hx=-.08+Math.sin(t*1.7+p.ph)*.02;
  if(p.watch)hx=-.3;
  if(p.st.busy>1.4&&sitWork&&lookA===null)hx=-.17;
  if(tk)hx=Math.sin(t*7)*.03;
  if(t<p.nodUntil)hx=-.28*Math.abs(Math.sin((p.nodUntil-t)*8));
  const su=t-p.sighAt;if(su>=0&&su<2.2){const u=su/2.2;hx=u<.4?.3*(u/.4):.3-.65*((u-.4)/.6)}
  const sl=t-p.startleAt;if(sl>=0&&sl<.8)hx=.4*(1-sl/.8);
  if(p.mode==='music'){hx=-.1+Math.sin(t*7)*.12;hy+=Math.sin(t*3.5)*.12;hz=Math.sin(t*3.5)*.05}
 }
 const hk=Math.min(1,dt*10);
 p.head.rotation.x+=(hx-p.head.rotation.x)*hk;p.head.rotation.y+=(hy-p.head.rotation.y)*hk;p.head.rotation.z+=(hz-p.head.rotation.z)*hk;
 p.mouth.scale.y=tk?.6+Math.abs(Math.sin(t*9))*1.3:1;
 p.hp.visible=p.mode==='music';
 // ---- arms
 let a0,a1;
 if(p.mode==='sleep'){a0=a1=1.45}
 else if(p.sit){a0=1.2;a1=tk?1.0+Math.sin(t*3.5)*.08:1.2}
 else{a0=.04;a1=p.hand==='bag'?.15:p.hand==='cup'?.75:tk?.45+Math.sin(t*3.5)*.1:.04}
 if(p.walking){a0=Math.sin(p.wph)*.55;a1=p.hand?a1:-Math.sin(p.wph)*.55}
 const ak=Math.min(1,dt*10);p.ab[0]+=(a0-p.ab[0])*ak;p.ab[1]+=(a1-p.ab[1])*ak;
 let w0=0,w1=0;
 if(p.sit&&p.mode!=='sleep'){const bz=p.st.busy*(t<p.boostUntil?1.7:1);w0=Math.sin(t*11+p.ph)*.07*bz;w1=tk?0:Math.sin(t*13+p.ph*2)*.07*bz}
 p.arms[0].rotation.set(p.ab[0]+w0,0,0);
 if(t<p.pointUntil&&p.pointTo){            // ชี้สั่งงาน
  const dx=p.pointTo.x-p.px,dz=p.pointTo.z-p.pz,c=Math.cos(bd.rotation.y),s=Math.sin(bd.rotation.y);
  const lx=dx*c-dz*s,lz=dx*s+dz*c;_d.set(lx,Math.hypot(lx,lz)*.25,lz).normalize();
  _q.setFromUnitVectors(DOWN,_d);
 }else{_e.set(p.ab[1]+w1,0,0);_q.setFromEuler(_e)}
 p.arms[1].quaternion.slerp(_q,Math.min(1,dt*14));
 p.bagG.visible=p.hand==='bag';p.cupG.visible=p.hand==='cup';
 p.bagG.rotation.x=p.cupG.rotation.x=-p.arms[1].rotation.x;
 // ---- legs / torso
 p.legsSit.visible=p.sitK>=.5;p.legsStand.visible=p.sitK<.5;
 p.lg+=((p.walking?1:0)-p.lg)*Math.min(1,dt*10);
 p.legPv[0].rotation.x=Math.sin(p.wph)*.7*p.lg;p.legPv[1].rotation.x=-Math.sin(p.wph)*.7*p.lg;
 if(p.walking)bd.position.y=Math.abs(Math.sin(p.wph))*.04;
 bd.rotation.x=-Math.sin(p.sitK*Math.PI)*.12;   // โน้มตัวตอนลุก/นั่ง
 const su2=t-p.sighAt;
 p.torso.scale.y=1+Math.sin(t*1.8+p.ph)*.012+((su2>=0&&su2<2.2)?Math.sin(su2/2.2*Math.PI)*.06:0);
 p.food.visible=t<p.foodUntil;p.cp2.visible=t<p.cupUntil;
 if(!(p.sit&&p.mode==='work'&&!g.userData.drag))p.callUntil=0;
 {const rg=t<p.ringUntil,oc=t<p.callUntil;p.led.material.color.setHex(rg?((t*8|0)%2?0xff3030:0x3a1111):oc?0x2fbe73:0x333333);
  p.phone.rotation.z=rg?Math.sin(t*55)*.06:0;const kh=1-Math.exp(-dt*12);p.hs.position.lerp(oc?PH_EAR:PH_REST,kh);p.hs.rotation.x+=((oc?1.35:0)-p.hs.rotation.x)*kh}
 // ---- labels
 p.head.getWorldPosition(vp);vp.y+=.45;vp.project(C);
 const sx=(vp.x+1)/2*innerWidth,sy=(1-vp.y)/2*innerHeight,vis=vp.z<1&&!p.out;
 p.tag.style.display=vis?'flex':'none';p.tag.style.transform=`translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) translate(-50%,-100%)`;
 const on=vis&&t<p.bubUntil&&(chatOn||p.bubFx);p.bubEl.style.opacity=on?1:0;
 if(on){if(p.bubShown!==p.bub){p.bubEl.textContent=p.bubShown=p.bub;p.bubW=p.bubEl.offsetWidth;p.bubH=p.bubEl.offsetHeight}
  p.bubEl.style.transform=`translate3d(${(sx-p.bubW/2).toFixed(1)}px,${(sy-p.bubH-22).toFixed(1)}px,0)`}
}

/* ====================== EXTRAS ======================
   กล้องสำเร็จรูป · นาฬิกา · จอรายโต๊ะ · โทรศัพท์ · เสียง · สุ่มพฤติกรรม · Dashboard
   ==================================================== */
const bkk=()=>new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Bangkok',hour12:false}).split(':').map(Number);
const clockStr=()=>bkk().slice(0,2).map(n=>String(n).padStart(2,'0')).join(':');

/* ---------- นาฬิกาติดผนัง (เวลา Asia/Bangkok) ---------- */
const ck=document.createElement('canvas');ck.width=ck.height=256;const ckx=ck.getContext('2d'),ckt=new THREE.CanvasTexture(ck);
{const rim=add(S,new THREE.CylinderGeometry(.42,.42,.05,32),FR,-3.55,2.35,ZB+.12);rim.rotation.x=Math.PI/2;
 const face=new THREE.Mesh(new THREE.CircleGeometry(.38,32),new THREE.MeshBasicMaterial({map:ckt}));face.position.set(-3.55,2.35,ZB+.16);S.add(face)}
function drawClock(){const [h,m,s]=bkk(),g=ckx,c=128;g.clearRect(0,0,256,256);g.fillStyle='#fff3d6';g.beginPath();g.arc(c,c,124,0,7);g.fill();
 g.strokeStyle='#5a3a1f';g.lineWidth=6;for(let i=0;i<12;i++){const a=i*Math.PI/6,r=i%3?108:96;g.beginPath();g.moveTo(c+Math.sin(a)*r,c-Math.cos(a)*r);g.lineTo(c+Math.sin(a)*114,c-Math.cos(a)*114);g.stroke()}
 const hand=(a,l,w,col)=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(c,c);g.lineTo(c+Math.sin(a)*l,c-Math.cos(a)*l);g.stroke()};
 hand((h%12+m/60)*Math.PI/6,60,9,'#3b2616');hand((m+s/60)*Math.PI/30,88,6,'#3b2616');hand(s*Math.PI/30,98,3,'#e8483a');
 g.fillStyle='#e8483a';g.beginPath();g.arc(c,c,7,0,7);g.fill()}

/* ---------- จอคอมรายโต๊ะ: สีตามทีมของคนที่นั่ง, ขยับตามสถานะ ---------- */
function drawScr(d,i,t){
 const o=seats.find(g=>g.userData.slot===i),p=o&&o.userData.p,g=d.cv;
 if(!p){g.fillStyle='#120b05';g.fillRect(0,0,128,80);return}
 if(!(p.mode==='work'&&p.sit&&!o.userData.drag)){      // หลับ/ฟังเพลง/ไม่อยู่ → screensaver เด้งไปมา
  g.fillStyle='#1e1409';g.fillRect(0,0,128,80);g.fillStyle=TEAM[p.team];
  g.fillRect(Math.abs((t*8+d.seed*9)%180-90)+8,Math.abs((t*5+d.seed*5)%100-50)+10,22,10);return}
 g.fillStyle='#f6e9c8';g.fillRect(0,0,128,80);
 g.fillStyle=(t<p.ringUntil&&(t*6|0)%2)?'#e8483a':TEAM[p.team];g.fillRect(0,0,128,11);
 const sp=Math.floor(t*p.st.busy*.7+d.seed);
 for(let k=0;k<7;k++){g.fillStyle=k%3?'#c9a878':TEAM[p.team];g.fillRect(6,18+k*9,24+((k*37+sp*(k+5)*11)%80),4)}
}

/* ---------- โทรศัพท์: ดัง → รับสาย → วางสาย ---------- */
const PH_REST=new THREE.Vector3(.58,.83,-.2),PH_EAR=new THREE.Vector3(.2,1.2,.74);
function ring(p,t){
 if(t<p.ringUntil||t<p.callUntil)return;
 p.ringUntil=t+2.4;sfxRing();if(!LIVE)TK[p.team].o++;say(p,'📞 กริ๊งงง...',1.8);
 setTimeout(()=>{if(!seatedFree(p))return;const d=rnd(5,9);p.callUntil=now()+d;say(p,'Helpdesk สวัสดี'+ks(p)+' ยินดีให้บริการ'+ks(p),3);
  setTimeout(()=>{p.callUntil=0},d*1000)},2400);
}

/* ---------- สุ่มพฤติกรรมให้ทุกคน (ไม่ใช่แค่คนที่มีสคริปต์เฉพาะ) ---------- */
function visit(p,q,t){const out=outPts(p,{seat:q.g}),back=out.slice().reverse();p.why='tour';p.cool=rnd(60,100);
 startAct(p,[ACT.st(),...walks(out),ACT.face(q.g.position.x,q.g.position.z,rnd(4,8),true),ACT.call(()=>{if(chatOn)say(p,pick(GEN),2.4)}),...walks(back),ACT.sit()])}
function GENB(p,t){
 p.nextAct=t+rnd(40,90);const r=Math.random();
 if(r<.2)ring(p,t);
 else if(r<.34)sigh(p,t);
 else if(r<.52){const q=wpick(P.filter(x=>x!==p&&seatedFree(x)),x=>1/(1+dist(p.g.position,x.g.position)));if(q)visit(p,q,t)}
 else if(r<.64)outing(p,t,Math.random()<.5?'food':'water');
 else if(r<.72){p.mode='music';p.modeUntil=t+rnd(12,30);p.cool=rnd(25,45);p.fxAt=t}
 else if(r<.78){p.mode='sleep';p.modeUntil=t+rnd(8,16);p.cool=rnd(25,45);p.fxAt=t+1}
 else if(chatOn)say(p,pick(TL[p.team]),2.6);
}
P.forEach(p=>{p.st.talk*=rnd(.75,1.3)});

/* ---------- ข้อมูล Dashboard (จำลอง — ส่งข้อมูลจริงเข้ามาได้ด้วย postMessage) ---------- */
let LIVE=false,resp=rnd(2.5,6);
const TK={};Object.keys(TEAM).forEach(k=>TK[k]={o:rnd(3,12)|0,d:rnd(12,40)|0});
const HIST=Array.from({length:40},()=>rnd(18,36));
// ตัวอย่าง: parent.postMessage({type:'tickets',data:{Software:{o:5,d:30},Makro:{o:2,d:18},CFW:{o:4,d:22},B2B:{o:1,d:9}}},'*')
addEventListener('message',e=>{const m=e.data;if(m&&m.type==='tickets'&&m.data){LIVE=true;Object.keys(TEAM).forEach(k=>{if(m.data[k])Object.assign(TK[k],m.data[k])})}});
function drift(){if(LIVE)return;const x=TK[pick(Object.keys(TK))];if(Math.random()<.55&&x.o>0){x.o--;x.d++}else x.o++;
 resp=clampN(resp+rnd(-.4,.4),1.5,9);HIST.push(Object.values(TK).reduce((s,v)=>s+v.o,0));HIST.shift()}
const DASH=[];
function dashboard(x,y,z,ry,w,h,kind,title){
 const cv=document.createElement('canvas');const pt=h>w;cv.width=pt?288:512;cv.height=pt?512:288;const tx=new THREE.CanvasTexture(cv);
 const gr=new THREE.Group();gr.position.set(x,y,z);gr.rotation.y=ry;S.add(gr);add(gr,box(w+.1,h+.1,.05),FR,0,0,0);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx}));m.position.z=.03;gr.add(m);
 DASH.push({g:cv.getContext('2d'),tx,kind,title,W:cv.width,H:cv.height});
}
dashboard(3.55,1.9,ZB+.125,0,2.0,1.15,'tickets','Tickets วันนี้');            // ผนังหลังห้อง 1 เครื่อง
// ผนังขวา: คู่แนวตั้งข้าง Teen (z≈-5.6) · คู่แนวนอนระหว่าง Bas กับ Ying (z≈4.6)
dashboard(X1-.125,2.2,-6.115,-Math.PI/2,.95,1.69,'sla','SLA วันนี้');
dashboard(X1-.125,2.2,-5.085,-Math.PI/2,.95,1.69,'team','สถานะทีม');
dashboard(X1-.125,2.2,3.81,-Math.PI/2,1.5,.85,'trend','แนวโน้ม Ticket ค้าง');
dashboard(X1-.125,2.2,5.39,-Math.PI/2,1.5,.85,'open','ค้างแยกตามทีม');
function drawDash(D){
 const g=D.g,W=D.W,H=D.H,PT=W<H,tot=Object.values(TK).reduce((a,v)=>({o:a.o+v.o,d:a.d+v.d}),{o:0,d:0}),sla=Math.round(tot.d/Math.max(1,tot.o+tot.d)*100),F="'Mali',sans-serif",scol=sla>=85?'#6fbf4a':'#F5B83D';
 const T=(s,x,y,sz,c,al)=>{g.font=`600 ${sz}px ${F}`;g.fillStyle=c;g.textAlign=al||'left';g.textBaseline='middle';g.fillText(s,x,y)};
 const line=(x0,x1,yb,hh)=>{const lo=Math.min(...HIST),hi=Math.max(...HIST)+1;g.strokeStyle='#6fbf4a';g.lineWidth=3;g.lineJoin='round';g.beginPath();HIST.forEach((v,i)=>{const x=x0+i*(x1-x0)/(HIST.length-1),y=yb-(v-lo)/(hi-lo)*hh;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke()};
 g.fillStyle='#3b2616';g.fillRect(0,0,W,H);g.fillStyle='#5a3a1f';g.fillRect(0,0,W,44);g.fillStyle='#6fbf4a';g.fillRect(0,0,8,44);
 T(D.title,22,23,22,'#fff3d6');T(clockStr(),W-16,23,18,'#ffd35c','right');
 if(D.kind==='tickets'){
  Object.entries(TK).forEach(([k,v],i)=>{const y=62+i*50,f=v.d/Math.max(1,v.d+v.o);
   T(k,22,y+12,20,TEAM[k]);g.fillStyle='#7a5230';g.fillRect(150,y+2,240,20);g.fillStyle=TEAM[k];g.fillRect(150,y+2,240*f,20);T(v.d+' / '+v.o,W-16,y+12,20,'#fff3d6','right')});
  T('รวม ปิด '+tot.d+' · ค้าง '+tot.o,22,268,16,'#fff3d6');T('ปิดแล้ว / ค้าง',W-16,268,14,'#d8b98a','right');
 }else if(D.kind==='sla'){
  if(PT){
   T('SLA วันนี้',W/2,84,18,'#d8b98a','center');T(sla+'%',W/2,170,88,scol,'center');
   T('ตอบกลับเฉลี่ย',W/2,248,18,'#fff3d6','center');T(resp.toFixed(1)+' นาที',W/2,282,28,'#fff3d6','center');
   line(22,W-22,462,120);T('Ticket ค้างล่าสุด',22,490,13,'#d8b98a');
  }else{
   T('SLA วันนี้',W/2,70,18,'#d8b98a','center');T(sla+'%',W/2,120,84,scol,'center');
   T('ตอบกลับเฉลี่ย '+resp.toFixed(1)+' นาที',W/2,176,20,'#fff3d6','center');
   line(30,W-30,262,52);T('Ticket ค้างล่าสุด',22,278,12,'#d8b98a');
  }
 }else if(D.kind==='trend'){
  g.strokeStyle='#7a5230';g.lineWidth=1;for(let k=0;k<4;k++){const y=70+k*50;g.beginPath();g.moveTo(24,y);g.lineTo(W-24,y);g.stroke()}
  line(24,W-24,220,150);
  T('Ticket ค้างล่าสุด '+Math.round(HIST[HIST.length-1]),22,262,16,'#fff3d6');
  T('สูงสุด '+Math.round(Math.max(...HIST))+' · ต่ำสุด '+Math.round(Math.min(...HIST)),W-22,262,14,'#d8b98a','right');
 }else if(D.kind==='open'){
  Object.entries(TK).forEach(([k,v],i)=>{const x=22+i*118;g.fillStyle='#5a3a1f';g.fillRect(x,64,106,150);
   T(k,x+53,86,16,TEAM[k],'center');T(String(v.o),x+53,138,58,'#fff3d6','center');T('ค้าง',x+53,184,14,'#d8b98a','center');T('ปิด '+v.d,x+53,203,13,TEAM[k],'center')});
  T('Ticket ค้างแยกตามทีม รวม '+tot.o,22,258,16,'#fff3d6');
 }else{
  const t=now(),c={w:0,c:0,a:0,b:0};P.forEach(p=>{if(p.mode==='act'&&!p.sit)c.a++;else if(p.mode==='sleep'||p.mode==='music')c.b++;else if(t<p.callUntil)c.c++;else c.w++});
  const cells=[['ทำงาน',c.w,'#6fbf4a'],['สายเข้า',c.c,'#4fa3dc'],['ไม่อยู่โต๊ะ',c.a,'#F5B83D'],['พัก',c.b,'#d8b98a']];
  const dot=(p,x,y)=>{const away=p.mode==='act'&&!p.sit;g.beginPath();g.arc(x,y,16,0,7);g.fillStyle=away?'#4a3320':TEAM[p.team];g.fill();T(p.nick.slice(0,3),x,y+1,11,away?'#9a7b55':'#3b2616','center')};
  if(PT){
   cells.forEach(([n,v,col],i)=>{const x=22+(i%2)*133,y=62+((i/2)|0)*104;g.fillStyle='#5a3a1f';g.fillRect(x,y,111,92);T(v,x+55,y+36,40,col,'center');T(n,x+55,y+72,15,'#fff3d6','center')});
   P.forEach((p,i)=>dot(p,36+(i%5)*54,290+((i/5)|0)*56));
  }else{
   cells.forEach(([n,v,col],i)=>{const x=22+i*118;g.fillStyle='#5a3a1f';g.fillRect(x,60,106,86);T(v,x+53,92,40,col,'center');T(n,x+53,130,15,'#fff3d6','center')});
   P.forEach((p,i)=>dot(p,36+(i%9)*52,185+((i/9)|0)*52));
  }
 }
}

/* ---------- เสียงบรรยากาศ (WebAudio สังเคราะห์ ไม่ใช้ไฟล์) ---------- */
const snd={on:false};
function sndToggle(b){
 snd.on=!snd.on;b.classList.toggle('on',snd.on);
 if(snd.on&&!snd.ctx){const c=snd.ctx=new(window.AudioContext||window.webkitAudioContext)();snd.master=c.createGain();snd.master.connect(c.destination);
  const nb=snd.nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const n=c.createBufferSource();n.buffer=nb;n.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=c.createGain();g.gain.value=.05;n.connect(f);f.connect(g);g.connect(snd.master);n.start()}   // เสียงแอร์
 if(snd.ctx){snd.master.gain.value=snd.on?.7:0;if(snd.on)snd.ctx.resume()}
}
function sfxClick(v){const c=snd.ctx,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
 s.buffer=snd.nb;f.type='bandpass';f.frequency.value=rnd(2200,4200);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.04);s.connect(f);f.connect(g);g.connect(snd.master);s.start(t,Math.random()*.5,.05)}
function sfxRing(){if(!snd.on||!snd.ctx)return;const c=snd.ctx,t=c.currentTime;
 for(let i=0;i<8;i++){const o=c.createOscillator(),g=c.createGain(),s=t+i*.27;o.type='square';o.frequency.value=i%2?660:524;g.gain.setValueAtTime(.0001,s);g.gain.linearRampToValueAtTime(.035,s+.02);g.gain.setValueAtTime(.035,s+.2);g.gain.linearRampToValueAtTime(.0001,s+.24);o.connect(g);g.connect(snd.master);o.start(s);o.stop(s+.26)}}

/* ---------- มุมกล้องสำเร็จรูป ---------- */
const VIEWS={all:{az:.3,pol:.9,d:()=>innerWidth<700?30:22,t:[0,.8,-1.5]},top:{az:0,pol:.36,d:26,t:[0,0,-1.5]},
 eye:{az:.25,pol:1.4,d:7.5,t:[0,1.1,-1]},door:{az:-1.25,pol:1.05,d:20,t:[0,.8,-1.5]}};
function goView(k){if(fps.on)fpsExit();const v=VIEWS[k];tAz=az+wrap(v.az-az);tPol=v.pol;tD=typeof v.d==='function'?v.d():v.d;tTgt.set(...v.t)}
document.querySelectorAll('#views [data-v]').forEach(b=>b.onclick=()=>goView(b.dataset.v));
document.getElementById('bSnd').onclick=e=>sndToggle(e.currentTarget);

/* ---------- ตัวคุมเวลา (เรียกทุกเฟรม) ---------- */
const SKYK=[[0,0x1c2350,.4,.25],[5,0x34386e,.5,.35],[6.5,0xf4a56e,.8,.6],[8,0x9bd4f5,.95,.75],[16.5,0x9bd4f5,.95,.75],[18.2,0xf08a5a,.8,.55],[19.8,0x2a2d62,.5,.3],[24,0x1c2350,.4,.25]];
const clkEl=document.getElementById('clk');
function skyUpdate(){const [h,m]=bkk(),x=h+m/60;let i=1;while(i<SKYK.length-1&&SKYK[i][0]<x)i++;const a=SKYK[i-1],b=SKYK[i],u=clampN((x-a[0])/(b[0]-a[0]),0,1);
 S.background.copy(new THREE.Color(a[1]).lerp(new THREE.Color(b[1]),u));S.fog.color.copy(S.background);HL.intensity=a[2]+(b[2]-a[2])*u;sun.intensity=a[3]+(b[3]-a[3])*u;
 sun.color.setHex((x>16.5&&x<20)||(x>5&&x<8)?0xffb070:0xffe9c0);
 if(clkEl)clkEl.textContent=new Date().toLocaleDateString('th-TH',{timeZone:'Asia/Bangkok',weekday:'short'})+' · '+clockStr()+(x>6.5&&x<18?' ☀️':' 🌙')}
let skyNext=0,scrNext=0,dashNext=0,tkNext=0,keyNext=0,dirNext=now()+rnd(20,40);
function extras(t){
 if(t>skyNext){skyNext=t+2;skyUpdate()}
 if(t>scrNext){scrNext=t+.33;DESKS.forEach((d,i)=>{drawScr(d,i,t);d.tx.needsUpdate=true})}
 if(t>tkNext){tkNext=t+rnd(6,12);drift()}
 if(t>dashNext){dashNext=t+1;DASH.forEach(D=>{drawDash(D);D.tx.needsUpdate=true});drawClock();ckt.needsUpdate=true}
 if(t>dirNext){dirNext=t+rnd(30,70);const f=P.filter(seatedFree);if(f.length&&Math.random()<.5)ring(pick(f),t)}   // สายเข้าแบบสุ่ม
 if(snd.on&&t>keyNext){const n=P.filter(p=>p.mode==='work'&&p.sit).length;keyNext=t+rnd(.05,.3)*8/Math.max(2,n);sfxClick(rnd(.03,.07))}
}

/* ---------- loop ---------- */
let next=4,last=0;
function loop(ms){requestAnimationFrame(loop);const t=ms/1000,dt=Math.min(.05,Math.max(0,t-last));last=t;
 if(chatOn&&t>next){next=t+5+Math.random()*4;convo()}
 fpsUpdate(dt);cam(dt);C.updateMatrixWorld();
 {const k=1-Math.exp(-dt*6);CUT.forEach(m=>{const tg=m.userData.test()?.1:1;m.opacity+=(tg-m.opacity)*k;m.depthWrite=m.opacity>.95})}
 P.forEach(p=>tickP(p,t,dt));
 extras(t);
 R.render(S,C)}
requestAnimationFrame(loop);
