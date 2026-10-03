(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var db = JSON.parse($('library-data').textContent), index = JSON.parse($('chat-index').textContent), config = JSON.parse($('chat-config').textContent);
  var turns = [], contextKey = '', working = false;
  function node(tag, text, className) {
    var n = document.createElement(tag); if (text) n.textContent = text; if (className) n.className = className; return n;
  }
  function context() { return $('chat-use-context').checked ? window.AGWorkspace.context() : null; }
  function contextSignature() { return JSON.stringify(context()); }
  function preview() {
    var c = context(), box = $('chat-context-preview'); box.replaceChildren();
    if (!c) { box.appendChild(node('p','No scenario is included. The response will review evidence in general terms.','small muted')); return; }
    box.appendChild(node('p','Stage: ' + window.AGWorkspace.stage() + (c.learning_goal ? '\nGoal: ' + c.learning_goal : ''),'chat-context-title'));
    if (c.readiness) box.appendChild(node('p','Readiness (' + c.readiness_source + '): ' + c.readiness));
    if (c.learner_account) box.appendChild(node('p','Learner account: ' + c.learner_account));
    if (c.access_barriers) box.appendChild(node('p','Access: ' + c.access_barriers));
    box.appendChild(node('p','Grade ' + c.grade + ' · ' + (c.subject === 'any' ? 'School participation' : c.subject) + '\n' + db.profiles[c.profile].name,'chat-context-title'));
    box.appendChild(node('p','Selected goals: ' + (c.needs.map(function (n) { return db.needs[n]; }).join('; ') || 'None confirmed'), 'small'));
    box.appendChild(node('p','Documented scenario labels: ' + (c.labels.map(function (n) { return db.labels[n].name; }).join('; ') || 'None') + (c.gifted ? '. Gifted identification recorded.' : ''),'small muted'));
  }
  function welcome(message) {
    var item = node('article',null,'chat-message assistant');
    item.appendChild(node('p','ACHIEVEGO · LOCAL EVIDENCE DEMO','message-label'));
    item.appendChild(node('h3','Begin with an educational question.'));
    item.appendChild(node('p',message || 'Ask about mathematics, reading, school participation, or advanced opportunities. The local index will show relevant records, their limits, and questions for team review.'));
    item.appendChild(node('p','Responses use authored templates and source records. No AI model is connected.','small muted'));
    $('chat-messages').appendChild(item);
  }
  function reset(message) {
    turns = []; $('chat-messages').replaceChildren(); $('chat-input').value = ''; $('chat-export').disabled = true; $('chat-status').textContent = message || ''; welcome(message);
  }
  function sync() {
    preview(); var next = contextSignature();
    if (contextKey && next !== contextKey) reset('The learner context changed. This conversation has restarted to keep scenarios separate.');
    contextKey = next;
  }
  function evidenceCard(row, task, signature) {
    var r = row.record, source = db.sources[r.source_id], box = node('section',null,'chat-evidence');
    box.dataset.evidence = r.id;
    var a = node('a',r.title); a.href = source.url; a.target = '_blank'; a.rel = 'noopener'; box.appendChild(a);
    box.appendChild(node('p',source.kind + ' · ' + r.locator + ' · ' + source.year,'small muted'));
    box.appendChild(node('p',r.rating + ' · ' + r.rating_framework,'chat-rating'));
    box.appendChild(node('p','Outcome: ' + r.outcome + '. Grades ' + r.grade_min + (r.grade_min === r.grade_max ? '' : '–' + r.grade_max) + '. ' + r.population + '.','small'));
    box.appendChild(node('p',row.reason,'chat-applicability'));
    box.appendChild(node('p',task === 'monitor' ? 'Possible observations: ' + r.monitor : r.implementation,'small'));
    var detail = node('details'); detail.appendChild(node('summary','Limits and provenance'));
    detail.appendChild(node('p',r.limitations,'small'));
    detail.appendChild(node('p','Grade scope: ' + r.grade_basis + '.','small'));
    if (r.source_discrepancy) detail.appendChild(node('p',r.source_discrepancy,'small'));
    if ('essa_tier' in r) detail.appendChild(node('p','Separate ESSA tier: ' + (r.essa_tier || 'No tier displayed') + '.','small'));
    detail.appendChild(node('p','Curated summary · checked ' + source.checked + ' · ' + source.curation_status + '. Evidence ID: ' + r.id + '.','small muted')); box.appendChild(detail);
    if (row.candidate && context()) {
      var button = node('button',window.AGWorkspace.selected().indexOf(r.id) >= 0 ? 'In review plan' : 'Add evidence to plan'); button.type = 'button'; button.dataset.chatAdd = r.id;
      button.disabled = window.AGWorkspace.selected().indexOf(r.id) >= 0;
      button.addEventListener('click',function () {
        if (signature !== contextSignature() || !window.AGWorkspace.addEvidence(r.id)) { $('chat-status').textContent = 'The context changed. Review this evidence again before adding it.'; return; }
        button.disabled = true; button.textContent = 'In review plan'; $('chat-status').textContent = 'Record added for review. Export the plan from Explore a learner.';
      }); box.appendChild(button);
    }
    return box;
  }
  function renderResponse(response, signature) {
    var item = node('article',null,'chat-message assistant');
    item.appendChild(node('p','ACHIEVEGO · LIBRARY RESPONSE','message-label')); item.appendChild(node('h3',response.title));
    response.paragraphs.forEach(function (p) { item.appendChild(node('p',p)); });
    if (response.proposals.length) {
      item.appendChild(node('h4','Proposed sequence · educator review required'));
      var list = node('ol'); response.proposals.forEach(function (p) { list.appendChild(node('li',p)); }); item.appendChild(list);
    }
    response.evidence.forEach(function (r) { item.appendChild(evidenceCard(r,response.task,signature)); });
    response.questions.forEach(function (q) { item.appendChild(node('p',q,'chat-next-question')); });
    item.appendChild(node('p','Local indexed response · prompt ' + response.prompt_version + ' · library ' + response.library_version,'small muted'));
    $('chat-messages').appendChild(item);
  }
  function ask(message, task) {
    if (working) return;
    if (!message.trim()) { $('chat-status').textContent = 'Enter a question or select a suggested prompt.'; $('chat-input').focus(); return; }
    if (turns.length >= config.max_turns) { $('chat-status').textContent = 'This conversation has reached the demo limit. Export it or clear it to start again.'; return; }
    working = true; $('chat-send').disabled = true;
    try {
      var request = {message:message.trim(),task:task || 'auto',context:context(),evidence_ids:context() ? window.AGWorkspace.selected() : [],library_version:db.version,index_hash:index.sha256};
      var response = AGChatEngine.respond(db,index,config,request);
      var item = node('article',null,'chat-message educator'); item.appendChild(node('p','YOUR QUESTION','message-label')); item.appendChild(node('p',request.message)); $('chat-messages').appendChild(item);
      renderResponse(response,contextSignature()); turns.push({request:request,response:response});
      $('chat-input').value = ''; $('chat-export').disabled = false; $('chat-status').textContent = 'Searched ' + index.documents.length + ' indexed records locally. No provider call was made.';
      item.scrollIntoView({behavior:'auto',block:'nearest'});
    } catch (error) { $('chat-status').textContent = error.message; }
    finally { working = false; $('chat-send').disabled = false; }
  }
  var prompts = {
    explain:'Explain the evidence options for this learner.', compare:'Compare the approaches for this learner.',
    assess:'What should I assess before choosing support for this learner?', plan:'Draft a four-week review plan for this learner.', monitor:'What should I monitor for this learner?'
  };
  $('chat-form').addEventListener('submit',function (e) { e.preventDefault(); ask($('chat-input').value,'auto'); });
  $('chat-input').addEventListener('keydown',function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ask($('chat-input').value,'auto'); } });
  document.querySelectorAll('[data-chat-task]').forEach(function (button) { button.addEventListener('click',function () { var task = button.dataset.chatTask; ask(context() ? prompts[task] : prompts[task].replace('this learner','a learner (no scenario included)'),task); }); });
  $('chat-use-context').addEventListener('change',sync); document.addEventListener('achievego:context-change',sync); document.addEventListener('achievego:stage-change',sync);
  $('chat-edit-context').addEventListener('click',function () { $('workspace-tab').click(); $('preset').focus(); });
  $('chat-clear').addEventListener('click',function () { reset(); $('chat-input').focus(); });
  $('chat-export').addEventListener('click',function () {
    var body = {title:'AchieveGo fictional educator conversation',mode:config.mode,provider_connected:false,prompt_version:config.prompt_version,library_version:db.version,index_hash:index.sha256,turns:turns};
    var url = URL.createObjectURL(new Blob([JSON.stringify(body,null,2)],{type:'application/json'})); var a = node('a'); a.href = url; a.download = 'AchieveGo-demo-conversation.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); },1000);
  });
  $('chat-index-status').textContent = index.documents.length + ' indexed records · library ' + db.version + ' · system prompt ' + config.prompt_version;
  sync(); welcome();
}());
