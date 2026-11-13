import {useRef,useState,useEffect} from 'react'
import * as T from 'three'
import {scenery,stops} from './scenery'
import {swallows} from './swallows'
import {person} from './characterArt'
import {residents} from './residents'
type Props={district:number;onDistrict:(n:number)=>void;onInteract:(n:number,speaker?:string)=>void;paused:boolean;sound:boolean}
export default function World(props:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props),input=useRef(new Set<string>()),travel=useRef<(n:number)=>void>(()=>{}),interact=useRef(()=>{});latest.current=props
 const [near,setNear]=useState(''),[error,fail]=useState(false),[event,announce]=useState('')
 useEffect(()=>{travel.current(props.district)},[props.district])
 useEffect(()=>{if(props.paused)input.current.clear()},[props.paused])
 useEffect(()=>{
 const el=host.current!;let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch{fail(true);return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;el.prepend(renderer.domElement);const canvas=renderer.domElement;canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none';canvas.setAttribute('aria-label','Three-dimensional town');const scene=new T.Scene();scene.background=new T.Color('#a9dce0');scene.fog=new T.FogExp2('#c1d9cd',.012);const lots=scenery(scene),animateBirds=swallows(scene),camera=new T.PerspectiveCamera(54,1,.12,180)
 const player=person(0);scene.add(player.root);const p=player.root.position
 const town=residents(scene,lots),npcs=town.roster
 let district=-1,yaw=0,pitch=.23,zoom=8,dy=0,h=0,clock=0,vx=0,vz=0,phase=0,current=-1,frame=0,drag=false,lastX=0,lastY=0
 const focus=new T.Vector3(),dest=new T.Vector3()
 const obstructed=(x:number,z:number,r:number)=>Math.abs(x)>43||Math.abs(z)>43||Math.hypot(x,z)<2.2+r||lots.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)
 function warp(n:number){if(n===district)return;district=n;const [x,z]=stops[n]??stops[0];p.set(x,.16,z+(n===0?5.7:2.8));player.root.rotation.y=Math.PI;yaw=0;h=dy=vx=vz=0;camera.position.set(p.x,4.4,p.z+7.6);camera.lookAt(p.x,1,p.z)}
 travel.current=warp;warp(latest.current.district)
 function talk(){if(!latest.current.paused&&current>=0){const n=npcs[current];n.root.rotation.y=Math.atan2(p.x-n.root.position.x,p.z-n.root.position.z);latest.current.onInteract(n.bike?district:n.region,n.name)}}interact.current=talk
 const key=(e:KeyboardEvent)=>{if(latest.current.paused||e.ctrlKey||e.metaKey||e.altKey)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space','ShiftLeft','ShiftRight','KeyE'].includes(e.code)){e.preventDefault();input.current.add(e.code);if(e.code==='KeyE'&&!e.repeat)talk()}}
 const release=(e:KeyboardEvent)=>{input.current.delete(e.code)},clear=()=>input.current.clear()
 const down=(e:PointerEvent)=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)},up=()=>{drag=false},move=(e:PointerEvent)=>{if(!drag||latest.current.paused)return;yaw-=(e.clientX-lastX)*.007;pitch=T.MathUtils.clamp(pitch+(e.clientY-lastY)*.005,.12,1.08);lastX=e.clientX;lastY=e.clientY},wheel=(e:WheelEvent)=>{e.preventDefault();zoom=T.MathUtils.clamp(zoom+e.deltaY*.009,3.5,12)}
 window.addEventListener('keydown',key);window.addEventListener('keyup',release);window.addEventListener('blur',clear);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false})
 const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()});resize.observe(el)
 let last=performance.now();const tick=(now:number)=>{frame=requestAnimationFrame(tick);const dt=Math.min(.045,(now-last)/1000);last=now;if(latest.current.paused)return;clock+=dt;animateBirds(clock)
 const k=input.current,has=(...a:string[])=>a.some(c=>k.has(c));let x=Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft')),z=Number(has('KeyS','ArrowDown'))-Number(has('KeyW','ArrowUp'));const speed=has('ShiftLeft','ShiftRight')?7:3.8,scale=speed/Math.max(1,Math.hypot(x,z));x*=scale;z*=scale
 vx=T.MathUtils.damp(vx,x*Math.cos(yaw)+z*Math.sin(yaw),14,dt);vz=T.MathUtils.damp(vz,-x*Math.sin(yaw)+z*Math.cos(yaw),14,dt)
 const oldX=p.x,oldZ=p.z
 if(!obstructed(p.x+vx*dt,p.z,.33))p.x+=vx*dt;if(!obstructed(p.x,p.z+vz*dt,.33))p.z+=vz*dt
 if(k.delete('Space')&&h<=.001)dy=6;dy-=16*dt;h=Math.max(0,h+dy*dt);if(!h)dy=0;p.y=.16+h
 const dx=p.x-oldX,dz=p.z-oldZ,distance=Math.hypot(dx,dz),speedNow=distance/Math.max(dt,.001)
 let turn=0
 if(speedNow>.05){const target=Math.atan2(dx,dz),delta=target-player.root.rotation.y;turn=Math.atan2(Math.sin(delta),Math.cos(delta));player.root.rotation.y+=turn*(1-Math.exp(-dt*17))}
 if(h<=.001)phase+=distance*(speedNow>4.6?2.65:3.9)
 player.animate(h>.001?'jump':speedNow>4.6?'run':speedNow>.05?'walk':'idle',phase,speedNow,clock,dt,T.MathUtils.clamp(turn,-1,1),dy)
 let best=0,bestD=Infinity;stops.forEach(([x,z],i)=>{const d=Math.hypot(p.x-x,p.z-z);if(d<bestD){bestD=d;best=i}});if(best!==district){district=best;latest.current.onDistrict(best)}
 const closest=town.tick(dt,clock,p,announce)
 if(current!==closest){current=closest;setNear(current<0?'':npcs[current].name)}
 focus.set(p.x,p.y+1.1,p.z);let arm=zoom;for(let d=.5;d<=zoom;d+=.45){const cx=p.x+Math.sin(yaw)*d*Math.cos(pitch),cz=p.z+Math.cos(yaw)*d*Math.cos(pitch);if(lots.some(b=>Math.abs(cx-b.x)<b.w*.5+.3&&Math.abs(cz-b.z)<b.d*.5+.3)){arm=Math.max(1,d-.5);break}}
 dest.set(focus.x+Math.sin(yaw)*Math.cos(pitch)*arm,focus.y+Math.sin(pitch)*arm,focus.z+Math.cos(yaw)*Math.cos(pitch)*arm);camera.position.lerp(dest,1-Math.exp(-10*dt));camera.lookAt(focus);renderer.render(scene,camera)
 };tick(last)
 return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('keydown',key);window.removeEventListener('keyup',release);window.removeEventListener('blur',clear);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);scene.traverse(obj=>{if(obj instanceof T.Mesh){obj.geometry.dispose();const m=Array.isArray(obj.material)?obj.material:[obj.material];m.forEach(a=>{if(a.map)a.map.dispose();a.dispose()})}});renderer.dispose();canvas.remove();input.current.clear()}
 },[])
 return <div className="playfield" ref={host}>{error?<div className="game-fallback"><h2>Explore the field journal</h2><p>This browser could not start the 3D renderer.</p><button onClick={()=>props.onInteract(props.district)}>Meet the district guide</button></div>:<>{near&&!props.paused&&<button className="talk" onClick={()=>interact.current()}><kbd>E</kbd> Talk to {near}</button>}{event&&<div className="town-event" role="status">{event}</div>}<div className="touchpad">{[['KeyW','↑','Forward'],['KeyA','←','Left'],['KeyS','↓','Back'],['KeyD','→','Right'],['Space','↥','Jump']].map(([code,label,desc])=><button key={code} aria-label={desc} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);input.current.add(code)}} onPointerUp={()=>input.current.delete(code)} onPointerCancel={()=>input.current.delete(code)}>{label}</button>)}</div></>}</div>
}


