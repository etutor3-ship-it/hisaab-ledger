// End-to-end simulation of the real UI entry-flow (handleEntrySubmit) called
// repeatedly for the same customer, using the real app.js loaded via vm.
// Snippets run in the same vm context so they can set the module's `currentPhone`
// and `customers` bindings (top-level let bindings are shared across runInContext
// calls in one context, unlike context properties).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function QRCode() {}
QRCode.CorrectLevel = { L: 'L', M: 'M', Q: 'Q', H: 'H' };

class MockElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this._textContent = '';
    this._innerHTML = '';
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add(...c) { c.forEach(x => this._classes.add(x)); },
      remove(...c) { c.forEach(x => this._classes.delete(x)); },
      contains(c) { return this._classes.has(c); },
      toggle(c, on) {
        if (on === undefined) on = !this._classes.has(c);
        on ? this._classes.add(c) : this._classes.delete(c);
        return on;
      },
    };
    this.style = {};
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    this.dataset = {};
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.files = [];
    this.selectedIndex = 0;
    this.options = [];
    this.type = '';
    this.href = '';
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] === undefined ? null : this.attributes[k]; }
  addEventListener(type, fn) { if (!this.listeners[type]) this.listeners[type] = []; this.listeners[type].push(fn); }
  removeEventListener() {}
  appendChild(child) { this.children.push(child); return child; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  click() { (this.listeners['click'] || []).forEach(fn => fn.call(this, { preventDefault: () => {}, target: this, closest: () => null })); }
  dispatchEvent(evt) { (this.listeners[evt.type] || []).forEach(fn => fn(evt)); return true; }
  focus() {}
  blur() {}
  scrollIntoView() {}
  getBoundingClientRect() { return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }; }
  reset() { this._resetDone = true; }
  toDataURL() { return 'data:image/png;base64,mock'; }
  getContext() { return null; }
}
Object.defineProperty(MockElement.prototype, 'textContent', {
  set(v) { this._textContent = String(v); },
  get() { return this._textContent === undefined ? '' : this._textContent; },
  enumerable: true, configurable: true,
});
Object.defineProperty(MockElement.prototype, 'innerHTML', {
  set(v) { this._innerHTML = String(v); },
  get() { return this._innerHTML === undefined ? '' : this._innerHTML; },
  enumerable: true, configurable: true,
});

class MockDocument {
  constructor() { this.elements = {}; this.body = new MockElement('body'); this.documentElement = new MockElement('html'); this.documentElement.lang = 'en'; this.documentElement.dir = 'ltr'; this.location = { hash: '', search: '' }; }
  getElementById(id) { if (!(id in this.elements)) this.elements[id] = new MockElement(); return this.elements[id]; }
  createElement(tag) { return new MockElement(tag); }
  querySelector(sel) { return new MockElement(); }
  querySelectorAll() { return []; }
  addEventListener() {}
  registerElement(id, el) { this.elements[id] = el; }
}

const alerts = [];
const confirms = [];
const openedWindows = [];
const document = new MockDocument();
let localStorageStore = {};
const window = {
  document, location: { hash: '', search: '' },
  localStorage: {
    getItem(k) { return localStorageStore[k] === undefined ? null : localStorageStore[k]; },
    setItem(k, v) { localStorageStore[k] = String(v); },
    removeItem(k) { delete localStorageStore[k]; },
    clear() { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
  },
  sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} },
  console: { log: (...a) => console.log('[LOG]', ...a), error: (...a) => console.log('[ERROR]', ...a) },
  setTimeout, setInterval, clearInterval, clearTimeout: () => { },
  crypto: { randomUUID: () => 'mock-uuid-' + Math.random().toString(36).slice(2) + '-' + Date.now() },
  alert: (msg) => { alerts.push(String(msg)); },
  confirm: (msg) => { confirms.push(String(msg)); return true; },
  open: (url, target, features) => { const fake = { document: { write() { }, close() { } }, focus() { }, close() { } }; openedWindows.push({ url, target, features, fake }); return fake; },
  addEventListener() { }, removeEventListener() { }, dispatchEvent() { return true; },
  Blob: function () { }, URL: { createObjectURL: () => 'blob:mock', revokeObjectURL() { } },
  FileReader: function () {
    this.onload = null; this.onerror = null; this.result = '';
    this.readAsDataURL = () => { if (this.onload) this.onload({ target: { result: this.result } }); };
    this.readAsText = () => { if (this.onload) this.onload({ target: { result: this.result } }); };
  },
  indexedDB: undefined, QRCode, Intl, Date, Math, Number, String, Object, Array, JSON, RegExp, Map, Set, isFinite, parseFloat, parseInt, isNaN,
};
window.global = window;
window.self = window;
const context = {
  window, document, localStorage: window.localStorage, console: window.console, setTimeout, setInterval, clearInterval, clearTimeout: window.clearTimeout,
  crypto: window.crypto, location: window.location, alert: window.alert, confirm: window.confirm,
  open: window.open, Blob: window.Blob, URL: window.URL, FileReader: window.FileReader,
  QRCode, Intl, Date, Math, Number, String, Object, Array, JSON, RegExp, Map, Set,
  isFinite, parseFloat, parseInt,
};
context.global = context;
context.self = context;
vm.createContext(context);
const appjs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
vm.runInContext(appjs, context, { filename: 'app.js' });
const S = context;

function runInModule(code) { return vm.runInContext(code, context, { filename: 'module-snippet.js' }); }

let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('  PASS: ' + name); } else { fail++; console.log('  FAIL: ' + name + (extra ? '  -> ' + extra : '')); } }
function section(t) { console.log('\n' + t); }

const PHONE = '8858072224';

function resetModule() {
  localStorageStore = {};
  alerts.length = 0; confirms.length = 0; openedWindows.length = 0;
  runInModule(`
    customers = [];
    transactions = [];
    shots = {};
    receipts = [];
    currentPhone = null;
    ledgerOffset = 0;
    ledgerShowAll = false;
  `);
}
function setupCustomer() {
  runInModule(`
    customers = [{ id: 'c-test', name: 'Test Rubi', phone: '${PHONE}', createdAt: '2026-01-01' }];
    currentPhone = '${PHONE}';
  `);
}
function setFormValues(type, amount, date, note, paymentMode) {
  const el = id => document.getElementById(id);
  el('entry-type').value = type;
  el('entry-amount').value = String(amount);
  el('entry-date').value = date;
  el('entry-note').value = note;
  el('entry-payment-mode').value = paymentMode;
  el('shot-input').files = [];
}
function submitEntry() {
  S.handleEntrySubmit({ preventDefault() { } });
}
function txCount() { return JSON.parse(S.localStorage.getItem('hisaab_transactions') || '[]').length; }
function moduleTxCount() { return runInModule('transactions.length;'); }
function balance() { return S.balanceFor(PHONE); }
function allTx() { return JSON.parse(S.localStorage.getItem('hisaab_transactions') || '[]'); }

(async () => {
  resetModule();
  S.setLanguage('en');
  setupCustomer();
  check('customer ready', runInModule('customers.length === 1 && currentPhone === $P;'.replace('$P', JSON.stringify(PHONE))) === true, 'customers=' + runInModule('customers.length') + ' currentPhone=' + runInModule('currentPhone'));

  // 1. First payment
  setFormValues('payment', 100, '2026-01-01', 'first payment', 'Cash');
  submitEntry();
  check('1st payment saved', moduleTxCount() === 1, 'got ' + moduleTxCount());
  check('1st payment balance -100', balance() === -100, 'got ' + balance());

  // 2. Second payment (the reported bug scenario)
  setFormValues('payment', 50, '2026-01-02', 'second payment', 'UPI');
  submitEntry();
  check('2nd payment saved', moduleTxCount() === 2, 'got ' + moduleTxCount());
  check('2nd payment balance -150', balance() === -150, 'got ' + balance());

  // 3. Third payment
  setFormValues('payment', 25, '2026-01-03', 'third payment', 'Cash');
  submitEntry();
  check('3rd payment saved', moduleTxCount() === 3, 'got ' + moduleTxCount());
  check('3rd payment balance -175', balance() === -175, 'got ' + balance());

  // Unique ids check
  const ids3 = allTx().map(t => t.id);
  check('3 unique ids', new Set(ids3).size === 3, 'ids: ' + JSON.stringify(ids3));

  // 4. 10 payments
  resetModule(); setupCustomer();
  for (let i = 0; i < 10; i++) {
    setFormValues('payment', 10 + i, '2026-01-' + String((i % 28) + 1).padStart(2, '0'), 'p' + i, 'Cash');
    submitEntry();
  }
  check('10 payments saved', moduleTxCount() === 10, 'got ' + moduleTxCount());
  check('10 payments balance -145 (10+11+...+19)', balance() === -145, 'got ' + balance());

  // 5. 100 payments
  resetModule(); setupCustomer();
  for (let i = 0; i < 100; i++) {
    setFormValues('payment', 50, '2026-02-01', 'p100', 'Cash');
    submitEntry();
  }
  check('100 payments saved', moduleTxCount() === 100, 'got ' + moduleTxCount());
  check('100 payments balance -5000', balance() === -5000, 'got ' + balance());

  // 6. 101st payment
  setFormValues('payment', 1, '2026-02-02', 'p101', 'Cash');
  submitEntry();
  check('101st payment saved', moduleTxCount() === 101, 'got ' + moduleTxCount());
  check('101 payments balance -5001', balance() === -5001, 'got ' + balance());

  // 7. Persistence after 101
  runInModule('saveState();');
  const persisted = JSON.parse(S.localStorage.getItem('hisaab_transactions')).length;
  check('101 txns persisted in localStorage', persisted === 101, 'got ' + persisted);
  // simulate reload
  runInModule(`customers=[];transactions=[];shots={};receipts=[];`);
  S.loadState();
  check('101 txns restored after reload', moduleTxCount() === 101, 'got ' + moduleTxCount());
  check('balance restored after reload', balance() === -5001, 'got ' + balance());

  // 8. 1000 mixed entries
  resetModule(); setupCustomer();
  for (let i = 0; i < 1000; i++) {
    setFormValues(i % 2 === 0 ? 'credit' : 'payment', 100, '2026-03-01', 'mixed', 'Cash');
    submitEntry();
  }
  check('1000 mixed entries saved', moduleTxCount() === 1000, 'got ' + moduleTxCount());
  // 500 credits x 100 = +50000, 500 payments x 100 = -50000 => 0
  check('1000 mixed balance = 0', balance() === 0, 'got ' + balance());

  // 9. 1001st entry (credit)
  setFormValues('credit', 10, '2026-03-02', 'p1001', '');
  submitEntry();
  check('1001st entry saved', moduleTxCount() === 1001, 'got ' + moduleTxCount());
  check('1001 balance = 10', balance() === 10, 'got ' + balance());

  // 10. 500 mixed (subset)
  resetModule(); setupCustomer();
  for (let i = 0; i < 500; i++) {
    setFormValues(i % 3 === 0 ? 'payment' : 'credit', 7, '2026-04-01', 'm500', 'Cash');
    submitEntry();
  }
  check('500 mixed entries saved', moduleTxCount() === 500, 'got ' + moduleTxCount());

  // Regression: renderLedger must not throw "t is not a function" when txs exist
  let renderErr = null;
  try { S.renderLedger(PHONE); } catch (e) { renderErr = e; }
  check('renderLedger with transactions does not throw', renderErr === null, renderErr ? renderErr.message : '');

  // Success message shown after a save
  setFormValues('credit', 5, '2026-04-02', 'msg check', '');
  submitEntry();
  const msgEl = document.getElementById('ledger-msg');
  check('success message shown', msgEl.textContent === 'Entry saved successfully.', msgEl.textContent);
  check('success message is ok type', msgEl.className.includes('ok'), msgEl.className);


  // 11. Multiple goods purchase (credit) entries
  resetModule(); setupCustomer();
  for (const amt of [500, 300, 700, 250]) {
    setFormValues('credit', amt, '2026-05-01', 'goods', '');
    submitEntry();
  }
  for (const amt of [200, 400, 100]) {
    setFormValues('payment', amt, '2026-05-02', 'pay', 'Cash');
    submitEntry();
  }
  check('7 entries saved (4 credit + 3 payment)', moduleTxCount() === 7, 'got ' + moduleTxCount());
  // outstanding = 1750 - 700 = 1050
  check('outstanding 1050 (1750 credit - 700 payment)', balance() === 1050, 'got ' + balance());
  // verify credit/payment totals directly from persisted transactions
  const all = JSON.parse(S.localStorage.getItem('hisaab_transactions'));
  const creditTotal = all.filter(t => t.customerPhone === PHONE && t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const paymentTotal = all.filter(t => t.customerPhone === PHONE && t.type === 'payment').reduce((s, t) => s + t.amount, 0);
  check('credit total 1750', creditTotal === 1750, 'got ' + creditTotal);
  check('payment total 700', paymentTotal === 700, 'got ' + paymentTotal);

  // 12. Invoice generation (must not throw, must not modify ledger)
  const beforeInv = moduleTxCount();
  S.generateInvoice(PHONE);
  check('invoice did not throw', true);
  check('invoice did not create ledger entries', moduleTxCount() === beforeInv, 'got ' + moduleTxCount());

  // 13. Receipt generation for a payment (does not duplicate ledger entry)
  const beforeRcpt = moduleTxCount();
  const paymentTx = JSON.parse(S.localStorage.getItem('hisaab_transactions')).find(t => t.type === 'payment' && t.customerPhone === PHONE);
  S.generateReceiptFromTransaction(paymentTx.id);
  const savedRcpts = JSON.parse(S.localStorage.getItem('hisaab_receipts') || '[]');
  check('receipt created', savedRcpts.length >= 1, 'got ' + savedRcpts.length);
  check('receipt did not duplicate payment', moduleTxCount() === beforeRcpt, 'got ' + moduleTxCount());
  const r = savedRcpts[savedRcpts.length - 1];
  check('receipt unique number', /^RCPT-\d{4}$/.test(r.receiptNo), r.receiptNo);

  console.log('\n=====================================');
  console.log(`ENTRY-SAVE RESULTS: ${pass} passed, ${fail} failed out of ${pass + fail}`);
  console.log('=====================================');
  if (fail) { console.log('SOME TESTS FAILED'); process.exit(1); }
  console.log('ALL ENTRY-SAVE TESTS PASSED');
  process.exit(0);
})();
