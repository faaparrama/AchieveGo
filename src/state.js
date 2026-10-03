/* Fictional browser workspace. No remote storage or individual classifier. */
var AGState = (function () {
  'use strict';
  var KEY = 'achievego.demo.workspace.v1';
  var fields = ['description','readiness','readinessSource','contextDate','interests','learnerVoice','familyVoice','barriers','goal','baseline','opportunity','support','resource','adaptations','responsible','delivery','ai','accommodations','reviewDate'];
  var stages = ['understand','plan','allocate','monitor','assess','review'];
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function id() { return 'demo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10); }
  function blank() { var d = {}; fields.forEach(function (k) { d[k] = ''; }); d.readinessSource = 'unknown'; d.ai = 'none'; return d; }
  function makeCase(p) { return {id:p.id,name:p.name,synthetic:true,context:{scenario:p.id,synthetic:true,grade:p.grade,subject:p.subject,profile:p.profile,labels:p.labels.slice(),gifted:p.gifted,needs:p.needs.slice()},draft:blank(),selected:[],plans:[],observations:[],reviews:[]}; }
  function fresh(db) { return {schemaVersion:1,libraryVersion:db.version,activeCaseId:db.presets[0].id,cases:db.presets.map(makeCase)}; }
  function keys(v, allowed, name) {
    if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).some(function (k) { return allowed.indexOf(k) < 0; })) throw new Error('Unexpected fields in ' + name + '.');
  }
  function str(v, max) { if (typeof v !== 'string' || v.length > (max || 6000)) throw new Error('Invalid or oversized text.'); }
  function array(v, max) { if (!Array.isArray(v) || v.length > max) throw new Error('Invalid or oversized list.'); }
  function date(v, optional) {
    str(v,10); if (optional && !v) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v+'T00:00:00Z')) || new Date(v+'T00:00:00Z').toISOString().slice(0,10) !== v) throw new Error('Invalid date.');
  }
  function unique(list) { if (new Set(list).size !== list.length) throw new Error('Duplicate identifiers.'); }
  function ids(list, allowed) { array(list,30); unique(list); if (list.some(function (v) { return allowed.indexOf(v) < 0; })) throw new Error('Unknown evidence or context identifier.'); }
  function context(v, caseId, db) {
    keys(v,['scenario','synthetic','grade','subject','profile','labels','gifted','needs'],'learner context');
    if (v.synthetic !== true || v.scenario !== caseId || !Number.isInteger(v.grade) || v.grade < 6 || v.grade > 12 || ['math','literacy','any'].indexOf(v.subject)<0 || !Object.prototype.hasOwnProperty.call(db.profiles,v.profile) || typeof v.gifted !== 'boolean') throw new Error('Use a valid fictional learner context.');
    ids(v.labels,Object.keys(db.labels)); ids(v.needs,Object.keys(db.needs));
  }
  function draft(v) {
    keys(v,fields,'plan fields'); fields.forEach(function (k) { str(v[k]); });
    if (['unknown','measurement','observation','learner report','family report'].indexOf(v.readinessSource)<0 || ['none','hints','feedback','generated material'].indexOf(v.ai)<0) throw new Error('Invalid source or AI condition.');
    date(v.contextDate,true); date(v.reviewDate,true);
    if (['','extension','mentor','access'].indexOf(v.resource)<0) throw new Error('Unknown fictional resource.');
  }
  function validate(v, db) {
    keys(v,['schemaVersion','libraryVersion','activeCaseId','cases'],'workspace');
    if (v.schemaVersion !== 1 || v.libraryVersion !== db.version) throw new Error('Unsupported workspace or evidence-library version.');
    str(v.activeCaseId,100); array(v.cases,30); if (!v.cases.length) throw new Error('Workspace needs at least one fictional case.');
    unique(v.cases.map(function (c) { return c.id; }));
    var evidence = db.evidence_records.map(function (r) { return r.id; });
    v.cases.forEach(function (c) {
      keys(c,['id','name','synthetic','context','draft','selected','plans','observations','reviews'],'case');
      str(c.id,100); str(c.name,100); if (!c.id || !c.name.trim() || c.synthetic !== true) throw new Error('Every case must be fictional and named.');
      context(c.context,c.id,db); draft(c.draft); ids(c.selected,evidence);
      array(c.plans,100); array(c.observations,500); array(c.reviews,100);
      unique(c.plans.map(function (p) { return p.id; })); unique(c.observations.map(function (o) { return o.id; })); unique(c.reviews.map(function (r) { return r.id; }));
      var planIds = c.plans.map(function (p) { return p.id; });
      c.plans.forEach(function (p,i) {
        keys(p,['id','version','previousPlanId','caseId','createdAt','synthetic','context','fields','evidenceIds','libraryVersion','status'],'plan');
        str(p.id,100); str(p.createdAt,100); if (!p.id || !Number.isFinite(Date.parse(p.createdAt)) || p.synthetic !== true || p.caseId !== c.id || p.version !== i+1 || p.previousPlanId !== (i ? c.plans[i-1].id : null) || p.libraryVersion !== db.version || p.status !== 'Demo confirmed') throw new Error('Invalid plan history.');
        context(p.context,c.id,db); draft(p.fields); ids(p.evidenceIds,evidence);
      });
      c.observations.forEach(function (o) {
        keys(o,['id','planId','date','measure','value','unit','ai','accommodations','delivery','feedback','synthetic'],'observation');
        ['id','planId','measure','unit','ai','accommodations','delivery','feedback'].forEach(function (k) { str(o[k]); }); date(o.date);
        if (!o.id || planIds.indexOf(o.planId)<0 || !o.measure.trim() || o.synthetic !== true || (o.value !== null && (typeof o.value !== 'number' || !Number.isFinite(o.value))) || ['none','hints','feedback','generated material'].indexOf(o.ai)<0) throw new Error('Invalid synthetic observation.');
      });
      c.reviews.forEach(function (r) {
        keys(r,['id','planId','date','decision','rationale','nextPlanId','synthetic'],'review');
        ['id','planId','decision','rationale'].forEach(function (k) { str(r[k]); }); date(r.date);
        if (!r.id || r.synthetic !== true || planIds.indexOf(r.planId)<0 || (r.nextPlanId !== null && planIds.indexOf(r.nextPlanId)<0) || ['continue','adapt','replace','gather information'].indexOf(r.decision)<0 || !r.rationale.trim()) throw new Error('Invalid review.');
        if (r.nextPlanId !== null && planIds.indexOf(r.nextPlanId) !== planIds.indexOf(r.planId)+1) throw new Error('Review must link to the next plan version.');
      });
    });
    if (!v.cases.some(function (c) { return c.id === v.activeCaseId; })) throw new Error('Active case is missing.');
    return clone(v);
  }
  function parse(text,db) { if (typeof text !== 'string' || text.length > 2000000) throw new Error('Import must be a JSON workspace under 2 MB.'); return validate(JSON.parse(text),db); }
  function load(db,storage) {
    try { var raw=storage.getItem(KEY); return {workspace:raw ? parse(raw,db) : fresh(db),message:raw ? 'Restored from this browser' : 'Ready to save in this browser',blocked:false}; }
    catch(e) { return {workspace:fresh(db),message:'Browser storage could not be restored. Use export; reset to enable saving.',blocked:true}; }
  }
  function save(v,storage) { try { storage.setItem(KEY,JSON.stringify(v)); return 'Saved in this browser'; } catch(e) { return 'Memory only · export to keep your work'; } }
  function current(v) { return v.cases.find(function (c) { return c.id === v.activeCaseId; }); }
  function confirm(c,libraryVersion) {
    if (['goal','baseline','opportunity','responsible','reviewDate'].some(function (k) { return !c.draft[k].trim(); })) throw new Error('Add a goal, baseline, opportunity, responsible role, and review date first.');
    draft(c.draft);
    var prev=c.plans.length ? c.plans[c.plans.length-1] : null;
    var p={id:id(),version:c.plans.length+1,previousPlanId:prev ? prev.id : null,caseId:c.id,createdAt:new Date().toISOString(),synthetic:true,context:clone(c.context),fields:clone(c.draft),evidenceIds:c.selected.slice(),libraryVersion:libraryVersion,status:'Demo confirmed'};
    c.plans.push(p);
    if (prev) c.reviews.filter(function (r) { return r.planId===prev.id && !r.nextPlanId && ['adapt','replace'].indexOf(r.decision)>=0; }).forEach(function (r) { r.nextPlanId=p.id; });
    return p;
  }
  return {KEY:KEY,fields:fields,stages:stages,clone:clone,id:id,blank:blank,makeCase:makeCase,fresh:fresh,validate:validate,parse:parse,load:load,save:save,current:current,confirm:confirm};
}());
