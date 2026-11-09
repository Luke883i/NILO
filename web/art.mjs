import {LV02,lv02Surfaces} from "./levels/lv-02.mjs";
import {LV03,archiveDoorOpen} from "./levels/lv-03.mjs";
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
  if(state.level==='LV-03'){
    if(state.phase==='COMPLETED')return {id:'ARCHIVE-VICTORY',role:'CH-NILO',
      title:'TERZA ORA RESTITUITA',hint:'Hai liberato i registri del tempo. LV-04 è in sviluppo.'};
    if(state.phase==='PAUSED')return {id:'ARCHIVE-PAUSE',role:'CH-TICA',
      title:'TEMPO IN PAUSA',hint:'Premi P per tornare all’Archivio.'};
    const position=state.x,mode=state.lightMode==='LIGHT'?'LUCE':'OMBRA';
    if(position<600)return {id:'ARCHIVE-ENTRY-'+mode,role:'CH-TICA',
      title:'ARCHIVIO · LUCE E OMBRA',hint:'Premi E vicino alla lampada. La prima porta richiede OMBRA.'};
    if(position<1000)return {id:'ARCHIVE-DOOR1-'+mode,role:'CH-PERNO',
      title:'PORTA D’OMBRA · '+mode,hint:'Porta aperta solo in OMBRA; il colore non è l’unico segnale.'};
    if(position<1370)return {id:'ARCHIVE-LEDGER-'+mode+'-'+state.archiveLog,role:'CH-PERNO',
      title:'REGISTRI DEL TEMPO',hint:'Il registro è facoltativo: E per leggerlo. CP-03 consente la ripresa.'};
    if(position<1750)return {id:'ARCHIVE-DOOR2-'+mode,role:'CH-TICA',
      title:'PORTA DI LUCE · '+mode,hint:'Premi E presso la seconda lampada: questa porta richiede LUCE.'};
    return {id:'ARCHIVE-EXIT-'+mode,role:'CH-NILO',
      title:'TERZA ORA · PORTALE',hint:'Attraversa entrambe le porte e raggiungi il portale.'};
  }
  if(state.level==='LV-02'){
    if(state.phase==='COMPLETED')return {id:'CANAL-VICTORY',role:'CH-NILO',
      title:'SECONDA ORA RESTITUITA',hint:'Il Custode è fermo. Hai riparato il pendolo. LV-03 è in sviluppo.'};
    if(state.phase==='DEFEATED')return {id:'CANAL-DEFEAT',role:'CH-TICA',
      title:'PENDOLO IN BLOCCO',hint:'Sei stato sconfitto. Premi R per ripartire da CP-02.'};
    if(state.boss&&state.boss.phase!=='LOCKED'){
      const b=state.boss;
      const messages={TELEGRAPH:['CUSTODE · AVVISO','Il pendolo sta caricando il colpo: evita la zona segnalata.'],
        STRIKE:['CUSTODE · COLPO','Salta o esci dalla zona del pendolo.'],
        RECOVERY:['CUSTODE · RIPARA','Avvicinati al meccanismo e premi E durante la finestra sicura.']};
      const msg=messages[b.phase]||['CUSTODE','Raggiungi il meccanismo.'];
      return {id:'BOSS-'+b.phase+'-'+b.repairs+'-'+b.hits,role:'CH-CUSTODE',
        title:msg[0],hint:msg[1]+' Riparazioni: '+b.repairs+'/2.'};
    }
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
  c.fillText('LE SEI ORE · '+state.level,689,38);
  for(let j=0;j<6;j++){
    const x=699+j*38,active=(j===0&&(state.level!=='LV-01'||state.phase==='COMPLETED'))||
      (j===1&&(state.level==='LV-03'||state.level==='LV-02'&&state.boss?.phase==='VICTORY'))||
      (j===2&&state.level==='LV-03'&&state.phase==='COMPLETED');
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

function canalBackdrop(c,state,cfg){
  const bands=[ART.ink,'#123e59','#1c526b','#276f83','#28798b','#207d8b','#15586e'];
  for(let row=0;row<18;row++)px(c,0,row*30,cfg.viewport,30,bands[Math.min(bands.length-1,Math.floor(row/3))]);
  for(let x=0;x<cfg.viewport+150;x+=115){
    const px0=(x-Math.floor(state.camera*.14/2)*2)%(cfg.viewport+100);
    px(c,px0,290+(x%3)*20,82,170,ART.near);
    px(c,px0+12,275+(x%2)*20,46,18,ART.shadow);
  }
  for(let row=0;row<6;row++){
    const y=465+row*14;
    px(c,0,y,cfg.viewport,12,row%2?'#155b77':'#174e72');
    for(let j=0;j<28;j++){
      const wave=(j*37+row*11+Math.floor(state.ticks/3)*2)%cfg.viewport;
      px(c,wave,y+4,14,2,row%2?ART.teal:ART.cream);
    }
  }
}
function canalDetails(c,state){
  for(const zone of LV02.currents){
    for(let k=0;k<3;k++){
      const x=zone.x+10+k*39,y=354+(k%2)*12,dir=zone.boost>0?1:-1;
      px(c,x,y,28,4,ART.teal);px(c,x+(dir>0?24:0),y-6,5,16,ART.cream);
    }
  }
  const p=lv02Surfaces(state.ticks).find(x=>x.moving);
  px(c,p.x,p.y-20,p.w,5,ART.teal);
  for(let n=0;n<4;n++)px(c,p.x+10+n*32,p.y-12,7,7,ART.cream);
  const x=1452;
  px(c,x,369,10,52,ART.ink);px(c,x+8,373,54,36,state.checkpointActive?ART.teal:ART.brass);
  px(c,x+16,382,38,16,ART.ink);
  c.fillStyle=ART.cream;c.font='bold 11px monospace';c.fillText('CP-02',x+14,394);
  const gate=2230;
  px(c,gate,340,70,120,ART.brass);px(c,gate+8,355,54,104,ART.ink);
  px(c,gate+18,375,34,7,ART.coral);
  c.fillStyle=ART.cream;c.font='bold 13px monospace';c.fillText('CUSTODE',gate-4,328);
  const b=state.boss;
  if(b&&b.phase!=='LOCKED'){
    // Shape, text and motion accompany color to signal danger.
    const active=b.phase==='STRIKE',warning=b.phase==='TELEGRAPH';
    const swing=(warning||active)?Math.round(Math.sin(state.ticks*.24)*46):0;
    px(c,gate+31,304,6,52,ART.brass);
    px(c,gate+20+swing,354,28,35,active?ART.coral:warning?ART.brass:ART.teal);
    if(warning||active){
      for(let k=0;k<3;k++)px(c,2160+k*53,407,30,7,active?ART.coral:ART.cream);
      c.fillStyle=ART.cream;c.font='bold 12px monospace';
      c.fillText(active?'COLPO!':'ATTENZIONE',2160,393);
    }
    c.fillStyle=ART.cream;c.font='bold 13px monospace';
    c.fillText('RIPARA '+b.repairs+'/2',2154,315);
  }
}

function archiveBackdrop(c,state,cfg){
  const bands=[ART.ink,'#1a2e4c','#253751','#2d4057','#374960','#465269'];
  for(let i=0;i<18;i++)px(c,0,i*30,cfg.viewport,30,bands[Math.min(5,Math.floor(i/3))]);
  for(let x=-60;x<cfg.viewport+80;x+=90){
    const far=(x-Math.floor(state.camera*.12))%(cfg.viewport+90);
    px(c,far,110,62,330,ART.shadow);
    for(let k=0;k<5;k++)px(c,far+12,130+k*51,36,9,ART.brass);
  }
  if(state.lightMode==='SHADOW'){
    for(let i=0;i<7;i++)px(c,0,i*65,cfg.viewport,12,'#15273c');
  }else{
    for(let i=0;i<7;i++)px(c,0,i*65,cfg.viewport,7,ART.brass);
  }
}
function archiveDetails(c,state){
  for(const lamp of LV03.switches){
    px(c,lamp.x-6,383,16,77,ART.ink);
    px(c,lamp.x-15,375,33,24,state.lightMode==='LIGHT'?ART.brass:ART.teal);
    c.fillStyle=ART.cream;c.font='bold 13px monospace';
    c.fillText('E · '+(state.lightMode==='LIGHT'?'LUCE':'OMBRA'),lamp.x-28,361);
  }
  for(const door of LV03.doors){
    const open=archiveDoorOpen(door,state.lightMode);
    px(c,door.x,242,door.w,218,ART.ink);
    px(c,door.x+5,250,door.w-10,202,open?ART.shadow:ART.coral);
    for(let k=0;k<5;k++)px(c,door.x+6,266+k*34,door.w-12,5,
      open?ART.teal:ART.cream);
    c.fillStyle=ART.cream;c.font='bold 12px monospace';
    c.fillText(door.label+' '+(open?'APERTA':'CHIUSA'),door.x-22,229);
    if(open)px(c,door.x+7,268,door.w-14,178,ART.shadow);
  }
  px(c,LV03.collectible.x-12,417,25,22,state.archiveLog?ART.teal:ART.brass);
  c.fillStyle=ART.cream;c.font='bold 12px monospace';
  c.fillText(state.archiveLog?'REGISTRO LETTO':'E · REGISTRO',LV03.collectible.x-42,404);
  px(c,LV03.checkpointX+5,377,36,42,state.checkpointActive?ART.teal:ART.brass);
  c.fillStyle=ART.cream;c.font='bold 12px monospace';
  c.fillText('CP-03',LV03.checkpointX,370);
  px(c,LV03.finishX+8,324,62,136,ART.brass);
  px(c,LV03.finishX+17,339,44,118,ART.shadow);
  c.fillStyle=ART.cream;c.font='bold 12px monospace';
  c.fillText('ORA III',LV03.finishX,314);
}
export function renderPixelWorld(c,state,cfg,platforms){
  c.clearRect(0,0,cfg.viewport,cfg.height);
  const second=state.level==='LV-02',third=state.level==='LV-03';
  if(third)archiveBackdrop(c,state,cfg);
  else if(second)canalBackdrop(c,state,cfg);
  else {skyline(c,state.camera);factoryMachinery(c,state.camera);}
  c.save();c.translate(-Math.floor(state.camera/2)*2,0);
  const surfaces=third?LV03.platforms:second?lv02Surfaces(state.ticks):platforms;
  for(let i=0;i<surfaces.length;i++)platform(c,surfaces[i],i);
  ledgeCues(c,surfaces,state);
  if(third)archiveDetails(c,state);
  else if(second)canalDetails(c,state);
  else {arrow(c,118,366);checkpoint(c,state);perno(c);gate(c);}
  nilo(c,state);tica(c,state);
  if(second||third){
    spriteLabel(c,Math.max(10,state.x-5),state.y-35,'NILO',ART.brass);
    spriteLabel(c,Math.max(14,state.x-50),state.y-75,'TICA',ART.teal);
  }else nameplates(c,state);
  c.restore();
  timeLanterns(c,state);
  // Dedicated in-game signage; primary accessible text remains outside canvas.
  px(c,14,13,274,56,ART.ink);px(c,16,15,270,52,'#213e56');
  c.fillStyle=ART.cream;c.font='bold 18px system-ui';
  c.fillText(third?'ARCHIVIO · ORA 3':second?'CANALE · ORA 2':'PROLOGO · ORA 1',28,39);
  c.fillStyle=ART.teal;c.font='14px system-ui';
  c.fillText(third?(state.checkpointActive?'CP-03 · ARCHIVIO SALVATO':
    state.lightMode==='SHADOW'?'MODALITÀ OMBRA':'MODALITÀ LUCE'):
    second?(state.checkpointActive?'MOLO SALVATO':'SEGUI LE CORRENTI'):
    (state.checkpointActive?'TEMPO SALVATO':'CERCATE IL SEGNATEMPO'),28,60);
  if(state.phase==='PAUSED'||state.phase==='COMPLETED'||state.phase==='DEFEATED'){
    px(c,209,184,544,158,ART.ink);px(c,216,192,528,142,'#24465c');
    c.fillStyle=ART.brass;c.font='bold 29px system-ui';
    c.fillText(state.phase==='PAUSED'?'TEMPO IN PAUSA':state.phase==='DEFEATED'?'CUSTODE · SCONFITTA':
      third?'TERZA ORA RESTITUITA':second?'SECONDA ORA RESTITUITA':'PRIMA ORA RESTITUITA',245,247);
    c.fillStyle=ART.ivory;c.font='16px system-ui';
    c.fillText(state.phase==='PAUSED'?'Premi P per continuare':state.phase==='DEFEATED'?'Premi R per riprovare':
      third?'Archivio completato; LV-04 in sviluppo':
      second?'Custode sconfitto; premi N per LV-03':'Premi N per il secondo livello',245,280);
    c.fillText('Premi R per ricominciare',245,307);
  }
}
