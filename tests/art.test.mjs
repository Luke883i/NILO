import test from 'node:test';
import assert from 'node:assert/strict';
import {ART,ART_IDENTITY,renderPixelWorld} from '../web/art.mjs';
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
