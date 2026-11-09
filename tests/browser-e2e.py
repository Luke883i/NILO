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

@contextmanager
def serve(root):
    server=ThreadingHTTPServer(("127.0.0.1",0),partial(QuietHandler,directory=str(root)))
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
            report["screenshots"].append(screenshot(page,out,"01-start"))

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
            report["screenshots"].append(screenshot(page,out,"02-checkpoint"))

            page.reload(wait_until="load")
            page.wait_for_function("() => typeof window.__niloReadback==='function'")
            assert state(page)["x"]==1220 and state(page)["checkpointActive"]
            report["checks"]["reload_real_storage"]="PASS_OBSERVED"
            page.evaluate("key => localStorage.setItem(key,JSON.stringify({version:2,level:'LV-01',checkpointId:'CP-01'}))",STORE)
            page.reload(wait_until="load")
            page.wait_for_function("() => typeof window.__niloReadback==='function'")
            assert state(page)["x"]==48, "forged checkpoint accepted"
            report["checks"]["forged_version_refuted"]="PASS_OBSERVED"
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
            assert "altri 5 capitoli non ancora disponibili" in page.locator("#hud").inner_text()
            report["checks"]["keyboard_end_to_end"]="PASS_OBSERVED"
            report["screenshots"].append(screenshot(page,out,"03-completed"))
            assert not report["page_errors"] and not report["failed_requests"]
            assert all(x["status"]==200 for x in report["requests"] if x["resource"] in
                 ("index.html","core.mjs","art.mjs","main.mjs","style.css"))
            context.close()

            broken=browser.new_context()
            missing=broken.new_page()
            missing.route("**/core.mjs",lambda r:r.abort())
            missing.goto(url,wait_until="load")
            missing.wait_for_timeout(300)
            assert missing.evaluate("typeof window.__niloReadback")=="undefined"
            report["checks"]["missing_module_not_playable"]="PASS_OBSERVED"
            broken.close()

            mobile=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1)
            page2=mobile.new_page()
            loaded(page2,url)
            assert page2.locator(".mobile-warning").is_visible()
            report["screenshots"].append(screenshot(page2,out,"04-mobile-unsupported"))
            report["checks"]["mobile_is_not_accepted"]="PASS_OBSERVED"
            mobile.close()

            if args.physical_mutant:
                with tempfile.TemporaryDirectory(prefix="nilo-physical-browser-") as temp:
                    target=Path(temp)/"web"
                    shutil.copytree(ROOT/"web",target)
                    original=(target/"main.mjs").read_text("utf-8")
                    needle="localStorage.setItem(STORE,encodeCheckpoint());"
                    assert original.count(needle)==1,"source mutation anchor changed"
                    (target/"main.mjs").write_text(original.replace(needle,"void encodeCheckpoint();"),"utf-8")
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
            browser.close()
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
    run(p.parse_args())
