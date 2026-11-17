/* Kingdom Atmosphere Agenda: weekly overview, achievements and search.
   Additive to existing planner data. Keeps all existing keys and fields untouched. */
(function(){
'use strict';
const ACH='ka-agenda-achievements-v1',MAIN='ka-2027-agenda-v1',SMART='ka-smart-entries-v1';
const $=id=>document.getElementById(id);
const txt={en:{
weekKicker:'WEEK AT A GLANCE',weekTitle:'My weekly agenda',search:'⌕ Find activity',
weekAch:'This week’s achievements',monthAch:'This month’s achievements',yearAch:'My achievements this year',
weekHelp:'Record meaningful things you accomplished this week.',monthHelp:'Keep your monthly wins together.',yearHelp:'Your yearly highlights and everything you achieved throughout the year.',
add:'Add achievement',newAch:'New achievement',title:'What did you accomplish?',detail:'Details (optional)',day:'Date achieved',save:'Save achievement',cancel:'Cancel',emptyAch:'No achievements recorded yet.',delete:'Delete',close:'Close',yearOnly:'Yearly highlights',monthOnly:'Monthly achievements',weekOnly:'Weekly achievements',
findKicker:'FIND YOUR PLANS',findTitle:'Search activities',findLabel:'Search by name, note, or activity',filter:'Show',all:'Everything',appointments:'Appointments',tasks:'Tasks',notes:'Notes & journal',achievements:'Achievements',searchPlaceholder:'Type a keyword…',searchStart:'Enter a keyword to search your saved agenda.',noResults:'No matching entries. Try another keyword.',results:'result(s) found',showMore:'More entries',openDay:'Open day',unknown:'Untimed',none:'Nothing planned yet',appointment:'Appointment',task:'Task',note:'Note',journal:'Journal',achievement:'Achievement',week:'Week',month:'Month',year:'Year',completed:'Completed',due:'Due',openEditor:'Edit achievement',deleteQuestion:'Delete this achievement?',saveFail:'Could not save. Check your device storage.',legacy:'Scheduled',today:'Today',planned:'planned',noYear:'Choose a year',summary:'Recorded achievements',dateLabel:'Select a date',notice:'A completed task is not automatically a major achievement. Add the wins that matter to you.'},
fr:{
weekKicker:'SEMAINE EN UN COUP D’ŒIL',weekTitle:'Mon agenda hebdomadaire',search:'⌕ Rechercher une activité',
weekAch:'Mes réalisations de la semaine',monthAch:'Mes réalisations du mois',yearAch:'Mes réalisations de l’année',
weekHelp:'Notez ce que vous avez réellement accompli cette semaine.',monthHelp:'Conservez toutes vos réussites du mois.',yearHelp:'Retrouvez vos grandes réussites et l’ensemble de vos réalisations de l’année.',
add:'Ajouter une réalisation',newAch:'Nouvelle réalisation',title:'Qu’avez-vous accompli ?',detail:'Détails (facultatif)',day:'Date de réalisation',save:'Enregistrer la réalisation',cancel:'Annuler',emptyAch:'Aucune réalisation enregistrée pour le moment.',delete:'Supprimer',close:'Fermer',yearOnly:'Réalisations annuelles',monthOnly:'Réalisations mensuelles',weekOnly:'Réalisations hebdomadaires',
findKicker:'RETROUVEZ VOS PROJETS',findTitle:'Rechercher des activités',findLabel:'Rechercher par nom, note ou activité',filter:'Afficher',all:'Tout',appointments:'Rendez-vous',tasks:'Tâches',notes:'Notes et journal',achievements:'Réalisations',searchPlaceholder:'Saisissez un mot-clé…',searchStart:'Saisissez un mot-clé pour rechercher dans votre agenda.',noResults:'Aucun résultat. Essayez un autre mot-clé.',results:'résultat(s)',showMore:'Autres entrées',openDay:'Ouvrir la journée',unknown:'Sans heure',none:'Rien de prévu',appointment:'Rendez-vous',task:'Tâche',note:'Note',journal:'Journal',achievement:'Réalisation',week:'Semaine',month:'Mois',year:'Année',completed:'Terminée',due:'Limite',openEditor:'Modifier la réalisation',deleteQuestion:'Supprimer cette réalisation ?',saveFail:'Impossible d’enregistrer. Vérifiez l’espace disponible.',legacy:'Planifié',today:'Aujourd’hui',planned:'prévus',noYear:'Choisissez une année',summary:'Réalisations enregistrées',dateLabel:'Choisissez une date',notice:'Une tâche cochée n’est pas automatiquement une grande réalisation. Notez les réussites qui comptent pour vous.'}};
const lang=()=>window.KA_locale&&window.KA_locale()==='fr'?'fr':'en';
const t=k=>txt[lang()][k]||k;
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const achievements=()=>Array.isArray(read(ACH))?read(ACH):[];
const smart=()=>Array.isArray(read(SMART))?read(SMART):[];
const main=()=>read(MAIN)||{};
const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!Number.isNaN(new Date(s+'T12:00:00').getTime());
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const selected=()=>valid($('datepick')?.value)?$('datepick').value:localDate();
const shift=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const monday=s=>shift(s,-(new Date(s+'T12:00:00').getDay()+6)%7);
const fmt=s=>new Date(s+'T12:00:00').toLocaleDateString(lang()==='fr'?'fr-CA':'en-CA',{month:'short',day:'numeric'});
const longDate=s=>new Date(s+'T12:00:00').toLocaleDateString(lang()==='fr'?'fr-CA':'en-CA',{weekday:'short',month:'short',day:'numeric'});
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>globalThis.crypto&&crypto.randomUUID?crypto.randomUUID():'ach-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const lines=v=>String(v||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
let currentEdit=null,origin=null;
function anchor(scope){
 if(scope==='week')return valid($('weekdate')?.value)?$('weekdate').value:selected();
 if(scope==='month'){
  const year=+$('calendar-year').value,month=+$('monthpick').value+1;
  return year+'-'+String(month).padStart(2,'0')+'-01';
 }
 const year=+$('yearpick').value||new Date().getFullYear();
 return year+'-01-01';
}
function match(a,scope,key){
 if(scope==='week'){const w=monday(key);return a.date>=w&&a.date<=shift(w,6)}
 if(scope==='month')return a.date.slice(0,7)===key.slice(0,7);
 return a.date.slice(0,4)===key.slice(0,4);
}
function scopeLabel(scope){return t(scope==='week'?'weekAch':scope==='month'?'monthAch':'yearAch')}
function achievementPanel(scope){
 const box=$('ka-'+scope+'-achievements');if(!box)return;
 const key=anchor(scope),list=achievements().filter(a=>valid(a.date)&&match(a,scope,key)).sort((a,b)=>b.date.localeCompare(a.date));
 box.replaceChildren();
 const head=document.createElement('div');head.className='ka-feature-head';
 const left=document.createElement('div');left.innerHTML='<span class="ka-kicker">'+esc(t('summary'))+'</span><h2>'+esc(scopeLabel(scope))+'</h2><p class="ka-subtitle">'+esc(t(scope+'Help'))+'</p>';
 const add=document.createElement('button');add.type='button';add.className='ka-action';add.textContent='＋ '+t('add');add.addEventListener('click',()=>editAchievement(null,scope));
 head.append(left,add);box.appendChild(head);
 const line=document.createElement('div');line.className='ka-ach-meta';line.textContent=scope==='week'?fmt(monday(key))+' – '+fmt(shift(monday(key),6)):scope==='month'?new Date(key+'T12:00:00').toLocaleDateString(lang()==='fr'?'fr-CA':'en-CA',{month:'long',year:'numeric'}):key.slice(0,4);box.appendChild(line);
 const listEl=document.createElement('div');listEl.className='ka-ach-list';
 if(!list.length){const p=document.createElement('p');p.className='ka-empty';p.textContent=t('emptyAch');listEl.appendChild(p);}
 list.forEach(a=>{const row=document.createElement('button');row.type='button';row.className='ka-ach-row';row.innerHTML='<span class="ka-ach-medal">✓</span><span class="ka-ach-copy"><strong>'+esc(a.title)+'</strong><small>'+esc(fmt(a.date))+' · '+esc(a.scope==='week'?t('week'):a.scope==='month'?t('month'):t('year'))+(a.details?' · '+esc(a.details.slice(0,115)):'')+'</small></span><span aria-hidden="true">↗</span>';row.addEventListener('click',()=>editAchievement(a,scope));listEl.appendChild(row)});
 box.appendChild(listEl);
 if(scope==='year'){const hint=document.createElement('p');hint.className='ka-subtitle';hint.textContent=t('notice');box.appendChild(hint);}
}
function ensureEditor(){
 if($('ka-ach-editor'))return;
 const dialog=document.createElement('dialog');dialog.id='ka-ach-editor';dialog.className='ka-ach-dialog';
 dialog.innerHTML='<form id="ka-ach-form"><div class="ka-modal-head"><h2 id="ka-ach-heading"></h2><button type="button" id="ka-ach-close" aria-label="Close">✕</button></div><div class="ka-modal-body"><label for="ka-ach-title" id="ka-ach-title-label"></label><input id="ka-ach-title" type="text" required maxlength="180"><label for="ka-ach-date" id="ka-ach-date-label"></label><input id="ka-ach-date" type="date" required><label for="ka-ach-details" id="ka-ach-details-label"></label><textarea id="ka-ach-details" rows="4" maxlength="3000"></textarea><p class="ka-subtitle" id="ka-ach-scope-hint"></p><p id="ka-ach-error" role="alert"></p></div><footer class="ka-modal-footer"><button id="ka-ach-delete" type="button" class="ka-delete"></button><button id="ka-ach-cancel" type="button" class="ka-outline"></button><button id="ka-ach-save" type="submit" class="ka-action"></button></footer></form>';
 document.body.appendChild(dialog);
 $('ka-ach-close').onclick=$('ka-ach-cancel').onclick=closeEditor;
 dialog.addEventListener('click',e=>{if(e.target===dialog)closeEditor()});
 $('ka-ach-delete').onclick=()=>{
  if(!currentEdit?.id||!confirm(t('deleteQuestion')))return;
  try{localStorage.setItem(ACH,JSON.stringify(achievements().filter(a=>a.id!==currentEdit.id)))}catch(e){$('ka-ach-error').textContent=t('saveFail');return}
  closeEditor();refresh();
 };
 $('ka-ach-form').onsubmit=e=>{
  e.preventDefault();const title=$('ka-ach-title').value.trim(),date=$('ka-ach-date').value,details=$('ka-ach-details').value.trim();
  if(!title||!valid(date))return;
  const list=achievements(),record={id:currentEdit.id||uid(),scope:currentEdit.scope,title,date,details,updatedAt:new Date().toISOString()};
  const i=list.findIndex(a=>a.id===record.id);if(i>=0)list[i]=record;else list.push(record);
  try{localStorage.setItem(ACH,JSON.stringify(list))}catch(e){$('ka-ach-error').textContent=t('saveFail');return}
  closeEditor();refresh();
 };
}
function editAchievement(entry,scope){
 ensureEditor();origin=document.activeElement;
 currentEdit=entry?Object.assign({},entry):{id:'',scope,date:scope==='week'?anchor('week'):scope==='month'?selected().slice(0,7)===anchor('month').slice(0,7)?selected():anchor('month'):scope==='year'?selected().slice(0,4)===anchor('year').slice(0,4)?selected():anchor('year'):selected()};
 $('ka-ach-heading').textContent=entry?t('openEditor'):t('newAch');
 $('ka-ach-title-label').textContent=t('title');$('ka-ach-date-label').textContent=t('day');$('ka-ach-details-label').textContent=t('detail');
 $('ka-ach-title').value=entry?.title||'';$('ka-ach-date').value=currentEdit.date;$('ka-ach-details').value=entry?.details||'';
 $('ka-ach-scope-hint').textContent=t(currentEdit.scope==='week'?'weekOnly':currentEdit.scope==='month'?'monthOnly':'yearOnly');
 $('ka-ach-delete').textContent=t('delete');$('ka-ach-delete').hidden=!entry;
 $('ka-ach-cancel').textContent=t('cancel');$('ka-ach-save').textContent=t('save');$('ka-ach-error').textContent='';
 $('ka-ach-editor').showModal();$('ka-ach-title').focus();
}
function closeEditor(){if($('ka-ach-editor')?.open)$('ka-ach-editor').close();if(origin?.isConnected)origin.focus()}
function rawEntriesForDay(d){
 const db=(main().days||{})[d]||{},structured=smart().filter(x=>x.date===d&&x.type!=='note'),mirrors=new Set(structured.map(x=>x.legacyLine).filter(Boolean));
 let entries=structured.map(x=>({kind:x.type,title:x.title,date:d,time:x.start||x.dueTime||'',id:x.id,completed:!!x.completed}));
 for(const [field,kind] of [['schedule','appointment'],['tasks','task']]){
  for(const line of lines(db[field])){
   if(mirrors.has(line))continue;
   const time=(line.match(/(?:^|\s)([01]?\d|2[0-3]):[0-5]\d/)||[])[0]?.trim()||'';
   entries.push({kind,title:line,date:d,time});
  }
 }
 return entries.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
}
function dayOpen(d){const input=$('datepick');if(input){input.value=d;input.dispatchEvent(new Event('change',{bubbles:true}))}const nav=document.querySelector('[data-tab="daily"]');nav?.click();window.scrollTo({top:0,behavior:'smooth'})}
function weekBoard(){
 const board=$('ka-week-grid');if(!board)return;
 const d=anchor('week'),start=monday(d),end=shift(start,6);
 $('ka-week-board-range').textContent=fmt(start)+' – '+fmt(end);
 board.replaceChildren();
 for(let i=0;i<7;i++){
  const date=shift(start,i),entries=rawEntriesForDay(date),column=document.createElement('section');
  column.className='ka-day-col'+(date===localDate()?' is-today':'');
  const head=document.createElement('button');head.type='button';head.className='ka-day-head';
  head.innerHTML='<span>'+esc(new Date(date+'T12:00:00').toLocaleDateString(lang()==='fr'?'fr-CA':'en-CA',{weekday:'short'}))+'</span><strong>'+esc(date.slice(8))+'</strong>';
  head.title=t('openDay');head.onclick=()=>dayOpen(date);column.appendChild(head);
  const list=document.createElement('div');list.className='ka-day-items';
  if(entries.length===0){const p=document.createElement('p');p.className='ka-day-empty';p.textContent=t('none');list.appendChild(p);}
  entries.slice(0,5).forEach(e=>{
   const b=document.createElement('button');b.type='button';b.className='ka-day-item';b.innerHTML='<span class="ka-day-time">'+esc(e.time||t('unknown'))+'</span><span class="ka-day-name">'+esc(e.title)+'</span>';
   b.onclick=()=>{dayOpen(date);if(e.id&&window.KingdomSmartEntries)window.KingdomSmartEntries.open(e.kind,e.id)};list.appendChild(b);
  });
  if(entries.length>5){const more=document.createElement('button');more.type='button';more.className='ka-day-more';more.textContent='+'+(entries.length-5)+' '+t('showMore');more.onclick=()=>dayOpen(date);list.appendChild(more);}
  column.appendChild(list);board.appendChild(column);
 }
}
function searchRecords(){
 const result=[],db=main(),smartEntries=smart(),mirrors=new Map();
 smartEntries.forEach(e=>{if(e.date&&e.legacyLine){if(!mirrors.has(e.date))mirrors.set(e.date,new Set());mirrors.get(e.date).add(e.legacyLine)}
  result.push({date:e.date||'',kind:e.type==='appointment'?'appointments':e.type==='task'?'tasks':'notes',title:e.title||'',details:e.type==='note'?e.body||'':(e.location||'')+' '+(e.dueTime||''),id:e.id,type:e.type});
 });
 Object.entries(db.days||{}).forEach(([date,day])=>{
  if(!valid(date)||!day||typeof day!=='object')return;
  for(const [key,kind] of [['schedule','appointments'],['tasks','tasks'],['daynotes','notes'],['prayer','notes'],['gratitude','notes'],['reflection','notes'],['review','notes']]){
   lines(day[key]).forEach(value=>{if(mirrors.get(date)?.has(value))return;result.push({date,kind,title:value,details:''})});
  }
 });
 achievements().forEach(a=>{result.push({date:a.date,kind:'achievements',title:a.title,details:a.details||'',achievement:a.id,scope:a.scope})});
 return result;
}
function openSearch(){
 const tab=$('agenda-find-top');
 if(tab){tab.click();}else{document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.id==='search'));}
 requestAnimationFrame(()=>{$('ka-find-input')?.focus({preventScroll:true});renderSearch()});
}
function initSearch(){
 const pane=$('search');if(!pane)return;
 if($('ka-week-find'))$('ka-week-find').onclick=openSearch;
 if($('agenda-find-top'))$('agenda-find-top').addEventListener('click',()=>requestAnimationFrame(renderSearch));
 $('ka-find-input').oninput=renderSearch;$('ka-find-kind').onchange=renderSearch;
}
function renderSearch(){
 const box=$('ka-find-results');if(!box)return;
 const term=$('ka-find-input').value.toLocaleLowerCase().trim(),kind=$('ka-find-kind').value;
 box.replaceChildren();
 if(!term){$('ka-find-count').textContent='';const p=document.createElement('p');p.className='ka-empty';p.textContent=t('searchStart');box.appendChild(p);return;}
 const matches=searchRecords().filter(e=>(kind==='all'||kind===e.kind)&&[e.title,e.details,e.date].join(' ').toLocaleLowerCase().includes(term)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,120);
 $('ka-find-count').textContent=matches.length+' '+t('results')+(matches.length===120?' · 120+':'');
 if(!matches.length){const p=document.createElement('p');p.className='ka-empty';p.textContent=t('noResults');box.appendChild(p);}
 matches.forEach(e=>{
  const b=document.createElement('button');b.type='button';b.className='ka-find-row';
  b.innerHTML='<span class="ka-find-type">'+esc(t(e.kind==='appointments'?'appointment':e.kind==='tasks'?'task':e.kind==='achievements'?'achievement':'note'))+'</span><span class="ka-find-main"><strong>'+esc(e.title)+'</strong><small>'+esc(e.date)+(e.details?' · '+esc(e.details.slice(0,130)):'')+'</small></span><span aria-hidden="true">↗</span>';
  b.onclick=()=>{if(e.achievement){const a=achievements().find(x=>x.id===e.achievement);if(a){const nav=document.querySelector('[data-tab="vision"]')||document.querySelector('[data-go="vision"]');nav?.click();editAchievement(a,'year')}return}
   dayOpen(e.date);if(e.id&&window.KingdomSmartEntries)window.KingdomSmartEntries.open(e.type,e.id);
  };
  box.appendChild(b);
 });
}
function translateUI(){
 const map={weekKicker:'weekKicker',weekTitle:'weekTitle',search:'search',findKicker:'findKicker',findTitle:'findTitle',findLabel:'findLabel',filter:'filter',all:'all',appointments:'appointments',tasks:'tasks',notes:'notes',achievements:'achievements'};
 document.querySelectorAll('[data-ka-ui]').forEach(el=>{el.textContent=t(map[el.dataset.kaUi]||el.dataset.kaUi)});
 if($('ka-find-input'))$('ka-find-input').placeholder=t('searchPlaceholder');
}
function refresh(){translateUI();weekBoard();['week','month','year'].forEach(achievementPanel);if($('search')?.classList.contains('active'))renderSearch();}
function init(){
 if(!$('ka-week-grid'))return;
 initSearch();
 ['weekprev','weeknext'].forEach(id=>$(id)?.addEventListener('click',()=>setTimeout(refresh,0)));
 ['weekdate','monthpick','calendar-year','yearpick'].forEach(id=>$(id)?.addEventListener('change',refresh));
 ['yearpick','calendar-year'].forEach(id=>$(id)?.addEventListener('input',refresh));
 document.addEventListener('kingdom:dayChanged',refresh);
 document.addEventListener('kingdom:planningChanged',refresh);
 document.addEventListener('kingdom:smartEntriesChanged',refresh);
 document.addEventListener('kingdom:languageChanged',refresh);
 document.addEventListener('storage',e=>{if([ACH,SMART,MAIN].includes(e.key))refresh()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 refresh();
}
window.KingdomAgendaHub={refresh,openSearch,getAchievements:achievements};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();