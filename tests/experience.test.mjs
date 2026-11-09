import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {audit,load} from '../scripts/verify.mjs';
const fresh=()=>structuredClone(load());
test('the market-experience gate is a required AND child of the six-level beta',()=>{
 const d=fresh(),byId=new Map(d.dod.nodes.map(x=>[x.id,x]));
 const root=byId.get('G_CONTRACT_DEMONSTRATED');
 const beta=byId.get('G_BETA_RELEASE');
 const quality=byId.get('Q07');
 assert(root.depends_on.includes('G_BETA_RELEASE'));
 assert(beta.depends_on.includes('G_FULL_GAME'));
 assert(beta.depends_on.includes('Q07'));
 assert.equal(quality.baseline_status,'BLOCKED_EXTERNAL');
 assert.equal(quality.witness,null);
 assert.equal(quality.noncompensatory_subcriteria.length,7);
 assert.deepEqual(audit(d),[],'seed source model stays internally well-formed, never product-certified');
});
test('neither deleting Q07 nor self-certifying perceptual quality yields valid beta',()=>{
 let d=fresh();d.dod.nodes.find(x=>x.id==='G_BETA_RELEASE').depends_on=
  d.dod.nodes.find(x=>x.id==='G_BETA_RELEASE').depends_on.filter(x=>x!=='Q07');
 assert(audit(d).includes('dod-AND'));
 d=fresh();d.dod.nodes.find(x=>x.id==='Q07').baseline_status='PASS';
 assert(audit(d).includes('dod-experience-quality'));
 d=fresh();d.dod.nodes.find(x=>x.id==='Q07').noncompensatory_subcriteria.pop();
 assert(audit(d).includes('dod-experience-quality'));
});
