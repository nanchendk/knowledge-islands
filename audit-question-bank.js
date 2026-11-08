// Run: node audit-question-bank.js
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('question-bank-v1.05.js','utf8');
const context = vm.createContext({});
vm.runInContext(source + '\nthis.auditBank = questionBankV105;', context);
const bank = context.auditBank;
const subjects = ['國文','英文','數學','生物','歷史','地理','公民'];
const errors = [], warnings = [];
const normalize = s => String(s||'').normalize('NFKC').toLowerCase().replace(/[\\s，。？！、,.!?：:；;「」『』（）()]/g,'');
const ids = new Set(), questions = new Map();
for (const group of bank) {
  if (!subjects.includes(group.subject)) errors.push('非考科: '+group.subject);
  if (group.items.length !== 100) errors.push(group.subject+' 題數 '+group.items.length);
  for (const [i,q] of group.items.entries()) {
    const label = group.subject+' #'+(i+1);
    if (!q.id || ids.has(q.id)) errors.push(label+' ID 重複/缺漏');
    ids.add(q.id);
    if (!Number.isInteger(q.stage) || q.stage<1 || q.stage>4) errors.push(label+' 關卡錯誤');
    if (!['基礎','中階','進階'].includes(q.difficulty)) warnings.push(label+' 難度待核 '+q.difficulty);
    if (!q.question || !Array.isArray(q.options) || q.options.length<2 || !Number.isInteger(q.answer) || q.answer<0 || q.answer>=q.options.length) errors.push(label+' 題目/選項/答案異常');
    if (!q.explanation || !q.topic || !q.chapter) errors.push(label+' 解析/考點/章節缺漏');
    const key=normalize(q.question);
    if (questions.has(key)) errors.push(label+' 題幹文字重複: '+questions.get(key));
    questions.set(key,label);
    if (q.verifiedForExam!==true) warnings.push(label+' 教材未核對');
  }
}
console.log(JSON.stringify({counts:Object.fromEntries(bank.map(x=>[x.subject,x.items.length])),total:bank.reduce((n,x)=>n+x.items.length,0),verified:bank.flatMap(x=>x.items).filter(x=>x.verifiedForExam===true).length,errors,warningsCount:warnings.length,warningExamples:warnings.slice(0,12)},null,2));
if(errors.length)process.exitCode=1;
