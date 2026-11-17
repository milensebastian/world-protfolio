import {useRef,useState,useEffect} from 'react'
import * as T from 'three'
import {scenery} from './scenery'
import {swallows} from './swallows'
import {person} from './characterArt'
import {residents} from './residents'
import {interactionManager,projectHosts} from './interactions'
import {stops,terrainHeight,walkHeight,type Point} from './geography'
import {Globe2,Footprints} from 'lucide-react'
import {radius,toGlobe,toPlan,normalAt,transport,surfaceHeight,roundWorld,onWater} from './planet'
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
 const switchView=useRef(()=>{}),[overview,setOverview]=useState(true)
 const bubble=useRef<HTMLDivElement>(null),speech=useRef<HTMLSpanElement>(null)
 const [projectName,setProjectName]=useState(''),[error,fail]=useState(false),[event,announce]=useState('')
 useEffect(()=>{travel.current(props.district)},[props.travelRequest])
 useEffect(()=>{if(props.paused){input.current.clear();audio.current?.quiet()}},[props.paused])
 useEffect(()=>{
 const el=host.current!;let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch{fail(true);return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;el.prepend(renderer.domElement);const canvas=renderer.domElement;canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none';canvas.setAttribute('aria-label','Three-dimensional town');const scene=new T.Scene();const {lots,planting,breeze,oak}=scenery(scene),animateIsland=island(scene,planting),life=villageLife(scene,planting.trunks,oak),animateBirds=swallows(scene),camera=new T.PerspectiveCamera(54,1,.10,900)
 const player=person(0);const p=player.root.position
 const town=residents(scene,lots,planting.trunks),npcs=town.roster
 const disposeGlobe=roundWorld(scene)
 const traveler=new T.Group();traveler.add(player.root);traveler.matrixAutoUpdate=false;scene.add(traveler)
 const upAxis=new T.Vector3(),nextUp=new T.Vector3(),south=new T.Vector3(),east=new T.Vector3()
 const rotation=new T.Quaternion(),offset=new T.Vector3(),step=new T.Vector3(),candidate=new T.Vector3(),surface=new T.Vector3()
 const translation=new T.Matrix4(),oldUp=new T.Vector3(),orbitDir=new T.Vector3()
 let wide=true,orbitYaw=-1.1,orbitTilt=-.46,wideScale=1.52,hasWarped=false
 const mode=(value:boolean)=>{wide=value;setOverview(value)}
 switchView.current=()=>mode(!wide)
 let district=-1,yaw=0,pitch=.16,zoom=7.35,dy=0,h=0,clock=0,vx=0,vz=0,phase=0,speaker=-1,project=-1,frame=0,drag=false,lastX=0,lastY=0
 const focus=new T.Vector3(),dest=new T.Vector3()
 const obstructed=(x:number,z:number,r:number)=>Math.hypot(x,z)<2.2+r||lots.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)||npcs.some(n=>{
   if(!n.root.visible)return false
   const q=n.root.position,d=Math.hypot(x-q.x,z-q.z)
   return d<n.radius+r && d<Math.hypot(p.x-q.x,p.z-q.z)
 })
 function warp(n:number){
   district=n;const [x,z]=stops[n]??stops[0],spawnZ=z+(n===0?5.7:2.8)
   p.set(x,walkHeight(x,spawnZ)+.25,spawnZ);normalAt(x,spawnZ,upAxis)
   south.set(0,0,1).projectOnPlane(upAxis).normalize()
   latest.current.onPosition([p.x,p.z]);player.root.rotation.y=Math.PI;yaw=0;h=dy=vx=vz=0
   if(hasWarped)mode(false);hasWarped=true
 }
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
 const down=(e:PointerEvent)=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)},up=()=>{drag=false},move=(e:PointerEvent)=>{if(!drag||latest.current.paused)return;if(wide){orbitYaw-=(e.clientX-lastX)*.008;orbitTilt=T.MathUtils.clamp(orbitTilt+(e.clientY-lastY)*.006,-1.52,1.52)}else{yaw-=(e.clientX-lastX)*.007;pitch=T.MathUtils.clamp(pitch+(e.clientY-lastY)*.005,.12,1.08)}lastX=e.clientX;lastY=e.clientY},wheel=(e:WheelEvent)=>{e.preventDefault();if(wide){wideScale=T.MathUtils.clamp(wideScale+e.deltaY*.001,.78,2.2);if(wideScale<=.78){mode(false);zoom=11;wideScale=1.1}}else{zoom=T.MathUtils.clamp(zoom+e.deltaY*.009,3.5,13);if(zoom>=13)mode(true)}}
 window.addEventListener('keydown',key);window.addEventListener('keyup',release);window.addEventListener('blur',clear);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false})
 const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()});resize.observe(el)
 let last=performance.now();const tick=(now:number)=>{frame=requestAnimationFrame(tick);const dt=T.MathUtils.clamp((now-last)/1000,0,.045);last=now;if(latest.current.paused)return;clock+=dt;animateBirds(clock);animateIsland(clock)
 const k=input.current,has=(...a:string[])=>a.some(c=>k.has(c));let x=Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft')),z=Number(has('KeyS','ArrowDown'))-Number(has('KeyW','ArrowUp'));const speed=has('ShiftLeft','ShiftRight')?7:3.8,scale=speed/Math.max(1,Math.hypot(x,z));x*=scale;z*=scale
 vx=T.MathUtils.damp(vx,x*Math.cos(yaw)+z*Math.sin(yaw),14,dt);vz=T.MathUtils.damp(vz,-x*Math.sin(yaw)+z*Math.cos(yaw),14,dt)
 if((x||z)&&wide)mode(false)
 east.crossVectors(upAxis,south).normalize()
 const swimming=onWater(p.x,p.z),pace=swimming?.69:1
 oldUp.copy(upAxis)
 function advance(across:number,along:number){
   if(!across&&!along)return true
   step.copy(upAxis).multiplyScalar(radius+p.y).addScaledVector(east,across*dt*pace).addScaledVector(south,along*dt*pace).normalize()
   toPlan(step,candidate)
   if(obstructed(candidate.x,candidate.z,.33))return false
   p.x=candidate.x;p.z=candidate.z;upAxis.copy(step);return true
 }
 if(!advance(vx,vz)){if(!advance(vx,0))advance(0,vz)}
 transport(south,oldUp,upAxis,rotation);east.crossVectors(upAxis,south).normalize()
 const jump=k.delete('Space');if(jump&&h<=.001&&!swimming)dy=6
 dy-=16*dt;h=Math.max(0,h+dy*dt);if(!h)dy=0
 p.y=surfaceHeight(p.x,p.z)+(swimming?-1.09+.04*Math.sin(clock*3):.25)+h
 const delta=offset.subVectors(upAxis,oldUp).multiplyScalar(radius+p.y)
 const dx=delta.dot(east),dz=delta.dot(south),distance=delta.length(),speedNow=distance/Math.max(dt,.001)
 if(distance>.0001)latest.current.onPosition([p.x,p.z])
 traveler.matrix.makeBasis(east,upAxis,south).setPosition(toGlobe(p,surface)).multiply(translation.makeTranslation(-p.x,-p.y,-p.z))
 traveler.matrixWorldNeedsUpdate=true
 let turn=0
 if(speedNow>.05){const target=Math.atan2(dx,dz),delta=target-player.root.rotation.y;turn=Math.atan2(Math.sin(delta),Math.cos(delta));player.root.rotation.y+=turn*(1-Math.exp(-dt*17))}
 if(h<=.001)phase+=distance*(speedNow>4.6?2.65:3.9)
 player.animate(swimming?'swim':h>.001?'jump':speedNow>4.6?'run':speedNow>.05?'walk':'idle',phase,speedNow,clock,dt,T.MathUtils.clamp(turn,-1,1),dy)
 let best=0,bestD=Infinity;stops.forEach(([x,z],i)=>{const d=Math.hypot(p.x-x,p.z-z);if(d<bestD){bestD=d;best=i}});if(best!==district){district=best;latest.current.onDistrict(best)}
 town.tick(dt,clock,p,announce,speaker)
 breeze.value=clock;life(clock,dt,p,Math.hypot(npcs[8].root.position.x+8,npcs[8].root.position.z+6.19)<.68)
 if(wide){
   orbitDir.set(Math.cos(orbitTilt)*Math.sin(orbitYaw),Math.sin(orbitTilt),Math.cos(orbitTilt)*Math.cos(orbitYaw))
   const fov=T.MathUtils.degToRad(camera.fov/2),fit=Math.min(fov,Math.atan(Math.tan(fov)*camera.aspect))
   dest.copy(orbitDir).multiplyScalar((radius+12)*wideScale/Math.sin(fit))
   camera.position.copy(dest);camera.up.set(0,1,0);camera.lookAt(0,0,0)
 }else{
   focus.copy(surface).addScaledVector(upAxis,1.1)
   let arm=zoom
   const backward=offset.copy(east).multiplyScalar(Math.sin(yaw)).addScaledVector(south,Math.cos(yaw))
   for(let d=.6;d<=zoom;d+=.45){
     nextUp.copy(upAxis).multiplyScalar(radius+p.y).addScaledVector(backward,d*Math.cos(pitch)).normalize()
     toPlan(nextUp,candidate)
     if(lots.some(b=>Math.abs(candidate.x-b.x)<b.w*.5+.3&&Math.abs(candidate.z-b.z)<b.d*.5+.3)){arm=Math.max(1,d-.5);break}
   }
   dest.copy(focus).addScaledVector(backward,Math.cos(pitch)*arm).addScaledVector(upAxis,Math.sin(pitch)*arm)
   toPlan(nextUp.copy(dest).normalize(),candidate)
   dest.setLength(Math.max(dest.length(),radius+surfaceHeight(candidate.x,candidate.z)+.55))
   camera.position.copy(dest);camera.up.copy(upAxis);camera.lookAt(focus)
 }
 camera.updateMatrixWorld()
 for(let i=0;i<npcs.length;i++){
   const n=npcs[i],c=candidates[i]
   c.distanceSq=n.root.position.distanceToSquared(p);c.available=town.available(i)
   if(wide||c.distanceSq>11){c.visible=false;continue}
   anchor.copy(n.root.position);anchor.y+=(n.action==='ride'?2.35:2.1)*n.root.scale.y
   toGlobe(anchor,anchor).project(camera);c.x=anchor.x;c.y=anchor.y
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
 return()=>{disposeGlobe();if(scene.background instanceof T.Texture)scene.background.dispose();cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('keydown',key);window.removeEventListener('keyup',release);window.removeEventListener('blur',clear);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);scene.traverse(obj=>{if(obj instanceof T.Mesh||obj instanceof T.Points){obj.geometry.dispose();const m=Array.isArray(obj.material)?obj.material:[obj.material];m.forEach(a=>{if(a.map)a.map.dispose();a.dispose()})}});renderer.dispose();canvas.remove();input.current.clear()}
 },[])
 return <div className="playfield" ref={host}>{error?<div className="game-fallback"><h2>Explore the field journal</h2><p>This browser could not start the 3D renderer.</p><button onClick={()=>props.onJournal()}>Open field journal</button></div>:<><button className="planet-view" onClick={()=>switchView.current()}>{overview?<Footprints size={16}/>:<Globe2 size={16}/>} {overview?'Explore on foot':'View globe'}</button><div className="npc-anchor" ref={bubble} hidden={props.paused}><span className="npc-speech" ref={speech} role="status" aria-live="polite"/></div>{projectName&&!overview&&!props.paused&&<button className="talk" onClick={()=>interact.current()}><kbd>E</kbd> Explore {projectName}</button>}{event&&!overview&&<div className="town-event" role="status">{event}</div>}<div className="touchpad">{[['KeyW','↑','Forward'],['KeyA','←','Left'],['KeyS','↓','Back'],['KeyD','→','Right'],['Space','↥','Jump']].map(([code,label,desc])=><button key={code} aria-label={desc} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);input.current.add(code)}} onPointerUp={()=>input.current.delete(code)} onPointerCancel={()=>input.current.delete(code)}>{label}</button>)}</div></>}</div>
}


