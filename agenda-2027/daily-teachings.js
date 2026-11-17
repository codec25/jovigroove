/* Daily teachings are date-specific and separate from private journal entries.
   Built-in teachings ship with the app; future teachings created here remain local/offline. */
(function(){
'use strict';
const KEY='ka-agenda-daily-teachings-v1';
const $=id=>document.getElementById(id);
const BUILT_IN={
 '2026-11-17':{
  title:'Know the God You Trust',
  blocks:[
   ['p','You can listen to sermons and learn from others, but faith also grows as you discover God’s character through His Word and your own walk with Him. What you hear taught becomes something you learn to rely on in everyday life.'],
   ['p','In Mark 1:40–42, a man with leprosy approaches Jesus with a revealing request. “If you are willing, you can make me clean.” He believes Jesus has the power. His uncertainty concerns Jesus’ willingness to help him. Jesus answers, “I am willing,” reaches out, and touches him.'],
   ['p','We sometimes carry that same question. We know God is powerful, yet wonder whether He will receive us, whether we have done enough, or whether our situation matters to Him. First John 4:16 points us toward a foundation for trust. We come to know and rely on the love God has for us.'],
   ['p','Think of a frightened child who has broken something. When a trusted parent says, “I’m here. We’ll handle this together,” the child can begin to settle. There may still be consequences and something to repair, but the child knows they have someone to turn to.'],
   ['p','Knowing the Father’s love gives us that confidence to approach Him. Hebrews 4:16 invites us to come boldly to receive mercy and find grace in our time of need. We can bring our questions, failures, and requests honestly.'],
   ['p','As we pray, God’s peace can guard our hearts and minds while we wait for His answer (Philippians 4:6–7). We may still feel afraid. We may still have questions. We can bring those to Him too, remembering His faithfulness and trusting His wisdom with what comes next.'],
   ['action','Today, bring one concern to God. Read one of these passages slowly and ask yourself what it reveals about the Father you are approaching.'],
   ['prayer','Father, help me know and rely on Your love. Remind me of Your faithfulness, give me peace as I wait, and guide my next step. In Jesus’ name, amen.']
  ]
 }
};
function saved(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){return {}}}
function date(){return $('datepick')&&$('datepick').value||localDate()}
function localDate(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function byDate(d){const custom=saved()[d];return custom&&custom.title&&custom.body?{title:custom.title,body:custom.body,custom:true}:BUILT_IN[d]||null}
function pretty(d){const v=new Date(d+'T12:00:00');return Number.isFinite(v.getTime())?v.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'}):d}
function render(){
 if(!$('daily-teaching-card'))return;
 const d=date(),entry=byDate(d),present=!!entry;
 $('daily-teaching-date').textContent=pretty(d);
 $('daily-teaching-available').hidden=!present;
 $('daily-teaching-missing').hidden=present;
 if(present){
  $('daily-teaching-card-title').textContent=entry.title;
  const excerpt=entry.body||entry.blocks.find(x=>x[0]==='p')[1];
  $('daily-teaching-excerpt').textContent=excerpt.slice(0,170)+(excerpt.length>170?'…':'');
  $('daily-teaching-open').textContent='Read this teaching ↗';
 }
}
function renderContent(entry){
 const box=$('daily-teaching-content');box.replaceChildren();
 if(entry.body){
  entry.body.split(/\n\s*\n/).filter(Boolean).forEach(p=>{const el=document.createElement('p');el.textContent=p;box.appendChild(el)});
 }else{
  entry.blocks.forEach(([type,text])=>{
   const el=document.createElement('p');el.className=type==='action'?'teaching-action':type==='prayer'?'teaching-prayer':'';
   if(type==='p'&&text.includes('His uncertainty concerns Jesus’ willingness to help him.')){
    // Keep the author's emphasized word in the rendered passage, not only in plain text.
    const part='His uncertainty concerns Jesus’ willingness to help him.';
    const pieces=text.split(part);el.append(document.createTextNode(pieces[0]+'His uncertainty concerns Jesus’ willingness to help '));
    const emphasis=document.createElement('strong');emphasis.textContent='him';el.appendChild(emphasis);el.append(document.createTextNode('.'+(pieces[1]||'')));
   }else el.textContent=text;
   box.appendChild(el)
  });
 }
}
function open(mode){
 const d=date(),entry=byDate(d),dialog=$('daily-teaching-dialog');if(!dialog)return;
 $('daily-teaching-dialog-date').textContent=pretty(d);
 $('daily-teaching-dialog-title').textContent=entry?entry.title:'Add daily teaching';
 $('daily-teaching-editor').hidden=mode!=='edit';
 $('daily-teaching-content').hidden=mode==='edit';
 $('daily-teaching-edit').hidden=!entry||!entry.custom||mode==='edit';
 $('daily-teaching-done').hidden=mode==='edit';
 if(mode==='edit'){
  $('daily-teaching-title').value=entry&&entry.custom?entry.title:'';
  $('daily-teaching-body').value=entry&&entry.custom?entry.body:'';
 }else if(entry)renderContent(entry);
 if(!dialog.open)dialog.showModal();
 if(mode==='edit')$('daily-teaching-title').focus();
}
function close(){const dialog=$('daily-teaching-dialog');if(dialog&&dialog.open)dialog.close()}
function saveTeaching(e){
 e.preventDefault();
 const title=$('daily-teaching-title').value.trim(),body=$('daily-teaching-body').value.trim();
 if(!title||!body)return;
 try{const db=saved();db[date()]={title,body};localStorage.setItem(KEY,JSON.stringify(db))}
 catch(e){alert('Teaching could not be saved. Check browser storage.');return}
 render();close();open('read');markCalendar();
}
function markCalendar(){
 const cal=$('calendar');if(!cal)return;
 const year=Number($('calendar-year').value),month=Number($('monthpick').value)+1;
 const buttons=Array.from(cal.querySelectorAll('button.cal-day'));
 buttons.forEach(button=>{
  const day=Number(button.firstChild&&button.firstChild.textContent);
  if(!Number.isInteger(day)||day<1||day>31)return;
  const d=year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  const present=!!byDate(d);
  button.classList.toggle('has-teaching',present);
  let mark=button.querySelector('.cal-teaching-mark');
  if(present&&!mark){mark=document.createElement('span');mark.className='cal-teaching-mark';mark.textContent='✦';mark.setAttribute('aria-hidden','true');button.appendChild(mark)}
  if(!present&&mark)mark.remove();
  if(present)button.setAttribute('aria-label',pretty(d)+' — daily teaching available');
 });
}
function init(){
 if(!$('daily-teaching-card'))return;
 $('daily-teaching-open').addEventListener('click',()=>open('read'));
 $('daily-teaching-create').addEventListener('click',()=>open('edit'));
 $('daily-teaching-edit').addEventListener('click',()=>open('edit'));
 $('daily-teaching-cancel').addEventListener('click',()=>{close();if(byDate(date()))open('read')});
 $('daily-teaching-close').addEventListener('click',close);
 $('daily-teaching-done').addEventListener('click',close);
 $('daily-teaching-editor').addEventListener('submit',saveTeaching);
 document.addEventListener('kingdom:dayChanged',render);
 document.querySelectorAll('[data-tab="monthly"],[data-go="monthly"]').forEach(b=>b.addEventListener('click',()=>setTimeout(markCalendar,0)));
 $('monthpick').addEventListener('change',()=>setTimeout(markCalendar,0));
 $('calendar-year').addEventListener('change',()=>setTimeout(markCalendar,0));
 render();markCalendar();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.KingdomDailyTeaching={markCalendar,getByDate:byDate};
})();