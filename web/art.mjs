// Original, code-generated pixel art; no external textures, fonts or images.
// The design palette is a candidate, not an independent aesthetic approval.
export const ART = Object.freeze({
  sky:'#132b43', sky2:'#27445c', far:'#1c4058', near:'#285968', stone:'#42596a',
  brick:'#75696a', brass:'#e9b761', cream:'#f7e7b0', teal:'#73d1bf',
  coral:'#e76c5e', ink:'#0a2135', shadow:'#294354', ivory:'#f5eddb'
});
export const ART_IDENTITY = Object.freeze({
  resolution:'480x270 integer pixel canvas rendered at 960x540 with smoothing off',
  playable:'CH-NILO', companion:'CH-TICA', maintenance:'CH-PERNO',
  motif:'shared time, hourglass, repaired clockwork and six sealed hours',
  provenance:'first-party procedural sprites only; copyright and author approval pending'
});
const px=(c,x,y,w,h,color)=>{ c.fillStyle=color; c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,Math.max(2,Math.round(w/2)*2),Math.max(2,Math.round(h/2)*2)); };
const hash=n=>{let x=Math.imul(n+1977,1274126177);x^=x>>>13;return(x>>>0);};
function clock(c,x,y,r,time){
  c.strokeStyle=ART.brass;c.lineWidth=4;c.beginPath();c.arc(Math.round(x),Math.round(y),r,0,Math.PI*2);c.stroke();
  c.fillStyle=ART.ink;c.beginPath();c.arc(x,y,r-5,0,Math.PI*2);c.fill();
  c.strokeStyle=ART.teal;c.lineWidth=2;
  for(let j=0;j<12;j++){const a=j*Math.PI/6;c.beginPath();c.moveTo(x+Math.sin(a)*(r-8),y-Math.cos(a)*(r-8));c.lineTo(x+Math.sin(a)*(r-12),y-Math.cos(a)*(r-12));c.stroke();}
  c.strokeStyle=ART.cream;c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.sin(time)*r*.48,y-Math.cos(time)*r*.48);c.stroke();
  c.fillStyle=ART.coral;c.fillRect(x-3,y-3,6,6);
}
function building(c,x,y,w,h,seed){
  px(c,x,y,w,h,ART.far);px(c,x+6,y-9,w-12,10,ART.near);
  for(let ix=0;ix<Math.floor(w/24);ix++)for(let iy=0;iy<Math.floor(h/27);iy++){
    const lit=(hash(seed+ix*31+iy*71)%7)<3;
    px(c,x+10+ix*24,y+16+iy*27,8,12,lit?'#b89d71':ART.ink);
  }
  px(c,x+w*.62,y-24,14,24,ART.shadow);
}
function skyline(c,camera){
  for(let row=0;row<7;row++)px(c,0,row*36,960,36,[ART.sky,ART.sky,'#19334b','#1c384f','#203e55','#26465c','#2b4c60'][row]);
  for(let j=0;j<60;j++){let x=(hash(j*13)%2200)-(camera*.11)%2200;while(x<0)x+=2200;x%=1180;
    let y=28+hash(j*91)%180;px(c,x,y,2,2,j%5===0?ART.brass:'#6d8292');}
  c.save();c.translate(-Math.floor(camera*.15/2)*2,0);
  for(let i=0;i<20;i++){const x=i*148-90;building(c,x,280+(i%3)*18,115,250,i);}
  px(c,635,146,148,282,ART.near);px(c,653,124,112,26,ART.shadow);
  px(c,694,67,32,77,ART.far);px(c,700,55,20,15,ART.brass);
  clock(c,709,205,47,.8);
  px(c,0,413,2600,8,ART.shadow);
  c.restore();
}
function factoryMachinery(c,camera){
  c.save();c.translate(-Math.floor(camera*.38/2)*2,0);
  for(let i=0;i<13;i++){
    const x=i*205+25;
    px(c,x,320+(i%3)*14,108,120,ART.near);
    px(c,x+19,295+(i%3)*14,20,25,ART.shadow);
    px(c,x+42,280+(i%3)*14,14,40,ART.shadow);
    px(c,x+14,336+(i%3)*14,12,23,'#8d986f');
    px(c,x+38,336+(i%3)*14,12,23,ART.ink);
    px(c,x+62,336+(i%3)*14,12,23,ART.ink);
    px(c,x-6,390+(i%3)*14,120,8,'#356572');
  }
  c.restore();
}
function platform(c,p,i){
  px(c,p.x,p.y,p.w,550-p.y,i%2?ART.brick:'#70676a');
  px(c,p.x,p.y-7,p.w,8,ART.brass);
  px(c,p.x,p.y-11,p.w,4,ART.cream);
  px(c,p.x,p.y+10,8,540-p.y,ART.shadow);
  for(let ix=p.x+14;ix<p.x+p.w-12;ix+=32){
    px(c,ix,p.y+21,14,9,ART.ink);
    px(c,ix+16,p.y+47,12,7,'#50606c');
    if((ix+i)%3===0)px(c,ix,p.y+5,4,4,'#d3c18a');
  }
  for(let j=0;j<p.w/48;j++){const x=p.x+13+j*48;px(c,x,p.y-16,16,4,'#4d978d');}
}
function arrow(c,x,y){
  px(c,x,y,66,12,ART.ink);px(c,x+6,y+3,48,5,ART.cream);
  px(c,x+51,y-5,14,22,ART.teal);px(c,x+64,y+2,10,10,ART.teal);
}
function nilo(c,state){
  const x=state.x,y=state.y,run=Math.abs(state.vx)>1,cycle=run?(Math.floor(state.ticks/7)%2):0;
  // Strong silhouette: cap, hair, face, goggles, red scarf, watch and boots.
  px(c,x+4,y+1,24,8,ART.ink);px(c,x+4,y-4,26,8,ART.teal);
  px(c,x-2,y+6,34,5,ART.brass);px(c,x+3,y+10,24,15,'#f3ca8f');
  px(c,x+3,y+11,5,11,'#654743');px(c,x+20,y+14,5,4,ART.ink);
  px(c,x+24,y+14,3,3,ART.cream);
  px(c,x+2,y+24,28,11,'#f0c067');
  px(c,x+5,y+25,8,7,ART.brass);px(c,x+21,y+22,9,7,ART.coral);
  px(c,x-9-(run?cycle*4:0),y+25,17,5,ART.coral);
  px(c,x+7,y+36,8,7,ART.ink);px(c,x+18,y+36+(cycle?2:0),8,7,ART.ink);
  px(c,x-2,y+30,8,8,ART.ink);px(c,x+28,y+31,5,7,'#bdb49b');
  px(c,x+13,y+26,8,9,ART.ink);px(c,x+14,y+27,6,6,ART.teal);
}
function tica(c,state){
  const x=state.x-27, y=state.y-38+Math.round(Math.sin(state.ticks/19)*2)*2;
  px(c,x-11,y+5,22,8,ART.brass);px(c,x-3,y,16,14,ART.teal);
  px(c,x+6,y+3,4,3,ART.ink);px(c,x+12,y+7,8,4,ART.coral);
  px(c,x-19,y+3,13,7,'#a1e5cf');px(c,x-14,y-2,12,5,ART.cream);
  px(c,x-3,y+15,6,5,ART.ink);
}
function checkpoint(c,state){
  const x=1250,y=348,active=state.checkpointActive;
  px(c,x,y,8,56,ART.ink);px(c,x+2,y-5,6,57,ART.cream);
  px(c,x+8,y+1,49,32,active?ART.teal:ART.brass);
  px(c,x+13,y+6,35,22,ART.ink);
  clock(c,x+30,y+18,10,state.ticks/80);
  px(c,x-7,y+55,24,8,ART.brass);
  if(active){for(let i=0;i<4;i++)px(c,x-24+i*23,y-18-i%2*10,6,6,ART.teal);}
}
function perno(c){
  const x=1340,y=356;px(c,x,y,42,42,ART.shadow);px(c,x+4,y-7,36,37,'#87a7a5');
  px(c,x+8,y+5,8,8,ART.ink);px(c,x+27,y+5,8,8,ART.ink);
  px(c,x+10,y+22,23,6,ART.brass);px(c,x+18,y-14,7,8,ART.brass);
  px(c,x+7,y+35,9,10,ART.ink);px(c,x+29,y+35,9,10,ART.ink);
}
function gate(c){
  const x=1952,y=361;
  px(c,x-8,y,88,100,ART.brass);px(c,x,y-14,72,26,ART.ink);
  px(c,x+9,y+16,56,83,'#3a8989');px(c,x+17,y+24,40,75,ART.ink);
  for(let i=0;i<5;i++)px(c,x+21+i*7,y+32+i%2*14,4,14,ART.teal);
  clock(c,x+35,y-8,15,1.8);
  px(c,x+5,y-38,62,7,ART.cream);
}
export function renderPixelWorld(c,state,cfg,platforms){
  c.clearRect(0,0,cfg.viewport,cfg.height);
  skyline(c,state.camera);
  factoryMachinery(c,state.camera);
  c.save();c.translate(-Math.floor(state.camera/2)*2,0);
  for(let i=0;i<platforms.length;i++)platform(c,platforms[i],i);
  arrow(c,118,366);checkpoint(c,state);perno(c);gate(c);
  nilo(c,state);tica(c,state);
  c.restore();
  // Dedicated in-game signage; primary accessible text remains outside canvas.
  px(c,14,13,274,56,ART.ink);px(c,16,15,270,52,'#213e56');
  c.fillStyle=ART.cream;c.font='bold 18px system-ui';
  c.fillText('PROLOGO · ORA 1',28,39);
  c.fillStyle=ART.teal;c.font='14px system-ui';
  c.fillText(state.checkpointActive?'TEMPO SALVATO':'CERCATE IL SEGNATEMPO',28,60);
  if(state.phase==='PAUSED'||state.phase==='COMPLETED'){
    px(c,209,184,544,158,ART.ink);px(c,216,192,528,142,'#24465c');
    c.fillStyle=ART.brass;c.font='bold 29px system-ui';
    c.fillText(state.phase==='PAUSED'?'TEMPO IN PAUSA':'PRIMA ORA RESTITUITA',245,247);
    c.fillStyle=ART.ivory;c.font='16px system-ui';
    c.fillText(state.phase==='PAUSED'?'Premi P per continuare':'Cinque capitoli ancora da costruire',245,280);
    c.fillText('Premi R per ricominciare',245,307);
  }
}
