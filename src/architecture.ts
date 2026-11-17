import * as T from 'three'
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {seeded} from './paint'

function finish(tile:boolean) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256
  const ctx=canvas.getContext('2d')!,random=seeded(tile?618:894)
  ctx.fillStyle=tile?'#5d5149':'#b9aea0';ctx.fillRect(0,0,256,256)
  const rows=tile?8:6, step=256/rows
  for(let row=0;row<rows;row++)for(let col=-1;col<(tile?8:4);col++) {
    const width=tile?32:64, x=col*width+(row%2)*width/2,y=row*step
    const tone=tile?48+random()*12:73+random()*9
    const wash=ctx.createLinearGradient(x,y,x+(tile?width:3),y+(tile?0:step))
    wash.addColorStop(0,`hsl(32 8% ${tone-8}%)`);wash.addColorStop(.32,`hsl(32 9% ${tone+6}%)`);wash.addColorStop(1,`hsl(32 8% ${tone}%)`)
    ctx.fillStyle=wash;ctx.fillRect(x+1,y+1,width-1.8,step-2.2)
  }
  const pixels=ctx.getImageData(0,0,256,256)
  for(let i=0;i<pixels.data.length;i+=4){
    const variation=(random()-.5)*22
    for(let j=0;j<3;j++)pixels.data[i+j]+=variation
  }
  ctx.putImageData(pixels,0,0)
  const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4
  return map
}

function plasterFinish(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=384
  const c=canvas.getContext('2d')!,random=seeded(814)
  c.fillStyle='#dfdcd3';c.fillRect(0,0,384,384)
  for(let i=0;i<240;i++){
    const x=random()*384,y=random()*384,r=3+random()*32
    // Wrap each wash so adjacent sections meet without a visible seam.
    for(const ox of [-384,0,384])for(const oy of [-384,0,384]){
      const px=x+ox,py=y+oy,g=c.createRadialGradient(px,py,0,px,py,r)
      g.addColorStop(0,'rgba(90,84,69,.11)');g.addColorStop(1,'rgba(90,84,69,0)')
      c.fillStyle=g;c.fillRect(px-r,py-r,r*2,r*2)
    }
  }
  for(let i=0;i<18000;i++){c.fillStyle=i%2?'#6a5c4821':'#ffffff40';c.fillRect(random()*384,random()*384,1+random()*2,1)}
  const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4
  return map
}

function glazing(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192
  const c=canvas.getContext('2d')!,sky=c.createLinearGradient(0,0,30,192)
  sky.addColorStop(0,'#263b44');sky.addColorStop(.28,'#6f8990');sky.addColorStop(.59,'#a3b2ac');sky.addColorStop(1,'#465352')
  c.fillStyle=sky;c.fillRect(0,0,128,192)
  c.fillStyle='#35474b';c.beginPath();c.moveTo(0,121);c.lineTo(30,95);c.lineTo(68,121);c.lineTo(89,111);c.lineTo(128,128);c.lineTo(128,192);c.lineTo(0,192);c.fill()
  c.fillStyle='#ddd8c22d'
  for(const side of [0,1]){c.save();if(side){c.translate(128,0);c.scale(-1,1)}
    c.beginPath();c.moveTo(0,0);c.lineTo(28,0);c.bezierCurveTo(27,60,14,108,8,119);c.lineTo(14,192);c.lineTo(0,192);c.fill();c.restore()}
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return map
}

export function architecture(scene:T.Scene) {
  const stone=finish(false),tiles=finish(true),plaster=plasterFinish(),glass=glazing()
  const batches=new Map<string,{material:T.MeshStandardMaterial,parts:T.BufferGeometry[]}>()
  function surface(g:T.BufferGeometry,map:T.Texture,color:string,x:number,y:number,z:number) {
    const key=map.uuid+color
    if(!batches.has(key))batches.set(key,{material:new T.MeshStandardMaterial({map,color,bumpMap:map===glass?null:map,bumpScale:.029,roughness:map===glass?.22:.94}),parts:[]})
    g.translate(x,y,z);batches.get(key)!.parts.push(g)
  }
  function block(x:number,y:number,z:number,w:number,h:number,d:number,color:string,map=stone){
    const g=new T.BoxGeometry(w,h,d),uv=g.attributes.uv
    for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(f<2?d:w)/2.6,uv.getY(i)*(f===2||f===3?d:h)/1.7)}
    surface(g,map,color,x,y,z)
  }
  function pane(x:number,y:number,z:number,w:number,h:number,angle:number){
    const g=new T.PlaneGeometry(w,h);g.rotateY(angle);surface(g,glass,'#ffffff',x,y,z)
  }
  function house(x:number,y:number,z:number,w:number,h:number,d:number,wall:string,roof:string,index:number){
    const finish=index===4||index===8||index===7?stone:plaster
    block(x,y+h/2,z,w,h,d,wall,finish)
    block(x,y+.28,z,w+.23,.57,d+.23,'#b0a79b')
    const sign=z<0?1:-1
    for(const side of [-1,1]){
      for(let row=1.5;row<h-.4;row+=2.05){
        pane(x+side*w*.32,y+row,z+sign*(d/2+.206),.91,1.15,sign<0?Math.PI:0)
        pane(x+side*w*.32,y+row,z-sign*(d/2+.025),.96,1.23,sign>0?Math.PI:0)
      }
      for(const off of [-.24,.24])pane(x+side*(w/2+.149),y+1.6,z+off*d,.85,1.4,side*Math.PI/2)
    }
    const run=w/2+.45,rise=1.85,slope=Math.hypot(run,rise)
    for(const side of [-1,1]){
      const gable=new T.BufferGeometry()
      gable.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,0,w/2,0,0,0,rise-.16,0],3))
      gable.setAttribute('uv',new T.Float32BufferAttribute([0,0,w/2.8,0,w/5.6,(rise-.16)/1.55],2))
      gable.computeVertexNormals()
      if(side<0)gable.rotateY(Math.PI)
      surface(gable,finish,wall,x,y+h,z+side*(d/2+.414))
    }
    for(const side of [-1,1]){
      const sheet=new T.PlaneGeometry(d+.8,slope,Math.ceil((d+.8)/.075),Math.ceil(slope/.14)),coords=sheet.attributes.uv
      for(let i=0;i<coords.count;i++)coords.setXY(i,coords.getX(i)*(d+.8)/2.4,coords.getY(i)*slope/1.85)
      const v=sheet.attributes.position
      for(let i=0;i<v.count;i++){
        const course=(v.getY(i)+slope/2)/.28
        const roll=(1+Math.cos((v.getX(i)+d/2)*Math.PI*2/.30))*.5
        v.setZ(i,.012+.043*roll+.026*(1-(course%1)))
      }
      sheet.computeVertexNormals()
      sheet.rotateX(-Math.PI/2);sheet.rotateY(side*Math.PI/2);sheet.rotateZ(-side*Math.atan2(rise,run))
      surface(sheet,tiles,roof,x+side*run/2,y+h+rise/2+.015,z)
    }
  }
  function flush(){
    for(const {material,parts} of batches.values()){
      const meshes=parts.map(g=>g.index?g.toNonIndexed():g)
      const mesh=new T.Mesh(mergeGeometries(meshes),material);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh)
      for(const g of new Set([...parts,...meshes]))g.dispose()
    }
    batches.clear()
  }
  function roofSurface(g:T.BufferGeometry,x:number,y:number,z:number,color:string,repeatX:number,repeatY:number){
    const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*repeatX,uv.getY(i)*repeatY)
    surface(g,tiles,color,x,y,z)
  }
  return {house,block,pane,roofSurface,flush}
}
