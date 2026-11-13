import * as T from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

import {contour} from './contour'
import {pose} from './poses'

const outfits=['#526c73','#b36f50','#eae0c8','#48817d','#566681','#78915c','#ba8193','#b09059','#718a8f','#884e46','#638f9c']
const hairColors=['#3e3536','#674332','#453b37','#573c32','#938678','#68473a','#63443d','#383d3a','#908074','#473b39','#513836']
const skinColors=['#dba785','#bb8669','#cb9674','#a9785e','#d9ae8d','#d5a280','#bd856d','#c88d6b','#c29476','#ac785e','#cf9978']

// Merge costume pieces per joint so embroidery, eyes and accessories add no draw calls.
export function person(role:number){
  const root=new T.Group(),body=new T.Group();root.add(body)
  const pieces=new Map<T.Group,T.BufferGeometry[]>()
  const ramp=new T.DataTexture(new Uint8Array([90,139,200,246]),4,1,T.RedFormat)
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
    part(node,new T.SphereGeometry(1,12,8),c,x,y,z,a,b,d,tilt)
  }
  function leather(node:T.Group,c:string,x:number,y:number,z:number,w:number,h:number,d:number,r=.045){
    part(node,new RoundedBoxGeometry(w,h,d,1,r),c,x,y,z)
  }
  const head=joint(body,0,1.59,0)
  part(head,contour([[-.246,.046,.063,.059],[-.209,.122,.128,.046],[-.129,.197,.174,.03],[-.035,.235,.197,.017],[.058,.246,.205,.011],[.174,.23,.193],[.245,.16,.142],[.271,.035,.042]]),skin,0,0,0)

  for(const side of [-1,1]){
    oval(head,skin,side*.245,.002,0,.043,.07,.049)
    oval(head,'#513e40',side*.102,.021,.196,.061,.035,.012,-side*.10)
    oval(head,'#f8e6cc',side*.102,.015,.206,.054,.024,.008,-side*.10)
    oval(head,'#664e43',side*.099,.017,.214,.025,.026,.009)
    oval(head,'#fff7de',side*.099-.009,.025,.224,.009,.01,.005)
    oval(head,hair,side*.101,.087,.206,.054,.012,.009,-side*.12)
  }
  oval(head,'#c58f76',0,-.043,.209,.022,.027,.019);oval(head,'#ac7066',0,-.127,.202,.037,.009,.008)
  oval(head,hair,0,.125,-.034,.274,.238,.236)
  // Build swept, tapered locks around the skull. Short crowns, braids and
  // longer side locks give each silhouette a recognizable profile.
  const lock=(x:number,y:number,z:number,w:number,length:number,angle:number,color:string)=>{
    const geo=new T.SphereGeometry(1,8,6),v=geo.attributes.position
    for(let j=0;j<v.count;j++){const t=(1-v.getY(j))*.5;v.setX(j,v.getX(j)*(1-.82*t)+.42*t*t);v.setZ(j,v.getZ(j)*(1-.7*t))}
    geo.computeVertexNormals();part(head,geo,color,x,y,z,w,length,w*.64,angle)
  }
  const long=role===6||role===9,short=role===3||role===7||role===10
  for(let i=0;i<13;i++){
    const a=i*Math.PI*2/13,front=Math.cos(a),len=(short?.096:long?.22:.15)+(1-front)*.039
    lock(Math.sin(a)*.225,.13+front*.038,front*.197-.014,.108,len,Math.sin(a)*.34+(role===0?.32:.08),hair)
  }
  for(let i=0;i<5;i++)lock(-.149+i*.071,.16+i*.008,.19,.072,.109+(i%3)*.025,-.6,hair)
  if(role===0){
    for(let i=0;i<6;i++)lock(-.14+i*.054,.236,-.158+i%2*.017,.055,.118,-.73,i%2?'#463b39':'#55453f')
    lock(.09,.327,-.03,.072,.136,-.8,hair)
  }
  if(role===6||role===9)for(let j=0;j<4;j++)oval(head,hair,.18,.03-j*.077,-.14,.088-j*.008,.09,.075)
  if(role===5||role===6||role===1)oval(head,hair,0,.008,-.216,.139,.169,.134)
  if(role===5||role===7){oval(head,role===5?'#be9a62':'#687e77',0,.213,0,.353,.042,.30);oval(head,role===5?'#e4c48b':'#789288',0,.26,-.02,.264,.13,.234)}
  part(body,contour([[.763,.232,.159],[.802,.252,.169],[.939,.213,.142],[1.103,.245,.168],[1.213,.278,.17],[1.265,.236,.153],[1.303,.135,.108]]),cloth,0,0,0)
  if(role===0){
    // Split jacket skirts with contrasting lining and an offset closure.
    for(const side of [-1,1]){
      const panel=contour([[-.17,.104,.053],[-.149,.122,.058],[.03,.117,.053],[.13,.102,.048]],10)
      part(body,panel,'#435c65',side*.121,.889,.113,1,1,1,side*.075)
      oval(body,'#acc2ae',side*.192,1.225,.103,.073,.017,.049,side*.25)
    }
    leather(body,'#b39a72',.043,1.02,.171,.014,.36,.013,.004)
  }
  oval(body,cloth,0,1.23,0,.267,.112,.181)
  part(body,new T.CylinderGeometry(.094,.096,.14,10),skin,0,1.38,0)
  const scarf=role===0?'#dba458':role===3?'#c28b57':'#e4d4ab'
  oval(body,scarf,0,1.327,.012,.185,.069,.156)
  oval(body,scarf,-.139,1.181,.161,.062,.145,.032,-.22)
  leather(body,'#725a47',0,.804,.003,.50,.071,.327,.025)
  leather(body,'#d2aa68',0,.804,.18,.072,.055,.015,.006)
  const elbows:T.Group[]=[],knees:T.Group[]=[]
  const arms=[-1,1].map(s=>{
    const a=joint(body,s*.244,1.23,0),e=joint(a,s*.05,-.241,0);elbows.push(e)
    part(a,contour([[-.244,.087,.083],[-.212,.11,.10],[-.11,.125,.112],[-.02,.108,.101],[.032,.061,.069]],12),cloth,s*.027,0,0,1,1,1,s*.12)
    oval(e,role===0||role===2?cloth:skin,s*.016,-.09,0,.071,.127,.074)
    leather(e,role===0?'#9d694c':scarf,s*.02,-.167,.005,.136,.052,.137,.02)
    oval(e,skin,s*.023,-.221,.016,.066,.077,.069)
    return a
  })
  const legs=[-1,1].map(s=>{
    const leg=joint(body,s*.12,.76,0),k=joint(leg,0,-.349,0);knees.push(k)
    part(leg,contour([[-.37,.085,.085],[-.286,.11,.114],[-.12,.127,.135],[.003,.108,.11]],12),role===2?'#647681':'#384951',0,0,0)
    part(k,contour([[-.209,.079,.081],[-.162,.104,.103],[-.077,.111,.113],[.023,.085,.087]],12),'#43535a',0,0,0)
    leather(k,'#77533f',0,-.224,.019,.18,.236,.195)
    leather(k,'#815a42',0,-.322,.069,.193,.117,.287)
    leather(k,'#493e37',0,-.369,.067,.199,.038,.3,.014)
    for(const y of [-.18,-.23])leather(k,'#c1a07a',0,y,.119,.117,.016,.012,.003)
    return leg
  })
  if(role===0||role===7){
    part(body,contour([[-.235,.138,.079],[-.204,.206,.113],[-.053,.237,.134],[.164,.214,.123],[.232,.158,.09]],16),'#886241',0,1.05,-.266)

    part(body,contour([[-.212,.128,.074],[-.169,.201,.114],[.102,.199,.119],[.203,.151,.084]],16),'#c29762',0,1.06,-.294)
    leather(body,'#e0b579',0,1.188,-.40,.448,.167,.085)
    leather(body,'#af7948',0,.949,-.416,.271,.14,.067,.027)
    for(const side of [-1,1]){oval(body,'#715944',side*.17,1.10,.145,.043,.232,.034,side*.09);leather(body,'#6b5139',side*.129,1.105,-.445,.044,.12,.024,.01);leather(body,'#e4c47f',side*.129,1.09,-.461,.054,.039,.016,.004)}
  }
  if(role===2||role===4){for(const side of [-1,1]){const ring=new T.TorusGeometry(.06,.007,5,14);part(head,ring,'#474a45',side*.103,.022,.235)}leather(head,'#474a45',0,.023,.238,.089,.009,.009,.003)}
  if(role===3||role===5||role===6){leather(body,role===3?'#886346':'#d2b999',0,1.028,.187,.323,.41,.045);leather(body,'#a88768',0,.96,.222,.15,.083,.018,.01)}
  if(role===4)leather(arms[0],'#945b4a',-.03,-.36,.097,.175,.26,.073)
  if(role===0){
    // Tailored collar and jacket hem, bedroll, rolled map, and an enamel compass.
    part(body,new T.CylinderGeometry(.241,.278,.14,16),'#374e5a',0,.78,0,1,1,.73)
    for(const s of [-1,1]){
      oval(body,'#456570',s*.115,1.19,.148,.093,.164,.043,-s*.29)
      leather(body,'#b69b73',s*.145,.94,.16,.14,.024,.032,.007)
    }
    part(body,new T.CylinderGeometry(.086,.086,.49,14),'#7a9184',0,1.319,-.309,1,1,1,Math.PI/2)
    for(const x of [-.159,.159])part(body,new T.CylinderGeometry(.09,.09,.035,12),'#77553d',x,1.319,-.309,1,1,1,Math.PI/2)
    part(body,new T.CylinderGeometry(.049,.051,.34,10),'#e5d0a1',-.235,1.07,-.31,1,1,1,-.12)
    oval(body,'#e0b663',.014,1.183,-.451,.061,.061,.017)
    oval(body,'#486c70',.014,1.183,-.468,.047,.047,.01)
    leather(body,'#f7d797',.014,1.183,-.479,.012,.067,.01,.003)
  }
  if(role===2||role===4){part(body,new T.ConeGeometry(.31,.48,12,1,true),cloth,0,.79,0,1,1,.72)}
  if(role===8||role===9){leather(body,role===8?'#b4a289':'#d5b07a',0,1.008,.173,.35,.47,.055);leather(body,'#88745b',.068,.94,.21,.14,.092,.019)}
  if(role===9){oval(head,'#e9d8b9',0,.31,-.025,.24,.12,.21);oval(head,'#ccae8b',0,.238,-.015,.248,.044,.215)}
  if(role===10){oval(head,'#44717e',0,.21,-.024,.275,.168,.254);for(const x of [-.084,.084])oval(head,'#d7b571',x,.315,-.014,.028,.057,.158)}
  if(role===8){
    const e=elbows[1]
    part(e,new T.CylinderGeometry(.019,.022,.99,7),'#97704a',.025,-.45,.045)
    part(e,new T.CylinderGeometry(.058,.134,.244,9),'#c49d69',.025,-1.03,.045,1,1,.59)
  }
  for(const [node,geometries] of pieces){const mesh=new T.Mesh(mergeGeometries(geometries),surface);mesh.castShadow=mesh.receiveShadow=true;node.add(mesh);geometries.forEach(g=>g.dispose())}
  const size=[1.05,1.03,1.08,.96,1.04,.98,.91,1.01,.98,1.04,.98][role]
  const breadth=[.98,.94,.88,1.13,.89,1.12,.89,1,1.04,1.18,.92][role]
  root.scale.set(size*breadth,size,size)
  head.scale.setScalar(role===0?.78:.82)
  // Longer legs and a narrower torso give a more mature silhouette.
  if(role===0||role===1||role===2||role===6){
    for(const leg of legs){leg.scale.y=1.14;leg.position.y+=.101}
    for(const child of body.children)if(!legs.includes(child as T.Group))child.position.y+=.101
  }
  return {root,animate:pose({body,head,arms,legs,knees,elbows},role)}
}
