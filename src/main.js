import './style.css';
import { 
  db, 
  auth, 
  isFirebaseInitialized, 
  activeConfig,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from './firebase';

// ==========================================
// 0. GLOBAL FATAL ERROR HANDLER
// ==========================================

window.addEventListener('error', (event) => {
  const errorMsg = event.error ? event.error.stack || event.error.message : event.message;
  console.error("FATAL RUNTIME ERROR:", errorMsg);
  showFatalErrorOverlay(errorMsg);
});

window.addEventListener('unhandledrejection', (event) => {
  const errorMsg = event.reason ? event.reason.stack || event.reason.message : event.reason;
  console.error("FATAL UNHANDLED REJECTION:", errorMsg);
  showFatalErrorOverlay(errorMsg);
});

function showFatalErrorOverlay(message) {
  let overlay = document.getElementById('fatal-error-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'fatal-error-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-family: 'Inter', sans-serif;
      padding: 2rem;
      box-sizing: border-box;
    `;
    const card = document.createElement('div');
    card.style.cssText = `
      background: #1e293b;
      border: 1px solid #ef4444;
      border-radius: 20px;
      padding: 2.5rem;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      box-sizing: border-box;
    `;
    card.innerHTML = `
      <h3 style="color:#ef4444;margin-top:0;font-size:1.5rem;font-family:'Outfit',sans-serif;margin-bottom:0.75rem;">Fatal Application Error</h3>
      <p style="color:#94a3b8;font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;">An unexpected error occurred. Copy these details to help resolve the issue:</p>
      <pre style="background:#0f172a;color:#f87171;padding:1.25rem;border-radius:12px;overflow-x:auto;font-size:0.8rem;max-height:250px;margin-bottom:1.5rem;white-space:pre-wrap;border:1px solid #334155;font-family:monospace;line-height:1.4;text-align:left;"></pre>
      <div style="display:flex;gap:1rem;">
        <button onclick="window.location.reload()" style="background:#ef4444;color:#fff;border:none;padding:0.75rem 1.5rem;border-radius:10px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:background 0.2s;">Reload Application</button>
        <button id="btn-clear-local" style="background:#334155;color:#f1f5f9;border:1px solid #475569;padding:0.75rem 1.5rem;border-radius:10px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">Reset Storage</button>
      </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const clearBtn = card.querySelector('#btn-clear-local');
    if (clearBtn) {
      clearBtn.onclick = () => {
        localStorage.clear();
        window.location.reload();
      };
    }
  }
  const pre = overlay.querySelector('pre');
  if (pre) {
    pre.innerText = message;
  }
}

// ==========================================

// 1. INITIAL SEED DATA
// ==========================================

const INITIAL_PRODUCTS = [
  { name: "Elite", costPrice: 67000, sellingPrice: 162000, category: "Elite" },
  { name: "Elite VIP", costPrice: 67000, sellingPrice: 162000, category: "Elite" },
  { name: "Black Obsidian", costPrice: 100000, sellingPrice: 250000, category: "Signature" },
  { name: "Her Majesty", costPrice: 110000, sellingPrice: 260000, category: "Signature" },
  { name: "Cherry in the Woods", costPrice: 100000, sellingPrice: 250000, category: "Signature" },
  { name: "Aroma Señora VI", costPrice: 81000, sellingPrice: 200000, category: "Signature" },
  { name: "Aroma V", costPrice: 81000, sellingPrice: 200000, category: "Signature" },
  { name: "Garden of Eden", costPrice: 110000, sellingPrice: 260000, category: "Signature" },
  { name: "Dancing Snowfall", costPrice: 110000, sellingPrice: 260000, category: "Signature" },
  { name: "In the Nowhere Land", costPrice: 110000, sellingPrice: 260000, category: "Signature" },
  { name: "Verdazur", costPrice: 65000, sellingPrice: 150000, category: "Standard" },
  { name: "Gemini & Gemini Bloom", costPrice: 100000, sellingPrice: 250000, category: "Standard" },
  { name: "Cuban Wood", costPrice: 81000, sellingPrice: 200000, category: "Standard" },
  { name: "Eclat", costPrice: 100000, sellingPrice: 250000, category: "Standard" },
  { name: "Veloura", costPrice: 65000, sellingPrice: 150000, category: "Standard" },
  { name: "Silva", costPrice: 65000, sellingPrice: 150000, category: "Standard" },
  { name: "Verde", costPrice: 65000, sellingPrice: 150000, category: "Standard" },
  { name: "Black Rogue", costPrice: 50000, sellingPrice: 120000, category: "Standard" },
  { name: "Aura Gold", costPrice: 80000, sellingPrice: 180000, category: "Standard" },
  { name: "Vanilla Expresso", costPrice: 70000, sellingPrice: 160000, category: "Standard" },
  { name: "Cafe Citadel", costPrice: 70000, sellingPrice: 160000, category: "Standard" },
  { name: "Crimson", costPrice: 70000, sellingPrice: 160000, category: "Standard" },
  { name: "Azul", costPrice: 65000, sellingPrice: 150000, category: "Standard" },
  { name: "Solis", costPrice: 65000, sellingPrice: 150000, category: "Standard" },
  { name: "Habanera Pink", costPrice: 72000, sellingPrice: 173000, category: "Standard" },
  { name: "Melody", costPrice: 72000, sellingPrice: 173000, category: "Standard" },
  { name: "Porturo", costPrice: 63000, sellingPrice: 151000, category: "Standard" },
  { name: "Roadster Intense", costPrice: 54000, sellingPrice: 130000, category: "Standard" },
  { name: "Monument Gold", costPrice: 76000, sellingPrice: 183000, category: "Standard" },
  { name: "Saffron Extrait", costPrice: 100000, sellingPrice: 250000, category: "Standard" },
  { name: "Deciduous Summer", costPrice: 100000, sellingPrice: 250000, category: "Deciduous" },
  { name: "Deciduous Spring", costPrice: 100000, sellingPrice: 250000, category: "Deciduous" },
];

const INITIAL_CUSTOMERS = [
  { id: "cust-1", name: "Ali Hassan", phone: "+255 712 345 678", email: "alihassan@gmail.tz", createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "cust-2", name: "Fatuma Omar", phone: "+255 655 987 654", email: "fatuma.o@outlook.com", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }
];

const INITIAL_EXPENSES = [
  { id: "exp-1", date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), category: "Rent", amount: 1500000, description: "Dar es Salaam Head Office Rent" },
  { id: "exp-2", date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), category: "Duty", amount: 450000, description: "Import duties clearance fee" },
  { id: "exp-3", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), category: "Shipping", amount: 250000, description: "Logistics shipping and delivery costs" }
];

// Helper to validate phone numbers (minimum 7 digits, only allows +, spaces, dashes, parentheses, and digits)
function isValidPhone(phone) {
  const clean = phone.trim();
  const digitCount = (clean.match(/\d/g) || []).length;
  if (digitCount < 7 || digitCount > 15) return false;
  return /^[+\s()0-9-]+$/.test(clean);
}

// Helper to generate clean SKU
function generateSKU(name, category) {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const cleanCat = category.toUpperCase().slice(0, 3);
  return `AS-${cleanCat}-${cleanName}`;
}

// Helper to generate unique ID
function uuid() {
  return Math.random().toString(36).substring(2, 9);
}

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================

let state = {
  products: [],
  transactions: [],
  customers: [],
  expenses: [],
  currentRole: 'CEO', // default starting role
  productsCurrentPage: 1,
  productsItemsPerPage: 7,
  transactionsCurrentPage: 1,
  transactionsItemsPerPage: 7,
  targetAmount: 30000000,
  isAuthenticated: false
};

// Dismissed system notification IDs
let dismissedAlerts = JSON.parse(localStorage.getItem('aurora_dismissed_alerts') || '[]');

// Initialize State from LocalStorage or seed defaults
function initStorage() {
  const storedRole = localStorage.getItem('aurora_current_role');
  const storedTarget = localStorage.getItem('aurora_target_amount');
  const storedAuth = localStorage.getItem('aurora_authenticated');

  state.isAuthenticated = storedAuth === 'true';

  if (storedRole) {
    state.currentRole = storedRole;
  }

  if (storedTarget) {
    state.targetAmount = parseInt(storedTarget, 10);
  } else {
    state.targetAmount = 30000000;
  }

  if (isFirebaseInitialized) {
    // Firebase mode active: syncing will start after successful user login
  } else {
    // Fallback to local storage database mode
    const storedProducts = localStorage.getItem('aurora_products');
    const storedTransactions = localStorage.getItem('aurora_transactions');
    const storedCustomers = localStorage.getItem('aurora_customers');
    const storedExpenses = localStorage.getItem('aurora_expenses');

    if (storedProducts) {
      state.products = JSON.parse(storedProducts);
    } else {
      state.products = INITIAL_PRODUCTS.map(p => ({
        id: `prod-${uuid()}`,
        sku: generateSKU(p.name, p.category),
        name: p.name,
        category: p.category,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        minStockThreshold: 10
      }));
      saveProducts();
    }

    if (storedCustomers) {
      state.customers = JSON.parse(storedCustomers);
    } else {
      state.customers = [...INITIAL_CUSTOMERS];
      saveCustomers();
    }

    if (storedExpenses) {
      state.expenses = JSON.parse(storedExpenses);
    } else {
      state.expenses = [...INITIAL_EXPENSES];
      saveExpenses();
    }

    if (storedTransactions) {
      state.transactions = JSON.parse(storedTransactions);
    } else {
      state.transactions = [];
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      state.products.forEach((p, idx) => {
        const qtyIn = 40 + (idx % 15);
        state.transactions.push({
          id: `tx-seed-in-${idx}`,
          productId: p.id,
          type: 'IN',
          quantity: qtyIn,
          unitPrice: p.costPrice,
          reason: 'Initial Wholesale Stock In',
          timestamp: new Date(now - 45 * oneDay).toISOString()
        });

        const salesCount = 2 + (idx % 3);
        for (let s = 0; s < salesCount; s++) {
          const qtyOut = 1 + (idx % 3) + s;
          const dayOffset = (idx % 30) + 1;
          const customer = state.customers[idx % 2];
          state.transactions.push({
            id: `tx-seed-out-${idx}-${s}`,
            productId: p.id,
            type: 'OUT',
            quantity: qtyOut,
            unitPrice: p.sellingPrice,
            reason: 'Retail Sale',
            customerId: customer ? customer.id : null,
            timestamp: new Date(now - dayOffset * oneDay).toISOString()
          });
        }
      });
      saveTransactions();
    }
  }
}

// Persistence helpers
async function syncCollectionToFirestore(collectionName, localArray) {
  if (!isFirebaseInitialized) return;
  try {
    const batch = writeBatch(db);
    
    // 1. Upload/update all current local items
    localArray.forEach(item => {
      const docRef = doc(db, collectionName, item.id);
      
      // Clean undefined fields to avoid Firestore setDoc errors
      const cleanItem = {};
      Object.keys(item).forEach(key => {
        if (item[key] !== undefined) {
          cleanItem[key] = item[key];
        }
      });
      
      batch.set(docRef, cleanItem);
    });
    
    // 2. Fetch remote documents to clean up deleted ones
    const querySnapshot = await getDocs(collection(db, collectionName));
    const localIds = new Set(localArray.map(item => item.id));
    
    querySnapshot.forEach(docSnap => {
      if (!localIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });
    
    await batch.commit();
    console.log(`Synced ${collectionName} to Firestore.`);
  } catch (e) {
    console.error(`Error syncing ${collectionName}:`, e);
    showToast(`Failed to sync changes to cloud database: ${e.message}`, 'error');
  }
}

function saveProducts() {
  if (isFirebaseInitialized) {
    syncCollectionToFirestore('products', state.products);
  } else {
    localStorage.setItem('aurora_products', JSON.stringify(state.products));
  }
}
function saveTransactions() {
  if (isFirebaseInitialized) {
    syncCollectionToFirestore('transactions', state.transactions);
  } else {
    localStorage.setItem('aurora_transactions', JSON.stringify(state.transactions));
  }
}
function saveCustomers() {
  if (isFirebaseInitialized) {
    syncCollectionToFirestore('customers', state.customers);
  } else {
    localStorage.setItem('aurora_customers', JSON.stringify(state.customers));
  }
}
function saveExpenses() {
  if (isFirebaseInitialized) {
    syncCollectionToFirestore('expenses', state.expenses);
  } else {
    localStorage.setItem('aurora_expenses', JSON.stringify(state.expenses));
  }
}

// Default Credentials for Local Storage fallback
const defaultCredentials = {
  CEO: { email: 'ceo@aurorascents.co', password: 'Kudra@aurora' },
  Manager: { email: 'manager@aurorascents.co', password: 'Zainab@aurora' },
  Admin: { email: 'admin@aurorascents.co', password: 'Brian@aurora' }
};

function getLocalCredentials() {
  const stored = localStorage.getItem('aurora_credentials');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing local credentials:", e);
    }
  }
  return { ...defaultCredentials };
}

// Populate Security Settings Form in Panel
function populateSecuritySettings() {
  const emailInput = document.getElementById('settings-email-input');
  const passInput = document.getElementById('settings-password-input');
  const label = document.getElementById('settings-security-profile-label');
  
  if (label) {
    label.innerText = state.currentRole;
  }
  
  if (isFirebaseInitialized) {
    const user = auth.currentUser;
    if (user && emailInput) {
      emailInput.value = user.email || '';
    }
    if (passInput) {
      passInput.value = ''; // Leave password blank for security, let them type a new one
    }
  } else {
    const creds = getLocalCredentials();
    const activeCred = creds[state.currentRole];
    if (activeCred) {
      if (emailInput) emailInput.value = activeCred.email;
      if (passInput) passInput.value = activeCred.password;
    }
  }
}

let firestoreUnsubscribes = [];

function cleanupFirestoreSync() {
  firestoreUnsubscribes.forEach(unsub => {
    try {
      unsub();
    } catch (e) {
      console.error("Error unsubscribing:", e);
    }
  });
  firestoreUnsubscribes = [];
}

// Firestore Database Real-time Sync
function initFirestoreSync() {
  if (!isFirebaseInitialized) return;
  
  cleanupFirestoreSync();

  const handleSyncError = (collectionName, error) => {
    console.error(`Firestore Sync Error for ${collectionName}:`, error);
    if (state.isAuthenticated) {
      showToast(`Cloud database sync error for ${collectionName}: ${error.message}`, 'error');
    }
  };

  // Sync Products
  const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
    const items = [];
    snapshot.forEach(docSnap => items.push(docSnap.data()));
    if (items.length > 0) {
      state.products = items;
      renderProducts();
    }
  }, (err) => handleSyncError('products', err));

  // Sync Transactions
  const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
    const items = [];
    snapshot.forEach(docSnap => items.push(docSnap.data()));
    state.transactions = items;
    
    // Refresh whatever view is currently active
    const activeNav = document.querySelector('.nav-item.active');
    const viewName = activeNav ? activeNav.getAttribute('data-view') : 'dashboard';
    showView(viewName);
  }, (err) => handleSyncError('transactions', err));

  // Sync Customers
  const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
    const items = [];
    snapshot.forEach(docSnap => items.push(docSnap.data()));
    state.customers = items;
    renderCRM();
  }, (err) => handleSyncError('customers', err));

  // Sync Expenses
  const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
    const items = [];
    snapshot.forEach(docSnap => items.push(docSnap.data()));
    state.expenses = items;
    renderCashFlow();
  }, (err) => handleSyncError('expenses', err));

  firestoreUnsubscribes.push(unsubProducts, unsubTransactions, unsubCustomers, unsubExpenses);
}

// Seed Database automatically in Firestore if empty
async function checkAndSeedFirestore() {
  if (!isFirebaseInitialized) return;
  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      console.log("Firestore database is empty. Automatically seeding default catalog...");
      const batch = writeBatch(db);
      
      // Seed Products
      const seedProducts = INITIAL_PRODUCTS.map(p => ({
        id: `prod-${uuid()}`,
        sku: generateSKU(p.name, p.category),
        name: p.name,
        category: p.category,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        minStockThreshold: 10
      }));
      seedProducts.forEach(p => {
        batch.set(doc(db, 'products', p.id), p);
      });

      // Seed Customers
      INITIAL_CUSTOMERS.forEach(c => {
        batch.set(doc(db, 'customers', c.id), c);
      });

      // Seed Expenses
      INITIAL_EXPENSES.forEach(e => {
        batch.set(doc(db, 'expenses', e.id), e);
      });

      // Seed Transactions
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      seedProducts.forEach((p, idx) => {
        const qtyIn = 40 + (idx % 15);
        const txIn = {
          id: `tx-seed-in-${idx}`,
          productId: p.id,
          type: 'IN',
          quantity: qtyIn,
          unitPrice: p.costPrice,
          reason: 'Initial Wholesale Stock In',
          timestamp: new Date(now - 45 * oneDay).toISOString()
        };
        batch.set(doc(db, 'transactions', txIn.id), txIn);

        const salesCount = 2 + (idx % 3);
        for (let s = 0; s < salesCount; s++) {
          const qtyOut = 1 + (idx % 3) + s;
          const dayOffset = (idx % 30) + 1;
          const customer = INITIAL_CUSTOMERS[idx % 2];
          const txOut = {
            id: `tx-seed-out-${idx}-${s}`,
            productId: p.id,
            type: 'OUT',
            quantity: qtyOut,
            unitPrice: p.sellingPrice,
            reason: 'Retail Sale',
            customerId: customer ? customer.id : null,
            timestamp: new Date(now - dayOffset * oneDay).toISOString()
          };
          batch.set(doc(db, 'transactions', txOut.id), txOut);
        }
      });

      await batch.commit();
      console.log("Firestore database seeded successfully.");
    }
  } catch (e) {
    console.error("Error checking or seeding Firestore database:", e);
  }
}

// ==========================================
// 3. FINANCIAL & INVENTORY CALCULATIONS
// ==========================================

// Calculate current stock levels for each product
function getProductStock(productId) {
  let stock = 0;
  state.transactions.forEach(tx => {
    if (tx.productId === productId) {
      if (tx.type === 'IN') {
        stock += tx.quantity;
      } else if (tx.type === 'OUT') {
        stock -= tx.quantity;
      }
    }
  });
  return stock;
}

// Get total units sold of a product
function getProductSoldUnits(productId, period = 'alltime') {
  let totalSold = 0;
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  state.transactions.forEach(tx => {
    if (tx.productId === productId && tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
      const txTime = new Date(tx.timestamp).getTime();
      if (period === 'alltime' || txTime >= thirtyDaysAgo) {
        totalSold += tx.quantity;
      }
    }
  });
  return totalSold;
}

// Calculate business KPIs
function calculateKPIs() {
  let totalValuation = 0;
  let totalRevenue = 0;
  let totalCOGS = 0;
  let totalSoldUnits = 0;
  let lowStockCount = 0;

  // Valuation & Low Stock
  state.products.forEach(p => {
    const stock = getProductStock(p.id);
    totalValuation += stock * p.costPrice;
    if (stock < p.minStockThreshold) {
      lowStockCount++;
    }
  });

  // Revenue, COGS, Sold Units from Sales
  state.transactions.forEach(tx => {
    if (tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
      const p = state.products.find(prod => prod.id === tx.productId);
      if (p) {
        totalRevenue += tx.quantity * tx.unitPrice;
        const txCost = tx.costPrice !== undefined ? tx.costPrice : p.costPrice;
        totalCOGS += tx.quantity * txCost;
        totalSoldUnits += tx.quantity;
      }
    }
  });

  const totalOpsExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalOpsExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
  const grossProfitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

  return {
    totalValuation,
    totalRevenue,
    totalCOGS,
    totalOpsExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    grossProfitMargin,
    totalSoldUnits,
    lowStockCount
  };
}

// Calculate profit for dynamic periods
function getProfitForPeriod(startDaysOffset, endDaysOffset, role) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const startTime = now - startDaysOffset * oneDay;
  const endTime = now - endDaysOffset * oneDay;

  let revenue = 0;
  let cogs = 0;
  state.transactions.forEach(tx => {
    const txTime = new Date(tx.timestamp).getTime();
    if (txTime >= startTime && txTime < endTime) {
      if (tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
        const p = state.products.find(prod => prod.id === tx.productId);
        if (p) {
          revenue += tx.quantity * tx.unitPrice;
          const cost = tx.costPrice !== undefined ? tx.costPrice : p.costPrice;
          cogs += tx.quantity * cost;
        }
      }
    }
  });

  const grossProfit = revenue - cogs;
  if (role === 'Manager') {
    return grossProfit;
  }

  let opsExpenses = 0;
  state.expenses.forEach(e => {
    const expTime = new Date(e.date).getTime();
    if (expTime >= startTime && expTime < endTime) {
      opsExpenses += e.amount;
    }
  });

  return grossProfit - opsExpenses;
}

// Get customer stats (LTV, order count, etc.)
function getCustomerStats(customerId) {
  let totalLTV = 0;
  let orderCount = 0;
  const purchases = {};

  state.transactions.forEach(tx => {
    if (tx.customerId === customerId && tx.type === 'OUT') {
      orderCount++;
      const cost = tx.quantity * tx.unitPrice;
      totalLTV += cost;
      
      const p = state.products.find(prod => prod.id === tx.productId);
      if (p) {
        purchases[p.name] = (purchases[p.name] || 0) + tx.quantity;
      }
    }
  });

  const customer = state.customers.find(c => c.id === customerId);
  // Support both legacy string and new array format
  let savedFavs = customer && customer.favoritePerfumes ? customer.favoritePerfumes
    : (customer && customer.favoritePerfume ? [customer.favoritePerfume] : []);
  savedFavs = savedFavs.filter(Boolean);

  let favoritePerfume;
  if (savedFavs.length > 0) {
    favoritePerfume = savedFavs.join(', ');
  } else {
    // Auto-calculate top from purchases
    let maxQty = 0;
    let top = '-';
    Object.keys(purchases).forEach(name => {
      if (purchases[name] > maxQty) {
        maxQty = purchases[name];
        top = name;
      }
    });
    favoritePerfume = top;
  }

  return {
    totalLTV,
    orderCount,
    favoritePerfume,
    favoritePerfumes: savedFavs
  };
}

// ==========================================
// 4. UI RENDERING LOGIC
// ==========================================

// Format Currency Utility
function formatCurrency(amount) {
  const isNeg = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-TZ', {
    style: 'decimal', minimumFractionDigits: 0
  }).format(absAmount) + ' TZSH';
  return isNeg ? `-${formatted}` : formatted;
}

// Format Date Utility
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Render Dashboard View
function renderDashboard() {
  const kpis = calculateKPIs();
  
  // 1. Large profit gradient card
  const isManager = state.currentRole === 'Manager';
  const profitVal = isManager ? kpis.grossProfit : kpis.netProfit;
  const marginVal = isManager ? kpis.grossProfitMargin : kpis.profitMargin;
  const labelText = isManager ? 'Gross Profit' : 'Net Profit';
  
  const cardTitle = document.querySelector('.kpi-gradient-card .card-title');
  if (cardTitle) cardTitle.innerText = labelText;
  
  document.getElementById('val-net-profit').innerText = formatCurrency(profitVal);

  // Calculate dynamic weekly profit growth
  const profitThisWeek = getProfitForPeriod(7, 0, state.currentRole);
  const profitPrevWeek = getProfitForPeriod(14, 7, state.currentRole);

  let trendText = '';
  let isPositive = true;
  if (profitPrevWeek === 0) {
    if (profitThisWeek > 0) {
      trendText = '+100%';
    } else if (profitThisWeek < 0) {
      trendText = '-100%';
      isPositive = false;
    } else {
      trendText = '0%';
    }
  } else {
    const pct = ((profitThisWeek - profitPrevWeek) / Math.abs(profitPrevWeek)) * 100;
    isPositive = pct >= 0;
    trendText = `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
  }

  const trendBadge = document.querySelector('.card-trend-badge');
  if (trendBadge) {
    trendBadge.className = `card-trend-badge ${isPositive ? 'positive' : 'negative'}`;
    const trendIcon = isPositive 
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`;
    trendBadge.innerHTML = `
      <span class="badge-icon" style="display:inline-flex;align-items:center;justify-content:center;">${trendIcon}</span>
      <span class="badge-text" id="val-profit-margin">${trendText} from last week • ${marginVal.toFixed(1)}% margin</span>
    `;
  }
  
  // Low Stock Notification badge
  const alertBadge = document.getElementById('alert-badge');
  if (kpis.lowStockCount > 0) {
    alertBadge.style.display = 'flex';
    alertBadge.innerText = kpis.lowStockCount;
  } else {
    alertBadge.style.display = 'none';
  }

  // 2. Render Subcards Grid (dynamic based on role)
  renderDashboardStatsGrid();

  // 3. Render Stacked Bar Chart ("Product Sale")
  const barPeriod = document.getElementById('bar-chart-period').value;
  renderStackedBarChart(barPeriod);

  // 4. Render Target Progress Card (Target is dynamic and editable)
  const targetMax = state.targetAmount;
  const progressPercent = targetMax > 0 ? Math.min(100, Math.max(0, (profitVal / targetMax) * 100)) : 0;
  
  const targetMaxLabel = document.getElementById('target-max-value');
  if (targetMaxLabel) {
    targetMaxLabel.innerText = formatCurrency(targetMax);
  }
  
  document.getElementById('target-progress-percent').innerText = `${progressPercent.toFixed(0)}%`;
  document.getElementById('target-progress-current').innerText = formatCurrency(profitVal);
  document.getElementById('target-progress-bar').style.width = `${progressPercent}%`;

  // Render alerts and notifications
  renderNotifications();

  // 5. Render Bestsellers List
  renderBestsellers();

  // 6. Render charts and stats
  renderProfitSparkline();
  updateSalesSummaryStats();
}

// SVG icon helpers for the dashboard stat cards
const ICONS = {
  box: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  shoppingBag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  dollarCircle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><path d="M8 12h8"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2.5-2.5 2.5s-2.5 1-2.5 2.5a2.5 2.5 0 0 0 5 0"/></svg>`,
  tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  receipt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  wallet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/><circle cx="17" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  trendUp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  trendDown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
  bottle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;color:rgba(255,255,255,0.85);"><path d="M9 3h6v3H9z"/><path d="M12 6v4"/><path d="M6 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-9z"/></svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #ef4444;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  target: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #3b82f6;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #10b981;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
};

function iconWrap(svgStr, colorClass = 'orange') {
  return `<div class="subcard-icon-wrapper ${colorClass}">${svgStr}</div>`;
}

function updateConnectionStatusUI() {
  const dot = document.getElementById('conn-status-dot');
  const text = document.getElementById('conn-status-text');
  if (!dot || !text) return;

  if (isFirebaseInitialized) {
    dot.className = 'status-indicator online';
    text.innerText = 'Cloud Database Active';
  } else {
    dot.className = 'status-indicator offline';
    text.innerText = 'Local Database Mode';
  }
}

// ==========================================
// CUSTOM TOAST & CONFIRM DIALOG SYSTEM
// ==========================================

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;

  const iconMap = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  toast.style.pointerEvents = 'auto';
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutToast 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

const nativeAlert = window.alert;
const nativeConfirm = window.confirm;

// Global alert override
window.alert = function(message) {
  let type = 'info';
  const msgLower = String(message).toLowerCase();
  if (msgLower.includes('success') || msgLower.includes('save') || msgLower.includes('connect')) {
    type = 'success';
  } else if (msgLower.includes('fail') || msgLower.includes('error') || msgLower.includes('insufficient')) {
    type = 'error';
  } else if (msgLower.includes('warning') || msgLower.includes('invalid') || msgLower.includes('please')) {
    type = 'warning';
  }
  showToast(message, type);
};

// Global confirm override
window.confirm = function(message) {
  return showConfirmDialog(message);
};

function showConfirmDialog(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirm-dialog-overlay');
    const titleEl = document.getElementById('confirm-dialog-title');
    const msgEl = document.getElementById('confirm-dialog-message');
    const okBtn = document.getElementById('confirm-dialog-ok');
    const cancelBtn = document.getElementById('confirm-dialog-cancel');

    if (!overlay) { resolve(nativeConfirm(message)); return; }

    titleEl.textContent = title;
    msgEl.textContent = message;
    overlay.style.display = 'flex';

    setTimeout(() => cancelBtn.focus(), 50);

    function cleanup() {
      overlay.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onOverlayClick);
      document.removeEventListener('keydown', onKey);
    }
    function onOk() { cleanup(); resolve(true); }
    function onCancel() { cleanup(); resolve(false); }
    function onOverlayClick(e) { if (e.target === overlay) { cleanup(); resolve(false); } }
    function onKey(e) { if (e.key === 'Escape') { cleanup(); resolve(false); } }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onKey);
  });
}

// Render 2x2 or 3x1 Subcards Grid based on active User Role
function renderDashboardStatsGrid() {
  const kpis = calculateKPIs();
  const grid = document.getElementById('dashboard-stats-grid');
  if (!grid) return;

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (state.currentRole === 'Manager') {
    // Calculate weekly sales quantity trend
    let salesThisWeek = 0;
    let salesPrevWeek = 0;
    let revenueThisWeek = 0;
    let revenuePrevWeek = 0;

    state.transactions.forEach(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      if (txTime >= now - 7 * oneDay && txTime < now) {
        if (tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
          salesThisWeek += tx.quantity;
          revenueThisWeek += tx.quantity * tx.unitPrice;
        }
      } else if (txTime >= now - 14 * oneDay && txTime < now - 7 * oneDay) {
        if (tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
          salesPrevWeek += tx.quantity;
          revenuePrevWeek += tx.quantity * tx.unitPrice;
        }
      }
    });

    let qtyTrend = '0%';
    if (salesPrevWeek > 0) {
      const pct = ((salesThisWeek - salesPrevWeek) / salesPrevWeek) * 100;
      qtyTrend = `${pct >= 0 ? '▲' : '▼'} ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
    } else {
      qtyTrend = salesThisWeek > 0 ? '▲ +100%' : '0%';
    }

    let revTrend = '0%';
    if (revenuePrevWeek > 0) {
      const pct = ((revenueThisWeek - revenuePrevWeek) / revenuePrevWeek) * 100;
      revTrend = `${pct >= 0 ? '▲' : '▼'} ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
    } else {
      revTrend = revenueThisWeek > 0 ? '▲ +100%' : '0%';
    }

    grid.innerHTML = `
      <div class="kpi-subcard">
        <div class="kpi-subcard-header">
          ${iconWrap(ICONS.box)}
          <span class="subcard-title">Total Products</span>
          <span class="subcard-trend">Active</span>
        </div>
        <h3 class="subcard-value">${state.products.length}</h3>
        <span class="subcard-date">Update: Today</span>
      </div>
      
      <div class="kpi-subcard">
        <div class="kpi-subcard-header">
          ${iconWrap(ICONS.shoppingBag)}
          <span class="subcard-title">Total Sold</span>
          <span class="subcard-trend">${qtyTrend}</span>
        </div>
        <h3 class="subcard-value">${kpis.totalSoldUnits.toLocaleString()}</h3>
        <span class="subcard-date">Update: Today</span>
      </div>

      <div class="kpi-subcard">
        <div class="kpi-subcard-header">
          ${iconWrap(ICONS.dollarCircle)}
          <span class="subcard-title">Monthly Income</span>
          <span class="subcard-trend">${revTrend}</span>
        </div>
        <h3 class="subcard-value">${formatCurrency(kpis.totalRevenue)}</h3>
        <span class="subcard-date">Update: Today</span>
      </div>
    `;
  } else {
    // CEO or Administrator layout (Cash Flow focus + Profitability Metrics)
    let totalRestockCost = 0;
    state.transactions.forEach(tx => {
      if (tx.type === 'IN') {
        totalRestockCost += tx.quantity * tx.unitPrice;
      }
    });
    const totalOpsExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalRestockCost + totalOpsExpenses;

    // Calculate weekly trends
    // 1. Total Sales (Cash In) weekly trend
    let salesThisWeek = 0;
    let salesPrevWeek = 0;
    state.transactions.forEach(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      if (txTime >= now - 7 * oneDay && txTime < now) {
        if (tx.type === 'OUT' && tx.reason.toLowerCase().includes('sale')) {
          salesThisWeek += tx.quantity * tx.unitPrice;
        }
      } else if (txTime >= now - 14 * oneDay && txTime < now - 7 * oneDay) {
        if (tx.type === 'OUT' && tx.reason.toLowerCase().includes('sale')) {
          salesPrevWeek += tx.quantity * tx.unitPrice;
        }
      }
    });
    let salesTrend = '0%';
    let salesTrendClass = '';
    if (salesPrevWeek > 0) {
      const pct = ((salesThisWeek - salesPrevWeek) / salesPrevWeek) * 100;
      salesTrend = `${pct >= 0 ? '▲' : '▼'} ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
      salesTrendClass = pct >= 0 ? '' : 'down';
    } else {
      salesTrend = salesThisWeek > 0 ? '▲ +100%' : '0%';
      salesTrendClass = '';
    }

    // 2. Total Expenses (Cash Out) weekly trend
    let expensesThisWeek = 0;
    let expensesPrevWeek = 0;
    state.transactions.forEach(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      if (txTime >= now - 7 * oneDay && txTime < now) {
        if (tx.type === 'IN') {
          expensesThisWeek += tx.quantity * tx.unitPrice;
        }
      } else if (txTime >= now - 14 * oneDay && txTime < now - 7 * oneDay) {
        if (tx.type === 'IN') {
          expensesPrevWeek += tx.quantity * tx.unitPrice;
        }
      }
    });
    state.expenses.forEach(e => {
      const expTime = new Date(e.date).getTime();
      if (expTime >= now - 7 * oneDay && expTime < now) {
        expensesThisWeek += e.amount;
      } else if (expTime >= now - 14 * oneDay && expTime < now - 7 * oneDay) {
        expensesPrevWeek += e.amount;
      }
    });
    let expensesTrend = '0%';
    let expensesTrendClass = '';
    if (expensesPrevWeek > 0) {
      const pct = ((expensesThisWeek - expensesPrevWeek) / expensesPrevWeek) * 100;
      expensesTrend = `${pct >= 0 ? '▲' : '▼'} ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
      expensesTrendClass = pct >= 0 ? 'down' : ''; // Expense going up is danger/down
    } else {
      expensesTrend = expensesThisWeek > 0 ? '▲ +100%' : '0%';
      expensesTrendClass = expensesThisWeek > 0 ? 'down' : '';
    }

    // 3. Gross Profit weekly trend
    const grossThisWeek = getProfitForPeriod(7, 0, 'Manager'); // Manager profit calculation returns Gross Profit
    const grossPrevWeek = getProfitForPeriod(14, 7, 'Manager');
    let grossTrend = '0%';
    let grossTrendClass = '';
    if (grossPrevWeek > 0) {
      const pct = ((grossThisWeek - grossPrevWeek) / grossPrevWeek) * 100;
      grossTrend = `${pct >= 0 ? '▲' : '▼'} ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
      grossTrendClass = pct >= 0 ? '' : 'down';
    } else {
      grossTrend = grossThisWeek > 0 ? '▲ +100%' : '0%';
      grossTrendClass = '';
    }

    // 4. Net Profit weekly trend
    const netThisWeek = getProfitForPeriod(7, 0, 'CEO');
    const netPrevWeek = getProfitForPeriod(14, 7, 'CEO');
    let netTrend = '0%';
    let netTrendClass = '';
    if (netPrevWeek === 0) {
      netTrend = netThisWeek > 0 ? '▲ +100%' : (netThisWeek < 0 ? '▼ -100%' : '0%');
      netTrendClass = netThisWeek >= 0 ? '' : 'down';
    } else {
      const pct = ((netThisWeek - netPrevWeek) / Math.abs(netPrevWeek)) * 100;
      netTrend = `${pct >= 0 ? '▲' : '▼'} ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
      netTrendClass = pct >= 0 ? '' : 'down';
    }

    grid.innerHTML = `
      <div class="kpi-subcard">
        <div class="kpi-subcard-header">
          ${iconWrap(ICONS.tag, 'purple')}
          <span class="subcard-title">Total Sales (Cash In)</span>
          <span class="subcard-trend ${salesTrendClass}">${salesTrend}</span>
        </div>
        <h3 class="subcard-value">${formatCurrency(kpis.totalRevenue)}</h3>
        <span class="subcard-date">Sales Inflow</span>
      </div>
      
      <div class="kpi-subcard">
        <div class="kpi-subcard-header">
          ${iconWrap(ICONS.receipt, 'blue')}
          <span class="subcard-title">Total Expenses (Cash Out)</span>
          <span class="subcard-trend ${expensesTrendClass}">${expensesTrend}</span>
        </div>
        <h3 class="subcard-value">${formatCurrency(totalExpenses)}</h3>
        <span class="subcard-date">Cash Outflow</span>
      </div>

      <div class="kpi-subcard">
        <div class="kpi-subcard-header">
          ${iconWrap(ICONS.dollarCircle, 'orange')}
          <span class="subcard-title">Gross Profit</span>
          <span class="subcard-trend ${grossTrendClass}">${grossTrend}</span>
        </div>
        <h3 class="subcard-value">${formatCurrency(kpis.grossProfit)}</h3>
        <span class="subcard-date">Revenue - COGS</span>
      </div>

      <div class="kpi-subcard">
        <div class="kpi-subcard-header">
          ${iconWrap(ICONS.wallet, 'orange')}
          <span class="subcard-title">Net Profit</span>
          <span class="subcard-trend ${netTrendClass}">${netTrend}</span>
        </div>
        <h3 class="subcard-value">${formatCurrency(kpis.netProfit)}</h3>
        <span class="subcard-date">Gross Profit - Ops Expenses</span>
      </div>
    `;
  }
}


// Helper to generate a smooth cubic bezier curve path through points
function getBezierPath(points) {
  if (points.length === 0) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i+1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p1.x - (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
  }
  return d;
}

// Draw smooth white sparkline inside the Orange Profit Card
function renderProfitSparkline() {
  const sparklinePath = document.getElementById('profit-sparkline-path');
  const sparklineFill = document.getElementById('profit-sparkline-fill');
  if (!sparklinePath) return;

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const dailyProfit = [];

  // Get daily profits for last 6 days
  for (let i = 5; i >= 0; i--) {
    const start = now - (i + 1) * oneDay;
    const end = now - i * oneDay;
    let profit = 0;

    state.transactions.forEach(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      if (txTime >= start && txTime < end && tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
        const prod = state.products.find(p => p.id === tx.productId);
        if (prod) {
          const cost = tx.costPrice !== undefined ? tx.costPrice : prod.costPrice;
          profit += tx.quantity * (tx.unitPrice - cost);
        }
      }
    });
    dailyProfit.push(profit);
  }

  // Scale and plot coordinates in a 300x100 container
  const max = Math.max(...dailyProfit, 50000) * 1.15;
  const points = dailyProfit.map((val, idx) => {
    const x = 10 + idx * 56;
    const y = 95 - (val / max) * 45; // Scale beautifully from y=50 to y=95 to stay in bottom half
    return { x, y };
  });

  const lineD = getBezierPath(points);
  sparklinePath.setAttribute('d', lineD);

  if (sparklineFill) {
    const fillD = lineD + ` L ${points[points.length - 1].x},100 L ${points[0].x},100 Z`;
    sparklineFill.setAttribute('d', fillD);
  }

  const dot = document.getElementById('profit-sparkline-dot');
  const lastPoint = points[points.length - 1];
  if (dot && lastPoint) {
    dot.setAttribute('cx', lastPoint.x);
    dot.setAttribute('cy', lastPoint.y);
    dot.style.display = 'block';
  }
}

// Render Stacked Bar Chart for "Product Sale" panel
function renderStackedBarChart(period = 'monthly') {
  const container = document.getElementById('bar-chart-wrapper');
  if (!container) return;

  const data = [];
  
  if (period === 'monthly') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = monthNames[d.getMonth()];
      const monthStart = d.getTime();
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      
      const sales = { Signature: 0, Elite: 0, Deciduous: 0, Standard: 0 };
      state.transactions.forEach(tx => {
        const txTime = new Date(tx.timestamp).getTime();
        if (txTime >= monthStart && txTime < nextMonth && tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
          const prod = state.products.find(p => p.id === tx.productId);
          if (prod && sales[prod.category] !== undefined) {
            sales[prod.category] += tx.quantity;
          }
        }
      });
      data.push({ label: mLabel, sales });
    }
  } else {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * oneDay);
      const dLabel = dayNames[d.getDay()];
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const end = start + oneDay;

      const sales = { Signature: 0, Elite: 0, Deciduous: 0, Standard: 0 };
      state.transactions.forEach(tx => {
        const txTime = new Date(tx.timestamp).getTime();
        if (txTime >= start && txTime < end && tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
          const prod = state.products.find(p => p.id === tx.productId);
          if (prod && sales[prod.category] !== undefined) {
            sales[prod.category] += tx.quantity;
          }
        }
      });
      data.push({ label: dLabel, sales });
    }
  }

  // Find max sum of sales to scale heights
  let maxSales = 10;
  data.forEach(d => {
    const sum = d.sales.Signature + d.sales.Elite + d.sales.Deciduous + d.sales.Standard;
    if (sum > maxSales) maxSales = sum;
  });

  // Render HTML bars
  container.innerHTML = data.map(d => {
    const sigVal = d.sales.Signature;
    const eliVal = d.sales.Elite;
    const decVal = d.sales.Deciduous;
    const stdVal = d.sales.Standard;
    const total = sigVal + eliVal + decVal + stdVal;
    
    const scale = total > 0 ? (total / maxSales) * 100 : 0;
    
    const sigPct = total > 0 ? (sigVal / total) * 100 : 0;
    const eliPct = total > 0 ? (eliVal / total) * 100 : 0;
    const decPct = total > 0 ? (decVal / total) * 100 : 0;
    const stdPct = total > 0 ? (stdVal / total) * 100 : 0;

    return `
      <div class="bar-column">
        <div class="bar-stack" style="height: ${Math.max(5, scale)}%;">
          ${sigVal > 0 ? `<div class="bar-segment signature" style="height: ${sigPct}%;"></div>` : ''}
          ${eliVal > 0 ? `<div class="bar-segment elite" style="height: ${eliPct}%;"></div>` : ''}
          ${decVal > 0 ? `<div class="bar-segment deciduous" style="height: ${decPct}%;"></div>` : ''}
          ${stdVal > 0 ? `<div class="bar-segment standard" style="height: ${stdPct}%;"></div>` : ''}
        </div>
        <div class="bar-label">${d.label}</div>
      </div>
    `;
  }).join('');
}

// Render Bestseller Products listing with Category Filter Tabs
function renderBestsellers() {
  const container = document.getElementById('bestseller-products-list');
  const activeTab = document.querySelector('.tab-btn.active');
  const activeCategory = activeTab ? activeTab.getAttribute('data-category') : 'all';
  const period = document.getElementById('bestseller-period').value;

  let productsWithSales = state.products.map(p => ({
    ...p,
    sold: getProductSoldUnits(p.id, period)
  }));

  // Filter by category
  if (activeCategory !== 'all') {
    productsWithSales = productsWithSales.filter(p => p.category === activeCategory);
  }

  // Sort descending by sold count and take top 5
  productsWithSales.sort((a, b) => b.sold - a.sold);
  const topProducts = productsWithSales.slice(0, 5);

  if (topProducts.length === 0 || topProducts[0].sold === 0) {
    container.innerHTML = `<div class="text-center text-muted py-4">No product sales recorded for this selection.</div>`;
    return;
  }

  container.innerHTML = topProducts.map(p => `
    <div class="bestseller-item">
      <div class="bestseller-product-info">
        <div class="bestseller-avatar">${ICONS.bottle}</div>
        <div class="bestseller-meta">
          <h4>${p.name}</h4>
          <span>${p.category} Collection</span>
        </div>
      </div>
      <div class="bestseller-financials">
        <div class="bestseller-price">${formatCurrency(p.sellingPrice)}</div>
        <div class="bestseller-sold-badge">Sold: ${p.sold} units</div>
      </div>
    </div>
  `).join('');
}

// Update Sales Statistics Summary Metrics
function updateSalesSummaryStats() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const values = [];

  // Get sales counts for last 7 days
  for (let i = 6; i >= 0; i--) {
    const start = now - (i + 1) * oneDay;
    const end = now - i * oneDay;
    let qty = 0;

    state.transactions.forEach(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      if (txTime >= start && txTime < end && tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
        qty += tx.quantity;
      }
    });
    values.push(qty);
  }

  // 1. Calculate Analytics Summary Metrics
  const weeklyTotal = values.reduce((sum, v) => sum + v, 0);
  const dailyAvg = (weeklyTotal / 7).toFixed(1);

  // Get sales counts for previous week (days 8 to 14 ago)
  let prevWeeklyTotal = 0;
  for (let i = 13; i >= 7; i--) {
    const start = now - (i + 1) * oneDay;
    const end = now - i * oneDay;
    state.transactions.forEach(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      if (txTime >= start && txTime < end && tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
        prevWeeklyTotal += tx.quantity;
      }
    });
  }

  let velocityText = '0%';
  let velocityClass = 'text-muted';
  if (prevWeeklyTotal > 0) {
    const pct = ((weeklyTotal - prevWeeklyTotal) / prevWeeklyTotal) * 100;
    const sign = pct >= 0 ? '+' : '';
    velocityText = `${sign}${pct.toFixed(0)}%`;
    velocityClass = pct >= 0 ? 'text-success' : 'text-danger';
  } else {
    velocityText = weeklyTotal > 0 ? '+100%' : '0%';
    velocityClass = weeklyTotal > 0 ? 'text-success' : 'text-muted';
  }

  // Update Summary DOM elements
  const weeklyEl = document.getElementById('sales-stats-weekly-total');
  const avgEl = document.getElementById('sales-stats-daily-avg');
  const velEl = document.getElementById('sales-stats-velocity');

  if (weeklyEl) weeklyEl.innerText = `${weeklyTotal} units`;
  if (avgEl) avgEl.innerText = `${dailyAvg} units`;
  if (velEl) {
    velEl.innerHTML = velocityText + (weeklyTotal >= prevWeeklyTotal 
      ? ' <span style="color:#2ecc71;">▲</span>' 
      : ' <span style="color:#ef4444;">▼</span>');
    velEl.className = `metric-value ${velocityClass}`;
  }
}

// Render Cash Flow & Expenses View (CEO & Admin Only)
function renderCashFlow() {
  const kpis = calculateKPIs();
  
  // Calculate expenses: Restocks + Operational Expenses
  let totalRestockCost = 0;
  state.transactions.forEach(tx => {
    if (tx.type === 'IN') {
      totalRestockCost += tx.quantity * tx.unitPrice;
    }
  });
  const totalOpsExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = totalRestockCost + totalOpsExpenses;
  const cumulativeBalance = kpis.totalRevenue - totalExpenses;

  // 1. Update summary stats
  document.getElementById('cf-val-sales').innerText = formatCurrency(kpis.totalRevenue);
  document.getElementById('cf-val-expenses').innerText = formatCurrency(totalExpenses);
  document.getElementById('cf-val-balance').innerText = formatCurrency(cumulativeBalance);

  const balanceCard = document.getElementById('cf-balance-card');
  const balanceStatus = document.getElementById('cf-val-balance-status');
  const balanceIcon = document.getElementById('cf-balance-icon');

  if (cumulativeBalance >= 0) {
    balanceCard.className = 'cf-kpi-card positive';
    balanceStatus.innerText = 'Net Positive Cash';
    balanceStatus.className = 'cf-subtext text-success';
    balanceIcon.innerHTML = ICONS.trendUp;
  } else {
    balanceCard.className = 'cf-kpi-card negative';
    balanceStatus.innerText = 'Net Negative Cash';
    balanceStatus.className = 'cf-subtext text-danger';
    balanceIcon.innerHTML = ICONS.trendDown;
  }

  // 2. Render operational expenses log table
  const tbody = document.getElementById('cf-expenses-table-body');
  const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sortedExpenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No operational expenses logged.</td></tr>`;
  } else {
    tbody.innerHTML = sortedExpenses.map(exp => `
      <tr>
        <td data-label="Date" class="text-muted">${new Date(exp.date).toLocaleDateString()}</td>
        <td data-label="Category"><span class="badge-pill lowstock" style="font-size: 0.7rem;">${exp.category}</span></td>
        <td data-label="Description">${exp.description}</td>
        <td data-label="Paid Amount" class="text-right font-bold text-danger">-${formatCurrency(exp.amount)}</td>
        <td data-label="Actions" class="text-right">
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button class="btn-edit-pencil" onclick="editExpense('${exp.id}')" title="Edit Expense" style="background: none; border: none; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--text-secondary);"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-delete-row" onclick="deleteExpense('${exp.id}')" title="Delete Expense" style="background: none; border: none; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:#ef4444;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // 3. Render cumulative balance progression graph
  renderCumulativeCashFlowChart();
}

// Draw cumulative daily balance graph (includes negative balance support)
function renderCumulativeCashFlowChart() {
  const path = document.getElementById('cf-cumulative-path');
  if (!path) return;

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const dailyBalances = [];
  
  // Track running cumulative values
  let cumulative = 0;

  // Let's compute historical sales & costs for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const start = now - (i + 1) * oneDay;
    const end = now - i * oneDay;
    let dayNet = 0;

    // Add sales revenue & subtract restock expenses
    state.transactions.forEach(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      if (txTime >= start && txTime < end) {
        if (tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
          dayNet += tx.quantity * tx.unitPrice; // Sales inflow
        } else if (tx.type === 'IN') {
          dayNet -= tx.quantity * tx.unitPrice; // Restock outflow
        }
      }
    });

    // Subtract operational expenses
    state.expenses.forEach(exp => {
      const expTime = new Date(exp.date).getTime();
      if (expTime >= start && expTime < end) {
        dayNet -= exp.amount;
      }
    });

    cumulative += dayNet;
    dailyBalances.push(cumulative);
  }

  // Find max absolute value to scale relative to the center zero-line (y=60)
  const maxAbsVal = Math.max(...dailyBalances.map(v => Math.abs(v)), 100000) * 1.25;

  const startX = 30;
  const zeroY = 60; // middle of 120px height
  const points = dailyBalances.map((val, idx) => {
    const x = startX + idx * 52;
    // Scale relative to max value. Positives scale up (y decreases), Negatives scale down (y increases)
    const y = zeroY - (val / maxAbsVal) * 45; 
    return `${x},${y}`;
  });

  path.setAttribute('d', `M ${points.join(' L ')}`);
}

// Render Products Catalog View
function renderProducts() {
  const tableBody = document.getElementById('products-table-body');
  const searchVal = document.getElementById('inventory-search').value.toLowerCase();
  const statusFilter = document.getElementById('filter-stock-status').value;
  const categoryFilter = document.getElementById('filter-category').value;

  let filtered = state.products.map(p => ({
    ...p,
    stock: getProductStock(p.id)
  }));

  // Apply filters
  if (searchVal) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchVal) ||
      p.sku.toLowerCase().includes(searchVal) ||
      p.category.toLowerCase().includes(searchVal)
    );
  }

  if (categoryFilter !== 'all') {
    filtered = filtered.filter(p => p.category === categoryFilter);
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter(p => {
      if (statusFilter === 'instock') return p.stock >= p.minStockThreshold;
      if (statusFilter === 'lowstock') return p.stock > 0 && p.stock < p.minStockThreshold;
      if (statusFilter === 'outofstock') return p.stock === 0;
      return true;
    });
  }

  // Calculate pagination bounds (7 items per page)
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.productsItemsPerPage);

  if (state.productsCurrentPage > totalPages) {
    state.productsCurrentPage = Math.max(1, totalPages);
  }

  const startIndex = (state.productsCurrentPage - 1) * state.productsItemsPerPage;
  const endIndex = startIndex + state.productsItemsPerPage;
  const paginatedItems = filtered.slice(startIndex, endIndex);

  tableBody.innerHTML = paginatedItems.map(p => {
    let statusClass = 'instock';
    let statusText = 'In Stock';
    if (p.stock === 0) {
      statusClass = 'outofstock';
      statusText = 'Out of Stock';
    } else if (p.stock < p.minStockThreshold) {
      statusClass = 'lowstock';
      statusText = 'Low Stock';
    }

    return `
      <tr>
        <td data-label="Product Details">
          <div class="product-cell">
            <div class="product-avatar" style="display:flex;align-items:center;justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;color:rgba(255,255,255,0.85);"><path d="M9 3h6v3H9z"/><path d="M12 6v4"/><path d="M6 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-9z"/></svg>
            </div>
            <div class="product-meta">
              <h4>${p.name}</h4>
              <span>Collection: ${p.category}</span>
            </div>
          </div>
        </td>
        <td data-label="SKU"><code>${p.sku}</code></td>
        <td data-label="Category">${p.category}</td>
        <td data-label="Wholesale Cost" class="text-right font-medium">${formatCurrency(p.costPrice)}</td>
        <td data-label="Retail Price" class="text-right font-medium">${formatCurrency(p.sellingPrice)}</td>
        <td data-label="Stock Level" class="text-center font-bold">${p.stock}</td>
        <td data-label="Status" class="text-center">
          <span class="badge-pill ${statusClass}">${statusText}</span>
        </td>
        <td data-label="Actions" class="text-right">
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm-action btn-restock-action" data-id="${p.id}" style="display: inline-flex; align-items: center; gap: 0.25rem;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#2ecc71;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              In
            </button>
            <button class="btn btn-secondary btn-sm-action btn-sell-action" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''} style="display: inline-flex; align-items: center; gap: 0.25rem;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#ef4444;"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              Out
            </button>
            <button class="btn btn-outline btn-sm-action btn-edit-action" data-id="${p.id}">Edit</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Render Pagination Controls Footer
  const paginationContainer = document.getElementById('products-pagination-container');
  if (paginationContainer) {
    if (totalItems === 0) {
      paginationContainer.innerHTML = '';
    } else {
      let pageNumbersHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        pageNumbersHTML += `<li><button class="page-btn ${state.productsCurrentPage === i ? 'active' : ''}" data-page="${i}">${i}</button></li>`;
      }

      paginationContainer.innerHTML = `
        <div class="pagination-total">Total ${totalItems} items</div>
        <ul class="pagination-list">
          <li><button class="page-btn arrow-prev" ${state.productsCurrentPage === 1 ? 'disabled' : ''}>&lt;</button></li>
          ${pageNumbersHTML}
          <li><button class="page-btn arrow-next" ${state.productsCurrentPage === totalPages ? 'disabled' : ''}>&gt;</button></li>
        </ul>
      `;
    }
  }

  // Re-attach inline table action listeners
  document.querySelectorAll('.btn-restock-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prodId = e.currentTarget.getAttribute('data-id');
      openTransactionModal('IN', prodId);
    });
  });

  document.querySelectorAll('.btn-sell-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prodId = e.currentTarget.getAttribute('data-id');
      openTransactionModal('OUT', prodId);
    });
  });

  document.querySelectorAll('.btn-edit-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prodId = e.currentTarget.getAttribute('data-id');
      openProductModal(prodId);
    });
  });

  // Re-attach pagination event listeners
  if (paginationContainer && totalItems > 0) {
    paginationContainer.querySelectorAll('.page-btn:not(.arrow-prev):not(.arrow-next)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetPage = parseInt(e.currentTarget.getAttribute('data-page'));
        state.productsCurrentPage = targetPage;
        renderProducts();
      });
    });

    const prevBtn = paginationContainer.querySelector('.arrow-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.productsCurrentPage > 1) {
          state.productsCurrentPage--;
          renderProducts();
        }
      });
    }

    const nextBtn = paginationContainer.querySelector('.arrow-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state.productsCurrentPage < totalPages) {
          state.productsCurrentPage++;
          renderProducts();
        }
      });
    }
  }
}

// Render Movements / Transactions View
function renderTransactions() {
  const tableBody = document.getElementById('transactions-table-body');
  const searchVal = document.getElementById('tx-search').value.toLowerCase();
  const typeFilter = document.getElementById('filter-tx-type').value;

  let filtered = [...state.transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (typeFilter !== 'all') {
    filtered = filtered.filter(tx => tx.type === typeFilter);
  }

  if (searchVal) {
    filtered = filtered.filter(tx => {
      const product = state.products.find(p => p.id === tx.productId);
      return (
        (product && product.name.toLowerCase().includes(searchVal)) ||
        (product && product.sku.toLowerCase().includes(searchVal)) ||
        (tx.reason || '').toLowerCase().includes(searchVal)
      );
    });
  }

  // Calculate pagination bounds (7 items per page)
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.transactionsItemsPerPage);

  if (state.transactionsCurrentPage > totalPages) {
    state.transactionsCurrentPage = Math.max(1, totalPages);
  }

  const startIndex = (state.transactionsCurrentPage - 1) * state.transactionsItemsPerPage;
  const endIndex = startIndex + state.transactionsItemsPerPage;
  const paginatedItems = filtered.slice(startIndex, endIndex);

  tableBody.innerHTML = paginatedItems.map(tx => {
    const product = state.products.find(p => p.id === tx.productId);
    const totalVal = tx.quantity * tx.unitPrice;
    const isSale = tx.type === 'OUT';
    const isRestock = tx.type === 'IN';
    
    let labelClass = 'text-muted';
    let labelSign = '';
    
    if (isRestock) {
      // Stock coming IN = cost going out (money leaving business)
      labelClass = 'text-danger';
      labelSign = '-';
    } else if (isSale) {
      // Stock going OUT = money coming IN = positive revenue
      labelClass = 'text-success';
      labelSign = '+';
    }

    const custName = tx.customerId ? (state.customers.find(c => c.id === tx.customerId)?.name || 'Deleted Customer') : '';

    return `
      <tr>
        <td data-label="Timestamp" class="text-muted">${formatDate(tx.timestamp)}</td>
        <td data-label="Product">
          <div class="product-cell">
            <div class="product-meta">
              <h4>${product ? product.name : 'Unknown Product'}</h4>
              <span>SKU: ${product ? product.sku : 'N/A'}</span>
            </div>
          </div>
        </td>
        <td data-label="Type">
          <span class="font-bold ${labelClass}">${tx.type} ${labelSign}</span>
        </td>
        <td data-label="Quantity" class="text-center font-medium">${tx.quantity}</td>
        <td data-label="Unit Value" class="text-right">${formatCurrency(tx.unitPrice)}</td>
        <td data-label="Total Value" class="text-right font-bold ${labelClass}">${labelSign}${formatCurrency(totalVal)}</td>
        <td data-label="Notes">
          <div>${tx.reason || ''}</div>
          ${custName ? `<span class="badge-pill instock" style="font-size:0.65rem; margin-top:0.25rem; display:inline-flex; align-items:center; gap:0.2rem;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${custName}</span>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  // Render Pagination Controls Footer
  const paginationContainer = document.getElementById('transactions-pagination-container');
  if (paginationContainer) {
    if (totalItems === 0) {
      paginationContainer.innerHTML = '';
    } else {
      let pageNumbersHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        pageNumbersHTML += `<li><button class="page-btn ${state.transactionsCurrentPage === i ? 'active' : ''}" data-page="${i}">${i}</button></li>`;
      }

      paginationContainer.innerHTML = `
        <div class="pagination-total">Total ${totalItems} items</div>
        <ul class="pagination-list">
          <li><button class="page-btn arrow-prev" ${state.transactionsCurrentPage === 1 ? 'disabled' : ''}>&lt;</button></li>
          ${pageNumbersHTML}
          <li><button class="page-btn arrow-next" ${state.transactionsCurrentPage === totalPages ? 'disabled' : ''}>&gt;</button></li>
        </ul>
      `;
    }
  }
}

// Render CRM View
function renderCRM() {
  const listContainer = document.getElementById('customer-list');
  const searchVal = document.getElementById('crm-search').value.toLowerCase();

  let filtered = [...state.customers];

  if (searchVal) {
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(searchVal) ||
      c.phone.toLowerCase().includes(searchVal) ||
      (c.email && c.email.toLowerCase().includes(searchVal))
    );
  }

  listContainer.innerHTML = filtered.map(c => {
    const stats = getCustomerStats(c.id);
    const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return `
      <div class="customer-card" data-id="${c.id}">
        <div class="customer-info">
          <div class="customer-list-avatar">${initials}</div>
          <div class="customer-meta">
            <h4>${c.name}</h4>
            <span>${c.phone}</span>
          </div>
        </div>
        <div class="customer-financials">
          <div class="ltv-amount">${formatCurrency(stats.totalLTV)}</div>
          <div class="order-count">${stats.orderCount} Orders</div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to customer cards
  document.querySelectorAll('.customer-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const custId = e.currentTarget.getAttribute('data-id');
      selectCustomer(custId);
    });
  });
}

// Select customer in CRM detail view
function selectCustomer(id) {
  document.querySelectorAll('.customer-card').forEach(c => {
    c.classList.toggle('selected', c.getAttribute('data-id') === id);
  });

  const customer = state.customers.find(c => c.id === id);
  if (!customer) return;

  const stats = getCustomerStats(id);
  const initials = customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Populate Details Pane
  document.querySelector('.customer-details-placeholder').style.display = 'none';
  const detailContent = document.querySelector('.customer-details-content');
  detailContent.style.display = 'block';

  // Toggle layout class for mobile responsive split screen
  const splitLayout = document.querySelector('.crm-split-layout');
  if (splitLayout) {
    splitLayout.classList.add('show-details');
  }

  document.getElementById('cust-profile-avatar').innerText = initials;
  document.getElementById('cust-profile-name').innerText = customer.name;
  document.getElementById('cust-profile-joined').innerText = `Joined: ${new Date(customer.createdAt).toLocaleDateString()}`;

  document.getElementById('cust-stat-purchases').innerText = `${stats.orderCount} Order${stats.orderCount === 1 ? '' : 's'}`;
  document.getElementById('cust-stat-ltv').innerText = formatCurrency(stats.totalLTV);

  // Favourite perfumes display
  const favElem = document.getElementById('cust-stat-favorite');
  if (favElem) {
    if (stats.favoritePerfumes && stats.favoritePerfumes.length > 0) {
      favElem.innerHTML = stats.favoritePerfumes.map(p =>
        `<span style="display:inline-block;background:var(--accent-glow,rgba(167,139,250,0.15));color:var(--accent,#a78bfa);border:1px solid var(--accent,#a78bfa);border-radius:12px;padding:0.1rem 0.55rem;font-size:0.8rem;margin:0.1rem 0.15rem 0.1rem 0;">${p}</span>`
      ).join('');
    } else {
      favElem.innerHTML = `<span style="color:var(--text-muted,#888);font-size:0.85rem;font-style:italic;">${stats.favoritePerfume === '-' ? 'None recorded yet' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;margin-bottom:2px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' + stats.favoritePerfume + ' (auto)'}</span>`;
    }
  }

  // Populate contact fields + inline name
  document.getElementById('cust-profile-phone').innerText = customer.phone;
  document.getElementById('cust-profile-email').innerText = customer.email || 'N/A';
  const nameInline = document.getElementById('cust-profile-name-inline');
  if (nameInline) nameInline.innerText = customer.name;

  // ── INLINE FIELD EDIT (Phone, Email, Name) ──────────────────────────────
  const fieldMap = {
    phone: { spanId: 'cust-profile-phone', type: 'tel', label: 'Phone Number' },
    email: { spanId: 'cust-profile-email', type: 'email', label: 'Email Address' },
    name:  { spanId: 'cust-profile-name-inline', type: 'text', label: 'Customer Name' }
  };

  document.querySelectorAll('.btn-inline-edit').forEach(btn => {
    // Clone to remove old listeners
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', () => {
      const field = fresh.dataset.field;
      const cfg = fieldMap[field];
      if (!cfg) return;
      const span = document.getElementById(cfg.spanId);
      const currentVal = span.innerText === 'N/A' ? '' : span.innerText;

      // Build inline input row
      const inputEl = document.createElement('input');
      inputEl.type = cfg.type;
      inputEl.value = currentVal;
      inputEl.style.cssText = 'flex:1;padding:0.2rem 0.5rem;border:1px solid var(--accent,#a78bfa);border-radius:6px;background:var(--bg-card,#1e1e2e);color:var(--text-primary);font-size:0.9rem;';

      const saveBtn = document.createElement('button');
      saveBtn.textContent = '✓';
      saveBtn.title = 'Save';
      saveBtn.style.cssText = 'background:var(--accent,#a78bfa);color:#fff;border:none;border-radius:6px;padding:0.2rem 0.5rem;cursor:pointer;font-size:0.9rem;';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '✕';
      cancelBtn.title = 'Cancel';
      cancelBtn.style.cssText = 'background:none;border:1px solid #888;color:#888;border-radius:6px;padding:0.2rem 0.5rem;cursor:pointer;font-size:0.9rem;';

      // Replace span with input
      const li = fresh.parentElement;
      span.style.display = 'none';
      fresh.style.display = 'none';
      li.appendChild(inputEl);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);
      inputEl.focus();

      const restore = () => {
        span.style.display = '';
        fresh.style.display = '';
        inputEl.remove();
        saveBtn.remove();
        cancelBtn.remove();
      };

      cancelBtn.addEventListener('click', restore);

      const doSave = () => {
        const newVal = inputEl.value.trim();
        if (!newVal) { restore(); return; }
        if (field === 'phone' && !isValidPhone(newVal)) {
          showToast('Please enter a valid phone number (at least 7 digits).', 'warning');
          return;
        }
        const idx = state.customers.findIndex(c => c.id === id);
        if (idx !== -1) {
          state.customers[idx][field] = newVal;
          saveCustomers();
          // Update all display spots
          span.innerText = newVal;
          if (field === 'name') {
            document.getElementById('cust-profile-name').innerText = newVal;
            document.getElementById('cust-profile-avatar').innerText =
              newVal.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            // Refresh customer card in list too
            const card = document.querySelector(`.customer-card[data-id="${id}"]`);
            if (card) {
              const cardName = card.querySelector('.customer-name');
              if (cardName) cardName.innerText = newVal;
            }
          }
          if (field === 'phone') {
            const card = document.querySelector(`.customer-card[data-id="${id}"]`);
            if (card) {
              const cardPhone = card.querySelector('.customer-phone');
              if (cardPhone) cardPhone.innerText = newVal;
            }
          }
        }
        restore();
      };

      saveBtn.addEventListener('click', doSave);
      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') doSave();
        if (e.key === 'Escape') restore();
      });
    });
  });

  // ── FAVOURITE PERFUMES INLINE EDITOR ───────────────────────────────────
  const btnEditFavs = document.getElementById('btn-edit-favs');
  const inlineFavEditor = document.getElementById('inline-fav-editor');
  const inlineFavList = document.getElementById('inline-fav-list');

  if (btnEditFavs && inlineFavEditor && inlineFavList) {
    const freshEditFavs = btnEditFavs.cloneNode(true);
    btnEditFavs.parentNode.replaceChild(freshEditFavs, btnEditFavs);

    const openFavEditor = () => {
      inlineFavEditor.style.display = 'block';
      freshEditFavs.style.display = 'none';
      inlineFavList.innerHTML = '';
      const existingFavs = customer.favoritePerfumes && customer.favoritePerfumes.length > 0
        ? customer.favoritePerfumes
        : (customer.favoritePerfume ? [customer.favoritePerfume] : ['']);
      existingFavs.forEach(val => inlineFavList.appendChild(buildFavPerfumeRow(val)));
    };

    freshEditFavs.addEventListener('click', openFavEditor);

    // + Add button inside inline editor
    const addInlineBtn = document.getElementById('btn-add-inline-fav');
    if (addInlineBtn) {
      const freshAdd = addInlineBtn.cloneNode(true);
      addInlineBtn.parentNode.replaceChild(freshAdd, addInlineBtn);
      freshAdd.addEventListener('click', () => {
        if (inlineFavList.querySelectorAll('.fav-perfume-row').length < 3) {
          inlineFavList.appendChild(buildFavPerfumeRow());
        } else {
          freshAdd.title = 'Max 3 preferences';
        }
      });
    }

    // Save favourites
    const saveFavsBtn = document.getElementById('btn-save-favs');
    if (saveFavsBtn) {
      const freshSave = saveFavsBtn.cloneNode(true);
      saveFavsBtn.parentNode.replaceChild(freshSave, saveFavsBtn);
      freshSave.addEventListener('click', () => {
        const selects = inlineFavList.querySelectorAll('.fav-perfume-select');
        const newFavs = Array.from(selects).map(s => s.value.trim()).filter(Boolean);
        const idx = state.customers.findIndex(c => c.id === id);
        if (idx !== -1) {
          state.customers[idx].favoritePerfumes = newFavs.length > 0 ? newFavs : null;
          state.customers[idx].favoritePerfume = null;
          saveCustomers();
        }
        inlineFavEditor.style.display = 'none';
        freshEditFavs.style.display = '';
        // Re-render display
        if (favElem) {
          if (newFavs.length > 0) {
            favElem.innerHTML = newFavs.map(p =>
              `<span style="display:inline-block;background:var(--accent-glow,rgba(167,139,250,0.15));color:var(--accent,#a78bfa);border:1px solid var(--accent,#a78bfa);border-radius:12px;padding:0.1rem 0.55rem;font-size:0.8rem;margin:0.1rem 0.15rem 0.1rem 0;">${p}</span>`
            ).join('');
          } else {
            favElem.innerHTML = `<span style="color:var(--text-muted,#888);font-size:0.85rem;font-style:italic;">None recorded yet</span>`;
          }
        }
      });
    }

    // Cancel favourites editor
    const cancelFavsBtn = document.getElementById('btn-cancel-favs');
    if (cancelFavsBtn) {
      const freshCancel = cancelFavsBtn.cloneNode(true);
      cancelFavsBtn.parentNode.replaceChild(freshCancel, cancelFavsBtn);
      freshCancel.addEventListener('click', () => {
        inlineFavEditor.style.display = 'none';
        freshEditFavs.style.display = '';
      });
    }
  }

  // ── CLEAR PURCHASE HISTORY ──────────────────────────────────────────────
  const btnClearHistory = document.getElementById('btn-clear-history');
  if (btnClearHistory) {
    const freshClear = btnClearHistory.cloneNode(true);
    btnClearHistory.parentNode.replaceChild(freshClear, btnClearHistory);
    freshClear.addEventListener('click', async () => {
      const custName = customer.name;
      const count = state.transactions.filter(tx => tx.customerId === id && tx.type === 'OUT').length;
      if (count === 0) {
        showToast('This customer has no purchase history to clear.', 'info');
        return;
      }
      if (!await showConfirmDialog(`Clear all ${count} purchase record(s) for ${custName}? This only removes their history from the CRM view. It does NOT affect inventory or financial totals.`, 'Clear Purchase History')) return;
      // Unlink customer from their OUT transactions (preserves financials & stock!)
      state.transactions = state.transactions.map(tx =>
        (tx.customerId === id && tx.type === 'OUT') ? { ...tx, customerId: null, reason: (tx.reason || '') + ' [cleared customer history]' } : tx
      );
      saveTransactions();
      // Re-render
      selectCustomer(id);
    });
  }

  // ── DELETE CUSTOMER ─────────────────────────────────────────────────────
  const btnDeleteCustomer = document.getElementById('btn-delete-customer');
  if (btnDeleteCustomer) {
    const freshDelete = btnDeleteCustomer.cloneNode(true);
    btnDeleteCustomer.parentNode.replaceChild(freshDelete, btnDeleteCustomer);
    freshDelete.addEventListener('click', async () => {
      const custName = customer.name;
      if (!await showConfirmDialog(`Permanently delete "${custName}"? This will also remove all their purchase history links. This cannot be undone.`, 'Delete Customer')) return;
      // Remove customer
      state.customers = state.customers.filter(c => c.id !== id);
      // Unlink their transactions (don't delete, just remove customer reference)
      state.transactions = state.transactions.map(tx =>
        tx.customerId === id ? { ...tx, customerId: null, reason: (tx.reason || '') + ' [customer deleted]' } : tx
      );
      saveCustomers();
      saveTransactions();
      // Hide detail pane and refresh list
      document.querySelector('.customer-details-placeholder').style.display = '';
      document.querySelector('.customer-details-content').style.display = 'none';
      renderCRM();
    });
  }


  const tbody = document.getElementById('customer-purchase-table-body');
  const custTx = state.transactions
    .filter(tx => tx.customerId === id && tx.type === 'OUT')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (custTx.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No purchases logged yet.</td></tr>`;
  } else {
    tbody.innerHTML = custTx.map(tx => {
      const prod = state.products.find(p => p.id === tx.productId);
      return `
        <tr>
          <td data-label="Date" class="text-muted">${new Date(tx.timestamp).toLocaleDateString()}</td>
          <td data-label="Item Purchased">${prod ? prod.name : 'Unknown Product'}</td>
          <td data-label="Qty" class="text-center font-medium">${tx.quantity}</td>
          <td data-label="Paid" class="text-right font-bold text-success">${formatCurrency(tx.quantity * tx.unitPrice)}</td>
        </tr>
      `;
    }).join('');
  }
}


// Global View Switcher
function showView(viewName) {
  // Security Redirect: If Manager tries to access restricted Cash Flow screen, force redirect to Dashboard
  if (viewName === 'cashflow' && state.currentRole === 'Manager') {
    viewName = 'dashboard';
  }

  document.querySelectorAll('.content-view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  // Update headers
  const title = document.getElementById('current-view-title');
  const subtitle = document.getElementById('current-view-subtitle');

  if (viewName === 'dashboard') {
    title.innerText = 'Dashboard';
    subtitle.innerText = 'Real-time business summary & analytics';
    renderDashboard();
  } else if (viewName === 'inventory') {
    title.innerText = 'Inventory Catalog';
    subtitle.innerText = 'Aurora Scents fragrance collection & pricing';
    renderProducts();
  } else if (viewName === 'transactions') {
    title.innerText = 'Stock Movements';
    subtitle.innerText = 'Audit log of all stock inputs and sales output logs';
    renderTransactions();
  } else if (viewName === 'cashflow') {
    title.innerText = 'Cash Flow & Expenditures';
    subtitle.innerText = 'Analyze daily operational expenses and net cash velocity';
    renderCashFlow();
  } else if (viewName === 'crm') {
    title.innerText = 'Customer Relationship Management';
    subtitle.innerText = 'Manage customer profiles and analyze lifetime value';
    renderCRM();
  } else if (viewName === 'help') {
    title.innerText = 'Help Center';
    subtitle.innerText = 'System documentation, access guidelines, and user manual';
  } else if (viewName === 'settings') {
    title.innerText = 'Settings';
    subtitle.innerText = 'System configuration, data seed diagnostics, and roles';
    renderSettings();
  }
}

// Role Management Switcher
function switchRole(role) {
  state.currentRole = role;
  localStorage.setItem('aurora_current_role', role);

  const headerAvatar = document.getElementById('header-avatar-initials');
  const headerLabel = document.getElementById('header-role-label');
  const navCashflow = document.getElementById('nav-cashflow');

  if (role === 'Admin') {
    headerAvatar.innerText = 'AD';
    headerLabel.innerText = 'Administrator';
    navCashflow.style.display = 'flex';
  } else if (role === 'CEO') {
    headerAvatar.innerText = 'CE';
    headerLabel.innerText = 'Chief Executive Officer';
    navCashflow.style.display = 'flex';
  } else if (role === 'Manager') {
    headerAvatar.innerText = 'MA';
    headerLabel.innerText = 'Store Manager';
    navCashflow.style.display = 'none';
  }

  // Toggle target prediction edit pencil button
  const editTargetBtn = document.getElementById('btn-edit-target');
  if (editTargetBtn) {
    if (role === 'Admin' || role === 'CEO') {
      editTargetBtn.style.display = 'inline-block';
    } else {
      editTargetBtn.style.display = 'none';
    }
  }

  // Redirect to dashboard if currently in cashflow and switching to Manager
  const activeNavBtn = document.querySelector('.nav-item.active');
  const activeViewName = activeNavBtn ? activeNavBtn.getAttribute('data-view') : 'dashboard';
  
  showView(activeViewName);
}

// Render Settings View
function renderSettings() {
  const roleTitle = document.getElementById('settings-role-title');
  if (roleTitle) {
    if (state.currentRole === 'Admin') {
      roleTitle.innerText = 'Administrator Profile';
    } else if (state.currentRole === 'CEO') {
      roleTitle.innerText = 'CEO Profile';
    } else if (state.currentRole === 'Manager') {
      roleTitle.innerText = 'Store Manager Profile';
    }
  }

  const settingsTargetGroup = document.getElementById('settings-target-group');
  if (settingsTargetGroup) {
    if (state.currentRole === 'Admin' || state.currentRole === 'CEO') {
      settingsTargetGroup.style.display = 'flex';
      const targetInput = document.getElementById('settings-target-input');
      if (targetInput) {
        targetInput.value = state.targetAmount;
      }
    } else {
      settingsTargetGroup.style.display = 'none';
    }
  }

  // Populate Security Settings inputs
  populateSecuritySettings();

  // Populate Cloud Database Status
  const projectDisplay = document.getElementById('settings-project-id');
  if (projectDisplay) {
    if (isFirebaseInitialized) {
      projectDisplay.innerText = `Project ID: ${activeConfig.projectId}`;
    } else {
      projectDisplay.innerText = "Project ID: Local Storage Mode";
    }
  }
  
  const cloudBadge = document.getElementById('settings-cloud-badge');
  if (cloudBadge) {
    if (isFirebaseInitialized) {
      cloudBadge.innerText = "Active";
      cloudBadge.className = "badge-pill instock";
    } else {
      cloudBadge.innerText = "Offline";
      cloudBadge.className = "badge-pill outofstock";
    }
  }
}

// Calculate dynamic alerts
function getSystemAlerts() {
  const alerts = [];
  const isManager = state.currentRole === 'Manager';
  
  // 1. Low Stock Alerts (all roles see these)
  state.products.forEach(p => {
    const stock = getProductStock(p.id);
    if (stock < p.minStockThreshold) {
      alerts.push({
        id: `low-stock-${p.id}`,
        type: 'warning',
        icon: ICONS.alert,
        title: 'Low Stock Alert',
        desc: `${p.name} has only ${stock} units left (threshold: ${p.minStockThreshold}).`,
        actionView: 'inventory'
      });
    }
  });

  // 2. Cash Flow warnings — Admin/CEO only
  if (!isManager) {
    const kpis = calculateKPIs();
    let totalRestockCost = 0;
    state.transactions.forEach(tx => {
      if (tx.type === 'IN') {
        totalRestockCost += tx.quantity * tx.unitPrice;
      }
    });
    const totalOpsExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = kpis.totalRevenue - (totalRestockCost + totalOpsExpenses);
    if (balance < 0) {
      alerts.push({
        id: 'cash-flow-negative',
        type: 'danger',
        icon: ICONS.alert,
        title: 'Negative Cash Flow',
        desc: `Expenses exceed revenue by ${formatCurrency(Math.abs(balance))}.`,
        actionView: 'cashflow'
      });
    }

    // 3. Profit target prediction — Admin/CEO only
    const progressPercent = state.targetAmount > 0 ? (kpis.netProfit / state.targetAmount) * 100 : 0;
    if (progressPercent < 50) {
      alerts.push({
        id: 'target-progress-info',
        type: 'info',
        icon: ICONS.target,
        title: 'Target Status',
        desc: `Net profit is at ${progressPercent.toFixed(1)}% of the ${formatCurrency(state.targetAmount)} target.`,
        actionView: 'dashboard'
      });
    } else if (progressPercent >= 100) {
      alerts.push({
        id: 'target-achieved-success',
        type: 'success',
        icon: ICONS.checkCircle,
        title: 'Target Achieved!',
        desc: `Congratulations! Net profit has exceeded the annual target of ${formatCurrency(state.targetAmount)}.`,
        actionView: 'dashboard'
      });
    }
  }

  return alerts;
}

// Render dynamic alerts popover
function renderNotifications() {
  const allAlerts = getSystemAlerts();
  const alerts = allAlerts.filter(a => !dismissedAlerts.includes(a.id));
  const alertBadge = document.getElementById('alert-badge');
  const popoverBody = document.getElementById('notification-list-body');
  
  if (alertBadge) {
    if (alerts.length > 0) {
      alertBadge.style.display = 'flex';
      alertBadge.innerText = alerts.length;
    } else {
      alertBadge.style.display = 'none';
    }
  }
  
  if (popoverBody) {
    if (alerts.length > 0) {
      popoverBody.innerHTML = alerts.map(alert => `
        <div class="notification-item" data-view="${alert.actionView}">
          <span class="notif-icon">${alert.icon}</span>
          <div class="notif-content">
            <div class="notif-title">${alert.title}</div>
            <div class="notif-desc">${alert.desc}</div>
          </div>
        </div>
      `).join('');
      
      popoverBody.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const view = e.currentTarget.getAttribute('data-view');
          showView(view);
          const popover = document.getElementById('notification-popover');
          if (popover) popover.classList.remove('active');
        });
      });
    } else {
      popoverBody.innerHTML = `<div class="no-notifications">No urgent alerts. System status is normal.</div>`;
    }
  }
}

// ==========================================
// 5. MODAL FORM OPEN/CLOSE CONTROLS
// ==========================================

const backdrop = document.getElementById('modal-backdrop');

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  backdrop.classList.remove('active');
}

function openModal(modalId) {
  document.querySelectorAll('.modal-dialog').forEach(m => m.classList.remove('active'));
  document.getElementById(modalId).classList.add('active');
  backdrop.classList.add('active');
}

// Product Form Modal setup
function openProductModal(productId = null) {
  const modal = document.getElementById('modal-product-form');
  const title = document.getElementById('product-form-title');
  const form = document.getElementById('product-form');
  
  form.reset();

  if (productId) {
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;
    title.innerText = 'Edit Perfume';
    document.getElementById('form-product-id').value = prod.id;
    document.getElementById('form-product-name').value = prod.name;
    document.getElementById('form-product-sku').value = prod.sku;
    document.getElementById('form-product-category').value = prod.category;
    document.getElementById('form-product-threshold').value = prod.minStockThreshold;
    document.getElementById('form-product-cost').value = prod.costPrice;
    document.getElementById('form-product-retail').value = prod.sellingPrice;
  } else {
    title.innerText = 'Add New Perfume';
    document.getElementById('form-product-id').value = '';
  }

  openModal('modal-product-form');
}

// Helper: Build a single favourite perfume select row
function buildFavPerfumeRow(selectedValue = '') {
  const productOptions = state.products.map(p =>
    `<option value="${p.name}" ${p.name === selectedValue ? 'selected' : ''}>${p.name}</option>`
  ).join('');
  const row = document.createElement('div');
  row.className = 'fav-perfume-row';
  row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;margin-bottom:0.4rem;';
  row.innerHTML = `
    <select class="fav-perfume-select" style="flex:1;">
      <option value="">-- None / Auto --</option>
      ${productOptions}
    </select>
    <button type="button" class="btn-remove-fav" title="Remove" style="background:none;border:1px solid var(--error,#e74c3c);color:var(--error,#e74c3c);border-radius:6px;padding:0.2rem 0.5rem;cursor:pointer;font-size:0.9rem;line-height:1;">✕</button>
  `;
  row.querySelector('.btn-remove-fav').addEventListener('click', () => {
    if (document.querySelectorAll('.fav-perfume-row').length > 1) {
      row.remove();
    } else {
      row.querySelector('.fav-perfume-select').value = '';
    }
  });
  return row;
}

// Customer Form Modal Setup
function openCustomerModal(customerId = null) {
  const title = document.getElementById('customer-form-title');
  const form = document.getElementById('customer-form');
  const favList = document.getElementById('fav-perfumes-list');

  form.reset();
  if (favList) favList.innerHTML = '';

  if (customerId) {
    const cust = state.customers.find(c => c.id === customerId);
    if (!cust) return;
    title.innerText = 'Edit Customer Details';
    document.getElementById('form-cust-id').value = cust.id;
    document.getElementById('form-cust-name').value = cust.name;
    document.getElementById('form-cust-phone').value = cust.phone;
    document.getElementById('form-cust-email').value = cust.email || '';
    // Load saved favourites array (support legacy string)
    const savedFavs = cust.favoritePerfumes && cust.favoritePerfumes.length > 0
      ? cust.favoritePerfumes
      : (cust.favoritePerfume ? [cust.favoritePerfume] : ['']);
    savedFavs.forEach(val => {
      if (favList) favList.appendChild(buildFavPerfumeRow(val));
    });
  } else {
    title.innerText = 'Add CRM Customer';
    document.getElementById('form-cust-id').value = '';
    if (favList) favList.appendChild(buildFavPerfumeRow());
  }

  // Wire up the + Add button
  const addBtn = document.getElementById('btn-add-fav-perfume');
  if (addBtn) {
    addBtn.onclick = () => {
      const rows = document.querySelectorAll('.fav-perfume-row');
      if (rows.length < 3) {
        if (favList) favList.appendChild(buildFavPerfumeRow());
      } else {
        addBtn.disabled = true;
        addBtn.title = 'Maximum 3 preferences';
      }
    };
  }

  openModal('modal-customer-form');
}

// Transaction Modal setup (IN = Restock, OUT = Sale)
function openTransactionModal(type, preSelectedProdId = null) {
  const modalTitle = document.getElementById('tx-form-title');
  const submitBtn = document.getElementById('btn-submit-tx');
  const priceLabel = document.getElementById('label-tx-price');
  const customerGroup = document.getElementById('form-tx-customer-group');
  const prodSelect = document.getElementById('form-tx-product');
  const custSelect = document.getElementById('form-tx-customer');
  
  document.getElementById('tx-form').reset();
  document.getElementById('form-tx-type').value = type;

  prodSelect.innerHTML = state.products.map(p => `
    <option value="${p.id}">${p.name} (${p.sku})</option>
  `).join('');

  if (preSelectedProdId) {
    prodSelect.value = preSelectedProdId;
  }

  // Populate existing customers dropdown
  const custSelectEl = document.getElementById('form-tx-customer-select');
  if (custSelectEl) {
    custSelectEl.innerHTML = `
      <option value="">-- Select a customer --</option>
      ${state.customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('')}
    `;
  }

  // Reset mode to Guest
  const hiddenCustInput = document.getElementById('form-tx-customer');
  if (hiddenCustInput) hiddenCustInput.value = '';

  // Wire up mode toggle buttons
  const modeBtns = document.querySelectorAll('.cust-mode-btn');
  const panels = {
    guest: document.getElementById('cust-panel-guest'),
    existing: document.getElementById('cust-panel-existing'),
    new: document.getElementById('cust-panel-new')
  };

  function activateMode(mode) {
    modeBtns.forEach(b => {
      const isActive = b.dataset.mode === mode;
      b.style.background = isActive ? 'var(--primary)' : 'transparent';
      b.style.color = isActive ? '#fff' : 'var(--text-secondary)';
      b.style.borderColor = isActive ? 'var(--primary)' : 'var(--border-color)';
    });
    Object.entries(panels).forEach(([key, el]) => {
      if (el) el.style.display = key === mode ? 'block' : 'none';
    });
    // Sync hidden customer input when switching to guest/existing
    if (mode === 'guest' && hiddenCustInput) hiddenCustInput.value = '';
    if (mode === 'existing' && custSelectEl && hiddenCustInput) {
      hiddenCustInput.value = custSelectEl.value;
      custSelectEl.onchange = () => { hiddenCustInput.value = custSelectEl.value; };
    }
  }

  modeBtns.forEach(btn => {
    btn.onclick = () => activateMode(btn.dataset.mode);
  });

  // Start on Guest
  activateMode('guest');
  // Clear new customer fields
  ['form-tx-new-cust-name','form-tx-new-cust-phone','form-tx-new-cust-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  if (type === 'IN') {
    modalTitle.innerText = 'Stock In (Restock)';
    submitBtn.innerText = 'Add to Inventory';
    submitBtn.className = 'btn btn-primary';
    priceLabel.innerText = 'Unit Wholesale Cost (TZSH) *';
    customerGroup.style.display = 'none';
    
    const updateCostPrice = () => {
      const p = state.products.find(prod => prod.id === prodSelect.value);
      if (p) {
        document.getElementById('form-tx-price').value = p.costPrice;
        document.getElementById('form-tx-price-helper').innerText = `Base Wholesale Cost: ${formatCurrency(p.costPrice)}`;
      }
    };
    prodSelect.onchange = updateCostPrice;
    updateCostPrice();
  } else {
    modalTitle.innerText = 'Stock Out (Record Sale)';
    submitBtn.innerText = 'Complete Sale';
    submitBtn.className = 'btn btn-primary';
    priceLabel.innerText = 'Unit Retail Sell Price (TZSH) *';
    customerGroup.style.display = 'block';

    const updateSellPrice = () => {
      const p = state.products.find(prod => prod.id === prodSelect.value);
      if (p) {
        document.getElementById('form-tx-price').value = p.sellingPrice;
        document.getElementById('form-tx-price-helper').innerText = `Base Retail Price: ${formatCurrency(p.sellingPrice)}`;
      }
    };
    prodSelect.onchange = updateSellPrice;
    updateSellPrice();
  }

  openModal('modal-transaction-form');
}

// Open Target prediction detail forecast analysis modal
function openTargetDetailsModal() {
  const kpis = calculateKPIs();
  const targetMax = state.targetAmount;
  const progressPercent = targetMax > 0 ? Math.min(100, Math.max(0, (kpis.netProfit / targetMax) * 100)) : 0;
  const remaining = Math.max(0, targetMax - kpis.netProfit);

  const targetMaxLabel = document.getElementById('target-modal-max-label');
  if (targetMaxLabel) {
    targetMaxLabel.innerText = `Target: ${formatCurrency(targetMax)}`;
  }

  // 1. Set text metrics
  document.getElementById('target-modal-profit').innerText = formatCurrency(kpis.netProfit);
  document.getElementById('target-modal-bar').style.width = `${progressPercent}%`;
  document.getElementById('target-modal-pct-label').innerText = `${progressPercent.toFixed(1)}% Completed`;
  document.getElementById('target-modal-needed').innerText = formatCurrency(remaining);

  // 2. Calculate average product sales margin & target bottles needed
  let totalMargin = 0;
  let totalSoldQuantity = 0;

  state.transactions.forEach(tx => {
    if (tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
      const p = state.products.find(prod => prod.id === tx.productId);
      if (p) {
        totalMargin += tx.quantity * (tx.unitPrice - p.costPrice);
        totalSoldQuantity += tx.quantity;
      }
    }
  });

  const avgMarginPerUnit = totalSoldQuantity > 0 ? (totalMargin / totalSoldQuantity) : 100000; // default margin
  const bottlesNeeded = avgMarginPerUnit > 0 ? Math.ceil(remaining / avgMarginPerUnit) : 0;

  document.getElementById('target-modal-avg-margin').innerText = formatCurrency(avgMarginPerUnit);
  document.getElementById('target-modal-bottles').innerText = `${bottlesNeeded.toLocaleString()} Fragrance Bottles`;

  // 3. Render categories contribution table
  const tbody = document.getElementById('target-modal-contribution-body');
  const collections = ['Signature', 'Elite', 'Deciduous', 'Standard'];
  
  const categoriesStats = collections.map(col => {
    let sold = 0;
    let profit = 0;
    state.transactions.forEach(tx => {
      if (tx.type === 'OUT' && (tx.reason || '').toLowerCase().includes('sale')) {
        const p = state.products.find(prod => prod.id === tx.productId);
        if (p && p.category === col) {
          sold += tx.quantity;
          profit += tx.quantity * (tx.unitPrice - p.costPrice);
        }
      }
    });
    return { name: col, sold, profit };
  });

  const totalSalesProfit = categoriesStats.reduce((sum, c) => sum + c.profit, 0);

  tbody.innerHTML = categoriesStats.map(stat => {
    const share = totalSalesProfit > 0 ? (stat.profit / totalSalesProfit) * 100 : 0;
    return `
      <tr>
        <td data-label="Collection"><strong>${stat.name} Collection</strong></td>
        <td data-label="Units Sold" class="text-right font-medium">${stat.sold} units</td>
        <td data-label="Total Profit Share" class="text-right font-bold text-success">${formatCurrency(stat.profit)}</td>
        <td data-label="Share %" class="text-right font-bold">${share.toFixed(1)}%</td>
      </tr>
    `;
  }).join('');

  openModal('modal-target-details');
}

// ==========================================
// 6. EVENT BINDING & HANDLERS
// ==========================================

let editingExpenseId = null;

function editExpense(id) {
  const exp = state.expenses.find(e => e.id === id);
  if (!exp) return;

  editingExpenseId = id;
  
  // Populate the form fields
  document.getElementById('form-exp-category').value = exp.category;
  document.getElementById('form-exp-amount').value = exp.amount;
  document.getElementById('form-exp-desc').value = exp.description;
  
  // Format the date to YYYY-MM-DD for the date input
  const expDate = new Date(exp.date);
  const formattedDate = expDate.toISOString().split('T')[0];
  document.getElementById('form-exp-date').value = formattedDate;

  // Change submit button text
  const submitBtn = document.getElementById('btn-expense-submit');
  if (submitBtn) {
    submitBtn.innerText = 'Save Changes';
    submitBtn.className = 'btn btn-primary btn-block';
  }

  // Show cancel button
  const cancelBtn = document.getElementById('btn-expense-cancel');
  if (cancelBtn) {
    cancelBtn.style.display = 'block';
  }
}

function cancelExpenseEdit() {
  editingExpenseId = null;
  document.getElementById('expense-log-form').reset();
  
  // Reset submit button text
  const submitBtn = document.getElementById('btn-expense-submit');
  if (submitBtn) {
    submitBtn.innerText = '+ Log Operational Expense';
  }

  // Hide cancel button
  const cancelBtn = document.getElementById('btn-expense-cancel');
  if (cancelBtn) {
    cancelBtn.style.display = 'none';
  }
}

async function deleteExpense(id) {
  if (await showConfirmDialog('Are you sure you want to delete this expense?', 'Delete Expense')) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveExpenses();
    renderCashFlow();
  }
}

// Expose to window so onclick handlers can call them
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.cancelExpenseEdit = cancelExpenseEdit;

function setupEventListeners() {
  // Helper for safe element listener bindings
  const safeAddListener = (id, event, callback) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener(event, callback);
    }
  };

  // Sidebar Navigation Click handlers
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.getAttribute('data-view');
      showView(view);

      // Close mobile sidebar if open
      const sidebar = document.querySelector('.sidebar');
      const sidebarBackdrop = document.getElementById('sidebar-backdrop');
      if (sidebar && sidebarBackdrop) {
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('active');
      }
    });
  });



  // Bestsellers category tabs clicks
  const tabsContainer = document.getElementById('bestseller-tabs-container');
  if (tabsContainer) {
    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        renderBestsellers();
      });
    });
  }

  // Bestseller period select
  safeAddListener('bestseller-period', 'change', () => {
    renderBestsellers();
  });

  // Bar chart period change
  safeAddListener('bar-chart-period', 'change', () => {
    const el = document.getElementById('bar-chart-period');
    const barPeriod = el ? el.value : 'monthly';
    renderStackedBarChart(barPeriod);
  });

  // Floating Quick Action Modals
  safeAddListener('btn-quick-action', 'click', () => {
    openModal('modal-quick-action');
  });

  // Target Details button trigger
  safeAddListener('btn-see-more-stats', 'click', () => {
    openTargetDetailsModal();
  });

  // Modal Closures
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      document.querySelectorAll('.modal-dialog').forEach(m => m.classList.remove('active'));
      backdrop.classList.remove('active');
    });
  }
  
  safeAddListener('close-quick-action', 'click', () => closeModal('modal-quick-action'));
  safeAddListener('close-product-form', 'click', () => closeModal('modal-product-form'));
  safeAddListener('close-tx-form', 'click', () => closeModal('modal-transaction-form'));
  safeAddListener('close-customer-form', 'click', () => closeModal('modal-customer-form'));
  safeAddListener('close-expense-modal', 'click', () => closeModal('modal-expense-form'));
  safeAddListener('close-target-modal', 'click', () => closeModal('modal-target-details'));
  safeAddListener('btn-close-target-modal', 'click', () => closeModal('modal-target-details'));
  
  // Target Edit Modal cancellations
  safeAddListener('close-edit-target-modal', 'click', () => closeModal('modal-edit-target'));
  safeAddListener('btn-cancel-edit-target', 'click', () => closeModal('modal-edit-target'));

  safeAddListener('btn-cancel-product', 'click', () => closeModal('modal-product-form'));
  safeAddListener('btn-cancel-tx', 'click', () => closeModal('modal-transaction-form'));
  safeAddListener('btn-cancel-customer', 'click', () => closeModal('modal-customer-form'));
  safeAddListener('btn-cancel-exp-modal', 'click', () => closeModal('modal-expense-form'));

  // Quick Action Sub-buttons
  safeAddListener('qa-log-sale', 'click', () => openTransactionModal('OUT'));
  safeAddListener('qa-log-restock', 'click', () => openTransactionModal('IN'));
  safeAddListener('qa-log-expense', 'click', () => openModal('modal-expense-form'));
  safeAddListener('qa-add-product', 'click', () => openProductModal());
  
  // Safe check for qa-add-customer
  const qaAddCustomerBtn = document.getElementById('qa-add-customer');
  if (qaAddCustomerBtn) {
    qaAddCustomerBtn.addEventListener('click', () => openCustomerModal());
  }
  
  safeAddListener('btn-add-product', 'click', () => openProductModal());
  safeAddListener('btn-add-customer', 'click', () => openCustomerModal());

  // Edit customer profile click
  const btnEditCustomer = document.getElementById('btn-edit-customer');
  if (btnEditCustomer) {
    btnEditCustomer.addEventListener('click', () => {
      const selected = document.querySelector('.customer-card.selected');
      if (selected) {
        const id = selected.getAttribute('data-id');
        openCustomerModal(id);
      } else {
        showToast('Please select a customer first.', 'warning');
      }
    });
  }

  // Edit target amount pencil click
  const btnEditTarget = document.getElementById('btn-edit-target');
  if (btnEditTarget) {
    btnEditTarget.addEventListener('click', (e) => {
      e.stopPropagation();
      const el = document.getElementById('form-target-value');
      if (el) el.value = state.targetAmount;
      openModal('modal-edit-target');
    });
  }

  // Save target submit
  const editTargetForm = document.getElementById('edit-target-form');
  if (editTargetForm) {
    editTargetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const el = document.getElementById('form-target-value');
      const newTarget = el ? parseFloat(el.value) : 0;
      if (newTarget > 0) {
        state.targetAmount = newTarget;
        localStorage.setItem('aurora_target_amount', newTarget.toString());
        closeModal('modal-edit-target');
        renderDashboard();
      }
    });
  }

  // Save target settings click (on Settings Page)
  const btnSaveTargetSettings = document.getElementById('btn-save-target-settings');
  if (btnSaveTargetSettings) {
    btnSaveTargetSettings.addEventListener('click', () => {
      const el = document.getElementById('settings-target-input');
      const inputVal = el ? parseFloat(el.value) : 0;
      if (inputVal > 0) {
        state.targetAmount = inputVal;
        localStorage.setItem('aurora_target_amount', inputVal.toString());
        showToast('Target amount successfully updated and saved!', 'success');
        renderDashboard();
      } else {
        showToast('Please enter a valid target amount.', 'warning');
      }
    });
  }

  // Notifications click toggle
  const btnNotifications = document.getElementById('btn-notifications');
  const popover = document.getElementById('notification-popover');
  if (btnNotifications && popover) {
    btnNotifications.addEventListener('click', (e) => {
      e.stopPropagation();
      popover.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && e.target !== btnNotifications) {
        popover.classList.remove('active');
      }
    });
  }

  // Dismiss alerts
  const btnDismissAlerts = document.getElementById('btn-dismiss-alerts');
  if (btnDismissAlerts) {
    btnDismissAlerts.addEventListener('click', (e) => {
      e.stopPropagation();
      const allAlerts = getSystemAlerts();
      allAlerts.forEach(alert => {
        if (!dismissedAlerts.includes(alert.id)) {
          dismissedAlerts.push(alert.id);
        }
      });
      localStorage.setItem('aurora_dismissed_alerts', JSON.stringify(dismissedAlerts));
      renderNotifications();
    });
  }

  // Settings Database Reset button
  const btnResetDbSettings = document.getElementById('btn-reset-db-settings');
  if (btnResetDbSettings) {
    btnResetDbSettings.addEventListener('click', async () => {
      if (await showConfirmDialog('Reset the database to seed defaults? This clears all sales, custom products, CRM customers, and logged expenses.', 'Reset Database')) {
        localStorage.removeItem('aurora_products');
        localStorage.removeItem('aurora_transactions');
        localStorage.removeItem('aurora_customers');
        localStorage.removeItem('aurora_expenses');
        localStorage.removeItem('aurora_target_amount');
        localStorage.removeItem('aurora_current_role');
        localStorage.removeItem('aurora_dismissed_alerts');
        location.reload();
      }
    });
  }

  // Clear History
  safeAddListener('btn-clear-tx-history', 'click', async () => {
    if (await showConfirmDialog('Clear all transaction history? Stock counts will reset to zero.', 'Clear History')) {
      state.transactions = [];
      saveTransactions();
      showView('transactions');
    }
  });

  // Toolbar Searches & Filters
  safeAddListener('inventory-search', 'input', () => {
    state.productsCurrentPage = 1;
    renderProducts();
  });
  safeAddListener('filter-stock-status', 'change', () => {
    state.productsCurrentPage = 1;
    renderProducts();
  });
  safeAddListener('filter-category', 'change', () => {
    state.productsCurrentPage = 1;
    renderProducts();
  });
  
  safeAddListener('tx-search', 'input', () => {
    state.transactionsCurrentPage = 1;
    renderTransactions();
  });
  safeAddListener('filter-tx-type', 'change', () => {
    state.transactionsCurrentPage = 1;
    renderTransactions();
  });

  // Movements pagination click listeners
  const txPaginationContainer = document.getElementById('transactions-pagination-container');
  if (txPaginationContainer) {
    txPaginationContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.page-btn');
      if (!btn) return;
      
      const filteredLength = state.transactions.length; // Approximates total page bounds safely
      const totalPages = Math.ceil(filteredLength / state.transactionsItemsPerPage);

      if (btn.classList.contains('arrow-prev')) {
        state.transactionsCurrentPage = Math.max(1, state.transactionsCurrentPage - 1);
      } else if (btn.classList.contains('arrow-next')) {
        state.transactionsCurrentPage = Math.min(totalPages, state.transactionsCurrentPage + 1);
      } else {
        const page = parseInt(btn.getAttribute('data-page'));
        state.transactionsCurrentPage = page;
      }
      renderTransactions();
    });
  }
  
  document.getElementById('crm-search').addEventListener('input', () => renderCRM());

  // Form Submissions
  
  // 1. Save / Edit Product
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('form-product-id').value;
      const name = document.getElementById('form-product-name').value;
      const category = document.getElementById('form-product-category').value;
      const skuVal = document.getElementById('form-product-sku').value;
      const threshold = parseInt(document.getElementById('form-product-threshold').value);
      const cost = parseFloat(document.getElementById('form-product-cost').value);
      const retail = parseFloat(document.getElementById('form-product-retail').value);

      const sku = skuVal.trim() || generateSKU(name, category);

      if (id) {
        const idx = state.products.findIndex(p => p.id === id);
        if (idx !== -1) {
          state.products[idx] = { ...state.products[idx], name, category, sku, minStockThreshold: threshold, costPrice: cost, sellingPrice: retail };
        }
      } else {
        state.products.push({
          id: `prod-${uuid()}`,
          sku,
          name,
          category,
          costPrice: cost,
          sellingPrice: retail,
          minStockThreshold: threshold
        });
      }

      saveProducts();
      closeModal('modal-product-form');
      
      const activeNav = document.querySelector('.nav-item.active').getAttribute('data-view');
      showView(activeNav);
    });
  }

  // 2. Submit Transaction (Sale / Restock)
  const txForm = document.getElementById('tx-form');
  if (txForm) {
    txForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('form-tx-type').value;
      const prodId = document.getElementById('form-tx-product').value;
      const qty = parseInt(document.getElementById('form-tx-quantity').value);
      const price = parseFloat(document.getElementById('form-tx-price').value);
      // Determine which customer mode is active
      const activeMode = (() => {
        const btn = document.querySelector('.cust-mode-btn.active') ||
                    [...document.querySelectorAll('.cust-mode-btn')].find(b => b.style.background.includes('var(--primary)') || b.style.background === 'rgb(249, 115, 22)');
        return btn ? btn.dataset.mode : 'guest';
      })();

      let customerId = null;

      if (activeMode === 'existing') {
        customerId = document.getElementById('form-tx-customer').value || null;
      } else if (activeMode === 'new') {
        const newName = (document.getElementById('form-tx-new-cust-name')?.value || '').trim();
        const newPhone = (document.getElementById('form-tx-new-cust-phone')?.value || '').trim();
        const newEmail = (document.getElementById('form-tx-new-cust-email')?.value || '').trim();

        if (!newName) {
          showToast('Please enter the customer name.', 'warning');
          return;
        }
        if (!isValidPhone(newPhone)) {
          showToast('Please enter a valid phone number for the new customer.', 'warning');
          return;
        }

        // Create and save the new customer immediately
        const newId = `cust-${uuid()}`;
        state.customers.push({
          id: newId,
          name: newName,
          phone: newPhone,
          email: newEmail || null,
          favoritePerfumes: null,
          favoritePerfume: null,
          createdAt: new Date().toISOString()
        });
        saveCustomers();
        customerId = newId;
        showToast(`✓ New customer "${newName}" saved to CRM.`, 'success');
      }
      // guest mode → customerId stays null
      const notes = document.getElementById('form-tx-notes').value.trim();

      if (type === 'OUT') {
        const currentStock = getProductStock(prodId);
        if (qty > currentStock) {
          showToast(`Insufficient Stock! Only ${currentStock} units on hand. Cannot sell ${qty} units.`, 'error');
          return;
        }
      }

      const defaultNotes = type === 'IN' ? 'Supplier Restock' : 'Retail Sale';
      const prod = state.products.find(p => p.id === prodId);
      
      state.transactions.push({
        id: `tx-${uuid()}`,
        productId: prodId,
        type,
        quantity: qty,
        unitPrice: price,
        costPrice: type === 'OUT' && prod ? prod.costPrice : undefined,
        reason: notes || defaultNotes,
        customerId: customerId || null,
        timestamp: new Date().toISOString()
      });

      saveTransactions();
      closeModal('modal-transaction-form');
      closeModal('modal-quick-action');

      const activeNav = document.querySelector('.nav-item.active').getAttribute('data-view');
      showView(activeNav);
    });
  }

  // 3. Save CRM Customer
  const customerForm = document.getElementById('customer-form');
  if (customerForm) {
    customerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('form-cust-id').value;
      const name = document.getElementById('form-cust-name').value.trim();
      const phone = document.getElementById('form-cust-phone').value.trim();
      const email = document.getElementById('form-cust-email').value.trim();

      if (!isValidPhone(phone)) {
        showToast('Please enter a valid phone number (at least 7 digits).', 'warning');
        return;
      }
      // Collect all favourite perfume selects
      const favSelects = document.querySelectorAll('.fav-perfume-select');
      const favoritePerfumes = Array.from(favSelects)
        .map(s => s.value.trim())
        .filter(Boolean);

      let targetId = id;

      if (id) {
        const idx = state.customers.findIndex(c => c.id === id);
        if (idx !== -1) {
          state.customers[idx] = {
            ...state.customers[idx],
            name,
            phone,
            email: email || null,
            favoritePerfumes: favoritePerfumes.length > 0 ? favoritePerfumes : null,
            favoritePerfume: null // clear legacy field
          };
        }
      } else {
        const newId = `cust-${uuid()}`;
        targetId = newId;
        state.customers.push({
          id: newId,
          name,
          phone,
          email: email || null,
          favoritePerfumes: favoritePerfumes.length > 0 ? favoritePerfumes : null,
          favoritePerfume: null,
          createdAt: new Date().toISOString()
        });
      }

      saveCustomers();
      closeModal('modal-customer-form');
      closeModal('modal-quick-action');

      const activeNav = document.querySelector('.nav-item.active').getAttribute('data-view');
      showView(activeNav);

      if (activeNav === 'crm' && targetId) {
        selectCustomer(targetId);
      }
    });
  }

  // 4. Log Operational Expenses (From split panel page form)
  const expenseLogForm = document.getElementById('expense-log-form');
  if (expenseLogForm) {
    expenseLogForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = document.getElementById('form-exp-category').value;
      const amount = parseFloat(document.getElementById('form-exp-amount').value);
      const desc = document.getElementById('form-exp-desc').value.trim();
      const dateInput = document.getElementById('form-exp-date').value;

      const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

      if (editingExpenseId) {
        // Find and update the existing expense
        const idx = state.expenses.findIndex(exp => exp.id === editingExpenseId);
        if (idx !== -1) {
          state.expenses[idx] = {
            ...state.expenses[idx],
            category,
            amount,
            description: desc,
            date
          };
        }
        editingExpenseId = null;
        
        // Reset submit button text
        const submitBtn = document.getElementById('btn-expense-submit');
        if (submitBtn) {
          submitBtn.innerText = '+ Log Operational Expense';
        }

        // Hide cancel button
        const cancelBtn = document.getElementById('btn-expense-cancel');
        if (cancelBtn) {
          cancelBtn.style.display = 'none';
        }
      } else {
        // Add new expense
        state.expenses.push({
          id: `exp-${uuid()}`,
          category,
          amount,
          description: desc,
          date
        });
      }

      saveExpenses();
      expenseLogForm.reset();
      
      renderCashFlow();
    });
  }

  const cancelExpenseBtn = document.getElementById('btn-expense-cancel');
  if (cancelExpenseBtn) {
    cancelExpenseBtn.addEventListener('click', cancelExpenseEdit);
  }

  // 5. Log Operational Expenses (From Modal popup)
  const expenseModalForm = document.getElementById('expense-modal-form');
  if (expenseModalForm) {
    expenseModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = document.getElementById('form-exp-modal-category').value;
      const amount = parseFloat(document.getElementById('form-exp-modal-amount').value);
      const desc = document.getElementById('form-exp-modal-desc').value.trim();
      const dateInput = document.getElementById('form-exp-modal-date').value;

      const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

      state.expenses.push({
        id: `exp-${uuid()}`,
        category,
        amount,
        description: desc,
        date
      });

      saveExpenses();
      closeModal('modal-expense-form');
      closeModal('modal-quick-action');

      const activeNav = document.querySelector('.nav-item.active').getAttribute('data-view');
      showView(activeNav);
    });
  }

  // Mobile Sidebar Toggle and Backdrop clicks
  const sidebar = document.querySelector('.sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');

  if (btnSidebarToggle && sidebar && sidebarBackdrop) {
    btnSidebarToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarBackdrop.classList.add('active');
    });

    sidebarBackdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarBackdrop.classList.remove('active');
    });
  }

  // CRM Mobile Back Button click
  const btnCrmBack = document.getElementById('btn-crm-back');
  if (btnCrmBack) {
    btnCrmBack.addEventListener('click', () => {
      const splitLayout = document.querySelector('.crm-split-layout');
      if (splitLayout) {
        splitLayout.classList.remove('show-details');
      }
    });
  }

  // Simulated Login Screen listener
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    // Inject a debug log area below the form so errors show on-page
    const debugBox = document.createElement('div');
    debugBox.id = 'login-debug-log';
    debugBox.style.cssText = 'margin-top:1rem;padding:0.75rem;background:#1a1a2e;color:#7fff7f;font-family:monospace;font-size:0.7rem;border-radius:8px;max-height:140px;overflow-y:auto;text-align:left;display:none;';
    loginForm.parentNode.appendChild(debugBox);

    function loginLog(msg, color) {
      debugBox.style.display = 'block';
      const line = document.createElement('div');
      line.style.color = color || '#7fff7f';
      line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
      debugBox.appendChild(line);
      debugBox.scrollTop = debugBox.scrollHeight;
      console.log('[LOGIN DEBUG]', msg);
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const pass = passInput ? passInput.value : '';

      loginLog('Button clicked. Email: ' + email);
      loginLog('Firebase initialized: ' + isFirebaseInitialized);

      if (isFirebaseInitialized) {
        loginLog('Attempting Firebase sign-in...');
        try {
          // Firebase sign-in
          let userCredential;
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, pass);
            loginLog('Auth sign-in SUCCESS ✓');
          } catch (signInError) {
            loginLog('Sign-in error: ' + signInError.code + ' — ' + signInError.message, '#ffaa00');
            // Check if credentials match default credentials
            const creds = getLocalCredentials();
            let role = null;
            if (email === creds.CEO.email && pass === creds.CEO.password) role = 'CEO';
            else if (email === creds.Manager.email && pass === creds.Manager.password) role = 'Manager';
            else if (email === creds.Admin.email && pass === creds.Admin.password) role = 'Admin';

            const isUserNotFoundErr = 
              signInError.code === 'auth/user-not-found' || 
              signInError.code === 'auth/invalid-credential' || 
              signInError.code === 'auth/invalid-login-credentials' ||
              String(signInError.message).toLowerCase().includes('user-not-found') ||
              String(signInError.message).toLowerCase().includes('invalid-credential') ||
              String(signInError.message).toLowerCase().includes('invalid-login-credentials');

            if (role && isUserNotFoundErr) {
              loginLog('Auto-registering seed user in Firebase Auth...');
              userCredential = await createUserWithEmailAndPassword(auth, email, pass);
              loginLog('Auto-register SUCCESS ✓');
            } else {
              loginLog('Throwing sign-in error (not a recoverable user-not-found).', '#ff5555');
              throw signInError;
            }
          }
          const user = userCredential.user;
          
          // Derive role from email as safe fallback
          let role = 'Manager';
          if (email.includes('ceo')) role = 'CEO';
          else if (email.includes('admin')) role = 'Admin';

          loginLog('Auth OK. Reading role from Firestore...');
          // Try to read/write the user role from Firestore (best-effort; won't block login)
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              role = userDoc.data().role;
              loginLog('Role from Firestore: ' + role);
            } else {
              loginLog('No profile doc — seeding with email-derived role: ' + role);
              await setDoc(doc(db, 'users', user.uid), {
                email: email,
                role: role
              });
            }
          } catch (dbError) {
            loginLog('Firestore read BLOCKED: ' + dbError.message + ' — using fallback role: ' + role, '#ffaa00');
            showToast('⚠️ Firestore rules need updating — logged in with default role.', 'warning', 6000);
          }
          
          state.isAuthenticated = true;
          state.currentRole = role;
          
          localStorage.setItem('aurora_authenticated', 'true');
          localStorage.setItem('aurora_current_role', role);

          // ── HIDE LOGIN SCREEN IMMEDIATELY ──────────────────────────────
          // Do this BEFORE any async Firestore calls so a permission hang
          // never blocks the user from reaching the dashboard.
          loginLog('Hiding login screen now...');
          const loginScreen = document.getElementById('login-screen');
          if (loginScreen) loginScreen.classList.add('hidden');

          const roleSelect = document.getElementById('user-role-select');
          if (roleSelect) roleSelect.value = role;

          switchRole(role);
          loginLog('Login complete! Role: ' + role);

          // Reset inputs
          if (emailInput) emailInput.value = '';
          if (passInput) passInput.value = '';

          // ── BACKGROUND SYNC (non-blocking) ─────────────────────────────
          // Run after UI is already showing so any Firestore permission hang
          // doesn't affect the user experience.
          (async () => {
            try {
              await checkAndSeedFirestore();
              initFirestoreSync();
              loginLog('Background sync complete ✓');
            } catch (syncErr) {
              loginLog('Background sync skipped (fix Firestore rules): ' + syncErr.message, '#ffaa00');
            }
          })();
        } catch (error) {
          loginLog('FATAL login error: ' + error.code + ' — ' + error.message, '#ff5555');
          console.error("Firebase Auth Error:", error);
          showToast('Authentication Failed: ' + error.message, 'error');
        }
      } else {
        // Fallback for LocalStorage
        const creds = getLocalCredentials();
        let role = null;
        if (email === creds.CEO.email && pass === creds.CEO.password) {
          role = 'CEO';
        } else if (email === creds.Manager.email && pass === creds.Manager.password) {
          role = 'Manager';
        } else if (email === creds.Admin.email && pass === creds.Admin.password) {
          role = 'Admin';
        }

        if (role) {
          state.isAuthenticated = true;
          state.currentRole = role;
          
          localStorage.setItem('aurora_authenticated', 'true');
          localStorage.setItem('aurora_current_role', role);

          // Hide login overlay
          const loginScreen = document.getElementById('login-screen');
          if (loginScreen) {
            loginScreen.classList.add('hidden');
          }

          switchRole(role);
          
          // Reset inputs
          if (emailInput) emailInput.value = '';
          if (passInput) passInput.value = '';
        } else {
          showToast('Incorrect Email or Password.', 'error');
        }
      }
    });
  }

  // Simulated Logout Button listener
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (isFirebaseInitialized) {
        try {
          await signOut(auth);
        } catch (e) {
          console.error("Firebase Signout Error:", e);
        }
      } else {
        state.isAuthenticated = false;
        localStorage.removeItem('aurora_authenticated');
        
        // Show login overlay
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
          loginScreen.classList.remove('hidden');
        }
      }

      // Close mobile sidebar if open
      if (sidebar && sidebarBackdrop) {
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('active');
      }
    });
  }

  // Firebase Connection Wizard Submit Handler
  const wizardForm = document.getElementById('firebase-wizard-form');
  if (wizardForm) {
    wizardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const textarea = document.getElementById('firebase-config-input');
      const val = textarea.value.trim();
      
      try {
        const startIdx = val.indexOf('{');
        const endIdx = val.lastIndexOf('}');
        if (startIdx === -1 || endIdx === -1) {
          throw new Error("Invalid format. Paste the entire config object including braces { }.");
        }
        
        const objStr = val.substring(startIdx, endIdx + 1);
        const parsedConfig = Function(`"use strict"; return (${objStr});`)();
        
        if (!parsedConfig.apiKey || !parsedConfig.projectId || !parsedConfig.appId) {
          throw new Error("Missing required fields (apiKey, projectId, or appId).");
        }
        
        localStorage.setItem('aurora_firebase_config', JSON.stringify(parsedConfig));
        showToast('Firebase Cloud Database Connected! Reloading...', 'success');
        window.location.reload();
      } catch (err) {
        showToast('Configuration Error: ' + err.message, 'error');
      }
    });
  }

  // Close Wizard Button Click Handler
  const btnCloseWizard = document.getElementById('btn-close-wizard');
  if (btnCloseWizard) {
    btnCloseWizard.addEventListener('click', () => {
      const wizard = document.getElementById('firebase-wizard');
      if (wizard) wizard.classList.add('hidden');
      
      // If the user was not authenticated, show the login screen
      const loginScreen = document.getElementById('login-screen');
      if (loginScreen && !state.isAuthenticated) {
        loginScreen.classList.remove('hidden');
      }
    });
  }

  // Save Settings Credentials Submit Handler
  const btnSaveCreds = document.getElementById('btn-save-credentials');
  if (btnSaveCreds) {
    btnSaveCreds.addEventListener('click', async () => {
      const emailVal = document.getElementById('settings-email-input').value.trim();
      const passVal = document.getElementById('settings-password-input').value;
      
      if (!emailVal || !passVal) {
        showToast('Please enter a valid email and password.', 'warning');
        return;
      }
      
      if (passVal.length < 6) {
        showToast('Password must be at least 6 characters.', 'warning');
        return;
      }
      
      if (isFirebaseInitialized) {
        try {
          const user = auth.currentUser;
          if (user) {
            await updateEmail(user, emailVal);
            await updatePassword(user, passVal);
            
            // Sync user role metadata in Firestore
            await setDoc(doc(db, 'users', user.uid), {
              email: emailVal,
              role: state.currentRole
            }, { merge: true });
            
            showToast('Security credentials updated in Firebase Cloud!', 'success');
          } else {
            showToast('No user is currently signed in to Firebase.', 'warning');
          }
        } catch (e) {
          console.error("Error updating credentials:", e);
          showToast('Failed to update credentials: ' + e.message, 'error');
        }
      } else {
        // Save locally
        const creds = getLocalCredentials();
        creds[state.currentRole] = { email: emailVal, password: passVal };
        localStorage.setItem('aurora_credentials', JSON.stringify(creds));
        showToast('Security credentials updated in local storage!', 'success');
      }
    });
  }

  // Cloud Database Disconnect / Connect Button Handler
  const btnDisconnect = document.getElementById('btn-disconnect-cloud');
  if (btnDisconnect) {
    btnDisconnect.addEventListener('click', async () => {
      if (isFirebaseInitialized) {
        if (await showConfirmDialog('Disconnect from Firebase Cloud Database? The system will revert to local storage mode.', 'Disconnect Cloud')) {
          localStorage.removeItem('aurora_firebase_config');
          showToast('Disconnected from Firebase. Reloading...', 'success');
          window.location.reload();
        }
      } else {
        // Open Connection Wizard modal
        const wizard = document.getElementById('firebase-wizard');
        if (wizard) wizard.classList.remove('hidden');
        
        // Hide login overlay if showing so it doesn't overlap
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('hidden');
      }
    });
  }
}

// ==========================================
// 7. INITIALIZATION
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  initStorage();
  updateConnectionStatusUI();

  if (isFirebaseInitialized) {
    // Firebase Auth State listener
    onAuthStateChanged(auth, async (user) => {
      const loginScreen = document.getElementById('login-screen');
      if (user) {
        // Signed in — derive role from email as safe default
        try {
          const email = user.email || '';
          let role = 'Manager';
          if (email.includes('ceo')) role = 'CEO';
          else if (email.includes('admin')) role = 'Admin';

          // Best-effort: try to read the stored role from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              role = userDoc.data().role;
            } else {
              // Attempt to seed it — silently skip if permissions block it
              try {
                await setDoc(doc(db, 'users', user.uid), { email, role });
              } catch (_) { /* permissions not ready yet */ }
            }
          } catch (dbErr) {
            console.warn('Firestore role read blocked — using email-derived role:', dbErr.message);
          }

          state.isAuthenticated = true;
          state.currentRole = role;
          localStorage.setItem('aurora_authenticated', 'true');
          localStorage.setItem('aurora_current_role', role);

          // Hide login screen immediately — never block on Firestore
          if (loginScreen) loginScreen.classList.add('hidden');
          switchRole(role);

          // Background sync — non-blocking
          (async () => {
            try {
              await checkAndSeedFirestore();
              initFirestoreSync();
            } catch (syncErr) {
              console.warn('Firestore sync skipped (fix rules):', syncErr.message);
            }
          })();
        } catch (fatalErr) {
          console.error('Unexpected error in onAuthStateChanged:', fatalErr);
        }
      } else {
        // Signed out
        state.isAuthenticated = false;
        localStorage.removeItem('aurora_authenticated');
        
        // Clean up listeners on sign out
        cleanupFirestoreSync();
        
        // Only show login overlay if wizard is closed
        const wizard = document.getElementById('firebase-wizard');
        if (wizard && wizard.classList.contains('hidden')) {
          if (loginScreen) loginScreen.classList.remove('hidden');
        }
      }
    });
  } else {
    // Local storage login overlay check
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      if (state.isAuthenticated) {
        loginScreen.classList.add('hidden');
      } else {
        loginScreen.classList.remove('hidden');
      }
    }
  }

  setupEventListeners();
  
  // Update starting views
  switchRole(state.currentRole);
});
