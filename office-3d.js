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
const TEAM={Software:'#2FBE73',Makro:'#F5B83D',CFW:'#9AD84B',B2B:'#5BB8F5'};
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
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.shadowMap.enabled=true;
document.body.appendChild(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color(0x0E211A);S.fog=new THREE.Fog(0x0E211A,45,90);
const C=new THREE.PerspectiveCamera(45,1,.1,100);
S.add(new THREE.HemisphereLight(0xffffff,0x4a5a50,.85));
const sun=new THREE.DirectionalLight(0xffffff,.7);sun.position.set(6,14,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:50});S.add(sun);

const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.7},o));
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
function add(par,geo,m,x,y,z,seat){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;if(seat)o.userData.seat=seat;par.add(o);return o}
function canvasTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return new THREE.CanvasTexture(c)}

/* ---------- room ---------- */
const X0=-4.85,X1=4.85,ZB=-10.5,ZF=7.5,D0=-1.9,D1=1.6,ZC=(ZB+ZF)/2,WL=ZF-ZB;
const DZ=(D0+D1)/2;                       // กึ่งกลางประตู (ผนังซ้าย)
const tile=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#9a9b94';g.fillRect(0,0,w,h);g.strokeStyle='#7d7e78';g.lineWidth=3;for(let i=0;i<=8;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,h);g.moveTo(0,i*64);g.lineTo(w,i*64);g.stroke()}});
tile.wrapS=tile.wrapT=THREE.RepeatWrapping;tile.repeat.set(4,8);
add(S,box(X1-X0+.4,.2,WL),mat(0xffffff,{map:tile}),0,-.1,ZC);
const WM=mat(0x5b5f5e),WR=mat(0x4c504f),FR=mat(0x1b1d1c);
add(S,box(X1-X0+.4,3.4,.2),WM,0,1.7,ZB);
const seg=(x,m,a,b)=>add(S,box(.2,3.4,b-a),m,x,1.7,(a+b)/2);
seg(X1,WR,ZB,ZF);const GL=mat(0xa8e0d8,{transparent:true,opacity:.16,roughness:.05,metalness:.2,depthWrite:false,side:THREE.DoubleSide}),GF=mat(0x2b3331,{roughness:.5}),FZ=mat(0xffffff,{transparent:true,opacity:.35,depthWrite:false});
const gl=(w,h,d,x,y,z,m)=>{const o=add(S,box(w,h,d),m,x,y,z);o.castShadow=o.receiveShadow=false;return o};
[[ZB,D0],[D1,ZF]].forEach(([a,b])=>{const L=b-a,c=(a+b)/2,n=Math.max(1,Math.round(L/2.2));
 gl(.06,3.2,L,X0,1.7,c,GL);gl(.1,.07,L,X0,3.35,c,GF);gl(.1,.07,L,X0,.04,c,GF);gl(.08,.3,L,X0,1.25,c,FZ);
 for(let i=0;i<=n;i++)gl(.1,3.4,.06,X0,1.7,a+L*i/n,GF)});
{const W=X1-X0+.2;gl(W,3.2,.06,0,1.7,ZF,GL);gl(W,.07,.1,0,3.35,ZF,GF);gl(W,.07,.1,0,.04,ZF,GF);gl(W,.3,.08,0,1.25,ZF,FZ);
 for(let i=0;i<=4;i++)gl(.06,3.4,.1,X0-.1+W*i/4,1.7,ZF,GF)}
[D0,D1].forEach(z=>add(S,box(.25,3.2,.12),FR,X0,1.6,z));add(S,box(.25,.2,D1-D0+.12),FR,X0,3.1,(D0+D1)/2);add(S,box(.1,.1,D1-D0),new THREE.MeshBasicMaterial({color:0x2FBE73}),X0,2.9,(D0+D1)/2);
const board=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#e9d9b8';g.fillRect(0,0,w/2,h);g.fillStyle='#4fc3a1';[[90,80,60],[140,150,45],[70,170,40],[190,60,30]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill()});
 g.fillStyle='#f8c9c0';g.fillRect(w/2,0,w/2,h);g.fillStyle='#1fae7a';g.fillRect(w/2,0,w/2,28);g.fillStyle='#fff';g.fillRect(w/2+10,8,100,10);
 for(let i=0;i<9;i++){g.fillStyle='#b05a5a';g.fillRect(w/2+14,44+i*22,60,8);g.fillStyle='#2fbe73';g.fillRect(w/2+110+i%3*30,42+i*22,14,12)}});
add(S,box(4.6,2.4,.06),FR,0,1.9,ZB+.08);add(S,box(4.4,2.2,.08),mat(0xffffff,{map:board}),0,1.9,ZB+.12);

/* ---------- desks ---------- */
const scrTex=canvasTex(128,80,(g,w,h)=>{g.fillStyle='#e7eef6';g.fillRect(0,0,w,h);g.fillStyle='#2a5f9e';g.fillRect(0,0,w,10);for(let i=0;i<7;i++){g.fillStyle=i%3?'#9db3c9':'#2fbe73';g.fillRect(6,18+i*9,40+(i*17)%70,4)}});
const M={white:mat(0xe6e8e4),panel:mat(0xcfd2cd),black:mat(0x161818),shirt:mat(0x3b93f5),pants:mat(0x2b3140),scr:new THREE.MeshBasicMaterial({map:scrTex}),bottle:mat(0x7fc0ff,{transparent:true,opacity:.6})};
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
  nextAct:now()+rnd(2,45),cool:10,modeUntil:0,fxAt:0,nodUntil:0,sighAt:-99,startleAt:-99,pointUntil:0,pointTo:null,boostUntil:0,watch:false,
  foodUntil:0,cupUntil:0,awaySince:-99,askedAt:-99,ab:[1.2,1.2],ringUntil:0,callUntil:0};
 g.userData.p=p;const skin=mat(SKIN[i%3]);
 // เก้าอี้ (แยกกลุ่มเพื่อให้เลื่อนออกเวลาลุก)
 const chair=new THREE.Group();g.add(chair);p.chair=chair;
 const Ch=(geo,m,x,y,z)=>add(chair,geo,m,x,y,z,g);
 Ch(box(.5,.06,.5),M.black,0,.48,.85);Ch(box(.5,.55,.06),M.black,0,.82,1.12);Ch(new THREE.CylinderGeometry(.04,.04,.4,8),M.black,0,.25,.85);
 // ตัวคน (กลุ่ม bd ย้าย/หมุนได้อิสระ)
 const bd=new THREE.Group();bd.position.set(0,0,.8);g.add(bd);p.bd=bd;
 const B=(geo,m,x,y,z)=>add(bd,geo,m,x,y,z,g);
 p.torso=B(box(.42,.5,.24),M.shirt,0,.8,0);
 const ls=new THREE.Group();bd.add(ls);p.legsSit=ls;
 [-1,1].forEach(s=>{add(ls,box(.16,.14,.5),M.pants,s*.1,.6,-.25,g);add(ls,box(.14,.5,.14),M.pants,s*.1,.3,-.5,g)});
 const lt=new THREE.Group();lt.visible=false;bd.add(lt);p.legsStand=lt;
 p.legPv=[-1,1].map(s=>{const pv=new THREE.Group();pv.position.set(s*.1,.58,0);add(pv,box(.14,.58,.14),M.pants,0,-.29,0,g);lt.add(pv);return pv});
 p.arms=[-1,1].map(s=>{const pv=new THREE.Group();pv.position.set(s*.27,1.02,0);add(pv,box(.09,.55,.09),M.shirt,0,-.275,0,g);add(pv,new THREE.SphereGeometry(.05,8,6),skin,0,-.56,0,g);bd.add(pv);return pv});
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
 const head=new THREE.Group();head.position.set(0,1.22,0);bd.add(head);
 add(head,new THREE.SphereGeometry(.17,16,14),skin,0,0,0,g);
 const hm=mat(hair);
 if(fem){add(head,box(.36,.36,.1),hm,0,-.06,.12,g);add(head,new THREE.SphereGeometry(.185,14,8,0,6.3,0,1.5),hm,0,.01,.01,g)}
 else add(head,new THREE.SphereGeometry(.18,14,8,0,6.3,0,1.35),hm,0,.02,.02,g);
 const eye=mat(0x111111);[-1,1].forEach(s=>add(head,new THREE.SphereGeometry(.022,6,6),eye,s*.06,.02,-.155,g));
 const mouth=add(head,box(.06,.012,.01),mat(0x8a2f2f),0,-.07,-.165,g);
 if(gl)[-1,1].forEach(s=>add(head,new THREE.TorusGeometry(.045,.008,6,14),mat(0x111111),s*.065,.025,-.16,g));
 if(role==='Supervisor')add(head,new THREE.ConeGeometry(.06,.1,5),mat(0x9AD84B,{emissive:0x335511}),0,.26,0,g);
 // หูฟัง
 const hp=new THREE.Group();hp.visible=false;head.add(hp);p.hp=hp;
 add(hp,new THREE.TorusGeometry(.2,.018,6,18,Math.PI),mat(0x222222),0,0,0,g);
 [-1,1].forEach(s=>{const c=add(hp,new THREE.CylinderGeometry(.065,.065,.05,12),mat(0x2FBE73),s*.2,0,0,g);c.rotation.z=Math.PI/2});
 p.head=head;p.mouth=mouth;
 const ring=new THREE.Mesh(new THREE.RingGeometry(.9,.98,32),new THREE.MeshBasicMaterial({color:0x9AD84B,transparent:true,opacity:0}));ring.rotation.x=-Math.PI/2;ring.position.set(0,.02,.5);g.add(ring);p.ring=ring;
 p.tag=document.createElement('div');p.tag.className='tag';p.tag.innerHTML=`<i style="background:${TEAM[team]}"></i>${nick}`;document.body.appendChild(p.tag);
 p.bubEl=document.createElement('div');p.bubEl.className='bub';document.body.appendChild(p.bubEl);
 S.add(g);P.push(p);seats.push(g);
}
PPL.forEach(person);

/* ---------- seating ---------- */
const place=g=>{const s=SLOTS[g.userData.slot];g.position.x=s[0];g.position.z=s[1]};
function resetSeats(){seats.forEach(g=>{const p=g.userData.p;cancelAct(p);const [xi,zi]=SEAT0[p.nick];g.userData.slot=slotAt(xi,zi);place(g)})}
function snap(g){let n=0,b=1e9;SLOTS.forEach((s,i)=>{const d=(s[0]-g.position.x)**2+(s[1]-g.position.z)**2;if(d<b){b=d;n=i}});
 const o=seats.find(q=>q!==g&&q.userData.slot===n);if(o){cancelAct(o.userData.p);o.userData.slot=g.userData.slot;place(o)}g.userData.slot=n;place(g)}
resetSeats();
const KEY='hd3d4';   // เปลี่ยน key เพื่อไม่ให้ที่นั่งเก่าที่เคยบันทึกไว้มาทับผังใหม่
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.length===seats.length&&new Set(s).size===s.length&&s.every(n=>n>=0&&n<20)){seats.forEach((g,i)=>g.userData.slot=s[i]);seats.forEach(place)}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(seats.map(g=>g.userData.slot)))}catch(e){}};

/* ---------- chat core ---------- */
let chatOn=true;
function say(p,txt,dur,fx){
 if(!fx&&!chatOn)return;
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
 if(Math.random()<.2){ring(a,t);return}
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
 a.look=b;a.lookUntil=t+8;b.look=a;b.lookUntil=t+8;
 [[a,x[0],0],[b,y[0],1.9],[a,x[1],4],[b,y[1],5.9]].forEach(([s,txt,d])=>setTimeout(()=>{if(seatedFree(s))say(s,txt,2.4)},d*1000));
}
document.getElementById('bChat').onclick=e=>{const b=e.currentTarget;chatOn=!chatOn;b.classList.toggle('on',chatOn);if(!chatOn)P.forEach(p=>{if(!p.bubFx)p.bubUntil=0;p.talkUntil=0})};
document.getElementById('bReset').onclick=()=>{resetSeats();save()};

/* ---------- เดิน / คิวกิจกรรม ---------- */
const SPD=1.5;
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
function stepTo(p,x,z,dt){
 const dx=x-p.px,dz=z-p.pz,d=Math.hypot(dx,dz),s=SPD*dt;
 if(d<=s){p.px=x;p.pz=z;return true}
 p.px+=dx/d*s;p.pz+=dz/d*s;p.yawT=Math.atan2(-dx,-dz);p.walking=true;p.wph+=dt*9;return false;
}
function runQ(p,t,dt){
 if(!p.cur){p.cur=p.q.shift();if(!p.cur){finishAct(p,t);return}p.cur.t0=t;p.cur.ph=0}
 const a=p.cur;let done=false;
 switch(a.k){
  case 'stand':if(!a.ph){a.ph=1;p.sit=false;p.awaySince=t}if(t-a.t0>.55)done=true;break;
  case 'walk':done=stepTo(p,a.x,a.z,dt);break;
  case 'wait':done=t-a.t0>=a.s;break;
  case 'face':if(!a.ph){a.ph=1;p.yawT=Math.atan2(-(a.x-p.px),-(a.z-p.pz));p.watch=!!a.watch}
   if(t-a.t0>=a.s){p.watch=false;done=true}break;
  case 'call':a.fn(p,t);done=true;break;
  case 'sit':{
   const hx=p.g.position.x,hz=p.g.position.z+.8;
   if(!a.ph){if(stepTo(p,hx,hz,dt)){a.ph=1;a.t1=t;p.sit=true;p.yawT=0}else p.yawT=0}
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
 p.why=kind;p.cool=rnd(22,40);
 if(chatOn){
  say(p,food?'ไปซื้อข้าวนะ 🍱':'ไปซื้อน้ำนะ 🧋',2.4);
  if(gun&&gun!==p&&seatedFree(gun)){gun.look=p;gun.lookUntil=t+3;setTimeout(()=>{if(seatedFree(gun))say(gun,pick(['ฝากด้วยๆ','ซื้อให้ด้วยสิ','มีอะไรฝากมั้ย 555']),2.2)},1400)}
 }
 startAct(p,[ACT.st(),...walks(out),ACT.wait(rnd(10,18)),ACT.hand(food?'bag':'cup'),...walks(back),ACT.sit(),
  ACT.call((q,tt)=>{q.hand=null;if(food)q.foodUntil=tt+14;else q.cupUntil=tt+40;say(q,food?'กินข้าวก่อนนะ 😋':'น้ำเย็นๆ ชื่นใจ 🧋',2.4)})]);
}
const BEH={
 Ying(p,t){
  p.nextAct=t+rnd(7,13);const r=Math.random();
  if(!chatOn){if(r<.4)sigh(p,t);return}
  const gone=P.filter(q=>q!==p&&q.mode==='act'&&!q.sit&&t-q.awaySince>4&&t-q.askedAt>40);
  if(gone.length&&r<.55){askFor(p,pick(gone),t);return}
  if(r<.88){giveOrder(p,t);return}
  sigh(p,t);
 },
 Aon(p,t){p.nextAct=t+rnd(45,90);if(chatOn)say(p,pick(['อืม…','ครับ','โอเค','เดี๋ยวดูให้']),1.8)},
 Bas(p,t){p.nextAct=t+rnd(22,40);if(chatOn)say(p,pick(['กำลังเช็กอยู่ครับ','รอแป๊บนะครับ','เดี๋ยวอัปเดตให้ครับ']),2.2)},
 Teen(p,t){p.nextAct=t+999},
 James(p,t){
  const r=Math.random();
  if(r<.3){p.mode='sleep';p.modeUntil=t+rnd(9,18);p.cool=rnd(8,14);p.fxAt=t+1;return}
  if(r<.55){p.mode='music';p.modeUntil=t+rnd(15,30);p.cool=rnd(8,14);p.fxAt=t;return}
  const door=Math.random()<.55,out=outPts(p,door?'door':'screen'),back=out.slice().reverse();
  p.why=door?'door':'screen';p.cool=rnd(7,14);
  if(door&&chatOn&&Math.random()<.6)say(p,pick(['ไปห้องน้ำแป๊บ','ไปสูดอากาศแป๊บนะ','เดี๋ยวมา']),2.2);
  startAct(p,[ACT.st(),...walks(out),door?ACT.wait(rnd(10,20)):ACT.face(0,-12,rnd(8,13)),...walks(back),ACT.sit()]);
 },
 Ouk(p,t){
  const cand=P.filter(q=>q!==p&&seatedFree(q));
  if(!cand.length){p.nextAct=t+10;return}
  const tp=wpick(cand,q=>1/(1+dist(p.g.position,q.g.position))),out=outPts(p,{seat:tp.g}),back=out.slice().reverse();
  p.why='tour';p.cool=rnd(30,55);
  startAct(p,[ACT.st(),...walks(out),ACT.call(()=>{if(chatOn&&Math.random()<.5)say(p,pick(OUK_L),2.4)}),
   ACT.face(tp.g.position.x,tp.g.position.z,rnd(4,7),true),...walks(back),ACT.sit()]);
 },
 Not(p,t){
  p.nextAct=t+rnd(9,16);const r=Math.random(),gun=P.find(q=>q.nick==='Gun');
  if(r<.5){if(chatOn&&gun)pairChat(p,gun,t);return}
  if(r<.65)outing(p,t,'food');
  else if(r<.8)outing(p,t,'water');
 }
};

/* ---------- camera / input ---------- */
let goal=null,az=.3,pol=.9,dist_=22;const tgt=new THREE.Vector3(0,.8,-1.5);
function cam(){C.position.set(tgt.x+dist_*Math.sin(pol)*Math.sin(az),tgt.y+dist_*Math.cos(pol),tgt.z+dist_*Math.sin(pol)*Math.cos(az));C.lookAt(tgt)}
function size(){R.setSize(innerWidth,innerHeight);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix();if(innerWidth<700)dist_=Math.max(dist_,30)}
addEventListener('resize',size);size();
const rc=new THREE.Raycaster(),mv=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
let drag=null,off=new THREE.Vector3(),orb=null;const cv=R.domElement,tip=document.getElementById('tip');
function ray(e){mv.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);rc.setFromCamera(mv,C)}
function pickSeat(e){ray(e);const h=rc.intersectObjects(seats,true).find(x=>x.object.userData.seat&&x.object.visible!==false&&(x.object.parent?x.object.parent.visible!==false:true));return h&&h.object.userData.seat}
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);const s=pickSeat(e);
 if(s){cancelAct(s.userData.p);drag=s;s.userData.drag=1;ray(e);rc.ray.intersectPlane(plane,hit);off.copy(s.position).sub(hit);cv.style.cursor='grabbing';tip.style.display='none'}
 else{goal=null;orb={x:e.clientX,y:e.clientY}}});
cv.addEventListener('pointermove',e=>{
 if(drag){ray(e);if(rc.ray.intersectPlane(plane,hit)){const x=hit.x+off.x,z=hit.z+off.z;drag.position.x=clampN(Math.round(x*5)/5,-4.4,4.4);drag.position.z=clampN(Math.round(z*5)/5,-10.2,7)}}
 else if(orb){az-=(e.clientX-orb.x)*.006;pol=clampN(pol-(e.clientY-orb.y)*.005,.35,1.45);orb={x:e.clientX,y:e.clientY}}
 else if(e.pointerType==='mouse'){const s=pickSeat(e);cv.style.cursor=s?'grab':'default';if(s&&s.userData.p.d){const d=s.userData.p.d;tip.innerHTML=`<b>${d[2]}</b>${d[1]} · ${d[3]} · ${d[4]}`;tip.style.display='block';tip.style.left=e.clientX+14+'px';tip.style.top=e.clientY+14+'px'}else tip.style.display='none'}});
const up=()=>{if(drag){snap(drag);drag.userData.drag=0;drag=null;save()}orb=null;cv.style.cursor='grab'};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();goal=null;dist_=clampN(dist_*(1+Math.sign(e.deltaY)*.08),8,38)},{passive:false});

/* ---------- per-person update ---------- */
const DOWN=new THREE.Vector3(0,-1,0),_d=new THREE.Vector3(),vp=new THREE.Vector3();
function tickP(p,t,dt){
 const g=p.g,bd=p.bd,dr=g.userData.drag;
 // ---- state machine
 if(!dr){
  if(p.mode==='work'){if(t>p.nextAct){const f=BEH[p.nick];if(f)f(p,t);else GENB(p,t)}}
  else if(p.mode==='sleep'||p.mode==='music'){
   if(t>p.modeUntil)endMode(p,t);
   else if(t>p.fxAt){
    p.fxAt=t+(p.mode==='sleep'?2.6:2.2);
    say(p,p.mode==='sleep'?pick(['Zzz…','💤 Zzz','z z Z…']):pick(['🎧 ♪ ♫','♫ ♪ ♬','♪ ♪ ♫']),2.3,true);
   }
  }else if(p.mode==='act')runQ(p,t,dt);
 }
 const act=p.mode==='act';if(!act)p.walking=false;
 p.out=act&&p.px<-5.0;
 const tk=t<p.talkUntil&&!p.out;
 g.position.y+=((dr?.25:0)-g.position.y)*.2;p.ring.material.opacity=dr?.9:0;
 // ---- body placement
 if(act)bd.position.set(p.px-g.position.x,0,p.pz-g.position.z);else{bd.position.set(0,0,.8);p.px=g.position.x;p.pz=g.position.z+.8}
 bd.visible=!p.out;
 p.chair.position.z+=((p.sit?0:.32)-p.chair.position.z)*Math.min(1,dt*8);
 // ---- yaw / look
 let lookA=null;
 if(p.look&&t<p.lookUntil)lookA=Math.atan2(-(p.look.px-p.px),-(p.look.pz-p.pz));
 let yawT=act?p.yawT:(lookA!==null?clampN(wrap(lookA)*.4,-.5,.5):0);
 if(p.mode==='sleep')yawT=0;
 bd.rotation.y+=wrap(yawT-bd.rotation.y)*Math.min(1,dt*7);
 // ---- head
 const sitWork=p.sit&&!act;
 let hy=Math.sin(t*.5+p.ph)*(p.st.calm?.05:.15),hx,hz=0;
 if(lookA!==null)hy=clampN(wrap(lookA-bd.rotation.y),-1.5,1.5);
 if(p.mode==='sleep'){hx=-.8+Math.sin(t*1.3)*.03;hy=.25;hz=.2}
 else{
  hx=-.08+Math.sin(t*1.7+p.ph)*.02;
  if(p.watch)hx=-.3;
  if(p.st.busy>1.4&&sitWork&&lookA===null)hx=-.17;
  if(tk)hx=Math.sin(t*12)*.05;
  if(t<p.nodUntil)hx=-.28*Math.abs(Math.sin((p.nodUntil-t)*8));
  const su=t-p.sighAt;if(su>=0&&su<2.2){const u=su/2.2;hx=u<.4?.3*(u/.4):.3-.65*((u-.4)/.6)}
  const sl=t-p.startleAt;if(sl>=0&&sl<.8)hx=.4*(1-sl/.8);
  if(p.mode==='music'){hx=-.1+Math.sin(t*7)*.12;hy+=Math.sin(t*3.5)*.12;hz=Math.sin(t*3.5)*.05}
 }
 const hk=Math.min(1,dt*10);
 p.head.rotation.x+=(hx-p.head.rotation.x)*hk;p.head.rotation.y+=(hy-p.head.rotation.y)*hk;p.head.rotation.z+=(hz-p.head.rotation.z)*hk;
 p.mouth.scale.y=tk?.6+Math.abs(Math.sin(t*14))*2:1;
 p.hp.visible=p.mode==='music';
 // ---- arms
 let a0,a1;
 if(p.mode==='sleep'){a0=a1=1.45}
 else if(p.sit){a0=1.2;a1=tk?.6+Math.sin(t*6)*.3:1.2}
 else{a0=.04;a1=p.hand==='bag'?.15:p.hand==='cup'?.75:tk?.6+Math.sin(t*6)*.3:.04}
 if(p.walking){a0=Math.sin(p.wph)*.55;a1=p.hand?a1:-Math.sin(p.wph)*.55}
 const ak=Math.min(1,dt*10);p.ab[0]+=(a0-p.ab[0])*ak;p.ab[1]+=(a1-p.ab[1])*ak;
 let w0=0,w1=0;
 if(p.sit&&p.mode!=='sleep'){const bz=p.st.busy*(t<p.boostUntil?1.7:1);w0=Math.sin(t*11+p.ph)*.07*bz;w1=tk?0:Math.sin(t*13+p.ph*2)*.07*bz}
 p.arms[0].rotation.set(p.ab[0]+w0,0,0);
 if(t<p.pointUntil&&p.pointTo){            // ชี้สั่งงาน
  const dx=p.pointTo.x-p.px,dz=p.pointTo.z-p.pz,c=Math.cos(bd.rotation.y),s=Math.sin(bd.rotation.y);
  const lx=dx*c-dz*s,lz=dx*s+dz*c;_d.set(lx,Math.hypot(lx,lz)*.25,lz).normalize();
  p.arms[1].quaternion.setFromUnitVectors(DOWN,_d);
 }else p.arms[1].rotation.set(p.ab[1]+w1,0,0);
 p.bagG.visible=p.hand==='bag';p.cupG.visible=p.hand==='cup';
 p.bagG.rotation.x=p.cupG.rotation.x=-p.arms[1].rotation.x;
 // ---- legs / torso
 p.legsSit.visible=p.sit;p.legsStand.visible=!p.sit;
 p.lg+=((p.walking?1:0)-p.lg)*Math.min(1,dt*10);
 p.legPv[0].rotation.x=Math.sin(p.wph)*.7*p.lg;p.legPv[1].rotation.x=-Math.sin(p.wph)*.7*p.lg;
 if(p.walking)bd.position.y=Math.abs(Math.sin(p.wph))*.04;
 const su2=t-p.sighAt;
 p.torso.scale.y=1+Math.sin(t*1.8+p.ph)*.012+((su2>=0&&su2<2.2)?Math.sin(su2/2.2*Math.PI)*.06:0);
 p.food.visible=t<p.foodUntil;p.cp2.visible=t<p.cupUntil;
 if(!(p.sit&&p.mode==='work'&&!g.userData.drag))p.callUntil=0;
 {const rg=t<p.ringUntil,oc=t<p.callUntil;p.led.material.color.setHex(rg?((t*8|0)%2?0xff3030:0x3a1111):oc?0x2fbe73:0x333333);
  p.phone.rotation.z=rg?Math.sin(t*55)*.06:0;p.hs.position.lerp(oc?PH_EAR:PH_REST,.2);p.hs.rotation.x+=((oc?1.35:0)-p.hs.rotation.x)*.2}
 // ---- labels
 p.head.getWorldPosition(vp);vp.y+=.45;vp.project(C);
 const sx=(vp.x+1)/2*innerWidth,sy=(1-vp.y)/2*innerHeight,vis=vp.z<1&&!p.out;
 p.tag.style.display=vis?'flex':'none';p.tag.style.left=sx+'px';p.tag.style.top=sy+'px';
 const on=vis&&t<p.bubUntil&&(chatOn||p.bubFx);p.bubEl.style.opacity=on?1:0;
 if(on){p.bubEl.textContent=p.bub;const w=p.bubEl.offsetWidth,h=p.bubEl.offsetHeight;p.bubEl.style.left=sx-w/2+'px';p.bubEl.style.top=sy-h-22+'px'}
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
function drawClock(){const [h,m,s]=bkk(),g=ckx,c=128;g.clearRect(0,0,256,256);g.fillStyle='#f4f7f2';g.beginPath();g.arc(c,c,124,0,7);g.fill();
 g.strokeStyle='#15332A';g.lineWidth=6;for(let i=0;i<12;i++){const a=i*Math.PI/6,r=i%3?108:96;g.beginPath();g.moveTo(c+Math.sin(a)*r,c-Math.cos(a)*r);g.lineTo(c+Math.sin(a)*114,c-Math.cos(a)*114);g.stroke()}
 const hand=(a,l,w,col)=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(c,c);g.lineTo(c+Math.sin(a)*l,c-Math.cos(a)*l);g.stroke()};
 hand((h%12+m/60)*Math.PI/6,60,9,'#0E211A');hand((m+s/60)*Math.PI/30,88,6,'#0E211A');hand(s*Math.PI/30,98,3,'#e8483a');
 g.fillStyle='#e8483a';g.beginPath();g.arc(c,c,7,0,7);g.fill()}

/* ---------- จอคอมรายโต๊ะ: สีตามทีมของคนที่นั่ง, ขยับตามสถานะ ---------- */
function drawScr(d,i,t){
 const o=seats.find(g=>g.userData.slot===i),p=o&&o.userData.p,g=d.cv;
 if(!p){g.fillStyle='#050807';g.fillRect(0,0,128,80);return}
 if(!(p.mode==='work'&&p.sit&&!o.userData.drag)){      // หลับ/ฟังเพลง/ไม่อยู่ → screensaver เด้งไปมา
  g.fillStyle='#08110e';g.fillRect(0,0,128,80);g.fillStyle=TEAM[p.team];
  g.fillRect(Math.abs((t*14+d.seed*9)%180-90)+8,Math.abs((t*9+d.seed*5)%100-50)+10,22,10);return}
 g.fillStyle='#e7eef6';g.fillRect(0,0,128,80);
 g.fillStyle=(t<p.ringUntil&&(t*6|0)%2)?'#e8483a':TEAM[p.team];g.fillRect(0,0,128,11);
 const sp=Math.floor(t*p.st.busy*1.5+d.seed);
 for(let k=0;k<7;k++){g.fillStyle=k%3?'#9db3c9':TEAM[p.team];g.fillRect(6,18+k*9,24+((k*37+sp*(k+5)*11)%80),4)}
}

/* ---------- โทรศัพท์: ดัง → รับสาย → วางสาย ---------- */
const PH_REST=new THREE.Vector3(.58,.83,-.2),PH_EAR=new THREE.Vector3(.2,1.2,.74);
function ring(p,t){
 if(t<p.ringUntil||t<p.callUntil)return;
 p.ringUntil=t+2.4;sfxRing();if(!LIVE)TK[p.team].o++;say(p,'📞 กริ๊งงง...',1.8);
 setTimeout(()=>{if(!seatedFree(p))return;const d=rnd(5,9);p.callUntil=now()+d;say(p,'Helpdesk สวัสดี'+ks(p)+' ยินดีให้บริการ'+ks(p),3);
  setTimeout(()=>{if(seatedFree(p)&&p.callUntil>0){p.callUntil=0;say(p,pick(['ขอบคุณที่ติดต่อมา'+ks(p),'เรียบร้อย'+ks(p)+' สวัสดี'+ks(p)]),2)}},d*1000)},2400);
}

/* ---------- สุ่มพฤติกรรมให้ทุกคน (ไม่ใช่แค่คนที่มีสคริปต์เฉพาะ) ---------- */
function visit(p,q,t){const out=outPts(p,{seat:q.g}),back=out.slice().reverse();p.why='tour';p.cool=rnd(25,50);
 startAct(p,[ACT.st(),...walks(out),ACT.face(q.g.position.x,q.g.position.z,rnd(4,8),true),ACT.call(()=>{if(chatOn)say(p,pick(GEN),2.4)}),...walks(back),ACT.sit()])}
function GENB(p,t){
 p.nextAct=t+rnd(12,40);const r=Math.random();
 if(r<.2)ring(p,t);
 else if(r<.34)sigh(p,t);
 else if(r<.52){const q=wpick(P.filter(x=>x!==p&&seatedFree(x)),x=>1/(1+dist(p.g.position,x.g.position)));if(q)visit(p,q,t)}
 else if(r<.64)outing(p,t,Math.random()<.5?'food':'water');
 else if(r<.72){p.mode='music';p.modeUntil=t+rnd(12,30);p.cool=rnd(8,16);p.fxAt=t}
 else if(r<.78){p.mode='sleep';p.modeUntil=t+rnd(8,16);p.cool=rnd(8,16);p.fxAt=t+1}
 else if(chatOn)say(p,pick(TL[p.team]),2.6);
}
P.forEach(p=>{p.st.talk*=rnd(.75,1.3);if(['Ying','Teen','Aon'].includes(p.nick))return;const r=Math.random(),t=now();   // สถานะเริ่มต้นไม่เหมือนกันทุกครั้ง
 if(r<.1){p.mode='sleep';p.modeUntil=t+rnd(6,25);p.fxAt=t+1}else if(r<.2){p.mode='music';p.modeUntil=t+rnd(8,28);p.fxAt=t}});

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
 const cv=document.createElement('canvas');cv.width=512;cv.height=288;const tx=new THREE.CanvasTexture(cv);
 const gr=new THREE.Group();gr.position.set(x,y,z);gr.rotation.y=ry;S.add(gr);add(gr,box(w+.1,h+.1,.05),FR,0,0,0);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx}));m.position.z=.03;gr.add(m);
 DASH.push({g:cv.getContext('2d'),tx,kind,title});
}
dashboard(3.55,1.9,ZB+.125,0,2.0,1.15,'tickets','Tickets วันนี้');            // ผนังหลังห้อง 1 เครื่อง
dashboard(X1-.125,2.15,-7.4,-Math.PI/2,2.2,1.25,'sla','SLA & Response');      // ผนังขวา 2 เครื่อง
dashboard(X1-.125,2.15,-3.6,-Math.PI/2,2.2,1.25,'team','สถานะทีม');
function drawDash(D){
 const g=D.g,tot=Object.values(TK).reduce((a,v)=>({o:a.o+v.o,d:a.d+v.d}),{o:0,d:0}),sla=Math.round(tot.d/Math.max(1,tot.o+tot.d)*100),F="'IBM Plex Sans Thai',sans-serif";
 const T=(s,x,y,sz,c,al)=>{g.font=`600 ${sz}px ${F}`;g.fillStyle=c;g.textAlign=al||'left';g.textBaseline='middle';g.fillText(s,x,y)};
 g.fillStyle='#0E211A';g.fillRect(0,0,512,288);g.fillStyle='#15332A';g.fillRect(0,0,512,44);g.fillStyle='#2FBE73';g.fillRect(0,0,8,44);
 T(D.title,22,23,22,'#F4F7F2');T(clockStr(),496,23,18,'#9AD84B','right');
 if(D.kind==='tickets'){
  Object.entries(TK).forEach(([k,v],i)=>{const y=62+i*50,f=v.d/Math.max(1,v.d+v.o);
   T(k,22,y+12,20,TEAM[k]);g.fillStyle='#1f3d33';g.fillRect(150,y+2,240,20);g.fillStyle=TEAM[k];g.fillRect(150,y+2,240*f,20);T(v.d+' / '+v.o,496,y+12,20,'#F4F7F2','right')});
  T('รวม ปิด '+tot.d+' · ค้าง '+tot.o,22,268,16,'#F4F7F2');T('ปิดแล้ว / ค้าง',496,268,14,'#93A398','right');
 }else if(D.kind==='sla'){
  T('SLA วันนี้',256,70,18,'#93A398','center');T(sla+'%',256,120,84,sla>=85?'#2FBE73':'#F5B83D','center');
  T('ตอบกลับเฉลี่ย '+resp.toFixed(1)+' นาที',256,176,20,'#F4F7F2','center');
  const lo=Math.min(...HIST),hi=Math.max(...HIST)+1;g.strokeStyle='#2FBE73';g.lineWidth=3;g.beginPath();
  HIST.forEach((v,i)=>{const x=30+i*(452/(HIST.length-1)),y=262-(v-lo)/(hi-lo)*52;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();T('Ticket ค้างล่าสุด',22,278,12,'#93A398');
 }else{
  const t=now(),c={w:0,c:0,a:0,b:0};P.forEach(p=>{if(p.mode==='act'&&!p.sit)c.a++;else if(p.mode==='sleep'||p.mode==='music')c.b++;else if(t<p.callUntil)c.c++;else c.w++});
  [['ทำงาน',c.w,'#2FBE73'],['สายเข้า',c.c,'#5BB8F5'],['ไม่อยู่โต๊ะ',c.a,'#F5B83D'],['พัก',c.b,'#93A398']].forEach(([n,v,col],i)=>{const x=22+i*118;g.fillStyle='#15332A';g.fillRect(x,60,106,86);T(v,x+53,92,40,col,'center');T(n,x+53,130,15,'#F4F7F2','center')});
  P.forEach((p,i)=>{const x=36+(i%9)*52,y=185+((i/9)|0)*52,away=p.mode==='act'&&!p.sit;g.beginPath();g.arc(x,y,16,0,7);g.fillStyle=away?'#2a3a34':TEAM[p.team];g.fill();T(p.nick.slice(0,3),x,y+1,11,away?'#6c7a72':'#0E211A','center')});
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
 for(let i=0;i<8;i++){const o=c.createOscillator(),g=c.createGain(),s=t+i*.27;o.frequency.value=i%2?620:480;g.gain.setValueAtTime(.0001,s);g.gain.linearRampToValueAtTime(.07,s+.02);g.gain.setValueAtTime(.07,s+.2);g.gain.linearRampToValueAtTime(.0001,s+.24);o.connect(g);g.connect(snd.master);o.start(s);o.stop(s+.26)}}

/* ---------- มุมกล้องสำเร็จรูป ---------- */
const VIEWS={all:{az:.3,pol:.9,d:()=>innerWidth<700?30:22,t:[0,.8,-1.5]},top:{az:0,pol:.36,d:26,t:[0,0,-1.5]},
 eye:{az:.25,pol:1.4,d:7.5,t:[0,1.1,-1]},door:{az:-1.25,pol:1.05,d:20,t:[0,.8,-1.5]}};
function goView(k){const v=VIEWS[k];goal={az:v.az,pol:v.pol,d:typeof v.d==='function'?v.d():v.d,t:new THREE.Vector3(...v.t)}}
function stepGoal(){const k=.08;az+=wrap(goal.az-az)*k;pol+=(goal.pol-pol)*k;dist_+=(goal.d-dist_)*k;tgt.lerp(goal.t,k);
 if(Math.abs(wrap(goal.az-az))<.003&&Math.abs(goal.d-dist_)<.05&&Math.abs(goal.pol-pol)<.003)goal=null}
document.querySelectorAll('#views [data-v]').forEach(b=>b.onclick=()=>goView(b.dataset.v));
document.getElementById('bSnd').onclick=e=>sndToggle(e.currentTarget);

/* ---------- ตัวคุมเวลา (เรียกทุกเฟรม) ---------- */
let scrNext=0,dashNext=0,tkNext=0,keyNext=0,dirNext=now()+rnd(6,20);
function extras(t){
 if(t>scrNext){scrNext=t+.25;DESKS.forEach((d,i)=>{drawScr(d,i,t);d.tx.needsUpdate=true})}
 if(t>tkNext){tkNext=t+rnd(3,7);drift()}
 if(t>dashNext){dashNext=t+1;DASH.forEach(D=>{drawDash(D);D.tx.needsUpdate=true});drawClock();ckt.needsUpdate=true}
 if(t>dirNext){dirNext=t+rnd(8,28);const f=P.filter(seatedFree);if(f.length&&Math.random()<.65)ring(pick(f),t)}   // สายเข้าแบบสุ่ม
 if(snd.on&&t>keyNext){const n=P.filter(p=>p.mode==='work'&&p.sit).length;keyNext=t+rnd(.05,.3)*8/Math.max(2,n);sfxClick(rnd(.03,.07))}
}

/* ---------- loop ---------- */
let next=1,last=0;
function loop(ms){requestAnimationFrame(loop);const t=ms/1000,dt=Math.min(.05,Math.max(0,t-last));last=t;
 if(chatOn&&t>next){next=t+1.3+Math.random()*1.4;convo()}
 P.forEach(p=>tickP(p,t,dt));
 extras(t);if(goal)stepGoal();
 cam();R.render(S,C)}
requestAnimationFrame(loop);
