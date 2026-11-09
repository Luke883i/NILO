#!/usr/bin/env python3
"""HTTP+Chrome static publish receipt. Local dist and explicit Render origin use
the same bytes, module loader and SHA oracle. No live claim without a remote URL."""
import argparse,hashlib,importlib.util,json,platform,subprocess
from contextlib import nullcontext
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('nilo_existing_browser',ROOT/'tests/browser-e2e.py')
old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
def eligible_url(url):
 p=urlparse(url)
 return (p.scheme=='https' and p.hostname and p.hostname.endswith('.onrender.com')
         and p.hostname!='onrender.com' and p.path in ('','/')
         and not p.username and not p.password and not p.query and not p.fragment and p.port is None)
def run(args):
 out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
 sha=args.expected_sha or subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
 remote=bool(args.origin)
 if remote and not eligible_url(args.origin):
  raise ValueError('Remote origin must be an exact HTTPS *.onrender.com base URL (no credentials/query/path)')
 root=ROOT/'dist'
 if not remote and not root.is_dir():raise FileNotFoundError('dist missing: npm run build:static')
 report={'schema':'nilo.delivery-http-chrome/1','source_sha':sha,
         'scope':'RENDER_REMOTE_ORIGIN_OBSERVED' if remote else 'LOCAL_STATIC_ARTIFACT_HTTP',
         'remote_render_observed':False,'browser_executed':False,
         'beta_authorized':False,'independent_player_acceptance':False,
         'checks':{},'screenshots':[],'errors':[]}
 try:
  context=nullcontext(args.origin.rstrip('/')+'/index.html') if remote else old.serve(root)
  with context as url,sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True,channel='chrome')
   ctx=browser.new_context(viewport={'width':1280,'height':900},device_scale_factor=1)
   page=ctx.new_page()
   page.on('pageerror',lambda e:report['errors'].append(str(e)))
   old.loaded(page,url)
   report['origin']=page.evaluate('location.origin')
   report['browser_version']=browser.version;report['host']=platform.platform()
   manifest_response=ctx.request.get(report['origin']+'/nilo-deploy.json',timeout=15000)
   assert manifest_response.status==200,'build manifest HTTP 200 required'
   manifest=manifest_response.json()
   assert manifest['schema']=='nilo.static-deployment/1'
   assert manifest['source_commit_sha']==sha,'Render deployed a different Git SHA'
   assert manifest['beta_authorized'] is False and manifest['release_authorized'] is False
   assert manifest['external_render_observed'] is False,'build cannot self-attest live Render'
   assert len(manifest['files'])>=7
   digest=hashlib.sha256()
   for entry in manifest['files']:
    name=entry['path']
    assert not name.startswith('/') and '..' not in name.split('/')
    response=ctx.request.get(report['origin']+'/'+name,timeout=15000)
    assert response.status==200,'missing deployed source file '+name
    data=response.body()
    assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'],name
    digest.update((name+'\0'+str(entry['bytes'])+'\0'+entry['sha256']+'\n').encode())
   assert digest.hexdigest()==manifest['tree_sha256'],'tree digest differs from published file list'
   report['checks']['published_files_exact_sha256']='PASS_HTTP_OBSERVED'
   invalid=ctx.request.get(report['origin']+'/not-a-nilo-script.mjs',timeout=15000)
   assert invalid.status==404,'unknown ESM must fail 404, not silently show game HTML'
   report['checks']['missing_module_404']='PASS_HTTP_OBSERVED'
   page.wait_for_function('() => typeof window.__niloReadback==="function"',timeout=10000)
   original=page.evaluate('window.__niloReadback().x')
   page.keyboard.down('ArrowRight')
   page.wait_for_function('v => window.__niloReadback().x>v+25',arg=original,timeout=3500)
   page.keyboard.up('ArrowRight')
   assert page.evaluate('window.__niloReadback().level')=='LV-01'
   report['screenshots'].append(old.screenshot(page,out,'01-static-game-start'))
   report['checks']['real_chrome_keyboard_canvas']='PASS_BROWSER_OBSERVED'
   assert not report['errors'],report['errors']
   report['browser_executed']=True
   report['remote_render_observed']=remote
   report['status']='PASS_REMOTE_RENDER_SHA_SCOPED' if remote else 'PASS_LOCAL_STATIC_RENDER_EQUIVALENT'
   ctx.close();browser.close()
 except Exception as e:
  report['status']='FAIL';report['error']=str(e);raise
 finally:
  (out/'delivery-receipt.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n',encoding='utf8')
  print(json.dumps({'status':report.get('status'),'sha':sha,
         'checks':report['checks'],'error':report.get('error')},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser()
 p.add_argument('--origin',default='')
 p.add_argument('--out',default='artifacts/delivery')
 p.add_argument('--expected-sha',default='')
 run(p.parse_args())
