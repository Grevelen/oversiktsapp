import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type Icon = ComponentProps<typeof Ionicons>['name'];
export type Tab = 'Oversikt' | 'Budsjett' | 'Forsikringer' | 'Abonnement' | 'Sparing';
export type Screen = Tab;
export type GoalCategory = 'Sparemål' | 'Buffer' | 'Fond' | 'Aksjer' | 'Pensjon';
export type FormKind = 'insurance' | 'subscription' | 'goal' | 'income' | 'expense' | null;
export type Insurance = { id:string; type:string; provider:string; monthly:number; coverage:string; renewal:string; bonus?:string; coverageType?:string; insuredValue?:string; deductible?:string; startDate?:string; expiryDate?:string; note?:string };
export type Subscription = { id:string; name:string; category:string; monthly:number; renewal:string };
export type Goal = { id:string; name:string; target:number; saved:number; targetDate:string; category:GoalCategory; monthly:number; imageUri?:string };
export type Period = 'month' | 'quarter' | 'year';
export type BudgetItem = { id:string; name:string; monthly:number; category:string; origin?:string; interest?:number; principal?:number; registeredAmount?:number; registeredPeriod?:Period };
export type AppData = { insurance:Insurance[]; subscriptions:Subscription[]; goals:Goal[]; incomes:BudgetItem[]; expenses:BudgetItem[]; dismissedInsights?:string[]; onboardingComplete?:boolean; };
export type BudgetRow = BudgetItem & { source:'income'|'manual'|'insurance'|'subscription'|'saving'; sourceId?:string };

export const K = '@oversiktsapp/v061';
export const C = {bg:'#EEE7D6',white:'#FFF',surface:'#F8F3E8',surfaceStrong:'#F3ECDE',ink:'#13231E',sub:'#66716C',muted:'#8A918E',green:'#0C624E',dark:'#173D32',pale:'#DDF3E9',icon:'#DCEAE4',line:'#D8D0C0',red:'#A8453C',redPale:'#FBEAE8',amber:'#95610F',amberPale:'#FFF3D7'};
export const fmt = (n:number)=>new Intl.NumberFormat('nb-NO',{maximumFractionDigits:0}).format(Math.round(n));
export const kr = (n:number)=>`${fmt(n)} kr`;
export const num = (x='')=>{const n=Number(x.replace(/\s/g,'').replace(',','.').replace(/[^0-9.]/g,''));return Number.isFinite(n)?n:0};
export const groupDigits = (x='')=>{const clean=x.replace(/\D/g,'');return clean?new Intl.NumberFormat('nb-NO',{maximumFractionDigits:0}).format(Number(clean)):''};
export const uid = (p:string)=>`${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const dateText = (d:Date)=>new Intl.DateTimeFormat('nb-NO',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
export const parseDate = (x='')=>{const m=x.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);return m?new Date(+m[3],+m[2]-1,+m[1]):null};
export const insIcon = (x:string):Icon=>{x=x.toLowerCase();if(x.includes('bil'))return'car-sport-outline';if(x.includes('reise'))return'airplane-outline';if(x.includes('liv'))return'heart-outline';if(x.includes('helse')||x.includes('ulykke'))return'medical-outline';if(x.includes('dyr'))return'paw-outline';if(x.includes('hus')||x.includes('innbo'))return'home-outline';return'shield-outline'};
export const subIcon = (x:string):Icon=>{x=x.toLowerCase();if(x.includes('musikk'))return'headset-outline';if(x.includes('telefon')||x.includes('mobil'))return'phone-portrait-outline';if(x.includes('film')||x.includes('tv')||x.includes('strøm'))return'play-circle-outline';if(x.includes('sky'))return'cloud-outline';if(x.includes('spill'))return'game-controller-outline';if(x.includes('avis'))return'newspaper-outline';if(x.includes('internett'))return'wifi-outline';return'globe-outline'};
export const goalIcon = (g:Goal):Icon=>g.category==='Fond'||g.category==='Aksjer'?'trending-up-outline':g.category==='Pensjon'?'hourglass-outline':g.category==='Buffer'?'wallet-outline':g.name.toLowerCase().includes('tur')?'airplane-outline':'flag-outline';

export const seed:AppData={
  incomes:[],
  expenses:[],
  insurance:[],
  subscriptions:[],
  goals:[],
  dismissedInsights:[],
  onboardingComplete:false,
};
export const tabs:{name:Tab;icon:Icon}[]=[{name:'Oversikt',icon:'home-outline'},{name:'Budsjett',icon:'wallet-outline'},{name:'Forsikringer',icon:'shield-checkmark-outline'},{name:'Abonnement',icon:'repeat-outline'},{name:'Sparing',icon:'flag-outline'}];

export type Insight = {id:string;title:string;detail:string;icon:Icon;target:Tab};
export function buildInsights(data:AppData,budget:{income:number;expense:number;saving:number;left:number}):Insight[]{
 const recs:Insight[]=[];const annualSubscriptions=data.subscriptions.reduce((a,b)=>a+b.monthly*12,0);const annualInsurance=data.insurance.reduce((a,b)=>a+b.monthly*12,0);const buffer=data.goals.find(g=>g.category==='Buffer');const debt=data.expenses.filter(x=>x.category==='Gjeld').reduce((a,b)=>a+b.monthly,0);const largest=[...data.expenses].sort((a,b)=>b.monthly-a.monthly)[0];
 if(budget.left<0)recs.push({id:`negative-${Math.round(Math.abs(budget.left))}`,title:'Budsjettet går i minus',detail:`Utgifter og sparing er ${kr(Math.abs(budget.left))} høyere enn inntektene.`,icon:'warning-outline',target:'Budsjett'});
 if(data.subscriptions.length)recs.push({id:`subscriptions-${data.subscriptions.length}-${Math.round(annualSubscriptions)}`,title:'Registrerte abonnementer',detail:data.subscriptions.length===1?`1 aktivt abonnement utgjør ${kr(annualSubscriptions)} per år.`:`${data.subscriptions.length} aktive abonnementer utgjør ${kr(annualSubscriptions)} per år.`,icon:'repeat-outline',target:'Abonnement'});
 if(!buffer)recs.push({id:'buffer-new',title:'Ingen buffer registrert',detail:'Det er ikke registrert noe sparemål i kategorien Buffer.',icon:'wallet-outline',target:'Sparing'});else if(buffer.target>0&&buffer.saved<buffer.target)recs.push({id:`buffer-progress-${Math.round(buffer.saved)}-${Math.round(buffer.target)}`,title:'Status for buffer',detail:`${kr(buffer.saved)} av ${kr(buffer.target)} er registrert på buffermålet.`,icon:'wallet-outline',target:'Sparing'});
 if(debt>0)recs.push({id:`debt-${Math.round(debt)}`,title:'Registrerte gjeldskostnader',detail:`Registrerte gjeldsbetalinger er ${kr(debt)} per måned.`,icon:'card-outline',target:'Budsjett'});
 if(data.insurance.length)recs.push({id:`insurance-${data.insurance.length}-${Math.round(annualInsurance)}`,title:'Registrerte forsikringer',detail:data.insurance.length===1?`1 avtale utgjør ${kr(annualInsurance)} per år.`:`${data.insurance.length} avtaler utgjør ${kr(annualInsurance)} per år.`,icon:'shield-checkmark-outline',target:'Forsikringer'});
 if(largest)recs.push({id:`largest-${largest.id}-${Math.round(largest.monthly)}`,title:'Største utgiftspost',detail:`${largest.name} er registrert med ${kr(largest.monthly)} per måned.`,icon:'trending-down-outline',target:'Budsjett'});
 if(budget.left>0)recs.push({id:`surplus-${Math.round(budget.left)}`,title:'Overskudd i budsjettet',detail:`${kr(budget.left)} er til overs etter registrerte utgifter og fast sparing.`,icon:'sparkles-outline',target:'Sparing'});return recs;
}
