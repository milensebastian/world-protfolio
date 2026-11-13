import * as T from 'three'
import {terrainHeight,villageRise} from './geography'
import {seeded} from './paint'

export function villageLife(scene:T.Scene,trees:{x:number;z:number;r:number}[],oak?:{x:number;z:number}){
 const rand=seeded(1971),base=villageRise(0,0),dummy=new T.Object3D()
 function instances(geometry:T.BufferGeometry,material:T.Material,count:number){
   const mesh=new T.InstancedMesh(geometry,material,count);mesh.frustumCulled=false;scene.add(mesh);return mesh
 }
 function put(mesh:T.InstancedMesh,i:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,rx=0,ry=0,rz=0){
   dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)
 }
 const drops=instances(new T.SphereGeometry(1,7,5),new T.MeshBasicMaterial({color:'#e1faf3'}),64)
 const rings=instances(new T.TorusGeometry(1,.034,4,32),new T.MeshBasicMaterial({color:'#c7e9db'}),14)
 const water=new T.Mesh(new T.CircleGeometry(2.04,64),new T.ShaderMaterial({
   uniforms:{time:{value:0}},vertexShader:'varying vec2 local;void main(){local=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec2 local;uniform float time;
   void main(){float d=length(local);float wave=sin(24.*d-time*3.+.6*sin(local.x*5.+time))*.5+.5;
   float glint=pow(wave,14.)*(.5+.5*sin(local.y*11.+time*.7));
   vec3 tint=mix(vec3(.12,.36,.32),vec3(.28,.60,.51),smoothstep(0.,2.,d));
   gl_FragColor=vec4(tint+vec3(.22,.25,.19)*glint,1.);
   #include <colorspace_fragment>
   }`
 }));water.rotation.x=-Math.PI/2;water.position.y=base+.687;scene.add(water)
 // Leaves, moths and garden lights use small local populations.
 const leaves=instances(new T.IcosahedronGeometry(1,0),new T.MeshLambertMaterial(),24)
 const wings=instances(new T.CircleGeometry(1,7),new T.MeshBasicMaterial({side:T.DoubleSide}),20)
 const habitat=[[oak?.x??-27,oak?.z??4],[-24,23],[-8,-5],[7,-7]]
 const seeds=Array.from({length:48},()=>rand()*31)
 for(let i=0;i<24;i++)leaves.setColorAt(i,new T.Color(i%3?'#b99659':'#c88357'))
 for(let i=0;i<20;i++)wings.setColorAt(i,new T.Color(['#dfae50','#bb95b8','#f1c788','#8dbfbc'][Math.floor(i/2)%4]))
 const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=32
 const ctx=haloCanvas.getContext('2d')!,gradient=ctx.createRadialGradient(16,16,0,16,16,16)
 gradient.addColorStop(0,'#fffada');gradient.addColorStop(.18,'#ffeab4');gradient.addColorStop(.42,'rgba(255,219,135,.32)');gradient.addColorStop(1,'rgba(255,222,153,0)')
 ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32)
 const glimmer=new T.CanvasTexture(haloCanvas),sparkPositions=new Float32Array(75*3)
 const sparks=new T.BufferGeometry();sparks.setAttribute('position',new T.BufferAttribute(sparkPositions,3))
 const pollen=new T.Points(sparks,new T.PointsMaterial({map:glimmer,size:.18,color:'#fff0be',transparent:true,depthWrite:false,blending:T.AdditiveBlending}))
 pollen.frustumCulled=false;scene.add(pollen)
 const lights=instances(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:'#ffdf89'}),36)
 const smokeMaterial=new T.MeshBasicMaterial({color:'#efdfca',transparent:true,opacity:.13,depthWrite:false})
 const smoke=instances(new T.IcosahedronGeometry(1,1),smokeMaterial,9)
 const sun=scene.children.find(child=>child instanceof T.DirectionalLight) as T.DirectionalLight|undefined
 // A real hinged door over a recessed, dark threshold; the baker uses it
 // during oven checks. The facade behind it occludes the interior actor.
 const door=new T.Group();door.position.set(-8.49,villageRise(-8,-9),-6.24)
 const panel=new T.Mesh(new T.BoxGeometry(.98,1.94,.09),new T.MeshLambertMaterial({color:'#956f4b'}))
 panel.position.set(.49,.98,0);door.add(panel)
 const trim=new T.Mesh(new T.BoxGeometry(.76,.62,.04),new T.MeshLambertMaterial({color:'#734f39'}));trim.position.set(.49,.55,.067);door.add(trim)
 const pane=new T.Mesh(new T.BoxGeometry(.72,.68,.04),new T.MeshLambertMaterial({color:'#e7c592',emissive:'#463522'}));pane.position.set(.49,1.4,.063);door.add(pane);scene.add(door)
 const windowGlow=new T.Mesh(new T.PlaneGeometry(.87,1.09),new T.MeshBasicMaterial({color:'#e0b57e'}))
 windowGlow.position.set(-8-6*.32,1.5+villageRise(-8,-9),-6.285);scene.add(windowGlow)
 const silhouette=new T.Group();silhouette.position.copy(windowGlow.position);silhouette.position.z+=.009
 const ink=new T.MeshBasicMaterial({color:'#947b61'})
 for(const [y,w,h] of [[-.35,.19,.28],[-.025,.114,.133]]){const shape=new T.Mesh(new T.SphereGeometry(1,10,7),ink);shape.position.y=y;shape.scale.set(w,h,.016);silhouette.add(shape)}scene.add(silhouette)
 // Ivy and hanging wisteria frame the two shop porches. Small petals are
 // batched with the garden flower beds, preserving open walking lanes.
 const petals=instances(new T.IcosahedronGeometry(1,0),new T.MeshLambertMaterial(),920)
 let n=0
 for(const [x,z,w,y] of [[-8,-6.28,5.5,4.55],[7,-7.28,5.4,4.03],[-29,-4.28,4.4,3.22]]){
   for(let i=0;i<95;i++){const t=rand(),xx=x+(t-.5)*w,hang=(i%8)*.091*(.4+Math.pow(Math.sin(t*13),2))
     put(petals,n,xx,villageRise(x,z-2.5)+y-hang+rand()*.14,z+rand()*.14,.11,.15,.082,0,rand()*4,rand())
     petals.setColorAt(n++,new T.Color(i%8<4?['#638258','#759456','#858f64'][i%3]:['#b297bb','#c9aaca','#a08aaf'][i%3]))
   }
 }
 for(let i=0;i<635;i++){const [cx,cz]=[[-29,7],[-30,5],[-23,21],[-21,25],[-10,-5.8],[9,-7.1]][i%6],a=rand()*6.28,r=Math.sqrt(rand())*1.45,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r
   put(petals,n,x,terrainHeight(x,z)+.18+rand()*.16,z,.065+rand()*.06,.09,.075)
   petals.setColorAt(n++,new T.Color(['#e6ae79','#bc8fa9','#e9c772','#a7b9d0','#81995e'][i%5]))
 }
 petals.computeBoundingSphere();petals.frustumCulled=true
 // A carved, scalloped fountain bowl with a limestone finial.
 const profile=[[.12,.7],[.48,.74],[.52,.8],[.33,.91],[.21,1.12],[.38,1.39],[.73,1.55],[1.01,1.76],[1.06,1.87],[.98,1.91],[.88,1.81],[.4,1.63]]
 const bowl=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),80)
 const pos=bowl.attributes.position
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),flute=.056*Math.cos(10*Math.atan2(x,z))*T.MathUtils.smoothstep(y,1.15,1.79);pos.setXYZ(i,x*(1+flute),y+flute*.35,z*(1+flute))}
 bowl.computeVertexNormals();const carved=new T.Mesh(bowl,new T.MeshLambertMaterial({color:'#e5d3af',side:T.DoubleSide}));carved.position.y=base;carved.castShadow=carved.receiveShadow=true;scene.add(carved)
 const ornament=instances(new T.SphereGeometry(1,12,7),new T.MeshLambertMaterial({color:'#cfbea1'}),14)
 for(let i=0;i<14;i++){const a=i*Math.PI/7;put(ornament,i,2.09*Math.sin(a),base+.41,2.09*Math.cos(a),.19,.24,.11,0,a)}
 return (time:number,dt:number,player:T.Vector3,ovenDoor:boolean)=>{
   water.material.uniforms.time.value=time;door.rotation.y=T.MathUtils.damp(door.rotation.y,ovenDoor?-1.38:0,5,dt)
   silhouette.position.x=windowGlow.position.x+.14*Math.sin(time*.42);silhouette.rotation.z=.055*Math.sin(time*.79)
   if(sun)sun.intensity=1.98+.075*Math.sin(time*.052)
   drops.visible=rings.visible=player.lengthSq()<38**2
   if(drops.visible){
     for(let i=0;i<64;i++){const a=i%14*Math.PI/7,t=(time*.9+seeds[i%48])%1,r=.84+.62*t
       put(drops,i,r*Math.cos(a),base+1.87+.44*t-1.62*t*t,r*Math.sin(a),.021,.044,.021)}
     for(let i=0;i<14;i++){const a=i*Math.PI/7,r=.04+.19*((time*.8+seeds[i])%1);put(rings,i,1.43*Math.cos(a),base+.702,1.43*Math.sin(a),r,r,1,-Math.PI/2)}
     drops.instanceMatrix.needsUpdate=rings.instanceMatrix.needsUpdate=true
   }
   for(let i=0;i<10;i++){const [x,z]=habitat[i%4],a=time*(.31+i*.014)+seeds[i],xx=x+1.3*Math.sin(a),zz=z+1.1*Math.sin(1.7*a),y=terrainHeight(xx,zz)+.73+.22*Math.cos(a*3)
     for(let k=0;k<2;k++){const sign=k?1:-1;put(wings,i*2+k,xx+sign*.066,y,zz,.088,.056,.04,-.6,a,sign*(.65+Math.sin(time*16+i)*.55))}}
   for(let i=0;i<24;i++){const tree=trees[i%Math.max(1,trees.length)];if(!tree)continue;const t=(time*(.069+i%3*.009)+seeds[i])%1,x=tree.x+Math.sin(t*9+i)*.65+t*.9,z=tree.z+Math.cos(t*6+i)*.7
     put(leaves,i,x,terrainHeight(x,z)+.12+(1-t)*3.2,z,.063,.029,.045,t*8,i,t*12)}
   const [gx,gz]=habitat[0];pollen.visible=Math.hypot(player.x-gx,player.z-gz)<27
   if(pollen.visible){const y=terrainHeight(gx,gz)
     for(let i=0;i<75;i++){const a=seeds[i%48]+time*.09,r=1+(i%11)*.24;sparkPositions[3*i]=gx+Math.cos(a)*r;sparkPositions[3*i+1]=y+.4+((i*.47+time*.095)%4.9);sparkPositions[3*i+2]=gz+Math.sin(a*1.3)*r}
     sparks.attributes.position.needsUpdate=true}
   for(let i=0;i<36;i++){const [x,z]=habitat[i%2],a=seeds[i]+time*.18,xx=x+Math.cos(a+i)*2.3,zz=z+Math.sin(a*1.3)*2.1,r=.011+.016*Math.pow(.5+.5*Math.sin(time*1.8+i),3)
     put(lights,i,xx,terrainHeight(xx,zz)+.6+Math.sin(a)*.41,zz,r,r,r)}
   for(let i=0;i<9;i++){const t=(time*.14+i/9)%1,r=.12+t*.47;put(smoke,i,-6.32+t*1.2,villageRise(-8,-9)+6.7+t*2.5,-10+.16*Math.sin(t*5),r,r*.73,r)}
   for(const m of [leaves,wings,lights,smoke])m.instanceMatrix.needsUpdate=true
 }
}
