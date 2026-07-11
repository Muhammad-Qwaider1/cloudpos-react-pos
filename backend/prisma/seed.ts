import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==================== USERS ====================
  const users = [
    { email: 'admin@cloudpos.com', password: 'admin123', full_name: 'System Admin', role: UserRole.ADMIN, phone: '+1234567890' },
    { email: 'supervisor@cloudpos.com', password: 'supervisor123', full_name: 'Shift Supervisor', role: UserRole.SUPERVISOR, phone: '+1234567891' },
    { email: 'stock@cloudpos.com', password: 'stock123', full_name: 'Stock Manager', role: UserRole.STOCK_MANAGER, phone: '+1234567892' },
    { email: 'cashier@cloudpos.com', password: 'cashier123', full_name: 'Main Cashier', role: UserRole.CASHIER, phone: '+1234567893' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    console.log(`  ✅ User: ${u.email} (${u.role}) — password: ${u.password}`);
  }

  // ==================== PRODUCTS ====================
  const products = [
    { name: 'Espresso Coffee', barcode: '6291000012345', category: 'Beverages', unit_price: 2.50, cost_price: 0.80, stock_quantity: 120, min_stock_alert: 20, unit: 'cup' },
    { name: 'Cappuccino', barcode: '6291000012346', category: 'Beverages', unit_price: 3.50, cost_price: 1.10, stock_quantity: 80, min_stock_alert: 15, unit: 'cup' },
    { name: 'Iced Latte', barcode: '6291000012347', category: 'Beverages', unit_price: 4.00, cost_price: 1.30, stock_quantity: 8, min_stock_alert: 15, unit: 'cup' },
    { name: 'Green Tea', barcode: '6291000012348', category: 'Beverages', unit_price: 2.00, cost_price: 0.50, stock_quantity: 60, min_stock_alert: 10, unit: 'cup' },
    { name: 'Bottled Water 500ml', barcode: '6291000012349', category: 'Beverages', unit_price: 1.00, cost_price: 0.20, stock_quantity: 200, min_stock_alert: 50, unit: 'bottle', tax_exempt: true },
    { name: 'Croissant', barcode: '6291000012350', category: 'Bakery', unit_price: 2.80, cost_price: 0.90, stock_quantity: 25, min_stock_alert: 10, unit: 'pcs' },
    { name: 'Blueberry Muffin', barcode: '6291000012351', category: 'Bakery', unit_price: 3.20, cost_price: 1.00, stock_quantity: 18, min_stock_alert: 8, unit: 'pcs' },
    { name: 'Chocolate Donut', barcode: '6291000012352', category: 'Bakery', unit_price: 1.80, cost_price: 0.60, stock_quantity: 4, min_stock_alert: 10, unit: 'pcs' },
    { name: 'Bagel with Cream Cheese', barcode: '6291000012353', category: 'Bakery', unit_price: 3.50, cost_price: 1.20, stock_quantity: 30, min_stock_alert: 10, unit: 'pcs' },
    { name: 'Caesar Salad', barcode: '6291000012354', category: 'Food', unit_price: 7.50, cost_price: 3.00, stock_quantity: 15, min_stock_alert: 5, unit: 'plate' },
    { name: 'Club Sandwich', barcode: '6291000012355', category: 'Food', unit_price: 6.50, cost_price: 2.50, stock_quantity: 12, min_stock_alert: 5, unit: 'pcs' },
    { name: 'Margherita Pizza Slice', barcode: '6291000012356', category: 'Food', unit_price: 4.50, cost_price: 1.80, stock_quantity: 22, min_stock_alert: 8, unit: 'slice' },
    { name: 'French Fries', barcode: '6291000012357', category: 'Food', unit_price: 3.00, cost_price: 0.80, stock_quantity: 40, min_stock_alert: 10, unit: 'plate' },
    { name: 'Cheeseburger', barcode: '6291000012358', category: 'Food', unit_price: 8.00, cost_price: 3.20, stock_quantity: 16, min_stock_alert: 5, unit: 'pcs' },
    { name: 'Orange Juice', barcode: '6291000012359', category: 'Beverages', unit_price: 2.50, cost_price: 0.70, stock_quantity: 35, min_stock_alert: 10, unit: 'bottle' },
    { name: 'Energy Drink', barcode: '6291000012360', category: 'Beverages', unit_price: 3.00, cost_price: 1.00, stock_quantity: 48, min_stock_alert: 12, unit: 'can' },
    { name: 'Dark Chocolate Bar', barcode: '6291000012361', category: 'Snacks', unit_price: 2.20, cost_price: 0.70, stock_quantity: 55, min_stock_alert: 15, unit: 'bar', tax_exempt: true },
    { name: 'Potato Chips', barcode: '6291000012362', category: 'Snacks', unit_price: 1.50, cost_price: 0.50, stock_quantity: 3, min_stock_alert: 10, unit: 'bag' },
    { name: 'Mineral Water 1L', barcode: '6291000012363', category: 'Beverages', unit_price: 1.50, cost_price: 0.30, stock_quantity: 90, min_stock_alert: 20, unit: 'bottle', tax_exempt: true },
    { name: 'Coca-Cola Can', barcode: '6291000012364', category: 'Beverages', unit_price: 1.80, cost_price: 0.55, stock_quantity: 70, min_stock_alert: 15, unit: 'can' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {},
      create: p,
    });
  }
  console.log(`  ✅ ${products.length} products seeded`);

  // ==================== SUPPLIERS ====================
  const suppliers = [
    { name: 'Global Beverages Co.', phone: '+1234567001', email: 'sales@globalbev.com', contact_person: 'John Smith', address: '123 Industrial St' },
    { name: 'Fresh Bakery Supply', phone: '+1234567002', email: 'orders@freshbakery.com', contact_person: 'Maria Garcia', address: '456 Baker Ave' },
    { name: 'FoodService Direct', phone: '+1234567003', email: 'info@foodservice.com', contact_person: 'Ahmed Hassan', address: '789 Commerce Blvd' },
  ];

  for (const s of suppliers) {
    await prisma.supplier.create({ data: s }).catch(() => {});
  }
  console.log(`  ✅ ${suppliers.length} suppliers seeded`);

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin:      admin@cloudpos.com / admin123');
  console.log('   Supervisor: supervisor@cloudpos.com / supervisor123');
  console.log('   Stock Mgr:  stock@cloudpos.com / stock123');
  console.log('   Cashier:    cashier@cloudpos.com / cashier123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });