#!/usr/bin/env python3
"""Real HTTP Chrome LV01->LV02 boss gate, without claiming victory or UX acceptance."""
import argparse,hashlib,importlib.util,json,platform,subprocess,shutil,tempfile
from pathlib import Path
from importlib.metadata import version
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('nilo_old_browser',ROOT/'tests/browser-e2e.py')
old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
STORE2='nilo.checkpoint.lv02.v1'
L1=[220,510,760,1050,1320,1620]
L2=[255,535,710,955,1285,1580,1900]
def state(p):return p.evaluate('window.__niloReadback()')
def jump_route(page,goals,bridge_screenshot=None):
    page.keyboard.down('ArrowRight')
    trace=[]
    try:
        for g in goals:
            page.wait_for_function('v => {const s=window.__niloReadback();return s.x>=v&&s.onGround&&s.phase==="PLAYING"}',
                arg=g,timeout=10000)
            s=state(page)
            trace.append({'goal':g,'x':round(s['x'],2),'support':s['supportId']})
            if g==710 and bridge_screenshot:bridge_screenshot()
            page.keyboard.press('Space',delay=55)
    finally:page.keyboard.up('ArrowRight')
    return trace
def finish(page):
    page.keyboard.down('ArrowRight')
    try:
        if state(page)['level']=='LV-01':
            page.wait_for_function('() => window.__niloReadback().phase==="COMPLETED"',timeout=10000)
        else:
            page.wait_for_function('() => window.__niloReadback().boss?.phase==="TELEGRAPH"',timeout=10000)
    finally:page.keyboard.up('ArrowRight')
def geometry(page):
    return page.evaluate("""async()=>{const a=await import('./levels/lv-02.mjs');
      return {bridge0:a.movingBridge(0).x,bridge45:a.movingBridge(45).x,
        east:a.currentForceAt(620),west:a.currentForceAt(1680)};}""")
def run(args):
    out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
    sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    report={'schema':'nilo.lv02-real-browser/1','source_sha':sha,
     'scope':'REAL_HTTP_ORIGIN_LV01_TO_LV02_BOSS_GATE_NOT_VICTORY',
     'browser_executed':False,'independent_player_acceptance':False,
     'beta_authorized':False,'six_levels_complete':False,'custode_implemented':True,'boss_victory_observed':False,
     'host':platform.platform(),'playwright_version':version('playwright'),
     'checks':{},'screenshots':[],'errors':[]}
    try:
        with old.serve(ROOT/'web') as url,sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,channel='chrome')
            ctx=browser.new_context(viewport={'width':1280,'height':900},device_scale_factor=1)
            page=ctx.new_page()
            page.on('pageerror',lambda e:report['errors'].append(str(e)))
            old.loaded(page,url)
            assert state(page)['level']=='LV-01'
            report['lv01_jumps']=jump_route(page,L1)
            finish(page)
            assert 'premi N per LV-02' in page.locator('#hud').inner_text()
            page.keyboard.press('n')
            page.wait_for_function('() => window.__niloReadback().level==="LV-02"',timeout=2500)
            assert not state(page)['checkpointActive']
            report['checks']['lv01_gated_transition']='PASS_OBSERVED'
            report['browser_executed']=True
            report['browser_version']=browser.version
            report['origin']=page.evaluate('location.origin')
            report['viewport']=page.evaluate('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})')
            report['screenshots'].append(old.screenshot(page,out,'01-entry'))
            report['pixel_grid']=old.pixel_grid(page)
            assert report['pixel_grid']['mismatches']==0
            geom=geometry(page)
            assert geom['bridge0']!=geom['bridge45'] and geom['east']==52 and geom['west']==-38
            report['geometry']=geom
            report['checks']['moving_bridge_signed_currents']='PASS_OBSERVED'
            report['lv02_jumps']=jump_route(page,L2[:5],
              bridge_screenshot=lambda:report['screenshots'].append(old.screenshot(page,out,'02-moving-bridge')))
            assert any(j['support']=='canal-bridge' for j in report['lv02_jumps'])
            page.keyboard.down('ArrowRight')
            try:page.wait_for_function('() => window.__niloReadback().checkpointActive',timeout=5000)
            finally:page.keyboard.up('ArrowRight')
            page.wait_for_function('() => localStorage.getItem("nilo.checkpoint.lv02.v1")!==null')
            saved=page.evaluate('key=>localStorage.getItem(key)',STORE2)
            assert json.loads(saved)=={'version':1,'level':'LV-02','checkpointId':'CP-02'}
            report['screenshots'].append(old.screenshot(page,out,'03-checkpoint'))
            report['checks']['lv02_real_checkpoint']='PASS_OBSERVED'
            page.reload(wait_until='load');page.wait_for_function('() => window.__niloReadback')
            assert state(page)['level']=='LV-02' and state(page)['checkpointActive']
            report['checks']['lv02_real_reload']='PASS_OBSERVED'
            page.evaluate('([key,value])=>localStorage.setItem(key,value)',[STORE2,json.dumps({'version':2,'level':'LV-02','checkpointId':'CP-02'})])
            page.reload(wait_until='load');page.wait_for_function('() => window.__niloReadback')
            assert state(page)['level']=='LV-01','forged CP02 must not unlock LV02'
            report['checks']['forged_cp02_rejected']='PASS_OBSERVED'
            page.evaluate('([key,value])=>localStorage.setItem(key,value)',[STORE2,saved])
            page.reload(wait_until='load');page.wait_for_function('() => window.__niloReadback')
            assert state(page)['level']=='LV-02'
            report['lv02_after_reload']=jump_route(page,L2[5:])
            finish(page)
            assert state(page)['level']=='LV-02' and state(page)['deaths']==0
            assert 'CUSTODE' in page.locator('#scene-title').inner_text()
            assert state(page)['boss']['repairs']==0 and state(page)['phase']=='PLAYING'
            report['screenshots'].append(old.screenshot(page,out,'04-completed'))
            report['checks']['lv02_playthrough']='PASS_OBSERVED'
            if args.physical_mutant:
                for name,frm,to,key in [
                 ('frozen-bridge','p.amplitude*Math.sin(ticks*p.angularTick)','0*Math.sin(ticks*p.angularTick)','bridge'),
                 ('disabled-current','zone?zone.boost:0','0','east')]:
                    with tempfile.TemporaryDirectory(prefix='nilo-lv02-mutant-') as tmp:
                        target=Path(tmp)/'web';shutil.copytree(ROOT/'web',target)
                        src=(target/'levels/lv-02.mjs').read_text('utf8')
                        assert src.count(frm)==1,'mutation source drift '+name
                        (target/'levels/lv-02.mjs').write_text(src.replace(frm,to),'utf8')
                        with old.serve(target) as altered:
                            other=browser.new_context();victim=other.new_page()
                            old.loaded(victim,altered);measure=geometry(victim)
                            if key=='bridge':assert measure['bridge0']==measure['bridge45']
                            else:assert measure['east']==0
                            report['checks']['mutant_'+name]='KILLED_BY_BROWSER_ORACLE'
                            other.close()
            assert not report['errors'],('uncaught JS errors',report['errors'])
            report['status']='PASS_SCOPED_TWO_LEVEL_GATE_NOT_BOSS_VICTORY'
            ctx.close();browser.close()
    except Exception as e:
        report['status']='FAIL';report['error']=str(e)
        raise
    finally:
        (out/'lv02-browser-receipt.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n',encoding='utf8')
        print(json.dumps({'status':report.get('status'),'source_sha':sha,
          'checks':report['checks'],'error':report.get('error')},indent=2))
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',default='artifacts/browser-lv02')
    parser.add_argument('--physical-mutant',action='store_true')
    run(parser.parse_args())
