/** G2-V0: physically written and imported source mutants.
 * Every expected counterexample is an actual output difference against the
 * untouched standalone action module; import failure is never a survivor kill.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const source=readFileSync(new URL("../web/action.mjs",import.meta.url),"utf8");
const hero=(x,y)=>({x,y,w:28,h:42,vy:0,prevBottom:y+42,worldWidth:2100});
const step=(m,a,x,y)=>m.advanceAction(a,hero(x,y),{},1/60,[]).action;
const warded=m=>step(m,m.initialAction(),178,418);
const contact=m=>step(m,warded(m),493,405);
const spend=m=>m.advanceAction(warded(m),hero(493,405),{},1/60,[]);
const tests=[
 {id:"free-unearned-shield",from:"ward:0,wardsAbsorbed:0,wardPulse:0,",to:"ward:1,wardsAbsorbed:0,wardPulse:0,",
  falsifier:(m,b)=>{assert.equal(b.initialAction().ward,0);assert.equal(m.initialAction().ward,1);}},
 {id:"shard-never-grants-power",from:"const newRewards=new Set(collectedNow.filter(p=>allowed.has(p.id)).map(p=>p.id));",
  to:"const newRewards=new Set();",
  falsifier:(m,b)=>{assert.equal(warded(b).ward,1);assert.equal(warded(m).ward,0);}},
 {id:"two-charges-over-cap",from:"maxCharges:1,contactGraceTicks:75",to:"maxCharges:2,contactGraceTicks:75",
  falsifier:(m,b)=>{const cb=warded(b),cm=warded(m);
    assert.equal(step(b,cb,744,382).ward,1);assert.equal(step(m,cm,744,382).ward,2);}},
 {id:"ward-never-consumed",from:"prior-(absorbed?1:0)",to:"prior",
  falsifier:(m,b)=>{assert.equal(contact(b).ward,0);assert.equal(contact(m).ward,1);}},
 {id:"contact-never-absorbed",from:"const absorbed=Boolean(contact)&&prior>0;",to:"const absorbed=false;",
  falsifier:(m,b)=>{assert.equal(contact(b).health,3);assert.equal(contact(m).health,2);}},
 {id:"already-collected-shard-regenerates",from:"const original=new Set(action.pickups.filter(p=>p.collected).map(p=>p.id));",
  to:"const original=new Set();",
  falsifier:(m,b)=>{const prevB=contact(b),prevM=contact(m);
    assert.equal(b.resolveShardWard(prevB,prevB.pickups,false).ward,0);
    assert.equal(m.resolveShardWard(prevM,prevM.pickups,false).ward,1);}},
 {id:"forged-non-nilo-pickup-grants-ward",
  from:"const newRewards=new Set(collectedNow.filter(p=>allowed.has(p.id)).map(p=>p.id));",
  to:"const newRewards=new Set(collectedNow.map(p=>p.id));",
  falsifier:(m,b)=>{const a=b.initialAction(),p=[...a.pickups,{id:"foreign-pickup",x:98,y:98,collected:true}];
    assert.equal(b.resolveShardWard(a,p,false).ward,0);
    assert.equal(m.resolveShardWard(a,p,false).ward,1);}},
 {id:"ward-contact-loses-grace",from:"invulnerable:hit?ACTION_CFG.invulnerabilityTicks:invulnerable,",
  to:"invulnerable:(hit&&!reward.absorbed)?ACTION_CFG.invulnerabilityTicks:invulnerable,",
  falsifier:(m,b)=>{assert.equal(contact(b).invulnerable,75);assert.equal(contact(m).invulnerable,0);}},
 {id:"blocked-contact-loses-health",from:"if(hit&&!reward.absorbed)health=Math.max(0,health-1);",
  to:"if(hit)health=Math.max(0,health-1);",
  falsifier:(m,b)=>{assert.equal(contact(b).health,3);assert.equal(contact(m).health,2);}},
 {id:"shield-pulse-erased",from:"const pulse=absorbed?SHARD_WARD.pulseTicks:Math.max(0,(action.wardPulse??0)-1);",
  to:"const pulse=0;",
  falsifier:(m,b)=>{assert.equal(contact(b).wardPulse,18);assert.equal(contact(m).wardPulse,0);}}
];
for(const {id,from,to,falsifier} of tests){
 test("G2-V0 physical source and expected counterexample: "+id,async()=>{
  assert.equal(source.split(from).length,2,"physical source anchor drift: "+id);
  const dir=mkdtempSync(join(tmpdir(),"nilo-ward-mutant-"));
  try{
   const clean=join(dir,"source.mjs"),mutated=join(dir,"mutant.mjs");
   writeFileSync(clean,source,"utf8");writeFileSync(mutated,source.replace(from,to),"utf8");
   assert.notEqual(readFileSync(clean,"utf8"),readFileSync(mutated,"utf8"));
   const original=await import(pathToFileURL(clean).href);
   const variant=await import(pathToFileURL(mutated).href);
   assert.equal(original.SHARD_WARD.schema,"nilo.shard-ward/1");
   falsifier(variant,original);
  }finally{rmSync(dir,{recursive:true,force:true});}
 });
}
