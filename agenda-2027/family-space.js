/* Kingdom Atmosphere / Family Space
   One locally stored family workspace, isolated from the personal agenda.
   Snapshot transfer is manual. This module does NOT claim live cross-device sync. */
(function(){
'use strict';
const KEY='ka-family-space-v1', KIND='KingdomAtmosphereFamilySpace';
const TYPES=['groceries','tasks','events','moments'];
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const localDay=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dateObj=s=>new Date(s+'T12:00:00');
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!Number.isNaN(dateObj(s).getTime());
const uid=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2,9);
let data,editing=null,activeTab='groceries';
function blank(){return {version:1,groceries:[],tasks:[],events:[],moments:[],history:[]}}
function read(){
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!saved||typeof saved!=='object'||Array.isArray(saved))return blank();
  const result=blank();for(const type of TYPES.concat('history'))result[type]=Array.isArray(saved[type])?saved[type].filter(v=>v&&typeof v==='object'&&!Array.isArray(v)).slice(0,3000):[];
  return result
 }catch(e){return blank()}
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(data));return true}
 catch(e){const label=$('family-transfer-status');if(label)label.textContent='Unable to save family data. Please check your browser storage.';return false}
}
function add(type,value){const now=Date.now();data[type].push(Object.assign({id:uid(),createdAt:now,updatedAt:now,deleted:false},value));save();render()}
function update(type,id,changes){const row=data[type].find(v=>v.id===id&&!v.deleted);if(!row)return;Object.assign(row,changes,{updatedAt:Date.now()});save();render()}
function remove(type,id){update(type,id,{deleted:true})}
function active(type){return data[type].filter(x=>!x.deleted)}
function showTab(name){
 if(!['groceries','tasks','calendar','moments'].includes(name))return;
 activeTab=name;
 document.querySelectorAll('[data-family-tab]').forEach(b=>{const on=b.dataset.familyTab===name;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1});
 document.querySelectorAll('[data-family-panel]').forEach(p=>p.hidden=p.dataset.familyPanel!==name);
}
function btn(label,fn,cls){const b=make('button',cls||'family-row-action',label);b.type='button';b.addEventListener('click',fn);return b}
function card(type,item,headline,sub,actions,checked){
 const row=make('article','family-item'+(checked?' is-done':''));row.dataset.familyId=item.id;
 const copy=make('div','family-item-copy');copy.appendChild(make('strong','',headline));if(sub)copy.appendChild(make('small','',sub));row.appendChild(copy);
 const buttons=make('div','family-item-actions');actions.forEach(a=>buttons.appendChild(btn(a.text,a.act,a.cls)));row.appendChild(buttons);
 return row;
}
function editStart(type,item){
 editing={type,id:item.id};
 if(type==='groceries'){
  $('family-grocery-name').value=item.name||'';$('family-grocery-quantity').value=item.qty||'';
 }else if(type==='tasks'){
  $('family-task-name').value=item.name||'';$('family-task-assignee').value=item.assignee||'';
  $('family-task-date').value=item.date||'';$('family-task-repeat').value=item.repeat||'none';
 }else if(type==='events'){
  $('family-event-name').value=item.name||'';$('family-event-date').value=item.date||'';
  $('family-event-time').value=item.time||'';$('family-event-repeat').value=item.repeat||'none';
 }else if(type==='moments'){
  $('family-moment-kind').value=item.kind||'appreciation';$('family-moment-text').value=item.text||'';
 }
 const input={groceries:'family-grocery-name',tasks:'family-task-name',events:'family-event-name',moments:'family-moment-text'}[type];
 const button={groceries:'#family-grocery-form',tasks:'#family-task-form',events:'#family-event-form',moments:'#family-moment-form'}[type];
 const form=document.querySelector(button),submit=form.querySelector('button[type="submit"]');
 submit.textContent='Save changes';
 let cancel=form.querySelector('[data-family-cancel]');
 if(!cancel){cancel=btn('Cancel',cancelEdit,'family-cancel-button');cancel.dataset.familyCancel='true';submit.insertAdjacentElement('afterend',cancel)}
 $('family-space').scrollIntoView({behavior:'smooth',block:'start'});
 $(input).focus({preventScroll:true});
}
function cancelEdit(){
 editing=null;
 for(const type of TYPES){
  const id={groceries:'family-grocery-form',tasks:'family-task-form',events:'family-event-form',moments:'family-moment-form'}[type],form=$(id);
  if(!form)continue;
  form.reset();const submit=form.querySelector('button[type="submit"]');
  if(submit)submit.textContent={groceries:'Add',tasks:'Add responsibility',events:'Add to family calendar',moments:'Save family moment'}[type];
  const cancel=form.querySelector('[data-family-cancel]');if(cancel)cancel.remove();
 }
 $('family-task-date').value=localDay();$('family-event-date').value=localDay();
}
function rememberGrocery(name,qty){
 const key=name.toLocaleLowerCase().trim(),item=data.history.find(x=>x.key===key);
 if(item){item.count=(Number(item.count)||0)+1;item.qty=qty||item.qty;item.updatedAt=Date.now()}
 else data.history.push({id:uid(),key:key,name:name,qty:qty||'',count:1,updatedAt:Date.now()});
 data.history=data.history.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,100);
}
function grocerySubmit(e){
 e.preventDefault();const name=$('family-grocery-name').value.trim(),qty=$('family-grocery-quantity').value.trim();if(!name)return;
 if(editing&&editing.type==='groceries'){update('groceries',editing.id,{name,qty});cancelEdit();return}
 const found=active('groceries').find(x=>x.name.toLocaleLowerCase()===name.toLocaleLowerCase());
 if(found){update('groceries',found.id,{done:false,qty:qty||found.qty});rememberGrocery(name,qty);save()}
 else{add('groceries',{name,qty,done:false});rememberGrocery(name,qty);save()}
 cancelEdit();render();
}
function renderGroceries(){
 const list=$('family-grocery-list');list.replaceChildren();
 const entries=active('groceries').sort((a,b)=>Number(a.done)-Number(b.done)||(b.updatedAt||0)-(a.updatedAt||0));
 const done=entries.filter(x=>x.done).length,total=entries.length;
 $('family-grocery-progress').textContent=total?done+' of '+total+' picked up':'Start with one thing your household needs.';
 const progress=Math.round(total?100*done/total:0),bar=$('family-progress-fill');
 bar.style.width=progress+'%';bar.parentElement.setAttribute('aria-valuenow',String(progress));
 for(const x of entries){
  const row=card('groceries',x,x.name,x.qty||'No quantity set',[
   {text:'Edit',act:()=>editStart('groceries',x)},
   {text:'Delete',act:()=>{if(confirm('Remove '+x.name+' from this list?'))remove('groceries',x.id)}}
  ],x.done);
  const check=make('input');check.type='checkbox';check.checked=!!x.done;check.setAttribute('aria-label','Purchased '+x.name);
  check.addEventListener('change',()=>update('groceries',x.id,{done:check.checked}));
  row.insertBefore(check,row.firstChild);list.appendChild(row);
 }
 if(!entries.length)list.appendChild(make('p','family-empty','Your grocery list is empty. Add your first item above.'));
 const suggestions=$('family-grocery-suggestions');suggestions.replaceChildren();
 const recent=data.history.filter(x=>x.name&&!entries.some(y=>y.name.toLowerCase()===x.name.toLowerCase())).sort((a,b)=>(b.count||0)-(a.count||0)).slice(0,8);
 for(const x of recent)suggestions.appendChild(btn('＋ '+x.name,()=>{add('groceries',{name:x.name,qty:x.qty||'',done:false});rememberGrocery(x.name,x.qty||'');save()},'family-suggestion'));
 if(!recent.length)suggestions.appendChild(make('span','family-empty','Items you add often will appear here.'));
}

/* Built-in household chore library. Uses exactly the existing tasks[] store. */
const CHORE_LIBRARY=[
 ['kitchen','Wash dishes','daily'],['kitchen','Load dishwasher','daily'],['kitchen','Unload dishwasher','daily'],
 ['kitchen','Wipe kitchen counters','daily'],['kitchen','Clean stovetop','weekly'],['kitchen','Clean fridge','weekly'],
 ['kitchen','Sweep kitchen floor','daily'],['kitchen','Mop kitchen floor','weekly'],['kitchen','Take out kitchen trash','weekly'],
 ['cleaning','Vacuum living room','weekly'],['cleaning','Dust furniture','weekly'],['cleaning','Mop floors','weekly'],
 ['cleaning','Clean windows','weekly'],['cleaning','Tidy shared spaces','daily'],['cleaning','Empty trash bins','weekly'],
 ['laundry','Sort laundry','weekly'],['laundry','Wash clothes','weekly'],['laundry','Fold clothes','weekly'],
 ['laundry','Put away clean clothes','weekly'],['laundry','Wash bedding','weekly'],['laundry','Wash towels','weekly'],
 ['bathroom','Clean bathroom sink','weekly'],['bathroom','Clean toilet','weekly'],['bathroom','Clean shower or bathtub','weekly'],
 ['bathroom','Wipe bathroom mirror','weekly'],['bathroom','Restock toilet paper','weekly'],
 ['bedroom','Make beds','daily'],['bedroom','Tidy bedroom','daily'],['bedroom','Change bed sheets','weekly'],
 ['bedroom','Organize closet','weekly'],
 ['outdoor','Water plants','daily'],['outdoor','Sweep entrance','weekly'],['outdoor','Take recycling out','weekly'],
 ['outdoor','Mow lawn','weekly'],['outdoor','Shovel snow','none'],
 ['family','Prepare family meal','daily'],['family','Set dining table','daily'],['family','Clear dining table','daily'],
 ['family','Make grocery list','weekly'],['family','Plan family meals','weekly'],['family','Feed pets','daily']
].map(([category,name,frequency])=>({category,name,frequency}));
function renderChoreCatalog(){
 const container=$('family-chore-choices');if(!container)return;container.replaceChildren();
 const category=$('family-chore-category').value,query=$('family-chore-search').value.trim().toLocaleLowerCase();
 const matches=CHORE_LIBRARY.filter(x=>(category==='all'||x.category===category)&&(!query||x.name.toLocaleLowerCase().includes(query)));
 for(const chore of matches){
  const b=btn('＋ '+chore.name,()=>addChore(chore),'family-chore-chip');
  b.setAttribute('aria-label','Add '+chore.name+' to family responsibilities');container.appendChild(b)
 }
 if(!matches.length)container.appendChild(make('p','family-empty','No matching chores. You can write a custom responsibility below.'));
}
function addChore(chore){
 const exists=active('tasks').find(x=>x.name.toLocaleLowerCase()===chore.name.toLocaleLowerCase()&&!x.done);
 if(exists){
  $('family-chore-feedback').textContent=chore.name+' is already on your list. Edit its assignment or date below.';
  return;
 }
 const date=$('family-task-date').value||localDay(),assignee=$('family-task-assignee').value.trim();
 // The selected task's repeat setting takes priority; otherwise use the template suggestion.
 const repeat=$('family-task-repeat').value!=='none'?'weekly':chore.frequency==='weekly'?'weekly':'none';
 add('tasks',{name:chore.name,assignee,date,repeat,category:chore.category,done:false,completedCount:0});
 $('family-chore-feedback').textContent='Added '+chore.name+'.'+(repeat==='weekly'?' Repeats weekly.':'')+' Assign or edit it below.';
}

function taskSubmit(e){
 e.preventDefault();const name=$('family-task-name').value.trim();if(!name)return;
 const changes={name,assignee:$('family-task-assignee').value.trim(),date:$('family-task-date').value,repeat:$('family-task-repeat').value};
 if(editing&&editing.type==='tasks')update('tasks',editing.id,changes);else add('tasks',Object.assign({done:false,completedCount:0},changes));
 cancelEdit();
}
function taskToggle(x){
 if(x.repeat==='weekly'&&!x.done){
  const date=validDate(x.date)?dateObj(x.date):dateObj(localDay());date.setDate(date.getDate()+7);
  const next=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  update('tasks',x.id,{date:next,completedCount:(Number(x.completedCount)||0)+1,lastCompleted:localDay(),done:false});
 }else update('tasks',x.id,{done:!x.done});
}
function renderTasks(){
 const list=$('family-task-list');list.replaceChildren();
 const entries=active('tasks').sort((a,b)=>Number(a.done)-Number(b.done)||String(a.date||'9999').localeCompare(String(b.date||'9999')));
 for(const x of entries){
  const detail=[x.assignee?'For '+x.assignee:'Unassigned',x.date||'No due date',x.repeat==='weekly'?'Weekly':''].filter(Boolean).join(' · ');
  const row=card('tasks',x,x.name,detail,[
   {text:'Edit',act:()=>editStart('tasks',x)},{text:'Delete',act:()=>{if(confirm('Remove this responsibility?'))remove('tasks',x.id)}}
  ],x.done);
  const check=make('input');check.type='checkbox';check.checked=!!x.done;check.setAttribute('aria-label','Complete '+x.name);check.addEventListener('change',()=>taskToggle(x));row.insertBefore(check,row.firstChild);list.appendChild(row)
 }
 if(!entries.length)list.appendChild(make('p','family-empty','A small shared responsibility is a good place to start.'));
}
function eventSubmit(e){
 e.preventDefault();const name=$('family-event-name').value.trim(),date=$('family-event-date').value;if(!name||!validDate(date))return;
 const changes={name,date,time:$('family-event-time').value,repeat:$('family-event-repeat').value};
 if(editing&&editing.type==='events')update('events',editing.id,changes);else add('events',changes);
 cancelEdit();
}
function occurrence(x){
 if(!validDate(x.date))return '';
 if(x.repeat!=='yearly')return x.date;
 const today=localDay(),monthDay=x.date.slice(5);
 let next=today.slice(0,4)+'-'+monthDay;
 if(!validDate(next))next=(Number(today.slice(0,4))+1)+'-'+monthDay; // Leap day
 if(next<today)next=String(Number(today.slice(0,4))+1)+'-'+monthDay;
 if(!validDate(next))next=String(Number(today.slice(0,4))+4)+'-'+monthDay;
 return next;
}
function renderEvents(){
 const list=$('family-event-list');list.replaceChildren();
 const events=active('events').map(x=>({x,when:occurrence(x)})).sort((a,b)=>a.when.localeCompare(b.when));
 for(const {x,when} of events){
  const date=validDate(when)?dateObj(when).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}):'Date not set';
  const detail=[date,x.time||'',x.repeat==='yearly'?'Repeats yearly':''].filter(Boolean).join(' · ');
  const row=card('events',x,x.name,detail,[{text:'Edit',act:()=>editStart('events',x)},{text:'Delete',act:()=>{if(confirm('Remove this family event?'))remove('events',x.id)}}],false);list.appendChild(row)
 }
 if(!events.length)list.appendChild(make('p','family-empty','Create a family gathering, birthday or other important moment.'));
}
function momentSubmit(e){
 e.preventDefault();const text=$('family-moment-text').value.trim();if(!text)return;
 const values={text,kind:$('family-moment-kind').value};
 if(editing&&editing.type==='moments')update('moments',editing.id,values);else add('moments',values);
 cancelEdit();
}
function renderMoments(){
 const list=$('family-moment-list');list.replaceChildren();
 const name={appreciation:'Appreciation',prayer:'Family prayer',checkin:'Check-in',together:'Quality time'};
 for(const x of active('moments').sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))){
  const date=new Date(x.updatedAt||Date.now()).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'});
  const row=card('moments',x,name[x.kind]||'Family moment',date,[{text:'Edit',act:()=>editStart('moments',x)},{text:'Delete',act:()=>{if(confirm('Remove this family moment?'))remove('moments',x.id)}}],false);
  row.querySelector('.family-item-copy').appendChild(make('p','family-moment-content',x.text));
  list.appendChild(row)
 }
 if(!active('moments').length)list.appendChild(make('p','family-empty','A moment of appreciation or encouragement can bring people closer.'));
}
function render(){renderGroceries();renderTasks();renderEvents();renderMoments()}
function groceryText(){
 const items=active('groceries').sort((a,b)=>Number(a.done)-Number(b.done));
 return 'Family grocery list · Kingdom Atmosphere\n\n'+(items.length?items.map(x=>(x.done?'✓ ':'☐ ')+x.name+(x.qty?' · '+x.qty:'')).join('\n'):'No items yet.')+'\n\nShared as a snapshot. Updates do not synchronize automatically.';
}
async function shareGroceries(){
 const text=groceryText();
 try{
  if(navigator.share){await navigator.share({title:'Family grocery list',text});return}
  if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);alert('Grocery list copied. Paste it into Messages or WhatsApp.');return}
  alert('Sharing is unavailable in this browser. Use the family snapshot export instead.')
 }catch(e){if(e.name!=='AbortError')alert('Unable to share right now. Try again from Safari.')}
}
function downloadSnapshot(){
 const exportData=Object.assign({kind:KIND,exportedAt:new Date().toISOString()},data);
 const blob=new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download='Kingdom-Atmosphere-Family-'+localDay()+'.json';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),20000);
 $('family-transfer-status').textContent='Family snapshot exported. Share this file only with people you trust.';
}
async function importSnapshot(file){
 const status=$('family-transfer-status');
 if(!file)return;
 if(file.size>2*1024*1024){status.textContent='That file is too large. Maximum size is 2 MB.';return}
 let received;
 try{received=JSON.parse(await file.text())}catch(e){status.textContent='Invalid JSON file. Your existing data was not changed.';return}
 if(!received||received.kind!==KIND||received.version!==1||TYPES.some(type=>!Array.isArray(received[type]))){
  status.textContent='This is not a valid Kingdom Atmosphere Family Space snapshot. Your data is unchanged.';return
 }
 if(!confirm('Merge this family snapshot with information already saved on this device? Matching records use the latest update. Your private agenda will not be imported.'))return;
 const merged=read();
 for(const type of TYPES){
  const byId=new Map(merged[type].map(x=>[x.id,x]));
  for(const row of received[type].slice(0,3000)){
   if(!row||typeof row!=='object'||typeof row.id!=='string'||row.id.length>120)continue;
   const existing=byId.get(row.id);
   if(!existing||(Number(row.updatedAt)||0)>(Number(existing.updatedAt)||0))byId.set(row.id,row);
  }
  merged[type]=Array.from(byId.values()).slice(0,3000)
 }
 // Grocery suggestions are non-sensitive, but never import private agenda data.
 if(Array.isArray(received.history)){
  const prior=new Map(merged.history.map(x=>[x.key,x]));
  for(const x of received.history.slice(0,100))if(x&&typeof x.key==='string'&&!prior.has(x.key))prior.set(x.key,x);
  merged.history=Array.from(prior.values()).slice(0,100)
 }
 data=merged;
 if(save()){cancelEdit();render();status.textContent='Family snapshot merged on this device. Changes still do not synchronize automatically.'}
}
function init(){
 if(!$('family-space'))return;
 data=read();
 document.querySelectorAll('[data-family-tab]').forEach(b=>b.addEventListener('click',()=>{cancelEdit();showTab(b.dataset.familyTab)}));
 $('family-grocery-form').addEventListener('submit',grocerySubmit);
 $('family-task-form').addEventListener('submit',taskSubmit);
 $('family-chore-category').addEventListener('change',renderChoreCatalog);
 $('family-chore-search').addEventListener('input',renderChoreCatalog);
 renderChoreCatalog();
 $('family-event-form').addEventListener('submit',eventSubmit);
 $('family-moment-form').addEventListener('submit',momentSubmit);
 $('family-clear-bought').addEventListener('click',()=>{
  const purchased=active('groceries').filter(x=>x.done);
  if(!purchased.length)return;
  if(!confirm('Clear '+purchased.length+' purchased item(s)?'))return;
  const t=Date.now();purchased.forEach(x=>{x.deleted=true;x.updatedAt=t});save();render()
 });
 $('family-share-groceries').addEventListener('click',shareGroceries);
 $('family-export').addEventListener('click',downloadSnapshot);
 $('family-import').addEventListener('change',async e=>{await importSnapshot(e.target.files[0]);e.target.value=''});
 $('family-task-date').value=localDay();$('family-event-date').value=localDay();
 showTab(activeTab);render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.KingdomFamilySpace={getSnapshot:()=>JSON.parse(JSON.stringify(data||read())),getGroceryText:groceryText};
})();