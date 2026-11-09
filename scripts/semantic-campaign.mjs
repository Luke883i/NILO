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


/** Seven independently specified browser/origin evidence-failure families.
 * Each axis has two valid and eight adversarial named design states.
 * These cases are NOT browser executions, screenshots, physical mutants,
 * reviews or release evidence. 10^7 unique tuples, fixed bijection/seed.
 */
export const BROWSER_BITS=Object.freeze({
  ORIGIN:1, INPUT:2, STORAGE:4, PIXELS:8, RECEIPT:16, NEGATIVE:32, AUTHORITY:64
});
const browserPreseed=[
  ["ORIGIN",["http","modules","csp","revision"],[
    ["dom_injection",{http:false}],["file_url",{http:false}],
    ["module_404",{modules:false}],["script_blocked",{csp:false}],
    ["stale_source",{revision:false}],["cached_source",{revision:false}],
    ["external_redirect",{http:false}],["no_csp_witness",{csp:false}]]],
  ["INPUT",["keyboard","focus","advanced","unaltered"],[
    ["touch_only",{keyboard:false}],["lost_focus",{focus:false}],
    ["no_player_progress",{advanced:false}],["forced_state",{unaltered:false}],
    ["scripted_teleport",{unaltered:false}],["key_not_bound",{keyboard:false}],
    ["blurred_tab",{focus:false}],["fake_dom_press",{unaltered:false}]]],
  ["STORAGE",["same_origin","written","reloaded","forgery_rejected"],[
    ["in_memory_mock",{same_origin:false}],["write_disabled",{written:false}],
    ["no_reload",{reloaded:false}],["version2_accepted",{forgery_rejected:false}],
    ["wrong_origin",{same_origin:false}],["stale_file",{written:false}],
    ["injected_checkpoint",{forgery_rejected:false}],["resume_without_reload",{reloaded:false}]]],
  ["PIXELS",["canvas","nonblank","png_digest","viewport"],[
    ["blank_canvas",{nonblank:false}],["missing_canvas",{canvas:false}],
    ["no_png",{png_digest:false}],["unreported_dpr",{viewport:false}],
    ["screenshot_from_mock",{png_digest:false}],["stale_image",{png_digest:false}],
    ["bad_viewport",{viewport:false}],["fallback_only",{canvas:false}]]],
  ["RECEIPT",["sha","browser","logs","images"],[
    ["head_mismatch",{sha:false}],["unknown_browser",{browser:false}],
    ["console_not_captured",{logs:false}],["unhashed_screenshot",{images:false}],
    ["host_not_recorded",{browser:false}],["unbound_revision",{sha:false}],
    ["missing_errors",{logs:false}],["image_not_in_receipt",{images:false}]]],
  ["NEGATIVE",["baseline","module_mutant","storage_mutant","reverted"],[
    ["no_baseline",{baseline:false}],["silent_module_failure",{module_mutant:false}],
    ["save_mutant_survives",{storage_mutant:false}],["unrestored_mutant",{reverted:false}],
    ["inconclusive_mutant",{storage_mutant:false}],["no_negative_control",{module_mutant:false}],
    ["mutant_before_baseline",{baseline:false}],["dirty_source_after_mutant",{reverted:false}]]],
  ["AUTHORITY",["lv01_scope","no_human_claim","no_beta_claim","not_model_as_runtime"],[
    ["all_levels_claim",{lv01_scope:false}],["fake_user_review",{no_human_claim:false}],
    ["beta_self_approved",{no_beta_claim:false}],["model_as_play",{not_model_as_runtime:false}],
    ["fake_six_bosses",{lv01_scope:false}],["self_signed_usability",{no_human_claim:false}],
    ["synthetic_release",{no_beta_claim:false}],["test_is_playthrough",{not_model_as_runtime:false}]]]
];
export const BROWSER_AXES=Object.freeze(browserPreseed.map(([name,fields,mutants])=>{
  const good=Object.fromEntries(fields.map(k=>[k,true]));
  const values=[{id:"valid_primary",...good,expected_blocker:0},
    {id:"valid_repeated",...good,expected_blocker:0},
    ...mutants.map(([id,change])=>({id,...good,...change,expected_blocker:BROWSER_BITS[name]}))];
  return Object.freeze({name,fields,values:Object.freeze(values)});
}));
export function expectedBrowser(vector,axes=BROWSER_AXES){
  let result=0;for(let i=0;i<7;i++)result |= axes[i].values[vector[i]].expected_blocker;
  return result;
}
export function classifyBrowser(vector,axes=BROWSER_AXES){
  let mask=0;
  for(let i=0;i<7;i++){
    const a=axes[i],v=a.values[vector[i]];
    if(!a.fields.every(f=>v[f]===true))mask|=BROWSER_BITS[a.name];
  }
  return mask;
}
export function runBrowserAdversarial({count=10_000_000,seed=20261109,axes=BROWSER_AXES}={}){
  if(!Number.isInteger(count)||count<1||count>10_000_000||!Number.isInteger(seed))throw Error("bounded integer count/seed");
  if(axes.length!==7||axes.some(a=>a.values.length!==10))throw Error("invalid browser scenario catalog");
  const stride=3301,offset=((seed%10_000_000)+10_000_000)%10_000_000,vector=Array(7).fill(0);
  let mismatches=0,checksum=2166136261,blocked=0;
  const signatures=new Map(),killed=Object.fromEntries(Object.keys(BROWSER_BITS).map(x=>[x,0]));
  for(let n=0;n<count;n++){
    let x=(n*stride+offset)%10_000_000;
    for(let k=6;k>=0;k--){vector[k]=x%10;x=Math.floor(x/10);}
    const want=expectedBrowser(vector,axes),got=classifyBrowser(vector,axes);
    if(want!==got)mismatches++;
    if(want)blocked++;
    if(!signatures.has(want))signatures.set(want,n);
    for(const [k,bit] of Object.entries(BROWSER_BITS)){
      if(want&bit && (got & ~bit)!==want)killed[k]++;
    }
    checksum=Math.imul(checksum^((want<<7)^got^n),16777619)>>>0;
  }
  return {schema:"nilo.browser-semantic-adversarial/1",seed,stride,offset,
    enumerated:count,full_catalog:count===10_000_000,
    distinct_tuples_by_decimal_bijection:true,
    model:"SEVEN_REALISTIC_BROWSER_FAILURE_FAMILIES_FINITE_DESIGN_VECTORS_NOT_BROWSER_RUNS",
    mismatches,blocked_vectors:blocked,distinct_failure_signatures:signatures.size,
    novelty_in_last_100k:[...signatures.values()].filter(n=>n>=Math.max(0,count-100000)).length,
    killed_single_bit_model_mutants:killed,checksum_u32:checksum.toString(16).padStart(8,"0"),
    catalog_sha256:createHash("sha256").update(JSON.stringify(axes)).digest("hex"),
    physical_mutations:0,independent_browser_runs:0,
    beta_authorized:false,
    interpretation:"Enumerated pre-seeded adversarial semantic hypotheses; cannot substitute for the independent Playwright physical browser check."};
}


/** PR6 six-axis, ten-state game-feel design catalog. Precisely 10^6 unique
 * pre-seeded vectors in the full run; NOT 1M game or hardware executions. */
export const FEEL_BITS=Object.freeze({EDGE:1,COYOTE:2,BUFFER:4,RELEASE:8,LIFECYCLE:16,EVIDENCE:32});
const feelRows=[
 ["EDGE",["press_edge","hold_no_repeat","focus","pause_safe"],[
 ["lost_first_press","press_edge"],["auto_jump","hold_no_repeat"],["focus_lost","focus"],
 ["pause_queues_input","pause_safe"],["restart_held_jump","hold_no_repeat"],
 ["duplicate_keydown","press_edge"],["blurred_game","focus"],["paused_press","pause_safe"]]],
 ["COYOTE",["near_ledge","window_bounded","surface_valid","expiry_rejected"],[
 ["missed_ledge","near_ledge"],["infinite_grace","window_bounded"],["airborne_grace","surface_valid"],
 ["late_edge_jump","expiry_rejected"],["ledge_delay","near_ledge"],["time_accumulation","window_bounded"],
 ["ghost_collision","surface_valid"],["late_input_accepted","expiry_rejected"]]],
 ["BUFFER",["prelanding","fresh_input","landing_real","consumed_once"],[
 ["early_jump_lost","prelanding"],["held_input_requeues","fresh_input"],["phantom_platform","landing_real"],
 ["double_jump_on_land","consumed_once"],["buffer_not_armed","prelanding"],["repeat_spam","fresh_input"],
 ["coyote_as_ground","landing_real"],["buffer_leaks","consumed_once"]]],
 ["RELEASE",["height_choice","cut_once","tap_viable","no_auto_bounce"],[
 ["fixed_height","height_choice"],["every_frame_cut","cut_once"],["tap_unreachable","tap_viable"],
 ["hold_auto_bounce","no_auto_bounce"],["release_no_effect","height_choice"],["cut_stacking","cut_once"],
 ["softlock_short_hop","tap_viable"],["held_jump_repeat","no_auto_bounce"]]],
 ["LIFECYCLE",["pause_freeze","death_reset","checkpoint_resume","bounded_timestep"],[
 ["paused_decay","pause_freeze"],["death_buffer_leak","death_reset"],["checkpoint_held_key","checkpoint_resume"],
 ["unbounded_step","bounded_timestep"],["pause_consumes_buffer","pause_freeze"],
 ["death_auto_jump","death_reset"],["restore_old_buffer","checkpoint_resume"],["delta_spike","bounded_timestep"]]],
 ["EVIDENCE",["source_sha","physical_mutant","real_browser","no_ux_certificate"],[
 ["stale_revision","source_sha"],["model_only_mutation","physical_mutant"],
 ["dom_injection_play","real_browser"],["fun_claim_from_unit","no_ux_certificate"],
 ["missing_provenance","source_sha"],["uncaught_survivor","physical_mutant"],
 ["mock_origin","real_browser"],["beta_claim_from_ci","no_ux_certificate"]]]
];
export const FEEL_AXES=Object.freeze(feelRows.map(([name,fields,mutants])=>{
 const pass=Object.fromEntries(fields.map(f=>[f,true]));
 return Object.freeze({name,fields,values:Object.freeze([
 {id:"valid_primary",...pass,expected_blocker:0},
 {id:"valid_replay",...pass,expected_blocker:0},
 ...mutants.map(([id,f])=>({id,...pass,[f]:false,expected_blocker:FEEL_BITS[name]}))
 ])});
}));
export function expectedFeel(vector,axes=FEEL_AXES){
 let mask=0;
 for(let i=0;i<6;i++)mask|=axes[i].values[vector[i]].expected_blocker;
 return mask;
}
export function classifyFeel(vector,axes=FEEL_AXES){
 let mask=0;
 for(let i=0;i<6;i++){
   const a=axes[i],v=a.values[vector[i]];
   if(!a.fields.every(f=>v[f]===true))mask|=FEEL_BITS[a.name];
 }
 return mask;
}
export function runFeelAdversarial({count=1_000_000,seed=20261109,axes=FEEL_AXES}={}){
 if(!Number.isInteger(count)||count<1||count>1_000_000||!Number.isInteger(seed))
   throw Error("bounded feel count/seed required");
 if(axes.length!==6||axes.some(a=>a.values.length!==10))throw Error("six 10-state axes required");
 const stride=3301,offset=((seed%1_000_000)+1_000_000)%1_000_000,v=Array(6).fill(0);
 const firstSeen=new Map(),killed=Object.fromEntries(Object.keys(FEEL_BITS).map(k=>[k,0]));
 let mismatch=0,blocked=0,hash=2166136261;
 for(let n=0;n<count;n++){
   let k=(n*stride+offset)%1_000_000;
   for(let i=5;i>=0;i--){v[i]=k%10;k=Math.floor(k/10);}
   const e=expectedFeel(v,axes),a=classifyFeel(v,axes);
   if(e!==a)mismatch++;
   if(e)blocked++;
   if(!firstSeen.has(e))firstSeen.set(e,n);
   for(const [key,bit] of Object.entries(FEEL_BITS))
     if((e&bit)!==0 && (a & ~bit)!==e)killed[key]++;
   hash=Math.imul(hash^((e<<6)^a^n),16777619)>>>0;
 }
 return {schema:"nilo.game-feel-semantic-adversarial/1",seed,stride,offset,
   enumerated:count,full_catalog:count===1_000_000,
   distinct_tuples_by_bijective_decimal_enumeration:true,
   conceptual_mutations:count,physical_source_mutations:0,browser_executions:0,
   model:"SIX_PRESEEDED_GAME_FEEL_SEMANTIC_AXES_NOT_PLAYER_SESSIONS",
   oracle_mismatches:mismatch,blocked_vectors:blocked,
   distinct_signatures:firstSeen.size,
   novelty_last_100k:[...firstSeen.values()].filter(x=>x>=Math.max(0,count-100000)).length,
   killed_model_mutants:killed,checksum_u32:hash.toString(16).padStart(8,"0"),
   catalog_sha256:createHash("sha256").update(JSON.stringify(axes)).digest("hex"),
   release_authorized:false,
   interpretation:"Finite adversarial design-vector coverage only. Separate original-code mutants, Chrome tests and independent player judgment remain mandatory."};
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
 const r=process.argv.includes('--feel-adversarial') ?
   runFeelAdversarial({count,seed}) : process.argv.includes('--browser-adversarial') ?
   runBrowserAdversarial({count,seed}) : run({count,seed});
 const text=JSON.stringify(r,null,2)+'\n';
 const out=option('--out',null);if(out)writeFileSync(out,text);else console.log(text);
 if(r.schema==='nilo.game-feel-semantic-adversarial/1' ?
    (r.oracle_mismatches||Object.values(r.killed_model_mutants).some(x=>!x)) :
    r.schema==='nilo.semantic-campaign-result/1' ?
    (r.oracle_mismatches||r.mutants.some(x=>!x.killed_vectors)) :
    (r.mismatches||Object.values(r.killed_single_bit_model_mutants).some(x=>!x)))process.exitCode=2;
}
