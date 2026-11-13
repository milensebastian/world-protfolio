import * as T from 'three'
import {arrivalClearing,bridgeX,bridgeZ,nearTrail,paths,shoreDistance,shoreRadius,seaLevel,terrainHeight,walkHeight} from './geography'
import {seeded} from './paint'

export function island(scene:T.Scene,planting:{tree:(x:number,z:number,r:number)=>boolean;free:(x:number,z:number,r:number)=>boolean}){
 const positions:number[]=[],colors:number[]=[],indices:number[]=[]
 const segments=240,rings=104,sand=new T.Color('#e1c999'),stone=new T.Color('#a69e8d'),green=new T.Color(),tint=new T.Color()
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
   const a=i/segments*Math.PI*2,r=(shoreRadius(a)+5)*j/rings,x=r*Math.cos(a),z=r*Math.sin(a),h=terrainHeight(x,z)
   positions.push(x,h,z)
   green.set('#a4ba79').lerp(tint.set('#759b69'),.4+.2*Math.sin(x*.35+z*.21)+.16*Math.cos(z*.47))
   if(shoreDistance(x,z)<6)green.lerp(stone,Math.max(0,Math.sin(a*3+.8))*.8)
   green.lerp(sand,1-T.MathUtils.smoothstep(h,seaLevel+.42,seaLevel+1.56));colors.push(green.r,green.g,green.b)
   if(i&&j){const q=j*(segments+1)+i;indices.push(q-segments-2,q-1,q,q-segments-2,q,q-segments-1)}
 }
 const ground=new T.BufferGeometry();ground.setAttribute('position',new T.Float32BufferAttribute(positions,3));ground.setAttribute('color',new T.Float32BufferAttribute(colors,3));ground.setIndex(indices)
 // Increasing polar angle winds clockwise when viewed from above.
 const tris=ground.index!.array;for(let i=0;i<tris.length;i+=3){const a=tris[i];tris[i]=tris[i+1];tris[i+1]=a}
 ground.computeVertexNormals();const mesh=new T.Mesh(ground,new T.MeshToonMaterial({vertexColors:true}));mesh.receiveShadow=true;scene.add(mesh)
 const ocean=new T.Mesh(new T.CircleGeometry(340,128),new T.MeshBasicMaterial({color:'#559fa9'}))
 ocean.rotation.x=-Math.PI/2;ocean.position.y=seaLevel;scene.add(ocean)
 // Trace the actual waterline, including beaches with different slopes.
 const surf:number[]=[],surfColors:number[]=[],surfIdx:number[]=[]
 for(let i=0;i<=segments;i++){
   const a=i/segments*2*Math.PI,c=Math.cos(a),s=Math.sin(a);let lo=shoreRadius(a)-9,hi=shoreRadius(a)+5
   for(let k=0;k<14;k++){const mid=(lo+hi)/2;if(terrainHeight(mid*c,mid*s)>seaLevel)lo=mid;else hi=mid}
   for(const [offset,clr] of [[0,'#e1f1df'],[.38,'#dcebd7'],[.67,'#83c9bd'],[3,'#74bfba'],[8,'#559fa9']] as const){
     surf.push((hi+offset)*c,seaLevel+.025,(hi+offset)*s);const col=tint.set(clr);surfColors.push(col.r,col.g,col.b)
   }
   if(i)for(let j=0;j<4;j++){const b=i*5+j;surfIdx.push(b-5,b,b+1,b-5,b+1,b-4)}
 }
 const waterline=new T.BufferGeometry();waterline.setAttribute('position',new T.Float32BufferAttribute(surf,3));waterline.setAttribute('color',new T.Float32BufferAttribute(surfColors,3));waterline.setIndex(surfIdx)
 scene.add(new T.Mesh(waterline,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide})))
 const trailMat=new T.MeshToonMaterial({color:'#d7be94',side:T.DoubleSide})
 for(const curve of paths){
   const verts:number[]=[],ids:number[]=[]
   curve.forEach(([x,z],i)=>{const before=curve[Math.max(0,i-1)],after=curve[Math.min(curve.length-1,i+1)],dx=after[0]-before[0],dz=after[1]-before[1],len=Math.hypot(dx,dz)||1
     for(const side of [-1,0,1]){const xx=x+side*dz/len*1.06,zz=z-side*dx/len*1.06;verts.push(xx,terrainHeight(xx,zz)+.065,zz)}
     if(i){const b=i*3;ids.push(b-3,b,b+1,b-3,b+1,b-2,b-2,b+1,b+2,b-2,b+2,b-1)}
   });const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(ids);geo.computeVertexNormals();const road=new T.Mesh(geo,trailMat);road.receiveShadow=true;scene.add(road)
 }
 const random=seeded(781),object=new T.Object3D()
 type Instance={x:number;y:number;z:number;s:number;color:string}
 const pines:Instance[]=[],rocks:Instance[]=[],flowers:Instance[]=[]
 for(let i=0;i<1300;i++){const a=random()*Math.PI*2,r=37+random()*28,x=Math.cos(a)*r,z=Math.sin(a)*r,y=terrainHeight(x,z),shore=shoreDistance(x,z)
   if(!planting.free(x,z,.7)||arrivalClearing(x,z)||shore<3||nearTrail(x,z,2.7)||y<seaLevel+.8)continue
   if(i%9===0)rocks.push({x,y:y+.15,z,s:.4+random()*.7,color:'#a7a598'})
   else if(i%5===0&&shore>6&&planting.tree(x,z,1.7))pines.push({x,y,z,s:.65+random()*.8,color:i%2?'#789973':'#5c8368'})
   else if(i%3===0)for(let n=0;n<9;n++){const xx=x+random()-.5,zz=z+random()-.5;if(!planting.free(xx,zz,.15))continue;flowers.push({x:xx,y:terrainHeight(xx,zz)+.14,z:zz,s:.13,color:i%2?'#e2ae92':'#ead080'})}
 }
 function scatter(geo:T.BufferGeometry,items:Instance[],scale:number[],offset=0){
   const m=new T.InstancedMesh(geo,new T.MeshLambertMaterial(),items.length)
   items.forEach((v,i)=>{object.position.set(v.x,v.y+offset*v.s,v.z);object.scale.set(scale[0]*v.s,scale[1]*v.s,scale[2]*v.s);object.rotation.y=i*2.4;object.updateMatrix();m.setMatrixAt(i,object.matrix);m.setColorAt(i,tint.set(v.color))});m.computeBoundingSphere();scene.add(m);return m
 }
 scatter(new T.ConeGeometry(1,1,8),pines,[1.2,3.9,1.2],1.95);scatter(new T.ConeGeometry(1,1,8),pines,[.84,3,.84],3.35)
 scatter(new T.IcosahedronGeometry(1,0),rocks,[1,.75,1.2]);const flowerMesh=scatter(new T.IcosahedronGeometry(1,0),flowers,[1,.8,1])
 const boards=new T.InstancedMesh(new T.BoxGeometry(2.85,.14,.29),new T.MeshLambertMaterial({color:'#a6865c'}),29)
 for(let i=0;i<29;i++){const z=bridgeZ-4.2+i*.3;object.position.set(bridgeX,walkHeight(bridgeX,z)-.02,z);object.rotation.set(0,0,0);object.scale.setScalar(1);object.updateMatrix();boards.setMatrixAt(i,object.matrix)}
 boards.receiveShadow=true;scene.add(boards)
 // A small mill on the eastern rise overlooks the sea lane.
 const mill=new T.Group(),mx=37,mz=24;mill.position.set(mx,terrainHeight(mx,mz),mz)
 const limestone=new T.MeshLambertMaterial({color:'#dfceaa'}),timber=new T.MeshLambertMaterial({color:'#87674f'})
 const tower=new T.Mesh(new T.CylinderGeometry(.78,1.36,4,12),limestone);tower.position.y=2;mill.add(tower)
 const cap=new T.Mesh(new T.ConeGeometry(1.16,1.25,12),new T.MeshLambertMaterial({color:'#aa694d'}));cap.position.y=4.6;mill.add(cap)
 const rotor=new T.Group();rotor.position.set(0,3.7,1.12)
 const sail=new T.BoxGeometry(.45,1.65,.045)
 for(let i=0;i<4;i++){const arm=new T.Group(),blade=new T.Mesh(sail,limestone);blade.position.set(.18,1.44,0);arm.add(blade)
   const shaft=new T.Mesh(new T.BoxGeometry(.07,2.3,.07),timber);shaft.position.y=1.15;arm.add(shaft);arm.rotation.z=i*Math.PI/2;rotor.add(arm)}
 mill.add(rotor);mill.rotation.y=-.4;scene.add(mill)
 // Crown foliage uses grouped low-detail instances at the open coast.
 // Fade small meadow flowers with distance; tree silhouettes remain visible.
 flowerMesh.material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>', `
     float flowerDistance=length(cameraPosition-instanceMatrix[3].xyz);
     transformed *= 1.0-smoothstep(26.0,44.0,flowerDistance);
     #include <project_vertex>`)
 }
 const ripples=new T.InstancedMesh(new T.CircleGeometry(1,10),new T.MeshBasicMaterial({color:'#a9d8d1'}),220)
 for(let i=0;i<220;i++){const a=random()*6.283,r=shoreRadius(a)+4+random()*48;object.position.set(r*Math.cos(a),seaLevel+.04,r*Math.sin(a));object.rotation.set(-Math.PI/2,0,0);object.scale.set(.3+random()*1.2,.035+random()*.05,1);object.updateMatrix();ripples.setMatrixAt(i,object.matrix)}scene.add(ripples)
 return (time:number)=>{rotor.rotation.z=time*.38;ripples.position.x=Math.sin(time*.4)*.32;ripples.position.z=Math.cos(time*.3)*.12}
}
