#!/usr/bin/env python3
"""S01 native HTTP/Chrome action witness, not an independent playtest or beta.

The only control path is Playwright keyboard events. __niloReadback is read-only
and is corroborated by HUD text and source-bounded screenshot hashes. Negative
witnesses physically modify copied source bytes and run in a fresh HTTP origin.
"""
import argparse
import importlib.util
import json
import os
import platform
import shutil
import subprocess
import tempfile
from importlib.metadata import version
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('nilo_original_browser_s01', ROOT/'tests/browser-e2e.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)


def readback(page):
    return original.state(page)


def new_game(browser, url):
    context = browser.new_context(viewport={'width':1280,'height':900},device_scale_factor=1)
    page = context.new_page()
    errors = []
    failed_requests = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('requestfailed', lambda r: failed_requests.append(r.url))
    original.loaded(page,url)
    return context,page,errors,failed_requests


def approach_patrol(page):
    # Real inputs on existing geometry: step over the first gap, stop before the
    # first patrol, and wait for a grounded firing position on platform two.
    page.keyboard.down('ArrowRight')
    try:
        page.wait_for_function('() => {const s=window.__niloReadback();return s.x>=220 && s.onGround && s.phase==="PLAYING"}',timeout=8000)
        page.keyboard.press('Space',delay=90)
        page.wait_for_function('() => window.__niloReadback().x>=365',timeout=6000)
    finally:
        page.keyboard.up('ArrowRight')
    page.wait_for_function('() => {const s=window.__niloReadback();return s.onGround && s.x>350 && s.x<418 && s.phase==="PLAYING"}',timeout=6000)
    s=readback(page)
    assert s['action']['health']==3 and s['action']['kills']==0, s
    assert s['action']['enemiesAlive']==2, s
    return s


def positive(browser,url,out,report):
    ctx,page,errors,requests=new_game(browser,url)
    try:
        start=readback(page)
        assert start['level']=='LV-01' and start['phase']=='PLAYING'
        assert start['action']=={'health':3,'kills':0,'shards':0,'shots':0,'enemiesAlive':2},start
        page.wait_for_function("() => document.querySelector('#hud')?.textContent?.includes('J ATTACCA')",timeout=4000)
        assert 'J ATTACCA' in page.locator('#hud').inner_text()
        report['checks']['no_ghost_shot_before_key']='PASS_HTTP_OBSERVED'
        page.keyboard.press('n')
        assert readback(page)['level']=='LV-01', 'KeyN bypassed first-hour gate'
        report['checks']['no_skip_on_key_n']='PASS_HTTP_OBSERVED'
        grounded=approach_patrol(page)
        assert grounded['action']['shards']==1,grounded
        page.wait_for_function("() => document.querySelector('#hud')?.textContent?.includes('FRAMMENTI 1/3')",timeout=4000)
        assert 'FRAMMENTI 1/3' in page.locator('#hud').inner_text()
        report['checks']['physical_pickup_and_hud']='PASS_HTTP_OBSERVED'
        report['screenshots'].append(original.screenshot(page,out,'01-physical-shard-and-sentry'))
        page.keyboard.press('j',delay=70)
        page.wait_for_function('() => window.__niloReadback().action.kills===1',timeout=3000)
        killed=readback(page)
        assert killed['action']['enemiesAlive']==1 and killed['action']['health']==3,killed
        assert killed['level']=='LV-01' and killed['phase']=='PLAYING',killed
        report['checks']['physical_j_kills_sentry_once']='PASS_HTTP_OBSERVED'
        report['screenshots'].append(original.screenshot(page,out,'02-after-physical-attack'))
        page.wait_for_timeout(350)
        assert readback(page)['action']['kills']==1,'duplicate kill without second victim'
        report['checks']['no_double_kill']='PASS_HTTP_OBSERVED'
        page.keyboard.press('p')
        paused=readback(page)
        assert paused['phase']=='PAUSED' and paused['action']['shots']==0,paused
        page.keyboard.press('j')
        page.wait_for_timeout(130)
        blocked=readback(page)
        assert blocked['phase']=='PAUSED' and blocked['action']['kills']==1 and blocked['action']['shots']==0,blocked
        page.keyboard.press('p')
        page.wait_for_timeout(130)
        assert readback(page)['action']['shots']==0,'paused attack leaked through resume'
        report['checks']['paused_j_disarmed_on_resume']='PASS_HTTP_OBSERVED'
        page.keyboard.press('r')
        reset=readback(page)
        assert reset['level']=='LV-01' and reset['action']=={'health':3,'kills':0,'shards':0,'shots':0,'enemiesAlive':2},reset
        report['checks']['restart_restores_combat_and_pickups']='PASS_HTTP_OBSERVED'
        page.reload(wait_until='load')
        page.wait_for_function('() => typeof window.__niloReadback==="function"')
        loaded=readback(page)
        assert loaded['action']['health']==3 and loaded['action']['kills']==0 and loaded['action']['shards']==0
        assert loaded['phase']=='PLAYING' and loaded['level']=='LV-01'
        report['checks']['reload_does_not_claim_previous_combat']='PASS_HTTP_OBSERVED'
        assert not errors,errors
        assert not requests,requests
        report['checks']['no_browser_page_errors_or_failed_requests']='PASS_HTTP_OBSERVED'
        report['browser_executed']=True
        report['origin']=page.evaluate('location.origin')
    finally:
        ctx.close()


def mutate_source(src, dst, before, after):
    shutil.copytree(src,dst)
    path=dst/'main.mjs'
    content=path.read_text(encoding='utf8')
    assert content.count(before)==1,'mutation anchor drifted: '+repr(before)
    path.write_text(content.replace(before,after),encoding='utf8')
    assert path.read_text(encoding='utf8')!=content


def negative_mutants(browser,report):
    with tempfile.TemporaryDirectory(prefix='nilo-s01-source-mutants-') as tmp:
        root=Path(tmp)
        src=ROOT/'web'
        ghost=root/'ghost'
        mutate_source(src,ghost,'attackPressed:pendingAttackPress,','attackPressed:true,')
        with original.serve(ghost) as url:
            ctx,page,errors,requests=new_game(browser,url)
            try:
                page.wait_for_function('() => window.__niloReadback().action.shots>0',timeout=2500)
                assert readback(page)['action']['shots']>0,'ghost-shot mutant did not alter native runtime'
                assert not errors,errors
                report['checks']['source_mutant_ghost_shot']='KILLED_BY_BROWSER_ORACLE'
            finally:ctx.close()
        no_edge=root/'no-edge'
        mutate_source(src,no_edge,'pendingAttackPress=true;','pendingAttackPress=false;')
        with original.serve(no_edge) as url:
            ctx,page,errors,requests=new_game(browser,url)
            try:
                before=approach_patrol(page)
                assert before['action']['shards']==1
                page.keyboard.press('j',delay=70)
                page.wait_for_timeout(600)
                after=readback(page)
                assert after['action']['kills']==0 and after['action']['enemiesAlive']==2,after
                assert not errors,errors
                report['checks']['source_mutant_lost_j_edge']='KILLED_BY_BROWSER_ORACLE'
            finally:ctx.close()


def run(args):
    output=Path(args.out).resolve()
    output.mkdir(parents=True,exist_ok=True)
    sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    assert len(sha)==40
    if args.expected_sha:
        assert sha==args.expected_sha,(sha,args.expected_sha)
    report={'schema':'nilo.action-native-http-s01/1','source_sha':sha,
        'scope':'LV01_NATIVE_HTTP_CHROME_ACTION_ONLY','browser_executed':False,
        'independent_player_acceptance':False,'beta_authorized':False,
        'real_render_host_observed':False,'rights_approved':False,
        'platform':platform.platform(),'playwright_version':version('playwright'),
        'checks':{},'screenshots':[],'errors':[]}
    try:
        with original.serve(ROOT/'web') as url,sync_playwright() as pw:
            options={'headless':True}
            if args.chromium_executable:
                options['executable_path']=args.chromium_executable
            else:
                options['channel']='chrome'
            browser=pw.chromium.launch(**options)
            report['browser_version']=browser.version
            positive(browser,url,output,report)
            if args.physical_mutants:
                negative_mutants(browser,report)
            browser.close()
            report['status']='PASS_SCOPED_S01_BROWSER'
    except Exception as exc:
        report['status']='FAIL'
        report['errors'].append(repr(exc))
        raise
    finally:
        (output/'action-receipt.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n',encoding='utf8')
        print(json.dumps({'sha':sha,'status':report.get('status'),'checks':report['checks'],'errors':report['errors']},indent=2))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',default='artifacts/browser-action')
    parser.add_argument('--expected-sha',default='')
    parser.add_argument('--physical-mutants',action='store_true')
    parser.add_argument('--chromium-executable',default='')
    run(parser.parse_args())
