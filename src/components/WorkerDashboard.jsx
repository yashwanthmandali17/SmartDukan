import React, { useState } from 'react';
import { languages } from '../languages';
import { Store } from '../store';
import { speakText, stopSpeech } from '../speech';
import { Calendar, UserCheck, Volume2, ShoppingBag, DollarSign } from 'lucide-react';

export const WorkerDashboard = ({ currentUser, currentLang }) => {
  const t = languages[currentLang] || languages.en;
  const shopId = currentUser.shopId;
  const workerId = currentUser.workerId;
  const todayStr = new Date().toISOString().split('T')[0];

  const [speaking, setSpeaking] = useState(false);

  // Fetch worker info & attendance/khata
  const workers = Store.getWorkers(shopId);
  const worker = workers.find(w => w.id === workerId) || { name: currentUser.name, monthlySalary: 15000 };
  const attendanceList = Store.getAttendance(shopId).filter(a => a.workerId === workerId);
  const workerKhataItems = Store.getWorkerKhata(shopId, workerId);

  // Calculate monthly stats & daily rate
  const monthlySalary = worker.monthlySalary || (worker.dailySalary ? worker.dailySalary * 30 : 15000);
  const dailyRate = Math.round(monthlySalary / 30);

  const currentMonthPrefix = todayStr.substring(0, 7);
  const absentDaysThisMonth = attendanceList.filter(a => a.date.startsWith(currentMonthPrefix)).length;
  const daysInMonthSoFar = new Date().getDate();
  const presentDays = Math.max(0, daysInMonthSoFar - absentDaysThisMonth);

  const absenceDeduction = absentDaysThisMonth * dailyRate;
  const totalKhataCut = workerKhataItems.reduce((acc, k) => acc + k.amount, 0);

  // Net estimated salary payout = Base Monthly Salary - Absence Deductions - Shop Grocery Items Cut
  const netEstimatedSalary = Math.max(0, monthlySalary - absenceDeduction - totalKhataCut);

  const handleListenStatus = () => {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    let speechText = '';
    if (currentLang === 'hi') {
      speechText = `नमस्ते ${worker.name}, आपका मासिक वेतन ${monthlySalary} रुपये है। इस महीने आपकी ${absentDaysThisMonth} छुट्टी है। दुकान से खरीदे गए सामान का कटौता ${totalKhataCut} रुपये है। आपका शुद्ध देय वेतन ${netEstimatedSalary} रुपये है।`;
    } else if (currentLang === 'te') {
      speechText = `నమస్కారం ${worker.name} గారు, మీ నెల జీతం ${monthlySalary} రూపాయలు. ఈ నెల లీవ్‌లు ${absentDaysThisMonth}. షాపులో తీసుకన్న సరుకుల కటింగ్ ${totalKhataCut} రూపాయలు. ఈ నెల మీకు వచ్చే నికర జీతం ${netEstimatedSalary} రూపాయలు.`;
    } else {
      speechText = `Hello ${worker.name}, your monthly salary is ${monthlySalary} rupees. You have ${absentDaysThisMonth} absent days this month. Shop items deduction is ${totalKhataCut} rupees. Your net estimated salary payout is ${netEstimatedSalary} rupees.`;
    }
    speakText(speechText, currentLang);
    setTimeout(() => setSpeaking(false), 6000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Worker Header Card */}
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(49, 46, 129, 0.8))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: '700', textTransform: 'uppercase' }}>
              Worker Profile | Shop ID: {shopId}
            </div>
            <h2 className="text-heading-lg">{worker.name}</h2>
            <p style={{ color: '#cbd5e1' }}>
              Base Monthly Salary: <strong>₹{monthlySalary.toLocaleString()}</strong> (~₹{dailyRate}/day)
            </p>
          </div>

          <button 
            className={`btn ${speaking ? 'btn-danger' : 'btn-listen'}`}
            onClick={handleListenStatus}
          >
            <Volume2 size={20} />
            <span>{speaking ? t.audioStopped : t.listenBalance}</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid-2" style={{ marginBottom: '20px' }}>
        {/* ATTENDANCE SUMMARY */}
        <div className="card">
          <div className="card-title" style={{ color: '#10b981' }}>
            <UserCheck size={24} />
            <span>Attendance (This Month)</span>
          </div>
          <div className="text-card-amount" style={{ marginBottom: '8px' }}>
            {presentDays} Days Present
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Absence Marked: <strong style={{ color: '#ef4444' }}>{absentDaysThisMonth} Days</strong> (-₹{absenceDeduction})
          </p>
        </div>

        {/* WORKER KHATA (GROCERY PURCHASES / SALARY CUTS) */}
        <div className="card">
          <div className="card-title" style={{ color: '#ef4444' }}>
            <ShoppingBag size={24} />
            <span>{t.navWorkerDues}</span>
          </div>
          <div className="text-card-amount" style={{ color: totalKhataCut > 0 ? '#ef4444' : '#10b981', marginBottom: '8px' }}>
            ₹{totalKhataCut}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Total Shop Grocery Items Cut from Salary
          </p>
        </div>
      </div>

      {/* NET ESTIMATED SALARY PAYOUT BANNER */}
      <div className="card" style={{ marginBottom: '20px', background: 'rgba(16, 185, 129, 0.12)', border: '2px solid #10b981', textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: '#a5b4fc', fontWeight: '700', textTransform: 'uppercase' }}>
          {t.netSalaryPayable}
        </div>
        <div className="text-hero-amount" style={{ color: '#34d399', margin: '4px 0' }}>
          ₹{netEstimatedSalary.toLocaleString()}
        </div>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
          Calculated as: Base Salary (₹{monthlySalary.toLocaleString()}) - Absence Deductions (-₹{absenceDeduction}) - Shop Items Khata Cut (-₹{totalKhataCut})
        </p>
      </div>

      {/* SHOP ITEMS KHATA HISTORY */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} color="#10b981" />
          <span>My Shopped Grocery Items (Deducted from Salary)</span>
        </h3>

        {workerKhataItems.length === 0 ? (
          <div style={{ padding: '16px', color: '#94a3b8' }}>No shop items recorded for salary deduction.</div>
        ) : (
          workerKhataItems.map(item => (
            <div key={item.id} className="list-item" style={{ borderLeft: '4px solid #ef4444' }}>
              <div>
                <div style={{ fontWeight: '700' }}>{item.itemNote}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Date: {item.date}</div>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ef4444' }}>
                -₹{item.amount}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ABSENCE HISTORY REGISTER */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="#6366f1" />
          <span>My Absence History</span>
        </h3>

        {attendanceList.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#34d399', fontWeight: '700' }}>
            ✅ Full Attendance! No absence recorded by shop owner.
          </div>
        ) : (
          attendanceList.map(a => (
            <div key={a.id} className="list-item" style={{ borderLeft: '4px solid #ef4444' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#f87171' }}>❌ Absent on {a.date}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Reason: {a.note || 'Leave'}</div>
              </div>
              <span className="badge-status badge-overdue">ABSENT (-₹{dailyRate})</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
