import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,initialLevelState,step,applyAction,decodeCheckpoint,CFG} from '../web/core.mjs';
import {LV02,lv02Surfaces,movingBridge,currentForceAt,encodeLV02Checkpoint,decodeLV02Checkpoint} from '../web/levels/lv-02.mjs';
import {sceneCue,renderPixelWorld} from '../web/art.mjs';
const goals=[255,535,710,955,1285,1580,1900];
test('LV02 locked until real LV01 completion',()=>{
 assert.equal(initialState().level,'LV-01');
 assert.equal(applyAction(initialState(),'KeyN').level,'LV-01');
 const lvl=applyAction({...initialState(),phase:'COMPLETED'},'KeyN');
 assert.equal(lvl.level,'LV-02');assert.equal(lvl.phase,'PLAYING');assert(!lvl.checkpointActive);
 assert.equal(applyAction({...lvl,phase:'COMPLETED'},'KeyN').level,'LV-02');
});
test('physical LV02 route crosses mobile bridge, both currents and checkpoint',()=>{
 let s=initialLevelState('LV-02'),index=0,bridge=false,east=false,west=false;
 for(let t=0;t<1100;t++){
  const j=index<goals.length&&s.onGround&&s.x>=goals[index];
  if(j)index++;
  bridge ||= s.supportId==='canal-bridge';east ||= s.currentForce===52;west ||= s.currentForce===-38;
  s=step(s,{right:true,jump:j});
  if(s.phase==='COMPLETED')break;
 }
 assert.equal(s.phase,'COMPLETED');assert.equal(index,7);assert.equal(s.deaths,0);
 assert(s.checkpointActive);assert(bridge&&east&&west);
 assert.notEqual(LV02.width,CFG.width);
});
test('moving bridge carries stationary supported player',()=>{
 const a=movingBridge(100),b=movingBridge(101);
 const state={...initialLevelState('LV-02'),ticks:100,x:a.x+30,y:a.y-CFG.playerHeight,
  onGround:true,vy:0,supportId:a.id};
 const after=step(state,{});
 assert(after.onGround);assert.equal(after.supportId,a.id);
 assert(Math.abs((after.x-state.x)-(b.x-a.x+after.vx*CFG.tick))<1e-8);
 assert.notEqual(movingBridge(100).x,movingBridge(160).x);
});
test('flow direction and extent are explicit',()=>{
 assert.equal(currentForceAt(620),52);assert.equal(currentForceAt(1680),-38);
 assert.equal(currentForceAt(10),0);
 const s={...initialLevelState('LV-02'),x:650,y:230,vy:30,onGround:false};
 assert.equal(step(s,{right:true}).vx-step({...s,x:500},{right:true}).vx,52);
});
test('CP02 never accepts CP01 or forged records; death/restart remain level-bound',()=>{
 const good=encodeLV02Checkpoint();
 assert.deepEqual(decodeLV02Checkpoint(good),{version:1,level:'LV-02',checkpointId:'CP-02'});
 assert.equal(decodeCheckpoint(good),null);
 for(const raw of [null,'','broken','{}',
  JSON.stringify({version:2,level:'LV-02',checkpointId:'CP-02'}),
  JSON.stringify({version:1,level:'LV-01',checkpointId:'CP-02'}),
  JSON.stringify({version:1,level:'LV-02',checkpointId:'CP-02',extra:true})])
  assert.equal(decodeLV02Checkpoint(raw),null);
 const s=initialState(null,good);assert.equal(s.level,'LV-02');
 assert.equal(s.x,LV02.checkpointSpawn.x);
 assert.equal(initialState(null,'forged').level,'LV-01');
 assert.equal(applyAction(s,'KeyR').level,'LV-02');
 const dead=step({...s,y:700,vy:120,onGround:false},{});
 assert.equal(dead.level,'LV-02');assert.equal(dead.x,LV02.checkpointSpawn.x);
});
test('Custode and the second hour are explicitly sealed',()=>{
 for(const phase of ['PLAYING','COMPLETED']){
  const s={...initialLevelState('LV-02'),phase};
  const c=sceneCue(s);assert(c.id.startsWith('CANAL-'));
  if(phase==='COMPLETED')assert.match(c.hint,/Custode/);
 }
 assert(LV02.exit.includes('not yet implemented'));
});
test('renderer stays one, with visible canal signage',()=>{
 const operations=[],ctx=new Proxy({}, {set(o,k,v){o[k]=v;return true},get(o,k){
  if(k in o)return o[k];
  if(['save','restore','beginPath','stroke','fill','closePath','clearRect','arc','moveTo','lineTo','translate','fillRect','fillText'].includes(k))
   return (...args)=>operations.push([k,...args]);
 }});
 renderPixelWorld(ctx,initialLevelState('LV-02'),CFG,lv02Surfaces(0));
 assert(operations.some(x=>x[0]==='fillText'&&String(x[1]).includes('CANALE')));
 assert(operations.filter(x=>x[0]==='fillRect').length>170);
});
test('20k seeded bridge/current cases remain finite and bounded (not game runs)',()=>{
 let seed=20261109;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<20000;i++){
  const p=lv02Surfaces(Math.floor(rand()*100000)).find(x=>x.moving);
  assert(p.x>=LV02.moving.baseX-LV02.moving.amplitude);
  assert(p.x<=LV02.moving.baseX+LV02.moving.amplitude);
  assert(p.w>CFG.playerWidth);
  assert([0,52,-38].includes(currentForceAt(rand()*LV02.width)));
 }
});
