import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const cases=[
 ['moving-bridge-frozen','web/levels/lv-02.mjs','p.amplitude*Math.sin(ticks*p.angularTick)','0*Math.sin(ticks*p.angularTick)'],
 ['current-force-disabled','web/levels/lv-02.mjs','zone?zone.boost:0','0'],
 ['checkpoint-version-forged','web/levels/lv-02.mjs','v.version!==1','v.version!==2'],
 ['checkpoint-level-forged','web/levels/lv-02.mjs','v.level!=="LV-02"','v.level!=="LV-01"'],
 ['moving-bridge-carry-disabled','web/core.mjs','movingBridge(state.ticks+1).x-movingBridge(state.ticks).x','0']
];
test('five original-source LV02 mutants are killed by the independent real test',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'nilo-lv02-physical-'));
 try{
  for(const file of ['web/core.mjs','web/art.mjs','web/levels/lv-02.mjs','tests/lv-02.test.mjs']){
   const dst=join(tmp,file);mkdirSync(resolve(dst,'..'),{recursive:true});cpSync(join(root,file),dst);
  }
  writeFileSync(join(tmp,'package.json'),JSON.stringify({type:'module'}));
  const env={...process.env};delete env.NODE_TEST_CONTEXT;
  const run=()=>spawnSync(process.execPath,['--test','tests/lv-02.test.mjs'],{cwd:tmp,env,encoding:'utf8',timeout:15000});
  assert.equal(run().status,0,'clean baseline must pass');
  for(const [id,file,from,to] of cases){
   const target=join(tmp,file),source=readFileSync(target,'utf8');
   assert.equal(source.split(from).length,2,'unique mutation anchor '+id);
   writeFileSync(target,source.replace(from,to));
   assert.notEqual(run().status,0,'mutant survived '+id);
   writeFileSync(target,source);
  }
  assert.equal(run().status,0,'clean restored baseline must pass');
 }finally{rmSync(tmp,{recursive:true,force:true})}
});
