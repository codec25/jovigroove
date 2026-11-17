'use strict';
// node agenda-2027/tests/regression.cjs
// Guards against competing handlers and broken offline assets. Browser tests still required.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(dir,n),'utf8');
const html=read('index.html'),app=read('app.js'),journal=read('journal-controller.js');
const growth=read('growth-controller.js'),presets=read('presets-controller.js');
const planning=read('planning-controller.js'),pdf=read('pdf-export.js'),sw=read('sw.js');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name)}
check('All controllers parse',()=>{for(const n of ['app.js','journal-controller.js','growth-controller.js','presets-controller.js','planning-controller.js','pdf-export.js','sw.js'])new Function(read(n))});
check('Unique HTML IDs',()=>{const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size)});
check('All local scripts exist, loaded only once',()=>{
 const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
 assert.equal(scripts.at(-1),'./app.js');assert.equal(scripts.length,new Set(scripts).size);
 for(const name of scripts)assert(fs.existsSync(path.join(dir,name)),'Missing '+name);
 assert(fs.existsSync(path.join(dir,'app.css')));
});
check('Journal popups have one UI owner',()=>{
 assert(journal.includes('function openPanel(')&&journal.includes('function closePanel('));
 assert(!app.includes('function openJournal('));assert(!app.includes('/* Premium journal pages:'));
});
check('Daily writing has one saving owner',()=>{
 assert(app.includes('data.days[selected][el.dataset.day]=el.value'));
 assert(!journal.includes('function saveField('));
 assert(!journal.includes('localStorage.setItem(KEY,JSON.stringify(db))'));
});
check('Day navigation updates journal previews',()=>{
 assert(app.includes("new CustomEvent('kingdom:dayChanged'"));
 assert(journal.includes("'kingdom:dayChanged'"));
});
check('Existing data keys remain compatible',()=>{
 assert(app.includes('ka-2027-agenda-v1'));assert(growth.includes('ka-whole-life-growth-v1'));assert(presets.includes('ka-presets-v1'));
});
check('PDF controls have one owner',()=>{
 for(const id of ['print-agenda','share-agenda','daily-pdf-share'])assert(pdf.includes(id));
 assert(!presets.includes("print-agenda').onclick="));
});
check('Planning updates synchronize with the main store',()=>{
 assert(app.includes("'kingdom:planningChanged'"));assert(planning.includes("'kingdom:planningChanged'"));
 assert(app.includes("'kingdom:presetScheduled'"));assert(presets.includes("'kingdom:presetScheduled'"));
});
check('Offline cache covers each script and CSS',()=>{
 const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
 for(const name of scripts.concat('./app.css'))assert(sw.includes("'"+name+"'"),'Missing cache asset: '+name);
});
check('Journal editing preserves unrelated fields',()=>{
 const pattern=/document\.querySelectorAll\('\[data-day\]'\)\.forEach\(function\(el\)\{el\.addEventListener\('input',function\(\)\{([\s\S]*?)\}\)\}\);/;
 const handler=app.match(pattern);assert(handler,'Missing day-save listener');
 let count=0,snapshot,selected='2026-11-17';
 const data={days:{[selected]:{daynotes:'Before',prayer:'Keep prayer'}}};
 new Function('el','data','selected','save',handler[1])({dataset:{day:'daynotes'},value:'After'},data,selected,()=>{count++;snapshot=JSON.parse(JSON.stringify(data))});
 assert.equal(count,1);assert.equal(snapshot.days[selected].daynotes,'After');assert.equal(snapshot.days[selected].prayer,'Keep prayer');
});
console.log('\n'+passed+' regression checks passed.');