/** S03a physical source mutants with separately stated executable counterexamples.
 * Mutated bytes are written to a distinct module on disk and actually imported.
 * No finite mask, synthetic success label or import-error-as-kill.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {CFG,PLATFORMS} from "../web/core.mjs";
import {LV02,movingBridge} from "../web/levels/lv-02.mjs";
import {LV03} from "../web/levels/lv-03.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
const cases=[
  {id:"lv01-width-drift",from:"width:cfg.width,",to:"width:cfg.width+90,",
   falsify:m=>assert.equal(m.describeLevel("LV-01",CFG,PLATFORMS).width,CFG.width+90)},
  {id:"frozen-moving-bridge",from:"lv02Surfaces(ticks).map(p=>",to:"lv02Surfaces(0).map(p=>",
   falsify:m=>{
     const actual=m.describeLevel("LV-02",CFG,PLATFORMS,20).platforms.at(-1).x;
     assert.equal(actual,movingBridge(0).x);
     assert.notEqual(actual,movingBridge(20).x);
   }},
  {id:"archive-checkpoint-misroute",from:"checkpointSpawn:LV03.checkpointSpawn,",to:"checkpointSpawn:LV02.checkpointSpawn,",
   falsify:m=>{
     const actual=m.describeLevel("LV-03",CFG,PLATFORMS).checkpointSpawn;
     assert.deepEqual(actual,LV02.checkpointSpawn);
     assert.notDeepEqual(actual,LV03.checkpointSpawn);
   }},
  {id:"boss-identity-erased",from:'boss:"CH-CUSTODE",',to:"boss:null,",
   falsify:m=>assert.equal(m.describeLevel("LV-02",CFG,PLATFORMS).boss,null)},
  {id:"design-only-level-unlocked",from:'throw new RangeError("level not implemented: "+String(id));',
   to:'return describeLevel("LV-01",cfg,lv01Platforms,ticks);',
   falsify:m=>assert.equal(m.describeLevel("LV-04",CFG,PLATFORMS).id,"LV-01")},
  {id:"tick-validation-disabled",from:"if(!Number.isSafeInteger(ticks)||ticks<0)",to:"if(false)",
   falsify:m=>assert.equal(m.describeLevel("LV-01",CFG,PLATFORMS,-1).id,"LV-01")}
];
const chosen=process.env.NILO_S03_MUTANT;
if(chosen&&!cases.some(x=>x.id===chosen))
  throw new Error("unknown physical source mutant selector");
function assertOriginal(m){
  assert.equal(m.describeLevel("LV-01",CFG,PLATFORMS).width,CFG.width);
  assert.equal(m.describeLevel("LV-02",CFG,PLATFORMS,20).platforms.at(-1).x,movingBridge(20).x);
  assert.deepEqual(m.describeLevel("LV-03",CFG,PLATFORMS).checkpointSpawn,LV03.checkpointSpawn);
  assert.equal(m.describeLevel("LV-02",CFG,PLATFORMS).boss,"CH-CUSTODE");
  assert.throws(()=>m.describeLevel("LV-04",CFG,PLATFORMS),RangeError);
  assert.throws(()=>m.describeLevel("LV-01",CFG,PLATFORMS,-1),RangeError);
}
for(const c of cases.filter(x=>!chosen||x.id===chosen)){
  test("physical catalog source counterexample detected: "+c.id,async()=>{
    const tmp=mkdtempSync(join(tmpdir(),"nilo-s03a-physical-"));
    try{
      for(const path of ["web/levels/catalog.mjs","web/levels/lv-02.mjs","web/levels/lv-03.mjs"]){
        const dest=join(tmp,path);
        mkdirSync(dirname(dest),{recursive:true});
        cpSync(join(root,path),dest);
      }
      writeFileSync(join(tmp,"package.json"),JSON.stringify({type:"module"}));
      const target=join(tmp,"web/levels/catalog.mjs");
      const original=readFileSync(target,"utf8");
      assert.equal(original.split(c.from).length,2,"unique real original byte selector: "+c.id);
      const load=tag=>import(pathToFileURL(target).href+"?s03_probe="+tag);
      assertOriginal(await load("baseline-"+c.id));
      writeFileSync(target,original.replace(c.from,c.to),"utf8");
      assert.notEqual(readFileSync(target,"utf8"),original);
      const physicalMutant=await load("mutated-"+c.id);
      c.falsify(physicalMutant);
      writeFileSync(target,original,"utf8");
      assertOriginal(await load("restored-"+c.id));
    }finally{rmSync(tmp,{recursive:true,force:true});}
  });
}
