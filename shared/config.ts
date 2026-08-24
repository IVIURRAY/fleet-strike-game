import type { ShipType } from './types.js';
export const SHIPS: Record<ShipType,{name:string;cost:number;hp:number;damage:number;speed:number;rate:number;range:number;color:number;strong:ShipType; blurb:string}> = {
  interceptor:{name:'Interceptor',cost:20,hp:40,damage:25,speed:28,rate:1,range:5,color:0x55d9ff,strong:'corvette',blurb:'Fast burst hunter'},
  dreadnought:{name:'Dreadnought',cost:60,hp:300,damage:15,speed:7,rate:.5,range:4,color:0xffb44a,strong:'interceptor',blurb:'Armoured frontline'},
  corvette:{name:'Corvette',cost:15,hp:80,damage:8,speed:17,rate:1.5,range:4,color:0x7df0a2,strong:'dreadnought',blurb:'Cheap swarm vessel'}
};
export const BASE_HP=500, INCOME=10, WAVE_SECONDS=30, LANE_LENGTH=100;
