import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const baselineFiles=['package.json','README.md','.devcontainer/devcontainer.json',
 'render.yaml','scripts/build-static.mjs','scripts/serve.mjs',
 'tests/delivery.test.mjs','web'];
const cases=[
 ['forwarded-port-misconfigured','.devcontainer/devcontainer.json','"forwardPorts": [\n    8000\n  ]','"forwardPorts": [\n    9000\n  ]'],
 ['port-public-instead-of-private','.devcontainer/devcontainer.json','"visibility": "private"','"visibility": "public"'],
 ['auto-forward-disabled','.devcontainer/devcontainer.json','"onAutoForward": "openBrowser"','"onAutoForward": "ignore"'],
 ['render-wrong-publish-directory','render.yaml','staticPublishPath: ./dist','staticPublishPath: ./web'],
 ['render-unguarded-deploy','render.yaml','autoDeployTrigger: checksPass','autoDeployTrigger: commit'],
 ['server-wrong-esm-mime','scripts/serve.mjs',"'.mjs':'text/javascript; charset=utf-8'","'.mjs':'text/plain; charset=utf-8'"],
 ['artifact-source-sha-laundered','scripts/build-static.mjs','const sourceSha=git||render;', "const sourceSha='b'.repeat(40);"],
 ['build-excludes-custode','scripts/build-static.mjs','  if(ent.isDirectory())collect(full,name+\'/\');',
  "  if(ent.name==='custode.mjs')continue;\n  if(ent.isDirectory())collect(full,name+'/');"]
];
test('eight original-file, temporary Codespaces/Render regressions are killed by behavior/contract tests',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'nilo-pr11-physical-'));
 try{
  for(const file of baselineFiles){
   const from=join(root,file),target=join(tmp,file);
   mkdirSync(dirname(target),{recursive:true});cpSync(from,target,{recursive:true});
  }
  const env={...process.env,RENDER_GIT_COMMIT:'a'.repeat(40)};
  delete env.NODE_TEST_CONTEXT;delete env.NILO_SERVE_DIR;delete env.PORT;delete env.HOST;
  const run=()=>spawnSync(process.execPath,['--test','tests/delivery.test.mjs'],{
    cwd:tmp,env,encoding:'utf8',timeout:25000,maxBuffer:2*1024*1024});
  const clean=run();
  assert.equal(clean.status,0,'fixture baseline failed: '+clean.stderr+' '+clean.stdout);
  for(const [id,file,from,to] of cases){
   const path=join(tmp,file),source=readFileSync(path,'utf8');
   assert.equal(source.split(from).length,2,'mutation anchor drift '+id);
   writeFileSync(path,source.replace(from,to));
   const fail=run();
   assert.notEqual(fail.status,0,'real source mutant survived: '+id);
   writeFileSync(path,source);
  }
  assert.equal(run().status,0,'clean source must remain green after all negative controls');
 }finally{rmSync(tmp,{recursive:true,force:true})}
});
