import test from 'node:test';
import assert from 'node:assert/strict';
import {CFG,initialState,initialLevelState,step,applyAction} from '../web/core.mjs';
import {LV03,decodeLV03Checkpoint,encodeLV03Checkpoint,archiveDoorOpen,archiveInteraction} from '../web/levels/lv-03.mjs';

test('PR12 RED: LV03 only follows Custode victory or valid local CP03 resume',()=>{
 const s=initialLevelState('LV-02');
 assert.equal(applyAction(s,'KeyN').level,'LV-02');
 assert.equal(applyAction({...s,phase:'DEFEATED'},'KeyN').level,'LV-02');
 const won={...s,phase:'COMPLETED',boss:{...s.boss,phase:'VICTORY',repairs:2}};
 const entered=applyAction(won,'KeyN');
 assert.equal(entered.level,'LV-03');
 assert.equal(entered.phase,'PLAYING');
 assert.equal(entered.lightMode,'LIGHT');
 assert.equal(entered.doorsPassed,0);
 assert.equal(initialState(null,null,encodeLV03Checkpoint()).level,'LV-03');
});
test('PR12 RED: CP03 has exact schema and never accepts another level or unknown keys',()=>{
 const saved=encodeLV03Checkpoint();
 assert.deepEqual(decodeLV03Checkpoint(saved),{version:1,level:'LV-03',checkpointId:'CP-03'});
 for(const raw of [null,'','bad','{}',JSON.stringify({version:2,level:'LV-03',checkpointId:'CP-03'}),
  JSON.stringify({version:1,level:'LV-02',checkpointId:'CP-03'}),
  JSON.stringify({version:1,level:'LV-03',checkpointId:'CP-02'}),
  JSON.stringify({version:1,level:'LV-03',checkpointId:'CP-03',hourThree:true})])
  assert.equal(decodeLV03Checkpoint(raw),null);
 const restored=initialState(null,null,saved);
 assert.equal(restored.level,'LV-03');
 assert(restored.checkpointActive);
 assert.equal(restored.doorsPassed,1);
 assert.equal(restored.phase,'PLAYING');
});
test('PR12 RED: light and shadow doors have opposite actual collision conditions',()=>{
 const a=LV03.doors[0],b=LV03.doors[1];
 assert.equal(archiveDoorOpen(a,'LIGHT'),false);
 assert.equal(archiveDoorOpen(a,'SHADOW'),true);
 assert.equal(archiveDoorOpen(b,'LIGHT'),true);
 assert.equal(archiveDoorOpen(b,'SHADOW'),false);
 const closed={...initialLevelState('LV-03'),x:a.x-CFG.playerWidth-2,y:418,onGround:true};
 const blocked=step(closed,{right:true});
 assert(blocked.x<=a.x-CFG.playerWidth,'closed gate must stop actual motion');
 assert.equal(blocked.phase,'PLAYING');
 const opened=step({...closed,lightMode:'SHADOW'},{right:true});
 assert(opened.x>blocked.x,'light changes actual physics, not just color');
});
test('PR12 RED: E is a contextual edge near consoles, not location-only autopilot',()=>{
 const a=initialLevelState('LV-03');
 const close={...a,x:LV03.switches[0].x,y:418,onGround:true};
 assert.equal(step(close,{}).lightMode,'LIGHT');
 assert.equal(step(close,{interactPressed:true}).lightMode,'SHADOW');
 assert.equal(step({...close,onGround:false},{interactPressed:true}).lightMode,'LIGHT');
 assert.equal(step(a,{interactPressed:true}).lightMode,'LIGHT');
 assert.equal(archiveInteraction({lightMode:'SHADOW',archiveLog:false,switchesUsed:1},LV03.switches[1].x,{interactPressed:true,grounded:true}).lightMode,'LIGHT');
});
test('PR12 RED: optional log does not grant hour 3 or defeat gate dependencies',()=>{
 const a=initialLevelState('LV-03');
 const s=step({...a,x:LV03.collectible.x,y:418,onGround:true},{interactPressed:true});
 assert(s.archiveLog);
 assert.equal(s.phase,'PLAYING');
 assert.equal(s.doorsPassed,0);
});
test('PR12 RED: checkpoint is local resume not cryptographic victory and third hour needs both doors',()=>{
 const saved=initialState(null,null,encodeLV03Checkpoint());
 assert.equal(saved.doorsPassed,1);
 assert.equal(saved.phase,'PLAYING');
 const far=step({...initialLevelState('LV-03'),x:LV03.finishX-2,y:418,onGround:true},{right:true});
 assert.equal(far.phase,'PLAYING','exit position alone is insufficient');
 const passed=step({...far,doorsPassed:2},{right:true});
 assert.equal(passed.phase,'COMPLETED');
 assert.deepEqual(step(passed,{right:true}),passed);
});
test('PR12 RED: pause, restart and fall cannot manufacture a toggle or third hour',()=>{
 const s={...initialLevelState('LV-03',encodeLV03Checkpoint()),x:LV03.switches[1].x,lightMode:'SHADOW'};
 const pause=applyAction(s,'KeyP');
 assert.deepEqual(step(pause,{interactPressed:true}),pause);
 const reset=applyAction(s,'KeyR');
 assert.equal(reset.level,'LV-03');
 assert.equal(reset.lightMode,'SHADOW');
 assert.equal(reset.phase,'PLAYING');
 const fallen=step({...s,y:700,vy:120,onGround:false},{});
 assert.equal(fallen.level,'LV-03');
 assert.equal(fallen.phase,'PLAYING');
 assert.equal(fallen.doorsPassed,1);
});

test('PR12 complete playable physical route: four gaps, two actual switches and optional third-hour exit',()=>{
 let s=initialLevelState('LV-03'),idx=0;
 const jumps=[260,760,1300,1750],switches=[false,false];
 let gotCP=false,gotLog=false;
 for(let t=0;t<1300&&s.phase==='PLAYING';t++){
   const jump=idx<jumps.length&&s.onGround&&s.x>=jumps[idx];
   if(jump)idx++;
   const lamp1=!switches[0]&&s.onGround&&s.x>=535&&s.x<=630;
   const lamp2=!switches[1]&&s.onGround&&s.x>=1440&&s.x<=1530;
   const ledger=!gotLog&&s.onGround&&s.x>=1050&&s.x<=1100;
   const interact=lamp1||lamp2||ledger;
   if(lamp1)switches[0]=true;
   if(lamp2)switches[1]=true;
   s=step(s,{right:true,jump,jumpPressed:jump,interactPressed:interact});
   gotCP ||= s.checkpointActive;
   gotLog ||= s.archiveLog;
 }
 assert.equal(s.phase,'COMPLETED','actual route did not reach and open both archive gates');
 assert.equal(s.doorsPassed,2);
 assert.equal(s.lightMode,'LIGHT');
 assert.equal(s.switchesUsed,2);
 assert.equal(idx,4);
 assert(gotCP&&gotLog&&switches.every(Boolean));
 assert.equal(s.deaths,0);
});
