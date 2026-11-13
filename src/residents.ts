import * as T from 'three'
import {person} from './characterArt'
import {people} from './scenery'
import {bicycle} from './bicycle'
import type {Activity} from './poses'

type Stop={x:number;z:number;action:Activity;seconds:number;facing:number}
const stop=(x:number,z:number,action:Activity='idle',seconds=1,facing=0):Stop=>({x,z,action,seconds,facing})
// Cyclic centerlines follow the existing streets. Destinations beside a bench
// use a frontal approach; only the seated pose settles onto the seat.
const routes:Stop[][]=[
  [stop(1,4,'wave',5),stop(3.8,3.2),stop(3.9,-.5,'idle',5),stop(3.8,3.2)],
  [stop(27,1,'work',8),stop(26,-1.2),stop(24,-2.7,'work',5),stop(26,-1.2)],
  [stop(1,27,'work',7),stop(-1.5,27),stop(-2.6,24.2,'work',5),stop(-1.5,27)],
  [stop(1,-27,'idle',5),stop(3,-25.1),stop(3,-24,'sit',12,Math.PI),stop(3,-25.1)],
  [stop(-27,1,'work',7),stop(-27.65,-1),stop(-27.65,-3.98),stop(-26,-3.98),stop(-26,-3,'sit',8,Math.PI),stop(-26,-3.98),stop(-27.65,-3.98),stop(-27.65,-1)],
  [stop(-4,-2,'idle',3),stop(-4.5,-4.7,'work',6),stop(-5.85,-4.52,'talk',6),stop(-4.5,-4.7)],
  [stop(5,1),stop(5.6,-1.5),stop(4,-2.9),stop(-2,-3.2),stop(-3.4,-1.7),stop(-3.4,1.4),stop(-2,3.4),stop(2,3.4),stop(4,2.7)],
  [stop(-3.7,1.5,'sweep',7),stop(-3.4,-1.2,'sweep',6),stop(-4.3,-2.9,'sweep',8),stop(-3.4,-1.2)],
  [stop(-6.15,-5.6,'work',5),stop(-7.25,-5.6,'work',4),stop(-6.9,-5.6,'work',3)],
  [stop(7.6,.9),stop(18,.9),stop(27,.9),stop(29,1),stop(30,0),stop(29,-1.1),stop(17,-1.1),stop(8,-1.1),stop(6.8,0)]
]
const names=[...people,'Street cleaner','Market baker','Cycle mechanic']
const lines=[
  ['The map says my stall is here. Good news for the bread.','Can you mark the cinnamon rolls, too?'],
  ['One bouquet for the window?','Make it two. The oven gets jealous.'],
  ['The courier called this express flour.','Did it arrive already risen?']
]
export function residents(scene:T.Scene,lots:{x:number;z:number;w:number;d:number}[]){
  // Verify the entire segment, including its return edge, against solid scenery.
  const clear=(a:Stop,b:Stop)=>{
    const count=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.25))
    for(let k=0;k<=count;k++){const t=k/count,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t
      if(Math.hypot(x,z)<2.65||lots.some(p=>Math.abs(x-p.x)<p.w/2+.24&&Math.abs(z-p.z)<p.d/2+.24))return false
    }return true
  }
  const roster=routes.map((route,i)=>{
    if(!route.every((a,j)=>clear(a,route[(j+1)%route.length])))throw new Error('Blocked resident route: '+names[i])
    const actor=person(i+1),bike=i===6||i===9?bicycle(i===6?'#a86b47':'#498787'):undefined
    scene.add(actor.root);if(bike)scene.add(bike.group)
    const first=route[0];actor.root.position.set(first.x,.15,first.z);actor.root.rotation.y=first.facing
    return {...actor,name:names[i],region:i<5?i:0,route,index:0,wait:bike?0:first.seconds,distance:0,bike,
      action:first.action,react:0,reaction:'wave' as Activity,heading:first.facing}
  })
  let nextEvent=18,clearAt=0,chat=0,chatIndex=0,replied=false,nextChat=0
  function tick(dt:number,time:number,player:T.Vector3,announce:(s:string)=>void){
    const florist=roster[5],baker=roster[8]
    if(!chat&&time>nextChat&&florist.index===2&&florist.wait>0&&florist.root.position.distanceTo(baker.root.position)<2){
      chat=5;chatIndex=(chatIndex+1)%lines.length;replied=false
      if(player.distanceTo(baker.root.position)<9){announce('Market baker: “'+lines[chatIndex][0]+'”');clearAt=time+5}
    }
    if(chat>0){chat=Math.max(0,chat-dt);if(chat<2.5&&!replied){replied=true;if(player.distanceTo(baker.root.position)<9){announce('Florist: “'+lines[chatIndex][1]+'”');clearAt=time+3}}if(!chat)nextChat=time+20}
    if(time>nextEvent){
      const options=roster.filter(n=>n.root.position.distanceTo(player)<12&&!n.bike&&n.action!=='sit'&&n!==baker&&n!==florist)
      const n=options[Math.floor(Math.random()*options.length)]
      if(n&&!chat){const choices=[['wave','waves at a swallow. It ignores the invitation.'],['work','checks both pockets. The missing pencil is behind one ear.'],['talk','rehearses a grand announcement for an audience of cobblestones.']] as const
        const [action,line]=choices[Math.floor(Math.random()*choices.length)];n.react=3.5;n.reaction=action;announce(n.name+' '+line);clearAt=time+4}
      nextEvent=time+20+Math.random()*16
    }
    if(clearAt&&time>=clearAt){announce('');clearAt=0}
    let closest=-1,best=3.45
    roster.forEach((n,i)=>{
      const p=n.root.position,here=n.route[n.index],to=n.route[(n.index+1)%n.route.length]
      let moved=0,action:Activity
      if(chat>0&&(n===florist||n===baker)){
        action='talk';const other=n===baker?florist.root.position:baker.root.position;n.heading=Math.atan2(other.x-p.x,other.z-p.z)
      }else if(n.react>0){n.react-=dt;action=n.reaction;n.heading=Math.atan2(player.x-p.x,player.z-p.z)}
      else if(n.wait>0){n.wait-=dt;action=here.action;n.heading=here.facing}
      else{
        const dx=to.x-p.x,dz=to.z-p.z,len=Math.hypot(dx,dz),speed=n.bike?2.25:.77+(i%3)*.085
        moved=Math.min(len,dt*speed)
        // Cyclists yield before their front wheel reaches a pedestrian.
        if(n.bike&&len>.001){const aheadX=p.x+dx/len*.83,aheadZ=p.z+dz/len*.83
          if(Math.hypot(player.x-aheadX,player.z-aheadZ)<.63||roster.some(o=>o!==n&&Math.hypot(o.root.position.x-aheadX,o.root.position.z-aheadZ)<.51))moved=0}
        if(len>.001){p.x+=dx/len*moved;p.z+=dz/len*moved;n.heading=Math.atan2(dx,dz)}
        n.distance+=moved;action=n.bike?'ride':'walk'
        if(len<=moved+.001){n.index=(n.index+1)%n.route.length;n.wait=n.bike?0:to.seconds}
      }
      n.root.rotation.y+=Math.atan2(Math.sin(n.heading-n.root.rotation.y),Math.cos(n.heading-n.root.rotation.y))*(1-Math.exp(-dt*9))
      n.action=action;n.animate(action,n.distance*(n.bike?3.6:4.1),moved/Math.max(dt,.001),time,dt)
      if(n.bike){n.bike.group.position.copy(p);n.bike.group.rotation.y=n.root.rotation.y;n.bike.spin(moved)}
      const d=p.distanceTo(player);if(d<best){closest=i;best=d}
    });return closest
  }
  return {roster,tick}
}
