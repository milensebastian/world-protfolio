import * as T from 'three'
import {seaLevel,terrainHeight,walkHeight} from './geography'

// Distances on the town plan are arc lengths measured out from Origin Square.
export const radius=27
export function normalAt(x:number,z:number,out=new T.Vector3()){
  const r=Math.hypot(x,z),a=r/radius,k=r?Math.sin(a)/r:1/radius
  return out.set(k*x,Math.cos(a),k*z)
}
export function toGlobe(p:T.Vector3,out=new T.Vector3()){
  const elevation=radius+p.y
  return normalAt(p.x,p.z,out).multiplyScalar(elevation)
}
export function toPlan(n:T.Vector3,out:T.Vector3){
  const len=Math.hypot(n.x,n.z),r=radius*Math.atan2(len,n.y)
  return out.set(len?r*n.x/len:0,0,len?r*n.z/len:0)
}
export function surfaceHeight(x:number,z:number){
  return Math.max(seaLevel,walkHeight(x,z))
}

// Parallel transport of a tangent direction keeps controls continuous across
// the far pole, where a flat map's azimuth changes by half a revolution.
export function transport(forward:T.Vector3,oldUp:T.Vector3,newUp:T.Vector3,q:T.Quaternion){
  forward.applyQuaternion(q.setFromUnitVectors(oldUp,newUp)).projectOnPlane(newUp).normalize()
}

const projection=`
vec3 globePoint(vec3 p){
  float r=length(p.xz),a=r/27.0;
  float k=r>0.0001?sin(a)/r:1.0/27.0;
  return (27.0+p.y)*vec3(p.x*k,cos(a),p.z*k);
}
mat3 globeFrame(vec3 p){
  vec2 axis=normalize(p.xz+vec2(0.000001,0.0));float a=length(p.xz)/27.0;
  float c=cos(a),s=sin(a),m=c-1.0;
  return mat3(vec3(1.0+m*axis.x*axis.x,-s*axis.x,m*axis.x*axis.y),
    vec3(s*axis.x,c,s*axis.y),vec3(m*axis.x*axis.y,-s*axis.y,1.0+m*axis.y*axis.y));
}
`
function bend(material:T.Material){
  const previous=material.onBeforeCompile,variant=material.customProgramCacheKey()
  material.customProgramCacheKey=()=>variant+'-planet'
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer)
    shader.vertexShader=projection+shader.vertexShader.replace('#include <project_vertex>',`
      vec4 flatWorld=vec4(transformed,1.);
      #ifdef USE_INSTANCING
        flatWorld=instanceMatrix*flatWorld;
      #endif
      flatWorld=modelMatrix*flatWorld;
      vec4 globeWorld=vec4(globePoint(flatWorld.xyz),1.);
      vec4 mvPosition=viewMatrix*globeWorld;
      gl_Position=projectionMatrix*mvPosition;
      #if defined(USE_NORMAL) || defined(LAMBERT) || defined(PHONG) || defined(STANDARD) || defined(TOON)
        #ifndef FLAT_SHADED
          vNormal=normalize(mat3(viewMatrix)*globeFrame(flatWorld.xyz)*transpose(mat3(viewMatrix))*vNormal);
        #endif
      #endif
    `).replace('#include <worldpos_vertex>','vec4 worldPosition=globeWorld;')
  }
}
export function roundWorld(scene:T.Scene){
  const materials=new Set<T.Material>(),depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking})
  const cutouts=new Map<T.Material,T.MeshDepthMaterial>()
  bend(depth)
  scene.traverse(object=>{
    if(!(object instanceof T.Mesh||object instanceof T.Points))return
    object.frustumCulled=false
    const list=Array.isArray(object.material)?object.material:[object.material]
    for(const m of list)if(!materials.has(m)){bend(m);materials.add(m)}
    if(object.castShadow){
      const m=list[0]
      if(m.alphaTest&&m.map){
        if(!cutouts.has(m)){const d=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:m.map,alphaTest:m.alphaTest,side:T.DoubleSide});bend(d);cutouts.set(m,d)}
        object.customDepthMaterial=cutouts.get(m)
      }else object.customDepthMaterial=depth
    }
  })
  // One closed water surface covers the entire planet, including the antipode.
  const ocean=new T.Mesh(new T.SphereGeometry(radius+seaLevel,160,100),new T.MeshStandardMaterial({color:'#498c8b',roughness:.83}))
  ocean.receiveShadow=true;scene.add(ocean)
  return ()=>{depth.dispose();cutouts.forEach(d=>d.dispose())}
}

export function onWater(x:number,z:number){return walkHeight(x,z)<=seaLevel&&terrainHeight(x,z)<=seaLevel}
