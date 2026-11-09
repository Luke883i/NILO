import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const pkg=()=>JSON.parse(read('package.json'));
const currentSha=()=>spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
test('P0 RED: Codespaces forwards private HTTP port 8000 and game start is one command',()=>{
 const d=JSON.parse(read('.devcontainer/devcontainer.json'));
 assert.deepEqual(d.forwardPorts,[8000]);
 assert.equal(d.portsAttributes['8000'].visibility,'private');
 assert.equal(d.portsAttributes['8000'].onAutoForward,'openBrowser');
 assert.equal(d.portsAttributes['8000'].protocol,'http');
 assert.match(pkg().scripts.start,/scripts\/serve\.mjs/);
 assert.match(read('README.md'),/PORTS/);
});
test('P1 RED: Render Blueprint is a static site with gated main deploy',()=>{
 const y=read('render.yaml');
 for(const fragment of ['type: web','runtime: static','staticPublishPath: ./dist','autoDeployTrigger: checksPass','buildCommand: npm run build:static'])
  assert(y.includes(fragment),'missing render blueprint contract: '+fragment);
 assert(!/^\s*startCommand:/m.test(y),'no paid dynamic web service');
 assert.match(pkg().scripts['build:static'],/scripts\/build-static\.mjs/);
});
test('P1 RED: reproducible static package maps every published file to source sha',()=>{
 const build=spawnSync(process.execPath,['scripts/build-static.mjs'],{cwd:root,encoding:'utf8',timeout:15000});
 assert.equal(build.status,0,build.stderr||build.stdout);
 const dist=new URL('../dist/',import.meta.url);
 const manifest=JSON.parse(readFileSync(new URL('nilo-deploy.json',dist)));
 assert.equal(manifest.schema,'nilo.static-deployment/1');
 assert.equal(manifest.source_commit_sha,currentSha());
 assert.equal(manifest.release_authorized,false);
 assert.equal(manifest.beta_authorized,false);
 const actual=[];
 function walk(dir,prefix=''){
  for(const de of readdirSync(dir,{withFileTypes:true})){
   const rel=prefix+de.name,at=join(dir,de.name);
   if(de.isDirectory())walk(at,rel+'/');
   else if(de.isFile())actual.push(rel);
  }
 }
 walk(new URL('../web/',import.meta.url).pathname);
 assert.deepEqual(manifest.files.map(x=>x.path).sort(),actual.sort());
 for(const file of manifest.files){
   const actual=readFileSync(new URL(file.path,dist));
   assert.equal(sha(actual),file.sha256,'artifact drift '+file.path);
 }
 assert(!manifest.files.some(x=>x.path.startsWith('tests/')||x.path.startsWith('contracts/')));
});
test('P0 RED: actual zero-dependency HTTP server serves only game, with valid MIME and no traversal',async()=>{
 const child=spawn(process.execPath,['scripts/serve.mjs'],{
   cwd:root,env:{...process.env,PORT:'0',HOST:'127.0.0.1',NILO_SERVE_DIR:'web'},stdio:['ignore','pipe','pipe']});
 let output='',errors='',port=null;
 child.stderr.on('data',b=>errors+=String(b));
 const ready=new Promise((resolveReady,rejectReady)=>{
   const timeout=setTimeout(()=>rejectReady(new Error('server not ready '+output+' '+errors)),6000);
   child.stdout.on('data',b=>{
     output+=String(b);
     const match=output.match(/NILO_READY http:\/\/localhost:(\d+)\//);
     if(match){port=Number(match[1]);clearTimeout(timeout);resolveReady();}
   });
   child.on('exit',code=>{if(!port){clearTimeout(timeout);rejectReady(new Error('server exited '+code+' '+errors));}});
 });
 try{
  await ready;const base='http://127.0.0.1:'+port;
  const paths=[['/',200,'text/html'],['/main.mjs',200,'javascript'],['/core.mjs',200,'javascript'],['/levels/custode.mjs',200,'javascript'],['/style.css',200,'text/css'],['/missing.mjs',404,null],['/%2e%2e/package.json',404,null]];
  for(const [path,status,type] of paths){
   const r=await fetch(base+path);assert.equal(r.status,status,path);
   if(type)assert(r.headers.get('content-type').includes(type),path);
   if(status===200)assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  }
  const html=await (await fetch(base+'/')).text();
  assert.match(html,/Content-Security-Policy/);
  assert.match(html,/core\.mjs|main\.mjs/);
  assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
 }finally{child.kill('SIGTERM');}
});
