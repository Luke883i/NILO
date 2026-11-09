import test from "node:test";
import assert from "node:assert/strict";
import {load,audit,verify} from "../scripts/verify.mjs";
const fresh=()=>structuredClone(load());
test("seed source contract passes only bounded predicates",()=>{
 const out=verify();assert.deepEqual(out.errors,[]);
 assert.equal(out.source_status,"PASS_SCOPED_SOURCE");
 assert.equal(out.full_contract,"NOT_DEMONSTRATED");
 assert.equal(out.game_status,"BLOCKED_EXTERNAL");
 assert.equal(out.release_authorized,false);
});
test("independent corruption of story, characters, levels and bosses is detected",()=>{
 const cases=[
   d=>{d.contract.story.theme="";},
   d=>{d.contract.characters[0].id=d.contract.characters[1].id;},
   d=>{d.contract.levels.pop();},
   d=>{d.contract.levels[5].boss="CH-NOT-FOUND";},
 ];
 for(const change of cases){const d=fresh();change(d);assert(audit(d).length>0);}
});
test("AND DAG cannot drop an external prerequisite or carry a false pass",()=>{
 let d=fresh();d.dod.nodes.find(n=>n.id==="G_CONTRACT_DEMONSTRATED").depends_on=["G_FULL_GAME"];
 assert(audit(d).includes("dod-AND"));
 d=fresh();d.dod.nodes.find(n=>n.id==="G_SEED_STORY").depends_on.push("G_CONTRACT_DEMONSTRATED");
 assert(audit(d).includes("dod-cycle"));
 d=fresh();d.dod.nodes.find(n=>n.id==="R02").baseline_status="PASS";
 assert(audit(d).includes("dod-no-false-pass"));
});
test("a missing semantic node or fabricated hardware sha fails closed",()=>{
 let d=fresh();d.chain.layers.pop();assert(audit(d).includes("semantic-chain"));
 d=fresh();d.chain.layers.find(n=>n.id==="L13").sha256="a".repeat(64);
 assert(audit(d).includes("honest-sha"));
 d=fresh();d.refs.references.find(n=>n.id==="LAW-EAA").applicability="AUTOMATICALLY_NOT_APPLICABLE";
 assert(audit(d).includes("law-honesty"));
});
test("no dependency laundering or false standards completeness",()=>{
 let d=fresh();d.bom.compositions[0].aggregate="complete";
 assert(audit(d).includes("bom-design-only"));
 d=fresh();d.pkg.dependencies={unverified:"*"};
 assert(audit(d).includes("no-packages"));
 d=fresh();d.refs.references.find(n=>n.id==="STD-SLSA").text_sha256="f".repeat(64);
 assert(audit(d).includes("normative-register"));
});
