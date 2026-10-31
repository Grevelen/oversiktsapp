import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type Icon = ComponentProps<typeof Ionicons>['name'];
export type Tab = 'Oversikt' | 'Budsjett' | 'Forsikringer' | 'Abonnement' | 'Sparing';
export type Screen = Tab;
export type GoalCategory = 'Sparemål' | 'Buffer' | 'Fond' | 'Aksjer' | 'Pensjon';
export type FormKind = 'insurance' | 'subscription' | 'goal' | 'income' | 'expense' | null;
export type Insurance = { id:string; type:string; provider:string; monthly:number; coverage:string; renewal:string; registeredAmount?:number; registeredPeriod?:Period; bonus?:string; coverageType?:string; insuredValue?:string; deductible?:string; startDate?:string; expiryDate?:string; note?:string };
export type Subscription = { id:string; name:string; category:string; monthly:number; renewal:string; registeredAmount?:number; registeredPeriod?:Period };
export type Goal = { id:string; name:string; target:number; saved:number; targetDate:string; category:GoalCategory; monthly:number; imageUri?:string };
export type Period = 'month' | 'quarter' | 'year';
export type BudgetItem = { id:string; name:string; monthly:number; category:string; origin?:string; interest?:number; principal?:number; registeredAmount?:number; registeredPeriod?:Period };
export const DATA_VERSION = 3;
export type AppData = { dataVersion:number; insurance:Insurance[]; subscriptions:Subscription[]; goals:Goal[]; incomes:BudgetItem[]; expenses:BudgetItem[]; dismissedInsights?:string[]; skippedSetup?:string[]; onboardingComplete?:boolean; };
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
  dataVersion:DATA_VERSION,
  incomes:[],
  expenses:[],
  insurance:[],
  subscriptions:[],
  goals:[],
  dismissedInsights:[],
  skippedSetup:[],
  onboardingComplete:false,
};
const asArray=<T>(value:unknown):T[]=>Array.isArray(value)?value as T[]:[];
const stableInsightId=(id:string)=>id.startsWith('negative-')?'negative-budget':id.startsWith('subscriptions-')?'subscriptions-overview':id==='buffer-new'?'buffer-missing':id.startsWith('buffer-progress-')?'buffer-progress':id.startsWith('debt-')?'debt-costs':id.startsWith('insurance-')?'insurance-overview':id.startsWith('largest-')?'largest-expense':id.startsWith('surplus-')?'budget-surplus':id;
export function migrateAppData(input:unknown):AppData{
 const old=input&&typeof input==='object'?input as Partial<AppData>&Record<string,unknown>:{};
 const incomes=asArray<BudgetItem>(old.incomes).map(x=>({...x,registeredAmount:x.registeredAmount??x.monthly??0,registeredPeriod:x.registeredPeriod??'month'}));
 const expenses=asArray<BudgetItem>(old.expenses).map(x=>({...x,registeredAmount:x.registeredAmount??x.monthly??0,registeredPeriod:x.registeredPeriod??'month'}));
 const insurance=asArray<Insurance>(old.insurance).map(x=>({...x,monthly:x.monthly??0,registeredAmount:x.registeredAmount??x.monthly??0,registeredPeriod:x.registeredPeriod??'month'}));
 const subscriptions=asArray<Subscription>(old.subscriptions).map(x=>({...x,monthly:x.monthly??0,registeredAmount:x.registeredAmount??x.monthly??0,registeredPeriod:x.registeredPeriod??'month'}));
 const goals=asArray<Goal>(old.goals).map(g=>({...g,target:g.target??0,saved:g.saved??0,monthly:g.monthly??0,category:g.category??'Sparemål',targetDate:g.targetDate??''}));
 const dismissedInsights=asArray<string>(old.dismissedInsights).filter(x=>typeof x==='string').map(stableInsightId).filter((id,i,a)=>a.indexOf(id)===i);
 const hasData=incomes.length+expenses.length+insurance.length+subscriptions.length+goals.length>0;
 const skippedSetup=asArray<string>(old.skippedSetup).filter(x=>['income','expense','insurance','subscription','goal'].includes(x));
 return{dataVersion:DATA_VERSION,incomes,expenses,insurance,subscriptions,goals,dismissedInsights,skippedSetup,onboardingComplete:typeof old.onboardingComplete==='boolean'?old.onboardingComplete:hasData};
}
export function parseStoredAppData(raw:string):AppData|null{
 try{return migrateAppData(JSON.parse(raw))}catch{return null}
}
export const tabs:{name:Tab;icon:Icon}[]=[{name:'Oversikt',icon:'home-outline'},{name:'Budsjett',icon:'wallet-outline'},{name:'Forsikringer',icon:'shield-checkmark-outline'},{name:'Abonnement',icon:'repeat-outline'},{name:'Sparing',icon:'flag-outline'}];

export type InsightKind = 'action'|'observation'|'positive';
export type Insight = {id:string;title:string;detail:string;icon:Icon;target:Tab;kind:InsightKind;priority:number;reason:string};
export function buildInsights(data:AppData,budget:{income:number;expense:number;saving:number;left:number}):Insight[]{
 const recs:Insight[]=[];const annualSubscriptions=data.subscriptions.reduce((a,b)=>a+b.monthly*12,0);const annualInsurance=data.insurance.reduce((a,b)=>a+b.monthly*12,0);const buffer=data.goals.find(g=>g.category==='Buffer');const debt=data.expenses.filter(x=>x.category==='Gjeld').reduce((a,b)=>a+b.monthly,0);const largest=[...data.expenses].sort((a,b)=>b.monthly-a.monthly)[0];
 if(budget.left<0)recs.push({id:'negative-budget',title:'Budsjettet går i minus',detail:`Utgifter og sparing er ${kr(Math.abs(budget.left))} høyere enn inntektene.`,icon:'warning-outline',target:'Budsjett',kind:'action',priority:100,reason:'Registrerte utgifter og fast sparing overstiger registrerte inntekter.'});
 if(!buffer)recs.push({id:'buffer-missing',title:'Ingen buffer registrert',detail:'Det er ikke registrert noe sparemål i kategorien Buffer.',icon:'wallet-outline',target:'Sparing',kind:'action',priority:90,reason:'Overs finner ingen sparepost i kategorien Buffer.'});else if(buffer.target>0&&buffer.saved<buffer.target)recs.push({id:'buffer-progress',title:'Status for buffer',detail:`${kr(buffer.saved)} av ${kr(buffer.target)} er registrert på buffermålet.`,icon:'wallet-outline',target:'Sparing',kind:'observation',priority:70,reason:'Bufferen har et registrert målbeløp som ennå ikke er nådd.'});
 if(debt>0)recs.push({id:'debt-costs',title:'Registrerte gjeldskostnader',detail:`Registrerte gjeldsbetalinger er ${kr(debt)} per måned.`,icon:'card-outline',target:'Budsjett',kind:'observation',priority:65,reason:'Budsjettet inneholder utgifter i kategorien Gjeld.'});
 if(largest)recs.push({id:'largest-expense',title:'Største utgiftspost',detail:`${largest.name} er registrert med ${kr(largest.monthly)} per måned.`,icon:'trending-down-outline',target:'Budsjett',kind:'observation',priority:55,reason:'Dette er den høyeste registrerte manuelle utgiftsposten.'});
 if(data.insurance.length)recs.push({id:'insurance-overview',title:'Registrerte forsikringer',detail:data.insurance.length===1?`1 avtale utgjør ${kr(annualInsurance)} per år.`:`${data.insurance.length} avtaler utgjør ${kr(annualInsurance)} per år.`,icon:'shield-checkmark-outline',target:'Forsikringer',kind:'observation',priority:45,reason:'Overs summerer de registrerte forsikringspremiene.'});
 if(data.subscriptions.length)recs.push({id:'subscriptions-overview',title:'Registrerte abonnementer',detail:data.subscriptions.length===1?`1 aktivt abonnement utgjør ${kr(annualSubscriptions)} per år.`:`${data.subscriptions.length} aktive abonnementer utgjør ${kr(annualSubscriptions)} per år.`,icon:'repeat-outline',target:'Abonnement',kind:'observation',priority:40,reason:'Overs summerer de registrerte abonnementskostnadene.'});
 if(budget.left>0)recs.push({id:'budget-surplus',title:'Overskudd i budsjettet',detail:`${kr(budget.left)} er til overs etter registrerte utgifter og sparing.`,icon:'sparkles-outline',target:'Sparing',kind:'positive',priority:10,reason:'Registrerte inntekter er høyere enn registrerte utgifter og fast sparing.'});
 return recs.sort((a,b)=>b.priority-a.priority);
}
