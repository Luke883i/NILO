#!/usr/bin/env python3
"""G1-V0 visual comparison on native HTTP Chrome; neither art approval nor playtest.

Compares the same viewport in reversible legacy and Golden Minute modes.
A physical mutant disables the new draw call in web/main.mjs on a fresh HTTP
origin and must lose the native-pixel signal. No DOM or gameplay state injection.
"""
import argparse
import hashlib
import importlib.util
import json
import platform
import shutil
import subprocess
import tempfile
from importlib.metadata import version
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("nilo_browser_golden_original",ROOT/"tests/browser-e2e.py")
original=importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)

def sample(browser,url,expected_visual,out=None,name=None):
    ctx=browser.new_context(viewport={"width":1280,"height":900},device_scale_factor=1)
    page=ctx.new_page()
    errors,failed=[],[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("requestfailed",lambda r:failed.append(r.url))
    try:
        original.loaded(page,url)
        page.wait_for_function("() => window.__niloReadback().ticks>=2",timeout=5000)
        page.keyboard.press("p")
        page.wait_for_function("() => window.__niloReadback().phase==='PAUSED'",timeout=2000)
        readback=original.state(page)
        assert readback["level"]=="LV-01" and readback["visual"]==expected_visual,readback
        assert readback["action"]["enemiesAlive"]==2,readback
        pixels=page.evaluate("""() => {
          const c=document.querySelector('#game');
          if(c.width!==960||c.height!==540)throw Error("wrong native surface");
          const a=c.getContext('2d').getImageData(350,90,120,70).data;
          let hash=2166136261,colors=new Set();
          for(let i=0;i<a.length;i+=4) {
            const r=a[i],g=a[i+1],b=a[i+2],al=a[i+3];
            colors.add(r+','+g+','+b);
            for(const v of [r,g,b,al])hash=Math.imul(hash^v,16777619)>>>0;
          }
          return {width:c.width,height:c.height,distinct:colors.size,
                  fnv32:hash.toString(16).padStart(8,'0'),pixels:a.length/4};
        }""")
        shot={"source":"read_only_canvas_pixels","mode":expected_visual,**pixels}
        if out is not None:
            shot["screenshot"]=original.screenshot(page,out,name)
        assert not errors,errors
        assert not failed,failed
        return shot
    finally:
        ctx.close()

def run(args):
    sha=subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip()
    assert len(sha)==40
    if args.expected_sha:assert sha==args.expected_sha,(sha,args.expected_sha)
    out=Path(args.out).resolve()
    out.mkdir(parents=True,exist_ok=True)
    report={"schema":"nilo.golden-minute-native-http/1","source_sha":sha,
       "status":"NOT_RUN","browser_executed":False,
       "scope":"G1V0_LV01_FIRST_SCENE_VISUAL_ONLY",
       "author_approved":False,"player_accepted":False,"rights_approved":False,
       "external_render_observed":False,"release_authorized":False,
       "platform":platform.platform(),"playwright_version":version("playwright"),
       "checks":{},"screenshots":[],"errors":[]}
    try:
        with original.serve(ROOT/"web") as url,sync_playwright() as p:
            browser=p.chromium.launch(channel="chrome",headless=True)
            report["browser_version"]=browser.version
            legacy=sample(browser,url+"?visual=legacy","LEGACY",out,"01-legacy")
            golden=sample(browser,url,"GOLDEN_MINUTE_CANDIDATE",out,"02-native")
            assert legacy["pixels"]==golden["pixels"]==8400
            assert golden["fnv32"]!=legacy["fnv32"],"native scene only reuses original pixels"
            assert golden["distinct"]>=30,("no native detail",legacy,golden)
            assert golden["distinct"]>=legacy["distinct"]+10,("not enough native detail",legacy,golden)
            report["checks"]["native_960x540_distinct_from_legacy"]="PASS_HTTP_OBSERVED"
            report["checks"]["real_native_color_detail"]="PASS_HTTP_OBSERVED"
            report["checks"]["legacy_fallback_preserved"]="PASS_HTTP_OBSERVED"
            report["legacy"]=legacy
            report["golden"]=golden
            report["screenshots"]=[legacy["screenshot"],golden["screenshot"]]
            if args.physical_mutant:
                with tempfile.TemporaryDirectory(prefix="nilo-golden-physical-") as tmp:
                    mutant=Path(tmp)/"web"
                    shutil.copytree(ROOT/"web",mutant)
                    target=mutant/"main.mjs"
                    source=target.read_text(encoding="utf8")
                    anchor="if(!legacyVisual)renderGoldenMinute(ctx,state,PLATFORMS);"
                    assert source.count(anchor)==1,"physical browser mutant anchor drift"
                    target.write_text(source.replace(anchor,"if(false)renderGoldenMinute(ctx,state,PLATFORMS);"),
                                      encoding="utf8")
                    assert target.read_text(encoding="utf8")!=source
                    with original.serve(mutant) as bad_url:
                        mutated=sample(browser,bad_url,"GOLDEN_MINUTE_CANDIDATE")
                    assert mutated["distinct"]<=legacy["distinct"]+2,(legacy,mutated)
                    assert mutated["fnv32"]==legacy["fnv32"],(legacy,mutated)
                    report["checks"]["source_mutant_removed_native_draw"]="KILLED_BY_BROWSER_ORACLE"
            report["browser_executed"]=True
            report["status"]="PASS_SCOPED_G1V0_BROWSER"
            report["origin_type"]="ACTUAL_HTTP_LOOPBACK"
            browser.close()
    except Exception as exc:
        report["status"]="FAIL"
        report["errors"].append(repr(exc))
        raise
    finally:
        (out/"golden-receipt.json").write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf8")
        print(json.dumps({key:report[key] for key in ["status","source_sha","checks","errors"]},indent=2))

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--out",default="artifacts/browser-golden")
    ap.add_argument("--expected-sha",default="")
    ap.add_argument("--physical-mutant",action="store_true")
    run(ap.parse_args())
