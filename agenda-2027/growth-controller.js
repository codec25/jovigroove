/* Kingdom Atmosphere — independent whole-life growth controller, offline local storage. */
(function(){
'use strict';
var KEY='ka-whole-life-growth-v1';
var CATEGORIES=[
{id:'spiritual',label:'Spiritual',mark:'✦',desc:'Stay rooted in faith and put love into action.',prompt:'Peace grows when I create room for prayer, reflection and truth.',suggestions:['Read and reflect on Scripture for 10 minutes','Pray for someone by name','Practice patience, forgiveness or kindness today','Serve someone without seeking recognition']},
{id:'emotional',label:'Emotional',mark:'♡',desc:'Practice awareness, peace and emotional maturity.',prompt:'I can respond with peace rather than react from pressure.',suggestions:['Pause, breathe and reflect before a difficult response','Journal about what I am feeling and why','Choose one boundary that protects healthy peace','Apologize or release an unnecessary conflict']},
{id:'relationships',label:'Relationships',mark:'☏',desc:'Care for the people God has placed in your life.',prompt:'A thoughtful message or phone call can strengthen a relationship.',suggestions:['Call a family member or friend to ask how they are','Send an encouraging message to someone','Listen attentively without rushing to respond','Plan meaningful time with someone important']},
{id:'personal',label:'Personal',mark:'◈',desc:'Develop character, learning, physical well-being and discipline.',prompt:'Small consistent improvements become meaningful growth.',suggestions:['Spend 20 minutes learning a useful skill','Move my body or take a restorative walk','Complete one difficult task I have postponed','Read and apply one lesson to my life']},
{id:'financial',label:'Financial',mark:'$',desc:'Practice wisdom, generosity and stewardship with money.',prompt:'Healthy financial habits are built one intentional decision at a time.',suggestions:['Review today’s spending and record my expenses','Set aside a small amount toward savings','Check my weekly budget before buying anything','Identify one unnecessary expense I can reduce']}
];
var active='personal',dialog=null,lastTrigger=null;
/* Keep an actually usable dialog height, independent of iOS dialog sizing rules. */
function adjustGrowthViewport(){
 if(!dialog||!dialog.open)return;
 var v=window.visualViewport;
 var full=Math.max(320,window.innerHeight||document.documentElement.clientHeight||650);
 var visible=v&&v.height?v.height:full;
 var focused=document.activeElement&&dialog.contains(document.activeElement)&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName||'');
 var keyboard=!!focused&&!!v&&visible<full-125;
 var available=keyboard?visible:full;
 var desired=Math.max(280,Math.floor(available*(keyboard?1:.88)));
 var offset=keyboard&&v?Math.max(0,Math.round(v.offsetTop||0)):0;
 dialog.classList.toggle('growth-keyboard',keyboard);
 dialog.style.setProperty('display','flex','important');
 dialog.style.setProperty('position','fixed','important');
 dialog.style.setProperty('height',desired+'px','important');
 dialog.style.setProperty('min-height',desired+'px','important');
 dialog.style.setProperty('max-height',desired+'px','important');
 dialog.style.setProperty('top',keyboard?offset+'px':'auto','important');
 dialog.style.setProperty('bottom',keyboard?'auto':'0px','important');
 dialog.style.setProperty('left','0px','important');
 dialog.style.setProperty('right','0px','important');
 dialog.style.setProperty('margin','0 auto','important');
 // An iOS in-app browser may still compress a dialog after showModal().
 var current=dialog.getBoundingClientRect();
 if(!keyboard&&current.height<desired*.8){
  dialog.style.setProperty('min-block-size',desired+'px','important');
  dialog.style.setProperty('block-size',desired+'px','important');
 }
}
function clearGrowthViewport(){
 if(!dialog)return;
 dialog.classList.remove('growth-keyboard');
 ['display','position','height','min-height','max-height','top','bottom','left','right','margin','min-block-size','block-size'].forEach(function(prop){dialog.style.removeProperty(prop)});
}
function keepGrowthFieldVisible(target){
 if(!dialog||!dialog.open||!target||!dialog.contains(target))return;
 requestAnimationFrame(function(){
  var scroll=dialog.querySelector('.growth-content');if(!scroll)return;
  var field=target.getBoundingClientRect(),space=scroll.getBoundingClientRect();
  if(field.bottom>space.bottom-14)scroll.scrollTop+=field.bottom-space.bottom+22;
  if(field.top<space.top+12)scroll.scrollTop-=space.top-field.top+18;
 });
}

function $(id){return document.getElementById(id)}
function day(){var input=$('datepick');if(input&&/^\d{4}-\d{2}-\d{2}$/.test(input.value))return input.value;var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function load(){try{var value=JSON.parse(localStorage.getItem(KEY)||'null');return value&&typeof value==='object'?value:{days:{},weeks:{}}}catch(err){return {days:{},weeks:{}}}}
function save(obj){try{localStorage.setItem(KEY,JSON.stringify(obj));if($('growth-save-status'))$('growth-save-status').textContent='Saved on this device'}catch(err){if($('growth-save-status'))$('growth-save-status').textContent='Unable to save — check storage'}}
function week(s){var d=new Date(s+'T12:00:00');d.setDate(d.getDate()-(d.getDay()+6)%7);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function entry(category){var db=load();return db.days&&db.days[day()]&&db.days[day()][category]||{action:'',notes:'',done:false}}
function selectedCategory(){return CATEGORIES.find(function(x){return x.id===active})||CATEGORIES[0]}
function render(){
var cat=selectedCategory(),v=entry(active);
$('growth-icon').textContent=cat.mark;$('growth-category-title').textContent=cat.label;$('growth-category-desc').textContent=cat.desc;$('growth-gentle').textContent=cat.prompt;
var opts=$('growth-suggestions');opts.replaceChildren();var first=document.createElement('option');first.value='';first.textContent='Choose a gentle suggestion (optional)';opts.appendChild(first);
cat.suggestions.forEach(function(x){var option=document.createElement('option');option.value=x;option.textContent=x;opts.appendChild(option)});
$('growth-action').value=v.action||'';$('growth-notes').value=v.notes||'';$('growth-done').checked=!!v.done;
document.querySelectorAll('#growth-category-nav button').forEach(function(x){x.setAttribute('aria-selected',String(x.dataset.category===active))});
}
function storeEntry(){
var db=load(),date=day();db.days=db.days||{};db.days[date]=db.days[date]||{};
db.days[date][active]={action:$('growth-action').value,notes:$('growth-notes').value,done:$('growth-done').checked};
save(db);renderPreview();renderWeek();
}
function renderPreview(){
var data=load(),items=data.days&&data.days[day()]||{};
var planned=0,done=0;CATEGORIES.forEach(function(x){var a=items[x.id];if(a&&String(a.action||'').trim()){planned++;if(a.done)done++}});
var node=$('growth-preview');if(node){
var nudges=['Find a quiet moment to reconnect with God.','Protect your peace: reflect before reacting.','Consider calling someone you care about today.','Take one small step toward becoming who you want to be.','Review one spending decision with intention.'];
var idx=day().split('-').reduce(function(n,x){return n+Number(x)},0)%nudges.length;
node.textContent=planned?done+' of '+planned+' chosen actions completed today.':nudges[idx];
}
}
function renderWeek(){
var node=$('growth-week-summary');if(!node)return;
var db=load(),chosen=$('weekdate')&&$('weekdate').value||day(),target=week(chosen),counts={};
CATEGORIES.forEach(function(cat){counts[cat.id]={planned:0,done:0}});
Object.keys(db.days||{}).forEach(function(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||week(date)!==target)return;
CATEGORIES.forEach(function(cat){var x=db.days[date][cat.id];if(x&&String(x.action||'').trim()){counts[cat.id].planned++;if(x.done)counts[cat.id].done++}})});
node.replaceChildren();CATEGORIES.forEach(function(cat){var row=document.createElement('div'),num=document.createElement('strong'),label=document.createElement('small');num.textContent=counts[cat.id].done+'/'+counts[cat.id].planned;label.textContent=cat.label;row.appendChild(num);row.appendChild(label);node.appendChild(row)});
var reflection=$('growth-week-reflection');if(reflection){var wk=(db.weeks||{})[target];if(document.activeElement!==reflection)reflection.value=wk&&wk.reflection||''}
}
function open(trigger){
dialog=$('growth-dialog');lastTrigger=trigger;active='personal';render();
if(typeof dialog.showModal==='function'&&!dialog.open){try{dialog.showModal()}catch(e){dialog.setAttribute('open','')}}
else dialog.setAttribute('open','');
adjustGrowthViewport();requestAnimationFrame(adjustGrowthViewport);setTimeout(adjustGrowthViewport,100);
}
function close(){if(!dialog)return;if(document.activeElement&&dialog.contains(document.activeElement))document.activeElement.blur();if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open');clearGrowthViewport();if(lastTrigger&&lastTrigger.isConnected)lastTrigger.focus({preventScroll:true});renderPreview()}
function init(){
var btn=$('growth-open'),modal=$('growth-dialog');if(!btn||!modal)return;
var nav=$('growth-category-nav');CATEGORIES.forEach(function(cat){var b=document.createElement('button');b.type='button';b.dataset.category=cat.id;b.textContent=cat.label;b.setAttribute('role','tab');b.onclick=function(){active=cat.id;render()};nav.appendChild(b)});
btn.onclick=function(){open(btn)};$('growth-close').onclick=close;$('growth-done-button').onclick=close;
modal.addEventListener('focusin',function(e){adjustGrowthViewport();setTimeout(function(){adjustGrowthViewport();keepGrowthFieldVisible(e.target)},150)});
modal.addEventListener('focusout',function(){setTimeout(adjustGrowthViewport,120)});
modal.addEventListener('close',clearGrowthViewport);
if(window.visualViewport){
 window.visualViewport.addEventListener('resize',function(){adjustGrowthViewport();keepGrowthFieldVisible(document.activeElement)});
 window.visualViewport.addEventListener('scroll',adjustGrowthViewport);
}
window.addEventListener('orientationchange',function(){setTimeout(adjustGrowthViewport,180)});

$('growth-suggestions').onchange=function(){if(this.value){$('growth-action').value=this.value;storeEntry()}};
['growth-action','growth-notes','growth-done'].forEach(function(id){$(id).addEventListener(id==='growth-done'?'change':'input',storeEntry)});
modal.addEventListener('click',function(e){if(e.target===modal)close()});
var weekly=$('growth-week-reflection');if(weekly){weekly.addEventListener('input',function(){var db=load(),k=week($('weekdate').value||day());db.weeks=db.weeks||{};db.weeks[k]={reflection:weekly.value};save(db)})}
document.addEventListener('change',function(e){if(e.target&&['datepick','weekdate','yearpick'].includes(e.target.id)){renderPreview();renderWeek()}},true);
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#prev,#next,#weekprev,#weeknext,#jump-today,.bottom-nav [data-go="weekly"]'))setTimeout(function(){renderPreview();renderWeek()},0)},true);
window.addEventListener('pageshow',function(){renderPreview();renderWeek()});
renderPreview();renderWeek();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.KingdomGrowthSelfTest=function(){return {categories:CATEGORIES.length,dialog:!!$('growth-dialog'),daily:!!$('growth-open'),weekly:!!$('growth-week-summary')}}; 
})();