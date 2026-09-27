// LocalStorage + Supabase Dual-Engine Store with Shop ID Isolation
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  SHOPS: 'smart_dukan_shops',
  WORKERS: 'smart_dukan_workers',
  ATTENDANCE: 'smart_dukan_attendance',
  WORKER_KHATA: 'smart_dukan_worker_khata',
  CUSTOMERS: 'smart_dukan_customers',
  CUSTOMER_DUES: 'smart_dukan_customer_dues',
  DAILY_PAYMENTS: 'smart_dukan_daily_payments',
  CURRENT_USER: 'smart_dukan_current_user'
};

// Initial Seed Data (Fallback & Demo)
const initialShops = [
  {
    id: 'SMART-101',
    name: 'Lakshmi General Stores (लक्ष्मी स्टोर्स)',
    ownerName: 'Rajesh Kumar',
    phone: '9876543210',
    pin: '1234'
  },
  {
    id: 'GUPTA-786',
    name: 'Gupta Kirana Dukan (गुप्ता किराना)',
    ownerName: 'Suresh Gupta',
    phone: '9123456789',
    pin: '5678'
  }
];

const initialWorkers = [
  {
    id: 'w101',
    shopId: 'SMART-101',
    name: 'Ramesh Verma (रमेश)',
    phone: '9811122233',
    pin: '1111',
    monthlySalary: 18000,
    role: 'Helper & Delivery'
  },
  {
    id: 'w102',
    shopId: 'SMART-101',
    name: 'Mahesh Babu (మహేష్)',
    phone: '9822233344',
    pin: '2222',
    monthlySalary: 16500,
    role: 'Billing & Stock'
  },
  {
    id: 'w201',
    shopId: 'GUPTA-786',
    name: 'Chandu Lal',
    phone: '9700011122',
    pin: '3333',
    monthlySalary: 15000,
    role: 'Counter Worker'
  }
];

// Current date helpers
const todayStr = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
const pastDue = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

const initialAttendance = [
  {
    id: 'att-1',
    shopId: 'SMART-101',
    workerId: 'w101',
    date: yesterday,
    status: 'ABSENT',
    note: 'Personal Work / छुट्टी'
  }
];

const initialWorkerKhata = [
  {
    id: 'wk-1',
    shopId: 'SMART-101',
    workerId: 'w101',
    amount: 1200,
    itemNote: '10kg Rice bag & Cooking oil from shop (Cut from salary)',
    date: yesterday
  },
  {
    id: 'wk-2',
    shopId: 'SMART-101',
    workerId: 'w102',
    amount: 450,
    itemNote: 'Tea powder, Sugar & Biscuits (Cut from salary)',
    date: todayStr
  }
];

const initialCustomers = [
  {
    id: 'c101',
    shopId: 'SMART-101',
    name: 'Anita Sharma (అనిత/अनीता)',
    phone: '9988776655',
    pin: '1234',
    address: 'House #42, Main Road'
  },
  {
    id: 'c102',
    shopId: 'SMART-101',
    name: 'Ravi Teja (రవి తేజ)',
    phone: '9977665544',
    pin: '4321',
    address: 'Flat 102, Green Heights'
  },
  {
    id: 'c103',
    shopId: 'SMART-101',
    name: 'Sunita Verma',
    phone: '9966554433',
    pin: '9999',
    address: 'Street #3'
  }
];

const initialCustomerDues = [
  {
    id: 'cd-1',
    shopId: 'SMART-101',
    customerId: 'c101',
    amount: 2450,
    type: 'DEBIT',
    note: '5kg Ashirvaad Flour, 2L Fortune Oil & Spices',
    dueDate: nextWeek,
    date: yesterday
  },
  {
    id: 'cd-2',
    shopId: 'SMART-101',
    customerId: 'c102',
    amount: 1800,
    type: 'DEBIT',
    note: 'Monthly Grocery Credit',
    dueDate: pastDue,
    date: '2026-09-15'
  },
  {
    id: 'cd-3',
    shopId: 'SMART-101',
    customerId: 'c103',
    amount: 500,
    type: 'DEBIT',
    note: 'Dairy & Milk Items',
    dueDate: nextWeek,
    date: todayStr
  },
  {
    id: 'cd-4',
    shopId: 'SMART-101',
    customerId: 'c103',
    amount: 500,
    type: 'CREDIT',
    note: 'GPay Online Payment',
    date: todayStr
  }
];

const initialDailyPayments = [
  {
    id: 'dp-1',
    shopId: 'SMART-101',
    amount: 20000,
    merchantName: 'Sri Venkateswara Rice Traders (Wholesaler)',
    tag: 'MERCHANT',
    note: 'Paid 20,000 RS for 10 bags Sona Masoori Rice',
    date: todayStr
  },
  {
    id: 'dp-2',
    shopId: 'SMART-101',
    amount: 3500,
    merchantName: 'Fortune Oil Agency',
    tag: 'MERCHANT',
    note: 'Oil tin stock payment',
    date: todayStr
  },
  {
    id: 'dp-3',
    shopId: 'SMART-101',
    amount: 1200,
    merchantName: 'Electricity Board',
    tag: 'BILLS',
    note: 'Shop Power Bill payment',
    date: yesterday
  }
];

// Helper functions for LocalStorage
const getStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error("Storage error:", e);
    return fallback;
  }
};

const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage write error:", e);
  }
};

// Asynchronous Supabase Cloud Synchronization
export const syncWithSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // 1. Shops
    const { data: shops } = await supabase.from('shops').select('*');
    if (shops && shops.length > 0) {
      const formattedShops = shops.map(s => ({
        id: s.id,
        name: s.name,
        ownerName: s.owner_name,
        phone: s.phone,
        pin: s.pin
      }));
      setStorage(STORAGE_KEYS.SHOPS, formattedShops);
    }

    // 2. Workers
    const { data: workers } = await supabase.from('workers').select('*');
    if (workers && workers.length > 0) {
      const formattedWorkers = workers.map(w => ({
        id: w.id,
        shopId: w.shop_id,
        name: w.name,
        phone: w.phone,
        pin: w.pin,
        monthlySalary: Number(w.monthly_salary),
        role: w.role
      }));
      setStorage(STORAGE_KEYS.WORKERS, formattedWorkers);
    }

    // 3. Attendance
    const { data: attendance } = await supabase.from('attendance').select('*');
    if (attendance && attendance.length > 0) {
      const formattedAttendance = attendance.map(a => ({
        id: a.id,
        shopId: a.shop_id,
        workerId: a.worker_id,
        date: a.date,
        status: a.status,
        note: a.note
      }));
      setStorage(STORAGE_KEYS.ATTENDANCE, formattedAttendance);
    }

    // 4. Worker Khata
    const { data: workerKhata } = await supabase.from('worker_khata').select('*');
    if (workerKhata && workerKhata.length > 0) {
      const formattedKhata = workerKhata.map(k => ({
        id: k.id,
        shopId: k.shop_id,
        workerId: k.worker_id,
        amount: Number(k.amount),
        itemNote: k.item_note,
        date: k.date
      }));
      setStorage(STORAGE_KEYS.WORKER_KHATA, formattedKhata);
    }

    // 5. Customers
    const { data: customers } = await supabase.from('customers').select('*');
    if (customers && customers.length > 0) {
      const formattedCustomers = customers.map(c => ({
        id: c.id,
        shopId: c.shop_id,
        name: c.name,
        phone: c.phone,
        pin: c.pin,
        address: c.address
      }));
      setStorage(STORAGE_KEYS.CUSTOMERS, formattedCustomers);
    }

    // 6. Customer Dues
    const { data: customerDues } = await supabase.from('customer_dues').select('*');
    if (customerDues && customerDues.length > 0) {
      const formattedDues = customerDues.map(d => ({
        id: d.id,
        shopId: d.shop_id,
        customerId: d.customer_id,
        amount: Number(d.amount),
        type: d.type,
        note: d.note,
        dueDate: d.due_date,
        date: d.date
      }));
      setStorage(STORAGE_KEYS.CUSTOMER_DUES, formattedDues);
    }

    // 7. Daily Payments
    const { data: dailyPayments } = await supabase.from('daily_payments').select('*');
    if (dailyPayments && dailyPayments.length > 0) {
      const formattedPayments = dailyPayments.map(p => ({
        id: p.id,
        shopId: p.shop_id,
        amount: Number(p.amount),
        merchantName: p.merchant_name,
        tag: p.tag,
        note: p.note,
        date: p.date
      }));
      setStorage(STORAGE_KEYS.DAILY_PAYMENTS, formattedPayments);
    }
  } catch (err) {
    console.warn("Supabase Sync Warning:", err);
  }
};

export const initStore = () => {
  if (!localStorage.getItem(STORAGE_KEYS.SHOPS)) setStorage(STORAGE_KEYS.SHOPS, initialShops);
  if (!localStorage.getItem(STORAGE_KEYS.WORKERS)) setStorage(STORAGE_KEYS.WORKERS, initialWorkers);
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) setStorage(STORAGE_KEYS.ATTENDANCE, initialAttendance);
  if (!localStorage.getItem(STORAGE_KEYS.WORKER_KHATA)) setStorage(STORAGE_KEYS.WORKER_KHATA, initialWorkerKhata);
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) setStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMER_DUES)) setStorage(STORAGE_KEYS.CUSTOMER_DUES, initialCustomerDues);
  if (!localStorage.getItem(STORAGE_KEYS.DAILY_PAYMENTS)) setStorage(STORAGE_KEYS.DAILY_PAYMENTS, initialDailyPayments);

  // Trigger Supabase Cloud Sync if configured
  if (isSupabaseConfigured && supabase) {
    syncWithSupabase();
  }
};

// Main Hybrid Store API
export const Store = {
  // Shops
  getShops: () => getStorage(STORAGE_KEYS.SHOPS, initialShops),
  getShopById: (shopId) => Store.getShops().find(s => s.id.toUpperCase() === shopId.toUpperCase()),
  createShop: async (shopData) => {
    const shops = Store.getShops();
    shops.push(shopData);
    setStorage(STORAGE_KEYS.SHOPS, shops);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('shops').insert([{
        id: shopData.id,
        name: shopData.name,
        owner_name: shopData.ownerName,
        phone: shopData.phone,
        pin: shopData.pin
      }]);
    }
    return shopData;
  },

  // Workers
  getWorkers: (shopId) => Store.getStorageRaw(STORAGE_KEYS.WORKERS, initialWorkers).filter(w => w.shopId.toUpperCase() === shopId.toUpperCase()),
  addWorker: async (workerData) => {
    const workers = getStorage(STORAGE_KEYS.WORKERS, initialWorkers);
    workers.push(workerData);
    setStorage(STORAGE_KEYS.WORKERS, workers);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('workers').insert([{
        id: workerData.id,
        shop_id: workerData.shopId,
        name: workerData.name,
        phone: workerData.phone,
        pin: workerData.pin || '1234',
        monthly_salary: workerData.monthlySalary,
        role: workerData.role || 'Helper'
      }]);
    }
    return workerData;
  },
  deleteWorker: async (workerId) => {
    const list = getStorage(STORAGE_KEYS.WORKERS, initialWorkers);
    const updated = list.filter(w => w.id !== workerId);
    setStorage(STORAGE_KEYS.WORKERS, updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('workers').delete().eq('id', workerId);
    }
    return updated;
  },

  // Attendance
  getAttendance: (shopId) => Store.getStorageRaw(STORAGE_KEYS.ATTENDANCE, initialAttendance).filter(a => a.shopId.toUpperCase() === shopId.toUpperCase()),
  toggleAbsence: async (shopId, workerId, date, note = 'Absent') => {
    const list = getStorage(STORAGE_KEYS.ATTENDANCE, initialAttendance);
    const existingIndex = list.findIndex(a => a.shopId.toUpperCase() === shopId.toUpperCase() && a.workerId === workerId && a.date === date);

    if (existingIndex >= 0) {
      const removed = list.splice(existingIndex, 1)[0];
      setStorage(STORAGE_KEYS.ATTENDANCE, list);
      if (isSupabaseConfigured && supabase && removed) {
        await supabase.from('attendance').delete().eq('id', removed.id);
      }
    } else {
      const newAtt = {
        id: 'att-' + Date.now(),
        shopId,
        workerId,
        date,
        status: 'ABSENT',
        note
      };
      list.push(newAtt);
      setStorage(STORAGE_KEYS.ATTENDANCE, list);

      if (isSupabaseConfigured && supabase) {
        await supabase.from('attendance').insert([{
          id: newAtt.id,
          shop_id: newAtt.shopId,
          worker_id: newAtt.workerId,
          date: newAtt.date,
          status: newAtt.status,
          note: newAtt.note
        }]);
      }
    }
    return list.filter(a => a.shopId.toUpperCase() === shopId.toUpperCase());
  },

  // Worker Khata (Grocery Purchases / Salary Cuts)
  getWorkerKhata: (shopId, workerId = null) => {
    const list = Store.getStorageRaw(STORAGE_KEYS.WORKER_KHATA, initialWorkerKhata).filter(k => k.shopId.toUpperCase() === shopId.toUpperCase());
    return workerId ? list.filter(k => k.workerId === workerId) : list;
  },
  addWorkerKhataItem: async (entry) => {
    const list = getStorage(STORAGE_KEYS.WORKER_KHATA, initialWorkerKhata);
    list.push(entry);
    setStorage(STORAGE_KEYS.WORKER_KHATA, list);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('worker_khata').insert([{
        id: entry.id,
        shop_id: entry.shopId,
        worker_id: entry.workerId,
        amount: entry.amount,
        item_note: entry.itemNote,
        date: entry.date
      }]);
    }
    return entry;
  },
  deleteWorkerKhataItem: async (itemId) => {
    const list = getStorage(STORAGE_KEYS.WORKER_KHATA, initialWorkerKhata);
    const updated = list.filter(k => k.id !== itemId);
    setStorage(STORAGE_KEYS.WORKER_KHATA, updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('worker_khata').delete().eq('id', itemId);
    }
    return updated;
  },

  // Customers
  getCustomers: (shopId) => Store.getStorageRaw(STORAGE_KEYS.CUSTOMERS, initialCustomers).filter(c => c.shopId.toUpperCase() === shopId.toUpperCase()),
  addCustomer: async (customerData) => {
    const customers = getStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    customers.push(customerData);
    setStorage(STORAGE_KEYS.CUSTOMERS, customers);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('customers').insert([{
        id: customerData.id,
        shop_id: customerData.shopId,
        name: customerData.name,
        phone: customerData.phone,
        pin: customerData.pin || '1234',
        address: customerData.address
      }]);
    }
    return customerData;
  },

  // Customer Dues Ledger
  getCustomerDues: (shopId, customerId = null) => {
    const ledger = Store.getStorageRaw(STORAGE_KEYS.CUSTOMER_DUES, initialCustomerDues).filter(cd => cd.shopId.toUpperCase() === shopId.toUpperCase());
    return customerId ? ledger.filter(cd => cd.customerId === customerId) : ledger;
  },
  addCustomerDue: async (entry) => {
    const list = getStorage(STORAGE_KEYS.CUSTOMER_DUES, initialCustomerDues);
    list.push(entry);
    setStorage(STORAGE_KEYS.CUSTOMER_DUES, list);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('customer_dues').insert([{
        id: entry.id,
        shop_id: entry.shopId,
        customer_id: entry.customerId,
        amount: entry.amount,
        type: entry.type,
        note: entry.note,
        due_date: entry.dueDate,
        date: entry.date
      }]);
    }
    return entry;
  },

  // Daily Payments / Merchant Expenses
  getDailyPayments: (shopId, date = null) => {
    const list = Store.getStorageRaw(STORAGE_KEYS.DAILY_PAYMENTS, initialDailyPayments).filter(dp => dp.shopId.toUpperCase() === shopId.toUpperCase());
    return date ? list.filter(dp => dp.date === date) : list;
  },
  addDailyPayment: async (entry) => {
    const list = getStorage(STORAGE_KEYS.DAILY_PAYMENTS, initialDailyPayments);
    list.push(entry);
    setStorage(STORAGE_KEYS.DAILY_PAYMENTS, list);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('daily_payments').insert([{
        id: entry.id,
        shop_id: entry.shopId,
        amount: entry.amount,
        merchant_name: entry.merchantName,
        tag: entry.tag || 'MERCHANT',
        note: entry.note,
        date: entry.date
      }]);
    }
    return entry;
  },
  deleteDailyPayment: async (paymentId) => {
    const list = getStorage(STORAGE_KEYS.DAILY_PAYMENTS, initialDailyPayments);
    const updated = list.filter(dp => dp.id !== paymentId);
    setStorage(STORAGE_KEYS.DAILY_PAYMENTS, updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('daily_payments').delete().eq('id', paymentId);
    }
    return updated;
  },

  // Auth / Current Session
  getCurrentUser: () => getStorage(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user) => setStorage(STORAGE_KEYS.CURRENT_USER, user),
  logout: () => localStorage.removeItem(STORAGE_KEYS.CURRENT_USER),

  // Raw helper
  getStorageRaw: (key, fallback) => getStorage(key, fallback)
};
