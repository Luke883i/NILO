// Physical source edits in temporary copies; failures are not synthetic model labels.
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=readFileSync(resolve(root,"web/core.mjs"),"utf8");
const sourceTests=readFileSync(resolve(root,"tests/core.test.mjs"),"utf8");
const feelTests=readFileSync(resolve(root,"tests/feel.test.mjs"),"utf8");
const cases=[
  ["forged-checkpoint",'Boolean(decodeCheckpoint(saved))','Boolean(saved)'],
  ["broken-pause",'code === "KeyP"','code === "KeyQ"'],
  ["platform-tunneling",'prevBottom <= p.y + 2','prevBottom <= p.y - 100'],
  ["coyote-disabled",'state.onGround ? CFG.coyoteTicks : Math.max','state.onGround ? CFG.coyoteTicks : 0*Math.max'],
  ["buffer-disabled",'justPressed ? CFG.bufferTicks : Math.max','justPressed ? 0 : Math.max'],
  ["jump-height-disabled",'vy*=CFG.jumpReleaseMultiplier;','vy*=1;'],
  ["hold-autorepeat",'held && !Boolean(state.jumpHeld)','held'],
  ["respawn-held-edge",'ticks:state.ticks+1,jumpHeld:held','ticks:state.ticks+1,jumpHeld:false'],
  ["restart-held-edge",'deaths:state.deaths,jumpHeld:Boolean(physicalJumpHeld)','deaths:state.deaths,jumpHeld:false'],
  ["resume-held-edge",'jumpHeld:Boolean(physicalJumpHeld),bufferLeft:0','jumpHeld:false,bufferLeft:0'],
  ["buffered-hop-released",'else if(!held && vy<0 && !jumpCut)','else if(!held && state.jumpHeld && vy<0 && !jumpCut)'],
  ["subtick-edge-dropped",'Boolean(input.jumpPressed) || (held && !Boolean(state.jumpHeld))','false || (held && !Boolean(state.jumpHeld))']
];
test("all original and game-feel real-source mutations are killed by independent original unit tests",()=>{
 const tmp=mkdtempSync(join(tmpdir(),"nilo-real-mutants-"));
 try{
   mkdirSync(join(tmp,"web"));mkdirSync(join(tmp,"tests"));
   // Shared core now imports the new level data; physical copies must
   // preserve the original import topology before applying any mutation.
   mkdirSync(join(tmp,"web","levels"),{recursive:true});
   writeFileSync(join(tmp,"web","levels","lv-02.mjs"),
     readFileSync(resolve(root,"web/levels/lv-02.mjs"),"utf8"));
   writeFileSync(join(tmp,"web","levels","custode.mjs"),
     readFileSync(resolve(root,"web/levels/custode.mjs"),"utf8"));
   writeFileSync(join(tmp,"web","levels","lv-03.mjs"),
     readFileSync(resolve(root,"web/levels/lv-03.mjs"),"utf8"));
   writeFileSync(join(tmp,"tests/core.test.mjs"),sourceTests);
   writeFileSync(join(tmp,"tests/feel.test.mjs"),feelTests);
   const target=join(tmp,"web/core.mjs");
   // Node's parent test runner injects NODE_TEST_CONTEXT. A nested --test
   // inherits it and silently skips tests with exit 0 unless removed.
   // The child must actually execute the original oracle, not report fake PASS.
   const run=()=>{
     const env={...process.env};
     delete env.NODE_TEST_CONTEXT;
     return spawnSync(process.execPath,["--test","tests/core.test.mjs","tests/feel.test.mjs"],{
       cwd:tmp,encoding:"utf8",timeout:12000,env});
   };
   writeFileSync(target,source);
   const baseline=run();
   assert.equal(baseline.status,0,"baseline must PASS before mutations: "+baseline.stderr?.slice(-300));
   for(const [id,needle,replacement] of cases.filter(([id])=>!process.env.NILO_MUTANT||process.env.NILO_MUTANT===id)){
     assert.equal(source.split(needle).length,2,"real source mutation anchor must occur exactly once: "+id);
     writeFileSync(target,source.replace(needle,replacement));
     const attempt=run();assert.notEqual(attempt.status,0,"surviving real mutation: "+id);
     writeFileSync(target,source);
   }
   assert.equal(run().status,0,"mutant cleanup must restore original executable baseline");
 } finally {rmSync(tmp,{recursive:true,force:true});}
});
