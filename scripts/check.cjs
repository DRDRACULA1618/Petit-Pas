const fs=require('fs'),vm=require('vm'),assert=require('assert');const elements=new Map(),store=new Map();const listeners={};const document={addEventListener(type,fn){listeners[type]=fn},body:{classList:{toggle(){}}},getElementById(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',value:'',hidden:false,open:false,showModal(){this.open=true},close(){this.open=false},addEventListener(){},setAttribute(){}});return elements.get(id)},querySelectorAll(){return []}};const context={listeners,document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},console,crypto:require('crypto').webcrypto,setTimeout:()=>1,clearTimeout(){},FormData:class{constructor(form){this.form=form}get(k){return this.form.values[k]}}};vm.createContext(context);const code=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').split('<script>')[1].split('</script>')[0];vm.runInContext(code,context);vm.runInContext(`
function check(v,m){if(!v)throw Error(m)}
document.listeners=undefined;recordNow('milk');check(child().entries.length===1,'Instant entry');check(child().entries[0].time===timeNow(),'Instant time');check(child().entries[0].date===localDate(),'Instant date');
eventModal('diaper',null,selected,'');const form=document.getElementById('modalForm');form.values={kind:'diaper',date:selected,time:'',status:'done',note:'Oubli complété'};form.onsubmit({preventDefault(){},target:form});check(child().entries[1].time==='','Date only');check(valid(state),'Date-only backup valid');check(timelineView().includes('Date seule'),'Date-only marker shown');
editEvent(child().entries[1].id);check(document.getElementById('modal').innerHTML.includes('type="time" value=""'),'Edit preserves absent time');
const first=state.active;childModal();const profile=document.getElementById('modalForm');profile.values={name:'Aya',birth:''};profile.onsubmit({preventDefault(){},target:profile});check(child().entries.length===0,'Separate child data');check(child().kpis.length===6,'Default indicators');switchChild(first);check(child().entries.length===2,'First child preserved');
kpiModal();chosenColor='#47c4ae';chosenIcon='drop';const kform=document.getElementById('modalForm');kform.values={name:'Bain'};kform.onsubmit({preventDefault(){},target:kform});check(child().kpis.length===7,'Custom habit');check(child().kpis[6].color==='#47c4ae','Custom color');check(child().kpis[6].icon==='drop','Custom icon');
for(const v of ['overview','timeline','calendar','health','manage'])setView(v);toggleTheme();check(state.theme==='light','Light theme');toggleTheme();check(state.theme==='dark','Dark theme');check(valid(JSON.parse(localStorage.getItem('petit-a-petit-v1'))),'Persistent data valid');console.log('Validé : saisie instantanée, date seule, modification, multi-enfants, suivi personnalisé, vues, thèmes et sauvegarde.');
`,context);

vm.runInContext(`
function dispatch(action,rest={}){const button={dataset:{action,...rest},type:'button',closest(){return null}};listeners.click({target:{closest(){return button}},preventDefault(){}})}
dispatch('view',{view:'timeline'});check(view==='timeline','Navigation click');
const before=state.theme;dispatch('theme');check(state.theme!==before,'Theme click');
dispatch('event-add');check(document.getElementById('modal').open,'Add event click');dispatch('close');check(!document.getElementById('modal').open,'Modal close click');
dispatch('child-add');check(document.getElementById('modal').innerHTML.includes('childName'),'Add child click');dispatch('close');
dispatch('kpi-add');check(document.getElementById('modal').innerHTML.includes('kpiName'),'Add habit click');dispatch('close');
dispatch('event-manual',{kind:'milk'});check(document.getElementById('modal').innerHTML.includes('type="time" value=""'),'Manual add click allows no time');dispatch('close');
listeners.change({target:{dataset:{change:'date'},value:'2026-01-07'}});check(selected==='2026-01-07','Date change');
console.log('Validé : actions des menus, thèmes, ajout, fermeture, profil, suivis et changement de date.');
`,context);

vm.runInContext(`
const activeBeforeRename=state.active;
const other=state.children.find(c=>c.id!==activeBeforeRename);
childModal(true,other.id);
const renameForm=document.getElementById('modalForm');renameForm.values={name:'Prénom corrigé',birth:''};renameForm.onsubmit({preventDefault(){},target:renameForm});
check(other.name==='Prénom corrigé','Rename specifically targeted child');check(state.active===activeBeforeRename,'Rename does not switch child');
emailSettings();const emailForm=document.getElementById('modalForm');emailForm.values={email:'Parent@Example.test'};emailForm.onsubmit({preventDefault(){},target:emailForm});check(state.recapEmails[0]==='parent@example.test','Email saved and normalized');
emailSettings();const duplicateForm=document.getElementById('modalForm');duplicateForm.values={email:'parent@example.test'};duplicateForm.onsubmit({preventDefault(){},target:duplicateForm});check(state.recapEmails.length===1,'No duplicate email');
openRecap();check(document.getElementById('modal').innerHTML.includes('mailto:parent%40example.test'),'Recap opens email composer');removeEmail(0);check(state.recapEmails.length===0,'Email removed');
const toggle=document.getElementById('sidebarToggle');const attributes={};toggle.setAttribute=(key,value)=>attributes[key]=value;
globalThis.matchMedia=()=>({matches:false});updateSidebar();const beforeToggle=desktopSidebar;toggleSidebar();check(desktopSidebar!==beforeToggle,'Desktop sidebar toggles');check(localStorage.getItem('petit-pas-sidebar')===(desktopSidebar?'open':'closed'),'Desktop preference persisted');
globalThis.matchMedia=()=>({matches:true});updateSidebar();check(attributes['aria-expanded']==='false','Mobile menu initially closed');toggleSidebar();check(attributes['aria-expanded']==='true','Mobile menu opens');check(!document.getElementById('sidebarBackdrop').hidden,'Backdrop visible');setView('overview');check(attributes['aria-expanded']==='false','Navigation closes mobile drawer');
console.log('Validé : prénom du bon enfant, e-mails et doublons, récapitulatif, menu ordinateur mémorisé et menu mobile.');
`,context);
