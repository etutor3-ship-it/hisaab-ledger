/* Hisaab – Digital Shop Ledger (app.js)
 *
 * Pure vanilla JavaScript. All data lives in browser localStorage:
 *   - customers
 *   - transactions
 *   - payment screenshots (data URLs)
 *
 * No server, no external database, no paid APIs.
 */

/* ---------- Storage keys ---------- */
const STORAGE_CUSTOMERS = 'hisaab_customers';
const STORAGE_TRANSACTIONS = 'hisaab_transactions';
const STORAGE_SHOTS = 'hisaab_shots';

/* ---------- Date handling ---------- */
/* Honour ?today=YYYY-MM-DD for date-dependent defaults and tests,
   otherwise fall back to the current local date. */
function todayFromUrl() {
  try {
    const value = new URLSearchParams(window.location.search).get('today');
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  } catch (e) {
    // ignore malformed URLs
  }
  return null;
}

const DEFAULT_DATE = todayFromUrl() || new Date().toISOString().slice(0, 10);

/* ---------- State ---------- */
let customers = [];   // { id, name, phone, createdAt }
let transactions = [];// { id, customerPhone, type, amount, date, note }
let shots = {};       // entryId -> data URL (payment screenshot)
let currentPhone = null; // phone of the ledger currently being viewed

function loadState() {
  try { customers = JSON.parse(localStorage.getItem(STORAGE_CUSTOMERS) || '[]'); } catch (e) { customers = []; }
  try { transactions = JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS) || '[]'); } catch (e) { transactions = []; }
  try { shots = JSON.parse(localStorage.getItem(STORAGE_SHOTS) || '{}'); } catch (e) { shots = {}; }
}

function saveState() {
  localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(customers));
  localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_SHOTS, JSON.stringify(shots));
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : text;
  return div.innerHTML;
}

function formatMoney(n) {
  const m = n < 0 ? -n : n;
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(m || 0);
}

/* ---------- Balance calculations (never manually typed) ---------- */
function balanceFor(phone) {
  let total = 0;
  for (const t of transactions) {
    if (t.customerPhone !== phone) continue;
    total += t.type === 'credit' ? t.amount : -t.amount;
  }
  return total;
}

function totalOutstanding() {
  let total = 0;
  for (const c of customers) total += balanceFor(c.phone);
  return total;
}

/* ---------- Views ---------- */
function showView(id) {
  document.querySelectorAll('section.view').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function route() {
  const hash = location.hash || '#view-home';
  const id = hash.slice(1);
  if (id.startsWith('view-ledger')) {
    const qs = id.includes('?') ? id.split('?')[1] : '';
    const phone = new URLSearchParams(qs).get('phone');
    if (phone) {
      renderLedger(decodeURIComponent(phone));
      return;
    }
    showView('view-home');
  } else {
    showView(id);
    if (id === 'view-home') renderHome();
    if (id === 'view-backup') {
      document.getElementById('restore-preview').innerHTML = '';
      document.getElementById('restore-actions').style.display = 'none';
      document.getElementById('restore-result').innerHTML = '';
      document.getElementById('restore-file').value = '';
    }
  }
}

/* ---------- Home screen ---------- */
function renderHome() {
  const list = document.getElementById('customer-list');
  const totalEl = document.getElementById('total-outstanding');

  const total = totalOutstanding();
  totalEl.textContent = `Total Outstanding: ${total < 0 ? '-' : ''}Rs ${formatMoney(total)}`;

  list.innerHTML = '';
  const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name));
  if (sorted.length === 0) {
    list.innerHTML = '<p class="hint">No customers yet. Add one to get started.</p>';
    return;
  }

  for (const c of sorted) {
    const bal = balanceFor(c.phone);
    const row = document.createElement('div');
    row.className = 'customer-row';
    row.dataset.customer = c.phone;

    const whatsappMsg = `${c.name}'s outstanding balance is Rs ${formatMoney(bal)}.`;

    row.innerHTML = `
      <div class="cust-info">
        <div class="cust-name">${escapeHtml(c.name)}</div>
        <div class="cust-phone">${escapeHtml(c.phone)}</div>
      </div>
      <div class="cust-balance ${bal < 0 ? 'neg' : ''}" data-balance>${bal < 0 ? '-' : ''}Rs ${formatMoney(bal)}</div>
      <div class="cust-actions">
        <a href="#view-ledger?phone=${encodeURIComponent(c.phone)}" class="btn">View Ledger</a>
        <a href="https://wa.me/91${c.phone}?text=${encodeURIComponent(whatsappMsg)}"
           data-remind="${c.phone}" class="btn btn-wa" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    `;
    list.appendChild(row);
  }
}

/* ---------- Customers ---------- */
document.getElementById('add-customer-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const errorEl = document.getElementById('cust-error');

  if (!name) {
    errorEl.textContent = 'Enter the customer name.';
    return;
  }
  /* Exactly 10 digits, no letters or symbols. */
  if (!/^\d{10}$/.test(phone)) {
    errorEl.textContent = 'Mobile number must contain exactly 10 digits (no letters or symbols).';
    return;
  }
  if (customers.some(c => c.phone === phone)) {
    errorEl.textContent = 'A customer with this mobile number already exists.';
    return;
  }

  errorEl.textContent = '';
  customers.push({ id: uid(), name, phone, createdAt: DEFAULT_DATE });

  /* Auto-create a credit transaction for positive opening balance. */
  const openingBalance = parseFloat(document.getElementById('cust-opening-balance').value);
  if (Number.isFinite(openingBalance) && openingBalance > 0) {
    transactions.push({
      id: uid(),
      customerPhone: phone,
      type: 'credit',
      amount: openingBalance,
      date: DEFAULT_DATE,
      note: 'Opening balance'
    });
  }

  saveState();
  this.reset();
  renderHome();
  showView('view-home');
});

/* ---------- Individual ledger ---------- */
function renderLedger(phone) {
  currentPhone = phone;

  const c = customers.find(x => x.phone === phone);
  if (!c) {
    showView('view-home');
    return;
  }

  showView('view-ledger');
  document.getElementById('ledger-title').textContent = c.name;
  document.getElementById('ledger-sub').textContent = `${escapeHtml(c.name)} \u2022 ${escapeHtml(c.phone)}`;

  const bal = balanceFor(phone);

  /* WhatsApp reminder link: user taps it, nothing is sent automatically. */
  const waBtn = document.getElementById('whatsapp-btn');
  const whatsappMsg = `${c.name}'s outstanding balance is Rs ${formatMoney(bal)}.`;
  waBtn.href = `https://wa.me/91${phone}?text=${encodeURIComponent(whatsappMsg)}`;
  waBtn.dataset.remind = phone;

  document.getElementById('ledger-balance').innerHTML =
    `Balance: <strong>${bal < 0 ? '-' : ''}Rs ${formatMoney(bal)}</strong>`;

  const list = document.getElementById('tx-list');
  list.innerHTML = '';

  /* Newest transactions first. */
  const txs = transactions
    .filter(t => t.customerPhone === phone)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const t of txs) {
    const isPayment = t.type === 'payment';
    const shot = shots[t.id] ? `<img src="${shots[t.id]}" data-shot class="shot-thumb" alt="payment screenshot">` : '';

    const el = document.createElement('div');
    el.className = `tx-item ${t.type}`;
    el.innerHTML = `
      <div class="tx-date">${escapeHtml(t.date)}</div>
      <div class="tx-type">${isPayment ? 'Payment' : 'Credit'}</div>
      <div class="tx-amount">${isPayment ? '\u2013' : '+'}Rs ${formatMoney(t.amount)}</div>
      <div class="tx-note">${escapeHtml(t.note || '')}</div>
      ${shot}
    `;
    list.appendChild(el);
  }

  /* Entry form defaults. */
  const form = document.getElementById('entry-form');
  form.reset();
  document.getElementById('entry-date').value = DEFAULT_DATE;
  document.getElementById('shot-preview').innerHTML = '';
  form.onsubmit = handleEntrySubmit;
}

/* Screenshot preview when a file is chosen. */
document.getElementById('shot-input').addEventListener('change', function () {
  const preview = document.getElementById('shot-preview');
  preview.innerHTML = '';
  const file = this.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    this.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    preview.innerHTML = `<img src="${reader.result}" class="shot-preview-img" alt="preview">`;
  };
  reader.readAsDataURL(file);
});

function handleEntrySubmit(e) {
  e.preventDefault();
  if (!currentPhone) return;

  const type = document.getElementById('entry-type').value;
  const amount = parseFloat(document.getElementById('entry-amount').value);
  const date = document.getElementById('entry-date').value || DEFAULT_DATE;
  const note = document.getElementById('entry-note').value.trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    alert('Enter a valid amount greater than 0.');
    return;
  }
  if (!date) {
    alert('Select a date.');
    return;
  }
  if (!note) {
    alert('Enter a note.');
    return;
  }

  const entry = {
    id: uid(),
    customerPhone: currentPhone,
    type,
    amount,
    date,
    note
  };

  const fileInput = document.getElementById('shot-input');
  const file = fileInput.files[0];
  const preview = document.getElementById('shot-preview');

  const finish = () => {
    transactions.push(entry);
    saveState();
    renderLedger(currentPhone);
    fileInput.value = '';
    preview.innerHTML = '';
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      shots[entry.id] = reader.result; // persists across refreshes via localStorage
      finish();
    };
    reader.onerror = () => alert('Could not read the image.');
    reader.readAsDataURL(file);
  } else {
    finish();
  }
}

/* ---------- JSON import ---------- */
/*
 * Supports three JSON shapes:
 *  1) Top-level array of customers, each with optional nested "entries".
 *  2) Object { customers: [...] }, each with optional nested "entries".
 *  3) Object { customers: [...], entries: [...] } where top-level entries are
 *     linked to customers by the "phone" field (sample-data format).
 */
document.getElementById('import-go').addEventListener('click', function () {
  const raw = document.getElementById('import-box').value.trim();
  const result = document.getElementById('import-result');

  if (!raw) {
    result.textContent = 'Paste JSON into the box first.';
    result.className = 'msg error';
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    result.textContent = 'Invalid JSON: ' + err.message;
    result.className = 'msg error';
    return;
  }

  let customerArr;
  let topLevelEntries = [];

  if (Array.isArray(parsed)) {
    customerArr = parsed;
  } else if (parsed && Array.isArray(parsed.customers)) {
    customerArr = parsed.customers;
    topLevelEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
  } else {
    result.textContent = 'JSON must be an array of customers or an object with a "customers" array.';
    result.className = 'msg error';
    return;
  }

  const errors = [];
  const normalized = [];
  const phoneToCustomer = new Map();

  /* Parse customers (with backward-compatible nested entries). */
  customerArr.forEach((rawC, i) => {
    const no = `Customer #${i + 1}`;
    if (!rawC || typeof rawC !== 'object') {
      errors.push(`${no}: not a valid customer object.`);
      return;
    }

    const name = String(rawC.name || '').trim();
    const phone = String(rawC.phone || '').trim();
    if (!name) { errors.push(`${no}: name is required.`); return; }
    if (!/^\d{10}$/.test(phone)) { errors.push(`${no} (${name}): phone must be exactly 10 digits.`); return; }

    const nestedEntries = Array.isArray(rawC.entries) ? rawC.entries : [];
    const normEntries = [];

    nestedEntries.forEach((e, j) => {
      if (!e) return;
      const amount = Number(e.amount);
      if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.date)) || !Number.isFinite(amount) || amount < 0) {
        errors.push(`${name} entry #${j + 1}: invalid date or amount.`);
        return;
      }
      normEntries.push({
        id: uid(),
        customerPhone: phone,
        type: e.type === 'payment' ? 'payment' : 'credit',
        amount,
        date: String(e.date),
        note: String(e.note || '')
      });
    });

    const customer = { id: uid(), name, phone, entries: normEntries };
    normalized.push(customer);
    phoneToCustomer.set(phone, customer);
  });

  /* Link top-level entries to customers by phone number. */
  topLevelEntries.forEach((e, j) => {
    if (!e) return;
    const phone = String(e.phone || '').trim();
    if (!phoneToCustomer.has(phone)) {
      errors.push(`Entry #${j + 1}: no customer found with phone ${phone}.`);
      return;
    }
    const amount = Number(e.amount);
    if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.date)) || !Number.isFinite(amount) || amount < 0) {
      errors.push(`Entry #${j + 1} for phone ${phone}: invalid date or amount.`);
      return;
    }
    const entry = {
      id: uid(),
      customerPhone: phone,
      type: e.type === 'payment' ? 'payment' : 'credit',
      amount,
      date: String(e.date),
      note: String(e.note || '')
    };
    phoneToCustomer.get(phone).entries.push(entry);
  });

  if (errors.length) {
    result.textContent = errors.join(' ');
    result.className = 'msg error';
    return;
  }

  const mode = document.querySelector('input[name="import-mode"]:checked').value;

  if (mode === 'replace') {
    if (!confirm('Replace all existing customers and transactions? This cannot be undone.')) return;
    customers = normalized.map(n => ({ id: n.id, name: n.name, phone: n.phone }));
    transactions = normalized.flatMap(n => n.entries);
  } else {
    /* Merge: keep existing data, skip customers whose phone already exists. */
    const existing = new Set(customers.map(c => c.phone));
    let added = 0;
    for (const n of normalized) {
      if (existing.has(n.phone)) continue;
      customers.push({ id: n.id, name: n.name, phone: n.phone });
      existing.add(n.phone);
      transactions.push(...n.entries);
      added++;
    }
    result.textContent = `Merged ${added} new customer(s) (${normalized.length - added} duplicate(s) skipped).`;
    result.className = 'msg ok';
    saveState();
    renderHome();
    showView('view-home');
    return;
  }

  saveState();
  renderHome();
  showView('view-home');
  result.textContent = `Imported ${normalized.length} customer(s) with ${transactions.length} total entry/entries.`;
  result.className = 'msg ok';
});

/* ---------- App metadata ---------- */
const APP_NAME = 'Hisab';
const APP_VERSION = '1.0.0';

/* ---------- Backup & Restore ---------- */

function createBackup() {
  return {
    app: APP_NAME,
    version: APP_VERSION,
    backupDate: new Date().toISOString(),
    data: {
      customers: JSON.parse(JSON.stringify(customers)),
      transactions: JSON.parse(JSON.stringify(transactions)),
      shots: JSON.parse(JSON.stringify(shots))
    }
  };
}

function downloadBackup() {
  const backup = createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hisab_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const info = document.getElementById('backup-info');
  info.textContent = `Backup downloaded: ${backup.data.customers.length} customer(s), ${backup.data.transactions.length} transaction(s), ${Object.keys(backup.data.shots).length} screenshot(s).`;
  info.className = 'msg ok';
  info.style.display = 'block';
}

/* Validate a parsed backup object. Returns { valid, errors, data }. */
function validateBackup(parsed) {
  const errors = [];

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, errors: ['Invalid backup: root must be a JSON object.'], data: null };
  }

  if (parsed.app !== APP_NAME) {
    errors.push('Warning: this backup was not created by Hisab.');
  }
  if (parsed.version && parsed.version !== APP_VERSION) {
    errors.push(`Warning: backup was created with version ${parsed.version}, current version is ${APP_VERSION}.`);
  }

  if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    errors.push('Missing or invalid "data" section.');
    return { valid: false, errors, data: null };
  }

  const { customers: bCustomers, transactions: bTransactions, shots: bShots } = parsed.data;

  if (!Array.isArray(bCustomers)) {
    errors.push('"customers" must be an array.');
  } else {
    bCustomers.forEach((c, i) => {
      const no = `customer #${i + 1}`;
      if (!c || typeof c !== 'object') {
        errors.push(`${no}: not a valid object.`);
        return;
      }
      if (!c.name || typeof c.name !== 'string') {
        errors.push(`${no}: missing name.`);
      }
      if (!c.phone || !/^\d{10}$/.test(String(c.phone))) {
        errors.push(`${no} (${c.name || 'unknown'}): phone must be exactly 10 digits.`);
      }
    });
  }

  if (!Array.isArray(bTransactions)) {
    errors.push('"transactions" must be an array.');
  } else {
    bTransactions.forEach((t, i) => {
      const no = `transaction #${i + 1}`;
      if (!t || typeof t !== 'object') {
        errors.push(`${no}: not a valid object.`);
        return;
      }
      if (!t.customerPhone || !/^\d{10}$/.test(String(t.customerPhone))) {
        errors.push(`${no}: invalid or missing customerPhone.`);
      }
      if (!t.type || !['credit', 'payment'].includes(t.type)) {
        errors.push(`${no}: type must be 'credit' or 'payment'.`);
      }
      if (!Number.isFinite(t.amount) || t.amount < 0) {
        errors.push(`${no}: amount must be a non-negative number.`);
      }
      if (!t.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(t.date))) {
        errors.push(`${no}: invalid or missing date.`);
      }
    });
  }

  if (bShots !== undefined && bShots !== null && (typeof bShots !== 'object' || Array.isArray(bShots))) {
    errors.push('"shots" must be an object.');
  }

  return {
    valid: errors.length === 0 || errors.every(e => e.startsWith('Warning:')),
    errors,
    data: parsed.data
  };
}

/* Render the restore preview UI. Returns the validated backup data or null. */
function showRestorePreview(parsed) {
  const preview = document.getElementById('restore-preview');
  const actions = document.getElementById('restore-actions');
  const result = document.getElementById('restore-result');
  result.innerHTML = '';
  actions.style.display = 'none';

  const validation = validateBackup(parsed);
  if (!validation.valid) {
    preview.innerHTML = `<div class="msg error">Backup validation failed:<br>${validation.errors.join('<br>')}</div>`;
    return null;
  }

  const { customers: bCustomers, transactions: bTransactions, shots: bShots } = validation.data;

  const existingCustomerPhones = new Set(customers.map(c => c.phone));
  const newCustomers = bCustomers.filter(c => !existingCustomerPhones.has(c.phone));
  const duplicateCustomers = bCustomers.filter(c => existingCustomerPhones.has(c.phone));

  const warningHtml = validation.errors.filter(e => e.startsWith('Warning:')).length > 0
    ? `<div class="msg error" style="margin-bottom:10px;">${validation.errors.filter(e => e.startsWith('Warning:')).join('<br>')}</div>`
    : '';

  preview.innerHTML = `
    ${warningHtml}
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:0.9rem;">
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Backup date</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${new Date(parsed.backupDate).toLocaleString()}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Customers in backup</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${bCustomers.length}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Transactions in backup</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${bTransactions.length}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Screenshots in backup</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${bShots ? Object.keys(bShots).length : 0}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">New customers (will be added)</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${newCustomers.length}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Duplicate customers (skipped on merge)</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${duplicateCustomers.length}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Existing customers in app</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${customers.length}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Existing transactions in app</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${transactions.length}</strong></td></tr>
    </table>
  `;

  actions.innerHTML = `
    <button id="restore-merge" class="btn">Merge (skip duplicate phones)</button>
    <button id="restore-replace" class="btn btn-danger">Replace all existing data</button>
  `;
  actions.style.display = 'flex';

  document.getElementById('restore-merge').addEventListener('click', function () {
    if (!confirm(`Merge ${newCustomers.length} new customer(s) and ${bTransactions.length} transaction(s)? Duplicate phone numbers will be skipped. Existing data will be preserved.`)) return;
    performRestore(validation.data, 'merge');
  });

  document.getElementById('restore-replace').addEventListener('click', function () {
    if (!confirm(`WARNING: This will REPLACE all existing customers, transactions, and screenshots. This cannot be undone. Are you sure?`)) return;
    if (!confirm('Final confirmation: replace all existing data with this backup?')) return;
    performRestore(validation.data, 'replace');
  });

  return validation.data;
}

function performRestore(backupData, mode) {
  if (mode === 'replace') {
    customers = backupData.customers.map(c => ({ ...c }));
    transactions = backupData.transactions.map(t => ({ ...t }));
    shots = backupData.shots ? { ...backupData.shots } : {};
  } else {
    /* merge */
    const existingPhones = new Set(customers.map(c => c.phone));
    for (const c of backupData.customers) {
      if (!existingPhones.has(c.phone)) {
        customers.push({ ...c });
        existingPhones.add(c.phone);
      }
    }
    for (const t of backupData.transactions) {
      transactions.push({ ...t });
    }
    if (backupData.shots) {
      Object.assign(shots, backupData.shots);
    }
  }

  saveState();
  renderHome();
  showView('view-home');

  const result = document.getElementById('restore-result');
  result.textContent = `Restore complete (${mode}): ${customers.length} customer(s), ${transactions.length} transaction(s), ${Object.keys(shots).length} screenshot(s).`;
  result.className = 'msg ok';

  document.getElementById('restore-file').value = '';
  document.getElementById('restore-preview').innerHTML = '';
  document.getElementById('restore-actions').style.display = 'none';
}

/* ---------- Navigation wiring ---------- */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    location.hash = this.getAttribute('href');
    route();
  });
});

/* Backup & Restore wiring */
document.getElementById('download-backup').addEventListener('click', downloadBackup);

document.getElementById('restore-file').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const parsed = JSON.parse(evt.target.result);
      showRestorePreview(parsed);
    } catch (err) {
      document.getElementById('restore-preview').innerHTML = `<div class="msg error">Invalid JSON: ${err.message}</div>`;
      document.getElementById('restore-actions').style.display = 'none';
    }
  };
  reader.readAsText(file);
});

window.addEventListener('hashchange', route);

/* ---------- Boot ---------- */
loadState();
route();
