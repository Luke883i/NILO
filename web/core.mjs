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
export function initialState(saved = null) {
  const checkpointActive = Boolean(decodeCheckpoint(saved));
  const x = checkpointActive ? 1220 : 48;
  return {
    phase:"PLAYING", x, y:checkpointActive ? 358 : 418,
    vx:0, vy:0, onGround:true, checkpointActive,
    camera:checkpointActive ? 900 : 0, deaths:0, ticks:0,
    coyoteLeft:0, bufferLeft:0, jumpHeld:false, jumpCut:false
  };
}
export function applyAction(state, code) {
  if (code === "KeyP" && (state.phase === "PLAYING" || state.phase === "PAUSED")) {
    return {...state, phase:state.phase === "PAUSED" ? "PLAYING" : "PAUSED"};
  }
  if (code === "KeyR") {
    return {...initialState(state.checkpointActive ? encodeCheckpoint() : null),
      deaths:state.deaths};
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
  const justPressed=held && !Boolean(state.jumpHeld);
  let coyoteLeft=state.onGround ? CFG.coyoteTicks : Math.max(0,(state.coyoteLeft ?? 0)-1);
  let bufferLeft=justPressed ? CFG.bufferTicks : Math.max(0,(state.bufferLeft ?? 0)-1);
  const vx=((input.right ? 1 : 0) - (input.left ? 1 : 0))*CFG.speed;
  const x=Math.max(0,Math.min(CFG.width-CFG.playerWidth,state.x+vx*dt));
  let y=state.y,vy=state.vy,grounded=state.onGround;
  let jumpCut=Boolean(state.jumpCut);
  if(bufferLeft>0 && coyoteLeft>0) {
    vy=CFG.jump;grounded=false;coyoteLeft=0;bufferLeft=0;jumpCut=false;
  } else if(!held && state.jumpHeld && vy<0 && !jumpCut) {
    vy*=CFG.jumpReleaseMultiplier;
    jumpCut=true;
  }
  const prevBottom=y+CFG.playerHeight;
  vy=Math.min(950,vy+CFG.gravity*dt);
  y+=vy*dt;
  if(vy>=0){
    for(const p of PLATFORMS){
      if(x+CFG.playerWidth>p.x && x<p.x+p.w &&
          prevBottom <= p.y + 2 && y+CFG.playerHeight>=p.y &&
          y>=p.y-CFG.playerHeight){
        y=p.y-CFG.playerHeight;vy=0;grounded=true;coyoteLeft=CFG.coyoteTicks;
        // Pre-landing jump presses execute as soon as a valid platform is hit.
        if(bufferLeft>0){
          vy=CFG.jump;grounded=false;bufferLeft=0;coyoteLeft=0;jumpCut=false;
        }
        break;
      }
    }
  }
  if(vy!==0) grounded=false;
  let checkpointActive=state.checkpointActive;
  if(!checkpointActive && grounded && x>=CFG.checkpointX && x<=1390) checkpointActive=true;
  if(y>CFG.height+100){
    const fresh=initialState(checkpointActive?encodeCheckpoint():null);
    return {...fresh,deaths:state.deaths+1,ticks:state.ticks+1};
  }
  const camera=Math.max(0,Math.min(CFG.width-CFG.viewport,x-280));
  const phase=x>=CFG.finishX && grounded ? "COMPLETED" : "PLAYING";
  return {phase,x,y,vx,vy,onGround:grounded,checkpointActive,camera,
    deaths:state.deaths,ticks:state.ticks+1,coyoteLeft,bufferLeft,
    jumpHeld:held,jumpCut};
}
