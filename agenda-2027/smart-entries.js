/* Kingdom Atmosphere — smart entry editors, additive to the legacy planner. */
(function(){
'use strict';
const KEY='ka-smart-entries-v1', MAIN='ka-2027-agenda-v1';
const $=id=>document.getElementById(id);
const html=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const all=()=>Array.isArray(read(KEY))?read(KEY):[];
const date=()=>($('datepick')&&$('datepick').value)||new Date().toLocaleDateString('en-CA');
const minutes=t=>{const a=(t||'').split(':').map(Number);return a.length===2&&a[0]>=0&&a[0]<24&&a[1]>=0&&a[1]<60?a[0]*60+a[1]:NaN};
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const addDays=(d,n)=>{let x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const uid=()=>crypto.randomUUID?crypto.randomUUID():'ka-'+Date.now()+'-'+Math.random().toString(36).slice(2);
let active=null, opener=null;
function legacyLine(e){
 if(e.type==='appointment')return e.start+'–'+clock(minutes(e.start)+Number(e.duration))+' — '+e.title+(e.location?' @ '+e.location:'');
 if(e.type==='task')return e.title+(e.dueTime?' (due '+e.dueTime+')':'');
 return '';
}
function syncLegacy(oldEntry,nextEntry){
 const db=read(MAIN)||{},days=db.days||{};
 const changes={};
 if(oldEntry&&oldEntry.legacyLine&&oldEntry.type!=='note'){
  const key=oldEntry.type==='appointment'?'schedule':'tasks';
  const d=days[oldEntry.date]||{}, lines=String(d[key]||'').split('\n'),i=lines.indexOf(oldEntry.legacyLine);
  if(i!==-1){lines.splice(i,1);d[key]=lines.filter(Boolean).join('\n');days[oldEntry.date]=d;changes[oldEntry.date]=d;}
 }
 if(nextEntry&&nextEntry.type!=='note'){
  const key=nextEntry.type==='appointment'?'schedule':'tasks';
  const d=days[nextEntry.date]||{},line=legacyLine(nextEntry);
  d[key]=[d[key],line].filter(Boolean).join('\n');nextEntry.legacyLine=line;
  days[nextEntry.date]=d;changes[nextEntry.date]=d;
 }
 if(Object.keys(changes).length){
  // The main controller listens to this event and remains the owner of its own data.
  document.dispatchEvent(new CustomEvent('kingdom:planningChanged',{detail:{days:changes}}));
 }
}
function existingIntervals(d,ignoreId){
 const entries=all().filter(e=>e.type==='appointment'&&e.date===d&&e.id!==ignoreId&&Number.isFinite(minutes(e.start)));
 const busy=entries.map(e=>({start:minutes(e.start),end:minutes(e.start)+Number(e.duration),label:e.title}));
 const legacy=String((((read(MAIN)||{}).days||{})[d]||{}).schedule||'').split('\n');
 legacy.forEach(line=>{
  // Structured appointments are mirrored into the legacy schedule; do not count them twice.
  if(entries.some(e=>e.legacyLine===line)||((all().find(e=>e.type==='appointment'&&e.date===d&&e.id===ignoreId)||{}).legacyLine===line))return;
  const m=line.match(/^\s*([01]?\d|2[0-3]):([0-5]\d)\s*[–—-]\s*([01]?\d|2[0-3]):([0-5]\d)/);
  if(m){const start=Number(m[1])*60+Number(m[2]),end=Number(m[3])*60+Number(m[4]);if(end>start)busy.push({start,end,label:line});}
 });
 return busy;
}
function available(d,duration,ignore){
 const busy=existingIntervals(d,ignore),choices=[];
 for(let m=8*60;m+duration<=21*60;m+=15){
  if(busy.every(x=>m+duration<=x.start||m>=x.end))choices.push(m);
 }
 return choices;
}
function form(){
 if($('smart-entry-dialog'))return;
 const dialog=document.createElement('dialog');dialog.id='smart-entry-dialog';dialog.className='smart-entry-dialog';
 dialog.innerHTML='<form id="smart-entry-form" class="smart-entry-form"><div class="smart-entry-top"><div><span class="smart-entry-eyebrow">KINGDOM ATMOSPHERE · MY AGENDA</span><h2 id="smart-entry-heading">New appointment</h2></div><button id="smart-entry-close" type="button" aria-label="Close editor">✕</button></div><div class="smart-entry-body"><div class="smart-entry-tabs" role="group" aria-label="Entry type"><button type="button" data-smart-kind="appointment">Appointment</button><button type="button" data-smart-kind="task">Task</button><button type="button" data-smart-kind="note">Note</button></div><label for="smart-title" id="smart-title-label">Title</label><input id="smart-title" maxlength="160" required placeholder="What is it?" autocomplete="off"><label for="smart-date">Date</label><input id="smart-date" type="date" required><div id="smart-appointment-fields"><div class="smart-row"><div><label for="smart-start">Start time</label><input id="smart-start" type="time" step="900"></div><div><label for="smart-duration">Duration</label><select id="smart-duration"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option></select></div></div><div id="smart-time-feedback" class="smart-time-feedback" aria-live="polite"></div><button type="button" id="smart-suggest" class="smart-suggest">✦ Suggest next available time</button><label for="smart-location">Location or online link (optional)</label><input id="smart-location" placeholder="Address, place, or meeting link"><label for="smart-remind">Reminder preference</label><select id="smart-remind"><option value="0">No reminder</option><option value="10">10 minutes before</option><option value="30" selected>30 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option></select><p class="smart-entry-hint">Reminder preference is saved. Browser alerts while the agenda is closed are not yet supported.</p></div><div id="smart-task-fields" hidden><label for="smart-priority">Priority</label><select id="smart-priority"><option value="normal">Normal</option><option value="high">High priority</option><option value="low">Low priority</option></select><label for="smart-due-time">Due time (optional)</label><input id="smart-due-time" type="time"><label class="smart-check"><input id="smart-completed" type="checkbox"> Completed</label></div><div id="smart-note-fields" hidden><label for="smart-category">Note category</label><select id="smart-category"><option value="personal">Personal</option><option value="idea">Idea / inspiration</option><option value="study">Study</option><option value="meeting">Meeting</option></select><label for="smart-body">Write your note</label><textarea id="smart-body" rows="7" placeholder="Thoughts, observations, Scripture, decisions…"></textarea><label class="smart-check"><input id="smart-pin" type="checkbox"> Pin important note</label></div><div id="smart-entry-feedback" role="alert" class="smart-entry-feedback"></div></div><div class="smart-entry-bottom"><button type="button" id="smart-delete" hidden>Delete</button><button type="submit" id="smart-save">Save entry</button></div></form>';
 document.body.appendChild(dialog);
 $('smart-entry-close').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
 $('smart-entry-form').addEventListener('submit',save);
 $('smart-delete').addEventListener('click',remove);
 document.querySelectorAll('[data-smart-kind]').forEach(b=>b.addEventListener('click',()=>kind(b.dataset.smartKind)));
 ['smart-start','smart-duration','smart-date'].forEach(id=>$(id).addEventListener('change',feedback));
 $('smart-suggest').addEventListener('click',suggest);
}
function kind(type){
 active.type=type;
 $('smart-entry-heading').textContent=(active.id?'Edit ':'New ')+type;
 $('smart-title-label').textContent=type==='appointment'?'Appointment title':type==='task'?'What needs to be done?':'Note title';
 $('smart-appointment-fields').hidden=type!=='appointment';
 $('smart-task-fields').hidden=type!=='task';
 $('smart-note-fields').hidden=type!=='note';
 document.querySelectorAll('[data-smart-kind]').forEach(b=>{b.classList.toggle('active',b.dataset.smartKind===type);b.disabled=!!active.id;});
 feedback();
}
function open(type,id){
 form();opener=document.activeElement;
 const entry=id?all().find(e=>e.id===id):null;
 active=entry?Object.assign({},entry):{id:'',type:type||'appointment',date:date(),title:'',start:'',duration:60,location:'',reminder:30,priority:'normal',dueTime:'',body:'',category:'personal',pinned:false,completed:false};
 $('smart-title').value=active.title||'';
 $('smart-date').value=active.date||date();
 $('smart-start').value=active.start||'';
 $('smart-duration').value=String(active.duration||60);
 $('smart-location').value=active.location||'';
 $('smart-remind').value=String(active.reminder??30);
 $('smart-priority').value=active.priority||'normal';
 $('smart-due-time').value=active.dueTime||'';
 $('smart-completed').checked=!!active.completed;
 $('smart-category').value=active.category||'personal';
 $('smart-body').value=active.body||'';
 $('smart-pin').checked=!!active.pinned;
 $('smart-delete').hidden=!active.id;
 $('smart-entry-feedback').textContent='';
 kind(active.type);
 const dialog=$('smart-entry-dialog');
 if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
 $('smart-title').focus();
}
function close(){
 const dialog=$('smart-entry-dialog');if(dialog.open&&dialog.close)dialog.close();else dialog.removeAttribute('open');
 if(opener&&opener.isConnected)opener.focus();
}
function feedback(){
 if(!active||active.type!=='appointment')return;
 const d=$('smart-date').value,start=minutes($('smart-start').value),duration=Number($('smart-duration').value),el=$('smart-time-feedback');
 if(!Number.isFinite(start)){el.textContent='Choose a time or let the agenda suggest one.';el.className='smart-time-feedback';return;}
 if(start+duration>1440){el.textContent='This appointment would end after midnight. Choose an earlier start.';el.className='smart-time-feedback is-warning';return;}
 const collisions=existingIntervals(d,active.id).filter(x=>start<x.end&&start+duration>x.start);
 el.textContent=collisions.length?'⚠ Overlaps with '+collisions.map(x=>x.label).join(', '):'Ends at '+clock(start+duration)+' · No known time conflicts';
 el.className='smart-time-feedback'+(collisions.length?' is-warning':'');
}
function suggest(){
 const d=$('smart-date').value,duration=Number($('smart-duration').value),times=available(d,duration,active.id);
 if(!times.length){$('smart-time-feedback').textContent='No free slots found between 8 AM and 9 PM. You can choose a time manually.';return;}
 const now=new Date(),isToday=d===now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),lower=isToday?now.getHours()*60+now.getMinutes():0;
 const choice=times.find(t=>t>=lower)||times[0];
 $('smart-start').value=clock(choice);feedback();
}
function save(e){
 e.preventDefault();
 if(!active)return;
 const type=active.type,title=$('smart-title').value.trim(),d=$('smart-date').value;
 if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(d))return;
 const next=Object.assign({},active,{id:active.id||uid(),type,title,date:d,updatedAt:new Date().toISOString()});
 if(type==='appointment'){
  next.start=$('smart-start').value;next.duration=Number($('smart-duration').value);
  next.location=$('smart-location').value.trim();next.reminder=Number($('smart-remind').value);
  if(!Number.isFinite(minutes(next.start))){$('smart-entry-feedback').textContent='Please choose a start time.';return;}
  if(minutes(next.start)+next.duration>1440){$('smart-entry-feedback').textContent='Appointment must finish before midnight.';return;}
  if(existingIntervals(d,next.id).some(x=>minutes(next.start)<x.end&&minutes(next.start)+next.duration>x.start)){
   if(!confirm('This appointment overlaps another event. Save anyway?'))return;
  }
 }else if(type==='task'){
  next.priority=$('smart-priority').value;next.dueTime=$('smart-due-time').value;next.completed=$('smart-completed').checked;
 }else{
  next.body=$('smart-body').value;next.category=$('smart-category').value;next.pinned=$('smart-pin').checked;
 }
 const entries=all(),index=entries.findIndex(x=>x.id===next.id),old=index>=0?entries[index]:null;
 try{
  // Save the structured entry first; keep the original free-text fields working.
  if(index>=0)entries[index]=next;else entries.push(next);
  localStorage.setItem(KEY,JSON.stringify(entries));
  syncLegacy(old,next);
  if(next.legacyLine){localStorage.setItem(KEY,JSON.stringify(entries));}
 }catch(err){$('smart-entry-feedback').textContent='Unable to save. Please free up storage or export a backup.';return;}
 close();render();document.dispatchEvent(new CustomEvent('kingdom:smartEntriesChanged',{detail:{date:d}}));
 if(window.KingdomTodayHome)window.KingdomTodayHome.render();
}
function remove(){
 if(!active||!active.id||!confirm('Delete this '+active.type+'?'))return;
 const entries=all(),item=entries.find(x=>x.id===active.id);if(!item)return;
 try{localStorage.setItem(KEY,JSON.stringify(entries.filter(x=>x.id!==active.id)));syncLegacy(item,null);}
 catch(err){$('smart-entry-feedback').textContent='Could not delete this entry.';return;}
 close();render();if(window.KingdomTodayHome)window.KingdomTodayHome.render();
}
function render(){
 const d=date(),list=$('smart-entry-list'),notes=$('smart-note-list');
 if(list){
  list.replaceChildren();
  const entries=all().filter(e=>e.date===d&&e.type!=='note').sort((a,b)=>(a.start||a.dueTime||'99:99').localeCompare(b.start||b.dueTime||'99:99'));
  if(!entries.length){const p=document.createElement('p');p.className='smart-empty';p.textContent='Your new appointments and tasks will appear here.';list.appendChild(p);}
  entries.forEach(e=>{const b=document.createElement('button');b.type='button';b.className='smart-entry-item';b.innerHTML='<span class="smart-entry-icon">'+(e.type==='appointment'?'◷':'✓')+'</span><span><strong>'+html(e.title)+'</strong><small>'+html(e.type==='appointment'?e.start+'–'+clock(minutes(e.start)+Number(e.duration))+(e.location?' · '+e.location:''):(e.priority==='high'?'High priority':'Task')+(e.dueTime?' · Due '+e.dueTime:''))+'</small></span><span aria-hidden="true">↗</span>';b.addEventListener('click',()=>open(e.type,e.id));list.appendChild(b);});
 }
 if(notes){
  notes.replaceChildren();
  const items=all().filter(e=>e.type==='note').sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||String(b.updatedAt).localeCompare(String(a.updatedAt)));
  if(!items.length){const p=document.createElement('p');p.className='smart-empty';p.textContent='No personal notes yet. Create one to start your library.';notes.appendChild(p);}
  items.forEach(e=>{const b=document.createElement('button');b.type='button';b.className='smart-entry-item';b.innerHTML='<span class="smart-entry-icon">✎</span><span><strong>'+html((e.pinned?'📌 ':'')+e.title)+'</strong><small>'+html(e.category+' · '+e.date+(e.body?' · '+e.body.slice(0,90):''))+'</small></span><span aria-hidden="true">↗</span>';b.addEventListener('click',()=>open('note',e.id));notes.appendChild(b);});
 }
}
function init(){
 const home=$('today-home-actions')||document.querySelector('.today-home-actions');
 if(home&&!$('smart-add-note')){const b=document.createElement('button');b.type='button';b.id='smart-add-note';b.className='today-add-action';b.textContent='＋ Add note';home.appendChild(b);b.addEventListener('click',()=>open('note'));}
 // The planned-entry list lives inside the Tasks tab, never above the Today dashboard.
 const tasksDate=$('tasks-date');
 if(tasksDate){
  tasksDate.value=date();
  tasksDate.addEventListener('change',()=>{
   if(!tasksDate.value)return;
   const picker=$('datepick');
   if(picker){picker.value=tasksDate.value;picker.dispatchEvent(new Event('change',{bubbles:true}));}
   render();
  });
 }
 if($('tasks-go-today'))$('tasks-go-today').addEventListener('click',()=>{
  const now=new Date(),d=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  if(tasksDate){tasksDate.value=d;tasksDate.dispatchEvent(new Event('change',{bubbles:true}));}
 });
 if($('tasks-new-task'))$('tasks-new-task').addEventListener('click',()=>open('task'));
 if($('tasks-new-appointment'))$('tasks-new-appointment').addEventListener('click',()=>open('appointment'));
 const notesPane=document.querySelector('#notes .card');
 if(notesPane&&!$('smart-note-library')){const section=document.createElement('section');section.id='smart-note-library';section.className='smart-entry-section';section.innerHTML='<div class="smart-entry-section-head"><strong>Personal notes library</strong><button id="smart-library-add" type="button" class="smart-suggest">＋ New note</button></div><div id="smart-note-list"></div><hr class="rule">';notesPane.prepend(section);$('smart-library-add').addEventListener('click',()=>open('note'));}
 ['today-add-task','today-add-appointment'].forEach(id=>{const b=$(id);if(b)b.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();open(id==='today-add-task'?'task':'appointment');},true);});
 // Route the generic quick-add choices to specialized editors while retaining other quick-add types.
 const quick=$('quick-save');if(quick)quick.addEventListener('click',event=>{const v=$('quick-kind').value;if(v==='tasks'||v==='schedule'){event.preventDefault();event.stopImmediatePropagation();const title=$('quick-text').value.trim();$('quick-text').value='';const closeBtn=$('quick-sheet').querySelector('.close-sheet');if(closeBtn)closeBtn.click();open(v==='tasks'?'task':'appointment');if(title)$('smart-title').value=title;}},true);
 document.addEventListener('kingdom:dayChanged',()=>{if(tasksDate)tasksDate.value=date();render();});
 document.addEventListener('kingdom:planningChanged',render);
 window.addEventListener('storage',render);
 render();
}
window.KingdomSmartEntries={open,render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();