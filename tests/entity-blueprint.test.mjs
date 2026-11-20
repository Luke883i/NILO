import test from "node:test";
import assert from "node:assert/strict";
import {LV01_ENTITY_BLUEPRINT,validateActionBlueprint,spawnActionEntities,initialAction,advanceAction,ACTION_CFG} from "../web/action.mjs";
import {initialState,step,applyAction,CFG} from "../web/core.mjs";

test("S03b blueprint has two original patrols, three original fragments, unique stable IDs and no mutable source aliases",()=>{
  const b=LV01_ENTITY_BLUEPRINT;
  assert.equal(b.schema,"nilo.action-entity-blueprint/1");
  assert.equal(b.level,"LV-01");
  assert.equal(b.enemyArchetype,"PATROL_SENTRY");
  assert.equal(b.pickupArchetype,"HOUR_SHARD");
  assert.equal(validateActionBlueprint(b),true);
  assert.equal(Object.isFrozen(b),true);
  assert.equal(Object.isFrozen(b.enemies),true);
  assert.equal(Object.isFrozen(b.pickups),true);
  assert(b.enemies.every(Object.isFrozen));
  assert(b.pickups.every(Object.isFrozen));
  assert.deepEqual(b.enemies.map(x=>x.id),["cortile-sentry-01","cortile-sentry-02"]);
  assert.deepEqual(b.pickups.map(x=>x.id),["shard-01","shard-02","shard-03"]);
  assert.deepEqual(b.enemies.map(e=>[e.x,e.y,e.minX,e.maxX,e.speed]),[
    [492,410,440,542,34],[1505,390,1460,1615,28]
  ]);
  assert.deepEqual(b.pickups.map(p=>[p.x,p.y]),[[178,434],[744,382],[1595,380]]);
});

test("S03b factory preserves exact original mutable action shape and physical state",()=>{
  const action=initialAction();
  const entities=spawnActionEntities("LV-01");
  assert.equal(action.health,ACTION_CFG.maxHealth);
  assert.equal(action.invulnerable,0);
  assert.equal(action.cooldown,0);
  assert.equal(action.facing,1);
  assert.deepEqual(action.shots,[]);
  assert.equal(action.kills,0);
  assert.equal(action.shards,0);
  assert.deepEqual(action.enemies,entities.enemies);
  assert.deepEqual(action.pickups,entities.pickups);
  assert.deepEqual(action.enemies.map(e=>Object.keys(e).sort()),[
    ["alive","direction","id","maxX","minX","speed","x","y"],
    ["alive","direction","id","maxX","minX","speed","x","y"]
  ]);
  assert(action.enemies.every(e=>e.alive&&e.direction===-1));
  assert(action.pickups.every(p=>!p.collected));
});

test("S03b mutable state is independent across new game, restart and descriptor references",()=>{
  const one=initialAction(),two=initialAction();
  assert.notStrictEqual(one.enemies,two.enemies);
  assert.notStrictEqual(one.pickups,two.pickups);
  assert.notStrictEqual(one.enemies[0],two.enemies[0]);
  assert.notStrictEqual(one.pickups[0],two.pickups[0]);
  assert.notStrictEqual(one.enemies[0],LV01_ENTITY_BLUEPRINT.enemies[0]);
  assert.notStrictEqual(one.pickups[0],LV01_ENTITY_BLUEPRINT.pickups[0]);
  one.enemies[0].alive=false;
  one.pickups[0].collected=true;
  assert.equal(two.enemies[0].alive,true);
  assert.equal(two.pickups[0].collected,false);
  assert.equal(LV01_ENTITY_BLUEPRINT.enemies[0].x,492);
  assert.equal(LV01_ENTITY_BLUEPRINT.pickups[0].x,178);
  const attacked=step({...initialState(),x:428,y:398,onGround:true},{attackPressed:true});
  const restarted=applyAction(attacked,"KeyR");
  assert.equal(restarted.action.enemies[0].alive,true);
  assert.equal(restarted.action.kills,0);
});

test("S03b existing attack, hit and pickup still operate on the actual spawned entities",()=>{
  let shot=step({...initialState(),x:428,y:398,onGround:true},{attackPressed:true});
  for(let i=0;i<10;i++)shot=step(shot,{});
  assert.equal(shot.action.kills,1);
  assert.equal(shot.action.enemies[0].alive,false);
  let pickup=step({...initialState(),x:178,y:418},{});
  assert.equal(pickup.action.pickups[0].collected,true);
  assert.equal(pickup.action.shards,1);
  pickup=step(pickup,{});
  assert.equal(pickup.action.shards,1);
  const dead=advanceAction(initialAction(),{x:493,y:405,w:28,h:42,vy:0,prevBottom:447,worldWidth:CFG.width},{},CFG.tick,[]);
  assert.equal(dead.action.health,2);
  assert.equal(dead.hit,true);
});

test("S03b invalid or forged blueprints fail closed before any state is instantiated",()=>{
  const fresh=()=>structuredClone(LV01_ENTITY_BLUEPRINT);
  const variants=[
    b=>{b.level="LV-04";},
    b=>{b.schema="untrusted/2";},
    b=>{b.enemies[1].id=b.enemies[0].id;},
    b=>{b.pickups[0].id=b.enemies[0].id;},
    b=>{b.enemies[0].minX=600;},
    b=>{b.enemies[1].speed=-5;},
    b=>{b.enemies[0].x=Infinity;},
    b=>{b.pickups[0].x=-178;},
    b=>{b.pickups[0].x=999999;},
    b=>{b.enemies=[];},
    b=>{b.pickups=[];}
  ];
  for(const mutate of variants){
    const bp=fresh();mutate(bp);
    assert.equal(validateActionBlueprint(bp),false,JSON.stringify(bp));
  }
  assert.equal(validateActionBlueprint(null),false);
  assert.equal(validateActionBlueprint(fresh(),0),false);
  assert.equal(validateActionBlueprint(fresh(),NaN),false);
});

test("S03b never creates action entities for design-only levels or pretends to activate combat there",()=>{
  for(const level of ["LV-02","LV-03","LV-04","LV-05","LV-06","LV-99"]){
    assert.equal(spawnActionEntities(level),null);
    assert.equal(initialAction(level),null);
  }
  assert.equal(initialAction("LV-01").enemies.length,2);
});
