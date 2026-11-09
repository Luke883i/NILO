/** Read-only post-deploy observer. A GitHub CI pass is not a Render deploy. */
const origin=process.argv[2],sha=process.argv[3];
const p=/^https:\/\/[a-z0-9-]+\.onrender\.com\/?$/;
if(!origin||!p.test(origin)||!/^[0-9a-f]{40}$/.test(sha)){
 console.error('Usage: node scripts/wait-render.mjs https://service.onrender.com EXACT_GIT_SHA');
 process.exit(2);
}
const url=origin.replace(/\/$/,'')+'/nilo-deploy.json';
const attempts=40,delayMs=15000;
for(let n=1;n<=attempts;n++){
 let got='UNAVAILABLE';
 try{
   const response=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)});
   if(response.ok){
    const receipt=await response.json();
    got=receipt.source_commit_sha||'NO_SHA';
    if(receipt.schema==='nilo.static-deployment/1'&&got===sha&&
       receipt.release_authorized===false&&receipt.beta_authorized===false){
      console.log('PASS_RENDER_REMOTE_MANIFEST_SHA',sha,'attempt',n);
      process.exit(0);
    }
   }else got='HTTP_'+response.status;
 }catch(e){got=e.name||'FETCH_FAILED';}
 console.log('Render not yet at target commit; attempt',n+'/'+attempts,'observed',got);
 if(n<attempts)await new Promise(resolve=>setTimeout(resolve,delayMs));
}
console.error('BLOCKED_RENDER_REMOTE_SHA_NOT_OBSERVED',sha);
process.exit(2);
