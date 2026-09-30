/* Local indexed retrieval and authored response templates. No LLM or network call. */
var AGChatEngine = (function () {
  'use strict';
  var stop = 'a an and are as at be can could do does for from help how i in is it me my of on or our please should show so some student students than that the their these they this to use we what when which who why with work works would you'.split(' ');
  var topics = {
    math: /\b(math\w*|numeracy|problem.solving|metacognit\w*|reflect\w*|strateg\w*)\b/i,
    literacy: /\b(read\w*|literacy|decod\w*|comprehension|dyslex\w*|text|vocabulary)\b/i,
    offtrack: /\b(dropout|attendance|absen\w*|graduat\w*|off.track|check\s*(?:&|and)\s*connect|staying|completing|progressing)\b/i,
    advanced: /\b(enrich\w*|accelera\w*|challenge|advanced|opportunit\w*)\b/i,
    wellbeing: /\b(well.?being|distress\w*|belonging|anxiety|depress\w*|mental.health)\b/i
  };
  function tokens(text) { return String(text).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(function (w) { return w.length > 2 && stop.indexOf(w) < 0; }); }
  function inferTask(message, requested) {
    if (requested && requested !== 'auto') return requested;
    if (/\b(compare|versus|difference|vs)\b/i.test(message)) return 'compare';
    if (/\b(plan|weeks?|implement|schedule)\b/i.test(message)) return 'plan';
    if (/\b(monitor|measure|track|progress)\b/i.test(message)) return 'monitor';
    if (/\b(assess|ask|missing|information)\b/i.test(message)) return 'assess';
    return 'explain';
  }
  function retrieve(db, index, request) {
    var message = request.message, context = request.context, task = inferTask(message, request.task);
    var terms = tokens(message), matchedTopics = Object.keys(topics).filter(function (t) { return topics[t].test(message); });
    var contextual = (request.task && request.task !== 'auto') || /\b(this learner|this scenario|these options|selected|current learner|what should i assess|what should i monitor|for maya|for noor|for sam|for jordan|for alex)\b/i.test(message);
    var assessment = context ? AGEngine.assess(db, context) : null;
    var selected = request.evidence_ids || [];
    var explicitlyCC = /check\s*(?:&|and)\s*connect/i.test(message);
    var scored = index.documents.map(function (doc) {
      var record = db.evidence_records.find(function (r) { return r.id === doc.id; });
      var rule = db.mapping_rules.find(function (r) { return r.evidence_id === doc.id; });
      var relevance = terms.reduce(function (sum, term) { return sum + (doc.terms.indexOf(term) >= 0 ? 1 : 0); },0);
      // Specific domain questions cannot be satisfied by coincidental words in a limitation.
      if (matchedTopics.length) relevance = matchedTopics.some(function (t) { return doc.topics.indexOf(t) >= 0; }) ? relevance + 4 : 0;
      if (explicitlyCC) relevance = record.source_id === 'cc' ? 20 : 0;
      var row = assessment ? assessment.rows.find(function (r) { return r.record.id === doc.id; }) : null;
      if (contextual && !matchedTopics.length && row && row.candidate) relevance += 5;
      if (contextual && !matchedTopics.length && selected.indexOf(doc.id) >= 0) relevance += 8;
      return {record: record, rule: rule, candidate: !!(row && row.candidate), reason: row ? row.reason : 'General evidence review; no learner context included.', score: relevance};
    }).filter(function (r) { return r.score > 0; }).sort(function (a,b) { return b.score - a.score || a.record.id.localeCompare(b.record.id); });
    var rows = scored.slice(0,4);
    if ((!context && contextual && !matchedTopics.length) || (/\b(adhd|autis\w*|diagnos\w*)\b/i.test(message) && !matchedTopics.length && !contextual)) rows = [];
    if (rows.some(function (r) { return r.record.source_id === 'cc'; })) {
      // Companion outcomes survive ranking and grade filters; they remain context, not benefits.
      db.evidence_records.filter(function (r) { return r.source_id === 'cc'; }).forEach(function (record) {
        if (!rows.some(function (r) { return r.record.id === record.id; })) {
          var r = assessment ? assessment.rows.find(function (x) { return x.record.id === record.id; }) : null;
          rows.push({record:record,rule:db.mapping_rules.find(function (x) { return x.evidence_id === record.id; }),candidate:!!(r && r.candidate),reason:r ? r.reason : 'Companion outcome; no learner context included.',score:0});
        }
      });
    }
    return {rows:rows, task:task, topics:matchedTopics, assessment:assessment};
  }
  function respond(db, index, config, request) {
    if (config.mode !== 'local-evidence-demo' || config.provider_connected) throw new Error('This build supports local evidence mode only.');
    if (typeof request.message !== 'string' || !request.message.trim() || request.message.length > config.max_message_characters) throw new Error('Enter a question within the displayed length limit.');
    if (request.context && request.context.synthetic !== true) throw new Error('Use a fictional scenario in this demonstration.');
    var result = retrieve(db,index,request), rows = result.rows, task = result.task;
    var response = {mode:config.mode,prompt_version:config.prompt_version,index_hash:index.sha256,library_version:db.version,
      title:'Evidence to explore', paragraphs:[], evidence:rows, proposals:[], questions:[], task:task};
    var gradeMention = request.message.match(/\bgrade\s+(\d{1,2})\b/i);
    if (gradeMention && request.context && Number(gradeMention[1]) !== request.context.grade) {
      response.title = 'Confirm the grade context'; response.evidence = [];
      response.paragraphs = ['Your question mentions grade ' + gradeMention[1] + ', but the selected fictional scenario is grade ' + request.context.grade + '. Change the learner context or turn it off before reviewing grade-specific evidence.'];
      return response;
    }
    if (gradeMention && !request.context) rows.forEach(function (row) {
      var grade = Number(gradeMention[1]);
      if (grade < row.record.grade_min || grade > row.record.grade_max) row.reason = 'Outside the grade requested in this question; general context only.';
    });
    if (/\b(api.?key|password|system prompt|ignore.*instructions|reveal.*secret)\b/i.test(request.message)) {
      response.title = 'How this demonstration works'; response.evidence = [];
      response.paragraphs = ['This is local evidence search with authored response templates. No provider is connected and no API key is stored here. The versioned educator system prompt is available in the project for review; it will be applied by the future backend.'];
      return response;
    }
    if (/\b(adhd|autis\w*|dyslex\w*|diagnos\w*|twice.exceptional)\b/i.test(request.message)) {
      response.paragraphs.push('This library does not establish a treatment effect for a particular diagnosis combined with an AchieveGo profile. Confirm the functional need, domain strengths, and learner preferences before considering an intervention.');
    }
    if (result.topics.indexOf('wellbeing') >= 0 || (result.assessment && result.assessment.gaps.indexOf('wellbeing') >= 0)) {
      response.paragraphs.push('There is no applicable well-being intervention match in this starter set. Explore the concern with the learner and the appropriate school support team. Reading, mathematics, and dropout findings do not establish treatment of distress. Appropriate intellectual challenge can still be considered.');
    }
    if (!rows.length) {
      response.title = 'A gap in this small library';
      response.paragraphs.push('I could not find a relevant record for that question in the 12-record index. This is a limit of the starter library, not evidence that effective support is unavailable. Try a specific topic such as mathematical reflection, decoding, school attendance, or enrichment.');
      response.questions = ['Which learning goal, subject, and grade should the team investigate?'];
      return response;
    }
    if (task === 'compare') {
      response.title = 'Compare evidence and applicability';
      response.paragraphs.push(rows.length > 1 ? 'The records below can be compared by outcome, population, grade scope, and delivery. Their ratings belong to different evidence frameworks; they do not provide a common ranking of what will work best.' : 'Only one relevant record was found. Choose another approach or broaden the evidence review before making a comparison.');
    } else if (task === 'assess') {
      response.title = 'Clarify the need before choosing support';
      response.paragraphs.push('Use these records to identify what needs confirmation, rather than treating a diagnosis or profile as an intervention assignment.');
      response.questions.push('What assessment or observation confirms the specific need, and what does the learner say would help?');
      if (request.context) response.paragraphs.push(db.profiles[request.context.profile].question);
    } else if (task === 'plan') {
      response.title = 'A proposed four-week review sequence';
      response.paragraphs.push('This sequence is an authored AchieveGo planning example, not the duration or protocol evaluated in the cited studies. Confirm the source requirements and staffing before choosing an approach.');
      response.proposals = ['Week 1 · Agree one learner-defined goal, record a baseline, and name the responsible educator. Review the original implementation requirements.',
        'Week 2 · Begin an educator-approved approach only when feasible. Record what was delivered, access supports, and any adaptations.',
        'Week 3 · Review delivery and learner feedback. Keep appropriate challenge available; record reasons for changes.',
        'Week 4 · Review the targeted outcome and decide whether to continue, adapt, or reconsider. A change over four weeks does not by itself show causation or validate matching.'];
    } else if (task === 'monitor') {
      response.title = 'Monitor the outcome the evidence addresses';
      response.paragraphs.push('Agree on a baseline, observation method, review date, and learner feedback. Record unaided, accommodated, and AI-assisted performance separately. A pre/post difference is not proof of an intervention effect.');
    } else {
      response.paragraphs.push(request.context ? 'These records are relevant to the question or selected goals. Their learner applicability is shown separately below. A candidate is a reason for team review, not a validated prediction of benefit.' : 'These are general evidence records. Include a fictional scenario or specify a confirmed need, subject, and grade to review learner applicability.');
    }
    if (!response.questions.length) response.questions.push('Which outcome matters most to the learner, and what would a useful change look like?');
    return response;
  }
  return {tokens:tokens,retrieve:retrieve,respond:respond};
}());
