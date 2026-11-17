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
   assert(await page.locator('#dayheading').innerText().then(x=>x.includes(String(Number(today.slice(8))))));
   assert.equal(await page.locator('.journal-tile').count(),4);
 });
 await test('Journal opens, saves once and keeps unrelated fields',async()=>{
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
   await page.locator('[data-journal-open="notes"]').click();
   assert.equal(await page.locator('#daynotes').inputValue(),'Browser regression note');
   await page.locator('#journal-notes .journal-done').click();
 });
 await test('Today home is immediately actionable and reflects the existing daily plan',async()=>{
   await page.locator('[data-tab="daily"]').evaluate(e=>e.click());
   assert.equal(await page.locator('#today-home').isVisible(),true);
   assert.equal(await page.locator('#today-home-empty').isVisible(),true);
   await page.locator('#today-plan').click();
   assert.equal(await page.locator('#journal-intent').evaluate(e=>e.open),true);
   await page.locator('#oneaction').fill('Finish the important work');
   await page.locator('#journal-intent .journal-done').click();
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
   assert(swState.caches.includes('ka-agenda-any-year-v34'),'Offline cache not installed');
   const cached=await page.evaluate(async()=>!!(await (await caches.open('ka-agenda-any-year-v34')).match('./app.js')));
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