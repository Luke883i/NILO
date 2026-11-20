/** G1-V1 nine physically modified ES modules with observed behavior or drawing defects. */
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const source=readFileSync(new URL("../web/golden-minute.mjs",import.meta.url),"utf8");
const state=(ticks=0)=>({level:"LV-01",x:48,y:418,ticks,camera:0,vx:0,onGround:true,
 action:{facing:1,invulnerable:0,shots:[],enemies:[{id:"cortile-sentry-01",alive:true,x:492,y:410}],
 pickups:[{id:"shard-01",collected:false,x:178,y:434}]}});
function pixels(m,game){
 const out=[],ctx=new Proxy({globalAlpha:1},{set(t,k,v){t[k]=v;return true},get(t,k){
  if(k==="createLinearGradient")return()=>({addColorStop(){}});
  if(["save","restore","beginPath","closePath","arc","ellipse","rotate","translate",
     "rect","clip","fill","stroke","fillRect","fillText","moveTo","lineTo"].includes(k))
     return(...args)=>out.push([k,...args]);
  return t[k];
 }});
 assert.equal(m.renderGoldenMinute(ctx,game,[{x:0,y:460,w:310}]),true);
 return out;
}
const contains=(o,kind,coords)=>o.some(x=>x[0]===kind&&coords.every((v,i)=>x[i+1]===v));
const cases=[
 {id:"idle-classified-as-running",from:'?"RUN":"IDLE";',to:'?"RUN":"RUN";',
  check:(m,b)=>{assert.equal(b.goldenMotionPose(state()).phase,"IDLE");assert.equal(m.goldenMotionPose(state()).phase,"RUN");}},
 {id:"run-cycle-stuck",from:"const frame=Math.floor(state.ticks/GOLDEN_MOTION.runCycleTicks)%4;",to:"const frame=0;",
  check:(m,b)=>{const x={...state(5),vx:120};assert.equal(b.goldenMotionPose(x).stride,3);assert.equal(m.goldenMotionPose(x).stride,0);}},
 {id:"hurt-precedence-lost",from:"const hurt=Boolean(action&&action.invulnerable>0);",to:"const hurt=false;",
  check:(m,b)=>{const x={...state(1),action:{...state().action,invulnerable:8}};assert.equal(b.goldenMotionPose(x).phase,"HURT");assert.notEqual(m.goldenMotionPose(x).phase,"HURT");}},
 {id:"shot-state-falsified",from:"const firing=Boolean(action?.shots?.length);",to:"const firing=false;",
  check:(m,b)=>{const x={...state(),action:{...state().action,shots:[{x:70,y:410}]}};assert.equal(b.goldenMotionPose(x).shotFlare,true);assert.equal(m.goldenMotionPose(x).shotFlare,false);}},
 {id:"tica-wings-stuck",from:"const wingLift=Math.floor(state.ticks/GOLDEN_MOTION.wingCycleTicks)%2===0?-4:4;",to:"const wingLift=-4;",
  check:(m,b)=>{assert.equal(b.goldenMotionPose(state(7)).wingLift,4);assert.equal(m.goldenMotionPose(state(7)).wingLift,-4);}},
 {id:"fragment-glint-frozen",from:"shardFrame:Math.floor(state.ticks/7)%4,",to:"shardFrame:0,",
  check:(m,b)=>{assert.equal(b.goldenMotionPose(state(14)).shardFrame,2);assert.equal(m.goldenMotionPose(state(14)).shardFrame,0);}},
 {id:"tica-actual-draw-frozen",from:"ctx.ellipse(x-16,y+4+pose.wingLift,13,4,-.4,0,TWO_PI);",to:"ctx.ellipse(x-16,y+4,13,4,-.4,0,TWO_PI);",
  check:(m,b)=>{const clean=pixels(b,state(7)),changed=pixels(m,state(7));assert.notDeepEqual(clean,changed);const wing=a=>a.find(x=>x[0]==="ellipse"&&x[3]===13&&x[4]===4&&x[5]===-.4);assert(wing(clean)&&wing(changed));assert.notEqual(wing(clean)[2],wing(changed)[2]);}},
 {id:"physical-muzzle-erased",from:" if(pose.shotFlare){",to:" if(false){",
  check:(m,b)=>{const x={...state(),action:{...state().action,shots:[{x:60,y:420}]}};assert(contains(pixels(b,x),"arc",[82,446,5]));assert(!contains(pixels(m,x),"arc",[82,446,5]));}},
 {id:"physical-damage-cue-erased",from:" if(pose.hurtFlash){",to:" if(false){",
  check:(m,b)=>{const x={...state(),action:{...state().action,invulnerable:5}};assert(contains(pixels(b,x),"lineTo",[82,423]));assert(!contains(pixels(m,x),"lineTo",[82,423]));}}
];
for(const {id,from,to,check} of cases){
 test("G1-V1 physical source counterexample "+id,async()=>{
  assert.equal(source.split(from).length,2,"unique source anchor: "+id);
  const dir=mkdtempSync(join(tmpdir(),"nilo-g1v1-mutant-"));
  try{
   const good=join(dir,"clean.mjs"),bad=join(dir,"mutant.mjs");
   writeFileSync(good,source,"utf8");
   writeFileSync(bad,source.replace(from,to),"utf8");
   assert.notEqual(readFileSync(good,"utf8"),readFileSync(bad,"utf8"));
   const baseline=await import(pathToFileURL(good).href);
   const mutant=await import(pathToFileURL(bad).href);
   assert.equal(baseline.GOLDEN_MOTION.schema,"nilo.golden-motion/1");
   check(mutant,baseline);
  }finally{rmSync(dir,{recursive:true,force:true});}
 });
}
