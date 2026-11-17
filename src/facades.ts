import * as T from 'three'

type Add=(g:T.BufferGeometry,c:string,x:number,y:number,z:number,rx?:number,ry?:number,rz?:number)=>void
type Box=(x:number,y:number,z:number,w:number,h:number,d:number,c:string)=>void
type Ball=(x:number,y:number,z:number,w:number,h:number,d:number,c:string)=>void

export function decorateFacade(add:Add,box:Box,ball:Ball,x:number,z:number,w:number,h:number,d:number,roof:string,index:number){
  const facing=z<0?1:-1,front=z+facing*(d/2+.1)
  const timber='#785744',cream='#f1dfba',shutters=['#437d78','#73866b','#798ca4','#4e7365'][index%4]
  const beam=(ax:number,ay:number,bx:number,by:number,zz:number,thick:number,color:string)=>{
    add(new T.BoxGeometry(Math.hypot(bx-ax,by-ay),thick,.13),color,(ax+bx)/2,(ay+by)/2,zz,0,0,Math.atan2(by-ay,bx-ax))
  }
  for(const f of [-1,1]){
    const edge=z+f*(d/2+.45)
    beam(x-w/2-.45,h,x,h+1.85,edge,.16,timber);beam(x,h+1.85,x+w/2+.45,h,edge,.16,timber)
    box(x,h+.05,edge,w+.8,.16,.16,timber)
    if(index%3!==1){
      for(const offset of [-.22,0,.22]){const post=1.56*(1-Math.abs(offset)*2);box(x+offset*w,h+post/2,edge+f*.052,.09,post,.09,timber)}
    } else {
      box(x,h+.73,edge,.75,.88,.1,timber)
      box(x,h+.73,edge+f*.063,.57,.69,.05,'#394849')
      for(const dx of [-.3,.3])box(x+dx,h+.73,edge+f*.105,.07,.8,.06,cream)
      box(x,h+.3,edge+f*.08,.84,.09,.21,cream)
    }
  }
  box(x,h+1.91,z,.19,.14,d+.92,roof)
  for(const side of [-1,1]){
    const eave=x+side*(w/2+.43),pipeZ=z-d*.38
    add(new T.CylinderGeometry(.077,.077,d+.85,12),'#626b66',eave,h-.01,z,Math.PI/2)
    add(new T.CylinderGeometry(.058,.058,h-.24,12),'#6b736b',x+side*(w/2+.12),h/2,pipeZ)
    box(x+side*(w/2+.27),h-.13,pipeZ,.37,.11,.12,'#626b66')
    for(const level of [.7,h*.58,h-.42])box(x+side*(w/2+.12),level,pipeZ,.14,.044,.14,'#505953')
    for(let r=-d/2;r<=d/2;r+=.64)box(x+side*(w/2+.21),h-.10,z+r,.48,.13,.10,'#6e5c4b')
    for(let row=1.5;row<h-.4;row+=2.05){
      const back=z-facing*(d/2+.055),wx=x+side*w*.32
      for(const jamb of [-.50,.50])box(wx+jamb,row,back,.075,1.33,.15,cream)
      box(wx,row-.67,back,1.18,.12,.29,'#aea798')
      box(wx,row+.65,back,1.11,.10,.17,cream)
      box(wx,row,back,.048,1.23,.11,timber)
    }
    const xx=x+side*(w/2-.09)
    box(xx,h/2,front,.17,h,.12,timber)
    for(let i=0;i<4;i++)box(xx,i*.37+.19,front+.035*facing,.38,.3,.17,'#cbba9c')
    for(let y=1.5;y<h-.4;y+=2.05){
      const wx=x+side*w*.32
      for(const s of [-1,1]){
        const sx=wx+s*.77;box(sx,y,front+facing*.14,.3,1.37,.09,shutters)
        for(let j=-2;j<=2;j++)box(sx,y+j*.21,front+facing*.195,.25,.032,.035,'#a3b59b')
      }
      if(y>2&&index%2===0){box(wx,y-.6,front+facing*.28,1.2,.22,.38,'#97664d');for(let j=0;j<8;j++)ball(wx-.48+j*.14,y-.41+(j%3)*.04,front+facing*.29,.12,.14,.12,j%3?'#769252':'#cf818d')}
    }
    // Side elevations also face the intersecting streets.
    const edge=x+side*(w/2+.025)
    for(const off of [-.24,.24]){
      const wz=z+off*d;box(edge,1.6,wz,.11,1.6,1.07,timber);box(edge+side*.08,1.6,wz,.08,1.4,.85,'#679096')
      box(edge+side*.13,1.6,wz,.06,.09,.9,cream);box(edge+side*.13,1.6,wz,.06,1.4,.08,cream)
    }
  }
  // Recessed arched fanlight and stone voussoirs.
  const archZ=front+facing*.13
  const arch=new T.CircleGeometry(.61,20,0,Math.PI);add(arch,'#52767a',x,1.92,archZ,0,facing<0?Math.PI:0)
  for(let i=0;i<9;i++){const a=(i+.5)*Math.PI/9;add(new T.BoxGeometry(.26,.21,.19),'#e1cfab',x+.68*Math.cos(a),1.92+.68*Math.sin(a),archZ,0,0,a-Math.PI/2)}
  if(index!==0){box(x,1.08,archZ,.78,1.42,.07,'#85654a');box(x,1.11,archZ+facing*.06,.67,.09,.1,timber);ball(x+.25,1.1,archZ+facing*.12,.045,.045,.045,'#d9af63')}
  if(index%3===0){
    const floor=h-.75,bz=front+facing*.56
    box(x,floor,bz,2.7,.14,1.06,timber);box(x,floor+.68,bz+facing*.47,2.76,.1,.11,shutters)
    for(let j=0;j<9;j++)box(x-1.25+j*.31,floor+.34,bz+facing*.47,.064,.66,.07,shutters)
    for(const end of [-1,1])box(x+end*1.3,floor+.68,bz,.1,.1,1,shutters)
  }
  if(index%3===1){
    const sx=x-w*.24,sz=z-.2
    box(sx,h+1.22,sz,1.4,1.1,1.4,cream)
    const cap=new T.ConeGeometry(1.26,.94,4);add(cap,roof,sx,h+2.17,sz,0,Math.PI/4)
    box(sx,h+1.45,sz+.73,.64,.55,.08,shutters)
  }
  const potX=x+w*.41,potZ=front+facing*.57
  add(new T.CylinderGeometry(.27,.19,.43,10),'#bb7455',potX,.24,potZ)
  for(let i=0;i<7;i++){const a=i*2.4;ball(potX+Math.cos(a)*.17,.57+i%3*.1,potZ+Math.sin(a)*.17,.16,.21,.14,i%3?'#779350':'#da9a99')}
}
