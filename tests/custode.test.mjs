import test from 'node:test';
import assert from 'node:assert/strict';
import {CUSTODE,initialCustode,enterCustode,advanceCustode} from '../web/levels/custode.mjs';
import {CFG,initialLevelState,applyAction,step} from '../web/core.mjs';
function until(b,target,max=300){
  for(let n=0;n<max&&b.phase!==target;n++)b=advanceCustode(b,{});
  assert.equal(b.phase,target);
  return b;
}
test('PR10 RED: no boss before gate; entry only from LV02',()=>{
  const fresh=initialLevelState('LV-02');
  assert.equal(fresh.boss.phase,'LOCKED');
  assert.equal(step(fresh,{right:true}).boss.phase,'LOCKED');
  const gate={...fresh,x:CUSTODE.gateX,y:460-CFG.playerHeight,onGround:true};
  const entered=step(gate,{});
  assert.equal(entered.boss.phase,'TELEGRAPH');
  assert.equal(entered.phase,'PLAYING');
  assert.equal(step({...initialLevelState('LV-01'),x:CUSTODE.gateX},{})
    .boss,undefined);
});
test('PR10 RED: a warning always precedes dangerous pendulum strike',()=>{
  let boss=enterCustode(initialCustode());
  assert.equal(boss.phase,'TELEGRAPH');
  for(let t=0;t<CUSTODE.telegraphTicks-1;t++){
    boss=advanceCustode(boss,{grounded:true,inStrikeZone:true});
    assert.equal(boss.hits,0);
  }
  assert.equal(boss.phase,'TELEGRAPH');
  boss=advanceCustode(boss,{grounded:true,inStrikeZone:true});
  assert.equal(boss.phase,'STRIKE');
  assert.equal(boss.hits,0);
  boss=advanceCustode(boss,{grounded:true,inStrikeZone:true});
  assert.equal(boss.hits,1);
});
test('PR10 RED: recovery permits exactly one repair and must be player-caused',()=>{
  let boss=until(enterCustode(initialCustode()),'RECOVERY');
  for(let i=0;i<5;i++)boss=advanceCustode(boss,{nearMechanism:true,grounded:true});
  assert.equal(boss.repairs,0);
  boss=advanceCustode(boss,{repairPressed:true,nearMechanism:true,grounded:true});
  assert.equal(boss.repairs,1);
  for(let i=0;i<5;i++)boss=advanceCustode(boss,{repairPressed:true,nearMechanism:true,grounded:true});
  assert.equal(boss.repairs,1);
  assert.equal(boss.phase,'RECOVERY');
});
test('PR10 RED: two repairs cause victory, two actual hits cause defeat',()=>{
  let boss=enterCustode(initialCustode());
  for(let n=0;n<600&&boss.phase!=='VICTORY';n++){
    boss=advanceCustode(boss,{repairPressed:boss.phase==='RECOVERY',
      nearMechanism:true,grounded:boss.phase==='RECOVERY'});
  }
  assert.equal(boss.phase,'VICTORY');
  assert.equal(boss.repairs,CUSTODE.requiredRepairs);
  let losing=enterCustode(initialCustode());
  for(let n=0;n<600&&losing.phase!=='DEFEAT';n++)
    losing=advanceCustode(losing,{inStrikeZone:true,grounded:true});
  assert.equal(losing.phase,'DEFEAT');
  assert.equal(losing.hits,CUSTODE.maxHits);
});
test('PR10 RED: pause freezes boss; R resets fight without granting hour 2',()=>{
  const fresh=initialLevelState('LV-02');
  const entered=step({...fresh,x:CUSTODE.gateX,y:460-CFG.playerHeight,onGround:true},{});
  const paused=applyAction(entered,'KeyP');
  assert.deepEqual(step(paused,{repairPressed:true}),paused);
  const reset=applyAction(entered,'KeyR');
  assert.equal(reset.boss.phase,'LOCKED');
  assert.notEqual(reset.phase,'COMPLETED');
});
