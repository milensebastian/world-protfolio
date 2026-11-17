import * as T from 'three'

export type Activity='idle'|'walk'|'run'|'jump'|'sit'|'talk'|'sweep'|'work'|'ride'|'wave'|'swim'
type Rig={body:T.Group;head:T.Group;arms:T.Group[];legs:T.Group[];knees:T.Group[];elbows:T.Group[]}
export function pose(r:Rig,role:number){
  const smooth=(o:T.Euler,key:'x'|'z',target:number,blend:number)=>{o[key]+=(target-o[key])*blend}
  return (action:Activity,phase:number,speed:number,time:number,dt:number,turn=0,lift=0)=>{
    const blend=1-Math.exp(-dt*14),run=action==='run',walking=run||action==='walk'
    const stride=walking?Math.min(1,speed/(run?5:1.4)):0
    const breath=Math.sin(time*2.1+role),step=Math.sin(phase),talk=Math.sin(time*3+role)
    let height=.007*breath+Math.abs(step)*stride*(run?.07:.034)
    let lean=run?.16:stride*.04
    if(action==='sit')height=-.13
    if(action==='ride'){height=.17;lean=.17}
    if(action==='sweep'||action==='work')lean=.12+.045*talk
    r.body.position.y+=(height-r.body.position.y)*blend
    smooth(r.body.rotation,'x',lean,blend)
    smooth(r.body.rotation,'z',-turn*.11+step*stride*.029,blend)
    r.head.rotation.y+=(turn*.3+Math.sin(time*.57+role)*(action==='idle'?.22:.055)*(1-stride)-r.head.rotation.y)*blend
    smooth(r.head.rotation,'x',action==='work'||action==='sweep'?.18:action==='talk'?talk*.09:-lean*.5,blend)
    for(let i=0;i<2;i++){
      const s=i===0?-1:1,v=step*s
      let hip=v*stride*(run?.97:.7),knee=Math.max(0,Math.sin(phase+s*.56)*s)*stride*(run?1.3:.78)
      let arm=-hip*.88,elbow=-.12-(run?.94:.26)*stride,spread=s*.045
      if(action==='jump'){hip=i===0?-.63:-.14;knee=i===0?.97:.55;arm=-.46+lift*.065;elbow=-.6;spread=s*.25}
      if(action==='swim'){arm=-1.08+Math.sin(time*3+s)*.58;elbow=-.65;spread=s*.65;hip=s*Math.sin(time*4)*.31;knee=.47}
      if(action==='sit'){hip=-1.52;knee=1.58;arm=-.36;elbow=-.97}
      if(action==='ride'){hip=-.93+s*step*.42;knee=1.24-s*step*.58;arm=-.87;elbow=-.34}
      if(action==='idle'){arm=breath*.045;elbow=-.14-.07*Math.sin(time*.8+role)}
      if(action==='talk'||action==='wave'){if(i===1){arm=-.52+talk*.18;elbow=-1.23;spread=.18+talk*.16}else{arm=-.16;elbow=-.42}}
      if(action==='sweep'){arm=-.64+.27*talk+(i?.18:0);elbow=-.38;spread=s*.14+talk*.22}
      if(action==='work'){arm=-.57+Math.sin(time*2.8+i)*.22;elbow=-.96+talk*.16}
      smooth(r.legs[i].rotation,'x',hip,blend);smooth(r.knees[i].rotation,'x',knee,blend)
      smooth(r.arms[i].rotation,'x',arm,blend);smooth(r.arms[i].rotation,'z',spread,blend)
      smooth(r.elbows[i].rotation,'x',elbow,blend)
    }
  }
}
