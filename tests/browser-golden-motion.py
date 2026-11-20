#!/usr/bin/env python3
"""G1-V1 state-grounded native animation on real HTTP Chrome, not art approval."""
import argparse
import hashlib
import importlib.util
import json
import platform
import subprocess
from pathlib import Path
from importlib.metadata import version
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("nilo_golden_browser_base",ROOT/"tests/browser-e2e.py")
old=importlib.util.module_from_spec(spec)
spec.loader.exec_module(old)

def pixel_region(page):
    return page.evaluate("""() => {
      const canvas=document.querySelector('#game'),s=window.__niloReadback();
      const x=Math.max(0,Math.min(860,Math.round(s.x-s.camera)-15));
      const y=Math.max(76,Math.min(410,Math.round(s.y)-70));
      const a=canvas.getContext('2d').getImageData(x,y,95,112).data;
      let h=2166136261;const colors=new Set();
      for(let i=0;i<a.length;i+=4){
        colors.add(a[i]+','+a[i+1]+','+a[i+2]);
        for(let j=0;j<4;j++)h=Math.imul(h^a[i+j],16777619)>>>0;
      }
      return {hash:h.toString(16).padStart(8,'0'),distinct:colors.size,
       pixels:a.length/4,x,y,ticks:s.ticks,phase:s.phase};
    }""")

def run(args):
    sha=subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip()
    if args.expected_sha:assert sha==args.expected_sha,(sha,args.expected_sha)
    out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
    report={"schema":"nilo.golden-motion-browser/1","source_sha":sha,
      "scope":"G1V1_LV01_NATIVE_KEYBOARD_ANIMATION_ONLY","status":"NOT_RUN",
      "browser_executed":False,"author_approved":False,"independent_player_accepted":False,
      "rights_cleared":False,"beta_authorized":False,"release_authorized":False,
      "host":platform.platform(),"playwright":version("playwright"),
      "checks":{},"screenshots":[],"errors":[]}
    try:
      with old.serve(ROOT/"web") as url,sync_playwright() as pw:
        browser=pw.chromium.launch(channel="chrome",headless=True)
        context=browser.new_context(viewport={"width":1280,"height":900},device_scale_factor=1)
        page=context.new_page()
        errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
        old.loaded(page,url)
        page.wait_for_function("() => window.__niloReadback().ticks>=3",timeout=4000)
        assert old.state(page)["visual"]=="GOLDEN_MINUTE_CANDIDATE"
        idle=pixel_region(page)
        page.keyboard.press("p")
        page.wait_for_function("() => window.__niloReadback().phase==='PAUSED'")
        frozen=pixel_region(page)
        page.wait_for_timeout(200)
        frozen_after=pixel_region(page)
        assert frozen["ticks"]==frozen_after["ticks"]
        assert frozen["hash"]==frozen_after["hash"],(frozen,frozen_after)
        report["checks"]["pause_freezes_actual_native_frame"]="PASS_HTTP_OBSERVED"
        page.keyboard.press("p")
        page.wait_for_function("() => window.__niloReadback().phase==='PLAYING'")
        page.keyboard.down("ArrowRight")
        page.wait_for_function("() => window.__niloReadback().x>110",timeout=5000)
        moving=pixel_region(page)
        page.keyboard.up("ArrowRight")
        assert moving["hash"]!=frozen["hash"],(frozen,moving)
        report["checks"]["physical_run_changes_native_frame"]="PASS_HTTP_OBSERVED"
        page.keyboard.press("Space",delay=50)
        page.wait_for_function("() => !window.__niloReadback().onGround",timeout=1500)
        airborne=pixel_region(page)
        assert airborne["hash"]!=moving["hash"]
        report["checks"]["physical_jump_changes_native_frame"]="PASS_HTTP_OBSERVED"
        page.keyboard.press("j",delay=50)
        page.wait_for_function("() => window.__niloReadback().action?.shots>0",timeout=2500)
        fire=pixel_region(page)
        assert fire["hash"]!=airborne["hash"]
        report["checks"]["physical_j_projectile_visible_and_native_frame_changes"]="PASS_HTTP_OBSERVED"
        assert not errors,errors
        report["screenshots"].append(old.screenshot(page,out,"01-native-motion"))
        report["states"]={"idle":idle,"paused":frozen,"running":moving,"jump":airborne,"fire":fire}
        report["browser_executed"]=True
        report["status"]="PASS_SCOPED_G1V1_BROWSER"
        browser.close()
    except Exception as e:
      report["status"]="FAIL";report["errors"].append(repr(e))
      raise
    finally:
      (out/"motion-receipt.json").write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf8")
      print(json.dumps({k:report[k] for k in ["status","source_sha","checks","errors"]},indent=2))

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",default="/tmp/nilo-browser-g1v1")
    p.add_argument("--expected-sha",default="")
    run(p.parse_args())
