import {CFG, PLATFORMS, initialState, applyAction, step, encodeCheckpoint} from "./core.mjs";
const canvas = document.querySelector("#game");
const ctx = canvas?.getContext("2d");
const hud = document.querySelector("#hud");
const announcement = document.querySelector("#announcement");
if (!ctx) throw new Error("Canvas2D unavailable; no false playable claim");
const STORE = "nilo.checkpoint.v1";
const controls = new Set();
let saved = null;
try { saved = localStorage.getItem(STORE); } catch { /* unavailable storage: gameplay degrades safely */ }
let state = initialState(saved);
let last = performance.now(), accumulator=0, lastPhase=state.phase, savedInSession=state.checkpointActive;
const keyMap = new Set(["ArrowLeft","ArrowRight","ArrowUp","KeyA","KeyD","KeyW","Space","KeyP","KeyR"]);
function announce(text) { announcement.textContent=text; }
window.addEventListener("keydown", e => {
  if (!keyMap.has(e.code)) return;
  if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
  if (!e.repeat && (e.code === "KeyP" || e.code === "KeyR")) {
    state = applyAction(state,e.code);
    announce(e.code==="KeyP"?(state.phase==="PAUSED"?"In pausa":"Gioco ripreso"):"Ricomincia dal checkpoint, se presente");
  }
  controls.add(e.code);
});
window.addEventListener("keyup", e => controls.delete(e.code));
window.addEventListener("blur", () => controls.clear());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.phase==="PLAYING") {state=applyAction(state,"KeyP"); announce("In pausa: finestra non attiva");}
});
function drawClock(x,y,r,t) {
  ctx.save();ctx.translate(x,y);ctx.strokeStyle="#d4b17b";ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.sin(t)*r*.56,-Math.cos(t)*r*.56);ctx.stroke();
  ctx.restore();
}
function paint() {
  const bg=ctx.createLinearGradient(0,0,0,CFG.height);
  bg.addColorStop(0,"#173552");bg.addColorStop(1,"#446477");
  ctx.fillStyle=bg;ctx.fillRect(0,0,CFG.viewport,CFG.height);
  for(let i=0;i<11;i++) drawClock(90+i*95-(state.camera*.18)%95,120+(i%3)*38,18+i%3*9,i*.7);
  ctx.save();ctx.translate(-state.camera,0);
  ctx.fillStyle="#183247";ctx.fillRect(0,480,CFG.width,80);
  for(const p of PLATFORMS){ctx.fillStyle="#947c6b";ctx.fillRect(p.x,p.y,p.w,CFG.height-p.y);
    ctx.fillStyle="#dfbe78";ctx.fillRect(p.x,p.y,p.w,9);
    for(let x=p.x+18;x<p.x+p.w-8;x+=36){ctx.fillStyle="#33495a";ctx.fillRect(x,p.y+23,12,11);}}
  // Clockwork guide Tica: shape-only original placeholder.
  const tx=state.x-20,ty=state.y-37;
  ctx.fillStyle="#c58e40";ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-14,ty+8);ctx.lineTo(tx,ty+9);ctx.lineTo(tx+12,ty+2);ctx.closePath();ctx.fill();
  // Checkpoint marker: visible before and after activation.
  ctx.fillStyle=state.checkpointActive?"#9fe3a0":"#f5ca65";ctx.fillRect(1245,345,5,54);
  ctx.beginPath();ctx.moveTo(1250,344);ctx.lineTo(1290,360);ctx.lineTo(1250,377);ctx.fill();
  // Exit arch at 1980.
  ctx.fillStyle="#7ec2b0";ctx.fillRect(1950,382,58,78);ctx.fillStyle="#173552";ctx.fillRect(1963,400,32,60);
  // Nilo's deliberately original silhouette, no external assets.
  ctx.fillStyle="#f6c653";ctx.fillRect(state.x,state.y,CFG.playerWidth,CFG.playerHeight);
  ctx.fillStyle="#27647a";ctx.fillRect(state.x-5,state.y-5,CFG.playerWidth+10,9);
  ctx.fillStyle="#f0e7d2";ctx.fillRect(state.x+18,state.y+12,5,5);
  ctx.fillStyle="#d86b51";ctx.fillRect(state.x+4,state.y+32,20,6);
  ctx.restore();
  ctx.fillStyle="#f0e8c6";ctx.font="bold 18px system-ui";
  ctx.fillText("ORA 1 / 6 · Cortile delle Lancette",22,36);
  ctx.font="14px system-ui";ctx.fillText("CP "+(state.checkpointActive?"ATTIVO":"DA TROVARE")+"  · Cadute "+state.deaths,22,62);
  if (state.phase==="PAUSED"||state.phase==="COMPLETED"){
    ctx.fillStyle="rgba(10,28,45,.87)";ctx.fillRect(240,195,480,125);
    ctx.fillStyle="#f7d27b";ctx.font="bold 27px system-ui";
    ctx.fillText(state.phase==="PAUSED"?"PAUSA · P per riprendere":"PROLOGO COMPLETATO",278,265);
  }
}
function frame(now) {
  const delta=Math.min(.05,Math.max(0,(now-last)/1000));last=now;accumulator+=delta;
  let n=0;
  while(accumulator>=CFG.tick && n++<4){
    state=step(state,{
      left:controls.has("ArrowLeft")||controls.has("KeyA"),
      right:controls.has("ArrowRight")||controls.has("KeyD"),
      jump:controls.has("Space")||controls.has("ArrowUp")||controls.has("KeyW")
    },CFG.tick);
    accumulator-=CFG.tick;
  }
  if(!savedInSession && state.checkpointActive){
    try {localStorage.setItem(STORE,encodeCheckpoint());savedInSession=true;announce("Checkpoint salvato: ricarica la pagina per verificare.");}
    catch {announce("Checkpoint raggiunto, ma non persistito: archivio locale indisponibile.");}
  }
  if(lastPhase!==state.phase){lastPhase=state.phase;
    if(state.phase==="COMPLETED")announce("Prologo completato. Il resto del gioco è ancora da realizzare.");}
  hud.textContent="NILO · "+(state.phase==="COMPLETED"?"Prologo concluso":state.phase==="PAUSED"?"Pausa":"In gioco")+" · Checkpoint "+(state.checkpointActive?"attivo":"inattivo");
  paint();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
