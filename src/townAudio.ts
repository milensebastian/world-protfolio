import type {Vector3} from 'three'

// All sources are synthesized locally. Mix volume and pan in camera space;
// tick at 8 Hz and let Web Audio interpolate between control updates.
export function townAudio(){
 const ctx=new AudioContext(),master=ctx.createGain()
 master.gain.value=0;master.connect(ctx.destination)
 void ctx.resume().catch(()=>{})
 const noise=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),samples=noise.getChannelData(0)
 let previous=0
 for(let i=0;i<samples.length;i++){previous=(previous+.18*(Math.random()*2-1))/1.18;samples[i]=previous}
 const stops:AudioScheduledSourceNode[]=[]
 const layers:{x:number;z:number;peak:number;reach:number;gain:GainNode;pan:StereoPannerNode}[]=[]
 function layer(x:number,z:number,peak:number,reach:number){
   const gain=ctx.createGain(),pan=ctx.createStereoPanner();gain.gain.value=0;gain.connect(pan);pan.connect(master)
   layers.push({x,z,peak,reach,gain,pan});return gain
 }
 function air(node:GainNode,hz:number,type:BiquadFilterType){
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter()
   filter.type=type;filter.frequency.value=hz;source.buffer=noise;source.loop=true;source.connect(filter);filter.connect(node);source.start();stops.push(source)
 }
 function tone(node:GainNode,hz:number,type:OscillatorType){
   const oscillator=ctx.createOscillator();oscillator.type=type;oscillator.frequency.value=hz
   oscillator.connect(node);oscillator.start();stops.push(oscillator)
 }
 air(layer(0,0,.43,15),2400,'highpass')
 air(layer(-26,4,.27,19),1050,'lowpass')
 tone(layer(24,-4,.018,12),116,'sine')
 tone(layer(-5,25,.014,12),83,'triangle')
 air(layer(42,-31,.25,19),560,'lowpass')
 const murmur=layer(-5,-5,.09,9);air(murmur,460,'bandpass')
 const chirp=ctx.createOscillator(),envelope=ctx.createGain(),birdPan=ctx.createStereoPanner()
 chirp.connect(envelope);envelope.connect(birdPan);birdPan.connect(master);envelope.gain.value=0;chirp.start();stops.push(chirp)
 let last=-1,nextCall=2
 return {
   tick(time:number,p:Vector3,yaw:number,quiet:boolean){
     if(time-last<.12)return;last=time
     const t=ctx.currentTime
     master.gain.setTargetAtTime(quiet?.30:.68,t,.3)
     for(const source of layers){
       const dx=source.x-p.x,dz=source.z-p.z,d=Math.hypot(dx,dz)
       source.gain.gain.setTargetAtTime(source.peak*Math.max(0,1-d/source.reach)**2,t,.24)
       source.pan.pan.setTargetAtTime(Math.max(-.85,Math.min(.85,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(4,d))),t,.2)
     }
     if(!quiet&&time>=nextCall){
       nextCall=time+3+Math.random()*5
       const workshop=Math.hypot(p.x,p.z-27)<10||Math.hypot(p.x+24,p.z-24)<12
       const freq=workshop?710:1900+Math.random()*500
       birdPan.pan.setValueAtTime(Math.random()*1.3-.65,t)
       chirp.frequency.setValueAtTime(freq,t);chirp.frequency.exponentialRampToValueAtTime(freq*(workshop?.8:1.45),t+.12)
       envelope.gain.setValueAtTime(.0001,t);envelope.gain.exponentialRampToValueAtTime(workshop?.023:.016,t+.016);envelope.gain.exponentialRampToValueAtTime(.0001,t+.21)
     }
   },
   quiet(){master.gain.setTargetAtTime(.1,ctx.currentTime,.22)},
   close(){for(const s of stops)s.stop();void ctx.close().catch(()=>{})}
 }
}
