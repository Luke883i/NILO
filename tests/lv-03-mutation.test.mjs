import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=['web/core.mjs','web/levels/lv-02.mjs','web/levels/custode.mjs',
 'web/levels/lv-03.mjs','tests/lv-03.test.mjs'];
const mutants=[
 ['all-gates-fake-open','web/levels/lv-03.mjs','door.mode===mode','true'],
 ['opposite-door-inverted','web/levels/lv-03.mjs',"id:'shadow-door',x:660,w:36,mode:'SHADOW'","id:'shadow-door',x:660,w:36,mode:'LIGHT'"],
 ['interaction-disabled','web/levels/lv-03.mjs','if(!interactPressed||!grounded)return state;','if(true)return state;'],
 ['proximity-auto-toggle','web/levels/lv-03.mjs','if(!interactPressed||!grounded)return state;','if(!grounded)return state;'],
 ['checkpoint-version-forged','web/levels/lv-03.mjs','v.version!==1','v.version!==2'],
 ['third-hour-by-position','web/core.mjs',"doorsPassed===2?'COMPLETED'","doorsPassed>=0?'COMPLETED'"],
 ['solid-gate-disabled','web/core.mjs','if(archiveDoorOpen(door,archive.lightMode))continue;','if(true)continue;'],
 ['optional-ledger-disabled','web/levels/lv-03.mjs','archiveLog:true','archiveLog:false'],
 ['boss-victory-bypass','web/core.mjs',"state.boss?.phase==='VICTORY'","state.boss?.phase!=='VICTORY'"]
];
test('PR12 nine physical source mutants must be detected by independent LV03 unit assertions',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'nilo-lv03-mutants-'));
 try{
  for(const file of files){const target=join(tmp,file);
    mkdirSync(dirname(target),{recursive:true});cpSync(join(root,file),target);}
  writeFileSync(join(tmp,'package.json'),JSON.stringify({type:'module'}));
  const env={...process.env};delete env.NODE_TEST_CONTEXT;
  const run=()=>spawnSync(process.execPath,['--test','tests/lv-03.test.mjs'],{
    cwd:tmp,env,encoding:'utf8',timeout:16000,maxBuffer:1024*1024});
  const start=run();assert.equal(start.status,0,'original baseline must PASS '+start.stderr+' '+start.stdout);
  for(const [id,file,from,to] of mutants){
    const target=join(tmp,file),source=readFileSync(target,'utf8');
    assert.equal(source.split(from).length,2,'mutation anchor drift '+id);
    writeFileSync(target,source.replace(from,to));
    const altered=run();assert.notEqual(altered.status,0,'source mutant survived '+id);
    writeFileSync(target,source);
  }
  assert.equal(run().status,0,'restored baseline must PASS');
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
