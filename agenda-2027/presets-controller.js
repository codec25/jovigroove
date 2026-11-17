/* Kingdom Atmosphere Presets + printable export, standalone and offline */
(function(){
'use strict';
var KEY='ka-presets-v1',AGENDA='ka-2027-agenda-v1',GROWTH='ka-whole-life-growth-v1',active=null;
var GROUPS={
'Dance':['Hip-Hop','House','Popping','Locking','Breaking','Afro','Dancehall','Contemporary','Freestyle','Choreography','Dance fitness','Conditioning','Other'],
'Music':['Drums','Djembe','Piano','Guitar','Vocals','Music theory','Production','Practice','Other'],
'Fitness':['Calisthenics','Mobility','Stretching','Cardio','Strength','Recovery','Handstands','Other'],
'Faith':['Scripture study','Prayer','Ministry','Reflection','Service','Other'],
'Relationships':['Family','Friendship','Marriage / partner','Community','Check-in','Other'],
'Finance':['Budget','Savings','Expenses','Financial learning','Planning','Other'],
'Work':['Projects','Creative work','Learning','Administration','Meetings','Other'],
'Personal':['Reading','Journaling','Learning','Well-being','Home','Other']
};
function $(id){return document.getElementById(id)}
function read(k){try{var x=JSON.parse(localStorage.getItem(k)||'null');return x&&typeof x==='object'?x:{}}catch(e){return {}}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){alert('Unable to save on this device; check browser storage.');return false}}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function agendaDate(){return $('datepick')&&$('datepick').value||today()}
function db(){var d=read(KEY);return {presets:Array.isArray(d.presets)?d.presets:[],recent:Array.isArray(d.recent)?d.recent:[],bookings:Array.isArray(d.bookings)?d.bookings:[]}}
function uid(){return 'p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function el(tag,text){var e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e}
function option(select,value,text){var item=el('option',text);item.value=value;select.appendChild(item)}
function categorySelect(){
var c=$('preset-category');c.replaceChildren();Object.keys(GROUPS).forEach(function(name){option(c,name,name)});c.value=active&&active.category||'Dance';styleSelect();
}
function styleSelect(){var c=$('preset-category').value,s=$('preset-style'),previous=s.value;s.replaceChildren();GROUPS[c].forEach(function(x){option(s,x,x)});s.value=active&&active.style||previous;if(s.selectedIndex===-1)s.selectedIndex=0}
function historyAverage(name){var agenda=read(AGENDA),list=(agenda.sessions||[]).filter(function(x){return x&&x.name&&x.name.trim().toLowerCase()===name.trim().toLowerCase()&&Number(x.minutes)>0}).slice(-12);if(!list.length)return null;return Math.round(list.reduce(function(n,x){return n+Number(x.minutes)},0)/list.length)}
function form(){return {id:active&&active.id||'',name:$('preset-name').value.trim(),category:$('preset-category').value,style:$('preset-style').value,minutes:Math.max(5,Math.min(1440,Math.round(Number($('preset-minutes').value)||45))),time:$('preset-time').value||'09:00',timeMode:$('preset-time-mode').value||'duration',endTime:$('preset-end').value||'' }}
function setForm(p){active=p||null;$('preset-category').value=p&&p.category||'Dance';styleSelect();$('preset-style').value=p&&p.style||GROUPS[$('preset-category').value][0];$('preset-name').value=p&&p.name||'';$('preset-minutes').value=p&&p.minutes||45;$('preset-time').value=p&&p.time||'09:00';$('preset-time-mode').value=p&&p.timeMode||'duration';$('preset-end').value=p&&p.endTime||clockOf(Math.min(1439,toMinutes($('preset-time').value)+Number($('preset-minutes').value||45)));syncClockMode();estimate();checkConflicts()}
function estimate(){var f=form(),avg=f.name?historyAverage(f.name):null;$('preset-estimate').textContent=avg?'Your last sessions average '+avg+' minutes. Tap the duration to use it, or choose another time.':'Choose a duration, or complete tracked sessions to learn your typical timing.';$('preset-estimate').dataset.estimate=avg||''}
function render(){var d=db(),lib=$('preset-library'),rec=$('preset-recent');lib.replaceChildren();rec.replaceChildren();var all=d.presets.slice().sort(function(a,b){return (b.used||0)-(a.used||0)});
if(!all.length)lib.appendChild(el('p','No saved presets yet. Save an activity, or use a suggestion from your session history below.'));
all.forEach(function(p){var row=el('article'),desc=el('div');desc.className='preset-main';desc.appendChild(el('strong',p.name));desc.appendChild(el('small',p.category+' · '+p.style+' · '+p.minutes+' min'+(p.used?' · used '+p.used+' times':'')));row.appendChild(desc);
var use=el('button','Select');use.type='button';use.onclick=function(){setForm(p);$('preset-date').value=agendaDate();$('preset-name').focus()};row.appendChild(use);
var remove=el('button','Delete');remove.type='button';remove.onclick=function(){if(!confirm('Delete saved preset "'+p.name+'"? Your scheduled agenda entries remain.'))return;d.presets=d.presets.filter(function(x){return x.id!==p.id});save(KEY,d);if(active&&active.id===p.id)setForm(null);render()};row.appendChild(remove);lib.appendChild(row)});
d.recent.slice(-5).reverse().forEach(function(x){var row=el('article'),part=el('div');part.className='preset-main';part.appendChild(el('strong',x.name));part.appendChild(el('small',x.category+' · '+x.style+' · '+x.minutes+' min · '+x.date));row.appendChild(part);var b=el('button','Repeat');b.onclick=function(){setForm(x);$('preset-date').value=agendaDate();checkConflicts()};row.appendChild(b);rec.appendChild(row)});
if(!d.recent.length){var seen=new Set(),sessions=(read(AGENDA).sessions||[]).slice().reverse(),found=0;
sessions.forEach(function(x){if(!x.name||seen.has(x.name.toLowerCase())||found>=8)return;seen.add(x.name.toLowerCase());found++;
var row=el('article'),part=el('div');part.className='preset-main';part.appendChild(el('strong',x.name));part.appendChild(el('small','Previously tracked · '+Math.round(Number(x.minutes)||30)+' min'));row.appendChild(part);
var b=el('button','Use');b.onclick=function(){var title=x.name.toLowerCase(),isDance=/dance|hip.?hop|popping|locking|freestyle|house|breaking|choreo/.test(title),isMusic=/drum|djembe|piano|guitar|music/.test(title),isFitness=/fitness|calisthenics|workout|exercise|stretch/.test(title);
var category=isDance?'Dance':isMusic?'Music':isFitness?'Fitness':'Personal',style=isDance?(/hip.?hop/.test(title)?'Hip-Hop':/popping/.test(title)?'Popping':/locking/.test(title)?'Locking':/house/.test(title)?'House':'Freestyle'):category==='Music'?'Practice':category==='Fitness'?'Strength':'Learning';
setForm({name:x.name,category:category,style:style,minutes:historyAverage(x.name)||Math.max(5,Math.round(Number(x.minutes)||30))});$('preset-date').value=agendaDate()};row.appendChild(b);rec.appendChild(row)
});
if(!found)rec.appendChild(el('p','Used activities and completed sessions will appear here for one-tap repetition.'));}
}

/* Same-day clock scheduling and conflict detection. Older saved presets need no migration. */
function toMinutes(time){if(!/^\d{2}:\d{2}$/.test(String(time||'')))return NaN;var p=time.split(':').map(Number);return p[0]<24&&p[1]<60?p[0]*60+p[1]:NaN}
function clockOf(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function isValidDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(new Date(s+'T12:00:00').getTime())}
function syncClockMode(){var manual=$('preset-time-mode').value==='end';$('preset-end-wrap').hidden=!manual;$('preset-minutes').disabled=manual;$('preset-minutes').title=manual?'Automatically calculated from the start and end times':''}
function getInterval(){
var start=toMinutes($('preset-time').value),end;
if(!Number.isFinite(start))return null;
if($('preset-time-mode').value==='end')end=toMinutes($('preset-end').value);
else end=start+Number($('preset-minutes').value);
if(!Number.isFinite(end)||end<=start||end>=1440)return null;
return {start:start,end:end};
}
function parseScheduleLine(line){
var text=String(line||'').trim(),hit=text.match(/^([01]?\d|2[0-3]):([0-5]\d)\s*[\u2013\u2014-]\s*([01]?\d|2[0-3]):([0-5]\d)\s*[\u2013\u2014-]?\s*(.*)$/);
if(hit){var from=Number(hit[1])*60+Number(hit[2]),until=Number(hit[3])*60+Number(hit[4]);if(until>from)return {start:from,end:until,name:hit[5]||'Scheduled event',time:clockOf(from)+'–'+clockOf(until),label:text}}
hit=text.match(/^([01]?\d|2[0-3]):([0-5]\d)\s*[\u2013\u2014-]\s*(.+?)(?:\((?:.*?),\s*(\d+)\s*min\))\s*$/i);
if(hit){var from=Number(hit[1])*60+Number(hit[2]),until=from+Number(hit[4]);if(until<1440)return {start:from,end:until,name:hit[3],time:clockOf(from)+'–'+clockOf(until),label:text}}
return null;
}
function findConflicts(date,start,end){
var d=db(),matches=[],already=new Set();
(d.bookings||[]).forEach(function(x){
if(x.date!==date)return;var from=toMinutes(x.start),until=toMinutes(x.end);if(!Number.isFinite(from)||!Number.isFinite(until)||!(start<until&&end>from))return;
matches.push({name:x.name||'Activity',time:x.start+'–'+x.end});if(x.label)already.add(x.label.trim())
});
var agenda=read(AGENDA),entry=(agenda.days||{})[date]||{};
String(entry.schedule||'').split('\n').forEach(function(line){var parsed=parseScheduleLine(line);if(!parsed||already.has(line.trim())||!(start<parsed.end&&end>parsed.start))return;matches.push(parsed)});
return matches;
}
function checkConflicts(){
var range=getInterval(),date=$('preset-date').value||agendaDate(),box=$('preset-conflict'),summary=$('preset-time-summary');
if(!range){summary.textContent='Choose a valid time range (ending on the same day).';box.hidden=false;box.className='preset-conflict invalid';box.textContent='End must be later than start; overnight activities are not supported yet.';return}
var duration=range.end-range.start;if($('preset-time-mode').value==='end')$('preset-minutes').value=duration;
else $('preset-end').value=clockOf(range.end);
summary.textContent=clockOf(range.start)+' – '+clockOf(range.end)+' · '+duration+' minutes';
var clashes=findConflicts(date,range.start,range.end);
box.hidden=!clashes.length;box.className='preset-conflict'+(clashes.length?' warning':'');
box.textContent=clashes.length?'Time overlap detected: '+clashes.map(function(x){return x.time+' · '+x.name}).join('; ')+'. You can adjust the time or explicitly allow the overlap.':'';
}

function savePreset(){var f=form();if(!f.name){$('preset-name').focus();return null}var d=db(),old=d.presets.find(function(p){return p.id===f.id});if(old){Object.assign(old,f)}else{f.id=uid();f.used=0;d.presets.push(f)}if(!save(KEY,d))return null;active=f;render();return f}
function addToAgenda(){
var f=form();if(!f.name){$('preset-name').focus();return}
var date=$('preset-date').value||agendaDate();if(!isValidDate(date)){alert('Please choose a valid date.');return}
var interval=getInterval();
if(!interval){alert('Choose valid start and end times. An activity must end later on the same day.');return}
var conflicts=findConflicts(date,interval.start,interval.end);
if(conflicts.length&&!confirm('Schedule overlap:\n'+conflicts.map(function(x){return x.time+' — '+x.name}).join('\n')+'\n\nAdd this activity anyway?'))return;
f.minutes=interval.end-interval.start;f.time=clockOf(interval.start);f.endTime=clockOf(interval.end);f.timeMode=$('preset-time-mode').value;
var saved=savePreset();if(!saved)return;f=saved;
var time=clockOf(interval.start),end=clockOf(interval.end),label=time+'–'+end+' — '+f.name+' ('+f.category+' / '+f.style+', '+f.minutes+' min)';
var a=read(AGENDA);a.days=a.days||{};a.days[date]=a.days[date]||{};a.days[date].schedule=[a.days[date].schedule,label].filter(Boolean).join('\n');
if(!save(AGENDA,a))return;
var d=db(),p=d.presets.find(function(x){return x.id===f.id});if(p){p.used=(p.used||0)+1;p.minutes=f.minutes;p.lastUsed=date}
d.recent.push({name:f.name,category:f.category,style:f.style,minutes:f.minutes,date:date,time:time,endTime:end,timeMode:f.timeMode});d.recent=d.recent.slice(-35);
d.bookings.push({id:uid(),presetId:f.id,name:f.name,category:f.category,style:f.style,date:date,start:time,end:end,minutes:f.minutes,label:label});
save(KEY,d);render();checkConflicts();
document.dispatchEvent(new CustomEvent('kingdom:presetScheduled',{detail:{date:date,schedule:a.days[date].schedule}}));
if(date===agendaDate()&&$('schedule'))$('schedule').value=a.days[date].schedule;
alert('Added '+f.name+' for '+date+' from '+time+' to '+end+'.'+(conflicts.length?' Overlap was allowed.':''));
}
/* PDF exporting is owned by pdf-export.js. */
function init(){
if(!$('preset-category'))return;
categorySelect();$('preset-category').onchange=function(){active=null;styleSelect();estimate();checkConflicts()};
$('preset-style').onchange=estimate;$('preset-name').oninput=function(){estimate();checkConflicts()};
$('preset-estimate').onclick=function(){var avg=Number(this.dataset.estimate);if(avg){$('preset-minutes').value=avg;estimate()}};
$('preset-save').onclick=function(){if(savePreset())alert('Saved to your reusable activity library.')};
$('preset-apply').onclick=addToAgenda;$('preset-open-day').onclick=function(){var tab=document.querySelector('[data-tab="presets"]');if(tab)tab.click();else{document.querySelectorAll('.pane').forEach(function(x){x.classList.toggle('active',x.id==='presets')})} $('preset-date').value=agendaDate()};
$('preset-date').value=agendaDate();
$('preset-date').addEventListener('change',checkConflicts);
$('preset-time').addEventListener('change',checkConflicts);
$('preset-minutes').addEventListener('input',checkConflicts);
$('preset-time-mode').addEventListener('change',function(){syncClockMode();checkConflicts()});
$('preset-end').addEventListener('change',function(){var range=getInterval();if(range)$('preset-minutes').value=range.end-range.start;checkConflicts()});
syncClockMode();checkConflicts();
/* PDF buttons are handled only by pdf-export.js; retain legacy print helpers as inactive fallback. */
document.addEventListener('change',function(e){if(e.target.id==='datepick'&&$('preset-date')){$('preset-date').value=agendaDate();checkConflicts()}},true);
render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.KingdomPresetsSelfTest=function(){return {presetTab:!!$('presets'),categoryCount:Object.keys(GROUPS).length,danceStyles:GROUPS.Dance.length,print:!!$('print-agenda'),share:!!$('share-agenda')}};
})();