import test from "node:test";
import assert from "node:assert/strict";
import {CFG,PLATFORMS,initialState,step,applyAction,encodeCheckpoint,decodeCheckpoint} from "../web/core.mjs";
test("checkpoint rejects old, malformed, forged or unrelated storage",()=>{
  for(const raw of [null,"","not-json","{}",'{"version":2,"level":"LV-01","checkpointId":"CP-01"}',
    '{"version":1,"level":"LV-09","checkpointId":"CP-01"}',
    '{"version":1,"level":"LV-01","checkpointId":"CP-01","approved":true}']) assert.equal(decodeCheckpoint(raw),null);
  assert.equal(decodeCheckpoint(encodeCheckpoint()).checkpointId,"CP-01");
  assert.equal(initialState("forged").x,48);
  assert.equal(initialState(encodeCheckpoint()).x,1220);
});
test("left/right inputs move monotonically and never outside world",()=>{
  let s=initialState();let ahead=step(s,{right:true});let behind=step(s,{left:true});
  assert(ahead.x>s.x);assert(behind.x<s.x);
  assert.equal(step({...s,x:CFG.width-CFG.playerWidth},{right:true}).x,CFG.width-CFG.playerWidth);
  assert.equal(step({...s,x:0},{left:true}).x,0);
});
test("jump and platform landing are physical; landing does not tunnel",()=>{
  let s=initialState();let top=s.y,min=top;
  for(let i=0;i<65;i++){s=step(s,{jump:i===0});min=Math.min(min,s.y);}
  assert(min<top-45,"a visible jump must occur");
  assert(Math.abs(s.y-top)<1,"the player must return to the starting platform");
  assert.equal(s.onGround,true);
});
test("camera scrolls and stays within the scene",()=>{
  let s=initialState();s={...s,x:900};const n=step(s,{});
  assert(n.camera>0 && n.camera<=CFG.width-CFG.viewport);
  assert.equal(step({...s,x:CFG.width-CFG.playerWidth},{},CFG.tick).camera,CFG.width-CFG.viewport);
});
test("checkpoint requires grounded progression, and restarts keep it",()=>{
  let s={...initialState(),x:1208,y:358,onGround:true};
  s=step(s,{right:true});assert.equal(s.checkpointActive,true);
  let reset=applyAction({...s,deaths:2},"KeyR");
  assert.equal(reset.x,1220);assert.equal(reset.checkpointActive,true);assert.equal(reset.deaths,2);
});
test("pause freezes physics and restart resumes",()=>{
  const s=initialState();const paused=applyAction(s,"KeyP");
  assert.equal(paused.phase,"PAUSED");
  assert.deepEqual(step(paused,{right:true,jump:true}),paused);
  assert.equal(applyAction(paused,"KeyP").phase,"PLAYING");
  assert.equal(applyAction(paused,"KeyR").phase,"PLAYING");
});
test("fallen player respawns without corrupting checkpoint",()=>{
  let s={...initialState(encodeCheckpoint()),y:700,phase:"PLAYING",onGround:false};
  const reset=step(s,{});assert.equal(reset.x,1220);assert.equal(reset.deaths,1);
  assert.equal(reset.checkpointActive,true);
});
test("finish state requires real right-side progress and ground contact",()=>{
  let s={...initialState(),x:CFG.finishX-2,y:418,onGround:true};
  const finished=step(s,{right:true});
  assert.equal(finished.phase,"COMPLETED");
  assert.deepEqual(step(finished,{right:true}),finished);
  assert.equal(step({...s,onGround:false,y:0},{right:true}).phase,"PLAYING");
});
test("physics rejects unbounded dt, platforms are declaratively ordered",()=>{
  assert.throws(()=>step(initialState(),{right:true},2),RangeError);
  assert.equal(PLATFORMS.length,7);
  assert(PLATFORMS.every(p=>p.w>0 && p.y<CFG.height));
});
