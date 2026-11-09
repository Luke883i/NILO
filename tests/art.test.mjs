import test from 'node:test';
import assert from 'node:assert/strict';
import {ART,ART_IDENTITY,ART_CUES,ART_SIGNALS,sceneCue,renderPixelWorld} from '../web/art.mjs';
import {CFG,PLATFORMS,initialState} from '../web/core.mjs';
function luminance(hex){const v=hex.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;}
const ratio=(a,b)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (hi+.05)/(lo+.05);};
test('pixel art visual hierarchy preserves readable light/dark design palette',()=>{
 assert(ratio(ART.cream,ART.ink)>=7,'cream/ink must meet high contrast budget');
 assert(ratio(ART.ivory,ART.ink)>=7,'ivory/ink must meet high contrast budget');
 assert.match(ART_IDENTITY.resolution,/480x270/);
});
test('Nilo, Tica and Perno roles retain distinct visual identities',()=>{
 assert.equal(ART_IDENTITY.playable,'CH-NILO');
 assert.equal(ART_IDENTITY.companion,'CH-TICA');
 assert.equal(ART_IDENTITY.maintenance,'CH-PERNO');
 assert.notEqual(ART.teal,ART.coral);
});
test('original pixel renderer emits a layered deterministic scene without relying on external images',()=>{
 const operations=[];
 const ctx=new Proxy({}, {set(target,key,value){target[key]=value;return true;}, get(target,key){
   if(key in target)return target[key];
   if(['save','restore','beginPath','stroke','fill','closePath','clearRect','arc','moveTo','lineTo','translate','fillRect','fillText'].includes(key))return (...args)=>{operations.push([key,...args]);};
   return undefined;
 }});
 renderPixelWorld(ctx,initialState(),CFG,PLATFORMS);
 assert(operations.filter(x=>x[0]==='fillRect').length>150);
 assert(operations.some(x=>x[0]==='fillText'&&String(x[1]).includes('PROLOGO')));
 assert.equal(operations.filter(x=>x[0]==='save').length,operations.filter(x=>x[0]==='restore').length);
});

function recording(state){
 const operations=[],surface={fillStyle:ART.ink};
 const ctx=new Proxy(surface,{set(t,k,v){t[k]=v;return true},get(t,k){
   if(k in t)return t[k];
   if(['save','restore','beginPath','stroke','fill','closePath','clearRect','arc','moveTo','lineTo','translate','fillRect','fillText'].includes(k))
     return (...args)=>{operations.push({kind:k,args,color:t.fillStyle});};
   return undefined;
 }});
 renderPixelWorld(ctx,state,CFG,PLATFORMS);
 return operations;
}
test('PR8: four story beats follow real position; pause and completion override movement',()=>{
 assert.deepEqual(ART_CUES.map(x=>x.id),['CUE-01','CUE-02','CUE-03','CUE-04']);
 for(const [x,id] of [[48,'CUE-01'],[649,'CUE-01'],[650,'CUE-02'],[1199,'CUE-02'],[1200,'CUE-03'],[1549,'CUE-03'],[1550,'CUE-04'],[2050,'CUE-04']])
   assert.equal(sceneCue({...initialState(),x}).id,id);
 assert.match(sceneCue({...initialState(),x:1250,checkpointActive:true}).title,/RIACCESO/);
 assert.match(sceneCue({...initialState(),x:1250,checkpointActive:true}).hint,/checkpoint attivo/i);
 assert.equal(sceneCue({...initialState(),phase:'PAUSED'}).id,'CUE-PAUSE');
 const ending=sceneCue({...initialState(),phase:'COMPLETED'});
 assert.equal(ending.id,'CUE-END');
 assert.match(ending.hint,/quattro livelli.*sviluppo/i,'not-yet-playable levels remain explicit');
 assert(ART_CUES.every(x=>x.title&&x.hint&&x.role.startsWith('CH-')));
});
test('PR8: solid, void, checkpoint, exit and role signals are independently identifiable declarations',()=>{
 assert.deepEqual(Object.keys(ART_SIGNALS).sort(),['characters','checkpoint','exit','solid','void']);
 assert(new Set(Object.values(ART_SIGNALS).map(x=>x.id)).size===5);
 assert(Object.values(ART_SIGNALS).every(x=>x.label&&x.shape));
 assert(ART_SIGNALS.solid.shape!==ART_SIGNALS.void.shape);
});
test('PR8: rendered start, checkpoint and completion preserve visible roles and first-hour status',()=>{
 const initial=recording(initialState());
 const labels=initial.filter(x=>x.kind==='fillText').map(x=>String(x.args[0]));
 assert(labels.includes('NILO')&&labels.includes('TICA'));
 const birdLabel=initial.find(x=>x.kind==='fillText'&&x.args[0]==='TICA');
 assert(birdLabel.args[1]>=20,'start-scene Tica name must not be clipped by the left viewport edge');
 assert(labels.some(x=>x.includes('LE SEI ORE')));
 assert(labels.some(x=>x.includes('PROLOGO')));
 const edge=initial.filter(x=>x.kind==='fillRect').some(x=>{
    const [px,py]=x.args;
    return px>=276&&px<=301&&py>=424&&py<=439&&(x.color===ART.cream||x.color===ART.brass);
 });
 assert(edge,'first playable ledge must have readable jump chevrons');
 const cp=recording({...initialState(),x:1250,camera:970,checkpointActive:true});
 assert(cp.some(x=>x.kind==='fillText'&&x.args[0]==='PERNO'));
 // Reaching a checkpoint must not represent an hour as restored.
 const firstHour=ops=>ops.filter(x=>x.kind==='fillRect'&&x.args[0]===702&&x.args[1]===50);
 assert(firstHour(cp).some(x=>x.color===ART.brick),'checkpoint must keep first-hour progress unlit');
 assert(cp.some(x=>x.kind==='fillText'&&String(x.args[0]).includes('TEMPO SALVATO')));
 const end=recording({...initialState(),phase:'COMPLETED',x:1980,camera:1140,checkpointActive:true});
 assert(end.some(x=>x.kind==='fillText'&&String(x.args[0]).includes('PRIMA ORA RESTITUITA')));
 assert(firstHour(end).some(x=>x.color===ART.teal),'first hour lights only upon actual completion');
});
test('PR8: bounded seeded camera and temporal metamorphisms do not erase state cue',()=>{
 let state=20261109;
 const next=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/0x100000000);
 for(let i=0;i<6000;i++){
    const x=next()*2072,camera=next()*1140,ticks=Math.floor(next()*600),
          pos={...initialState(),x,camera,ticks,checkpointActive:x>=1210};
    const cue=sceneCue(pos);
    assert(cue?.title&&cue?.hint&&cue.id.startsWith('CUE-'));
    if(i%1000===0){
      const operations=recording(pos);
      assert(operations.some(o=>o.kind==='fillText'&&o.args[0]==='NILO'));
      assert.equal(operations.filter(o=>o.kind==='save').length,operations.filter(o=>o.kind==='restore').length);
    }
 }
});
