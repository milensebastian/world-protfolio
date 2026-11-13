import {useRef,useState,useEffect} from 'react'
import * as T from 'three'
import {scenery} from './scenery'
import {swallows} from './swallows'
import {person} from './characterArt'
import {residents} from './residents'
import {interactionManager,projectHosts} from './interactions'
import {stops,terrainHeight,walkHeight,seaLevel,type Point} from './geography'
import {island} from './island'
import {townAudio} from './townAudio'
import {villageLife} from './villageLife'
type Props={district:number;onDistrict:(n:number)=>void;onProject:(id:number)=>void;onJournal:(tab?:string)=>void;onPosition:(p:Point)=>void;travelRequest:number;paused:boolean;sound:boolean}
export default function World(props:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props),input=useRef(new Set<string>()),travel=useRef<(n:number)=>void>(()=>{}),interact=useRef(()=>{});latest.current=props
 const audio=useRef<ReturnType<typeof townAudio>|null>(null)
 useEffect(()=>{
   if(!props.sound)return
   const mix=townAudio();audio.current=mix
   return ()=>{mix.close();audio.current=null}
 },[props.sound])
 const bubble=useRef<HTMLDivElement>(null),speech=useRef<HTMLSpanElement>(null)
 const [projectName,setProjectName]=useState(''),[error,fail]=useState(false),[event,announce]=useState('')
 useEffect(()=>{travel.current(props.district)},[props.travelRequest])
 useEffect(()=>{if(props.paused){input.current.clear();audio.current?.quiet()}},[props.paused])
 useEffect(()=>{
 const el=host.current!;let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch{fail(true);return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;el.prepend(renderer.domElement);const canvas=renderer.domElement;canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none';canvas.setAttribute('aria-label','Three-dimensional town');const scene=new T.Scene();scene.background=new T.Color('#a9dce0');scene.fog=new T.FogExp2('#c1d9cd',.012);const {lots,planting,breeze,oak}=scenery(scene),animateIsland=island(scene,planting),life=villageLife(scene,planting.trunks,oak),animateBirds=swallows(scene),camera=new T.PerspectiveCamera(54,1,.12,180)
 const player=person(0);scene.add(player.root);const p=player.root.position
 const town=residents(scene,lots,planting.trunks),npcs=town.roster
 let district=-1,yaw=0,pitch=.16,zoom=7.35,dy=0,h=0,clock=0,vx=0,vz=0,phase=0,speaker=-1,project=-1,frame=0,drag=false,lastX=0,lastY=0
 const focus=new T.Vector3(),dest=new T.Vector3()
 const obstructed=(x:number,z:number,r:number)=>walkHeight(x,z)<seaLevel-.45||Math.hypot(x,z)<2.2+r||lots.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)
 function warp(n:number){district=n;const [x,z]=stops[n]??stops[0];const spawnZ=z+(n===0?5.7:2.8);p.set(x,walkHeight(x,spawnZ)+.25,spawnZ);latest.current.onPosition([p.x,p.z]);player.root.rotation.y=Math.PI;yaw=0;h=dy=vx=vz=0;camera.position.set(p.x,p.y+4.24,p.z+7.6);camera.lookAt(p.x,1,p.z)}
 travel.current=warp;warp(latest.current.district)
 const manager=interactionManager(npcs.length),anchor=new T.Vector3()
 const candidates=npcs.map(n=>({name:n.name,distanceSq:Infinity,visible:false,available:true,x:0,y:0}))
 function talk(){
   if(!latest.current.paused&&project===-2){latest.current.onProject(1);return}
   if(!latest.current.paused&&(project===-6||project===-7)){latest.current.onProject(project===-6?0:1);return}
   if(!latest.current.paused&&project===-5){latest.current.onJournal('About');return}
   if(!latest.current.paused&&project===-4){latest.current.onJournal('Contact');return}
   if(!latest.current.paused&&project===-3){latest.current.onJournal('Education');return}
   if(!latest.current.paused&&project>=0&&npcs[project].root.position.distanceToSquared(p)<=9)
     latest.current.onProject(projectHosts[npcs[project].name])
 }
 interact.current=talk
 const key=(e:KeyboardEvent)=>{if(latest.current.paused||e.ctrlKey||e.metaKey||e.altKey)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space','ShiftLeft','ShiftRight','KeyE'].includes(e.code)){e.preventDefault();input.current.add(e.code);if(e.code==='KeyE'&&!e.repeat)talk()}}
 const release=(e:KeyboardEvent)=>{input.current.delete(e.code)},clear=()=>input.current.clear()
 const down=(e:PointerEvent)=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)},up=()=>{drag=false},move=(e:PointerEvent)=>{if(!drag||latest.current.paused)return;yaw-=(e.clientX-lastX)*.007;pitch=T.MathUtils.clamp(pitch+(e.clientY-lastY)*.005,.12,1.08);lastX=e.clientX;lastY=e.clientY},wheel=(e:WheelEvent)=>{e.preventDefault();zoom=T.MathUtils.clamp(zoom+e.deltaY*.009,3.5,12)}
 window.addEventListener('keydown',key);window.addEventListener('keyup',release);window.addEventListener('blur',clear);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false})
 const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()});resize.observe(el)
 let last=performance.now();const tick=(now:number)=>{frame=requestAnimationFrame(tick);const dt=Math.min(.045,(now-last)/1000);last=now;if(latest.current.paused)return;clock+=dt;animateBirds(clock);animateIsland(clock)
 const k=input.current,has=(...a:string[])=>a.some(c=>k.has(c));let x=Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft')),z=Number(has('KeyS','ArrowDown'))-Number(has('KeyW','ArrowUp'));const speed=has('ShiftLeft','ShiftRight')?7:3.8,scale=speed/Math.max(1,Math.hypot(x,z));x*=scale;z*=scale
 vx=T.MathUtils.damp(vx,x*Math.cos(yaw)+z*Math.sin(yaw),14,dt);vz=T.MathUtils.damp(vz,-x*Math.sin(yaw)+z*Math.cos(yaw),14,dt)
 const oldX=p.x,oldZ=p.z
 if(!obstructed(p.x+vx*dt,p.z,.33))p.x+=vx*dt;if(!obstructed(p.x,p.z+vz*dt,.33))p.z+=vz*dt
 if(k.delete('Space')&&h<=.001)dy=6;dy-=16*dt;h=Math.max(0,h+dy*dt);if(!h)dy=0;p.y=walkHeight(p.x,p.z)+.25+h;if(p.x!==oldX||p.z!==oldZ)latest.current.onPosition([p.x,p.z])
 const dx=p.x-oldX,dz=p.z-oldZ,distance=Math.hypot(dx,dz),speedNow=distance/Math.max(dt,.001)
 let turn=0
 if(speedNow>.05){const target=Math.atan2(dx,dz),delta=target-player.root.rotation.y;turn=Math.atan2(Math.sin(delta),Math.cos(delta));player.root.rotation.y+=turn*(1-Math.exp(-dt*17))}
 if(h<=.001)phase+=distance*(speedNow>4.6?2.65:3.9)
 player.animate(h>.001?'jump':speedNow>4.6?'run':speedNow>.05?'walk':'idle',phase,speedNow,clock,dt,T.MathUtils.clamp(turn,-1,1),dy)
 let best=0,bestD=Infinity;stops.forEach(([x,z],i)=>{const d=Math.hypot(p.x-x,p.z-z);if(d<bestD){bestD=d;best=i}});if(best!==district){district=best;latest.current.onDistrict(best)}
 town.tick(dt,clock,p,announce,speaker)
 breeze.value=clock;life(clock,dt,p,Math.hypot(npcs[8].root.position.x+8,npcs[8].root.position.z+6.19)<.68)
 focus.set(p.x,p.y+1.1,p.z);let arm=zoom;for(let d=.5;d<=zoom;d+=.45){const cx=p.x+Math.sin(yaw)*d*Math.cos(pitch),cz=p.z+Math.cos(yaw)*d*Math.cos(pitch);if(lots.some(b=>Math.abs(cx-b.x)<b.w*.5+.3&&Math.abs(cz-b.z)<b.d*.5+.3)){arm=Math.max(1,d-.5);break}}
 dest.set(focus.x+Math.sin(yaw)*Math.cos(pitch)*arm,focus.y+Math.sin(pitch)*arm,focus.z+Math.cos(yaw)*Math.cos(pitch)*arm);dest.y=Math.max(dest.y,terrainHeight(dest.x,dest.z)+.5);camera.position.lerp(dest,1-Math.exp(-10*dt));camera.lookAt(focus);camera.updateMatrixWorld()
 for(let i=0;i<npcs.length;i++){
   const n=npcs[i],c=candidates[i]
   c.distanceSq=n.root.position.distanceToSquared(p);c.available=town.available(i)
   if(c.distanceSq>11){c.visible=false;continue}
   anchor.copy(n.root.position);anchor.y+=(n.action==='ride'?2.35:2.1)*n.root.scale.y
   anchor.project(camera);c.x=anchor.x;c.y=anchor.y
   c.visible=Math.abs(anchor.x)<.97&&anchor.y<.93&&anchor.y>-.96&&Math.abs(anchor.z)<1
 }
 const result=manager.update(clock,candidates)
 let destination=result.project
 if(destination<0&&Math.hypot(p.x+24,p.z-24)<4)destination=-2
 if(destination<0&&Math.hypot(p.x-24,p.z+24)<4)destination=-3
 if(destination<0&&Math.hypot(p.x-42,p.z+31)<4)destination=-4
 if(destination<0&&Math.hypot(p.x+8,p.z+5.8)<2.7)destination=-5
 if(destination<0&&Math.hypot(p.x+6,p.z+23.4)<3)destination=-3
 if(destination<0&&Math.hypot(p.x-24,p.z+2.6)<2.7)destination=-6
 if(destination<0&&Math.hypot(p.x+7,p.z-22.6)<2.7)destination=-7
 if(destination!==project){
   project=destination;setProjectName(project===-6?'StegoVault':project===-7?'workshop projects':project===-5?'meet Milen':project===-4?'contact Milen':project===-2?'creative experiments':project===-3?'achievements':project<0?'':projectHosts[npcs[project].name]===0?'StegoVault':'Workshop projects')
 }
 const node=bubble.current
 if(node&&speech.current){
   if(result.active>=0){
     const c=candidates[result.active],x=(c.x+1)*.5*el.clientWidth,y=(1-c.y)*.5*el.clientHeight
     const margin=Math.min(112,el.clientWidth*.34),cx=T.MathUtils.clamp(x,margin,el.clientWidth-margin)
     node.style.transform='translate('+cx+'px,'+y+'px)';node.style.setProperty('--tip',(x-cx)+'px')
     if(result.active!==speaker)speech.current.textContent=result.line
   }
   if(result.active!==speaker){node.dataset.visible=String(result.active>=0);node.setAttribute('aria-hidden',String(result.active<0))}
 }
 speaker=result.active;audio.current?.tick(clock,p,yaw,speaker>=0);renderer.render(scene,camera)
 };tick(last)
 return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('keydown',key);window.removeEventListener('keyup',release);window.removeEventListener('blur',clear);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);scene.traverse(obj=>{if(obj instanceof T.Mesh||obj instanceof T.Points){obj.geometry.dispose();const m=Array.isArray(obj.material)?obj.material:[obj.material];m.forEach(a=>{if(a.map)a.map.dispose();a.dispose()})}});renderer.dispose();canvas.remove();input.current.clear()}
 },[])
 return <div className="playfield" ref={host}>{error?<div className="game-fallback"><h2>Explore the field journal</h2><p>This browser could not start the 3D renderer.</p><button onClick={()=>props.onJournal()}>Open field journal</button></div>:<><div className="npc-anchor" ref={bubble} hidden={props.paused}><span className="npc-speech" ref={speech} role="status" aria-live="polite"/></div>{projectName&&!props.paused&&<button className="talk" onClick={()=>interact.current()}><kbd>E</kbd> Explore {projectName}</button>}{event&&<div className="town-event" role="status">{event}</div>}<div className="touchpad">{[['KeyW','↑','Forward'],['KeyA','←','Left'],['KeyS','↓','Back'],['KeyD','→','Right'],['Space','↥','Jump']].map(([code,label,desc])=><button key={code} aria-label={desc} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);input.current.add(code)}} onPointerUp={()=>input.current.delete(code)} onPointerCancel={()=>input.current.delete(code)}>{label}</button>)}</div></>}</div>
}


