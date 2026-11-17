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
function db(){var d=read(KEY);return {presets:Array.isArray(d.presets)?d.presets:[],recent:Array.isArray(d.recent)?d.recent:[]}}
function uid(){return 'p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function el(tag,text){var e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e}
function option(select,value,text){var item=el('option',text);item.value=value;select.appendChild(item)}
function categorySelect(){
var c=$('preset-category');c.replaceChildren();Object.keys(GROUPS).forEach(function(name){option(c,name,name)});c.value=active&&active.category||'Dance';styleSelect();
}
function styleSelect(){var c=$('preset-category').value,s=$('preset-style'),previous=s.value;s.replaceChildren();GROUPS[c].forEach(function(x){option(s,x,x)});s.value=active&&active.style||previous;if(s.selectedIndex===-1)s.selectedIndex=0}
function historyAverage(name){var agenda=read(AGENDA),list=(agenda.sessions||[]).filter(function(x){return x&&x.name&&x.name.trim().toLowerCase()===name.trim().toLowerCase()&&Number(x.minutes)>0}).slice(-12);if(!list.length)return null;return Math.round(list.reduce(function(n,x){return n+Number(x.minutes)},0)/list.length)}
function form(){return {id:active&&active.id||'',name:$('preset-name').value.trim(),category:$('preset-category').value,style:$('preset-style').value,minutes:Math.max(5,Math.min(1440,Math.round(Number($('preset-minutes').value)||45))) }}
function setForm(p){active=p||null;$('preset-category').value=p&&p.category||'Dance';styleSelect();$('preset-style').value=p&&p.style||GROUPS[$('preset-category').value][0];$('preset-name').value=p&&p.name||'';$('preset-minutes').value=p&&p.minutes||45;estimate()}
function estimate(){var f=form(),avg=f.name?historyAverage(f.name):null;$('preset-estimate').textContent=avg?'Your last sessions average '+avg+' minutes. Tap the duration to use it, or choose another time.':'Choose a duration, or complete tracked sessions to learn your typical timing.';$('preset-estimate').dataset.estimate=avg||''}
function render(){var d=db(),lib=$('preset-library'),rec=$('preset-recent');lib.replaceChildren();rec.replaceChildren();var all=d.presets.slice().sort(function(a,b){return (b.used||0)-(a.used||0)});
if(!all.length)lib.appendChild(el('p','No saved presets yet. Save an activity, or use a suggestion from your session history below.'));
all.forEach(function(p){var row=el('article'),desc=el('div');desc.className='preset-main';desc.appendChild(el('strong',p.name));desc.appendChild(el('small',p.category+' · '+p.style+' · '+p.minutes+' min'+(p.used?' · used '+p.used+' times':'')));row.appendChild(desc);
var use=el('button','Select');use.type='button';use.onclick=function(){setForm(p);$('preset-date').value=agendaDate();$('preset-name').focus()};row.appendChild(use);
var remove=el('button','Delete');remove.type='button';remove.onclick=function(){if(!confirm('Delete saved preset "'+p.name+'"? Your scheduled agenda entries remain.'))return;d.presets=d.presets.filter(function(x){return x.id!==p.id});save(KEY,d);if(active&&active.id===p.id)setForm(null);render()};row.appendChild(remove);lib.appendChild(row)});
d.recent.slice(-5).reverse().forEach(function(x){var row=el('article'),part=el('div');part.className='preset-main';part.appendChild(el('strong',x.name));part.appendChild(el('small',x.category+' · '+x.style+' · '+x.minutes+' min · '+x.date));row.appendChild(part);var b=el('button','Repeat');b.onclick=function(){setForm(x);$('preset-date').value=agendaDate();$('preset-time').value=x.time||'09:00'};row.appendChild(b);rec.appendChild(row)});
if(!d.recent.length){var seen=new Set(),sessions=(read(AGENDA).sessions||[]).slice().reverse(),found=0;
sessions.forEach(function(x){if(!x.name||seen.has(x.name.toLowerCase())||found>=8)return;seen.add(x.name.toLowerCase());found++;
var row=el('article'),part=el('div');part.className='preset-main';part.appendChild(el('strong',x.name));part.appendChild(el('small','Previously tracked · '+Math.round(Number(x.minutes)||30)+' min'));row.appendChild(part);
var b=el('button','Use');b.onclick=function(){var title=x.name.toLowerCase(),isDance=/dance|hip.?hop|popping|locking|freestyle|house|breaking|choreo/.test(title),isMusic=/drum|djembe|piano|guitar|music/.test(title),isFitness=/fitness|calisthenics|workout|exercise|stretch/.test(title);
var category=isDance?'Dance':isMusic?'Music':isFitness?'Fitness':'Personal',style=isDance?(/hip.?hop/.test(title)?'Hip-Hop':/popping/.test(title)?'Popping':/locking/.test(title)?'Locking':/house/.test(title)?'House':'Freestyle'):category==='Music'?'Practice':category==='Fitness'?'Strength':'Learning';
setForm({name:x.name,category:category,style:style,minutes:historyAverage(x.name)||Math.max(5,Math.round(Number(x.minutes)||30))});$('preset-date').value=agendaDate()};row.appendChild(b);rec.appendChild(row)
});
if(!found)rec.appendChild(el('p','Used activities and completed sessions will appear here for one-tap repetition.'));}
}
function savePreset(){var f=form();if(!f.name){$('preset-name').focus();return null}var d=db(),old=d.presets.find(function(p){return p.id===f.id});if(old){Object.assign(old,f)}else{f.id=uid();f.used=0;d.presets.push(f)}if(!save(KEY,d))return null;active=f;render();return f}
function addToAgenda(){
var f=savePreset();if(!f)return;
var date=$('preset-date').value||agendaDate();if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){alert('Please choose a valid date.');return}
var time=$('preset-time').value||'09:00',label=time+' — '+f.name+' ('+f.category+' / '+f.style+', '+f.minutes+' min)';
var a=read(AGENDA);a.days=a.days||{};a.days[date]=a.days[date]||{};a.days[date].schedule=[a.days[date].schedule,label].filter(Boolean).join('\n');
if(!save(AGENDA,a))return;
var d=db(),p=d.presets.find(function(x){return x.id===f.id});if(p){p.used=(p.used||0)+1;p.minutes=f.minutes;p.lastUsed=date}
d.recent.push({name:f.name,category:f.category,style:f.style,minutes:f.minutes,date:date,time:time});d.recent=d.recent.slice(-35);save(KEY,d);render();
document.dispatchEvent(new CustomEvent('kingdom:presetScheduled',{detail:{date:date,schedule:a.days[date].schedule}}));
if(date===agendaDate()&&$('schedule'))$('schedule').value=a.days[date].schedule;
alert('Added to '+date+' at '+time+'. You can repeat it from Presets anytime.');
}
function printData(){
var mode=$('print-range').value,reference=agendaDate(),a=read(AGENDA),p=db(),g=read(GROWTH);
var dates=Object.keys(a.days||{}).filter(function(date){return /^\d{4}-\d{2}-\d{2}$/.test(date)});
if(mode==='day')dates=[reference];
else if(mode==='week'){var date=new Date(reference+'T12:00:00');date.setDate(date.getDate()-(date.getDay()+6)%7);dates=[];for(var n=0;n<7;n++){var z=new Date(date);z.setDate(z.getDate()+n);dates.push(z.getFullYear()+'-'+String(z.getMonth()+1).padStart(2,'0')+'-'+String(z.getDate()).padStart(2,'0'))}}
else if(mode==='month')dates=dates.filter(function(x){return x.slice(0,7)===reference.slice(0,7)});
else{dates=Array.from(new Set(dates.concat(Object.keys(g.days||{}))));}
dates.sort();return {mode:mode,reference:reference,dates:dates,agenda:a,presets:p,growth:g}
}
function addHeading(root,tag,t){var h=el(tag,t);root.appendChild(h)}
function field(root,label,value){if(!String(value||'').trim())return;var section=el('section');section.className='print-block';section.appendChild(el('h3',label));section.appendChild(el('pre',String(value)));root.appendChild(section)}
function buildReport(){
var d=printData(),root=$('preset-print-report');root.replaceChildren();var front=el('section');front.className='print-front';addHeading(front,'h1','KINGDOM ATMOSPHERE');addHeading(front,'h2','My personal agenda');front.appendChild(el('p','Personal journal · Faith · Life · Purpose · Growth'));front.appendChild(el('p',d.mode==='all'?'Complete saved archive':d.mode==='day'?'Day: '+d.reference:d.mode==='week'?'Week of '+d.reference:'Month: '+d.reference.slice(0,7)));root.appendChild(front);
d.dates.forEach(function(date){var a=(d.agenda.days||{})[date]||{},growth=(d.growth.days||{})[date]||{},page=el('section');page.className='print-page';addHeading(page,'h2',new Date(date+'T12:00:00').toLocaleDateString('en-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));
field(page,'Daily intention',a.focus);field(page,'Most important action',a.oneaction);field(page,'Top priorities',a.priorities);field(page,'Writing & notes',a.daynotes);field(page,'Spiritual reflection',a.reflection);field(page,'Prayer',a.prayer);field(page,'Gratitude',a.gratitude);field(page,'Evening review',a.review);field(page,'Schedule & appointments',a.schedule);field(page,'Tasks',a.tasks);field(page,'Discipline',a.discipline);
var cats={spiritual:'Spiritual',emotional:'Emotional',relationships:'Relationships',personal:'Personal',financial:'Financial'};Object.keys(cats).forEach(function(k){var x=growth[k];if(x&&x.action)field(page,cats[k]+' growth'+(x.done?' (completed)':''),x.action+(x.notes?'\nReflection: '+x.notes:''))});
if(!page.querySelector('section'))page.appendChild(el('p','A new day to begin again.'));
root.appendChild(page)});
if(d.mode==='all'){
var more=el('section');more.className='print-page';addHeading(more,'h2','Yearly vision and personal notes');Object.entries(d.agenda.single||{}).forEach(function(x){field(more,x[0],x[1])});root.appendChild(more);
Object.keys(d.agenda.months||{}).sort().forEach(function(key){var page=el('section');page.className='print-page';addHeading(page,'h2','Monthly notes · '+key);Object.entries(d.agenda.months[key]||{}).forEach(function(x){field(page,x[0],x[1])});root.appendChild(page)});
Object.keys(d.agenda.weeks||{}).sort().forEach(function(key){var page=el('section');page.className='print-page';addHeading(page,'h2','Weekly reflections · '+key);Object.entries(d.agenda.weeks[key]||{}).forEach(function(x){field(page,x[0],x[1])});field(page,'Whole-life weekly review',(d.growth.weeks||{})[key]&&d.growth.weeks[key].reflection);root.appendChild(page)});
var extras=el('section');extras.className='print-page';addHeading(extras,'h2','Family dates, gifts and saved presets');
(d.agenda.family||[]).forEach(function(x){field(extras,'Family',x.name+' · '+x.kind+' · '+x.date)});
(d.agenda.gifts||[]).forEach(function(x){field(extras,'Gift',x.recipient+' · '+x.idea+' · Budget '+x.budget)});
(d.presets.presets||[]).forEach(function(x){field(extras,'Activity preset',x.category+' / '+x.style+' · '+x.name+' · '+x.minutes+' minutes')});
root.appendChild(extras);
var goals=el('section');goals.className='print-page';addHeading(goals,'h2','Goals, planned outcomes and completed actions');
(d.agenda.linkedGoals||[]).forEach(function(x){field(goals,'Annual goal'+(x.done?' (complete)':''),x.year+' · '+x.name)});
(d.agenda.linkedOutcomes||[]).forEach(function(x){field(goals,'Weekly outcome'+(x.done?' (complete)':''),x.week+' · '+x.name)});
(d.agenda.linkedActions||[]).forEach(function(x){field(goals,'Daily action'+(x.done?' (complete)':''),x.date+' · '+x.name)});
root.appendChild(goals);
var reminders=el('section');reminders.className='print-page';addHeading(reminders,'h2','Reminders and activity history');
(d.agenda.reminders||[]).forEach(function(x){field(reminders,'Reminder'+(x.done?' (complete)':''),x.when+' · '+x.name)});
(d.agenda.sessions||[]).forEach(function(x){field(reminders,'Tracked activity',x.name+' · '+x.minutes+' min · '+(x.finished||''))});
root.appendChild(reminders);
Object.keys(d.growth.weeks||{}).sort().forEach(function(key){if(d.agenda.weeks&&d.agenda.weeks[key])return;var reflect=(d.growth.weeks[key]||{}).reflection;if(!reflect)return;var growthWeek=el('section');growthWeek.className='print-page';addHeading(growthWeek,'h2','Whole-life weekly growth · '+key);field(growthWeek,'Reflection',reflect);root.appendChild(growthWeek)});
}
return d;
}
function printAgenda(){buildReport();document.body.classList.add('preset-print-mode');setTimeout(function(){window.print()},110)}
function shareAgenda(){var d=printData(),lines=['Kingdom Atmosphere — Agenda summary',d.mode+' · '+d.reference,''];d.dates.forEach(function(date){var x=(d.agenda.days||{})[date]||{};lines.push(date);if(x.oneaction)lines.push('Focus: '+x.oneaction);if(x.schedule)lines.push('Schedule:\n'+x.schedule);if(x.priorities)lines.push('Priorities:\n'+x.priorities);lines.push('')});var text=lines.join('\n');if(navigator.share)navigator.share({title:'Kingdom Atmosphere Agenda',text:text}).catch(function(){});else if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){alert('Summary copied. Paste it into a message.')}).catch(function(){alert('Use Print / Save PDF to share from Files.')});else alert('Use Print / Save PDF to create a shareable document.')}
function init(){
if(!$('preset-category'))return;
categorySelect();$('preset-category').onchange=function(){active=null;styleSelect();estimate()};
$('preset-style').onchange=estimate;$('preset-name').oninput=estimate;
$('preset-estimate').onclick=function(){var avg=Number(this.dataset.estimate);if(avg){$('preset-minutes').value=avg;estimate()}};
$('preset-save').onclick=function(){if(savePreset())alert('Saved to your reusable activity library.')};
$('preset-apply').onclick=addToAgenda;$('preset-open-day').onclick=function(){var tab=document.querySelector('[data-tab="presets"]');if(tab)tab.click();else{document.querySelectorAll('.pane').forEach(function(x){x.classList.toggle('active',x.id==='presets')})} $('preset-date').value=agendaDate()};
$('preset-date').value=agendaDate();
$('print-agenda').onclick=printAgenda;$('share-agenda').onclick=shareAgenda;
window.addEventListener('afterprint',function(){document.body.classList.remove('preset-print-mode')});
document.addEventListener('change',function(e){if(e.target.id==='datepick'&&$('preset-date'))$('preset-date').value=agendaDate()},true);
render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.KingdomPresetsSelfTest=function(){return {presetTab:!!$('presets'),categoryCount:Object.keys(GROUPS).length,danceStyles:GROUPS.Dance.length,print:!!$('print-agenda'),share:!!$('share-agenda')}};
})();