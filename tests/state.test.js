var stateChecks=0;
function stateTest(ok,msg){if(!ok)throw new Error(msg);stateChecks++;}
function rejects(fn,msg){var rejected=false;try{fn();}catch(e){rejected=true;}stateTest(rejected,msg);}
var workspace=AGState.fresh(db),c=AGState.current(workspace);
stateTest(AGState.validate(workspace,db).cases.length===5,'five isolated fictional cases');
rejects(function(){AGState.confirm(c,db.version);},'incomplete plans cannot be confirmed');
c.draft.goal='Explain a mathematical strategy';c.draft.baseline='Independent explanation rubric';c.draft.opportunity='Extension inquiry';c.draft.responsible='Mathematics educator';c.draft.reviewDate='2026-10-20';
c.selected=['math-reflection'];var p=AGState.confirm(c,db.version);
c.draft.goal='Explain and transfer a strategy';
stateTest(p.fields.goal==='Explain a mathematical strategy','confirmed snapshots remain immutable');
c.reviews.push({id:'review-1',planId:p.id,date:'2026-10-03',decision:'adapt',rationale:'Examine task access and learner response',nextPlanId:null,synthetic:true});
var p2=AGState.confirm(c,db.version);
stateTest(p2.previousPlanId===p.id&&p2.version===2,'versions form an ordered chain');
stateTest(c.reviews[0].nextPlanId===p2.id,'adaptation review links to next plan');
c.observations.push({id:'obs-1',planId:p.id,date:'2026-10-02',measure:'Rubric',value:0,unit:'points',ai:'none',accommodations:'Speech to text',delivery:'Completed',feedback:'Could participate',synthetic:true});
c.observations.push(Object.assign({},c.observations[0],{id:'obs-2',value:null}));
var roundtrip=AGState.parse(JSON.stringify(workspace),db);
stateTest(roundtrip.cases[0].observations[0].value===0&&roundtrip.cases[0].observations[1].value===null,'zero and missing survive round trip');
roundtrip.cases[0].draft.goal='changed';stateTest(c.draft.goal!==roundtrip.cases[0].draft.goal,'imports are independent copies');
function modified(fn){var v=AGState.clone(workspace);fn(v);return function(){AGState.validate(v,db);};}
rejects(modified(function(v){v.cases[0].synthetic=false;}),'real-data case rejected');
rejects(modified(function(v){v.schemaVersion=2;}),'unsupported schema rejected');
rejects(modified(function(v){v.libraryVersion='unknown';}),'unknown library rejected');
rejects(modified(function(v){v.cases[0].context.labels=['invented'];}),'unknown label rejected');
rejects(modified(function(v){v.cases[0].selected=['missing-id'];}),'invented evidence rejected');
rejects(modified(function(v){v.cases[0].observations[0].planId='other-case-plan';}),'cross-case observations rejected');
rejects(modified(function(v){v.cases[0].plans[1].previousPlanId=null;}),'broken version history rejected');
rejects(modified(function(v){v.cases[0].draft.contextDate='2026-02-30';}),'invalid calendar date rejected');
rejects(modified(function(v){v.cases[0].draft.callback='execute';}),'unexpected draft fields rejected');
rejects(function(){AGState.parse('{bad json',db);},'malformed JSON rejected');
rejects(function(){AGState.parse(' '.repeat(2000001),db);},'oversized import rejected');
var store={value:null,getItem:function(){return this.value;},setItem:function(k,v){this.value=v;}};
stateTest(AGState.save(workspace,store)==='Saved in this browser','storage success reported');
stateTest(AGState.load(db,store).workspace.cases[0].plans.length===2,'plans survive storage round trip');
store.value='bad json';var failed=AGState.load(db,store);
stateTest(failed.blocked&&store.value==='bad json','corrupt storage is preserved and auto-save blocked');
stateTest(AGState.save(workspace,{setItem:function(){throw new Error('quota');}}).indexOf('Memory only')===0,'storage failure has an export fallback');
print(stateChecks+' workspace integrity assertions passed');
