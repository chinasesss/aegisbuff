import { UserAccount } from '../types';
const KEY='aegisbuff_user';
class AuthService {
 private currentUser: UserAccount|null=null;
 constructor(){ try{const raw=localStorage.getItem(KEY); if(raw)this.currentUser=JSON.parse(raw);}catch{this.currentUser=null;} }
 async hydrate(){ try{const r=await fetch(`${import.meta.env.VITE_API_URL||''}/api/auth/me`,{credentials:'include'}); const d=await r.json(); this.currentUser=d.user||null; if(this.currentUser)localStorage.setItem(KEY,JSON.stringify(this.currentUser)); else localStorage.removeItem(KEY); window.dispatchEvent(new CustomEvent('aegis_auth_changed',{detail:this.currentUser})); }catch{} return this.currentUser; }
 getCurrentUser(){return this.currentUser;}
 isAuthenticated(){return !!this.currentUser;}
 loginWithSteam(){ window.location.href=`${import.meta.env.VITE_API_URL||''}/api/auth/steam`; }
 async logout(){await fetch(`${import.meta.env.VITE_API_URL||''}/api/auth/logout`,{method:'POST',credentials:'include'}).catch(()=>{}); this.currentUser=null; localStorage.removeItem(KEY); window.dispatchEvent(new CustomEvent('aegis_auth_changed',{detail:null}));}
 connectSteamAccount(accountId:number,playerName:string,avatarUrl?:string){ if(!this.currentUser)return false; this.currentUser.connectedAccountId=accountId;this.currentUser.connectedPlayerName=playerName;if(avatarUrl)this.currentUser.avatarUrl=avatarUrl;localStorage.setItem(KEY,JSON.stringify(this.currentUser));return true; }
 private save(){if(this.currentUser)localStorage.setItem(KEY,JSON.stringify(this.currentUser));window.dispatchEvent(new CustomEvent('aegis_auth_changed',{detail:this.currentUser}));}
 toggleFavoritePlayer(id:number){if(!this.currentUser)return false;const a=this.currentUser.favorites.players;const exists=a.includes(id);this.currentUser.favorites.players=exists?a.filter(x=>x!==id):[...a,id];this.save();return !exists;}
 toggleFavoriteHero(id:number){if(!this.currentUser)return false;const a=this.currentUser.favorites.heroes;const exists=a.includes(id);this.currentUser.favorites.heroes=exists?a.filter(x=>x!==id):[...a,id];this.save();return !exists;}
 toggleFavoriteMatch(id:number){if(!this.currentUser)return false;const a=this.currentUser.favorites.matches;const exists=a.includes(id);this.currentUser.favorites.matches=exists?a.filter(x=>x!==id):[...a,id];this.save();return !exists;}
 isPlayerFavorited(id:number){return !!this.currentUser?.favorites.players.includes(id)}
 isHeroFavorited(id:number){return !!this.currentUser?.favorites.heroes.includes(id)}
 isMatchFavorited(id:number){return !!this.currentUser?.favorites.matches.includes(id)}
}
export const authService=new AuthService();
