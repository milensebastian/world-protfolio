import * as T from 'three'
import {seeded} from './paint'
type Lot={x:number,z:number,w:number,d:number}
import {terrainHeight,nearTrail,shoreDistance} from './geography'
export function landscape(scene:T.Scene,lots:Lot[],planting:{free:(x:number,z:number,r:number)=>boolean}){
 const random=seeded(1542)
 const grass:number[]=[],tones:number[]=[]
 for(let i=0;i<18000;i++){
   const x=random()*104-52,z=random()*104-52
   if(!planting.free(x,z,.1)||shoreDistance(x,z)<7||nearTrail(x,z,1.2)||(Math.abs(x)<3.3||Math.abs(z)<3.3)||Math.hypot(x,z)<11.1||lots.some(b=>Math.abs(x-b.x)<b.w*.5+.2&&Math.abs(z-b.z)<b.d*.5+.2)||Math.hypot(x+27,z-6)<3.3)continue
   const y=terrainHeight(x,z)+.02,clr=new T.Color(i%11===0?'#eac989':i%3?'#83a459':'#b7c878')
   for(let j=0;j<3;j++){const dx=(random()-.5)*.18,dz=(random()-.5)*.18;grass.push(x+dx-.035,y,z+dz,x+dx+.04,y,z+dz+.035,x+dx+.08,y+.12+random()*.18,z+dz);for(let k=0;k<3;k++)tones.push(clr.r,clr.g,clr.b)}
 }
 const blades=new T.BufferGeometry();blades.setAttribute('position',new T.Float32BufferAttribute(grass,3));blades.setAttribute('color',new T.Float32BufferAttribute(tones,3))
 const breeze={value:0}
 const meadow=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide})
 meadow.onBeforeCompile=shader=>{
   shader.uniforms.breeze=breeze
   shader.vertexShader='uniform float breeze;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
     #include <begin_vertex>
     if(gl_VertexID%3==2) transformed.x+=.035*sin(breeze+position.x*.7+position.z*.3);`)
 }
 const meadowMesh=new T.Mesh(blades,meadow)
 meadowMesh.onBeforeRender=()=>{breeze.value=performance.now()*.0017}
 scene.add(meadowMesh)
 // Painted contact shadows pool beneath each building, without a screen-space pass.
 const c=document.createElement('canvas');c.width=c.height=64
 const ctx=c.getContext('2d')!,g=ctx.createRadialGradient(32,32,8,32,32,32)
 g.addColorStop(0,'rgba(58,64,46,.45)');g.addColorStop(.72,'rgba(58,64,46,.19)');g.addColorStop(1,'rgba(58,64,46,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64)
 const map=new T.CanvasTexture(c),m=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false})
 const plane=new T.PlaneGeometry(1,1);plane.rotateX(-Math.PI/2)
 const patches=new T.InstancedMesh(plane,m,lots.length);const o=new T.Object3D()
 lots.forEach((b,i)=>{o.position.set(b.x,terrainHeight(b.x,b.z)+.14,b.z);o.scale.set(b.w*1.65,1,b.d*1.65);o.updateMatrix();patches.setMatrixAt(i,o.matrix)});scene.add(patches)
}
