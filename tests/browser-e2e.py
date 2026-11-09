#!/usr/bin/env python3
"""NILO LV-01 actual HTTP, browser and storage oracle; not user/beta approval."""
import argparse
import hashlib
import json
import platform
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from importlib.metadata import version
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
STORE = "nilo.checkpoint.v1"
FIRST = (220, 510, 760, 1050)
LAST = (1320, 1620)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass
    def send_response(self, code, message=None):
        # Server-side status is independent of Playwright response events.
        observed=getattr(self.server,"observed_responses",None)
        if observed is not None:
            observed.append({"path":self.path,"status":int(code)})
        return super().send_response(code,message)

@contextmanager
def serve(root, observed_responses=None):
    server=ThreadingHTTPServer(("127.0.0.1",0),partial(QuietHandler,directory=str(root)))
    server.observed_responses=observed_responses
    worker=threading.Thread(target=server.serve_forever,daemon=True)
    worker.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}/index.html"
    finally:
        server.shutdown()
        server.server_close()
        worker.join(timeout=4)

def state(page):
    return page.evaluate("window.__niloReadback()")

def loaded(page,url):
    response=page.goto(url,wait_until="load",timeout=20000)
    assert response and response.status==200, "HTTP 200 required"
    page.wait_for_function("() => typeof window.__niloReadback==='function'",timeout=10000)
    assert page.evaluate("location.protocol")=="http:", "must not use DOM injection/file URL"

def route(page,goals):
    page.keyboard.down("ArrowRight")
    jumps=[]
    try:
        for goal in goals:
            page.wait_for_function("goal => {const s=window.__niloReadback();return s.x>=goal && s.onGround && s.phase==='PLAYING'}",
                                   arg=goal,timeout=7000)
            jumps.append(round(state(page)["x"],2))
            page.keyboard.press("Space",delay=45)
    finally:
        page.keyboard.up("ArrowRight")
    return jumps

def checkpoint(page):
    jumps=route(page,FIRST)
    page.keyboard.down("ArrowRight")
    try:
        page.wait_for_function("() => window.__niloReadback().checkpointActive",timeout=4000)
    finally:
        page.keyboard.up("ArrowRight")
    assert state(page)["checkpointActive"], "not reached checkpoint"
    page.wait_for_function("() => localStorage.getItem('nilo.checkpoint.v1')!==null",timeout=2500)
    saved=page.evaluate("localStorage.getItem('nilo.checkpoint.v1')")
    assert json.loads(saved)=={"version":1,"level":"LV-01","checkpointId":"CP-01"}
    return jumps,saved

def screenshot(page,out,name):
    target=out/(name+".png")
    page.screenshot(path=str(target),full_page=True,animations="disabled")
    blob=target.read_bytes()
    return {"name":target.name,"sha256":hashlib.sha256(blob).hexdigest(),"bytes":len(blob)}

def quick_pulse(browser,url,tries=25):
    """Prove keydown and keyup arrived in one fixed-tick interval, on a true HTTP origin."""
    ctx=browser.new_context(viewport={"width":1280,"height":900})
    page=ctx.new_page()
    try:
        for attempt in range(tries):
            loaded(page,url)
            before=state(page)["ticks"]
            page.keyboard.down("Space")
            page.keyboard.up("Space")
            after=state(page)["ticks"]
            if before!=after:
                continue  # events straddled frames; not a valid sub-tick witness
            page.wait_for_function("tick => window.__niloReadback().ticks>tick",
                                   arg=after,timeout=2000)
            actual=state(page)
            return {"attempt":attempt+1,"ticks_before":before,"ticks_after":after,
                    "registered_jump":actual["vy"]<0,"state":actual}
        raise AssertionError("No same-tick native keydown/keyup witness in "+str(tries)+" attempts")
    finally:
        ctx.close()

def verify_input_lifecycle(browser,url,report,physical_mutant):
    ctx=browser.new_context(viewport={"width":1280,"height":900})
    page=ctx.new_page()
    try:
        loaded(page,url)
        # Physically hold the key through a real fall; no direct state injection.
        page.keyboard.down("Space")
        page.keyboard.down("ArrowRight")
        page.wait_for_function("() => window.__niloReadback().deaths>=1",timeout=15000)
        page.keyboard.up("ArrowRight")
        page.wait_for_timeout(130)
        after_death=state(page)
        assert after_death["onGround"] and after_death["vy"]==0, (
            "held Space must not auto-jump after respawn: "+repr(after_death))
        page.keyboard.up("Space")
        page.keyboard.press("r")
        report["checks"]["held_respawn_not_retriggered"]="PASS_OBSERVED"

        # Restart while physically holding Space cannot manufacture a fresh edge.
        page.keyboard.down("Space")
        page.keyboard.press("r")
        page.wait_for_timeout(150)
        restarted=state(page)
        assert restarted["onGround"] and restarted["vy"]==0 and restarted["jumpHeld"], (
            "held restart generated spurious jump: "+repr(restarted))
        page.keyboard.up("Space")
        report["checks"]["held_restart_not_retriggered"]="PASS_OBSERVED"

        # A press made while paused is disarmed when resumed, until key release.
        page.keyboard.press("r")
        page.keyboard.press("p")
        assert state(page)["phase"]=="PAUSED"
        page.keyboard.down("Space")
        page.keyboard.press("p")
        page.wait_for_timeout(150)
        resumed=state(page)
        assert resumed["phase"]=="PLAYING" and resumed["onGround"] and resumed["vy"]==0, (
            "held paused input triggered a jump on resume: "+repr(resumed))
        page.keyboard.up("Space")
        page.keyboard.press("Space",delay=45)
        page.wait_for_function("() => window.__niloReadback().vy<0",timeout=2000)
        report["checks"]["paused_key_requires_new_edge"]="PASS_OBSERVED"
    finally:
        ctx.close()

    witness=quick_pulse(browser,url)
    report["subtick_witness"]={"attempt":witness["attempt"],
                               "ticks_before":witness["ticks_before"],
                               "ticks_after":witness["ticks_after"]}
    assert witness["registered_jump"],"sub-tick physical press and release was silently lost"
    report["checks"]["subtick_keydown_keyup"]="PASS_OBSERVED"

    if physical_mutant:
        with tempfile.TemporaryDirectory(prefix="nilo-input-mutant-") as temp:
            target=Path(temp)/"web"
            shutil.copytree(ROOT/"web",target)
            original=(target/"main.mjs").read_text(encoding="utf-8")
            needle="pendingJumpPress=true;"
            assert original.count(needle)==1,"actual keyboard-queue mutation anchor drifted"
            (target/"main.mjs").write_text(
                original.replace(needle,"pendingJumpPress=false;"),encoding="utf-8")
            with serve(target) as mutant_url:
                victim=quick_pulse(browser,mutant_url)
                assert not victim["registered_jump"],(
                    "real browser source mutant survived: event queue removal")
                report["checks"]["physical_subtick_queue_mutant"]="KILLED_BY_BROWSER_ORACLE"

def pixel_grid(page):
    """Actual 960x540 browser canvas must be a 2x enlargement of 480x270.
    Seeded sample is structural, not an aesthetic or accessibility oracle."""
    return page.evaluate("""() => {
      const c=document.querySelector('#game'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let seed=20261109,mismatches=0,first=null;
      const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      const rgba=(x,y)=>{const i=(y*c.width+x)*4;return [a[i],a[i+1],a[i+2],a[i+3]].join(',');};
      for(let n=0;n<1200;n++){
        const x=Math.floor(rand()*479)*2,y=Math.floor(rand()*269)*2;
        const a0=rgba(x,y),b=rgba(x+1,y),d=rgba(x,y+1),e=rgba(x+1,y+1);
        if(a0!==b||a0!==d||a0!==e){mismatches++;if(!first)first={x,y,values:[a0,b,d,e]};}
      }
      return {samples:1200,mismatches,first,logical_source:[480,270],display:[c.width,c.height]};
    }""")

def scene_text(page):
    return {"title":page.locator("#scene-title").inner_text(),
            "hint":page.locator("#scene-hint").inner_text()}

def run(args):
    out=Path(args.out).resolve()
    out.mkdir(parents=True,exist_ok=True)
    head=subprocess.run(["git","rev-parse","HEAD"],cwd=ROOT,text=True,capture_output=True,check=True).stdout.strip()
    assert len(head)==40
    report={"schema":"nilo.lv01-real-browser/1","source_sha":head,
      "scope":"REAL_HTTP_ORIGIN_CHROMIUM_LV01_ONLY","browser_executed":False,
      "independent_player_acceptance":False,"six_levels_complete":False,
      "release_authorized":False,"host_platform":platform.platform(),
      "playwright_version":version("playwright"),
      "checks":{},"screenshots":[],"page_errors":[],"failed_requests":[],"requests":[]}
    try:
        with serve(ROOT/"web") as url,sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True,channel="chrome")
            report["browser_version"]=browser.version
            context=browser.new_context(viewport={"width":1280,"height":900},device_scale_factor=1)
            page=context.new_page()
            page.on("pageerror",lambda error:report["page_errors"].append(str(error)))
            page.on("requestfailed",lambda req:report["failed_requests"].append(req.url))
            page.on("response",lambda response:report["requests"].append({"status":response.status,"resource":response.url.split("/")[-1]}))
            loaded(page,url)
            report["browser_executed"]=True
            report["origin"]=page.evaluate("location.origin")
            report["user_agent"]=page.evaluate("navigator.userAgent")
            report["viewport"]=page.evaluate("({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})")
            assert state(page)["x"]==48
            samples=page.evaluate("""() => {const c=document.querySelector('#game'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
              const colors=new Set();for(let y=20;y<c.height;y+=25)for(let x=20;x<c.width;x+=25){const i=(y*c.width+x)*4;colors.add((a[i]<<16)|(a[i+1]<<8)|a[i+2]);}
              return {canvas:[c.width,c.height],different_sample_colors:colors.size}}""")
            assert samples["different_sample_colors"]>=10, "blank/corrupt canvas"
            report["pixel_sample"]=samples
            report["pixel_grid"]=pixel_grid(page)
            assert report["pixel_grid"]["display"]==[960,540]
            assert report["pixel_grid"]["mismatches"]==0,("broken 2x grid: "+repr(report["pixel_grid"]))
            page.wait_for_function("() => document.querySelector('#scene-title')?.textContent?.includes('TICA')")
            report["visual_scene_start"]=scene_text(page)
            assert "segnatempo" in report["visual_scene_start"]["title"].lower()
            assert "ottone" in report["visual_scene_start"]["hint"].lower()
            report["checks"]["visual_narrative_start"]="PASS_OBSERVED"
            report["checks"]["pixel_grid"]="PASS_OBSERVED"
            report["screenshots"].append(screenshot(page,out,"01-start"))
            report["last_stage"]="smoke"
            if args.stage=="smoke":
                report["status"]="PASS_SCOPED_BROWSER_SMOKE"
                return
            if args.stage=="input-continuity":
                verify_input_lifecycle(browser,url,report,args.physical_mutant)
                report["last_stage"]="input-continuity"
                report["status"]="PASS_SCOPED_INPUT_CONTINUITY"
                browser.close()
                return

            page.keyboard.press("p")
            assert state(page)["phase"]=="PAUSED"
            old_x=state(page)["x"]
            page.keyboard.down("ArrowRight")
            page.wait_for_timeout(175)
            page.keyboard.up("ArrowRight")
            assert abs(state(page)["x"]-old_x)<.001
            page.keyboard.press("p")
            assert state(page)["phase"]=="PLAYING"
            report["checks"]["pause_keyboard"]="PASS_OBSERVED"

            jumps,saved=checkpoint(page)
            assert state(page)["deaths"]==0
            report["checks"]["checkpoint_from_keys"]="PASS_OBSERVED"
            report["jumps_before_checkpoint"]=jumps
            page.wait_for_function("() => document.querySelector('#scene-title')?.textContent?.includes('PERNO')")
            report["visual_scene_checkpoint"]=scene_text(page)
            assert "checkpoint" in report["visual_scene_checkpoint"]["hint"].lower()
            report["checks"]["visual_narrative_checkpoint"]="PASS_OBSERVED"
            report["screenshots"].append(screenshot(page,out,"02-checkpoint"))
            report["last_stage"]="checkpoint"
            if args.stage=="checkpoint":
                report["status"]="PASS_SCOPED_BROWSER_CHECKPOINT"
                return

            page.reload(wait_until="load")
            page.wait_for_function("() => typeof window.__niloReadback==='function'")
            assert state(page)["x"]==1220 and state(page)["checkpointActive"]
            report["checks"]["reload_real_storage"]="PASS_OBSERVED"
            report["last_stage"]="reload"
            if args.stage=="reload":
                report["status"]="PASS_SCOPED_BROWSER_RELOAD"
                return
            page.evaluate("key => localStorage.setItem(key,JSON.stringify({version:2,level:'LV-01',checkpointId:'CP-01'}))",STORE)
            page.reload(wait_until="load")
            page.wait_for_function("() => typeof window.__niloReadback==='function'")
            assert state(page)["x"]==48, "forged checkpoint accepted"
            report["checks"]["forged_version_refuted"]="PASS_OBSERVED"
            report["last_stage"]="forged"
            if args.stage=="forged":
                report["status"]="PASS_SCOPED_BROWSER_FORGED"
                return
            page.evaluate("([key,value]) => localStorage.setItem(key,value)",[STORE,saved])
            page.reload(wait_until="load")
            page.wait_for_function("() => typeof window.__niloReadback==='function'")
            assert state(page)["x"]==1220
            report["jumps_after_reload"]=route(page,LAST)
            page.keyboard.down("ArrowRight")
            try:
                page.wait_for_function("() => window.__niloReadback().phase==='COMPLETED'",timeout=5000)
            finally:
                page.keyboard.up("ArrowRight")
            assert state(page)["deaths"]==0
            assert "premi N per LV-02" in page.locator("#hud").inner_text()
            report["checks"]["keyboard_end_to_end"]="PASS_OBSERVED"
            page.wait_for_function("() => document.querySelector('#scene-title')?.textContent?.includes('PRIMA ORA RESTITUITA')")
            report["visual_scene_completed"]=scene_text(page)
            assert "quattro livelli" in report["visual_scene_completed"]["hint"].lower()
            report["checks"]["visual_narrative_finish"]="PASS_OBSERVED"
            report["screenshots"].append(screenshot(page,out,"03-completed"))
            report["last_stage"]="finish"
            if args.stage=="finish":
                report["status"]="PASS_SCOPED_BROWSER_FINISH"
                return
            report["last_stage"]="no-pageerrors"
            assert not report["page_errors"],"uncaught browser JS errors: "+repr(report["page_errors"])
            if args.stage=="no-pageerrors":
                report["status"]="PASS_SCOPED_NO_PAGEERRORS"
                return
            report["last_stage"]="no-requestfailures"
            assert not report["failed_requests"],"unexpected browser failed requests: "+repr(report["failed_requests"])
            if args.stage=="no-requestfailures":
                report["status"]="PASS_SCOPED_NO_REQUEST_FAILURES"
                return
            required=("index.html","core.mjs","art.mjs","main.mjs","style.css")
            report["resource_http_statuses"]={
                name:[r["status"] for r in report["requests"] if r["resource"]==name]
                for name in required}
            for name,statuses in report["resource_http_statuses"].items():
                assert 200 in statuses,"initial HTTP 200 required for "+name+": "+repr(statuses)
                # After a real reload, a conditional HTTP 304 is a valid
                # cache revalidation of the same already received source.
                assert all(status in (200,304) for status in statuses), (
                    "unexpected browser module response for "+name+": "+repr(statuses))
            context.close()

            # Physical, disposable source mutant: reference a non-existent
            # imported module. This tests real HTTP 404 and failed module
            # evaluation, not route-pattern matching or an injected DOM.
            with tempfile.TemporaryDirectory(prefix="nilo-missing-module-") as temp:
                target=Path(temp)/"web"
                shutil.copytree(ROOT/"web",target)
                original=(target/"main.mjs").read_text("utf-8")
                needle='from "./core.mjs"'
                assert original.count(needle)==1,"module import mutation anchor changed"
                (target/"main.mjs").write_text(
                    original.replace(needle,'from "./missing-core.mjs"'),encoding="utf-8")
                assert not (target/"missing-core.mjs").exists(),"negative must not create a replacement module"
                if args.stage=="module-source":
                    report["last_stage"]="module-source"
                    report["status"]="PASS_SCOPED_MODULE_SOURCE_MUTANT"
                    return
                server_events=[]
                with serve(target,server_events) as missing_url:
                    broken=browser.new_context()
                    missing=broken.new_page()
                    missing_requests=[]
                    missing.on("request",lambda request:missing_requests.append(request.url))
                    response=missing.goto(missing_url,wait_until="load",timeout=12000)
                    assert response and response.status==200,"negative fixture must serve real HTML"
                    missing.wait_for_timeout(500)
                    reported=missing.evaluate("typeof window.__niloReadback")
                    module_requested=any(url.endswith("/missing-core.mjs") for url in missing_requests)
                    module_404=any(e["path"].split("?",1)[0]=="/missing-core.mjs"
                                   and e["status"]==404 for e in server_events)
                    report["module_negative_diagnostics"]={
                        "missing_module_requested":module_requested,
                        "missing_module_http_404":module_404,
                        "readback_type":reported,
                        "http_responses":server_events}
                    broken.close()
                    report["last_stage"]="module-request"
                    assert module_requested,"browser must request the physically missing module"
                    if args.stage=="module-request":
                        report["status"]="PASS_SCOPED_MODULE_REQUEST"
                        return
                    report["last_stage"]="module-status"
                    assert module_404,"server must observe real HTTP 404 for requested dependency"
                    if args.stage=="module-status":
                        report["status"]="PASS_SCOPED_MODULE_STATUS"
                        return
                    report["last_stage"]="module-readback"
                    assert reported=="undefined","missing dependency must not initialize playable state"
                    if args.stage=="module-readback":
                        report["status"]="PASS_SCOPED_MODULE_READBACK"
                        return
                    report["checks"]["missing_module_not_playable"]="KILLED_BY_HTTP_404"
                    report["last_stage"]="module-negative"
            if args.stage=="module-negative":
                report["status"]="PASS_SCOPED_BROWSER_MODULE_NEGATIVE"
                return

            mobile=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1)
            page2=mobile.new_page()
            loaded(page2,url)
            assert page2.locator(".mobile-warning").is_visible()
            report["screenshots"].append(screenshot(page2,out,"04-mobile-unsupported"))
            report["checks"]["mobile_is_not_accepted"]="PASS_OBSERVED"
            report["last_stage"]="negative"
            if args.stage=="negative":
                report["status"]="PASS_SCOPED_BROWSER_NEGATIVE"
                return
            mobile.close()

            if args.physical_mutant:
                with tempfile.TemporaryDirectory(prefix="nilo-physical-browser-") as temp:
                    target=Path(temp)/"web"
                    shutil.copytree(ROOT/"web",target)
                    original=(target/"main.mjs").read_text("utf-8")
                    needle="localStorage.setItem(key,receipt);"
                    assert original.count(needle)==1,"source mutation anchor changed"
                    (target/"main.mjs").write_text(original.replace(needle,"void receipt;"),"utf-8")
                    with serve(target) as mutant_url:
                        mctx=browser.new_context(viewport={"width":1280,"height":900})
                        mutant=mctx.new_page()
                        loaded(mutant,mutant_url)
                        route(mutant,FIRST)
                        mutant.keyboard.down("ArrowRight")
                        try:
                            mutant.wait_for_function("() => window.__niloReadback().checkpointActive",timeout=4000)
                        finally:
                            mutant.keyboard.up("ArrowRight")
                        mutant.wait_for_timeout(150)
                        assert state(mutant)["checkpointActive"]
                        assert mutant.evaluate("localStorage.getItem('nilo.checkpoint.v1')") is None, "mutant survived"
                        report["checks"]["real_checkpoint_write_mutant"]="KILLED_BY_BROWSER_ORACLE"
                        mctx.close()
            # Execute auxiliary test contexts only after the original player
            # session is complete. Secondary contexts may hide the original
            # tab, whose visibility handler intentionally pauses gameplay.
            verify_input_lifecycle(browser,url,report,args.physical_mutant)
            if args.physical_mutant:
                with tempfile.TemporaryDirectory(prefix="nilo-pixel-grid-mutant-") as temp:
                    target=Path(temp)/"web"
                    shutil.copytree(ROOT/"web",target)
                    original=(target/"main.mjs").read_text("utf-8")
                    needle="ctx.imageSmoothingEnabled=false;"
                    assert original.count(needle)==1,"pixel grid physical mutation anchor drifted"
                    (target/"main.mjs").write_text(
                        original.replace(needle,"ctx.imageSmoothingEnabled=true;"),encoding="utf-8")
                    with serve(target) as mutant_url:
                        mctx=browser.new_context(viewport={"width":1280,"height":900})
                        victim=mctx.new_page()
                        loaded(victim,mutant_url)
                        victim.wait_for_timeout(150)
                        broken=pixel_grid(victim)
                        assert broken["mismatches"]>0,("smoothing mutant survived actual pixel oracle: "+repr(broken))
                        report["checks"]["physical_pixel_grid_mutant"]="KILLED_BY_BROWSER_ORACLE"
                        mctx.close()
            browser.close()
            report["last_stage"]="complete"
            report["status"]="PASS_SCOPED_BROWSER_LV01"
    except Exception as exc:
        report["status"]="FAIL"
        report["failure"]=str(exc)
        raise
    finally:
        (out/"browser-receipt.json").write_text(json.dumps(report,sort_keys=True,indent=2)+"\n",encoding="utf-8")
        print(json.dumps({"status":report.get("status"),"source_sha":head,"checks":report["checks"],
                          "error":report.get("failure")},indent=2))

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",default="artifacts/browser-lv01")
    p.add_argument("--physical-mutant",action="store_true")
    p.add_argument("--stage",choices=("input-continuity","smoke","checkpoint","reload","forged","finish","module-source","module-request","module-status","module-readback","module-negative","no-pageerrors","no-requestfailures","negative","complete"),default="complete")
    run(p.parse_args())
