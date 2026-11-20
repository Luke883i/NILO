import test from "node:test";
import assert from "node:assert/strict";
import {GOLDEN_MINUTE,goldenMinutePlan,renderGoldenMinute} from "../web/golden-minute.mjs";
import {initialState,PLATFORMS,CFG} from "../web/core.mjs";

function record(){
 const operations=[],state={globalAlpha:1,lineWidth:1},stack=[];
 const ctx=new Proxy(state,{
   set(t,p,v){t[p]=v;return true;},
   get(t,p){
     if(p==="operations")return operations;
     if(p==="createLinearGradient")return(...args)=>{
       const grad={kind:"native-gradient",stops:[],addColorStop(pos,color){this.stops.push([pos,color]);}};
       operations.push({name:"createLinearGradient",args,grad});return grad;
     };
     if(p==="save")return()=>{stack.push({...t});operations.push({name:"save",args:[]});};
     if(p==="restore")return()=>{Object.assign(t,stack.pop());operations.push({name:"restore",args:[]});};
     if(["fillRect","strokeRect","rect","arc","ellipse","translate","rotate","moveTo",
       "lineTo","fillText","beginPath","fill","stroke","clip","closePath"].includes(p))
       return (...args)=>operations.push({name:p,args,color:t.fillStyle,alpha:t.globalAlpha,width:t.lineWidth});
     return t[p];
   }
 });
 return ctx;
}

test("G1-V0 has a 960x540 native-pixel boundary, reversible mode and no fake human approval",()=>{
 assert.equal(GOLDEN_MINUTE.schema,"nilo.golden-minute-candidate/1");
 assert.equal(GOLDEN_MINUTE.width,960);
 assert.equal(GOLDEN_MINUTE.height,540);
 assert.equal(GOLDEN_MINUTE.detailStep,1);
 assert.equal(GOLDEN_MINUTE.authorApproved,false);
 assert.equal(GOLDEN_MINUTE.playerAccepted,false);
 assert.equal(GOLDEN_MINUTE.legacyQuery,"visual=legacy");
 assert(Object.isFrozen(GOLDEN_MINUTE));
});
test("Golden Minute only overlays LV01 initial range and fades without a discontinuity",()=>{
 const original=initialState();
 const p=goldenMinutePlan(original);
 assert.equal(p.nativeWidth,CFG.viewport);
 assert.equal(p.nativeHeight,CFG.height);
 assert.equal(p.opacity,1);
 assert.equal(p.detailStep,1);
 for(const [x,alpha] of [[550,1],[650,.5],[750,null]]){
   const sample=goldenMinutePlan({...original,x});
   if(alpha===null)assert.equal(sample,null);
   else assert(Math.abs(sample.opacity-alpha)<1e-9);
 }
 assert.equal(goldenMinutePlan({...original,level:"LV-02"}),null);
 assert.equal(goldenMinutePlan({...original,level:"LV-03"}),null);
 assert.equal(goldenMinutePlan({...original,level:"LV-01",x:Infinity}),null);
 assert.equal(goldenMinutePlan({...original,level:"LV-01",x:-1}),null);
 assert.equal(goldenMinutePlan(original,true),null);
});
test("Native Golden scene draws real 960 canvas gradient, physical platform edges, detailed actors and reward",()=>{
 const ctx=record(),state=initialState(),before=JSON.stringify(state),surfaces=PLATFORMS.map(x=>({...x}));
 assert.equal(renderGoldenMinute(ctx,state,surfaces),true);
 assert.equal(JSON.stringify(state),before,"renderer must never mutate game state");
 const ops=ctx.operations;
 const gradients=ops.filter(o=>o.name==="createLinearGradient");
 assert.equal(gradients.length,1);
 assert(gradients[0].grad.stops.length>=4);
 assert(ops.some(o=>o.name==="rect"&&o.args.join(",")==="0,76,960,464"));
 assert(ops.some(o=>o.name==="clip"));
 assert(ops.filter(o=>o.name==="fillRect").length>=150,"needs native details not 480x270 upscale");
 const first=surfaces[0];
 assert(ops.some(o=>o.name==="fillRect"&&o.args[0]===first.x&&
    o.args[1]===first.y-13&&o.args[2]===first.w&&o.args[3]===4));
 assert(ops.some(o=>o.name==="fillRect"&&o.args.join(",")==="50,415,29,8"),"original player geometry anchored");
 assert(ops.some(o=>o.name==="fillText"&&o.args[0]==="NILO"));
 assert(ops.some(o=>o.name==="fillText"&&o.args[0]==="TICA"));
 assert(ops.some(o=>o.name==="arc"&&o.args[2]===13),"physical shard has native-level detail");
 assert(ops.some(o=>o.name==="fillRect"&&o.args.join(",")==="494,414,27,25"),"original sentry is visible");
 assert.equal(ops.filter(o=>o.name==="save").length,ops.filter(o=>o.name==="restore").length);
 assert.equal(ctx.globalAlpha,1);
});
test("Native rendering follows actual shot, consumed reward and dead enemy without changing physics",()=>{
 const before=initialState(),ctx=record();
 const changed={...before,action:{...before.action,
    pickups:before.action.pickups.map((p,i)=>({...p,collected:i===0})),
    enemies:before.action.enemies.map((e,i)=>({...e,alive:i!==0})),
    shots:[{x:440,y:421}]}};
 assert.equal(renderGoldenMinute(ctx,changed,PLATFORMS),true);
 const ops=ctx.operations;
 assert(!ops.some(o=>o.name==="arc"&&o.args[0]===178&&o.args[1]===434&&o.args[2]===13),
   "collected reward is not redrawn");
 assert(!ops.some(o=>o.name==="fillRect"&&o.args.join(",")==="494,414,27,25"),
   "dead enemy is not redrawn");
 assert(ops.some(o=>o.name==="arc"&&o.args[0]===446&&o.args[1]===424&&o.args[2]===10),
   "physical action has visible impulse");
});
test("Golden Minute legacy and future-level paths remain untouched",()=>{
 for(const scenario of [{...initialState(),level:"LV-02"},{...initialState(),x:751}]){
   const ctx=record();assert.equal(renderGoldenMinute(ctx,scenario,PLATFORMS),false);
   assert.equal(ctx.operations.length,0);
 }
 const ctx=record();assert.equal(renderGoldenMinute(ctx,initialState(),PLATFORMS,true),false);
 assert.equal(ctx.operations.length,0);
});
