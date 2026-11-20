// S02 source mutation tests. These physically rewrite temporary JSON bytes;
// they do NOT run gameplay or claim that an independent author approved art.
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {audit,load,verify} from "../scripts/verify.mjs";

const root=load();
const productBytes=readFileSync(new URL("../contracts/nilo-semantic-v1.json",import.meta.url),"utf8");
const dodBytes=readFileSync(new URL("../contracts/dod-v1.json",import.meta.url),"utf8");

test("S02 source proposal has no creative approval or beta authority",()=>{
  const result=verify();
  assert.deepEqual(result.errors,[]);
  assert.equal(result.source_status,"PASS_SCOPED_SOURCE");
  assert.equal(result.author_approval,"NOT_OBSERVED");
  assert.equal(result.game_status,"BLOCKED_EXTERNAL");
  assert.equal(result.release_authorized,false);
  assert.equal(root.contract.next_a0.approval.human_approved,false);
  assert.equal(root.dod.nodes.find(n=>n.id==="G_CREATIVE_A0_S02").baseline_status,"BLOCKED");
});

function physicalMutant(kind,name,mutate,expected){
  test("physical JSON source mutation killed: "+name,()=>{
    const dir=mkdtempSync(join(tmpdir(),"nilo-s02-creative-"));
    try{
      const before=kind==="product"?productBytes:dodBytes;
      const changed=JSON.parse(before);
      mutate(changed);
      const mutated=JSON.stringify(changed,null,2)+"\n";
      assert.notEqual(mutated,before,"the mutation must change real file bytes");
      const file=join(dir,kind==="product"?"nilo-semantic-v1.json":"dod-v1.json");
      writeFileSync(file,mutated,"utf8");
      const observed=JSON.parse(readFileSync(file,"utf8"));
      const input={...load(),[kind==="product"?"contract":"dod"]:observed};
      const errors=audit(input);
      assert(errors.includes(expected),"surviving mutation "+name+": "+errors.join(","));
    }finally{rmSync(dir,{recursive:true,force:true});}
  });
}

physicalMutant("product","fake creative approval",d=>{
  d.next_a0.approval.human_approved=true;
},"s02-a0-identity");
physicalMutant("product","unreviewed lethal-combat policy",d=>{
  d.next_a0.behavior.violence_boundary="LETHAL_COMBAT_AUTHOR_APPROVED";
},"s02-a0-boundary");
physicalMutant("product","decision silently selected",d=>{
  d.next_a0.decisions[1].selected="DISABLE_REPAIRABLE_MECHANICAL_ENEMIES";
},"s02-a0-decisions");
physicalMutant("product","removed design decision",d=>{
  d.next_a0.decisions.pop();
},"s02-a0-decisions");
physicalMutant("product","stolen or unclear original-rights promise",d=>{
  d.next_a0.exclusions=d.next_a0.exclusions.filter(x=>x!=="NO_MARIO_CHARACTER_OR_GAME_ASSETS");
},"s02-a0-boundary");
physicalMutant("product","telemetry silently enabled",d=>{
  d.next_a0.effects.outbound_telemetry=true;
},"s02-a0-boundary");
physicalMutant("product","sixth biome silently dropped",d=>{
  d.next_a0.worlds.pop();
},"s02-a0-worlds");
physicalMutant("product","second boss incorrectly mapped",d=>{
  d.next_a0.worlds[3].boss_id="CH-CUSTODE";
},"s02-a0-worlds");
physicalMutant("product","P4 boss criterion erased",d=>{
  d.next_a0.pillars.splice(3,1);
},"s02-a0-pillars");
physicalMutant("product","novice playtest requirement erased",d=>{
  d.next_a0.acceptance_oracle.min_independent_novices_candidate=0;
},"s02-a0-oracle");
physicalMutant("dod","creative author gate disconnected from full game",d=>{
  const n=d.nodes.find(x=>x.id==="G_FULL_GAME");
  n.depends_on=n.depends_on.filter(x=>x!=="G_CREATIVE_A0_S02");
},"dod-AND");
physicalMutant("dod","invented author PASS without observation",d=>{
  d.nodes.find(x=>x.id==="C2_02").baseline_status="PASS";
},"s02-a0-gate");
physicalMutant("dod","fabricated rights evidence",d=>{
  d.nodes.find(x=>x.id==="C2_04").witness="invented receipt";
},"s02-a0-gate");
physicalMutant("dod","creative AND condition silently removed",d=>{
  d.nodes.find(x=>x.id==="G_CREATIVE_A0_S02").depends_on.pop();
},"s02-a0-gate");
