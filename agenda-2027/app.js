(function(){
'use strict';
var KEY='ka-2027-agenda-v1',MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
var VERSES=[
['Psalm 118:24','This is the day which the LORD hath made; we will rejoice and be glad in it.'],
['Proverbs 3:5','Trust in the LORD with all thine heart; and lean not unto thine own understanding.'],
['Philippians 4:13','I can do all things through Christ which strengtheneth me.'],
['Joshua 1:9','Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.'],
['Psalm 46:1','God is our refuge and strength, a very present help in trouble.'],
['Proverbs 16:3','Commit thy works unto the LORD, and thy thoughts shall be established.'],
['Matthew 6:33','But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.'],
['Romans 12:12','Rejoicing in hope; patient in tribulation; continuing instant in prayer;'],
['Psalm 23:1','The LORD is my shepherd; I shall not want.'],
['1 Thessalonians 5:17','Pray without ceasing.'],
['Colossians 3:23','And whatsoever ye do, do it heartily, as to the Lord, and not unto men;'],
['Isaiah 40:31','But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles;'],
['Psalm 119:105','Thy word is a lamp unto my feet, and a light unto my path.'],
['Micah 6:8','He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?'],
['Galatians 6:9','And let us not be weary in well doing: for in due season we shall reap, if we faint not.'],
['John 14:27','Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.'],
['James 1:5','If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.'],
['Psalm 37:4','Delight thyself also in the LORD; and he shall give thee the desires of thine heart.'],
['Ephesians 4:32','And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ\'s sake hath forgiven you.'],
['1 Peter 5:7','Casting all your care upon him; for he careth for you.'],
['Matthew 5:16','Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.'],
['Psalm 27:1','The LORD is my light and my salvation; whom shall I fear?'],
['Romans 8:28','And we know that all things work together for good to them that love God, to them who are the called according to his purpose.'],
['Hebrews 11:1','Now faith is the substance of things hoped for, the evidence of things not seen.'],
['2 Corinthians 5:7','(For we walk by faith, not by sight:)'],
['Proverbs 17:17','A friend loveth at all times, and a brother is born for adversity.'],
['Psalm 34:8','O taste and see that the LORD is good: blessed is the man that trusteth in him.'],
['John 15:5','I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.'],
['Lamentations 3:23','They are new every morning: great is thy faithfulness.'],
['Psalm 121:2','My help cometh from the LORD, which made heaven and earth.'],
['1 Corinthians 16:14','Let all your things be done with charity.']
];
window.KingdomAgendaVerses=VERSES;
var data={days:{},months:{},family:[],gifts:[],single:{},activities:[],sessions:[],reminders:[],weeks:{},linkedGoals:[],linkedOutcomes:[],linkedActions:[]};try{var loaded=JSON.parse(localStorage.getItem(KEY)||'null');if(loaded&&typeof loaded==='object'){data.days=loaded.days||{};data.months=loaded.months||{};data.family=Array.isArray(loaded.family)?loaded.family:[];data.gifts=Array.isArray(loaded.gifts)?loaded.gifts:[];data.single=loaded.single||{};data.weeks=loaded.weeks||{};data.activities=Array.isArray(loaded.activities)?loaded.activities:[];data.sessions=Array.isArray(loaded.sessions)?loaded.sessions:[];data.reminders=Array.isArray(loaded.reminders)?loaded.reminders:[];data.linkedGoals=Array.isArray(loaded.linkedGoals)?loaded.linkedGoals:[];data.linkedOutcomes=Array.isArray(loaded.linkedOutcomes)?loaded.linkedOutcomes:[];data.linkedActions=Array.isArray(loaded.linkedActions)?loaded.linkedActions:[]}}catch(e){}
var startupNow=new Date(),selected=startupNow.getFullYear()+'-'+String(startupNow.getMonth()+1).padStart(2,'0')+'-'+String(startupNow.getDate()).padStart(2,'0'),month=startupNow.getMonth(),calendarYear=startupNow.getFullYear();var $=function(id){return document.getElementById(id)};function save(){try{localStorage.setItem(KEY,JSON.stringify(data));$('status').textContent='Saved on this device';}catch(e){$('status').textContent='Storage unavailable. Export your entries to avoid losing them.'}}
function isoDate(s){return new Date(s+'T12:00:00')}function dayIndex(s){return Math.floor(Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))/86400000)}function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function setDay(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(isoDate(s).getTime()))return;selected=s;$('datepick').value=s;var d=isoDate(s);$('dayheading').textContent=d.toLocaleDateString((window.KA_locale&&window.KA_locale()==='fr')?'fr-CA':'en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'});var verse=VERSES[((dayIndex(s)%VERSES.length)+VERSES.length)%VERSES.length];$('versetext').textContent='“'+verse[1]+'”';$('verseref').textContent=verse[0]+' · KJV';var entry=data.days[selected]||{};document.querySelectorAll('[data-day]').forEach(function(el){el.value=entry[el.dataset.day]||''});document.dispatchEvent(new CustomEvent('kingdom:dayChanged',{detail:{date:selected}}))}
document.querySelectorAll('[data-day]').forEach(function(el){el.addEventListener('input',function(){if(!data.days[selected])data.days[selected]={};data.days[selected][el.dataset.day]=el.value;save()})});
$('datepick').addEventListener('change',function(){setDay(this.value)});$('prev').onclick=function(){var n=new Date(isoDate(selected));n.setDate(n.getDate()-1);setDay(n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0'))};$('next').onclick=function(){var n=new Date(isoDate(selected));n.setDate(n.getDate()+1);setDay(n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0'))};
MONTHS.forEach(function(m,i){var op=document.createElement('option');op.value=i;op.textContent=m;$('monthpick').appendChild(op)});$('monthpick').onchange=function(){setMonth(+this.value)};
function setMonth(i){month=i;$('monthpick').value=i;$('calendar-year').value=calendarYear;$('monthheading').textContent=MONTHS[i]+' '+calendarYear;var cal=$('calendar');cal.innerHTML='';['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function(x){var c=document.createElement('div');c.className='cal-head';c.textContent=x;cal.appendChild(c)});var start=new Date(calendarYear,i,1).getDay(),days=new Date(calendarYear,i+1,0).getDate();for(var k=0;k<start;k++){var b=document.createElement('span');b.className='cal-day blank';cal.appendChild(b)}for(var n=1;n<=days;n++){(function(day){var datestr=calendarYear+'-'+String(i+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');var b=document.createElement('button');var realToday=new Date(),realTodayKey=realToday.getFullYear()+'-'+String(realToday.getMonth()+1).padStart(2,'0')+'-'+String(realToday.getDate()).padStart(2,'0');b.className='cal-day'+(datestr===selected?' current':'')+(datestr===realTodayKey?' is-today':'');if(datestr===realTodayKey){b.setAttribute('aria-current','date');b.title='Today'}b.textContent=day;var celebrations=data.family.filter(function(f){return f.date&&f.date.slice(5)===datestr.slice(5)});if(celebrations.length){var em=document.createElement('em');em.textContent='♥ '+celebrations.length;b.appendChild(em);b.title=celebrations.map(function(f){return f.name+' — '+f.kind}).join(', ')}b.onclick=function(){setDay(datestr);showTab('daily')};cal.appendChild(b)})(n)}var m=data.months[calendarYear+'-'+String(i+1).padStart(2,'0')]||{};document.querySelectorAll('[data-month]').forEach(function(el){el.value=m[el.dataset.month]||''})}
document.querySelectorAll('[data-month]').forEach(function(el){el.addEventListener('input',function(){var mk=calendarYear+'-'+String(month+1).padStart(2,'0');if(!data.months[mk])data.months[mk]={};data.months[mk][el.dataset.month]=el.value;save()})});
function showTab(id){document.querySelectorAll('.pane').forEach(function(x){x.classList.toggle('active',x.id===id)});document.querySelectorAll('[data-tab]').forEach(function(x){x.classList.toggle('active',x.dataset.tab===id)});if(id==='monthly')setMonth(month);window.scrollTo(0,0)}
document.querySelectorAll('[data-tab]').forEach(function(b){b.onclick=function(){showTab(b.dataset.tab)}});function renderFamily(){var list=$('familylist');list.innerHTML='';data.family.forEach(function(item,i){var line=document.createElement('div');line.className='family-line';line.innerHTML='<input aria-label="Family member or occasion" placeholder="Name / occasion" type="text" value="'+escapeHtml(item.name)+'"><input aria-label="Date" type="date" value="'+escapeHtml(item.date)+'"><input aria-label="Occasion" type="text" placeholder="Birthday / anniversary" value="'+escapeHtml(item.kind)+'"><button type="button" class="mini-btn no-print" aria-label="Delete occasion">×</button>';var fields=line.querySelectorAll('input');['name','date','kind'].forEach(function(k,j){fields[j].addEventListener('input',function(){data.family[i][k]=this.value;save()})});line.querySelector('button').onclick=function(){data.family.splice(i,1);save();renderFamily()};list.appendChild(line)})}
$('addfamily').onclick=function(){data.family.push({name:'',date:'',kind:'Birthday'});save();renderFamily()};
function renderGifts(){var list=$('giftlist');list.innerHTML='';data.gifts.forEach(function(item,i){var line=document.createElement('div');line.className='gift-line';line.innerHTML='<input aria-label="Recipient" placeholder="For whom?" type="text" value="'+escapeHtml(item.recipient)+'"><input aria-label="Gift" placeholder="Gift idea / purchased?" type="text" value="'+escapeHtml(item.idea)+'"><input aria-label="Budget CAD" placeholder="Budget $" type="number" min="0" step=".01" value="'+escapeHtml(item.budget)+'"><button type="button" class="mini-btn no-print" aria-label="Remove gift">×</button>';var fields=line.querySelectorAll('input');['recipient','idea','budget'].forEach(function(k,j){fields[j].addEventListener('input',function(){data.gifts[i][k]=this.value;save();updateBudget()})});line.querySelector('button').onclick=function(){data.gifts.splice(i,1);save();renderGifts()};list.appendChild(line)});updateBudget()}
function updateBudget(){var sum=data.gifts.reduce(function(a,x){return a+(Number(x.budget)||0)},0);$('budget').textContent=new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(sum)}
$('addgift').onclick=function(){data.gifts.push({recipient:'',idea:'',budget:''});save();renderGifts()};
document.querySelectorAll('[data-single]').forEach(function(el){el.value=data.single[el.dataset.single]||'';el.addEventListener('input',function(){data.single[el.dataset.single]=el.value;save()})});
$('export').onclick=function(){var blob=new Blob([JSON.stringify({version:1,year:'multi',days:data.days,months:data.months,family:data.family,gifts:data.gifts,single:data.single,weeks:data.weeks||{},activities:data.activities||[],sessions:data.sessions||[],reminders:data.reminders||[],linkedGoals:data.linkedGoals||[],linkedOutcomes:data.linkedOutcomes||[],linkedActions:data.linkedActions||[],wholeLifeGrowth:JSON.parse(localStorage.getItem('ka-whole-life-growth-v1')||'{}'),presetsLibrary:JSON.parse(localStorage.getItem('ka-presets-v1')||'{}'),familySpace:JSON.parse(localStorage.getItem('ka-family-space-v1')||'{}'),dailyTeachings:JSON.parse(localStorage.getItem('ka-agenda-daily-teachings-v1')||'{}'),smartEntries:JSON.parse(localStorage.getItem('ka-smart-entries-v1')||'[]'),achievements:JSON.parse(localStorage.getItem('ka-agenda-achievements-v1')||'[]')},null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Kingdom-Atmosphere-Agenda-Backup.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)};
$('import').onchange=function(){var file=this.files&&this.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(){try{var o=JSON.parse(reader.result);if(!o||!o.days||!o.months||!Array.isArray(o.family)||!Array.isArray(o.gifts))throw Error('Invalid backup');if(!confirm('Replace all entries on this device with this backup?'))return;data={days:o.days,months:o.months,family:o.family,gifts:o.gifts,single:o.single||{},weeks:o.weeks||{},activities:Array.isArray(o.activities)?o.activities:[],sessions:Array.isArray(o.sessions)?o.sessions:[],reminders:Array.isArray(o.reminders)?o.reminders:[],linkedGoals:Array.isArray(o.linkedGoals)?o.linkedGoals:[],linkedOutcomes:Array.isArray(o.linkedOutcomes)?o.linkedOutcomes:[],linkedActions:Array.isArray(o.linkedActions)?o.linkedActions:[]};if(o.wholeLifeGrowth&&typeof o.wholeLifeGrowth==='object')localStorage.setItem('ka-whole-life-growth-v1',JSON.stringify(o.wholeLifeGrowth));if(o.presetsLibrary&&typeof o.presetsLibrary==='object')localStorage.setItem('ka-presets-v1',JSON.stringify(o.presetsLibrary));if(o.familySpace&&typeof o.familySpace==='object'&&o.familySpace.version===1)localStorage.setItem('ka-family-space-v1',JSON.stringify(o.familySpace));if(o.dailyTeachings&&typeof o.dailyTeachings==='object'&&!Array.isArray(o.dailyTeachings))localStorage.setItem('ka-agenda-daily-teachings-v1',JSON.stringify(o.dailyTeachings));if(Array.isArray(o.smartEntries))localStorage.setItem('ka-smart-entries-v1',JSON.stringify(o.smartEntries));else localStorage.removeItem('ka-smart-entries-v1');if(Array.isArray(o.achievements))localStorage.setItem('ka-agenda-achievements-v1',JSON.stringify(o.achievements));else localStorage.removeItem('ka-agenda-achievements-v1');save();location.reload()}catch(e){alert('Could not import that agenda backup.')}};reader.readAsText(file)};
$('clear').onclick=function(){if(confirm('Erase all personal and family agenda entries on this device? Export backups first. This cannot be undone.')){localStorage.removeItem(KEY);localStorage.removeItem('ka-agenda-last-date');localStorage.removeItem('ka-whole-life-growth-v1');localStorage.removeItem('ka-presets-v1');localStorage.removeItem('ka-family-space-v1');localStorage.removeItem('ka-agenda-daily-teachings-v1');localStorage.removeItem('ka-smart-entries-v1');localStorage.removeItem('ka-agenda-achievements-v1');location.reload()}};
setDay(selected);setMonth(month);renderFamily();renderGifts();
document.addEventListener('kingdom:presetScheduled',function(ev){
var item=ev.detail||{};if(!item.date||!item.schedule)return;
data.days=data.days||{};data.days[item.date]=data.days[item.date]||{};
data.days[item.date].schedule=item.schedule;
save();
if(selected===item.date&&$('schedule'))$('schedule').value=item.schedule;
});
/* Keep schedule edits and copied days in the main controller's in-memory state.
   Otherwise its next save would overwrite planner tools' local edits. */
document.addEventListener('kingdom:planningChanged',function(ev){
var change=ev.detail||{};
if(change.days){Object.keys(change.days).forEach(function(key){data.days[key]=change.days[key]})}
if(change.weeks){Object.keys(change.weeks).forEach(function(key){data.weeks[key]=change.weeks[key]})}
save();
if(change.days&&Object.prototype.hasOwnProperty.call(change.days,selected))setDay(selected);
if(change.weeks&&Object.prototype.hasOwnProperty.call(change.weeks,weekStartKey(weekSelected)))loadWeek(weekSelected);
});

/* Purpose-first productivity extension */
var weekSelected=selected;
function weekStartKey(s){var d=isoDate(s);var shift=(d.getDay()+6)%7;d.setDate(d.getDate()-shift);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function loadWeek(s){if(!s||!Number.isFinite(isoDate(s).getTime()))return;weekSelected=s;$('weekdate').value=s;var key=weekStartKey(s),v=(data.weeks||{})[key]||{};var d=isoDate(key),end=new Date(d);end.setDate(end.getDate()+6);$('weekrange').textContent='Week: '+d.toLocaleDateString((window.KA_locale&&window.KA_locale()==='fr')?'fr-CA':'en-CA',{month:'short',day:'numeric'})+' – '+end.toLocaleDateString((window.KA_locale&&window.KA_locale()==='fr')?'fr-CA':'en-CA',{month:'short',day:'numeric',year:'numeric'});document.querySelectorAll('[data-week]').forEach(function(el){el.value=v[el.dataset.week]||''})}
document.querySelectorAll('[data-week]').forEach(function(el){el.addEventListener('input',function(){var key=weekStartKey(weekSelected);data.weeks=data.weeks||{};data.weeks[key]=data.weeks[key]||{};data.weeks[key][el.dataset.week]=el.value;save()})});
$('weekdate').addEventListener('change',function(){loadWeek(this.value)});
function moveWeek(offset){var d=isoDate(weekSelected);d.setDate(d.getDate()+offset);loadWeek(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))}
$('weekprev').onclick=function(){moveWeek(-7)};$('weeknext').onclick=function(){moveWeek(7)};
function progress(){var entry=data.days[selected]||{};var fields=['focus','oneaction','priorities','discipline','review'];var count=fields.filter(function(key){return String(entry[key]||'').trim().length>0}).length;$('daily-progress').textContent=count+' of 5 essentials filled'}
document.querySelectorAll('[data-day]').forEach(function(el){el.addEventListener('input',progress)});
var origSetDay=setDay;setDay=function(s){origSetDay(s);progress()};
loadWeek(selected);progress();


/* Premium interactions: drawer, swipe, quick capture, guided offline conversation */
(function(){
var overlay=$('overlay'),sheets=['quick-sheet','coach-sheet','more-sheet'],activeSheet=null,restoreFocus=null;
function closeSheet(){sheets.forEach(function(id){$(id).hidden=true});overlay.hidden=true;document.body.classList.remove('sheet-open');activeSheet=null;if(restoreFocus&&typeof restoreFocus.focus==='function')restoreFocus.focus()}
function openSheet(id,trigger){restoreFocus=trigger||document.activeElement;closeSheet();restoreFocus=trigger||document.activeElement;activeSheet=$(id);activeSheet.hidden=false;overlay.hidden=false;document.body.classList.add('sheet-open');var focus=activeSheet.querySelector('textarea,button');if(focus)focus.focus()}
$('quick-add').onclick=function(){openSheet('quick-sheet',this)};
$('open-coach').onclick=function(){openSheet('coach-sheet',this)};
$('open-more').onclick=function(){openSheet('more-sheet',this)};
$('open-more-desktop').onclick=function(){openSheet('more-sheet',this)};
overlay.onclick=closeSheet;
document.querySelectorAll('.close-sheet').forEach(function(x){x.onclick=closeSheet});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&activeSheet){e.preventDefault();closeSheet()}if(e.key==='Tab'&&activeSheet){var focusable=Array.from(activeSheet.querySelectorAll('button,input,select,textarea')).filter(function(x){return !x.disabled&&x.offsetParent!==null});if(focusable.length){var first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}});
function syncNav(id){$('open-more-desktop').classList.toggle('active',!['daily','weekly','monthly','family-space','notes'].includes(id));document.querySelectorAll('.bottom-nav [data-go]').forEach(function(b){b.classList.toggle('on',b.dataset.go===id)});$('open-more').classList.toggle('on',['presets','activities','reminders','family-space','family','gifts','notes','settings'].includes(id))}
document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){showTab(b.dataset.go);syncNav(b.dataset.go)})});
document.querySelectorAll('[data-open-tab]').forEach(function(b){b.addEventListener('click',function(){var target=b.dataset.openTab;closeSheet();showTab(target);syncNav(target)})});
document.querySelectorAll('.toolbar [data-tab]').forEach(function(b){b.addEventListener('click',function(){syncNav(b.dataset.tab)})});
var prevShow=showTab;showTab=function(id){prevShow(id);syncNav(id)};
$('quick-save').onclick=function(){
var key=$('quick-kind').value,value=$('quick-text').value.trim();if(!value){$('quick-text').focus();return}
data.days[selected]=data.days[selected]||{};
if(['tasks','schedule','daynotes','prayer','gratitude'].includes(key)){data.days[selected][key]=[data.days[selected][key],value].filter(Boolean).join('\n')}
else data.days[selected][key]=value;
save();setDay(selected);$('quick-text').value='';closeSheet();
};
var energies=['','Recovery','Gentle','Steady','Focused','Energized'];
function loadEnergy(){var value=Number((data.days[selected]||{}).energy)||3;$('energy').value=value;$('energy-output').textContent=value+' / 5 · '+energies[value]}
$('energy').oninput=function(){var value=Number(this.value);data.days[selected]=data.days[selected]||{};data.days[selected].energy=value;save();loadEnergy()};
var baseSetDay=setDay;setDay=function(s){baseSetDay(s);loadEnergy()};
loadEnergy();
var guides={
focus:{field:'oneaction',question:'If you could complete just one meaningful action today, which would move your most important goal forward? Make it specific enough to finish.'},
discipline:{field:'discipline',question:'What small action can you practice consistently today, even if you do not feel motivated? Choose a realistic discipline.'},
review:{field:'review',question:'What did you complete today? What did you learn, and what will you change tomorrow?'}
};var currentGuide='focus';
function bubble(text,kind){var x=document.createElement('div');x.className='coach-bubble '+kind;x.textContent=text;$('coach-stream').appendChild(x);$('coach-stream').scrollTop=$('coach-stream').scrollHeight}
document.querySelectorAll('[data-guide]').forEach(function(b){b.onclick=function(){currentGuide=b.dataset.guide;bubble(guides[currentGuide].question,'bot');$('coach-response').value='';$('coach-response').focus()}});
$('coach-save').onclick=function(){var txt=$('coach-response').value.trim();if(!txt){$('coach-response').focus();return}var field=guides[currentGuide].field;data.days[selected]=data.days[selected]||{};data.days[selected][field]=txt;save();setDay(selected);bubble(txt,'me');bubble('Saved to your '+(field==='oneaction'?'most important action':field)+' for '+isoDate(selected).toLocaleDateString((window.KA_locale&&window.KA_locale()==='fr')?'fr-CA':'en-CA',{month:'short',day:'numeric'})+'. Progress happens through deliberate steps.','bot');$('coach-response').value=''};
var touchX=0,touchY=0;
$('daily').addEventListener('touchstart',function(e){if(activeSheet||e.touches.length!==1)return;var t=e.touches[0];touchX=t.clientX;touchY=t.clientY},{passive:true});
$('daily').addEventListener('touchend',function(e){if(activeSheet||!touchX||e.changedTouches.length!==1)return;var target=e.target;if(target.closest('input,textarea,select,button')){touchX=0;return}var t=e.changedTouches[0],dx=t.clientX-touchX,dy=t.clientY-touchY;touchX=0;if(Math.abs(dx)>85&&Math.abs(dy)<60){var d=isoDate(selected);d.setDate(d.getDate()+(dx<0?1:-1));var iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');setDay(iso)}},{passive:true});
})();


/* Local smart routine tracking, reusable activity templates and reminder checks. */
(function(){
var status=$('reminder-capability'),activeSession=null;
function h(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]})}
function normalized(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,' ')}
function duration(name){var k=normalized(name),xs=data.sessions.filter(function(x){return normalized(x.name)===k&&Number(x.minutes)>0}).slice(-12);if(!xs.length)return null;return {average:Math.round(xs.reduce(function(a,x){return a+Number(x.minutes)},0)/xs.length),count:xs.length}}
function allActivityNames(){var entries=new Set((data.activities||[]).map(function(x){return x.name}));data.sessions.forEach(function(x){entries.add(x.name)});return Array.from(entries).filter(Boolean)}
var sessionEditIndex=-1;
$('session-edit-save').onclick=function(){
var x=data.sessions[sessionEditIndex],name=$('session-edit-name').value.trim(),minutes=Number($('session-edit-minutes').value);
if(!x)return;
if(!name||!Number.isFinite(minutes)||minutes<1||minutes>1440){alert('Enter an activity name and a duration between 1 and 1440 minutes.');return}
x.name=name;x.minutes=Math.round(minutes);save();sessionEditIndex=-1;$('session-editor').hidden=true;redrawActivities();
};
$('session-edit-cancel').onclick=function(){sessionEditIndex=-1;$('session-editor').hidden=true};
function redrawActivities(){
var name=$('activity-name').value.trim(),estimate=duration(name);$('activity-estimate').textContent=name?(estimate?'Based on '+estimate.count+' recorded session'+(estimate.count>1?'s':'')+': typically '+estimate.average+' min.':'No sessions yet. Complete one to start learning.'):'Enter an activity to see its suggested duration.';
$('activity-library').innerHTML='';allActivityNames().forEach(function(n){var x=duration(n),el=document.createElement('div');el.className='smart-item';el.innerHTML='<div><b>'+h(n)+'</b><small>'+(x?x.average+' min average · '+x.count+' completed':'No recorded sessions')+'</small></div><button type="button">Use again</button>';el.querySelector('button').onclick=function(){$('activity-name').value=n;$('activity-minutes').value=x?x.average:30;redrawActivities()};$('activity-library').appendChild(el)});
if(!allActivityNames().length)$('activity-library').innerHTML='<p class="hint">No activities yet. Start a session above.</p>';
$('activity-history').innerHTML='';data.sessions.slice(-8).reverse().forEach(function(x){var el=document.createElement('div');el.className='smart-item';el.innerHTML='<div><b>'+h(x.name)+'</b><small>'+Math.round(x.minutes)+' min · '+new Date(x.finished).toLocaleDateString()+'</small></div><button type="button" data-session-copy>Copy</button><button type="button" data-session-edit>Edit</button><button type="button" data-session-delete>Delete</button>';
el.querySelector('[data-session-copy]').onclick=function(){copyActivity(x.name,Math.round(x.minutes))};
el.querySelector('[data-session-edit]').onclick=function(){sessionEditIndex=data.sessions.indexOf(x);$('session-edit-name').value=x.name;$('session-edit-minutes').value=Math.round(x.minutes);$('session-editor').hidden=false;$('session-editor').scrollIntoView({behavior:'smooth',block:'nearest'})};
el.querySelector('[data-session-delete]').onclick=function(){if(!confirm('Delete this recorded session? This also changes its learned average duration.'))return;var at=data.sessions.indexOf(x);if(at<0)return;data.sessions.splice(at,1);save();redrawActivities();$('session-editor').hidden=true;sessionEditIndex=-1};
$('activity-history').appendChild(el)});
if(!data.sessions.length)$('activity-history').innerHTML='<p class="hint">Your completed sessions appear here.</p>';
activeSession=data.activeSession||null;$('activity-stop').disabled=!activeSession;
$('activity-running').textContent=activeSession?'Tracking '+activeSession.name+' since '+new Date(activeSession.started).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'. Return here to finish.':'';
}
function copyActivity(name,min){var line=name+' — '+min+' min';data.days[selected]=data.days[selected]||{};data.days[selected].schedule=[data.days[selected].schedule,line].filter(Boolean).join('\n');save();setDay(selected);$('activity-estimate').textContent='Added "'+name+'" to '+selected+' schedule.'}
$('activity-name').addEventListener('input',function(){var v=duration(this.value);if(v)$('activity-minutes').value=v.average;redrawActivities()});
$('activity-start').onclick=function(){var name=$('activity-name').value.trim();if(!name){$('activity-name').focus();return}if(data.activeSession&&!confirm('Replace your currently running session?'))return;var minutes=Math.max(1,Math.min(1440,Number($('activity-minutes').value)||30));if(!data.activities.some(function(x){return normalized(x.name)===normalized(name)}))data.activities.push({name:name});data.activeSession={name:name,started:new Date().toISOString(),planned:minutes,outcomeId:$('activity-link').value||''};save();redrawActivities()};
$('activity-stop').onclick=function(){var sess=data.activeSession;if(!sess)return;var elapsed=(Date.now()-Date.parse(sess.started))/60000;if(elapsed<0||!Number.isFinite(elapsed)){alert('Session start time could not be read.');return}var minutes=Math.max(1,Math.round(elapsed));data.sessions.push({name:sess.name,minutes:minutes,started:sess.started,finished:new Date().toISOString(),outcomeId:sess.outcomeId||''});if(data.sessions.length>2000)data.sessions=data.sessions.slice(-2000);data.activeSession=null;save();redrawActivities()};
$('activity-copy').onclick=function(){var name=$('activity-name').value.trim();if(!name){$('activity-name').focus();return}var v=duration(name),minutes=v?v.average:Math.max(1,Number($('activity-minutes').value)||30);copyActivity(name,minutes)};
function setReminderDefault(){var date=new Date();date.setMinutes(date.getMinutes()+60);date.setSeconds(0,0);var local=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);if(!$('reminder-when').value)$('reminder-when').value=local}
function supported(){return 'Notification' in window&&window.isSecureContext}
function showCapability(){status.textContent=supported()?('Browser notification permission: '+Notification.permission+'. Alerts are checked while the agenda is open or when you reopen it. Closed-app background alerts require a future push service.'):'In-app reminders work when you open the agenda. This browser does not support permission-based notifications here. Reliable closed-app alerts require a push backend.'}
function redrawReminders(){var list=$('reminder-list');list.innerHTML='';var now=Date.now();data.reminders.slice().sort(function(a,b){return Date.parse(a.when)-Date.parse(b.when)}).forEach(function(item){var due=Date.parse(item.when)<=now,el=document.createElement('div');el.className='smart-item'+(due&&!item.done?' due':'');el.innerHTML='<div><b>'+h(item.name)+'</b><small>'+new Date(item.when).toLocaleString()+' · '+(item.done?'Completed':due?'Due / overdue':'Upcoming')+'</small></div><button type="button" data-done>'+ (item.done?'Reopen':'Done')+'</button><button type="button" data-delete>Delete</button>';el.querySelector('[data-done]').onclick=function(){item.done=!item.done;save();redrawReminders()};el.querySelector('[data-delete]').onclick=function(){data.reminders=data.reminders.filter(function(x){return x.id!==item.id});save();redrawReminders()};list.appendChild(el)});if(!data.reminders.length)list.innerHTML='<p class="hint">No reminders saved yet.</p>'}
$('reminder-add').onclick=function(){var name=$('reminder-name').value.trim(),when=$('reminder-when').value;if(!name){$('reminder-name').focus();return}if(!when||!Number.isFinite(Date.parse(when))){$('reminder-when').focus();return}data.reminders.push({id:String(Date.now())+Math.random().toString(36).slice(2),name:name,when:new Date(when).toISOString(),done:false,notified:false});save();$('reminder-name').value='';$('reminder-when').value='';setReminderDefault();redrawReminders();checkReminders()};
$('notify-permission').onclick=function(){if(!supported()){showCapability();return}Notification.requestPermission().then(showCapability).catch(showCapability)};
function checkReminders(){var now=Date.now(),changed=false;data.reminders.forEach(function(item){if(item.done||item.notified||Date.parse(item.when)>now)return;item.notified=true;changed=true;if(supported()&&Notification.permission==='granted'&&document.visibilityState==='visible'){try{new Notification('Kingdom Atmosphere · Reminder',{body:item.name,tag:item.id,icon:'./icon.svg'})}catch(e){}}});if(changed){save();redrawReminders();var pending=data.reminders.filter(function(x){return !x.done&&Date.parse(x.when)<=now}).length;status.textContent=pending+' reminder'+(pending===1?' is':'s are')+' due. Check the list below.'}}
var previousShowTab=showTab;showTab=function(id){previousShowTab(id);if(id==='activities')redrawActivities();if(id==='reminders'){redrawReminders();checkReminders();showCapability();}};
setReminderDefault();showCapability();redrawActivities();redrawReminders();checkReminders();setInterval(checkReminders,30000);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')checkReminders()});window.addEventListener('focus',checkReminders);
})();


/* Linked progress engine. Existing freeform writing and local records remain untouched. */
(function(){
var goalList=$('goal-list'),outcomeList=$('outcome-list'),actionList=$('daily-step-list');
function norm(t){return String(t||'').trim()}
function id(){return 'link-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function fmtDay(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function weekKey(s){var d=isoDate(s);d.setDate(d.getDate()-(d.getDay()+6)%7);return fmtDay(d)}
function textNode(parent,tag,txt,cls){var n=document.createElement(tag);if(cls)n.className=cls;n.textContent=txt;parent.appendChild(n);return n}
function makeLine(parent,obj,sub,canComplete,onChange,onDelete){var line=document.createElement('div');line.className='connected-item';if(canComplete){var cb=document.createElement('input');cb.type='checkbox';cb.checked=!!obj.done;cb.setAttribute('aria-label','Mark '+obj.name+' complete');cb.onchange=function(){obj.done=cb.checked;onChange()};line.appendChild(cb)}var copy=textNode(line,'div','', 'connected-copy'+(obj.done?' is-done':''));textNode(copy,'b',obj.name);if(sub)textNode(copy,'small',sub);var b=textNode(line,'button','Remove');b.type='button';b.setAttribute('aria-label','Remove '+obj.name);b.onclick=function(){if(confirm('Remove this entry?'))onDelete()};parent.appendChild(line)}
function options(select,items,defaultLabel,selectedValue){select.innerHTML='';var first=document.createElement('option');first.value='';first.textContent=defaultLabel;select.appendChild(first);items.forEach(function(x){var o=document.createElement('option');o.value=x.id;o.textContent=x.name;select.appendChild(o)});select.value=selectedValue||'';if(select.selectedIndex<0)select.value=''}
function weekOutcomes(date){return data.linkedOutcomes.filter(function(x){return x.week===weekKey(date)})}
function thisWeek(){return weekKey(weekSelected||selected)}
function renderGoals(){goalList.innerHTML='';data.linkedGoals.filter(function(g){return Number(g.year||2027)===Number(calendarYear)}).forEach(function(g){var count=data.linkedOutcomes.filter(function(o){return o.goalId===g.id&&o.done}).length;makeLine(goalList,g,count+' connected weekly outcomes completed',true,function(){save();refresh()},function(){data.linkedGoals=data.linkedGoals.filter(function(x){return x.id!==g.id});data.linkedOutcomes.forEach(function(o){if(o.goalId===g.id)o.goalId=''});save();refresh()})});if(!data.linkedGoals.some(function(g){return Number(g.year||2027)===Number(calendarYear)}))textNode(goalList,'p','Create your first yearly goal to connect weekly outcomes.','hint');options($('outcome-goal'),data.linkedGoals.filter(function(g){return Number(g.year||2027)===Number((weekSelected||selected).slice(0,4))}),'General progress',$('outcome-goal').value)}
function renderOutcomes(){outcomeList.innerHTML='';weekOutcomes(weekSelected).forEach(function(o){var g=data.linkedGoals.find(function(x){return x.id===o.goalId});var done=data.linkedActions.filter(function(x){return x.outcomeId===o.id&&x.done}).length;var total=data.linkedActions.filter(function(x){return x.outcomeId===o.id}).length;makeLine(outcomeList,o,(g?g.name+' · ':'')+done+'/'+total+' linked actions finished',true,function(){save();refresh()},function(){data.linkedOutcomes=data.linkedOutcomes.filter(function(x){return x.id!==o.id});data.linkedActions.forEach(function(x){if(x.outcomeId===o.id)x.outcomeId=''});save();refresh()})});if(!weekOutcomes(weekSelected).length)textNode(outcomeList,'p','Set one result for this week, then choose it on Today.','hint')}
function renderActions(){actionList.innerHTML='';data.linkedActions.filter(function(x){return x.date===selected}).forEach(function(a){var o=data.linkedOutcomes.find(function(x){return x.id===a.outcomeId});makeLine(actionList,a,o?'Supports: '+o.name:'Personal action',true,function(){save();refresh()},function(){data.linkedActions=data.linkedActions.filter(function(x){return x.id!==a.id});save();refresh()})});options($('daily-outcome'),weekOutcomes(selected),'Choose a weekly outcome (optional)',$('daily-outcome').value)}
function renderActivityLinks(){var select=$('activity-link');if(!select)return;options(select,weekOutcomes(selected),'Unlinked personal activity',select.value)}
function minutesLabel(n){return n>=60?Math.floor(n/60)+'h '+Math.round(n%60)+'m':Math.round(n)+'m'}
function renderDashboard(){
var key=weekKey(selected),outcomes=data.linkedOutcomes.filter(function(x){return x.week===key}),actions=data.linkedActions.filter(function(x){return weekKey(x.date)===key});
var sessionRows=data.sessions.filter(function(x){return x.finished&&weekKey(fmtDay(new Date(x.finished)))===key});
var mins=sessionRows.reduce(function(a,x){return a+(Number(x.minutes)||0)},0);
$('stat-goals').textContent=data.linkedGoals.filter(function(x){return !x.done&&Number(x.year||2027)===Number(selected.slice(0,4))}).length;
$('stat-outcomes').textContent=outcomes.filter(function(x){return x.done}).length+'/'+outcomes.length;
$('stat-actions').textContent=actions.filter(function(x){return x.done}).length+'/'+actions.length;
$('stat-minutes').textContent=minutesLabel(mins);
var linked=sessionRows.filter(function(x){return x.outcomeId&&outcomes.some(function(o){return o.id===x.outcomeId})}),linkedMins=linked.reduce(function(a,x){return a+(Number(x.minutes)||0)},0);
var report=!data.linkedGoals.length?'Start with a measurable annual goal.':!outcomes.length?'Break an annual goal into a weekly outcome.':!actions.length?'Turn a weekly outcome into one daily action.':!sessionRows.length?'Record an activity to see time spent alongside completed actions.':'This week: '+linked.length+' tracked sessions directly support weekly outcomes ('+minutesLabel(linkedMins)+').';
$('progress-insight').textContent=report;
var detail=$('progress-expanded');detail.replaceChildren();textNode(detail,'p','Weekly time logged: '+minutesLabel(mins)+' across '+sessionRows.length+' sessions.');textNode(detail,'p','Linked outcome time: '+minutesLabel(linkedMins)+'.');textNode(detail,'small','Completion is based on what you manually mark finished. Time totals come from recorded sessions, not AI estimates.');
}
function refresh(){renderGoals();renderOutcomes();renderActions();renderActivityLinks();renderDashboard()}
$('goal-add').onclick=function(){var name=norm($('goal-name').value);if(!name){$('goal-name').focus();return}data.linkedGoals.push({id:id(),name:name,year:Number(calendarYear),done:false});$('goal-name').value='';save();refresh()};
$('outcome-add').onclick=function(){var name=norm($('outcome-name').value);if(!name){$('outcome-name').focus();return}data.linkedOutcomes.push({id:id(),name:name,goalId:$('outcome-goal').value,week:thisWeek(),done:false});$('outcome-name').value='';save();refresh()};
$('daily-step-add').onclick=function(){var name=norm($('daily-step').value);if(!name){$('daily-step').focus();return}data.linkedActions.push({id:id(),name:name,outcomeId:$('daily-outcome').value,date:selected,done:false});data.days[selected]=data.days[selected]||{};if(!norm(data.days[selected].oneaction)){data.days[selected].oneaction=name;setDay(selected)}$('daily-step').value='';save();refresh()};
$('progress-details').onclick=function(){var x=$('progress-expanded');x.hidden=!x.hidden;this.textContent=x.hidden?'View progress':'Hide details'};
var oldDay=setDay;setDay=function(s){oldDay(s);renderActions();renderActivityLinks();renderDashboard()};
var oldWeek=loadWeek;loadWeek=function(s){oldWeek(s);renderOutcomes()};
var oldShow=showTab;showTab=function(section){oldShow(section);refresh()};
document.querySelectorAll('[data-week]').forEach(function(el){el.addEventListener('change',refresh)});
$('activity-stop').addEventListener('click',function(){refresh()});
$('activity-start').addEventListener('click',function(){refresh()});
$('activity-link').addEventListener('change',function(){var active=data.activeSession;if(active){active.outcomeId=this.value;save()}});
refresh();
})();


/* Multi-year dates + weekly reality review */
(function(){
function dateText(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function yearOK(n){return Number.isInteger(n)&&n>=1900&&n<=2200}
function weekOf(s){var d=isoDate(s);d.setDate(d.getDate()-(d.getDay()+6)%7);return dateText(d)}
for(var mi=0;mi<12;mi++){var legacy=String(mi),fresh='2027-'+String(mi+1).padStart(2,'0');if(Object.prototype.hasOwnProperty.call(data.months,legacy)){if(!data.months[fresh])data.months[fresh]=data.months[legacy];delete data.months[legacy];save()}}
function syncYear(y){calendarYear=y;$('yearpick').value=y;$('calendar-year').value=y;setMonth(month);if(typeof refresh==='function')refresh()}
function changeYear(y,moveDay){if(!yearOK(y)){alert('Please choose a year between 1900 and 2200.');syncYear(calendarYear);return}
if(moveDay){var m=selected.slice(5),candidate=y+'-'+m;var d=isoDate(candidate);if(!Number.isFinite(d.getTime())||d.getFullYear()!==y||d.getMonth()+1!==Number(m.slice(0,2)))candidate=y+'-02-28';selected=candidate;setDay(candidate);loadWeek(candidate)}
syncYear(y)}
$('yearpick').onchange=function(){changeYear(Number(this.value),true)};
$('calendar-year').onchange=function(){changeYear(Number(this.value),false)};
$('jump-today').onclick=function(){var today=dateText(new Date());selected=today;month=+today.slice(5,7)-1;setDay(today);loadWeek(today);syncYear(+today.slice(0,4));showTab('daily')};
var originalSetDay=setDay;setDay=function(s){originalSetDay(s);if(selected===s){try{localStorage.setItem('ka-agenda-last-date',s)}catch(e){}loadWeek(s);var y=Number(s.slice(0,4));if(calendarYear!==y){calendarYear=y;month=Number(s.slice(5,7))-1;syncYear(y)}if(typeof renderReview==='function')renderReview()}};
var originalLoadWeek=loadWeek;loadWeek=function(s){originalLoadWeek(s);renderReview()};
function formatReviewMinutes(total){total=Math.max(0,Math.round(Number(total)||0));return total>=60?Math.floor(total/60)+'h '+total%60+'m':total+'m'}
function renderReview(){
var key=weekOf(weekSelected||selected),outcomes=data.linkedOutcomes.filter(function(x){return x.week===key}),actions=data.linkedActions.filter(function(x){return x.date&&weekOf(x.date)===key}),sessions=data.sessions.filter(function(x){return x.finished&&Number.isFinite(Date.parse(x.finished))&&weekOf(dateText(new Date(x.finished)))===key});
var minutes=sessions.reduce(function(a,x){return a+(Number(x.minutes)||0)},0),ids=new Set(outcomes.map(function(x){return x.id})),linked=sessions.filter(function(x){return ids.has(x.outcomeId)}).reduce(function(a,x){return a+(Number(x.minutes)||0)},0);
var co=outcomes.filter(function(x){return x.done}).length,ca=actions.filter(function(x){return x.done}).length;
$('review-outcomes').textContent=co+'/'+outcomes.length;$('review-actions').textContent=ca+'/'+actions.length;$('review-minutes').textContent=formatReviewMinutes(minutes);$('review-linked').textContent=formatReviewMinutes(linked);
var info=$('review-insights');info.replaceChildren();function line(t){var p=document.createElement('p');p.textContent=t;info.appendChild(p)}
if(!outcomes.length)line('Choose a measurable weekly result to begin reviewing your progress.');
else{line(co+' of '+outcomes.length+' outcomes were marked complete ('+Math.round(co/outcomes.length*100)+'%).');line(ca+' of '+actions.length+' linked daily actions were completed.');line(minutes>0?formatReviewMinutes(linked)+' of '+formatReviewMinutes(minutes)+' tracked time was attached to your weekly outcomes.':'No tracked activity sessions this week yet.');}
var pending=outcomes.filter(function(x){return !x.done}),box=$('review-pending');box.replaceChildren();pending.forEach(function(x){var p=document.createElement('div');p.className='review-pending-line';p.textContent='Still open: '+x.name;box.appendChild(p)});$('carry-week').disabled=pending.length===0;
}
$('carry-week').onclick=function(){var key=weekOf(weekSelected||selected),open=data.linkedOutcomes.filter(function(x){return x.week===key&&!x.done});if(!open.length)return;var d=isoDate(key);d.setDate(d.getDate()+7);var next=dateText(d),existing=new Set(data.linkedOutcomes.filter(function(x){return x.week===next}).map(function(x){return x.name.toLowerCase()+'|'+x.goalId})),count=0;
open.forEach(function(x){var label=x.name.toLowerCase()+'|'+x.goalId;if(existing.has(label))return;data.linkedOutcomes.push({id:'carry-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:x.name,goalId:x.goalId,week:next,done:false});existing.add(label);count++});
if(count){save();loadWeek(next);renderReview();alert(count+' unfinished outcome(s) copied to the following week. The originals remain unchanged.')}else alert('These outcomes are already present next week.');};
/* Weekly review is self-contained; the progress engine's refresh() lives in another module. */
var now=new Date(),today=dateText(now);
selected=today;weekSelected=today;calendarYear=now.getFullYear();month=now.getMonth();setDay(today);loadWeek(today);syncYear(calendarYear);renderReview();
function updateTodayIndicator(){var d=new Date(),label=d.toLocaleDateString((window.KA_locale&&window.KA_locale()==='fr')?'fr-CA':'en-CA',{weekday:'short',month:'short',day:'numeric',year:'numeric'});$('today-indicator').textContent='Today · '+label}
updateTodayIndicator();
var lastRealDate=dateText(new Date());
function checkRealDay(){var current=dateText(new Date());if(current===lastRealDate)return;var wasToday=selected===lastRealDate;lastRealDate=current;updateTodayIndicator();if(wasToday){selected=current;month=Number(current.slice(5,7))-1;setDay(current);loadWeek(current);syncYear(Number(current.slice(0,4)))}else{setMonth(month)}}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')checkRealDay()});
window.addEventListener('focus',checkRealDay);
setInterval(checkRealDay,60000);
})();


/* Journal presentation is owned by journal-controller.js; app.js owns [data-day] persistence. */

if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(function(e){console.warn('Offline installation unavailable',e)});
var installPrompt;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();installPrompt=e;var b=document.getElementById('install-btn');if(b)b.style.display='inline-block'});document.getElementById('install-btn').addEventListener('click',function(){if(installPrompt){installPrompt.prompt();installPrompt=null;this.style.display='none'}});
})();
