/** NILO NEXT G1-V0: original native-pixel Golden Minute visual candidate.
 * Rendering only: never mutates state, collision data, progress or input.
 * The approved legacy visual remains the reversible fallback (?visual=legacy).
 * This renderer is NOT author-approved HD art or independent player acceptance.
 */
export const GOLDEN_MINUTE=Object.freeze({
 schema:"nilo.golden-minute-candidate/1",
 level:"LV-01", startX:0,fullUntilX:550,fadeUntilX:750,
 width:960,height:540,detailStep:1,
 legacyQuery:"visual=legacy",authorApproved:false,playerAccepted:false
});
const TWO_PI=Math.PI*2;
const C=Object.freeze({
 sky0:"#102c48",sky1:"#355e75",sky2:"#8d6c68",
 smoke:"#c4ad92",far:"#2b4555",mid:"#2e5960",near:"#38575b",
 ink:"#101e32",metal:"#584958",copper:"#ad6651",brass:"#e4b25e",
 gold:"#ffdf91",ivory:"#fff2cd",teal:"#79dbc1",tealDark:"#2f8279",
 coral:"#ed7965",shadow:"#253243",leather:"#764f4b",skin:"#edbd84"
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rectangle=(ctx,x,y,w,h,fill)=>{ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);};
const stroke=(ctx,x1,y1,x2,y2,color,width=1)=>{
 ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
};
const disk=(ctx,x,y,r,fill)=>{
 ctx.beginPath();ctx.arc(x,y,r,0,TWO_PI);ctx.fillStyle=fill;ctx.fill();
};
/** G1-V1: deterministic, simulation-owned animation grammar.
 * No timer, stored sprite frame, random jitter, physics mutation or new rights.
 * The pose is an observation of the actual game state, not a second engine.
 */
export const GOLDEN_MOTION=Object.freeze({
 schema:"nilo.golden-motion/1",level:"LV-01",
 runCycleTicks:5,wingCycleTicks:7,
 source:"ACTUAL_GAME_STATE_ONLY",renderOnly:true,
 authorApproved:false,independentPlaytest:false
});
export function goldenMotionPose(state){
 if(!state||state.level!==GOLDEN_MOTION.level||
    !Number.isSafeInteger(state.ticks)||state.ticks<0||
    !Number.isFinite(state.x)||!Number.isFinite(state.y))return null;
 const action=state.action;
 const hurt=Boolean(action&&action.invulnerable>0);
 const firing=Boolean(action?.shots?.length);
 const running=Number.isFinite(state.vx)&&Math.abs(state.vx)>1;
 const phase=hurt?"HURT":firing?"FIRE":state.onGround===false?"AIR":running?"RUN":"IDLE";
 const frame=Math.floor(state.ticks/GOLDEN_MOTION.runCycleTicks)%4;
 const stride=phase==="RUN"?[0,3,0,-3][frame]:0;
 const wingLift=Math.floor(state.ticks/GOLDEN_MOTION.wingCycleTicks)%2===0?-4:4;
 return Object.freeze({phase,frame,stride,
   wingLift,blink:state.ticks%180>=175,
   scarfLift:phase==="AIR"?-6:phase==="RUN"?stride:0,
   shotFlare:firing,hurtFlash:hurt&&state.ticks%6<3,
   sentryStep:Math.floor(state.ticks/7)%2?2:0,
   shardFrame:Math.floor(state.ticks/7)%4,
   facing:action?.facing===-1?-1:1});
}
export function goldenMinutePlan(state,legacy=false){
 if(legacy||!state||state.level!==GOLDEN_MINUTE.level||
    !Number.isFinite(state.x)||!Number.isFinite(state.camera)||
    !Number.isFinite(state.y)||!Number.isFinite(state.ticks)||
    state.x<0||state.x>=GOLDEN_MINUTE.fadeUntilX)return null;
 const z=clamp((GOLDEN_MINUTE.fadeUntilX-state.x)/
   (GOLDEN_MINUTE.fadeUntilX-GOLDEN_MINUTE.fullUntilX),0,1);
 // Smooth, continuous transition back to the entire original renderer.
 const alpha=z*z*(3-2*z);
 return Object.freeze({level:"LV-01",opacity:alpha,
   playerScreenX:state.x-state.camera,playerScreenY:state.y,
   nativeWidth:960,nativeHeight:540,detailStep:1});
}
function cloudySky(ctx,state){
 const g=ctx.createLinearGradient(0,76,0,540);
 g.addColorStop(0,C.sky0);g.addColorStop(.43,C.sky1);
 g.addColorStop(.75,C.sky2);g.addColorStop(1,C.smoke);
 rectangle(ctx,0,76,960,464,g);
 for(let i=0;i<15;i++){
   const x=i*91-115-state.camera*.09;
   const y=125+Math.sin(i*2.13)*40;
   ctx.beginPath();ctx.ellipse(x,y,79,12,0,0,TWO_PI);
   ctx.fillStyle=i%2?"#516b77":"#607784";
   const inheritedAlpha=ctx.globalAlpha;
   ctx.globalAlpha=inheritedAlpha*.22;ctx.fill();ctx.globalAlpha=inheritedAlpha;
 }
 for(let i=0;i<11;i++){
   const x=i*123-70-state.camera*.14;
   const h=124+(i*47)%130, y=400-h;
   rectangle(ctx,x,y,95,h,C.far);
   rectangle(ctx,x+10,y-18,75,18,C.shadow);
   for(let k=0;k<7;k++){
     rectangle(ctx,x+17+(k%3)*22,y+14+Math.floor(k/3)*31,8,13,
       (i+k)%3===0?C.brass:C.ink);
     stroke(ctx,x+21+(k%3)*22,y+15+Math.floor(k/3)*31,
       x+21+(k%3)*22,y+24+Math.floor(k/3)*31,C.sky2);
   }
 }
 for(let i=0;i<8;i++){
   const x=i*165-20-state.camera*.26,y=324+((i*31)%50);
   rectangle(ctx,x,y,116,184,C.mid);
   rectangle(ctx,x+7,y-20,104,22,C.near);
   for(let j=0;j<5;j++){
     const wx=x+15+j*18;
     rectangle(ctx,wx,y+24,11,18,C.ink);
     rectangle(ctx,wx+2,y+26,7,9,(i+j)%3?C.copper:C.brass);
   }
   stroke(ctx,x+8,y+73,x+109,y+73,C.brass,2);
   for(let k=0;k<6;k++)disk(ctx,x+16+k*17,y+73,1.6,C.gold);
 }
}
function brassClock(ctx,state){
 const x=750-state.camera*.19,y=201;
 ctx.save();ctx.translate(x,y);
 disk(ctx,0,0,83,C.shadow);
 disk(ctx,0,0,75,C.brass);
 disk(ctx,0,0,69,C.ink);
 disk(ctx,0,0,62,C.sky0);
 ctx.strokeStyle=C.ivory;ctx.lineWidth=2;
 for(let i=0;i<12;i++){
   const a=i*TWO_PI/12,sa=Math.sin(a),ca=Math.cos(a);
   stroke(ctx,sa*50,-ca*50,sa*59,-ca*59,C.gold,i%3===0?3:1.2);
 }
 const hand=state.ticks*.007;
 stroke(ctx,0,0,Math.sin(hand)*42,-Math.cos(hand)*42,C.brass,4);
 stroke(ctx,0,0,Math.sin(hand*.3)*30,-Math.cos(hand*.3)*30,C.teal,3);
 disk(ctx,0,0,5,C.ivory);
 for(let j=0;j<24;j++){
   const a=j*TWO_PI/24;
   disk(ctx,Math.sin(a)*80,-Math.cos(a)*80,2.2,C.copper);
 }
 ctx.restore();
}
function gear(ctx,cx,cy,r,phase){
 ctx.save();ctx.translate(cx,cy);ctx.rotate(phase);
 disk(ctx,0,0,r,C.shadow);disk(ctx,0,0,r-5,C.copper);
 for(let i=0;i<12;i++){
   const a=i*TWO_PI/12;
   const x=Math.cos(a)*(r+2),y=Math.sin(a)*(r+2);
   rectangle(ctx,x-5,y-3,10,6,C.brass);
 }
 disk(ctx,0,0,r*.53,C.brass);disk(ctx,0,0,r*.3,C.ink);
 for(let j=0;j<6;j++)disk(ctx,Math.cos(j*TWO_PI/6)*r*.66,
  Math.sin(j*TWO_PI/6)*r*.66,2,C.ivory);
 ctx.restore();
}
function machines(ctx,state){
 for(let i=0;i<8;i++){
   const x=i*155-70-state.camera*.42;
   const y=384+(i%3)*18;
   rectangle(ctx,x,y-91,91,142,C.near);
   rectangle(ctx,x+8,y-105,16,106,C.shadow);
   rectangle(ctx,x+70,y-115,11,117,C.ink);
   gear(ctx,x+45,y-38,24,(state.ticks/90)*(i%2?1:-1));
   rectangle(ctx,x-4,y+21,99,9,C.copper);
   for(let j=0;j<6;j++)disk(ctx,x+7+j*15,y+25,2,C.gold);
 }
}
function platforms(ctx,state,surfaces){
 for(let i=0;i<surfaces.length;i++){
   const p=surfaces[i],x=p.x-state.camera;
   if(x>1000||x+p.w<0)continue;
   rectangle(ctx,x,p.y,p.w,540-p.y,i%2?C.metal:C.shadow);
   rectangle(ctx,x,p.y-9,p.w,9,C.brass);
   rectangle(ctx,x,p.y-13,p.w,4,C.ivory);
   stroke(ctx,x,p.y+13,x+p.w,p.y+13,C.copper,2);
   for(let j=12;j<p.w-4;j+=21){
     rectangle(ctx,x+j,p.y+26,12,8,C.ink);
     stroke(ctx,x+j+2,p.y+30,x+j+9,p.y+30,C.copper);
     disk(ctx,x+j,p.y+6,1.5,C.gold);
   }
   for(let t=22;t<p.w-12;t+=58){
     stroke(ctx,x+t,p.y+54,x+t+24,p.y+82,C.brass,1);
     stroke(ctx,x+t+24,p.y+54,x+t,p.y+82,C.brass,1);
   }
   for(const edge of [x+6,x+p.w-6]){
     stroke(ctx,edge,p.y-17,edge,p.y-3,C.ink,1.5);
     disk(ctx,edge,p.y-17,2.5,C.teal);
   }
 }
}
function sparkles(ctx,x,y,t){
 for(let j=0;j<5;j++){
   const a=j*TWO_PI/5+t*.03;
   const rx=x+Math.sin(a)*17,ry=y+Math.cos(a)*17;
   stroke(ctx,rx-2,ry,rx+2,ry,C.ivory);
   stroke(ctx,rx,ry-2,rx,ry+2,C.teal);
 }
}
function pickups(ctx,state){
 if(!state.action)return;
 for(const p of state.action.pickups){
   if(p.collected)continue;
   const x=p.x-state.camera,y=p.y;
   if(x<-40||x>1000)continue;
   disk(ctx,x,y,13,C.shadow);disk(ctx,x,y,10,C.brass);
   rectangle(ctx,x-6,y-8,12,2,C.ivory);
   rectangle(ctx,x-6,y+6,12,2,C.ivory);
   ctx.beginPath();ctx.moveTo(x-4,y-5);ctx.lineTo(x+4,y-5);
   ctx.lineTo(x,y);ctx.lineTo(x+4,y+5);ctx.lineTo(x-4,y+5);
   ctx.lineTo(x,y);ctx.closePath();ctx.fillStyle=C.teal;ctx.fill();
   disk(ctx,x,y,1.5,C.ivory);
   sparkles(ctx,x,y,state.ticks);
   const glint=goldenMotionPose(state).shardFrame;
   stroke(ctx,x-7+glint*4,y-5,x-4+glint*4,y-5,C.ivory,1.5);
 }
}
function sentries(ctx,state){
 if(!state.action)return;
 for(const e of state.action.enemies){
   if(!e.alive)continue;
   const x=e.x-state.camera,y=e.y,run=goldenMotionPose(state).sentryStep;
   if(x<-45||x>1000)continue;
   rectangle(ctx,x+2,y+4,27,25,C.ink);
   rectangle(ctx,x+5,y+7,21,18,C.copper);
   rectangle(ctx,x+6,y+9,19,2,C.gold);
   rectangle(ctx,x+9,y-6,4,13,C.brass);
   disk(ctx,x+11,y-7,4,C.coral);
   rectangle(ctx,x+9,y+13,5,6,C.ivory);
   rectangle(ctx,x+18,y+13,5,6,C.ivory);
   disk(ctx,x+11.5,y+16,1.7,C.ink);
   disk(ctx,x+20.5,y+16,1.7,C.ink);
   rectangle(ctx,x+12,y+23,9,3,C.brass);
   for(const s of [0,1]){
     rectangle(ctx,x+3+s*20,y+29+run*(s?1:-1),7,5,C.ink);
     disk(ctx,x+4+s*20,y+7,1.5,C.ivory);
   }
   stroke(ctx,x+6,y+27,x+24,y+27,C.gold);
   for(let k=0;k<3;k++)disk(ctx,x+10+k*6,y+4,1,C.ivory);
   rectangle(ctx,x+7,y+8,17,2,run?C.gold:C.teal);
   stroke(ctx,x+7,y+25,x+24,y+25,run?C.copper:C.brass);
 }
}
function impulses(ctx,state){
 if(!state.action)return;
 for(const shot of state.action.shots){
   const x=shot.x-state.camera,y=shot.y;
   if(x<-50||x>1000)continue;
   disk(ctx,x+6,y+3,10,C.shadow);
   disk(ctx,x+6,y+3,7,C.brass);
   rectangle(ctx,x+2,y+1,10,3,C.ivory);
   for(let i=0;i<3;i++)stroke(ctx,x-i*8,y+i*2,x-i*8-5,y+i*2,C.teal,2);
 }
}
function nilo(ctx,state){
 const x=state.x-state.camera,y=state.y;
 const pose=goldenMotionPose(state),running=pose.phase==="RUN",cycle=running&&pose.stride>0;
 // All details fit the original actor's logical collision footprint.
 rectangle(ctx,x+2,y-3,29,8,C.ink);
 rectangle(ctx,x+5,y-7,25,7,C.tealDark);
 rectangle(ctx,x+7,y-10,20,4,C.brass);
 rectangle(ctx,x-1,y+6,34,6,C.ink);
 rectangle(ctx,x+4,y+11,24,16,C.skin);
 rectangle(ctx,x+4,y+11,5,17,C.leather);
 rectangle(ctx,x+19,y+15,7,4,C.ink);
 disk(ctx,x+24,y+16,1.5,C.ivory);
 stroke(ctx,x+15,y+21,x+21,y+21,C.copper);
 rectangle(ctx,x+5,y+26,25,10,C.copper);
 rectangle(ctx,x+6,y+27,22,6,C.brass);
 rectangle(ctx,x+17,y+26,8,7,C.tealDark);
 disk(ctx,x+21,y+29,3.5,C.gold);
 rectangle(ctx,x+7,y+34,8,8,C.ink);
 rectangle(ctx,x+19,y+34+(cycle?1:0),8,8,C.ink);
 rectangle(ctx,x+8,y+37,6,2,C.ivory);
 rectangle(ctx,x+20,y+37+(cycle?1:0),6,2,C.ivory);
 rectangle(ctx,x-3,y+28,7,6,C.ink);
 rectangle(ctx,x+27,y+29,6,6,C.ink);
 rectangle(ctx,x-13-(cycle?3:0),y+21+pose.scarfLift,17,5,C.coral);
 stroke(ctx,x-12-(cycle?3:0),y+23+pose.scarfLift,x-19-(cycle?3:0),y+22+pose.scarfLift,C.ivory,1.5);
 if(!state.onGround){
   rectangle(ctx,x+26,y+19,10,3,C.brass);
   stroke(ctx,x+25,y+22,x+32,y+28,C.teal,1.5);
 }
 // Distinct, source-grounded pose details: eyes, run boots, airborne twist,
 // muzzle flare and temporary hurt warning are visual only.
 if(pose.blink)stroke(ctx,x+18,y+16,x+25,y+16,C.ink,2);
 else disk(ctx,x+24,y+16,1,C.ivory);
 if(pose.phase==="RUN"){
   stroke(ctx,x+9,y+40+pose.stride,x+14,y+40,C.gold,1.5);
   stroke(ctx,x+21,y+40-pose.stride,x+26,y+40,C.gold,1.5);
 }
 if(pose.phase==="AIR"){
   stroke(ctx,x+7,y+36,x+3,y+32,C.ivory,2);
   stroke(ctx,x+23,y+36,x+29,y+32,C.ivory,2);
 }
 if(pose.shotFlare){
   disk(ctx,x+(pose.facing===1?34:-6),y+28,5,C.brass);
   stroke(ctx,x+(pose.facing===1?29:-1),y+28,x+(pose.facing===1?42:-14),y+28,C.ivory,2);
 }
 if(pose.hurtFlash){
   stroke(ctx,x-4,y+5,x+34,y+5,C.coral,3);
   stroke(ctx,x-4,y+5,x-4,y+36,C.coral,2);
 }
 if(state.action&&state.action.health<3){
   stroke(ctx,x-5,y+10,x+1,y+4,C.coral,2);
 }
}
function tica(ctx,state){
 const pose=goldenMotionPose(state);
 const x=state.x-state.camera-27,y=state.y-38+
   Math.sin(state.ticks/19)*2.2;
 disk(ctx,x,y+7,11,C.brass);
 disk(ctx,x+3,y+5,8,C.teal);
 rectangle(ctx,x+4,y+2,4,3,C.ink);
 rectangle(ctx,x+12,y+8,7,4,C.coral);
 ctx.beginPath();ctx.ellipse(x-16,y+4+pose.wingLift,13,4,-.4,0,TWO_PI);
 ctx.fillStyle=C.ivory;ctx.fill();
 ctx.beginPath();ctx.ellipse(x+10,y-4-pose.wingLift,10,3,.4,0,TWO_PI);
 ctx.fillStyle=C.gold;ctx.fill();
 for(let j=0;j<4;j++)disk(ctx,x-8+j*4,y+16,1,C.ink);
 stroke(ctx,x-10,y+11,x+7,y+14,pose.wingLift<0?C.ivory:C.teal,1.5);
}
function cueLabels(ctx,state){
 const x=state.x-state.camera,y=state.y;
 ctx.font="bold 12px system-ui";
 ctx.textBaseline="alphabetic";
 ctx.fillStyle=C.ivory;ctx.fillText("NILO",Math.max(10,x-3),y-22);
 ctx.fillStyle=C.teal;ctx.fillText("TICA",Math.max(9,x-56),y-56);
}
export function renderGoldenMinute(ctx,state,surfaces,legacy=false){
 const plan=goldenMinutePlan(state,legacy);
 if(!plan)return false;
 if(!ctx||!Array.isArray(surfaces))throw new TypeError("native canvas and surfaces required");
 ctx.save();
 try{
   ctx.globalAlpha=plan.opacity;
   ctx.beginPath();ctx.rect(0,76,960,464);ctx.clip();
   cloudySky(ctx,state);
   brassClock(ctx,state);
   machines(ctx,state);
   platforms(ctx,state,surfaces);
   pickups(ctx,state);
   sentries(ctx,state);
   impulses(ctx,state);
   nilo(ctx,state);
   tica(ctx,state);
   cueLabels(ctx,state);
 }finally{ctx.restore();}
 return true;
}
