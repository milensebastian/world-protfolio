import {villageRise} from './geography'
import * as T from 'three'

export function seeded(seed: number) {
  return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296)
}

function painted(size: number, draw: (ctx: CanvasRenderingContext2D, random: () => number) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, seeded(351))
  const map = new T.CanvasTexture(canvas)
  map.colorSpace = T.SRGBColorSpace
  map.wrapS = map.wrapT = T.RepeatWrapping
  map.anisotropy = 4
  return map
}

// A seamless, staggered set of individually cut stones with light upper edges.
function cobbles() {
  return painted(512, (c, random) => {
    c.fillStyle = '#aaaca0'
    c.fillRect(0, 0, 512, 512)
    for (let row = 0; row < 12; row++) {
      for (let col = -1; col < 8; col++) {
        const x = col * 64 + (row % 2) * 32, y = row * 512/12
        const light = 70 + random()*11
        c.fillStyle = 'hsl('+(32+random()*14)+' 18% '+light+'%)'
        c.beginPath(); c.roundRect(x+1.8, y+2, 61, 39, [6,9,5,7]); c.fill()
        c.strokeStyle = '#f4ecce85'; c.lineWidth = 2
        c.beginPath(); c.moveTo(x+8,y+4); c.lineTo(x+54,y+4); c.stroke()
      }
    }
    for(let i=0;i<10000;i++){c.fillStyle=random()>.5?'#fff5d71a':'#5f665211';c.fillRect(random()*512,random()*512,1+random()*3,1)}
  })
}

export function plaza(scene: T.Scene) {
  const map = cobbles()
  const mat = new T.MeshToonMaterial({map,color:'#ffffff'})
  function lay(g:T.BufferGeometry,y:number){
    g.rotateX(-Math.PI/2)
    const uv=g.attributes.uv,points=g.attributes.position
    for(let i=0;i<uv.count;i++){const x=points.getX(i),z=points.getZ(i);points.setY(i,villageRise(x,z));uv.setXY(i,x/4.5,z/4.5)}
    g.computeVertexNormals()
    const mesh=new T.Mesh(g,mat);mesh.position.y=y;mesh.receiveShadow=true;scene.add(mesh)
  }
  lay(new T.PlaneGeometry(72,5.85,96,8),.037)
  lay(new T.PlaneGeometry(5.85,72,8,96),.043)
  lay(new T.RingGeometry(.001,10.88,96,20),.14)
  const rim=new T.RingGeometry(9.85,10.07,96);rim.rotateX(-Math.PI/2)
  const pp=rim.attributes.position;for(let i=0;i<pp.count;i++)pp.setY(i,villageRise(pp.getX(i),pp.getZ(i)))
  const band=new T.Mesh(rim,new T.MeshToonMaterial({color:'#9cae9e'}));band.position.y=.144;band.receiveShadow=true;scene.add(band)
}

export function atmosphere(scene:T.Scene) {
  scene.fog = new T.Fog('#bee0dd',40,123)
  const canvas=document.createElement('canvas')
  canvas.width=2048;canvas.height=768
  const c=canvas.getContext('2d')!,random=seeded(932)
  const gradient=c.createLinearGradient(0,0,0,768)
  gradient.addColorStop(0,'#3e92c3');gradient.addColorStop(.47,'#6bc7e7')
  gradient.addColorStop(.78,'#b8e7e9');gradient.addColorStop(1,'#eaf0d4')
  c.fillStyle=gradient;c.fillRect(0,0,2048,768)
  // Overlap lit lobes into banks with a shared lavender underside.
  for(let i=0;i<58;i++){
    const x=random()*2048,y=260+random()*340,s=.33+random()*.98
    const lobes=Array.from({length:14},(_,j)=>({x:(j-6.5)*11*s,y:-Math.sin(j/13*Math.PI)*28*s-random()*12*s,r:(12+random()*21)*s}))
    for(const shift of [-2048,0,2048]){
      if(x+shift< -180||x+shift>2228)continue
      for(const p of lobes){
        const cy=y+p.y
        const fill=c.createLinearGradient(0,cy-p.r,0,cy+p.r*.75)
        fill.addColorStop(0,'#fffced');fill.addColorStop(.5,'#faf9e9');fill.addColorStop(1,'#bfd5dd')
        c.fillStyle=fill;c.beginPath();c.ellipse(x+shift+p.x,cy,p.r*1.32,p.r*.78,0,0,Math.PI*2);c.fill()
      }
    }
  }
  const sky=new T.CanvasTexture(canvas);sky.colorSpace=T.SRGBColorSpace;sky.wrapS=T.RepeatWrapping
  const dome=new T.Mesh(new T.SphereGeometry(150,48,24),new T.MeshBasicMaterial({map:sky,side:T.BackSide,fog:false,depthWrite:false}))
  dome.onBeforeRender=()=>{dome.rotation.y=performance.now()*.0000015};dome.scale.y=.56;dome.position.y=20;dome.renderOrder=-10;scene.add(dome)
  scene.add(new T.HemisphereLight('#fff5df','#c3c6b6',1.3))
  const sun=new T.DirectionalLight('#fff0cd',2.05)
  sun.position.set(-26,39,23);sun.castShadow=true
  Object.assign(sun.shadow.camera,{left:-43,right:43,top:43,bottom:-43})
  sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.00035;sun.shadow.normalBias=.032
  scene.add(sun)
}
