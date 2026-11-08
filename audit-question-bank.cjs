// Run: node audit-question-bank.cjs
// Structural checks only; NOT a certification of textbook alignment or semantic uniqueness.
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('question-bank-v1.05.js','utf8');
const scope = JSON.parse(fs.readFileSync('exam-scope-g7-s1-exam2.json','utf8'));
const html = fs.readFileSync('index.html','utf8');
const sandbox = {};
vm.runInNewContext(source + '\n;globalThis.__bank = questionBankV105;', sandbox, {timeout:5000});
const bank = sandbox.__bank;
const subjects = ['國文','英文','數學','生物','歷史','地理','公民'];
const errors=[], warnings=[], ids=new Set(), normalized=new Map();
let total=0, verified=0;
for(const group of bank) {
  if(!subjects.includes(group.subject)) errors.push('Excluded subject: '+group.subject);
  if(!subjects.includes(group.subject)) continue;
  if(group.items.length!==100) errors.push(group.subject+' count='+group.items.length);
  for(const q of group.items) {
    total++;
    if(!q.id || ids.has(q.id)) errors.push('Duplicate/missing ID '+q.id);
    ids.add(q.id);
    if(!q.question || !q.explanation || !q.topic || !q.chapter || !q.difficulty) errors.push('Missing field '+q.id);
    if(!Array.isArray(q.options)||q.options.length<2||new Set(q.options).size!==q.options.length||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length) errors.push('Invalid options/answer '+q.id);
    if(q.stage<1||q.stage>4) errors.push('Invalid stage '+q.id);
    const key=(q.question||'').replace(/[\\s，。？！、：；「」『』（）()]/g,'').toLowerCase();
    if(normalized.has(key)) warnings.push('Same question text: '+normalized.get(key)+' / '+q.id);
    else normalized.set(key,q.id);
    if(q.verifiedForExam===true && q.scopeStatus==='verified') verified++;
    else warnings.push('Scope not independently verified: '+q.id);
  }
}
for(const s of subjects) if(!bank.some(g=>g.subject===s)) errors.push('Missing subject '+s);
if(!html.includes('question-bank-v1.05.js')) errors.push('Site does not reference question bank');
if(!html.includes('function practice(')||!html.includes('data-answer')) errors.push('Missing practice/answer handlers');
if(!Array.isArray(scope.subjects)||scope.subjects.length!==7) errors.push('Scope subject count mismatch');
console.log(JSON.stringify({total,subjectCounts:Object.fromEntries(bank.filter(g=>subjects.includes(g.subject)).map(g=>[g.subject,g.items.length])),structuralErrors:errors,duplicateTextWarnings:warnings.filter(x=>x.startsWith('Same question')),scopeVerifiedCount:verified,scopePending:total-verified,siteStaticChecksOnly:true},null,2));
if(errors.length) process.exitCode=1;
