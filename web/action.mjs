/** NILO NEXT action slice. Pure rules: no DOM, wall clock, storage or random calls.
 * LV-01 only until its novice playtest and negative browser tests are approved.
 * Input and progression belong to the shared game core, not to the renderer.
 */
export const ACTION_CFG = Object.freeze({
  maxHealth:3, projectileSpeed:620, projectileWidth:12, projectileHeight:6,
  cooldownTicks:16, invulnerabilityTicks:75, maxProjectiles:4,
  stompBounce:-390, enemyWidth:28, enemyHeight:30
});
const BASE_ENEMIES=Object.freeze([
  Object.freeze({id:'cortile-sentry-01',x:492,y:410,minX:440,maxX:542,speed:34}),
  Object.freeze({id:'cortile-sentry-02',x:1505,y:390,minX:1460,maxX:1615,speed:28})
]);
const BASE_SHARDS=Object.freeze([
  Object.freeze({id:'shard-01',x:178,y:434}),
  Object.freeze({id:'shard-02',x:744,y:382}),
  Object.freeze({id:'shard-03',x:1595,y:380})
]);
export function initialAction(level='LV-01'){
  if(level!=='LV-01')return null;
  return {health:ACTION_CFG.maxHealth,invulnerable:0,cooldown:0,facing:1,
    shots:[],kills:0,shards:0,
    enemies:BASE_ENEMIES.map(e=>({...e,direction:-1,alive:true})),
    pickups:BASE_SHARDS.map(p=>({...p,collected:false}))};
}
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function crossedShot(shot,oldX,enemy){
  // Horizontal swept AABB avoids tunneling even if tick or speed changes.
  const left=Math.min(oldX,shot.x),right=Math.max(oldX,shot.x)+ACTION_CFG.projectileWidth;
  return left<enemy.x+ACTION_CFG.enemyWidth && right>enemy.x &&
    shot.y<enemy.y+ACTION_CFG.enemyHeight &&
    shot.y+ACTION_CFG.projectileHeight>enemy.y;
}
function blockedShot(shot,oldX,platforms){
  const left=Math.min(oldX,shot.x),right=Math.max(oldX,shot.x)+ACTION_CFG.projectileWidth;
  return platforms.some(p=>left<p.x+p.w&&right>p.x&&
    shot.y<p.y+540&&shot.y+ACTION_CFG.projectileHeight>p.y);
}
export function advanceAction(action,player,input,dt,platforms){
  if(!action)return {action:null,stomp:false,hit:false};
  if(!Number.isFinite(dt)||dt<=0||dt>1/15)throw new RangeError('bounded action tick required');
  const facing=input.right?1:input.left?-1:action.facing;
  let cooldown=Math.max(0,action.cooldown-1);
  const invulnerable=Math.max(0,action.invulnerable-1);
  const enemies=action.enemies.map(e=>{
    if(!e.alive)return {...e};
    let x=e.x+e.speed*e.direction*dt,direction=e.direction;
    if(x<e.minX){x=e.minX;direction=1;}
    if(x>e.maxX){x=e.maxX;direction=-1;}
    return {...e,x,direction};
  });
  let kills=action.kills,shots=action.shots.map(s=>({...s}));
  if(input.attackPressed && cooldown===0 && shots.length<ACTION_CFG.maxProjectiles){
    shots.push({x:player.x+(facing>0?26:-12),y:player.y+18,dir:facing});
    cooldown=ACTION_CFG.cooldownTicks;
  }
  const remaining=[];
  for(const s of shots){
    const prior=s.x,next={...s,x:s.x+s.dir*ACTION_CFG.projectileSpeed*dt};
    if(next.x<0||next.x>player.worldWidth)continue;
    if(blockedShot(next,prior,platforms))continue;
    const victim=enemies.find(e=>e.alive&&crossedShot(next,prior,e));
    if(victim){victim.alive=false;kills++;continue;}
    remaining.push(next);
  }
  const hero={x:player.x,y:player.y,w:player.w,h:player.h};
  let health=action.health,hit=false,stomp=false;
  for(const enemy of enemies){
    if(!enemy.alive||!overlap(hero,{x:enemy.x,y:enemy.y,w:ACTION_CFG.enemyWidth,h:ACTION_CFG.enemyHeight}))continue;
    const downward=player.vy>0&&player.prevBottom<=enemy.y+8;
    if(downward){enemy.alive=false;kills++;stomp=true;continue;}
    if(invulnerable===0&&!hit){health=Math.max(0,health-1);hit=true;}
  }
  const pickups=action.pickups.map(p=>{
    if(p.collected)return {...p};
    return {...p,collected:overlap(hero,{x:p.x-9,y:p.y-9,w:18,h:18})};
  });
  const shards=pickups.filter(p=>p.collected).length;
  return {action:{health,invulnerable:hit?ACTION_CFG.invulnerabilityTicks:invulnerable,
    cooldown,facing,shots:remaining,kills,shards,enemies,pickups},hit,stomp};
}
