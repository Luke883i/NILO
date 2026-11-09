#!/usr/bin/env python3
"""PR10 first-boss Chrome HTTP witness. Only the positive path traverses LV01 and LV02.
No author/user acceptance, beta decision or trusted localStorage provenance."""
import argparse,hashlib,importlib.util,json,platform,subprocess,shutil,tempfile
from pathlib import Path
from importlib.metadata import version
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('nilo_canal_browser',ROOT/'tests/browser-lv-02.py')
canal=importlib.util.module_from_spec(spec);spec.loader.exec_module(canal)
old=canal.old
def s(page):return page.evaluate('window.__niloReadback()')
def enter(page):
    canal.jump_route(page,canal.L2[5:])
    canal.finish(page)
    assert s(page)['boss']['phase']=='TELEGRAPH'
def win(page,report):
    for repair in [1,2]:
        page.wait_for_function("""() => {
          const b=window.__niloReadback().boss;
          return b.phase==='TELEGRAPH' && b.clock>=50;
        }""",timeout=8000)
        page.keyboard.press('Space',delay=120)
        page.wait_for_function('() => window.__niloReadback().boss.phase==="RECOVERY"',timeout=4000)
        page.wait_for_function('() => window.__niloReadback().onGround',timeout=4000)
        assert s(page)['boss']['repairs']==repair-1
        page.keyboard.press('e',delay=70)
        page.wait_for_function('v => window.__niloReadback().boss.repairs===v',arg=repair,timeout=3000)
        report['repairs'].append({'count':repair,'phase':s(page)['boss']['phase']})
    assert s(page)['phase']=='COMPLETED' and s(page)['boss']['phase']=='VICTORY'
    assert 'SECONDA ORA RESTITUITA' in page.locator('#hud').inner_text()
    assert 'ORA II' in page.locator('#scene-chapter').inner_text()
def run(args):
    out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
    sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    r={'schema':'nilo.custode-chrome/1','source_sha':sha,'scope':'REAL_HTTP_TWO_LEVEL_AND_CUSTODE',
       'browser_executed':False,'beta_authorized':False,
       'independent_player_acceptance':False,'six_levels_complete':False,
       'checks':{},'screenshots':[],'repairs':[],'errors':[]}
    try:
        with old.serve(ROOT/'web') as url,sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,channel='chrome')
            ctx=browser.new_context(viewport={'width':1280,'height':900},device_scale_factor=1)
            page=ctx.new_page();page.on('pageerror',lambda e:r['errors'].append(str(e)))
            old.loaded(page,url)
            canal.jump_route(page,canal.L1);canal.finish(page)
            page.keyboard.press('n')
            page.wait_for_function('() => window.__niloReadback().level==="LV-02"')
            canal.jump_route(page,canal.L2[:5])
            page.keyboard.down('ArrowRight')
            try:page.wait_for_function('() => window.__niloReadback().checkpointActive',timeout=5000)
            finally:page.keyboard.up('ArrowRight')
            page.wait_for_function('() => localStorage.getItem("nilo.checkpoint.lv02.v1")!==null')
            page.reload(wait_until='load');page.wait_for_function('() => window.__niloReadback')
            assert s(page)['level']=='LV-02' and s(page)['boss']['phase']=='LOCKED'
            enter(page)
            r['browser_executed']=True;r['browser_version']=browser.version
            r['host']=platform.platform();r['playwright_version']=version('playwright')
            r['origin']=page.evaluate('location.origin')
            r['screenshots'].append(old.screenshot(page,out,'01-telegraph'))
            assert s(page)['boss']['repairs']==0 and s(page)['phase']=='PLAYING'
            r['checks']['gate_not_victory']='PASS_OBSERVED'
            win(page,r)
            r['screenshots'].append(old.screenshot(page,out,'02-victory'))
            r['checks']['victory_requires_two_real_e_presses']='PASS_OBSERVED'
            # Browser reload resumes from CP02, not from an invented victory receipt.
            page.reload(wait_until='load');page.wait_for_function('() => window.__niloReadback')
            assert s(page)['level']=='LV-02' and s(page)['boss']['phase']=='LOCKED'
            r['checks']['checkpoint_not_victory']='PASS_OBSERVED'
            enter(page)
            page.wait_for_function('() => window.__niloReadback().phase==="DEFEATED"',timeout=10000)
            assert s(page)['boss']['hits']==2 and s(page)['boss']['repairs']==0
            r['screenshots'].append(old.screenshot(page,out,'03-defeated'))
            page.keyboard.press('r')
            page.wait_for_function('() => window.__niloReadback().boss.phase==="LOCKED"',timeout=2500)
            assert s(page)['phase']=='PLAYING' and s(page)['level']=='LV-02'
            r['checks']['defeat_and_cp02_retry']='PASS_OBSERVED'
            # A real source mutation must be rejected by the browser E-key oracle.
            if args.physical_mutant:
                with tempfile.TemporaryDirectory(prefix='nilo-custode-mutant-') as tmp:
                    target=Path(tmp)/'web';shutil.copytree(ROOT/'web',target)
                    src=(target/'levels/custode.mjs').read_text('utf8')
                    needle='n.repairs+=1';assert src.count(needle)==1
                    (target/'levels/custode.mjs').write_text(src.replace(needle,'n.repairs+=0'),'utf8')
                    with old.serve(target) as mutated:
                        cx=browser.new_context();p=cx.new_page();old.loaded(p,mutated)
                        # Explicitly seeded CP02 is a negative-control setup, not a traversal witness.
                        p.evaluate('() => localStorage.setItem("nilo.checkpoint.lv02.v1",JSON.stringify({version:1,level:"LV-02",checkpointId:"CP-02"}))')
                        p.reload(wait_until='load');p.wait_for_function('() => window.__niloReadback')
                        enter(p)
                        p.wait_for_function('() => window.__niloReadback().boss.phase==="RECOVERY"',timeout=6000)
                        p.keyboard.press('e',delay=80)
                        p.wait_for_timeout(100)
                        assert s(p)['boss']['repairs']==0
                        r['checks']['no_repair_source_mutant']='KILLED_BY_BROWSER_ORACLE'
                        cx.close()
            assert not r['errors'],r['errors']
            r['status']='PASS_SCOPED_CUSTODE_BROWSER_NO_USER_APPROVAL'
            ctx.close();browser.close()
    except Exception as e:
        r['status']='FAIL';r['error']=str(e);raise
    finally:
        (out/'custode-receipt.json').write_text(json.dumps(r,indent=2,sort_keys=True)+'\n',encoding='utf8')
        print(json.dumps({'status':r.get('status'),'sha':sha,'checks':r['checks'],
                          'error':r.get('error')},indent=2))
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',default='artifacts/custode')
    parser.add_argument('--physical-mutant',action='store_true')
    run(parser.parse_args())
