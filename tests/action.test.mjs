import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTION_CFG,initialAction,advanceAction} from '../web/action.mjs';
import {CFG,PLATFORMS,initialState,step,applyAction} from '../web/core.mjs';
const shooter=()=>({...initialState(),x:428,y:398,onGround:true});
test('one physical attack edge shoots; subsequent idle ticks do not auto-fire',()=>{
  let s=shooter();s=step(s,{attackPressed:true});
  assert.equal(s.action.shots.length,1);
  for(let i=0;i<3;i++)s=step(s,{});
  assert.equal(s.action.shots.length,0,'projectile is consumed by physical enemy contact');
  assert.equal(s.action.kills,1);
  assert(s.action.cooldown<ACTION_CFG.cooldownTicks);
  assert.equal(step(s,{attackPressed:true}).action.shots.length,0,'cooldown prevents a second shot');
});
test('a simulated physical projectile can kill a patrolling enemy exactly once',()=>{
  let s=step(shooter(),{attackPressed:true});
  for(let i=0;i<10;i++)s=step(s,{});
  assert.equal(s.action.kills,1);
  assert.equal(s.action.enemies[0].alive,false);
  for(let i=0;i<30;i++)s=step(s,{});
  assert.equal(s.action.kills,1);
});
test('no ghost attack while paused; restart restores reversible combat state',()=>{
  const s=applyAction(shooter(),'KeyP');
  assert.deepEqual(step(s,{attackPressed:true}),s);
  const attacked=step(shooter(),{attackPressed:true});
  const reset=applyAction(attacked,'KeyR');
  assert.equal(reset.action.shots.length,0);
  assert.equal(reset.action.health,ACTION_CFG.maxHealth);
});
test('enemy contact damages once per invulnerability window and HP=0 defeats',()=>{
  const near={...shooter(),x:493};
  let s=step(near,{});
  assert.equal(s.action.health,2);assert(s.action.invulnerable>0);
  for(let i=0;i<5;i++)s=step(s,{});
  assert.equal(s.action.health,2);
  const dying=step({...near,action:{...near.action,health:1}},{});
  assert.equal(dying.action.health,0);
  assert.equal(dying.phase,'DEFEATED');
  assert.equal(applyAction(dying,'KeyR').action.health,3);
});
test('downward stomp is a real contact and bounces without reducing HP',()=>{
  const s={...initialState(),x:485,y:370,onGround:false,vy:275};
  const n=step(s,{});
  assert.equal(n.action.kills,1);assert.equal(n.action.enemies[0].alive,false);
  assert.equal(n.action.health,3);assert.equal(n.vy,ACTION_CFG.stompBounce);
});
test('collectibles require spatial contact and cannot double-count',()=>{
  let s=step({...initialState(),x:178,y:418},{});
  assert.equal(s.action.shards,1);
  for(let i=0;i<5;i++)s=step(s,{});
  assert.equal(s.action.shards,1);
});
test('projectiles collide with solid platforms before enemies behind them',()=>{
  const a={...initialAction(),shots:[{x:340,y:450,dir:1}]};
  const out=advanceAction(a,{x:100,y:418,w:28,h:42,vy:0,prevBottom:460,worldWidth:CFG.width},{},CFG.tick,PLATFORMS);
  assert.equal(out.action.shots.length,0);
});
test('shared game truth remains compatible with original LV02/LV03 branches',()=>{
  for(const level of ['LV-02','LV-03']){
    const initial=level==='LV-02'?initialState(null,'{"version":1,"level":"LV-02","checkpointId":"CP-02"}'):
      initialState(null,null,'{"version":1,"level":"LV-03","checkpointId":"CP-03"}');
    assert.equal(initial.level,level);
    assert.equal(step(initial,{attackPressed:true}).level,level);
  }
});
