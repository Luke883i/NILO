/** S03b: seven *physical* action source mutants, not synthetic PASS flags.
 * Each fresh ESM file is written to disk, imported successfully, and observed
 * through a separately specified expected counterexample.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
const original=readFileSync(new URL("../web/action.mjs",import.meta.url),"utf8");

const invalid=b=>{
  assert.equal(b.validateActionBlueprint(b.LV01_ENTITY_BLUEPRINT),false);
  assert.throws(()=>b.initialAction(),TypeError);
};
const mutants=[
  {id:"duplicate-enemy-identity",from:"id:'cortile-sentry-02'",to:"id:'cortile-sentry-01'",falsifier:invalid},
  {id:"enemy-pickup-identity-collision",from:"id:'shard-01'",to:"id:'cortile-sentry-01'",falsifier:invalid},
  {id:"reversed-patrol-bounds",from:"minX:440,maxX:542",to:"minX:600,maxX:542",falsifier:invalid},
  {id:"negative-pickup-position",from:"id:'shard-01',x:178",to:"id:'shard-01',x:-178",falsifier:invalid},
  {id:"shared-enemy-instance",from:"enemies:LV01_ENTITY_BLUEPRINT.enemies.map(e=>({...e,direction:-1,alive:true})),",
    to:"enemies:LV01_ENTITY_BLUEPRINT.enemies,",
    falsifier:m=>{
      const a=m.spawnActionEntities();
      assert.strictEqual(a.enemies,m.LV01_ENTITY_BLUEPRINT.enemies);
      assert.equal(a.enemies[0].alive,undefined);
    }},
  {id:"shared-pickup-instance",from:"pickups:LV01_ENTITY_BLUEPRINT.pickups.map(p=>({...p,collected:false}))",
    to:"pickups:LV01_ENTITY_BLUEPRINT.pickups",
    falsifier:m=>{
      const a=m.spawnActionEntities();
      assert.strictEqual(a.pickups,m.LV01_ENTITY_BLUEPRINT.pickups);
      assert.equal(a.pickups[0].collected,undefined);
    }},
  {id:"future-level-ghost-entities",from:"export function spawnActionEntities(level='LV-01'){\n  if(level!=='LV-01')return null;",
    to:"export function spawnActionEntities(level='LV-01'){\n  if(false)return null;",
    falsifier:m=>assert.equal(m.spawnActionEntities("LV-04").enemies.length,2)}
];
for(const item of mutants){
  test("S03b altered source exhibits expected counterexample: "+item.id,async()=>{
    const dir=mkdtempSync(join(tmpdir(),"nilo-s03b-entities-"));
    try{
      const before=join(dir,"original.mjs"),after=join(dir,"mutant.mjs");
      writeFileSync(before,original,"utf8");
      const base=await import(pathToFileURL(before).href);
      assert.equal(base.validateActionBlueprint(base.LV01_ENTITY_BLUEPRINT),true);
      assert.equal(base.initialAction().enemies.length,2);
      assert.equal(base.initialAction().pickups.length,3);
      assert.equal(base.spawnActionEntities("LV-04"),null);
      assert.equal(original.split(item.from).length,2,"mutation anchor drift: "+item.id);
      const changed=original.replace(item.from,item.to);
      assert.notEqual(changed,original);
      writeFileSync(after,changed,"utf8");
      assert.equal(readFileSync(after,"utf8"),changed);
      const mutant=await import(pathToFileURL(after).href);
      item.falsifier(mutant);
      assert.equal(base.validateActionBlueprint(base.LV01_ENTITY_BLUEPRINT),true);
    }finally{rmSync(dir,{recursive:true,force:true});}
  });
}
