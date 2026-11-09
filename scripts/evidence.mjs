// Source byte ledger, not cryptographic host attestation or a test execution.
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {verify} from "./verify.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const list=["README.md","package.json","contracts/nilo-semantic-v1.json","contracts/dod-v1.json",
  "provenance/semantic-chain.json","standards/references.json","bom/nilo.cdx.json",
  "docs/PRODUCT_CONTRACT.md","docs/PROVENANCE.md","web/index.html",
  "web/main.mjs","web/core.mjs","web/style.css","scripts/verify.mjs",
  "scripts/evidence.mjs","tests/core.test.mjs","tests/contracts.test.mjs",
  "tests/mutation.test.mjs",".github/workflows/seed.yml"];
const head=spawnSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"});
const sha=head.status===0?head.stdout.trim():null;
const files=list.map(path=>({path,sha256:createHash("sha256").update(readFileSync(resolve(root,path))).digest("hex")}));
const receipt={schema:"nilo.source-ledger/1",scope:"LOCAL_SOURCE_BYTES_AND_PROCESS_REPORTED_ENVIRONMENT_ONLY",
  source_commit_sha:sha,source_commit_status:sha?"GIT_READBACK_OBSERVED_LOCALLY":"GIT_NOT_AVAILABLE",
  toolchain:{node:process.version,platform:process.platform,arch:process.arch},
  files,contracts:verify(),unit_tests:"NOT_RUN_BY_THIS_COMMAND",
  browser:"NOT_RUN_BY_THIS_COMMAND",os_driver_gpu:"UNOBSERVED",hardware:"UNOBSERVED",
  bom:"DESIGN_INCOMPLETE",external_signatures:"NONE",authorization:"NONE",release_authorized:false};
const index=process.argv.indexOf("--out");
if(index!==-1){if(!process.argv[index+1])throw new Error("--out requires a path");
  writeFileSync(process.argv[index+1],JSON.stringify(receipt,null,2)+"\n");}
else console.log(JSON.stringify(receipt,null,2));
if(receipt.contracts.errors.length)process.exitCode=2;
