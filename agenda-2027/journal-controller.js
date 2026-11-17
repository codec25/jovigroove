/* Kingdom Atmosphere journal: resilient iPhone dialog + autosave handler.
   This runs before the main planner script, so unrelated modules cannot disable these cards. */
(function(){
'use strict';
var KEY='ka-2027-agenda-v1';
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
try{if(!panel.open&&typeof panel.showModal==='function')panel.showModal();
else if(!panel.open){panel.setAttribute('open','');panel.classList.add('journal-fallback');document.body.classList.add('journal-fallback-active')}}
catch(e){panel.setAttribute('open','');panel.classList.add('journal-fallback');document.body.classList.add('journal-fallback-active')}
if(panel.open){var input=panel.querySelector('textarea,input');if(input)requestAnimationFrame(function(){try{input.focus({preventScroll:true})}catch(e){input.focus()}})}
}
function closePanel(panel){
if(!panel)return;
if(panel.classList.contains('journal-fallback')){panel.removeAttribute('open');panel.classList.remove('journal-fallback');document.body.classList.remove('journal-fallback-active')}
else if(panel.open&&typeof panel.close==='function')panel.close();
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
document.addEventListener('change',function(e){if(e.target.id==='datepick')setTimeout(refresh,0)},true);
document.addEventListener('DOMContentLoaded',function(){refresh();document.querySelectorAll('.agenda-dialog').forEach(function(el){el.addEventListener('close',refresh)})});
window.addEventListener('pageshow',refresh);
window.KingdomJournalSelfTest=function(){var result={cards:0,dialogs:0,fields:0,modalSupported:typeof HTMLDialogElement!=='undefined'&&typeof HTMLDialogElement.prototype.showModal==='function'};Object.keys(FIELDS).forEach(function(name){if(document.querySelector('[data-journal-open="'+name+'"]'))result.cards++;if($('journal-'+name))result.dialogs++;FIELDS[name].forEach(function(key){if($(key))result.fields++})});return result};
})();