#!/usr/bin/env python3
"""G2-V0 actual HTTP Chrome: physical first shard, one-use ward and two source mutants.
No simulated state injection, user acceptance, creative signoff or beta claim.
"""
import argparse
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
spec=importlib.util.spec_from_file_location("nilo_s01_real_input",ROOT/"tests/browser-action.py")
action=importlib.util.module_from_spec(spec)
spec.loader.exec_module(action)

def approach(browser,url):
 ctx,page,errors,failed=action.new_game(browser,url)
 try:
  start=action.readback(page)
  assert start["level"]=="LV-01" and start["action"]["shards"]==0,start
  assert start["reward"]=={"ward":0,"wardsAbsorbed":0,"wardPulse":0},start
  grounded=action.approach_patrol(page)
  assert grounded["action"]["shards"]==1 and grounded["action"]["health"]==3,grounded
  return ctx,page,errors,failed,grounded
 except Exception:
  ctx.close()
  raise

def after_contact(page):
 page.keyboard.down("ArrowRight")
 try:
  page.wait_for_function("() => window.__niloReadback().reward.wardsAbsorbed===1 || window.__niloReadback().action.health<3",timeout=7000)
 finally:
  page.keyboard.up("ArrowRight")
 return action.readback(page)

def physical_source_web(src,dest,old,new):
 shutil.copytree(src,dest)
 f=dest/"action.mjs"
 original=f.read_text(encoding="utf8")
 assert original.count(old)==1,("source selection drift",old)
 f.write_text(original.replace(old,new),encoding="utf8")
 assert f.read_text(encoding="utf8")!=original

def run(args):
 sha=subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip()
 if args.expected_sha:assert sha==args.expected_sha,(sha,args.expected_sha)
 out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
 report={"schema":"nilo.shard-ward-native-http/1","source_sha":sha,
  "scope":"G2V0_LV01_PHYSICAL_SHARD_ONE_USE_SHIELD_ONLY",
  "status":"NOT_RUN","browser_executed":False,"independent_players_accepted":False,
  "author_approved":False,"rights_cleared":False,"beta_authorized":False,
  "release_authorized":False,"platform":platform.platform(),"playwright":version("playwright"),
  "checks":{},"screenshots":[],"errors":[]}
 try:
  with action.original.serve(ROOT/"web") as url,sync_playwright() as pw:
   browser=pw.chromium.launch(channel="chrome",headless=True)
   ctx,page,errors,failed,first=approach(browser,url)
   try:
    assert first["reward"]["ward"]==1,first
    page.wait_for_function("() => document.querySelector('#hud')?.textContent?.includes('SCUDO 1/1')")
    assert "FRAMMENTI 1/3" in page.locator("#hud").inner_text()
    report["checks"]["real_keyboard_pickup_grants_visible_ward"]="PASS_HTTP_OBSERVED"
    report["screenshots"].append(action.original.screenshot(page,out,"01-earned-ward"))
    blocked=after_contact(page)
    assert blocked["action"]["health"]==3 and blocked["reward"]["ward"]==0,blocked
    assert blocked["reward"]["wardsAbsorbed"]==1,blocked
    page.wait_for_function("() => document.querySelector('#hud')?.textContent?.includes('SCUDO 0/1')")
    report["checks"]["real_enemy_contact_spends_ward_no_health_loss"]="PASS_HTTP_OBSERVED"
    report["screenshots"].append(action.original.screenshot(page,out,"02-absorbed-contact"))
    page.keyboard.press("p")
    paused=action.readback(page)
    assert paused["phase"]=="PAUSED" and paused["reward"]["wardsAbsorbed"]==1,paused
    page.wait_for_timeout(150)
    assert action.readback(page)["reward"]==paused["reward"]
    report["checks"]["pause_preserves_game_owned_ward"]="PASS_HTTP_OBSERVED"
    page.keyboard.press("r")
    restart=action.readback(page)
    assert restart["reward"]=={"ward":0,"wardsAbsorbed":0,"wardPulse":0},restart
    page.reload(wait_until="load")
    page.wait_for_function("() => typeof window.__niloReadback==='function'")
    assert action.readback(page)["reward"]=={"ward":0,"wardsAbsorbed":0,"wardPulse":0}
    report["checks"]["restart_and_reload_do_not_forge_reward"]="PASS_HTTP_OBSERVED"
    assert not errors and not failed,(errors,failed)
   finally:
    ctx.close()
   if args.physical_mutants:
    with tempfile.TemporaryDirectory(prefix="nilo-shard-ward-chrome-") as tmp:
     tmp=Path(tmp)
     absent=tmp/"no-grant"
     physical_source_web(ROOT/"web",absent,
       "const newRewards=new Set(collectedNow.filter(p=>allowed.has(p.id)).map(p=>p.id));",
       "const newRewards=new Set();")
     with action.original.serve(absent) as mutated_url:
      c,p,errors,failed,mut=approach(browser,mutated_url)
      try:
       assert mut["action"]["shards"]==1 and mut["reward"]["ward"]==0,mut
       assert not errors and not failed,(errors,failed)
       report["checks"]["physical_no_grant_mutant_caught_by_keyboard"]="KILLED_BY_BROWSER_ORACLE"
      finally:c.close()
     bypass=tmp/"no-absorption"
     physical_source_web(ROOT/"web",bypass,
       "const absorbed=Boolean(contact)&&prior>0;","const absorbed=false;")
     with action.original.serve(bypass) as bad_url:
      c,p,errors,failed,mut=approach(browser,bad_url)
      try:
       assert mut["reward"]["ward"]==1,mut
       hurt=after_contact(p)
       assert hurt["action"]["health"]==2 and hurt["reward"]["wardsAbsorbed"]==0,hurt
       assert not errors and not failed,(errors,failed)
       report["checks"]["physical_absorption_bypass_caught_by_keyboard"]="KILLED_BY_BROWSER_ORACLE"
      finally:c.close()
   browser.close()
   report["browser_executed"]=True
   report["status"]="PASS_SCOPED_G2V0_BROWSER"
 except Exception as exc:
  report["status"]="FAIL";report["errors"].append(repr(exc))
  raise
 finally:
  (out/"ward-receipt.json").write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf8")
  print(json.dumps({k:report[k] for k in ["source_sha","status","checks","errors"]},indent=2))

if __name__=="__main__":
 p=argparse.ArgumentParser()
 p.add_argument("--out",default="/tmp/nilo-browser-shard-ward")
 p.add_argument("--expected-sha",default="")
 p.add_argument("--physical-mutants",action="store_true")
 run(p.parse_args())
