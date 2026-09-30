/* Run after defining db from library.json and loading src/engine.js. */
var testsRun = 0;
function test(name, condition) { if (!condition) throw new Error(name); testsRun++; }
function scenario(id) { return JSON.parse(JSON.stringify(db.presets.find(function (x) { return x.id === id; }))); }
function ids(l) { return AGEngine.assess(db,l).candidates.map(function (r) { return r.record.id; }).sort().join(','); }
var maya = scenario('maya'), original = ids(maya);
test('Math reflection retrieved for grade 7', original.indexOf('math-reflection') >= 0);
maya.labels = []; maya.gifted = false;
test('Removing diagnoses and gifted identification cannot change benefit claims or eligibility', ids(maya) === original);
maya.profile = 'P1';
test('Distress does not remove advanced opportunities', ids(maya) === original);
maya.profile = 'unknown';
test('Unassigned profiles can still access relevant evidence', ids(maya) === original);
maya.needs = []; maya.labels = ['adhd','autism','sld_reading'];
test('Diagnoses alone cannot trigger interventions', AGEngine.assess(db,maya).candidates.length === 0);
var noor = scenario('noor'), n = AGEngine.assess(db,noor);
test('Wellbeing evidence gap is explicit', n.gaps.indexOf('wellbeing') >= 0);
test('Distress is not converted to dropout risk', !n.candidates.some(function (r) { return r.record.id.indexOf('dropout') === 0 || r.record.source_id === 'cc'; }));
noor.needs = ['offtrack'];
test('Grade 7 does not receive high-school Check & Connect', !AGEngine.assess(db,noor).candidates.some(function (r) { return r.record.source_id === 'cc'; }));
var jordan = scenario('jordan'), j = AGEngine.assess(db,jordan);
test('Grade 10 retains school-retention evidence', ids(jordan).indexOf('cc-stay') >= 0);
test('Conservative grade-9 outcome cannot be recommended in grade 10', ids(jordan).indexOf('cc-progress') < 0);
test('No discernible completion effects are never a benefit candidate', ids(jordan).indexOf('cc-complete') < 0);
test('Null outcome is preserved in full library assessment', j.rows.some(function (r) { return r.record.id === 'cc-complete' && r.record.rating === 'No Discernible Effects'; }));
jordan.grade = 9;
test('Grade 9 progressing outcome remains available', ids(jordan).indexOf('cc-progress') >= 0);
var exported = AGEngine.plan(db,scenario('jordan'),['cc-stay','cc-complete','math-reflection']);
test('Export rejects stale, null, or inapplicable selections', exported.selected.length === 1 && exported.selected[0].evidence.id === 'cc-stay');
test('Export preserves all companion outcomes including null and out-of-grade', exported.related_outcome_context.length === 3);
test('Export retains source and mapping status', exported.selected[0].source.url.indexOf('ies.ed.gov') >= 0 && exported.selected[0].proposed_mapping.status === 'Proposed; not validated');
test('Export retains separate assistance conditions', exported.review_fields.assistance_conditions.indexOf('AI-assisted') >= 0);
var sam = scenario('sam');
test('Reading difficulty retrieves decoding within grade scope', ids(sam).indexOf('reading-decoding') >= 0);
sam.grade = 10;
test('Reading intervention grade limit enforced', ids(sam).indexOf('reading-decoding') < 0);
sam.grade = 8; sam.subject = 'math';
test('Subject mismatch does not claim reading evidence for math', ids(sam).indexOf('reading-decoding') < 0);
test('ESSA and effectiveness ratings are distinct', db.evidence_records.find(function (r) { return r.id === 'cc-stay'; }).essa_tier === 'Tier 3');
test('Enrichment does not receive a WWC rating', db.sources[db.evidence_records.find(function (r) { return r.id === 'enrichment'; }).source_id].kind === 'External research synthesis');
print(testsRun + ' matching and export assertions passed');
