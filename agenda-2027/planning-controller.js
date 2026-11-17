/* Kingdom Atmosphere — edit/delete/copy activities and duplicate day/week plans.
   Works on existing free-text schedule entries and optional structured preset bookings. */
(function(){
'use strict';
var MAIN='ka-2027-agenda-v1',PRESETS='ka-presets-v1';
var editable=null;
var PLAN_KEYS=['schedule','tasks','priorities','oneaction','focus','discipline'];
var JOURNAL_KEYS=['daynotes','reflection','prayer','gratitude','review'];
function $(id){return document.getElementById(id)}
function read(k){try{var d=JSON.parse(localStorage.getItem(k)||'null');return d&&typeof d==='object'?d:{}}catch(e){return {}}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){alert('Could not save changes. Export a backup before continuing.');return false}}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dateObj(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;var d=new Date(s+'T12:00:00');return !isNaN(d.getTime())&&iso(d)===s?d:null}
function shift(s,n){var d=dateObj(s);if(!d)return '';d.setDate(d.getDate()+n);return iso(d)}
function monday(s){var d=dateObj(s);if(!d)return '';d.setDate(d.getDate()-(d.getDay()+6)%7);return iso(d)}
function mins(s){if(!/^\d{2}:\d{2}$/.test(s||''))return NaN;var p=s.split(':').map(Number);return p[0]<24&&p[1]<60?p[0]*60+p[1]:NaN}
function fmt(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function parse(line){
 var t=String(line||'').trim(),x=t.match(/^([01]?\d|2[0-3]):([0-5]\d)\s*[–—-]\s*([01]?\d|2[0-3]):([0-5]\d)\s*[–—-]\s*(.+)$/);
 if(x){var a=+x[1]*60 + +x[2],b=+x[3]*60 + +x[4];if(b>a)return {name:x[5],start:fmt(a),end:fmt(b)}}
 x=t.match(/^([01]?\d|2[0-3]):([0-5]\d)\s*[–—-]\s*(.+?)\s+\(.*?,\s*(\d+)\s*min\)\s*$/i);
 if(x){var a=+x[1]*60 + +x[2],b=a+(+x[4]);if(b<1440&&b>a)return{name:x[3],start:fmt(a),end:fmt(b)}}
 return{name:t,start:'',end:''};
}
function entryLines(db,date){return String(((db.days||{})[date]||{}).schedule||'').split('\n').filter(x=>x.trim())}
function bookingData(){var d=read(PRESETS);d.bookings=Array.isArray(d.bookings)?d.bookings:[];return d}
function eventUpdate(days,weeks){document.dispatchEvent(new CustomEvent('kingdom:planningChanged',{detail:{days:days||{},weeks:weeks||{}}}))}
function render(){
 var date=$('preset-date').value||$('datepick').value,box=$('scheduled-activity-list');if(!box)return;
 var data=read(MAIN),lines=entryLines(data,date);box.replaceChildren();
 if(!lines.length){var none=document.createElement('p');none.className='hint';none.textContent='No activities scheduled on '+date+'. Add a preset or copy a previous activity.';box.appendChild(none);return}
 lines.forEach(function(line,index){
 var item=parse(line),row=document.createElement('article'),body=document.createElement('div');body.className='preset-main';
 var title=document.createElement('strong');title.textContent=item.name;body.appendChild(title);
 var hint=document.createElement('small');hint.textContent=item.start&&item.end?item.start+'–'+item.end:'Time not set';body.appendChild(hint);row.appendChild(body);
 [['Edit','edit'],['Copy','copy'],['Delete','delete']].forEach(function(pair){
 var button=document.createElement('button');button.type='button';button.textContent=pair[0];button.setAttribute('aria-label',pair[0]+' '+item.name);
 button.onclick=function(){if(pair[1]==='delete')erase(date,index,line);else openEditor(pair[1],date,index,line)};row.appendChild(button)
 });box.appendChild(row)
 });
}
function openEditor(mode,date,index,line){
 var parsed=parse(line);editable={mode:mode,date:date,index:index,original:line};
 $('planning-editor').hidden=false;
 $('edit-activity-name').value=parsed.name;
 $('edit-activity-date').value=mode==='copy'?$('datepick').value||date:date;
 $('edit-activity-start').value=parsed.start;
 $('edit-activity-end').value=parsed.end;
 $('edit-activity-save').textContent=mode==='copy'?'Copy activity':'Save changes';
 $('edit-activity-warning').textContent=mode==='copy'?'The original remains unchanged. Choose the destination date.':'Update the activity name, time or date.';
 $('planning-editor').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function closeEditor(){editable=null;$('planning-editor').hidden=true}
function collides(db,date,start,end,skip){
 if(!Number.isFinite(start)||!Number.isFinite(end))return [];
 return entryLines(db,date).flatMap(function(line,i){if(skip&&skip.date===date&&skip.index===i)return[];var t=parse(line),a=mins(t.start),b=mins(t.end);return Number.isFinite(a)&&Number.isFinite(b)&&start<b&&end>a?[t.name+' ('+t.start+'–'+t.end+')']:[]})
}
function normalizeLine(name,start,end){
 return start&&end?start+'–'+end+' — '+name:name;
}
function persistChanges(changed,bookings){
 var db=read(MAIN);db.days=db.days||{};
 Object.keys(changed).forEach(function(key){db.days[key]=changed[key]});
 if(!write(MAIN,db))return false;
 if(bookings)write(PRESETS,bookings);
 eventUpdate(changed);
 render();
 return true;
}
function erase(date,index,line){
 if(!confirm('Delete this scheduled activity?\n'+line+'\n\nYour saved preset will remain available.'))return;
 var db=read(MAIN),lines=entryLines(db,date);if(lines[index]!==line){alert('Schedule changed. Refresh and try again.');render();return}
 lines.splice(index,1);var replacement=Object.assign({},db.days[date],{schedule:lines.join('\n')});
 var presets=bookingData();presets.bookings=presets.bookings.filter(function(x){return !(x.date===date&&x.label===line)});
 if(persistChanges({[date]:replacement},presets))closeEditor();
}
function submitEditor(){
 if(!editable)return;
 var db=read(MAIN),from=editable.date,source=entryLines(db,from);
 if(source[editable.index]!==editable.original){alert('This activity was changed. Reopen it to edit.');closeEditor();render();return}
 var name=$('edit-activity-name').value.trim(),date=$('edit-activity-date').value,
 start=$('edit-activity-start').value,end=$('edit-activity-end').value;
 if(!name||!dateObj(date)){alert('Choose a name and valid date.');return}
 if(!!start!==!!end){alert('Provide both start and end times or leave both blank.');return}
 var a=mins(start),b=mins(end);
 if(start&&(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)){alert('End time must be after start time.');return}
 var skip=editable.mode==='edit'?{date:from,index:editable.index}:null;
 var conflicts=collides(db,date,a,b,skip);
 if(conflicts.length&&!confirm('This time overlaps:\n'+conflicts.join('\n')+'\n\nContinue anyway?'))return;
 var label=normalizeLine(name,start,end),newLines=entryLines(db,date),changed={},presets=bookingData();
 if(editable.mode==='edit'){
  source.splice(editable.index,1);
  changed[from]=Object.assign({},db.days[from],{schedule:source.join('\n')});
  if(date===from)newLines=source.slice();
  presets.bookings=presets.bookings.filter(function(x){return !(x.date===from&&x.label===editable.original)})
 }
 if(newLines.includes(label)&&!confirm('This exact activity is already on the destination day. Add another copy?'))return;
 newLines.push(label);changed[date]=Object.assign({},changed[date]||db.days[date]||{},{schedule:newLines.join('\n')});
 if(start){presets.bookings.push({id:'edited-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),date:date,name:name,start:start,end:end,minutes:b-a,label:label})}
 if(persistChanges(changed,presets))closeEditor();
}
function chosenPlan(source,mode){var out={};(mode==='all'?PLAN_KEYS.concat(JOURNAL_KEYS):PLAN_KEYS).forEach(function(k){if(source&&String(source[k]||'').trim())out[k]=source[k]});return out}
function mergeLines(original,added){var lines=String(original||'').split('\n').filter(Boolean);String(added||'').split('\n').filter(Boolean).forEach(function(line){if(!lines.includes(line))lines.push(line)});return lines.join('\n')}
function previewCopy(){
 var source=$('plan-source-date').value,target=$('plan-target-date').value,week=$('plan-copy-scope').value==='week';
 $('plan-copy-info').textContent=week?'Copy seven days starting Monday of each selected week. Existing target entries are kept; schedules and tasks are combined.':'Copy the selected day. Existing target entries are kept; schedules and tasks are combined.';
 if(!dateObj(source)||!dateObj(target))$('plan-copy-info').textContent='Choose two valid dates first.';
}
function copyPlan(){
 var start=$('plan-source-date').value,target=$('plan-target-date').value,scope=$('plan-copy-scope').value,mode=$('plan-copy-mode').value;
 if(!dateObj(start)||!dateObj(target)){alert('Choose valid source and destination dates.');return}
 var from=scope==='week'?monday(start):start,to=scope==='week'?monday(target):target,count=scope==='week'?7:1;
 if(from===to){alert('Choose a different destination date.');return}
 var db=read(MAIN),updates={},weekly={},matchedBookings=[],book=bookingData(),affected=0,conflicts=[];
 for(var i=0;i<count;i++){
 var src=shift(from,i),dst=shift(to,i),original=(db.days||{})[src],values=chosenPlan(original,mode);
 if(!Object.keys(values).length)continue;
 var destination=Object.assign({},(db.days||{})[dst]||{});
 Object.keys(values).forEach(function(k){
 if(['schedule','tasks','priorities'].includes(k))destination[k]=mergeLines(destination[k],values[k]);
 else if(!String(destination[k]||'').trim())destination[k]=values[k];
 });
 var existing=entryLines(db,dst);
 String(values.schedule||'').split('\n').forEach(function(l){var block=parse(l),a=mins(block.start),b=mins(block.end);if(Number.isFinite(a)&&Number.isFinite(b)){collides(db,dst,a,b).forEach(function(c){conflicts.push(dst+': '+block.name+' overlaps '+c)})}});
 updates[dst]=destination;affected++;
 (book.bookings||[]).filter(function(b){return b.date===src&&String(values.schedule||'').split('\n').includes(b.label)}).forEach(function(b){
 if(!book.bookings.some(function(x){return x.date===dst&&x.label===b.label})&&!matchedBookings.some(function(x){return x.date===dst&&x.label===b.label}))matchedBookings.push(Object.assign({},b,{id:'copied-'+Date.now()+'-'+i+'-'+Math.random().toString(36).slice(2,5),date:dst}))
 });
 }
 if(scope==='week'){
 var srcKey=monday(from),dstKey=monday(to),notes=(db.weeks||{})[srcKey];
 if(notes&&Object.keys(notes).length){weekly[dstKey]=Object.assign({},(db.weeks||{})[dstKey]||{});Object.keys(notes).forEach(function(key){if(!String(weekly[dstKey][key]||'').trim())weekly[dstKey][key]=notes[key]})}
 }
 if(!affected&&!Object.keys(weekly).length){alert('There is nothing planned on the source '+scope+'.');return}
 var message='Copy '+affected+' planned day(s)'+(Object.keys(weekly).length?' and weekly notes':'')+' into '+to+'?\n\nOriginal entries stay unchanged. Existing target notes stay intact; schedules/tasks are merged.';
 if(conflicts.length)message+='\n\nPossible overlaps:\n'+conflicts.slice(0,5).join('\n')+(conflicts.length>5?'\n…and more':'');
 if(!confirm(message))return;
 var latest=read(MAIN);latest.days=latest.days||{};latest.weeks=latest.weeks||{};
 Object.keys(updates).forEach(function(k){latest.days[k]=updates[k]});
 Object.keys(weekly).forEach(function(k){latest.weeks[k]=weekly[k]});
 if(!write(MAIN,latest))return;
 if(matchedBookings.length){book.bookings=book.bookings.concat(matchedBookings);write(PRESETS,book)}
 eventUpdate(updates,weekly);
 alert('Copied successfully to '+to+'. Your original plans remain unchanged.');
 render();
}
function init(){
 if(!$('scheduled-activity-list'))return;
 $('edit-activity-save').onclick=submitEditor;
 $('edit-activity-cancel').onclick=closeEditor;
 $('preset-date').addEventListener('change',render);
 $('plan-source-date').value=$('datepick').value||iso(new Date());
 $('plan-target-date').value=shift($('plan-source-date').value,1);
 ['plan-source-date','plan-target-date','plan-copy-scope','plan-copy-mode'].forEach(function(k){$(k).addEventListener('change',previewCopy)});
 $('plan-copy-apply').onclick=copyPlan;
 document.addEventListener('kingdom:presetScheduled',function(){setTimeout(render,0)});
 document.addEventListener('kingdom:planningChanged',function(){setTimeout(render,0)});
 document.addEventListener('change',function(e){if(e.target&&e.target.id==='datepick'){$('plan-source-date').value=e.target.value;render()}},true);
 document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#prev,#next,#jump-today'))setTimeout(function(){$('plan-source-date').value=$('datepick').value;render()},0)},true);
 previewCopy();render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.KingdomPlanningTest={parse:parse,collides:collides,chosenPlan:chosenPlan,mergeLines:mergeLines};
})();