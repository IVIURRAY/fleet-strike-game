import { BASE_HP, INCOME, LANE_LENGTH, SHIPS, WAVE_SECONDS } from '../shared/config.js';
import type { GameEvent, MatchState, Row, Ship, ShipType } from '../shared/types.js';

let seq=0;
const queue=():Record<Row,ShipType[]>=>({0:[],1:[],2:[]});
export function newMatch(room:string,name:string):MatchState{return{room,phase:'waiting',wave:0,nextWave:WAVE_SECONDS,serverTime:Date.now(),players:[{name,gold:80,baseHp:BASE_HP,queue:queue(),placements:[],connected:true},{name:'Waiting for captain…',gold:80,baseHp:BASE_HP,queue:queue(),placements:[],connected:false}],ships:[],winner:null,events:[]}}
const event=(s:MatchState,e:Omit<GameEvent,'id'>)=>s.events.push({...e,id:`e${++seq}`});
export function launch(s:MatchState){s.wave++;event(s,{type:'launch',text:`Wave ${s.wave} launched`});for(const owner of [0,1] as const){for(const p of s.players[owner].placements){const c=SHIPS[p.type],row=Math.max(0,Math.min(2,Math.round(p.y*2))) as Row;s.ships.push({id:`s${++seq}`,owner,type:p.type,row,x:p.x*100,y:8+p.y*84,hp:c.hp,maxHp:c.hp,cooldown:Math.random()*.4,state:'moving'})}s.players[owner].placements=[]}}
export function tick(s:MatchState,dt:number){
  if(s.phase!=='battle')return;s.serverTime=Date.now();s.nextWave-=dt;s.players.forEach(p=>p.gold=Math.min(999,p.gold+INCOME*dt));
  if(s.nextWave<=0){launch(s);s.nextWave+=WAVE_SECONDS}
  const dead=new Set<string>();
  for(const ship of s.ships){const cfg=SHIPS[ship.type];ship.cooldown-=dt;const enemies=s.ships.filter(x=>x.owner!==ship.owner&&!dead.has(x.id));const distance=(a:Ship,b:Ship)=>Math.hypot(a.x-b.x,a.y-b.y);const closest=enemies.sort((a,b)=>distance(ship,a)-distance(ship,b))[0];
    if(closest&&distance(ship,closest)<=cfg.range){ship.state='fighting';if(ship.cooldown<=0){const bonus=cfg.strong===closest.type?1.55:1;closest.hp-=cfg.damage*bonus;ship.cooldown=1/cfg.rate;event(s,{type:'shot',x:(ship.x+closest.x)/2,y:(ship.y+closest.y)/2,from:ship.owner});if(closest.hp<=0){dead.add(closest.id);s.players[ship.owner].gold+=1;event(s,{type:'death',x:closest.x,y:closest.y,from:closest.owner})}}}
    else{ship.state='moving';const baseX=ship.owner===0?LANE_LENGTH:0,baseY=50;let goalX=baseX,goalY=baseY;
      if(ship.type==='interceptor'&&closest){goalX=closest.x;goalY=closest.y}
      else if(ship.type==='corvette'&&closest&&distance(ship,closest)<30){goalX=closest.x*.58+baseX*.42;goalY=closest.y*.58+baseY*.42}
      const dx=goalX-ship.x,dy=goalY-ship.y,len=Math.hypot(dx,dy)||1;ship.x+=dx/len*cfg.speed*dt;ship.y+=dy/len*cfg.speed*dt;ship.row=Math.max(0,Math.min(2,Math.round((ship.y-8)/42))) as Row;
      if(ship.x>=LANE_LENGTH||ship.x<=0){dead.add(ship.id);const enemy=ship.owner===0?1:0;const dmg=Math.max(8,Math.round(cfg.damage*1.5));s.players[enemy].baseHp=Math.max(0,s.players[enemy].baseHp-dmg);event(s,{type:'baseHit',x:ship.x,y:ship.y,from:ship.owner,text:`-${dmg}`});if(s.players[enemy].baseHp<=0){s.phase='ended';s.winner=ship.owner}}}}
  s.ships=s.ships.filter(x=>!dead.has(x.id));s.events=s.events.slice(-30);
}
