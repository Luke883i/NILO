/** LV-02 is data for the original NILO core, not a second engine.
 * The Custode is wired in the shared core; only canal geometry lives here.
 * Distances are logical Canvas2D pixels and ticks use the shared 60Hz clock. */
export const LV02 = Object.freeze({
  id:'LV-02',title:'Canali dei Minuti',width:2360,finishX:2190,
  checkpointX:1430,checkpointSpawn:Object.freeze({x:1450,y:383}),
  initial:Object.freeze({x:48,y:418}),
  platforms:Object.freeze([
    {id:'canal-0',x:0,y:460,w:310},
    {id:'canal-1',x:375,y:440,w:215},
    {id:'canal-2',x:800,y:445,w:225},
    {id:'canal-3',x:1100,y:430,w:240},
    {id:'canal-4',x:1410,y:425,w:235},
    {id:'canal-5',x:1730,y:445,w:230},
    {id:'canal-6',x:2030,y:460,w:330}
  ].map(Object.freeze)),
  moving:Object.freeze({id:'canal-bridge',baseX:645,amplitude:38,y:427,w:135,angularTick:.033}),
  currents:Object.freeze([
    Object.freeze({id:'flow-east',x:595,w:210,boost:52}),
    Object.freeze({id:'flow-west',x:1655,w:102,boost:-38})
  ]),
  exit:'defeat Custode to release second hour; gate alone is not victory'
});
export function movingBridge(ticks=0){
  if(!Number.isInteger(ticks)||ticks<0)throw new RangeError('nonnegative integer tick');
  const p=LV02.moving;
  return {id:p.id,x:p.baseX+Math.round(p.amplitude*Math.sin(ticks*p.angularTick)),
    y:p.y,w:p.w,moving:true};
}
export function lv02Surfaces(ticks=0){return [...LV02.platforms,movingBridge(ticks)];}
export function currentForceAt(x){
  const zone=LV02.currents.find(z=>x>=z.x&&x<z.x+z.w);
  return zone?zone.boost:0;
}
export function decodeLV02Checkpoint(raw){
  try {
    const v=typeof raw==='string'?JSON.parse(raw):raw;
    if(!v||typeof v!=='object'||Array.isArray(v)||
       Object.keys(v).sort().join(',')!=='checkpointId,level,version'||
       v.version!==1||v.level!=='LV-02'||v.checkpointId!=='CP-02')return null;
    return {version:1,level:'LV-02',checkpointId:'CP-02'};
  }catch{return null;}
}
export const encodeLV02Checkpoint=()=>JSON.stringify({version:1,level:'LV-02',checkpointId:'CP-02'});
