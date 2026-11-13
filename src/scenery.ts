import * as T from 'three'
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { atmosphere, plaza } from './paint'
import { decorateFacade } from './facades'
import { landscape } from './landscape'
import {houses,benches,lamps,plantingPlan} from './planting'
import {terrainHeight,villageRise,arrivalClearing,nearTrail} from './geography'
import {gardenOak} from './gardenOak'
export const people=['Town guide','Lab scientist','Workshop engineer','Campus librarian','Garden keeper','Florist','Town courier']
export function scenery(scene:T.Scene){
 const planting=plantingPlan()
 let oak:{x:number;z:number}|undefined
 for(const [x,z] of [[-34,9],[-33,14],[-35,12],[-19,19],[-33,-12],[-36,13]]){
   if(planting.tree(x,z,3.8)){oak=gardenOak(scene,x,z);break}
 }
 let base:number|undefined
 const elevation=(x:number,z:number)=>base??terrainHeight(x,z)+.09
 const lots:{x:number,z:number,w:number,d:number}[]=[]
 const set=new Map<string,T.BufferGeometry[]>()

 let seed=172;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)
 function add(g:T.BufferGeometry,c:string,x:number,y:number,z:number,rx=0,ry=0,rz=0){g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y+elevation(x,z),z);if(!set.has(c))set.set(c,[]);set.get(c)!.push(g)}
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,c:string)=>add(new T.BoxGeometry(w,h,d),c,x,y,z)
 const cyl=(x:number,y:number,z:number,rt:number,rb:number,h:number,c:string,n=16)=>add(new T.CylinderGeometry(rt,rb,h,n),c,x,y,z)
 function ball(x:number,y:number,z:number,w:number,h:number,d:number,c:string){const g=new T.IcosahedronGeometry(1,1);g.scale(w,h,d);add(g,c,x,y,z)}
 plaza(scene)
 base=0
 for(let i=0;i<12;i++){const a=rand()*6.28,r=92+rand()*24;ball(Math.sin(a)*r,-4,Math.cos(a)*r,15+rand()*10,10+rand()*10,18,i%3?'#7daba5':'#91b4ac')}
 base=undefined
 function tree(x:number,z:number,s:number,blossom=false){
   if(!planting.tree(x,z,2.7*s))return
   base=terrainHeight(x,z)+.09
   const palette=blossom?['#c78191','#dfa3ac','#efc3bd']:['#537e55','#739852','#99b46a']
   cyl(x,1.55*s,z,.16*s,.37*s,3.1*s,'#826b53',9)
   for(let i=0;i<8;i++){
     const angle=i*2.4,r=(i<5?1.26:.69)*s
     const xx=x+Math.sin(angle)*r,zz=z+Math.cos(angle)*r,yy=(3.45+i*.16)*s
     if(i<4)add(new T.CylinderGeometry(.09*s,.16*s,1.95*s,7),'#826b53',(x+xx)/2,2.8*s,(z+zz)/2,Math.cos(angle)*.55,0,-Math.sin(angle)*.55)
     ball(xx,yy,zz,1.32*s,1.04*s,1.24*s,palette[i%3])
     for(let j=0;j<3;j++)ball(xx+Math.sin(j*2.1)*.67*s,yy+.48*s,zz+Math.cos(j*2.1)*.7*s,.72*s,.57*s,.68*s,palette[1+j%2])
   }
 }
 function home(x:number,z:number,w:number,h:number,d:number,c:string,roof:string,index:number){base=villageRise(x,z);box(x,-.36,z,w+.22,.83,d+.22,'#ae9e84');lots.push({x,z,w,d});box(x,h/2,z,w,h,d,c);box(x,.28,z,w+.22,.55,d+.22,'#ada187');box(x,h-.2,z,w+.26,.24,d+.26,'#ac936d');const sign=z<0?1:-1,front=z+sign*(d/2+.06)
 const tri=new T.Shape();tri.moveTo(-w/2-.45,0);tri.lineTo(0,1.85);tri.lineTo(w/2+.45,0);tri.closePath();add(new T.ExtrudeGeometry(tri,{depth:d+.8,bevelEnabled:false}),roof,x,h,z-d/2-.4)
 box(x,1.03,front,1.03,2,.13,index===0?'#493e35':'#6b513f');for(const side of [-1,1])for(let y=1.5;y<h-.4;y+=2.05){let wx=x+side*w*.32;box(wx,y,front,1.13,1.39,.13,'#766f5e');box(wx,y,front+.09*sign,.91,1.15,.1,'#608281');box(wx,y,front+.15*sign,.07,1.15,.09,'#f8e1ab');box(wx,y,front+.15*sign,1,.08,.09,'#f8e1ab');box(wx,y-.75,front,.99,.15,.43,'#b18a66')}
 decorateFacade(add,box,ball,x,z,w,h,d,roof,index)
 box(x+w*.28,h+1,z-d*.2,.6,2,.65,roof);for(let i=0;i<8;i++) box(x-w*.35+i*w*.1,2.55,front+sign*.51,w*.1,.16,1.12,i%2?'#f5d6a3':roof)}
 houses.forEach(([x,z,w,h,d],i)=>home(x,z,w,h,d,['#f4dcb4','#e7c595','#e6dbbd'][i%3],['#b76745','#a95438','#707f76'][i%3],i))
 base=villageRise(-8,-9)
 const tx=-6,tz=-12;box(tx,5.7,tz,2.4,11.4,2.4,'#e6cf9f');cyl(tx,12.2,tz,.12,2,2,'#aa6240',4);cyl(tx,13.6,tz,.06,.06,1,'#664a3d');const clock=new T.CircleGeometry(.83,24);add(clock,'#fff3cf',tx,9.85,tz+1.22);box(tx,10.04,tz+1.24,.07,.4,.06,'#534b3d');box(tx+.16,9.85,tz+1.25,.32,.07,.06,'#534b3d')
 base=villageRise(0,0)
 cyl(0,.33,0,2.1,2.35,.58,'#b3a88f',32);cyl(0,.64,0,2.06,2.06,.07,'#7ebfc3',32);cyl(0,1.1,0,.28,.48,.9,'#d6c9ae');cyl(0,1.7,0,.99,.34,.4,'#e5d3b1');cyl(0,1.98,0,.085,.17,.75,'#abdcd9');ball(0,2.33,0,.12,.17,.12,'#d8ede6')
 for(const [x,z] of lamps){base=villageRise(x,z);cyl(x,1.65,z,.095,.15,3.3,'#4a554e',8);box(x,3.48,z,.42,.55,.42,'#ffe8a0');cyl(x,3.86,z,.05,.45,.3,'#48574b',4)}
 for(const [x,z] of benches){base=villageRise(x,z);box(x,.68,z,2,.18,.6,'#a97949');box(x,1.1,z+.28,2,.45,.1,'#ab8053');for(const dx of [-.7,.7])box(x+dx,.33,z,.13,.65,.4,'#5b6556')}
 base=villageRise(-27,6)
 cyl(-27,.05,6,3.1,3.1,.08,'#72a9a4',32);for(let i=0;i<55;i++){const x=-27+rand()*11-5.5,z=2+rand()*8;ball(x,.23,z,.15,.24,.15,['#dfaa6c','#d99591','#c391b2'][i%3])}
 function sign(label:string,x:number,y:number,z:number,width:number,base:string){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle=base;ctx.fillRect(0,0,512,96);ctx.strokeStyle='#e4d7ad';ctx.lineWidth=3;ctx.strokeRect(6,6,500,84);ctx.font='bold 36px Georgia';ctx.fillStyle='#fff4d5';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,256,49,476);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const mat=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});const board=new T.Mesh(new T.PlaneGeometry(width,width*96/512),mat);board.position.set(x,y+villageRise(x,z),z);scene.add(board)}
 sign('Origin Square',-8,3.7,-6.42,4.6,'#47604d');sign('The Cartographer',7,3.6,-7.42,4.9,'#695c41')
 sign('StegoVault Lab',24,3.5,-3.42,5.8,'#365659');sign('Innovation Works',7,4.2,25.39,5.6,'#804e34');sign('Campus Library',-6,4.1,-25.91,5.3,'#54646e');sign('Botanical House',-29,3,-4.42,4.6,'#5a6b41')
 // Fold-out bread counter along the shopfront, inside the market verge.
 base=villageRise(-6.95,-4.94)
 box(-6.95,.7,-4.94,1.65,.12,.49,'#a67b55')
 for(const x of [-7.58,-6.33])box(x,.39,-4.94,.11,.65,.36,'#85664c')
 for(let i=0;i<6;i++){const x=-7.55+(i%3)*.31,z=-5.02+Math.floor(i/3)*.2
   ball(x,.839,z,.15,.087,.09,'#d7a364');box(x,.918,z,.085,.011,.028,'#efcf95')}
 sign('OVEN WARM  •  DAILY LOAVES',-6.95,.59,-4.68,1.59,'#965f47')
 sign('Cycle repairs  ·  East lane',9,1.65,-7.41,1.44,'#5e7973')
 sign('Pressed flowers  /  Fridays',-8.99,1.87,-6.43,1.14,'#a97868')
 // Screen-printed notice outside the bakery.
 const poster=document.createElement('canvas');poster.width=192;poster.height=256
 const ink=poster.getContext('2d')!
 ink.fillStyle='#e8d5ad';ink.fillRect(0,0,192,256);ink.strokeStyle='#915b49';ink.lineWidth=4;ink.strokeRect(9,9,174,238)
 ink.textAlign='center';ink.fillStyle='#774535';ink.font='bold 22px Georgia';ink.fillText('MARKET DAY',96,47)
 ink.fillStyle='#ab744c';ink.beginPath();ink.ellipse(96,125,64,31,-.35,0,Math.PI*2);ink.fill()
 ink.strokeStyle='#f4dca6';ink.lineWidth=6
 for(let i=0;i<3;i++){ink.beginPath();ink.moveTo(65+i*22,116-i*6);ink.quadraticCurveTo(75+i*22,128-i*6,73+i*22,141-i*6);ink.stroke()}
 ink.font='bold 15px Georgia';ink.fillStyle='#505e4c';ink.fillText('FRESH FROM THE OVEN',96,199);ink.fillText('ORIGIN SQUARE',96,224)
 const paper=new T.CanvasTexture(poster);paper.colorSpace=T.SRGBColorSpace
 const notice=new T.Mesh(new T.PlaneGeometry(.63,.84),new T.MeshBasicMaterial({map:paper}))
 notice.position.set(-6.82,1.63+villageRise(-8,-9),-6.43);scene.add(notice)
 // Reading terrace and colonnade outside the campus library.
 base=villageRise(-6,-29)
 box(-6,.17,-24.5,7.7,.32,2.7,'#d3c29e');for(const x of [-9,-7,-5,-3]){cyl(x,1.7,-23.6,.15,.22,3.2,'#e4d6b4');cyl(x,3.33,-23.6,.28,.28,.2,'#cfbc97')}box(-6,3.54,-24.3,7.5,.35,2.5,'#b7a783')
 // The laboratory has a glass annex and a row of turquoise instruments.
 base=villageRise(24,-6)
 box(29.4,1.35,-5.8,2.4,2.7,3.7,'#699598');lots.push({x:29.4,z:-5.8,w:2.4,d:3.7});for(const x of [28.5,29.4,30.3])box(x,1.4,-3.91,.08,2.8,.1,'#dedbc6');box(29.4,2.85,-5.8,2.7,.24,4,'#486b69')
 // The workshop wheel is visible from the southern approach.
 base=villageRise(-7,27)
 const wheel=new T.TorusGeometry(1.04,.14,7,20);add(wheel,'#996b43',-7,2.8,23.4);for(let i=0;i<6;i++)add(new T.BoxGeometry(.12,1.95,.12),'#9f764a',-7,2.8,23.4,0,0,i*Math.PI/6)
 // Trellised garden entrance with climbing roses and a lakeside path.
 base=villageRise(-27,1)
 for(const x of [-29,-25]){cyl(x,1.6,1,.12,.16,3.2,'#89734c');for(let i=0;i<8;i++)ball(x+Math.sin(i)*.25,.5+i*.36,1,.32,.32,.28,i%3?'#698353':'#ce9491')}box(-27,3.25,1,4.5,.2,.55,'#957e53');for(let i=0;i<10;i++){ball(-29+i*.43,3.3+Math.sin(i)*.12,1,.36,.24,.4,i%3?'#78935e':'#d5a0a1')}
 // Thin overflow streams, separate limestone lips and concentric water highlights.
 base=villageRise(0,0)
 for(const [radius,y] of [[2.13,.65],[1.01,1.87],[.44,1.15]]){
   add(new T.TorusGeometry(radius,.066,6,48),'#e5d8b9',0,y,0,Math.PI/2)
 }
 for(let i=0;i<14;i++){
   const angle=i/14*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle)
   const curve=new T.QuadraticBezierCurve3(new T.Vector3(c*.83,1.87,s*.83),new T.Vector3(c*1.24,1.99,s*1.24),new T.Vector3(c*1.42,.69,s*1.42))
   add(new T.TubeGeometry(curve,8,.022,4,false),'#c0e4df',0,0,0)
 }
 for(const radius of [1.32,1.58,1.88])add(new T.TorusGeometry(radius,.016,4,48),'#a4d5ce',0,.687,0,Math.PI/2)
 for(const [x,z,s] of [[-10,-2,1.03],[10,-3,1.19],[-12,3,.94],[11,3,.91],[-26,-3,1.13],[-32,3,1.05],[-11,-24,1.08],[12,-22,.96],[-4.6,-10.6,1.18],[4.3,-12.7,1.05],[-4.7,-18,.96],[4.9,-23,.97]])tree(x,z,s,x<0)
 for(let i=0;i<80;i++){const x=rand()*96-48,z=rand()*96-48
   if(!arrivalClearing(x,z)&&Math.hypot(x,z)<33&&!nearTrail(x,z,2.4)&&Math.abs(x)>7&&Math.abs(z)>7&&Math.hypot(x,z)>15&&!lots.some(b=>Math.abs(x-b.x)<b.w/2+2&&Math.abs(z-b.z)<b.d/2+2))tree(x,z,.74+rand()*.56,i%11===0)}
 base=undefined
 // Curved flower borders and weathered stones around the outer lawn.
 for(let i=0;i<290;i++){const a=rand()*6.28,r=11.2+rand()*2.9,x=Math.sin(a)*r,z=Math.cos(a)*r
   if(!planting.free(x,z,.23)||Math.abs(x)<3.5||Math.abs(z)<3.5||lots.some(b=>Math.abs(x-b.x)<b.w/2+.2&&Math.abs(z-b.z)<b.d/2+.2))continue
   if(i%6===0)ball(x,.11,z,.22+rand()*.24,.18,.26,'#a9ab95')
   else{cyl(x,.15,z,.018,.024,.32,'#769254',4);ball(x,.34,z,.087,.068,.087,['#ecc9ae','#df9b91','#f1cd74'][i%3])}}
 // Market bunting, flower crates, lane fences and stacked parcels.
 for(const [lx,rx,z] of [[-11,-4,-5.9],[4,10,-6.7]]){
   const curve=new T.QuadraticBezierCurve3(new T.Vector3(lx,4.45,z),new T.Vector3((lx+rx)/2,3.35,z+.25),new T.Vector3(rx,4.35,z))
   add(new T.TubeGeometry(curve,16,.025,4,false),'#766955',0,0,0)
   for(let j=1;j<12;j++){const p=curve.getPoint(j/12),shape=new T.Shape();shape.moveTo(-.19,0);shape.lineTo(.19,0);shape.lineTo(.01,-.47);shape.closePath()
     add(new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:false}),['#d68a65','#e4bd76','#89ae9a','#bab0b9'][j%4],p.x,p.y,p.z)}
 }
 for(const [x,z] of [[-4.9,-6.35],[9,-6.95],[-26,-4.6]]){for(let j=0;j<2;j++){box(x+j*.65,.28,z,.59,.5,.55,'#b68b61');for(let k=0;k<3;k++)box(x+j*.65,.12+k*.15,z+.29,.62,.048,.045,'#8b6a4d');for(let k=0;k<6;k++)ball(x+j*.65-.2+(k%3)*.18,.57,z-.1+Math.floor(k/3)*.2,.105,.108,.1,j?'#dfb56b':'#c88056')}}
 for(const [x,z] of [[-30,4],[8,-22],[21,-9]]){for(let i=0;i<6;i++){box(x+i*.85,.52,z,.13,1,.13,'#a18c69');cyl(x+i*.85,1.07,z,.01,.1,.13,'#a18c69',4)}for(const y of [.35,.78])box(x+2.1,y,z,4.25,.09,.1,'#b69c76')}
 // Tapered cypresses mark the avenue toward the campus.
 for(const side of [-1,1])for(let j=0;j<9;j++){
   const x=side*(3.95+(j%2)*.38),z=-15-j*2.95
   if(!planting.tree(x,z,.85))continue
   cyl(x,.75,z,.12,.19,1.5,'#806b52',7)
   ball(x,2.1,z,.74,1.82,.62,'#5e8363');ball(x+.1,3.08,z,.46,1.24,.43,'#79996d')
 }
 // Open-sided achievement pavilion and a painter’s courtyard off the coastal trails.
 base=villageRise(24,-26)
 const px=24,pz=-26
 cyl(px,.10,pz,2.7,2.9,.30,'#cdbd9b',8)
 for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4;cyl(px+Math.cos(a)*2.45,1.71,pz+Math.sin(a)*2.45,.11,.16,3.1,'#967758',8)}
 cyl(px,3.45,pz,2.85,3,.26,'#a97c58',8);cyl(px,4.16,pz,.28,3,1.28,'#708c81',8);cyl(px,4.94,pz,.055,.19,.45,'#caac71',8)
 sign('Achievement Pavilion',px,2.83,pz+2.45,3.35,'#506e65')
 sign('CYA Quest  /  Third place',px,1.42,pz+.8,2.4,'#8d7456')
 base=villageRise(-24,23)
 for(const x of [-26,-22]){box(x,.85,23,.09,1.7,.12,'#8e7051');box(x,1.36,23,1.38,1.07,.09,'#e7d4aa')
   ball(x,1.38,23.09,.42,.22,.025,x===-26?'#82aaa0':'#d09a80')}
 sign('Creative District',-24,2.06,22.9,2.95,'#7b7566')
 base=undefined
 sign("Horizon Point",42,1.7+terrainHeight(42,-31)+.09-villageRise(42,-31),-31,3.1,"#526f67")
 for(const x of [40.7,43.3])cyl(x,.84,-31,.065,.1,1.7,"#947557",8)
 landscape(scene,lots,planting)
 // Batch static meshes by location. Vertex colors allow every finish to share one shader.
 const regions=new Map<string,T.BufferGeometry[]>()
 for(const [color,geos] of set){
   const pigment=new T.Color(color)
   for(const source of geos){
     const g=source.index?source.toNonIndexed():source;g.deleteAttribute('uv')
     const pos=g.attributes.position,colors=new Float32Array(pos.count*3)
     for(let i=0;i<pos.count;i++){colors[i*3]=pigment.r;colors[i*3+1]=pigment.g;colors[i*3+2]=pigment.b}
     g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeBoundingSphere()
     const center=g.boundingSphere!.center,key=Math.floor(center.x/20)+','+Math.floor(center.z/20)
     if(!regions.has(key))regions.set(key,[]);regions.get(key)!.push(g);if(source!==g)source.dispose()
   }
 }
 const gradient=new T.DataTexture(new Uint8Array([106,166,209,245]),4,1,T.RedFormat)
 gradient.minFilter=gradient.magFilter=T.NearestFilter;gradient.needsUpdate=true
 const surface=new T.MeshToonMaterial({vertexColors:true,gradientMap:gradient});surface.addEventListener('dispose',()=>gradient.dispose())
 const breeze={value:0}
 surface.onBeforeCompile=shader=>{
   shader.uniforms.breeze=breeze;shader.vertexShader='uniform float breeze;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
   #include <begin_vertex>
   float leafMask=step(color.r*1.18,color.g)*step(color.b*1.25,color.g);
   transformed.x+=leafMask*.047*sin(breeze*.92+position.z*.62+position.y*.45);
   transformed.z+=leafMask*.023*cos(breeze*.71+position.x*.55);`)
 }
 for(const parts of regions.values()){
   const mesh=new T.Mesh(mergeGeometries(parts),surface);mesh.castShadow=mesh.receiveShadow=true
   scene.add(mesh);parts.forEach(g=>g.dispose())
 }
 atmosphere(scene)
 return {lots,planting,breeze,oak}
}
