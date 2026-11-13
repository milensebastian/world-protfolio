export const projectHosts:Record<string,number>={'Lab scientist':0,'Workshop engineer':1}
const greetings:Record<string,string[]>={
'Town guide':['Morning! The fountain is a fine place to get your bearings.','See the blue shutters east of here? That’s the security lab.'],
'Lab scientist':['Welcome to StegoVault. There’s a secret tucked into this landscape.','At StegoVault, even a few pixels can carry an encrypted note.'],
'Workshop engineer':['Try AETHIRIA with a wave, or link two editors in FORGE.','I’m tuning AETHIRIA’s particles and FORGE’s peer connection. Come see!'],
'Campus librarian':['Pull up a seat. The campus records are in the field journal.','I saved the window seat for anyone with a good puzzle.'],
'Garden keeper':['Smell the rosemary? It does love this patch of sun.','Those roses by the pond opened this morning.'],
'Florist':['A sprig of rosemary for the baker, and roses for the window.','Hello there! The garden has been generous today.'],
'Town courier':['Coming through! Fresh bread waits for nobody.','Morning! One last parcel before the cinnamon rolls go cold.'],
'Street cleaner':['Mind the little pile! The breeze and I are still negotiating.','I had these leaves sorted until that swallow flew past.'],
'Market baker':['Caught the first batch, did you? Still warm.','The florist brings the rosemary. I supply the rolls.'],
'Cycle mechanic':['Passing on your side! Listen to that freshly tuned wheel.','Hear a rattle? That’s my lunch tin, thankfully.']}
type Candidate={name:string;distanceSq:number;visible:boolean;available:boolean}
export function interactionManager(count:number){
  const visits=new Uint16Array(count),readyAt=new Float64Array(count),entered=new Uint8Array(count)
  let active=-1,until=0,next=0,line=''
  return {update(now:number,actors:Candidate[]){
    let closest=-1,best=Infinity,project=-1,projectDist=Infinity
    for(let i=0;i<count;i++){
      const a=actors[i]
      if(a.distanceSq>3.5**2)entered[i]=0
      if(a.distanceSq>9||!a.visible||!a.available)continue
      if(a.name in projectHosts&&a.distanceSq<projectDist){project=i;projectDist=a.distanceSq}
      if(!entered[i]&&now>=readyAt[i]&&a.distanceSq<best){best=a.distanceSq;closest=i}
    }
    if(active>=0){const a=actors[active]
      if(now>=until||a.distanceSq>3.2**2||!a.visible||!a.available){active=-1;next=now+.55}}
    if(active<0&&closest>=0&&now>=next){
      active=closest;const lines=greetings[actors[active].name]
      line=lines[visits[active]++%lines.length];until=now+4.8;readyAt[active]=now+24;entered[active]=1
    }
    return {active,line,project:active<0?project:(actors[active].name in projectHosts?active:-1)}
  }}
}
