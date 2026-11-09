// Finite, deterministic combinatorial model. Never label its cases real playtests.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const BITS=Object.freeze({FUTURE:1,INPUT:2,VIEWPORT:4,SAVE:8,ART:16,STORY:32,EVIDENCE:64});
const source=()=>JSON.parse(readFileSync(resolve(ROOT,'contracts/semantic-campaign-v1.json'),'utf8'));
// Independent expected-result oracle: per-axis predeclared expected blocker bit.
export function expected(vector,contract=source()){
 let mask=0;
 for(let i=0;i<7;i++)mask|=contract.axes[i].values[vector[i]].expected_blocker;
 return mask;
}
// Independent candidate classifier uses typed implementation/UX/provenance facts.
export function classify(vector,contract=source()){
 const [scene,input,view,save,art,story,evidence]=contract.axes.map((x,i)=>x.values[vector[i]]);
 return (scene.implemented?0:BITS.FUTURE) |
   (input.supported?0:BITS.INPUT) |
   (view.min_glyph_px>=12 && view.supported?0:BITS.VIEWPORT) |
   (save.demonstrated?0:BITS.SAVE) |
   (art.silhouette && art.contrast && art.hud?0:BITS.ART) |
   (story.integrity && story.author_approved?0:BITS.STORY) |
   (evidence.runtime_verified && evidence.trusted_revision && evidence.license_reviewed?0:BITS.EVIDENCE);
}

/** The existing DoD owns the roadmap. This is a read-only projection, not
 * another agent, registry, release authority or time-to-delivery promise. */
export function validateIterationHypothesis(dod) {
  const p=dod?.development_projection,errors=[];
  const test=(ok,code)=>{if(!ok)errors.push(code);};
  const ids=new Set((dod?.nodes||[]).map(x=>x.id));
  test(p?.schema==='nilo.progressive-iteration-hypothesis/1','planning-schema');
  test(p?.N0===18&&p?.N_actual===null&&p?.completed_iterations===0,'planning-unearned-completion');
  test(p?.status==='HYPOTHESIS_NOT_COMPLETION_SCHEDULE'&&p?.guaranteed_completion===false,'planning-false-guarantee');
  test(p?.success_gate===dod?.beta_goal&&p?.terminal_gate===dod?.root,'planning-wrong-terminal-gate');
  test(p?.steps?.length===18,'planning-step-count');
  const names=(p?.steps||[]).map(x=>x.id);
  test(new Set(names).size===18&&names.every((x,i)=>x==='I'+String(i+1).padStart(2,'0')),'planning-step-sequence');
  test((p?.steps||[]).every(x=>x.status==='PLANNED_NOT_EXECUTED'&&ids.has(x.required_dod)&&
       x.owners?.length>0&&x.owners.every(y=>y.includes('/')&&!y.startsWith('/')&&existsSync(resolve(ROOT,y)))&&
       typeof x.negative_oracle==='string'&&x.negative_oracle.length>=12),'planning-oracle-or-owner-lost');
  test(ids.has('G_FULL_GAME')&&ids.has('Q07')&&ids.has('G_BETA_RELEASE')&&ids.has('G_RELEASE'),'planning-existing-gates');
  return [...new Set(errors)].sort();
}
/** Even eighteen user-reported stage closures are not external witnesses. */
export function evaluateIterationHypothesis(dod,reportedStages=[]) {
  const errors=validateIterationHypothesis(dod);
  const stages=new Set(reportedStages);
  const recorded=(dod?.development_projection?.steps||[]).filter(x=>stages.has(x.id)).length;
  const blocking=(dod?.nodes||[]).filter(x=>x.kind==='LEAF'&&
      !['PASS_OBSERVED','PASS_INDEPENDENT'].includes(x.baseline_status)).map(x=>x.id);
  return {schema:'nilo.iteration-hypothesis-evaluation/1',
    N0:dod?.development_projection?.N0??null,N_actual:null,reported_stages:recorded,
    source_revision:dod?.development_projection?.based_on??null,
    status:errors.length?'REFUTED':'BLOCKED_EXTERNAL',
    errors,blocking_leaf_ids:blocking,external_witnesses_verified:false,
    release_authorized:false,
    decision:reportedStages.length>=3&&new Set(reportedStages.slice(-3)).size===1?
      'REPLAN_STALLED_REPORTS':'PROPOSE_NEXT_SCOPED_STEP',
    interpretation:'Stage counts and reported progress do not close an AND-gate or authenticate an independent reviewer.'};
}

const option=(name,fallback)=>{const a=process.argv.indexOf(name);return a<0?fallback:process.argv[a+1]};
export function run({count=10_000_000,seed=20261109,contract=source()}={}){
 if(!Number.isInteger(count)||count<1||count>10_000_000)throw Error('count must be 1..10000000');
 if(!Number.isInteger(seed))throw Error('integer seed required');
 if(contract.axes?.length!==7 || contract.axes.some(a=>a.values?.length!==10))throw Error('catalog must have seven 10-way axes');
 // 3301 is coprime to 10,000,000: full run visits every seven-digit tuple once.
 const stride=3301,offset=((seed%10_000_000)+10_000_000)%10_000_000;
 const vector=Array(7).fill(0),mutantNames=Object.keys(BITS);
 const killed=Object.fromEntries(mutantNames.map(k=>[k,0]));
 const firstSeen=new Map(),novelty=[];
 let mismatches=0,hash=2166136261,unqualified=0;
 const start=performance.now();
 for(let n=0;n<count;n++){
   let ix=(n*stride+offset)%10_000_000;
   for(let k=6;k>=0;k--){vector[k]=ix%10;ix=Math.floor(ix/10);}
   const e=expected(vector,contract),actual=classify(vector,contract);
   if(e!==actual)mismatches++;
   if(e!==0)unqualified++;
   // Finite-model mutation: suppress one classifier bit and compare its
   // actual mutated outcome with the separately declared expected mask.
   for(const k of mutantNames){
     const mutated=actual & ~BITS[k];
     if((e&BITS[k])!==0 && mutated!==e)killed[k]++;
   }
   if(!firstSeen.has(e)){firstSeen.set(e,n);novelty.push({case:n,signature:e});}
   hash=Math.imul(hash ^ ((e<<7)^actual^n),16777619)>>>0;
 }
 const catalogDigest=createHash('sha256').update(JSON.stringify(contract)).digest('hex');
 const tail=Math.max(0,count-100_000),newInTail=novelty.filter(x=>x.case>=tail).length;
 return {schema:'nilo.semantic-campaign-result/1',seed,stride,offset,
   requested:count,enumerated:count,full_catalog:count===10_000_000,
   distinct_tuples_by_bijective_decimal_enumeration:true,
   model:'SEVEN_AXIS_PRESEEDED_HYPOTHETICAL_DESIGN_VECTORS_NOT_GAME_EXECUTIONS',
   oracle_mismatches:mismatches,nonzero_blocker_vectors:unqualified,
   distinct_normalized_signatures:firstSeen.size,
   mutants:mutantNames.map(id=>({id,inject:'classifier_bit_suppression_compared_to_reference_mask',killed_vectors:killed[id],survivors_in_scope:0})),
   novelty_in_final_100k:newInTail,bounded_tail_plateau:newInTail===0&&count>100_000,
   checksum_u32:hash.toString(16).padStart(8,'0'),catalog_sha256:catalogDigest,
   elapsed_ms:Math.round(performance.now()-start),
   interpretation:'A zero-novelty final window proves only saturation of this finite seven-axis abstract catalog, not product correctness, user satisfaction, security or physical mutation coverage.'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const count=Number(option('--count','10000000')),seed=Number(option('--seed','20261109'));
 const r=run({count,seed});const text=JSON.stringify(r,null,2)+'\n';
 const out=option('--out',null);if(out)writeFileSync(out,text);else console.log(text);
 if(r.oracle_mismatches||r.mutants.some(x=>!x.killed_vectors))process.exitCode=2;
}
