/*
 * Preservation tests: load the REAL app.js and exercise ledger math,
 * JSON import, backup creation/validation, and restore. Ensures the
 * WhatsApp reminder changes did not break existing functionality.
 *
 * Run: node test_preservation.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeEl() {
  return {
    _html: '', _listeners: {}, textContent: '', value: '', className: '',
    dataset: {}, style: {}, files: [],
    classList: { _set: new Set(), add(c){this._set.add(c);}, remove(c){this._set.delete(c);},
      toggle(c,on){ if(on===undefined) on=!this._set.has(c); on?this._set.add(c):this._set.delete(c); return on; },
      contains(c){return this._set.has(c);} },
    setAttribute(k,v){ this[k]=v; }, getAttribute(k){ return this[k]; },
    addEventListener(ev,fn){ (this._listeners[ev]=this._listeners[ev]||[]).push(fn); },
    fire(ev){ (this._listeners[ev]||[]).forEach(fn=>fn.call(this,{preventDefault(){},target:this})); },
    appendChild(){}, querySelector(){ return null; }, querySelectorAll(){ return []; },
    reset(){ this._resetDone=true; },
    set innerHTML(v){ this._html=v; }, get innerHTML(){ return this._html; }
  };
}

const elements = {};
['import-box','import-go','import-result','restore-file','restore-preview',
 'restore-actions','restore-result','backup-info','download-backup','whatsapp-btn',
 'ledger-title','ledger-sub','ledger-balance','ledger-reminder-note','tx-list',
 'entry-form','entry-type','entry-amount','entry-date','entry-note','shot-input',
 'shot-preview','cust-name','cust-phone','cust-opening-balance','cust-error',
 'add-customer-form','customer-list','total-outstanding'].forEach(id => elements[id] = makeEl());
const documentStub = {
  getElementById: (id) => elements[id] || (elements[id] = makeEl()),
  querySelectorAll: () => [],
  querySelector: (sel) => {
    // import-mode radio
    if (sel.includes('import-mode')) return { value: sandboxState.importMode };
    return makeEl();
  },
  createElement: () => makeEl(),
  body: { appendChild(){}, removeChild(){} }
};

const storageMap = {};
const localStorageStub = {
  getItem: (k) => (k in storageMap ? storageMap[k] : null),
  setItem: (k,v) => { storageMap[k] = String(v); },
  removeItem: (k) => { delete storageMap[k]; }
};

const windowStub = { location: { search:'', hash:'' }, addEventListener(){}, localStorage: localStorageStub };
const sandboxState = { importMode: 'replace' };

const sandbox = {
  document: documentStub, window: windowStub, localStorage: localStorageStub,
  location: windowStub.location, URLSearchParams, Intl, Date, Math, Number,
  String, Object, Array, JSON, RegExp, Map, Set, isFinite, parseFloat, parseInt,
  crypto: { randomUUID: () => 'id-' + Math.random().toString(36).slice(2) },
  alert: () => {}, confirm: () => true,
  Blob: function(){}, URL: { createObjectURL: () => '', revokeObjectURL(){} },
  FileReader: function(){}, console
};
sandbox.globalThis = sandbox;

const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'app.js' });

let pass=0, fail=0; const failures=[];
function check(n,c,e){ if(c){pass++;console.log('  \u2713 '+n);} else {fail++;failures.push(n);console.log('  \u2717 '+n+(e?'  -> '+e:''));} }
function section(t){ console.log('\n'+t); }

const S = sandbox;

/* ---- 1. Balance calculation ---- */
section('1. Ledger balance calculation');
{
  // import two customers with entries via JSON
  elements['import-box'].value = JSON.stringify({
    customers: [
      { name: 'Asha', phone: '9000000001', entries: [
        { type:'credit', amount:1000, date:'2026-01-01', note:'goods' },
        { type:'payment', amount:300, date:'2026-01-02', note:'part' }
      ]},
      { name: 'Bina', phone: '9000000002', entries: [
        { type:'credit', amount:500, date:'2026-01-01', note:'goods' }
      ]}
    ]
  });
  sandboxState.importMode = 'replace';
  elements['import-go'].fire('click');
  const backup = S.createBackup();
  check('import replaced -> 2 customers', backup.data.customers.length === 2, 'got '+backup.data.customers.length);
  check('import created 3 transactions', backup.data.transactions.length === 3, 'got '+backup.data.transactions.length);
  check('Asha balance = 700', S.balanceFor('9000000001') === 700, 'got '+S.balanceFor('9000000001'));
  check('Bina balance = 500', S.balanceFor('9000000002') === 500, 'got '+S.balanceFor('9000000002'));
  check('total outstanding = 1200', S.totalOutstanding() === 1200, 'got '+S.totalOutstanding());
}

/* ---- 2. Payment reduces balance ---- */
section('2. Payment reduces balance');
{
  // append a payment of 200 to Asha via a transaction push + save (simulate entry)
  // Use merge import to add a new customer + payment for existing Asha is skipped;
  // instead directly test via a fresh replace including a full payment.
  elements['import-box'].value = JSON.stringify({
    customers: [
      { name: 'Asha', phone: '9000000001', entries: [
        { type:'credit', amount:1000, date:'2026-01-01', note:'goods' },
        { type:'payment', amount:1000, date:'2026-01-02', note:'paid full' }
      ]}
    ]
  });
  sandboxState.importMode = 'replace';
  elements['import-go'].fire('click');
  check('fully paid balance = 0', S.balanceFor('9000000001') === 0, 'got '+S.balanceFor('9000000001'));
  check('canSendReminder(0) false', S.canSendReminder(S.balanceFor('9000000001')) === false);
}

/* ---- 3. Merge import keeps existing ---- */
section('3. Merge import preserves existing data');
{
  elements['import-box'].value = JSON.stringify({
    customers: [
      { name: 'Asha', phone: '9000000001', entries: [{ type:'credit', amount:9999, date:'2026-02-01', note:'dup' }] },
      { name: 'Chandra', phone: '9000000003', entries: [{ type:'credit', amount:250, date:'2026-02-01', note:'new' }] }
    ]
  });
  sandboxState.importMode = 'merge';
  elements['import-go'].fire('click');
  const backup = S.createBackup();
  check('merge added Chandra (2 total)', backup.data.customers.length === 2, 'got '+backup.data.customers.length);
  check('Asha untouched by merge (balance 0)', S.balanceFor('9000000001') === 0, 'got '+S.balanceFor('9000000001'));
  check('Chandra balance 250', S.balanceFor('9000000003') === 250, 'got '+S.balanceFor('9000000003'));
}

/* ---- 4. Backup validate good ---- */
section('4. Backup validation');
{
  const good = S.createBackup();
  const v = S.validateBackup(JSON.parse(JSON.stringify(good)));
  check('valid backup accepted', v.valid === true);
  const bad = S.validateBackup({ data: { customers: 'nope' } });
  check('malformed backup rejected', bad.valid === false);
  const badPhone = S.validateBackup({ app:'Hisab', data:{ customers:[{name:'X', phone:'123'}], transactions:[], shots:{} } });
  check('bad phone rejected', badPhone.valid === false);
}

/* ---- 5. Restore replace ---- */
section('5. Restore replace');
{
  const backup = {
    app: S.APP_NAME, version: S.APP_VERSION, backupDate: new Date().toISOString(),
    data: {
      customers: [{ id:'c1', name:'Restored', phone:'9111111111' }],
      transactions: [{ id:'t1', customerPhone:'9111111111', type:'credit', amount:750, date:'2026-03-01', note:'opening' }],
      shots: {}
    }
  };
  S.performRestore(backup.data, 'replace');
  const b2 = S.createBackup();
  check('restore replace -> 1 customer', b2.data.customers.length === 1, 'got '+b2.data.customers.length);
  check('restored balance = 750', S.balanceFor('9111111111') === 750, 'got '+S.balanceFor('9111111111'));
  check('canSendReminder(750) true', S.canSendReminder(750) === true);
  const msg = S.buildReminderMessage('Restored', 750);
  check('restored customer message personalised', msg.includes('नमस्ते Restored जी!'));
}

/* ---- 6. Restore merge ---- */
section('6. Restore merge preserves existing');
{
  const backup = {
    app: S.APP_NAME, version: S.APP_VERSION, backupDate: new Date().toISOString(),
    data: {
      customers: [
        { id:'c1', name:'Restored', phone:'9111111111' },          // duplicate -> skipped
        { id:'c2', name:'Extra', phone:'9222222222' }             // new
      ],
      transactions: [{ id:'t2', customerPhone:'9222222222', type:'credit', amount:400, date:'2026-03-02', note:'x' }],
      shots: {}
    }
  };
  S.performRestore(backup.data, 'merge');
  const b3 = S.createBackup();
  check('merge kept Restored + added Extra (2)', b3.data.customers.length === 2, 'got '+b3.data.customers.length);
  check('Restored balance unchanged 750', S.balanceFor('9111111111') === 750, 'got '+S.balanceFor('9111111111'));
  check('Extra balance 400', S.balanceFor('9222222222') === 400, 'got '+S.balanceFor('9222222222'));
}

/* ---- 7. Persistence keys unchanged ---- */
section('7. localStorage keys preserved');
{
  check('customers key present', 'hisaab_customers' in storageMap);
  check('transactions key present', 'hisaab_transactions' in storageMap);
  const reloaded = JSON.parse(storageMap['hisaab_customers']).length;
  check('persisted customer count = 2', reloaded === 2, 'got '+reloaded);
}

console.log('\n=====================================');
console.log(`RESULT: ${pass} passed, ${fail} failed`);
console.log('=====================================');
if (fail){ console.log('FAILURES: '+failures.join(' | ')); process.exit(1); }
process.exit(0);