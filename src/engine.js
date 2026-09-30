/* Transparent retrieval rules. No trained classifier or treatment-effect model. */
var AGEngine = (function () {
  'use strict';
  function assess(library, learner) {
    var rows = library.evidence_records.map(function (record) {
      var rule = library.mapping_rules.find(function (r) { return r.evidence_id === record.id; });
      var goals = rule.needs_any.filter(function (n) { return learner.needs.indexOf(n) >= 0; });
      var gradeFit = learner.grade >= record.grade_min && learner.grade <= record.grade_max;
      var subjectFit = record.subject === 'any' || record.subject === learner.subject;
      var noBenefit = ['No Discernible Effects', 'Negative Effects', 'Potentially Negative Effects', 'Mixed Effects'].indexOf(record.rating) >= 0;
      return {record: record, rule: rule, goals: goals, gradeFit: gradeFit, subjectFit: subjectFit,
        candidate: goals.length > 0 && gradeFit && subjectFit && !noBenefit,
        reason: noBenefit ? 'Context only: no consistent positive benefit established for this outcome.' :
          !gradeFit ? 'Outside the source grade scope used here.' : !subjectFit ? 'Different subject.' :
          !goals.length ? 'No corresponding confirmed goal selected.' : 'Candidate for team review; matching is unvalidated.'};
    });
    var candidates = rows.filter(function (r) { return r.candidate; });
    var gaps = learner.needs.filter(function (need) {
      return !candidates.some(function (r) { return r.goals.indexOf(need) >= 0; });
    });
    return {rows: rows, candidates: candidates, gaps: gaps};
  }
  function plan(library, learner, selected) {
    var assessment = assess(library, learner);
    return {
      title: 'AchieveGo synthetic team-review plan', version: library.version,
      status: 'Illustration only; not an intervention prescription or validated recommendation',
      learner: learner,
      profile_note: 'Selected descriptive scenario; no individual LPA classification performed.',
      mapping_status: 'Proposed; no established profile × diagnosis treatment effect',
      evidence_snapshot: library.wwc_snapshot,
      selected: assessment.candidates.filter(function (r) { return selected.indexOf(r.record.id) >= 0; }).map(function (r) {
        return {evidence: r.record, source: library.sources[r.record.source_id], proposed_mapping: r.rule};
      }),
      related_outcome_context: assessment.rows.filter(function (r) {
        return r.record.source_id === 'cc' && selected.some(function (id) { return id.indexOf('cc-') === 0; });
      }).map(function (r) { return {evidence: r.record, grade_fit: r.gradeFit, status: r.reason}; }),
      gaps: assessment.gaps.map(function (n) { return library.needs[n]; }),
      review_fields: {learner_goal: '', baseline_and_measure: '', planned_support_and_fidelity: '',
        assistance_conditions: 'Record unaided, accommodated, and AI-assisted performance separately.',
        responsible_team_member: '', review_date: '', followup_outcome: '', learner_feedback: '',
        decision_and_reason: 'Continue, adapt, replace, or reconsider the opportunity after review; no automatic causal attribution.'}
    };
  }
  return {assess: assess, plan: plan};
}());
