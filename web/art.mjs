import {LV02,lv02Surfaces} from "./levels/lv-02.mjs";
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
  for(let row=0;row<15;row++)px(c,0,row*36,960,36,[ART.sky,ART.sky,'#19334b','#1c384f','#203e55','#26465c','#2b4c60','#2a4e62','#2d5267','#2d5267','#284b60','#284b60','#26465a','#254357','#254357'][row]);
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
  // Winding key and directional scarf give a visible airborne/run pose.
  if(!state.onGround){px(c,x+27,y+21,8,3,ART.brass);px(c,x-11,y+19,13,6,ART.coral);}
  else if(run){px(c,x-13-(cycle*4),y+21,13,5,ART.coral);}
}
function tica(c,state){
  const x=state.x-27, y=state.y-38+Math.round(Math.sin(state.ticks/19)*2)*2;
  px(c,x-11,y+5,22,8,ART.brass);px(c,x-3,y,16,14,ART.teal);
  px(c,x+6,y+3,4,3,ART.ink);px(c,x+12,y+7,8,4,ART.coral);
  px(c,x-19,y+3,13,7,'#a1e5cf');px(c,x-14,y-2,12,5,ART.cream);
  px(c,x-3,y+15,6,5,ART.ink);
  if(Math.floor(state.ticks/8)%2===0){px(c,x-24,y-3,11,6,ART.cream);px(c,x+13,y-3,9,5,ART.brass);}
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
  // Distinct bolt head and repair wrench: Perno is an ally, not a block.
  px(c,x+21,y-20,4,7,ART.ink);px(c,x+15,y-23,16,5,ART.brass);
  px(c,x-6,y+18,11,4,ART.teal);px(c,x-9,y+12,5,15,ART.brass);
}
function gate(c){
  const x=1952,y=361;
  px(c,x-8,y,88,100,ART.brass);px(c,x,y-14,72,26,ART.ink);
  px(c,x+9,y+16,56,83,'#3a8989');px(c,x+17,y+24,40,75,ART.ink);
  for(let i=0;i<5;i++)px(c,x+21+i*7,y+32+i%2*14,4,14,ART.teal);
  clock(c,x+35,y-8,15,1.8);
  px(c,x+5,y-38,62,7,ART.cream);
}

/** Narrative cues belong to the existing visual owner. Product truth stays in
 * contracts/nilo-semantic-v1.json; tests reject a mismatch with that owner. */
export const ART_CUES = Object.freeze([
  Object.freeze({id:'CUE-01',from:0,until:650,role:'CH-TICA',title:'TICA · TROVA IL PRIMO SEGNATEMPO',
    hint:'Le ore rubate sono sei. Cerca le bordature d’ottone: indicano dove puoi atterrare.'}),
  Object.freeze({id:'CUE-02',from:650,until:1200,role:'CH-NILO',title:'NILO · ATTRAVERSA IL CORTILE',
    hint:'Tra i tetti corre il vuoto. Salta verso i margini luminosi, non verso le facciate.'}),
  Object.freeze({id:'CUE-03',from:1200,until:1550,role:'CH-PERNO',title:'PERNO · RIACCENDI IL SEGNATEMPO',
    hint:'Il segnatempo custodisce il checkpoint. Il suo quadrante diventa turchese quando è attivo.'}),
  Object.freeze({id:'CUE-04',from:1550,until:2100,role:'CH-TICA',title:'TICA · VERSO IL PORTALE',
    hint:'Il primo arco riconsegna un’ora alla città. Le altre cinque attendono nuovi capitoli.'})
]);
export const LV02_CUES=Object.freeze([
  Object.freeze({id:'CANAL-01',from:0,until:650,role:'CH-TICA',title:'TICA · SEGUI IL FLUSSO',
    hint:'Il canale ruba minuti: osserva le frecce dell’acqua prima di saltare.'}),
  Object.freeze({id:'CANAL-02',from:650,until:1330,role:'CH-NILO',title:'NILO · IL PONTE SI MUOVE',
    hint:'La piattaforma d’ottone si sposta. Aspetta il passaggio e salta sul bordo luminoso.'}),
  Object.freeze({id:'CANAL-03',from:1330,until:1820,role:'CH-PERNO',title:'PERNO · SALVA IL PERCORSO',
    hint:'Il molo custodisce il checkpoint LV-02, indipendente da quello del prologo.'}),
  Object.freeze({id:'CANAL-04',from:1820,until:2400,role:'CH-TICA',title:'TICA · VERSO LA CHIUSA',
    hint:'Il Custode sorveglia il varco: lo scontro non è ancora implementato.'})
]);
export function sceneCue(state) {
  if(state.level==='LV-02'){
    if(state.phase==='COMPLETED')return {id:'CANAL-END',role:'CH-TICA',
      title:'CANALE ATTRAVERSATO',hint:'La seconda ora resta sigillata: il Custode sarà disponibile in una versione successiva.'};
    if(state.phase==='PAUSED')return {id:'CANAL-PAUSE',role:'CH-NILO',
      title:'CANALE IN PAUSA',hint:'Premi P per riprendere o R per il checkpoint di questo livello.'};
    if(state.checkpointActive&&state.x>=1330&&state.x<1820)return {...LV02_CUES[2],
      title:'PERNO · MOLO MEMORIZZATO',hint:'Checkpoint LV-02 attivo. Il Custode resta oltre la chiusa.'};
    return LV02_CUES.find(c=>state.x>=c.from&&state.x<c.until)||LV02_CUES[3];
  }
  if(state.phase==='COMPLETED')return Object.freeze({id:'CUE-END',role:'CH-NILO',
    title:'PRIMA ORA RESTITUITA',hint:'Hai restituito la prima ora. Premi N per LV-02; gli altri quattro livelli sono in sviluppo.'});
  if(state.phase==='PAUSED')return Object.freeze({id:'CUE-PAUSE',role:'CH-NILO',
    title:'TEMPO IN PAUSA',hint:'Premi P per riprendere oppure R per ricominciare.'});
  if(state.checkpointActive&&state.x>=1200&&state.x<1550)
    return {...ART_CUES[2],title:'PERNO · SEGNATEMPO RIACCESO',
      hint:'Checkpoint attivo: la posizione è salva. Raggiungi il portale per restituire la prima ora.'};
  return ART_CUES.find(c=>state.x>=c.from&&state.x<c.until)||ART_CUES[ART_CUES.length-1];
}
/** Permanent silhouettes are not collision geometry. Each signal has a
 * non-colour distinction: shape, icon/label, and scene text. */
export const ART_SIGNALS = Object.freeze({
  solid:{id:'SIG-SOLID',shape:'double horizontal rim with metal rivets',label:'SUPERFICIE'},
  void:{id:'SIG-VOID',shape:'chevrons at each walkable ledge',label:'SALTA'},
  checkpoint:{id:'SIG-CHECKPOINT',shape:'upright clock on a flag and radial sparkles',label:'SEGNATEMPO'},
  exit:{id:'SIG-EXIT',shape:'tall gate with hourglass and double pillars',label:'PORTALE'},
  characters:{id:'SIG-ROLES',shape:'cap and scarf; angular wing; square bolt head',label:'NILO TICA PERNO'}
});
function spriteLabel(c,x,y,name,color){
  const w=name.length*7+16;
  px(c,x-3,y-2,w+4,20,ART.ink);
  px(c,x,y,w,16,color);
  c.fillStyle=ART.ink;c.font='bold 12px monospace';c.fillText(name,x+7,y+12);
}
function ledgeCues(c,platforms,state){
  for(let i=0;i<platforms.length-1;i++){
    const p=platforms[i],gap=platforms[i+1].x-(p.x+p.w);
    if(gap<=0)continue;
    const x=p.x+p.w-33,y=p.y-35;
    const pulse=state.phase==='PLAYING'&&Math.floor(state.ticks/18)%2===0;
    for(let k=0;k<3;k++){
      const sx=x+k*8;
      px(c,sx,y+Math.abs(k-1)*3,6,4,pulse?ART.cream:ART.brass);
      px(c,sx+4,y+5+Math.abs(k-1)*3,4,4,ART.ink);
    }
    // Black beneath the lip is intentionally separated from solid brass.
    px(c,p.x+p.w-4,p.y,4,26,ART.ink);
  }
}
function timeLanterns(c,state){
  px(c,674,16,276,59,ART.ink);px(c,678,20,268,50,ART.shadow);
  c.fillStyle=ART.cream;c.font='bold 13px monospace';
  c.fillText(state.level==='LV-02'?'LE SEI ORE · LV-02':'LE SEI ORE · LV-01',689,38);
  for(let j=0;j<6;j++){
    const x=699+j*38,active=j===0&&(state.level==='LV-02'||state.phase==='COMPLETED');
    px(c,x,47,23,13,ART.ink);px(c,x+3,49,17,9,active?ART.teal:ART.brick);
    if(j>0)px(c,x+10,50,3,6,ART.ink);
  }
}
function nameplates(c,state){
  const bob=(Math.floor(state.ticks/19)%2)*2;
  spriteLabel(c,state.x-7,state.y-35,'NILO',ART.brass);
  spriteLabel(c,Math.max(14,state.x-53),state.y-73-bob,'TICA',ART.teal);
  if(state.camera>850||state.x>1100)spriteLabel(c,1323,326,'PERNO',ART.brass);
}

export function renderPixelWorld(c,state,cfg,platforms){
  c.clearRect(0,0,cfg.viewport,cfg.height);
  skyline(c,state.camera);
  factoryMachinery(c,state.camera);
  c.save();c.translate(-Math.floor(state.camera/2)*2,0);
  for(let i=0;i<platforms.length;i++)platform(c,platforms[i],i);
  ledgeCues(c,platforms,state);
  arrow(c,118,366);checkpoint(c,state);perno(c);gate(c);
  nilo(c,state);tica(c,state);
  nameplates(c,state);
  c.restore();
  timeLanterns(c,state);
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
