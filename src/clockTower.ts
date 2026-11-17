import * as T from 'three'
import type {architecture} from './architecture'

export function clockTower(scene:T.Scene,work:ReturnType<typeof architecture>,x:number,base:number,z:number){
  const stone='#d2c8b2',trim='#c6bdab',metal='#475451'
  work.block(x,base+5.7,z,2.4,11.4,2.4,stone)
  for(const [y,width,height] of [[.32,2.72,.64],[5.9,2.51,.18],[8.7,2.56,.2],[10.99,2.54,.14],[11.21,2.68,.22],[11.4,2.8,.14]]){
    work.block(x,base+y,z,width,height,width,trim)
  }
  for(const sx of [-1,1])for(const sz of [-1,1]){
    work.block(x+sx*1.12,base+5.74,z+sz*1.12,.27,10.9,.27,'#d7cebb')
  }
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256
  const ctx=canvas.getContext('2d')!;ctx.translate(128,128)
  ctx.fillStyle='#e5e0cf';ctx.fillRect(-128,-128,256,256)
  ctx.strokeStyle='#53544e';ctx.lineWidth=3
  for(const r of [118,88]){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke()}
  ctx.fillStyle='#303634';ctx.textBaseline='middle';ctx.textAlign='center';ctx.font='bold 22px Georgia'
  const numerals=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI']
  for(let i=0;i<60;i++){
    ctx.save();ctx.rotate(i*Math.PI/30);ctx.fillRect(-1,-116,2,i%5?4:7);ctx.restore()
    if(i%5===0){const a=i*Math.PI/30;ctx.fillText(numerals[i/5],98*Math.sin(a),-98*Math.cos(a))}
  }
  for(const [a,length,width] of [[-1.02,51,5],[1.05,77,3.5]]){
    ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(-width,9);ctx.lineTo(-width,-length*.68);ctx.lineTo(0,-length);ctx.lineTo(width,-length*.68);ctx.lineTo(width,9);ctx.fill();ctx.restore()
  }
  ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill()
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace
  const face=new T.MeshStandardMaterial({map,roughness:.65}),bronze=new T.MeshStandardMaterial({color:metal,metalness:.35,roughness:.5})
  for(let i=0;i<4;i++){
    const side=new T.Group();side.position.set(x,base,z);side.rotation.y=i*Math.PI/2;scene.add(side)
    const dial=new T.Mesh(new T.CircleGeometry(.81,48),face);dial.position.set(0,9.86,1.226);side.add(dial)
    const rim=new T.Mesh(new T.TorusGeometry(.825,.047,8,48),bronze);rim.position.set(0,9.86,1.237);side.add(rim)
    const niche=new T.Mesh(new T.BoxGeometry(.52,1.35,.056),bronze);niche.position.set(0,7.55,1.2);side.add(niche)
    for(let j=0;j<7;j++){
      const slat=new T.Mesh(new T.BoxGeometry(.53,.068,.13),bronze);slat.position.set(0,7.01+j*.17,1.255);slat.rotation.x=.32;side.add(slat)
    }
  }
  const roof=new T.ConeGeometry(2.13,2.15,4);roof.rotateY(Math.PI/4)
  work.roofSurface(roof,x,base+12.52,z,'#746e64',5,1.5)
  const finial=new T.Mesh(new T.CylinderGeometry(.025,.07,1.05,10),bronze);finial.position.set(x,base+13.93,z);scene.add(finial)
}
