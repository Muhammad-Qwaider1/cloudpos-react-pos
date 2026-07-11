# CloudPOS — نظام نقاط البيع

## 📋 نظرة عامة
نظام نقاط بيع محلي كامل الوظائف يدعم:
- وضع Offline + مزامنة تلقائية عند عودة الاتصال
- دعم اللغتين (عربي RTL + إنجليزي LTR)
- وضع ليلي/نهاري
- تثبيت كـ PWA (تثبيت على الجهاز)
- طباعة إيصال حراري (80mm) + إيصال A4
- سجل تدقيق كامل (Audit Log)

## 🛠️ المتطلبات (نظام Windows)

1. **Node.js** v18 أو أحدث — [تحميل هنا](https://nodejs.org)
2. **PostgreSQL** — (يُفضل استخدام Docker)
3. **VS Code** — (مُوصى به)

---------

## 🚀 تشغيل المشروع

### الخطوة 1: تشغيل الـ Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev

### الخطوة 1: تشغيل الـ Frontend
cd ../frontend
npm install
npm run dev

---------

الروابط :
Backend: http://localhost:3000/api
Frontend: http://localhost:5173

---------

أوامر مفيدة 🔧 :
cd backend
npx prisma studio          # فتح قاعدة البيانات
npm run seed               # إعادة إنشاء البيانات الأولية
npx prisma migrate dev     # ترحيل الجداول

---------

الميزات الرئيسية :

✅ إنشاء فواتير يدوي + باركود سكانر
✅ خصومات على المنتج والفاتورة (نسبة أو مبلغ)
✅ حساب الضريبة تلقائياً (15%)
✅ تقسيم الدفع (نقد + بطاقة)
✅ إلغاء ومرتجعات الفواتير
✅ طباعة الإيصال الحراري
✅ إدارة الورديات والصندوق
✅ إدارة المخزون + تنبيه الحد الأدنى
✅ إدارة العملاء + الموردين
✅ Offline Mode + Auto Sync
✅ دعم اللغتين + الوضع الليلي

