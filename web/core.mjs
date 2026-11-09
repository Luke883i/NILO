import {LV02,lv02Surfaces,movingBridge,currentForceAt,decodeLV02Checkpoint,encodeLV02Checkpoint} from "./levels/lv-02.mjs";
import {CUSTODE,initialCustode,enterCustode,advanceCustode} from "./levels/custode.mjs";
import {LV03,decodeLV03Checkpoint,encodeLV03Checkpoint,archiveDoorOpen,archiveInteraction} from "./levels/lv-03.mjs";
// NILO PR1 source-only prologue. Pure deterministic simulation, no browser APIs.
export const CFG = Object.freeze({
  width: 2100, height: 540, viewport: 960, ground: 460,
  playerWidth: 28, playerHeight: 42, speed: 235, gravity: 1450,
  jump: -555, tick: 1 / 60, checkpointX: 1210, finishX: 1950,
  coyoteTicks: 6, bufferTicks: 6, jumpReleaseMultiplier: 0.85
});
export const PLATFORMS = Object.freeze([
  {x:0,y:460,w:310}, {x:350,y:440,w:230}, {x:620,y:420,w:220},
  {x:880,y:440,w:230}, {x:1150,y:400,w:240},
  {x:1430,y:420,w:250}, {x:1720,y:460,w:380}
]);
const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
export function decodeCheckpoint(raw) {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!isObj(v) || Object.keys(v).sort().join(",") !== "checkpointId,level,version"
        || v.version !== 1 || v.level !== "LV-01" || v.checkpointId !== "CP-01") return null;
    return {version:1,level:"LV-01",checkpointId:"CP-01"};
  } catch { return null; }
}
export function encodeCheckpoint() {
  return JSON.stringify({version:1,level:"LV-01",checkpointId:"CP-01"});
}
export function initialLevelState(level='LV-01',saved=null){
  if(level==='LV-02'){
    const active=Boolean(decodeLV02Checkpoint(saved));
    const spawn=active?LV02.checkpointSpawn:LV02.initial;
    return {phase:'PLAYING',level:'LV-02',x:spawn.x,y:spawn.y,vx:0,vy:0,
      onGround:true,checkpointActive:active,camera:active?1170:0,
      deaths:0,ticks:0,coyoteLeft:0,bufferLeft:0,jumpHeld:false,
      jumpCut:false,supportId:null,currentForce:0,boss:initialCustode()};
  }
  if(level==='LV-03'){
    const active=Boolean(decodeLV03Checkpoint(saved));
    const spawn=active?LV03.checkpointSpawn:LV03.initial;
    return {phase:'PLAYING',level:'LV-03',x:spawn.x,y:spawn.y,vx:0,vy:0,
      onGround:true,checkpointActive:active,camera:active?950:0,
      deaths:0,ticks:0,coyoteLeft:0,bufferLeft:0,jumpHeld:false,
      jumpCut:false,supportId:null,currentForce:0,
      lightMode:active?'SHADOW':'LIGHT',archiveLog:false,switchesUsed:0,
      doorsPassed:active?1:0};
  }
  if(level!=='LV-01')throw new RangeError('unknown level');
  return initialState(saved);
}
export function initialState(saved = null, savedLV02=null, savedLV03=null) {
  // Resume is user-controlled local convenience, not a trusted historical victory.
  if(decodeLV03Checkpoint(savedLV03))return initialLevelState('LV-03',savedLV03);
  // CP-02 is a strict local resume record, not proof of past play: localStorage is user-controlled.
  if(decodeLV02Checkpoint(savedLV02))return initialLevelState('LV-02',savedLV02);
  const checkpointActive = Boolean(decodeCheckpoint(saved));
  const x = checkpointActive ? 1220 : 48;
  return {
    phase:"PLAYING", level:"LV-01", x, y:checkpointActive ? 358 : 418,
    vx:0, vy:0, onGround:true, checkpointActive,
    camera:checkpointActive ? 900 : 0, deaths:0, ticks:0,
    coyoteLeft:0, bufferLeft:0, jumpHeld:false, jumpCut:false, supportId:null,currentForce:0
  };
}
export function applyAction(state, code, physicalJumpHeld=false) {
  if(code==='KeyN'&&state.phase==='COMPLETED'&&state.level==='LV-01')
    return {...initialLevelState('LV-02'),jumpHeld:Boolean(physicalJumpHeld)};
  if(code==='KeyN'&&state.phase==='COMPLETED'&&state.level==='LV-02'&&
     state.boss?.phase==='VICTORY'&&state.boss?.repairs===CUSTODE.requiredRepairs)
    return {...initialLevelState('LV-03'),jumpHeld:Boolean(physicalJumpHeld)};
  if (code === "KeyP" && (state.phase === "PLAYING" || state.phase === "PAUSED")) {
    return {...state, phase:state.phase === "PAUSED" ? "PLAYING" : "PAUSED",
      jumpHeld:Boolean(physicalJumpHeld),bufferLeft:0};
  }
  if (code === "KeyR") {
    const saved=state.checkpointActive?
      (state.level==='LV-03'?encodeLV03Checkpoint():
       state.level==='LV-02'?encodeLV02Checkpoint():encodeCheckpoint()):null;
    return {...initialLevelState(state.level||'LV-01',saved),
      deaths:state.deaths,jumpHeld:Boolean(physicalJumpHeld)};
  }
  return state;
}
/** Fixed-step movement: a rising input edge starts one jump; buffered presses
 * may trigger on landing; a ledge departure has a bounded grace period.
 * Input is a held boolean, not a browser event or an authority assertion. */
export function step(state, input = {}, dt = CFG.tick) {
  if (state.phase !== "PLAYING") return state;
  if (!Number.isFinite(dt) || dt <= 0 || dt > 1/15) throw new RangeError("bounded fixed tick required");
  const held=Boolean(input.jump);
  const justPressed=Boolean(input.jumpPressed) || (held && !Boolean(state.jumpHeld));
  let coyoteLeft=state.onGround ? CFG.coyoteTicks : Math.max(0,(state.coyoteLeft ?? 0)-1);
  let bufferLeft=justPressed ? CFG.bufferTicks : Math.max(0,(state.bufferLeft ?? 0)-1);
  const second=state.level==='LV-02',third=state.level==='LV-03';
  const worldWidth=third?LV03.width:second?LV02.width:CFG.width;
  const platforms=third?LV03.platforms:second?lv02Surfaces(state.ticks+1):PLATFORMS;
  const movingCarry=second&&state.onGround&&state.supportId==='canal-bridge'?
    movingBridge(state.ticks+1).x-movingBridge(state.ticks).x:0;
  const flow=second?currentForceAt(state.x+CFG.playerWidth/2):0;
  const vx=((input.right ? 1 : 0) - (input.left ? 1 : 0))*CFG.speed+flow;
  let x=Math.max(0,Math.min(worldWidth-CFG.playerWidth,state.x+movingCarry+vx*dt));
  const archive=third?archiveInteraction(state,state.x,
    {interactPressed:Boolean(input.interactPressed),grounded:state.onGround}):null;
  if(third){
    // Physically solid full-height gates: cannot be jumped over or tunneled through.
    for(const door of LV03.doors){
      if(archiveDoorOpen(door,archive.lightMode))continue;
      if(state.x+CFG.playerWidth<=door.x&&x+CFG.playerWidth>door.x)
        x=door.x-CFG.playerWidth;
      else if(state.x>=door.x+door.w&&x<door.x+door.w)
        x=door.x+door.w;
    }
  }
  let y=state.y,vy=state.vy,grounded=state.onGround;
  let supportId=state.supportId??null;
  let jumpCut=Boolean(state.jumpCut);
  if(bufferLeft>0 && coyoteLeft>0) {
    vy=CFG.jump;grounded=false;coyoteLeft=0;bufferLeft=0;jumpCut=false;
  } else if(!held && vy<0 && !jumpCut) {
    vy*=CFG.jumpReleaseMultiplier;
    jumpCut=true;
  }
  const prevBottom=y+CFG.playerHeight;
  vy=Math.min(950,vy+CFG.gravity*dt);
  y+=vy*dt;
  if(vy>=0){
    for(const p of platforms){
      if(x+CFG.playerWidth>p.x && x<p.x+p.w &&
          prevBottom <= p.y + 2 && y+CFG.playerHeight>=p.y &&
          y>=p.y-CFG.playerHeight){
        y=p.y-CFG.playerHeight;vy=0;grounded=true;coyoteLeft=CFG.coyoteTicks;
        supportId=p.id||null;
        // Pre-landing jump presses execute as soon as a valid platform is hit.
        if(bufferLeft>0){
          vy=CFG.jump;grounded=false;bufferLeft=0;coyoteLeft=0;jumpCut=false;
        }
        break;
      }
    }
  }
  if(vy!==0){grounded=false;supportId=null;}
  let checkpointActive=state.checkpointActive;
  if(!checkpointActive && grounded && (third?
    (x>=LV03.checkpointX&&x<=1300):
    second?(x>=LV02.checkpointX&&x<=1600):
    (x>=CFG.checkpointX && x<=1390))) checkpointActive=true;
  if(y>CFG.height+100){
    const saved=checkpointActive?(third?encodeLV03Checkpoint():
      second?encodeLV02Checkpoint():encodeCheckpoint()):null;
    const fresh=initialLevelState(third?'LV-03':second?'LV-02':'LV-01',saved);
    return {...fresh,deaths:state.deaths+1,ticks:state.ticks+1,jumpHeld:held};
  }
  const camera=Math.max(0,Math.min(worldWidth-CFG.viewport,x-280));
  if(third){
    let doorsPassed=archive.doorsPassed??0;
    const [first,secondDoor]=LV03.doors;
    if(doorsPassed===0&&state.x<=first.x+first.w&&x>first.x+first.w&&
       archiveDoorOpen(first,archive.lightMode))doorsPassed=1;
    if(doorsPassed===1&&state.x<=secondDoor.x+secondDoor.w&&x>secondDoor.x+secondDoor.w&&
       archiveDoorOpen(secondDoor,archive.lightMode))doorsPassed=2;
    const phase=x>=LV03.finishX&&grounded&&doorsPassed===2?'COMPLETED':'PLAYING';
    return {...archive,phase,level:'LV-03',x,y,vx,vy,onGround:grounded,
      checkpointActive,camera,deaths:state.deaths,ticks:state.ticks+1,
      coyoteLeft,bufferLeft,jumpHeld:held,jumpCut,supportId,currentForce:0,
      doorsPassed};
  }
  let boss=second?(state.boss??initialCustode()):undefined;
  if(second&&boss.phase==='LOCKED'&&x>=CUSTODE.gateX&&grounded)
    boss=enterCustode(boss);
  else if(second&&boss.phase!=='LOCKED')
    boss=advanceCustode(boss,{
      inStrikeZone:x>=CUSTODE.strikeMinX&&x<=CUSTODE.strikeMaxX,
      nearMechanism:x>=CUSTODE.repairMinX&&x<=CUSTODE.repairMaxX,
      grounded,repairPressed:Boolean(input.repairPressed)
    });
  const phase=second?(boss.phase==='VICTORY'?'COMPLETED':
    boss.phase==='DEFEAT'?'DEFEATED':'PLAYING'):
    (x>=CFG.finishX&&grounded?'COMPLETED':'PLAYING');
  return {phase,level:second?'LV-02':'LV-01',x,y,vx,vy,onGround:grounded,
    checkpointActive,camera,deaths:state.deaths,ticks:state.ticks+1,
    coyoteLeft,bufferLeft,jumpHeld:held,jumpCut,supportId,currentForce:flow,
    ...(second?{boss}:{})};
}
