/* Kingdom Atmosphere: fully offline one-tap PDF export (A4, multipage, WinAnsi Latin text). */
(function(){
'use strict';
var AGENDA_KEY='ka-2027-agenda-v1', GROWTH_KEY='ka-whole-life-growth-v1', PRESETS_KEY='ka-presets-v1';
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){return {}}}
function pad(n){return String(n).padStart(2,'0')}
function isoLocal(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function parseDay(s){return new Date(s+'T12:00:00')}
function validDay(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(parseDay(s).getTime())}
function monday(s){var d=parseDay(s);d.setDate(d.getDate()-(d.getDay()+6)%7);return isoLocal(d)}
function esc(str){return String(str).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\r/g,'')}
function win(str){
 var special={'\u20ac':128,'\u201a':130,'\u0192':131,'\u201e':132,'\u2026':133,'\u2020':134,'\u2021':135,'\u02c6':136,'\u2030':137,'\u0160':138,'\u2039':139,'\u0152':140,'\u017d':142,'\u2018':145,'\u2019':146,'\u201c':147,'\u201d':148,'\u2022':149,'\u2013':150,'\u2014':151,'\u02dc':152,'\u2122':153,'\u0161':154,'\u203a':155,'\u0153':156,'\u017e':158,'\u0178':159};
 var out='';for(var c of String(str)){var n=c.codePointAt(0);out+=String.fromCharCode(n<128||n>=160&&n<=255?n:special[c]||63)}return out;
}
function streamLen(s){return s.length}
function doc(rows,scope){
 var W=595,H=842,left=48,right=47,width=W-left-right;
 var pages=[],ops=[],y=H-62,pageNumber=0;
 function raw(s){ops.push(s)}
 function rgb(c){return c.join(' ')}
 function baseline(text,x,z,size,bold,color,italic){
 var font=italic?'F3':bold?'F2':'F1';
 raw(rgb(color||[.12,.26,.19])+' rg BT /'+font+' '+size+' Tf 1 0 0 1 '+x.toFixed(2)+' '+z.toFixed(2)+' Tm ('+esc(win(text))+') Tj ET\n');
 }
 function rect(x,z,w,h,color){raw(rgb(color)+' rg '+x+' '+z+' '+w+' '+h+' re f\n')}
 function line(x1,z1,x2,z2,color){raw(rgb(color)+' RG 0.6 w '+x1+' '+z1+' m '+x2+' '+z2+' l S\n')}
 function start(){
  if(ops.length)pages.push(ops.join(''));
  ops=[];y=H-71;pageNumber++;
  rect(0,H-15,W,15,[.045,.12,.086]);rect(left,H-61,37,2,[.73,.54,.18]);
  baseline('KINGDOM ATMOSPHERE',left,H-46,13,true,[.055,.20,.13]);
  baseline('PERSONAL AGENDA',W-159,H-46,8,false,[.50,.46,.33]);
  line(left,46,W-right,46,[.85,.85,.82]);
  baseline('Faith  |  Life  |  Purpose  |  Growth',left,30,8,false,[.4,.5,.43]);
  baseline(String(pageNumber),W-right-12,30,9,true,[.42,.48,.42]);
 }
 function room(amount){if(y-amount<66)start()}
 function chunk(txt,size,bold,italic){var units=0;for(var c of String(txt)){units+=(/[ilI \.,:;'!]/.test(c)?0.27:/[MW@]/.test(c)?0.83:0.52)*size*(bold?1.05:1)}return units}
 function wrap(s,size,bold){
  var lines=[],max=width-4;
  String(s).replace(/\r/g,'').split('\n').forEach(function(para){
    if(!para.trim()){lines.push('');return}
    var cur='';
    para.split(/\s+/).forEach(function(word){
      if(!word)return;
      var attempt=cur?cur+' '+word:word;
      if(chunk(attempt,size,bold)<=max){cur=attempt;return}
      if(cur){lines.push(cur);cur=''}
      while(chunk(word,size,bold)>max&&word.length>1){var idx=Math.max(1,Math.floor(max/(size*.56)));var split=word.slice(0,idx);while(split.length>1&&chunk(split,size,bold)>max)split=split.slice(0,-1);lines.push(split);word=word.slice(split.length)}
      cur=word;
    });
    if(cur)lines.push(cur);
  });return lines;
 }
 function paragraph(text,size,color,italic){var lines=wrap(text,size||10.5,false);for(var str of lines){room(16);if(str)baseline(str,left,y,size||10.5,false,color||[.17,.23,.18],italic);y-=15}y-=4}
 function heading(text){room(37);y-=8;baseline(text,left,y,15,true,[.09,.26,.17]);y-=10;line(left,y,W-right,y,[.77,.69,.48]);y-=18}
 function title(text){room(53);y-=7;baseline(text,left,y,21,true,[.09,.26,.17]);y-=29}
 function field(label,value){if(value===null||value===undefined||String(value).trim()==='')return;room(40);baseline(label.toUpperCase(),left,y,9,true,[.57,.43,.19]);y-=17;paragraph(value,10.5)}
 function dateHeading(s){var d=parseDay(s),str=d.toLocaleDateString((window.KA_locale&&window.KA_locale()==='fr')?'fr-CA':'en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'});title(str)}
 function listFields(obj,fields){fields.forEach(function(x){field(x[1],obj&&obj[x[0]])})}
 function dayPage(s,d){
  start();dateHeading(s);
  var a=(d.agenda.days||{})[s]||{},growth=(d.growth.days||{})[s]||{};
  var scripture=window.KingdomAgendaVerses;
  if(Array.isArray(scripture)&&scripture.length){
   var t=s.split('-'),idx=Math.floor(Date.UTC(+t[0],+t[1]-1,+t[2])/86400000);
   var verse=scripture[((idx%scripture.length)+scripture.length)%scripture.length];
   if(verse&&verse.length>1)field('Daily Scripture - '+verse[0],verse[1]);
  }
  listFields(a,[['focus','Daily intention'],['oneaction','Most important action'],['priorities','Priorities'],['daynotes','My notes and thoughts'],['reflection','Spiritual reflection'],['prayer','Prayer'],['gratitude','Gratitude'],['review','Evening reflection'],['schedule','Schedule'],['tasks','Tasks'],['discipline','Personal discipline']]);
  var labels={spiritual:'Spiritual growth',emotional:'Emotional growth',relationships:'Relationships',personal:'Personal growth',financial:'Financial stewardship'};
  Object.keys(labels).forEach(function(k){var x=growth[k];if(x&&x.action)field(labels[k]+(x.done?' (completed)':''),x.action+(x.notes?'\nReflection: '+x.notes:''))});
  if(y>H-142)paragraph('A fresh day, with room to grow and reflect.',11,[.41,.49,.43],true);
 }
 function sections(entries,labelFn,valueFn){
  entries.forEach(function(item){var text=valueFn(item);if(text===null||text===undefined||String(text).trim()==='')return;field(labelFn(item),text)})
 }
 var data=rows;
 start();title('My personal agenda');
 paragraph(scope.description,12,[.37,.45,.38]);
 line(left,y,W-right,y,[.76,.68,.45]);y-=21;
 paragraph('Privately prepared from your saved Kingdom Atmosphere agenda.',9,[.43,.51,.44],true);
 if(scope.days.length){scope.days.forEach(function(s){dayPage(s,data)})}
 else{heading('Your selected period');paragraph('No journal entries have been saved for this period yet.')}
 if(scope.mode==='month'){
  heading('Monthly intentions and notes');
  var mm=scope.reference.slice(0,7);
  sections(Object.entries((data.agenda.months||{})[mm]||{}),x=>x[0],x=>x[1]);
 }
 if(scope.mode==='week'){
  heading('Weekly intentions and reflection');
  var wk=monday(scope.reference);
  sections(Object.entries((data.agenda.weeks||{})[wk]||{}),x=>x[0],x=>x[1]);
  field('Whole-life weekly growth',((data.growth.weeks||{})[wk]||{}).reflection);
 }
 if(scope.all){
  heading('Vision, purpose and intentions');
  sections(Object.entries(data.agenda.single||{}),x=>String(x[0]),x=>x[1]);
  var goals=data.agenda.linkedGoals||[];if(goals.length){heading('Annual goals');sections(goals,x=>(x.year||'')+(x.done?' / Completed':' / In progress'),x=>x.name)}
  var outcomes=data.agenda.linkedOutcomes||[];if(outcomes.length){heading('Weekly outcomes');sections(outcomes,x=>x.week+(x.done?' / Completed':''),x=>x.name)}
  var actions=data.agenda.linkedActions||[];if(actions.length){heading('Linked daily actions');sections(actions,x=>x.date+(x.done?' / Completed':''),x=>x.name)}
  Object.keys(data.agenda.months||{}).sort().forEach(function(k){heading('Monthly notes: '+k);sections(Object.entries(data.agenda.months[k]||{}),x=>x[0],x=>x[1])});
  Object.keys(data.agenda.weeks||{}).sort().forEach(function(k){heading('Weekly notes: '+k);sections(Object.entries(data.agenda.weeks[k]||{}),x=>x[0],x=>x[1])});
  Object.keys(data.growth.weeks||{}).sort().forEach(function(k){field('Whole-life weekly growth '+k,data.growth.weeks[k]&&data.growth.weeks[k].reflection)});
  if((data.agenda.family||[]).length){heading('Family dates');sections(data.agenda.family||[],x=>x.kind||'Occasion',x=>[x.name,x.date].filter(Boolean).join(' - '))}
  if((data.agenda.gifts||[]).length){heading('Gift planner');sections(data.agenda.gifts||[],x=>x.recipient||'Gift',x=>[x.idea,x.budget?'Budget: '+x.budget:''].filter(Boolean).join(' | '))}
  if((data.presets.presets||[]).length){heading('Activity presets');sections(data.presets.presets||[],x=>x.category+' / '+x.style,x=>x.name+' - '+x.minutes+' minutes')}
  if((data.agenda.reminders||[]).length){heading('Reminders');sections(data.agenda.reminders||[],x=>x.name,x=>x.when+(x.done?' / Completed':''))}
  if((data.agenda.sessions||[]).length){heading('Recorded activity time');sections(data.agenda.sessions||[],x=>x.name,x=>x.minutes+' minutes - '+(x.finished||''))}
 }
 if(ops.length)pages.push(ops.join(''));
 // PDF Standard 14 fonts / WinAnsi encoding and deterministic page objects.
 var objects=['','<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>'];
 var kids=[],next=6;
 pages.forEach(function(content){var pid=next++,sid=next++;kids.push(pid+' 0 R');objects[pid]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents '+sid+' 0 R >>';objects[sid]='<< /Length '+streamLen(content)+' >>\nstream\n'+content+'endstream'});
 objects[2]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+pages.length+' >>';
 var pdf='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n',offsets=[0];
 for(var i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=i+' 0 obj\n'+objects[i]+'\nendobj\n'}
 var at=pdf.length;pdf+='xref\n0 '+objects.length+'\n0000000000 65535 f \n';
 for(var i=1;i<objects.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 pdf+='trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+at+'\n%%EOF\n';
 var bytes=new Uint8Array(pdf.length);for(var i=0;i<pdf.length;i++)bytes[i]=pdf.charCodeAt(i)&255;
 return new Blob([bytes],{type:'application/pdf'});
}
function gather(mode,ref){
 var agenda=read(AGENDA_KEY),growth=read(GROWTH_KEY),presets=read(PRESETS_KEY),dates=[];
 if(!validDay(ref))ref=isoLocal(new Date());
 if(mode==='day')dates=[ref];
 else if(mode==='week'){var d=parseDay(monday(ref));for(var i=0;i<7;i++){var j=new Date(d);j.setDate(j.getDate()+i);dates.push(isoLocal(j))}}
 else if(mode==='month'){var start=ref.slice(0,7);dates=Object.keys(agenda.days||{}).concat(Object.keys(growth.days||{})).filter(d=>validDay(d)&&d.slice(0,7)===start)}
 else{dates=Object.keys(agenda.days||{}).concat(Object.keys(growth.days||{})).filter(validDay)}
 dates=Array.from(new Set(dates)).sort();
 return {agenda:agenda,growth:growth,presets:presets,dates:dates};
}
function fileName(mode,ref){return 'Kingdom-Atmosphere-Agenda-'+(mode==='all'?'Archive':mode==='month'?ref.slice(0,7):mode==='week'?'Week-'+monday(ref):ref)+'.pdf'}
function generate(mode,ref){var d=gather(mode,ref);return doc(d,{days:d.dates,all:mode==='all',mode:mode,reference:ref,description:mode==='all'?'Complete saved agenda archive':mode==='day'?'Daily journal: '+ref:mode==='week'?'Weekly journal: '+monday(ref):'Monthly journal: '+ref.slice(0,7)})}
function download(blob,name){
 var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},20000)
}
/* One owner for PDF generation, preview, download and native sharing.
   The preview uses the exact Blob that will be sent or downloaded. */
var previewState=null;
function releasePreview(){
 if(!previewState)return;
 var old=previewState;previewState=null;
 var frame=document.getElementById('pdf-preview-frame');
 if(frame)frame.src='about:blank';
 // Allow an already-open full-document tab to load before revoking its URL.
 setTimeout(function(){URL.revokeObjectURL(old.url)},60000);
}
function closePreview(){
 var dialog=document.getElementById('pdf-preview-dialog');
 if(!dialog)return;
 if(dialog.open&&typeof dialog.close==='function')dialog.close();
 else dialog.removeAttribute('open');
 releasePreview();
}
function previewPDF(mode,ref,notify){
 var dialog=document.getElementById('pdf-preview-dialog');
 if(!dialog)throw new Error('Preview is unavailable. Please reload the agenda.');
 releasePreview();
 var blob=generate(mode,ref),name=fileName(mode,ref),url=URL.createObjectURL(blob);
 previewState={blob:blob,name:name,url:url};
 document.getElementById('pdf-preview-frame').src=url;
 var description=document.getElementById('pdf-preview-description');
 if(description)description.textContent=mode==='all'?'Your complete saved agenda archive':mode==='week'?'Week of '+ref:mode==='month'?'Month '+ref.slice(0,7):'Daily journal · '+ref;
 var status=document.getElementById('pdf-preview-feedback');
 if(status)status.textContent='Preview ready · '+Math.max(1,Math.round(blob.size/1024))+' KB';
 if(!dialog.open){
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.setAttribute('open','');
 }
 notify('PDF preview ready. Review the document before sharing.');
}
async function sharePreview(notify){
 if(!previewState)return;
 var fileData=previewState;
 if(typeof File!=='undefined'&&navigator.share){
  var file=new File([fileData.blob],fileData.name,{type:'application/pdf'});
  if(!navigator.canShare||navigator.canShare({files:[file]})){
   await navigator.share({files:[file],title:'Kingdom Atmosphere Agenda'});
   notify('PDF share sheet opened.');return;
  }
 }
 download(fileData.blob,fileData.name);
 notify('File sharing is unavailable here. The PDF was downloaded so you can share it from Files.');
}
function setup(){
 var dl=document.getElementById('print-agenda'),
     share=document.getElementById('share-agenda'),
     preview=document.getElementById('preview-agenda'),
     status=document.getElementById('pdf-status'),
     dialog=document.getElementById('pdf-preview-dialog');
 if(!dl||!share||!dialog)return;
 function settings(){
  var p=document.getElementById('datepick'),picker=document.getElementById('print-range');
  return {mode:picker?picker.value:'day',date:p&&p.value||isoLocal(new Date())}
 }
 function notify(message){
  if(status)status.textContent=message;
  var messageArea=document.getElementById('pdf-preview-feedback');
  if(messageArea)messageArea.textContent=message;
 }
 function openSelected(mode,ref){
  try{previewPDF(mode,ref,notify)}
  catch(e){notify('Unable to preview PDF: '+e.message);console.error(e)}
 }
 if(preview)preview.addEventListener('click',function(){var s=settings();openSelected(s.mode,s.date)});
 // Existing direct download remains available, but every sharing route previews first.
 dl.addEventListener('click',function(){
  try{var s=settings(),pdf=generate(s.mode,s.date);download(pdf,fileName(s.mode,s.date));notify('PDF downloaded. Check your Files or Downloads.')}
  catch(e){notify('PDF error: '+e.message);console.error(e)}
 });
 share.addEventListener('click',function(){var s=settings();openSelected(s.mode,s.date)});
 var daily=document.getElementById('daily-pdf-share');
 if(daily)daily.addEventListener('click',function(){openSelected('day',settings().date)});
 document.getElementById('pdf-preview-close').addEventListener('click',closePreview);
 dialog.addEventListener('close',releasePreview);
 dialog.addEventListener('click',function(e){if(e.target===dialog)closePreview()});
 document.getElementById('pdf-preview-full').addEventListener('click',function(){
  if(!previewState)return;
  var url=previewState.url;
  var tab=window.open(url,'_blank');
  if(!tab)notify('Your browser blocked the full PDF view. Use Download to open it in Files.');
 });
 document.getElementById('pdf-preview-download').addEventListener('click',function(){
  if(!previewState)return;
  download(previewState.blob,previewState.name);
  notify('PDF downloaded. You can still review or share it.');
 });
 document.getElementById('pdf-preview-share').addEventListener('click',async function(){
  var button=this;
  if(!previewState)return;
  button.disabled=true;
  try{await sharePreview(notify)}
  catch(e){if(e.name!=='AbortError'){notify('Unable to share. Try Download instead.');console.error(e)}}
  finally{button.disabled=false}
 });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.KingdomPDF={generate:generate,download:download,filename:fileName};
})();