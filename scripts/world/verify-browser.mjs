/** Run with the installed Taste Skill's scripts/lib/cdp.mjs as the first argument. */
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { Browser, sleep } = await import(pathToFileURL(process.argv[2]).href);
const base = process.argv[3] || 'http://127.0.0.1:4173/';
const out = process.argv[4] || 'docs/screenshots/living-world-first-slice';
mkdirSync(out, {recursive:true});
const browser = await Browser.launch();
const result = { browser: await browser.send('Browser.getVersion'), base, scenarios: [], profiles: [] };
const passed = (name, detail) => { result.scenarios.push({ name, result: 'pass', detail }); console.log('PASS ' + name); };
const evaluate = (page, expression) => page.eval(expression);
async function until(page, expression, timeout = 12000) {
 const start = Date.now();
 while (Date.now() - start < timeout) { if (await evaluate(page, expression)) return; await sleep(80); }
 throw new Error('Timed out: ' + expression + ' — ' + await page.eval(()=>({status:document.querySelector('.world-travel-status')?.textContent,active:document.activeElement?.textContent})).then(JSON.stringify));
}
async function click(page, label) {
 await page.send('Page.bringToFront');
 const rect = await page.eval((label) => {
  const button = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === label);
  if (!button) throw new Error('No button ' + label);
  const rect = button.getBoundingClientRect(); return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};
 }, label);
 await page.send('Input.dispatchMouseEvent', {type:'mousePressed',button:'left',clickCount:1,...rect});
 await page.send('Input.dispatchMouseEvent', {type:'mouseReleased',button:'left',clickCount:1,...rect});
}
const ready = (page) => until(page, `document.querySelector('[data-world-status]')?.dataset.worldStatus === 'ready'`);
const isFocused = `document.querySelector('.world-travel-status')?.textContent === 'At the Observatory'`;
const isOverview = `document.querySelector('.world-travel-status')?.textContent === 'Island overview'`;
async function frameCount(page) {return page.eval(()=>window.__ambientWorldProfile?.frames.length || 0);}
try {
 const page = await browser.newPage({width:1440,height:900});
 await page.goto(base + '?world=observatory&profile=1'); await ready(page);
 assert.equal(page.consoleErrors.length,0);
 await page.eval(()=>document.querySelector('canvas').dataset.identity='persistent');
 for (const [width,height] of [[1366,768],[1440,900],[1920,1080],[3440,1440]]) {
  await page.setViewport({width,height,dsf:2}); await sleep(300);
  await page.screenshot({path:`${out}/overview-${width}.png`,format:'png'});
  const layout = await page.eval(()=>({scroll:document.documentElement.scrollHeight > innerHeight,
   horizontal:document.documentElement.scrollWidth > innerWidth,
   controls:[...document.querySelectorAll('button')].map(b=>({label:b.textContent.trim(),width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})),
   rail:document.querySelector('.world-reading-rail').getBoundingClientRect().toJSON(),footer:document.querySelector('.world-footer').getBoundingClientRect().toJSON(),
   buffer:[document.querySelector('canvas').width,document.querySelector('canvas').height]}));
  assert.equal(layout.scroll,false); assert.equal(layout.horizontal,false);
  assert.ok(layout.rail.bottom <= layout.footer.top, 'Rail overlaps footer');
  assert.ok(layout.buffer[0]*layout.buffer[1] <= 5_000_000);
  assert.ok(layout.controls.every(b=>b.height>=44));
  await click(page,'Select Observatory'); await until(page,isFocused);
  assert.equal(await page.eval(()=>document.querySelector('canvas').dataset.identity),'persistent');
  await page.screenshot({path:`${out}/observatory-${width}.png`,format:'png'});
  await click(page,'Return to Overview'); await until(page,isOverview);
  passed(`desktop-${width}x${height}`,layout);
 }
 await page.setViewport({width:1440,height:900}); await sleep(200);
 await page.eval(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Select Observatory').focus());
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});
 await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await until(page,isFocused);
 assert.equal(await page.eval(()=>document.activeElement.id),'observatory-title');
 await click(page,'Return to Overview'); await until(page,isOverview);
 passed('keyboard-enter-and-focus-return');
 await page.eval(()=>{document.body.tabIndex=-1;document.body.focus();document.body.removeAttribute('tabindex')});
 const tabOrder=[];
 for(let i=0;i<5;i++) {
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  tabOrder.push(await page.eval(()=>document.activeElement.textContent.trim()));
 }
 assert.deepEqual(tabOrder,['Ambient Brief','Open dashboard','Overview','Select Observatory','Motion on']);
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',text:' ',windowsVirtualKeyCode:32});
 await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
 await until(page,`document.querySelector('.world-footer button').textContent === 'Still view'`,800);
 await click(page,'Still view');
 await click(page,'Select Observatory');await sleep(150);
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert.equal(await page.eval(()=>document.querySelector('.world-travel-status').textContent),'Travel stopped');
 await click(page,'Return to Overview');await until(page,isOverview);
 passed('tab-order-space-and-escape',tabOrder);
 await click(page,'Select Observatory'); await sleep(200); await click(page,'Stop motion');
 assert.equal(await page.eval(()=>document.querySelector('.world-travel-status').textContent),'Travel stopped');
 await sleep(1900);
 assert.equal(await page.eval(()=>document.querySelector('.world-travel-status').textContent),'Travel stopped');
 await click(page,'Continue to Observatory'); await until(page,isFocused);
 await click(page,'Return to Overview'); await sleep(180); await click(page,'Select Observatory'); await until(page,isFocused);
 passed('stop-continue-and-midroute-replacement');
 await click(page,'Motion on'); await sleep(250);
 const before = await frameCount(page); await sleep(1600); assert.equal(await frameCount(page),before);
 await click(page,'Return to Overview'); await until(page,isOverview,800);
 const reducedFrames = await frameCount(page); await sleep(1200); assert.equal(await frameCount(page),reducedFrames);
 passed('session-still-zero-continuous-frames-and-instant-navigation');
 await click(page,'Still view');
 await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await sleep(250); const osFrames=await frameCount(page); await sleep(1200); assert.equal(await frameCount(page),osFrames);
 await click(page,'Select Observatory'); await until(page,isFocused,800);
 passed('os-reduced-motion');
 await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await click(page,'Return to Overview'); await until(page,isOverview);
 await click(page,'Select Observatory'); await sleep(200);
 await page.eval(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
 await sleep(300); const hiddenFrames=await frameCount(page); await sleep(1400); assert.equal(await frameCount(page),hiddenFrames);
 await page.eval(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});
 await sleep(200);
 assert.equal(await page.eval(()=>document.querySelector('.world-travel-status').textContent),'Travel stopped');
 passed('hidden-pauses-and-does-not-resume-travel');
 await click(page,'Return to Overview'); await until(page,isOverview);
 // Actual context-loss extension and repeated resource recovery, no fake error flag.
 const resources=[];
 for (let i=0;i<20;i++) {
  await page.eval(()=>document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await until(page,`document.querySelector('[data-world-status]').dataset.worldStatus === 'failed'`,1500);
  await click(page,'Retry world'); await ready(page); await sleep(150);
  resources.push(await page.eval(()=>window.__ambientWorldProfile.frames.at(-1)));
 }
 assert.ok(resources.every(frame=>frame.geometries === resources[0].geometries && frame.textures === resources[0].textures));
 passed('twenty-real-context-loss-retries',resources);
 assert.equal(page.consoleErrors.length,0);
 await page.close();
 for (const width of [768,390,320]) {
  const narrow = await browser.newPage({width,height:844,reducedMotion:true});
  await narrow.goto(base+'?world=observatory'); await ready(narrow);
  assert.equal(await narrow.eval(()=>document.documentElement.scrollWidth>innerWidth),false);
  await narrow.screenshot({path:`${out}/reflow-${width}.png`,format:'png',fullPage:true});
  passed('reflow-'+width); await narrow.close();
 }
 const blocked = await browser.newPage({width:1440,height:900});
 await blocked.send('Page.addScriptToEvaluateOnNewDocument',{source:`const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)}`});
 await blocked.goto(base+'?world=observatory');
 await until(blocked,`document.querySelector('[data-world-status]').dataset.worldStatus === 'failed'`);
 await click(blocked,'Select Observatory'); await until(blocked,isFocused,800);
 await blocked.screenshot({path:`${out}/no-webgl.png`,format:'png'});
 passed('no-webgl-semantic-navigation'); await blocked.close();
 for (const settings of [{reducedMotion:true},{backgroundMotion:'static'}]) {
  const saved=await browser.newPage();
  await saved.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('ambient_brief_settings_v1', '${JSON.stringify(settings)}')`});
  await saved.goto(base+'?world=observatory&profile=1');await ready(saved);await sleep(300);
  const frames=await frameCount(saved);await sleep(1200);assert.equal(await frameCount(saved),frames);
  await click(saved,'Select Observatory');await until(saved,isFocused,800);
  await saved.eval(()=>localStorage.removeItem('ambient_brief_settings_v1'));
  passed('saved-policy-'+Object.keys(settings)[0]);await saved.close();
 }
 for (const [name,urls] of [['asset-failure',['*atlantic-observatory*.glb']],['chunk-failure',['*WorldEntry*']],['dom-fallback',['*atlantic-observatory*.glb','*overview.webp']]]) {
  const failed=await browser.newPage(); await failed.send('Network.enable'); await failed.send('Network.setBlockedURLs',{urls});
  await failed.goto(base+'?world=observatory');
  await until(failed,`document.querySelector('[data-world-status]').dataset.worldStatus === 'failed'`);
  await click(failed,'Select Observatory'); await until(failed,isFocused,800);
  await click(failed,'Return to Overview'); await until(failed,isOverview,800);
  await failed.screenshot({path:`${out}/${name}.png`,format:'png'});
  passed(name); await failed.close();
 }
 const drawFailure=await browser.newPage();await drawFailure.goto(base+'?world=observatory');await ready(drawFailure);
 await drawFailure.eval(()=>{WebGL2RenderingContext.prototype.drawElements=function(){throw new Error('Injected draw failure')};});
 await until(drawFailure,`document.querySelector('[data-world-status]').dataset.worldStatus === 'failed'`,1500);
 await click(drawFailure,'Select Observatory');await until(drawFailure,isFocused,800);
 passed('renderer-draw-error-isolated');await drawFailure.close();
 const stalled=await browser.newPage();await stalled.send('Fetch.enable',{patterns:[{urlPattern:'*atlantic-observatory*.glb',requestStage:'Request'}]});
 await stalled.goto(base+'?world=observatory',{settleMs:100});
 await until(stalled,`document.querySelector('[data-world-status]')?.dataset.worldStatus === 'failed'`,18000);
 await stalled.send('Fetch.disable');await click(stalled,'Retry world');await ready(stalled);
 passed('fifteen-second-asset-deadline-and-retry');await stalled.close();
 // Short preliminary rendered-frame sample, not the full reference-device protocol.
 const profile=await browser.newPage({width:3440,height:1440,dsf:2});
 await profile.goto(base+'?world=observatory&profile=1');await ready(profile);await sleep(5000);
 await profile.eval(()=>window.__ambientWorldProfile.frames.length=0);await sleep(15000);
 const sample=await profile.eval(()=>window.__ambientWorldProfile);
 result.profiles.push({name:'ultrawide-settled-15s-preliminary',...sample});
 await profile.close();
 for (let run=0;run<5;run++) {
  const cold=await browser.newPage({width:1920,height:1080});
  await cold.send('Page.addScriptToEvaluateOnNewDocument',{source:`globalThis.__worldVitals={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())globalThis.__worldVitals.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)globalThis.__worldVitals.cls+=e.value}).observe({type:'layout-shift',buffered:true});`});
  await cold.send('Network.enable');await cold.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cold.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:20_000_000/8,uploadThroughput:5_000_000/8});
  await cold.goto(base+'?world=observatory');await ready(cold);
  const coldResult=await cold.eval(()=>({vitals:globalThis.__worldVitals,marks:performance.getEntriesByType('mark').map(e=>({name:e.name,startTime:e.startTime})),requests:performance.getEntriesByType('resource').map(e=>({name:e.name,transfer:e.transferSize,encoded:e.encodedBodySize}))}));
  assert.ok(coldResult.requests.every(request=>new URL(request.name).origin===new URL(base).origin),'Unexpected external request');
  result.profiles.push({name:'cold-'+run,...coldResult});
  await cold.close(); console.log('COLD '+(run+1));
 }
 passed('no-unhandled-exceptions-normal-scene');
} catch(error) { result.error=error.stack; console.error(error); process.exitCode=1; }
finally { writeFileSync(`${out}/browser-results.json`,JSON.stringify(result,null,2)+'\n');await browser.close(); }
