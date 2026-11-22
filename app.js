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
  try { receipts = JSON.parse(localStorage.getItem(STORAGE_RECEIPTS) || '[]'); } catch (e) { receipts = []; }
}

function saveState() {
  localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(customers));
  localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_SHOTS, JSON.stringify(shots));
  localStorage.setItem(STORAGE_RECEIPTS, JSON.stringify(receipts));
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

/* Indian currency with exactly two decimals, e.g. Rs 1,500.00 */
function formatMoney2(n) {
  const m = n < 0 ? -n : n;
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(m || 0);
}

/* ---------- Receipts (sequential, stored in localStorage) ---------- */
const STORAGE_RECEIPTS = 'hisaab_receipts';
const STORAGE_RECEIPT_COUNTER = 'hisaab_receipt_counter';
let receipts = []; // { receiptNo, customerPhone, customerName, amount, paymentMode, note, date, previousBalance, remainingBalance, transactionId, timestamp }

function loadReceipts() {
  try { receipts = JSON.parse(localStorage.getItem(STORAGE_RECEIPTS) || '[]'); } catch (e) { receipts = []; }
}
function saveReceipts() {
  localStorage.setItem(STORAGE_RECEIPTS, JSON.stringify(receipts));
}
function nextReceiptNo() {
  let counter = 0;
  try { counter = parseInt(localStorage.getItem(STORAGE_RECEIPT_COUNTER), 10) || 0; } catch (e) { counter = 0; }
  counter += 1;
  localStorage.setItem(STORAGE_RECEIPT_COUNTER, String(counter));
  return 'RCPT-' + String(counter).padStart(4, '0');
}

/* Running balance up to (but not including) a given transaction id, chronological order. */
function balanceBefore(phone, untilTransactionId) {
  let total = 0;
  const txs = transactions
    .filter(t => t.customerPhone === phone)
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.id.localeCompare(b.id));
  for (const t of txs) {
    if (t.id === untilTransactionId) break;
    total += t.type === 'credit' ? t.amount : -t.amount;
  }
  return total;
}

function balanceThrough(phone, throughTransactionId) {
  return balanceBefore(phone, throughTransactionId) + paymentDelta(throughTransactionId);
}

function paymentDelta(transactionId) {
  const t = transactions.find(x => x.id === transactionId);
  if (!t) return 0;
  return t.type === 'credit' ? t.amount : -t.amount;
}

/* ---------- Phone validation & normalization ---------- */
/* Accept 10-digit, or with +91 / 91 prefix. Normalize to 10-digit national number. */
function normalizePhone(phone) {
  let p = String(phone == null ? '' : phone).trim().replace(/\D/g, '');
  if (p.length === 12 && p.startsWith('91')) p = p.slice(2);
  if (p.length === 11 && p.startsWith('0')) p = p.slice(1);
  return p;
}

function validatePhone(phone) {
  const p = normalizePhone(phone);
  return { valid: /^\d{10}$/.test(p), normalized: p };
}

function phoneAlreadyExists(phone, excludePhone) {
  const p = normalizePhone(phone);
  return customers.some(c => normalizePhone(c.phone) === p && normalizePhone(c.phone) !== normalizePhone(excludePhone));
}

/* Case-insensitive duplicate customer name check (does not block, only informs). */
function customerNameExists(name) {
  const n = String(name == null ? '' : name).trim().toLowerCase();
  return n.length > 0 && customers.some(c => String(c.name).trim().toLowerCase() === n);
}

/* Format a stored 10-digit phone for display (e.g. 98765 43210). */
function formatPhoneDisplay(phone) {
  const p = normalizePhone(phone);
  if (p.length === 10) return p.slice(0, 5) + ' ' + p.slice(5);
  return p;
}

/* ---------- WhatsApp payment reminder ---------- */

/* Personalised Hindi reminder. Placeholders are filled from real customer
   data at render time; nothing here is hardcoded per customer. */
const WHATSAPP_LANDING_URL = 'https://sugarresetblueprint.online/landing-page-541315';

function buildReminderMessage(customerName, outstandingBalance) {
  const name = String(customerName == null ? '' : customerName);
  const amount = formatMoney2(outstandingBalance);
  return `नमस्ते ${name} जी! 🙏\n` +
    `\n` +
    `आपके खाते में ₹${amount} का भुगतान अभी बकाया है। आपसे विनम्र अनुरोध है कि कृपया अपना शेष भुगतान पूरा कर दें।\n` +
    `\n` +
    `🎉 CONGRATULATIONS! 🎉\n` +
    `\n` +
    `आपके लिए एक विशेष उपहार! 🎁\n` +
    `\n` +
    `आज ही अपना बकाया भुगतान पूरा करें और Diabetes Reversal के लिए एक EXCLUSIVE 1:1 PERSONAL CONSULTATION CALL का विशेष अवसर प्राप्त करें। 🏆\n` +
    `\n` +
    `इस पर्सनल कंसल्टेशन में आपको अपनी Lifestyle, Indian Diet और Daily Routine को बेहतर बनाने के लिए मार्गदर्शन मिलेगा।\n` +
    `\n` +
    `📲 अपनी Personal Consultation Call बुक करने के लिए नीचे दिए गए लिंक पर क्लिक करें:\n` +
    `\n` +
    `👉 ${WHATSAPP_LANDING_URL}\n` +
    `\n` +
    `🌿 याद रखिए, बेहतर स्वास्थ्य की दिशा में उठाया गया हर छोटा कदम महत्वपूर्ण है।\n` +
    `\n` +
    `सादर धन्यवाद!\n` +
    `Team Dr. Malik Usman`;
}

/* Normalise a stored phone to the 10-digit national number. */
function normalizePhone(phone) {
  let p = String(phone == null ? '' : phone).trim().replace(/\D/g, '');
  if (p.length === 12 && p.startsWith('91')) p = p.slice(2);
  return p;
}

/* Build the wa.me URL with country code 91. Works on mobile and desktop. */
function buildWhatsAppUrl(phone, message) {
  const national = normalizePhone(phone);
  return `https://wa.me/91${national}?text=${encodeURIComponent(message)}`;
}

/* Reminders are only for customers with a positive outstanding balance. */
function canSendReminder(balance) {
  return Number.isFinite(balance) && balance > 0;
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

    /* Reminder is generated dynamically from real customer data.
       Only customers who actually owe money get a WhatsApp link. */
    const waUrl = buildWhatsAppUrl(c.phone, buildReminderMessage(c.name, bal));
    const waAction = canSendReminder(bal)
      ? `<a href="${waUrl}"
             data-remind="${escapeHtml(c.phone)}" class="btn btn-wa" target="_blank" rel="noopener">WhatsApp</a>`
      : `<button type="button" class="btn btn-wa" disabled title="No outstanding balance" aria-disabled="true">WhatsApp</button>`;

    row.innerHTML = `
      <div class="cust-info">
        <div class="cust-name">${escapeHtml(c.name)}</div>
        <div class="cust-phone">${escapeHtml(c.phone)}</div>
      </div>
      <div class="cust-balance ${bal < 0 ? 'neg' : ''}" data-balance>${bal < 0 ? '-' : ''}Rs ${formatMoney(bal)}</div>
      <div class="cust-actions">
        <a href="#view-ledger?phone=${encodeURIComponent(c.phone)}" class="btn">View Ledger</a>
        ${waAction}
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

/* ---------- Smart existing-customer search (Module 1.A) ---------- */
const custNameInput = document.getElementById('cust-name');
const custPhoneInput = document.getElementById('cust-phone');
const custSuggestions = document.getElementById('cust-suggestions');
let suggestionsVisible = false;

function renderCustomerSuggestions(query) {
  custSuggestions.innerHTML = '';
  const q = String(query == null ? '' : query).trim().toLowerCase();
  if (!q) { custSuggestions.style.display = 'none'; suggestionsVisible = false; return; }

  const matches = customers.filter(c =>
    String(c.name).toLowerCase().includes(q) || normalizePhone(c.phone).includes(q.replace(/\D/g, ''))
  ).slice(0, 8);

  if (matches.length === 0) { custSuggestions.style.display = 'none'; suggestionsVisible = false; return; }

  for (const c of matches) {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `<div class="sugg-name">${escapeHtml(c.name)}</div><div class="sugg-phone">${formatPhoneDisplay(c.phone)}</div>`;
    item.addEventListener('click', function () {
      custNameInput.value = c.name;
      custPhoneInput.value = c.phone;
      custSuggestions.style.display = 'none';
      suggestionsVisible = false;
      // Show option to open existing ledger
      const existingBal = balanceFor(c.phone);
      const msg = `'${escapeHtml(c.name)}' already exists (mobile ${formatPhoneDisplay(c.phone)}). Balance: ${existingBal < 0 ? '-' : ''}Rs ${formatMoney(existingBal)}.\n\nPress OK to open their existing ledger, or Cancel to keep editing.`;
      if (confirm(msg)) {
        location.hash = '#view-ledger?phone=' + encodeURIComponent(c.phone);
      }
    });
    custSuggestions.appendChild(item);
  }
  custSuggestions.style.display = 'block';
  suggestionsVisible = true;
}

custNameInput.addEventListener('input', function () {
  renderCustomerSuggestions(this.value);
});
custNameInput.addEventListener('focus', function () {
  if (this.value.trim()) renderCustomerSuggestions(this.value);
});
custPhoneInput.addEventListener('focus', function () {
  custSuggestions.style.display = 'none';
  suggestionsVisible = false;
});
document.addEventListener('click', function (e) {
  if (!custNameInput.contains(e.target) && !custSuggestions.contains(e.target)) {
    custSuggestions.style.display = 'none';
    suggestionsVisible = false;
  }
});

/* ---------- Import from Contacts (Module 1.B) ---------- */
const importContactsBtn = document.getElementById('import-contacts-btn');
const contactNotice = document.getElementById('contact-picker-notice');

const contactPickerSupported = typeof navigator !== 'undefined' && navigator.contacts && typeof navigator.contacts.select === 'function';

if (!contactPickerSupported) {
  importContactsBtn.style.display = 'none';
  contactNotice.style.display = 'block';
}

importContactsBtn.addEventListener('click', async function () {
  if (!contactPickerSupported) return;
  contactNotice.style.display = 'none';
  try {
    const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
    if (!contacts || contacts.length === 0) {
      contactNotice.textContent = 'No contact selected.';
      contactNotice.className = 'msg error';
      contactNotice.style.display = 'block';
      return;
    }
    const contact = contacts[0];
    const name = contact.name && contact.name.displayName ? contact.name.displayName : (contact.name && contact.name.firstName ? contact.name.firstName : '');
    const phones = Array.isArray(contact.phones) ? contact.phones : [];
    const validPhones = phones
      .map(p => p && p.value ? p.value : null)
      .filter(Boolean)
      .map(p => ({ raw: p, normalized: normalizePhone(p) }))
      .filter(p => /^\d{10}$/.test(p.normalized));

    if (validPhones.length === 0) {
      contactNotice.textContent = 'Selected contact has no valid 10-digit mobile number.';
      contactNotice.className = 'msg error';
      contactNotice.style.display = 'block';
      return;
    }

    custNameInput.value = name || '';

    if (validPhones.length === 1) {
      custPhoneInput.value = validPhones[0].raw;
    } else {
      // Multiple numbers: let user pick
      let chosen = null;
      const options = validPhones.map((p, i) => `${i + 1}) ${p.raw} (${p.normalized})`).join('\n');
      const pick = prompt('Multiple phone numbers found for this contact.\nReply with the number to use:\n' + options, '1');
      const idx = parseInt(pick, 10) - 1;
      if (Number.isInteger(idx) && idx >= 0 && idx < validPhones.length) {
        chosen = validPhones[idx];
      }
      if (!chosen) {
        contactNotice.textContent = 'No phone number chosen.';
        contactNotice.className = 'msg error';
        contactNotice.style.display = 'block';
        return;
      }
      custPhoneInput.value = chosen.raw;
    }
    custSuggestions.style.display = 'none';
    suggestionsVisible = false;
  } catch (err) {
    contactNotice.textContent = 'Could not access contacts: ' + (err && err.message ? err.message : err);
    contactNotice.className = 'msg error';
    contactNotice.style.display = 'block';
  }
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

  /* WhatsApp reminder link: user taps it, nothing is sent automatically.
     Reminders are only enabled when the customer actually owes money. */
  const waBtn = document.getElementById('whatsapp-btn');
  const whatsappMsg = buildReminderMessage(c.name, bal);
  waBtn.href = buildWhatsAppUrl(phone, whatsappMsg);
  waBtn.dataset.remind = phone;
  waBtn.dataset.hasDue = canSendReminder(bal) ? 'true' : 'false';
  waBtn.classList.toggle('is-disabled', !canSendReminder(bal));
  waBtn.setAttribute('aria-disabled', canSendReminder(bal) ? 'false' : 'true');
  waBtn.title = canSendReminder(bal)
    ? 'Open WhatsApp reminder (nothing is sent automatically)'
    : 'No outstanding balance — reminder not needed';

  document.getElementById('ledger-balance').innerHTML =
    `Balance: <strong>${bal < 0 ? '-' : ''}Rs ${formatMoney(bal)}</strong>`;

  const reminderNote = document.getElementById('ledger-reminder-note');
  if (canSendReminder(bal)) {
    reminderNote.textContent = 'Payment reminder ready — tap “WhatsApp Reminder” to open the pre-filled message (nothing is sent automatically).';
  } else if (bal === 0) {
    reminderNote.textContent = 'No outstanding balance — payment reminder is disabled.';
  } else {
    reminderNote.textContent = 'Customer has an advance balance — payment reminder is disabled.';
  }

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

  /* Wire invoice button */
  const invoiceBtn = document.getElementById('invoice-btn');
  invoiceBtn.onclick = () => generateInvoice(phone);
}

/* ---------- Invoice Generation ---------- */
function generateInvoice(phone) {
  const c = customers.find(x => x.phone === phone);
  if (!c) return;

  const txs = transactions
    .filter(t => t.customerPhone === phone)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const credits = txs.filter(t => t.type === 'credit');
  const payments = txs.filter(t => t.type === 'payment');

  const totalCredit = credits.reduce((sum, t) => sum + t.amount, 0);
  const totalPayment = payments.reduce((sum, t) => sum + t.amount, 0);
  const outstanding = totalCredit - totalPayment;

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const invoiceNo = 'INV-' + phone.slice(-6) + '-' + Date.now().toString(36).toUpperCase();

  const win = window.open('', '_blank', 'width=800,height=600');
  if (!win) { alert('Popup blocked. Please allow popups for this site to generate invoice.'); return; }

  const rows = credits.map(t => `
    <tr>
      <td>${escapeHtml(t.date)}</td>
      <td>${escapeHtml(t.note || 'Goods')}</td>
      <td style="text-align:right;">Rs ${formatMoney(t.amount)}</td>
    </tr>
  `).join('');

  const paymentRows = payments.map(t => `
    <tr>
      <td>${escapeHtml(t.date)}</td>
      <td>${escapeHtml(t.note || 'Payment')}</td>
      <td style="text-align:right; color:var(--success);">Rs ${formatMoney(t.amount)}</td>
    </tr>
  `).join('');

  win.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoiceNo}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; color: #1f2933; }
  .invoice-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0f766e; padding-bottom: 10px; }
  .shop-name { font-size: 24px; font-weight: bold; color: #0f766e; margin: 0; }
  .invoice-title { font-size: 18px; margin: 5px 0 0; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; font-size: 14px; }
  .info-label { font-weight: bold; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
  th { background: #0f766e; color: white; }
  .section-title { font-weight: bold; margin: 20px 0 8px; color: #0f766e; }
  .totals { text-align: right; margin-top: 20px; }
  .total-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 15px; }
  .total-row.final { font-weight: bold; font-size: 18px; color: #0f766e; border-top: 2px solid #0f766e; padding-top: 10px; }
  .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
  @media print { .no-print { display: none; } body { margin: 0; } }
</style>
</head>
<body>
  <div class="invoice-header">
    <h1 class="shop-name">Hisaab Digital Shop Ledger</h1>
    <p class="invoice-title">TAX INVOICE</p>
  </div>

  <div class="info-grid">
    <div><span class="info-label">Invoice No:</span> ${invoiceNo}</div>
    <div><span class="info-label">Date:</span> ${today}</div>
    <div><span class="info-label">Customer:</span> ${escapeHtml(c.name)}</div>
    <div><span class="info-label">Phone:</span> ${escapeHtml(c.phone)}</div>
  </div>

  <div class="section-title">Items Purchased (Credit)</div>
  <table>
    <thead><tr><th>Date</th><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>
      ${rows || '<tr><td colspan="3" style="text-align:center;color:#6b7280;">No credit entries</td></tr>'}
    </tbody>
  </table>

  ${payments.length > 0 ? `
  <div class="section-title">Payments Received</div>
  <table>
    <thead><tr><th>Date</th><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>${paymentRows}</tbody>
  </table>` : ''}

  <div class="totals">
    <div class="total-row"><span>Total Purchases:</span><span>Rs ${formatMoney(totalCredit)}</span></div>
    <div class="total-row"><span>Total Payments:</span><span>Rs ${formatMoney(totalPayment)}</span></div>
    <div class="total-row final"><span>Outstanding Balance:</span><span>Rs ${formatMoney(outstanding)}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Generated by Hisaab Digital Shop Ledger</p>
    <button class="no-print" onclick="window.print()" style="margin-top:10px;padding:10px 20px;background:#0f766e;color:white;border:none;border-radius:6px;cursor:pointer;">Print / Save as PDF</button>
  </div>
</body>
</html>
  `);
  win.document.close();
}

/* ---------- Receipt Module (Module 2) ---------- */
let lastReceiptNo = null;

function openViewReceipt(receiptNo) {
  const r = receipts.find(x => x.receiptNo === receiptNo);
  if (!r) { alert('Receipt not found.'); return; }
  lastReceiptNo = receiptNo;

  const c = customers.find(x => x.phone === r.customerPhone);
  const dateTime = new Date(r.date).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  document.getElementById('receipt-title').textContent = 'Payment Receipt';
  document.getElementById('receipt-sub').textContent = `${escapeHtml(c ? c.name : r.customerName)} \u2022 ${formatPhoneDisplay(r.customerPhone)}`;

  const html = `
  <div class="receipt">
    <div class="receipt-header">
      <h1 class="brand">HISAAB</h1>
      <p class="doc-title">Payment Receipt</p>
    </div>
    <div class="receipt-meta">
      <div class="row"><span class="label">Receipt No:</span><span>${escapeHtml(r.receiptNo)}</span></div>
      <div class="row"><span class="label">Date & Time:</span><span>${escapeHtml(dateTime)}</span></div>
      <div class="row"><span class="label">Customer:</span><span>${escapeHtml(c ? c.name : r.customerName)}</span></div>
      <div class="row"><span class="label">Mobile:</span><span>${formatPhoneDisplay(r.customerPhone)}</span></div>
      <div class="row"><span class="label">Payment Mode:</span><span>${escapeHtml(r.paymentMode)}</span></div>
      <div class="row"><span class="label">Source Transaction:</span><span>${escapeHtml(r.transactionId)}</span></div>
    </div>
    <table class="receipt-table">
      <thead>
        <tr><th>Description</th><th style="text-align:right;">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(r.note || 'Payment received')}</td>
          <td class="amount">Rs ${formatMoney2(r.amount)}</td>
        </tr>
      </tbody>
    </table>
    <div class="receipt-totals">
      <div class="receipt-total-row"><span>Previous Balance:</span><span class="amount">${r.previousBalance < 0 ? '-' : ''}Rs ${formatMoney2(r.previousBalance)}</span></div>
      <div class="receipt-total-row"><span>Amount Paid:</span><span class="amount">Rs ${formatMoney2(r.amount)}</span></div>
      <div class="receipt-total-row final"><span>Remaining Balance:</span><span class="amount">${r.remainingBalance < 0 ? '-' : ''}Rs ${formatMoney2(r.remainingBalance)}</span></div>
    </div>
    <div class="receipt-footer">
      <p>Thank you for your payment!</p>
      <p>Generated by Hisaab Digital Ledger \u2022 ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
  </div>
  `;
  document.getElementById('receipt-content').innerHTML = html;
  showView('view-receipt');
}

function generateReceiptFromTransaction(transactionId) {
  const t = transactions.find(x => x.id === transactionId);
  if (!t) { alert('Transaction not found.'); return; }
  if (t.type !== 'payment') { alert('Receipts are only generated for payment transactions.'); return; }
  const c = customers.find(x => x.phone === t.customerPhone);
  if (!c) { alert('Customer not found.'); return; }

  const previousBalance = balanceBefore(t.customerPhone, t.id);
  const remainingBalance = balanceThrough(t.customerPhone, t.id);

  const receipt = {
    receiptNo: nextReceiptNo(),
    customerPhone: t.customerPhone,
    customerName: c.name,
    amount: t.amount,
    paymentMode: t.paymentMode || 'Cash',
    note: t.note || 'Payment received',
    date: t.date,
    previousBalance,
    remainingBalance,
    transactionId: t.id,
    timestamp: new Date().toISOString()
  };
  receipts.push(receipt);
  saveReceipts();
  lastReceiptNo = receipt.receiptNo;
  openViewReceipt(receipt.receiptNo);
}

/* ---------- Statement Module (Module 3) ---------- */
let statementPhone = null;
let statementFilter = 'all';
let statementCustomFrom = null;
let statementCustomTo = null;

function filterStartDate(filter) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  switch (filter) {
    case '30d': { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    case '3m': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }
    case '6m': { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; }
    default: return null;
  }
}

function openStatement(phone, filter) {
  statementPhone = phone;
  statementFilter = filter;
  statementCustomFrom = null;
  statementCustomTo = null;

  const c = customers.find(x => x.phone === phone);
  if (!c) return;
  document.getElementById('statement-title').textContent = 'Account Statement';
  document.getElementById('statement-sub').textContent = `${escapeHtml(c.name)} \u2022 ${formatPhoneDisplay(c.phone)}`;

  document.querySelectorAll('.stmt-filter').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === filter);
    b.onclick = () => {
      statementFilter = b.dataset.filter;
      document.querySelectorAll('.stmt-filter').forEach(x => x.classList.toggle('active', x === b));
      const customBox = document.getElementById('custom-date-range');
      customBox.style.display = statementFilter === 'custom' ? 'flex' : 'none';
      renderStatement();
    };
  });
  document.getElementById('custom-date-range').style.display = filter === 'custom' ? 'flex' : 'none';
  document.getElementById('stmt-apply-custom').onclick = () => {
    statementCustomFrom = document.getElementById('stmt-date-from').value || null;
    statementCustomTo = document.getElementById('stmt-date-to').value || null;
    renderStatement();
  };

  renderStatement();
  showView('view-statement');
}

function renderStatement() {
  const c = customers.find(x => x.phone === statementPhone);
  if (!c) return;

  const start = filterStartDate(statementFilter);
  const customFrom = statementCustomFrom ? new Date(statementCustomFrom + 'T00:00:00') : null;
  const customTo = statementCustomTo ? new Date(statementCustomTo + 'T23:59:59') : null;

  const allTxs = transactions
    .filter(t => t.customerPhone === statementPhone)
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.id.localeCompare(b.id));

  let openingBalance = 0;
  const windowStart = statementFilter === 'custom' ? customFrom : start;
  for (const t of allTxs) {
    const td = new Date(t.date + 'T00:00:00');
    if (windowStart && td < windowStart) {
      openingBalance += t.type === 'credit' ? t.amount : -t.amount;
    } else if (windowStart) {
      break;
    }
  }

  let filtered = allTxs;
  if (windowStart) {
    filtered = allTxs.filter(t => {
      const td = new Date(t.date + 'T00:00:00');
      if (td < windowStart) return false;
      if (customTo && td > customTo) return false;
      return true;
    });
  }

  let running = openingBalance;
  const rows = [];
  let totalCredit = 0, totalPayment = 0;
  for (const t of filtered) {
    const delta = t.type === 'credit' ? t.amount : -t.amount;
    running += delta;
    if (t.type === 'credit') totalCredit += t.amount;
    else totalPayment += t.amount;
    rows.push({
      date: t.date,
      desc: t.note || (t.type === 'credit' ? 'Goods on credit' : 'Payment received'),
      credit: t.type === 'credit' ? t.amount : '',
      payment: t.type === 'payment' ? t.amount : '',
      balance: running,
      type: t.type
    });
  }
  const closingBalance = running;

  document.getElementById('statement-summary').innerHTML = `
    <div class="sum-box"><div class="sum-label">Opening Balance</div><div class="sum-value">${openingBalance < 0 ? '-' : ''}Rs ${formatMoney2(openingBalance)}</div></div>
    <div class="sum-box"><div class="sum-label">Total Credit</div><div class="sum-value credit">Rs ${formatMoney2(totalCredit)}</div></div>
    <div class="sum-box"><div class="sum-label">Total Payments</div><div class="sum-value payment">Rs ${formatMoney2(totalPayment)}</div></div>
    <div class="sum-box"><div class="sum-label">Closing Balance</div><div class="sum-value balance">${closingBalance < 0 ? '-' : ''}Rs ${formatMoney2(closingBalance)}</div></div>
  `;

  let tableHtml = `
    <table class="statement-table">
      <thead><tr><th class="date-col">Date</th><th>Description</th><th class="amount">Credit</th><th class="amount">Payment</th><th class="amount running-balance">Balance</th></tr></thead>
      <tbody>
  `;
  if (rows.length === 0) {
    tableHtml += '<tr><td colspan="5" style="text-align:center;color:var(--muted);">No transactions in this period.</td></tr>';
  } else {
    for (const r of rows) {
      tableHtml += `
        <tr>
          <td class="date-col">${escapeHtml(r.date)}</td>
          <td>${escapeHtml(r.desc)}</td>
          <td class="amount">${r.credit !== '' ? 'Rs ' + formatMoney2(r.credit) : '\u2014'}</td>
          <td class="amount">${r.payment !== '' ? 'Rs ' + formatMoney2(r.payment) : '\u2014'}</td>
          <td class="amount running-balance">${r.balance < 0 ? '-' : ''}Rs ${formatMoney2(r.balance)}</td>
        </tr>
      `;
    }
  }
  tableHtml += `
      <tr style="font-weight:800;border-top:2px solid var(--border);">
        <td colspan="2">Closing Balance</td>
        <td class="amount">Rs ${formatMoney2(totalCredit)}</td>
        <td class="amount">Rs ${formatMoney2(totalPayment)}</td>
        <td class="amount">${closingBalance < 0 ? '-' : ''}Rs ${formatMoney2(closingBalance)}</td>
      </tr>
      </tbody>
    </table>
  `;
  document.getElementById('statement-content').innerHTML = tableHtml;
}

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
    note,
    paymentMode: type === 'payment' ? document.getElementById('entry-payment-mode').value : ''
  };

  const fileInput = document.getElementById('shot-input');
  const file = fileInput.files[0];
  const preview = document.getElementById('shot-preview');
  const receiptActions = document.getElementById('receipt-actions');

  const finish = () => {
    transactions.push(entry);
    saveState();
    renderLedger(currentPhone);
    fileInput.value = '';
    preview.innerHTML = '';
    /* Module 4: after saving a payment, generate a unique receipt and offer it. */
    if (type === 'payment') {
      receiptActions.style.display = 'flex';
      generateReceiptFromTransaction(entry.id);
    }
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

/* Ledger WhatsApp button: never navigate when there is no positive balance.
   The link is still present (so it works on desktop and mobile), but a click
   with nothing due is blocked. Nothing is ever sent automatically. */
document.getElementById('whatsapp-btn').addEventListener('click', function (e) {
  if (this.dataset.hasDue !== 'true') {
    e.preventDefault();
    alert('No outstanding balance — payment reminder is not needed for this customer.');
  }
});

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

/* ---------- New feature wiring (Modules 1-4) ---------- */

/* Statement button on ledger */
document.getElementById('statement-btn').addEventListener('click', function () {
  if (!currentPhone) return;
  openStatement(currentPhone, 'all');
});

/* Receipt actions: view / download the last generated receipt */
document.getElementById('view-receipt-btn').addEventListener('click', function () {
  if (lastReceiptNo) openViewReceipt(lastReceiptNo);
});
document.getElementById('download-receipt-btn').addEventListener('click', function () {
  if (lastReceiptNo) openViewReceipt(lastReceiptNo);
});

/* Receipt page actions */
document.getElementById('print-receipt-btn').addEventListener('click', function () { window.print(); });
document.getElementById('download-receipt-page-btn').addEventListener('click', function() {
  /* Client-side PDF: print dialog offers "Save as PDF". */
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) { window.print(); return; }
  win.document.write('<html><head><meta charset="UTF-8"><title>Receipt</title><link rel="stylesheet" href="style.css"><style>body{margin:0;} .no-print{display:none !important;}</style></head><body>' + document.getElementById('receipt-content').innerHTML + '<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}};</script></body></html>');
  win.document.close();
});
document.getElementById('share-receipt-wa-btn').addEventListener('click', function () {
  if (!lastReceiptNo) return;
  const r = receipts.find(x => x.receiptNo === lastReceiptNo);
  if (!r) return;
  const c = customers.find(x => x.phone === r.customerPhone);
  const dateTime = new Date(r.date).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const msg = `HISAAB Payment Receipt\n\nReceipt No: ${r.receiptNo}\nDate & Time: ${dateTime}\nCustomer: ${escapeHtml(c ? c.name : r.customerName)}\nMobile: ${formatPhoneDisplay(r.customerPhone)}\nPayment Mode: ${r.paymentMode}\nAmount Received: Rs ${formatMoney2(r.amount)}\nPrevious Balance: ${r.previousBalance < 0 ? '-' : ''}Rs ${formatMoney2(r.previousBalance)}\nRemaining Balance: ${r.remainingBalance < 0 ? '-' : ''}Rs ${formatMoney2(r.remainingBalance)}\n\nGenerated by Hisaab Digital Ledger`;
  location.href = buildWhatsAppUrl(r.customerPhone, msg);
});
document.getElementById('receipt-back').addEventListener('click', function (e) {
  e.preventDefault();
  if (currentPhone) location.hash = '#view-ledger?phone=' + encodeURIComponent(currentPhone);
  else showView('view-home');
});

/* Statement page actions */
document.getElementById('print-statement-btn').addEventListener('click', function () { window.print(); });
document.getElementById('download-statement-btn').addEventListener('click', function() {
  const win = window.open('', '_blank', 'width=900,height=900');
  if (!win) { window.print(); return; }
  win.document.write('<html><head><meta charset="UTF-8"><title>Statement</title><link rel="stylesheet" href="style.css"><style>body{margin:0;} .no-print{display:none !important;}</style></head><body>' + document.getElementById('statement-content').innerHTML + '<div style="margin-top:20px;font-size:12px;color:var(--muted);">Generated by Hisaab Digital Ledger ' + new Date().toLocaleDateString('en-IN') + '</div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}};</script></body></html>');
  win.document.close();
});
document.getElementById('share-statement-wa-btn').addEventListener('click', function () {
  if (!statementPhone) return;
  const c = customers.find(x => x.phone === statementPhone);
  const msg = `HISAAB Account Statement\n\nCustomer: ${escapeHtml(c ? c.name : '')}\nMobile: ${formatPhoneDisplay(statementPhone)}\nStatement generated: ${new Date().toLocaleString('en-IN')}\n\nGenerated by Hisaab Digital Ledger`;
  location.href = buildWhatsAppUrl(statementPhone, msg);
});
document.getElementById('export-statement-csv-btn').addEventListener('click', function () {
  if (!statementPhone) return;
  const c = customers.find(x => x.phone === statementPhone);
  const allTxs = transactions
    .filter(t => t.customerPhone === statementPhone)
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.id.localeCompare(b.id));
  let csv = 'Date,Description,Credit,Payment,Balance\n';
  let running = 0;
  // compute opening from same filter
  const start = filterStartDate(statementFilter);
  const customFrom = statementCustomFrom ? new Date(statementCustomFrom + 'T00:00:00') : null;
  const customTo = statementCustomTo ? new Date(statementCustomTo + 'T23:59:59') : null;
  const windowStart = statementFilter === 'custom' ? customFrom : start;
  for (const t of allTxs) { const td = new Date(t.date+'T00:00:00'); if (windowStart && td < windowStart) running += t.type==='credit'?t.amount:-t.amount; else if (windowStart) break; }
  let filtered = allTxs; if (windowStart) filtered = allTxs.filter(t=>{ const td=new Date(t.date+'T00:00:00'); if(td<windowStart)return false; if(customTo&&td>customTo)return false; return true; });
  for (const t of filtered) {
    const delta = t.type==='credit'?t.amount:-t.amount; running += delta;
    csv += `${t.date},"${(t.note||'').replace(/"/g,'""')}",${t.type==='credit'?t.amount:''},${t.type==='payment'?t.amount:''},${running}\n`;
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hisab_statement_${statementPhone}_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
});
document.getElementById('statement-back').addEventListener('click', function (e) {
  e.preventDefault();
  if (currentPhone) location.hash = '#view-ledger?phone=' + encodeURIComponent(currentPhone);
  else showView('view-home');
});

/* ---------- Boot ---------- */
loadState();
route();
