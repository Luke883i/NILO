import test from 'node:test';
import assert from 'node:assert/strict';
import {run,expected,classify,BITS,validateIterationHypothesis,evaluateIterationHypothesis,BROWSER_AXES,expectedBrowser,classifyBrowser,runBrowserAdversarial} from '../scripts/semantic-campaign.mjs';
import {readFileSync} from 'node:fs';
test('independent oracle matches derived classifier on deterministic source catalog',()=>{
 const r=run({count:30000,seed:20261109});
 assert.equal(r.enumerated,30000);
 assert.equal(r.oracle_mismatches,0);
 assert.equal(r.model.includes('NOT_GAME_EXECUTIONS'),true);
 assert(r.distinct_normalized_signatures>1);
 assert(r.mutants.every(m=>m.killed_vectors>0 && m.survivors_in_scope===0));
});
test('visible false product pass and untrusted reviewer are blocked by source oracle',()=>{
 const f=[0,0,0,0,0,0,0];assert.equal(expected(f),0);
 f[0]=9;assert.equal(expected(f)&BITS.FUTURE,BITS.FUTURE);
 f[1]=5;assert.equal(classify(f)&BITS.INPUT,BITS.INPUT);
 f[6]=4;assert.equal(classify(f)&BITS.EVIDENCE,BITS.EVIDENCE);
});

const getDod=()=>JSON.parse(readFileSync(new URL('../contracts/dod-v1.json',import.meta.url),'utf8'));
test('N0=18 is a falsifiable hypothesis, never a beta release statement',()=>{
 const dod=getDod(),out=evaluateIterationHypothesis(dod);
 assert.deepEqual(validateIterationHypothesis(dod),[]);
 assert.equal(out.N0,18);assert.equal(out.N_actual,null);
 assert.equal(out.release_authorized,false);
 assert.equal(out.status,'BLOCKED_EXTERNAL');
 assert(out.blocking_leaf_ids.includes('Q07'));
 assert(out.blocking_leaf_ids.includes('Q06'));
});
test('even 18 self-reported stages cannot replace real host and player witnesses',()=>{
 const dod=getDod(),ids=dod.development_projection.steps.map(x=>x.id);
 const out=evaluateIterationHypothesis(dod,ids);
 assert.equal(out.reported_stages,18);
 assert.equal(out.status,'BLOCKED_EXTERNAL');
 assert.equal(out.N_actual,null);
 assert.equal(out.release_authorized,false);
});
test('forecasts must fail if an existing source owner or negative oracle disappears',()=>{
 const dod=getDod(),mutant=structuredClone(dod);
 mutant.development_projection.steps[2].owners=['web/phantom-pixel-engine.mjs'];
 assert(validateIterationHypothesis(mutant).includes('planning-oracle-or-owner-lost'));
 const bad=structuredClone(dod);bad.development_projection.steps[11].required_dod='G_FAKE_CERTIFICATE';
 assert(validateIterationHypothesis(bad).includes('planning-oracle-or-owner-lost'));
});
test('iteration counts, rewording, and missing external gates cannot forge completion',()=>{
 const dod=getDod();dod.development_projection.N_actual=18;
 assert(validateIterationHypothesis(dod).includes('planning-unearned-completion'));
 const mutant=getDod();mutant.development_projection.guaranteed_completion=true;
 assert(validateIterationHypothesis(mutant).includes('planning-false-guarantee'));
 const stuck=evaluateIterationHypothesis(getDod(),['I02','I02','I02']);
 assert.equal(stuck.decision,'REPLAN_STALLED_REPORTS');
});

test('browser attack catalog has ten concrete scenarios per seven independent axes',()=>{
 assert.equal(BROWSER_AXES.length,7);
 assert(BROWSER_AXES.every(a=>a.values.length===10 && a.values.every(v=>v.id && a.fields.every(f=>typeof v[f]==='boolean'))));
 const r=runBrowserAdversarial({count:40000,seed:20261109});
 assert.equal(r.enumerated,40000);
 assert.equal(r.mismatches,0);
 assert(r.blocked_vectors>0);
 assert.equal(r.independent_browser_runs,0);
 assert.equal(r.physical_mutations,0);
 assert(r.distinct_failure_signatures>=20);
});
test('mutated expected/original browser evidence produces a real model disagreement',()=>{
 const axes=structuredClone(BROWSER_AXES);
 axes[0].values[0].http=false;
 assert.notEqual(expectedBrowser([0,0,0,0,0,0,0],axes),classifyBrowser([0,0,0,0,0,0,0],axes));
 assert(runBrowserAdversarial({count:10000,seed:1,axes}).mismatches>0);
});
