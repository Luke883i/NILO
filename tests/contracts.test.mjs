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

test("dropping a beta prerequisite cannot be laundered as full-contract acceptance",()=>{
 const d=fresh(),beta=d.dod.nodes.find(x=>x.id==="G_BETA_RELEASE");
 assert.equal(d.dod.beta_goal,"G_BETA_RELEASE");
 assert.equal(beta.depends_on.length,8);
 beta.depends_on=beta.depends_on.filter(x=>x!=="Q03");
 assert(audit(d).includes("dod-AND"));
});

test("an aesthetic self-certificate or missing mandatory experience criterion blocks beta",()=>{
 const d=fresh(),experience=d.dod.nodes.find(n=>n.id==="Q07");
 experience.baseline_status="PASS";
 assert(audit(d).includes("dod-no-false-pass"));
 assert(audit(d).includes("dod-experience-quality"));
 const f=fresh();f.dod.nodes.find(n=>n.id==="Q07").noncompensatory_subcriteria.pop();
 assert(audit(f).includes("dod-experience-quality"));
});

test("PR7 input lifecycle is a falsifiable product contract, not automatic enjoyment approval",()=>{
  const d=fresh();
  d.contract.gameplay.game_feel.input_continuity.buffered_short_hop_max_apex_delta_px=100;
  assert(audit(d).includes("game-feel-input-continuity"));
  const status=fresh();
  status.contract.gameplay.game_feel.input_continuity.user_experience_approval="PASS";
  assert(audit(status).includes("game-feel-input-continuity"));
});

test("PR8 source-level visual signals cannot self-certify beauty, accessibility or six playable acts",()=>{
 const d=fresh(),v=d.contract.gameplay.visual_scene;
 v.player_visual_comprehension="PASS";
 assert(audit(d).includes("visual-scene-source-drift"));
 const s=fresh();s.contract.gameplay.visual_scene.art_cues.pop();
 assert(audit(s).includes("visual-scene-source-drift"));
 const r=fresh();r.contract.gameplay.visual_scene.scaled_integer_factor=1;
 assert(audit(r).includes("visual-scene-source-drift"));
});

test("PR10 declared input/states cannot drift from runtime or invent playable TITLE/FALLEN",()=>{
 const d=load();
 d.contract.gameplay.input.repair=[];
 assert(audit(d).includes("runtime-controls-and-states"));
 const another=load();another.contract.gameplay.game_state=another.contract.gameplay.game_state.filter(x=>x!=="DEFEATED");
 assert(audit(another).includes("runtime-controls-and-states"));
});

test("PR11 release gate cannot bypass remote Render and actual Codespace witness",()=>{
 const mutate=(fn,expected)=>{
   const d=fresh();fn(d);assert(audit(d).includes(expected),expected);
 };
 mutate(d=>{d.dod.nodes.find(n=>n.id==="G_RELEASE").depends_on=["R01","R02","R03"]},"dod-AND");
 mutate(d=>{d.dod.nodes.find(n=>n.id==="G_RENDER_P1").depends_on=["DL05","DL06","DL07"]},"dod-AND");
 mutate(d=>{d.dod.nodes.find(n=>n.id==="DL08").baseline_status="PASS"},"delivery-no-external-laundering");
 mutate(d=>{d.contract.delivery.render.remote_deployment="PASS"},"delivery-source-truth");
});

test("PR12 archive physical source and complete AND chain cannot be laundered",()=>{
 let d=fresh();d.contract.gameplay.lv03.third_hour="POSITION_ONLY";
 assert(audit(d).includes("lv03-boundary"));
 d=fresh();d.dod.nodes.find(x=>x.id==="G_FULL_GAME").depends_on=
   d.dod.nodes.find(x=>x.id==="G_FULL_GAME").depends_on.filter(x=>x!=="G_LV03_PR12");
 assert(audit(d).includes("dod-AND"));
 d=fresh();d.dod.nodes.find(x=>x.id==="L3_07").baseline_status="PASS";
 assert(audit(d).includes("lv03-no-self-approved-gates"));
});
