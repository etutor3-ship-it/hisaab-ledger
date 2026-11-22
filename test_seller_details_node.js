// Seller Details test - pure Node.js with mock DOM
const fs = require('fs');
const vm = require('vm');

// ============ MOCK DOM ============
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
      toggle(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); },
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
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] === undefined ? null : this.attributes[k]; }
  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }
  removeEventListener() {}
  appendChild(child) { this.children.push(child); return child; }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
  click() {
    (this.listeners['click'] || []).forEach(fn => fn.call(this, { preventDefault: () => {}, target: this, closest: () => null }));
  }
  dispatchEvent(evt) {
    (this.listeners[evt.type] || []).forEach(fn => fn(evt));
    return true;
  }
  focus() {}
  blur() {}
  scrollIntoView() {}
  getBoundingClientRect() { return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }; }
}
Object.defineProperty(MockElement.prototype, 'textContent', {
  set(v) { this._textContent = String(v); this._innerHTML = String(v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); },
  get() { return this._textContent === undefined ? '' : this._textContent; },
  enumerable: true, configurable: true,
});
Object.defineProperty(MockElement.prototype, 'innerHTML', {
  set(v) { this._innerHTML = String(v); },
  get() { return this._innerHTML === undefined ? '' : this._innerHTML; },
  enumerable: true, configurable: true,
});

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
  createElement(tag) { return new MockElement(tag); }
  querySelector(sel) {
    if (sel.startsWith('#')) {
      return this.elements[sel.slice(1)] || null;
    }
    return null;
  }
  querySelectorAll(sel) { return []; }
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
  alert: (msg) => console.log('[ALERT]', msg),
};

// Register all elements app.js accesses at top level
const ids = [
  'lang-picker', 'lang-switcher', 'total-outstanding', 'customer-list',
  'cust-name', 'cust-phone', 'cust-suggestions', 'import-contacts-btn',
  'contact-picker-notice', 'cust-error', 'cust-opening-balance',
  'add-customer-form', 'contact-picker-modal', 'contact-picker-backdrop',
  'contact-picker-cancel', 'contact-picker-confirm', 'contact-picker-name-display',
  'contact-picker-list', 'contact-picker-empty', 'nav-change-language',
  'nav-seller-details', 'view-home', 'view-add-customer', 'view-ledger',
  'view-import', 'view-backup', 'view-seller-details', 'view-receipt',
  'view-statement', 'shot-input', 'shot-preview',
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
  // Seller details elements
  'seller-details-form', 'seller-owner-name', 'seller-shop-name',
  'seller-mobile', 'seller-address', 'seller-error', 'seller-saved-msg',
  'seller-details-title', 'seller-details-sub', 'seller-clear-btn',
  'seller-back',
];
ids.forEach(id => {
  const el = new MockElement();
  el.setAttribute('id', id);
  document.registerElement(id, el);
});

// Register elements with data-i18n attributes
const i18nEls = [
  ['total-outstanding', 'home.total_outstanding', 'Total Outstanding: Rs 0'],
  ['nav-change-language', 'nav.change_language', 'Change Language'],
  ['nav-seller-details', 'nav.seller_details', 'Seller / Shop Details'],
  ['nav-customers', 'nav.customers', 'Customers'],
  ['lang-title', 'lang.title', 'Choose language'],
  ['seller-details-title', 'seller_details.title', 'Seller / Shop Details'],
  ['seller-details-sub', 'seller_details.not_set', 'Seller / Shop details not set...'],
];
i18nEls.forEach(([id, key, text]) => {
  const el = new MockElement();
  el.setAttribute('id', id);
  el.setAttribute('data-i18n', key);
  el.textContent = text;
  document.registerElement(id, el);
});

// ============ LOAD app.js ============
let appjs = fs.readFileSync('/tmp/kilo/app_test.js', 'utf8');

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
  alert: window.alert,
};
context.global = context;
vm.createContext(context);
try {
  vm.runInContext(appjs, context);
  console.log('app.js loaded successfully');
} catch (e) {
  console.log('app.js load error:', e.message);
}

// Copy functions to window for test access
window.setLanguage = context.setLanguage;
window.chooseLanguage = context.chooseLanguage;
window.loadLanguage = context.loadLanguage;
window.t = context.t;
window.translatePage = context.translatePage;
window.currentLang = context.currentLang;
window.loadSellerDetails = context.loadSellerDetails;
window.saveSellerDetails = context.saveSellerDetails;
window.getSellerName = context.getSellerName;
window.getSellerShopName = context.getSellerShopName;
window.hasSellerDetails = context.hasSellerDetails;
window.formatSellerHeader = context.formatSellerHeader;
window.renderSellerDetailsView = context.renderSellerDetailsView;
window.appBooted = context.appBooted;
window.bootApp = context.bootApp;
window.route = context.route;
window.renderHome = context.renderHome;
window.showView = context.showView;
window.loadState = context.loadState;
window.escapeHtml = context.escapeHtml;
window.formatMoney2 = context.formatMoney2;

// Helper to set seller details via localStorage + load
function setSellerDetails(data) {
  window.localStorage.setItem('hisaab_seller_details', JSON.stringify(data));
  context.loadSellerDetails();
}

// ============ TESTS ============
let passed = 0, failed = 0, total = 0;
function assert(condition, name) {
  total++;
  if (condition) { passed++; console.log('PASS: ' + name); }
  else { failed++; console.log('FAIL: ' + name); }
}

function resetSeller() {
  window.localStorage.removeItem('hisaab_seller_details');
  context.loadSellerDetails();
}

console.log('\n--- Seller Details: Initial state (no seller set) ---');
resetSeller();
assert(window.hasSellerDetails() === false, 'hasSellerDetails() returns false initially');
assert(window.getSellerName() === '', 'getSellerName() returns empty initially');
assert(window.getSellerShopName() === '', 'getSellerShopName() returns empty initially');
assert(window.formatSellerHeader() === '', 'formatSellerHeader() returns empty initially');

console.log('\n--- Seller Details: Save details via localStorage + load ---');
resetSeller();
setSellerDetails({
  ownerName: 'Ravi Kumar',
  shopName: 'Ravi General Store',
  mobile: '9876543210',
  address: '123 Main Road, Market Area',
});

assert(window.hasSellerDetails() === true, 'hasSellerDetails() returns true after save');
assert(window.getSellerName() === 'Ravi Kumar', 'getSellerName() returns Ravi Kumar');
assert(window.getSellerShopName() === 'Ravi General Store', 'getSellerShopName() returns shop name');
assert(window.localStorage.getItem('hisaab_seller_details') !== null, 'localStorage has seller details');

const stored = JSON.parse(window.localStorage.getItem('hisaab_seller_details'));
assert(stored.ownerName === 'Ravi Kumar', 'stored ownerName is Ravi Kumar');
assert(stored.shopName === 'Ravi General Store', 'stored shopName is correct');
assert(stored.mobile === '9876543210', 'stored mobile is correct');
assert(stored.address === '123 Main Road, Market Area', 'stored address is correct');

console.log('\n--- Seller Details: loadSellerDetails persistence ---');
resetSeller();
window.localStorage.setItem('hisaab_seller_details', JSON.stringify({
  ownerName: 'Priya Sharma',
  shopName: 'Priya Traders',
  mobile: '8765432109',
  address: '456 Market Lane',
}));
window.loadSellerDetails();
assert(window.getSellerName() === 'Priya Sharma', 'loadSellerDetails loads ownerName');
assert(window.getSellerShopName() === 'Priya Traders', 'loadSellerDetails loads shopName');
assert(window.hasSellerDetails() === true, 'hasSellerDetails() returns true after load');

console.log('\n--- Seller Details: formatSellerHeader ---');
assert(window.formatSellerHeader() === 'Priya Sharma \u2022 Priya Traders', 'formatSellerHeader combines name and shop');

console.log('\n--- Seller Details: formatSellerHeader with only name ---');
resetSeller();
window.localStorage.setItem('hisaab_seller_details', JSON.stringify({ ownerName: 'Only Name', shopName: '', mobile: '', address: '' }));
window.loadSellerDetails();
assert(window.formatSellerHeader() === 'Only Name', 'formatSellerHeader with only name');

console.log('\n--- Seller Details: Edit details (overwrite) ---');
resetSeller();
window.localStorage.setItem('hisaab_seller_details', JSON.stringify({ ownerName: 'Old Name', shopName: 'Old Shop', mobile: '', address: '' }));
window.loadSellerDetails();
assert(window.getSellerName() === 'Old Name', 'old name loaded');

// Overwrite
window.localStorage.setItem('hisaab_seller_details', JSON.stringify({ ownerName: 'New Name', shopName: 'New Shop', mobile: '1111111111', address: 'New Address' }));
window.loadSellerDetails();
assert(window.getSellerName() === 'New Name', 'name overwritten');
assert(window.getSellerShopName() === 'New Shop', 'shop name overwritten');

console.log('\n--- Seller Details: Clear details ---');
resetSeller();
window.localStorage.setItem('hisaab_seller_details', JSON.stringify({ ownerName: 'To Clear', shopName: 'To Clear Shop', mobile: '', address: '' }));
window.loadSellerDetails();
assert(window.hasSellerDetails() === true, 'has details before clear');

// Clear
window.localStorage.removeItem('hisaab_seller_details');
window.loadSellerDetails();
assert(window.hasSellerDetails() === false, 'hasSellerDetails() returns false after clear');
assert(window.getSellerName() === '', 'name empty after clear');
assert(window.formatSellerHeader() === '', 'header empty after clear');

console.log('\n--- Seller Details: i18n translations ---');
window.setLanguage('en');
assert(window.t('seller_details.title') === 'Seller / Shop Details', 'EN: title');
assert(window.t('seller_details.owner_name') === 'Seller / Shop Owner Name', 'EN: owner_name');
assert(window.t('seller_details.save_btn') === 'Save Details', 'EN: save_btn');
assert(window.t('seller_details.error_name') === 'Please enter the seller / shop owner name.', 'EN: error_name');
assert(window.t('seller_details.not_set') === 'Seller / Shop details not set. Please complete Seller / Shop Details in Settings.', 'EN: not_set');
assert(window.t('seller_details.saved') === 'Seller / Shop details saved successfully.', 'EN: saved');

window.setLanguage('hi');
assert(window.t('seller_details.title') === 'विक्रेता / दुकान विवरण', 'HI: title');
assert(window.t('seller_details.owner_name') === 'विक्रेता / दुकान मालिक का नाम', 'HI: owner_name');
assert(window.t('seller_details.save_btn') === 'विवरण सहेजें', 'HI: save_btn');

window.setLanguage('ur');
assert(window.t('seller_details.title') === 'فروخت کنندہ / دکان تفصیلات', 'UR: title');
assert(window.t('seller_details.owner_name') === 'فروخت کنندہ / دکان کے مالک کا نام', 'UR: owner_name');
assert(window.t('seller_details.save_btn') === 'تفصیلات محفوظ کریں', 'UR: save_btn');

console.log('\n=== Seller Details Test Results: ' + passed + ' passed, ' + failed + ' failed out of ' + total + ' ===');
if (failed === 0) {
  console.log('ALL SELLER DETAILS TESTS PASSED');
  process.exit(0);
} else {
  console.log('SOME SELLER DETAILS TESTS FAILED');
  process.exit(1);
}
