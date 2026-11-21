/** CORA-METHOD only: falsifiable original S00-S25 -> compressed NILO roadmap.
 * A graph consistency result is not an artist, game, CI, or release approval.
 */
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
const expected={
 S00:[],S01:["S00"],S02:["S01"],S03:["S01","S02"],
 S04:["S02"],S05:["S03","S04"],S06:["S03","S04"],S07:["S03","S01"],
 S08:["S07","S03"],S09:["S05","S07"],
 S10:["S05","S06","S07","S08","S09"],S11:["S10","S07"],S12:["S10","S11"],
 S13:["S12","S08"],S14:["S03","S06","S09","S13"],S15:["S14","S11"],
 S16:["S13","S14","S08"],S17:["S15","S16"],S18:["S17","S15","S11"],
 S19:["S18","S02"],S20:["S09","S02"],S21:["S05","S06","S07","S20"],
 S22:["S19","S20","S06"],S23:["S18","S19","S20","S21","S22"],
 S24:["S23"],S25:["S23","S24","S22"]
};
const expectedIDs=Object.keys(expected);
const external=new Set(["HA","H0","H1","H2"]);
const merged=new Set(["F0","G1V0","G1V1"]);
const allowed=new Set(["F0","G1V0","G1V1","HA","G1V2","G2V0","G2V1",
 "G2V2","H0","G3","G4","G5","G6","G7","G8","G9","G10","H1","H2"]);
const unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
const err=(out,k,ok)=>{if(!ok)out.push(k);};
export function auditNiloRoadmap(d,product){
 const issues=[];
 if(!d||typeof d!=="object")return ["roadmap-invalid"];
 err(issues,"roadmap-meta",d.schema==="nilo.roadmap-coverage/3"&&
   d.target==="Luke883i/NILO"&&
   d.base_sha==="5ec13d69d71816232cc72b8c4893b5542ba7391b"&&
   d.status==="PROPOSED_SOURCE_MAPPING_NOT_TARGET_ACCEPTANCE"&&
   d.technical_slice==="G2V0"&&
   d.human_creative_approved===false&&d.independent_playtest_accepted===false&&
   d.release_authorized===false&&d.limits?.G1V2_author_approval==="BLOCKED_EXTERNAL"&&
   d.limits?.G2V0_narrative_approval==="BLOCKED_EXTERNAL"&&
   d.limits?.no_design_only_level_unlock===true&&d.limits?.full_game_done===false);
 err(issues,"roadmap-owner-approval",product?.next_a0?.approval?.human_approved===false&&
   product?.next_a0?.decisions?.length===9&&
   product.next_a0.decisions.every(x=>x.selected===null));
 err(issues,"roadmap-oracle-chain",d.technical_oracles?.source==="tests/shard-ward.test.mjs"&&
   d.technical_oracles?.physical_mutants==="tests/shard-ward-mutation.test.mjs"&&
   d.technical_oracles?.native_browser==="tests/browser-shard-ward.py"&&
   d.technical_oracles?.roadmap_falsification==="tests/roadmap.test.mjs");
 const original=Array.isArray(d.old_slices)?d.old_slices:[];
 const observedIDs=original.map(x=>x?.id);
 err(issues,"roadmap-original-coverage",original.length===26&&
   unique(observedIDs)&&expectedIDs.every(id=>observedIDs.includes(id)));
 for(const [id,deps] of Object.entries(expected)){
  const n=original.find(x=>x?.id===id);
  err(issues,"roadmap-old-edge:"+id,Boolean(n&&Array.isArray(n.depends_on)&&
     n.depends_on.join(",")===deps.join(",")));
 }
 const stages=Array.isArray(d.stages)?d.stages:[];
 const ids=stages.map(x=>x?.id),byId=new Map(stages.map(x=>[x?.id,x]));
 err(issues,"roadmap-stage-coverage",stages.length===allowed.size&&
   unique(ids)&&ids.every(x=>allowed.has(x))&&[...allowed].every(x=>byId.has(x)));
 const owner=new Map();
 for(const n of stages){
  if(!n||!Array.isArray(n.original_slices))continue;
  for(const x of n.original_slices){
   if(owner.has(x))issues.push("roadmap-duplicate-owner:"+x);
   owner.set(x,n.id);
  }
 }
 err(issues,"roadmap-coverage-bijection",owner.size===26&&
   expectedIDs.every(id=>owner.has(id))&&
   owner.size===[...owner.keys()].filter(x=>expectedIDs.includes(x)).length);
 const expectedOwners={F0:["S00","S01","S02","S03"],
 G1V2:["S04","S05","S06"],G2V2:["S07","S08","S09"],G3:["S10"],G4:["S11","S12"],
 G5:["S13"],G6:["S14","S15"],G7:["S16"],G8:["S17","S18","S19"],
 G9:["S20","S21"],G10:["S22","S23"],H1:["S24"],H2:["S25"]};
 for(const id of allowed){
  const value=byId.get(id);
  err(issues,"roadmap-owner-package:"+id,
   Boolean(value?.original_slices&&value.original_slices.join(",")===(expectedOwners[id]||[]).join(",")));
  const wanted=external.has(id)?"BLOCKED_EXTERNAL":
   merged.has(id)?"MERGED_TECH_ONLY":id==="G2V0"?"PR_CANDIDATE":"PLANNED";
  err(issues,"roadmap-status:"+id,value?.status===wanted);
 }
 err(issues,"roadmap-external-gates",d.gates?.creative==="HA"&&
   d.gates?.early_playtest==="H0"&&d.gates?.full_playtest==="H1"&&
   d.gates?.release==="H2");
 const visiting=new Set(),seen=new Set(),upstream=new Map();
 const dfs=id=>{
  if(visiting.has(id)){issues.push("roadmap-cycle:"+id);return new Set();}
  if(!byId.has(id)){issues.push("roadmap-dangling:"+id);return new Set();}
  if(seen.has(id))return upstream.get(id);
  visiting.add(id);
  const deps=byId.get(id).depends_on;
  const ancestors=new Set();
  if(!Array.isArray(deps)||!unique(deps))issues.push("roadmap-stage-deps:"+id);
  else for(const dep of deps){
   if(dep===id){issues.push("roadmap-self-edge:"+id);continue;}
   ancestors.add(dep);
   for(const prior of dfs(dep))ancestors.add(prior);
  }
  visiting.delete(id);seen.add(id);upstream.set(id,ancestors);return ancestors;
 };
 for(const id of allowed)dfs(id);
 for(const s of original){
  if(!Array.isArray(s.depends_on))continue;
  const src=owner.get(s.id);
  for(const dep of s.depends_on){
   const target=owner.get(dep);
   if(src&&target&&src!==target&&!upstream.get(src)?.has(target))
    issues.push("roadmap-legacy-prerequisite:"+s.id+"->"+dep);
  }
 }
 const release=upstream.get("H2")||new Set();
 err(issues,"roadmap-all-stages-connected",
   release.size===allowed.size-1&&[...allowed].filter(x=>x!=="H2").every(x=>release.has(x)));
 const needs=[
  ["G1V2","HA"],["G2V0","G1V1"],["G2V2","G1V2"],["G3","H0"],
  ["G3","G1V2"],["G3","G2V2"],["G9","G1V2"],["G9","G2V2"],
  ["G10","G9"],["G10","G8"],["H1","G10"],["H2","H1"]];
 for(const [child,dep] of needs)
  err(issues,"roadmap-mandatory-gate:"+child+"->"+dep,
    Boolean(byId.get(child)?.depends_on?.includes(dep)));
 return [...new Set(issues)];
}
export function readRoadmap(){
 return JSON.parse(readFileSync(new URL("../contracts/nilo-roadmap-v3.json",import.meta.url),"utf8"));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const roadmap=readRoadmap();
 const contract=JSON.parse(readFileSync(new URL("../contracts/nilo-semantic-v1.json",import.meta.url),"utf8"));
 const problems=auditNiloRoadmap(roadmap,contract);
 if(problems.length){console.error(problems);process.exitCode=1;}
 else console.log("PASS_SCOPED_SOURCE_ROADMAP 26/26 original slices, 19 nodes, human gates remain blocked");
}
