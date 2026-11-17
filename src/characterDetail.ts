import * as T from 'three'

// A filled, curved panel with an explicit two-sided surface for thin fabric,
// facial linework and overlapping locks. Panels share their joint's material.
export function panel(rows:T.Vector3[][]){
  const points=rows.flat().flatMap(p=>p.toArray()),indices:number[]=[],cols=rows[0].length
  for(let j=1;j<rows.length;j++)for(let i=1;i<cols;i++){
    const a=(j-1)*cols+i-1
    indices.push(a,a+1,a+cols,a+1,a+cols+1,a+cols)
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3))
  g.setIndex(indices);g.computeVertexNormals()
  return g
}

export function hairLock(azimuth:number,sweep:number,end:number,width:number,lift:number){
  const rows:T.Vector3[][]=[]
  for(let j=0;j<=12;j++){
    const t=j/12,phi=.19+(end-.19)*t
    const a=azimuth+sweep*(t*t-.35),span=width*(.34+.83*Math.sin(Math.PI*Math.pow(t,.84)))*(1-.97*t**5)
    const row:T.Vector3[]=[]
    for(let i=0;i<=4;i++){
      const u=i/2-1,theta=a+u*span,depth=.018*(1-u*u)*Math.sin(Math.PI*t)+lift
      row.push(new T.Vector3((.263+depth)*Math.sin(phi)*Math.sin(theta),
        .079+(.258+depth)*Math.cos(phi)+.018*Math.sin(Math.PI*t),
        -.022+(.238+depth)*Math.sin(phi)*Math.cos(theta)))
    }
    rows.push(row)
  }
  // Azimuth increases left to right, while rows run from crown to tips.
  return panel(rows.reverse())
}

export function stroke(points:number[][],width:number){
  const curve=new T.CatmullRomCurve3(points.map(([x,y,z])=>new T.Vector3(x,y,z)))
  return new T.TubeGeometry(curve,Math.max(3,points.length*2),width,5,false)
}
