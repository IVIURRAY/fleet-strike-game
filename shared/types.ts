export type ShipType = 'interceptor' | 'dreadnought' | 'corvette';
export type Row = 0 | 1 | 2;
export interface Placement { id:string; type:ShipType; x:number; y:number; }
export interface Ship { id:string; owner:0|1; type:ShipType; row:Row; x:number; y:number; hp:number; maxHp:number; cooldown:number; state:'moving'|'fighting'; }
export interface Player { name:string; gold:number; baseHp:number; queue:Record<Row, ShipType[]>; placements:Placement[]; connected:boolean; }
export interface MatchState { room:string; phase:'waiting'|'battle'|'ended'; wave:number; nextWave:number; serverTime:number; players:[Player,Player]; ships:Ship[]; winner:0|1|null; events:GameEvent[]; }
export interface GameEvent { id:string; type:'shot'|'death'|'launch'|'baseHit'|'joined'; x?:number; y?:number; row?:Row; from?:0|1; text?:string; }
export type ClientMessage = { type:'create'; name:string } | { type:'join'; name:string; room:string } | { type:'buy'; ship:ShipType; x:number; y:number } | { type:'refund'; ship:ShipType; row:Row } | {type:'rematch'};
export type ServerMessage = { type:'welcome'; player:0|1; room:string } | { type:'state'; state:MatchState } | { type:'error'; message:string };
