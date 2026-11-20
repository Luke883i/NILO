import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const original=readFileSync(new URL('../web/action.mjs',import.meta.url),'utf8');
const mutation=async(before,after)=>{
  assert(original.includes(before),'mutation selector must identify real source bytes');
  const text=original.replace(before,after);
  assert.notEqual(text,original);
  return import('data:text/javascript;charset=utf-8,'+encodeURIComponent(text));
};
const player={x:400,y:398,w:28,h:42,vy:0,prevBottom:440,worldWidth:2100};
test('physical source mutant: a fabricated attack input is rejected by the real oracle',async()=>{
  const m=await mutation('if(input.attackPressed && cooldown===0','if(true && cooldown===0');
  const n=m.advanceAction(m.initialAction(),player,{},1/60,[]);
  assert.notEqual(n.action.shots.length,0,'counterexample: mutant creates ghost projectile');
});
test('physical source mutant: removing platform occlusion changes observed hit behavior',async()=>{
  const m=await mutation('if(blockedShot(next,prior,platforms))continue;', 'if(false)continue;');
  const base=m.initialAction();
  const a={...base,shots:[{x:340,y:450,dir:1}]};
  const n=m.advanceAction(a,player,{},1/60,[{x:350,y:440,w:180}]);
  assert.equal(n.action.shots.length,1,'counterexample: projectile tunnels through solid floor');
});
test('physical source mutant: invulnerability cannot be bypassed',async()=>{
  const m=await mutation('if(invulnerable===0&&!hit)','if(true&&!hit)');
  const a={...m.initialAction(),invulnerable:50};
  const n=m.advanceAction(a,{...player,x:492,y:405}, {},1/60,[]);
  assert.equal(n.action.health,2,'counterexample: invulnerable player takes damage');
});
