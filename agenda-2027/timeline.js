/* KA Agenda timeline v48: duration-preserving drag, live conflict and two-click swap.
   Structured appointments only are movable; old free-text commitments are collision obstacles. */
(function(){
'use strict';
const MAIN='ka-2027-agenda-v1',SMART='ka-smart-entries-v1',START=7*60,END=22*60,PIXEL=1.45,STEP=15;
const $=id=>document.getElementById(id);
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const all=()=>Array.isArray(read(SMART))?read(SMART):[];
const day=()=> $('tasks-date')?.value || $('datepick')?.value || '';
const lang=()=>window.KA_locale?.()==='fr'?'fr':'en';
const words={
 en:{empty:'No timed appointments for this date. Add an appointment to schedule it here.',select:'Selected. Tap another appointment to swap times, or drag this block.',clear:'Selection cleared.',conflict:'Overlap detected — move to a free slot.',free:'Available — release to save.',saved:'Time updated. Duration preserved.',swapped:'Times swapped. Both durations preserved.',undo:'Last change reversed.',undoFail:'Could not undo: schedule has changed.',invalid:'Move cancelled: conflicting time.',legacy:'Existing appointment · fixed until edited',failed:'Could not save the change. Check storage.',begin:'Drag a block or select two to swap.',swapConflict:'Swap would overlap another commitment. Nothing changed.',stale:'This entry has changed. Reload and try again.',end:'Appointments must remain between 07:00 and 22:00.',edit:'Edit appointment',selected:'Selected for swap',unselect:'Cancel selection',moveEarlier:'15 min earlier',moveLater:'15 min later'},
 fr:{empty:'Aucun rendez-vous avec une heure pour cette date. Ajoutez-en un pour le planifier ici.',select:'Sélectionné. Touchez un autre rendez-vous pour échanger les horaires ou déplacez ce bloc.',clear:'Sélection annulée.',conflict:'Chevauchement détecté — choisissez un créneau libre.',free:'Créneau libre — relâchez pour enregistrer.',saved:'Horaire modifié. Durée conservée.',swapped:'Horaires échangés. Les durées sont conservées.',undo:'Dernière modification annulée.',undoFail:'Impossible d’annuler : l’horaire a changé.',invalid:'Déplacement annulé : conflit horaire.',legacy:'Ancien rendez-vous · fixe jusqu’à sa modification',failed:'Enregistrement impossible. Vérifiez le stockage.',begin:'Faites glisser un bloc ou sélectionnez deux rendez-vous pour les échanger.',swapConflict:'Cet échange causerait un chevauchement. Rien n’a changé.',stale:'Cette entrée a changé. Rechargez puis réessayez.',end:'Les rendez-vous doivent rester entre 7 h et 22 h.',edit:'Modifier le rendez-vous',selected:'Sélectionné pour échange',unselect:'Annuler la sélection',moveEarlier:'15 min plus tôt',moveLater:'15 min plus tard'}
};
const t=k=>words[lang()][k]||k;
const min=v=>{const x=/^([01]?\d|2[0-3]):([0-5]\d)$/.exec(v||'');return x?+x[1]*60+ +x[2]:NaN};
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parseOld=line=>{
 let m=line.match(/^\s*([01]?\d|2[0-3]):([0-5]\d)\s*[–—-]\s*([01]?\d|2[0-3]):([0-5]\d)/);
 if(m)return {start:+m[1]*60+ +m[2],end:+m[3]*60+ +m[4]};
 m=line.match(/^\s*([01]?\d|2[0-3]):([0-5]\d)\s*[–—-]\s*.+\(\s*[^,]*,\s*(\d+)\s*min\s*\)/i);
 if(m){const start=+m[1]*60+ +m[2];return {start,end:start+ +m[3]};}
 return null;
};
const overlaps=(a,b)=>a.start<b.end && b.start<a.end;
let selected=null,drag=null,last=null,suppressClick=false,renderQueued=false;
const status=(value,kind='')=>{if($('ka-timeline-status')){const e=$('ka-timeline-status');e.textContent=value;e.dataset.kind=kind;}};
function commitments(d,ignore=new Set()){
 const entries=all(),structured=entries.filter(e=>e.date===d&&e.type==='appointment'&&Number.isFinite(min(e.start))&&Number(e.duration)>0);
 const ignoredMirrors=new Set(entries.filter(e=>e.date===d&&e.type==='appointment').map(e=>e.legacyLine).filter(Boolean));
 let found=structured.filter(e=>!ignore.has(e.id)).map(e=>({id:e.id,title:e.title,start:min(e.start),end:min(e.start)+Number(e.duration),fixed:false}));
 const db=read(MAIN)||{},raw=String(((db.days||{})[d]||{}).schedule||'').split(/\r?\n/).filter(Boolean);
 raw.forEach((line,i)=>{
  if(ignoredMirrors.has(line))return;
  const parsed=parseOld(line);
  if(parsed && parsed.end>parsed.start)found.push({id:'legacy-'+i,title:line,start:parsed.start,end:parsed.end,fixed:true});
 });
 return found;
}
function conflict(d,candidates,ignore){
 const busy=commitments(d,ignore);
 return candidates.some((a,i)=>busy.some(b=>overlaps(a,b))||candidates.some((b,j)=>i!==j&&overlaps(a,b)));
}
function mirror(e){return e.start+'–'+clock(min(e.start)+Number(e.duration))+' — '+e.title+(e.location?' @ '+e.location:'');}
function persist(changes,previous){
 const entries=all(),db=read(MAIN)||{},date=day();
 const updated=entries.map(e=>changes.has(e.id)?{...e,start:clock(changes.get(e.id)),updatedAt:new Date().toISOString()}:e);
 const before=new Map(entries.map(e=>[e.id,e]));
 const oldDays=JSON.parse(JSON.stringify(db.days||{}));
 const cur={...(oldDays[date]||{})};
 let lines=String(cur.schedule||'').split('\n').filter(Boolean);
 for(const id of changes.keys()){
  const entry=before.get(id);if(!entry||entry.date!==date||entry.type!=='appointment'||!entry.legacyLine)return false;
  const idx=lines.indexOf(entry.legacyLine);
  if(idx<0)return false;lines.splice(idx,1);
 }
 updated.forEach(e=>{if(changes.has(e.id)){e.legacyLine=mirror(e);lines.push(e.legacyLine)}});
 cur.schedule=lines.join('\n');
 const days={...oldDays,[date]:cur};
 const oldSmart=localStorage.getItem(SMART);
 try{
  // Store structured state first; main app controller updates the legacy day via its event.
  localStorage.setItem(SMART,JSON.stringify(updated));
  if(!document.querySelector('[data-day="schedule"]')){throw Error('Planner unavailable')}
  document.dispatchEvent(new CustomEvent('kingdom:planningChanged',{detail:{days:{[date]:cur}}}));
  // Fallback for a missing controller, without changing unrelated days.
  const after=read(MAIN)||{};
  if((after.days||{})[date]?.schedule!==cur.schedule)throw Error('Planner did not persist');
 }catch(e){
  try{if(oldSmart===null)localStorage.removeItem(SMART);else localStorage.setItem(SMART,oldSmart);
   localStorage.setItem(MAIN,JSON.stringify({...db,days:oldDays}));
   document.dispatchEvent(new CustomEvent('kingdom:planningChanged',{detail:{days:{[date]:oldDays[date]||{}}}}));
  }catch(_){}status(t('failed'),'error');return false;
 }
 last={date,old:previous,newEntries:Array.from(changes.entries())};
 return true;
}
function update(idsAndStarts,kind){
 const d=day(),before=all(),ids=new Set(idsAndStarts.keys());
 if(Array.from(ids).some(id=>!before.some(e=>e.id===id&&e.type==='appointment'&&e.date===d&&e.legacyLine))){status(t('stale'),'error');return false;}
 const ranges=Array.from(idsAndStarts).map(([id,start])=>{const entry=before.find(e=>e.id===id);return {start,end:start+Number(entry.duration)};});
 if(ranges.some(x=>x.start<START||x.end>END)){status(t('end'),'error');return false;}
 if(conflict(d,ranges,ids)){status(t(kind==='swap'?'swapConflict':'invalid'),'error');return false;}
 const previous=Array.from(idsAndStarts.keys()).map(id=>[id,min(before.find(e=>e.id===id).start)]);
 if(!persist(idsAndStarts,previous))return false;
 selected=null;status(t(kind==='swap'?'swapped':'saved'),'good');render();return true;
}
function doSwap(a,b){
 const items=all(),one=items.find(e=>e.id===a),two=items.find(e=>e.id===b);
 if(!one||!two||one.date!==day()||two.date!==day())return;
 update(new Map([[a,min(two.start)],[b,min(one.start)]]),'swap');
}
function select(id){
 if(suppressClick){suppressClick=false;return;}
 if(!selected){selected=id;status(t('select'));render();return;}
 if(selected===id){selected=null;status(t('clear'));render();return;}
 doSwap(selected,id);
}
function undo(){
 if(!last||last.date!==day())return;
 const current=all();
 // Prevent undo from changing an appointment edited since the last move.
 if(last.newEntries.some(([id,start])=>min(current.find(e=>e.id===id)?.start)!==start)){last=null;status(t('undoFail'),'error');render();return;}
 const old=last.old;last=null;
 update(new Map(old),'undo');status(t('undo'),'good');render();
}
function place(block,item,start,duplicate){
 const duration=item.end-item.start;
 block.style.top=((start-START)*PIXEL)+'px';
 block.style.height=Math.max(30,duration*PIXEL-3)+'px';
 block.querySelector('.ka-slot-time').textContent=clock(start)+'–'+clock(start+duration);
 block.classList.toggle('is-preview',!!duplicate);
}
function draw(){
 const surface=$('ka-timeline-surface');if(!surface)return;
 const d=day();if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return;
 const items=commitments(d),height=(END-START)*PIXEL;
 surface.replaceChildren();surface.style.height=height+'px';
 for(let m=START;m<=END;m+=30){
  const y=(m-START)*PIXEL,row=document.createElement('div');row.className='ka-time-row'+(m%60?' half':'');row.style.top=y+'px';
  if(!(m%60)){const label=document.createElement('span');label.textContent=clock(m);row.appendChild(label);}
  surface.appendChild(row);
 }
 if(!items.length){const p=document.createElement('div');p.className='ka-timeline-empty';p.textContent=t('empty');surface.appendChild(p);}
 items.sort((a,b)=>a.start-b.start).forEach(item=>{
  if(item.end<=START||item.start>=END)return;
  const block=document.createElement('div');block.className='ka-timeline-block'+(item.fixed?' is-fixed':'')+(selected===item.id?' is-selected':'');
  block.dataset.id=item.id;block.style.top=((Math.max(item.start,START)-START)*PIXEL)+'px';
  block.style.height=Math.max(28,(Math.min(item.end,END)-Math.max(item.start,START))*PIXEL-3)+'px';
  block.innerHTML='<div class="ka-slot-main"><span class="ka-slot-time">'+clock(item.start)+'–'+clock(item.end)+'</span><strong class="ka-slot-title">'+esc(item.title)+'</strong></div>';
  if(item.fixed){const hint=document.createElement('span');hint.className='ka-slot-fixed';hint.textContent='• '+t('legacy');block.appendChild(hint);}
  else{
   block.tabIndex=0;block.setAttribute('role','button');block.setAttribute('aria-label',item.title+', '+clock(item.start)+' to '+clock(item.end));
   block.addEventListener('click',()=>select(item.id));
   block.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(item.id)}});
   block.addEventListener('pointerdown',e=>beginDrag(e,item,block));
   const actions=document.createElement('div');actions.className='ka-slot-actions';
   const edit=document.createElement('button');edit.type='button';edit.className='ka-slot-edit';edit.textContent='✎';edit.setAttribute('aria-label',t('edit'));edit.title=t('edit');edit.onclick=e=>{e.stopPropagation();window.KingdomSmartEntries?.open('appointment',item.id)};
   const earlier=document.createElement('button');earlier.type='button';earlier.textContent='−15';earlier.title=t('moveEarlier');earlier.setAttribute('aria-label',t('moveEarlier'));earlier.onclick=e=>{e.stopPropagation();update(new Map([[item.id,item.start-STEP]]),'move')};
   const later=document.createElement('button');later.type='button';later.textContent='+15';later.title=t('moveLater');later.setAttribute('aria-label',t('moveLater'));later.onclick=e=>{e.stopPropagation();update(new Map([[item.id,item.start+STEP]]),'move')};
   actions.append(earlier,later,edit);block.appendChild(actions);
  }
  surface.appendChild(block);
 });
 if($('ka-timeline-undo'))$('ka-timeline-undo').disabled=!last||last.date!==d;
}
function beginDrag(e,item,block){
 if(e.button!==0||e.target.closest('button'))return;
 const surface=$('ka-timeline-surface');
 drag={id:item.id,initial:item.start,duration:item.end-item.start,downY:e.clientY,startY:e.clientY,pointer:e.pointerId,block,moved:false,proposal:item.start,valid:true};
 block.setPointerCapture(e.pointerId);
 block.addEventListener('pointermove',dragMove);block.addEventListener('pointerup',dragEnd);block.addEventListener('pointercancel',dragCancel);
}
function dragMove(e){
 if(!drag||e.pointerId!==drag.pointer)return;
 const delta=e.clientY-drag.downY;
 if(Math.abs(delta)<5&&!drag.moved)return;
 drag.moved=true;
 // Candidate snaps to 15-minute intervals as the pointer moves.
 const proposed=Math.max(START,Math.min(END-drag.duration,Math.round((drag.initial+delta/PIXEL)/STEP)*STEP));
 drag.proposal=proposed;
 const blocked=conflict(day(),[{start:proposed,end:proposed+drag.duration}],new Set([drag.id]));
 drag.valid=!blocked;
 drag.block.classList.toggle('has-conflict',blocked);
 drag.block.classList.add('is-dragging');
 drag.block.style.top=((proposed-START)*PIXEL)+'px';
 drag.block.querySelector('.ka-slot-time').textContent=clock(proposed)+'–'+clock(proposed+drag.duration);
 status(t(blocked?'conflict':'free'),blocked?'error':'good');
}
function clearDrag(){
 if(!drag)return;const {block}=drag;
 block.removeEventListener('pointermove',dragMove);block.removeEventListener('pointerup',dragEnd);block.removeEventListener('pointercancel',dragCancel);
 drag=null;
}
function dragEnd(e){
 if(!drag||e.pointerId!==drag.pointer)return;
 const d=drag,moved=d.moved;
 clearDrag();
 if(!moved)return;
 suppressClick=true;setTimeout(()=>{suppressClick=false},80);
 if(d.valid&&d.proposal!==d.initial)update(new Map([[d.id,d.proposal]]),'move');
 else{status(t(d.valid?'clear':'invalid'),d.valid?'':'error');render();}
}
function dragCancel(){if(!drag)return;clearDrag();status(t('clear'));render();}
function render(){draw()}
function queue(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;render()})}
function init(){
 if(!$('ka-timeline-surface'))return;
 $('ka-timeline-undo').onclick=undo;
 $('tasks-date')?.addEventListener('change',()=>{selected=null;last=null;queue()});
 document.addEventListener('kingdom:dayChanged',()=>{selected=null;queue()});
 document.addEventListener('kingdom:planningChanged',queue);
 document.addEventListener('kingdom:smartEntriesChanged',queue);
 document.addEventListener('kingdom:languageChanged',()=>{status(t('begin'));queue()});
 document.querySelectorAll('[data-tab="tasks"]').forEach(b=>b.addEventListener('click',queue));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue()});
 window.addEventListener('storage',e=>{if([MAIN,SMART].includes(e.key))queue()});
 status(t('begin'));queue();
}
window.KingdomTimeline={render:queue};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();