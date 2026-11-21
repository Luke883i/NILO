import test from "node:test";
import assert from "node:assert/strict";
import {SHARD_WARD,initialAction,advanceAction,resolveShardWard} from "../web/action.mjs";
import {CFG,PLATFORMS,initialState,step,applyAction} from "../web/core.mjs";
import {renderGoldenMinute} from "../web/golden-minute.mjs";

const hero=(x=178,y=418)=>({x,y,w:28,h:42,vy:0,prevBottom:y+42,worldWidth:CFG.width});
const tick=(a,p)=>advanceAction(a,p,{},CFG.tick,PLATFORMS);
function canvas(state){
 const ops=[],c=new Proxy({globalAlpha:1,lineWidth:1},{set(t,k,v){t[k]=v;return true},get(t,k){
  if(k==="createLinearGradient")return()=>({addColorStop(){}});
  if(["save","restore","beginPath","closePath","arc","ellipse","rotate","translate",
     "rect","clip","fill","stroke","fillRect","fillText","moveTo","lineTo"].includes(k))
    return(...args)=>ops.push([k,...args]);
  return t[k];
 }});
 const before=JSON.stringify(state);
 assert.equal(renderGoldenMinute(c,state,PLATFORMS),true);
 assert.equal(JSON.stringify(state),before);
 return ops;
}
const ring=(ops,rx,ry)=>ops.some(o=>o[0]==="ellipse"&&o[3]===rx&&o[4]===ry);
test("G2-V0 bounded first-party reward contract and no invented artist/player approvals",()=>{
 assert.equal(SHARD_WARD.schema,"nilo.shard-ward/1");
 assert.equal(SHARD_WARD.maxCharges,1);
 assert.equal(SHARD_WARD.contactGraceTicks,75);
 assert.equal(SHARD_WARD.source,"ORIGINAL_LV01_SPATIAL_PICKUPS");
 assert.equal(SHARD_WARD.approvedByAuthor,false);
 assert.equal(SHARD_WARD.independentPlayersAccepted,false);
 assert(Object.isFrozen(SHARD_WARD));
 const initial=initialAction();
 assert.deepEqual([initial.ward,initial.wardsAbsorbed,initial.wardPulse],[0,0,0]);
 assert.equal(initial.pickups.length,3);
});

test("Spatial first shard gives exactly one meaningful ward, with no ghost grant",()=>{
 let a=initialAction();
 assert.equal(tick(a,hero(48)).action.ward,0);
 a=tick(a,hero()).action;
 assert.equal(a.shards,1);
 assert.equal(a.ward,1);
 const next=tick(a,hero()).action;
 assert.equal(next.ward,1);
 assert.equal(next.shards,1);
 assert.equal(next.wardsAbsorbed,0);
});

test("Actual automaton contact consumes ward, not HP; one grace window stops repeated hits",()=>{
 let a=tick(initialAction(),hero()).action;
 const blocked=tick(a,hero(493,405));
 assert.equal(blocked.action.health,3);
 assert.equal(blocked.action.ward,0);
 assert.equal(blocked.action.wardsAbsorbed,1);
 assert.equal(blocked.action.wardPulse,SHARD_WARD.pulseTicks);
 assert.equal(blocked.action.invulnerable,SHARD_WARD.contactGraceTicks);
 assert.equal(blocked.wardBlocked,true);
 assert.equal(blocked.hit,false);
 const again=tick(blocked.action,hero(493,405));
 assert.equal(again.action.health,3);
 assert.equal(again.action.wardsAbsorbed,1);
 assert.equal(again.action.wardPulse,SHARD_WARD.pulseTicks-1);
});

test("Unshielded contact keeps original HP/damage/defeat and stomp semantics",()=>{
 const noWard=tick(initialAction(),hero(493,405));
 assert.equal(noWard.action.health,2);
 assert.equal(noWard.action.ward,0);
 assert.equal(noWard.hit,true);
 assert.equal(noWard.wardBlocked,false);
 const n=step({...initialState(),x:493,y:405,onGround:true,action:{...initialAction(),health:1}},{});
 assert.equal(n.phase,"DEFEATED");
 assert.equal(n.action.health,0);
 const stomp=step({...initialState(),x:485,y:370,onGround:false,vy:275},{});
 assert.equal(stomp.action.kills,1);
 assert.equal(stomp.action.health,3);
 assert.equal(stomp.action.ward,0);
});

test("Next original shard recharges spent shield once, not every tick",()=>{
 let a=tick(initialAction(),hero()).action;
 a=tick(a,hero(493,405)).action;
 assert.equal(a.ward,0);
 a=tick(a,hero(744,382)).action;
 assert.equal(a.ward,1);
 assert.equal(a.shards,2);
 const next=tick(a,hero(744,382)).action;
 assert.equal(next.ward,1);
 assert.equal(next.shards,2);
 assert.equal(next.wardsAbsorbed,1);
});

test("Simultaneous enemy contact and *new* reward cannot retroactively block damage",()=>{
 const a=initialAction();
 const moved={...a,enemies:a.enemies.map((e,i)=>i===0?{...e,x:178,minX:178,maxX:178,speed:0}:e)};
 const out=tick(moved,hero());
 assert.equal(out.action.shards,1);
 assert.equal(out.action.ward,1);
 assert.equal(out.action.health,2);
 assert.equal(out.wardBlocked,false);
});

test("Fabricated enemy/pickup does not generate original shard reward and charge caps at 1",()=>{
 const a=initialAction();
 const extra=[...a.pickups,{id:"forged-hour",collected:true,x:200,y:100}];
 assert.equal(resolveShardWard(a,extra,false).ward,0);
 const gathered=a.pickups.map(p=>({...p,collected:true}));
 assert.equal(resolveShardWard(a,gathered,false).ward,1);
 assert.equal(resolveShardWard({...a,ward:1},gathered,false).ward,1);
 assert.throws(()=>resolveShardWard({...a,ward:99},gathered,false),RangeError);
});

test("Pause, restart and cross-level state preserve original authority boundaries",()=>{
 let s=step({...initialState(),x:178,y:418},{});
 assert.equal(s.action.ward,1);
 const paused=applyAction(s,"KeyP");
 assert.deepEqual(step(paused,{}),paused);
 const restart=applyAction(s,"KeyR");
 assert.equal(restart.action.ward,0);
 assert.equal(restart.action.wardsAbsorbed,0);
 for(const lv of ["LV-02","LV-03","LV-04"]){
  assert.equal(initialAction(lv),null);
 }
});

test("Real native Canvas ward aura reflects actually earned charge and consumed pulse",()=>{
 const baseline=initialState();
 assert.equal(ring(canvas(baseline),23,29),false);
 const charged=step({...baseline,x:178,y:418},{});
 assert.equal(charged.action.ward,1);
 assert.equal(ring(canvas(charged),23,29),true);
 const spent=tick(charged.action,hero(493,405)).action;
 const visible={...charged,x:493,y:405,action:spent};
 assert.equal(ring(canvas(visible),23,29),true);
 assert.equal(ring(canvas(visible),27,33),true);
 const empty={...visible,action:{...spent,wardPulse:0}};
 assert.equal(ring(canvas(empty),23,29),false);
});

test("No alternate simulation or server: original legacy renderer and source action remain available",()=>{
 const s=step({...initialState(),x:178,y:418},{});
 const ctx={save(){throw Error("legacy must not call new painter")}};
 assert.equal(renderGoldenMinute(ctx,s,PLATFORMS,true),false);
 assert.equal(s.level,"LV-01");
 assert.equal(s.action.enemies.length,2);
 assert.equal(s.action.pickups.length,3);
});
