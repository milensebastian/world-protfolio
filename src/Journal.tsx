import { useEffect, useRef, useState } from 'react'
import './journal.css'

type Props = { mode: 'journal' | 'project'; district: number; initialProject?: number; onClose: () => void; initialTab?: string }
const tabs = ['About', 'Projects', 'Education', 'Contact']
const portfolio = 'https://milen.vercel.app/'
const projects = [
  {name: 'StegoVault', summary: 'A secret inside a picture', text: 'StegoVault combines image steganography with authenticated encryption. PBKDF2 derives a key from a passphrase and salt. AES-256-GCM protects the message before it is embedded in the image.', stack: 'Steganography · AES-256-GCM · PBKDF2', live: 'https://stegovault-two.vercel.app/', repo: 'https://github.com/milensebastian/stegovault'},
  {name: 'AETHIRIA', summary: 'Sculpt particles with your hands', text: 'MediaPipe tracks hand landmarks and Three.js translates their movement into a particle field. Try moving the field’s center and changing its spread here, or open the live project for camera-based gestures.', stack: 'MediaPipe · Three.js · Gesture tracking', live: 'https://aethiria-woad.vercel.app/', repo: 'https://github.com/milensebastian/AETHIRIA'},
  {name: 'FORGE', summary: 'A workspace between peers', text: 'A collaborative coding workspace uses WebRTC data channels to carry edits between browsers. Connect two local peers below, then type to see your edit travel through a real data channel.', stack: 'WebRTC · Data channels · Collaborative editing', live: 'https://forge-p2p.vercel.app', repo: 'https://github.com/milensebastian/forge-p2p'}
]
function Link({href,children}:{href:string; children:React.ReactNode}) {
  return <a className="jr-link" href={href} target="_blank" rel="noreferrer">{children} <span aria-hidden="true">↗</span></a>
}
export default function Journal({mode,district,initialProject=0,onClose,initialTab='About'}:Props) {
  const [tab,setTab]=useState(tabs.find(x=>x.toLowerCase()===initialTab.toLowerCase()) || (initialTab.toLowerCase()==='resume'?'Education':'About'))
  const dedicated=mode==='project'
  const [project,setProject]=useState(dedicated?initialProject:district===2?1:0)
  const modal=useRef<HTMLDialogElement>(null)
  useEffect(()=>{
    const d=modal.current, previous=document.activeElement as HTMLElement|null
    d?.showModal()
    return ()=>{d?.close(); previous?.focus()}
  },[])
  return <dialog ref={modal} className={'jr-dialog'+(dedicated?' jr-project-panel':'')} aria-labelledby="jr-title" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===modal.current){const box=modal.current.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)onClose()}}}>
    <div className="jr-head"><span className="jr-meta">{dedicated?(initialProject===0?'StegoVault Lab':'Innovation Workshop'):'Portfolio World / Field journal'}</span><button className="jr-close" onClick={onClose} aria-label={dedicated?'Close project':'Close journal'}>×</button></div>
    <h2 id="jr-title" className="jr-title">{dedicated?projects[project].name:'Field journal'}</h2>
    {!dedicated&&<nav className="jr-tabs" aria-label="Journal sections">{tabs.map(t=><button key={t} aria-current={tab===t?'page':undefined} onClick={()=>setTab(t)}>{t}</button>)}</nav>}
    <section className="jr-inner" key={tab}>
    {!dedicated&&tab==='About'&&<><span className="jr-meta">The creator</span><h3>Milen Sebastian</h3><p className="jr-lede">Cybersecurity student and builder from Kerala, India.</p><p>I explore how information stays private, how people create together, and how a gesture can become an interface. Those questions run through the projects you’ll find in this town.</p><div className="jr-actions"><button onClick={()=>setTab('Projects')}>Explore my projects →</button><Link href={portfolio}>Original portfolio</Link></div></>}
    {!dedicated&&tab==='Education'&&<><span className="jr-meta">Knowledge Campus</span><h3>Education &amp; experience</h3><dl className="jr-record"><dt>B.Tech in Cyber Security</dt><dd>St. Joseph’s College of Engineering and Technology, Palai</dd><dt>Foundations of Cybersecurity</dt><dd>Google · June 2026</dd><dt>CYA Quest</dt><dd>Third place with my team in the Cyber Security Association’s capture-the-flag competition.</dd><dt>Digital forensics</dt><dd>Participated in Trazada: The Last Trace, a cyber forensics workshop by Offenso Hackers Academy.</dd></dl><Link href="https://www.linkedin.com/in/milensebastian/">Professional profile</Link></>}
    {!dedicated&&tab==='Contact'&&<><span className="jr-meta">Personal Garden</span><h3>Get in touch</h3><p>Have a project, a collaboration, or a question about something you found in town? Send me a message through my portfolio or connect on LinkedIn.</p><div className="jr-actions"><Link href={portfolio+'#contact'}>Contact Milen</Link><Link href="https://www.linkedin.com/in/milensebastian/">LinkedIn</Link><Link href="https://github.com/milensebastian">GitHub</Link></div></>}
    {(dedicated||tab==='Projects')&&<>{(!dedicated||initialProject===1)&&<div className="jr-projects" aria-label="Select project">{projects.map((p,i)=>(!dedicated||i>0)&&<button key={p.name} aria-pressed={project===i} onClick={()=>setProject(i)}>{p.name}</button>)}</div>}<h3>{projects[project].summary}</h3><p>{projects[project].text}</p><p className="jr-meta">{projects[project].stack}</p>{project===0?<Stego/>:project===1?<Particles/>:<Peers/>}<div className="jr-actions">{projects[project].live&&<Link href={projects[project].live}>Live project</Link>}{projects[project].repo&&<Link href={projects[project].repo}>Source code</Link>}</div></>}
    </section>
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

