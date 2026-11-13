import * as T from 'three'

// Horizontal tailoring sections: height, half width, front-to-back radius,
// and optional seam offset. The rings share vertices for continuous shading.
export function contour(rows:number[][],segments=16){
 const xyz:number[]=[],indices:number[]=[]
 for(const [y,w,d,offset=0] of rows)for(let i=0;i<segments;i++){
   const a=i*2*Math.PI/segments
   xyz.push(w*Math.sin(a),y,d*Math.cos(a)+offset)
 }
 for(let j=1;j<rows.length;j++)for(let i=0;i<segments;i++){
   const a=(j-1)*segments+i,b=(j-1)*segments+(i+1)%segments
   indices.push(a,b,b+segments,a,b+segments,a+segments)
 }
 for(let i=1;i<segments-1;i++){const last=(rows.length-1)*segments;indices.push(0,i+1,i,last,last+i,last+i+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setIndex(indices);g.computeVertexNormals();return g
}
