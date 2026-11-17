'use strict';
// Real Chromium regression smoke test for Kingdom Atmosphere Agenda.
// npm install --no-save playwright-core && AGENDA_TEST_URL=http://127.0.0.1:8765/agenda-2027/ node agenda-2027/tests/browser-regression.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const base=process.env.AGENDA_TEST_URL||'http://127.0.0.1:8765/agenda-2027/';
const options=[
 process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'
].filter(Boolean);
const executablePath=options.find(x=>fs.existsSync(x));
if(!executablePath)throw new Error('Chromium/Google Chrome not found. Set CHROME_BIN.');
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const move=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)};
async function main(){
 const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'America/Toronto',acceptDownloads:true});
 const page=await context.newPage();
 page.setDefaultTimeout(9000);
 page.on('dialog',dialog=>dialog.accept());
 const exceptions=[],failures=[];
 page.on('pageerror',e=>exceptions.push(String(e.stack||e)));
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failures.push(r.status()+' '+r.url())});
 async function test(label,fn){console.log('START '+label);try{await Promise.race([fn(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Timed out at '+label)),20000))]);console.log('PASS '+label)}catch(e){console.error('FAIL '+label+'\n'+String(e.stack||e));throw e}}
 try{
 await page.goto(base,{waitUntil:'load',timeout:30000});
 await page.waitForTimeout(450);
 const today=await page.evaluate(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')});
 const tomorrow=move(today,1);
 await test('Actual local date and initial DOM',async()=>{
   assert.equal(await page.locator('#datepick').inputValue(),today);
   assert(await page.locator('#today-home-date').innerText().then(x=>x.includes(String(Number(today.slice(8))))));
   assert.equal(await page.locator('.journal-tile').count(),4);
 });
 await test('Today home stylesheet loads and renders as a real card',async()=>{
   const styles=await page.evaluate(()=>{
     const home=document.querySelector('#today-home');
     const title=document.querySelector('#today-home-title');
     const btn=document.querySelector('#today-plan');
     const css=getComputedStyle(home);
     const head=getComputedStyle(title);
     const action=getComputedStyle(btn);
     const sheet=[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>x.getAttribute('href'));
     const rect=home.getBoundingClientRect();
     return {stylesheets:sheet,bg:css.backgroundColor,radius:css.borderRadius,padding:css.padding,headerFont:head.fontFamily,buttonBg:action.backgroundColor,width:rect.width};
   });
   assert(styles.stylesheets.some(x=>x.includes('app.css?v=39')),'Outdated CSS version requested: '+JSON.stringify(styles.stylesheets));
   assert.equal(styles.bg,'rgb(255, 254, 251)','Today home stylesheet missing: '+JSON.stringify(styles));
   assert.notEqual(styles.radius,'0px','Today home card border radius missing');
   assert(styles.width>280,'Today card collapsed on mobile');
   assert.notEqual(styles.buttonBg,'rgb(239, 239, 239)','Plan action still has browser default styling');
 });
 await test('Today is one concise workspace, with journal and deep tools closed by default',async()=>{
   const before=await page.evaluate(()=>{
     const journal=document.querySelector('#today-journal'),tools=document.querySelector('#today-tools');
     const home=document.querySelector('#today-home').getBoundingClientRect();
     const teaching=document.querySelector('#daily-teaching-card').getBoundingClientRect();
     return {journalOpen:journal.open,toolsOpen:tools.open,homeY:home.y,teachingY:teaching.y,
       journalVisible:journal.querySelector('.agenda-paper').getBoundingClientRect().height,
       deepToolsVisible:tools.querySelector('.agenda-utilities').getBoundingClientRect().height};
   });
   assert.equal(before.journalOpen,false);
   assert.equal(before.toolsOpen,false);
   assert.equal(before.journalVisible,0,'Full journal should not duplicate Today on entry');
   assert.equal(before.deepToolsVisible,0,'Advanced tools should not occupy Today by default');
   assert(before.homeY<before.teachingY);
   await page.locator('#today-open-journal').click();
   assert.equal(await page.locator('#journal-notes').evaluate(e=>e.open),true);
   await page.locator('#journal-notes .journal-done').click();
 });
 await test('Journal opens, saves once and keeps unrelated fields',async()=>{
   await page.locator('#today-journal > summary').click();
   await page.locator('[data-journal-open="faith"]').click();
   assert.equal(await page.locator('#journal-faith').evaluate(e=>e.open),true);
   await page.locator('#prayer').fill('Preserve prayer');
   await page.locator('#journal-faith .journal-done').click();
   await page.locator('[data-journal-open="notes"]').click();
   await page.locator('#daynotes').fill('Browser regression note');
   await page.locator('#journal-notes .journal-done').click();
   const record=await page.evaluate(d=>JSON.parse(localStorage.getItem('ka-2027-agenda-v1')).days[d],today);
   assert.equal(record.prayer,'Preserve prayer');
   assert.equal(record.daynotes,'Browser regression note');
   assert.match(await page.locator('#digest-count').innerText(),/2 of 4/);
 });
 await test('Saved writing appears in searchable history and reopens the right day',async()=>{
   await page.locator('#today-journal').evaluate(e=>e.open=true);
   await page.locator('#journal-history-open').click();
   assert.equal(await page.locator('#notes').evaluate(e=>e.classList.contains('active')),true);
   await page.locator('#journal-history-search').fill('Browser regression note');
   await page.locator('#journal-history-type').selectOption('notes');
   assert.equal(await page.locator('#journal-history-list [data-history-date]').count(),1);
   assert.match(await page.locator('#journal-history-list [data-history-date]').first().innerText(),/Browser regression note/);
   await page.locator('#journal-history-list [data-history-date]').first().click();
   assert.equal(await page.locator('#datepick').inputValue(),today);
   assert.equal(await page.locator('#journal-notes').evaluate(e=>e.open),true);
   assert.equal(await page.locator('#daynotes').inputValue(),'Browser regression note');
   await page.locator('#journal-notes .journal-done').click();
 });
 await test('Navigation and journal entries survive reload',async()=>{
   await page.locator('#next').click();
   assert.equal(await page.locator('#datepick').inputValue(),tomorrow);
   await page.locator('#prev').click();
   assert.equal(await page.locator('#datepick').inputValue(),today);
   await page.reload({waitUntil:'load'});
   await page.waitForTimeout(350);
   await page.locator('#today-journal').evaluate(e=>e.open=true);
   await page.locator('[data-journal-open="notes"]').click();
   assert.equal(await page.locator('#daynotes').inputValue(),'Browser regression note');
   await page.locator('#journal-notes .journal-done').click();
 });
 await test('Today home is immediately actionable and reflects the existing daily plan',async()=>{
   await page.locator('[data-tab="daily"]').evaluate(e=>e.click());
   assert.equal(await page.locator('#today-home').isVisible(),true);
   assert.equal(await page.locator('#today-home-empty').isVisible(),true);
   await page.locator('#today-plan').click();
   assert.equal(await page.locator('#today-plan-editor').isVisible(),true);
   assert.equal(await page.locator('#journal-intent').evaluate(e=>e.open),false,'Planning must not open an unrelated journal popup');
   await page.locator('#today-plan-main').fill('Finish the important work');
   await page.locator('#today-plan-priorities').fill('Prepare one workshop\\nReview notes');
   await page.locator('#today-plan-intention').fill('Stay attentive');
   await page.locator('#today-plan-save').click();
   assert.equal(await page.locator('#today-plan-editor').isVisible(),false);
   assert.equal(await page.locator('#today-home-ready').isVisible(),true);
   assert.match(await page.locator('#today-main-focus').innerText(),/Finish the important work/);
   await page.locator('#today-add-task').click();
   assert.equal(await page.locator('#quick-sheet').isVisible(),true);
   assert.equal(await page.locator('#quick-kind').inputValue(),'tasks');
   await page.locator('#quick-text').fill('Prepare lesson notes');
   await page.locator('#quick-save').click();
   assert.match(await page.locator('#today-task-list').innerText(),/Prepare lesson notes/);
   assert.equal(await page.locator('#today-task-count').innerText(),'1 task');
   const persisted=await page.evaluate(d=>JSON.parse(localStorage.getItem('ka-2027-agenda-v1')).days[d],today);
   assert.equal(persisted.oneaction,'Finish the important work');
   assert.match(persisted.tasks,/Prepare lesson notes/);
   await page.reload({waitUntil:'load'});
   assert.match(await page.locator('#today-main-focus').innerText(),/Finish the important work/);
   assert.match(await page.locator('#today-task-list').innerText(),/Prepare lesson notes/);
   await page.locator('#next').click();
   assert.equal(await page.locator('#datepick').inputValue(),tomorrow);
   assert.equal(await page.locator('#today-home-empty').isVisible(),true);
   await page.locator('#today-home-return').click();
   assert.equal(await page.locator('#datepick').inputValue(),today);
 });
 await test('Day planner edit preserves existing values and uses one daily storage record',async()=>{
   await page.locator('#today-prepare').click();
   assert.equal(await page.locator('#today-plan-editor').isVisible(),true);
   assert.equal(await page.locator('#today-plan-main').inputValue(),'Finish the important work');
   assert.match(await page.locator('#today-plan-priorities').inputValue(),/Prepare one workshop/);
   await page.locator('#today-plan-cancel').click();
   assert.equal(await page.locator('#today-plan-editor').isVisible(),false);
   assert.equal(await page.locator('#oneaction').inputValue(),'Finish the important work');
 });
 await test('Journal dialog fits a short desktop viewport and keeps Done visible',async()=>{
   await page.setViewportSize({width:1366,height:768});
   await page.locator('#today-journal').evaluate(e=>e.open=true);
   await page.locator('[data-journal-open="intent"]').click();
   const result=await page.locator('#journal-intent').evaluate(el=>{
    const bounds=el.getBoundingClientRect(),footer=el.querySelector('.journal-dialog-footer').getBoundingClientRect();
    const body=el.querySelector('.journal-dialog-body');
    return {top:bounds.top,bottom:bounds.bottom,height:bounds.height,footBottom:footer.bottom,scroll:getComputedStyle(body).overflowY,bodyHeight:body.getBoundingClientRect().height};
   });
   assert(result.top>=-1&&result.bottom<=769,'Dialog must remain within desktop viewport '+JSON.stringify(result));
   assert(result.footBottom<=769&&result.bodyHeight>160,'Journal editor or Done action clipped '+JSON.stringify(result));
   await page.locator('#journal-intent .journal-done').click();
   await page.setViewportSize({width:390,height:844});
 });
 await test('All journal modes remain usable on short desktop and mobile screens',async()=>{
   for(const viewport of [{width:1280,height:700},{width:390,height:700}]){
     await page.setViewportSize(viewport);
     await page.locator('#today-journal').evaluate(e=>e.open=true);
     for(const mode of ['intent','notes','faith','evening']){
       await page.locator('[data-journal-open="'+mode+'"]').click();
       const layout=await page.locator('#journal-'+mode).evaluate(el=>{
         const b=el.getBoundingClientRect();
         const body=el.querySelector('.journal-dialog-body').getBoundingClientRect();
         const footer=el.querySelector('.journal-dialog-footer').getBoundingClientRect();
         return {top:b.top,bottom:b.bottom,bodyH:body.height,footerBottom:footer.bottom,viewportH:window.innerHeight};
       });
       assert(layout.top>=-2&&layout.bottom<=viewport.height+2,'Dialog exceeds viewport '+mode+' '+JSON.stringify(layout));
       assert(layout.footerBottom<=viewport.height+2&&layout.bodyH>90,'Editor content or Done clipped '+mode+' '+JSON.stringify(layout));
       await page.locator('#journal-'+mode+' .journal-done').click();
     }
   }
   await page.setViewportSize({width:390,height:844});
 });
 await test('Daily teaching appears on assigned date and opens the complete authored text',async()=>{
   await page.locator('[data-tab="daily"]').evaluate(e=>e.click());
   const assigned='2026-11-17';
   await page.locator('#datepick').fill(assigned);
   await page.locator('#datepick').dispatchEvent('change');
   assert.equal(await page.locator('#daily-teaching-available').isVisible(),true);
   assert.equal(await page.locator('#daily-teaching-card-title').innerText(),'Know the God You Trust');
   await page.locator('#daily-teaching-open').click();
   assert.equal(await page.locator('#daily-teaching-dialog').evaluate(e=>e.open),true);
   const content=await page.locator('#daily-teaching-content').innerText();
   assert.match(content,/Mark 1:40–42/);
   assert.match(content,/First John 4:16/);
   assert.match(content,/Hebrews 4:16/);
   assert.match(content,/Philippians 4:6–7/);
   assert.match(content,/Father, help me know and rely on Your love/);
   await page.locator('#daily-teaching-done').click();
   assert.equal(await page.locator('#daily-teaching-dialog').evaluate(e=>e.open),false);
 });
 await test('Calendar marks teaching dates and selected day controls teaching',async()=>{
   await page.locator('[data-tab="monthly"]').evaluate(e=>e.click());
   await page.locator('#calendar-year').fill('2026');
   await page.locator('#calendar-year').dispatchEvent('change');
   await page.locator('#monthpick').selectOption('10');
   assert(await page.locator('#calendar button.cal-day.has-teaching').count()>0,'No marked calendar teaching date');
   await page.locator('#calendar button.cal-day.has-teaching').first().click();
   assert.equal(await page.locator('#datepick').inputValue(),'2026-11-17');
   assert.equal(await page.locator('#daily-teaching-available').isVisible(),true);
   await page.locator('#next').click();
   assert.equal(await page.locator('#daily-teaching-missing').isVisible(),true);
   await page.locator('#daily-teaching-create').click();
   await page.locator('#daily-teaching-title').fill('Tomorrow’s teaching');
   await page.locator('#daily-teaching-body').fill('A locally saved teaching for another day.');
   await page.locator('#daily-teaching-save').click();
   assert.equal(await page.locator('#daily-teaching-dialog-title').innerText(),'Tomorrow’s teaching');
   await page.locator('#daily-teaching-done').click();
   await page.reload({waitUntil:'load'});
   await page.locator('#datepick').fill('2026-11-18');
   await page.locator('#datepick').dispatchEvent('change');
   assert.equal(await page.locator('#daily-teaching-card-title').innerText(),'Tomorrow’s teaching');
   await page.locator('#datepick').fill(today);
   await page.locator('#datepick').dispatchEvent('change');
 });
 await test('Daily agenda is ordered before the optional journal',async()=>{
   await page.locator('[data-tab="daily"]').evaluate(e=>e.click());
   const order=await page.evaluate(()=>['.agenda-datebar','.today-home','.daily-teaching-card','.agenda-utilities','.agenda-book'].map(q=>{
    const el=document.querySelector('#daily > '+q);return {q,order:Number(getComputedStyle(el).order),top:el.getBoundingClientRect().top}
   }));
   for(let i=1;i<order.length;i++)assert(order[i].order>order[i-1].order,'Agenda sections out of order '+JSON.stringify(order));
   assert(order[0].top<order[1].top&&order[1].top<order[2].top,'Agenda should appear before teaching and journal');
 });
 await test('Family Space groceries, editing, shopping and separate storage',async()=>{
   await page.locator('[data-tab="family-space"]').evaluate(e=>e.click());
   assert.equal(await page.locator('#family-space').evaluate(e=>e.classList.contains('active')),true);
   await page.locator('#family-grocery-name').fill('Milk');
   await page.locator('#family-grocery-quantity').fill('2 L');
   await page.locator('#family-grocery-form button[type=submit]').click();
   assert.equal(await page.locator('#family-grocery-list article').count(),1);
   await page.locator('#family-grocery-list article').getByRole('button',{name:'Edit'}).click();
   await page.locator('#family-grocery-quantity').fill('3 L');
   await page.locator('#family-grocery-form button[type=submit]').click();
   await page.locator('#family-grocery-list input[type=checkbox]').check();
   assert.match(await page.locator('#family-grocery-progress').innerText(),/1 of 1/);
   const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('ka-family-space-v1')));
   assert.equal(data.groceries[0].qty,'3 L');assert.equal(data.groceries[0].done,true);
   const agenda=await page.evaluate(()=>JSON.parse(localStorage.getItem('ka-2027-agenda-v1')));
   assert.equal(agenda.days[today].daynotes,'Browser regression note');
   assert.match(await page.evaluate(()=>window.KingdomFamilySpace.getGroceryText()),/Milk/);
 });
 await test('Home chore picker filters, adds one-tap and avoids duplicate tasks',async()=>{
   await page.locator('[data-tab="family-space"]').evaluate(e=>e.click());
   await page.locator('[data-family-tab="tasks"]').click();
   await page.locator('#family-chore-category').selectOption('laundry');
   assert(await page.locator('#family-chore-choices button').count()>=4);
   await page.locator('#family-chore-search').fill('Fold');
   assert.equal(await page.locator('#family-chore-choices button').count(),1);
   await page.locator('#family-chore-choices button').click();
   assert.match(await page.locator('#family-task-list').innerText(),/Fold clothes/);
   const count=await page.locator('#family-task-list article').count();
   await page.locator('#family-chore-choices button').click();
   assert.equal(await page.locator('#family-task-list article').count(),count,'Duplicate chore unexpectedly inserted');
   assert.match(await page.locator('#family-chore-feedback').innerText(),/already on your list/);
   await page.locator('#family-chore-search').fill('');
   await page.locator('#family-chore-category').selectOption('kitchen');
   const wash=page.locator('#family-chore-choices button').filter({hasText:'Wash dishes'});
   await wash.click();
   const scheduled=await page.evaluate(()=>JSON.parse(localStorage.getItem('ka-family-space-v1')).tasks);
   assert.equal(scheduled.find(x=>x.name==='Wash dishes').repeat,'daily');
   assert.equal(scheduled.find(x=>x.name==='Fold clothes').repeat,'weekly');
   await page.locator('#family-task-list input[aria-label="Complete Wash dishes"]').click();
   const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('ka-family-space-v1')).tasks.find(x=>x.name==='Wash dishes'));
   assert.equal(after.completedCount,1);
   assert.equal(after.done,false);
 });
 await test('Family responsibilities, calendar, moments and offline persistence',async()=>{
   await page.locator('[data-family-tab="tasks"]').click();
   await page.locator('#family-task-name').fill('Take out recycling');
   await page.locator('#family-task-assignee').fill('Family member');
   await page.locator('#family-task-form button[type=submit]').click();
   assert.equal(await page.locator('#family-task-list article').count(),3);
   await page.locator('[data-family-tab="calendar"]').click();
   await page.locator('#family-event-name').fill('Family game night');
   await page.locator('#family-event-date').fill(tomorrow);
   await page.locator('#family-event-form button[type=submit]').click();
   assert.match(await page.locator('#family-event-list').innerText(),/Family game night/);
   await page.locator('[data-family-tab="moments"]').click();
   await page.locator('#family-moment-text').fill('Pray and encourage each other this week');
   await page.locator('#family-moment-form button[type=submit]').click();
   assert.match(await page.locator('#family-moment-list').innerText(),/Pray and encourage/);
   await page.reload({waitUntil:'load'});
   await page.locator('[data-tab="family-space"]').evaluate(e=>e.click());
   assert.equal(await page.locator('#family-grocery-list article').count(),1);
   await page.locator('[data-family-tab="calendar"]').click();
   assert.match(await page.locator('#family-event-list').innerText(),/Family game night/);
 });
 await test('Family item reuse prefills safely without altering the original',async()=>{
   await page.locator('[data-tab="family-space"]').evaluate(e=>e.click());
   await page.locator('[data-family-tab="tasks"]').click();
   const before=await page.locator('#family-task-list article').count();
   await page.locator('#family-task-list article').filter({hasText:'Take out recycling'}).getByRole('button',{name:'Copy'}).click();
   assert.equal(await page.locator('#family-task-name').inputValue(),'Take out recycling');
   assert.equal(await page.locator('#family-task-list article').count(),before,'Copy action should not save automatically');
   await page.locator('#family-task-name').fill('Take out recycling again');
   await page.locator('#family-task-form button[type=submit]').click();
   assert.equal(await page.locator('#family-task-list article').count(),before+1);
   assert.match(await page.locator('#family-task-list').innerText(),/Take out recycling again/);
   await page.locator('[data-family-tab="calendar"]').click();
   await page.locator('#family-event-list article').filter({hasText:'Family game night'}).getByRole('button',{name:'Copy'}).click();
   assert.equal(await page.locator('#family-event-name').inputValue(),'Family game night');
   assert.equal(await page.locator('#family-event-list article').count(),1,'Calendar copy must not save before confirmation');
   await page.locator('[data-family-tab="moments"]').click();
   await page.locator('#family-moment-list article').getByRole('button',{name:'Reuse'}).first().click();
   assert.match(await page.locator('#family-moment-text').inputValue(),/Pray and encourage/);
   assert.equal(await page.locator('#family-moment-list article').count(),1,'Reuse must not create duplicate moments');
 });
 await test('Growth modal fits mobile and autosaves',async()=>{
   await page.locator('[data-tab="daily"]').evaluate(e=>e.click());
   await page.locator('#growth-open').click();
   assert.equal(await page.locator('#growth-dialog').evaluate(e=>e.open),true);
   const sheet=await page.locator('#growth-dialog').boundingBox();
   assert(sheet&&sheet.height>400,'Growth dialog has collapsed: '+JSON.stringify(sheet));
   const body=await page.locator('.growth-dialog .growth-content').boundingBox();
   assert(body&&body.height>180,'Growth editor content is not usable: '+JSON.stringify(body));
   await page.locator('#growth-action').fill('Stretch and reflect');
   await page.locator('#growth-done').check();
   await page.locator('#growth-done-button').click();
   const saved=await page.evaluate(d=>JSON.parse(localStorage.getItem('ka-whole-life-growth-v1')).days[d].personal,today);
   assert.equal(saved.action,'Stretch and reflect');assert.equal(saved.done,true);
 });
 await test('Preset creates time block without collision',async()=>{
   await page.locator('[data-tab="presets"]').evaluate(e=>e.click());
   await page.locator('#preset-name').fill('Hip-Hop freestyle');
   await page.locator('#preset-category').selectOption('Dance');
   await page.locator('#preset-style').selectOption('Hip-Hop');
   await page.locator('#preset-time').fill('09:00');
   await page.locator('#preset-minutes').fill('45');
   await page.locator('#preset-date').fill(today);
   
   await page.locator('#preset-apply').click();
   const saved=await page.evaluate(d=>JSON.parse(localStorage.getItem('ka-2027-agenda-v1')).days[d].schedule,today);
   assert(saved.includes('Hip-Hop freestyle')&&saved.includes('09:00'));
 });
 await test('Schedule editing and day copying preserve existing journal',async()=>{
   await page.locator('#scheduled-activity-list article').first().getByRole('button',{name:/Edit/}).click();
   await page.locator('#edit-activity-name').fill('Hip-Hop technique');
   await page.locator('#edit-activity-save').click();
   assert((await page.evaluate(d=>JSON.parse(localStorage.getItem('ka-2027-agenda-v1')).days[d].schedule,today)).includes('Hip-Hop technique'));
   await page.locator('[data-tab="daily"]').evaluate(e=>e.click());
   await page.locator('#today-tools').evaluate(e=>e.open=true);
   await page.locator('#planning-copy').evaluate(e=>e.open=true);
   await page.locator('#plan-source-date').fill(today);
   await page.locator('#plan-target-date').fill(tomorrow);
   await page.locator('#plan-copy-scope').selectOption('day');
   
   await page.locator('#plan-copy-apply').click();
   const both=await page.evaluate(({a,b})=>{const days=JSON.parse(localStorage.getItem('ka-2027-agenda-v1')).days;return [days[a],days[b]]},{a:today,b:tomorrow});
   assert(both[0].schedule.includes('Hip-Hop technique'));
   assert(both[1].schedule.includes('Hip-Hop technique'));
   assert.equal(both[0].prayer,'Preserve prayer');
 });
 await test('PDF generated as multipage readable file',async()=>{
   const result=await page.evaluate(d=>{const blob=window.KingdomPDF.generate('week',d);return blob.arrayBuffer().then(b=>{const text=new TextDecoder('latin1').decode(b);return {bytes:b.byteLength,header:text.slice(0,8),count:Number(text.match(/\/Count (\d+)/)?.[1])}})},today);
   assert.equal(result.header,'%PDF-1.4');assert(result.bytes>1500);assert(result.count>=2);
   await page.locator('[data-tab="settings"]').evaluate(e=>e.click());
   const download=page.waitForEvent('download',{timeout:10000});
   await page.locator('#print-agenda').click();
   const file=await download;
   assert(file.suggestedFilename().endsWith('.pdf'));
 });
 await test('PDF preview opens before sharing, supports download and closes cleanly',async()=>{
   await page.locator('#preview-agenda').click();
   assert.equal(await page.locator('#pdf-preview-dialog').evaluate(e=>e.open),true);
   assert.match(await page.locator('#pdf-preview-frame').getAttribute('src'),/^blob:/);
   assert.equal(await page.locator('#pdf-preview-download').isVisible(),true);
   assert.equal(await page.locator('#pdf-preview-share').isVisible(),true);
   await page.locator('#pdf-preview-close').click();
   assert.equal(await page.locator('#pdf-preview-dialog').evaluate(e=>e.open),false);
   await page.locator('#share-agenda').click();
   assert.equal(await page.locator('#pdf-preview-dialog').evaluate(e=>e.open),true);
   await page.locator('#pdf-preview-close').click();
   await page.locator('[data-tab="daily"]').evaluate(e=>e.click());
   await page.locator('#daily-pdf-share').click();
   assert.equal(await page.locator('#pdf-preview-dialog').evaluate(e=>e.open),true);
   await page.locator('#pdf-preview-close').click();
 });
 await test('Offline reload loads cached app and existing entries',async()=>{
   const swState=await page.evaluate(async()=>{
     const regs=('serviceWorker' in navigator)?await navigator.serviceWorker.getRegistrations():[];
     const keys=await caches.keys();
     return {registrations:regs.map(x=>({scope:x.scope,active:!!x.active,waiting:!!x.waiting,installing:!!x.installing})),controlled:!!navigator.serviceWorker.controller,caches:keys};
   });
   console.log('SERVICE WORKER STATE '+JSON.stringify(swState));
   assert(swState.registrations.length>0,'Service worker not registered');
   assert(swState.caches.includes('ka-agenda-any-year-v39'),'Offline cache not installed');
   const cached=await page.evaluate(async()=>!!(await (await caches.open('ka-agenda-any-year-v39')).match('./app.js')));
   assert(cached,'Missing cached app.js');
   await context.setOffline(true);
   console.log('OFFLINE: reloading cached document');
   await page.reload({waitUntil:'domcontentloaded',timeout:12000});
   const value=await page.evaluate(d=>JSON.parse(localStorage.getItem('ka-2027-agenda-v1')).days[d].daynotes,today);
   assert.equal(value,'Browser regression note');
   await context.setOffline(false);
 });
 assert.deepEqual(exceptions,[],'Unexpected browser exceptions');
 assert.deepEqual(failures,[],'HTTP asset failures');
 console.log('PASS No uncaught browser errors or missing assets');
 } finally {await context.close();await browser.close()}
}
setTimeout(()=>{console.error('FATAL: browser regression exceeded 110 seconds');process.exit(1)},110000).unref();
main().catch(e=>{console.error(e);process.exit(1)});