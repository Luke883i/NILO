import test from "node:test";
import assert from "node:assert/strict";
import {CFG,PLATFORMS,initialState,initialLevelState,step} from "../web/core.mjs";
import {LV02,lv02Surfaces,movingBridge} from "../web/levels/lv-02.mjs";
import {LV03} from "../web/levels/lv-03.mjs";
import {describeLevel,IMPLEMENTED_LEVEL_IDS,DESIGN_ONLY_LEVEL_IDS} from "../web/levels/catalog.mjs";
const describe=(id,tick=0)=>describeLevel(id,CFG,PLATFORMS,tick);

test("S03a exposes exactly existing worlds; proposed worlds remain unavailable",()=>{
  assert.deepEqual(IMPLEMENTED_LEVEL_IDS,["LV-01","LV-02","LV-03"]);
  assert.deepEqual(DESIGN_ONLY_LEVEL_IDS,["LV-04","LV-05","LV-06"]);
  for(const id of DESIGN_ONLY_LEVEL_IDS)assert.throws(()=>describe(id),RangeError);
  for(const id of ["LV-00","LV-07",undefined,null])assert.throws(()=>describe(id),RangeError);
  for(const id of IMPLEMENTED_LEVEL_IDS){
    const p=describe(id);assert(Object.isFrozen(p));
    assert.equal(p.id,id);assert.equal(p.status,"IMPLEMENTED_CANDIDATE");
    assert(p.width>CFG.viewport&&p.platforms.length>0);
    assert(p.checkpointX>0&&p.finishX<p.width);
  }
});

test("S03a LV01 geometry is sourced from the original core, not duplicated",()=>{
  const p=describe("LV-01");
  assert.equal(p.width,CFG.width);
  assert.equal(p.finishX,CFG.finishX);
  assert.equal(p.checkpointX,CFG.checkpointX);
  assert.equal(p.platforms,PLATFORMS);
  assert.deepEqual(p.initial,{x:48,y:418});
  assert.deepEqual(p.checkpointSpawn,{x:1220,y:358});
  assert.equal(p.boss,null);
  assert.deepEqual({x:initialState().x,y:initialState().y},p.initial);
  assert.deepEqual({x:initialState('{"version":1,"level":"LV-01","checkpointId":"CP-01"}').x,
    y:initialState('{"version":1,"level":"LV-01","checkpointId":"CP-01"}').y},p.checkpointSpawn);
});

test("S03a LV02 moving platform remains a per-tick physical surface",()=>{
  const a=describe("LV-02",20),b=describe("LV-02",60);
  assert.equal(a.width,LV02.width);assert.equal(a.finishX,LV02.finishX);
  assert.equal(a.checkpointX,LV02.checkpointX);
  assert.deepEqual(a.initial,LV02.initial);
  assert.deepEqual(a.checkpointSpawn,LV02.checkpointSpawn);
  assert.equal(a.boss,"CH-CUSTODE");
  assert.deepEqual(a.platforms,lv02Surfaces(20));
  assert.deepEqual(b.platforms,lv02Surfaces(60));
  assert.notEqual(a.platforms.at(-1).x,b.platforms.at(-1).x);
  assert.equal(a.platforms.at(-1).x,movingBridge(20).x);
  assert(Object.isFrozen(a.platforms));
  assert(Object.isFrozen(a.platforms.at(-1)));
  assert.deepEqual({x:initialLevelState("LV-02").x,y:initialLevelState("LV-02").y},LV02.initial);
});

test("S03a LV03 archive metadata retains physical gates and checkpoint",()=>{
  const p=describe("LV-03",123);
  assert.equal(p.width,LV03.width);
  assert.equal(p.finishX,LV03.finishX);
  assert.equal(p.checkpointX,LV03.checkpointX);
  assert.equal(p.platforms,LV03.platforms);
  assert.deepEqual(p.initial,LV03.initial);
  assert.deepEqual(p.checkpointSpawn,LV03.checkpointSpawn);
  assert.equal(p.boss,null);
  assert.deepEqual({x:initialLevelState("LV-03").x,y:initialLevelState("LV-03").y},LV03.initial);
});

test("S03a tick validation prevents implicit runtime time authority",()=>{
  for(const invalid of [-1,0.5,NaN,Infinity,-Infinity,"20",null])
    assert.throws(()=>describe("LV-01",invalid),RangeError);
  assert.throws(()=>describeLevel("LV-01",{},PLATFORMS),TypeError);
  assert.throws(()=>describeLevel("LV-01",CFG,[]),TypeError);
});

test("S03a core actually consumes catalog for existing world boundary and platforms",()=>{
  for(const id of IMPLEMENTED_LEVEL_IDS){
    const profile=describe(id,1),s=initialLevelState(id);
    const after=step(s,{right:true});
    assert.equal(after.level,id);
    assert(after.x>=0&&after.x<=profile.width-CFG.playerWidth);
    assert(after.camera<=profile.width-CFG.viewport);
    assert.equal(after.phase,"PLAYING");
  }
  const lv02=initialLevelState("LV-02");
  const b=describe("LV-02",100).platforms.at(-1);
  const onBridge={...lv02,ticks:99,x:b.x+40,y:b.y-CFG.playerHeight,
    onGround:true,vy:0,supportId:b.id};
  const moved=step(onBridge,{});
  assert.equal(moved.supportId,b.id);
  assert.equal(moved.onGround,true);
});
