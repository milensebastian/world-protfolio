import { useEffect, useRef, useState } from 'react'
import './journal.css'

type Props = { mode: 'journal' | 'dialogue'; district: number; speaker?: string; onClose: () => void; initialTab?: string }
const tabs = ['About', 'Projects', 'Education', 'Contact']
const portfolio = 'https://milen.vercel.app/'
const projects = [
  {name: 'StegoVault', summary: 'A secret inside a picture', text: 'StegoVault combines image steganography with authenticated encryption. PBKDF2 derives a key from a passphrase and salt. AES-256-GCM protects the message before it is embedded in the image.', stack: 'Steganography · AES-256-GCM · PBKDF2', live: 'https://stegovault-two.vercel.app/', repo: 'https://github.com/milensebastian/stegovault'},
  {name: 'AETHIRIA', summary: 'Sculpt particles with your hands', text: 'MediaPipe tracks hand landmarks and Three.js translates their movement into a particle field. Try moving the field’s center and changing its spread here, or open the live project for camera-based gestures.', stack: 'MediaPipe · Three.js · Gesture tracking', live: 'https://aethiria-woad.vercel.app/', repo: 'https://github.com/milensebastian/AETHIRIA'},
  {name: 'FORGE', summary: 'A workspace between peers', text: 'A collaborative coding workspace uses WebRTC data channels to carry edits between browsers. Connect two local peers below, then type to see your edit travel through a real data channel.', stack: 'WebRTC · Data channels · Collaborative editing', live: 'https://forge-p2p.vercel.app', repo: 'https://github.com/milensebastian/forge-p2p'}
]
const districtNames = ['Origin Square','Cybersecurity Quarter','Innovation District','Knowledge Campus','Personal Garden']
const conversations = [
  ['Town guide','Welcome to Origin Square! I can point you toward the workshops, or tell you about the person who built this place.','Where should I start?','Walk east to the security lab to uncover a hidden message. South of the fountain, the workshop has a particle experiment and a pair of linked terminals.','Meet Milen','About'],
  ['Lab scientist','See that little landscape on my desk? It arrived with a message tucked into its pixels. Want to read it?','How does that work?','A pixel has red, green and blue channels. Changing the smallest bit of a channel barely shifts its color. A string of those bits can store a note.','Inspect StegoVault','Projects'],
  ['Workshop engineer','Careful with the particles. Last time someone waved hello, the whole constellation moved.','What else are you building?','Across the bench is FORGE. Link the two terminals and edits travel straight from one peer to the other.','Visit the workbench','Projects'],
  ['Campus librarian','The exhibition shelf is open. We keep Milen’s coursework and competition notes here.','What’s on display?','The team placed third in the CYA Quest capture-the-flag competition. There are also notes from a digital forensics workshop and a cybersecurity foundations course.','Read the campus record','Education'],
  ['Garden keeper','The bench by the water is a good place to sketch out a new idea. You can reach Milen from here, too.','What inspires the garden?','Small experiments often start with a simple question. This garden gives the town a quiet place to stop and ask one.','Find Milen','Contact']
]
function Link({href,children}:{href:string; children:React.ReactNode}) {
  return <a className="jr-link" href={href} target="_blank" rel="noreferrer">{children} <span aria-hidden="true">↗</span></a>
}
const localStories:Record<string,string[]> = {
  'Street cleaner':['Street cleaner','Morning! Mind the little pile. The wind and I have been negotiating over it all day.','Who is winning?','The wind has the east lane. I still have this square.','Meet Milen','About'],
  'Market baker':['Market baker','The first tray is out. The florist trades me a fresh bouquet for a loaf each morning.','What is today’s special?','A cinnamon twist. One of the couriers insists it makes the bicycle go faster.','Meet Milen','About'],
  'Cycle mechanic':['Cycle mechanic','I take a lap down the east lane to listen for rattles.','How does it sound?','One cheerful bell, two spinning wheels, and half a loaf bouncing in the basket.','Visit the workbench','Projects'],
  'Town courier':['Town courier','I have a delivery for the cartographer. The address is drawn as a tiny picture of his own shop.','Any advice for exploring?','Circle the fountain on the cobbles and take the east road to the lab.','Read the journal','About'],
  'Florist':['Florist','I bring flowers to the bread stall before the square gets busy.','What is in the bouquet?','Garden roses for the window and rosemary for the baker.','Read the journal','About']
}
export default function Journal({mode,district,speaker,onClose,initialTab='About'}:Props) {
  const [tab,setTab]=useState(tabs.find(x=>x.toLowerCase()===initialTab.toLowerCase()) || (initialTab.toLowerCase()==='resume'?'Education':'About'))
  const [chat,setChat]=useState(mode==='dialogue')
  const [reply,setReply]=useState(false)
  const [project,setProject]=useState(district===2?1:0)
  const modal=useRef<HTMLDialogElement>(null)
  const index=districtNames[district]?district:0
  const [name,greeting,question,answer,action,destination]=localStories[speaker||'']||conversations[index]
  useEffect(()=>{
    const d=modal.current, previous=document.activeElement as HTMLElement|null
    d?.showModal()
    return ()=>{d?.close(); previous?.focus()}
  },[])
  return <dialog ref={modal} className={'jr-dialog'+(chat?' jr-chat':'')} aria-labelledby="jr-title" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===modal.current){const box=modal.current.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)onClose()}}}>
    <div className="jr-head"><span className="jr-meta">{chat?districtNames[index]:'Portfolio World / Field journal'}</span><button className="jr-close" onClick={onClose} aria-label="Close journal">×</button></div>
    {chat?<section className="jr-inner"><h2 id="jr-title">{speaker||name}</h2><p className="jr-speech" aria-live="polite">{reply?answer:greeting}</p><div className="jr-actions">{!reply&&<button onClick={()=>setReply(true)}>{question}</button>}<button onClick={()=>{setTab(destination);setChat(false)}}>{action} →</button><button onClick={onClose}>Back to exploring</button></div></section>:<>
    <h2 id="jr-title" className="jr-title">Field journal</h2>
    <nav className="jr-tabs" aria-label="Journal sections">{tabs.map(t=><button key={t} aria-current={tab===t?'page':undefined} onClick={()=>setTab(t)}>{t}</button>)}</nav>
    <section className="jr-inner" key={tab}>
    {tab==='About'&&<><span className="jr-meta">The creator</span><h3>Milen Sebastian</h3><p className="jr-lede">Cybersecurity student and builder from Kerala, India.</p><p>I explore how information stays private, how people create together, and how a gesture can become an interface. Those questions run through the projects you’ll find in this town.</p><div className="jr-actions"><button onClick={()=>setTab('Projects')}>Explore my projects →</button><Link href={portfolio}>Original portfolio</Link></div></>}
    {tab==='Education'&&<><span className="jr-meta">Knowledge Campus</span><h3>Education &amp; experience</h3><dl className="jr-record"><dt>B.Tech in Cyber Security</dt><dd>St. Joseph’s College of Engineering and Technology, Palai</dd><dt>Foundations of Cybersecurity</dt><dd>Google · June 2026</dd><dt>CYA Quest</dt><dd>Third place with my team in the Cyber Security Association’s capture-the-flag competition.</dd><dt>Digital forensics</dt><dd>Participated in Trazada: The Last Trace, a cyber forensics workshop by Offenso Hackers Academy.</dd></dl><Link href="https://www.linkedin.com/in/milensebastian/">Professional profile</Link></>}
    {tab==='Contact'&&<><span className="jr-meta">Personal Garden</span><h3>Get in touch</h3><p>Have a project, a collaboration, or a question about something you found in town? Send me a message through my portfolio or connect on LinkedIn.</p><div className="jr-actions"><Link href={portfolio+'#contact'}>Contact Milen</Link><Link href="https://www.linkedin.com/in/milensebastian/">LinkedIn</Link><Link href="https://github.com/milensebastian">GitHub</Link></div></>}
    {tab==='Projects'&&<><div className="jr-projects" aria-label="Select project">{projects.map((p,i)=><button key={p.name} aria-pressed={project===i} onClick={()=>setProject(i)}>{p.name}</button>)}</div><h3>{projects[project].summary}</h3><p>{projects[project].text}</p><p className="jr-meta">{projects[project].stack}</p>{project===0?<Stego/>:project===1?<Particles/>:<Peers/>}<div className="jr-actions">{projects[project].live&&<Link href={projects[project].live}>Live project</Link>}{projects[project].repo&&<Link href={projects[project].repo}>Source code</Link>}</div></>}
    </section></>}
  </dialog>
}
function Stego(){
  const canvas=useRef<HTMLCanvasElement>(null)
  const [message,setMessage]=useState('')
  useEffect(()=>{
    const c=canvas.current?.getContext('2d',{willReadFrequently:true})
    if(!c)return
    const w=380,h=90
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#a2d9d7');sky.addColorStop(1,'#f5deb2');c.fillStyle=sky;c.fillRect(0,0,w,h)
    c.fillStyle='#ffdd97';c.beginPath();c.arc(273,27,12,0,Math.PI*2);c.fill()
    ;['#7dac9a','#517f72','#345f56'].forEach((ink,i)=>{c.fillStyle=ink;c.beginPath();c.moveTo(0,h);for(let x=0;x<=w;x++){c.lineTo(x,43+i*10+Math.sin(x/56+i*2)*11+Math.sin(x/27+i)*6)}c.lineTo(w,h);c.fill()})
    const bytes=new TextEncoder().encode('Meet me by the fountain.')
    const img=c.getImageData(0,0,w,h)
    const packet=Uint8Array.from([bytes.length,...bytes])
    packet.forEach((b,i)=>{for(let bit=0;bit<8;bit++){const channel=(i*8+bit)*4+2;img.data[channel]=(img.data[channel]&254)|((b>>(7-bit))&1)}})
    c.putImageData(img,0,0)
  },[])
  function extract(){
    const pixels=canvas.current?.getContext('2d')?.getImageData(0,0,380,90).data
    if(!pixels)return
    const read=(i:number)=>{let byte=0;for(let j=0;j<8;j++)byte=byte*2+(pixels[(i*8+j)*4+2]&1);return byte}
    setMessage(new TextDecoder().decode(Uint8Array.from({length:read(0)},(_,i)=>read(i+1))))
  }
  return <div className="jr-demo"><canvas width={380} height={90} ref={canvas} aria-label="A painting of green hills carrying a hidden note"/><button onClick={extract}>Extract hidden note</button><output aria-live="polite">{message}</output></div>
}
function Particles(){
  const canvas=useRef<HTMLCanvasElement>(null), center=useRef([190,55])
  const [spread,setSpread]=useState(45)
  useEffect(()=>{
    const ctx=canvas.current?.getContext('2d')
    if(!ctx)return
    let frame=0
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    function draw(time:number){
      if(!ctx)return
      ctx.fillStyle='#203b3a';ctx.fillRect(0,0,380,110)
      for(let i=0;i<180;i++){const a=i*2.39996+(reduced?0:time*.00018),r=Math.sqrt(i/180)*spread;ctx.fillStyle=i%5===0?'#f6bb69':'#93d9c4';ctx.beginPath();ctx.arc(center.current[0]+Math.cos(a)*r*2,center.current[1]+Math.sin(a)*r*.62+Math.sin(a*3)*5,1+i%3*.4,0,7);ctx.fill()}
      if(!reduced)frame=requestAnimationFrame(draw)
    }
    draw(0);return()=>cancelAnimationFrame(frame)
  },[spread])
  return <div className="jr-demo"><canvas width={380} height={110} ref={canvas} aria-label="Particle field responding to pointer movement and the spread slider" onPointerMove={e=>{const b=e.currentTarget.getBoundingClientRect();center.current=[(e.clientX-b.left)*380/b.width,(e.clientY-b.top)*110/b.height]}}/><label>Particle spread <input type="range" min="14" max="88" value={spread} onChange={e=>setSpread(Number(e.target.value))}/></label></div>
}
function Peers(){
  const [state,setState]=useState('Disconnected'),[draft,setDraft]=useState('Hello from the workshop!'),[mirror,setMirror]=useState('')
  const connection=useRef<RTCPeerConnection[]>([]), channel=useRef<RTCDataChannel|null>(null), active=useRef(true),latest=useRef(draft)
  const close=()=>{channel.current?.close();connection.current.forEach(p=>p.close());connection.current=[];channel.current=null}
  useEffect(()=>{active.current=true;return()=>{active.current=false;close()}},[])
  async function connect(){
    if(state==='Connected'){close();setState('Disconnected');setMirror('');return}
    setState('Connecting')
    try{
      const a=new RTCPeerConnection(),b=new RTCPeerConnection();connection.current=[a,b]
      async function relay(from:RTCPeerConnection,to:RTCPeerConnection){
        const queue:RTCIceCandidate[]=[]
        from.onicecandidate=({candidate})=>{if(!candidate)return;if(to.remoteDescription)void to.addIceCandidate(candidate).catch(()=>{});else queue.push(candidate)}
        return async()=>{for(const candidate of queue)await to.addIceCandidate(candidate);queue.length=0}
      }
      const flushB=await relay(a,b),flushA=await relay(b,a)
      const data=a.createDataChannel('workspace');channel.current=data
      data.onopen=()=>{if(active.current){setState('Connected');data.send(latest.current)}}
      b.ondatachannel=e=>{e.channel.onmessage=m=>{if(active.current)setMirror(String(m.data))}}
      await a.setLocalDescription(await a.createOffer());await b.setRemoteDescription(a.localDescription!);await flushB()
      await b.setLocalDescription(await b.createAnswer());await a.setRemoteDescription(b.localDescription!);await flushA()
    }catch{close();if(active.current)setState('Connection unavailable')}
  }
  useEffect(()=>{
    if(state!=='Connecting')return
    const timer=window.setTimeout(()=>{close();setState('Connection unavailable')},8000);return()=>clearTimeout(timer)
  },[state])
  return <div className="jr-demo"><div className="jr-peers"><label>Peer A<textarea value={draft} maxLength={500} onChange={e=>{latest.current=e.target.value;setDraft(e.target.value);if(channel.current?.readyState==='open')channel.current.send(e.target.value)}}/></label><label>Peer B<textarea readOnly value={mirror} placeholder="Waiting for an edit…"/></label></div><button disabled={state==='Connecting'} onClick={connect}>{state==='Connected'?'Disconnect':'Connect peers'}</button><output aria-live="polite">{state}</output></div>
}

