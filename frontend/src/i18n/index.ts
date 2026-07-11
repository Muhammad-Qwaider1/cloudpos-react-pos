import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      pos: 'POS Terminal',
      invoices: 'Invoices',
      inventory: 'Inventory',
      customers: 'Customers',
      suppliers: 'Suppliers',
      shifts: 'Shifts',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout',

      // POS
      scanOrSearch: 'Scan barcode or search products...',
      cart: 'Cart',
      cartEmpty: 'Cart is empty',
      cartEmptyHint: 'Click products to add',
      clear: 'Clear',
      subtotal: 'Subtotal',
      discount: 'Discount',
      vat: 'VAT',
      total: 'Total',
      checkout: 'Checkout',
      payment: 'Payment',
      totalDue: 'Total Due',
      cash: 'Cash',
      card: 'Card',
      paid: 'Paid',
      remaining: 'Remaining',
      change: 'Change',
      confirmPrint: 'Confirm & Print',
      cancel: 'Cancel',
      processing: 'Processing...',
      outOfStock: 'Out of stock',
      lowStock: 'Low stock',

      // Auth
      login: 'Login',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign In',
      welcome: 'Welcome back',
      loginSubtitle: 'Sign in to your CloudPOS account',
      invalidCredentials: 'Invalid email or password',
      sessionExpired: 'Your session has expired. Please login again.',

      // Dashboard
      todaysSales: "Today's Sales",
      todaysInvoices: "Today's Invoices",
      totalProducts: 'Total Products',
      lowStockItems: 'Low Stock Items',
      recentInvoices: 'Recent Invoices',
      quickActions: 'Quick Actions',
      newSale: 'New Sale',
      manageInventory: 'Manage Inventory',
      viewReports: 'View Reports',
      viewAll: 'View all',

      // Inventory
      addProduct: 'Add Product',
      editProduct: 'Edit Product',
      productName: 'Name',
      barcode: 'Barcode / SKU',
      category: 'Category',
      costPrice: 'Cost Price',
      sellingPrice: 'Selling Price',
      stockQty: 'Stock Quantity',
      minStockAlert: 'Min Stock Alert',
      taxExempt: 'Tax exempt (no VAT)',
      save: 'Save',
      saving: 'Saving...',
      delete: 'Delete',
      actions: 'Actions',
      searchProducts: 'Search by name, barcode, category...',

      // Shifts
      openShift: 'Open Shift',
      closeShift: 'Close Shift',
      openingCash: 'Opening Cash Amount',
      countedCash: 'Counted Cash',
      expectedCash: 'Expected Cash',
      discrepancy: 'Discrepancy',
      shiftOpen: 'Shift Open',
      opened: 'Opened',
      closed: 'Closed',
      status: 'Status',

      // Roles
      ADMIN: 'Admin',
      SUPERVISOR: 'Supervisor',
      STOCK_MANAGER: 'Stock Manager',
      CASHIER: 'Cashier',

      // Common
      loading: 'Loading...',
      noData: 'No data found',
      confirm: 'Confirm',
      search: 'Search',
      add: 'Add',
      edit: 'Edit',
      close: 'Close',
      print: 'Print',
      void: 'Void',
      voidReason: 'Reason for voiding',
      voidInvoice: 'Void Invoice',
      returns: 'Returns',
    },
  },
  ar: {
    translation: {
      dashboard: 'لوحة التحكم',
      pos: 'نقطة البيع',
      invoices: 'الفواتير',
      inventory: 'المخزون',
      customers: 'العملاء',
      suppliers: 'الموردون',
      shifts: 'الورديات',
      reports: 'التقارير',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',

      scanOrSearch: 'امسح الباركود أو ابحث عن منتجات...',
      cart: 'السلة',
      cartEmpty: 'السلة فارغة',
      cartEmptyHint: 'اضغط على المنتجات لإضافتها',
      clear: 'مسح',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصم',
      vat: 'ضريبة القيمة المضافة',
      total: 'الإجمالي',
      checkout: 'الدفع',
      payment: 'الدفع',
      totalDue: 'المبلغ المستحق',
      cash: 'نقداً',
      card: 'بطاقة',
      paid: 'المدفوع',
      remaining: 'المتبقي',
      change: 'الباقي',
      confirmPrint: 'تأكيد وطباعة',
      cancel: 'إلغاء',
      processing: 'جاري المعالجة...',
      outOfStock: 'نفد المخزون',
      lowStock: 'مخزون منخفض',

      login: 'تسجيل الدخول',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      signIn: 'دخول',
      welcome: 'مرحباً بعودتك',
      loginSubtitle: 'سجّل دخولك إلى حساب CloudPOS',
      invalidCredentials: 'بريد إلكتروني أو كلمة مرور غير صحيحة',
      sessionExpired: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',

      todaysSales: 'مبيعات اليوم',
      todaysInvoices: 'فواتير اليوم',
      totalProducts: 'إجمالي المنتجات',
      lowStockItems: 'منتجات منخفضة المخزون',
      recentInvoices: 'أحدث الفواتير',
      quickActions: 'إجراءات سريعة',
      newSale: 'بيع جديد',
      manageInventory: 'إدارة المخزون',
      viewReports: 'عرض التقارير',
      viewAll: 'عرض الكل',

      addProduct: 'إضافة منتج',
      editProduct: 'تعديل منتج',
      productName: 'الاسم',
      barcode: 'الباركود / الرمز',
      category: 'الفئة',
      costPrice: 'سعر التكلفة',
      sellingPrice: 'سعر البيع',
      stockQty: 'الكمية',
      minStockAlert: 'حد التنبيه',
      taxExempt: 'معفى من الضريبة',
      save: 'حفظ',
      saving: 'جاري الحفظ...',
      delete: 'حذف',
      actions: 'إجراءات',
      searchProducts: 'ابحث بالاسم، الباركود، الفئة...',

      openShift: 'فتح وردية',
      closeShift: 'إغلاق وردية',
      openingCash: 'مبلغ افتتاح الصندوق',
      countedCash: 'النقدية المحسوبة',
      expectedCash: 'النقدية المتوقعة',
      discrepancy: 'الفرق',
      shiftOpen: 'الوردية مفتوحة',
      opened: 'تاريخ الفتح',
      closed: 'تاريخ الإغلاق',
      status: 'الحالة',

      ADMIN: 'مدير',
      SUPERVISOR: 'مشرف',
      STOCK_MANAGER: 'مدير مخزون',
      CASHIER: 'كاشير',

      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      confirm: 'تأكيد',
      search: 'بحث',
      add: 'إضافة',
      edit: 'تعديل',
      close: 'إغلاق',
      print: 'طباعة',
      void: 'إلغاء',
      voidReason: 'سبب الإلغاء',
      voidInvoice: 'إلغاء الفاتورة',
      returns: 'المرتجعات',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('cloudpos_lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const toggleLanguage = () => {
  const newLang = i18n.language === 'en' ? 'ar' : 'en';
  i18n.changeLanguage(newLang);
  localStorage.setItem('cloudpos_lang', newLang);
  document.documentElement.lang = newLang;
  document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
};

// Set initial direction
const initLang = localStorage.getItem('cloudpos_lang') || 'en';
document.documentElement.lang = initLang;
document.documentElement.dir = initLang === 'ar' ? 'rtl' : 'ltr';

export default i18n;