import {CFG, PLATFORMS, initialState, applyAction, step, encodeCheckpoint} from "./core.mjs";
import {renderPixelWorld,sceneCue} from "./art.mjs";
import {encodeLV02Checkpoint} from "./levels/lv-02.mjs";
import {encodeLV03Checkpoint} from "./levels/lv-03.mjs";
const canvas = document.querySelector("#game");
const ctx = canvas?.getContext("2d");
const hud = document.querySelector("#hud");
const announcement = document.querySelector("#announcement");
const sceneTitle=document.querySelector("#scene-title");
const sceneHint=document.querySelector("#scene-hint");
const sceneChapter=document.querySelector("#scene-chapter");
if(!sceneTitle||!sceneHint||!sceneChapter)throw new Error("Narrative scene cues unavailable");
if (!ctx) throw new Error("Canvas2D unavailable; no false playable claim");
const STORE = "nilo.checkpoint.v1";
const STORE_LV02 = "nilo.checkpoint.lv02.v1";
const STORE_LV03 = "nilo.checkpoint.lv03.v1";
const controls = new Set();
const jumpKeys=new Set(["Space","ArrowUp","KeyW"]);
let pendingRepairPress=false;
let pendingJumpPress=false;
const physicalJumpHeld=()=>[...jumpKeys].some(code=>controls.has(code));
let saved = null;
try { saved = localStorage.getItem(STORE); } catch { /* unavailable storage: gameplay degrades safely */ }
let savedLV02=null;
try {savedLV02=localStorage.getItem(STORE_LV02);}catch { /* no false persistence */ }
let savedLV03=null;
try {savedLV03=localStorage.getItem(STORE_LV03);}catch { /* no false persistence */ }
let state = initialState(saved,savedLV02,savedLV03);
let last = performance.now(), accumulator=0, lastPhase=state.phase, savedInSession=state.checkpointActive;
let lastTip="",lastCue="";
/** Read-only diagnostic readback. It does not advance, override or certify game state. */
Object.defineProperty(window,"__niloReadback",{
  configurable:false,enumerable:false,writable:false,
  value:()=>Object.freeze({phase:state.phase,level:state.level,x:state.x,y:state.y,
    onGround:state.onGround,checkpointActive:state.checkpointActive,
    ticks:state.ticks,deaths:state.deaths,camera:state.camera,vy:state.vy,
    jumpHeld:state.jumpHeld,supportId:state.supportId,currentForce:state.currentForce,
    boss:state.boss?{...state.boss}:null,
    lightMode:state.lightMode??null,doorsPassed:state.doorsPassed??0,
    archiveLog:Boolean(state.archiveLog),switchesUsed:state.switchesUsed??0})
});
const keyMap = new Set(["ArrowLeft","ArrowRight","ArrowUp","KeyA","KeyD","KeyW","Space","KeyP","KeyR","KeyN","KeyE"]);
function announce(text) { announcement.textContent=text; }
window.addEventListener("keydown", e => {
  if (!keyMap.has(e.code)) return;
  if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
  const wasJumpHeld=physicalJumpHeld();
  if (!e.repeat && (e.code === "KeyP" || e.code === "KeyR")) {
    // Transition boundaries consume pending presses, but preserve held keys
    // until a physical release. No input may be manufactured by a restart.
    pendingJumpPress=false;pendingRepairPress=false;
    state=applyAction(state,e.code,wasJumpHeld);
    announce(e.code==="KeyP"?(state.phase==="PAUSED"?"In pausa":"Gioco ripreso"):"Ricomincia dal checkpoint, se presente");
  }
  if(!e.repeat&&e.code==="KeyN"&&state.phase==="COMPLETED"&&
     (state.level==="LV-01"||state.level==="LV-02")){
    pendingJumpPress=false;pendingRepairPress=false;
    state=applyAction(state,"KeyN",wasJumpHeld);
    savedInSession=false;lastPhase=state.phase;lastTip="";lastCue="";
    announce(state.level==='LV-03'?
      'LV-03: Archivio delle Ombre. Premi E vicino alle lampade per cambiare luce e aprire le porte.':
      'LV-02: Canali dei Minuti. Il Custode sorveglia il pendolo.');
  }
  if(!e.repeat && jumpKeys.has(e.code) && !wasJumpHeld && state.phase==="PLAYING")
    pendingJumpPress=true;
  if(!e.repeat&&e.code==='KeyE'&&state.phase==='PLAYING'&&
     (state.level==='LV-02'||state.level==='LV-03'))
    pendingRepairPress=true;
  controls.add(e.code);
});
window.addEventListener("keyup", e => controls.delete(e.code));
window.addEventListener("blur", () => {controls.clear();pendingJumpPress=false;pendingRepairPress=false;});
document.addEventListener("visibilitychange", () => {
  if(document.hidden){
    controls.clear();pendingJumpPress=false;pendingRepairPress=false;
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
      jumpPressed:pendingJumpPress,repairPressed:pendingRepairPress,
      interactPressed:pendingRepairPress
    },CFG.tick);
    // A press/release within one animation frame is delivered exactly once.
    pendingJumpPress=false;pendingRepairPress=false;
    accumulator-=CFG.tick;
  }
  if(!savedInSession && state.checkpointActive){
    try {
      const key=state.level==='LV-03'?STORE_LV03:state.level==='LV-02'?STORE_LV02:STORE;
      const receipt=state.level==='LV-03'?encodeLV03Checkpoint():
        state.level==='LV-02'?encodeLV02Checkpoint():encodeCheckpoint();
      localStorage.setItem(key,receipt);savedInSession=true;
      announce("Checkpoint " + state.level + " salvato: ricarica la pagina per verificare.");
    }
    catch {announce("Checkpoint raggiunto, ma non persistito: archivio locale indisponibile.");}
  }
  if(lastPhase!==state.phase){lastPhase=state.phase;
    if(state.phase==="COMPLETED")announce(state.level==='LV-03'?
      "Terza ora restituita. L'Archivio è aperto; LV-04 è ancora in sviluppo.":
      state.level==='LV-02'?
      "Custode fermato. La seconda ora è stata restituita; premi N per entrare nell'Archivio.":
      "Prima ora restituita. Premi N per accedere ai Canali dei Minuti.");}
  const tip=state.phase==="PAUSED"?"Pausa · premi P per riprendere":
    state.level==='LV-03'?(state.phase==='COMPLETED'?
      "TERZA ORA RESTITUITA · LV-04 in sviluppo":
      state.checkpointActive?
      "Archivio delle Ombre · CP-03 salvato · E alterna luce e ombra presso le lampade":
      "Archivio delle Ombre · E alle lampade · attraversa le porte nell'ordine corretto"):
    state.level==='LV-02'?(state.phase==="COMPLETED"?
      "SECONDA ORA RESTITUITA · LV-03 in sviluppo":
      state.phase==='DEFEATED'?"Custode · sconfitta · premi R per riprovare":
      state.boss?.phase==='RECOVERY'?"Custode vulnerabile · premi E per riparare":
      state.boss?.phase==='STRIKE'?"Custode · colpo di pendolo · salta o evita":
      state.boss?.phase==='TELEGRAPH'?"Custode · pendolo in arrivo · preparati":
      state.checkpointActive?"Canali dei Minuti · checkpoint LV-02 salvato · prosegui al molo":
      "Canali dei Minuti · usa la piattaforma mobile e supera le correnti"):
    state.phase==="COMPLETED"?
      "Prologo concluso · premi N per LV-02 · altri quattro livelli non disponibili":
    state.checkpointActive?"Prima ora · checkpoint salvato · raggiungi il portale":
    state.x>750?"Segui il segnatempo dorato": "Prima ora · segui la freccia →";
  if(lastTip!==tip){lastTip=tip;hud.textContent="NILO · "+(state.phase==="PAUSED"?"Pausa":tip);}

  const cue=sceneCue(state);
  if(cue.id!==lastCue){
    lastCue=cue.id;
    sceneTitle.textContent=cue.title;
    sceneChapter.textContent=state.level==='LV-03'?'ORA III · ARCHIVIO DELLE OMBRE':
      state.level==='LV-02'?'ORA II · CANALI DEI MINUTI':'ORA I · CORTILE DELLE LANCETTE';
    sceneHint.textContent=cue.hint;
  }
  paint();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
