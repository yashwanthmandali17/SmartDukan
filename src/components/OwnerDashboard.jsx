import React, { useState, useEffect } from 'react';
import { languages } from '../languages';
import { Store } from '../store';
import { speakText, stopSpeech } from '../speech';
import { Calendar, UserCheck, UserX, Plus, CreditCard, Volume2, Search, QrCode, AlertTriangle, ShieldCheck, DollarSign, Clock, Users, ArrowUpRight, ArrowDownLeft, Trash2, CheckCircle2, Receipt, Wallet, Tag, ShoppingBag } from 'lucide-react';

export const OwnerDashboard = ({ currentUser, currentLang }) => {
  const t = languages[currentLang] || languages.en;
  const shopId = currentUser.shopId;
  const todayStr = new Date().toISOString().split('T')[0];

  // Active Tab
  const [activeTab, setActiveTab] = useState('attendance'); // attendance, workerKhata, customerKhata, dailyPayments, shopInfo

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const reloadData = () => setRefreshKey(prev => prev + 1);

  // --- ATTENDANCE STATE ---
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerMonthlySalary, setNewWorkerMonthlySalary] = useState('15000');
  const [newWorkerRole, setNewWorkerRole] = useState('Helper');

  // --- WORKER KHATA (GROCERY PURCHASES / SALARY CUTS) STATE ---
  const [showWorkerKhataModal, setShowWorkerKhataModal] = useState(false);
  const [khataWorkerId, setKhataWorkerId] = useState('');
  const [khataItemAmount, setKhataItemAmount] = useState('');
  const [khataItemNote, setKhataItemNote] = useState('');

  // --- CUSTOMER KHATA STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, OVERDUE, PAID
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Credit / Payment Entry Modal
  const [showKhataEntryModal, setShowKhataEntryModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [khataAmount, setKhataAmount] = useState('');
  const [khataType, setKhataType] = useState('DEBIT'); // DEBIT (+ Due) or CREDIT (- Paid)
  const [khataNote, setKhataNote] = useState('');
  const [khataDueDate, setKhataDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  // Selected Customer Ledger Modal
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState(null);

  // --- DAILY PAYMENTS / MERCHANT EXPENSES STATE ---
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMerchantName, setPayMerchantName] = useState('');
  const [payCategory, setPayCategory] = useState('MERCHANT'); // MERCHANT, RENT, BILLS, MISC
  const [payNote, setPayNote] = useState('');

  // Speech Playing state
  const [speakingId, setSpeakingId] = useState(null);

  // Data fetching
  const workers = Store.getWorkers(shopId);
  const attendanceList = Store.getAttendance(shopId);
  const workerKhataList = Store.getWorkerKhata(shopId);
  const customers = Store.getCustomers(shopId);
  const customerDuesList = Store.getCustomerDues(shopId);
  const dailyPaymentsList = Store.getDailyPayments(shopId, paymentDate);

  // Generate 7-day calendar array (strictly past 6 days up to today, NO FUTURE DATES)
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return {
      full: d.toISOString().split('T')[0],
      day: d.toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : currentLang === 'te' ? 'te-IN' : 'en-US', { weekday: 'short' }),
      num: d.getDate()
    };
  });

  // Handle Attendance Absence Toggle
  const handleToggleAbsence = (workerId) => {
    Store.toggleAbsence(shopId, workerId, selectedDate);
    reloadData();
  };

  // Add Worker with Monthly Salary
  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!newWorkerName) return;
    Store.addWorker({
      id: 'w-' + Date.now(),
      shopId,
      name: newWorkerName,
      phone: newWorkerPhone || '9' + Math.floor(100000000 + Math.random() * 900000000),
      pin: '1234',
      monthlySalary: Number(newWorkerMonthlySalary) || 15000,
      role: newWorkerRole
    });
    setNewWorkerName('');
    setNewWorkerPhone('');
    setShowAddWorker(false);
    reloadData();
  };

  // Remove Worker
  const handleRemoveWorker = (worker) => {
    if (window.confirm(`${t.confirmRemoveWorker}\nWorker: ${worker.name}`)) {
      Store.deleteWorker(worker.id);
      reloadData();
    }
  };

  // Record Worker Khata Item (Grocery purchase cut from salary)
  const handleSaveWorkerKhataItem = (e) => {
    e.preventDefault();
    if (!khataWorkerId || !khataItemAmount) return;
    Store.addWorkerKhataItem({
      id: 'wk-' + Date.now(),
      shopId,
      workerId: khataWorkerId,
      amount: Number(khataItemAmount),
      itemNote: khataItemNote || 'Grocery item purchase from shop',
      date: todayStr
    });
    setShowWorkerKhataModal(false);
    setKhataItemAmount('');
    setKhataItemNote('');
    reloadData();
  };

  const handleDeleteWorkerKhataItem = (id) => {
    Store.deleteWorkerKhataItem(id);
    reloadData();
  };

  // Add Customer
  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!newCustName) return;
    Store.addCustomer({
      id: 'c-' + Date.now(),
      shopId,
      name: newCustName,
      phone: newCustPhone || '9' + Math.floor(100000000 + Math.random() * 900000000),
      pin: '1234',
      address: newCustAddress
    });
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setShowAddCustomer(false);
    reloadData();
  };

  // Record Khata Entry (+ Due or - Paid)
  const handleSaveKhataEntry = (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !khataAmount) return;
    Store.addCustomerDue({
      id: 'cd-' + Date.now(),
      shopId,
      customerId: selectedCustomerId,
      amount: Number(khataAmount),
      type: khataType,
      note: khataNote || (khataType === 'DEBIT' ? 'Grocery Credit' : 'Payment Received'),
      dueDate: khataType === 'DEBIT' ? khataDueDate : null,
      date: todayStr
    });
    setShowKhataEntryModal(false);
    setKhataAmount('');
    setKhataNote('');
    reloadData();
  };

  // Record Daily Merchant / Expense Payment
  const handleSaveDailyPayment = (e) => {
    e.preventDefault();
    if (!payAmount || !payMerchantName) return;
    if (paymentDate > todayStr) {
      alert("Future dates are not allowed for Day Book!");
      setPaymentDate(todayStr);
      return;
    }
    Store.addDailyPayment({
      id: 'dp-' + Date.now(),
      shopId,
      amount: Number(payAmount),
      merchantName: payMerchantName,
      tag: payCategory,
      note: payNote || `Paid ₹${payAmount} to ${payMerchantName}`,
      date: paymentDate
    });
    setShowAddPaymentModal(false);
    setPayAmount('');
    setPayMerchantName('');
    setPayNote('');
    reloadData();
  };

  const handleDeleteDailyPayment = (id) => {
    Store.deleteDailyPayment(id);
    reloadData();
  };

  // Compute Customer Balances & Statuses
  const customerListWithBalance = customers.map(cust => {
    const entries = customerDuesList.filter(d => d.customerId === cust.id);
    let totalDue = 0;
    let latestDueDate = null;

    entries.forEach(e => {
      if (e.type === 'DEBIT') {
        totalDue += e.amount;
        if (e.dueDate) latestDueDate = e.dueDate;
      } else if (e.type === 'CREDIT') {
        totalDue -= e.amount;
      }
    });

    const isOverdue = totalDue > 0 && latestDueDate && new Date(latestDueDate) < new Date(todayStr);
    const status = totalDue <= 0 ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING';

    return {
      ...cust,
      totalDue: Math.max(0, totalDue),
      latestDueDate,
      status,
      entries
    };
  });

  // Filtered Customers
  const filteredCustomers = customerListWithBalance.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  // Audio Read-Aloud for Customer Dues
  const handleListenCustomer = (cust) => {
    if (speakingId === cust.id) {
      stopSpeech();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(cust.id);
    let speechText = '';
    if (currentLang === 'hi') {
      speechText = cust.totalDue > 0 
        ? `${cust.name} का कुल बकाया ${cust.totalDue} रुपये है।` 
        : `${cust.name} का कोई बकाया नहीं है। सारा हिसाब साफ है।`;
    } else if (currentLang === 'te') {
      speechText = cust.totalDue > 0 
        ? `${cust.name} గారికి చెల్లించాల్సిన మొత్తం బాకీ ${cust.totalDue} రూపాయలు.` 
        : `${cust.name} గారికి ఎటువంటి బాకీ లేదు. బాకీ పూర్తయింది.`;
    } else {
      speechText = cust.totalDue > 0 
        ? `${cust.name} has a total due amount of ${cust.totalDue} rupees.` 
        : `${cust.name} has zero balance. All clear.`;
    }

    speakText(speechText, currentLang);
    setTimeout(() => setSpeakingId(null), 5000);
  };

  // Audio Read-Aloud for Daily Payments
  const todayTotalPayments = dailyPaymentsList.reduce((acc, p) => acc + p.amount, 0);

  const handleListenDailyPayments = () => {
    if (speakingId === 'daily-payments') {
      stopSpeech();
      setSpeakingId(null);
      return;
    }

    setSpeakingId('daily-payments');
    let speechText = '';
    if (currentLang === 'hi') {
      speechText = todayTotalPayments > 0 
        ? `इस तारीख का कुल भुगतान ${todayTotalPayments} रुपये है। कुल ${dailyPaymentsList.length} ट्रांजैक्शन हुए हैं।`
        : `इस तारीख का कोई भुगतान दर्ज नहीं है।`;
    } else if (currentLang === 'te') {
      speechText = todayTotalPayments > 0 
        ? `ఈ రోజు చెల్లించిన మొత్తం ఖర్చులు మరియు వ్యాపారుల చెల్లింపులు ${todayTotalPayments} రూపాయలు.`
        : `ఈ రోజు ఎటువంటి చెల్లింపులు నమోదు కాలేదు.`;
    } else {
      speechText = todayTotalPayments > 0 
        ? `Total paid amount for merchant and shop expenses on this date is ${todayTotalPayments} rupees.`
        : `No payment records for this date.`;
    }

    speakText(speechText, currentLang);
    setTimeout(() => setSpeakingId(null), 5000);
  };

  // Overall Statistics
  const totalCustomerDuesSum = customerListWithBalance.reduce((acc, c) => acc + c.totalDue, 0);
  const overdueCount = customerListWithBalance.filter(c => c.status === 'OVERDUE').length;

  return (
    <div className="dashboard-content-wrapper">
      {/* DESKTOP TOP NAVIGATION TABS */}
      <div className="nav-tabs desktop-nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <UserCheck size={20} />
          <span>{t.navAttendance}</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'workerKhata' ? 'active' : ''}`}
          onClick={() => setActiveTab('workerKhata')}
        >
          <ShoppingBag size={20} />
          <span>{t.navWorkerDues}</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'customerKhata' ? 'active' : ''}`}
          onClick={() => setActiveTab('customerKhata')}
        >
          <DollarSign size={20} />
          <span>{t.navCustomerDues}</span>
          {overdueCount > 0 && <span className="badge-status badge-overdue" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{overdueCount}</span>}
        </button>

        <button 
          className={`nav-tab ${activeTab === 'dailyPayments' ? 'active' : ''}`}
          onClick={() => setActiveTab('dailyPayments')}
        >
          <Receipt size={20} />
          <span>{t.navDailyPayments}</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'shopInfo' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopInfo')}
        >
          <ShieldCheck size={20} />
          <span>{t.navShopInfo}</span>
        </button>
      </div>

      {/* MOBILE SCROLLABLE TOP MODULE CAROUSEL SWITCHER */}
      <div className="mobile-top-tabs">
        <button 
          className={`mobile-top-pill ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <UserCheck size={16} />
          <span>{currentLang === 'hi' ? 'हाजिरी' : currentLang === 'te' ? 'హాజరు' : 'Attendance'}</span>
        </button>

        <button 
          className={`mobile-top-pill ${activeTab === 'workerKhata' ? 'active' : ''}`}
          onClick={() => setActiveTab('workerKhata')}
        >
          <ShoppingBag size={16} />
          <span>{currentLang === 'hi' ? 'कर्मचारी खाता' : currentLang === 'te' ? 'వర్కర్ ఖాతా' : 'Worker Khata'}</span>
        </button>

        <button 
          className={`mobile-top-pill ${activeTab === 'customerKhata' ? 'active' : ''}`}
          onClick={() => setActiveTab('customerKhata')}
        >
          <DollarSign size={16} />
          <span>{currentLang === 'hi' ? 'ग्राहक खाता' : currentLang === 'te' ? 'కస్టమర్ బాకీలు' : 'Customer Khata'}</span>
          {overdueCount > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: '10px', fontSize: '0.7rem' }}>{overdueCount}</span>}
        </button>

        <button 
          className={`mobile-top-pill ${activeTab === 'dailyPayments' ? 'active' : ''}`}
          onClick={() => setActiveTab('dailyPayments')}
        >
          <Receipt size={16} />
          <span>{currentLang === 'hi' ? 'दिन खर्च' : currentLang === 'te' ? 'రోజు ఖర్చు' : 'Day Book'}</span>
        </button>

        <button 
          className={`mobile-top-pill ${activeTab === 'shopInfo' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopInfo')}
        >
          <ShieldCheck size={16} />
          <span>{currentLang === 'hi' ? 'दुकान कोड' : currentLang === 'te' ? 'షాప్ కోడ్' : 'Shop Code'}</span>
        </button>
      </div>

      {/* =================================================== */}
      {/* TAB 1: WORKER ATTENDANCE & MANAGEMENT */}
      {/* =================================================== */}
      {activeTab === 'attendance' && (
        <div>
          {/* Rule Banner */}
          <div className="rule-box">
            <Calendar size={24} color="#6366f1" />
            <span>{t.absenceOnlyNote}</span>
          </div>

          {/* Quick Date Selector */}
          <div className="calendar-row">
            {dateOptions.map(opt => (
              <div 
                key={opt.full}
                className={`date-pill ${selectedDate === opt.full ? 'selected' : ''}`}
                onClick={() => setSelectedDate(opt.full)}
              >
                <div className="date-day">{opt.day}</div>
                <div className="date-num">{opt.num}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={22} color="#8b5cf6" />
                <span>{t.attendanceTitle} ({selectedDate})</span>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAddWorker(true)}>
                <Plus size={18} />
                <span>{t.addWorker}</span>
              </button>
            </div>

            {workers.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>{t.noData}</div>
            ) : (
              <div>
                {workers.map(worker => {
                  const isAbsent = attendanceList.some(a => a.workerId === worker.id && a.date === selectedDate);
                  
                  // Compute monthly & daily salary rate
                  const monthlySalary = worker.monthlySalary || (worker.dailySalary ? worker.dailySalary * 30 : 15000);
                  const dailyRate = Math.round(monthlySalary / 30);

                  // Compute total absent days this month
                  const currentMonthPrefix = selectedDate.substring(0, 7);
                  const monthAbsentCount = attendanceList.filter(a => a.workerId === worker.id && a.date.startsWith(currentMonthPrefix)).length;
                  const estimatedDeduction = monthAbsentCount * dailyRate;

                  return (
                    <div key={worker.id} className="list-item" style={{ borderLeft: isAbsent ? '4px solid #ef4444' : '4px solid #10b981' }}>
                      <div className="item-info">
                        <div className="item-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>{worker.name}</span>
                          <span style={{ fontSize: '0.8rem', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                            ₹{monthlySalary.toLocaleString()}/month (~₹{dailyRate}/day)
                          </span>
                        </div>
                        <div className="item-sub" style={{ marginTop: '4px' }}>
                          📞 {worker.phone} | {t.absentDaysThisMonth}: <strong style={{ color: '#ef4444' }}>{monthAbsentCount}</strong>
                          {monthAbsentCount > 0 && <span style={{ marginLeft: '8px', color: '#f87171' }}>({t.estimatedDeduction}: ₹{estimatedDeduction})</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {isAbsent ? (
                          <span className="badge-status badge-overdue">❌ ABSENT / छुट्टी</span>
                        ) : (
                          <span className="badge-status badge-paid">✅ PRESENT / उपस्थित</span>
                        )}

                        <button 
                          className={`btn ${isAbsent ? 'btn-success' : 'btn-danger'}`}
                          onClick={() => handleToggleAbsence(worker.id)}
                        >
                          {isAbsent ? t.markPresent : t.markAbsent}
                        </button>

                        {/* REMOVE WORKER BUTTON */}
                        <button 
                          className="btn btn-secondary"
                          style={{ color: '#ef4444', padding: '8px 12px' }}
                          onClick={() => handleRemoveWorker(worker)}
                          title={t.removeWorker}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ADD WORKER MODAL */}
          {showAddWorker && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '16px' }}>{t.addWorker}</h3>
                <form onSubmit={handleAddWorker}>
                  <div className="form-group">
                    <label className="form-label">{t.workerName}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Ramesh Verma" 
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.phone}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Phone Number" 
                      value={newWorkerPhone}
                      onChange={(e) => setNewWorkerPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.monthlySalary}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 15000" 
                      value={newWorkerMonthlySalary}
                      onChange={(e) => setNewWorkerMonthlySalary(e.target.value)}
                      required 
                    />
                    <small style={{ color: '#a5b4fc', marginTop: '4px', display: 'block' }}>
                      💡 System automatically calculates per day rate as Monthly Salary / 30 (~₹{Math.round((Number(newWorkerMonthlySalary) || 0) / 30)}/day).
                    </small>
                  </div>

                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.save}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddWorker(false)}>{t.cancel}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================== */}
      {/* TAB 2: WORKER KHATA (GROCERY PURCHASES / SALARY CUTS) */}
      {/* =================================================== */}
      {activeTab === 'workerKhata' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={22} color="#10b981" />
                <span>{t.workerKhataTitle}</span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (workers.length > 0) setKhataWorkerId(workers[0].id);
                  setShowWorkerKhataModal(true);
                }}
              >
                <Plus size={18} />
                <span>{t.addWorkerKhataItem}</span>
              </button>
            </div>

            {workers.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>{t.noData}</div>
            ) : (
              workers.map(w => {
                const monthlySalary = w.monthlySalary || (w.dailySalary ? w.dailySalary * 30 : 15000);
                const dailyRate = Math.round(monthlySalary / 30);

                // Absences deduction
                const currentMonthPrefix = todayStr.substring(0, 7);
                const absentDays = attendanceList.filter(a => a.workerId === w.id && a.date.startsWith(currentMonthPrefix)).length;
                const absenceDeduction = absentDays * dailyRate;

                // Worker Khata grocery items cut
                const khataItems = workerKhataList.filter(k => k.workerId === w.id);
                const totalKhataCut = khataItems.reduce((acc, k) => acc + k.amount, 0);

                // Net payable salary = Base Salary - Absence Deduction - Shop Items Khata Cut
                const netPayable = Math.max(0, monthlySalary - absenceDeduction - totalKhataCut);

                return (
                  <div key={w.id} className="card" style={{ background: '#0f172a', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{w.name}</h4>
                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '4px' }}>
                          Base Monthly Salary: <strong>₹{monthlySalary.toLocaleString()}</strong> | Daily Rate: ₹{dailyRate}/day
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#f87171', marginTop: '2px' }}>
                          ⚠️ Absence Deductions ({absentDays} days): -₹{absenceDeduction} | 🛒 Grocery Items Cut: -₹{totalKhataCut}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: '700' }}>
                          {t.netSalaryPayable}
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#34d399' }}>
                          ₹{netPayable.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* ITEM PURCHASES LIST */}
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
                        🛒 Shopped Grocery Items (Cut from Salary):
                      </div>
                      {khataItems.length === 0 ? (
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No shop items recorded for salary cut.</div>
                      ) : (
                        khataItems.map(item => (
                          <div key={item.id} style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 12px', borderRadius: '8px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontWeight: '700' }}>{item.itemNote}</span>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '8px' }}>({item.date})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontWeight: '800', color: '#ef4444' }}>-₹{item.amount}</span>
                              <button 
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                onClick={() => handleDeleteWorkerKhataItem(item.id)}
                                title={t.delete}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ADD WORKER KHATA GROCERY ITEM MODAL */}
          {showWorkerKhataModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '16px' }}>{t.addWorkerKhataItem}</h3>
                <form onSubmit={handleSaveWorkerKhataItem}>
                  <div className="form-group">
                    <label className="form-label">Select Worker</label>
                    <select 
                      className="form-input" 
                      value={khataWorkerId}
                      onChange={(e) => setKhataWorkerId(e.target.value)}
                    >
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.amount}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 500"
                      value={khataItemAmount}
                      onChange={(e) => setKhataItemAmount(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.itemDetails}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 10kg Rice bag & Oil tin from shop"
                      value={khataItemNote}
                      onChange={(e) => setKhataItemNote(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.save}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowWorkerKhataModal(false)}>{t.cancel}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================== */}
      {/* TAB 3: CUSTOMER KHATA (DUES) & AUDIO READ-ALOUD */}
      {/* =================================================== */}
      {activeTab === 'customerKhata' && (
        <div>
          {/* STAT CARDS */}
          <div className="grid-3">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                <DollarSign size={28} />
              </div>
              <div>
                <div className="stat-val" style={{ color: '#ef4444' }}>₹{totalCustomerDuesSum}</div>
                <div className="stat-lbl">{t.totalDueAmount}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <div className="stat-val" style={{ color: '#f59e0b' }}>{overdueCount}</div>
                <div className="stat-lbl">Overdue Customers (समय समाप्त)</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <Users size={28} />
              </div>
              <div>
                <div className="stat-val" style={{ color: '#10b981' }}>{customers.length}</div>
                <div className="stat-lbl">Total Registered Customers</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span>{t.customerKhataTitle}</span>
                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '32px', padding: '6px 12px 6px 32px', fontSize: '0.9rem', width: '180px' }}
                    placeholder="Search name/phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn btn-primary" onClick={() => setShowAddCustomer(true)}>
                <Plus size={18} />
                <span>{t.addCustomer}</span>
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button className={`btn ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setFilterStatus('ALL')}>
                All Customers ({customers.length})
              </button>
              <button className={`btn ${filterStatus === 'OVERDUE' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setFilterStatus('OVERDUE')}>
                ⚠️ Overdue ({overdueCount})
              </button>
              <button className={`btn ${filterStatus === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setFilterStatus('PENDING')}>
                Payment Due
              </button>
              <button className={`btn ${filterStatus === 'PAID' ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setFilterStatus('PAID')}>
                Cleared (Paid)
              </button>
            </div>

            {/* CUSTOMER LIST */}
            {filteredCustomers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>{t.noData}</div>
            ) : (
              <div>
                {filteredCustomers.map(cust => (
                  <div key={cust.id} className="list-item" style={{ borderLeft: cust.status === 'OVERDUE' ? '4px solid #ef4444' : cust.status === 'PENDING' ? '4px solid #f59e0b' : '4px solid #10b981' }}>
                    <div className="item-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="item-name">{cust.name}</span>
                        {cust.status === 'PAID' && <span className="badge-status badge-paid">{t.statusPaid}</span>}
                        {cust.status === 'PENDING' && <span className="badge-status badge-pending">{t.statusPending}</span>}
                        {cust.status === 'OVERDUE' && <span className="badge-status badge-overdue">{t.statusOverdue}</span>}
                      </div>

                      <div className="item-sub" style={{ marginTop: '4px' }}>
                        📞 {cust.phone} | {cust.address || 'Local Customer'}
                        {cust.latestDueDate && <span style={{ marginLeft: '10px', color: cust.status === 'OVERDUE' ? '#f87171' : '#cbd5e1' }}>| {t.dueDate}: <strong>{cust.latestDueDate}</strong></span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: cust.totalDue > 0 ? '#ef4444' : '#10b981' }}>
                          ₹{cust.totalDue}
                        </div>
                      </div>

                      {/* AUDIO READ-ALOUD TTS BUTTON */}
                      <button 
                        className={`btn ${speakingId === cust.id ? 'btn-danger' : 'btn-listen'}`}
                        style={{ padding: '8px 14px', fontSize: '0.9rem' }}
                        onClick={() => handleListenCustomer(cust)}
                      >
                        <Volume2 size={18} />
                        <span>{speakingId === cust.id ? t.audioStopped : t.listenBalance}</span>
                      </button>

                      {/* Action Buttons */}
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        onClick={() => {
                          setSelectedCustomerId(cust.id);
                          setKhataType('DEBIT');
                          setShowKhataEntryModal(true);
                        }}
                      >
                        <ArrowUpRight size={16} />
                        <span>{t.recordCredit}</span>
                      </button>

                      <button 
                        className="btn btn-success"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        onClick={() => {
                          setSelectedCustomerId(cust.id);
                          setKhataType('CREDIT');
                          setShowKhataEntryModal(true);
                        }}
                      >
                        <ArrowDownLeft size={16} />
                        <span>{t.recordPayment}</span>
                      </button>

                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        onClick={() => setSelectedLedgerCustomer(cust)}
                      >
                        Receipts ({cust.entries.length})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADD CUSTOMER MODAL */}
          {showAddCustomer && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '16px' }}>{t.addCustomer}</h3>
                <form onSubmit={handleAddCustomer}>
                  <div className="form-group">
                    <label className="form-label">{t.customerName}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Anita Sharma"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.customerPhone}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Phone Number"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address / Landmark</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Street #4"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.save}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddCustomer(false)}>{t.cancel}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* RECORD KHATA ENTRY (+ CREDIT OR - PAYMENT) */}
          {showKhataEntryModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '16px' }}>
                  {khataType === 'DEBIT' ? '➕ ' + t.recordCredit : '➖ ' + t.recordPayment}
                </h3>
                <form onSubmit={handleSaveKhataEntry}>
                  <div className="form-group">
                    <label className="form-label">Select Entry Type</label>
                    <select 
                      className="form-input" 
                      value={khataType}
                      onChange={(e) => setKhataType(e.target.value)}
                    >
                      <option value="DEBIT">Credit Sale / Due Added (+ ₹)</option>
                      <option value="CREDIT">Payment Received (- ₹)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.amount}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Amount in Rupees"
                      value={khataAmount}
                      onChange={(e) => setKhataAmount(e.target.value)}
                      required 
                    />
                  </div>

                  {khataType === 'DEBIT' && (
                    <div className="form-group">
                      <label className="form-label">{t.dueDate}</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={khataDueDate}
                        onChange={(e) => setKhataDueDate(e.target.value)}
                        required 
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">{t.note}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Rice bag, Flour, Oil"
                      value={khataNote}
                      onChange={(e) => setKhataNote(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.save}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowKhataEntryModal(false)}>{t.cancel}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CUSTOMER LEDGER / RECEIPTS MODAL */}
          {selectedLedgerCustomer && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>
                    📜 {selectedLedgerCustomer.name} - {t.receiptHistory}
                  </h3>
                  <button className="btn btn-secondary" onClick={() => setSelectedLedgerCustomer(null)}>{t.close}</button>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {selectedLedgerCustomer.entries.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>{t.noData}</div>
                  ) : (
                    selectedLedgerCustomer.entries.map(e => (
                      <div key={e.id} style={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: e.type === 'DEBIT' ? '#f87171' : '#34d399' }}>
                            {e.type === 'DEBIT' ? '➕ Credit Added' : '➖ Payment Received'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{e.note} | Date: {e.date}</div>
                        </div>

                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: e.type === 'DEBIT' ? '#ef4444' : '#10b981' }}>
                          {e.type === 'DEBIT' ? '+' : '-'}₹{e.amount}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================== */}
      {/* TAB 4: DAILY PAYMENTS / MERCHANT TRANSACTIONS DAY BOOK */}
      {/* =================================================== */}
      {activeTab === 'dailyPayments' && (
        <div>
          {/* TOTAL PAID TODAY BANNER & AUDIO BUTTON */}
          <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))', borderLeft: '6px solid #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#a5b4fc', fontWeight: '700', textTransform: 'uppercase' }}>
                  {t.todayTotalPaid} ({paymentDate})
                </div>
                <div className="text-hero-amount" style={{ color: '#ef4444', margin: '4px 0' }}>
                  ₹{todayTotalPayments}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                  Total merchant & expense transactions logged for this date.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  className={`btn ${speakingId === 'daily-payments' ? 'btn-danger' : 'btn-listen'}`}
                  onClick={handleListenDailyPayments}
                >
                  <Volume2 size={20} />
                  <span>{speakingId === 'daily-payments' ? t.audioStopped : t.listenPayments}</span>
                </button>

                <button className="btn btn-primary" onClick={() => setShowAddPaymentModal(true)}>
                  <Plus size={18} />
                  <span>{t.addDailyPayment}</span>
                </button>
              </div>
            </div>
          </div>

          {/* DATE FILTER (CAPPED TO TODAY) */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={20} color="#6366f1" />
              <span style={{ fontWeight: '700' }}>{t.filterDate}:</span>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: 'auto', padding: '6px 12px' }}
                value={paymentDate}
                max={todayStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val > todayStr) {
                    alert("Future dates are not allowed for Day Book!");
                    setPaymentDate(todayStr);
                    return;
                  }
                  setPaymentDate(val);
                }}
              />
            </div>
          </div>

          {/* PAYMENTS TRANSACTIONS LIST */}
          <div className="card">
            <div className="card-title">
              <span>{t.dailyPaymentsTitle}</span>
            </div>

            {dailyPaymentsList.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                No merchant payments or expenses recorded for {paymentDate}.
              </div>
            ) : (
              <div>
                {dailyPaymentsList.map(pay => (
                  <div key={pay.id} className="list-item" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div className="item-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="item-name">{pay.merchantName}</span>
                        <span className="badge-status badge-overdue" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                          <Tag size={12} /> {pay.tag || 'EXPENSE'}
                        </span>
                      </div>
                      <div className="item-sub" style={{ marginTop: '4px' }}>
                        📝 {pay.note} | Date: <strong>{pay.date}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444' }}>
                        -₹{pay.amount}
                      </div>

                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '8px', color: '#ef4444' }}
                        onClick={() => handleDeleteDailyPayment(pay.id)}
                        title={t.delete}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADD DAILY PAYMENT / EXPENSE MODAL */}
          {showAddPaymentModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '16px' }}>{t.addDailyPayment}</h3>
                <form onSubmit={handleSaveDailyPayment}>
                  <div className="form-group">
                    <label className="form-label">{t.merchantName}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Rice Wholesaler / Fortune Agency"
                      value={payMerchantName}
                      onChange={(e) => setPayMerchantName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.amount}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 20000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.paymentCategory}</label>
                    <select 
                      className="form-input" 
                      value={payCategory}
                      onChange={(e) => setPayCategory(e.target.value)}
                    >
                      <option value="MERCHANT">🛒 {t.tagMerchant}</option>
                      <option value="RENT">🏢 {t.tagRent}</option>
                      <option value="BILLS">⚡ {t.tagBills}</option>
                      <option value="MISC">📦 {t.tagMisc}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.note}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Today paid 20000 RS for rice stock"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={paymentDate}
                      max={todayStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val > todayStr) {
                          alert("Future dates are not allowed for Day Book!");
                          setPaymentDate(todayStr);
                          return;
                        }
                        setPaymentDate(val);
                      }}
                      required 
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.save}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddPaymentModal(false)}>{t.cancel}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================== */}
      {/* TAB 5: SHOP INFO & UNIQUE SHOP ID */}
      {/* =================================================== */}
      {activeTab === 'shopInfo' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <ShieldCheck size={48} color="#6366f1" style={{ marginBottom: '12px' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>{currentUser.shopName}</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Owner: {currentUser.name}</p>

          <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '2px dashed #6366f1', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '0.9rem', color: '#a5b4fc', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Your Unique Shop ID (షాప్ కోడ్)
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffffff', margin: '10px 0' }}>
              {shopId}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              Share this Shop ID with your shop workers and customers to log in into your shop register safely.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(shopId); alert("Shop ID copied!"); }}>
              📋 Copy Shop ID
            </button>
          </div>
        </div>
      )}

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`bottom-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <UserCheck size={20} />
          <span>{currentLang === 'hi' ? 'हाजिरी' : currentLang === 'te' ? 'హాజరు' : 'Attendance'}</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'workerKhata' ? 'active' : ''}`}
          onClick={() => setActiveTab('workerKhata')}
        >
          <ShoppingBag size={20} />
          <span>{currentLang === 'hi' ? 'वर्कर खाता' : currentLang === 'te' ? 'వర్కర్ ఖాతా' : 'Worker Khata'}</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'customerKhata' ? 'active' : ''}`}
          onClick={() => setActiveTab('customerKhata')}
        >
          <DollarSign size={20} />
          <span>{currentLang === 'hi' ? 'ग्राहक खाता' : currentLang === 'te' ? 'కస్టమర్ ఖాతా' : 'Customer Khata'}</span>
          {overdueCount > 0 && <span className="bottom-nav-badge">{overdueCount}</span>}
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'dailyPayments' ? 'active' : ''}`}
          onClick={() => setActiveTab('dailyPayments')}
        >
          <Receipt size={20} />
          <span>{currentLang === 'hi' ? 'दिन खर्च' : currentLang === 'te' ? 'రోజు ఖర్చు' : 'Day Book'}</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'shopInfo' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopInfo')}
        >
          <ShieldCheck size={20} />
          <span>{currentLang === 'hi' ? 'दुकान कोड' : currentLang === 'te' ? 'షాప్ కోడ్' : 'Shop Code'}</span>
        </button>
      </nav>
    </div>
  );
};
