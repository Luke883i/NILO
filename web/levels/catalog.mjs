/** S03a: source-owned catalog of *implemented* NILO worlds.
 * A level profile is data for the one shared core, never a second physics engine.
 * No design-only LV04–06 becomes executable through this descriptor.
 */
import {LV02,lv02Surfaces} from "./lv-02.mjs";
import {LV03} from "./lv-03.mjs";

export const IMPLEMENTED_LEVEL_IDS=Object.freeze(["LV-01","LV-02","LV-03"]);
export const DESIGN_ONLY_LEVEL_IDS=Object.freeze(["LV-04","LV-05","LV-06"]);
const LV01_START=Object.freeze({x:48,y:418});
const LV01_CHECKPOINT_SPAWN=Object.freeze({x:1220,y:358});

/** All geometry is in logical pixels. Mutable moving surfaces are snapshot
 * for one tick; the original per-level dynamic calculation stays authoritative.
 * The LV01 CFG/PLATFORMS inputs remain owned by the original core.
 */
export function describeLevel(id,cfg,lv01Platforms,ticks=0){
  if(!Number.isSafeInteger(ticks)||ticks<0)
    throw new RangeError("nonnegative integer level tick required");
  if(!cfg||!Number.isFinite(cfg.width)||cfg.width<=0||
      !Array.isArray(lv01Platforms)||lv01Platforms.length===0)
    throw new TypeError("original LV01 geometry required");
  if(id==="LV-01"){
    return Object.freeze({id,title:"Cortile delle Lancette",width:cfg.width,
      finishX:cfg.finishX,checkpointX:cfg.checkpointX,
      initial:LV01_START,checkpointSpawn:LV01_CHECKPOINT_SPAWN,
      platforms:lv01Platforms,boss:null,status:"IMPLEMENTED_CANDIDATE"});
  }
  if(id==="LV-02"){
    return Object.freeze({id,title:LV02.title,width:LV02.width,
      finishX:LV02.finishX,checkpointX:LV02.checkpointX,
      initial:LV02.initial,checkpointSpawn:LV02.checkpointSpawn,
      platforms:Object.freeze(lv02Surfaces(ticks).map(p=>
        Object.isFrozen(p)?p:Object.freeze({...p}))),
      boss:"CH-CUSTODE",status:"IMPLEMENTED_CANDIDATE"});
  }
  if(id==="LV-03"){
    return Object.freeze({id,title:LV03.title,width:LV03.width,
      finishX:LV03.finishX,checkpointX:LV03.checkpointX,
      initial:LV03.initial,checkpointSpawn:LV03.checkpointSpawn,
      platforms:LV03.platforms,boss:null,status:"IMPLEMENTED_CANDIDATE"});
  }
  throw new RangeError("level not implemented: "+String(id));
}
