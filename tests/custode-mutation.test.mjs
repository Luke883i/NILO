import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const mutants=[
 ['premature-strike','web/levels/custode.mjs','n.clock>=CUSTODE.telegraphTicks','n.clock>=1'],
 ['no-strike-damage','web/levels/custode.mjs','n.hits+=1','n.hits+=0'],
 ['immortal-custode','web/levels/custode.mjs','n.hits>=CUSTODE.maxHits','n.hits>=99'],
 ['no-player-repair','web/levels/custode.mjs','n.repairs+=1','n.repairs+=0'],
 ['premature-victory','web/levels/custode.mjs','n.repairs>=CUSTODE.requiredRepairs','n.repairs>=1'],
 ['recovery-missing','web/levels/custode.mjs',"if(b.phase==='RECOVERY'){","if(b.phase==='TELEGRAPH'){"],
 ['gate-bypass','web/core.mjs',"x>=CUSTODE.gateX&&grounded","x>=0&&grounded"],
 ['repair-input-lost','web/core.mjs','repairPressed:Boolean(input.repairPressed)','repairPressed:false']
];
test('eight physical original-source Custode mutations are killed by independent tests',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'nilo-custode-mutants-'));
 try{
  for(const file of ['web/core.mjs','web/levels/lv-02.mjs','web/levels/lv-03.mjs','web/levels/custode.mjs','tests/custode.test.mjs']){
   const dst=join(tmp,file);mkdirSync(resolve(dst,'..'),{recursive:true});cpSync(join(root,file),dst);
  }
  writeFileSync(join(tmp,'package.json'),JSON.stringify({type:'module'}));
  const env={...process.env};delete env.NODE_TEST_CONTEXT;
  const run=()=>spawnSync(process.execPath,['--test','tests/custode.test.mjs'],{cwd:tmp,env,encoding:'utf8',timeout:15000});
  const start=run();assert.equal(start.status,0,'original tests must pass: '+start.stderr+' '+start.stdout);
  for(const [id,file,from,to] of mutants){
   const target=join(tmp,file),source=readFileSync(target,'utf8');
   assert.equal(source.split(from).length,2,'missing unique source anchor '+id);
   writeFileSync(target,source.replace(from,to));
   const v=run();assert.notEqual(v.status,0,'source mutant survived '+id);
   writeFileSync(target,source);
  }
  assert.equal(run().status,0,'restored baseline must still pass');
 }finally{rmSync(tmp,{recursive:true,force:true})}
});
