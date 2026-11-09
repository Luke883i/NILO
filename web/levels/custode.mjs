/** Custode encounter rules: pure FSM, not another physics engine. */
export const CUSTODE=Object.freeze({
  id:'CH-CUSTODE',gateX:2190,strikeMinX:2160,strikeMaxX:2332,
  repairMinX:2160,repairMaxX:2332,telegraphTicks:60,
  strikeTicks:18,recoveryTicks:90,requiredRepairs:2,maxHits:2
});
export const initialCustode=()=>({phase:'LOCKED',clock:0,repairs:0,hits:0,
  hitThisStrike:false,repairedThisRecovery:false});
export const enterCustode=b=>b.phase==='LOCKED'?
  {...initialCustode(),phase:'TELEGRAPH'}:b;
/** One real repair key edge in recovery; never reward location alone. */
export function advanceCustode(b,{inStrikeZone=false,grounded=false,
  nearMechanism=false,repairPressed=false}={}){
  if(!['TELEGRAPH','STRIKE','RECOVERY'].includes(b.phase))return b;
  const n={...b,clock:b.clock+1};
  if(b.phase==='TELEGRAPH'&&n.clock>=CUSTODE.telegraphTicks)
    return {...n,phase:'STRIKE',clock:0,hitThisStrike:false};
  if(b.phase==='STRIKE'){
    if(!n.hitThisStrike&&inStrikeZone&&grounded){
      n.hits+=1;n.hitThisStrike=true;
      if(n.hits>=CUSTODE.maxHits)return {...n,phase:'DEFEAT'};
    }
    if(n.clock>=CUSTODE.strikeTicks)
      return {...n,phase:'RECOVERY',clock:0,repairedThisRecovery:false};
  }
  if(b.phase==='RECOVERY'){
    if(!n.repairedThisRecovery&&repairPressed&&nearMechanism&&grounded){
      n.repairs+=1;n.repairedThisRecovery=true;
      if(n.repairs>=CUSTODE.requiredRepairs)return {...n,phase:'VICTORY'};
    }
    if(n.clock>=CUSTODE.recoveryTicks)
      return {...n,phase:'TELEGRAPH',clock:0,hitThisStrike:false};
  }
  return n;
}
