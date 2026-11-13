import {arrivalClearing,lanes,paths,shoreDistance,terrainHeight} from './geography'

export type Footprint={x:number;z:number;w:number;d:number}
export const houses=[
 [-8,-9,6,4.8,5],[7,-10,6,4.3,5],[-9,9,6,4,5],[9,9,5,4.3,5],
 [24,-6,8,4,5],[31,7,6,5,6],[-7,27,6,4,7],[7,29,7,5,7],
 [-6,-29,7,6,6],[6,-29,6,5,6],[-29,-7,5,3.5,5]
]
export const benches=[[-5,3],[5,-3],[-26,-3],[3,-24]]
export const lamps=[[-5,-4],[5,4],[4,-6],[-5,5],[-26,4],[4,26]]

// Reserve swept road widths and the actual footprints before placing vegetation.
export function plantingPlan(){
 const trunks:{x:number;z:number;r:number}[]=[]
 const cells=new Map<string,Footprint[]>()
 const key=(x:number,z:number)=>Math.floor(x/5)+','+Math.floor(z/5)
 function reserve(x:number,z:number,w:number,d:number){
   const shape={x,z,w,d}
   for(let i=Math.floor((x-w/2)/5);i<=Math.floor((x+w/2)/5);i++)
     for(let j=Math.floor((z-d/2)/5);j<=Math.floor((z+d/2)/5);j++){
       const k=i+','+j;if(!cells.has(k))cells.set(k,[]);cells.get(k)!.push(shape)
     }
 }
 houses.forEach(([x,z,w,,d])=>reserve(x,z,w+1.8,d+2.8))
 benches.forEach(([x,z])=>reserve(x,z,2.4,1.3));lamps.forEach(([x,z])=>reserve(x,z,.8,.8))
 for(const [x,z,w,d] of [[-27,6,7,7],[-27,1,5,1.8],[-6.7,-5.5,4,2.4],[29.4,-5.8,3.1,4.2],[-6,-24.3,8,3.2],[24,-26,7,7],[-24,23,6,3],[37,24,4,4],[-6,-12,3,3],[42,-31,5,5],[-28,4,5,1],[10,-22,5,1],[23,-9,5,1]])reserve(x,z,w,d)
 for(const path of [...paths,...lanes])for(let i=1;i<path.length;i++){
   const [x,z]=path[i-1],[xx,zz]=path[i],width=lanes.includes(path)?6.2:2.4,n=Math.ceil(Math.hypot(xx-x,zz-z))
   for(let j=0;j<=n;j++)reserve(x+(xx-x)*j/n,z+(zz-z)*j/n,width,width)
 }
 function free(x:number,z:number,r:number){
   if(Math.hypot(x,z)<10.9+r||shoreDistance(x,z)<4+r)return false
   for(let i=x-r;i<x+r+5;i+=5)for(let j=z-r;j<z+r+5;j+=5){
     if(cells.get(key(i,j))?.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r))return false
   }
   return true
 }
 return {free,trunks,tree(x:number,z:number,r:number){
   if(arrivalClearing(x,z)||!free(x,z,r)||Math.hypot(terrainHeight(x+.5,z)-terrainHeight(x-.5,z),terrainHeight(x,z+.5)-terrainHeight(x,z-.5))>.78)return false
   trunks.push({x,z,r:Math.min(.42,r*.18)});reserve(x,z,2*r,2*r);return true
 }}
}
