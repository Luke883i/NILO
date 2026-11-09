import test from 'node:test';
import assert from 'node:assert/strict';
import {CFG,initialState,step,applyAction} from '../web/core.mjs';

test('bounded coyote jump, never after expired grace',()=>{
  let near={...initialState(),x:325,y:418,onGround:false,vy:120,coyoteLeft:2};
  const accepted=step(near,{jump:true});
  assert(accepted.vy<0);
  assert.equal(accepted.coyoteLeft,0);
  assert.equal(accepted.bufferLeft,0);
  const old=step({...near,coyoteLeft:0},{jump:true});
  assert(old.vy>0);
  assert(old.bufferLeft>0);
});
test('pre-landing buffered press fires; expired buffer does not',()=>{
  const falling={...initialState(),y:414,vy:250,onGround:false,coyoteLeft:0};
  const bounced=step(falling,{jump:true});
  assert(bounced.vy<0,'buffered input launches on landing tick');
  assert.equal(bounced.bufferLeft,0);
  assert.equal(bounced.onGround,false);
  let stale={...initialState(),y:0,vy:10,onGround:false,coyoteLeft:0};
  stale=step(stale,{jump:true});
  for(let i=0;i<CFG.bufferTicks+2;i++)stale=step(stale,{jump:false});
  assert.equal(stale.bufferLeft,0);
});
test('long hold jumps higher than short tap; release applies only once',()=>{
  let tapped=initialState(),held=initialState();
  for(let i=0;i<16;i++){
    tapped=step(tapped,{jump:i<3});
    held=step(held,{jump:true});
  }
  assert(held.y<tapped.y-1,`held ${held.y} vs tapped ${tapped.y}`);
  assert.equal(tapped.jumpCut,true);
  tapped=step(tapped,{jump:false});
  assert.equal(tapped.jumpCut,true);
});
test('held jump cannot auto-repeat after landing',()=>{
  let s=initialState(),landed=false,started=false;
  for(let i=0;i<85;i++){
    s=step(s,{jump:true});
    if(s.vy<0)started=true;
    if(started && s.onGround){landed=true;break;}
  }
  assert(landed,'must land even while holding Space');
  assert.equal(step(s,{jump:true}).vy,0);
  assert(step(step(s,{jump:false}),{jump:true}).vy<0);
});
test('pause preserves timers; restart and death reset jump latches',()=>{
  const airborne=step(initialState(),{jump:true});
  const paused=applyAction(airborne,'KeyP');
  assert.deepEqual(step(paused,{jump:false}),paused);
  const reset=applyAction(airborne,'KeyR');
  assert.equal(reset.jumpHeld,false);
  assert.equal(reset.bufferLeft,0);
  assert.equal(reset.coyoteLeft,0);
  const death=step({...airborne,y:700,vy:40},{});
  assert.equal(death.jumpHeld,false);
  assert.equal(death.bufferLeft,0);
});
test('original six-jump LV01 route remains complete with zero deaths',()=>{
  const goals=[220,510,760,1050,1320,1620];
  let s=initialState(),next=0;
  for(let i=0;i<900;i++){
    const jump=next<goals.length && s.x>=goals[next] && s.onGround;
    if(jump)next++;
    s=step(s,{right:true,jump});
    if(s.phase==='COMPLETED')break;
  }
  assert.equal(s.phase,'COMPLETED');
  assert.equal(next,6);
  assert.equal(s.deaths,0);
  assert.equal(s.checkpointActive,true);
});
