import {CFG, PLATFORMS, initialState, applyAction, step, encodeCheckpoint} from "./core.mjs";
import {renderPixelWorld,sceneCue} from "./art.mjs";
const canvas = document.querySelector("#game");
const ctx = canvas?.getContext("2d");
const hud = document.querySelector("#hud");
const announcement = document.querySelector("#announcement");
const sceneTitle=document.querySelector("#scene-title");
const sceneHint=document.querySelector("#scene-hint");
if(!sceneTitle||!sceneHint)throw new Error("Narrative scene cues unavailable");
if (!ctx) throw new Error("Canvas2D unavailable; no false playable claim");
const STORE = "nilo.checkpoint.v1";
const controls = new Set();
const jumpKeys=new Set(["Space","ArrowUp","KeyW"]);
let pendingJumpPress=false;
const physicalJumpHeld=()=>[...jumpKeys].some(code=>controls.has(code));
let saved = null;
try { saved = localStorage.getItem(STORE); } catch { /* unavailable storage: gameplay degrades safely */ }
let state = initialState(saved);
let last = performance.now(), accumulator=0, lastPhase=state.phase, savedInSession=state.checkpointActive;
let lastTip="",lastCue="";
/** Read-only diagnostic readback. It does not advance, override or certify game state. */
Object.defineProperty(window,"__niloReadback",{
  configurable:false,enumerable:false,writable:false,
  value:()=>Object.freeze({phase:state.phase,x:state.x,y:state.y,
    onGround:state.onGround,checkpointActive:state.checkpointActive,
    ticks:state.ticks,deaths:state.deaths,camera:state.camera,vy:state.vy,jumpHeld:state.jumpHeld})
});
const keyMap = new Set(["ArrowLeft","ArrowRight","ArrowUp","KeyA","KeyD","KeyW","Space","KeyP","KeyR"]);
function announce(text) { announcement.textContent=text; }
window.addEventListener("keydown", e => {
  if (!keyMap.has(e.code)) return;
  if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
  const wasJumpHeld=physicalJumpHeld();
  if (!e.repeat && (e.code === "KeyP" || e.code === "KeyR")) {
    // Transition boundaries consume pending presses, but preserve held keys
    // until a physical release. No input may be manufactured by a restart.
    pendingJumpPress=false;
    state=applyAction(state,e.code,wasJumpHeld);
    announce(e.code==="KeyP"?(state.phase==="PAUSED"?"In pausa":"Gioco ripreso"):"Ricomincia dal checkpoint, se presente");
  }
  if(!e.repeat && jumpKeys.has(e.code) && !wasJumpHeld && state.phase==="PLAYING")
    pendingJumpPress=true;
  controls.add(e.code);
});
window.addEventListener("keyup", e => controls.delete(e.code));
window.addEventListener("blur", () => {controls.clear();pendingJumpPress=false;});
document.addEventListener("visibilitychange", () => {
  if(document.hidden){
    controls.clear();pendingJumpPress=false;
    if(state.phase==="PLAYING"){
      state=applyAction(state,"KeyP",false);
      announce("In pausa: finestra non attiva");
    }
  }
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
    const jump=physicalJumpHeld()||pendingJumpPress;
    state=step(state,{
      left:controls.has("ArrowLeft")||controls.has("KeyA"),
      right:controls.has("ArrowRight")||controls.has("KeyD"),jump,
      jumpPressed:pendingJumpPress
    },CFG.tick);
    // A press/release within one animation frame is delivered exactly once.
    pendingJumpPress=false;
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

  const cue=sceneCue(state);
  if(cue.id!==lastCue){
    lastCue=cue.id;
    sceneTitle.textContent=cue.title;
    sceneHint.textContent=cue.hint;
  }
  paint();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
