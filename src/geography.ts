export type Point = [number, number]
export const stops:Point[]=[[0,0],[27,0],[0,27],[0,-27],[-27,0],[-24,24],[24,-24],[42,-31]]
export const seaLevel=-1.65
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
export function shoreRadius(angle:number){
  return 58+4.4*Math.cos(2*angle-.3)+4*Math.sin(3*angle+.7)+2.4*Math.sin(5*angle-1)+1.1*Math.cos(9*angle)
}
export function shoreDistance(x:number,z:number){return shoreRadius(Math.atan2(z,x))-Math.hypot(x,z)}
export function creekZ(x:number){return -13+1.5*Math.sin((x+40)*.19)}
// The academy rises above the market. Broad, level terraces seat the
// buildings, with continuous eased grades on the roads between them.
function ridge(z:number){
  return 3.2*smooth(5,-5,z)+4.6*smooth(-14,-24,z)+1.6*smooth(15,24,z)
}
export function villageRise(x:number,z:number){
  const inland=smooth(5,16,shoreDistance(x,z))
  // Separate level garden and workshop terraces from the uphill lanes.
  const west=smooth(15,24,-x),east=smooth(14,23,x)
  const rise=ridge(z)*(1-west)*(1-east)+west*1.9+east*(2.4+3.4*smooth(-12,-21,z))
  return inland*(1.6+(rise-1.6)*smooth(2.5,5.5,Math.hypot(x,z)))
}
export function terrainHeight(x:number,z:number){
  const r=Math.hypot(x,z),a=Math.atan2(z,x),shore=shoreRadius(a)-r
  const hills=smooth(32,48,r)*(2.3+1.1*Math.sin(x*.15)+1.5*Math.cos(z*.17))
  const cliff=smooth(-.1,.85,Math.sin(a*3+.8))*2.8
  const top=-.09+villageRise(x,z)+hills+cliff*smooth(20,6,shore)
  const land=top+(seaLevel-2.6-top)*smooth(7,-3,shore)
  const channel=smooth(-33,-41,x)*(1-smooth(.55,2.7,Math.abs(z-creekZ(x))))
  return land+(Math.min(land,seaLevel-.32)-land)*channel
}
export const bridgeX=-44
export const bridgeZ=creekZ(bridgeX)
export function walkHeight(x:number,z:number){
  const h=terrainHeight(x,z)
  if(Math.abs(x-bridgeX)<1.45&&Math.abs(z-bridgeZ)<4.3){
    const t=(z-bridgeZ+4.3)/8.6
    const deck=terrainHeight(x,bridgeZ-4.3)*(1-t)+terrainHeight(x,bridgeZ+4.3)*t+.28*Math.sin(Math.PI*t)
    return Math.max(h,deck)
  }
  return h
}
// Straight village lanes feed meandering woodland tracks, with the creek
// crossing and the sand cove each accessible from two directions.
export const lanes:Point[][]=[
 [[0,0],[27,0],[36,0]],[[0,0],[-27,0],[-36,0]],[[0,0],[0,-27],[0,-36]],[[0,0],[0,27],[0,36]]
]
export const trails:Point[][]=[
 [[-27,0],[-23,4],[-20,12],[-23,18],[-24,24],[-16,25],[-12,21],[-5,21],[0,27]],
 [[27,0],[19,-1.4],[17.6,-8],[20,-17],[24,-24],[18,-25],[13,-20],[7,-21],[0,-27]],
 [[-36,0],[-39,-3],[-44,-7],[bridgeX,bridgeZ+4.3],[bridgeX,bridgeZ-4.3],[-40,-24],[-30,-30],[-19,-32],[-14,-37],[-6,-38],[0,-36]],
 [[0,36],[7,38],[16,35],[21,29],[27,22],[35,18],[38,10],[36,0]],
 [[-24,24],[-31,28],[-39,24],[-41,17],[-38,8],[-36,0]],
 [[24,-24],[30,-27],[36,-31],[41,-32],[45,-32]],
 [[16,35],[20,39],[23.5,41],[24.4,42]]
]
function sampleTrail(points:Point[]):Point[]{
 const out:Point[]=[]
 for(let i=0;i<points.length-1;i++){const a=points[Math.max(i-1,0)],b=points[i],c=points[i+1],d=points[Math.min(i+2,points.length-1)]
   for(let k=0;k<12;k++){const t=k/12,value=(j:number)=>.5*((2*b[j])+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t*t+(-a[j]+3*b[j]-3*c[j]+d[j])*t*t*t);out.push([value(0),value(1)])}
 }out.push(points[points.length-1]);return out
}
export const paths=trails.map(sampleTrail)
export function nearTrail(x:number,z:number,clearance:number){return paths.some(path=>path.some(([px,pz])=>(px-x)**2+(pz-z)**2<clearance**2))}

export function arrivalClearing(x:number,z:number){
  return stops.some(([sx,sz])=>Math.abs(x-sx)<3.3&&z>sz-3&&z<sz+13)
}
