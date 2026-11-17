import {terrainHeight} from './geography'
import * as T from 'three'

export function seeded(seed: number) {
  return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296)
}

function painted(size: number, draw: (ctx: CanvasRenderingContext2D, random: () => number) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, seeded(351))
  const map = new T.CanvasTexture(canvas)
  map.colorSpace = T.SRGBColorSpace
  map.wrapS = map.wrapT = T.RepeatWrapping
  map.anisotropy = 4
  return map
}

// Draw a tile at world scale. Fine grain softens into its base colour in the distance.
export function surfaceGrain(kind:'meadow'|'gravel'|'asphalt'){
  return painted(256,(c,random)=>{
    c.fillStyle=kind==='meadow'?'#e2e6ce':kind==='gravel'?'#bbaa90':'#718180'
    c.fillRect(0,0,256,256)
    for(let i=0;i<8000;i++){
      const x=random()*256,y=random()*256,light=random()>.52
      c.fillStyle=c.strokeStyle=light?'rgba(255,251,222,.22)':'rgba(42,55,47,.18)'
      if(kind==='meadow'){
        const len=2+random()*7
        c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+1,y-len*.6,x+len*.47,y-len);c.stroke()
      }else{
        const radius=(kind==='gravel'?1.5:.7)*random()+.35
        c.beginPath();c.ellipse(x,y,radius*1.6,radius,random()*3,0,Math.PI*2);c.fill()
      }
    }
  })
}

function flagstones(){
  return painted(512,(c,random)=>{
    c.fillStyle='#787b71';c.fillRect(0,0,512,512)
    for(let row=0;row<8;row++){
      const cuts=[0,85,170,256,341,426,512].map((x,i)=>x+(i>0&&i<6?(random()-.5)*39:0))
      for(let i=0;i<6;i++){
        const x=cuts[i]+(row%2)*44,w=cuts[i+1]-cuts[i],y=row*64,l=58+random()*11
        for(const offset of [-512,0]){
          const left=x+offset
          c.fillStyle='hsl(43 9% '+l+'%)'
          c.beginPath();c.moveTo(left+3,y+2);c.lineTo(left+w-5,y+1);c.lineTo(left+w-1,y+5);c.lineTo(left+w-2,y+59);c.lineTo(left+w-7,y+63);c.lineTo(left+2,y+62);c.closePath();c.fill()
          c.strokeStyle='rgba(245,239,215,.48)';c.lineWidth=1.2
          c.beginPath();c.moveTo(left+2,y+58);c.lineTo(left+3,y+3);c.lineTo(left+w-6,y+2);c.stroke()
          if((i+row*3)%9===0){
            c.strokeStyle='rgba(70,74,66,.52)';c.beginPath();c.moveTo(left+w*.72,y+2);c.lineTo(left+w*.67,y+11);c.lineTo(left+w*.7,y+14);c.lineTo(left+w*.62,y+21);c.stroke()
          }
        }
      }
    }
    for(let i=0;i<31000;i++){
      c.fillStyle=random()>.5?'#f3efdb29':'#424f4924'
      c.fillRect(random()*512,random()*512,1+random()*2,1)
    }
  })
}

export function plaza(scene:T.Scene){
  const slab=flagstones(),road=surfaceGrain('asphalt')
  const paving=new T.MeshStandardMaterial({map:slab,bumpMap:slab,bumpScale:.023,roughness:.95})
  const asphalt=new T.MeshStandardMaterial({map:road,roughness:1})
  function lay(g:T.BufferGeometry,y:number,material:T.Material,repeat:number){
    g.rotateX(-Math.PI/2)
    const uv=g.attributes.uv,points=g.attributes.position
    for(let i=0;i<uv.count;i++){
      const x=points.getX(i),z=points.getZ(i)
      points.setY(i,terrainHeight(x,z));uv.setXY(i,x/repeat,z/repeat)
    }
    g.computeVertexNormals()
    const mesh=new T.Mesh(g,material);mesh.position.y=y;mesh.receiveShadow=true;scene.add(mesh)
  }
  // Follow the relief into each trailhead. The last few metres narrow to the
  // gravel track, with the stone shoulder running out along either side.
  function lane(alongX:boolean,shoulder:number){
    const g=new T.PlaneGeometry(72,1,144,shoulder?1:10),points=g.attributes.position
    for(let i=0;i<points.count;i++){
      const along=points.getX(i),across=points.getY(i)
      const t=T.MathUtils.smoothstep(Math.abs(along),30.5,36)
      const halfWidth=T.MathUtils.lerp(2.925,1.06,t)
      const edge=.48*(1-t)
      const lateral=shoulder?shoulder*(halfWidth-edge*.5)+across*edge:across*2*halfWidth
      points.setXY(i,alongX?along:-lateral,alongX?lateral:along)
    }
    lay(g,shoulder?.105:.084,shoulder?paving:asphalt,shoulder?2.4:3)
  }
  for(const alongX of [true,false])for(const shoulder of [0,-1,1])lane(alongX,shoulder)
  lay(new T.RingGeometry(.001,10.88,96,32),.23,paving,3.6)
  const border=paving.clone();border.color.set('#788983')
  lay(new T.RingGeometry(9.85,10.07,120,2),.238,border,2)
}

export function atmosphere(scene:T.Scene) {
  const paper=document.createElement('canvas');paper.width=1536;paper.height=1024
  const sky=paper.getContext('2d')!,random=seeded(162)
  sky.fillStyle='#66bfbe';sky.fillRect(0,0,paper.width,paper.height)
  for(let i=0;i<110;i++){
    const x=random()*paper.width,y=random()*paper.height,r=1+random()*2.7
    sky.beginPath();sky.ellipse(x,y,r,r*.64,random()*3,0,Math.PI*1.75)
    sky.strokeStyle=i%3?'#8fd6cf':'#54aaa9';sky.lineWidth=1.4;sky.stroke()
  }
  const backdrop=new T.CanvasTexture(paper);backdrop.colorSpace=T.SRGBColorSpace
  scene.background=backdrop
  scene.fog=null
  scene.add(new T.HemisphereLight('#fff5df','#c3c6b6',1.3))
  const sun=new T.DirectionalLight('#fff0cd',2.05)
  sun.position.set(-26,39,23);sun.castShadow=true
  Object.assign(sun.shadow.camera,{left:-43,right:43,top:43,bottom:-43})
  sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.00035;sun.shadow.normalBias=.032
  scene.add(sun)
}
