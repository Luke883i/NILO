// NILO contracts: source-bound negative predicates, no self-issued PASS or release authority.
import {readFileSync, existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {validateBridge} from "./verify-development.mjs";
import {validateIterationHypothesis} from "./semantic-campaign.mjs";
import {CFG} from "../web/core.mjs";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const raw=p=>JSON.parse(readFileSync(resolve(ROOT,p),"utf8"));
export const load=()=>({
  contract:raw("contracts/nilo-semantic-v1.json"),
  dod:raw("contracts/dod-v1.json"),
  chain:raw("provenance/semantic-chain.json"),
  refs:raw("standards/references.json"),
  bom:raw("bom/nilo.cdx.json"),
  pkg:raw("package.json"),
  bridge:raw("contracts/development-map.json")
});
const distinct=xs=>new Set(xs).size===xs.length;
export function audit({contract,dod,chain,refs,bom,pkg,bridge}) {
  const errors=[];
  const fail=(id,cond)=>{if(!cond)errors.push(id);};
  fail("contract-schema",contract?.schema==="nilo.semantic-contract/1");
  fail("contract-author-approval",contract?.authority==="DRAFT_CREATIVE_PROPOSAL_REQUIRES_AUTHOR_REVIEW"
    && contract.goal?.human_approved===false);
  fail("story-identity",Boolean(contract?.story?.theme&&contract?.story?.premise&&contract?.story?.ending));
  const feel=contract?.gameplay?.game_feel;
  fail("game-feel-source-drift",feel?.id==="I02"&&
    feel.coyote_ticks===CFG.coyoteTicks&&feel.buffer_ticks===CFG.bufferTicks&&
    feel.short_hop_velocity_multiplier===CFG.jumpReleaseMultiplier&&
    feel.external_player_acceptance==="BLOCKED_EXTERNAL");
  fail("game-feel-input-continuity",feel?.input_continuity?.event_model?.includes("fixed tick")&&
    feel.input_continuity.transient_short_press?.includes("preserved")&&
    feel.input_continuity.buffered_short_hop_max_apex_delta_px===10&&
    feel.input_continuity.user_experience_approval==="BLOCKED_EXTERNAL"&&
    feel.input_continuity.native_browser_witness==="tests/browser-e2e.py must run against exact PR SHA");
  const chars=contract?.characters||[],levels=contract?.levels||[];
  const charIds=chars.map(x=>x.id),levelIds=levels.map(x=>x.id);
  fail("characters",chars.length===6&&distinct(charIds)&&chars.every(x=>x.name&&x.role&&x.motivation&&x.silhouette));
  fail("levels",levels.length===6&&distinct(levelIds)&&levels.every((x,i)=>x.id==="LV-"+String(i+1).padStart(2,"0")&&x.title&&x.story&&x.mechanics?.length));
  const bosses=levels.filter(x=>x.boss).map(x=>x.boss);
  fail("boss-mapping",bosses.length===3&&distinct(bosses)&&bosses.every(x=>charIds.includes(x))&&
    levels[1]?.boss==="CH-CUSTODE"&&levels[3]?.boss==="CH-ARCHIVISTA"&&levels[5]?.boss==="CH-DIRETTORE");
  fail("slice-oracles",contract?.slice?.acceptance_oracles?.length>=6&&distinct(contract.slice.acceptance_oracles.map(x=>x.id))&&
    contract.slice.acceptance_oracles.some(x=>x.type==="REAL_SOURCE_MUTATION"));
  fail("effects",contract?.gameplay?.security?.includes("no telemetry")&&contract?.permissions?.not_allowed?.includes("release"));
  fail("dod-shape",dod?.schema==="nilo.reticular-dod/1"&&dod?.root==="G_CONTRACT_DEMONSTRATED"&&
    dod?.seed_goal==="G_SEED_SOURCE"&&dod?.beta_goal==="G_BETA_RELEASE"&&dod?.authority==="NONE"&&dod?.nodes?.length===41);
  const ids=(dod?.nodes||[]).map(n=>n.id),nodes=new Map((dod?.nodes||[]).map(n=>[n.id,n]));
  fail("dod-identities",distinct(ids));
  fail("dod-AND",Array.from(nodes.values()).filter(n=>n.kind==="AND").length===9&&
    nodes.get("G_CONTRACT_DEMONSTRATED")?.depends_on?.join(",")==="G_BETA_RELEASE,G_SUPPLY_CHAIN,G_RELEASE"&&
    nodes.get("G_BETA_RELEASE")?.depends_on?.join(",")==="G_FULL_GAME,Q01,Q02,Q03,Q04,Q05,Q06,Q07");
  const experience=nodes.get("Q07");
  fail("dod-experience-quality",experience?.kind==="LEAF"&&experience?.baseline_status==="BLOCKED_EXTERNAL"&&
    experience?.witness===null&&experience?.noncompensatory_subcriteria?.join(",")==="character-identity,platform-affordance,jump-and-retry-feel,visual-hud-readability,narrative-comprehension,audio-or-author-approved-muted-scope,observed-independent-player-acceptance");
  const visit=new Set(),stack=new Set(),reachable=new Set();
  const walk=id=>{if(stack.has(id)){errors.push("dod-cycle");return;}if(visit.has(id))return;
    const n=nodes.get(id);if(!n){errors.push("dod-dangling:"+id);return;}
    stack.add(id);reachable.add(id);
    for(const d of n.depends_on||[])walk(d);
    stack.delete(id);visit.add(id);
  };
  walk(dod?.root);fail("dod-unreachable",reachable.size===ids.length);
  fail("dod-no-false-pass",Array.from(nodes.values()).every(n=>n.baseline_status!=="PASS"&&n.authorization!=="APPROVED"));
  const layers=chain?.layers||[],lid=layers.map(x=>x.id);
  fail("semantic-chain",chain?.schema==="nilo.semantic-provenance-chain/1"&&layers.length===15&&distinct(lid));
  fail("semantic-edges",(chain?.links||[]).length>=16&&
    chain.links.every(x=>lid.includes(x.from)&&lid.includes(x.to)&&x.relation));
  fail("honest-sha",layers.every(x=>x.sha256===null));
  fail("physical-boundary",layers.find(x=>x.id==="L13")?.state==="UNOBSERVED"&&
    layers.find(x=>x.id==="L14")?.state==="REFERENCES_ONLY");
  fail("normative-register",refs?.schema==="nilo.normative-register/1"&&refs?.references?.length===7&&
    distinct(refs.references.map(x=>x.id))&&refs.references.every(x=>x.uri?.startsWith("https://")&&x.text_sha256===null&&x.conformance&&!/CERTIFIED|COMPLIANT/.test(x.conformance)));
  fail("law-honesty",refs?.references?.find(x=>x.id==="LAW-EAA")?.applicability==="REVIEW_REQUIRED");
  fail("bom-design-only",bom?.bomFormat==="CycloneDX"&&bom?.specVersion==="1.7"&&
    bom?.metadata?.lifecycles?.[0]?.phase==="design"&&bom.compositions?.[0]?.aggregate==="incomplete"&&
    bom.components?.length===0);
  fail("no-packages",pkg?.private===true&&pkg?.license==="UNLICENSED"&&
    !pkg.dependencies&&!pkg.devDependencies&&!pkg.optionalDependencies);
  // Inspect source boundaries: no false full-game claim and no remote dependencies.
  const html=readFileSync(resolve(ROOT,"web/index.html"),"utf8");
  const main=readFileSync(resolve(ROOT,"web/main.mjs"),"utf8");
  fail("no-network",html.includes("connect-src 'none'")&&!/https?:\/\/|fetch\s*\(/.test(main));
  for(const p of ["web/core.mjs","web/main.mjs","web/index.html","docs/PRODUCT_CONTRACT.md","docs/PROVENANCE.md"])
    fail("missing-source:"+p,existsSync(resolve(ROOT,p)));
  errors.push(...validateBridge({bridge,contract,dod},ROOT));
  errors.push(...validateIterationHypothesis(dod));
  return [...new Set(errors)].sort();
}
export function verify() {
  const errors=audit(load());
  return {schema:"nilo.seed-verification/1",source_status:errors.length?"FAIL":"PASS_SCOPED_SOURCE",
    game_status:"BLOCKED_EXTERNAL",full_contract:"NOT_DEMONSTRATED",
    author_approval:"NOT_OBSERVED",release_authorized:false,authority:"NONE",errors};
}
const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){const result=verify();console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=2;}
