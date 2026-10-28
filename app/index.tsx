import React,{useState} from 'react';
import {SafeAreaView,View,Text,StyleSheet,ScrollView,Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {StatusBar} from 'expo-status-bar';

const money=(n:number)=>new Intl.NumberFormat('nb-NO',{style:'currency',currency:'NOK',maximumFractionDigits:0}).format(n);
const agreements=[
 {icon:'home-outline',title:'Lån',value:'5 240 000 kr',sub:'Samlet restgjeld'},
 {icon:'shield-checkmark-outline',title:'Forsikringer',value:'31 450 kr/år',sub:'Samlet premie'},
 {icon:'repeat-outline',title:'Abonnementer',value:'1 840 kr/mnd',sub:'Aktive avtaler'},
 {icon:'flash-outline',title:'Faste utgifter',value:'6 300 kr/mnd',sub:'Strøm og annet'},
];
const tabs=[['Oversikt','home-outline'],['Avtaler','documents-outline'],['Hverdag','cart-outline'],['Sparing','trending-up-outline'],['Mer','ellipsis-horizontal']];
export default function App(){
 const [tab,setTab]=useState('Oversikt');
 return <SafeAreaView style={s.safe}><StatusBar style="dark"/><View style={s.page}>
  <View style={s.head}><View><Text style={s.eyebrow}>FAMILIEØKONOMI</Text><Text style={s.title}>{tab}</Text></View><View style={s.avatar}><Ionicons name="people" size={20} color="#0C624E"/></View></View>
  <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
   {tab==='Oversikt' ? <Overview/> : tab==='Avtaler' ? <Agreements/> : <Placeholder title={tab}/>} 
  </ScrollView>
  <View style={s.nav}>{tabs.map(([name,icon])=><Pressable key={name} onPress={()=>setTab(name)} style={s.navItem}><Ionicons name={icon as any} size={22} color={tab===name?'#0C624E':'#8A918E'}/><Text style={[s.navText,tab===name&&s.navActive]}>{name}</Text></Pressable>)}</View>
 </View></SafeAreaView>
}
function Overview(){return <>
 <View style={s.hero}><Text style={s.muted}>Penger igjen denne måneden</Text><Text style={s.big}>{money(18420)}</Text><View style={s.row}><Stat k="Inntekter" v={money(88000)}/><Stat k="Utgifter" v={money(69580)}/></View></View>
 <Pressable style={s.saving}><View style={s.saveIcon}><Ionicons name="sparkles" size={22} color="#0C624E"/></View><View style={{flex:1}}><Text style={s.saveLabel}>MULIG Å SPARE</Text><Text style={s.saveAmount}>{money(14600)} / år</Text><Text style={s.saveSub}>3 ting er verdt å undersøke</Text></View><Ionicons name="chevron-forward" size={22} color="#0C624E"/></Pressable>
 <Text style={s.section}>Familiens kostnader</Text>
 <Cost icon="home-outline" t="Bolig" v="31 200 kr/mnd"/><Cost icon="shield-checkmark-outline" t="Forsikring" v="2 600 kr/mnd"/><Cost icon="cart-outline" t="Hverdag" v="14 700 kr/mnd"/><Cost icon="repeat-outline" t="Abonnement" v="1 950 kr/mnd"/><Cost icon="flash-outline" t="Andre faste" v="6 300 kr/mnd"/>
 </>}
function Agreements(){return <><Text style={s.lead}>Alle familiens store avtaler samlet på ett sted.</Text>{agreements.map(x=><View style={s.card} key={x.title}><View style={s.iconBox}><Ionicons name={x.icon as any} size={22} color="#0C624E"/></View><View style={{flex:1}}><Text style={s.cardTitle}>{x.title}</Text><Text style={s.cardSub}>{x.sub}</Text></View><Text style={s.cardValue}>{x.value}</Text><Ionicons name="chevron-forward" size={18} color="#A2A7A4"/></View>)}</>}
function Placeholder({title}:{title:string}){return <View style={s.empty}><Ionicons name="construct-outline" size={32} color="#0C624E"/><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyText}>Denne delen kommer i neste iterasjon. Først tester vi struktur, navigasjon og hovedoversikten.</Text></View>}
function Stat({k,v}:{k:string,v:string}){return <View style={{flex:1}}><Text style={s.statK}>{k}</Text><Text style={s.statV}>{v}</Text></View>}
function Cost({icon,t,v}:{icon:string,t:string,v:string}){return <View style={s.cost}><View style={s.costLeft}><Ionicons name={icon as any} size={20} color="#0C624E"/><Text style={s.costText}>{t}</Text></View><Text style={s.costValue}>{v}</Text></View>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#F4F6F3'},page:{flex:1,backgroundColor:'#F4F6F3'},head:{paddingHorizontal:22,paddingTop:12,paddingBottom:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},eyebrow:{fontSize:11,fontWeight:'700',letterSpacing:1.4,color:'#7A817D'},title:{fontSize:31,fontWeight:'800',color:'#13231E',marginTop:2},avatar:{height:42,width:42,borderRadius:21,backgroundColor:'#DDEBE5',alignItems:'center',justifyContent:'center'},scroll:{padding:20,paddingTop:8,paddingBottom:110},hero:{backgroundColor:'#173D32',borderRadius:24,padding:22,marginBottom:14},muted:{fontSize:14,color:'#BCD0C8'},big:{fontSize:38,fontWeight:'800',color:'#fff',marginTop:5,marginBottom:22},row:{flexDirection:'row',gap:20},statK:{color:'#9FB8AE',fontSize:12},statV:{color:'#fff',fontSize:17,fontWeight:'700',marginTop:3},saving:{backgroundColor:'#DDF3E9',borderRadius:20,padding:17,flexDirection:'row',alignItems:'center',gap:12,marginBottom:24},saveIcon:{height:42,width:42,borderRadius:14,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},saveLabel:{fontSize:11,fontWeight:'800',letterSpacing:1,color:'#347363'},saveAmount:{fontSize:21,fontWeight:'800',color:'#103E32',marginTop:2},saveSub:{fontSize:12,color:'#51766B',marginTop:2},section:{fontSize:18,fontWeight:'800',color:'#17231F',marginBottom:8},cost:{backgroundColor:'#fff',padding:16,borderRadius:16,marginBottom:8,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},costLeft:{flexDirection:'row',alignItems:'center',gap:10},costText:{fontSize:15,fontWeight:'650',color:'#24312D'},costValue:{fontSize:14,fontWeight:'700',color:'#24312D'},nav:{position:'absolute',left:12,right:12,bottom:10,height:72,borderRadius:24,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:4,shadowColor:'#000',shadowOpacity:.08,shadowRadius:15,shadowOffset:{width:0,height:4},elevation:7},navItem:{flex:1,alignItems:'center',gap:4},navText:{fontSize:10,color:'#89908C',fontWeight:'600'},navActive:{color:'#0C624E',fontWeight:'800'},lead:{fontSize:15,color:'#66706B',lineHeight:22,marginBottom:14},card:{backgroundColor:'#fff',padding:15,borderRadius:18,marginBottom:10,flexDirection:'row',alignItems:'center',gap:11},iconBox:{height:44,width:44,borderRadius:14,backgroundColor:'#E7F1EC',alignItems:'center',justifyContent:'center'},cardTitle:{fontSize:16,fontWeight:'750',color:'#1C2B25'},cardSub:{fontSize:12,color:'#7B837F',marginTop:3},cardValue:{fontSize:13,fontWeight:'750',color:'#26352F'},empty:{backgroundColor:'#fff',borderRadius:24,padding:28,alignItems:'center',marginTop:24},emptyTitle:{fontSize:22,fontWeight:'800',color:'#1D2D27',marginTop:12},emptyText:{textAlign:'center',color:'#69736E',lineHeight:21,marginTop:8}});
