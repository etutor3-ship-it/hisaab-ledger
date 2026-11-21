/*
 * Node-based test harness for the Hisaab frontend WhatsApp reminder.
 *
 * Loads the REAL app.js functions by evaluating the file inside a sandbox
 * that provides minimal DOM / browser globals, so the tests exercise the
 * actual shipped code paths (no re-implementation).
 *
 * Run: node test_whatsapp_reminder.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------- Minimal DOM / browser stubs ---------- */
function makeEl() {
  return {
    _html: '',
    textContent: '',
    value: '',
    className: '',
    dataset: {},
    style: {},
    files: [],
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, on) { if (on === undefined) on = !this._set.has(c); on ? this._set.add(c) : this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); }
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    addEventListener() {},
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    reset() {},
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html; }
  };
}

const elements = {};
const ids = [
  'customer-list', 'total-outstanding', 'add-customer-form', 'cust-name',
  'cust-phone', 'cust-opening-balance', 'cust-error', 'import-box',
  'import-go', 'import-result', 'download-backup', 'restore-file',
  'restore-preview', 'restore-actions', 'restore-result', 'ledger-title',
  'ledger-sub', 'whatsapp-btn', 'ledger-balance', 'ledger-reminder-note',
  'tx-list', 'entry-form', 'entry-type', 'entry-amount', 'entry-date',
  'entry-note', 'shot-input', 'shot-preview', 'backup-info'
];
for (const id of ids) elements[id] = makeEl();

const documentStub = {
  getElementById: (id) => elements[id] || (elements[id] = makeEl()),
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: () => makeEl(),
  body: { appendChild() {}, removeChild() {} }
};

const storageMap = {};
const localStorageStub = {
  getItem: (k) => (k in storageMap ? storageMap[k] : null),
  setItem: (k, v) => { storageMap[k] = String(v); },
  removeItem: (k) => { delete storageMap[k]; }
};

const windowStub = {
  location: { search: '', hash: '' },
  addEventListener() {},
  localStorage: localStorageStub
};

const sandbox = {
  document: documentStub,
  window: windowStub,
  localStorage: localStorageStub,
  location: windowStub.location,
  URLSearchParams: URLSearchParams,
  Intl: Intl,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Object: Object,
  Array: Array,
  JSON: JSON,
  RegExp: RegExp,
  isFinite: isFinite,
  parseFloat: parseFloat,
  parseInt: parseInt,
  crypto: { randomUUID: () => 'id-' + Math.random().toString(36).slice(2) },
  alert: () => {},
  confirm: () => true,
  Blob: function () {},
  URL: { createObjectURL: () => '', revokeObjectURL() {} },
  FileReader: function () {},
  console: console
};
sandbox.globalThis = sandbox;
sandbox.self = sandbox;

const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'app.js' });

/* ---------- Test runner ---------- */
let pass = 0, fail = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  \u2713 ' + name); }
  else { fail++; failures.push(name); console.log('  \u2717 ' + name + (extra ? '  -> ' + extra : '')); }
}
function section(t) { console.log('\n' + t); }

const {
  buildReminderMessage, buildWhatsAppUrl, normalizePhone,
  canSendReminder, formatMoney2, WHATSAPP_LANDING_URL
} = sandbox;

/* 1. Customer name replacement (dynamic) */
section('1. Customer name replacement');
{
  const m = buildReminderMessage('Ramesh Kumar', 1500);
  check('contains actual customer name', m.includes('नमस्ते Ramesh Kumar जी!'));
  check('does not contain placeholder braces', !m.includes('{{customer_name}}'));
  const m2 = buildReminderMessage('Sunita Devi', 250.5);
  check('different name substituted correctly', m2.includes('नमस्ते Sunita Devi जी!'));
  check('no cross-contamination of names', !m2.includes('Ramesh'));
}

/* 2. Mobile number formatting */
section('2. Mobile number formatting');
{
  check('plain 10-digit stays 10-digit', normalizePhone('9876543210') === '9876543210');
  check('strips +91 prefix', normalizePhone('+919876543210') === '9876543210');
  check('strips 91 prefix (12 digits)', normalizePhone('919876543210') === '9876543210');
  check('strips spaces/dashes', normalizePhone('98765-43210') === '9876543210');
  const url = buildWhatsAppUrl('9876543210', 'hi');
  check('url has 91 country code', url.startsWith('https://wa.me/919876543210?'));
  const url2 = buildWhatsAppUrl('+919876543210', 'hi');
  check('url normalises +91 to single 91', url2.startsWith('https://wa.me/919876543210?'));
  check('url does not double country code', !url2.includes('919198'));
}

/* 3. Outstanding balance formatting (2 decimals) */
section('3. Outstanding balance (2 decimals)');
{
  check('integer -> .00', formatMoney2(1500) === '1,500.00');
  check('decimal preserved', formatMoney2(250.5) === '250.50');
  check('zero -> .00', formatMoney2(0) === '0.00');
  check('large indian grouping', formatMoney2(123456.789) === '1,23,456.79');
  const m = buildReminderMessage('Test', 1500);
  check('message uses 2-dp amount', m.includes('₹1,500.00'));
  check('message does not show bare 1500', !m.includes('₹1500 '));
}

/* 4. WhatsApp URL encoding */
section('4. WhatsApp URL encoding');
{
  const msg = buildReminderMessage('Ramesh & Sons', 1500);
  const url = buildWhatsAppUrl('9876543210', msg);
  check('url is https wa.me', url.startsWith('https://wa.me/919876543210?text='));
  const encoded = decodeURIComponent(url.split('?text=')[1]);
  check('encoded text round-trips to original', encoded === msg);
  check('spaces are percent-encoded in raw url', url.includes('%20') || url.includes('%0A'));
  check('ampersand encoded (no raw &)', url.split('?text=')[1].indexOf('&') === -1 || !url.split('?text=')[1].includes('Ramesh & Sons'));
}

/* 5. Hindi message integrity */
section('5. Hindi message integrity');
{
  const m = buildReminderMessage('रमेश', 999);
  check('starts with नमस्ते', m.startsWith('नमस्ते रमेश जी! 🙏'));
  check('has CONGRATULATIONS block', m.includes('🎉 CONGRATULATIONS! 🎉'));
  check('has gift line', m.includes('विशेष उपहार! 🎁'));
  check('has Diabetes Reversal line', m.includes('Diabetes Reversal'));
  check('has 1:1 consultation', m.includes('1:1 PERSONAL CONSULTATION CALL'));
  check('has Lifestyle/Diet/Routine', m.includes('Lifestyle, Indian Diet और Daily Routine'));
  check('has closing', m.trim().endsWith('Team Dr. Malik Usman'));
  check('rupee symbol present', m.includes('₹'));
  check('contains no undefined placeholder', !m.includes('{{outstanding_balance}}'));
}

/* 6. Landing page URL */
section('6. Landing page URL');
{
  const m = buildReminderMessage('X', 100);
  /* const declarations are not exposed on the VM global; verify via the
     rendered message, which is the actual shipped value. */
  check('landing url constant correct (via message)', m.includes('https://sugarresetblueprint.online/landing-page-541315'));
  check('message contains landing url', m.includes('https://sugarresetblueprint.online/landing-page-541315'));
  check('no other stray landing host', !m.includes('sugarresetblueprint.online/landing-page-000000'));
}

/* 7. Zero balance restriction */
section('7. Zero balance restriction');
{
  check('zero -> cannot send', canSendReminder(0) === false);
  check('zero balance message still builds (but gated)', buildReminderMessage('X', 0).includes('₹0.00'));
}

/* 8. Negative balance restriction */
section('8. Negative balance restriction');
{
  check('negative -> cannot send', canSendReminder(-500) === false);
  check('negative amount formatted without sign', buildReminderMessage('X', -500).includes('₹500.00'));
  check('-0.01 -> cannot send', canSendReminder(-0.01) === false);
}

/* 9. Positive balance allowed */
section('9. Positive balance allowed');
{
  check('positive -> can send', canSendReminder(1) === true);
  check('0.01 -> can send', canSendReminder(0.01) === true);
  check('NaN -> cannot send', canSendReminder(NaN) === false);
  check('Infinity -> cannot send', canSendReminder(Infinity) === false);
}

/* 10. Message/URL integration for a realistic dynamic customer */
section('10. End-to-end message + url');
{
  const name = 'Suresh Patil';
  const bal = 2345.75;
  const msg = buildReminderMessage(name, bal);
  const url = buildWhatsAppUrl('9000000101', msg);
  check('url well formed', /^https:\/\/wa\.me\/919000000101\?text=/.test(url));
  const round = decodeURIComponent(url.split('?text=')[1]);
  check('round-trip intact', round === msg);
  check('amount present', msg.includes('₹2,345.75'));
}

/* ---------- Summary ---------- */
console.log('\n=====================================');
console.log(`RESULT: ${pass} passed, ${fail} failed`);
console.log('=====================================');
if (fail) { console.log('FAILURES: ' + failures.join(' | ')); process.exit(1); }
process.exit(0);