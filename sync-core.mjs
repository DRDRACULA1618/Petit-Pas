// Operations target individual records, so simultaneous additions are preserved.
const clone=value=>JSON.parse(JSON.stringify(value));
export const sharedPart=state=>({children:clone(state.children),recapEmails:clone(state.recapEmails||[])});
export function difference(before,after){
 const ops=[],oldChildren=new Map(before.children.map(c=>[c.id,c]));
 for(const c of after.children){
  const old=oldChildren.get(c.id);
  if(!old){ops.push({entity:'child',id:c.id,value:c});continue}
  if(c.name!==old.name||c.birth!==old.birth)ops.push({entity:'profile',id:c.id,value:{name:c.name,birth:c.birth||''}});
  for(const [entity,key] of [['kpi','kpis'],['entry','entries']]){
   const previous=new Map(old[key].map(x=>[x.id,x])),current=new Map(c[key].map(x=>[x.id,x]));
   for(const item of c[key])if(JSON.stringify(item)!==JSON.stringify(previous.get(item.id)))ops.push({entity,childId:c.id,id:item.id,value:item});
   for(const item of old[key])if(!current.has(item.id))ops.push({entity,childId:c.id,id:item.id,remove:true});
  }
 }
 const ids=new Set(after.children.map(c=>c.id));for(const c of before.children)if(!ids.has(c.id))ops.push({entity:'child',id:c.id,remove:true});
 const a=new Set(before.recapEmails||[]),b=new Set(after.recapEmails||[]);for(const email of b)if(!a.has(email))ops.push({entity:'email',id:email});for(const email of a)if(!b.has(email))ops.push({entity:'email',id:email,remove:true});
 return ops;
}
export function applyOperations(data,ops){
 const next=clone(data);next.recapEmails||=[];
 for(const op of ops){
  if(op.entity==='email'){next.recapEmails=next.recapEmails.filter(x=>x!==op.id);if(!op.remove)next.recapEmails.push(op.id);continue}
  if(op.entity==='child'){const existing=next.children.find(x=>x.id===op.id);if(op.remove)next.children=next.children.filter(x=>x.id!==op.id);else if(!existing)next.children.push(clone(op.value));continue}
  const c=next.children.find(x=>x.id===(op.childId||op.id));if(!c)continue;
  if(op.entity==='profile'){Object.assign(c,op.value);continue}
  const key=op.entity==='kpi'?'kpis':'entries';c[key]=c[key].filter(x=>x.id!==op.id);if(!op.remove)c[key].push(clone(op.value));
 }
 return next;
}
