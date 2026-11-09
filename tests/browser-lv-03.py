#!/usr/bin/env python3
"""PR12: original HTTP Chrome full route LV01->LV02->Custode->LV03.
Source-bound technical observation, not an independent player or beta review."""
import argparse,hashlib,importlib.util,json,platform,subprocess,os
from pathlib import Path
from contextlib import nullcontext
from importlib.metadata import version
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('nilo_boss_for_lv03',ROOT/'tests/browser-custode.py')
boss=importlib.util.module_from_spec(spec);spec.loader.exec_module(boss)
canal=boss.canal
old=canal.old
STORE='nilo.checkpoint.lv03.v1'
def state(page):return page.evaluate('window.__niloReadback()')
def goto_ground(page,target,timeout=8000):
 page.keyboard.down('ArrowRight')
 try:
  page.wait_for_function('x=>{const s=window.__niloReadback();return s.x>=x&&s.onGround&&s.phase==="PLAYING"}',
    arg=target,timeout=timeout)
 finally:page.keyboard.up('ArrowRight')
def jump_gap(page,target):
 goto_ground(page,target)
 page.keyboard.press('Space',delay=55)
def play(page,report,out):
 assert state(page)['level']=='LV-01'
 canal.jump_route(page,canal.L1);canal.finish(page)
 page.keyboard.press('n')
 page.wait_for_function('() => window.__niloReadback().level==="LV-02"',timeout=2500)
 canal.jump_route(page,canal.L2[:5])
 page.keyboard.down('ArrowRight')
 try:page.wait_for_function('() => window.__niloReadback().checkpointActive',timeout=5000)
 finally:page.keyboard.up('ArrowRight')
 page.wait_for_function('() => localStorage.getItem("nilo.checkpoint.lv02.v1")!==null')
 page.reload(wait_until='load');page.wait_for_function('() => window.__niloReadback')
 assert state(page)['level']=='LV-02'
 page.keyboard.press('n')
 assert state(page)['level']=='LV-02','N may not bypass the Custode'
 boss.enter(page)
 boss.win(page,{'repairs':[]})
 assert state(page)['phase']=='COMPLETED' and state(page)['boss']['phase']=='VICTORY'
 page.keyboard.press('n')
 page.wait_for_function('() => window.__niloReadback().level==="LV-03"',timeout=3000)
 page.wait_for_function('() => document.querySelector("#scene-chapter")?.textContent.includes("ORA III")',timeout=3000)
 assert state(page)['phase']=='PLAYING' and state(page)['lightMode']=='LIGHT'
 report['checks']['actual_boss_gate_to_lv03']='PASS_OBSERVED'
 report['screenshots'].append(old.screenshot(page,out,'01-archive-entry'))
 page.keyboard.press('n')
 assert state(page)['level']=='LV-03','N cannot skip the new level'
 jump_gap(page,260)
 goto_ground(page,552)
 assert state(page)['lightMode']=='LIGHT'
 page.keyboard.press('e',delay=65)
 page.wait_for_function('() => window.__niloReadback().lightMode==="SHADOW"')
 assert state(page)['switchesUsed']==1
 report['checks']['shadow_switch_player_caused']='PASS_OBSERVED'
 goto_ground(page,760)
 assert state(page)['doorsPassed']==1,'first physical gate not crossed'
 jump_gap(page,760)
 goto_ground(page,1065)
 page.keyboard.press('e',delay=70)
 page.wait_for_function('() => window.__niloReadback().archiveLog')
 assert state(page)['phase']=='PLAYING' and state(page)['doorsPassed']==1
 report['checks']['optional_ledger_no_third_hour']='PASS_OBSERVED'
 goto_ground(page,1190)
 page.wait_for_function('() => localStorage.getItem("nilo.checkpoint.lv03.v1")!==null',timeout=2500)
 receipt=json.loads(page.evaluate('localStorage.getItem("nilo.checkpoint.lv03.v1")'))
 assert receipt=={'version':1,'level':'LV-03','checkpointId':'CP-03'}
 report['screenshots'].append(old.screenshot(page,out,'02-archive-cp03'))
 report['checks']['real_cp03_saved']='PASS_OBSERVED'
 page.reload(wait_until='load');page.wait_for_function('() => window.__niloReadback')
 assert state(page)['level']=='LV-03' and state(page)['doorsPassed']==1
 assert state(page)['phase']=='PLAYING' and state(page)['lightMode']=='SHADOW'
 report['checks']['cp03_reload_not_victory']='PASS_OBSERVED'
 jump_gap(page,1300)
 goto_ground(page,1480)
 assert state(page)['lightMode']=='SHADOW'
 # The light gate is closed until physical E: hold right until truly stopped.
 page.keyboard.down('ArrowRight')
 try:
  page.wait_for_function('() => window.__niloReadback().x>=1520',timeout=4000)
  page.wait_for_timeout(280)
 finally:page.keyboard.up('ArrowRight')
 assert state(page)['x']<=1522.01,'closed light door must block physical travel'
 assert state(page)['doorsPassed']==1
 report['checks']['physical_light_gate_stops_player']='PASS_OBSERVED'
 report['screenshots'].append(old.screenshot(page,out,'03-closed-light-gate'))
 page.keyboard.press('e',delay=65)
 page.wait_for_function('() => window.__niloReadback().lightMode==="LIGHT"',timeout=2000)
 assert state(page)['switchesUsed']>=1
 goto_ground(page,1740)
 assert state(page)['doorsPassed']==2
 jump_gap(page,1740)
 page.keyboard.down('ArrowRight')
 try:
  page.wait_for_function('() => window.__niloReadback().phase==="COMPLETED"',timeout=8000)
 finally:page.keyboard.up('ArrowRight')
 assert state(page)['level']=='LV-03' and state(page)['doorsPassed']==2
 assert 'TERZA ORA RESTITUITA' in page.locator('#hud').inner_text()
 report['screenshots'].append(old.screenshot(page,out,'04-third-hour'))
 report['checks']['two_gates_grounded_exit_hour_three']='PASS_OBSERVED'
def run(args):
 out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
 sha=args.expected_sha or subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
 remote=os.environ.get('NILO_URL','')
 if remote and not (remote.startswith('https://') and remote.endswith('.onrender.com')):
  raise ValueError('Remote NILO_URL must be exact HTTPS Render origin')
 root=Path(os.environ.get('NILO_WEB_ROOT',str(ROOT/'web'))).resolve()
 context=nullcontext(remote.rstrip('/')+'/index.html') if remote else old.serve(root)
 report={'schema':'nilo.lv03-http-chrome/1','source_sha':sha,'scope':'REMOTE_RENDER' if remote else 'LOCAL_STATIC_OR_SOURCE',
   'remote_render_observed':bool(remote),'browser_executed':False,
   'independent_player_acceptance':False,'beta_authorized':False,'six_levels_complete':False,
   'screenshots':[],'checks':{},'errors':[]}
 try:
  with context as url,sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True,channel='chrome')
   ctx=browser.new_context(viewport={'width':1280,'height':900},device_scale_factor=1)
   page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
   old.loaded(page,url)
   report['origin']=page.evaluate('location.origin');report['browser_version']=browser.version
   report['host']=platform.platform();report['playwright_version']=version('playwright')
   play(page,report,out)
   assert not report['errors'],report['errors']
   report['browser_executed']=True;report['status']='PASS_SCOPED_LV03_REMOTE' if remote else 'PASS_SCOPED_LV03_HTTP'
   ctx.close();browser.close()
 except Exception as e:
  report['status']='FAIL';report['error']=str(e);raise
 finally:
  (out/'lv03-receipt.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n',encoding='utf8')
  print(json.dumps({'status':report.get('status'),'sha':sha,'checks':report['checks'],'error':report.get('error')},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--out',default='artifacts/browser-lv03')
 p.add_argument('--expected-sha',default='')
 run(p.parse_args())
