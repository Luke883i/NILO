// Source byte ledger, not cryptographic host attestation or a test execution.
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {verify} from "./verify.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
// Source inventory comes from the committed Git index, not a stale hardcoded list.
const listing=spawnSync("git",["ls-files","--cached","--full-name"],{cwd:root,encoding:"utf8"});
if(listing.status!==0) throw new Error("full Git source inventory required for evidence");
const list=listing.stdout.split("\n").filter(Boolean).filter(p=>existsSync(resolve(root,p)));
if(!list.length) throw new Error("empty Git inventory cannot prove source completeness");
const head=spawnSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"});
const sha=head.status===0?head.stdout.trim():null;
const files=list.map(path=>({path,sha256:createHash("sha256").update(readFileSync(resolve(root,path))).digest("hex")}));
const receipt={schema:"nilo.source-ledger/1",scope:"LOCAL_SOURCE_BYTES_AND_PROCESS_REPORTED_ENVIRONMENT_ONLY",
  source_commit_sha:sha,source_file_count:list.length,source_commit_status:sha?"GIT_READBACK_OBSERVED_LOCALLY":"GIT_NOT_AVAILABLE",
  toolchain:{node:process.version,platform:process.platform,arch:process.arch},
  files,contracts:verify(),unit_tests:"NOT_RUN_BY_THIS_COMMAND",
  browser:"NOT_RUN_BY_THIS_COMMAND",os_driver_gpu:"UNOBSERVED",hardware:"UNOBSERVED",
  bom:"DESIGN_INCOMPLETE",external_signatures:"NONE",authorization:"NONE",release_authorized:false};
const index=process.argv.indexOf("--out");
if(index!==-1){if(!process.argv[index+1])throw new Error("--out requires a path");
  writeFileSync(process.argv[index+1],JSON.stringify(receipt,null,2)+"\n");}
else console.log(JSON.stringify(receipt,null,2));
if(receipt.contracts.errors.length)process.exitCode=2;
