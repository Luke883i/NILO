import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {auditNiloRoadmap} from "../scripts/verify-roadmap.mjs";
const src=readFileSync(new URL("../contracts/nilo-roadmap-v3.json",import.meta.url),"utf8");
const product=JSON.parse(readFileSync(new URL("../contracts/nilo-semantic-v1.json",import.meta.url),"utf8"));
const start=()=>JSON.parse(src);
const stage=(d,id)=>d.stages.find(x=>x.id===id);
test("Entire original S00-S25 chain survives compressed real graph without false approvals",()=>{
 const d=start();
 assert.deepEqual(auditNiloRoadmap(d,product),[]);
 assert.equal(d.old_slices.length,26);
 assert.equal(d.stages.length,19);
 assert.equal(d.stages.filter(x=>x.status==="BLOCKED_EXTERNAL").length,4);
 assert.equal(d.stages.filter(x=>x.status==="MERGED_TECH_ONLY").length,3);
 assert.equal(stage(d,"G2V0").status,"PR_CANDIDATE");
 assert.equal(stage(d,"G1V2").status,"PLANNED");
 assert.equal(d.release_authorized,false);
});
const mutations=[
 {id:"delete-original-S17",edit:d=>d.old_slices.splice(17,1),oracle:"roadmap-original-coverage"},
 {id:"alter-old-cross-slice-S23-dependency",edit:d=>{d.old_slices.find(x=>x.id==="S23").depends_on.pop()},oracle:"roadmap-old-edge:S23"},
 {id:"invent-old-incompatible-prerequisite",edit:d=>{d.old_slices.find(x=>x.id==="S05").depends_on=["S25"]},oracle:"roadmap-old-edge:S05"},
 {id:"duplicate-original-owner",edit:d=>stage(d,"G8").original_slices.push("S16"),oracle:"roadmap-duplicate-owner:S16"},
 {id:"move-a-boss-slice-to-wrong-stage",edit:d=>{stage(d,"G4").original_slices.pop();stage(d,"G2V0").original_slices.push("S12")},oracle:"roadmap-owner-package:G4"},
 {id:"bypass-creative-human-gate",edit:d=>stage(d,"G1V2").depends_on=stage(d,"G1V2").depends_on.filter(x=>x!=="HA"),oracle:"roadmap-mandatory-gate:G1V2->HA"},
 {id:"skip-early-novice-gate",edit:d=>stage(d,"G3").depends_on=stage(d,"G3").depends_on.filter(x=>x!=="H0"),oracle:"roadmap-mandatory-gate:G3->H0"},
 {id:"skip-full-playtest-at-release",edit:d=>stage(d,"H2").depends_on=stage(d,"H2").depends_on.filter(x=>x!=="H1"),oracle:"roadmap-mandatory-gate:H2->H1"},
 {id:"skip-product-quality-before-release",edit:d=>stage(d,"G10").depends_on=stage(d,"G10").depends_on.filter(x=>x!=="G9"),oracle:"roadmap-mandatory-gate:G10->G9"},
 {id:"break-original-G2-gamefeel-visual-dependency",edit:d=>stage(d,"G2V2").depends_on=stage(d,"G2V2").depends_on.filter(x=>x!=="G1V2"),oracle:"roadmap-mandatory-gate:G2V2->G1V2"},
 {id:"hide-quality-as-orphan-stage",edit:d=>{stage(d,"G9").depends_on=[];stage(d,"G10").depends_on=stage(d,"G10").depends_on.filter(x=>x!=="G9")},oracle:"roadmap-all-stages-connected"},
 {id:"create-cycle-across-release-and-G9",edit:d=>stage(d,"G9").depends_on.push("H2"),oracle:"roadmap-cycle:"},
 {id:"invent-artist-approval",edit:d=>{d.human_creative_approved=true},oracle:"roadmap-meta"},
 {id:"invent-release-authority",edit:d=>{d.release_authorized=true},oracle:"roadmap-meta"},
 {id:"promote-early-playtest-in-source",edit:d=>{stage(d,"H0").status="MERGED_TECH_ONLY"},oracle:"roadmap-status:H0"},
 {id:"lie-about-merged-technical-slice",edit:d=>{stage(d,"G2V0").status="MERGED_TECH_ONLY"},oracle:"roadmap-status:G2V0"},
 {id:"remove-native-browser-oracle",edit:d=>{d.technical_oracles.native_browser=""},oracle:"roadmap-oracle-chain"},
 {id:"break-git-provenance",edit:d=>{d.base_sha="0000000000000000000000000000000000000000"},oracle:"roadmap-meta"}
];
for(const {id,edit,oracle} of mutations){
 test("Actual written roadmap source mask falsifies "+id,()=>{
  const dir=mkdtempSync(join(tmpdir(),"nilo-roadmap-counterexample-"));
  try{
   const path=join(dir,"nilo-roadmap-v3.json");
   const d=start();edit(d);
   const changed=JSON.stringify(d,null,2)+"\n";
   assert.notEqual(changed,src,"mutation must physically change JSON source bytes");
   writeFileSync(path,changed,"utf8");
   const onDisk=JSON.parse(readFileSync(path,"utf8"));
   const errs=auditNiloRoadmap(onDisk,product);
   assert(errs.some(x=>x.startsWith(oracle)),JSON.stringify({id,expected:oracle,observed:errs}));
  }finally{rmSync(dir,{recursive:true,force:true});}
 });
}
test("Human approval cannot be fabricated in target creative contract",()=>{
 const candidate=structuredClone(product);
 candidate.next_a0.approval.human_approved=true;
 assert(auditNiloRoadmap(start(),candidate).includes("roadmap-owner-approval"));
});
