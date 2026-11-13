import {villageRise} from './geography'
import * as T from 'three'

// One instanced draw for the swallows above the square.
export function swallows(scene:T.Scene) {
  const g=new T.BufferGeometry()
  g.setAttribute('position',new T.Float32BufferAttribute([
    0,0,.16, -.39,.14,-.01, -.13,.02,-.05,
    0,0,.16, .13,.02,-.05, .39,.14,-.01,
    -.06,0,0, 0,-.01,-.17, .06,0,0
  ],3))
  const birds=new T.InstancedMesh(g,new T.MeshBasicMaterial({color:'#556f79',side:T.DoubleSide}),6)
  birds.frustumCulled=false;scene.add(birds)
  const o=new T.Object3D()
  return (time:number)=>{
    for(let i=0;i<6;i++){
      const a=time*(.074+i*.006)+i*.29
      o.position.set(Math.sin(a)*16+i*.75,12+i%3*.82+Math.sin(a*3)*.5,-11+Math.cos(a)*7)
      o.rotation.set(0,Math.atan2(16*Math.cos(a),-7*Math.sin(a)),Math.sin(a)*.22)
      const cycle=(time+i*8)%54
      const rest=T.MathUtils.smoothstep(cycle,34,41)*(1-T.MathUtils.smoothstep(cycle,46,53))
      if(rest>0){o.position.x+=(7-o.position.x)*rest;o.position.z+=(-10+i*.26-o.position.z)*rest;o.position.y+=(villageRise(7,-10)+6.22-o.position.y)*rest}
      o.scale.set(1,.65+Math.cos(time*5+i)*.42*(1-rest),1);o.updateMatrix();birds.setMatrixAt(i,o.matrix)
    }
    birds.instanceMatrix.needsUpdate=true
  }
}
