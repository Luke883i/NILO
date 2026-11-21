import test from "node:test";
import assert from "node:assert/strict";
import {GOLDEN_MOTION,goldenMotionPose,renderGoldenMinute,goldenMinutePlan} from "../web/golden-minute.mjs";
import {initialState,PLATFORMS} from "../web/core.mjs";

const base=()=>initialState();
function record(state){
 const ops=[],context={globalAlpha:1,lineWidth:1};
 const stack=[];
 const c=new Proxy(context,{set(t,k,v){t[k]=v;return true},get(t,k){
   if(k==="operations")return ops;
   if(k==="createLinearGradient")return()=>({addColorStop(){}});
   if(k==="save")return()=>{stack.push({...t});ops.push({name:k,args:[]});};
   if(k==="restore")return()=>{Object.assign(t,stack.pop());ops.push({name:k,args:[]});};
   if(["arc","ellipse","fillRect","strokeRect","rect","clip","fill","stroke",
     "translate","rotate","moveTo","lineTo","fillText","beginPath","closePath"].includes(k))
      return (...args)=>ops.push({name:k,args,color:typeof t.fillStyle==="object"?"native-gradient":t.fillStyle,stroke:t.strokeStyle});
   return t[k];
 }});
 const before=JSON.stringify(state);
 assert.equal(renderGoldenMinute(c,state,PLATFORMS),true);
 assert.equal(JSON.stringify(state),before,"drawing must not write simulation state");
 assert.equal(ops.filter(o=>o.name==="save").length,ops.filter(o=>o.name==="restore").length);
 assert.equal(c.globalAlpha,1);
 return ops;
}
const has=(ops,name,args)=>ops.some(o=>o.name===name&&args.every((x,i)=>o.args[i]===x));

test("G1-V1 deterministic animation contract is immutable and cannot approve art",()=>{
 assert.equal(GOLDEN_MOTION.schema,"nilo.golden-motion/1");
 assert.equal(GOLDEN_MOTION.level,"LV-01");
 assert.equal(GOLDEN_MOTION.source,"ACTUAL_GAME_STATE_ONLY");
 assert.equal(GOLDEN_MOTION.renderOnly,true);
 assert.equal(GOLDEN_MOTION.authorApproved,false);
 assert.equal(GOLDEN_MOTION.independentPlaytest,false);
 assert(Object.isFrozen(GOLDEN_MOTION));
 assert.equal(goldenMinutePlan(base()).nativeWidth,960);
 assert.equal(goldenMotionPose({...base(),level:"LV-02"}),null);
 assert.equal(goldenMotionPose({...base(),ticks:-1}),null);
 assert.equal(goldenMotionPose({...base(),ticks:NaN}),null);
});

test("Five gameplay-grounded poses have deterministic, safe precedence",()=>{
 const idle=base();
 assert.equal(goldenMotionPose(idle).phase,"IDLE");
 assert.equal(goldenMotionPose({...idle,vx:80}).phase,"RUN");
 assert.equal(goldenMotionPose({...idle,onGround:false}).phase,"AIR");
 const firing={...idle,action:{...idle.action,shots:[{x:80,y:420}]}};
 assert.equal(goldenMotionPose({...firing,vx:80,onGround:false}).phase,"FIRE");
 const hurt={...firing,action:{...firing.action,invulnerable:12}};
 assert.equal(goldenMotionPose(hurt).phase,"HURT");
 assert.equal(goldenMotionPose({...hurt,ticks:1}).hurtFlash,true);
 assert.equal(goldenMotionPose({...hurt,ticks:3}).hurtFlash,false);
 assert.equal(goldenMotionPose({...idle,action:{...idle.action,facing:-1}}).facing,-1);
 assert(Object.isFrozen(goldenMotionPose(idle)));
});

test("Run-cycle, blink, wings and fragment glints have observed distinct discrete frames",()=>{
 const idle=base(),run={...idle,vx:100};
 assert.deepEqual([0,5,10,15].map(ticks=>goldenMotionPose({...run,ticks}).stride),[0,3,0,-3]);
 assert.deepEqual([0,7,14].map(ticks=>goldenMotionPose({...idle,ticks}).wingLift),[-4,4,-4]);
 assert.deepEqual([0,7,14,21].map(ticks=>goldenMotionPose({...idle,ticks}).shardFrame),[0,1,2,3]);
 assert.equal(goldenMotionPose({...idle,ticks:174}).blink,false);
 assert.equal(goldenMotionPose({...idle,ticks:175}).blink,true);
 assert.equal(goldenMotionPose({...idle,ticks:180}).blink,false);
 assert.deepEqual(goldenMotionPose({...idle,ticks:14}),goldenMotionPose({...idle,ticks:14}),
   "the same source state must always yield identical pose");
});

test("Actual renderer changes native pose pixels/geometry without changing hitboxes",()=>{
 const idle=base(),run1={...idle,vx:100,ticks:5},
       run2={...idle,vx:100,ticks:15},
       air={...idle,onGround:false,ticks:12};
 const r1=record(run1),r2=record(run2),ra=record(air);
 assert.notDeepEqual(r1,r2,"stride must materialize as different Canvas commands");
 assert(has(r1,"fillRect",[50,415,29,8]));
 assert(has(r2,"fillRect",[50,415,29,8]));
 assert(has(ra,"fillRect",[50,415,29,8]));
 assert(has(ra,"moveTo",[55,454])&&has(ra,"lineTo",[51,450]),"airborne footwear/twist must be rendered");
 const t0=record({...idle,ticks:0}),t7=record({...idle,ticks:7});
 assert.notDeepEqual(t0.filter(x=>x.name==="ellipse"),t7.filter(x=>x.name==="ellipse"),
    "Tica wing phase must be a real Canvas geometry difference");
});

test("Projectile flare and damage warning require actual action state, not cosmetic timers",()=>{
 const idle=base(),shoot={...idle,action:{...idle.action,shots:[{x:60,y:421}]}},
 hurt={...shoot,action:{...shoot.action,invulnerable:6},ticks:0};
 const a=record(idle),s=record(shoot),h=record(hurt);
 assert(!has(a,"arc",[82,446,5]));
 assert(has(s,"arc",[82,446,5]),"firing state must draw a native muzzle flare");
 assert(has(h,"moveTo",[44,423])&&has(h,"lineTo",[82,423]),"real invulnerability must draw damage warning");
 assert(!has(s,"moveTo",[44,423])&&!has(s,"lineTo",[82,423]),"normal projectile is not fake damage");
});

test("Paused/frozen gameplay produces the same animation state; legacy and other levels stay untouched",()=>{
 const snapshot={...base(),ticks:42,vx:0,phase:"PAUSED"};
 assert.deepEqual(goldenMotionPose(snapshot),goldenMotionPose({...snapshot}));
 assert.deepEqual(record(snapshot),record({...snapshot}));
 const c={save(){throw Error("not reached")}};
 assert.equal(renderGoldenMinute(c,snapshot,PLATFORMS,true),false);
 assert.equal(renderGoldenMinute(c,{...snapshot,level:"LV-03"},PLATFORMS),false);
});
