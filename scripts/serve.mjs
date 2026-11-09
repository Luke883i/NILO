/** NILO's single no-dependency development server.
 * Listens on 0.0.0.0 by default so Codespaces can forward 8000.
 * Serves only the game folder, never repository contracts or secrets.
 * This is NOT the Render runtime: Render publishes a static dist directory. */
import {createServer} from 'node:http';
import {createReadStream,lstatSync,realpathSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const REPO=fileURLToPath(new URL('../',import.meta.url));
const directory=process.env.NILO_SERVE_DIR||'web';
if(!['web','dist'].includes(directory))throw new Error('Invalid NILO_SERVE_DIR');
const ROOT=realpathSync(resolve(REPO,directory));
const host=process.env.HOST||'0.0.0.0';
if(!['0.0.0.0','127.0.0.1','::1'].includes(host))throw new Error('Invalid HOST');
const portRaw=process.env.PORT??'8000',port=Number(portRaw);
if(!Number.isInteger(port)||port<0||port>65535)throw new Error('Invalid PORT');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8','.svg':'image/svg+xml',
  '.png':'image/png','.webp':'image/webp','.ogg':'audio/ogg',
  '.woff2':'font/woff2'};
function respond(res,code,text,headers={}){
 res.writeHead(code,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
   'Referrer-Policy':'no-referrer',...headers});
 res.end(text);
}
const server=createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method))return respond(res,405,'Method Not Allowed',{'Allow':'GET, HEAD'});
 let raw=(req.url||'/').split(/[?#]/,1)[0],decoded;
 try{decoded=decodeURIComponent(raw);}catch{return respond(res,400,'Invalid URL');}
 if(!decoded.startsWith('/')||decoded.includes('\\')||decoded.includes('\0')||
    decoded.split('/').some(x=>x==='..'||(x.startsWith('.')&&x!=='')))
    return respond(res,404,'Not Found');
 const relative=decoded==='/'?'index.html':decoded.slice(1);
 const full=resolve(ROOT,relative);
 if(!full.startsWith(ROOT+sep))return respond(res,404,'Not Found');
 let info;
 try{
   info=lstatSync(full);
   if(!info.isFile()||info.isSymbolicLink()||realpathSync(full)!==full)throw Error('Not a regular file');
 }catch{return respond(res,404,'Not Found');}
 const contentType=mime[extname(full)];
 if(!contentType)return respond(res,404,'Not Found');
 res.writeHead(200,{'Content-Type':contentType,'Content-Length':info.size,
  'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer'});
 if(req.method==='HEAD')return res.end();
 const stream=createReadStream(full);
 stream.on('error',()=>res.destroy());
 stream.pipe(res);
});
server.on('error',err=>{console.error('NILO server failed:',err.message);process.exitCode=1;});
server.listen(port,host,()=>{
 const actual=server.address().port;
 console.log('NILO_READY http://localhost:'+actual+'/');
 console.log('Codespaces: open PORTS, select '+actual+', then Open in Browser. This localhost URL is inside the Codespace.');
});
