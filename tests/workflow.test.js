/* Appended after browser.test.js to a temporary built page. */
(async function(){
  var count=0,marker=document.createElement('pre');marker.id='workflow-test-result';document.body.appendChild(marker);
  function ok(c,m){if(!c)throw new Error(m);count++;}
  var $=function(id){return document.getElementById(id);};
  function input(id,v){$(id).value=v;$(id).dispatchEvent(new Event('input',{bubbles:true}));$(id).dispatchEvent(new Event('change',{bubbles:true}));}
  function route(hash){window.location.hash=hash;window.dispatchEvent(new Event('hashchange'));}
  function submit(id){$(id).dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}
  try{
    // Wait for the existing asynchronous evidence/chat harness to finish.
    for(var i=0;i<200&&!/^(PASS|FAIL)/.test($('browser-test-result').textContent);i++)await new Promise(function(r){setTimeout(r,10);});
    ok($('browser-test-result').textContent.startsWith('PASS'),'existing browser behavior passed');
    window.confirm=function(){return true;};$('workspace-reset').click();
    route('#home');ok(!$('home-view').hidden&&$('workspace-view').hidden,'distinct Home');
    $('home-tab').focus();document.querySelector('.skip-link').click();ok(document.activeElement===$('main-content')&&window.location.hash==='#home','skip link preserves routing and focuses content');
    route('#workspace/plan');ok(!$('workspace-view').hidden&&document.querySelector('[data-stage="understand"]').hidden&&!document.querySelector('[data-stage="plan"]').hidden,'direct stage navigation');
    ok($('plan-preview').textContent.includes('No curated evidence selected'),'empty evidence disclosed');
    input('field-goal','Explain and transfer a mathematical strategy');input('field-baseline','Independent explanation, rubric 0–4');input('field-opportunity','Advanced geometry inquiry');input('field-responsible','Mathematics educator');input('field-reviewDate','2026-10-20');input('field-accommodations','Speech to text');
    document.querySelector('[data-select="math-reflection"]').click();
    route('#workspace/allocate');$('confirm-plan').click();
    ok(window.AGFlow.state().cases[0].plans.length===1,'confirmed plan saved');
    ok(JSON.parse(localStorage.getItem(AGState.KEY)).cases[0].plans.length===1,'browser persistence contains plan');
    var exportBlob,originalURL=URL.createObjectURL;URL.createObjectURL=function(blob){exportBlob=blob;return originalURL.call(URL,blob);};
    $('export').click();var reviewExport=JSON.parse(await exportBlob.text());URL.createObjectURL=originalURL;
    ok(reviewExport.review_fields.learner_goal==='Explain and transfer a mathematical strategy'&&reviewExport.review_fields.baseline_and_measure==='Independent explanation, rubric 0–4','review export uses populated draft fields');
    route('#workspace/monitor');$('load-observations').click();$('load-observations').click();
    ok(window.AGFlow.state().cases[0].observations.length===3,'sample load is explicit and duplicate-safe');
    input('observation-date','2026-10-03');input('observation-measure','Zero rubric');input('observation-value','0');submit('observation-form');
    input('observation-value','');submit('observation-form');
    var obs=window.AGFlow.state().cases[0].observations;
    ok(obs[3].value===0&&obs[4].value===null,'zero and missing stay distinct in UI');
    route('#workspace/assess');ok($('assessment-view').querySelectorAll('.assessment-group').length===3,'different AI conditions and measures separated');
    ok($('assessment-view').textContent.includes('Missing')&&$('assessment-view').textContent.includes('Speech to text'),'missing values and access conditions visible');
    route('#workspace/review');input('review-decision','adapt');input('review-rationale','Preserve challenge and adjust the task to support participation.');submit('review-form');
    input('field-support','Accessible response format and choice of partner');route('#workspace/allocate');$('confirm-plan').click();
    var c=window.AGFlow.state().cases[0];ok(c.plans.length===2&&c.plans[0].fields.support==='','old version immutable');
    ok(c.reviews[0].nextPlanId===c.plans[1].id,'review linked to revision');
    ok($('version-history').textContent.includes('Accessible response format'),'version differences visible');
    input('preset','noor');ok(window.AGFlow.state().activeCaseId==='noor'&&$('field-goal').value==='','case drafts isolated');
    input('preset','maya');ok($('field-goal').value==='Explain and transfer a mathematical strategy','case draft restored');
    route('#workspace/understand');input('new-case-name','<img src=x onerror="window.injected=true">');$('new-case').click();
    ok(!window.injected&&!$('case-summary').querySelector('img'),'case names safely rendered');
    ok(window.AGFlow.state().cases.length===6&&window.AGWorkspace.context().profile==='unknown','new fictional case unclassified');
    route('#assistant');ok($('chat-context-preview').textContent.includes('Stage: understand'),'assistant uses current stage');
    route('#evidence');document.querySelector('[data-compare="math-reflection"]').click();document.querySelector('[data-compare="enrichment"]').click();
    ok($('evidence-comparison').querySelectorAll('.comparison-grid article').length===2,'evidence comparison preserves distinct records');
    route('#framework');ok(document.querySelectorAll('.figure-gallery img').length===2,'additional figures available');
    ['#home','#workspace/understand','#workspace/plan','#workspace/allocate','#workspace/monitor','#workspace/assess','#workspace/review','#evidence','#framework','#assistant'].forEach(function(h){route(h);ok(document.documentElement.scrollWidth<=window.innerWidth,'no page overflow at '+h);});
    ok(window.innerWidth>0,'browser viewport measured');
    input('preset','maya');route('#workspace/review');
    marker.textContent='PASS: '+count+' workflow assertions; viewport '+window.innerWidth+'×'+window.innerHeight;
  }catch(e){marker.textContent='FAIL: '+e.message+'; viewport '+window.innerWidth;}
}());
