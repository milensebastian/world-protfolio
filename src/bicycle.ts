import * as T from 'three'
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Dimensions use the same local axes as the character, facing positive Z.
export function bicycle(color:string){
  const group=new T.Group(),parts:T.BufferGeometry[]=[]
  function finish(g:T.BufferGeometry,c:string){
    const src=g.index?g.toNonIndexed():g;src.deleteAttribute('uv')
    const tint=new T.Color(c),rgb=new Float32Array(src.attributes.position.count*3)
    for(let i=0;i<rgb.length;i+=3){rgb[i]=tint.r;rgb[i+1]=tint.g;rgb[i+2]=tint.b}
    src.setAttribute('color',new T.BufferAttribute(rgb,3));parts.push(src);if(src!==g)g.dispose()
  }
  type Point=[number,number,number]
  function bar(a:Point,b:Point,r:number,c:string){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start)
    const g=new T.CylinderGeometry(r,r,v.length(),7);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()))
    const center=start.lerp(end,.5);g.translate(center.x,center.y,center.z);finish(g,c)
  }
  const wheels:T.Mesh[]=[]
  const material=new T.MeshToonMaterial({vertexColors:true})
  function batch(){const mesh=new T.Mesh(mergeGeometries(parts),material);mesh.castShadow=true;group.add(mesh);parts.forEach(p=>p.dispose());parts.length=0;return mesh}
  for(const z of [-.54,.54]){
    const rim=new T.TorusGeometry(.34,.033,7,32);rim.rotateY(Math.PI/2);finish(rim,'#384640')
    for(let i=0;i<8;i++){const a=i*Math.PI/8;bar([0,Math.sin(a)*.32,Math.cos(a)*.32],[0,-Math.sin(a)*.32,-Math.cos(a)*.32],.006,'#c5c5ae')}
    const wheel=batch();wheel.position.set(0,.34,z);wheels.push(wheel)
  }
  const back:Point=[0,.34,-.54],pedal:Point=[0,.36,0],saddle:Point=[0,.91,-.16],fork:Point=[0,.88,.37]
  for(const [a,b] of [[back,pedal],[back,saddle],[saddle,pedal],[saddle,fork],[fork,pedal],[fork,[0,.34,.54] as Point]])bar(a,b,.031,color)
  bar(fork,[0,1.07,.37],.024,'#727b70');bar([-.28,1.07,.37],[.28,1.07,.37],.029,'#695241')
  const seat=new T.SphereGeometry(1,10,6);seat.scale(.145,.047,.158);seat.translate(0,.94,-.13);finish(seat,'#79553f');batch()
  return {group,spin:(distance:number)=>wheels.forEach(w=>w.rotation.x+=distance/.34)}
}
