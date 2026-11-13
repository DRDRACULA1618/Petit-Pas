import {sharedPart,difference,applyOperations} from './sync-core.mjs';
const app=globalThis.petitPasApp,$=id=>document.getElementById(id),esc=app.escape;
let client,session,familyId=null,channel,busy=false,connecting=false,lastLocal=sharedPart(app.getState()),pending=[],revision=-1,latestRow=null,retryTimer;
let config;try{config=JSON.parse(localStorage.getItem('petit-pas-cloud-config')||'null')}catch{}
const setStatus=text=>{$('connectionStatus').textContent=text;if(familyId)$('storageNote').textContent='Espace familial partagé · '+text};
function persistQueue(){localStorage.setItem('petit-pas-cloud-queue',JSON.stringify({familyId,pending,local:lastLocal}))}
function fail(error){setStatus('Synchronisation à vérifier');app.notify(error?.message||'Connexion impossible. Vos ajouts restent sur cet appareil.')}
function check(result){if(result.error)throw result.error;return result.data}
async function getClient(){
 if(client)return client;
 if(!config)throw Error('Connectez d’abord votre espace familial.');
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
 client=createClient(config.url,config.key);
 client.auth.onAuthStateChange((event,s)=>{session=s;if(event==='SIGNED_OUT'){familyId=null;pending=[];revision=-1;if(channel)client.removeChannel(channel);channel=null;setStatus('Non connecté')}else if(event==='SIGNED_IN')setTimeout(()=>connect().catch(fail),0)});
 session=check(await client.auth.getSession()).session;return client;
}
function renderPanel(title,body,submitLabel,submit){app.openModal(title,body,submitLabel);$('modalForm').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('[type="submit"]');button.disabled=true;try{await submit(new FormData(e.target))}catch(error){app.notify(error.message||'Une erreur est survenue.')}finally{button.disabled=false}}}
async function open(){
 if(!config){
  renderPanel('Connecter le partage familial','<div class="settings-message">Le partage en temps réel n’est pas encore activé. Un projet Supabase doit être créé et initialisé pour relier vos deux comptes.</div><div class="field"><label for="cloudUrl">Adresse du projet Supabase</label><input id="cloudUrl" name="url" type="url" placeholder="https://votre-projet.supabase.co" required></div><div class="field"><label for="cloudKey">Clé publique du projet (publishable ou anon)</label><input id="cloudKey" name="key" required autocomplete="off"></div><p class="tiny muted">Utilisez uniquement la clé publique. La clé secrète ne doit jamais être saisie ici.</p>','Connecter',async f=>{
   const url=new URL(f.get('url').trim()),key=f.get('key').trim();if(url.protocol!=='https:'||!/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)||url.port||url.username||url.password)throw Error('Utilisez l’adresse HTTPS de votre projet Supabase.');
   let isPublic=key.startsWith('sb_publishable_');try{isPublic||=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon'}catch{}
   if(!isPublic)throw Error('Cette clé ne correspond pas à une clé publique Supabase.');
   config={url:url.origin,key};localStorage.setItem('petit-pas-cloud-config',JSON.stringify(config));await getClient();open();
  });return;
 }
 try{await getClient()}catch(error){fail(error);return}
 if(!session){
  renderPanel('Votre compte familial','<p class="tiny muted">Chacun utilise sa propre adresse e-mail. Après connexion, créez votre espace ou rejoignez celui de votre conjoint.</p><div class="field"><label for="loginEmail">Votre adresse e-mail</label><input id="loginEmail" name="email" type="email" autocomplete="email" required></div><p class="tiny muted">Vous recevrez un lien de connexion sécurisé. Ouvrez-le sur cet appareil.</p>','Recevoir mon lien',async f=>{check(await client.auth.signInWithOtp({email:f.get('email').trim(),options:{emailRedirectTo:location.origin+location.pathname}}));app.notify('Lien demandé : consultez votre boîte e-mail.');});return;
 }
 if(!familyId){
  renderPanel('Votre espace en famille','<p class="tiny muted">Connecté : '+esc(session.user.email)+'</p><button type="button" id="createFamily" class="primary">Créer notre espace avec mes données</button><p class="tiny muted">Ou rejoignez un espace existant avec le code fourni par votre conjoint. Exportez vos données locales avant de rejoindre : les données de cet espace seront affichées sur cet appareil.</p><div class="field"><label for="familyCode">Code d’invitation</label><input id="familyCode" name="code" required autocomplete="off"></div>','Rejoindre cet espace',async f=>{const id=check(await client.rpc('pp_join_family',{invite_token:f.get('code').trim()}));await attach(id);open()});
  $('createFamily').onclick=async e=>{e.target.disabled=true;try{const id=check(await client.rpc('pp_create_family',{initial_data:sharedPart(app.getState())}));await attach(id);open()}catch(error){fail(error);e.target.disabled=false}};return;
 }
 renderPanel('Notre espace familial','<p class="tiny muted">Connecté : '+esc(session.user.email)+'</p><div class="settings-message">'+esc($('connectionStatus').textContent)+'. Les ajouts, les prénoms et les adresses des récaps sont partagés entre les membres de cet espace.</div><div class="settings-buttons"><button type="button" id="invitePartner">Créer un code pour mon conjoint</button><button type="button" id="cloudSignOut">Se déconnecter</button></div><div id="inviteResult" class="tiny muted" style="margin-top:12px;overflow-wrap:anywhere"></div>','Fermer',async()=>$('modal').close());
 $('invitePartner').onclick=async e=>{e.target.disabled=true;try{const token=check(await client.rpc('pp_invite_family',{target_family:familyId}));const output=$('inviteResult');output.textContent='Code valable 7 jours, à usage unique : '+token;const copy=document.createElement('button');copy.type='button';copy.textContent='Copier le code';copy.onclick=()=>navigator.clipboard.writeText(token).then(()=>app.notify('Code copié')).catch(()=>app.notify('Sélectionnez le code pour le copier.'));output.appendChild(copy)}catch(error){fail(error)}finally{e.target.disabled=false}};
 $('cloudSignOut').onclick=async()=>{if(pending.length||busy){app.notify('Attendez la synchronisation de vos derniers ajouts avant de vous déconnecter.');return}check(await client.auth.signOut());$('modal').close()};
}
async function connect(){
 if(connecting||familyId||!session)return;connecting=true;
 try{const memberships=check(await client.from('pp_members').select('family_id').eq('user_id',session.user.id).limit(1));if(memberships.length)await attach(memberships[0].family_id);else setStatus('Créez ou rejoignez votre espace familial')}finally{connecting=false}
}
function receive(row){if(!row)return;if(row.revision>=revision){revision=row.revision;latestRow=row}if(!latestRow)return;const data=applyOperations(latestRow.data,pending);app.applyShared(data);lastLocal=sharedPart(app.getState());persistQueue()}
async function pull(){const row=check(await client.from('pp_families').select('id,data,revision').eq('id',familyId).single());receive(row)}
async function attach(id){
 if(channel)await client.removeChannel(channel);familyId=id;revision=-1;latestRow=null;pending=[];
 try{const saved=JSON.parse(localStorage.getItem('petit-pas-cloud-queue')||'null');if(saved?.familyId===id&&Array.isArray(saved.pending)){pending=saved.pending;if(saved.local)pending.push(...difference(saved.local,sharedPart(app.getState())))} }catch{}
 await pull();
 channel=client.channel('petit-pas-'+id).on('postgres_changes',{event:'UPDATE',schema:'public',table:'pp_families',filter:'id=eq.'+id},payload=>{try{receive(payload.new)}catch(error){fail(error)}}).subscribe(status=>{
  if(status==='SUBSCRIBED'){setStatus(pending.length?'Envoi des modifications…':'À jour · partagé en temps réel');pull().then(flush).catch(fail)}
  else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))setStatus('Connexion interrompue · reconnexion en cours');
 });
 await flush();
}
function changed(){
 const current=sharedPart(app.getState());
 if(familyId){pending.push(...difference(lastLocal,current));lastLocal=current;try{persistQueue()}catch{app.notify('Sauvegarde locale indisponible : exportez vos données.')}lastLocal=current;if(pending.length){setStatus('Envoi des modifications…');flush()}}else lastLocal=current;
}
async function flush(){
 if(busy||!familyId||!pending.length)return;busy=true;const batch=pending.slice(0,250);
 try{const row=check(await client.rpc('pp_apply_changes',{target_family:familyId,operations:batch}));pending.splice(0,batch.length);persistQueue();receive(row);setStatus(pending.length?'Envoi des modifications…':'À jour · partagé en temps réel')}
 catch(error){setStatus('Hors ligne ou accès interrompu · ajouts conservés ici');clearTimeout(retryTimer);retryTimer=setTimeout(flush,5000);return}
 finally{busy=false}
 if(pending.length)flush();
}
globalThis.petitPasCloud={open,changed,isShared:()=>!!familyId};
addEventListener('online',()=>{if(familyId)pull().then(flush).catch(fail)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&familyId)pull().then(flush).catch(fail)});
if(config)getClient().then(connect).catch(fail);
