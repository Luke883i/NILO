import test from 'node:test';
import assert from 'node:assert/strict';
import {run,expected,classify,BITS} from '../scripts/semantic-campaign.mjs';
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
