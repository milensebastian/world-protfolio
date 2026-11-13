import * as T from 'three'
import {seeded} from './paint'
import {terrainHeight} from './geography'

// Plant this landmark before the surrounding forest is populated. Its branches
// lean over the flower bed; the existing planting plan protects the path.
export function gardenOak(scene:T.Scene,x:number,z:number){
 const random=seeded(2908),base=terrainHeight(x,z),wood=new T.MeshLambertMaterial({color:'#78583f'})
 const nodes:T.Vector3[]=[]
 function limb(points:T.Vector3[],rad:number){
   const curve=new T.CatmullRomCurve3(points),g=new T.TubeGeometry(curve,10,rad,9,false),v=g.attributes.position
   for(let i=0;i<v.count;i++){const t=Math.floor(i/10)/10,c=curve.getPointAt(Math.min(1,t)),scale=1-.7*t;v.setXYZ(i,c.x+(v.getX(i)-c.x)*scale,c.y+(v.getY(i)-c.y)*scale,c.z+(v.getZ(i)-c.z)*scale)}
   g.computeVertexNormals();const m=new T.Mesh(g,wood);m.castShadow=true;scene.add(m)
 }
 const point=(dx:number,dy:number,dz:number)=>new T.Vector3(x+dx,base+dy,z+dz)
 limb([point(0,-.2,0),point(.27,1.8,-.1),point(.02,3.6,.2),point(-.65,5.4,0)],.64)
 for(let i=0;i<8;i++){
   const a=i*2.4,r=1.8+random()*1.2,h=3.8+random()*1.7
   const end=point(Math.cos(a)*r,h,Math.sin(a)*r)
   limb([point(.08,1.8+i*.17,0),point(Math.cos(a)*.95,h-.9,Math.sin(a)*.85),end],.25)
   nodes.push(end)
 }
 const leaves=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshLambertMaterial(),96),o=new T.Object3D()
 nodes.forEach((n,i)=>{for(let j=0;j<12;j++){const a=random()*6.28,r=random()*1.22;o.position.set(n.x+Math.cos(a)*r,n.y+.32+random()*.65,n.z+Math.sin(a)*r);o.scale.set(1.02+random()*.42,.51+random()*.47,1.05);o.rotation.y=a;o.updateMatrix();leaves.setMatrixAt(i*12+j,o.matrix);leaves.setColorAt(i*12+j,new T.Color(['#536e53','#678451','#81995b','#a1ac6b'][Math.floor(random()*4)]))}})
 leaves.castShadow=leaves.receiveShadow=true;leaves.computeBoundingSphere();scene.add(leaves)
 return {x,z}
}
