import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
test('physical contrast regression in actual pixel-art source is killed by original art test',()=>{
 const dir=mkdtempSync(join(tmpdir(),'nilo-pixel-mutant-'));
 try{
  mkdirSync(join(dir,'web'));mkdirSync(join(dir,'tests'));
  for(const file of ['web/art.mjs','web/core.mjs','tests/art.test.mjs']){
   writeFileSync(join(dir,file),readFileSync(resolve(root,file)));
  }
  writeFileSync(join(dir,'package.json'),JSON.stringify({type:'module'}));
  const env={...process.env};delete env.NODE_TEST_CONTEXT;
  const run=()=>spawnSync(process.execPath,['--test','tests/art.test.mjs'],{cwd:dir,encoding:'utf8',timeout:12000,env});
  assert.equal(run().status,0,'clean source baseline must first pass');
  const file=join(dir,'web/art.mjs'),clean=readFileSync(file,'utf8');
  assert.equal(clean.split("ivory:'#f5eddb'").length,2,'physical source anchor changed');
  writeFileSync(file,clean.replace("ivory:'#f5eddb'","ivory:'#0a2135'"));
  const mutated=run();assert.notEqual(mutated.status,0,'surviving physical art mutant');
  writeFileSync(file,clean);assert.equal(run().status,0,'original source must pass after restoration');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
