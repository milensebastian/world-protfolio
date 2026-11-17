import * as T from 'three'
import { seeded } from './paint'

type Species = 'oak' | 'blossom' | 'pine' | 'cypress'

// A cutout contains a whole branching spray, with daylight between its leaves.
function sprayTexture(needle: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!, random = seeded(needle ? 437 : 824)
  function twig(x: number, y: number, angle: number, length: number, depth: number) {
    const dx = Math.cos(angle), dy = Math.sin(angle)
    ctx.strokeStyle = depth ? '#70634b' : '#788254'
    ctx.lineWidth = depth + 0.9
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+dx*length,y+dy*length); ctx.stroke()
    for(let i=1;i<=8;i++) {
      const t=i/8, side=i%2?1:-1, a=angle+side*(0.49+random()*.48)
      const xx=x+dx*length*t, yy=y+dy*length*t
      if(depth) twig(xx,yy,a,length*(.74-.28*t),depth-1)
      else {
        const light=45+random()*31
        ctx.fillStyle='hsl('+ (needle?90:75+random()*20) +' 23% '+light+'%)'
        ctx.beginPath()
        ctx.ellipse(xx+Math.cos(a)*4,yy+Math.sin(a)*4,needle?8:7,needle?1.25:3.2,a,0,Math.PI*2)
        ctx.fill()
      }
    }
  }
  twig(128,249,-Math.PI/2,128,2)
  const map=new T.CanvasTexture(canvas); map.colorSpace=T.SRGBColorSpace
  return map
}

export function woodland(scene:T.Scene) {
  const random=seeded(9127), bark:T.Matrix4[]=[], broad:T.Matrix4[]=[], needles:T.Matrix4[]=[]
  const broadColors:T.Color[]=[], needleColors:T.Color[]=[]
  const up=new T.Vector3(0,1,0), object=new T.Object3D()
  function limb(a:T.Vector3,b:T.Vector3,r:number) {
    const dir=b.clone().sub(a)
    object.position.copy(a).lerp(b,.5);object.scale.set(r,dir.length(),r)
    object.quaternion.setFromUnitVectors(up,dir.normalize());object.updateMatrix();bark.push(object.matrix.clone())
  }
  function tree(x:number,y:number,z:number,size:number,species:Species) {
    const conifer=species==='pine'||species==='cypress'
    const point=(dx:number,h:number,dz:number)=>new T.Vector3(x+dx*size,y+h*size,z+dz*size)
    const height=conifer?4.8:5.4, count=conifer?52:32, phase=random()*Math.PI*2
    const lean=(random()-.5)*.55, origin=point(0,-.12,0), fork=point(lean,2,0)
    limb(origin,fork,conifer?.15:.29);limb(fork,point(lean*.5,height,0),conifer?.1:.18)
    for(let i=0;i<count;i++) {
      const t=i/count,a=i*2.39996+phase+random()*.35
      const radius=conifer?(1-t)*(species==='cypress'?.63:1.48)+.07:1.85*Math.sqrt(1-t)*(.72+random()*.35)
      const startH=conifer?.65+t*3.95:1.45+t*3.45
      const start=point(lean*(1-t),startH,0)
      const bend=point(Math.cos(a)*radius*.53+lean*.5,startH+(conifer?.04:.72),Math.sin(a)*radius*.53)
      const tip=point(Math.cos(a)*radius,startH+(conifer?.2:1.42)+random()*.28,Math.sin(a)*radius)
      limb(start,bend,(conifer?.056:.128)*(1-.65*t));limb(bend,tip,(conifer?.032:.073)*(1-.6*t))
      for(let j=0;j<(conifer?4:9);j++) {
        const along=.42+random()*.65, yaw=a+(random()-.5)*1.8
        object.position.copy(bend).lerp(tip,along)
        object.rotation.set(0,Math.PI/2-yaw,0)
        object.rotateZ((conifer?-1.06:-.74)+(random()-.5)*.8); object.rotateY(random()*2.6)
        const span=size*(conifer?.72*(1-t)+.28:1.23)*(.77+random()*.52)
        object.scale.set(span,span*(conifer?1.1:1.28),1);object.updateMatrix()
        ;(conifer?needles:broad).push(object.matrix.clone())
        const pigment=new T.Color(species==='blossom'&&j%3===0?'#f2c6b6':conifer?'#a9b8a8':'#bfca9b')
        pigment.multiplyScalar(.74+.22*t+random()*.26)
        ;(conifer?needleColors:broadColors).push(pigment)
      }
    }
  }
  function flush() {
    function batch(g:T.BufferGeometry,m:T.Material,matrices:T.Matrix4[],colors?:T.Color[]) {
      const mesh=new T.InstancedMesh(g,m,matrices.length)
      matrices.forEach((matrix,i)=>{mesh.setMatrixAt(i,matrix);if(colors)mesh.setColorAt(i,colors[i])})
      mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh)
    }
    batch(new T.CylinderGeometry(.56,1,1,8),new T.MeshStandardMaterial({color:'#635446',roughness:1}),bark)
    for(const conifer of [false,true]) {
      const matrices=conifer?needles:broad
      if(!matrices.length)continue
      const g=new T.PlaneGeometry(1,1);g.translate(0,.5,0)
      batch(g,new T.MeshLambertMaterial({map:sprayTexture(conifer),alphaTest:.23,side:T.DoubleSide}),matrices,conifer?needleColors:broadColors)
    }
  }
  return {tree,flush}
}
