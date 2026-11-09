/** LV-03: Archivio delle Ombre. Shared 60Hz physics, no second engine.
 * Two solid gates require opposite light states. Logs are optional.
 * Visual cues must communicate gate state without color-only feedback. */
export const LV03=Object.freeze({
 id:'LV-03',title:'Archivio delle Ombre',width:2240,finishX:2160,
 initial:Object.freeze({x:48,y:418}),
 checkpointX:1160,checkpointSpawn:Object.freeze({x:1230,y:418}),
 platforms:Object.freeze([
  {id:'archive-0',x:0,y:460,w:350},
  {id:'archive-1',x:410,y:460,w:430},
  {id:'archive-2',x:920,y:460,w:450},
  {id:'archive-3',x:1430,y:460,w:370},
  {id:'archive-4',x:1850,y:460,w:390}
 ].map(Object.freeze)),
 doors:Object.freeze([
   Object.freeze({id:'shadow-door',x:660,w:36,mode:'SHADOW',label:'OMBRA'}),
   Object.freeze({id:'light-door',x:1550,w:36,mode:'LIGHT',label:'LUCE'})
 ]),
 switches:Object.freeze([
   Object.freeze({id:'lamp-one',x:560,radius:70}),
   Object.freeze({id:'lamp-two',x:1480,radius:64})
 ]),
 collectible:Object.freeze({id:'archive-ledger',x:1080,radius:32,optional:true}),
 exit:'cross both physical light/shadow doors and reach archive exit; log optional'
});
export const archiveDoorOpen=(door,mode)=>door.mode===mode;
export function decodeLV03Checkpoint(raw){
 try{
  const v=typeof raw==='string'?JSON.parse(raw):raw;
  if(!v||typeof v!=='object'||Array.isArray(v)||
     Object.keys(v).sort().join(',')!=='checkpointId,level,version'||
     v.version!==1||v.level!=='LV-03'||v.checkpointId!=='CP-03')return null;
  return {version:1,level:'LV-03',checkpointId:'CP-03'};
 }catch{return null;}
}
export const encodeLV03Checkpoint=()=>JSON.stringify({version:1,level:'LV-03',checkpointId:'CP-03'});
/** Pure one-edge interaction: no automatic toggle from proximity, no remote authority.
 * Input is a one-shot key edge supplied by the shared input adapter.
 */
export function archiveInteraction(state,x,{interactPressed=false,grounded=false}={}){
 if(!interactPressed||!grounded)return state;
 const near=LV03.switches.find(s=>Math.abs(x-s.x)<=s.radius);
 if(near)return {...state,lightMode:state.lightMode==='LIGHT'?'SHADOW':'LIGHT',
   switchesUsed:(state.switchesUsed??0)+1};
 if(!state.archiveLog&&Math.abs(x-LV03.collectible.x)<=LV03.collectible.radius)
   return {...state,archiveLog:true};
 return state;
}
