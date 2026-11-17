import * as T from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

import {contour} from './contour'
import {hairLock,panel,stroke} from './characterDetail'
import {pose} from './poses'

const outfits=['#39353b','#dfac53','#e6e7d9','#388988','#555f74','#77936e','#bf8790','#59848e','#6e8885','#b66950','#488794']
const hairColors=['#302d33','#674332','#453b37','#573c32','#938678','#68473a','#63443d','#383d3a','#908074','#473b39','#513836']
const skinColors=['#f1c1ac','#bb8669','#cb9674','#a9785e','#d9ae8d','#d5a280','#bd856d','#c88d6b','#c29476','#ac785e','#cf9978']

// Merge costume pieces per joint so embroidery, eyes and accessories add no draw calls.
export function person(role:number){
  const root=new T.Group(),body=new T.Group();root.add(body)
  const pieces=new Map<T.Group,T.BufferGeometry[]>()
  const ramp=new T.DataTexture(new Uint8Array([40,64,202,213]),4,1,T.RedFormat)
  ramp.minFilter=ramp.magFilter=T.NearestFilter;ramp.needsUpdate=true
  const surface=new T.MeshToonMaterial({vertexColors:true,gradientMap:ramp})
  // A narrow ink tone on grazing angles keeps the silhouette legible
  // against pale stone, using the existing character draw calls.
  surface.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>', `
      float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
      outgoingLight *= mix(vec3(.47,.51,.55),vec3(1.),smoothstep(.035,.20,facing));
      #include <opaque_fragment>`)
  }
  surface.addEventListener('dispose',()=>ramp.dispose())
  const hair=hairColors[role],skin=skinColors[role],cloth=outfits[role]
  function joint(parent:T.Group,x:number,y:number,z:number){
    const part=new T.Group();part.position.set(x,y,z);parent.add(part);return part
  }
  function part(node:T.Group,g:T.BufferGeometry,color:string,x:number,y:number,z:number,sx=1,sy=1,sz=1,rz=0){
    g.scale(sx,sy,sz);g.rotateZ(rz);g.translate(x,y,z)
    const geom=g.index?g.toNonIndexed():g;geom.deleteAttribute('uv')
    const shade=new T.Color(color),colors=new Float32Array(geom.attributes.position.count*3)
    for(let i=0;i<colors.length;i+=3){colors[i]=shade.r;colors[i+1]=shade.g;colors[i+2]=shade.b}
    geom.setAttribute('color',new T.BufferAttribute(colors,3))
    if(!pieces.has(node))pieces.set(node,[]);pieces.get(node)!.push(geom);if(g!==geom)g.dispose()
  }
  function oval(node:T.Group,c:string,x:number,y:number,z:number,a:number,b:number,d:number,tilt=0){
    part(node,new T.SphereGeometry(1,18,12),c,x,y,z,a,b,d,tilt)
  }
  function leather(node:T.Group,c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=.045){
    part(node,new RoundedBoxGeometry(w,h,d,1,r),c,x,y,z)
  }
  const head=joint(body,0,1.59,0)
  part(head,contour([[-.246,.046,.063,.059],[-.209,.122,.128,.046],[-.129,.197,.174,.03],[-.035,.235,.197,.017],[.058,.246,.205,.011],[.174,.23,.193],[.245,.16,.142],[.271,.035,.042]]),skin,0,0,0)

  function seam(node:T.Group,color:string,points:number[][],width=.005){
    part(node,stroke(points,width),color,0,0,0)
  }
  function patch(node:T.Group,color:string,rows:number[][][]){
    part(node,panel(rows.map(row=>row.map(([x,y,z])=>new T.Vector3(x,y,z)))),color,0,0,0)
  }
  for(const side of [-1,1]){
    oval(head,skin,side*.237,.003,0,.043,.061,.045)
    oval(head,'#cb9688',side*.266,.009,.014,.012,.033,.023)
    // Follow the cheek curvature so the eyes stay set into the face in profile.
    const eye=(u:number,v:number,d=0)=>[side*(.103+u),.021+v,.211-u*.48+d]
    const strip=(upper:number[][],lower:number[][],c:string,d:number)=>{
      const rows=[lower,upper].map(line=>line.map(([u,v])=>eye(u,v,d)))
      if(side<0)rows.forEach(row=>row.reverse())
      patch(head,c,rows)
    }
    strip([[-.058,-.003],[-.036,.020],[.002,.032],[.038,.030],[.069,.025]],
      [[-.058,-.006],[-.036,-.019],[.002,-.029],[.038,-.017],[.069,.025]],'#f9ede4',0)
    const iris=role===0?'#7cabb2':['#79745c','#779499','#977452'][role%3]
    const irisGeo=new T.SphereGeometry(1,20,14);irisGeo.scale(.024,.028,.005);irisGeo.rotateY(side*.42)
    part(head,irisGeo,iris,side*.104,.022,.215)
    oval(head,'#41414a',side*.103,.026,.221,.011,.019,.004)
    oval(head,'#fff4dd',side*.099-.006,.035,.225,.005,.006,.002)
    strip([[-.058,-.003],[-.035,.026],[.003,.041],[.045,.040],[.078,.038]],
      [[-.058,-.005],[-.035,.018],[.003,.028],[.045,.026],[.078,.038]],'#393039',.014)
    seam(head,hair,[eye(-.053,.064,-.003),eye(.005,.082,-.003),eye(.058,.079,-.003)],.007)
  }
  part(head,contour([[-.064,.005,.009,.216],[-.053,.023,.029,.221],[-.033,.018,.027,.22],[.011,.007,.011,.212]],16),skin,0,0,0)
  seam(head,'#aa7876',[[-.033,-.121,.208],[0,-.126,.212],[.033,-.12,.207]],.0035)
  const long=role===6||role===9,short=role===3||role===7||role===10
  oval(head,hair,0,.105,-.03,.253,.229,.221)
  const direction=role%3===1?-1:1
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8,front=Math.cos(a),end=1.82-.36*front+(long?.32:short?-.13:0)
    const tint=new T.Color(hair).offsetHSL(0,0,(i%4)*.008)
    part(head,hairLock(a,direction*(.48+.12*Math.sin(i)),end+.09*Math.sin(i*2.3),.35,.004), '#'+tint.getHexString(),0,0,0)
  }
  for(let i=0;i<6;i++){
    const tint=new T.Color(hair).offsetHSL(0,0,.018+(i%3)*.012)
    part(head,hairLock(direction*(-.46+i*.247),-direction*.83,1.46+.22*Math.sin(i*.9),.32,.016+i*.001),'#'+tint.getHexString(),0,0,.006)
  }
  if(![5,7,9,10].includes(role)){
    for(const side of [-1,1]){
      const w=side<0?.068:.04
      const x=side*.07
      patch(head,hair,[[[x-w,.287,.06],[x+w,.298,.05]],[[x-w*.65,.331,.022],[x+w*.9,.338,.006]],[[x+side*.051,.353,-.023],[x+side*.052,.354,-.024]]])
    }
  }
  if(role===6||role===9)for(let j=0;j<4;j++)oval(head,hair,.18,.03-j*.077,-.14,.088-j*.008,.09,.075)
  if(role===5||role===6||role===1)oval(head,hair,0,.008,-.216,.139,.169,.134)
  if(role===5||role===7){oval(head,role===5?'#be9a62':'#687e77',0,.213,0,.353,.042,.30);oval(head,role===5?'#e4c48b':'#789288',0,.26,-.02,.264,.13,.234)}
  part(body,contour([[.763,.232,.159],[.802,.252,.169],[.939,.213,.142],[1.103,.245,.168],[1.213,.278,.17],[1.265,.236,.153],[1.303,.135,.108]]),cloth,0,0,0)
  oval(body,cloth,0,1.23,0,.267,.112,.181)
  part(body,new T.CylinderGeometry(.094,.096,.14,10),skin,0,1.38,0)
  const trim=role===0?'#3e3940':role===1?'#824c41':'#e5d9b9'
  part(body,contour([[1.275,.149,.112],[1.303,.135,.106],[1.323,.121,.093]]),trim,0,0,0)
  if(role===0){
    // The ivory insert wraps the front and flanks. The hood and rear stay charcoal.
    const frontPanel=(rows:number[][],color:string)=>{
      const points=rows.map(([y,w,d,arc])=>Array.from({length:21},(_,j)=>{
        const a=(j/10-1)*arc
        return [w*Math.sin(a),y,d*Math.cos(a)+.007]
      }))
      patch(body,color,points)
    }
    frontPanel([[.766,.235,.161,1.45],[.80,.256,.173,1.45],[.94,.227,.159,1.49],[1.085,.25,.174,1.5]],'#e4d9c8')
    frontPanel([[.769,.237,.165,1.47],[.811,.258,.178,1.47]],'#cfc4b7')
    seam(body,'#4b454b',[[-.176,1.027,-.119],[-.08,.995,-.157],[.027,1.003,-.17]],.004)
    seam(body,'#4b454b',[[.175,.895,-.105],[.133,.878,-.138],[.067,.879,-.155]],.005)
    part(body,contour([[-.145,.055,.055,-.05],[-.12,.134,.081,-.048],[-.05,.194,.108,-.024],[.038,.214,.125],[.074,.18,.113]],28),cloth,0,1.291,-.113)
    for(const side of [-1,1]){
      seam(body,'#494349',[[side*.175,1.328,-.12],[side*.175,1.353,.015],[side*.132,1.31,.095],[side*.028,1.237,.165]],.029)
      seam(body,'#a99e9a',[[side*.116,1.289,.128],[side*.114,1.222,.174],[side*.124,1.112,.179]],.007)
      seam(body,'#312e34',[[side*.124,1.125,.18],[side*.125,1.105,.18]],.009)
      seam(body,'#ac9e90',[[side*.137,1.045,.153],[side*.152,.991,.137],[side*.187,.932,.103]],.004)
    }
  }else{
    for(const side of [-1,1]){
      seam(body,trim,[[side*.154,1.29,.075],[side*.215,1.266,.084],[side*.252,1.226,.081]],.005)
      seam(body,cloth,[[side*.19,.96,.086],[side*.199,.918,.084],[side*.219,.877,.073]],.009)
    }
    part(body,contour([[.764,.234,.161],[.785,.251,.169]],24),cloth,0,0,0)
  }
  const elbows:T.Group[]=[],knees:T.Group[]=[]
  const arms=[-1,1].map(s=>{
    const a=joint(body,s*.235,1.224,0),e=joint(a,s*.05,-.241,0);elbows.push(e)
    part(a,contour([[-.244,.087,.083],[-.212,.11,.10],[-.13,.111,.106],[-.045,.105,.10],[.009,.083,.08],[.039,.041,.052]],20),cloth,s*.027,0,0,1,1,1,s*.12)
    part(a,contour([[-.24,.091,.086],[-.213,.107,.099]],12),trim,s*.031,0,0,1,1,1,s*.12)
    part(e,contour([[-.214,.044,.047],[-.14,.057,.056],[-.065,.064,.068],[.015,.068,.071]],14),skin,s*.018,0,0)
    if(role===0){
      part(e,contour([[-.216,.065,.062],[-.19,.07,.068],[-.169,.095,.086],[-.147,.083,.082],[-.11,.099,.088],[-.043,.102,.094],[.025,.085,.084]],20),cloth,s*.018,0,0)
      part(e,contour([[-.219,.063,.063],[-.184,.07,.069]],20),'#302d32',s*.018,0,0)
      seam(a,'#75a9a5',[[s*.078,.003,.051],[s*.123,-.075,.047],[s*.133,-.152,.045]],.004)
    }
    oval(e,skin,s*.018,-.25,.009,.047,.066,.045)
    oval(e,skin,-s*.018,-.236,.03,.018,.04,.022,-s*.32)
    return a
  })
  const legs=[-1,1].map(s=>{
    const leg=joint(body,s*.12,.76,0),k=joint(leg,0,-.349,0);knees.push(k)
    const pants=role===0?'#403b42':role===2?'#697780':'#46545a'
    part(leg,contour([[-.376,.095,.095],[-.347,.106,.102],[-.29,.105,.106],[-.175,.133,.134],[-.09,.137,.139],[.01,.117,.12]],20),pants,0,0,0)
    part(k,contour([[-.255,.065,.069],[-.212,.071,.072],[-.192,.098,.091],[-.166,.102,.097],[-.141,.094,.092],[-.104,.11,.112],[-.046,.107,.108],[.025,.092,.096]],20),pants,0,0,0)
    part(k,contour([[-.255,.066,.070],[-.218,.074,.075]],20),role===0?'#322e34':pants,0,0,0)
    part(k,contour([[-.309,.057,.062],[-.248,.061,.064]],16),role===0?skin:'#dfdbca',0,0,0)
    const shoe=role===0?'#6fc9cf':role===6?'#c2949a':'#697978'
    part(k,contour([[-.365,.096,.148,.047],[-.349,.099,.15,.049],[-.325,.097,.143,.055],[-.309,.085,.117,.03],[-.275,.07,.081,.004]],24),shoe,0,0,0)
    part(k,contour([[-.373,.094,.144,.046],[-.365,.10,.151,.048],[-.35,.101,.151,.048]],24),'#e4dfd1',0,0,0)
    part(k,contour([[-.375,.093,.144,.046],[-.37,.098,.149,.047]],24),role===0?'#ad554b':'#535952',0,0,0)
    for(const side of [-1,1]){
      patch(k,'#47474c',[[[side*.095,-.347,.092],[side*.091,-.347,-.033]],[[side*.087,-.319,.056],[side*.07,-.298,-.036]]].map(row=>side<0?row:row.reverse()))
      seam(leg,pants,[[side*.071,-.32,.076],[side*.04,-.304,.097],[side*.012,-.301,.109]],.006)
    }
    oval(k,'#44444b',0,-.287,.069,.058,.024,.064,-s*.04)
    for(let j=0;j<3;j++)seam(k,'#f2ede3',[[-.044,-.273-j*.009,.073+j*.022],[0,-.26-j*.012,.078+j*.022],[.044,-.272-j*.009,.076+j*.022]],.005)
    if(role===0){
      const pocket=new RoundedBoxGeometry(.045,.171,.139,2,.016)
      part(leg,pocket,'#49434c',s*.121,-.171,-.007,1,1,1,s*.055)
      leather(leg,'#544e55',s*.139,-.105,-.009,.034,.047,.15,.008)
      seam(leg,'#a09584',[[s*.089,-.029,.088],[s*.112,-.064,.064],[s*.12,-.088,.045]],.005)
      patch(leg,'#ddd1a9',[[[s*.069,-.086,.111],[s*.104,-.081,.089]],[[s*.084,-.061,.108],[s*.09,-.064,.102]]].map(row=>s>0?row:row.reverse()))
    }
    return leg
  })
  if(role===7){
    // A cross-body canvas bag reads clearly from the following camera.
    part(body,new RoundedBoxGeometry(.067,.73,.033,2,.012),'#565f5e',0,1.045,-.163,1,1,1,-.63)
    part(body,new RoundedBoxGeometry(.065,.68,.03,2,.012),'#505a58',0,1.052,.153,1,1,1,.63)
    part(body,contour([[-.17,.074,.06],[-.14,.171,.084],[-.025,.222,.102],[.11,.209,.086],[.156,.135,.064]],24),'#586466',-.097,.925,-.198,1,1,1,-.29)
    part(body,new RoundedBoxGeometry(.225,.014,.016,2,.005),'#343d40',-.107,.993,-.291,1,1,1,-.24)
  }
  if(role===2||role===4){for(const side of [-1,1]){const ring=new T.TorusGeometry(.06,.007,5,14);part(head,ring,'#474a45',side*.103,.022,.235)}leather(head,'#474a45',0,.023,.238,.089,.009,.009,.003)}
  if([3,5,6,8,9].includes(role)){
    const apron=role===3?'#917456':role===9?'#c9ae87':'#c7b69b'
    const sections=[[.747,.205,.166],[.80,.221,.179],[.957,.187,.16],[1.075,.168,.179],[1.15,.115,.182],[1.207,.108,.177]]
    patch(body,apron,sections.map(([y,w,d])=>Array.from({length:13},(_,i)=>{
      const u=i/6-1;return [u*w,y,d-.075*u*u]
    })))
    for(const side of [-1,1])seam(body,apron,[[side*.105,1.195,.155],[side*.125,1.258,.131],[side*.116,1.297,.091]],.014)
    patch(body,apron,[[[-.08,.885,.163],[0,.876,.174],[.08,.885,.163]],[[-.084,.967,.165],[0,.967,.176],[.084,.967,.165]]])
    seam(body,'#917d68',[[-.084,.967,.167],[0,.962,.179],[.084,.967,.167]],.003)
  }
  if(role===4)leather(arms[0],'#945b4a',-.03,-.36,.097,.175,.26,.073)
  if(role===2||role===4){
    for(const side of [-1,1])part(body,new RoundedBoxGeometry(.085,.19,.018,1,.009),'#d8dacd',side*.069,1.22,.153,1,1,1,-side*.43)
    leather(body,'#566069',0,1.115,.179,.033,.182,.014,.005)
  }
  if(role===2||role===4){part(body,new T.ConeGeometry(.31,.48,12,1,true),cloth,0,.79,0,1,1,.72)}

  if(role===9){oval(head,'#e9d8b9',0,.31,-.025,.24,.12,.21);oval(head,'#ccae8b',0,.238,-.015,.248,.044,.215)}
  if(role===10){oval(head,'#44717e',0,.21,-.024,.275,.168,.254);for(const x of [-.084,.084])oval(head,'#d7b571',x,.315,-.014,.028,.057,.158)}
  if(role===8){
    const e=elbows[1]
    part(e,new T.CylinderGeometry(.019,.022,.99,7),'#97704a',.025,-.45,.045)
    part(e,new T.CylinderGeometry(.058,.134,.244,9),'#c49d69',.025,-1.03,.045,1,1,.59)
  }
  const ink=new T.MeshBasicMaterial({color:'#283034',side:T.BackSide})
  ink.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed += normalize(normal) * 0.0024;')
  }
  for(const [node,geometries] of pieces){const mesh=new T.Mesh(mergeGeometries(geometries),surface);mesh.castShadow=mesh.receiveShadow=true;node.add(mesh,new T.Mesh(mesh.geometry,ink));geometries.forEach(g=>g.dispose())}
  const size=[1.02,1,1.04,.98,1.02,.99,.95,1,.98,1.03,.98][role]
  root.scale.set(size*(role===3||role===9?.88:.81),size,size*.87)
  head.scale.set(.77,.73,.75)
  head.position.y=1.527
  for(const leg of legs){leg.scale.y=1.19;leg.position.y+=.144}
  for(const child of body.children)if(!legs.includes(child as T.Group))child.position.y+=.144
  return {root,animate:pose({body,head,arms,legs,knees,elbows},role)}
}
