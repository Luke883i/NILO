import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,cpSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {validateBridge} from "../scripts/verify-development.mjs";
const read=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const base=()=>({bridge:read("contracts/development-map.json"),contract:read("contracts/nilo-semantic-v1.json"),dod:read("contracts/dod-v1.json")});
const fixtureFiles=["web/core.mjs","web/main.mjs","web/index.html","web/style.css","web/art.mjs",
  "tests/core.test.mjs","tests/mutation.test.mjs","tests/contracts.test.mjs",
  "tests/development.test.mjs","tests/art.test.mjs","tests/art-mutation.test.mjs",
  "tests/semantic-campaign.test.mjs","tests/experience.test.mjs","tests/feel.test.mjs","tests/browser-e2e.py",".github/workflows/seed.yml"];
test("current contract maps 6 levels, 6 oracles and 4 web units without asserting browser beta",()=>{
  const d=base();assert.deepEqual(validateBridge(d),[]);
  assert.equal(d.bridge.beta_authorized,false);
  assert.equal(d.bridge.levels.filter(x=>x.state==="DESIGN_ONLY").length,5);
});
test("product change without software and repository binding fails closed",()=>{
  const d=base();d.contract.slice.acceptance_oracles.push({id:"OR-07"});
  assert(validateBridge(d).includes("bridge-oracles"));
});
test("mislabeled implemented level without tested source is rejected",()=>{
  const d=base();d.bridge.levels[1].state="IMPLEMENTED_CANDIDATE";
  assert(validateBridge(d).includes("bridge-no-fake-levels"));
});
test("source changes may not bypass product requirements",()=>{
  const d=base();d.bridge.requirements.find(x=>x.id==="OR-03").sources=["web/not-real.mjs"];
  assert(validateBridge(d).includes("bridge-valid-sources"));
});
test("an untraceable browser PASS or beta authorization is refuted",()=>{
  let d=base();d.bridge.requirements.find(x=>x.id==="OR-05").browser="PASS";
  assert(validateBridge(d).includes("bridge-no-runtime-promotion"));
  d=base();d.bridge.beta_authorized=true;assert(validateBridge(d).includes("bridge-authority"));
});
test("model evidence cannot masquerade as independent UX or touch support",()=>{
  let d=base();d.bridge.requirements.find(x=>x.id==="OR-05").tests=["tests/core.test.mjs"];
  assert(validateBridge(d).includes("bridge-model-witness"));
  d=base();d.bridge.mobile_touch="SUPPORTED";assert(validateBridge(d).includes("bridge-mobile-truth"));
});
test("removing a source owner or mutation witness is rejected",()=>{
  let d=base();d.bridge.requirements=d.bridge.requirements.filter(x=>x.id!=="OR-01");
  assert(validateBridge(d).includes("bridge-oracles"));
  d=base();d.bridge.requirements.find(x=>x.id==="OR-06").tests=["tests/core.test.mjs"];
  assert(validateBridge(d).includes("bridge-model-witness"));
});

test("an unowned nested web file physically added to a disposable repository fails",()=>{
  const root=fileURLToPath(new URL("../",import.meta.url));
  const tmp=mkdtempSync(join(tmpdir(),"nilo-orphan-source-"));
  try {
    for(const f of fixtureFiles){
      const dest=join(tmp,f);mkdirSync(join(dest,".."),{recursive:true});
      cpSync(join(root,f),dest);
    }
    const d=base();
    assert.deepEqual(validateBridge(d,tmp),[],"original mapped source fixture must pass");
    mkdirSync(join(tmp,"web","levels"),{recursive:true});
    writeFileSync(join(tmp,"web","levels","lv02.mjs"),"export const level='unowned';\n");
    assert(validateBridge(d,tmp).includes("bridge-source-coverage"),
      "new nested product code must have an OR owner in the same PR");
  }finally{rmSync(tmp,{recursive:true,force:true});}
});

test("the root must not become a second undocumented source owner",()=>{
  const root=fileURLToPath(new URL("../",import.meta.url));
  const tmp=mkdtempSync(join(tmpdir(),"nilo-root-drift-"));
  try {
    for(const f of fixtureFiles){
      const dest=join(tmp,f);mkdirSync(join(dest,".."),{recursive:true});cpSync(join(root,f),dest);
    }
    const d=base();
    assert.deepEqual(validateBridge(d,tmp),[]);
    mkdirSync(join(tmp,"new-unregistered-engine"));
    assert(validateBridge(d,tmp).includes("bridge-root-minimal"));
  }finally{rmSync(tmp,{recursive:true,force:true});}
});
test("future level cannot be marked implemented by borrowing LV-01 tests",()=>{
 const d=base(),n=d.bridge.levels.find(x=>x.id==="LV-02");
 n.state="IMPLEMENTED_CANDIDATE";n.source=["web/core.mjs"];n.tests=["tests/core.test.mjs"];
 assert(validateBridge(d).includes("bridge-no-fake-levels"));
});

test("browser evidence requires real test owner and never confers UX approval",()=>{
 const d=base();
 assert.deepEqual(validateBridge(d),[]);
 for(const id of ["OR-03","OR-05"]){
   const mutant=base(),owner=mutant.bridge.requirements.find(x=>x.id===id);
   owner.tests=owner.tests.filter(x=>x!=="tests/browser-e2e.py");
   assert(validateBridge(mutant).length>0,id+" must have an actual browser test");
 }
 const falsePass=base();
 falsePass.bridge.requirements.find(x=>x.id==="OR-05").browser="PASS_INDEPENDENT";
 assert(validateBridge(falsePass).includes("bridge-no-runtime-promotion"));
});
