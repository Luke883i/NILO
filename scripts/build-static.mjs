/** Reproducible static distribution for Render; the game has no server runtime.
 * Byte identity is enforced for all published game assets; no source/test files
 * or credentials are copied. Manifest never claims beta approval. */
import {readdirSync,readFileSync,mkdirSync,writeFileSync,rmSync,lstatSync} from 'node:fs';
import {resolve,relative,dirname,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const SOURCE=resolve(ROOT,'web'),OUTPUT=resolve(ROOT,'dist');
const hash=b=>createHash('sha256').update(b).digest('hex');
const shaPattern=/^[a-f0-9]{40}$/;
let git='';
try{git=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}
catch{ /* Render publishes RENDER_GIT_COMMIT when .git is not available */ }
const render=process.env.RENDER_GIT_COMMIT||'';
if(!shaPattern.test(git||render)||render&&(!shaPattern.test(render)||(git&&git!==render)))
 throw new Error('Cannot attest build to one exact source commit');
const sourceSha=git||render;
const extensions=new Set(['.html','.css','.mjs','.js','.json','.png','.svg','.webp','.ogg','.woff2']);
const files=[];
function collect(dir,prefix=''){
 for(const ent of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
  if(ent.name.startsWith('.')||ent.name.includes('\\'))throw new Error('Forbidden static source path');
  const name=prefix+ent.name,full=join(dir,ent.name);
  if(ent.isSymbolicLink())throw new Error('Refusing static symlink '+name);
  if(ent.isDirectory())collect(full,name+'/');
  else if(ent.isFile()&&extensions.has(extname(name)))files.push({path:name,body:readFileSync(full)});
  else throw new Error('Forbidden static source type '+name);
 }
}
collect(SOURCE);
files.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
if(!files.some(x=>x.path==='index.html')||!files.some(x=>x.path==='main.mjs')||
 !files.some(x=>x.path==='core.mjs')||!files.some(x=>x.path==='levels/custode.mjs'))
 throw new Error('Incomplete playable static tree');
rmSync(OUTPUT,{recursive:true,force:true});mkdirSync(OUTPUT,{recursive:true});
const items=[];
for(const file of files){
 const target=resolve(OUTPUT,file.path);
 if(!target.startsWith(OUTPUT+'/'))throw new Error('Escaping dist');
 mkdirSync(dirname(target),{recursive:true});
 writeFileSync(target,file.body,{flag:'wx'});
 items.push({path:file.path,bytes:file.body.length,sha256:hash(file.body)});
}
const treeDigest=hash(items.map(x=>x.path+'\0'+x.bytes+'\0'+x.sha256+'\n').join(''));
const manifest={schema:'nilo.static-deployment/1',source_commit_sha:sourceSha,
 source_dir:'web',publish_dir:'dist',tree_sha256:treeDigest,
 scope:'TWO_LEVEL_FIRST_BOSS_SOURCE_CANDIDATE',
 release_authorized:false,beta_authorized:false,external_render_observed:false,
 files:items};
writeFileSync(join(OUTPUT,'nilo-deploy.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS_SCOPED_BUILD',source_sha:sourceSha,
 files:items.length,tree_sha256:treeDigest,public_dir:'dist',
 render_observed:false,beta_authorized:false}));
