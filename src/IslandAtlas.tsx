import {creekZ,lanes,paths,shoreRadius,stops,type Point} from './geography'
const coast=Array.from({length:240},(_,i)=>{const a=i*Math.PI/120,r=shoreRadius(a);return [Math.cos(a)*r,Math.sin(a)*r].join(',')}).join(' ')
const roads=[...lanes,...paths].map(path=>path.map(p=>p.join(',')).join(' '))
export default function IslandAtlas({position,names,travel}:{position:Point;names:string[];travel:(i:number)=>void}){
 return <svg className="island-atlas" viewBox="-90 -90 180 180" aria-label="Island atlas with district destinations and your current position">
 <circle r="85" fill="#93c9cd"/>
 <polygon points={coast} fill="#b2c394" stroke="#f4e1b8" strokeWidth="3"/>
 <polyline points={Array.from({length:32},(_,i)=>{const x=-34-i;return [x,creekZ(x)].join(',')}).join(' ')} fill="none" stroke="#93c9cd" strokeWidth="1.6"/>
 {roads.map((r,i)=><polyline key={i} points={r} fill="none" stroke={i<4?'#f8e9cb':'#e2ce9d'} strokeWidth={i<4?2.6:1.4}/>)}
 {stops.map(([x,z],i)=><g key={i} role="button" tabIndex={0} aria-label={'Travel to '+names[i]} onClick={()=>travel(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();travel(i)}}}>
 <title>{names[i]}</title><circle cx={x} cy={z} r="5" fill="#415e50" stroke="#fcf2d9" strokeWidth=".8"/><text x={x} y={z+1.6} textAnchor="middle" fontSize="4.5" fill="#fff6dc">{i+1}</text></g>)}
 <g fill="#364f49" fontSize="3.1" pointerEvents="none"><text x="25" y="-7">StegoVault</text><text x="3" y="34">AETHIRIA · FORGE</text></g>
 <g pointerEvents="none"><title>Your location</title><circle cx={position[0]} cy={position[1]} r="2.4" fill="#c15f38" stroke="white" strokeWidth=".8"/></g>
 <text x="-70" y="64" fontSize="3.7" fill="#285454">● Your location</text>
 </svg>
}
