(function () {
  'use strict';
  var db = JSON.parse(document.getElementById('library-data').textContent);
  var selected = new Set();
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  function option(value, name) { return '<option value="' + esc(value) + '">' + esc(name) + '</option>'; }
  $('preset').innerHTML = db.presets.map(function (p) { return option(p.id, p.name); }).join('');
  $('grade').innerHTML = [6,7,8,9,10,11,12].map(function (g) { return option(g, g); }).join('');
  $('profile').innerHTML = Object.keys(db.profiles).map(function (p) { return option(p, db.profiles[p].name); }).join('');
  ['labels','needs'].forEach(function (kind) {
    $(kind).innerHTML = Object.keys(db[kind]).map(function (key) {
      return '<label class="check"><input type="checkbox" value="' + esc(key) + '">' + esc(kind === 'labels' ? db.labels[key].name : db.needs[key]) + '</label>';
    }).join('');
  });
  function checked(kind) { return Array.from($(kind).querySelectorAll('input:checked')).map(function (x) { return x.value; }); }
  function learner() { return {scenario: $('preset').value, synthetic: true, profile: $('profile').value, grade: Number($('grade').value), subject: $('subject').value, labels: checked('labels'), gifted: $('gifted').checked, needs: checked('needs')}; }
  function card(row, selectable) {
    var r = row.record, source = db.sources[r.source_id];
    var caution = ['Minimal','No Discernible Effects','Potentially Positive Effects'].indexOf(r.rating) >= 0;
    var grades = r.grade_min === r.grade_max ? 'Grade ' + r.grade_min : 'Grades ' + r.grade_min + '–' + r.grade_max;
    return '<article class="card" data-record="' + esc(r.id) + '"><p class="source-kind">' + esc(source.kind) + ' · ' + esc(source.year) + '</p><div class="card-top"><h3>' + esc(r.title) + '</h3>' + (selectable ? '<label class="check select-card"><input type="checkbox" data-select="' + esc(r.id) + '" ' + (selected.has(r.id) ? 'checked' : '') + '>Add to plan</label>' : '<button data-compare="' + esc(r.id) + '" type="button">Compare</button>') + '</div>' +
      '<span class="badge ' + (caution ? 'caution' : '') + '">' + esc(r.rating) + '</span><span class="badge">' + esc(grades) + '</span>' +
      '<p class="outcome"><strong>Outcome:</strong> ' + esc(r.outcome) + '</p><p>' + esc(r.implementation) + '</p>' +
      (selectable ? '<p><strong>Goal for team review:</strong> ' + row.goals.map(function (n) { return esc(db.needs[n]); }).join(' · ') + '. The match remains unvalidated.</p>' : '<p><strong>Applicability in this scenario:</strong> ' + esc(row.reason) + '</p>') +
      '<details><summary>Evidence, applicability & implementation</summary><dl>' +
      '<dt>Source rating framework</dt><dd>' + esc(r.rating_framework) + '; ' + esc(r.locator) + '.</dd>' +
      ('essa_tier' in r ? '<dt>Separate ESSA tier</dt><dd>' + esc(r.essa_tier || 'No tier displayed for this outcome') + '. ' + esc(r.essa_basis) + '.</dd>' : '') +
      '<dt>Population and grade scope</dt><dd>' + esc(r.population) + '. ' + esc(r.grade_basis) + '.</dd>' +
      '<dt>Limits of the evidence</dt><dd>' + esc(r.limitations) + '</dd><dt>Profile × diagnosis evidence</dt><dd>' + esc(r.exact_profile_diagnosis_effect) + '.</dd>' +
      '<dt>AchieveGo mapping rule</dt><dd>' + esc(row.rule.status) + '. ' + esc(row.rule.rationale) + '</dd>' +
      '<dt>Possible measures for review</dt><dd>' + esc(r.monitor) + ' The team should judge whether these measures fit its goal and setting.</dd>' +
      (r.source_discrepancy ? '<dt>Source discrepancy retained</dt><dd>' + esc(r.source_discrepancy) + '</dd>' : '') +
      '<dt>Provenance</dt><dd>' + esc(source.curation_status) + '. Checked ' + esc(source.checked) + '. ' + esc(r.snapshot ? 'Export: ' + r.snapshot : '') + '</dd></dl>' +
      '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.title) + ' ↗</a></details></article>';
  }
  function selectionCount() { $('selected-count').textContent = selected.size; $('export').disabled = selected.size === 0; document.dispatchEvent(new CustomEvent('achievego:selection-change')); }
  function render() {
    var l = learner(), result = AGEngine.assess(db, l);
    selected.forEach(function (id) { if (!result.candidates.some(function (r) { return r.record.id === id; })) selected.delete(id); });
    $('profile-question').textContent = db.profiles[l.profile].question;
    $('result-title').textContent = result.candidates.length + ' candidates for team review';
    $('questions').innerHTML = l.labels.length ? '<details class="questions" open><summary>Questions raised by documented context</summary>' + l.labels.map(function (key) { return '<p>' + esc(db.labels[key].question) + '</p>'; }).join('') + '<p>This library has no established intervention effect for a specific profile and diagnosis combination.</p></details>' : '';
    $('gaps').innerHTML = result.gaps.map(function (key) { return '<div class="gap"><strong>Evidence gap in this starter set · ' + esc(db.needs[key]) + '</strong>' + (key === 'wellbeing' ? 'Discuss the concern with the learner and appropriate school support staff. The academic and dropout records here do not address well-being directly.' : 'The selected goal, grade, and subject have no matching candidate in this small library. Broaden the evidence review before choosing an approach.') + ' This gap describes the starter library, not the full evidence base.</div>'; }).join('');
    ['support','opportunity'].forEach(function (lane) {
      var rows = result.candidates.filter(function (r) { return r.record.lane === lane; });
      $(lane + '-cards').innerHTML = rows.length ? rows.map(function (r) { return card(r,true); }).join('') : '<p class="empty">' + (lane === 'opportunity' ? 'Record readiness and interest to review advanced opportunities across profiles and identification categories.' : 'No support record fits the current selection. Confirm the goal, grade, and subject before reviewing this library.') + '</p>';
    });
    var related = result.rows.filter(function (r) { return r.record.source_id === 'cc' && !r.candidate && l.needs.indexOf('offtrack') >= 0; });
    $('related-wrap').hidden = related.length === 0;
    $('related-wrap').open = related.length > 0;
    $('related-cards').innerHTML = related.map(function (r) { return card(r,false); }).join('');
    renderLibrary(result); selectionCount();
    document.dispatchEvent(new CustomEvent('achievego:context-change'));
  }

  var catalog = db.research_catalog;
  var typeNames = {meta_analysis: 'Meta-analysis', systematic_review: 'Systematic review', randomized_controlled_trial: 'Randomized controlled trial'};
  var extraSources = catalog.publications.filter(function (p) { return !p.linked_library_source; }).length;
  $('evidence-counts').textContent = db.evidence_records.length + ' curated planning records and ' + catalog.publications.length + ' research publications with ' + catalog.findings.length + ' outcome extractions. These represent ' + (Object.keys(db.sources).length + extraSources) + ' distinct sources, not independent programs or studies.';
  function researchCard(p) {
    var findings = catalog.findings.filter(function (f) { return f.publication_id === p.id; });
    var rows = findings.map(function (f) {
      var e = f.effect;
      var stat = e.estimate === null ? e.missing_reason : e.metric + ' = ' + e.estimate + (e.ci_lower === null ? '; interval not extracted' : '; ' + (e.ci_level * 100) + '% CI [' + e.ci_lower + ', ' + e.ci_upper + ']');
      return '<li><strong>' + esc(f.outcome) + '</strong> · ' + esc(f.direction.replace(/_/g,' ')) + '<p>' + esc(f.summary) + '</p><p>' + esc(f.population) + ' · ' + esc(f.timepoint) + '</p><p>' + esc(stat) + '</p><p class="muted">Source location: ' + esc(f.locator) + '</p></li>';
    }).join('');
    return '<article class="card research-card" data-publication="' + esc(p.id) + '"><p class="source-kind">' + esc(typeNames[p.publication_type]) + ' · ' + esc(p.year) + '</p><h3>' + esc(p.title) + '</h3><span class="badge caution">' + esc(p.review_status.replace(/_/g,' ')) + '</span><span class="badge">No WWC rating assigned</span><p>' + esc(p.population) + '</p><p>' + esc(p.intervention) + '</p><details><summary>Outcomes, methods & review status</summary><p><strong>Comparison:</strong> ' + esc(p.comparison) + '</p><p><strong>Synthesis:</strong> ' + esc(p.synthesis_method.replace(/_/g,' ')) + '</p><ul>' + rows + '</ul><p><strong>Limits:</strong> ' + esc(p.limitations) + '</p><p><strong>Appraisal:</strong> ' + esc(p.appraisal.status.replace(/_/g,' ')) + '. <strong>Study overlap:</strong> ' + esc(p.overlap_status.replace(/_/g,' ')) + '.</p><p><strong>Access:</strong> ' + esc(p.access_basis.replace(/_/g,' ')) + '; checked ' + esc(p.checked) + '. ' + esc(p.citation) + '</p><p>Profile × diagnosis effects have not been established in this catalog.</p>' + (p.linked_library_source ? '<p>Also represented in the curated planning library; do not count as an independent source.</p>' : '') + '</details><a href="' + esc(p.source_url) + '" target="_blank" rel="noopener">Read the source ↗</a></article>';
  }
  function renderResearch(q) {
    var kind = $('research-type').value;
    var publications = catalog.publications.filter(function (p) {
      var typeFit = kind === 'all' || p.publication_type === kind || (kind === 'meta_analysis' && /meta_analysis$/.test(p.synthesis_method));
      var text = JSON.stringify(p) + JSON.stringify(catalog.findings.filter(function (f) { return f.publication_id === p.id; }));
      return typeFit && text.toLowerCase().indexOf(q) >= 0;
    });
    $('research-count').textContent = publications.length + ' research publications shown. A systematic review may also include a meta-analysis.';
    $('research-cards').innerHTML = publications.length ? publications.map(researchCard).join('') : '<p>No research publications match these filters.</p>';
  }
  $('research-type').addEventListener('change', function () { renderLibrary(); });

  function renderLibrary(result) {
    var q = $('search').value.trim().toLowerCase();
    renderResearch(q);
    var rows = (result || AGEngine.assess(db,learner())).rows.filter(function (r) {
      return JSON.stringify(r.record).toLowerCase().indexOf(q) >= 0 || db.sources[r.record.source_id].title.toLowerCase().indexOf(q) >= 0;
    });
    $('all-cards').innerHTML = rows.length ? rows.map(function (r) { return card(r,false); }).join('') : '<p>No records match this search.</p>';
  }
  function preset() {
    var p = db.presets.find(function (x) { return x.id === $('preset').value; });
    ['grade','subject','profile'].forEach(function (key) { $(key).value = p[key]; });
    ['needs','labels'].forEach(function (kind) { $(kind).querySelectorAll('input').forEach(function (box) { box.checked = p[kind].indexOf(box.value) >= 0; }); });
    $('gifted').checked = p.gifted; selected.clear(); render();
  }
  $('preset').addEventListener('change',preset);
  ['grade','subject','profile','needs','labels','gifted'].forEach(function (id) { $(id).addEventListener('change',render); });
  document.addEventListener('change',function (event) {
    var id = event.target.dataset.select;
    if (id) { if (event.target.checked) selected.add(id); else selected.delete(id); selectionCount(); }
  });
  $('search').addEventListener('input',function () { renderLibrary(); });
  var tabs = {home:'home',workspace:'workspace',library:'library',chat:'chat',about:'about'};
  var activeStage = 'understand';
  var stageTitles = {understand:'Understand the learner',plan:'Plan enrichment and AI roles',allocate:'Allocate opportunity and support',monitor:'Monitor participation',assess:'Assess learning and transfer',review:'Revise and reallocate'};
  function route() {
    var parts = window.location.hash.slice(1).split('/'), tab = parts[0] || 'home';
    tab = {evidence:'library',framework:'about',assistant:'chat'}[tab] || tab;
    if (!tabs[tab]) tab = 'home';
    if (tab === 'workspace') activeStage = AGState.stages.indexOf(parts[1]) >= 0 ? parts[1] : 'understand';
    Object.keys(tabs).forEach(function (name) {
      $(name+'-tab').classList.toggle('active',name === tab);
      $(name+'-tab').setAttribute('aria-pressed',String(name === tab));
      if (name === tab) $(name+'-tab').setAttribute('aria-current','page'); else $(name+'-tab').removeAttribute('aria-current');
      $(tabs[name]+'-view').hidden = name !== tab;
    });
    document.querySelectorAll('[data-stage]').forEach(function (panel) { panel.hidden=panel.dataset.stage!==activeStage; });
    document.querySelectorAll('[data-stage-link]').forEach(function (link) {
      var current = link.dataset.stageLink === activeStage;
      link.classList.toggle('active',current);
      if (current) link.setAttribute('aria-current','step'); else link.removeAttribute('aria-current');
    });
    $('workspace-title').textContent=stageTitles[activeStage];
    if (window.AGFlow) window.AGFlow.refresh();
    document.dispatchEvent(new CustomEvent('achievego:stage-change'));
    window.scrollTo({top:0,behavior:'auto'});
  }
  function showTab(tab) {
    var next = tab === 'workspace' ? 'workspace/'+activeStage : {library:'evidence',about:'framework',chat:'assistant'}[tab] || tab;
    if (window.location.hash !== '#'+next) window.history.pushState(null,'','#'+next);
    route();
    var title = tab === 'workspace' ? $('workspace-title') : $(tabs[tab]+'-view').querySelector('h1,h2');
    if (title) { title.setAttribute('tabindex','-1'); title.focus({preventScroll:true}); }
  }
  Object.keys(tabs).forEach(function (tab) { $(tab+'-tab').addEventListener('click',function () { showTab(tab); }); });
  window.addEventListener('hashchange',route);
  window.addEventListener('popstate',route);
  document.querySelector('.skip-link').addEventListener('click',function(event) { event.preventDefault(); $('main-content').focus({preventScroll:true}); $('main-content').scrollIntoView({block:'start'}); });
  $('brand-home').addEventListener('click',function (event) { event.preventDefault(); showTab('home'); });
  document.querySelectorAll('[data-open-assistant]').forEach(function (button) { button.addEventListener('click',function () { showTab('chat'); }); });
  $('export').addEventListener('click',function () {
    var data = AGEngine.plan(db,learner(),Array.from(selected));
    if (window.AGFlow) {
      data.frontend_review = window.AGFlow.planExport();
      var c = data.frontend_review, d = c.draft;
      data.review_fields.learner_goal = d.goal;
      data.review_fields.baseline_and_measure = d.baseline;
      data.review_fields.planned_support_and_fidelity = [d.support,d.delivery].filter(Boolean).join(' · ');
      data.review_fields.assistance_conditions = 'Planned AI assistance: ' + d.ai + '; access accommodations: ' + (d.accommodations || 'not recorded') + '. Record independent learning with access accommodations retained as appropriate.';
      data.review_fields.responsible_team_member = d.responsible;
      data.review_fields.review_date = d.reviewDate;
      data.review_fields.followup_outcome = c.observations.length ? 'Synthetic observations are in frontend_review.observations; inspect plan, measure, scale, and assistance conditions separately.' : '';
      data.review_fields.learner_feedback = c.observations.map(function(o) { return o.date + ': ' + (o.feedback || 'not recorded'); }).join('\n');
      if (c.reviews.length) {
        var r = c.reviews[c.reviews.length-1], p = c.plans.find(function(p) { return p.id === r.planId; });
        data.review_fields.decision_and_reason = 'Most recent demo review (plan ' + p.version + '): ' + r.decision + '. ' + r.rationale;
      }
    }
    var url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    var a = document.createElement('a'); a.href = url; a.download = 'AchieveGo-synthetic-review-plan.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); },1000);
  });
  $('profile-table').innerHTML = '<table><caption>Research group means (z)</caption><thead><tr><th scope="col">Profile</th><th scope="col">Motivation</th><th scope="col">Well-being</th></tr></thead><tbody>' + ['P1','P2','P3'].map(function (p) { return '<tr><th scope="row">' + esc(db.profiles[p].name) + '</th><td>' + db.profiles[p].group_means['School motivation'].toFixed(2) + '</td><td>' + db.profiles[p].group_means['School well-being'].toFixed(2) + '</td></tr>'; }).join('') + '</tbody></table>';
  var s = db.wwc_snapshot;
  $('snapshot').innerHTML = '<p><strong>' + s.unique_study_ids.toLocaleString() + ' distinct study IDs</strong><br>' + s.rows['Studies.csv'].toLocaleString() + ' study rows · ' + s.rows['Findings.csv'].toLocaleString() + ' finding rows · ' + s.rows['InterventionReports.csv'] + ' intervention-report rows.</p><p class="muted">Retrieved ' + esc(s.retrieved_at.slice(0,10)) + '. The raw export is retained; each planning card requires separate curation.</p>';
  window.AGWorkspace = {
    context: function () { return Object.assign(JSON.parse(JSON.stringify(learner())),window.AGFlow ? window.AGFlow.assistantContext() : {}); },
    rawContext: learner, stage: function () { return activeStage; }, navigate: showTab,
    setCase: function (c) {
      if (!db.presets.some(function (p) { return p.id === c.id; })) { var opt=document.createElement('option'); opt.value=c.id; opt.textContent=c.name; $('preset').appendChild(opt); db.presets.push(Object.assign({id:c.id,name:c.name},c.context)); }
      $('preset').value=c.id; ['grade','subject','profile'].forEach(function (k) { $(k).value=c.context[k]; });
      ['needs','labels'].forEach(function (kind) { $(kind).querySelectorAll('input').forEach(function (box) { box.checked=c.context[kind].indexOf(box.value)>=0; }); });
      $('gifted').checked=c.context.gifted; selected=new Set(c.selected); render();
    },
    selected: function () { return Array.from(selected); },
    addEvidence: function (id) {
      if (!AGEngine.assess(db,learner()).candidates.some(function (r) { return r.record.id === id; })) return false;
      selected.add(id); render(); return true;
    }
  };
  preset(); route();
}());
