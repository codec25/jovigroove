/* Kingdom Atmosphere Today Home — read-only summary of existing daily data.
   All writes are delegated to app.js's existing quick-add and journal handlers. */
(function(){
'use strict';
const MAIN='ka-2027-agenda-v1', $=id=>document.getElementById(id);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function selected(){const v=$('datepick')&&$('datepick').value;return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:iso(new Date())}
function read(){try{const d=JSON.parse(localStorage.getItem(MAIN)||'null');return d&&typeof d==='object'?d:{}}catch(e){return {}}}
function lines(v){return String(v||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)}
function timeOf(line){
 const m=line.match(/(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)(?:\s*[–—-]\s*(?:[01]?\d|2[0-3]):[0-5]\d)?/);
 return m?Number(m[1])*60+Number(m[2]):null
}
function renderLines(id,items,empty){
 const box=$(id);if(!box)return;box.replaceChildren();
 if(!items.length){const p=document.createElement('p');p.className='today-no-items';p.textContent=empty;box.appendChild(p);return}
 items.slice(0,6).forEach(item=>{
  const row=document.createElement('div');row.className='today-line';
  const dot=document.createElement('span');dot.className='today-line-dot';dot.setAttribute('aria-hidden','true');dot.textContent='•';
  const text=document.createElement('span');text.textContent=item;
  row.appendChild(dot);row.appendChild(text);box.appendChild(row)
 });
 if(items.length>6){const p=document.createElement('small');p.className='today-more-items';p.textContent='+'+(items.length-6)+' more in your daily planner';box.appendChild(p)}
}
function render(){
 const date=selected(),day=((read().days||{})[date])||{};
 const schedule=lines(day.schedule),tasks=lines(day.tasks),priorities=lines(day.priorities);
 const focus=String(day.oneaction||'').trim(),intention=String(day.focus||'').trim();
 const prepared=!!(focus||intention||priorities.length||tasks.length||schedule.length);
 const labelDate=new Date(date+'T12:00:00').toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
 $('today-home-date').textContent=labelDate;
 $('today-home-title').textContent=date===iso(new Date())?'Today, with purpose.':'Your day, at a glance.';
 $('today-home-return').hidden=date===iso(new Date());
 $('today-home-empty').hidden=prepared;
 $('today-home-ready').hidden=!prepared;
 $('today-overview-grid').classList.toggle('is-unplanned',!prepared);
 $('today-schedule-count').textContent=schedule.length+' planned';
 $('today-task-count').textContent=tasks.length+' '+(tasks.length===1?'task':'tasks');
 renderLines('today-schedule-list',schedule,'No appointments yet.');
 renderLines('today-task-list',tasks,'Nothing on your to-do list yet.');
 if(prepared){
  $('today-main-focus').textContent=focus||priorities[0]||intention||'Your day is planned. Choose your main focus.';
  const timed=schedule.map(line=>({line,start:timeOf(line)})).filter(x=>x.start!==null).sort((a,b)=>a.start-b.start);
  const now=new Date(),current=now.getHours()*60+now.getMinutes();
  const isToday=date===iso(now),upcoming=timed.find(x=>!isToday||x.start>=current);
  const next=upcoming||null;
  $('today-next-block').hidden=!next;
  if(next){$('today-next-title').textContent=next.line;$('today-next-time').textContent=isToday?'Coming up':'On your schedule'}
 }
}
/* One-step plan editor: delegates all persistence to app.js [data-day] input handlers. */
function planOpen(){
 const editor=$('today-plan-editor');if(!editor)return;
 $('today-plan-main').value=$('oneaction').value||'';
 $('today-plan-priorities').value=$('priorities').value||'';
 $('today-plan-intention').value=$('focus').value||'';
 editor.hidden=false;
 $('today-plan-message').textContent='';
 document.querySelectorAll('[aria-controls="today-plan-editor"]').forEach(b=>b.setAttribute('aria-expanded','true'));
 editor.scrollIntoView({behavior:'smooth',block:'nearest'});
 $('today-plan-main').focus({preventScroll:true});
}
function planClose(){
 const editor=$('today-plan-editor');if(!editor)return;
 editor.hidden=true;
 document.querySelectorAll('[aria-controls="today-plan-editor"]').forEach(b=>b.setAttribute('aria-expanded','false'));
}
function savePlan(e){
 e.preventDefault();
 const values={oneaction:$('today-plan-main').value.trim(),priorities:$('today-plan-priorities').value.trim(),focus:$('today-plan-intention').value.trim()};
 for(const key of Object.keys(values)){
  const original=$(key);if(!original)continue;
  original.value=values[key];
  original.dispatchEvent(new Event('input',{bubbles:true}));
 }
 planClose();render();
}
function quick(kind){
 const opener=$('quick-add');if(!opener)return;
 opener.click();
 const picker=$('quick-kind');if(picker)picker.value=kind;
 const label=document.querySelector('label[for="quick-text"]');
 if(label)label.textContent=kind==='tasks'?'What do you need to do?':'What appointment or time block should I add?';
 const text=$('quick-text');if(text){text.placeholder=kind==='tasks'?'e.g. Pick up groceries':'e.g. 15:00–16:00 — Dance practice';text.focus()}
}
function toToday(){
 const picker=$('datepick'),v=iso(new Date());if(picker){picker.value=v;picker.dispatchEvent(new Event('change',{bubbles:true}))}
}
function init(){
 if(!$('today-home'))return;
 $('today-plan').addEventListener('click',planOpen);
 $('today-edit-focus').addEventListener('click',planOpen);
 $('today-prepare').addEventListener('click',planOpen);
 $('today-plan-cancel').addEventListener('click',planClose);
 $('today-plan-editor').addEventListener('submit',savePlan);
 $('today-open-journal').addEventListener('click',()=>{
  // Native writing dialogs live outside the collapsed journal details; one tap can open Notes.
  const notes=document.querySelector('[data-journal-open="notes"]');if(notes)notes.click();
 });
 $('today-add-task').addEventListener('click',()=>quick('tasks'));
 $('today-add-appointment').addEventListener('click',()=>quick('schedule'));
 $('today-home-return').addEventListener('click',toToday);
 document.addEventListener('kingdom:dayChanged',()=>{planClose();render()});
 document.addEventListener('kingdom:planningChanged',()=>setTimeout(render,0));
 document.addEventListener('kingdom:presetScheduled',()=>setTimeout(render,0));
 document.addEventListener('input',e=>{if(e.target&&e.target.matches('[data-day]'))setTimeout(render,0)});
 document.addEventListener('click',e=>{if(e.target&&e.target.id==='quick-save')setTimeout(render,0)});
 window.addEventListener('pageshow',render);
 // Keep the overview correct if the app stays open across midnight.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.KingdomTodayHome={render};
})();