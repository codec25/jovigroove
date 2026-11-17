/* Kingdom Atmosphere journal: resilient iPhone dialog + autosave handler.
   This runs before the main planner script, so unrelated modules cannot disable these cards. */
(function(){
'use strict';
var KEY='ka-2027-agenda-v1';
/* Initial date rendering must not depend on the main dashboard JavaScript. */
function getLocalDay(){
var d=new Date();
return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function renderLiveDate(){
var d=new Date(),day=getLocalDay(),picker=document.getElementById('datepick');
var dateParts=day.split('-');
if(picker&&picker.value!==day&&picker.dataset.manualDate!=='yes')picker.value=day;
var week=document.getElementById('weekdate');if(week&&!week.dataset.manualDate)week.value=day;
var title=document.getElementById('dayheading');
if(title&&(!picker||picker.value===day))title.textContent=d.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
var yr=document.getElementById('yearpick');if(yr&&yr.dataset.manualDate!=='yes')yr.value=+dateParts[0];
var calYear=document.getElementById('calendar-year');if(calYear&&!calYear.dataset.manualDate)calYear.value=+dateParts[0];
var indicator=document.getElementById('today-indicator');if(indicator)indicator.textContent='Today · '+d.toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'});
var status=document.getElementById('status');
if(status)status.textContent='Agenda v15 · Today is '+d.toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})+' · Saved on this device';
}
renderLiveDate();
document.addEventListener('DOMContentLoaded',function(){var p=document.getElementById('datepick');if(p&&(!p.value||p.value==='2027-01-01'))renderLiveDate()});
document.addEventListener('change',function(e){if(e.target&&e.target.id==='datepick'){e.target.dataset.manualDate='yes'}},true);

var activePanel=null;
function visibleViewport(){return window.visualViewport||null}
function updateKeyboardLayout(){
if(!activePanel||!activePanel.open)return;
var viewport=visibleViewport(),full=window.innerHeight||document.documentElement.clientHeight;
var visible=viewport?viewport.height:full;
var keyboard=!!viewport&&visible<full-125;
activePanel.classList.toggle('journal-keyboard-open',keyboard);
if(keyboard){activePanel.style.setProperty('--journal-visible-height',Math.max(235,Math.round(visible))+'px');activePanel.style.setProperty('--journal-visible-top',Math.max(0,Math.round(viewport.offsetTop))+'px')}
else{activePanel.style.removeProperty('--journal-visible-height');activePanel.style.removeProperty('--journal-visible-top')}
}
function keepFieldVisible(field){
if(!activePanel||!activePanel.contains(field))return;
requestAnimationFrame(function(){
var body=activePanel.querySelector('.journal-dialog-body');if(!body)return;
var outer=body.getBoundingClientRect(),box=field.getBoundingClientRect();
if(box.bottom>outer.bottom-16)body.scrollTop+=box.bottom-outer.bottom+24;
else if(box.top<outer.top+10)body.scrollTop-=outer.top-box.top+20;
})
}
var FIELDS={intent:['focus','oneaction','priorities'],notes:['daynotes'],faith:['reflection','prayer','gratitude'],evening:['review']};
var DEFAULTS={intent:'What matters most to you today?',notes:'A private space to write freely.',faith:'Reflect on the Word and your day.',evening:'Record progress, lessons and growth.'};
function $(id){return document.getElementById(id)}
function read(){try{var obj=JSON.parse(localStorage.getItem(KEY)||'null');return obj&&typeof obj==='object'?obj:{}}catch(e){return {}}}
function date(){var picker=$('datepick');if(picker&&/^\d{4}-\d{2}-\d{2}$/.test(picker.value))return picker.value;var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function refresh(){
var entry=(read().days||{})[date()]||{},count=0;
Object.keys(FIELDS).forEach(function(name){
var fields=FIELDS[name],filled=fields.some(function(k){return String(entry[k]||'').trim().length>0});
if(filled)count++;
var preview=fields.map(function(k){return String(entry[k]||'').trim()}).find(Boolean)||DEFAULTS[name];
var label=$('preview-'+name);if(label)label.textContent=preview.length>110?preview.slice(0,107)+'…':preview;
var card=document.querySelector('[data-journal-open="'+name+'"]');
if(card){card.classList.toggle('is-written',filled);card.setAttribute('aria-label',card.querySelector('strong').textContent+(filled?', saved writing':', ready to write'))}
});
if($('digest-count'))$('digest-count').textContent=count+' of 4 pages written';
if($('digest-caption'))$('digest-caption').textContent=count===0?'A fresh page, ready for your thoughts.':count===4?'Your thoughts, priorities and reflections are recorded.':count+' section'+(count===1?' has':'s have')+' your writing.';
}
function openPanel(name,trigger){
var panel=$('journal-'+name);if(!panel||!FIELDS[name])return;
var entry=(read().days||{})[date()]||{};
FIELDS[name].forEach(function(key){var el=$(key);if(el)el.value=entry[key]||''});
panel._returnFocus=trigger;
activePanel=panel;
try{if(!panel.open&&typeof panel.showModal==='function')panel.showModal();
else if(!panel.open){panel.setAttribute('open','');panel.classList.add('journal-fallback');document.body.classList.add('journal-fallback-active')}}
catch(e){panel.setAttribute('open','');panel.classList.add('journal-fallback');document.body.classList.add('journal-fallback-active')}
if(panel.open){updateKeyboardLayout();}
// Do not auto-focus a text field: iPhone should not open the keyboard before the user is ready.
}
function closePanel(panel){
if(!panel)return;
if(document.activeElement&&panel.contains(document.activeElement)&&typeof document.activeElement.blur==='function')document.activeElement.blur();
if(panel.classList.contains('journal-fallback')){panel.removeAttribute('open');panel.classList.remove('journal-fallback');document.body.classList.remove('journal-fallback-active')}
else if(panel.open&&typeof panel.close==='function')panel.close();
activePanel=null;
panel.classList.remove('journal-keyboard-open');
panel.style.removeProperty('--journal-visible-height');
panel.style.removeProperty('--journal-visible-top');
refresh();
if(panel._returnFocus&&panel._returnFocus.isConnected)try{panel._returnFocus.focus({preventScroll:true})}catch(e){}
}
function saveField(target){
var key=target.dataset.day;if(!key)return;
try{var db=read(),day=date();if(!db.days)db.days={};if(!db.days[day])db.days[day]={};
db.days[day][key]=target.value;
localStorage.setItem(KEY,JSON.stringify(db));
var status=target.closest('dialog').querySelector('.journal-save-status');
if(status)status.textContent='Saved on this device';
if($('status'))$('status').textContent='Saved on this device';
}catch(e){var label=target.closest('dialog').querySelector('.journal-save-status');if(label)label.textContent='Cannot save—check browser storage'}
refresh();
}
// Capturing click events makes the action reliable even if another script fails during initialization.
document.addEventListener('click',function(e){
var tile=e.target.closest('[data-journal-open]');
if(tile){e.preventDefault();e.stopImmediatePropagation();openPanel(tile.dataset.journalOpen,tile);return}
var close=e.target.closest('.agenda-dialog .journal-close,.agenda-dialog .journal-done');
if(close){e.preventDefault();e.stopImmediatePropagation();closePanel(close.closest('dialog'))}
},true);
document.addEventListener('input',function(e){if(e.target.matches('.agenda-dialog [data-day]'))saveField(e.target)},true);
document.addEventListener('focusin',function(e){if(e.target.matches('.agenda-dialog input,.agenda-dialog textarea')){activePanel=e.target.closest('dialog');updateKeyboardLayout();setTimeout(function(){updateKeyboardLayout();keepFieldVisible(e.target)},160)}},true);
document.addEventListener('focusout',function(e){if(e.target.matches('.agenda-dialog input,.agenda-dialog textarea'))setTimeout(updateKeyboardLayout,120)},true);
if(window.visualViewport){window.visualViewport.addEventListener('resize',function(){updateKeyboardLayout();if(document.activeElement)keepFieldVisible(document.activeElement)});window.visualViewport.addEventListener('scroll',updateKeyboardLayout)}
window.addEventListener('orientationchange',function(){setTimeout(updateKeyboardLayout,200)});
document.addEventListener('change',function(e){if(e.target.id==='datepick')setTimeout(refresh,0)},true);
document.addEventListener('DOMContentLoaded',function(){refresh();document.querySelectorAll('.agenda-dialog').forEach(function(el){el.addEventListener('close',function(){if(activePanel===el){activePanel=null;el.classList.remove('journal-keyboard-open')}refresh()})})});
window.addEventListener('pageshow',refresh);
window.KingdomJournalSelfTest=function(){var result={cards:0,dialogs:0,fields:0,modalSupported:typeof HTMLDialogElement!=='undefined'&&typeof HTMLDialogElement.prototype.showModal==='function'};Object.keys(FIELDS).forEach(function(name){if(document.querySelector('[data-journal-open="'+name+'"]'))result.cards++;if($('journal-'+name))result.dialogs++;FIELDS[name].forEach(function(key){if($(key))result.fields++})});return result};
})();