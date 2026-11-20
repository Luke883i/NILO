/** G1-V0: eight physical, actually imported visual-source mutants.
 * Every mutant must expose a separately predicted visual/semantic defect.
 * A changed byte string or module import error alone is never a kill.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const source=readFileSync(new URL("../web/golden-minute.mjs",import.meta.url),"utf8");
const data=()=>({level:"LV-01",x:48,y:418,camera:0,ticks:0,vx:0,onGround:true,
 action:{health:3,shots:[{x:440,y:421}],enemies:[
  {id:"cortile-sentry-01",x:492,y:410,alive:true}],
 pickups:[{id:"shard-01",x:178,y:434,collected:false}]}});
const platforms=[{x:0,y:460,w:280}];
function capture(m,state=data()){
 const ops=[],ctx=new Proxy({globalAlpha:1},{get(t,k){
   if(k in t)return t[k];
   if(k==="createLinearGradient")return()=>({addColorStop(){}});
   if(["beginPath","closePath","arc","ellipse","rotate","translate",
       "rect","clip","fill","stroke","save","restore","moveTo","lineTo",
       "fillRect","fillText"].includes(k))
       return (...args)=>ops.push([k,...args]);
   return undefined;
 },set(t,k,v){t[k]=v;return true}});
 m.renderGoldenMinute(ctx,state,platforms);
 return ops;
}
const has=(ops,key,vals)=>ops.some(o=>o[0]===key&&vals.every((v,i)=>o[i+1]===v));
const cases=[
 {id:"future-world-visible",from:"state.level!==GOLDEN_MINUTE.level",to:"false",
  falsifier:m=>assert.notEqual(m.goldenMinutePlan({...data(),level:"LV-02"}),null)},
 {id:"only-low-res-upscaled",from:"width:960,height:540,detailStep:1,",
  to:"width:480,height:270,detailStep:2,",
  falsifier:m=>{assert.equal(m.GOLDEN_MINUTE.width,480);assert.equal(m.GOLDEN_MINUTE.detailStep,2);}},
 {id:"fade-boundary-removed",from:"const alpha=z*z*(3-2*z);",
  to:"const alpha=1;",
  falsifier:m=>assert.equal(m.goldenMinutePlan({...data(),x:650}).opacity,1)},
 {id:"player-vanishes",from:"   nilo(ctx,state);",to:"   void state;",
  falsifier:m=>assert(!has(capture(m),"fillRect",[50,415,29,8]))},
 {id:"physics-platform-visual-disappears",from:"   platforms(ctx,state,surfaces);",
  to:"   void surfaces;",
  falsifier:m=>assert(!has(capture(m),"fillRect",[0,447,280,4]))},
 {id:"sentry-invisible",from:"   sentries(ctx,state);",to:"   void state;",
  falsifier:m=>assert(!has(capture(m),"fillRect",[494,414,27,25]))},
 {id:"pickup-invisible",from:"   pickups(ctx,state);",to:"   void state;",
  falsifier:m=>assert(!has(capture(m),"arc",[178,434,13]))},
 {id:"impulse-invisible",from:"   impulses(ctx,state);",to:"   void state;",
  falsifier:m=>assert(!has(capture(m),"arc",[446,424,10]))}
];
test("G1-V0 baseline renders visual evidence and does not leak to LV02",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"nilo-golden-original-"));
 try{
  const path=join(dir,"baseline.mjs");writeFileSync(path,source);
  const m=await import(pathToFileURL(path).href);
  assert(has(capture(m),"fillRect",[50,415,29,8]));
  assert(has(capture(m),"fillRect",[0,447,280,4]));
  assert(has(capture(m),"fillRect",[494,414,27,25]));
  assert(has(capture(m),"arc",[178,434,13]));
  assert(has(capture(m),"arc",[446,424,10]));
  assert.equal(m.goldenMinutePlan({...data(),level:"LV-02"}),null);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
for(const t of cases){
 test("G1-V0 independent physical source counterexample: "+t.id,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"nilo-golden-mutant-"));
  try{
   assert.equal(source.split(t.from).length,2,"unique source mutation: "+t.id);
   const path=join(dir,"mutant.mjs"),mutant=source.replace(t.from,t.to);
   writeFileSync(path,mutant,"utf8");
   assert.equal(readFileSync(path,"utf8"),mutant);
   assert.notEqual(mutant,source);
   const actual=await import(pathToFileURL(path).href);
   t.falsifier(actual);
  }finally{rmSync(dir,{recursive:true,force:true});}
 });
}
