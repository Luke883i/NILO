// Single source-owned semantic bridge: PRODUCT IDs -> SOFTWARE paths -> REPOSITORY tests.
// This catches absent/drifting links; it does not replace observed runtime witnesses.
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const uniq=xs=>new Set(xs).size===xs.length;
export function validateBridge({bridge,contract,dod},root=ROOT) {
  const errors=[],bad=(name,cond)=>{if(!cond)errors.push(name);};
  bad("bridge-schema",bridge?.schema==="nilo.product-software-repository/1"&&bridge?.version===1);
  bad("bridge-authority",bridge?.authority==="DECLARED_LINKAGE_NOT_EXECUTION_ATTESTATION"&&bridge?.beta_authorized===false);
  bad("bridge-owners",bridge?.product_contract==="contracts/nilo-semantic-v1.json"&&
    bridge?.dod_contract==="contracts/dod-v1.json"&&bridge?.provenance_contract==="provenance/semantic-chain.json"&&
    bridge?.repository_oracle==="scripts/verify.mjs");
  bad("bridge-mobile-truth",bridge?.mobile_touch==="NOT_IMPLEMENTED"&&bridge?.supported_surface==="DESKTOP_KEYBOARD_CANDIDATE");
  bad("bridge-beta",bridge?.beta_goal===dod?.beta_goal&&bridge?.release_scope==="FULL_SIX_LEVEL_THREE_BOSS_GAME_BETA"&&
    (dod?.nodes||[]).some(x=>x.id===bridge.beta_goal&&x.kind==="AND"));
  const levels=contract?.levels||[],oracles=[...(contract?.slice?.acceptance_oracles||[]),...levels.flatMap(x=>x.acceptance_oracles||[])];
  const l=bridge?.levels||[],r=bridge?.requirements||[];
  bad("bridge-levels",l.length===levels.length&&uniq(l.map(x=>x.id))&&levels.every(x=>l.some(y=>y.id===x.id)));
  bad("bridge-oracles",r.length===oracles.length&&uniq(r.map(x=>x.id))&&oracles.every(x=>r.some(y=>y.id===x.id)));
  bad("bridge-no-fake-levels",l.every(x=>{
    if(x.state==="DESIGN_ONLY") return x.source?.length===0&&x.tests?.length===0;
    if(x.state!=="IMPLEMENTED_CANDIDATE"||!x.source?.length||!x.tests?.length) return false;
    if(x.id==="LV-01")return x.source.includes("web/core.mjs")&&x.tests.includes("tests/core.test.mjs");
    // Every subsequent level has a dedicated source and test identity; a
    // reused generic physics test cannot make a new level "implemented".
    const slug=x.id.toLowerCase();
    return x.source.includes("web/levels/"+slug+".mjs")&&x.tests.includes("tests/"+slug+".test.mjs");
  }));
  bad("bridge-no-runtime-promotion",r.every(x=>["MODEL_TEST_ONLY","LOCAL_SOURCE_MUTANT","HUMAN_AND_BROWSER_REQUIRED"].includes(x.authority)
    &&levels.some(l=>l.id===x.level) &&
    (x.browser==="NOT_ATTESTED" ||
      (x.browser==="TEST_DECLARED_NOT_ATTESTED" &&
       ["OR-03","OR-05"].includes(x.id) &&
       x.tests.includes("tests/browser-e2e.py")))));
  const enumerate=(dir,pre="")=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
    const rel=pre+e.name,full=resolve(dir,e.name);
    return e.isDirectory()?enumerate(full,rel+"/"):e.isFile()?["web/"+rel]:[];
  });
  const live=new Set(enumerate(resolve(root,"web")));
  const sources=new Set(r.flatMap(x=>x.sources||[]));
  const allSources=new Set([...sources,...l.flatMap(x=>x.source||[])]);
  bad("bridge-source-coverage",[...live].every(x=>sources.has(x))&&[...allSources].every(x=>live.has(x)));
  bad("bridge-valid-sources",r.every(x=>x.sources?.length>0&&x.sources.every(p=>live.has(p))));
  const tests=[...new Set([...r.flatMap(x=>x.tests||[]),...l.flatMap(x=>x.tests||[]),...(bridge?.repo_tests||[])])];
  bad("bridge-test-paths",tests.every(x=>x.startsWith("tests/")&&existsSync(resolve(root,x))));
  bad("bridge-model-witness",r.filter(x=>x.authority!=="HUMAN_AND_BROWSER_REQUIRED").every(x=>x.tests?.length>0)&&
    r.find(x=>x.id==="OR-06")?.tests?.includes("tests/mutation.test.mjs")&&
    r.find(x=>x.id==="OR-05")?.tests?.includes("tests/browser-e2e.py") &&
    r.find(x=>x.id==="OR-03")?.tests?.includes("tests/browser-e2e.py") &&
    r.find(x=>x.id==="OR-04")?.tests?.includes("tests/browser-e2e.py") &&
    r.find(x=>x.id==="OR-05")?.authority==="HUMAN_AND_BROWSER_REQUIRED");
  bad("bridge-narrative",bridge?.narrative_state==="DRAFT_AUTHOR_UNAPPROVED"&&contract?.goal?.human_approved===false);
  const rootAllowed=new Set([".git",".github",".gitignore","README.md","package.json","bom","contracts","docs","provenance","scripts","standards","tests","web","node_modules","artifacts","coverage",".DS_Store"]);
  bad("bridge-root-minimal",readdirSync(root).every(x=>rootAllowed.has(x)));
  bad("bridge-core-oracle",existsSync(resolve(root,".github/workflows/seed.yml"))&&
    bridge?.repo_tests?.includes("tests/development.test.mjs"));
  return [...new Set(errors)].sort();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const obj=p=>JSON.parse(readFileSync(resolve(ROOT,p),"utf8"));
  const errors=validateBridge({bridge:obj("contracts/development-map.json"),contract:obj("contracts/nilo-semantic-v1.json"),dod:obj("contracts/dod-v1.json")});
  console.log(JSON.stringify({schema:"nilo.crossplane-source-check/1",source_status:errors.length?"FAIL":"PASS_SCOPED_SOURCE",runtime:"NOT_ATTESTED",beta:"BLOCKED_EXTERNAL",errors},null,2));
  if(errors.length)process.exitCode=2;
}
