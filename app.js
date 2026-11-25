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
const STORAGE_LANG = 'hisaab_lang';
const STORAGE_RECEIPTS = 'hisaab_receipts';
const STORAGE_RECEIPT_COUNTER = 'hisaab_receipt_counter';
const STORAGE_SELLER = 'hisaab_seller_details';

// Inventory storage keys
const STORAGE_PRODUCTS = 'hisaab_products';
const STORAGE_BATCHES = 'hisaab_batches';
const STORAGE_PURCHASES = 'hisaab_purchases';
const STORAGE_STOCK_MOVEMENTS = 'hisaab_stock_movements';
const STORAGE_SUPPLIERS = 'hisaab_suppliers';

/* ---------- Supported languages ---------- */
const SUPPORTED_LANGS = ['en', 'hi', 'ur'];
let currentLang = null; // set by loadLanguage() / chooseLanguage()

const LANG_LABELS = {
  en: 'English',
  hi: 'हिन्दी',
  ur: 'اردو',
};

const LANG_DIR = {
  en: 'ltr',
  hi: 'ltr',
  ur: 'rtl',
};

/* ---------- Translations ---------- */
const TRANSLATIONS = {
  en: {
    lang: {
      title: 'Choose language',
      sub: 'This choice applies to the whole app and is remembered.',
      english: 'English',
      hindi: 'हिन्दी',
      urdu: 'اردو',
    },
    common: {
      back: 'Back to customers',
      change_language: 'Change language',
      print: 'Print',
      download_pdf: 'Download PDF',
      whatsapp: 'WhatsApp',
      currency: 'Rs',
      sno: 'S.No.',
    },
    nav: {
      customers: 'Customers',
      add_customer: 'Add Customer',
      import_data: 'Import Data',
      backup_restore: 'Backup & Restore',
      change_language: 'Change Language',
      seller_details: 'Seller / Shop Details',
      stock_dashboard: 'Stock Dashboard',
      products: 'Products',
      add_product: 'Add Product',
      purchase: 'Purchase Stock',
      suppliers: 'Suppliers',
      stock_adjustment: 'Stock Adjustment',
      stock_movement: 'Stock Movement',
      low_stock: 'Low Stock Alerts',
      stock_reports: 'Stock Reports',
    },
    home: {
      all_customers: 'All Customers',
      total_outstanding: 'Total Outstanding: Rs 0',
      total_outstanding_label: 'Total Outstanding:',
      no_customers: 'No customers yet. Add one to get started.',
    },
    add_customer: {
      heading: 'Add Customer',
      full_name: 'Full name',
      name_placeholder: 'e.g. Ravi Kumar',
      mobile_number: 'Mobile number',
      phone_placeholder: 'e.g. 9876543210 or +919876543210',
      phone_sub: 'Accepts 10-digit mobile, or with +91 / 91 prefix. Stored as 10-digit number.',
      contact_import_btn: 'Import from Contacts',
      contact_not_supported: 'Contact import is not supported in this browser. Please enter the mobile number manually.',
      opening_balance: 'Opening Balance (Rs)',
      opening_placeholder: '0.00',
      opening_sub: 'Positive value = customer owes this amount (auto-creates a credit entry).',
      add_customer_btn: 'Add Customer',
      error_name: 'Enter the customer name.',
      error_phone: 'Mobile number must contain exactly 10 digits (no letters or symbols).',
      error_duplicate: 'A customer with this mobile number already exists.',
      exists_msg: "'{name}' already exists (mobile {phone}). Balance: {balance}.\n\nPress OK to open their existing ledger, or Cancel to keep editing.",
    },
    contact_picker: {
      title: 'Select Phone Number',
      contact_name: 'Contact: {name}',
      no_phones: 'No phone number found for this contact. Please enter manually.',
      confirm: 'Confirm Selection',
      cancel: 'Cancel',
      select: 'Select this number',
      selected: 'Selected',
    },
    seller_details: {
      title: 'Seller / Shop Details',
      owner_name: 'Seller / Shop Owner Name',
      owner_name_placeholder: 'e.g. Ravi Kumar',
      shop_name: 'Shop Name',
      shop_name_placeholder: 'e.g. Ravi General Store',
      mobile_number: 'Mobile Number',
      mobile_placeholder: 'e.g. 9876543210',
      upi_id: 'UPI ID (for QR generation)',
      upi_id_placeholder: 'e.g. 9876543210@upi',
      payment_qr: 'Payment QR Code (optional)',
      payment_qr_sub: 'Upload your UPI payment QR code image. This will be shown on invoices and statements for customers to scan and pay.',
      address: 'Shop Address',
      address_placeholder: 'e.g. 123 Main Road, Market Area',
      save_btn: 'Save Details',
      error_name: 'Please enter the seller / shop owner name.',
      not_set: 'Seller / Shop details not set. Please complete Seller / Shop Details in Settings.',
      saved: 'Seller / Shop details saved successfully.',
    },
    ledger: {
      customer_ledger: 'Customer Ledger',
      view_ledger: 'View Ledger',
      whatsapp_reminder: 'WhatsApp Reminder',
      generate_invoice: 'Generate Invoice',
      statement: 'Statement',
      add_new_entry: 'Add New Entry',
      type: 'Type',
      credit_option: 'Credit – goods given on credit',
      payment_option: 'Payment – money received',
      amount: 'Amount (Rs)',
      amount_placeholder: '0.00',
      date: 'Date',
      note: 'Note',
      note_placeholder: 'Short note',
      payment_mode: 'Payment Mode',
      save_entry: 'Save Entry',
      payment_screenshot: 'Payment Screenshot (optional)',
      balance: 'Balance:',
      no_outstanding: 'No outstanding balance — payment reminder is disabled.',
      advance_balance: 'Customer has an advance balance — payment reminder is disabled.',
      payment_ready: 'Payment reminder ready — tap “WhatsApp Reminder” to open the pre-filled message (nothing is sent automatically).',
      wa_title_open: 'Open WhatsApp reminder (nothing is sent automatically)',
      wa_title_closed: 'No outstanding balance — reminder not needed',
    },
    receipt: {
      title: 'Payment Receipt',
      view_receipt: 'View Receipt',
      download_receipt: 'Download PDF',
      receipt_no: 'Receipt No:',
      date_time: 'Date & Time:',
      customer: 'Customer:',
      mobile: 'Mobile:',
      payment_mode: 'Payment Mode:',
      source_transaction: 'Source Transaction:',
      description: 'Description',
      amount: 'Amount',
      previous_balance: 'Previous Balance:',
      amount_paid: 'Amount Paid:',
      remaining_balance: 'Remaining Balance:',
      thank_you: 'Thank you for your payment!',
      generated_by: 'Generated by Hisaab Digital Ledger',
    },
    statement: {
      title: 'Account Statement',
      period: 'Period:',
      all: 'All',
      last_30_days: 'Last 30 Days',
      last_3_months: 'Last 3 Months',
      last_6_months: 'Last 6 Months',
      custom: 'Custom',
      from: 'From',
      to: 'To',
      apply: 'Apply',
      export_csv: 'Export CSV',
      opening_balance: 'Opening Balance',
      total_credit: 'Total Credit',
      total_payments: 'Total Payments',
      closing_balance: 'Closing Balance',
      date: 'Date',
      description: 'Description',
      credit: 'Credit',
      payment: 'Payment',
      balance: 'Balance',
      no_transactions: 'No transactions in this period.',
      generated_on: 'Generated on:',
    },
    invoice: {
      title: 'INVOICE',
      subtitle: 'Payment Receipt',
      invoice_no: 'Invoice No:',
      date: 'Date:',
      seller: 'Seller:',
      shop_name: 'Shop Name:',
      address: 'Address:',
      customer: 'Customer:',
      mobile: 'Mobile:',
      items: 'Items Purchased',
      payments: 'Payments Received',
      date_col: 'Date',
      description_col: 'Description',
      qty_col: 'Qty',
      rate_col: 'Rate',
      amount_col: 'Amount',
      total_purchases: 'Total Purchases:',
      total_payments: 'Total Payments:',
      outstanding_balance: 'Outstanding Balance:',
      payment_mode: 'Payment Mode:',
      scan_gift: '🎁 SCAN & GET GIFT',
      scan_gift_sub: 'Scan this QR code to discover your special gift!',
      scan_pay: 'SCAN TO PAY',
      scan_pay_sub: 'Scan to pay your bill.',
      thank_you: 'Thank you for your business!',
      generated_by: 'Generated by Hisaab Digital Shop Ledger',
      no_credit_entries: 'No credit entries',
      no_payment_entries: 'No payment entries',
      subtotal: 'Subtotal:',
      discount: 'Discount:',
      grand_total: 'Grand Total:',
      amount_paid: 'Amount Paid:',
      remaining: 'Remaining:',
    },
    billing: {
      heading: 'Create Bill',
      add_item: '+ Add Item',
      product_name: 'Product Name',
      product_placeholder: 'e.g. Rice, Sugar, Oil',
      quantity: 'Qty',
      quantity_placeholder: '1',
      unit: 'Unit',
      unit_placeholder: 'pcs/kg/ltr',
      rate: 'Rate (₹)',
      rate_placeholder: '0.00',
      amount: 'Amount (₹)',
      remove: 'Remove',
      subtotal: 'Subtotal:',
      discount: 'Discount (₹)',
      discount_placeholder: '0.00',
      grand_total: 'Grand Total:',
      amount_paid: 'Amount Paid (₹)',
      amount_paid_placeholder: '0.00',
      remaining: 'Remaining:',
      save_bill: 'Save Bill',
      bill_note: 'Bill Note (optional)',
      bill_note_placeholder: 'e.g. Invoice #123, GST details',
      no_items: 'No items added yet.',
      enter_valid_qty: 'Enter a valid quantity.',
      enter_valid_rate: 'Enter a valid rate.',
      at_least_one_item: 'Add at least one item to the bill.',
      bill_saved: 'Bill saved successfully.',
      bill_failed: 'Failed to save bill:',
    },
    stock: {
      dashboard_title: 'Stock Dashboard',
      dashboard_sub: 'Overview of inventory status',
      total_products: 'Total Active Products',
      total_stock_units: 'Total Stock Units',
      total_purchase_value: 'Total Purchase Value',
      low_stock_count: 'Low Stock Products',
      out_of_stock_count: 'Out of Stock Products',
      expiring_count: 'Expiring Products (30 days)',
      recent_purchases: 'Recent Purchases',
      recent_sales: 'Recent Sales',
      recent_adjustments: 'Recent Adjustments',
      no_recent_purchases: 'No recent purchases',
      no_recent_sales: 'No recent sales',
      no_recent_adjustments: 'No recent adjustments',
      type_purchase: 'Purchase',
      type_sale: 'Sale',
      type_adj_inc: 'Adjustment (+)',
      type_adj_dec: 'Adjustment (-)',
      type_return: 'Return',
      type_opening: 'Opening Stock',
      report_valuation: 'Stock Valuation Report',
      purchase_value: 'Purchase Value',
      sell_value: 'Sell Value',
      total: 'Total',
      total_purchases: 'Total Purchases',
      all_products: 'All Products',
    },
    products: {
      title: 'Products',
      sub: 'Manage product catalog',
      add_product: 'Add Product',
      add_sub: 'Enter product details',
      search_placeholder: 'Search by name, SKU, barcode...',
      all_categories: 'All Categories',
      all_status: 'All Status',
      category: {
        grocery: 'Grocery',
        medical: 'Medical',
        general: 'General Store',
        other: 'Other',
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
      },
      select_category: 'Select Category',
      select_unit: 'Select Unit',
      unit: {
        piece: 'Piece',
        kg: 'Kg',
        gram: 'Gram',
        litre: 'Litre',
        ml: 'ML',
        packet: 'Packet',
        strip: 'Strip',
        box: 'Box',
        bottle: 'Bottle',
        dozen: 'Dozen',
        custom: 'Custom',
      },
      custom_unit: 'Custom Unit Name',
      product_name: 'Product Name',
      sku: 'SKU',
      barcode: 'Barcode',
      category: 'Category',
      brand: 'Brand',
      unit: 'Unit',
      purchase_price: 'Purchase Price (₹)',
      selling_price: 'Selling Price (₹)',
      current_stock: 'Current Stock',
      min_stock_alert: 'Min Stock Alert',
      medical_details: 'Medical Product Details',
      batch_number: 'Batch Number',
      expiry_date: 'Expiry Date',
      manufacturer: 'Manufacturer',
      supplier: 'Supplier',
      select_supplier: 'Select Supplier (optional)',
      status: 'Status',
      notes: 'Notes',
      save_btn: 'Save Product',
      edit_product: 'Edit Product',
      edit_sub: 'Modify product details',
      no_products: 'No products yet. Add your first product.',
    },
    purchase: {
      title: 'Purchase Stock',
      sub: 'Record stock purchases from suppliers',
      supplier: 'Supplier',
      select_supplier: 'Select Supplier',
      invoice_no: 'Invoice Number',
      date: 'Purchase Date',
      payment_mode: 'Payment Mode',
      payment_credit: 'Credit',
      items: 'Purchase Items',
      product: 'Product',
      batch: 'Batch No.',
      expiry: 'Expiry Date',
      purchase_rate: 'Rate (₹)',
      no_items: 'No items added yet.',
      add_item: '+ Add Item',
      subtotal: 'Subtotal:',
      discount: 'Discount (₹)',
      grand_total: 'Grand Total:',
      notes: 'Notes',
      save_btn: 'Save Purchase',
    },
    suppliers: {
      title: 'Suppliers',
      sub: 'Manage supplier directory',
      add_supplier: 'Add Supplier',
      add_sub: 'Enter supplier details',
      search_placeholder: 'Search suppliers...',
      name: 'Supplier Name',
      mobile: 'Mobile Number',
      address: 'Address',
      gstin: 'GSTIN (optional)',
      notes: 'Notes',
      save_btn: 'Save Supplier',
      no_suppliers: 'No suppliers yet. Add your first supplier.',
    },
    stock_adjustment: {
      title: 'Stock Adjustment',
      sub: 'Authorized stock corrections',
      product: 'Product',
      select_product: 'Select Product',
      type: 'Adjustment Type',
      select_type: 'Select Type',
      increase: 'Increase Stock',
      decrease: 'Decrease Stock',
      quantity: 'Quantity',
      batch: 'Batch Number',
      all_batches: 'All Batches',
      reason: 'Reason',
      select_reason: 'Select Reason',
      damage: 'Damage/Loss',
      expiry: 'Expiry',
      correction: 'Stock Count Correction',
      return: 'Supplier Return',
      other: 'Other',
      notes: 'Notes',
      save_btn: 'Save Adjustment',
    },
    stock_movement: {
      title: 'Stock Movement History',
      sub: 'Complete audit trail of stock changes',
      all_products: 'All Products',
      all_types: 'All Types',
      purchase: 'Purchase',
      sale: 'Sale',
      adjustment_increase: 'Adjustment (+)',
      adjustment_decrease: 'Adjustment (-)',
      return: 'Return',
      opening: 'Opening Stock',
      from: 'From',
      to: 'To',
      apply: 'Apply',
      no_movements: 'No stock movements recorded.',
    },
    low_stock: {
      title: 'Low Stock Alerts',
      sub: 'Products below minimum stock level',
      no_alerts: 'No low stock alerts. All products are well stocked.',
      all: 'Low Stock & Out of Stock',
      low_only: 'Low Stock Only',
      out_only: 'Out of Stock Only',
    },
    stock_reports: {
      title: 'Stock Reports',
      sub: 'Generate inventory reports',
      report_type: 'Report:',
      current_stock: 'Current Stock Report',
      product_wise: 'Product-wise Stock',
      purchase_report: 'Purchase Report',
      sales_report: 'Sales Report',
      low_stock_report: 'Low Stock Report',
      expiry_report: 'Expiry Report',
      movement_report: 'Stock Movement Report',
      valuation_report: 'Stock Valuation Report',
      generate: 'Generate',
    },
    backup: {
      backup_restore: 'Backup & Restore',
      download_backup: 'Download Full Backup',
      download_backup_btn: 'Download Backup JSON',
      backup_sub: 'Export all customers, transactions, and payment screenshots as a JSON file. Includes backup date and app version.',
      restore_backup: 'Restore from Backup',
      restore_sub: 'Select a backup JSON file to preview and restore. Existing data is never overwritten without your explicit confirmation.',
      merge: 'Merge (skip duplicate phones)',
      replace: 'Replace all existing data',
      warning_replace: 'WARNING: This will REPLACE all existing customers, transactions, and screenshots. This cannot be undone.',
    },
    import: {
      import_data: 'Import Data',
      sub: 'Paste JSON in the sample-data.json format: an array of customers, or an object with a "customers" array. Each customer needs "name", "phone" and an optional "entries" array. Customers without entries are allowed.',
      placeholder: '{\n  "customers": [\n    {\n      "name": "Ravi Kumar",\n      "phone": "9000000101",\n      "entries": [\n        { "type": "credit", "amount": 250, "date": "2026-10-23", "note": "Credit goods" },\n        { "type": "payment", "amount": 1500, "date": "2026-10-25", "note": "Cash payment" }\n      ]\n    }\n  ]\n}',
      replace: 'Replace all existing data',
      merge: 'Merge (skip duplicate phone numbers)',
      import_btn: 'Import',
      invalid_json: 'Invalid JSON',
      missing_customers: 'JSON must be an array of customers or an object with a "customers" array.',
    },
    payment_mode: {
      cash: 'Cash',
      upi: 'UPI',
      bank: 'Bank Transfer',
      other: 'Other',
    },
  },
  hi: {
    lang: {
      title: 'भाषा चुनें',
      sub: 'यह विकल्प पूरे ऐप पर लागू होता है और याद रखा जाता है।',
      english: 'अंग्रेज़ी',
      hindi: 'हिन्दी',
      urdu: 'اردو',
    },
    common: {
      back: 'ग्राहकों पर वापस जाएँ',
      change_language: 'भाषा बदलें',
      print: 'प्रिंट करें',
      download_pdf: 'पीडीएफ डाउनलोड करें',
      whatsapp: 'व्हाट्सएप',
      currency: 'रु',
      sno: 'क्र.सं.',
    },
    nav: {
      customers: 'ग्राहक',
      add_customer: 'ग्राहक जोड़ें',
      import_data: 'डेटा आयात करें',
      backup_restore: 'बैकअप और पुनर्स्थापना',
      change_language: 'भाषा बदलें',
      seller_details: 'विक्रेता / दुकान विवरण',
      stock_dashboard: 'स्टॉक डैशबोर्ड',
      products: 'उत्पाद',
      add_product: 'उत्पाद जोड़ें',
      purchase: 'स्टॉक खरीद',
      suppliers: 'आपूर्तिकर्ता',
      stock_adjustment: 'स्टॉक समायोजन',
      stock_movement: 'स्टॉक मूवमेंट',
      low_stock: 'कम स्टॉक अलर्ट',
      stock_reports: 'स्टॉक रिपोर्ट',
    },
    home: {
      all_customers: 'सभी ग्राहक',
      total_outstanding: 'कुल बकाया: Rs 0',
      total_outstanding_label: 'कुल बकाया:',
      no_customers: 'अभी कोई ग्राहक नहीं। एक जोड़कर शुरू करें।',
    },
    add_customer: {
      heading: 'ग्राहक जोड़ें',
      full_name: 'पूरा नाम',
      name_placeholder: 'जैसे रवि कुमार',
      mobile_number: 'मोबाइल नंबर',
      phone_placeholder: 'जैसे 9876543210 या +919876543210',
      phone_sub: '10-अंकों का मोबाइल नंबर स्वीकार करता है, या +91 / 91 उपसर्ग के साथ। 10-अंकों की संख्या संग्रहीत की जाती है।',
      contact_import_btn: 'संपर्क से आयात करें',
      contact_not_supported: 'संपर्क आयात इस ब्राउज़र में समर्थित नहीं है। कृपया मोबाइल नंबर मैन्युअली दर्ज करें।',
      opening_balance: 'प्रारंभिक शेष (रु)',
      opening_placeholder: '0.00',
      opening_sub: 'धनात्मक मान = ग्राहक इस राशि का ऋणी है (स्वतः क्रेडिट प्रविष्टि बनती है)।',
      add_customer_btn: 'ग्राहक जोड़ें',
      error_name: 'कृपया ग्राहक का नाम दर्ज करें।',
      error_phone: 'मोबाइल नंबर में ठीक 10 अंक होने चाहिए (कोई अक्षर या प्रतीक नहीं)।',
      error_duplicate: 'इस मोबाइल नंबर वाला ग्राहक पहले से मौजूद है।',
      exists_msg: "'{name}' पहले से मौजूद है (मोबाइल {phone})। शेष: {balance}।\n\nउनका मौजूदा बहीखाता खोलने के लिए ठीक दबाएं, या संपादन जारी रखने के लिए रद्द करें।",
    },
    contact_picker: {
      title: 'फोन नंबर चुनें',
      contact_name: 'संपर्क: {name}',
      no_phones: 'इस संपर्क के लिए कोई फोन नंबर नहीं मिला। कृपया मैन्युअली दर्ज करें।',
      confirm: 'चयन की पुष्टि करें',
      cancel: 'रद्द करें',
      select: 'इस नंबर को चुनें',
      selected: 'चुना गया',
    },
    seller_details: {
      title: 'विक्रेता / दुकान विवरण',
      owner_name: 'विक्रेता / दुकान मालिक का नाम',
      owner_name_placeholder: 'जैसे रवि कुमार',
      shop_name: 'दुकान का नाम',
      shop_name_placeholder: 'जैसे रवि जनरल स्टोर',
      mobile_number: 'मोबाइल नंबर',
      mobile_placeholder: 'जैसे 9876543210',
      upi_id: 'UPI ID (QR जनरेशन के लिए)',
      upi_id_placeholder: 'जैसे 9876543210@upi',
      payment_qr: 'भुगतान QR कोड (वैकल्पिक)',
      payment_qr_sub: 'अपना UPI भुगतान QR कोड इमेज अपलोड करें। यह इनवॉइस और स्टेटमेंट पर दिखाया जाएगा ताकि ग्राहक स्कैन करके भुगतान कर सकें।',
      address: 'दुकान का पता',
      address_placeholder: 'जैसे 123 मुख्य रोड, मार्केट एरिया',
      save_btn: 'विवरण सहेजें',
      error_name: 'कृपया विक्रेता / दुकान मालिक का नाम दर्ज करें।',
      not_set: 'विक्रेता / दुकान विवरण सेट नहीं है। सेटिंग्स में विक्रेता / दुकान विवरण पूरा करें।',
      saved: 'विक्रेता / दुकान विवरण सफलतापूर्वक सहेजा गया।',
    },
    ledger: {
      customer_ledger: 'ग्राहक बहीखाता',
      view_ledger: 'बहीखाता देखें',
      whatsapp_reminder: 'व्हाट्सएप रिमाइंडर',
      generate_invoice: 'इनवॉइस बनाएं',
      statement: 'विवरणी',
      add_new_entry: 'नई प्रविष्टि जोड़ें',
      type: 'प्रकार',
      credit_option: 'क्रेडिट – उधार दिया गया माल',
      payment_option: 'भुगतान – पैसा प्राप्त हुआ',
      amount: 'राशि (रु)',
      amount_placeholder: '0.00',
      date: 'तारीख',
      note: 'नोट',
      note_placeholder: 'छोटा नोट',
      payment_mode: 'भुगतान का तरीका',
      save_entry: 'प्रविष्टि सहेजें',
      payment_screenshot: 'भुगतान स्क्रीनशॉट (वैकल्पिक)',
      balance: 'शेष:',
      no_outstanding: 'कोई बकाया नहीं — भुगतान रिमाइंडर अक्षम है।',
      advance_balance: 'ग्राहक के पास अग्रिम शेष है — भुगतान रिमाइंडर अक्षम है।',
      payment_ready: 'भुगतान रिमाइंडर तैयार है — “व्हाट्सएप रिमाइंडर” पर टैप करें (कुछ भी स्वचालित रूप से नहीं भेजा जाता)।',
      wa_title_open: 'व्हाट्सएप रिमाइंडर खोलें (कुछ भी स्वचालित रूप से नहीं भेजा जाता)',
      wa_title_closed: 'कोई बकाया नहीं — रिमाइंडर ज़रूरी नहीं',
    },
    receipt: {
      title: 'भुगतान रसीद',
      view_receipt: 'रसीद देखें',
      download_receipt: 'पीडीएफ डाउनलोड करें',
      receipt_no: 'रसीद संख्या:',
      date_time: 'दिनांक और समय:',
      customer: 'ग्राहक:',
      mobile: 'मोबाइल:',
      payment_mode: 'भुगतान तरीका:',
      source_transaction: 'स्रोत लेन-देन:',
      description: 'विवरण',
      amount: 'राशि',
      previous_balance: 'पिछला शेष:',
      amount_paid: 'भुगतान राशि:',
      remaining_balance: 'शेष राशि:',
      thank_you: 'भुगतान के लिए धन्यवाद!',
      generated_by: 'Hisaab डिजिटल लेज़र द्वारा जारी',
    },
    statement: {
      title: 'खाता विवरणी',
      period: 'अवधि:',
      all: 'सभी',
      this_month: 'यह महीना',
      prev_month: 'पिछला महीना',
      this_year: 'यह वर्ष',
      prev_year: 'पिछला वर्ष',
      last_30_days: 'पिछले 30 दिन',
      last_3_months: 'पिछले 3 महीने',
      last_6_months: 'पिछले 6 महीने',
      custom: 'कस्टम',
      from: 'से',
      to: 'तक',
      apply: 'लागू करें',
      export_csv: 'सीएसवी निर्यात करें',
      opening_balance: 'प्रारंभिक शेष',
      total_credit: 'कुल क्रेडिट',
      total_payments: 'कुल भुगतान',
      closing_balance: 'अंतिम शेष',
      date: 'तारीख',
      description: 'विवरण',
      credit: 'क्रेडिट',
      payment: 'भुगतान',
      balance: 'शेष',
      no_transactions: 'इस अवधि में कोई लेन-देन नहीं।',
      generated_on: 'जारी किया गया:',
    },
    invoice: {
      title: 'इनवॉइस',
      subtitle: 'भुगतान रसीद',
      invoice_no: 'इनवॉइस नंबर:',
      date: 'तारीख:',
      seller: 'विक्रेता:',
      shop_name: 'दुकान का नाम:',
      address: 'पता:',
      customer: 'ग्राहक:',
      mobile: 'मोबाइल:',
      items: 'खरीदे गए आइटम',
      payments: 'प्राप्त भुगतान',
      date_col: 'तारीख',
      description_col: 'विवरण',
      qty_col: 'मात्रा',
      rate_col: 'दर',
      amount_col: 'राशि',
      total_purchases: 'कुल खरीद:',
      total_payments: 'कुल भुगतान:',
      outstanding_balance: 'बकाया शेष:',
      payment_mode: 'भुगतान का तरीका:',
      scan_gift: '🎁 स्कैन करें और उपहार पाएं',
      scan_gift_sub: 'अपना विशेष उपहार प्राप्त करने के लिए QR कोड स्कैन करें!',
      scan_pay: 'स्कैन करके भुगतान करें',
      scan_pay_sub: 'अपना बिल चुकाने के लिए स्कैन करें।',
      thank_you: 'आपके व्यवसाय के लिए धन्यवाद!',
      generated_by: 'Hisaab डिजिटल दुकान बहीखाता द्वारा जारी',
      no_credit_entries: 'कोई क्रेडिट प्रविष्टि नहीं',
      no_payment_entries: 'कोई भुगतान प्रविष्टि नहीं',
      subtotal: 'उपयोग:',
      discount: 'छूट:',
      grand_total: 'कुल योग:',
      amount_paid: 'भुगतान राशि:',
      remaining: 'शेष:',
    },
billing: {
      heading: 'बिल बनाएं',
      add_item: '+ आइटम जोड़ें',
      product_name: 'उत्पाद का नाम',
      product_placeholder: 'उदा. चावल, चीनी, तेल',
      quantity: 'मात्रा',
      quantity_placeholder: '1',
      unit: 'इकाई',
      unit_placeholder: 'पीस/किग्रा/लीटर',
      rate: 'दर (₹)',
      rate_placeholder: '0.00',
      amount: 'राशि (₹)',
      remove: 'हटाएं',
      subtotal: 'उपयोग:',
      discount: 'छूट (₹)',
      discount_placeholder: '0.00',
      grand_total: 'कुल योग:',
      amount_paid: 'भुगतान राशि (₹)',
      amount_paid_placeholder: '0.00',
      remaining: 'शेष:',
      save_bill: 'बिल सेव करें',
      bill_note: 'बिल नोट (वैकल्पिक)',
      bill_note_placeholder: 'उदा. इनवॉइस #123, GST विवरण',
      no_items: 'अभी तक कोई आइटम नहीं जोड़ा गया।',
      enter_valid_qty: 'मान्य मात्रा दर्ज करें।',
      enter_valid_rate: 'मान्य दर दर्ज करें।',
      at_least_one_item: 'बिल में कम से कम एक आइटम जोड़ें।',
      bill_saved: 'बिल सफलतापूर्वक सेव हो गया।',
      bill_failed: 'बिल सेव करने में विफल:',
    },
    stock: {
      dashboard_title: 'स्टॉक डैशबोर्ड',
      dashboard_sub: 'इन्वेंट्री स्थिति का अवलोकन',
      total_products: 'कुल सक्रिय उत्पाद',
      total_stock_units: 'कुल स्टॉक इकाइयाँ',
      total_purchase_value: 'कुल खरीद मूल्य',
      low_stock_count: 'कम स्टॉक वाले उत्पाद',
      out_of_stock_count: 'स्टॉक से बाहर उत्पाद',
      expiring_count: 'समाप्त होने वाले उत्पाद (30 दिन)',
      recent_purchases: 'हाल की खरीदारी',
      recent_sales: 'हाल की बिक्री',
      recent_adjustments: 'हाल के समायोजन',
      no_recent_purchases: 'कोई हाल की खरीदारी नहीं',
      no_recent_sales: 'कोई हाल की बिक्री नहीं',
      no_recent_adjustments: 'कोई हाल का समायोजन नहीं',
      type_purchase: 'खरीद',
      type_sale: 'बिक्री',
      type_adj_inc: 'समायोजन (+)',
      type_adj_dec: 'समायोजन (-)',
      type_return: 'वापसी',
      type_opening: 'प्रारंभिक स्टॉक',
      report_valuation: 'स्टॉक मूल्यांकन रिपोर्ट',
      purchase_value: 'खरीद मूल्य',
      sell_value: 'बिक्री मूल्य',
      total: 'कुल',
      total_purchases: 'कुल खरीद',
      all_products: 'सभी उत्पाद',
    },
    products: {
      title: 'उत्पाद',
      sub: 'उत्पाद सूची प्रबंधित करें',
      add_product: 'उत्पाद जोड़ें',
      add_sub: 'उत्पाद विवरण दर्ज करें',
      search_placeholder: 'नाम, SKU, बारकोड से खोजें...',
      all_categories: 'सभी श्रेणियाँ',
      all_status: 'सभी स्थिति',
      category: {
        grocery: 'किराना',
        medical: 'चिकित्सा',
        general: 'जनरल स्टोर',
        other: 'अन्य',
      },
      status: {
        active: 'सक्रिय',
        inactive: 'निष्क्रिय',
      },
      select_category: 'श्रेणी चुनें',
      select_unit: 'इकाई चुनें',
      unit: {
        piece: 'पीस',
        kg: 'किग्रा',
        gram: 'ग्राम',
        litre: 'लीटर',
        ml: 'मिली',
        packet: 'पैकेट',
        strip: 'स्ट्रिप',
        box: 'बॉक्स',
        bottle: 'बोतल',
        dozen: 'दर्जन',
        custom: 'कस्टम',
      },
      custom_unit: 'कस्टम इकाई नाम',
      product_name: 'उत्पाद नाम',
      sku: 'SKU',
      barcode: 'बारकोड',
      category: 'श्रेणी',
      brand: 'ब्रांड',
      unit: 'इकाई',
      purchase_price: 'खरीद मूल्य (₹)',
      selling_price: 'बिक्री मूल्य (₹)',
      current_stock: 'वर्तमान स्टॉक',
      min_stock_alert: 'न्यूनतम स्टॉक अलर्ट',
      medical_details: 'चिकित्सा उत्पाद विवरण',
      batch_number: 'बैच नंबर',
      expiry_date: 'समाप्ति तिथि',
      manufacturer: 'निर्माता',
      supplier: 'आपूर्तिकर्ता',
      select_supplier: 'आपूर्तिकर्ता चुनें (वैकल्पिक)',
      status: 'स्थिति',
      notes: 'नोट्स',
      save_btn: 'उत्पाद सेव करें',
      edit_product: 'उत्पाद संपादित करें',
      edit_sub: 'उत्पाद विवरण संशोधित करें',
      no_products: 'अभी तक कोई उत्पाद नहीं। पहला उत्पाद जोड़ें।',
    },
    purchase: {
      title: 'स्टॉक खरीद',
      sub: 'आपूर्तिकर्ताओं से स्टॉक खरीद रिकॉर्ड करें',
      supplier: 'आपूर्तिकर्ता',
      select_supplier: 'आपूर्तिकर्ता चुनें',
      invoice_no: 'इनवॉइस नंबर',
      date: 'खरीद तिथि',
      payment_mode: 'भुगतान मोड',
      payment_credit: 'उधार',
      items: 'खरीद आइटम',
      product: 'उत्पाद',
      batch: 'बैच नं.',
      expiry: 'समाप्ति तिथि',
      purchase_rate: 'दर (₹)',
      no_items: 'अभी तक कोई आइटम नहीं जोड़ा गया।',
      add_item: '+ आइटम जोड़ें',
      subtotal: 'उपयोग:',
      discount: 'छूट (₹)',
      grand_total: 'कुल योग:',
      notes: 'नोट्स',
      save_btn: 'खरीद सेव करें',
    },
    suppliers: {
      title: 'आपूर्तिकर्ता',
      sub: 'आपूर्तिकर्ता निर्देशिका प्रबंधित करें',
      add_supplier: 'आपूर्तिकर्ता जोड़ें',
      add_sub: 'आपूर्तिकर्ता विवरण दर्ज करें',
      search_placeholder: 'आपूर्तिकर्ता खोजें...',
      name: 'आपूर्तिकर्ता नाम',
      mobile: 'मोबाइल नंबर',
      address: 'पता',
      gstin: 'GSTIN (वैकल्पिक)',
      notes: 'नोट्स',
      save_btn: 'आपूर्तिकर्ता सेव करें',
      no_suppliers: 'अभी तक कोई आपूर्तिकर्ता नहीं। पहला आपूर्तिकर्ता जोड़ें।',
    },
    stock_adjustment: {
      title: 'स्टॉक समायोजन',
      sub: 'अधिकृत स्टॉक सुधार',
      product: 'उत्पाद',
      select_product: 'उत्पाद चुनें',
      type: 'समायोजन प्रकार',
      select_type: 'प्रकार चुनें',
      increase: 'स्टॉक बढ़ाएं',
      decrease: 'स्टॉक घटाएं',
      quantity: 'मात्रा',
      batch: 'बैच नंबर',
      all_batches: 'सभी बैच',
      reason: 'कारण',
      select_reason: 'कारण चुनें',
      damage: 'क्षति/नुकसान',
      expiry: 'समाप्ति',
      correction: 'स्टॉक गिनती सुधार',
      return: 'आपूर्तिकर्ता वापसी',
      other: 'अन्य',
      notes: 'नोट्स',
      save_btn: 'समायोजन सेव करें',
    },
    stock_movement: {
      title: 'स्टॉक मूवमेंट इतिहास',
      sub: 'स्टॉक परिवर्तनों का पूर्ण ऑडिट ट्रेल',
      all_products: 'सभी उत्पाद',
      all_types: 'सभी प्रकार',
      purchase: 'खरीद',
      sale: 'बिक्री',
      adjustment_increase: 'समायोजन (+)',
      adjustment_decrease: 'समायोजन (-)',
      return: 'वापसी',
      opening: 'प्रारंभिक स्टॉक',
      from: 'से',
      to: 'तक',
      apply: 'लागू करें',
      no_movements: 'कोई स्टॉक मूवमेंट रिकॉर्ड नहीं।',
    },
    low_stock: {
      title: 'कम स्टॉक अलर्ट',
      sub: 'न्यूनतम स्टॉक स्तर से नीचे के उत्पाद',
      no_alerts: 'कोई कम स्टॉक अलर्ट नहीं। सभी उत्पाद अच्छी तरह से स्टॉक हैं।',
      all: 'कम स्टॉक और आउट ऑफ स्टॉक',
      low_only: 'केवल कम स्टॉक',
      out_only: 'केवल आउट ऑफ स्टॉक',
    },
    stock_reports: {
      title: 'स्टॉक रिपोर्ट',
      sub: 'इन्वेंट्री रिपोर्ट जनरेट करें',
      report_type: 'रिपोर्ट:',
      current_stock: 'वर्तमान स्टॉक रिपोर्ट',
      product_wise: 'उत्पाद-वार स्टॉक',
      purchase_report: 'खरीद रिपोर्ट',
      sales_report: 'बिक्री रिपोर्ट',
      low_stock_report: 'कम स्टॉक रिपोर्ट',
      expiry_report: 'समाप्ति रिपोर्ट',
      movement_report: 'स्टॉक मूवमेंट रिपोर्ट',
      valuation_report: 'स्टॉक मूल्यांकन रिपोर्ट',
      generate: 'जनरेट',
    },
    backup: {
      backup_restore: 'बैकअप और पुनर्स्थापना',
      download_backup: 'पूर्ण बैकअप डाउनलोड करें',
      download_backup_btn: 'पूर्ण बैकअप डाउनलोड करें',
      backup_sub: 'सभी ग्राहक, लेन-देन और भुगतान स्क्रीनशॉट निर्यात करें। इसमें बैकअप तिथि और ऐप संस्करण शामिल है।',
      restore_backup: 'बैकअप से पुनर्स्थापित करें',
      restore_sub: 'पुनर्स्थापित करने के लिए बैकअप JSON फ़ाइल चुनें। मौजूदा डेटा आपकी स्पष्ट पुष्टि के बिना कभी अधिलेखित नहीं किया जाता।',
      merge: 'मर्ज करें (डुप्लीकेट फोन छोड़ें)',
      replace: 'सभी मौजूदा डेटा बदलें',
      warning_replace: 'चेतावनी: यह सभी मौजूदा ग्राहक, लेन-देन और स्क्रीनशॉट बदल देगा। इसे पूर्ववत नहीं किया जा सकता।',
    },
    import: {
      import_data: 'डेटा आयात करें',
      sub: 'नमूना-डेटा.json प्रारूप में JSON पेस्ट करें: ग्राहकों की सरणी, या "customers" सरणी के साथ एक ऑब्जेक्ट। प्रत्येक ग्राहक को "नाम", "फोन" और एक वैकल्पिक "एंट्रीज़" सरणी की आवश्यकता होती है। प्रविष्टियों के बिना ग्राहक अनुमति है।',
      placeholder: '{\n  "customers": [\n    {\n      "name": "रवि कुमार",\n      "phone": "9000000101",\n      "entries": [\n        { "type": "credit", "amount": 250, "date": "2026-10-23", "note": "क्रेडिट माल" },\n        { "type": "payment", "amount": 1500, "date": "2026-10-25", "note": "नकद भुगतान" }\n      ]\n    }\n  ]\n}',
      replace: 'सभी मौजूदा डेटा बदलें',
      merge: 'मर्ज करें (डुप्लीकेट फोन नंबर छोड़ें)',
      import_btn: 'आयात करें',
      invalid_json: 'अमान्य JSON',
      missing_customers: 'JSON ग्राहकों की सरणी या "customers" सरणी के साथ एक ऑब्जेक्ट होना चाहिए।',
    },
    payment_mode: {
      cash: 'नकद',
      upi: 'UPI',
      bank: 'बैंक ट्रांसफर',
      other: 'अन्य',
    },
  },
  ur: {
    lang: {
      title: 'زبان منتخب کریں',
      sub: 'یہ انتخاب پری ایپ پر لاگو ہوتا ہے اور یاد رکھا جاتا ہے۔',
      english: 'انگریزی',
      hindi: 'ہندوی',
      urdu: 'اردو',
    },
    common: {
      back: 'واپس گراہکوں پر',
      change_language: 'زبان بدلیں',
      print: 'پرنٹ کریں',
      download_pdf: 'پی ڈی ایف ڈاؤن لوڈ کریں',
      whatsapp: 'وٹس ایپ',
      currency: 'Rs',
      sno: 'کم نمبر',
    },
nav: {
      customers: 'گراہک',
      add_customer: 'نئے گراہک شامل کریں',
      import_data: 'ڈیٹا درآمد کریں',
      backup_restore: 'بیک اپ اور بحالی',
      change_language: 'زبان بدلیں',
      seller_details: 'فروخت کنندہ / دکان تفصیلات',
      stock_dashboard: 'اسٹاک ڈیش بورڈ',
      products: 'مصنوعات',
      add_product: 'مصنوعات شامل کریں',
      purchase: 'اسٹاک خریدیں',
      suppliers: 'سپلائرز',
      stock_adjustment: 'اسٹاک ایڈجسٹمنٹ',
      stock_movement: 'اسٹاک موومینٹ',
      low_stock: 'کم اسٹاک الرٹ',
      stock_reports: 'اسٹاک رپورٹ',
    },
    home: {
      all_customers: 'تمام گراہک',
      total_outstanding: 'کل بکایا: Rs 0',
      total_outstanding_label: 'کل بکایا:',
      no_customers: 'ابھی کوئی گراہک نہیں۔ ایک شامل کر کے شروع کریں۔',
    },
    add_customer: {
      heading: 'نया گراہک شامل کریں',
      full_name: 'پورا نام',
      name_placeholder: 'مثال: رavi کمار',
      mobile_number: 'موبائل نمبر',
      phone_placeholder: 'مثال: 9876543210 یا +919876543210',
      phone_sub: '10 ہندسے والا موبائل نمبر قبول کرتا ہے، یا +91 / 91 prefix کے ساتھ۔ 10 ہندسے کی numero محفوظ کی جاتی ہے۔',
      contact_import_btn: 'رابطوں سے درآمد کریں',
      contact_not_supported: 'رابطہ درآمد اس براؤزر میں سہولت یافتہ نہیں ہے۔ براہ کرم موبائل نمبر دستیاب درج کریں۔',
      opening_balance: 'ابتدائی بلانس (Rs)',
      opening_placeholder: '0.00',
      opening_sub: 'مثبت رقم = گراہک اس رقم کا مقروض ہے (خودکار کریڈٹ انٹری بنتی ہے۔',
      add_customer_btn: 'گراہک شامل کریں',
      error_name: 'براہ کرم گراہک کا نام درج کریں۔',
      error_phone: 'موبائل نمبر میں ٹھیک 10 ہندسے ہونے چاہئیں (کوئی حرف یا علامت نہیں)۔',
      error_duplicate: 'یہ موبائل نمبر والا گراہک پہلے سے موجود ہے۔',
      exists_msg: "'{name}' پہلے سے موجود ہے (موبائل {phone})۔ بلانس: {balance}۔\n\nموجودہ کھاتہ کھولنے کے लिए ٹھیک دبائیں، یا 編集 جاری رکھنے کے لئے منسوخ کریں۔",
    },
    contact_picker: {
      title: 'فون نمبر منتخب کریں',
      contact_name: 'رابطہ: {name}',
      no_phones: 'اس رابطے کے لیے کوئی فون نمبر نہیں ملا۔ براہ کرم دستیاب درج کریں۔',
      confirm: 'انتخاب کی تصدیق کریں',
      cancel: 'منسوخ کریں',
      select: 'اس نمبر کو منتخب کریں',
      selected: 'منتخب شدہ',
    },
    seller_details: {
      title: 'فروخت کنندہ / دکان تفصیلات',
      owner_name: 'فروخت کنندہ / دکان کے مالک کا نام',
      owner_name_placeholder: 'مثال: رavi کمار',
      shop_name: 'دکان کا نام',
      shop_name_placeholder: 'مثال: رavi جنرل سٹور',
      mobile_number: 'موبائل نمبر',
      mobile_placeholder: 'مثال: 9876543210',
      upi_id: 'UPI ID (QR کوڈ جنریشن کے لیے)',
      upi_id_placeholder: 'مثال: 9876543210@upi',
      payment_qr: 'ادائیگی QR کوڈ (اختیاری)',
      payment_qr_sub: 'اپنا UPI ادائیگی QR کوڈ انڈر اپ لوڈ کریں۔ یہ انوائس اور سٹیٹمنٹ پر دکھایا جائے گا تاکہ گراہک اسکین کر کے ادائیگی کر سکیں۔',
      address: 'دکان کا پتہ',
      address_placeholder: 'مثال: 123 مرکزی سڑک، مارکیٹ علاقہ',
      save_btn: 'تفصیلات محفوظ کریں',
      error_name: 'براہ کرم فروخت کنندہ / دکان کے مالک کا نام درج کریں۔',
      not_set: 'فروخت کنندہ / دکان تفصیلات مقرر نہیں ہیں۔ براہ کرم سیٹنگز میں فروخت کنندہ / دکان تفصیلات مکمل کریں۔',
      saved: 'فروخت کنندہ / دکان تفصیلات کامیاب الأحيان محفوظ کر لی گئیں۔',
    },
    ledger: {
      customer_ledger: 'گراہک کھاتہ',
      view_ledger: 'کھاتہ دیکھیں',
      whatsapp_reminder: 'وٹس ایپ یاد دہانی',
      generate_invoice: 'انوائس بنائیں',
      statement: 'سٹیٹمنٹ',
      add_new_entry: 'نئی انٹری شامل کریں',
      type: 'قسم',
      credit_option: 'کریڈٹ – قرض دی گئی اشیاء',
      payment_option: 'ادائیگی – رقم وصول ہوئی',
      amount: 'رقم (Rs)',
      amount_placeholder: '0.00',
      date: 'تاریخ',
      note: 'نوٹ',
      note_placeholder: 'مختصری نوٹ',
      payment_mode: 'ادائیگی کا طریقہ',
      save_entry: 'انٹری محفوظ کریں',
      payment_screenshot: 'ادائیگی کا اسکرین شاٹ (اختیاری)',
      balance: 'بلانس:',
      no_outstanding: 'کوئی بکایا نہیں — ادائیگی کی یاد دہانی معطل ہے۔',
      advance_balance: 'گراہک کے پاس پیشگی بلانس ہے — ادائیگی کی یاد دہانی معطل ہے۔',
      payment_ready: 'ادائیگی کی یاد دہانی تیار ہے — “وٹس ایپ یاد دہانی” دبائیں (کچھ بھی خود بخود نہیں بھیجا جاتا)۔',
      wa_title_open: 'وٹس ایپ یاد دہانی کھولیں (کچھ بھی خود بخود نہیں بھیجا جاتا)',
      wa_title_closed: 'کوئی بکایا نہیں — یاد دہانی کی ضرورت نہیں',
    },
    receipt: {
      title: 'ادائیگی کی رسید',
      view_receipt: 'رسید دیکھیں',
      download_receipt: 'پی ڈی ایف ڈاؤن لوڈ کریں',
      receipt_no: 'رسید نمبر:',
      date_time: 'تاریخ اور وقت:',
      customer: 'گراہک:',
      mobile: 'موبائل:',
      payment_mode: 'ادائیگی کا طریقہ:',
      source_transaction: 'منبع لين-دین:',
      description: 'تفصیل',
      amount: 'رقم',
      previous_balance: 'پچھلا بلانس:',
      amount_paid: 'ادا کردہ رقم:',
      remaining_balance: 'بقیہ رقم:',
      thank_you: 'ادائیگی کے لیے شکریہ!',
      generated_by: 'Hisaab ڈیجیٹل لیجر کے ذریعے جاری',
    },
    statement: {
      title: 'کھاتے کی سٹیٹمنٹ',
      period: 'مدت:',
      all: 'سب',
      this_month: 'یہ ماہ',
      prev_month: 'پچھلا ماہ',
      this_year: 'یہ سال',
      prev_year: 'پچھلا سال',
      last_30_days: 'پچھلے 30 دن',
      last_3_months: 'پچھلے 3 مہینے',
      last_6_months: 'پچھلے 6 ماہ',
      custom: 'کسٹم',
      from: 'سے',
      to: 'تک',
      apply: 'لاگو کریں',
      export_csv: 'سی ایس وی برآمد کریں',
      opening_balance: 'ابتدائی بلانس',
      total_credit: 'کل کریڈٹ',
      total_payments: 'کل ادائیگیاں',
      closing_balance: 'آخری بلانس',
      date: 'تاریخ',
      description: 'تفصیل',
      credit: 'کریڈٹ',
      payment: 'ادائیگی',
      balance: 'بلانس',
      no_transactions: 'اس مدت میں کوئی لین دین نہیں۔',
      generated_on: 'جاری کردہ:',
    },
    invoice: {
      title: 'انvoइस',
      subtitle: 'ادائیگی کی رسید',
      invoice_no: 'انوائس نمبر:',
      date: 'تاریخ:',
      seller: 'فروخت کنندہ:',
      shop_name: 'دکان کا نام:',
      address: 'پتہ:',
      customer: 'گراہک:',
      mobile: 'موبائل:',
      items: 'خریدے گئے آئٹمز',
      payments: 'وصول شدہ ادائیگیاں',
      date_col: 'تاریخ',
      description_col: 'تفصیل',
      qty_col: 'مقدار',
      rate_col: 'شرح',
      amount_col: 'رقم',
      total_purchases: 'کل خریداری:',
      total_payments: 'کل ادائیگیاں:',
      outstanding_balance: 'باقاعدہ بلانس:',
      payment_mode: 'ادائیگی کا طریقہ:',
      scan_gift: '🎁 اسکین کریں اور تحفہ حاصل کریں',
      scan_gift_sub: 'اپنا خصوصی تحفہ حاصل کرنے کے لیے QR کوڈ اسکین کریں!',
      scan_pay: 'اسکن کرکے ادائیگی کریں',
      scan_pay_sub: 'اپنا بل ادا کرنے کے لیے اسکین کریں۔',
      thank_you: 'آپ کے کاروبار کے لیے شکریہ!',
      generated_by: 'Hisaab ڈجیٹل دکان لیجر کی طرف سے جاری',
      no_credit_entries: 'کوئی کریڈٹ انٹری نہیں',
      no_payment_entries: 'کوئی ادائیگی انٹری نہیں',
      subtotal: 'کلیہ:',
      discount: 'رعایت:',
      grand_total: 'مجموعی کل:',
      amount_paid: 'ادائیگی رقم:',
      remaining: 'بقایا:',
    },
    billing: {
      heading: 'بل بنائیں',
      add_item: '+ آئٹم شامل کریں',
      product_name: 'پروڈکٹ کا نام',
      product_placeholder: 'مثال: چاول، چینی، تیل',
      quantity: 'مقدار',
      quantity_placeholder: '1',
      unit: 'اکائی',
      unit_placeholder: 'پیس/کلو/لیٹر',
      rate: 'نرخ (₹)',
      rate_placeholder: '0.00',
      amount: 'رقم (₹)',
      remove: 'حذف کریں',
      subtotal: 'کلیہ:',
      discount: 'رعایت (₹)',
      discount_placeholder: '0.00',
      grand_total: 'مجموعی کل:',
      amount_paid: 'ادائیگی رقم (₹)',
      amount_paid_placeholder: '0.00',
      remaining: 'بقایا:',
      save_bill: 'بل محفوظ کریں',
      bill_note: 'بل نوٹ (اختیاری)',
      bill_note_placeholder: 'مثال: انوائس #123، GST تفصیلات',
      no_items: 'ابھی تک کوئی آئٹم شامل نہیں ہوا۔',
      enter_valid_qty: 'درست مقدار درج کریں۔',
      enter_valid_rate: 'درست نرخ درج کریں۔',
      at_least_one_item: 'بل میں کم از کم ایک آئٹم شامل کریں۔',
      bill_saved: 'بل کامیابی سے محفوظ ہو گیا۔',
      bill_failed: 'بل محفوظ کرنے میں ناکام:',
    },
    stock: {
      dashboard_title: 'اسٹاک ڈیش بورڈ',
      dashboard_sub: 'انوینٹری کی حالت کا جائزہ',
      total_products: 'کل فعال مصنوعات',
      total_stock_units: 'کل اسٹاک یونٹس',
      total_purchase_value: 'کل خرید قیمت',
      low_stock_count: 'کم اسٹاک والی مصنوعات',
      out_of_stock_count: 'اسٹاک سے باہر مصنوعات',
      expiring_count: 'منقضی ہونے والی مصنوعات (30 دن)',
      recent_purchases: 'حالیہ خریداریاں',
      recent_sales: 'حالیہ فروخت',
      recent_adjustments: 'حالیہ ترمیمیں',
      no_recent_purchases: 'کوئی حالیہ خریداری نہیں',
      no_recent_sales: 'کوئی حالیہ فروخت نہیں',
      no_recent_adjustments: 'کوئی حالیہ ترمیم نہیں',
      type_purchase: 'خریداری',
      type_sale: 'فروخت',
      type_adj_inc: 'ترمیم (+)',
      type_adj_dec: 'ترمیم (-)',
      type_return: 'واپسی',
      type_opening: 'ابتدائی اسٹاک',
      report_valuation: 'اسٹاک کی قیمت لگانے کی رپورٹ',
      purchase_value: 'خریداری کی قیمت',
      sell_value: 'فروخت کی قیمت',
      total: 'کل',
      total_purchases: 'کل خریداریاں',
      all_products: 'تمام مصنوعات',
    },
    products: {
      title: 'مصنوعات',
      sub: 'پروڈکٹ کی کیٹلاگ کا انتظام کریں',
      add_product: 'مصنوعات شامل کریں',
      add_sub: 'مصنوعات کی تفصیلات درج کریں',
      search_placeholder: 'نام، SKU، بارکوڈ سے تلاش کریں...',
      all_categories: 'تمام اقسام',
      all_status: 'تمام حالتیں',
      category: {
        grocery: 'کریانہ',
        medical: 'طبی',
        general: 'جنرل اسٹور',
        other: 'دیگر',
      },
      status: {
        active: 'فعال',
        inactive: 'غیر فعال',
      },
      select_category: 'اقسام منتخب کریں',
      select_unit: 'اکائی منتخب کریں',
      unit: {
        piece: 'پیس',
        kg: 'کلو',
        gram: 'گرام',
        litre: 'لیٹر',
        ml: 'ملی',
        packet: 'پیکٹ',
        strip: 'سٹرپ',
        box: 'ڈبہ',
        bottle: 'بوتل',
        dozen: 'درجن',
        custom: 'کسٹم',
      },
      custom_unit: 'کسٹم یونٹ کا نام',
      product_name: 'پروڈکٹ کا نام',
      sku: 'SKU',
      barcode: 'بارکوڈ',
      category: 'اقسام',
      brand: 'برینڈ',
      unit: 'اکائی',
      purchase_price: 'خرید کی قیمت (₹)',
      selling_price: 'فروخت کی قیمت (₹)',
      current_stock: 'موجودہ اسٹاک',
      min_stock_alert: 'کم از کم اسٹاک انتباہ',
      medical_details: 'طبی مصنوعات کی تفصیلات',
      batch_number: 'بیچ نمبر',
      expiry_date: 'منقضی ہونے کی تاریخ',
      manufacturer: 'مصنوعات ساز',
      supplier: 'فراہم کرنے والا',
      select_supplier: 'فراہم کرنے والا منتخب کریں (اختیاری)',
      status: 'حالت',
      notes: 'نوٹس',
      save_btn: 'مصنوعات محفوظ کریں',
      edit_product: 'مصنوعات میں ترمیم کریں',
      edit_sub: 'مصنوعات کی تفصیلات میں ترمیم کریں',
      no_products: 'کوئی مصنوعات نہیں۔ پہلی مصنوعات شامل کریں۔',
    },
    purchase: {
      title: 'اسٹاک خرید',
      sub: 'فراہم کنندگان سے اسٹاک خرید ریکارڈ کریں',
      supplier: 'فراہم کرنے والا',
      select_supplier: 'فراہم کرنے والا منتخب کریں',
      invoice_no: 'انوائس نمبر',
      date: 'خرید کی تاریخ',
      payment_mode: 'ادائیگی کا طریقہ',
      payment_credit: 'ادھار',
      items: 'خرید کے آئٹمز',
      product: 'مصنوعات',
      batch: 'بیچ نمبر',
      expiry: 'منقضی ہونے کی تاریخ',
      purchase_rate: 'خرید کی نرخ (₹)',
      no_items: 'کوئی آئٹم شامل نہیں کیا گیا۔',
      add_item: '+ آئٹم شامل کریں',
      subtotal: 'کلیہ:',
      discount: 'رعایت (₹)',
      grand_total: 'مجموعی کل:',
      notes: 'نوٹس',
      save_btn: 'خرید محفوظ کریں',
    },
    suppliers: {
      title: 'فراہم کنندگان',
      sub: 'فراہم کنندگان کی ڈائریکٹری کا انتظام کریں',
      add_supplier: 'فراہم کرنے والا شامل کریں',
      add_sub: 'فراہم کرنے والے کی تفصیلات درج کریں',
      search_placeholder: 'فراہم کنندگان تلاش کریں...',
      name: 'فراہم کرنے والے کا نام',
      mobile: 'موبائل نمبر',
      address: 'پتہ',
      gstin: 'GSTIN (اختیاری)',
      notes: 'نوٹس',
      save_btn: 'فراہم کرنے والا محفوظ کریں',
      no_suppliers: 'کوئی فراہم کرنے والا نہیں۔ پہلا فراہم کرنے والا شامل کریں۔',
    },
    stock_adjustment: {
      title: 'اسٹاک ترمیم',
      sub: 'مجاز اسٹاک کی ترمیم',
      product: 'مصنوعات',
      select_product: 'مصنوعات منتخب کریں',
      type: 'ترمیم کی قسم',
      select_type: 'قسم منتخب کریں',
      increase: 'اسٹاک بڑھائیں',
      decrease: 'اسٹاک گھٹائیں',
      quantity: 'مقدار',
      batch: 'بیچ نمبر',
      all_batches: 'تمام بیچ',
      reason: 'وجہ',
      select_reason: 'وجہ منتخب کریں',
      damage: 'نقصان/نقص',
      expiry: 'منقضی',
      correction: 'اسٹاک گنتی کی ترمیم',
      return: 'فراہم کرنے والے کی واپسی',
      other: 'دیگر',
      notes: 'نوٹس',
      save_btn: 'ترمیم محفوظ کریں',
    },
    stock_movement: {
      title: 'اسٹاک موومینٹ تاریخ',
      sub: 'اسٹاک تبدیلیوں کا مکمل آڈٹ ٹریل',
      all_products: 'تمام مصنوعات',
      all_types: 'تمام اقسام',
      purchase: 'خرید',
      sale: 'فروخت',
      adjustment_increase: 'ترمیم (+)',
      adjustment_decrease: 'ترمیم (-)',
      return: 'واپسی',
      opening: 'ابتدائی اسٹاک',
      from: 'سے',
      to: 'تک',
      apply: 'لاگو کریں',
      no_movements: 'کوئی اسٹاک موومینٹ ریکارڈ نہیں۔',
    },
    low_stock: {
      title: 'کم اسٹاک انتباہ',
      sub: 'کم از کم اسٹاک سطح سے نیچے کے مصنوعات',
      no_alerts: 'کوئی کم اسٹاک انتباہ نہیں۔ تمام مصنوعات اچھی طرح سے اسٹاک ہیں۔',
      all: 'کم اسٹاک اور آؤٹ آف اسٹاک',
      low_only: 'صرف کم اسٹاک',
      out_only: 'صرف آؤٹ آف اسٹاک',
    },
    stock_reports: {
      title: 'اسٹاک رپورٹ',
      sub: 'انوینٹری رپورٹ جنریٹ کریں',
      report_type: 'رپورٹ:',
      current_stock: 'موجودہ اسٹاک رپورٹ',
      product_wise: 'پروڈکٹ وار اسٹاک',
      purchase_report: 'خرید رپورٹ',
      sales_report: 'فروخت رپورٹ',
      low_stock_report: 'کم اسٹاک رپورٹ',
      expiry_report: 'منقضی رپورٹ',
      movement_report: 'اسٹاک موومینٹ رپورٹ',
      valuation_report: 'اسٹاک_VALUATION رپورٹ',
      generate: 'تیار کریں',
    },
    backup: {
      backup_restore: 'بیک اپ اور بحالی',
      download_backup: 'مکمل بیک اپ ڈاؤن لوڈ کریں',
      download_backup_btn: 'مکمل بیک اپ ڈاؤن لوڈ کریں',
      backup_sub: 'تمام گراہک، لین دین اور ادائیگی اسکرین شاٹ برآمد کریں۔ اس میں بیک اپ تاریخ اور ایپ ورژن شامل ہے۔',
      restore_backup: 'بیک اپ سے بحالی',
      restore_sub: 'بحالی کے لیے بیک اپ JSON فائل منتخب کریں۔ موجودہ ڈیٹا آپ کی واضح تصدیق کے بغیر کبھی اوور رائٹ نہیں کیا جاتا۔',
      merge: 'مرگ کریں (ڈپلیکیٹ فون چھوڑیں)',
      replace: 'تمام موجودہ ڈیٹا بدلیں',
      warning_replace: 'وارننگ: یہ تمام موجودہ گراہک، لین دین اور اسکرین شاٹ بدلیں گے۔ اسے واپس نہیں کیا جا سکتا۔',
    },
    import: {
      import_data: 'ڈیٹا درآمد کریں',
      sub: 'نمونہ ڈیٹا جيسون فارمیٹ میں جيسون پیسٹ کریں: گراہکوں کا ارے، یا "customers" ارے کے ساتھ ایک آبجیکٹ۔ ہر گراہک کو "نام"، "فون" اور ایک اختیاری "Entries" ارے کی ضرورت ہوتی ہے۔ Entries کے بغیر گراہک اجازت ہے۔',
      placeholder: '{\n  "customers": [\n    {\n      "name": "رافي کمار",\n      "phone": "9000000101",\n      "entries": [\n        { "type": "credit", "amount": 250, "date": "2026-10-23", "note": "کرضی سامان" },\n        { "type": "payment", "amount": 1500, "date": "2026-10-25", "note": "نقد ادائیگی" }\n      ]\n    }\n  ]\n}',
      replace: 'تمام موجودہ ڈیٹا بدلیں',
      merge: 'مرگ کریں (ڈپلیکیٹ فون نمبر چھوڑیں)',
      import_btn: 'درآمد کریں',
      invalid_json: 'نا مقبول JSON',
      missing_customers: 'JSON گراہکوں کا ارے یا "customers" ارے کے ساتھ ایک آبجیکٹ ہونا چاہیے۔',
    },
    payment_mode: {
      cash: 'نقد',
      upi: 'UPI',
      bank: 'بینک ٹرانسفر',
      other: 'دیگر',
    },
  },
};

/* Return translated string for the current language, falling back to English. */
function t(key) {
  const parts = key.split('.');
  let obj = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  for (const p of parts) {
    if (obj == null || typeof obj !== 'object') return key;
    obj = obj[p];
  }
  if (obj == null) {
    obj = TRANSLATIONS['en'];
    for (const p of parts) {
      if (obj == null || typeof obj !== 'object') return key;
      obj = obj[p];
    }
  }
  return obj == null ? key : String(obj);
}

/* Persist and apply a language choice across the whole app. */
function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'en';
  currentLang = lang;
  try { localStorage.setItem(STORAGE_LANG, lang); } catch (e) { /* storage may be blocked */ }
  const html = document.documentElement;
  html.lang = lang;
  html.dir = LANG_DIR[lang] || 'ltr';
  document.body.classList.toggle('rtl', lang === 'ur');
  translatePage();
  // Re-render the active view so dynamic content reflects the new language.
  try { route(); } catch (e) { /* app not booted yet */ }
}

/* Read persisted language. Returns the lang code, or null if none chosen yet. */
function loadLanguage() {
  let lang = null;
  try { lang = localStorage.getItem(STORAGE_LANG); } catch (e) { lang = null; }
  if (!lang || !SUPPORTED_LANGS.includes(lang)) return null;
  return lang;
}

/* Translate all [data-i18n] and [data-i18n-placeholder] elements. */
function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  const switcher = document.getElementById('lang-switcher');
  if (switcher) switcher.title = t('common.change_language');
}

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

// Inventory state
let products = [];        // { id, name, sku, barcode, category, brand, purchasePrice, sellingPrice, currentStock, unit, minStockAlert, batchNumber, expiryDate, manufacturer, supplierId, status, notes, createdAt, updatedAt }
let batches = [];         // { id, productId, batchNumber, expiryDate, quantity, purchasePrice, purchaseId, createdAt }
let purchases = [];       // { id, supplierId, invoiceNo, date, items[], discount, grandTotal, paymentMode, notes, createdAt }
let stockMovements = [];  // { id, productId, batchId, type, quantity, referenceId, referenceType, date, notes, createdAt }
let suppliers = [];       // { id, name, mobile, address, gstin, notes, createdAt }

function loadState() {
  try { customers = JSON.parse(localStorage.getItem(STORAGE_CUSTOMERS) || '[]'); } catch (e) { customers = []; }
  try { transactions = JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS) || '[]'); } catch (e) { transactions = []; }
  try { shots = JSON.parse(localStorage.getItem(STORAGE_SHOTS) || '{}'); } catch (e) { shots = {}; }
  try { receipts = JSON.parse(localStorage.getItem(STORAGE_RECEIPTS) || '[]'); } catch (e) { receipts = []; }
  
  // Load inventory data with migration
  loadInventoryData();
  
  loadSellerDetails();
}

function saveState() {
  localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(customers));
  localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_SHOTS, JSON.stringify(shots));
  localStorage.setItem(STORAGE_RECEIPTS, JSON.stringify(receipts));
  
  // Save inventory data
  saveInventoryData();
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

/* ---------- Seller / Shop Details (persisted in localStorage) ---------- */
let sellerDetails = { ownerName: '', shopName: '', mobile: '', address: '', upiId: '', paymentQr: '' };

function loadSellerDetails() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_SELLER) || '{}');
    sellerDetails = {
      ownerName: String(saved.ownerName || '').trim(),
      shopName: String(saved.shopName || '').trim(),
      mobile: String(saved.mobile || '').trim(),
      address: String(saved.address || '').trim(),
      upiId: String(saved.upiId || '').trim(),
      paymentQr: String(saved.paymentQr || '').trim(),
    };
    sellerPaymentQrCache = sellerDetails.paymentQr;
  } catch (e) {
    sellerDetails = { ownerName: '', shopName: '', mobile: '', address: '', upiId: '', paymentQr: '' };
  }
}
function saveSellerDetails() {
  localStorage.setItem(STORAGE_SELLER, JSON.stringify(sellerDetails));
}
function getSellerName() {
  return sellerDetails.ownerName;
}
function getSellerShopName() {
  return sellerDetails.shopName;
}
function hasSellerDetails() {
  return sellerDetails.ownerName.length > 0;
}

/* ---------- Inventory Data Migration & Persistence ---------- */
const INVENTORY_DATA_VERSION = 1;

function loadInventoryData() {
  try {
    products = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS) || '[]');
  } catch (e) { products = []; }
  
  try {
    batches = JSON.parse(localStorage.getItem(STORAGE_BATCHES) || '[]');
  } catch (e) { batches = []; }
  
  try {
    purchases = JSON.parse(localStorage.getItem(STORAGE_PURCHASES) || '[]');
  } catch (e) { purchases = []; }
  
  try {
    stockMovements = JSON.parse(localStorage.getItem(STORAGE_STOCK_MOVEMENTS) || '[]');
  } catch (e) { stockMovements = []; }
  
  try {
    suppliers = JSON.parse(localStorage.getItem(STORAGE_SUPPLIERS) || '[]');
  } catch (e) { suppliers = []; }
  
  // Migration for older data (if any)
  migrateInventoryData();
}

function saveInventoryData() {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
  localStorage.setItem(STORAGE_BATCHES, JSON.stringify(batches));
  localStorage.setItem(STORAGE_PURCHASES, JSON.stringify(purchases));
  localStorage.setItem(STORAGE_STOCK_MOVEMENTS, JSON.stringify(stockMovements));
  localStorage.setItem(STORAGE_SUPPLIERS, JSON.stringify(suppliers));
}

function migrateInventoryData() {
  // Version 1: Initial schema - no migration needed for fresh installs
  // This function will handle future schema changes
  const version = parseInt(localStorage.getItem('hisaab_inventory_version') || '0', 10);
  if (version < INVENTORY_DATA_VERSION) {
    // Future migrations would go here
    localStorage.setItem('hisaab_inventory_version', String(INVENTORY_DATA_VERSION));
  }
}

/* Create a stock movement record */
function createStockMovement(productId, type, quantity, referenceId, referenceType, notes, batchId = null) {
  const movement = {
    id: uid(),
    productId,
    batchId,
    type, // 'purchase', 'sale', 'adjustment_increase', 'adjustment_decrease', 'return', 'opening'
    quantity: Number(quantity),
    referenceId,
    referenceType,
    notes: notes || '',
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  stockMovements.push(movement);
  return movement;
}

/* Update product stock - source of truth is stock movements */
function recalculateProductStock(productId) {
  const movements = stockMovements.filter(m => m.productId === productId);
  let total = 0;
  for (const m of movements) {
    if (['purchase', 'adjustment_increase', 'return', 'opening'].includes(m.type)) {
      total += m.quantity;
    } else if (['sale', 'adjustment_decrease'].includes(m.type)) {
      total -= m.quantity;
    }
  }
  return Math.max(0, total);
}

/* Recalculate all product stocks from movements */
function recalculateAllStocks() {
  for (const p of products) {
    p.currentStock = recalculateProductStock(p.id);
  }
}

/* Get product by ID */
function getProductById(id) {
  return products.find(p => p.id === id);
}

/* Get product by barcode */
function getProductByBarcode(barcode) {
  if (!barcode) return null;
  return products.find(p => p.barcode === barcode && p.status === 'active');
}

/* Get product by SKU */
function getProductBySku(sku) {
  if (!sku) return null;
  return products.find(p => p.sku === sku && p.status === 'active');
}

/* Get supplier by ID */
function getSupplierById(id) {
  return suppliers.find(s => s.id === id);
}

/* Get active products for billing search */
function getActiveProducts() {
  return products.filter(p => p.status === 'active');
}

/* Get low stock products */
function getLowStockProducts() {
  return products.filter(p => p.status === 'active' && p.currentStock <= p.minStockAlert && p.minStockAlert > 0);
}

/* Get out of stock products */
function getOutOfStockProducts() {
  return products.filter(p => p.status === 'active' && p.currentStock <= 0);
}

/* Get expiring products (within days) */
function getExpiringProducts(days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return batches.filter(b => b.quantity > 0 && b.expiryDate && new Date(b.expiryDate) <= cutoff);
}

let sellerPaymentQrCache = '';
function getPaymentQr() {
  if (sellerPaymentQrCache) return sellerPaymentQrCache;
  try { sellerPaymentQrCache = String(localStorage.getItem('hisaab_seller_payment_qr') || sellerDetails.paymentQr || '').trim(); } catch(e){ sellerPaymentQrCache=''; }
  return sellerPaymentQrCache;
}
function getSellerPaymentQrDataUrl() { return getPaymentQr(); }
async function savePaymentQr(dataUrl) {
  sellerPaymentQrCache = String(dataUrl || '').trim();
  try { localStorage.setItem('hisaab_seller_payment_qr', sellerPaymentQrCache); } catch(e){}
  sellerDetails.paymentQr = sellerPaymentQrCache;
}
async function removePaymentQr() {
  sellerPaymentQrCache = '';
  try { localStorage.removeItem('hisaab_seller_payment_qr'); } catch(e){}
  sellerDetails.paymentQr = '';
}
function generateMarketingQrDataUrl() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}
function renderQrBlock() {
  const qr = getPaymentQr();
  if (!qr) {
    return '<div class="qr-block"><div class="qr-notice">Seller payment QR not configured</div><img src="'+generateMarketingQrDataUrl()+'" alt="marketing"/><div class="qr-label">SCAN &amp; GET GIFT</div></div>';
  }
  return '<div class="qr-block"><img src="'+qr+'" alt="payment"/><div class="qr-label">SCAN &amp; PAY</div><img src="'+generateMarketingQrDataUrl()+'" alt="marketing"/><div class="qr-label">SCAN &amp; GET GIFT</div></div>';
}
function formatSellerHeader() {
  const lines = [];
  if (sellerDetails.ownerName) lines.push(escapeHtml(sellerDetails.ownerName));
  if (sellerDetails.shopName) lines.push(escapeHtml(sellerDetails.shopName));
  return lines.length > 0 ? lines.join(' \u2022 ') : '';
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
  const url = WHATSAPP_LANDING_URL;

  if (currentLang === 'hi') {
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
      `👉 ${url}\n` +
      `\n` +
      `🌿 याद रखिए, बेहतर स्वास्थ्य की दिशा में उठाया गया हर छोटा कदम महत्वपूर्ण है।\n` +
      `\n` +
      `सादर धन्यवाद!\n` +
      `Team Dr. Malik Usman`;
  }

  if (currentLang === 'ur') {
    return `السلام علیکم ${name}! 🙏\n` +
      `\n` +
      `آپ کے اکاؤنٹ میں ₹${amount} کی رقم اب بھی بکایا ہے۔ براہ کرم اپنا بقیہ ادائیگی पूरा کریں۔\n` +
      `\n` +
      `🎉 مبارکبád! 🎉\n` +
      `\n` +
      `آپ کے لیے ایک خاص تحفہ! 🎁\n` +
      `\n` +
      `آج اپنا بکایا ادائیگی مکمل کریں اور Diabetes Reversal کے لیے ایک خصوصی 1:1 ذاتی مشاورة کال حاصل کریں۔ 🏆\n` +
      `\n` +
      `اس ذاتی مشاورت میں آپ اپنی طرزِ زندگی، بھارتی غذا اور روزانہ کے معمول کو بہتر بنانے کے لئے رہنمائی حاصل کریں گے۔\n` +
      `\n` +
      `📲 اپنی ذاتی مشاورہ کال بک کرنے کے لئے نیچے دیے گئے لنک پر کلک کریں:\n` +
      `\n` +
      `👉 ${url}\n` +
      `\n` +
      `🌿 یاد رکھئے، بہتر صحت کی طرف اٹھایا گیا ہر چھوٹا قدم اہم ہے۔\n` +
      `\n` +
      `شکریہ!\n` +
      `Team Dr. Malik Usman`;
  }

  // English
  return `Hello ${name}!\n` +
    `\n` +
    `₹${amount} is still outstanding in your account. We kindly request you to clear the remaining payment.\n` +
    `\n` +
    `🎉 CONGRATULATIONS! 🎉\n` +
    `\n` +
    `You have a special gift! 🎁\n` +
    `\n` +
    `Complete your outstanding payment today and get an exclusive 1:1 personal consultation call for Diabetes Reversal. 🏆\n` +
    `\n` +
    `In this personal consultation, you will get guidance to improve your Lifestyle, Indian Diet and Daily Routine.\n` +
    `\n` +
    `📲 Click the link below to book your Personal Consultation Call:\n` +
    `\n` +
    `👉 ${url}\n` +
    `\n` +
    `🌿 Remember, every small step towards better health matters.\n` +
    `\n` +
    `Thank you!\n` +
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

function computeLedgerSummary(phone) {
  let totalCredit = 0, totalPayment = 0;
  for (const t of transactions) {
    if (t.customerPhone !== phone) continue;
    if (t.type === 'credit') totalCredit += t.amount; else totalPayment += t.amount;
  }
  return { totalCredit, totalPayment, outstanding: totalCredit - totalPayment };
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
    if (id === 'view-seller-details') renderSellerDetailsView();
    
    // Inventory views
    if (id === 'view-stock-dashboard') renderStockDashboard();
    if (id === 'view-products') renderProductsList();
    if (id === 'view-add-product') renderAddProductView();
    if (id === 'view-purchase') renderPurchaseView();
    if (id === 'view-suppliers') renderSuppliersList();
    if (id === 'view-add-supplier') renderAddSupplierView();
    if (id === 'view-stock-adjustment') renderStockAdjustmentView();
    if (id === 'view-stock-movement') renderStockMovementView();
    if (id === 'view-low-stock') renderLowStockView();
    if (id === 'view-stock-reports') renderStockReportsView();
  }
}

/* ---------- Home screen ---------- */
function renderHome() {
  const list = document.getElementById('customer-list');
  const totalEl = document.getElementById('total-outstanding');

  const total = totalOutstanding();
  totalEl.textContent = `${t('home.total_outstanding_label')} ${total < 0 ? '-' : ''}${t('common.currency')} ${formatMoney(total)}`;

  list.innerHTML = '';
  const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name));
  if (sorted.length === 0) {
    list.innerHTML = `<p class="hint">${t('home.no_customers')}</p>`;
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
             data-remind="${escapeHtml(c.phone)}" class="btn btn-wa" target="_blank" rel="noopener">${t('ledger.whatsapp_reminder')}</a>`
      : `<button type="button" class="btn btn-wa" disabled title="${t('ledger.no_outstanding')}" aria-disabled="true">${t('ledger.whatsapp_reminder')}</button>`;

    row.innerHTML = `
      <div class="cust-info">
        <div class="cust-name">${escapeHtml(c.name)}</div>
        <div class="cust-phone">${escapeHtml(c.phone)}</div>
      </div>
      <div class="cust-balance ${bal < 0 ? 'neg' : ''}" data-balance>${bal < 0 ? '-' : ''}${t('common.currency')} ${formatMoney(bal)}</div>
      <div class="cust-actions">
        <a href="#view-ledger?phone=${encodeURIComponent(c.phone)}" class="btn">${t('ledger.view_ledger')}</a>
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
    errorEl.textContent = t('add_customer.error_name');
    return;
  }
  /* Exactly 10 digits, no letters or symbols. */
  if (!/^\d{10}$/.test(phone)) {
    errorEl.textContent = t('add_customer.error_phone');
    return;
  }
  if (customers.some(c => c.phone === phone)) {
    errorEl.textContent = t('add_customer.error_duplicate');
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
      let msg = t('add_customer.exists_msg')
        .replace('{name}', escapeHtml(c.name))
        .replace('{phone}', formatPhoneDisplay(c.phone))
        .replace('{balance}', (existingBal < 0 ? '-' : '') + t('common.currency') + ' ' + formatMoney(existingBal));
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
const contactModal = document.getElementById('contact-picker-modal');
const contactBackdrop = document.getElementById('contact-picker-backdrop');
const contactCancel = document.getElementById('contact-picker-cancel');
const contactConfirm = document.getElementById('contact-picker-confirm');
const contactNameDisplay = document.getElementById('contact-picker-name-display');
const contactList = document.getElementById('contact-picker-list');
const contactEmpty = document.getElementById('contact-picker-empty');

const contactPickerSupported = typeof navigator !== 'undefined' && navigator.contacts && typeof navigator.contacts.select === 'function';

if (!contactPickerSupported) {
  importContactsBtn.style.display = 'none';
  contactNotice.style.display = 'block';
}

let pendingContactName = '';
let pendingSelectedPhone = null;

function showContactModal(name, phones) {
  pendingContactName = name;
  pendingSelectedPhone = null;

  contactNameDisplay.innerHTML = t('contact_picker.contact_name').replace('{name}', escapeHtml(name || ''));
  contactList.innerHTML = '';
  contactEmpty.style.display = 'none';
  contactConfirm.disabled = true;

  const seen = new Set();
  let added = 0;

  for (const p of phones) {
    const raw = (typeof p === 'string') ? String(p).trim() : (p && p.value ? String(p.value).trim() : '');
    if (!raw) continue;
    const normalized = normalizePhone(raw);
    if (!/^\d{10}$/.test(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const item = document.createElement('div');
    item.className = 'contact-modal-item';
    item.tabIndex = 0;
    item.role = 'radio';
    item.setAttribute('aria-checked', 'false');

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'contact-phone';
    radio.value = normalized;
    radio.checked = false;
    radio.style.display = 'none';

    const content = document.createElement('div');
    content.className = 'contact-modal-item-content';

    const numberDiv = document.createElement('div');
    numberDiv.className = 'contact-modal-item-number';
    numberDiv.textContent = raw;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'contact-modal-item-label';
    labelDiv.textContent = normalized;

    content.appendChild(numberDiv);
    content.appendChild(labelDiv);

    item.appendChild(radio);
    item.appendChild(content);

    item.addEventListener('click', function () {
      contactList.querySelectorAll('.contact-modal-item').forEach(it => {
        it.classList.remove('selected');
        it.setAttribute('aria-checked', 'false');
        it.querySelector('input[type="radio"]').checked = false;
      });
      item.classList.add('selected');
      item.setAttribute('aria-checked', 'true');
      radio.checked = true;
      pendingSelectedPhone = normalized;
      contactConfirm.disabled = false;
    });

    contactList.appendChild(item);
    added++;
  }

  if (added === 0) {
    contactEmpty.style.display = 'block';
    contactConfirm.disabled = true;
  }

  contactModal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function hideContactModal() {
  contactModal.style.display = 'none';
  document.body.style.overflow = '';
  pendingContactName = '';
  pendingSelectedPhone = null;
}

contactCancel.addEventListener('click', function () {
  hideContactModal();
});

contactBackdrop.addEventListener('click', function () {
  hideContactModal();
});

contactConfirm.addEventListener('click', function () {
  if (!pendingSelectedPhone) return;
  custNameInput.value = pendingContactName || '';
  custPhoneInput.value = pendingSelectedPhone;
  custSuggestions.style.display = 'none';
  suggestionsVisible = false;
  hideContactModal();
});

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
    const name = Array.isArray(contact.name) ? (contact.name[0] || '') : (contact.name && contact.name.displayName ? contact.name.displayName : (contact.name && contact.name.firstName ? contact.name.firstName : (typeof contact.name === 'string' ? contact.name : '')));
    const phones = Array.isArray(contact.tel) ? contact.tel : (Array.isArray(contact.phones) ? contact.phones : []);

    const validPhones = phones
      .map(p => (typeof p === 'string' ? p : (p && p.value ? p.value : null)))
      .filter(Boolean)
      .map(p => ({ raw: p, normalized: normalizePhone(p) }))
      .filter(p => /^\d{10}$/.test(p.normalized));

    if (validPhones.length === 0) {
      contactNotice.textContent = t('contact_picker.no_phones');
      contactNotice.className = 'msg error';
      contactNotice.style.display = 'block';
      return;
    }

    custNameInput.value = name || '';

    if (validPhones.length === 1) {
      custPhoneInput.value = validPhones[0].normalized;
    } else {
      showContactModal(name, phones);
    }
    custSuggestions.style.display = 'none';
    suggestionsVisible = false;
  } catch (err) {
    contactNotice.textContent = 'Could not access contacts: ' + (err && err.message ? err.message : err);
    contactNotice.className = 'msg error';
    contactNotice.style.display = 'block';
  }
});

/* ---------- Billing Table Functions ---------- */
let billRowCounter = 0;

function initBillingTable() {
  const tbody = document.getElementById('bill-tbody');
  const emptyMsg = document.getElementById('bill-empty');
  const addBtn = document.getElementById('add-item-btn');
  const form = document.getElementById('bill-form');
  const discountInput = document.getElementById('bill-discount');
  const amountPaidInput = document.getElementById('bill-amount-paid');
  const dateInput = document.getElementById('bill-date');

  // Guard: elements may not exist in tests or old views
  if (!tbody || !emptyMsg || !addBtn || !form || !discountInput || !amountPaidInput || !dateInput) return;

  // Reset
  tbody.innerHTML = '';
  billRowCounter = 0;
  emptyMsg.style.display = 'block';

  // Set default date
  dateInput.value = DEFAULT_DATE;

  // Add first row
  addBillRow();

  // Event listeners
  addBtn.onclick = () => addBillRow();
  discountInput.oninput = updateBillTotals;
  amountPaidInput.oninput = updateBillTotals;

  // Form submit
  form.onsubmit = handleBillSubmit;
}

function addBillRow() {
  const tbody = document.getElementById('bill-tbody');
  const emptyMsg = document.getElementById('bill-empty');
  if (!tbody || !emptyMsg) return;
  billRowCounter++;

  const row = document.createElement('tr');
  row.dataset.rowId = billRowCounter;

  // S.No.
  const snoCell = document.createElement('td');
  snoCell.className = 'bill-sno';
  snoCell.textContent = billRowCounter;
  row.appendChild(snoCell);

  // Product Name
  const productCell = document.createElement('td');
  const productInput = document.createElement('input');
  productInput.type = 'text';
  productInput.className = 'bill-input bill-product';
  productInput.placeholder = t('billing.product_placeholder');
  productInput.required = true;
  productInput.setAttribute('data-i18n-placeholder', 'billing.product_placeholder');
  productCell.appendChild(productInput);
  row.appendChild(productCell);

  // Quantity
  const qtyCell = document.createElement('td');
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.className = 'bill-input bill-qty';
  qtyInput.min = '1';
  qtyInput.step = '0.01';
  qtyInput.value = '1';
  qtyInput.placeholder = t('billing.quantity_placeholder');
  qtyInput.required = true;
  qtyInput.setAttribute('data-i18n-placeholder', 'billing.quantity_placeholder');
  qtyInput.oninput = () => { updateRowAmount(row); updateBillTotals(); };
  qtyCell.appendChild(qtyInput);
  row.appendChild(qtyCell);

  // Unit
  const unitCell = document.createElement('td');
  const unitInput = document.createElement('input');
  unitInput.type = 'text';
  unitInput.className = 'bill-input bill-unit';
  unitInput.placeholder = t('billing.unit_placeholder');
  unitInput.setAttribute('data-i18n-placeholder', 'billing.unit_placeholder');
  unitCell.appendChild(unitInput);
  row.appendChild(unitCell);

  // Rate
  const rateCell = document.createElement('td');
  const rateInput = document.createElement('input');
  rateInput.type = 'number';
  rateInput.className = 'bill-input bill-rate';
  rateInput.min = '0';
  rateInput.step = '0.01';
  rateInput.placeholder = t('billing.rate_placeholder');
  rateInput.required = true;
  rateInput.setAttribute('data-i18n-placeholder', 'billing.rate_placeholder');
  rateInput.oninput = () => { updateRowAmount(row); updateBillTotals(); };
  rateCell.appendChild(rateInput);
  row.appendChild(rateCell);

  // Amount (read-only)
  const amountCell = document.createElement('td');
  const amountSpan = document.createElement('span');
  amountSpan.className = 'bill-amount';
  amountSpan.textContent = '₹ 0.00';
  amountCell.appendChild(amountSpan);
  row.appendChild(amountCell);

  // Remove button
  const removeCell = document.createElement('td');
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-ghost btn-sm bill-remove';
  removeBtn.textContent = t('billing.remove');
  removeBtn.setAttribute('data-i18n', 'billing.remove');
  removeBtn.onclick = () => removeBillRow(row);
  removeCell.appendChild(removeBtn);
  row.appendChild(removeCell);

  tbody.appendChild(row);
  emptyMsg.style.display = 'none';

  // Focus product name in new row
  setTimeout(() => productInput.focus(), 0);

  // Keyboard navigation: Enter in last field adds new row
  rateInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBillRow();
    }
  });

  updateRowAmount(row);
  updateBillTotals();
}

function removeBillRow(row) {
  const tbody = document.getElementById('bill-tbody');
  const emptyMsg = document.getElementById('bill-empty');
  if (!tbody || !emptyMsg) return;
  row.remove();
  // Renumber rows
  const rows = tbody.querySelectorAll('tr');
  rows.forEach((r, i) => {
    r.dataset.rowId = i + 1;
    r.querySelector('.bill-sno').textContent = i + 1;
  });
  billRowCounter = rows.length;
  if (billRowCounter === 0) {
    emptyMsg.style.display = 'block';
  }
  updateBillTotals();
}

function updateRowAmount(row) {
  const qtyEl = row.querySelector('.bill-qty');
  const rateEl = row.querySelector('.bill-rate');
  const amountEl = row.querySelector('.bill-amount');
  if (!qtyEl || !rateEl || !amountEl) return;
  const qty = parseFloat(qtyEl.value) || 0;
  const rate = parseFloat(rateEl.value) || 0;
  const amount = qty * rate;
  amountEl.textContent = formatMoney2(amount);
}

function updateBillTotals() {
  const tbody = document.getElementById('bill-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  let subtotal = 0;
  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.bill-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.bill-rate').value) || 0;
    subtotal += qty * rate;
  });

  const discount = parseFloat(document.getElementById('bill-discount').value) || 0;
  const grandTotal = Math.max(0, subtotal - discount);
  const amountPaid = parseFloat(document.getElementById('bill-amount-paid').value) || 0;
  const remaining = Math.max(0, grandTotal - amountPaid);

  document.getElementById('bill-subtotal').textContent = '₹ ' + formatMoney2(subtotal);
  document.getElementById('bill-grand-total').textContent = '₹ ' + formatMoney2(grandTotal);
  document.getElementById('bill-remaining').textContent = '₹ ' + formatMoney2(remaining);
}

function getBillItems() {
  const tbody = document.getElementById('bill-tbody');
  if (!tbody) return [];
  const rows = tbody.querySelectorAll('tr');
  const items = [];
  rows.forEach(row => {
    const product = row.querySelector('.bill-product').value.trim();
    const qty = parseFloat(row.querySelector('.bill-qty').value) || 0;
    const unit = row.querySelector('.bill-unit').value.trim();
    const rate = parseFloat(row.querySelector('.bill-rate').value) || 0;
    const amount = qty * rate;
    if (product && qty > 0 && rate >= 0) {
      items.push({ product, qty, unit, rate, amount });
    }
  });
  return items;
}

function validateBillForm() {
  const items = getBillItems();
  if (items.length === 0) {
    alert(t('billing.at_least_one_item'));
    return false;
  }
  for (const item of items) {
    if (!item.product) {
      alert(t('billing.enter_valid_qty'));
      return false;
    }
    if (item.qty <= 0) {
      alert(t('billing.enter_valid_qty'));
      return false;
    }
    if (item.rate < 0) {
      alert(t('billing.enter_valid_rate'));
      return false;
    }
  }
  return true;
}

function handleBillSubmit(e) {
  e.preventDefault();
  if (!currentPhone) return;

  if (!validateBillForm()) return;

  const items = getBillItems();
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discount = parseFloat(document.getElementById('bill-discount').value) || 0;
  const grandTotal = Math.max(0, subtotal - discount);
  const amountPaid = parseFloat(document.getElementById('bill-amount-paid').value) || 0;
  const date = document.getElementById('bill-date').value || DEFAULT_DATE;
  const note = document.getElementById('bill-note').value.trim();

  // Create credit entry with items
  const invoiceNo = 'INV-' + currentPhone.slice(-6) + '-' + Date.now().toString(36).toUpperCase();
  const creditEntry = {
    id: uid(),
    customerPhone: currentPhone,
    type: 'credit',
    amount: grandTotal,
    date,
    note: note || 'Bill',
    items: items,
    discount: discount,
    subtotal: subtotal,
    invoiceNo: invoiceNo
  };

  // If amount paid > 0, also create a payment entry
  const paymentEntry = amountPaid > 0 ? {
    id: uid(),
    customerPhone: currentPhone,
    type: 'payment',
    amount: amountPaid,
    date,
    note: note || 'Payment against bill',
    paymentMode: 'Cash'
  } : null;

  const showMessage = (text, kind) => {
    const el = document.getElementById('ledger-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'msg ' + (kind === 'error' ? 'error' : 'ok');
    el.style.display = text ? 'block' : 'none';
  };

  try {
    transactions.push(creditEntry);
    if (paymentEntry) transactions.push(paymentEntry);
    saveState();
    showMessage(t('billing.bill_saved'), 'ok');
    // Reset bill form
    initBillingTable();
    // Reset payment form too
    initPaymentForm();
  } catch (err) {
    showMessage(t('billing.bill_failed') + ' ' + (err && err.message ? err.message : String(err)), 'error');
    console.error('Bill save failed:', err);
    return;
  }
  renderLedger(currentPhone);
}

function initPaymentForm() {
  const form = document.getElementById('payment-form');
  form.reset();
  document.getElementById('payment-date').value = DEFAULT_DATE;
  form.onsubmit = handlePaymentSubmit;
}

function handlePaymentSubmit(e) {
  e.preventDefault();
  if (!currentPhone) return;

  const amount = parseFloat(document.getElementById('payment-amount').value);
  const date = document.getElementById('payment-date').value || DEFAULT_DATE;
  const note = document.getElementById('payment-note').value.trim();
  const paymentMode = document.getElementById('payment-mode').value;

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
    type: 'payment',
    amount,
    date,
    note,
    paymentMode
  };

  const fileInput = document.getElementById('shot-input');
  const file = fileInput.files[0];
  const preview = document.getElementById('shot-preview');
  const receiptActions = document.getElementById('receipt-actions');

  const showMessage = (text, kind) => {
    const el = document.getElementById('ledger-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'msg ' + (kind === 'error' ? 'error' : 'ok');
    el.style.display = text ? 'block' : 'none';
  };

  const finish = () => {
    try {
      transactions.push(entry);
      saveState();
      if (entry.type === 'payment') {
        receiptActions.style.display = 'flex';
        createReceiptFromTransaction(entry.id);
      }
      showMessage('Entry saved successfully.', 'ok');
    } catch (err) {
      showMessage('Save failed: ' + (err && err.message ? err.message : String(err)), 'error');
      console.error('Entry save failed:', err);
      return;
    }
    renderLedger(currentPhone);
    fileInput.value = '';
    preview.innerHTML = '';
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      shots[entry.id] = reader.result;
      finish();
    };
    reader.onerror = () => alert('Could not read the image.');
    reader.readAsDataURL(file);
  } else {
    finish();
  }
}

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
    ? t('ledger.wa_title_open')
    : t('ledger.wa_title_closed');

  document.getElementById('ledger-balance').innerHTML =
    `${t('ledger.balance')} <strong>${bal < 0 ? '-' : ''}${t('common.currency')} ${formatMoney(bal)}</strong>`;

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

  for (const tx of txs) {
    const isPayment = tx.type === 'payment';
    const shot = shots[tx.id] ? `<img src="${shots[tx.id]}" data-shot class="shot-thumb" alt="payment screenshot">` : '';
    const invoiceBtnHtml = !isPayment && tx.invoiceNo ? `
      <button type="button" class="btn btn-sm btn-primary tx-invoice-btn" data-tx-id="${tx.id}" data-i18n="ledger.generate_invoice" style="margin-top:6px;padding:4px 10px;font-size:0.75rem;">${t('ledger.generate_invoice')}</button>
    ` : '';

    const el = document.createElement('div');
    el.className = `tx-item ${tx.type}`;
    el.innerHTML = `
      <div class="tx-date">${escapeHtml(tx.date)}</div>
      <div class="tx-type">${isPayment ? 'Payment' : 'Credit'}</div>
      <div class="tx-amount">${isPayment ? '\u2013' : '+'}${t('common.currency')} ${formatMoney(tx.amount)}</div>
      <div class="tx-note">${escapeHtml(tx.note || '')}</div>
      ${shot}
      ${invoiceBtnHtml}
    `;
    list.appendChild(el);
  }

  // Wire up invoice buttons for each credit transaction
  list.querySelectorAll('.tx-invoice-btn').forEach(btn => {
    btn.onclick = (e) => {
      const txId = e.currentTarget.dataset.txId;
      generateInvoiceForBill(phone, txId);
    };
  });

  /* Initialize billing table for credit entries */
  initBillingTable();

  /* Initialize payment form for payment entries */
  initPaymentForm();

  /* Wire invoice button */
  const invoiceBtn = document.getElementById('invoice-btn');
  invoiceBtn.onclick = () => {
    generateInvoice(phone);
    lastInvoicePhone = phone;
  };
}

/* ---------- Invoice Generation for Specific Bill ---------- */
function generateInvoiceForBill(phone, billId) {
  try {
    console.log('generateInvoiceForBill called for:', phone, 'bill:', billId);
    const c = customers.find(x => x.phone === phone);
    if (!c) { console.error('Customer not found:', phone); return; }

    // Find the specific credit transaction (bill)
    const bill = transactions.find(t => t.id === billId && t.customerPhone === phone && t.type === 'credit');
    if (!bill) { console.error('Bill not found:', billId); return; }

    const payments = transactions
      .filter(t => t.customerPhone === phone && t.type === 'payment')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalPayment = payments.reduce((sum, t) => sum + t.amount, 0);
    const outstanding = bill.amount - totalPayment;

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const now = new Date();
    const dateTime = now.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const invoiceNo = bill.invoiceNo || ('INV-' + phone.slice(-6) + '-' + Date.now().toString(36).toUpperCase());

    // Build credit rows for this specific bill
    let creditRows = '';
    if (bill.items && Array.isArray(bill.items) && bill.items.length > 0) {
      // Multi-item bill: show each item as a separate row
      for (const item of bill.items) {
        creditRows += `
          <tr>
            <td>${escapeHtml(bill.date)}</td>
            <td>${escapeHtml(item.product)}</td>
            <td class="qty">${escapeHtml(String(item.qty))}${item.unit ? ' ' + escapeHtml(item.unit) : ''}</td>
            <td class="rate">${t('common.currency')} ${formatMoney2(item.rate)}</td>
            <td class="amount">${t('common.currency')} ${formatMoney2(item.amount)}</td>
          </tr>
        `;
      }
      // Show discount row if applicable
      if (bill.discount > 0) {
        creditRows += `
          <tr style="background:var(--muted);">
            <td colspan="4" style="text-align:right;"><strong>${escapeHtml(bill.note || 'Bill')} - Discount</strong></td>
            <td class="amount" style="color:var(--destructive);"><strong>-${t('common.currency')} ${formatMoney2(bill.discount)}</strong></td>
          </tr>
        `;
      }
    } else {
      // Legacy single-item entry
      creditRows += `
        <tr>
          <td>${escapeHtml(bill.date)}</td>
          <td>${escapeHtml(bill.note || t('invoice.no_credit_entries'))}</td>
          <td class="qty">1</td>
          <td class="rate">${t('common.currency')} ${formatMoney2(bill.amount)}</td>
          <td class="amount">${t('common.currency')} ${formatMoney2(bill.amount)}</td>
        </tr>
      `;
    }

    // Build payment rows (all payments for this customer)
    const paymentRows = payments.map(tx => `
      <tr>
        <td>${escapeHtml(tx.date)}</td>
        <td>${escapeHtml(tx.note || t('invoice.no_payment_entries'))}</td>
        <td class="amount" style="color:var(--success);">${t('common.currency')} ${formatMoney2(tx.amount)}</td>
        <td class="amount" style="color:var(--success);">${t('payment_mode.' + (tx.paymentMode || 'cash').toLowerCase()) || tx.paymentMode || 'Cash'}</td>
      </tr>
    `).join('');

    // Seller details
    const paymentQrHtml = sellerDetails.paymentQr ? `
      <div class="invoice-qr" style="margin-bottom:16px;">
        <img src="${sellerDetails.paymentQr}" style="width:120px;height:120px;border:1px solid var(--border);border-radius:8px;background:#fff;" alt="Payment QR">
        <div class="invoice-qr-text" style="font-size:12px;margin-top:6px;">Scan to Pay</div>
      </div>
    ` : '';

    const sellerHtml = hasSellerDetails() ? `
      <div class="invoice-seller">
        <div class="invoice-seller-name">${escapeHtml(sellerDetails.ownerName)}</div>
        ${sellerDetails.shopName ? `<div class="invoice-seller-shop">${escapeHtml(sellerDetails.shopName)}</div>` : ''}
        ${sellerDetails.address ? `<div class="invoice-seller-address">${escapeHtml(sellerDetails.address)}</div>` : ''}
      </div>
    ` : `<div class="invoice-seller-empty"><p>${t('seller_details.not_set')}</p></div>`;

    // QR code for landing page
    const qrCodeUrl = 'https://sugarresetblueprint.online/landing-page-541315';
    
    // Combined QR codes in horizontal row
    const qrHtml = `
      <div class="invoice-qr-row">
        ${sellerDetails.paymentQr ? `
        <div class="invoice-qr-col">
          <img src="${sellerDetails.paymentQr}" class="invoice-qr-img" alt="Payment QR">
          <div class="invoice-qr-text" data-i18n="invoice.scan_pay">SCAN TO PAY</div>
          <div class="invoice-qr-sub" data-i18n="invoice.scan_pay_sub">Scan to pay your bill.</div>
        </div>
        ` : '<div class="invoice-qr-col invoice-qr-empty"></div>'}
        <div class="invoice-qr-col">
          <div id="invoice-qr-code" class="invoice-qr-img-placeholder"></div>
          <div class="invoice-qr-text" data-i18n="invoice.scan_gift">${t('invoice.scan_gift')}</div>
          <div class="invoice-qr-sub" data-i18n="invoice.scan_gift_sub">${t('invoice.scan_gift_sub')}</div>
        </div>
      </div>
    `;

    const invoiceHtml = `
      ${sellerHtml}
      <div class="invoice-header">
        <h1 class="brand">Hisaab</h1>
        <p class="doc-title" data-i18n="invoice.title">${t('invoice.title')}</p>
        <p class="doc-subtitle" data-i18n="invoice.subtitle">${t('invoice.subtitle')}</p>
      </div>

      <div class="invoice-meta">
        <div class="row"><span class="label" data-i18n="invoice.invoice_no">${t('invoice.invoice_no')}</span><span>${escapeHtml(invoiceNo)}</span></div>
        <div class="row"><span class="label" data-i18n="invoice.date">${t('invoice.date')}</span><span>${escapeHtml(bill.date)}</span></div>
        <div class="row"><span class="label" data-i18n="invoice.customer">${t('invoice.customer')}</span><span>${escapeHtml(c.name)}</span></div>
        <div class="row"><span class="label" data-i18n="invoice.mobile">${t('invoice.mobile')}</span><span>${formatPhoneDisplay(c.phone)}</span></div>
      </div>

      <div class="section-title" data-i18n="invoice.items">${t('invoice.items')}</div>
      <table class="invoice-table">
        <thead>
          <tr>
            <th data-i18n="invoice.date_col">${t('invoice.date_col')}</th>
            <th data-i18n="invoice.description_col">${t('invoice.description_col')}</th>
            <th class="qty" data-i18n="invoice.qty_col">${t('invoice.qty_col')}</th>
            <th class="rate" data-i18n="invoice.rate_col">${t('invoice.rate_col')}</th>
            <th class="amount" data-i18n="invoice.amount_col">${t('invoice.amount_col')}</th>
          </tr>
        </thead>
        <tbody>
          ${creditRows || `<tr><td colspan="5" style="text-align:center;color:var(--muted);">${t('invoice.no_credit_entries')}</td></tr>`}
        </tbody>
      </table>

      <div class="invoice-totals">
        <div class="invoice-total-row"><span data-i18n="invoice.subtotal">${t('invoice.subtotal')}</span><span>${t('common.currency')} ${formatMoney2(bill.subtotal || bill.amount)}</span></div>
        ${bill.discount > 0 ? `<div class="invoice-total-row"><span data-i18n="invoice.discount">${t('invoice.discount')}</span><span>-${t('common.currency')} ${formatMoney2(bill.discount)}</span></div>` : ''}
        <div class="invoice-total-row"><span data-i18n="invoice.grand_total">${t('invoice.grand_total')}</span><span>${t('common.currency')} ${formatMoney2(bill.amount)}</span></div>
        <div class="invoice-total-row"><span data-i18n="invoice.amount_paid">${t('invoice.amount_paid')}</span><span>${t('common.currency')} ${formatMoney2(totalPayment)}</span></div>
        <div class="invoice-total-row final"><span data-i18n="invoice.remaining">${t('invoice.remaining')}</span><span>${outstanding < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(Math.abs(outstanding))}</span></div>
      </div>

      ${qrHtml}

      <div class="invoice-footer">
        <p data-i18n="invoice.thank_you">${t('invoice.thank_you')}</p>
        <p data-i18n="invoice.generated_by">${t('invoice.generated_by')} • ${today}</p>
      </div>
    `;

    document.getElementById('invoice-content').innerHTML = invoiceHtml;
    document.getElementById('invoice-title').textContent = t('invoice.title');
    document.getElementById('invoice-sub').textContent = `${escapeHtml(c.name)} • ${formatPhoneDisplay(c.phone)}`;

    // Generate QR code
    setTimeout(() => {
      const qrDiv = document.getElementById('invoice-qr-code');
      if (qrDiv && window.QRCode) {
        qrDiv.innerHTML = '';
        new QRCode(qrDiv, {
          text: qrCodeUrl,
          width: 140,
          height: 140,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }, 0);

    console.log('Invoice generated for bill:', billId);

    // Store invoice data for WhatsApp sharing
    lastInvoicePhone = phone;
    lastInvoiceData = {
      customer: c,
      invoiceNo: invoiceNo,
      invoiceDate: bill.date,
      dateTime: dateTime,
      items: bill.items && Array.isArray(bill.items) && bill.items.length > 0 ? bill.items : [{
        product: bill.note || 'Goods',
        qty: 1,
        unit: '',
        rate: bill.amount,
        amount: bill.amount
      }],
      subtotal: bill.subtotal || bill.amount,
      discount: bill.discount || 0,
      grandTotal: bill.amount,
      totalPayment: totalPayment,
      outstanding: outstanding,
      sellerDetails: hasSellerDetails() ? { ...sellerDetails } : null,
      paymentQr: sellerDetails.paymentQr || '',
      qrCodeUrl: 'https://sugarresetblueprint.online/landing-page-541315'
    };

    showView('view-invoice');
  } catch (e) {
    console.error('generateInvoiceForBill error:', e);
    alert('Failed to generate invoice: ' + e.message);
  }
}

/* ---------- Invoice Generation (All Transactions - Legacy) ---------- */
function generateInvoice(phone) {
  try {
    console.log('generateInvoice called for:', phone);
    const c = customers.find(x => x.phone === phone);
    if (!c) { console.error('Customer not found:', phone); return; }

    const txs = transactions
      .filter(t => t.customerPhone === phone)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const credits = txs.filter(t => t.type === 'credit');
    const payments = txs.filter(t => t.type === 'payment');

    const totalCredit = credits.reduce((sum, t) => sum + t.amount, 0);
    const totalPayment = payments.reduce((sum, t) => sum + t.amount, 0);
    const outstanding = totalCredit - totalPayment;

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const now = new Date();
    const dateTime = now.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const invoiceNo = 'INV-' + phone.slice(-6) + '-' + Date.now().toString(36).toUpperCase();

    // Build credit rows with qty/rate/amount - support multi-item bills
    let creditRows = '';
    for (const tx of credits) {
      if (tx.items && Array.isArray(tx.items) && tx.items.length > 0) {
        // Multi-item bill: show each item as a separate row
        for (const item of tx.items) {
          creditRows += `
            <tr>
              <td>${escapeHtml(tx.date)}</td>
              <td>${escapeHtml(item.product)}</td>
              <td class="qty">${escapeHtml(String(item.qty))}${item.unit ? ' ' + escapeHtml(item.unit) : ''}</td>
              <td class="rate">${t('common.currency')} ${formatMoney2(item.rate)}</td>
              <td class="amount">${t('common.currency')} ${formatMoney2(item.amount)}</td>
            </tr>
          `;
        }
        // Show discount row if applicable
        if (tx.discount > 0) {
          creditRows += `
            <tr style="background:var(--muted);">
              <td colspan="4" style="text-align:right;"><strong>${escapeHtml(tx.note || 'Bill')} - Discount</strong></td>
              <td class="amount" style="color:var(--destructive);"><strong>-${t('common.currency')} ${formatMoney2(tx.discount)}</strong></td>
            </tr>
          `;
        }
      } else {
        // Legacy single-item entry
        creditRows += `
          <tr>
            <td>${escapeHtml(tx.date)}</td>
            <td>${escapeHtml(tx.note || t('invoice.no_credit_entries'))}</td>
            <td class="qty">1</td>
            <td class="rate">${t('common.currency')} ${formatMoney2(tx.amount)}</td>
            <td class="amount">${t('common.currency')} ${formatMoney2(tx.amount)}</td>
          </tr>
        `;
      }
    }

    // Build payment rows
    const paymentRows = payments.map(tx => `
      <tr>
        <td>${escapeHtml(tx.date)}</td>
        <td>${escapeHtml(tx.note || t('invoice.no_payment_entries'))}</td>
        <td class="amount" style="color:var(--success);">${t('common.currency')} ${formatMoney2(tx.amount)}</td>
        <td class="amount" style="color:var(--success);">${t('payment_mode.' + (tx.paymentMode || 'cash').toLowerCase()) || tx.paymentMode || 'Cash'}</td>
      </tr>
    `).join('');

    // Seller details
    const paymentQrHtml = sellerDetails.paymentQr ? `
      <div class="invoice-qr" style="margin-bottom:16px;">
        <img src="${sellerDetails.paymentQr}" style="width:120px;height:120px;border:1px solid var(--border);border-radius:8px;background:#fff;" alt="Payment QR">
        <div class="invoice-qr-text" style="font-size:12px;margin-top:6px;">Scan to Pay</div>
      </div>
    ` : '';

    const sellerHtml = hasSellerDetails() ? `
      <div class="invoice-seller">
        <div class="invoice-seller-name">${escapeHtml(sellerDetails.ownerName)}</div>
        ${sellerDetails.shopName ? `<div class="invoice-seller-shop">${escapeHtml(sellerDetails.shopName)}</div>` : ''}
        ${sellerDetails.address ? `<div class="invoice-seller-address">${escapeHtml(sellerDetails.address)}</div>` : ''}
      </div>
    ` : `<div class="invoice-seller-empty"><p>${t('seller_details.not_set')}</p></div>`;

    // QR code for landing page - combined horizontal layout
    const qrCodeUrl = 'https://sugarresetblueprint.online/landing-page-541315';
    const qrHtml = `
      <div class="invoice-qr-row">
        ${sellerDetails.paymentQr ? `
        <div class="invoice-qr-col">
          <img src="${sellerDetails.paymentQr}" class="invoice-qr-img" alt="Payment QR">
          <div class="invoice-qr-text" data-i18n="invoice.scan_pay">SCAN TO PAY</div>
          <div class="invoice-qr-sub" data-i18n="invoice.scan_pay_sub">Scan to pay your bill.</div>
        </div>
        ` : '<div class="invoice-qr-col invoice-qr-empty"></div>'}
        <div class="invoice-qr-col">
          <div id="invoice-qr-code" class="invoice-qr-img-placeholder"></div>
          <div class="invoice-qr-text" data-i18n="invoice.scan_gift">${t('invoice.scan_gift')}</div>
          <div class="invoice-qr-sub" data-i18n="invoice.scan_gift_sub">${t('invoice.scan_gift_sub')}</div>
        </div>
      </div>
    `;

    const invoiceHtml = `
      ${sellerHtml}
      <div class="invoice-header">
        <h1 class="brand">Hisaab</h1>
        <p class="doc-title" data-i18n="invoice.title">${t('invoice.title')}</p>
        <p class="doc-subtitle" data-i18n="invoice.subtitle">${t('invoice.subtitle')}</p>
      </div>

      <div class="invoice-meta">
        <div class="row"><span class="label" data-i18n="invoice.invoice_no">${t('invoice.invoice_no')}</span><span>${invoiceNo}</span></div>
        <div class="row"><span class="label" data-i18n="invoice.date">${t('invoice.date')}</span><span>${dateTime}</span></div>
        <div class="row"><span class="label" data-i18n="invoice.customer">${t('invoice.customer')}</span><span>${escapeHtml(c.name)}</span></div>
        <div class="row"><span class="label" data-i18n="invoice.mobile">${t('invoice.mobile')}</span><span>${formatPhoneDisplay(c.phone)}</span></div>
      </div>

      <div class="section-title" data-i18n="invoice.items">${t('invoice.items')}</div>
      <table class="invoice-table">
        <thead>
          <tr>
            <th data-i18n="invoice.date_col">${t('invoice.date_col')}</th>
            <th data-i18n="invoice.description_col">${t('invoice.description_col')}</th>
            <th class="qty" data-i18n="invoice.qty_col">${t('invoice.qty_col')}</th>
            <th class="rate" data-i18n="invoice.rate_col">${t('invoice.rate_col')}</th>
            <th class="amount" data-i18n="invoice.amount_col">${t('invoice.amount_col')}</th>
          </tr>
        </thead>
        <tbody>
          ${creditRows || `<tr><td colspan="5" style="text-align:center;color:var(--muted);">${t('invoice.no_credit_entries')}</td></tr>`}
        </tbody>
      </table>

      ${payments.length > 0 ? `
      <div class="section-title" data-i18n="invoice.payments">${t('invoice.payments')}</div>
      <table class="invoice-table">
        <thead>
          <tr>
            <th data-i18n="invoice.date_col">${t('invoice.date_col')}</th>
            <th data-i18n="invoice.description_col">${t('invoice.description_col')}</th>
            <th class="amount" data-i18n="invoice.amount_col">${t('invoice.amount_col')}</th>
            <th data-i18n="invoice.payment_mode">${t('invoice.payment_mode')}</th>
          </tr>
        </thead>
        <tbody>${paymentRows}</tbody>
      </table>` : ''}

      <div class="invoice-totals">
        <div class="invoice-total-row"><span data-i18n="invoice.total_purchases">${t('invoice.total_purchases')}</span><span>${t('common.currency')} ${formatMoney2(totalCredit)}</span></div>
        <div class="invoice-total-row"><span data-i18n="invoice.total_payments">${t('invoice.total_payments')}</span><span>${t('common.currency')} ${formatMoney2(totalPayment)}</span></div>
        <div class="invoice-total-row final"><span data-i18n="invoice.outstanding_balance">${t('invoice.outstanding_balance')}</span><span>${outstanding < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(Math.abs(outstanding))}</span></div>
      </div>

      ${paymentQrHtml}

      ${qrHtml}

      <div class="invoice-footer">
        <p data-i18n="invoice.thank_you">${t('invoice.thank_you')}</p>
        <p data-i18n="invoice.generated_by">${t('invoice.generated_by')} \u2022 ${today}</p>
      </div>
    `;

    document.getElementById('invoice-content').innerHTML = invoiceHtml;
    document.getElementById('invoice-title').textContent = t('invoice.title');
    document.getElementById('invoice-sub').textContent = `${escapeHtml(c.name)} \u2022 ${formatPhoneDisplay(c.phone)}`;

    // Generate QR code
    setTimeout(() => {
      const qrDiv = document.getElementById('invoice-qr-code');
      if (qrDiv && window.QRCode) {
        qrDiv.innerHTML = '';
        new QRCode(qrDiv, {
          text: qrCodeUrl,
          width: 140,
          height: 140,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }, 0);

    console.log('Invoice generated, showing view');

    // Store invoice data for WhatsApp sharing
    lastInvoicePhone = phone;
    // Collect all items from all credit transactions
    const allItems = [];
    for (const tx of credits) {
      if (tx.items && Array.isArray(tx.items) && tx.items.length > 0) {
        allItems.push(...tx.items);
      } else {
        allItems.push({
          product: tx.note || 'Goods',
          qty: 1,
          unit: '',
          rate: tx.amount,
          amount: tx.amount
        });
      }
    }
    lastInvoiceData = {
      customer: c,
      invoiceNo: invoiceNo,
      invoiceDate: dateTime,
      dateTime: dateTime,
      items: allItems,
      subtotal: totalCredit,
      discount: 0,
      grandTotal: totalCredit,
      totalPayment: totalPayment,
      outstanding: outstanding,
      sellerDetails: hasSellerDetails() ? { ...sellerDetails } : null,
      paymentQr: sellerDetails.paymentQr || '',
      qrCodeUrl: 'https://sugarresetblueprint.online/landing-page-541315'
    };

    showView('view-invoice');
  } catch (e) {
    console.error('generateInvoice error:', e);
    alert('Failed to generate invoice: ' + e.message);
  }
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
      ${hasSellerDetails() ? `<div class="receipt-seller"><div class="receipt-seller-name">${escapeHtml(sellerDetails.ownerName)}</div>${sellerDetails.shopName ? `<div class="receipt-seller-shop">${escapeHtml(sellerDetails.shopName)}</div>` : ''}</div>` : `<div class="receipt-seller-empty"><p>${t('seller_details.not_set')}</p></div>`}
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
          <td class="amount">${t('common.currency')} ${formatMoney2(r.amount)}</td>
        </tr>
      </tbody>
    </table>
    <div class="receipt-totals">
      <div class="receipt-total-row"><span>Previous Balance:</span><span class="amount">${r.previousBalance < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(r.previousBalance)}</span></div>
      <div class="receipt-total-row"><span>Amount Paid:</span><span class="amount">${t('common.currency')} ${formatMoney2(r.amount)}</span></div>
      <div class="receipt-total-row final"><span>Remaining Balance:</span><span class="amount">${r.remainingBalance < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(r.remainingBalance)}</span></div>
    </div>
    <div class="receipt-footer">
      <p>Thank you for your payment!</p>
      ${hasSellerDetails() ? `<p class="receipt-footer-seller">${escapeHtml(sellerDetails.ownerName)}${sellerDetails.shopName ? ' \u2022 ' + escapeHtml(sellerDetails.shopName) : ''}</p>` : `<p class="receipt-footer-seller-empty">${t('seller_details.not_set')}</p>`}
      <p>Generated by Hisaab Digital Ledger \u2022 ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
  </div>
  `;
  document.getElementById('receipt-content').innerHTML = html;
  showView('view-receipt');
}

function createReceiptFromTransaction(transactionId) {
  const tx = transactions.find(x => x.id === transactionId);
  if (!tx || tx.type !== 'payment') return null;
  const c = customers.find(x => x.phone === tx.customerPhone);
  if (!c) return null;

  const previousBalance = balanceBefore(tx.customerPhone, tx.id);
  const remainingBalance = balanceThrough(tx.customerPhone, tx.id);

  const receipt = {
    receiptNo: nextReceiptNo(),
    customerPhone: tx.customerPhone,
    customerName: c.name,
    amount: tx.amount,
    paymentMode: tx.paymentMode || 'Cash',
    note: tx.note || 'Payment received',
    date: tx.date,
    previousBalance,
    remainingBalance,
    transactionId: tx.id,
    timestamp: new Date().toISOString()
  };
  receipts.push(receipt);
  saveReceipts();
  lastReceiptNo = receipt.receiptNo;
  return receipt;
}

function generateReceiptFromTransaction(transactionId) {
  const tx = transactions.find(x => x.id === transactionId);
  if (!tx) { alert('Transaction not found.'); return; }
  if (tx.type !== 'payment') { alert('Receipts are only generated for payment transactions.'); return; }
  const c = customers.find(x => x.phone === tx.customerPhone);
  if (!c) { alert('Customer not found.'); return; }
  const receipt = createReceiptFromTransaction(transactionId);
  if (receipt) openViewReceipt(receipt.receiptNo);
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
    case 'this_month': { const d = new Date(now.getFullYear(), now.getMonth(), 1); return d; }
    case 'prev_month': { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d; }
    case 'this_year': { const d = new Date(now.getFullYear(), 0, 1); return d; }
    case 'prev_year': { const d = new Date(now.getFullYear() - 1, 0, 1); return d; }
    case '30d': { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    case '3m': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }
    case '6m': { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; }
    default: return null;
  }
}

function filterEndDate(filter) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  switch (filter) {
    case 'this_month': { const d = new Date(now.getFullYear(), now.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); return d; }
    case 'prev_month': { const d = new Date(now.getFullYear(), now.getMonth(), 0); d.setHours(23, 59, 59, 999); return d; }
    case 'this_year': { const d = new Date(now.getFullYear(), 11, 31); d.setHours(23, 59, 59, 999); return d; }
    case 'prev_year': { const d = new Date(now.getFullYear() - 1, 11, 31); d.setHours(23, 59, 59, 999); return d; }
    case '30d': return now;
    case '3m': return now;
    case '6m': return now;
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
  const end = filterEndDate(statementFilter);
  const customFrom = statementCustomFrom ? new Date(statementCustomFrom + 'T00:00:00') : null;
  const customTo = statementCustomTo ? new Date(statementCustomTo + 'T23:59:59') : null;

  const allTxs = transactions
    .filter(t => t.customerPhone === statementPhone)
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.id.localeCompare(b.id));

  let openingBalance = 0;
  const windowStart = statementFilter === 'custom' ? customFrom : start;
  const windowEnd = statementFilter === 'custom' ? customTo : end;
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
      if (windowEnd && td > windowEnd) return false;
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
    <div class="sum-box"><div class="sum-label">Opening Balance</div><div class="sum-value">${openingBalance < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(openingBalance)}</div></div>
    <div class="sum-box"><div class="sum-label">Total Credit</div><div class="sum-value credit">${t('common.currency')} ${formatMoney2(totalCredit)}</div></div>
    <div class="sum-box"><div class="sum-label">Total Payments</div><div class="sum-value payment">${t('common.currency')} ${formatMoney2(totalPayment)}</div></div>
    <div class="sum-box"><div class="sum-label">Closing Balance</div><div class="sum-value balance">${closingBalance < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(closingBalance)}</div></div>
  `;

  let sellerHeader = '';
  let statementPaymentQrHtml = '';
  if (hasSellerDetails()) {
    sellerHeader = `
      <div class="statement-seller-header" style="margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--primary);">
        <div class="statement-seller-name" style="font-size:1.15rem;font-weight:800;color:var(--text);">${escapeHtml(sellerDetails.ownerName)}</div>
        ${sellerDetails.shopName ? `<div class="statement-seller-shop" style="font-size:0.95rem;color:var(--muted);margin-top:2px;">${escapeHtml(sellerDetails.shopName)}</div>` : ''}
      </div>`;
    if (sellerDetails.paymentQr) {
      statementPaymentQrHtml = `
        <div class="invoice-qr" style="margin-top:20px;text-align:center;">
          <img src="${sellerDetails.paymentQr}" style="width:120px;height:120px;border:1px solid var(--border);border-radius:8px;background:#fff;" alt="Payment QR">
          <div class="invoice-qr-text" style="font-size:12px;margin-top:6px;">Scan to Pay</div>
        </div>
      `;
    }
  } else {
    sellerHeader = `<div class="statement-seller-empty" style="margin-bottom:14px;color:var(--muted);font-size:0.9rem;">${t('seller_details.not_set')}</div>`;
  }

  let tableHtml = `
    ${sellerHeader}
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
          <td class="amount">${r.credit !== '' ? t('common.currency') + ' ' + formatMoney2(r.credit) : '\u2014'}</td>
          <td class="amount">${r.payment !== '' ? t('common.currency') + ' ' + formatMoney2(r.payment) : '\u2014'}</td>
          <td class="amount running-balance">${r.balance < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(r.balance)}</td>
        </tr>
      `;
    }
  }
  tableHtml += `
      <tr style="font-weight:800;border-top:2px solid var(--border);">
        <td colspan="2">Closing Balance</td>
        <td class="amount">${t('common.currency')} ${formatMoney2(totalCredit)}</td>
        <td class="amount">${t('common.currency')} ${formatMoney2(totalPayment)}</td>
        <td class="amount">${closingBalance < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(closingBalance)}</td>
      </tr>
      </tbody>
    </table>
  `;

  // Add landing page QR code
  const qrCodeUrl = 'https://sugarresetblueprint.online/landing-page-541315';
  const qrHtml = `
    <div class="invoice-qr" style="margin-top:20px;">
      <div id="statement-qr-code"></div>
      <div class="invoice-qr-text" data-i18n="invoice.scan_gift">${t('invoice.scan_gift')}</div>
      <div class="invoice-qr-sub" data-i18n="invoice.scan_gift_sub">${t('invoice.scan_gift_sub')}</div>
    </div>
  `;

  document.getElementById('statement-content').innerHTML = tableHtml + statementPaymentQrHtml + qrHtml;

  // Generate QR code
  setTimeout(() => {
    const qrDiv = document.getElementById('statement-qr-code');
    if (qrDiv && window.QRCode) {
      qrDiv.innerHTML = '';
      new QRCode(qrDiv, {
        text: qrCodeUrl,
        width: 120,
        height: 120,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }, 0);
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
    paymentMode: type === 'payment' ? document.getElementById('entry-payment-mode').value : '',
    invoiceNo: type === 'credit' ? ('INV-' + currentPhone.slice(-6) + '-' + Date.now().toString(36).toUpperCase()) : ''
  };

  const fileInput = document.getElementById('shot-input');
  const file = fileInput.files[0];
  const preview = document.getElementById('shot-preview');
  const receiptActions = document.getElementById('receipt-actions');

  const showMessage = (text, kind) => {
    const el = document.getElementById('ledger-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'msg ' + (kind === 'error' ? 'error' : 'ok');
    el.style.display = text ? 'block' : 'none';
  };

  const finish = () => {
    try {
      transactions.push(entry);
      saveState();
      /* Module 4: after saving a payment, generate a unique receipt and offer it
         without navigating away so the seller can keep adding entries. */
      if (type === 'payment') {
        receiptActions.style.display = 'flex';
        createReceiptFromTransaction(entry.id);
      }
      showMessage('Entry saved successfully.', 'ok');
    } catch (err) {
      showMessage('Save failed: ' + (err && err.message ? err.message : String(err)), 'error');
      console.error('Entry save failed:', err);
      return;
    }
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
      shots: JSON.parse(JSON.stringify(shots)),
      products: JSON.parse(JSON.stringify(products)),
      batches: JSON.parse(JSON.stringify(batches)),
      purchases: JSON.parse(JSON.stringify(purchases)),
      stockMovements: JSON.parse(JSON.stringify(stockMovements)),
      suppliers: JSON.parse(JSON.stringify(suppliers))
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
  info.textContent = `Backup downloaded: ${backup.data.customers.length} customer(s), ${backup.data.transactions.length} transaction(s), ${Object.keys(backup.data.shots).length} screenshot(s), ${backup.data.products.length} product(s), ${backup.data.purchases.length} purchase(s), ${backup.data.suppliers.length} supplier(s).`;
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

  const { customers: bCustomers, transactions: bTransactions, shots: bShots, products: bProducts, batches: bBatches, purchases: bPurchases, stockMovements: bStockMovements, suppliers: bSuppliers } = parsed.data;

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

  // Inventory validation (optional - not required for backward compatibility)
  if (bProducts !== undefined && !Array.isArray(bProducts)) {
    errors.push('"products" must be an array.');
  }
  if (bBatches !== undefined && !Array.isArray(bBatches)) {
    errors.push('"batches" must be an array.');
  }
  if (bPurchases !== undefined && !Array.isArray(bPurchases)) {
    errors.push('"purchases" must be an array.');
  }
  if (bStockMovements !== undefined && !Array.isArray(bStockMovements)) {
    errors.push('"stockMovements" must be an array.');
  }
  if (bSuppliers !== undefined && !Array.isArray(bSuppliers)) {
    errors.push('"suppliers" must be an array.');
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

  const { customers: bCustomers, transactions: bTransactions, shots: bShots, products: bProducts, batches: bBatches, purchases: bPurchases, stockMovements: bStockMovements, suppliers: bSuppliers } = validation.data;

  const existingCustomerPhones = new Set(customers.map(c => c.phone));
  const newCustomers = bCustomers.filter(c => !existingCustomerPhones.has(c.phone));
  const duplicateCustomers = bCustomers.filter(c => existingCustomerPhones.has(c.phone));

  // Inventory counts for preview
  const bProductsCount = bProducts ? bProducts.length : 0;
  const bPurchasesCount = bPurchases ? bPurchases.length : 0;
  const bSuppliersCount = bSuppliers ? bSuppliers.length : 0;
  const bStockMovementsCount = bStockMovements ? bStockMovements.length : 0;

  const existingProductsCount = products.length;
  const existingPurchasesCount = purchases.length;
  const existingSuppliersCount = suppliers.length;
  const existingStockMovementsCount = stockMovements.length;

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
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Products in backup</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${bProductsCount}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Purchases in backup</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${bPurchasesCount}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Suppliers in backup</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${bSuppliersCount}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Stock movements in backup</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${bStockMovementsCount}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">New customers (will be added)</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${newCustomers.length}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Duplicate customers (skipped on merge)</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${duplicateCustomers.length}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Existing customers in app</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${customers.length}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Existing transactions in app</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${transactions.length}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Existing products in app</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${existingProductsCount}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Existing purchases in app</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${existingPurchasesCount}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Existing suppliers in app</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${existingSuppliersCount}</strong></td></tr>
      <tr><td style="border-bottom:1px solid var(--border);padding:6px;">Existing stock movements in app</td><td style="border-bottom:1px solid var(--border);padding:6px;"><strong>${existingStockMovementsCount}</strong></td></tr>
    </table>
  `;

  actions.innerHTML = `
    <button id="restore-merge" class="btn">Merge (skip duplicate phones)</button>
    <button id="restore-replace" class="btn btn-danger">Replace all existing data</button>
  `;
  actions.style.display = 'flex';

  document.getElementById('restore-merge').addEventListener('click', function () {
    if (!confirm(`Merge ${newCustomers.length} new customer(s), ${bTransactions.length} transaction(s), ${bProductsCount} product(s), ${bPurchasesCount} purchase(s), ${bSuppliersCount} supplier(s)? Duplicate phone numbers will be skipped. Existing data will be preserved.`)) return;
    performRestore(validation.data, 'merge');
  });

  document.getElementById('restore-replace').addEventListener('click', function () {
    if (!confirm(`WARNING: This will REPLACE all existing customers, transactions, screenshots, products, purchases, suppliers, and stock movements. This cannot be undone. Are you sure?`)) return;
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
    products = backupData.products ? backupData.products.map(p => ({ ...p })) : [];
    batches = backupData.batches ? backupData.batches.map(b => ({ ...b })) : [];
    purchases = backupData.purchases ? backupData.purchases.map(p => ({ ...p })) : [];
    stockMovements = backupData.stockMovements ? backupData.stockMovements.map(m => ({ ...m })) : [];
    suppliers = backupData.suppliers ? backupData.suppliers.map(s => ({ ...s })) : [];
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
    // Merge inventory data (append only, no deduplication by ID to avoid conflicts)
    if (backupData.products) {
      products.push(...backupData.products.map(p => ({ ...p })));
    }
    if (backupData.batches) {
      batches.push(...backupData.batches.map(b => ({ ...b })));
    }
    if (backupData.purchases) {
      purchases.push(...backupData.purchases.map(p => ({ ...p })));
    }
    if (backupData.stockMovements) {
      stockMovements.push(...backupData.stockMovements.map(m => ({ ...m })));
    }
    if (backupData.suppliers) {
      suppliers.push(...backupData.suppliers.map(s => ({ ...s })));
    }
  }

  saveState();
  renderHome();
  showView('view-home');

  const result = document.getElementById('restore-result');
  result.textContent = `Restore complete (${mode}): ${customers.length} customer(s), ${transactions.length} transaction(s), ${Object.keys(shots).length} screenshot(s), ${products.length} product(s), ${purchases.length} purchase(s), ${suppliers.length} supplier(s), ${stockMovements.length} stock movement(s).`;
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

/* Invoice button on ledger */
let lastInvoicePhone = null;
let lastInvoiceData = null;

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
  const receiptHtml = document.getElementById('receipt-content').innerHTML;
  const paymentQr = sellerDetails.paymentQr || '';
  
  let qrHtml = '';
  if (paymentQr) {
    qrHtml = `
      <div class="invoice-qr" style="margin-top:20px;text-align:center;">
        <img src="${paymentQr}" style="width:120px;height:120px;border:1px solid var(--border);border-radius:4px;background:#fff;" alt="Payment QR">
        <div class="invoice-qr-text" style="font-size:10pt;font-weight:700;margin-top:6px;color:var(--text);">SCAN TO PAY</div>
      </div>
    `;
  }
  
  win.document.write('<html><head><meta charset="UTF-8"><title>Receipt</title><link rel="stylesheet" href="style.css"><style>body{margin:0;padding:20mm 15mm;font-size:11pt;line-height:1.4;color:#000;background:#fff;} .no-print{display:none !important;} .receipt-header-actions,.btn,.nav-link{display:none !important;}</style></head><body>' + receiptHtml + qrHtml + '<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}};</script></body></html>');
  win.document.close();
});
document.getElementById('share-receipt-wa-btn').addEventListener('click', function () {
  if (!lastReceiptNo) return;
  const r = receipts.find(x => x.receiptNo === lastReceiptNo);
  if (!r) return;
  const c = customers.find(x => x.phone === r.customerPhone);
  const dateTime = new Date(r.date).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const msg = `HISAAB Payment Receipt\n\n${hasSellerDetails() ? sellerDetails.ownerName + (sellerDetails.shopName ? ' \u2022 ' + sellerDetails.shopName : '') + '\n' : ''}Receipt No: ${r.receiptNo}\nDate & Time: ${dateTime}\nCustomer: ${escapeHtml(c ? c.name : r.customerName)}\nMobile: ${formatPhoneDisplay(r.customerPhone)}\nPayment Mode: ${r.paymentMode}\nAmount Received: ${t('common.currency')} ${formatMoney2(r.amount)}\nPrevious Balance: ${r.previousBalance < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(r.previousBalance)}\nRemaining Balance: ${r.remainingBalance < 0 ? '-' : ''}${t('common.currency')} ${formatMoney2(r.remainingBalance)}\n\nGenerated by Hisaab Digital Ledger`;
  location.href = buildWhatsAppUrl(r.customerPhone, msg);
});
document.getElementById('receipt-back').addEventListener('click', function (e) {
  e.preventDefault();
  location.hash = '#view-home';
});

/* Statement page actions */
document.getElementById('print-statement-btn').addEventListener('click', function () { window.print(); });
document.getElementById('download-statement-btn').addEventListener('click', function() {
  const win = window.open('', '_blank', 'width=900,height=900');
  if (!win) { window.print(); return; }
  const statementHtml = document.getElementById('statement-content').innerHTML;
  const qrCodeUrl = 'https://sugarresetblueprint.online/landing-page-541315';
  const paymentQr = sellerDetails.paymentQr || '';
  
  let qrHtml = '';
  if (paymentQr) {
    qrHtml += `
      <div class="invoice-qr" style="margin-top:20px;text-align:center;">
        <img src="${paymentQr}" style="width:120px;height:120px;border:1px solid var(--border);border-radius:4px;background:#fff;" alt="Payment QR">
        <div class="invoice-qr-text" style="font-size:10pt;font-weight:700;margin-top:6px;color:var(--text);">SCAN TO PAY</div>
      </div>
    `;
  }
  qrHtml += `
    <div class="invoice-qr" style="margin-top:20px;text-align:center;">
      <div id="statement-download-qr"></div>
      <div class="invoice-qr-text" data-i18n="invoice.scan_gift">${t('invoice.scan_gift')}</div>
      <div class="invoice-qr-sub" data-i18n="invoice.scan_gift_sub">${t('invoice.scan_gift_sub')}</div>
    </div>
  `;
  
  win.document.write('<html><head><meta charset="UTF-8"><title>Statement</title><link rel="stylesheet" href="style.css"><style>body{margin:0;padding:20mm 15mm;font-size:10pt;line-height:1.4;color:#000;background:#fff;} .no-print{display:none !important;} .statement-header-actions,.statement-filters,.btn,.nav-link{display:none !important;}</style></head><body>' + statementHtml + qrHtml + '<div style="margin-top:20px;font-size:12px;color:var(--muted);">Generated by Hisaab Digital Ledger ' + new Date().toLocaleDateString('en-IN') + '</div><script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script><script>window.onload=function(){if(window.QRCode){new QRCode(document.getElementById("statement-download-qr"),{text:"https://sugarresetblueprint.online/landing-page-541315",width:120,height:120,colorDark:"#000000",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});}}window.print();window.onafterprint=function(){window.close();};</script></body></html>');
  win.document.close();
});
document.getElementById('share-statement-wa-btn').addEventListener('click', function () {
  if (!statementPhone) return;
  const c = customers.find(x => x.phone === statementPhone);
  const msg = `HISAAB Account Statement\n\n${hasSellerDetails() ? sellerDetails.ownerName + (sellerDetails.shopName ? ' \u2022 ' + sellerDetails.shopName : '') + '\n' : ''}Customer: ${escapeHtml(c ? c.name : '')}\nMobile: ${formatPhoneDisplay(statementPhone)}\nStatement generated: ${new Date().toLocaleString('en-IN')}\n\n${t('invoice.scan_gift')}: https://sugarresetblueprint.online/landing-page-541315\n\nGenerated by Hisaab Digital Ledger`;
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
  location.hash = '#view-home';
});

/* Invoice page actions */
const printInvoiceBtn = document.getElementById('print-invoice-btn');
if (printInvoiceBtn) printInvoiceBtn.addEventListener('click', function () { window.print(); });

const downloadInvoiceBtn = document.getElementById('download-invoice-btn');
if (downloadInvoiceBtn) downloadInvoiceBtn.addEventListener('click', function() {
  /* Client-side PDF: print dialog offers "Save as PDF". */
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) { window.print(); return; }
  
  // Get the invoice content and QR code data URLs
  const invoiceContent = document.getElementById('invoice-content').innerHTML;
  const qrCodeUrl = 'https://sugarresetblueprint.online/landing-page-541315';
  const paymentQr = sellerDetails.paymentQr || '';
  
  // Build QR HTML with actual QR images
  let qrHtml = '';
  if (paymentQr) {
    qrHtml += `
      <div class="invoice-qr" style="margin-bottom:16px;text-align:center;">
        <img src="${paymentQr}" style="width:110px;height:110px;border:1px solid var(--border);border-radius:4px;background:#fff;" alt="Payment QR">
        <div class="invoice-qr-text" style="font-size:9pt;font-weight:700;margin-top:6px;color:var(--text);">SCAN TO PAY</div>
      </div>
    `;
  }
  qrHtml += `
    <div class="invoice-qr" style="text-align:center;">
      <div id="download-qr-code" style="width:110px;height:110px;margin:0 auto;"></div>
      <div class="invoice-qr-text" style="font-size:9pt;font-weight:700;margin-top:6px;color:var(--text);" data-i18n="invoice.scan_gift">${t('invoice.scan_gift')}</div>
      <div class="invoice-qr-sub" style="font-size:8pt;color:var(--muted);margin-top:2px;" data-i18n="invoice.scan_gift_sub">${t('invoice.scan_gift_sub')}</div>
    </div>
  `;
  
  const html = '<html><head><meta charset="UTF-8"><title>Invoice</title><link rel="stylesheet" href="style.css"><style>body{margin:0;padding:20mm 15mm;font-size:11pt;line-height:1.4;color:#000;background:#fff;} .no-print{display:none !important;} .invoice-header-actions,.invoice-actions,.btn,.nav-link{display:none !important;}</style></head><body>' + invoiceContent + qrHtml + '<div style="margin-top:20px;font-size:12px;color:var(--muted);">Generated by Hisaab Digital Shop Ledger ' + new Date().toLocaleDateString('en-IN') + '</div><script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script><script>window.onload=function(){if(window.QRCode){new QRCode(document.getElementById("download-qr-code"),{text:"' + qrCodeUrl + '",width:110,height:110,colorDark:"#000000",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});}}window.print();window.onafterprint=function(){window.close();};</script></body></html>';
  
  win.document.write(html);
  win.document.close();
});

const shareInvoiceWaBtn = document.getElementById('share-invoice-wa-btn');
if (shareInvoiceWaBtn) shareInvoiceWaBtn.addEventListener('click', function () {
  if (!lastInvoiceData) {
    alert('No invoice data available. Please generate an invoice first.');
    return;
  }

  const data = lastInvoiceData;
  const c = data.customer;
  if (!c) return;

  // Trigger PDF download first
  const downloadInvoiceBtn = document.getElementById('download-invoice-btn');
  if (downloadInvoiceBtn) {
    downloadInvoiceBtn.click();
  }

  // Build WhatsApp message in the required format
  const sellerName = data.sellerDetails ? data.sellerDetails.ownerName : '';
  const shopName = data.sellerDetails ? data.sellerDetails.shopName : '';
  const header = [sellerName, shopName].filter(Boolean).join(' \u2022 ');

  const itemsList = data.items.map(item => {
    const name = escapeHtml(item.product);
    const qty = escapeHtml(String(item.qty));
    const unit = item.unit ? ' ' + escapeHtml(item.unit) : '';
    const rate = formatMoney2(item.rate);
    const amount = formatMoney2(item.amount);
    return `${name} (${qty}${unit} \u00d7 \u20b9${rate}) = \u20b9${amount}`;
  }).join('\n');

  const msg = `Namaste ${escapeHtml(c.name)} ji,\n\nPlease find your invoice attached.\n\nInvoice No: ${data.invoiceNo}\nInvoice Date: ${data.invoiceDate}\nGrand Total: \u20b9${formatMoney2(data.grandTotal)}\nAmount Paid: \u20b9${formatMoney2(data.totalPayment)}\nRemaining Balance: \u20b9${formatMoney2(Math.abs(data.outstanding))}\n\n${itemsList ? 'Items:\n' + itemsList + '\n\n' : ''}Thank you for your business!\n${header ? header + '\n' : ''}HISAAB`;

  // Open WhatsApp with the correct phone number and prefilled message
  const waUrl = buildWhatsAppUrl(c.phone, msg);
  location.href = waUrl;
});

const invoiceBackBtn = document.getElementById('invoice-back');
if (invoiceBackBtn) invoiceBackBtn.addEventListener('click', function (e) {
  e.preventDefault();
  location.hash = '#view-home';
});

/* ---------- Language switcher (open picker again) ---------- */
document.getElementById('lang-switcher').addEventListener('click', function () {
  document.getElementById('lang-picker').style.display = 'flex';
});

/* ---------- Language picker: apply choice and boot app ---------- */
var appBooted = false;
function bootApp() {
  loadState();
  route();
  appBooted = true;
}
function chooseLanguage(lang) {
  const picker = document.getElementById('lang-picker');
  if (picker) picker.style.display = 'none';
  try {
    setLanguage(lang);
  } catch (e) {
    console.error('Language set failed:', e);
  }
  if (typeof appBooted !== 'undefined' && !appBooted) bootApp();
}

/* Language picker button clicks (individual + event delegation fallback). */
document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    const lang = this.getAttribute('data-lang');
    if (lang) chooseLanguage(lang);
  });
});

const pickerEl = document.getElementById('lang-picker');
if (pickerEl) {
  pickerEl.addEventListener('click', function (e) {
    const btn = e.target.closest('.lang-btn');
    if (btn) {
      e.preventDefault();
      const lang = btn.getAttribute('data-lang');
      if (lang) chooseLanguage(lang);
    }
  });
}

/* Change Language nav item: reopen the picker. */
const navChangeLang = document.getElementById('nav-change-language');
if (navChangeLang) {
  navChangeLang.addEventListener('click', function (e) {
    e.preventDefault();
    const picker = document.getElementById('lang-picker');
    if (picker) picker.style.display = 'flex';
  });
}

/* ---------- Seller / Shop Details form handler ---------- */
const sellerDetailsForm = document.getElementById('seller-details-form');
const sellerOwnerName = document.getElementById('seller-owner-name');
const sellerShopName = document.getElementById('seller-shop-name');
const sellerMobile = document.getElementById('seller-mobile');
const sellerUpiId = document.getElementById('seller-upi-id');
const sellerPaymentQrInput = document.getElementById('seller-payment-qr-input');
const sellerPaymentQrPreview = document.getElementById('seller-payment-qr-preview');
const sellerAddress = document.getElementById('seller-address');
const sellerError = document.getElementById('seller-error');
const sellerSavedMsg = document.getElementById('seller-saved-msg');
const sellerDetailsTitle = document.getElementById('seller-details-title');
const sellerDetailsSub = document.getElementById('seller-details-sub');

function renderSellerDetailsView() {
  if (!sellerDetailsForm) return;
  sellerOwnerName.value = sellerDetails.ownerName;
  sellerShopName.value = sellerDetails.shopName;
  sellerMobile.value = sellerDetails.mobile;
  sellerUpiId.value = sellerDetails.upiId;
  sellerAddress.value = sellerDetails.address;
  // Render payment QR preview
  if (sellerDetails.paymentQr) {
    sellerPaymentQrPreview.innerHTML = `<img src="${sellerDetails.paymentQr}" style="max-width:150px;border:1px solid var(--border);border-radius:8px;" alt="Payment QR">`;
  } else {
    sellerPaymentQrPreview.innerHTML = '';
  }
  sellerError.textContent = '';
  sellerSavedMsg.style.display = 'none';
  if (sellerDetailsTitle) sellerDetailsTitle.textContent = t('seller_details.title');
  if (sellerDetailsSub) sellerDetailsSub.textContent = hasSellerDetails()
    ? t('seller_details.saved')
    : t('seller_details.not_set');
}

/* ---------- Inventory Render Functions ---------- */

/* Stock Dashboard */
function renderStockDashboard() {
  const grid = document.getElementById('stock-dashboard-grid');
  if (!grid) return;
  
  const totalProducts = products.filter(p => p.status === 'active').length;
  const totalStockUnits = products.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.currentStock || 0), 0);
  const totalPurchaseValue = products.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.currentStock || 0) * (p.purchasePrice || 0), 0);
  const lowStockProducts = getLowStockProducts().length;
  const outOfStockProducts = getOutOfStockProducts().length;
  const expiringProducts = getExpiringProducts(30).length;
  
  // Recent purchases (last 5)
  const recentPurchases = [...purchases].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  // Recent sales (last 5 credit transactions with items)
  const recentSales = transactions
    .filter(t => t.type === 'credit' && t.items && t.items.length > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  // Recent adjustments (last 5)
  const recentAdjustments = [...stockMovements]
    .filter(m => ['adjustment_increase', 'adjustment_decrease'].includes(m.type))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  grid.innerHTML = `
    <div class="dashboard-card">
      <div class="dashboard-label">${t('stock.total_products')}</div>
      <div class="dashboard-value">${totalProducts}</div>
    </div>
    <div class="dashboard-card">
      <div class="dashboard-label">${t('stock.total_stock_units')}</div>
      <div class="dashboard-value">${formatMoney(totalStockUnits)}</div>
    </div>
    <div class="dashboard-card">
      <div class="dashboard-label">${t('stock.total_purchase_value')}</div>
      <div class="dashboard-value">${t('common.currency')} ${formatMoney2(totalPurchaseValue)}</div>
    </div>
    <div class="dashboard-card warning">
      <div class="dashboard-label">${t('stock.low_stock_count')}</div>
      <div class="dashboard-value">${lowStockProducts}</div>
    </div>
    <div class="dashboard-card danger">
      <div class="dashboard-label">${t('stock.out_of_stock_count')}</div>
      <div class="dashboard-value">${outOfStockProducts}</div>
    </div>
    <div class="dashboard-card warning">
      <div class="dashboard-label">${t('stock.expiring_count')}</div>
      <div class="dashboard-value">${expiringProducts}</div>
    </div>
    
    <div class="dashboard-section">
      <h4>${t('stock.recent_purchases')}</h4>
      <div class="recent-list">
        ${recentPurchases.length === 0 
          ? `<p class="hint">${t('stock.no_recent_purchases')}</p>`
          : recentPurchases.map(p => {
              const supplier = getSupplierById(p.supplierId);
              return `<div class="recent-item">
                <span>${escapeHtml(p.invoiceNo || 'N/A')} - ${escapeHtml(supplier ? supplier.name : 'Unknown Supplier')}</span>
                <span>${t('common.currency')} ${formatMoney2(p.grandTotal)}</span>
              </div>`;
            }).join('')
        }
      </div>
    </div>
    
    <div class="dashboard-section">
      <h4>${t('stock.recent_sales')}</h4>
      <div class="recent-list">
        ${recentSales.length === 0
          ? `<p class="hint">${t('stock.no_recent_sales')}</p>`
          : recentSales.map(t => {
              const customer = customers.find(c => c.phone === t.customerPhone);
              return `<div class="recent-item">
                <span>${escapeHtml(t.invoiceNo || 'N/A')} - ${escapeHtml(customer ? customer.name : 'Unknown')}</span>
                <span>${t('common.currency')} ${formatMoney2(t.amount)}</span>
              </div>`;
            }).join('')
        }
      </div>
    </div>
    
    <div class="dashboard-section">
      <h4>${t('stock.recent_adjustments')}</h4>
      <div class="recent-list">
        ${recentAdjustments.length === 0
          ? `<p class="hint">${t('stock.no_recent_adjustments')}</p>`
          : recentAdjustments.map(m => {
              const product = getProductById(m.productId);
              return `<div class="recent-item">
                <span>${escapeHtml(product ? product.name : 'Unknown Product')} (${m.type === 'adjustment_increase' ? '+' : '-'}${formatMoney(m.quantity)})</span>
                <span>${escapeHtml(m.notes || '')}</span>
              </div>`;
            }).join('')
        }
      </div>
    </div>
  `;
}

/* Products List */
function renderProductsList() {
  const list = document.getElementById('products-list');
  const empty = document.getElementById('products-empty');
  const searchInput = document.getElementById('product-search');
  const categoryFilter = document.getElementById('product-category-filter');
  const statusFilter = document.getElementById('product-status-filter');
  
  if (!list) return;
  
  const render = () => {
    const search = (searchInput?.value || '').toLowerCase().trim();
    const category = categoryFilter?.value || '';
    const status = statusFilter?.value || '';
    
    let filtered = products;
    
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        (p.barcode || '').toLowerCase().includes(search)
      );
    }
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    if (filtered.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    
    empty.style.display = 'none';
    list.innerHTML = filtered.map(p => {
      const supplier = p.supplierId ? getSupplierById(p.supplierId) : null;
      const isLowStock = p.currentStock <= p.minStockAlert && p.minStockAlert > 0;
      const isOutOfStock = p.currentStock <= 0;
      const stockClass = isOutOfStock ? 'out-of-stock' : (isLowStock ? 'low-stock' : '');
      
      return `
        <div class="product-card ${stockClass}" data-product-id="${p.id}">
          <div class="product-header">
            <div class="product-name">${escapeHtml(p.name)}</div>
            <div class="product-sku">${escapeHtml(p.sku)}</div>
          </div>
          <div class="product-details">
            <span class="product-category">${t('products.category.' + p.category) || p.category}</span>
            <span class="product-unit">${t('products.unit.' + p.unit) || p.unit}</span>
            <span class="product-status ${p.status}">${t('products.status.' + p.status)}</span>
          </div>
          <div class="product-prices">
            <span>Purchase: ${t('common.currency')} ${formatMoney2(p.purchasePrice)}</span>
            <span>Sell: ${t('common.currency')} ${formatMoney2(p.sellingPrice)}</span>
          </div>
          <div class="product-stock ${stockClass}">
            <span>Stock: ${formatMoney(p.currentStock)} ${t('products.unit.' + p.unit) || p.unit}</span>
            ${isLowStock ? `<span class="stock-alert">${t('products.low_stock_alert')}</span>` : ''}
            ${isOutOfStock ? `<span class="stock-alert danger">${t('products.out_of_stock')}</span>` : ''}
          </div>
          <div class="product-actions">
            <button class="btn btn-sm edit-product" data-id="${p.id}" data-i18n="common.edit">Edit</button>
            <button class="btn btn-sm btn-danger delete-product" data-id="${p.id}" data-i18n="common.delete">Delete</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Wire up edit/delete buttons
    list.querySelectorAll('.edit-product').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.dataset.id;
        editProduct(id);
      };
    });
    list.querySelectorAll('.delete-product').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.dataset.id;
        deleteProduct(id);
      };
    });
  };
  
  // Initial render
  render();
  
  // Event listeners
  if (searchInput) {
    searchInput.oninput = render;
  }
  if (categoryFilter) {
    categoryFilter.onchange = render;
  }
  if (statusFilter) {
    statusFilter.onchange = render;
  }
  
  // Add product button
  const addBtn = document.getElementById('add-product-from-list-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      // Reset form for new product
      document.getElementById('add-product-form').reset();
      document.getElementById('add-product-title').textContent = t('products.add_product');
      document.getElementById('add-product-sub').textContent = t('products.add_sub');
      document.getElementById('add-product-form').dataset.editId = '';
      showView('view-add-product');
    };
  }
}

/* Add/Edit Product View */
function renderAddProductView() {
  const form = document.getElementById('add-product-form');
  const title = document.getElementById('add-product-title');
  const sub = document.getElementById('add-product-sub');
  const categorySelect = document.getElementById('product-category');
  const unitSelect = document.getElementById('product-unit');
  const customUnitField = document.getElementById('custom-unit-field');
  const medicalFields = document.getElementById('medical-fields');
  const supplierSelect = document.getElementById('product-supplier');
  const cancelBtn = document.getElementById('product-cancel-btn');
  const savedMsg = document.getElementById('product-saved-msg');
const errorEl = document.getElementById('product-form-error');
   
  if (!form) return;

  // Handle edit mode - populate form with existing product data
  if (form.dataset.editId) {
    const product = getProductById(form.dataset.editId);
    if (product) {
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-sku').value = product.sku;
      document.getElementById('product-barcode').value = product.barcode || '';
      document.getElementById('product-category').value = product.category;
      document.getElementById('product-brand').value = product.brand || '';
      document.getElementById('product-unit').value = product.unit;
      document.getElementById('product-purchase-price').value = product.purchasePrice;
      document.getElementById('product-selling-price').value = product.sellingPrice;
      document.getElementById('product-current-stock').value = product.currentStock;
      document.getElementById('product-min-stock').value = product.minStockAlert;
      document.getElementById('product-supplier').value = product.supplierId || '';
      document.getElementById('product-status').value = product.status;
      document.getElementById('product-notes').value = product.notes || '';
      
      // Handle medical fields
      if (product.category === 'medical') {
        medicalFields.style.display = 'block';
        document.getElementById('product-batch').required = true;
        document.getElementById('product-expiry').required = true;
        document.getElementById('product-batch').value = product.batchNumber || '';
        document.getElementById('product-expiry').value = product.expiryDate || '';
        document.getElementById('product-manufacturer').value = product.manufacturer || '';
      } else {
        medicalFields.style.display = 'none';
        document.getElementById('product-batch').required = false;
        document.getElementById('product-expiry').required = false;
      }
      
      // Handle custom unit
      const standardUnits = ['pcs', 'kg', 'g', 'ltr', 'ml', 'mtr', 'cm', 'box', 'strip', 'bottle', 'pack', 'dozen'];
      if (!standardUnits.includes(product.unit)) {
        unitSelect.value = 'custom';
        customUnitField.style.display = 'block';
        document.getElementById('product-custom-unit').required = true;
        document.getElementById('product-custom-unit').value = product.unit;
      }
      
      // Update title
      title.textContent = t('products.edit_product') || 'Edit Product';
      sub.textContent = t('products.edit_sub') || 'Modify product details';
    }
  }
  
  // Populate supplier dropdown
  if (supplierSelect) {
    supplierSelect.innerHTML = `<option value="" data-i18n="products.select_supplier">${t('products.select_supplier')}</option>` +
      suppliers.filter(s => s.status !== 'inactive').map(s => 
        `<option value="${s.id}">${escapeHtml(s.name)}</option>`
      ).join('');
  }
  
  // Handle category change - show medical fields for medical products
  if (categorySelect) {
    categorySelect.onchange = () => {
      if (categorySelect.value === 'medical') {
        medicalFields.style.display = 'block';
        // Make batch and expiry required
        document.getElementById('product-batch').required = true;
        document.getElementById('product-expiry').required = true;
      } else {
        medicalFields.style.display = 'none';
        document.getElementById('product-batch').required = false;
        document.getElementById('product-expiry').required = false;
      }
    };
  }
  
  // Handle unit change - show custom unit field
  if (unitSelect) {
    unitSelect.onchange = () => {
      if (unitSelect.value === 'custom') {
        customUnitField.style.display = 'block';
        document.getElementById('product-custom-unit').required = true;
      } else {
        customUnitField.style.display = 'none';
        document.getElementById('product-custom-unit').required = false;
      }
    };
  }
  
  // Cancel button
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      form.reset();
      customUnitField.style.display = 'none';
      medicalFields.style.display = 'none';
      form.dataset.editId = '';
      title.textContent = t('products.add_product');
      sub.textContent = t('products.add_sub');
      errorEl.textContent = '';
      savedMsg.style.display = 'none';
      showView('view-products');
    };
  }
  
  // Form submit
  form.onsubmit = async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    savedMsg.style.display = 'none';
    
    const name = document.getElementById('product-name').value.trim();
    const sku = document.getElementById('product-sku').value.trim().toUpperCase();
    const barcode = document.getElementById('product-barcode').value.trim();
    const category = document.getElementById('product-category').value;
    const brand = document.getElementById('product-brand').value.trim();
    const unit = document.getElementById('product-unit').value;
    const customUnit = document.getElementById('product-custom-unit').value.trim();
    const purchasePrice = parseFloat(document.getElementById('product-purchase-price').value);
    const sellingPrice = parseFloat(document.getElementById('product-selling-price').value);
    const currentStock = parseFloat(document.getElementById('product-current-stock').value) || 0;
    const minStock = parseFloat(document.getElementById('product-min-stock').value) || 0;
    const batchNumber = document.getElementById('product-batch').value.trim();
    const expiryDate = document.getElementById('product-expiry').value;
    const manufacturer = document.getElementById('product-manufacturer').value.trim();
    const supplierId = document.getElementById('product-supplier').value || null;
    const status = document.getElementById('product-status').value;
    const notes = document.getElementById('product-notes').value.trim();
    
    // Validation
    if (!name) { errorEl.textContent = t('products.error_name') || 'Enter product name'; return; }
    if (!sku) { errorEl.textContent = t('products.error_sku') || 'Enter SKU'; return; }
    if (!category) { errorEl.textContent = t('products.error_category') || 'Select category'; return; }
    if (!unit) { errorEl.textContent = t('products.error_unit') || 'Select unit'; return; }
    if (unit === 'custom' && !customUnit) { errorEl.textContent = t('products.error_custom_unit') || 'Enter custom unit name'; return; }
    if (isNaN(purchasePrice) || purchasePrice < 0) { errorEl.textContent = t('products.error_purchase_price') || 'Enter valid purchase price'; return; }
    if (isNaN(sellingPrice) || sellingPrice < 0) { errorEl.textContent = t('products.error_selling_price') || 'Enter valid selling price'; return; }
    
    // Medical product validation
    if (category === 'medical') {
      if (!batchNumber) { errorEl.textContent = t('products.error_batch') || 'Batch number required for medical products'; return; }
      if (!expiryDate) { errorEl.textContent = t('products.error_expiry') || 'Expiry date required for medical products'; return; }
    }
    
    // Check for duplicate SKU
    const existingSku = products.find(p => p.sku === sku && p.id !== form.dataset.editId);
    if (existingSku) { errorEl.textContent = t('products.error_duplicate_sku') || 'SKU already exists'; return; }
    
    // Check for duplicate barcode
    if (barcode) {
      const existingBarcode = products.find(p => p.barcode === barcode && p.id !== form.dataset.editId);
      if (existingBarcode) { errorEl.textContent = t('products.error_duplicate_barcode') || 'Barcode already exists'; return; }
    }
    
    const finalUnit = unit === 'custom' ? customUnit : unit;
    const now = new Date().toISOString();
    
    if (form.dataset.editId) {
      // Edit existing product
      const idx = products.findIndex(p => p.id === form.dataset.editId);
      if (idx !== -1) {
        const oldProduct = products[idx];
        
        products[idx] = {
          ...oldProduct,
          name,
          sku,
          barcode,
          category,
          brand,
          unit: finalUnit,
          purchasePrice,
          sellingPrice,
          currentStock,
          minStockAlert: minStock,
          batchNumber: category === 'medical' ? batchNumber : '',
          expiryDate: category === 'medical' ? expiryDate : '',
          manufacturer: category === 'medical' ? manufacturer : '',
          supplierId,
          status,
          notes,
          updatedAt: now,
        };
        
        // If stock changed, create opening adjustment movement
        if (oldProduct.currentStock !== currentStock) {
          const diff = currentStock - oldProduct.currentStock;
          if (diff !== 0) {
            createStockMovement(
              oldProduct.id,
              diff > 0 ? 'adjustment_increase' : 'adjustment_decrease',
              Math.abs(diff),
              oldProduct.id,
              'product_edit',
              `Stock adjusted from ${oldProduct.currentStock} to ${currentStock} during product edit`
            );
          }
        }
        
        saveState();
        savedMsg.textContent = t('products.updated') || 'Product updated successfully';
      }
    } else {
      // Create new product
      const product = {
        id: uid(),
        name,
        sku,
        barcode,
        category,
        brand,
        unit: finalUnit,
        purchasePrice,
        sellingPrice,
        currentStock,
        minStockAlert: minStock,
        batchNumber: category === 'medical' ? batchNumber : '',
        expiryDate: category === 'medical' ? expiryDate : '',
        manufacturer: category === 'medical' ? manufacturer : '',
        supplierId,
        status,
        notes,
        createdAt: now,
        updatedAt: now,
      };
      
      products.push(product);
      
      // Create opening stock movement if initial stock > 0
      if (currentStock > 0) {
        createStockMovement(
          product.id,
          'opening',
          currentStock,
          product.id,
          'product_create',
          `Initial stock for new product: ${name}`
        );
      }
      
      saveState();
      savedMsg.textContent = t('products.saved') || 'Product saved successfully';
    }
    
    savedMsg.className = 'msg ok';
    savedMsg.style.display = 'block';
    
    // Reset form after short delay
    setTimeout(() => {
      form.reset();
      customUnitField.style.display = 'none';
      medicalFields.style.display = 'none';
      form.dataset.editId = '';
      title.textContent = t('products.add_product');
      sub.textContent = t('products.add_sub');
      savedMsg.style.display = 'none';
      showView('view-products');
    }, 1500);
  };
  
  // Check if editing
  const editId = form.dataset.editId;
  if (editId) {
    const product = getProductById(editId);
    if (product) {
      title.textContent = t('products.edit_product') || 'Edit Product';
      sub.textContent = t('products.edit_sub') || 'Modify product details';
      
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-sku').value = product.sku;
      document.getElementById('product-barcode').value = product.barcode || '';
      document.getElementById('product-category').value = product.category;
      document.getElementById('product-brand').value = product.brand || '';
      document.getElementById('product-unit').value = product.unit;
      document.getElementById('product-purchase-price').value = product.purchasePrice;
      document.getElementById('product-selling-price').value = product.sellingPrice;
      document.getElementById('product-current-stock').value = product.currentStock;
      document.getElementById('product-min-stock').value = product.minStockAlert || 0;
      document.getElementById('product-batch').value = product.batchNumber || '';
      document.getElementById('product-expiry').value = product.expiryDate || '';
      document.getElementById('product-manufacturer').value = product.manufacturer || '';
      document.getElementById('product-supplier').value = product.supplierId || '';
      document.getElementById('product-status').value = product.status;
      document.getElementById('product-notes').value = product.notes || '';
      
      // Handle custom unit
      const standardUnits = ['piece', 'kg', 'gram', 'litre', 'ml', 'packet', 'strip', 'box', 'bottle', 'dozen'];
      if (!standardUnits.includes(product.unit)) {
        document.getElementById('product-unit').value = 'custom';
        document.getElementById('product-custom-unit').value = product.unit;
        customUnitField.style.display = 'block';
        document.getElementById('product-custom-unit').required = true;
      }
      
      // Handle medical fields
      if (product.category === 'medical') {
        medicalFields.style.display = 'block';
        document.getElementById('product-batch').required = true;
        document.getElementById('product-expiry').required = true;
      }
    }
  } else {
    title.textContent = t('products.add_product');
    sub.textContent = t('products.add_sub');
    form.reset();
    customUnitField.style.display = 'none';
    medicalFields.style.display = 'none';
  }
}

/* Edit product */
function editProduct(id) {
  const form = document.getElementById('add-product-form');
  if (!form) return;
  form.dataset.editId = id;
  showView('view-add-product');
}

/* Delete product */
function deleteProduct(id) {
  const product = getProductById(id);
  if (!product) return;
  
  if (!confirm(`${t('products.delete_confirm') || 'Delete this product?'}\n\n${escapeHtml(product.name)} (${escapeHtml(product.sku)})`)) {
    return;
  }
  
  // Check if product has stock movements
  const hasMovements = stockMovements.some(m => m.productId === id);
  if (hasMovements) {
    if (!confirm(`${t('products.delete_with_movements') || 'This product has stock movement history. Deleting will remove the product but keep the movement records. Continue?'}`)) {
      return;
    }
  }
  
  products = products.filter(p => p.id !== id);
  // Also remove related batches
  batches = batches.filter(b => b.productId !== id);
  saveState();
  renderProductsList();
}

/* Purchase View */
function renderPurchaseView() {
  const form = document.getElementById('purchase-form');
  const supplierSelect = document.getElementById('purchase-supplier');
  const dateInput = document.getElementById('purchase-date');
  const paymentModeSelect = document.getElementById('purchase-payment-mode');
  const cancelBtn = document.getElementById('purchase-cancel-btn');
  const savedMsg = document.getElementById('purchase-saved-msg');
  const errorEl = document.getElementById('purchase-form-error');
  
  if (!form) return;
  
  // Populate supplier dropdown
  if (supplierSelect) {
    supplierSelect.innerHTML = `<option value="" disabled selected data-i18n="purchase.select_supplier">${t('purchase.select_supplier')}</option>` +
      suppliers.filter(s => s.status !== 'inactive').map(s => 
        `<option value="${s.id}">${escapeHtml(s.name)}</option>`
      ).join('');
  }
  
  // Set default date
  if (dateInput) dateInput.value = DEFAULT_DATE;
  
  // Initialize purchase table
  initPurchaseTable();
  
  // Cancel button
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      form.reset();
      if (dateInput) dateInput.value = DEFAULT_DATE;
      initPurchaseTable();
      savedMsg.style.display = 'none';
      errorEl.textContent = '';
      showView('view-home');
    };
  }
  
  // Form submit
  form.onsubmit = (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    savedMsg.style.display = 'none';
    
    const supplierId = supplierSelect?.value;
    const invoiceNo = document.getElementById('purchase-invoice').value.trim();
    const date = dateInput?.value || DEFAULT_DATE;
    const paymentMode = paymentModeSelect?.value || 'Cash';
    const notes = document.getElementById('purchase-notes').value.trim();
    const discount = parseFloat(document.getElementById('purchase-discount').value) || 0;
    
    if (!supplierId) { errorEl.textContent = t('purchase.error_supplier') || 'Select a supplier'; return; }
    
    const items = getPurchaseItems();
    if (items.length === 0) { errorEl.textContent = t('purchase.error_no_items') || 'Add at least one item'; return; }
    
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const grandTotal = Math.max(0, subtotal - discount);
    
    const purchase = {
      id: uid(),
      supplierId,
      invoiceNo,
      date,
      items,
      discount,
      grandTotal,
      paymentMode,
      notes,
      createdAt: new Date().toISOString(),
    };
    
    purchases.push(purchase);
    
    // Create stock movements for each item
    for (const item of items) {
      const product = getProductById(item.productId);
      if (product) {
        // Update product stock
        product.currentStock = (product.currentStock || 0) + item.qty;
        product.updatedAt = new Date().toISOString();
        
        // Create batch if medical product with batch/expiry
        let batchId = null;
        if (product.category === 'medical' && item.batchNumber && item.expiryDate) {
          const batch = {
            id: uid(),
            productId: product.id,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            quantity: item.qty,
            purchasePrice: item.rate,
            purchaseId: purchase.id,
            createdAt: new Date().toISOString(),
          };
          batches.push(batch);
          batchId = batch.id;
        }
        
        // Create stock movement
        createStockMovement(
          product.id,
          'purchase',
          item.qty,
          purchase.id,
          'purchase',
          `Purchase from supplier: ${getSupplierById(supplierId)?.name || 'Unknown'}`,
          batchId
        );
      }
    }
    
    saveState();
    savedMsg.textContent = t('purchase.saved') || 'Purchase saved successfully';
    savedMsg.className = 'msg ok';
    savedMsg.style.display = 'block';
    
    // Reset form
    setTimeout(() => {
      form.reset();
      if (dateInput) dateInput.value = DEFAULT_DATE;
      initPurchaseTable();
      savedMsg.style.display = 'none';
      showView('view-home');
    }, 1500);
  };
}

/* Purchase table functions */
let purchaseRowCounter = 0;

function initPurchaseTable() {
  const tbody = document.getElementById('purchase-tbody');
  const emptyMsg = document.getElementById('purchase-empty');
  const addBtn = document.getElementById('add-purchase-item-btn');
  const discountInput = document.getElementById('purchase-discount');
  
  if (!tbody || !emptyMsg || !addBtn) return;
  
  tbody.innerHTML = '';
  purchaseRowCounter = 0;
  emptyMsg.style.display = 'block';
  
  addBtn.onclick = () => addPurchaseRow();
  if (discountInput) discountInput.oninput = updatePurchaseTotals;
  
  // Add first row
  addPurchaseRow();
}

function addPurchaseRow() {
  const tbody = document.getElementById('purchase-tbody');
  const emptyMsg = document.getElementById('purchase-empty');
  if (!tbody || !emptyMsg) return;
  
  purchaseRowCounter++;
  
  const row = document.createElement('tr');
  row.dataset.rowId = purchaseRowCounter;
  
  // S.No.
  const snoCell = document.createElement('td');
  snoCell.className = 'bill-sno';
  snoCell.textContent = purchaseRowCounter;
  row.appendChild(snoCell);
  
  // Product (select from active products)
  const productCell = document.createElement('td');
  const productSelect = document.createElement('select');
  productSelect.className = 'bill-input purchase-product';
  productSelect.required = true;
  productSelect.innerHTML = `<option value="" disabled selected>${t('purchase.select_product')}</option>` +
    getActiveProducts().map(p => 
      `<option value="${p.id}" data-rate="${p.purchasePrice}" data-unit="${p.unit}" data-category="${p.category}">${escapeHtml(p.name)} (${p.sku})</option>`
    ).join('');
  productSelect.onchange = () => {
    const opt = productSelect.options[productSelect.selectedIndex];
    if (opt.value) {
      row.querySelector('.purchase-rate').value = opt.dataset.rate || '';
      row.querySelector('.purchase-unit').textContent = t('products.unit.' + opt.dataset.unit) || opt.dataset.unit;
      row.querySelector('.purchase-batch-field').style.display = opt.dataset.category === 'medical' ? 'block' : 'none';
      if (opt.dataset.category === 'medical') {
        row.querySelector('.purchase-batch').required = true;
        row.querySelector('.purchase-expiry').required = true;
      } else {
        row.querySelector('.purchase-batch').required = false;
        row.querySelector('.purchase-expiry').required = false;
      }
      updateRowAmount(row);
      updatePurchaseTotals();
    }
  };
  productCell.appendChild(productSelect);
  row.appendChild(productCell);
  
  // Batch Number
  const batchCell = document.createElement('td');
  const batchInput = document.createElement('input');
  batchInput.type = 'text';
  batchInput.className = 'bill-input purchase-batch';
  batchInput.placeholder = t('purchase.batch_placeholder') || 'Batch No.';
  batchInput.style.display = 'none';
  batchCell.appendChild(batchInput);
  row.appendChild(batchCell);
  
  // Expiry Date
  const expiryCell = document.createElement('td');
  const expiryInput = document.createElement('input');
  expiryInput.type = 'date';
  expiryInput.className = 'bill-input purchase-expiry';
  expiryInput.style.display = 'none';
  expiryCell.appendChild(expiryInput);
  row.appendChild(expiryCell);
  
  // Unit (display only)
  const unitCell = document.createElement('td');
  const unitSpan = document.createElement('span');
  unitSpan.className = 'purchase-unit';
  unitSpan.textContent = '-';
  unitCell.appendChild(unitSpan);
  row.appendChild(unitCell);
  
  // Quantity
  const qtyCell = document.createElement('td');
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.className = 'bill-input purchase-qty';
  qtyInput.min = '0.01';
  qtyInput.step = '0.01';
  qtyInput.value = '1';
  qtyInput.required = true;
  qtyInput.oninput = () => { updateRowAmount(row); updatePurchaseTotals(); };
  qtyCell.appendChild(qtyInput);
  row.appendChild(qtyCell);
  
  // Rate
  const rateCell = document.createElement('td');
  const rateInput = document.createElement('input');
  rateInput.type = 'number';
  rateInput.className = 'bill-input purchase-rate';
  rateInput.min = '0';
  rateInput.step = '0.01';
  rateInput.placeholder = t('purchase.rate_placeholder') || '0.00';
  rateInput.required = true;
  rateInput.oninput = () => { updateRowAmount(row); updatePurchaseTotals(); };
  rateCell.appendChild(rateInput);
  row.appendChild(rateCell);
  
  // Discount
  const discountCell = document.createElement('td');
  const discountInput = document.createElement('input');
  discountInput.type = 'number';
  discountInput.className = 'bill-input purchase-discount';
  discountInput.min = '0';
  discountInput.step = '0.01';
  discountInput.value = '0';
  discountInput.oninput = () => { updateRowAmount(row); updatePurchaseTotals(); };
  discountCell.appendChild(discountInput);
  row.appendChild(discountCell);
  
  // Amount (read-only)
  const amountCell = document.createElement('td');
  const amountSpan = document.createElement('span');
  amountSpan.className = 'bill-amount';
  amountSpan.textContent = '₹ 0.00';
  amountCell.appendChild(amountSpan);
  row.appendChild(amountCell);
  
  // Remove button
  const removeCell = document.createElement('td');
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-ghost btn-sm bill-remove';
  removeBtn.textContent = t('billing.remove');
  removeBtn.setAttribute('data-i18n', 'billing.remove');
  removeBtn.onclick = () => removePurchaseRow(row);
  removeCell.appendChild(removeBtn);
  row.appendChild(removeCell);
  
  tbody.appendChild(row);
  emptyMsg.style.display = 'none';
  
  // Mark batch field container
  const batchFieldContainer = batchInput.parentElement;
  batchFieldContainer.classList.add('purchase-batch-field');
  
  setTimeout(() => productSelect.focus(), 0);
  updateRowAmount(row);
  updatePurchaseTotals();
}

function removePurchaseRow(row) {
  const tbody = document.getElementById('purchase-tbody');
  const emptyMsg = document.getElementById('purchase-empty');
  if (!tbody || !emptyMsg) return;
  row.remove();
  const rows = tbody.querySelectorAll('tr');
  rows.forEach((r, i) => {
    r.dataset.rowId = i + 1;
    r.querySelector('.bill-sno').textContent = i + 1;
  });
  purchaseRowCounter = rows.length;
  if (purchaseRowCounter === 0) {
    emptyMsg.style.display = 'block';
  }
  updatePurchaseTotals();
}

function updateRowAmount(row) {
  const qtyEl = row.querySelector('.purchase-qty');
  const rateEl = row.querySelector('.purchase-rate');
  const discountEl = row.querySelector('.purchase-discount');
  const amountEl = row.querySelector('.bill-amount');
  if (!qtyEl || !rateEl || !amountEl) return;
  const qty = parseFloat(qtyEl.value) || 0;
  const rate = parseFloat(rateEl.value) || 0;
  const discount = parseFloat(discountEl?.value) || 0;
  const amount = Math.max(0, qty * rate - discount);
  amountEl.textContent = formatMoney2(amount);
}

function updatePurchaseTotals() {
  const tbody = document.getElementById('purchase-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  let subtotal = 0;
  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.purchase-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.purchase-rate').value) || 0;
    const discount = parseFloat(row.querySelector('.purchase-discount').value) || 0;
    subtotal += Math.max(0, qty * rate - discount);
  });
  
  const discount = parseFloat(document.getElementById('purchase-discount').value) || 0;
  const grandTotal = Math.max(0, subtotal - discount);
  
  document.getElementById('purchase-subtotal').textContent = '₹ ' + formatMoney2(subtotal);
  document.getElementById('purchase-grand-total').textContent = '₹ ' + formatMoney2(grandTotal);
}

function getPurchaseItems() {
  const tbody = document.getElementById('purchase-tbody');
  if (!tbody) return [];
  const rows = tbody.querySelectorAll('tr');
  const items = [];
  rows.forEach(row => {
    const productId = row.querySelector('.purchase-product').value;
    const qty = parseFloat(row.querySelector('.purchase-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.purchase-rate').value) || 0;
    const discount = parseFloat(row.querySelector('.purchase-discount').value) || 0;
    const amount = Math.max(0, qty * rate - discount);
    const batchNumber = row.querySelector('.purchase-batch').value.trim();
    const expiryDate = row.querySelector('.purchase-expiry').value;
    if (productId && qty > 0 && rate >= 0) {
      items.push({ productId, qty, rate, discount, amount, batchNumber, expiryDate });
    }
  });
  return items;
}

/* ---------- Suppliers ---------- */

function renderSuppliersList() {
  const list = document.getElementById('suppliers-list');
  const empty = document.getElementById('suppliers-empty');
  const searchInput = document.getElementById('supplier-search');
  
  if (!list) return;
  
  const render = () => {
    const search = (searchInput?.value || '').toLowerCase().trim();
    
    let filtered = suppliers;
    
    if (search) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(search) ||
        (s.phone || '').includes(search) ||
        (s.email || '').toLowerCase().includes(search) ||
        (s.address || '').toLowerCase().includes(search)
      );
    }
    
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    if (filtered.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    
    empty.style.display = 'none';
    list.innerHTML = filtered.map(s => `
      <div class="supplier-card" data-supplier-id="${s.id}">
        <div class="supplier-header">
          <div class="supplier-name">${escapeHtml(s.name)}</div>
          <div class="supplier-status ${s.status}">${t('suppliers.status.' + s.status)}</div>
        </div>
        <div class="supplier-details">
          ${s.phone ? `<span><i>📞</i> ${escapeHtml(s.phone)}</span>` : ''}
          ${s.email ? `<span><i>✉️</i> ${escapeHtml(s.email)}</span>` : ''}
          ${s.gst ? `<span><i>🏷️</i> ${escapeHtml(s.gst)}</span>` : ''}
        </div>
        ${s.address ? `<div class="supplier-address">${escapeHtml(s.address)}</div>` : ''}
        <div class="supplier-actions">
          <button class="btn btn-sm edit-supplier" data-id="${s.id}" data-i18n="common.edit">Edit</button>
          <button class="btn btn-sm btn-danger delete-supplier" data-id="${s.id}" data-i18n="common.delete">Delete</button>
        </div>
      </div>
    `).join('');
    
    // Wire up edit/delete buttons
    list.querySelectorAll('.edit-supplier').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.dataset.id;
        editSupplier(id);
      };
    });
    list.querySelectorAll('.delete-supplier').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.dataset.id;
        deleteSupplier(id);
      };
    });
  };
  
  // Initial render
  render();
  
  // Event listeners
  if (searchInput) {
    searchInput.oninput = render;
  }
  
  // Add supplier button
  const addBtn = document.getElementById('add-supplier-from-list-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      document.getElementById('add-supplier-form').reset();
      document.getElementById('add-supplier-title').textContent = t('suppliers.add_supplier');
      document.getElementById('add-supplier-sub').textContent = t('suppliers.add_sub');
      document.getElementById('add-supplier-form').dataset.editId = '';
      showView('view-add-supplier');
    };
  }
}

function renderAddSupplierView() {
  const form = document.getElementById('add-supplier-form');
  const title = document.getElementById('add-supplier-title');
  const sub = document.getElementById('add-supplier-sub');
  const cancelBtn = document.getElementById('supplier-cancel-btn');
  const savedMsg = document.getElementById('supplier-saved-msg');
  const errorEl = document.getElementById('supplier-form-error');
  
  if (!form) return;
  
  // Cancel button
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      form.reset();
      form.dataset.editId = '';
      title.textContent = t('suppliers.add_supplier');
      sub.textContent = t('suppliers.add_sub');
      errorEl.textContent = '';
      savedMsg.style.display = 'none';
      showView('view-suppliers');
    };
  }
  
  // Form submit
  form.onsubmit = (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    savedMsg.style.display = 'none';
    
    const name = document.getElementById('supplier-name').value.trim();
    const phone = document.getElementById('supplier-phone').value.trim();
    const email = document.getElementById('supplier-email').value.trim();
    const gst = document.getElementById('supplier-gst').value.trim().toUpperCase();
    const address = document.getElementById('supplier-address').value.trim();
    const contactPerson = document.getElementById('supplier-contact').value.trim();
    const paymentTerms = document.getElementById('supplier-terms').value.trim();
    const status = document.getElementById('supplier-status').value;
    const notes = document.getElementById('supplier-notes').value.trim();
    
    // Validation
    if (!name) { errorEl.textContent = t('suppliers.error_name') || 'Enter supplier name'; return; }
    if (phone && !/^\d{10}$/.test(phone)) { errorEl.textContent = t('suppliers.error_phone') || 'Phone must be 10 digits'; return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = t('suppliers.error_email') || 'Invalid email format'; return; }
    if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) { 
      errorEl.textContent = t('suppliers.error_gst') || 'Invalid GSTIN format'; 
      return; 
    }
    
    const now = new Date().toISOString();
    
    if (form.dataset.editId) {
      // Edit existing supplier
      const idx = suppliers.findIndex(s => s.id === form.dataset.editId);
      if (idx !== -1) {
        suppliers[idx] = {
          ...suppliers[idx],
          name,
          phone,
          email,
          gst,
          address,
          contactPerson,
          paymentTerms,
          status,
          notes,
          updatedAt: now,
        };
        saveState();
        savedMsg.textContent = t('suppliers.updated') || 'Supplier updated successfully';
      }
    } else {
      // Create new supplier
      const supplier = {
        id: uid(),
        name,
        phone,
        email,
        gst,
        address,
        contactPerson,
        paymentTerms,
        status,
        notes,
        createdAt: now,
        updatedAt: now,
      };
      suppliers.push(supplier);
      saveState();
      savedMsg.textContent = t('suppliers.saved') || 'Supplier saved successfully';
    }
    
    savedMsg.className = 'msg ok';
    savedMsg.style.display = 'block';
    
    // Reset form after short delay
    setTimeout(() => {
      form.reset();
      form.dataset.editId = '';
      title.textContent = t('suppliers.add_supplier');
      sub.textContent = t('suppliers.add_sub');
      savedMsg.style.display = 'none';
      showView('view-suppliers');
    }, 1500);
  };
  
  // Check if editing
  const editId = form.dataset.editId;
  if (editId) {
    const supplier = getSupplierById(editId);
    if (supplier) {
      title.textContent = t('suppliers.edit_supplier') || 'Edit Supplier';
      sub.textContent = t('suppliers.edit_sub') || 'Modify supplier details';
      
      document.getElementById('supplier-name').value = supplier.name;
      document.getElementById('supplier-phone').value = supplier.phone || '';
      document.getElementById('supplier-email').value = supplier.email || '';
      document.getElementById('supplier-gst').value = supplier.gst || '';
      document.getElementById('supplier-address').value = supplier.address || '';
      document.getElementById('supplier-contact').value = supplier.contactPerson || '';
      document.getElementById('supplier-terms').value = supplier.paymentTerms || '';
      document.getElementById('supplier-status').value = supplier.status;
      document.getElementById('supplier-notes').value = supplier.notes || '';
    }
  } else {
    title.textContent = t('suppliers.add_supplier');
    sub.textContent = t('suppliers.add_sub');
    form.reset();
  }
}

function editSupplier(id) {
  const form = document.getElementById('add-supplier-form');
  if (!form) return;
  form.dataset.editId = id;
  showView('view-add-supplier');
}

function deleteSupplier(id) {
  const supplier = getSupplierById(id);
  if (!supplier) return;
  
  if (!confirm(`${t('suppliers.delete_confirm') || 'Delete this supplier?'}\n\n${escapeHtml(supplier.name)}`)) {
    return;
  }
  
  // Check if supplier has purchases
  const hasPurchases = purchases.some(p => p.supplierId === id);
  if (hasPurchases) {
    if (!confirm(`${t('suppliers.delete_with_purchases') || 'This supplier has purchase history. Deleting will remove the supplier but keep the purchase records. Continue?'}`)) {
      return;
    }
  }
  
  suppliers = suppliers.filter(s => s.id !== id);
  saveState();
  renderSuppliersList();
}

/* ---------- Stock Adjustment ---------- */

function renderStockAdjustmentView() {
  const form = document.getElementById('stock-adjustment-form');
  const productSelect = document.getElementById('adjustment-product');
  const adjustmentType = document.getElementById('adjustment-type');
  const quantityInput = document.getElementById('adjustment-qty');
  const reasonInput = document.getElementById('adjustment-reason');
  const savedMsg = document.getElementById('adjustment-saved-msg');
  const errorEl = document.getElementById('adjustment-form-error');
  
  if (!form) return;
  
  // Populate product dropdown
  if (productSelect) {
    productSelect.innerHTML = `<option value="" disabled selected data-i18n="stock.select_product">${t('stock.select_product')}</option>` +
      getActiveProducts().map(p => 
        `<option value="${p.id}">${escapeHtml(p.name)} (${p.sku}) - Stock: ${formatMoney(p.currentStock)} ${p.unit}</option>`
      ).join('');
  }
  
  form.onsubmit = (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    savedMsg.style.display = 'none';
    
    const productId = productSelect?.value;
    const type = adjustmentType?.value;
    const quantity = parseFloat(quantityInput?.value) || 0;
    const reason = reasonInput?.value.trim();
    
    if (!productId) { errorEl.textContent = t('stock.error_product') || 'Select a product'; return; }
    if (!type) { errorEl.textContent = t('stock.error_type') || 'Select adjustment type'; return; }
    if (quantity <= 0) { errorEl.textContent = t('stock.error_qty') || 'Quantity must be greater than 0'; return; }
    if (!reason) { errorEl.textContent = t('stock.error_reason') || 'Enter a reason'; return; }
    
    const product = getProductById(productId);
    if (!product) { errorEl.textContent = t('stock.error_product_not_found') || 'Product not found'; return; }
    
    const movementType = type === 'increase' ? 'adjustment_increase' : 'adjustment_decrease';
    
    // Check if decreasing more than available stock
    if (movementType === 'adjustment_decrease' && product.currentStock < quantity) {
      if (!confirm(`${t('stock.confirm_negative') || 'This will make stock negative. Continue?'}`)) {
        return;
      }
    }
    
    // Update product stock
    product.currentStock = Math.max(0, product.currentStock + (type === 'increase' ? quantity : -quantity));
    product.updatedAt = new Date().toISOString();
    
    // Create stock movement
    createStockMovement(
      productId,
      movementType,
      quantity,
      productId,
      'adjustment',
      reason
    );
    
    saveState();
    savedMsg.textContent = t('stock.adjusted') || 'Stock adjusted successfully';
    savedMsg.className = 'msg ok';
    savedMsg.style.display = 'block';
    
    // Reset form
    setTimeout(() => {
      form.reset();
      savedMsg.style.display = 'none';
      if (productSelect) {
        productSelect.innerHTML = `<option value="" disabled selected data-i18n="stock.select_product">${t('stock.select_product')}</option>` +
          getActiveProducts().map(p => 
            `<option value="${p.id}">${escapeHtml(p.name)} (${p.sku}) - Stock: ${formatMoney(p.currentStock)} ${p.unit}</option>`
          ).join('');
      }
    }, 1500);
  };
}

/* ---------- Stock Movement History ---------- */

function renderStockMovementView() {
  const list = document.getElementById('stock-movement-list');
  const empty = document.getElementById('stock-movement-empty');
  const productFilter = document.getElementById('movement-product-filter');
  const typeFilter = document.getElementById('movement-type-filter');
  const dateFrom = document.getElementById('movement-date-from');
  const dateTo = document.getElementById('movement-date-to');
  
  if (!list) return;
  
  // Populate product filter
  if (productFilter) {
    productFilter.innerHTML = `<option value="" data-i18n="stock.all_products">${t('stock.all_products')}</option>` +
      getActiveProducts().map(p => 
        `<option value="${p.id}">${escapeHtml(p.name)} (${p.sku})</option>`
      ).join('');
  }
  
  const render = () => {
    const productId = productFilter?.value || '';
    const type = typeFilter?.value || '';
    const from = dateFrom?.value || '';
    const to = dateTo?.value || '';
    
    let filtered = [...stockMovements].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (productId) {
      filtered = filtered.filter(m => m.productId === productId);
    }
    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }
    if (from) {
      filtered = filtered.filter(m => m.date >= from);
    }
    if (to) {
      filtered = filtered.filter(m => m.date <= to);
    }
    
    if (filtered.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    
    empty.style.display = 'none';
    list.innerHTML = filtered.map(m => {
      const product = getProductById(m.productId);
      const typeLabels = {
        purchase: t('stock.type_purchase') || 'Purchase',
        sale: t('stock.type_sale') || 'Sale',
        adjustment_increase: t('stock.type_adj_inc') || 'Adjustment (+)',
        adjustment_decrease: t('stock.type_adj_dec') || 'Adjustment (-)',
        return: t('stock.type_return') || 'Return',
        opening: t('stock.type_opening') || 'Opening Stock'
      };
      const typeLabel = typeLabels[m.type] || m.type;
      const isIncrease = ['purchase', 'adjustment_increase', 'return', 'opening'].includes(m.type);
      
      return `
        <div class="movement-row ${isIncrease ? 'increase' : 'decrease'}">
          <div class="movement-date">${m.date}</div>
          <div class="movement-product">${escapeHtml(product ? product.name : 'Unknown Product')}</div>
          <div class="movement-type">${typeLabel}</div>
          <div class="movement-qty ${isIncrease ? 'pos' : 'neg'}">${isIncrease ? '+' : '-'}${formatMoney(m.quantity)}</div>
          <div class="movement-ref">${escapeHtml(m.referenceType || '')}: ${escapeHtml(m.referenceId || '')}</div>
          <div class="movement-notes">${escapeHtml(m.notes || '')}</div>
        </div>
      `;
    }).join('');
  };
  
  // Initial render
  render();
  
  // Event listeners
  if (productFilter) productFilter.onchange = render;
  if (typeFilter) typeFilter.onchange = render;
  if (dateFrom) dateFrom.onchange = render;
  if (dateTo) dateTo.onchange = render;
}

/* ---------- Low Stock Alerts ---------- */

function renderLowStockView() {
  const list = document.getElementById('low-stock-list');
  const empty = document.getElementById('low-stock-empty');
  const filter = document.getElementById('low-stock-filter');
  
  if (!list) return;
  
  const render = () => {
    const filterVal = filter?.value || 'all';
    
    let filtered = getLowStockProducts();
    if (filterVal === 'out') {
      filtered = getOutOfStockProducts();
    }
    
    filtered.sort((a, b) => (a.currentStock || 0) - (b.currentStock || 0));
    
    if (filtered.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      empty.innerHTML = filterVal === 'out' 
        ? `<p class="hint">${t('stock.no_out_of_stock') || 'No out of stock products'}</p>`
        : `<p class="hint">${t('stock.no_low_stock') || 'No low stock products'}</p>`;
      return;
    }
    
    empty.style.display = 'none';
    list.innerHTML = filtered.map(p => {
      const supplier = p.supplierId ? getSupplierById(p.supplierId) : null;
      const isOutOfStock = p.currentStock <= 0;
      const deficit = isOutOfStock ? 0 : (p.minStockAlert - p.currentStock);
      
      return `
        <div class="low-stock-card ${isOutOfStock ? 'out' : 'low'}">
          <div class="low-stock-header">
            <div class="low-stock-name">${escapeHtml(p.name)}</div>
            <div class="low-stock-sku">${escapeHtml(p.sku)}</div>
          </div>
          <div class="low-stock-details">
            <span class="stock-current ${isOutOfStock ? 'out' : ''}">${formatMoney(p.currentStock)} ${t('products.unit.' + p.unit) || p.unit}</span>
            <span class="stock-min">Min: ${formatMoney(p.minStockAlert)}</span>
            ${!isOutOfStock ? `<span class="stock-deficit">${t('stock.needs')}: ${formatMoney(deficit)} more</span>` : ''}
            <span class="stock-category">${t('products.category.' + p.category) || p.category}</span>
          </div>
          ${supplier ? `<div class="low-stock-supplier">${t('stock.supplier')}: ${escapeHtml(supplier.name)} ${supplier.phone ? `(${supplier.phone})` : ''}</div>` : ''}
          <div class="low-stock-actions">
            <button class="btn btn-sm purchase-for-product" data-product-id="${p.id}" data-i18n="stock.purchase_stock">${t('stock.purchase_stock')}</button>
            <button class="btn btn-sm btn-secondary adjust-for-product" data-product-id="${p.id}" data-i18n="stock.adjust_stock">${t('stock.adjust_stock')}</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Wire up buttons
    list.querySelectorAll('.purchase-for-product').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.dataset.productId;
        const product = getProductById(id);
        if (product) {
          // Pre-fill purchase form with this product
          showView('view-purchase');
          setTimeout(() => {
            const select = document.querySelector('.purchase-product');
            if (select) select.value = id;
            select?.dispatchEvent(new Event('change'));
          }, 100);
        }
      };
    });
    list.querySelectorAll('.adjust-for-product').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.dataset.productId;
        showView('view-stock-adjustment');
        setTimeout(() => {
          const select = document.getElementById('adjustment-product');
          if (select) select.value = id;
        }, 100);
      };
    });
  };
  
  // Initial render
  render();
  
  // Event listener
  if (filter) filter.onchange = render;
}

/* ---------- Stock Reports ---------- */

function renderStockReportsView() {
  const reportType = document.getElementById('report-type');
  const dateFrom = document.getElementById('report-date-from');
  const dateTo = document.getElementById('report-date-to');
  const productFilter = document.getElementById('report-product-filter');
  const generateBtn = document.getElementById('generate-report-btn');
  const result = document.getElementById('report-result');
  
  if (!result) return;
  
  // Populate product filter
  if (productFilter) {
    productFilter.innerHTML = `<option value="" data-i18n="stock.all_products">${t('stock.all_products')}</option>` +
      getActiveProducts().map(p => 
        `<option value="${p.id}">${escapeHtml(p.name)} (${p.sku})</option>`
      ).join('');
  }
  
  // Set default date range (last 30 days)
  if (dateFrom && dateTo) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    dateFrom.value = thirtyDaysAgo.toISOString().slice(0, 10);
    dateTo.value = today.toISOString().slice(0, 10);
  }
  
  const generateReport = () => {
    const type = reportType?.value || 'stock_valuation';
    const from = dateFrom?.value || '';
    const to = dateTo?.value || '';
    const productId = productFilter?.value || '';
    
    let html = '';
    
    if (type === 'stock_valuation') {
      // Stock Valuation Report
      let products = getActiveProducts();
      if (productId) {
        products = products.filter(p => p.id === productId);
      }
      
      let totalPurchaseValue = 0;
      let totalSellValue = 0;
      
      html = `
        <h4>${t('stock.report_valuation')}</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th>${t('products.name')}</th>
              <th>${t('products.sku')}</th>
              <th>${t('products.category')}</th>
              <th>${t('stock.current_stock')}</th>
              <th>${t('products.unit')}</th>
              <th>${t('stock.purchase_price')}</th>
              <th>${t('stock.selling_price')}</th>
              <th>${t('stock.purchase_value')}</th>
              <th>${t('stock.sell_value')}</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => {
              const purchaseValue = (p.currentStock || 0) * (p.purchasePrice || 0);
              const sellValue = (p.currentStock || 0) * (p.sellingPrice || 0);
              totalPurchaseValue += purchaseValue;
              totalSellValue += sellValue;
              return `
                <tr>
                  <td>${escapeHtml(p.name)}</td>
                  <td>${escapeHtml(p.sku)}</td>
                  <td>${t('products.category.' + p.category) || p.category}</td>
                  <td>${formatMoney(p.currentStock)}</td>
                  <td>${t('products.unit.' + p.unit) || p.unit}</td>
                  <td>${t('common.currency')} ${formatMoney2(p.purchasePrice)}</td>
                  <td>${t('common.currency')} ${formatMoney2(p.sellingPrice)}</td>
                  <td>${t('common.currency')} ${formatMoney2(purchaseValue)}</td>
                  <td>${t('common.currency')} ${formatMoney2(sellValue)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="7"><strong>${t('stock.total')}</strong></td>
              <td><strong>${t('common.currency')} ${formatMoney2(totalPurchaseValue)}</strong></td>
              <td><strong>${t('common.currency')} ${formatMoney2(totalSellValue)}</strong></td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (type === 'stock_movement') {
      // Stock Movement Report
      let movements = [...stockMovements].sort((a, b) => new Date(b.date) - new Date(a.date));
      if (from) movements = movements.filter(m => m.date >= from);
      if (to) movements = movements.filter(m => m.date <= to);
      if (productId) movements = movements.filter(m => m.productId === productId);
      
      const typeLabels = {
        purchase: t('stock.type_purchase') || 'Purchase',
        sale: t('stock.type_sale') || 'Sale',
        adjustment_increase: t('stock.type_adj_inc') || 'Adjustment (+)',
        adjustment_decrease: t('stock.type_adj_dec') || 'Adjustment (-)',
        return: t('stock.type_return') || 'Return',
        opening: t('stock.type_opening') || 'Opening Stock'
      };
      
      html = `
        <h4>${t('stock.report_movement')}</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th>${t('stock.date')}</th>
              <th>${t('products.name')}</th>
              <th>${t('stock.type')}</th>
              <th>${t('stock.qty')}</th>
              <th>${t('stock.reference')}</th>
              <th>${t('common.notes')}</th>
            </tr>
          </thead>
          <tbody>
            ${movements.map(m => {
              const product = getProductById(m.productId);
              const typeLabel = typeLabels[m.type] || m.type;
              const isIncrease = ['purchase', 'adjustment_increase', 'return', 'opening'].includes(m.type);
              return `
                <tr class="${isIncrease ? 'increase' : 'decrease'}">
                  <td>${m.date}</td>
                  <td>${escapeHtml(product ? product.name : 'Unknown')}</td>
                  <td>${typeLabel}</td>
                  <td class="${isIncrease ? 'pos' : 'neg'}">${isIncrease ? '+' : '-'}${formatMoney(m.quantity)}</td>
                  <td>${escapeHtml(m.referenceType || '')}: ${escapeHtml(m.referenceId || '')}</td>
                  <td>${escapeHtml(m.notes || '')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'purchase_summary') {
      // Purchase Summary Report
      let purchaseList = [...purchases].sort((a, b) => new Date(b.date) - new Date(a.date));
      if (from) purchaseList = purchaseList.filter(p => p.date >= from);
      if (to) purchaseList = purchaseList.filter(p => p.date <= to);
      
      let totalPurchases = 0;
      let totalAmount = 0;
      
      html = `
        <h4>${t('stock.report_purchases')}</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th>${t('stock.date')}</th>
              <th>${t('purchase.invoice_no')}</th>
              <th>${t('purchase.supplier')}</th>
              <th>${t('stock.items_count')}</th>
              <th>${t('purchase.grand_total')}</th>
              <th>${t('purchase.payment_mode')}</th>
            </tr>
          </thead>
          <tbody>
            ${purchaseList.map(p => {
              const supplier = getSupplierById(p.supplierId);
              totalPurchases++;
              totalAmount += p.grandTotal || 0;
              return `
                <tr>
                  <td>${p.date}</td>
                  <td>${escapeHtml(p.invoiceNo || 'N/A')}</td>
                  <td>${escapeHtml(supplier ? supplier.name : 'Unknown')}</td>
                  <td>${p.items?.length || 0}</td>
                  <td>${t('common.currency')} ${formatMoney2(p.grandTotal)}</td>
                  <td>${escapeHtml(p.paymentMode || '')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4"><strong>${t('stock.total_purchases')}: ${totalPurchases}</strong></td>
              <td><strong>${t('common.currency')} ${formatMoney2(totalAmount)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (type === 'expiry_report') {
      // Expiry Report
      const expiring = getExpiringProducts(90).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      
      if (productId) {
        const filtered = expiring.filter(b => b.productId === productId);
        // We need to handle this differently since we filtered by batch
      }
      
      html = `
        <h4>${t('stock.report_expiry')}</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th>${t('products.name')}</th>
              <th>${t('stock.batch_number')}</th>
              <th>${t('stock.expiry_date')}</th>
              <th>${t('stock.qty')}</th>
              <th>${t('stock.days_remaining')}</th>
            </tr>
          </thead>
          <tbody>
            ${expiring.map(b => {
              const product = getProductById(b.productId);
              const today = new Date();
              const expiry = new Date(b.expiryDate);
              const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
              const isExpired = daysRemaining < 0;
              return `
                <tr class="${isExpired ? 'expired' : (daysRemaining <= 30 ? 'expiring-soon' : '')}">
                  <td>${escapeHtml(product ? product.name : 'Unknown')}</td>
                  <td>${escapeHtml(b.batchNumber)}</td>
                  <td>${b.expiryDate}</td>
                  <td>${formatMoney(b.quantity)} ${product ? (t('products.unit.' + product.unit) || product.unit) : ''}</td>
                  <td>${isExpired ? t('stock.expired') : daysRemaining + ' ' + t('stock.days')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'low_stock_report') {
      // Low Stock Report
      const lowStock = getLowStockProducts().sort((a, b) => (a.currentStock || 0) - (b.currentStock || 0));
      const outOfStock = getOutOfStockProducts();
      
      html = `
        <h4>${t('stock.report_low_stock')}</h4>
        ${outOfStock.length > 0 ? `
          <h5>${t('stock.out_of_stock')}</h5>
          <table class="report-table">
            <thead>
              <tr>
                <th>${t('products.name')}</th>
                <th>${t('products.sku')}</th>
                <th>${t('products.category')}</th>
                <th>${t('stock.supplier')}</th>
              </tr>
            </thead>
            <tbody>
              ${outOfStock.map(p => {
                const supplier = p.supplierId ? getSupplierById(p.supplierId) : null;
                return `
                  <tr>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${escapeHtml(p.sku)}</td>
                    <td>${t('products.category.' + p.category) || p.category}</td>
                    <td>${supplier ? escapeHtml(supplier.name) : '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}
        
        <h5>${t('stock.low_stock')}</h5>
        <table class="report-table">
          <thead>
            <tr>
              <th>${t('products.name')}</th>
              <th>${t('products.sku')}</th>
              <th>${t('products.category')}</th>
              <th>${t('stock.current_stock')}</th>
              <th>${t('stock.min_stock')}</th>
              <th>${t('stock.deficit')}</th>
              <th>${t('stock.supplier')}</th>
            </tr>
          </thead>
          <tbody>
            ${lowStock.map(p => {
              const supplier = p.supplierId ? getSupplierById(p.supplierId) : null;
              const deficit = p.minStockAlert - (p.currentStock || 0);
              return `
                <tr>
                  <td>${escapeHtml(p.name)}</td>
                  <td>${escapeHtml(p.sku)}</td>
                  <td>${t('products.category.' + p.category) || p.category}</td>
                  <td>${formatMoney(p.currentStock)}</td>
                  <td>${formatMoney(p.minStockAlert)}</td>
                  <td>${formatMoney(deficit)}</td>
                  <td>${supplier ? escapeHtml(supplier.name) : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
    
    result.innerHTML = html || `<p class="hint">${t('stock.select_report')}</p>`;
  };
  
  // Generate button
  if (generateBtn) {
    generateBtn.onclick = generateReport;
  }
  
  // Initial generate
  generateReport();
}

/* ---------- Seller Details Form Handler ---------- */
  // Payment QR code upload handler
  if (sellerPaymentQrInput) {
    sellerPaymentQrInput.addEventListener('change', function () {
      const preview = sellerPaymentQrPreview;
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
        preview.innerHTML = `<img src="${reader.result}" style="max-width:150px;border:1px solid var(--border);border-radius:8px;" alt="Payment QR preview">`;
      };
      reader.readAsDataURL(file);
    });
  }

  sellerDetailsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    sellerError.textContent = '';
    sellerSavedMsg.style.display = 'none';

    const name = sellerOwnerName.value.trim();
    if (!name) {
      sellerError.textContent = t('seller_details.error_name');
      sellerOwnerName.focus();
      return;
    }

    sellerDetails = {
      ownerName: name,
      shopName: sellerShopName.value.trim(),
      mobile: sellerMobile.value.trim(),
      upiId: sellerUpiId.value.trim(),
      paymentQr: sellerPaymentQrPreview.querySelector('img') ? sellerPaymentQrPreview.querySelector('img').src : sellerDetails.paymentQr,
      address: sellerAddress.value.trim(),
    };
    saveSellerDetails();

    sellerSavedMsg.textContent = t('seller_details.saved');
    sellerSavedMsg.className = 'msg ok';
    sellerSavedMsg.style.display = 'block';

    // Re-render active view if it's receipt/statement to reflect new seller info
    try { route(); } catch (e) { /* app not booted yet */ }
  });

  const sellerClearBtn = document.getElementById('seller-clear-btn');
  if (sellerClearBtn) {
    sellerClearBtn.addEventListener('click', function () {
      sellerOwnerName.value = '';
      sellerShopName.value = '';
      sellerMobile.value = '';
      sellerUpiId.value = '';
      sellerAddress.value = '';
      sellerPaymentQrPreview.innerHTML = '';
      sellerPaymentQrInput.value = '';
      sellerDetails = { ownerName: '', shopName: '', mobile: '', upiId: '', paymentQr: '', address: '' };
      saveSellerDetails();
      sellerError.textContent = '';
      sellerSavedMsg.style.display = 'none';
      if (sellerDetailsSub) sellerDetailsSub.textContent = t('seller_details.not_set');
    });
  }

/* ---------- Boot: gate on language selection ---------- */
try {
  const picker = document.getElementById('lang-picker');
  if (picker) picker.style.display = 'none';

  const persistedLang = loadLanguage();
  if (persistedLang) {
    setLanguage(persistedLang);
    bootApp();
  } else {
    if (picker) picker.style.display = 'flex';
  }
} catch (e) {
  console.error('Boot failed:', e);
  const picker = document.getElementById('lang-picker');
  if (picker) picker.style.display = 'none';
  try { bootApp(); } catch (e2) { console.error('App boot failed:', e2); }
}
