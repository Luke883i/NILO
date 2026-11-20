import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
const root=fileURLToPath(new URL("../",import.meta.url));
const mutants=[
  ["lv01-width-drift","width:cfg.width,","width:cfg.width+90,"],
  ["frozen-moving-bridge","lv02Surfaces(ticks).map(p=>","lv02Surfaces(0).map(p=>"],
  ["archive-checkpoint-misroute","checkpointSpawn:LV03.checkpointSpawn,","checkpointSpawn:LV02.checkpointSpawn,"],
  ["boss-identity-erased",'boss:"CH-CUSTODE",','boss:null,'],
  ["design-only-level-unlocked",'throw new RangeError("level not implemented: "+String(id));',
    'return describeLevel("LV-01",cfg,lv01Platforms,ticks);'],
  ["tick-validation-disabled",'if(!Number.isSafeInteger(ticks)||ticks<0)','if(false)']
];
test("S03a six original-source catalog mutants are killed by independent native assertions",()=>{
  const tmp=mkdtempSync(join(tmpdir(),"nilo-s03a-catalog-"));
  try{
    cpSync(join(root,"web"),join(tmp,"web"),{recursive:true});
    mkdirSync(join(tmp,"tests"));
    cpSync(join(root,"tests/catalog.test.mjs"),join(tmp,"tests/catalog.test.mjs"));
    writeFileSync(join(tmp,"package.json"),JSON.stringify({type:"module"}));
    const target=join(tmp,"web/levels/catalog.mjs");
    const original=readFileSync(target,"utf8");
    const env={...process.env};
    delete env.NODE_TEST_CONTEXT;
    const run=()=>spawnSync(process.execPath,["--test","tests/catalog.test.mjs"],{
      cwd:tmp,encoding:"utf8",timeout:18000,env,maxBuffer:1024*1024});
    const clean=run();
    assert.equal(clean.status,0,"clean catalog must pass first: "+clean.stdout+" "+clean.stderr);
    const chosen=process.env.NILO_S03_MUTANT;
    assert(!chosen||mutants.some(m=>m[0]===chosen),"unknown source mutant selector");
    for(const [id,from,to] of mutants.filter(m=>!chosen||m[0]===chosen)){
      assert.equal(original.split(from).length,2,"mutation must edit exactly one real source span: "+id);
      writeFileSync(target,original.replace(from,to),"utf8");
      const out=run();
      assert.equal(out.status,1,"mutant must be rejected by tests, not by harness error: "+id+" status="+out.status+" stdout="+out.stdout+" stderr="+out.stderr);
      assert.match(out.stdout,/not ok/,id+" must fail an actual positive test oracle");
      writeFileSync(target,original,"utf8");
    }
    assert.equal(run().status,0,"restoring physical source bytes must restore PASS");
  } finally {rmSync(tmp,{recursive:true,force:true});}
});
