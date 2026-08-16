// @ts-nocheck
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
/**
 * Seed script — fills the database with dummy data so every feature and edge
 * case in the app can be exercised.
 *
 * Run from the project root:
 *   npm run seed           (wipes all collections first, then seeds)
 *   npm run seed -- --no-wipe   (keeps existing data, only adds what is missing)
 *
 * It connects to the same MongoDB instance the app uses (startMongoDB), so it
 * works whether the app is running or not.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import net from 'net';
import { startMongoDB } from '@api/config/mongodb';
import Settings from '@api/models/settings';
import Role from '@api/models/role';
import User from '@api/models/user';
import Warehouse from '@api/models/warehouse';
import Category from '@api/models/categories';
import Customer from '@api/models/customers';
import Product from '@api/models/products';
import Bill from '@api/models/bills';
import StockMovement from '@api/models/stockMovement';
import Transaction from '@api/models/transactions';
import WarehouseTransfer from '@api/models/warehouseTransfer';
import AuditLog from '@api/models/auditLog';
import DeliveryReturn from '@api/models/deliveryReturn';
import { ALL_PERMISSIONS } from '@api/constants/permissions';

const DEFAULT_ID = '0a0aaa0a0aa00000aaaaaa0a';
const DEFAULT_WAREHOUSE_ID = '0a0aaa0a0aa00000aaaaaa0b';
const PASSWORD = 'admin123';

const counts: Record<string, number> = {
  settings: 0, roles: 0, users: 0, warehouses: 0, categories: 0,
  customers: 0, products: 0, bills: 0, movements: 0, transactions: 0,
  transfers: 0, auditLogs: 0, deliveryReturns: 0,
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const round2 = (n: number) => Math.round(n * 100) / 100;
const ttcOf = (ht: number, tva: number) => round2(ht * (1 + tva / 100));

function randomDate(maxDaysAgo: number, minDaysAgo = 0): Date {
  const max = Date.now() - minDaysAgo * 86400000;
  const min = Date.now() - maxDaysAgo * 86400000;
  return new Date(min + Math.random() * (max - min));
}

function randomBarCode(): string {
  let code = '613';
  for (let i = 0; i < 10; i += 1) code += Math.floor(Math.random() * 10);
  return code;
}

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '127.0.0.1');
  });
}

// ---------------------------------------------------------------------------
// Static seed data
// ---------------------------------------------------------------------------

const ROLE_DEFS = [
  {
    name: 'Admin',
    description: 'Full system access',
    permissions: ALL_PERMISSIONS,
  },
  {
    name: 'Warehouse Manager',
    description: 'Manages stock, purchases, transfers, inventory counts',
    permissions: [
      'dashboard.view',
      'products.view', 'products.create', 'products.edit',
      'categories.view', 'categories.create', 'categories.edit',
      'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.approve', 'purchases.print', 'purchases.export',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.export',
      'warehouses.view',
      'transfers.view', 'transfers.create', 'transfers.edit', 'transfers.approve',
      'orders.view', 'orders.create', 'orders.edit', 'orders.print',
      'deliveries.view', 'deliveries.create', 'deliveries.edit', 'deliveries.print',
      'reports.view', 'reports.export',
      'suppliers.view', 'suppliers.create', 'suppliers.edit',
    ],
  },
  {
    name: 'Store Manager',
    description: 'Manages one or more assigned stores, sales, purchases, reports',
    permissions: [
      'dashboard.view',
      'products.view', 'products.edit',
      'customers.view', 'customers.create', 'customers.edit',
      'sales.view', 'sales.create', 'sales.edit', 'sales.approve', 'sales.cancel', 'sales.print', 'sales.export',
      'purchases.view', 'purchases.create', 'purchases.print',
      'inventory.view',
      'reports.view', 'reports.export', 'reports.print',
      'orders.view', 'orders.create', 'orders.print',
      'deliveries.view', 'deliveries.create', 'deliveries.print',
      'categories.view',
    ],
  },
  {
    name: 'Sales Manager',
    description: 'Sales, customers, pricing, sales reports',
    permissions: [
      'dashboard.view',
      'sales.view', 'sales.create', 'sales.edit', 'sales.approve', 'sales.cancel', 'sales.print', 'sales.export',
      'customers.view', 'customers.create', 'customers.edit',
      'products.view', 'products.edit',
      'categories.view',
      'reports.view', 'reports.export', 'reports.print',
      'deliveries.view', 'deliveries.create', 'deliveries.print',
      'orders.view',
    ],
  },
  {
    name: 'Cashier / Salesperson',
    description: 'Create sales only, no price or stock edits',
    permissions: [
      'sales.view', 'sales.create', 'sales.print',
      'customers.view', 'customers.create',
      'products.view',
      'dashboard.view',
    ],
  },
  {
    name: 'Inventory Clerk',
    description: 'Receives goods, adjusts stock, performs inventory counts',
    permissions: [
      'products.view',
      'categories.view',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.export', 'inventory.print',
      'purchases.view', 'purchases.create', 'purchases.print',
      'warehouses.view',
      'orders.view',
      'deliveries.view',
    ],
  },
  {
    name: 'Accountant',
    description: 'Payments, expenses, financial reports',
    permissions: [
      'dashboard.view',
      'purchases.view', 'purchases.print', 'purchases.export',
      'sales.view', 'sales.print', 'sales.export',
      'reports.view', 'reports.export', 'reports.print',
      'products.view',
      'customers.view',
      'suppliers.view',
    ],
  },
  {
    name: 'Auditor',
    description: 'Read-only access to everything, including logs and reports',
    permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith('settings.') && p !== 'roles.create' && p !== 'roles.edit' && p !== 'roles.delete'),
  },
];

const CATEGORY_DEFS = [
  { name: 'Electronics', buy: [800, 45000], tva: 19 },
  { name: 'Apparel & Textiles', buy: [300, 9000], tva: 19 },
  { name: 'Groceries & Beverages', buy: [60, 4000], tva: 9 },
  { name: 'Office Supplies', buy: [100, 10000], tva: 19 },
  { name: 'Home & Furniture', buy: [500, 18000], tva: 19 },
  { name: 'Cosmetics & Hygiene', buy: [200, 5000], tva: 19 },
  { name: 'Sports & Outdoor', buy: [400, 14000], tva: 19 },
  { name: 'Auto Parts', buy: [800, 20000], tva: 19 },
  { name: 'Books & Media', buy: [150, 3000], tva: 9 },
];

const PRODUCT_NAMES: Record<string, string[]> = {
  Electronics: [
    'Smartphone X1', 'Laptop Pro 15', 'Bluetooth Headset', 'USB-C Cable 1m',
    'Power Bank 10000mAh', 'LED Monitor 24"', 'Wireless Mouse', 'Mechanical Keyboard',
    'Smart Watch S2', 'HDMI Cable 2m', 'External HDD 1TB', 'Tablet Tab A',
  ],
  'Apparel & Textiles': [
    'Men T-Shirt (L)', 'Women Dress (M)', 'Sneakers Size 42', 'Leather Jacket',
    'Cotton Hoodie', 'Denim Jeans', 'Kids T-Shirt',
  ],
  'Groceries & Beverages': [
    'Olive Oil 5L', 'Semolina 25kg', 'Sugar 1kg', 'Green Tea 250g',
    'Milk 1L', 'Couscous 1kg', 'Dates Deglet Nour 1kg', 'Coffee 250g',
  ],
  'Office Supplies': [
    'A4 Paper Pack', 'Ballpoint Pen Pack', 'Notebook A5', 'Ink Cartridge',
    'Stapler', 'Desk Organizer', 'Laser Printer',
  ],
  'Home & Furniture': [
    'Wooden Chair', 'Desk Lamp', 'Curtain Set', 'Table Fan', 'Cookware Set',
  ],
  'Cosmetics & Hygiene': [
    'Shampoo 500ml', 'Hand Cream', 'Perfume 50ml', 'Toothpaste Pack',
  ],
  'Sports & Outdoor': [
    'Yoga Mat', 'Dumbbell Set 10kg', 'Football Size 5', 'Cycling Helmet',
  ],
  'Auto Parts': [
    'Engine Oil 5W30', 'Spark Plug Set', 'Windshield Wiper', 'Brake Pads',
  ],
  'Books & Media': [
    'Fiction Novel', 'Journal Notebook', 'Children Story Book',
  ],
};

const CLIENTS = [
  'Ahmed Benali', 'Fatima Zohra', 'Karim Hadj', 'Sara Mansouri',
  'Yacine Boudiaf', 'Amina Cherif', 'Mehdi Larbi', 'Nour El Houda',
  'Riad Belkacem', 'Dalila Saidi',
];

const SUPPLIERS = [
  'Ets. Bouchama', 'Electro Distribution', 'TunisieTextile', 'AgroPlus',
  'Print Office Algérie', 'Cosmétiques Maghreb', 'AutoParts Center', 'SportZone',
];

const WILAYAS = ['16 - Alger', '31 - Oran', '25 - Constantine', '31 - Oran', '16 - Alger', '9 - Blida', '23 - Annaba', '31 - Oran'];

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

async function wipeDatabase(): Promise<void> {
  const collections = [
    'settings', 'roles', 'users', 'warehouses', 'categories', 'customers',
    'products', 'bills', 'stockmovements', 'transactions', 'warehousetransfers',
    'auditlogs', 'payments', 'deliveryreturns',
  ];
  for (const name of collections) {
    try {
      await mongoose.connection.collection(name).drop();
      console.log(`  dropped collection: ${name}`);
    } catch {
      // collection does not exist, ignore
    }
  }
}

async function ensureOne<T extends { save(): Promise<any> } & { _id: any }>(
  Model: any,
  data: Record<string, any>,
  filter: Record<string, any>,
): Promise<T> {
  const existing = await Model.findOne(filter).lean();
  if (existing) return existing as T;
  const doc = await new Model(data).save();
  counts[Model.modelName.toLowerCase()] += 1;
  return doc as T;
}

// ---------------------------------------------------------------------------
// Seed steps
// ---------------------------------------------------------------------------

async function seedRolesAndUsers() {
  console.log('\n[1/9] Seeding roles and users...');

  const roles: any[] = [];
  for (const def of ROLE_DEFS) {
    let role = await Role.findOne({ name: def.name });
    if (!role) {
      role = await new Role(def).save();
      counts.roles += 1;
    }
    roles.push(role);
  }
  const roleId = (name: string) => roles.find((r) => r.name === name)?._id;

  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(PASSWORD, salt);

  const mainWh = DEFAULT_WAREHOUSE_ID;
  const bWh = '0a0aaa0a0aa00000aaaaaa0c';

  const userDefs = [
    {
      username: 'admin', email: 'admin@solustock.local', fullname: 'Administrator',
      role: 'Admin', isMainAccount: true, access: 'all', language: 'en',
    },
    {
      username: 'manager.algiers', email: 'manager.algiers@solustock.local', fullname: 'Karim Manager',
      role: 'Warehouse Manager', access: 'assigned', wh: [mainWh, bWh], defaultWh: mainWh,
    },
    {
      username: 'cashier.ahmed', email: 'cashier.ahmed@solustock.local', fullname: 'Ahmed Cashier',
      role: 'Cashier / Salesperson', access: 'assigned', wh: [mainWh], defaultWh: mainWh,
    },
    {
      username: 'sales.sara', email: 'sales.sara@solustock.local', fullname: 'Sara Sales',
      role: 'Sales Manager', access: 'all',
    },
    {
      username: 'accountant.yacine', email: 'accountant.yacine@solustock.local', fullname: 'Yacine Accountant',
      role: 'Accountant', access: 'all',
    },
    {
      username: 'clerk.amine', email: 'clerk.amine@solustock.local', fullname: 'Amine Clerk',
      role: 'Inventory Clerk', access: 'assigned', wh: [bWh], defaultWh: bWh,
    },
    {
      username: 'viewer.dali', email: 'viewer.dali@solustock.local', fullname: 'Dali Viewer',
      role: 'Auditor', access: 'all', status: 'suspended',
    },
    {
      username: 'intern.fatima', email: 'intern.fatima@solustock.local', fullname: 'Fatima Intern',
      role: 'Cashier / Salesperson', access: 'assigned', wh: [mainWh], defaultWh: mainWh,
      status: 'disabled',
    },
    {
      username: 'delivery.moussa', email: 'delivery.moussa@solustock.local', fullname: 'Moussa Livreur',
      role: 'Warehouse Manager', access: 'assigned', wh: [mainWh, bWh], defaultWh: mainWh,
      type: 'VENDOR',
    },
    {
      username: 'delivery.lydia', email: 'delivery.lydia@solustock.local', fullname: 'Lydia Livreuse',
      role: 'Warehouse Manager', access: 'assigned', wh: [mainWh], defaultWh: mainWh,
      type: 'VENDOR',
    },
  ];

  const users: any[] = [];
  for (const def of userDefs) {
    let user = await User.findOne({ username: def.username });
    if (!user) {
      const roleDoc = roleId(def.role);
      const rolePermissions = roles.find((r) => r.name === def.role)?.permissions || [];
      user = await new User({
        username: def.username,
        email: def.email,
        fullname: def.fullname,
        password: hash,
        salt,
        isMainAccount: !!def.isMainAccount,
        type: def.type || 'USER',
        status: def.status || 'active',
        role: roleDoc,
        permissions: rolePermissions,
        userPermissions: [],
        assignedWarehouses: def.wh || [],
        warehouseAccessMode: def.access,
        defaultWarehouse: def.defaultWh,
        preferredLanguage: def.language || 'fr',
        profilePicture: 'default.png',
        lastLogin: randomDate(20, 1),
      }).save();
      counts.users += 1;
    }
    users.push(user);
  }

  return {
    adminUserId: users[0]._id.toString(),
    userIds: users.map((u) => u._id.toString()),
    vendorIds: users.filter((u) => u.type === 'VENDOR').map((u) => u._id.toString()),
  };
}

async function seedSettings() {
  console.log('\n[2/9] Seeding settings...');
  await ensureOne(Settings, {
    allowOutOfStockSales: false,
    allowOutOfStockOrders: false,
    dashboardStatsEnabled: true,
    dashboardStatsBlurred: false,
    companyName: 'SoluStock Demo',
    rc: '16/00-12345678B00',
    nif: '000216012345678',
    ai: '16123456789',
    nis: '0016031234567',
    companyAddress: '12 Rue Didouche Mourad, Alger',
    companyPhone: '021 00 00 00',
    mobile: '0550 00 00 00',
    website: 'www.solustock.local',
    email: 'contact@solustock.local',
    wilaya: '16 - Alger',
    accountNumber: '007 000 000 0000000000 00',
    rib: '007 000 00 000000000000 00',
    articleNumber: '00000000',
    stamp: 100,
    tva: 19,
    tvaEnabled: true,
  }, {});
  counts.settings += 1;
}

async function seedWarehouses(adminUserId: string) {
  console.log('\n[3/9] Seeding warehouses...');
  const defs = [
    {
      _id: DEFAULT_WAREHOUSE_ID, name: 'Main Warehouse', code: 'main',
      address: '12 Rue Didouche Mourad, Alger', phone: '021 00 00 00',
      email: 'main@solustock.local', isActive: true, manager: adminUserId,
      createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z'),
    },
    {
      _id: '0a0aaa0a0aa00000aaaaaa0c', name: 'Warehouse B - Oran', code: 'wha-oran',
      address: 'Boulevard de la Soummam, Oran', phone: '041 00 00 00',
      email: 'oran@solustock.local', isActive: true, manager: adminUserId,
    },
    {
      _id: '0a0aaa0a0aa00000aaaaaa0d', name: 'Warehouse C - Constantine', code: 'wha-constantine',
      address: 'Route de Batna, Constantine', phone: '031 00 00 00',
      email: 'constantine@solustock.local', isActive: true, manager: adminUserId,
    },
    {
      _id: '0a0aaa0a0aa00000aaaaaa0e', name: 'Warehouse D - Retired', code: 'wha-retired',
      address: 'Zone industrielle, Alger', phone: '021 00 00 00', isActive: false,
    },
  ];

  const ids: string[] = [];
  for (const def of defs) {
    let wh = await Warehouse.findById(def._id);
    if (!wh) {
      wh = await new Warehouse(def).save();
      counts.warehouses += 1;
    }
    ids.push(wh._id.toString());
  }
  return ids;
}

async function seedCategories() {
  console.log('\n[4/9] Seeding categories...');
  const ids: any[] = [];
  let cat = await Category.findById(DEFAULT_ID);
  if (!cat) {
    cat = await new Category({
      _id: DEFAULT_ID,
      name: 'Uncategorized',
      description: 'Default Category',
      createdAt: new Date('1970'), updatedAt: new Date('1970'),
    }).save();
    counts.categories += 1;
  }
  ids.push(cat._id);

  for (const def of CATEGORY_DEFS) {
    let c = await Category.findOne({ name: def.name });
    if (!c) {
      c = await new Category({ name: def.name, description: `Products under ${def.name}` }).save();
      counts.categories += 1;
    }
    ids.push(c._id);
  }
  return { categoryIds: ids.map((i) => i.toString()) };
}

async function seedCustomers() {
  console.log('\n[5/9] Seeding customers...');
  const clientIds: string[] = [];
  const supplierIds: string[] = [];

  let unspecified = await Customer.findById(DEFAULT_ID);
  if (!unspecified) {
    unspecified = await new Customer({
      _id: DEFAULT_ID,
      fullname: 'Unspecified',
      createdAt: new Date('1970'), updatedAt: new Date('1970'),
    }).save();
    counts.customers += 1;
  }

  for (const name of CLIENTS) {
    const c = await new Customer({
      fullname: name,
      address: `${rand(1, 300)} Rue Example, ${pick(WILAYAS).split(' - ')[1]}`,
      phoneNumber: `05${rand(10, 99)} ${rand(100, 999)} ${rand(1000, 9999)}`,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
      wilaya: pick(WILAYAS),
      hasWhatsapp: Math.random() > 0.4,
      rc: `${rand(10, 99)}/00-${rand(100000, 999999)}`,
      nif: `0002${rand(1000000, 9999999)}`,
      type: 'Client',
    }).save();
    clientIds.push(c._id.toString());
    counts.customers += 1;
  }

  for (const name of SUPPLIERS) {
    const c = await new Customer({
      fullname: name,
      address: `${rand(1, 300)} Rue Supplier, Alger`,
      phoneNumber: `021 ${rand(100000, 999999)}`,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '')}@supplier.com`,
      wilaya: '16 - Alger',
      hasWhatsapp: true,
      rc: `${rand(10, 99)}/00-${rand(100000, 999999)}`,
      nif: `0002${rand(1000000, 9999999)}`,
      type: 'Supplier',
    }).save();
    supplierIds.push(c._id.toString());
    counts.customers += 1;
  }

  return { clientIds, supplierIds };
}

async function seedProducts(categoryIds: string[]) {
  console.log('\n[6/9] Seeding products...');

  const catByName: Record<string, string> = {};
  CATEGORY_DEFS.forEach((def, idx) => {
    catByName[def.name] = categoryIds[idx + 1];
  });

  const products: any[] = [];
  const stock = new Map<string, { qty: number; reserved: number }>();

  let index = 0;
  for (const def of CATEGORY_DEFS) {
    const names = PRODUCT_NAMES[def.name] || [];
    for (const name of names) {
      index += 1;
      const buyPrice = rand(def.buy[0], def.buy[1]);
      const barCode = randomBarCode();
      const opening = rand(25, 130);
      const product = new Product({
        id: `P-${String(index).padStart(4, '0')}`,
        barCode,
        productName: name,
        quantity: opening,
        stack: rand(0, 5),
        buyPrice,
        reserved: 0,
        sellPrice_1: round2(buyPrice * 1.35),
        sellPrice_2: round2(buyPrice * 1.30),
        sellPrice_3: round2(buyPrice * 1.25),
        tva: def.tva,
        category: catByName[def.name],
        notify: true,
      });
      await product.save();
      counts.products += 1;
      products.push(product);
      stock.set(barCode, { qty: opening, reserved: 0 });
    }
  }

  return { products, stock };
}

// ---------------------------------------------------------------------------
// Bills
// ---------------------------------------------------------------------------

const toBillProduct = (p: any, qty: number) => ({
  id: p._id.toString(),
  barCode: p.barCode,
  productName: p.productName,
  quantity: qty,
  stack: p.stack,
  buyPrice: p.buyPrice,
  sellPrice_1: p.sellPrice_1,
  sellPrice_2: p.sellPrice_2,
  sellPrice_3: p.sellPrice_3,
  tva: p.tva,
});

const computeTotals = (items: { p: any; qty: number }[], priceField: 'buyPrice' | 'sellPrice_1') => {
  let ht = 0;
  let ttc = 0;
  for (const it of items) {
    const lineHT = it.p[priceField] * it.qty;
    ht += lineHT;
    ttc += ttcOf(lineHT, it.p.tva);
  }
  return { orderTotalHT: round2(ht), orderTotalTTC: round2(ttc) };
};

const paymentSplit = (ttc: number) => {
  const r = Math.random();
  if (r < 0.45) return { paid: ttc, debts: 0 };
  if (r < 0.70) return { paid: round2(ttc * 0.6), debts: round2(ttc * 0.4) };
  return { paid: 0, debts: ttc };
};

interface CreateBillInput {
  type: 'BUY' | 'SALE' | 'ORDER' | 'DELIVERY';
  orderId: string;
  date: Date;
  items: { p: any; qty: number }[];
  priceField: 'buyPrice' | 'sellPrice_1';
  warehouse?: string;
  customer?: string;
  category?: string;
  status?: 'pending' | 'cancelled' | 'completed';
  reservedUntil?: Date;
  convertFromOrder?: string;
  createBy: string;
  cancelledBy?: string;
  cancelReason?: string;
  description?: string;
  salesPerson?: string;
}

async function createBill(input: CreateBillInput): Promise<{ bill: any; paid: number; debts: number } | null> {
  const totals = computeTotals(input.items, input.priceField);
  const isCancelled = input.status === 'cancelled';
  const { paid, debts } = isCancelled ? { paid: 0, debts: 0 } : paymentSplit(totals.orderTotalTTC);

  const exists = await Bill.exists({ type: input.type, orderId: input.orderId });
  if (exists) {
    console.log(`  skip existing bill ${input.type} #${input.orderId}`);
    return null;
  }

  const payload: any = {
    billDate: input.date.toISOString(),
    orderId: input.orderId,
    manualOrderId: !/^\d+$/.test(input.orderId),
    type: input.type,
    status: input.status || 'completed',
    products: input.items.map((it) => toBillProduct(it.p, it.qty)),
    orderTotalHT: totals.orderTotalHT,
    orderTotalTTC: totals.orderTotalTTC,
    orderPaid: paid,
    orderDebts: debts,
    paymentMethod: paid > 0 ? 'Cash' : '',
    pricingCategory: input.type === 'BUY' ? undefined : 0,
    description: input.description || '',
    content: '',
    createdBy: input.createBy,
    createdAt: input.date,
    updatedAt: input.date,
  };
  if (input.warehouse) payload.warehouse = input.warehouse;
  if (input.customer) payload.customer = input.customer;
  if (input.category) payload.category = input.category;
  if (input.reservedUntil) payload.reservedUntil = input.reservedUntil;
  if (input.convertFromOrder) payload.convertFromOrder = input.convertFromOrder;
  if (input.cancelledBy) payload.cancelledBy = input.cancelledBy;
  if (input.cancelReason) payload.cancelReason = input.cancelReason;
  if (input.salesPerson) payload.salesPerson = input.salesPerson;

  const bill = await new Bill(payload).save();
  counts.bills += 1;
  return { bill, paid, debts };
}

const makeMovement = (m: any) => {
  counts.movements += 1;
  return new StockMovement(m).save();
};

async function seedBills(opts: {
  products: any[];
  stock: Map<string, { qty: number; reserved: number }>;
  categoryIds: string[];
  clientIds: string[];
  supplierIds: string[];
  warehouseIds: string[];
  userIds: string[];
  vendorIds: string[];
}) {
  const {
    products, stock, categoryIds, clientIds, supplierIds, warehouseIds, userIds, vendorIds,
  } = opts;

  const activeWhs = warehouseIds.slice(0, 3);

  console.log('\n[7/9] Seeding bills (BUY / DELIVERY / ORDER / SALE)...');

  const maxOrder = async (type: string): Promise<number> => {
    const agg = await Bill.aggregate([
      { $match: { type, orderId: { $regex: /^\d+$/ } } },
      { $group: { _id: null, max: { $max: { $toInt: '$orderId' } } } },
    ]);
    return agg[0]?.max || 0;
  };

  let buyNo = await maxOrder('BUY');
  let deliveryNo = await maxOrder('DELIVERY');
  let orderNo = await maxOrder('ORDER');
  let saleNo = await maxOrder('SALE');

  const pickBuyItems = () => shuffle(products)
    .slice(0, rand(3, 8))
    .map((p) => ({ p, qty: rand(10, 40) }));

  const pickSellItems = () => {
    const items: { p: any; qty: number }[] = [];
    const target = rand(1, 5);
    for (const p of shuffle(products)) {
      if (items.length >= target) break;
      const s = stock.get(p.barCode);
      const available = s.qty - s.reserved;
      if (available <= 0) continue;
      items.push({ p, qty: Math.min(rand(1, 6), available) });
    }
    return items;
  };

  // --- BUY (purchases / bon de réception) --------------------------------
  for (let i = 0; i < 18; i += 1) {
    buyNo += 1;
    const date = i === 17 ? new Date() : randomDate(180, 0);
    const items = pickBuyItems();
    const warehouse = pick(activeWhs);
    const customer = Math.random() > 0.35 ? pick(supplierIds) : undefined;
    const category = pick(categoryIds);

    if (i === 5) {
      // Cancelled purchase: recorded but stock never entered.
      await createBill({
        type: 'BUY', orderId: String(buyNo), date, items, priceField: 'buyPrice',
        warehouse, customer, category, status: 'cancelled', createBy: pick(userIds),
        cancelledBy: pick(userIds), cancelReason: 'Wrong order received from supplier',
        description: 'Annulée par erreur de commande',
      });
      continue;
    }

    const created = await createBill({
      type: 'BUY', orderId: String(buyNo), date, items, priceField: 'buyPrice',
      warehouse, customer, category, createBy: pick(userIds),
      description: 'Bon de réception fournisseur',
    });
    if (!created) continue;
    const { bill, debts } = created;

    // stock in
    for (const it of items) {
      stock.get(it.p.barCode).qty += it.qty;
      await makeMovement({
        product: it.p._id, warehouse, type: 'IN',
        quantity: it.qty, unitPrice: it.p.buyPrice,
        totalPrice: round2(it.p.buyPrice * it.qty),
        reference: `BUY-${buyNo}`, relatedBill: bill._id,
        createdBy: pick(userIds), createdAt: date,
      });
    }

    // supplier credit (unpaid amount)
    if (customer && debts > 0) {
      const cust = await Customer.findById(customer);
      if (cust) {
        const oldFunds = Number(cust.credit || 0);
        const newFunds = oldFunds + debts;
        cust.credit = newFunds;
        await cust.save();
        await new Transaction({
          customer, type: 'BUY', addedAmount: debts, oldFunds, newFunds,
          bill: bill._id, description: `BUY bill #${buyNo}`,
          createdAt: date, updatedAt: date,
        }).save();
        counts.transactions += 1;
      }
    }
  }

  // --- DELIVERY (sales that move stock) ---------------------------------
  for (let i = 0; i < 26; i += 1) {
    deliveryNo += 1;
    const date = i === 25 ? new Date() : randomDate(180, 0);
    const items = pickSellItems();
    if (items.length === 0) continue;
    const warehouse = pick(activeWhs);
    const customer = Math.random() > 0.25 ? pick(clientIds) : undefined;
    const category = pick(categoryIds);

    const manual = i === 24;
    const created = await createBill({
      type: 'DELIVERY', orderId: manual ? `LIV-${100 + i}` : String(deliveryNo),
      date, items, priceField: 'sellPrice_1', warehouse, customer, category,
      createBy: pick(userIds), description: 'Bon de livraison',
      salesPerson: vendorIds.length ? pick(vendorIds) : undefined,
    });
    if (!created) continue;
    const { bill, debts } = created;

    // stock out
    for (const it of items) {
      stock.get(it.p.barCode).qty -= it.qty;
      await makeMovement({
        product: it.p._id, warehouse, type: 'OUT',
        quantity: -it.qty,
        reference: `DELIVERY-${manual ? `LIV-${100 + i}` : deliveryNo}`,
        relatedBill: bill._id, createdBy: pick(userIds), createdAt: date,
      });
    }

    // client credit (unpaid amount)
    if (customer && debts > 0) {
      const cust = await Customer.findById(customer);
      if (cust) {
        const oldFunds = Number(cust.credit || 0);
        const newFunds = round2(oldFunds - debts);
        cust.credit = newFunds;
        await cust.save();
        await new Transaction({
          customer, type: 'SALE', addedAmount: -debts, oldFunds, newFunds,
          bill: bill._id, description: `DELIVERY bill #${deliveryNo}`,
          createdAt: date, updatedAt: date,
        }).save();
        counts.transactions += 1;
      }
    }
  }

  // --- ORDER (reservations) ---------------------------------------------
  const orderSpecs = [
    { status: 'pending', days: 7, customer: true, convert: false, paid: false },
    { status: 'pending', days: 1, customer: false, convert: false, paid: true },
    { status: 'pending', days: -1, customer: false, convert: false, paid: false }, // expired → auto-cancelled
    { status: 'completed', days: 0, customer: true, convert: false, paid: false },
    { status: 'cancelled', days: 0, customer: false, convert: false, paid: false },
    { status: 'pending', days: 4, customer: true, convert: true, paid: false },
    { status: 'pending', days: 2, customer: false, convert: false, paid: false },
    { status: 'completed', days: 0, customer: false, convert: false, paid: true },
  ];

  for (const spec of orderSpecs) {
    orderNo += 1;
    const date = randomDate(90, 0);
    const items = pickSellItems();
    if (items.length === 0) continue;
    const warehouse = pick(activeWhs);
    const customer = spec.customer ? pick(clientIds) : undefined;
    const reservedUntil = spec.status === 'pending'
      ? new Date(Date.now() + spec.days * 86400000 + rand(1, 10) * 3600000)
      : undefined;

    const created = await createBill({
      type: 'ORDER', orderId: String(orderNo), date, items, priceField: 'sellPrice_1',
      warehouse, customer, reservedUntil, status: 'pending', createBy: pick(userIds),
      description: spec.convert ? 'Commande convertie en livraison' : 'Commande client',
    });
    if (!created) continue;
    const { bill } = created;

    // reserve stock
    for (const it of items) {
      const s = stock.get(it.p.barCode);
      s.qty -= it.qty;
      s.reserved += it.qty;
      await makeMovement({
        product: it.p._id, warehouse, type: 'OUT', quantity: -it.qty,
        reference: `ORDER-${orderNo}`, relatedBill: bill._id,
        createdBy: pick(userIds), createdAt: date,
      });
    }

    if (spec.convert) {
      // convert to delivery: stock was already reserved, just record delivery + movement
      deliveryNo += 1;
      const dDate = new Date(date.getTime() + 86400000);
      await createBill({
        type: 'DELIVERY', orderId: String(deliveryNo), date: dDate, items,
        priceField: 'sellPrice_1', warehouse, customer,
        convertFromOrder: bill.orderId, createBy: pick(userIds),
        description: 'Livraison depuis commande',
        salesPerson: vendorIds.length ? pick(vendorIds) : undefined,
      });
      for (const it of items) {
        await makeMovement({
          product: it.p._id, warehouse, type: 'OUT', quantity: -it.qty,
          reference: `DELIVERY-CONV-${bill.orderId}-${deliveryNo}`,
          relatedBill: bill._id, createdBy: pick(userIds), createdAt: dDate,
        });
      }
      bill.status = 'completed';
      for (const it of items) {
        stock.get(it.p.barCode).reserved -= it.qty;
      }
      await bill.save();
    } else if (spec.status === 'completed') {
      bill.status = 'completed';
      for (const it of items) {
        stock.get(it.p.barCode).reserved -= it.qty;
      }
      await bill.save();
    } else if (spec.status === 'cancelled') {
      bill.status = 'cancelled';
      bill.cancelledBy = pick(userIds);
      bill.cancelReason = 'Client cancelled the order';
      for (const it of items) {
        const s = stock.get(it.p.barCode);
        s.qty += it.qty;
        s.reserved -= it.qty;
      }
      await bill.save();
    }
    // expired pending orders stay reserved; the scheduler will release them.
  }

  // --- SALE (invoices, no stock movement) -------------------------------
  for (let i = 0; i < 15; i += 1) {
    saleNo += 1;
    const date = randomDate(180, 0);
    const items = shuffle(products).slice(0, rand(1, 4)).map((p) => ({ p, qty: rand(1, 3) }));
    const customer = Math.random() > 0.3 ? pick(clientIds) : undefined;
    const manual = i === 14;
    const warehouse = pick(activeWhs);
    await createBill({
      type: 'SALE', orderId: manual ? `INV-2026-${100 + i}` : String(saleNo),
      date, items, priceField: 'sellPrice_1', warehouse, customer, createBy: pick(userIds),
      description: 'Facture de vente',
    });
  }

    // FUND (virements adding credit to clients)
    for (let i = 0; i < 10; i += 1) {
      const customer = pick(clientIds);
      const date = randomDate(170, 0);
      const addedAmount = rand(5000, 200000);
      const cust = await Customer.findById(customer);
      if (!cust) continue;
      const oldFunds = Number(cust.credit || 0);
      const newFunds = oldFunds + addedAmount;
      cust.credit = newFunds;
      await cust.save();
      await new Transaction({
        customer, type: 'FUND', addedAmount, oldFunds, newFunds,
        description: 'Virement bancaire',
        createdAt: date, updatedAt: date,
      }).save();
      counts.transactions += 1;
    }
  }

// ---------------------------------------------------------------------------
// Warehouse transfers
// ---------------------------------------------------------------------------
const transferredSet = new Set<string>();

async function seedTransfers(opts: {
  products: any[];
  stock: Map<string, { qty: number; reserved: number }>;
  warehouseIds: string[];
  userIds: string[];
}) {
  const { products, stock, warehouseIds, userIds } = opts;
  const mainWh = warehouseIds[0];
  const bWh = warehouseIds[1];

  console.log('\n[8/9] Seeding warehouse transfers...');

  const nextNumber = async () => {
    const count = await WarehouseTransfer.countDocuments();
    return `TRF-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  };

  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  // completed transfer
  const candidates = products.filter((p) => stock.get(p.barCode).qty >= 10);
  const items = shuffle(candidates).slice(0, rand(3, 5)).map((p) => ({
    product: p._id,
    quantity: rand(2, Math.min(8, stock.get(p.barCode).qty - 2)),
  }));
  const num = await nextNumber();
  const date = randomDate(60, 10);
  const transfer = await new WarehouseTransfer({
    transferNumber: num,
    fromWarehouse: mainWh,
    toWarehouse: bWh,
    products: items,
    notes: 'Seed: completed transfer between warehouses',
    status: 'completed',
    createdBy: pick(userIds),
    approvedBy: pick(userIds),
    completedAt: date,
    createdAt: date,
    updatedAt: date,
  }).save();
  counts.transfers += 1;

  for (const item of items) {
    const p = byId.get(item.product.toString());
    if (p) transferredSet.add(p.barCode);
    await makeMovement({
      product: item.product, warehouse: mainWh, type: 'TRANSFER_OUT',
      quantity: -item.quantity, reference: num, relatedTransfer: transfer._id,
      createdBy: pick(userIds), createdAt: date,
    });
    await makeMovement({
      product: item.product, warehouse: bWh, type: 'TRANSFER_IN',
      quantity: item.quantity, reference: num, relatedTransfer: transfer._id,
      createdBy: pick(userIds), createdAt: date,
    });
  }

  // pending transfer
  const pendingItems = shuffle(candidates).slice(0, 2).map((p) => ({
    product: p._id,
    quantity: rand(2, 5),
  }));
  const pendingNum = await nextNumber();
  await new WarehouseTransfer({
    transferNumber: pendingNum,
    fromWarehouse: mainWh,
    toWarehouse: bWh,
    products: pendingItems,
    notes: 'Seed: pending transfer awaiting approval',
    status: 'pending',
    createdBy: pick(userIds),
    createdAt: randomDate(30, 3),
  }).save();
  counts.transfers += 1;

  // cancelled transfer
  const cancelledItems = shuffle(candidates).slice(0, 2).map((p) => ({
    product: p._id,
    quantity: rand(2, 5),
  }));
  const cancelledNum = await nextNumber();
  const cancelledDate = randomDate(90, 30);
  await new WarehouseTransfer({
    transferNumber: cancelledNum,
    fromWarehouse: bWh,
    toWarehouse: mainWh,
    products: cancelledItems,
    notes: 'Seed: cancelled transfer',
    status: 'cancelled',
    createdBy: pick(userIds),
    cancelledAt: cancelledDate,
    cancelReason: 'Stock reserved for an urgent order',
    createdAt: cancelledDate,
    updatedAt: cancelledDate,
  }).save();
  counts.transfers += 1;
}

// ---------------------------------------------------------------------------
// Delivery returns (cash reconciliation)
// ---------------------------------------------------------------------------

async function seedDeliveryReturns(opts: {
  vendorIds: string[];
  warehouseIds: string[];
  adminUserId: string;
}) {
  const { vendorIds, warehouseIds, adminUserId } = opts;

  if (vendorIds.length === 0) return;

  console.log('\nSeeding delivery returns (cash reconciliation)...');

  for (const vendorId of vendorIds) {
    for (let d = 0; d < 5; d += 1) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);

      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const [agg, billCount] = await Promise.all([
        Bill.aggregate([
          {
            $match: {
              type: 'DELIVERY',
              status: { $ne: 'cancelled' },
              salesPerson: new mongoose.Types.ObjectId(vendorId),
              createdAt: { $gte: dayStart, $lte: dayEnd },
            },
          },
          { $group: { _id: null, expected: { $sum: '$orderPaid' } } },
        ]),
        Bill.countDocuments({
          type: 'DELIVERY',
          status: { $ne: 'cancelled' },
          salesPerson: new mongoose.Types.ObjectId(vendorId),
          createdAt: { $gte: dayStart, $lte: dayEnd },
        }),
      ]);

      const expected = Math.round(agg[0]?.expected || 0);
      if (billCount === 0 && expected === 0) continue;

      const short = Math.random() > 0.7;
      const returned = short
        ? round2(expected * (0.85 + Math.random() * 0.14))
        : expected;
      const warehouse = pick(warehouseIds.slice(0, 3));
      const recordedAt = new Date(date.getTime() + 3 * 3600 * 1000);

      await new DeliveryReturn({
        deliveryPerson: vendorId,
        warehouse,
        deliveryDate: date,
        expectedAmount: expected,
        enteredAmount: returned,
        returnedAmount: returned,
        status: d === 0 ? (Math.random() > 0.5 ? 'confirmed' : 'pending') : 'confirmed',
        notes: short ? 'Écart de caisse constaté (seed)' : 'Encaissements jour (seed)',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: recordedAt,
        updatedAt: recordedAt,
      }).save();
      counts.deliveryReturns += 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Finalize product quantities + warehouse stock distribution
// ---------------------------------------------------------------------------

async function finalizeProducts(
  products: any[],
  stock: Map<string, { qty: number; reserved: number }>,
  warehouseIds: string[],
  userIds: string[],
) {
  const mainWh = warehouseIds[0];
  const bWh = warehouseIds[1];
  const cWh = warehouseIds[2];

  for (const p of products) {
    const s = stock.get(p.barCode);
    const total = s.qty;
    const reserved = s.reserved;

    const boostB = transferredSet.has(p.barCode);
    let bShare = boostB ? 0.5 : 0.25;
    let cShare = 0.10;
    let bQty = Math.round(total * bShare);
    let cQty = Math.min(Math.round((total - bQty) * cShare), Math.max(total - bQty, 0));
    if (bQty + cQty > total) {
      bQty = Math.max(total - cQty, 0);
    }
    const mainQty = total - bQty - cQty;

    const warehouseStock: any[] = [];
    if (mainQty > 0 || reserved > 0) {
      warehouseStock.push({ warehouse: mainWh, quantity: mainQty, stack: 0, reserved });
    }
    if (bQty > 0) warehouseStock.push({ warehouse: bWh, quantity: bQty, stack: 0, reserved: 0 });
    if (cQty > 0) warehouseStock.push({ warehouse: cWh, quantity: cQty, stack: 0, reserved: 0 });

    p.quantity = total;
    p.reserved = reserved;
    p.warehouseStock = warehouseStock;
    await p.save();
  }

  // low-stock / out-of-stock adjustment scenarios
  const low = products.filter((p) => stock.get(p.barCode).qty > 0).slice(0, 5);
  const out = products.filter((p) => stock.get(p.barCode).qty > 0).slice(5, 10);
  const adjustTargets = [
    ...low.map((p) => ({ p, qty: rand(1, 5) })),
    ...out.map((p) => ({ p, qty: 0 })),
  ];

  for (const { p, qty } of adjustTargets) {
    const oldQty = p.quantity;
    if (oldQty === qty) continue;
    const delta = qty - oldQty;
    const mainEntry = p.warehouseStock.find((w: any) => w.warehouse.toString() === mainWh.toString());
    if (qty === 0) {
      for (const entry of p.warehouseStock) {
        entry.quantity = 0;
        entry.reserved = 0;
      }
    } else if (mainEntry) {
      mainEntry.quantity += delta;
      if (mainEntry.quantity < 0) mainEntry.quantity = 0;
    }
    p.quantity = (p.warehouseStock || []).reduce((sum: number, e: any) => sum + Number(e.quantity || 0), 0);
    p.reserved = (p.warehouseStock || []).reduce((sum: number, e: any) => sum + Number(e.reserved || 0), 0);
    await p.save();
    if (delta !== 0) {
      await new StockMovement({
        product: p._id,
        warehouse: mainWh,
        type: 'ADJUSTMENT',
        quantity: delta,
        previousStock: oldQty,
        newStock: p.quantity,
        notes: qty === 0 ? 'Sold out / stock counted to zero' : 'Stock counted low, notify threshold',
        createdBy: pick(userIds),
        createdAt: randomDate(15, 1),
      }).save();
      counts.movements += 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

async function seedAuditLogs(userIds: string[]) {
  console.log('\n[9/9] Seeding audit logs...');

  const resources = ['bill', 'order', 'product', 'customer', 'supplier', 'category', 'warehouse', 'user', 'role', 'settings', 'warehouse_transfer', 'transaction', 'stock_movement'];
  const actions = ['create', 'edit', 'delete', 'cancel', 'approve', 'export', 'print', 'login', 'logout', 'force_logout'];

  for (let i = 0; i < 60; i += 1) {
    const resource = pick(resources);
    const action = pick(actions);
    const userId = pick(userIds);
    const user = await User.findById(userId).select('username').lean();
    const date = randomDate(180, 0);
    await new AuditLog({
      action,
      resource,
      details: `${action[0].toUpperCase() + action.slice(1)} ${resource} (seed data)`,
      userId,
      username: user?.username || 'admin',
      ip: `127.0.0.${rand(1, 20)}`,
      userAgent: 'SeedScript/1.0',
      createdAt: date,
      updatedAt: date,
    }).save();
    counts.auditLogs += 1;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const wipe = !process.argv.includes('--no-wipe');

  console.log('============================================');
  console.log('  SoluStock dummy data seeder');
  console.log('============================================');

  const alreadyRunning = await isPortInUse(parseInt(process.env.MONGODB_PORT || '27018', 10));
  const uri = await startMongoDB();
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  if (wipe) {
    console.log('\nWiping all collections...');
    await wipeDatabase();
  } else {
    console.log('\n--no-wipe: keeping existing data, adding only what is missing.');
  }

  const { adminUserId, userIds, vendorIds } = await seedRolesAndUsers();
  const warehouseIds = await seedWarehouses(adminUserId);
  await seedSettings();
  const { categoryIds } = await seedCategories();
  const { clientIds, supplierIds } = await seedCustomers();
  const { products, stock } = await seedProducts(categoryIds);

  await seedBills({
    products, stock, categoryIds, clientIds, supplierIds, warehouseIds, userIds, vendorIds,
  });

  await seedDeliveryReturns({ vendorIds, warehouseIds, adminUserId });

  await seedTransfers({ products, stock, warehouseIds, userIds });
  await seedAuditLogs(userIds);

  await finalizeProducts(products, stock, warehouseIds, userIds);

  const billCount = await Bill.countDocuments();
  counts.bills = billCount;

  console.log('\n============================================');
  console.log('  SEED COMPLETE — summary');
  console.log('============================================');
  console.log(`  Settings             : ${await Settings.countDocuments()}`);
  console.log(`  Roles                : ${await Role.countDocuments()}`);
  console.log(`  Users                : ${await User.countDocuments()}`);
  console.log(`  Warehouses           : ${await Warehouse.countDocuments()}`);
  console.log(`  Categories           : ${await Category.countDocuments()}`);
  console.log(`  Customers            : ${await Customer.countDocuments()}`);
  console.log(`  Products             : ${await Product.countDocuments()}`);
  console.log(`  Bills                : ${await Bill.countDocuments()}`);
  console.log(`    - BUY              : ${await Bill.countDocuments({ type: 'BUY' })}`);
  console.log(`    - DELIVERY         : ${await Bill.countDocuments({ type: 'DELIVERY' })}`);
  console.log(`    - ORDER            : ${await Bill.countDocuments({ type: 'ORDER' })}`);
  console.log(`    - SALE             : ${await Bill.countDocuments({ type: 'SALE' })}`);
  console.log(`  Stock movements      : ${await StockMovement.countDocuments()}`);
  console.log(`  Transactions         : ${await Transaction.countDocuments()}`);
  console.log(`  Warehouse transfers  : ${await WarehouseTransfer.countDocuments()}`);
  console.log(`  Delivery returns     : ${await DeliveryReturn.countDocuments()}`);
  console.log(`  Audit logs           : ${await AuditLog.countDocuments()}`);
  console.log('--------------------------------------------');
  console.log(`  Pending orders       : ${await Bill.countDocuments({ type: 'ORDER', status: 'pending' })} (1 is expired & auto-cancels on next fetch)`);
  console.log(`  Low-stock products   : ${await Product.countDocuments({ quantity: { $lte: 5 }, notify: true })}`);
  console.log(`  Out-of-stock products: ${await Product.countDocuments({ quantity: 0 })}`);
  console.log('--------------------------------------------');
  console.log(`  All users password   : ${PASSWORD}`);
  console.log(`  Main admin           : admin / ${PASSWORD}`);
  console.log(`  Scenario notes       :`);
  console.log(`    - 1 expired pending order will auto-cancel (release stock).`);
  console.log(`    - 1 suspended user, 1 disabled user, 1 inactive warehouse.`);
  console.log(`    - 2 delivery (VENDOR) users with daily cash returns + delivery bills assigned.`);
  console.log(`    - manual order ids (INV-2026-114, LIV-124) test the manual id path.`);
  console.log('============================================');

  if (alreadyRunning) {
    console.log('MongoDB was already running — left untouched.');
  } else {
    console.log('MongoDB was started for this seed — leaving it running so the app can reuse it.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
