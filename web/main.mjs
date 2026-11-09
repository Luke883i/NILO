import {CFG, PLATFORMS, initialState, applyAction, step, encodeCheckpoint} from "./core.mjs";
import {renderPixelWorld} from "./art.mjs";
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
let lastTip="";
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
// Pixel-resolution buffer: 2x nearest-neighbour output, source physics unchanged.
const pixelCanvas=document.createElement("canvas");
pixelCanvas.width=480;pixelCanvas.height=270;
const pixelCtx=pixelCanvas.getContext("2d",{alpha:false});
if(!pixelCtx) throw new Error("Pixel canvas unavailable");
pixelCtx.setTransform(.5,0,0,.5,0,0);
function paint() {
  renderPixelWorld(pixelCtx,state,CFG,PLATFORMS);
  ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,CFG.viewport,CFG.height);
  ctx.drawImage(pixelCanvas,0,0,CFG.viewport,CFG.height);
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
  const tip=state.phase==="PAUSED"?"Pausa · premi P per riprendere":
    state.phase==="COMPLETED"?"Prologo concluso · altri 5 capitoli non ancora disponibili":
    state.checkpointActive?"Prima ora · checkpoint salvato · raggiungi il portale":
    state.x>750?"Segui il segnatempo dorato": "Prima ora · segui la freccia →";
  if(lastTip!==tip){lastTip=tip;hud.textContent="NILO · "+(state.phase==="PAUSED"?"Pausa":tip);}

  paint();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
