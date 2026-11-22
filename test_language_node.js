// Language selection test - pure Node.js with mock DOM
const fs = require('fs');

// ============ MOCK DOM ============
class MockElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add(...c) { c.forEach(x => this._classes.add(x)); },
      remove(...c) { c.forEach(x => this._classes.delete(x)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); },
    };
    this.style = {};
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    this.dataset = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] === undefined ? null : this.attributes[k]; }
  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }
  removeEventListener() {}
  appendChild(child) { this.children.push(child); return child; }
  querySelector(sel) {
    if (sel === '.lang-btn') {
      return Object.values(this.elements).find(e => e.attributes['data-lang']);
    }
    if (sel.startsWith('[data-lang=')) {
      const val = sel.match(/\[data-lang="([^"]+)"\]/);
      if (val) {
        return Object.values(this.elements).find(e => e.attributes['data-lang'] === val[1]);
      }
    }
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      return this.elements[id] || null;
    }
    return null;
  }
  querySelectorAll(sel) { return []; }
  click() {
    (this.listeners['click'] || []).forEach(fn => fn.call(this, { preventDefault: () => {}, target: this, closest: () => null }));
  }
  dispatchEvent(evt) {
    (this.listeners[evt.type] || []).forEach(fn => fn(evt));
    return true;
  }
}

class MockDocument {
  constructor() {
    this.elements = {};
    this.body = new MockElement('body');
    this.documentElement = new MockElement('html');
    this.documentElement.lang = 'en';
    this.documentElement.dir = 'ltr';
    this.location = { hash: '', search: '' };
  }
  getElementById(id) { return this.elements[id] || null; }
  querySelector(sel) {
    if (sel.startsWith('[data-lang=')) {
      const val = sel.match(/\[data-lang="([^"]+)"\]/);
      if (val) {
        return Object.values(this.elements).find(e => e.attributes['data-lang'] === val[1]);
      }
    }
    if (sel.startsWith('#')) {
      return this.elements[sel.slice(1)] || null;
    }
    return null;
  }
  createElement(tag) { return new MockElement(tag); }
  querySelectorAll(sel) {
    if (sel === '[data-i18n]') {
      return Object.values(this.elements).filter(e => e.attributes['data-i18n']);
    }
    if (sel === '[data-i18n-placeholder]') {
      return Object.values(this.elements).filter(e => e.attributes['data-i118n-placeholder'] || e.attributes['data-i18n-placeholder']);
    }
    if (sel === '.lang-btn') {
      return Object.values(this.elements).filter(e => e.attributes['data-lang']);
    }
    if (sel === 'section.view') {
      return Object.values(this.elements).filter(e => e.classList._classes.has('view'));
    }
    return [];
  }
  addEventListener() {}
  registerElement(id, el) {
    this.elements[id] = el;
    if (el.attributes && el.attributes.id) {
      this.elements[el.attributes.id] = el;
    }
  }
}

const document = new MockDocument();
const window = {
  document,
  location: { hash: '', search: '' },
  localStorage: (() => {
    const store = {};
    return {
      getItem(k) { return store[k] === undefined ? null : store[k]; },
      setItem(k, v) { store[k] = String(v); },
      removeItem(k) { delete store[k]; },
      clear() { Object.keys(store).forEach(k => delete store[k]); },
    };
  })(),
  console: {
    log: (...args) => console.log('[LOG]', ...args),
    error: (...args) => console.log('[ERROR]', ...args),
  },
  setTimeout: (fn, t) => setTimeout(fn, t),
  setInterval: () => {},
  clearInterval: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  crypto: { randomUUID: () => 'mock-uuid-' + Math.random().toString(36).slice(2) },
};

const ids = [
  'lang-picker', 'lang-switcher', 'total-outstanding', 'customer-list',
  'cust-name', 'cust-phone', 'cust-suggestions', 'import-contacts-btn',
  'contact-picker-notice', 'cust-error', 'cust-opening-balance',
  'add-customer-form', 'contact-picker-modal', 'contact-picker-backdrop',
  'contact-picker-cancel', 'contact-picker-confirm', 'contact-picker-name-display',
  'contact-picker-list', 'contact-picker-empty', 'nav-change-language',
  'view-home', 'view-add-customer', 'view-ledger', 'view-import',
  'view-backup', 'view-receipt', 'view-statement', 'shot-input', 'shot-preview',
  'restore-preview', 'restore-actions', 'restore-result', 'restore-file',
  'restore-merge', 'restore-replace', 'statement-summary', 'statement-content',
  'receipt-content', 'tx-list', 'ledger-balance', 'ledger-reminder-note',
  'entry-form', 'receipt-actions', 'print-receipt-btn', 'print-statement-btn',
  'download-receipt-page-btn', 'download-statement-btn', 'share-receipt-wa-btn',
  'share-statement-wa-btn', 'export-statement-csv-btn', 'invoice-btn',
  'statement-btn', 'whatsapp-btn', 'view-receipt-btn', 'download-receipt-btn',
  'back-home', 'receipt-back', 'statement-back', 'stmt-apply-custom',
  'entry-type', 'entry-amount', 'entry-date', 'entry-note', 'entry-payment-mode',
  'custom-date-range', 'stmt-date-from', 'stmt-date-to', 'import-box',
  'import-result', 'backup-info', 'download-backup', 'import-go',
  'ledger-title', 'ledger-sub', 'receipt-title', 'receipt-sub',
  'statement-title', 'statement-sub',
];

ids.forEach(id => {
  const el = new MockElement();
  el.setAttribute('id', id);
  document.registerElement(id, el);
});

const i18nEls = [
  ['total-outstanding', 'home.total_outstanding', 'Total Outstanding: Rs 0'],
  ['nav-change-language', 'nav.change_language', 'Change Language'],
  ['nav-customers', 'nav.customers', 'Customers'],
  ['lang-title', 'lang.title', 'Choose language'],
];
i18nEls.forEach(([id, key, text]) => {
  const el = new MockElement();
  el.setAttribute('id', id);
  el.setAttribute('data-i18n', key);
  el.textContent = text;
  document.registerElement(id, el);
});

// Register lang-btn elements (they have data-lang instead of id)
['en', 'hi', 'ur'].forEach(lang => {
  const btn = new MockElement('button');
  btn.setAttribute('data-lang', lang);
  btn.setAttribute('type', 'button');
  btn.textContent = lang;
  document.registerElement('lang-btn-' + lang, btn);
});

// ============ LOAD app.js ============
let appjs = fs.readFileSync('/tmp/kilo/app_test.js', 'utf8');

const vm = require('vm');
const context = {
  window,
  document,
  console: window.console,
  setTimeout,
  setInterval,
  clearInterval,
  crypto: window.crypto,
  location: window.location,
  localStorage: window.localStorage,
};
context.global = context;
vm.createContext(context);
try {
  vm.runInContext(appjs, context);
  console.log('app.js loaded successfully');
} catch (e) {
  console.log('app.js load error:', e.message);
}

// Copy language functions to window for test access
window.setLanguage = context.setLanguage;
window.chooseLanguage = context.chooseLanguage;
window.loadLanguage = context.loadLanguage;
window.t = context.t;
window.translatePage = context.translatePage;
window.currentLang = context.currentLang;
window.STORAGE_LANG = context.STORAGE_LANG;
window.SUPPORTED_LANGS = context.SUPPORTED_LANGS;
window.LANG_DIR = context.LANG_DIR;
window.LANG_LABELS = context.LANG_LABELS;
window.appBooted = context.appBooted;
window.bootApp = context.bootApp;
window.route = context.route;
window.renderHome = context.renderHome;
window.showView = context.showView;
window.loadState = context.loadState;
if (context.currentLang !== undefined) window.currentLang = context.currentLang;

// ============ TESTS ============
let passed = 0, failed = 0, total = 0;
function assert(condition, name) {
  total++;
  if (condition) { passed++; console.log('PASS: ' + name); }
  else { failed++; console.log('FAIL: ' + name); }
}

function resetLanguage() {
  window.localStorage.removeItem('hisaab_lang');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
  document.body.classList.remove('rtl');
  const picker = document.getElementById('lang-picker');
  if (picker) picker.style.display = 'none';
}

// Test setLanguage
console.log('\n--- setLanguage: English ---');
resetLanguage();
window.setLanguage('en');
assert(window.localStorage.getItem('hisaab_lang') === 'en', 'localStorage saved en');
assert(document.documentElement.lang === 'en', 'html lang is en');
assert(document.documentElement.dir === 'ltr', 'html dir is ltr for en');
const totalEn = document.getElementById('total-outstanding');
assert(totalEn.textContent === 'Total Outstanding: Rs 0', 'English text correct');

console.log('\n--- setLanguage: Hindi ---');
resetLanguage();
window.setLanguage('hi');
assert(window.localStorage.getItem('hisaab_lang') === 'hi', 'localStorage saved hi');
assert(document.documentElement.lang === 'hi', 'html lang is hi');
assert(document.documentElement.dir === 'ltr', 'html dir is ltr for hi');
const totalHi = document.getElementById('total-outstanding');
assert(totalHi.textContent === 'कुल बकाया: रु 0', 'Hindi text correct: ' + totalHi.textContent);

console.log('\n--- setLanguage: Urdu ---');
resetLanguage();
window.setLanguage('ur');
assert(window.localStorage.getItem('hisaab_lang') === 'ur', 'localStorage saved ur');
assert(document.documentElement.lang === 'ur', 'html lang is ur');
assert(document.documentElement.dir === 'rtl', 'html dir is rtl for ur');
assert(document.body.classList.contains('rtl') === true, 'body is rtl for ur');
const totalUr = document.getElementById('total-outstanding');
assert(totalUr.textContent === 'کل بکایا: Rs 0', 'Urdu text correct: ' + totalUr.textContent);

// Test loadLanguage
console.log('\n--- loadLanguage persistence ---');
resetLanguage();
window.localStorage.setItem('hisaab_lang', 'hi');
assert(window.loadLanguage() === 'hi', 'loadLanguage returns hi');
window.localStorage.setItem('hisaab_lang', 'ur');
assert(window.loadLanguage() === 'ur', 'loadLanguage returns ur');
window.localStorage.setItem('hisaab_lang', 'en');
assert(window.loadLanguage() === 'en', 'loadLanguage returns en');

console.log('\n--- loadLanguage invalid/unset ---');
resetLanguage();
window.localStorage.setItem('hisaab_lang', 'xx');
assert(window.loadLanguage() === null, 'loadLanguage returns null for invalid');
resetLanguage();
window.localStorage.removeItem('hisaab_lang');
assert(window.loadLanguage() === null, 'loadLanguage returns null when unset');

// Test chooseLanguage
console.log('\n--- chooseLanguage hides picker ---');
resetLanguage();
const picker = document.getElementById('lang-picker');
picker.style.display = 'flex';
assert(picker.style.display === 'flex', 'Picker visible before');
window.chooseLanguage('hi');
assert(picker.style.display === 'none', 'Picker hidden after chooseLanguage(hi)');
assert(window.localStorage.getItem('hisaab_lang') === 'hi', 'localStorage set');

console.log('\n--- chooseLanguage with ur ---');
resetLanguage();
picker.style.display = 'flex';
window.chooseLanguage('ur');
assert(picker.style.display === 'none', 'Picker hidden after chooseLanguage(ur)');
assert(document.documentElement.dir === 'rtl', 'html dir rtl after ur');

console.log('\n--- chooseLanguage with en ---');
resetLanguage();
picker.style.display = 'flex';
window.chooseLanguage('en');
assert(picker.style.display === 'none', 'Picker hidden after chooseLanguage(en)');
assert(document.documentElement.dir === 'ltr', 'html dir ltr after en');

// Test t() function
console.log('\n--- t() contact_picker keys ---');
resetLanguage();
window.setLanguage('en');
assert(window.t('contact_picker.title') === 'Select Phone Number', 'EN: title');
assert(window.t('contact_picker.no_phones') === 'No phone number found for this contact. Please enter manually.', 'EN: no_phones');

resetLanguage();
window.setLanguage('hi');
assert(window.t('contact_picker.title') === 'फोन नंबर चुनें', 'HI: title');
assert(window.t('contact_picker.no_phones') === 'इस संपर्क के लिए कोई फोन नंबर नहीं मिला। कृपया मैन्युअली दर्ज करें।', 'HI: no_phones');

resetLanguage();
window.setLanguage('ur');
assert(window.t('contact_picker.title') === 'فون نمبر منتخب کریں', 'UR: title');
assert(window.t('contact_picker.no_phones') === 'اس رابطے کے لیے کوئی فون نمبر نہیں ملا۔ براہ کرم دستیاب درج کریں۔', 'UR: no_phones');

// Test Change Language nav item
console.log('\n--- Change Language nav item ---');
resetLanguage();
const navBtn = document.getElementById('nav-change-language');
picker.style.display = 'none';
navBtn.click();
assert(picker.style.display === 'flex', 'Picker reopened by Change Language nav item');

// Test click handler on .lang-btn
console.log('\n--- lang-btn click handler ---');
resetLanguage();
picker.style.display = 'flex';
const hiBtn = document.querySelector('[data-lang="hi"]');
hiBtn.click();
assert(picker.style.display === 'none', 'Picker hidden after clicking Hindi button');
assert(window.localStorage.getItem('hisaab_lang') === 'hi', 'localStorage set after button click');

// Summary
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed out of ' + total + ' ===');
if (failed === 0) {
  console.log('ALL LANGUAGE TESTS PASSED');
  process.exit(0);
} else {
  console.log('SOME LANGUAGE TESTS FAILED');
  process.exit(1);
}
