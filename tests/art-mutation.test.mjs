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
  mkdirSync(join(dir,'web'));mkdirSync(join(dir,'tests'));mkdirSync(join(dir,'web','levels'));
  for(const file of ['web/art.mjs','web/core.mjs','web/levels/lv-02.mjs','web/levels/lv-03.mjs','web/levels/custode.mjs','tests/art.test.mjs']){
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

test('PR8 original renderer negative controls kill removed character labels, ledge signals, six-hour readback and story cues',()=>{
 const dir=mkdtempSync(join(tmpdir(),'nilo-art-semantic-mutants-'));
 try {
   mkdirSync(join(dir,'web'));mkdirSync(join(dir,'tests'));mkdirSync(join(dir,'web','levels'));
   for(const file of ['web/art.mjs','web/core.mjs','web/levels/lv-02.mjs','web/levels/lv-03.mjs','web/levels/custode.mjs','tests/art.test.mjs'])
     writeFileSync(join(dir,file),readFileSync(resolve(root,file)));
   writeFileSync(join(dir,'package.json'),JSON.stringify({type:'module'}));
   const env={...process.env};delete env.NODE_TEST_CONTEXT;
   const target=join(dir,'web/art.mjs'),source=readFileSync(target,'utf8');
   const run=()=>spawnSync(process.execPath,['--test','tests/art.test.mjs'],
      {cwd:dir,encoding:'utf8',timeout:12000,env});
   assert.equal(run().status,0,'original independent art oracle must pass first');
   const mutants=[
     ['missing-roles','else nameplates(c,state);','  void state;'],
     ['invisible-ledge','  ledgeCues(c,surfaces,state);','  void platforms;'],
     ['missing-hours','  timeLanterns(c,state);','  void state;'],
     ['wrong-story-ending',"id:'CUE-END'","id:'CUE-FAKE'"],
     ['premature-hour-award',"const x=699+j*38,active=(j===0&&(state.level==='LV-02'||state.phase==='COMPLETED'))||\n      (j===1&&state.level==='LV-02'&&state.boss?.phase==='VICTORY');",
       "const x=699+j*38,active=j===0&&state.checkpointActive;"],
     ['stale-repair-prompt',"title:'PERNO · SEGNATEMPO RIACCESO'","title:'PERNO · RIACCENDI ANCORA'"]
   ];
   for(const [id,from,to] of mutants){
     assert.equal(source.split(from).length,2,'physical source anchor must be unique: '+id);
     writeFileSync(target,source.replace(from,to));
     const result=run();
     assert.notEqual(result.status,0,'real art mutant survived: '+id);
     writeFileSync(target,source);
   }
   assert.equal(run().status,0,'renderer restored after all physical mutations');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
