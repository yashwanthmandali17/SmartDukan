import React, { useState } from 'react';
import { languages } from '../languages';
import { Store } from '../store';
import { speakText, stopSpeech } from '../speech';
import { Volume2, QrCode, CheckCircle, AlertTriangle, FileText, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';

export const CustomerDashboard = ({ currentUser, currentLang }) => {
  const t = languages[currentLang] || languages.en;
  const shopId = currentUser.shopId;
  const customerId = currentUser.customerId;

  const [speaking, setSpeaking] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Fetch shop & customer data
  const shop = Store.getShopById(shopId) || { name: 'Grocery Store' };
  const customerDues = Store.getCustomerDues(shopId, customerId);

  // Compute total due
  let totalDue = 0;
  let latestDueDate = null;

  customerDues.forEach(entry => {
    if (entry.type === 'DEBIT') {
      totalDue += entry.amount;
      if (entry.dueDate) latestDueDate = entry.dueDate;
    } else if (entry.type === 'CREDIT') {
      totalDue -= entry.amount;
    }
  });

  totalDue = Math.max(0, totalDue);
  const isOverdue = totalDue > 0 && latestDueDate && new Date(latestDueDate) < new Date(new Date().toISOString().split('T')[0]);

  const handleListenBalance = () => {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    let speechText = '';
    if (currentLang === 'hi') {
      speechText = totalDue > 0 
        ? `नमस्ते ${currentUser.name}, ${shop.name} में आपकी कुल बकाया राशि ${totalDue} रुपये है। अंतिम तिथि ${latestDueDate || 'शीघ्र'} है।`
        : `नमस्ते ${currentUser.name}, ${shop.name} में आपका कोई बकाया नहीं है। आपका खाता बिल्कुल साफ है।`;
    } else if (currentLang === 'te') {
      speechText = totalDue > 0 
        ? `నమస్కారం ${currentUser.name} గారు, ${shop.name} లో మీ మొత్తం చెల్లించాల్సిన బాకీ ${totalDue} రూపాయలు. గడువు తేదీ ${latestDueDate || 'త్వరలో'}.`
        : `నమస్కారం ${currentUser.name} గారు, ${shop.name} లో ఎటువంటి బాకీ లేదు. ధన్యవాదాలు.`;
    } else {
      speechText = totalDue > 0 
        ? `Hello ${currentUser.name}, your total due amount at ${shop.name} is ${totalDue} rupees. Due date is ${latestDueDate || 'soon'}.`
        : `Hello ${currentUser.name}, you have zero balance at ${shop.name}. All clear.`;
    }
    speakText(speechText, currentLang);
    setTimeout(() => setSpeaking(false), 5000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Welcome Card */}
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
        <div style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: '700' }}>
          Customer Portal | Shop ID: {shopId}
        </div>
        <h2 className="text-heading-lg">{currentUser.name}</h2>
        <p style={{ color: '#cbd5e1' }}>Store: {shop.name}</p>
      </div>

      {/* BIG BALANCE STATUS CARD */}
      <div 
        className="card" 
        style={{ 
          marginBottom: '24px', 
          textAlign: 'center', 
          padding: '28px 16px',
          border: totalDue > 0 ? (isOverdue ? '2px solid #ef4444' : '2px solid #f59e0b') : '2px solid #10b981',
          background: totalDue > 0 ? (isOverdue ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)') : 'rgba(16, 185, 129, 0.12)'
        }}
      >
        <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
          {t.totalDueAmount}
        </div>

        <div className="text-hero-amount" style={{ color: totalDue > 0 ? (isOverdue ? '#ef4444' : '#fbbf24') : '#34d399' }}>
          ₹{totalDue}
        </div>

        {totalDue > 0 && latestDueDate && (
          <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: '700', color: isOverdue ? '#f87171' : '#fef08a' }}>
            {isOverdue ? '⚠️ OVERDUE - Due Date was: ' : '📅 Due Date: '} {latestDueDate}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '24px', flexWrap: 'wrap' }}>
          {/* AUDIO BUTTON */}
          <button 
            className={`btn ${speaking ? 'btn-danger' : 'btn-listen'}`}
            onClick={handleListenBalance}
          >
            <Volume2 size={22} />
            <span>{speaking ? t.audioStopped : t.listenBalance}</span>
          </button>

          {totalDue > 0 && (
            <button className="btn btn-success" style={{ padding: '12px 24px', fontSize: '1.1rem' }} onClick={() => setShowPayModal(true)}>
              <QrCode size={22} />
              <span>{t.payNow}</span>
            </button>
          )}
        </div>
      </div>

      {/* LEDGER RECEIPTS TIMELINE */}
      <div className="card">
        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={22} color="#6366f1" />
          <span>{t.receiptHistory} (ఖాతా వివరాలు)</span>
        </h3>

        {customerDues.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>{t.noData}</div>
        ) : (
          customerDues.map(entry => (
            <div key={entry.id} className="list-item" style={{ borderLeft: entry.type === 'DEBIT' ? '4px solid #ef4444' : '4px solid #10b981' }}>
              <div>
                <div style={{ fontWeight: '700', color: entry.type === 'DEBIT' ? '#f87171' : '#34d399', fontSize: '1.1rem' }}>
                  {entry.type === 'DEBIT' ? '➕ Credit Purchase (ఉచిత/అప్పు సరుకులు)' : '➖ Payment Received (డబ్బు చెల్లించారు)'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '4px' }}>
                  {entry.note} | Date: {entry.date}
                </div>
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: entry.type === 'DEBIT' ? '#ef4444' : '#10b981' }}>
                {entry.type === 'DEBIT' ? '+' : '-'}₹{entry.amount}
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPI QR PAYMENT SIMULATION MODAL */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Pay via UPI QR</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowPayModal(false)}><X size={18} /></button>
            </div>

            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=shop${shopId}@upi%26pn=${encodeURIComponent(shop.name)}%26am=${totalDue}%26cu=INR`} 
                alt="UPI QR Code" 
                style={{ width: '180px', height: '180px' }}
              />
            </div>

            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>
              Amount: ₹{totalDue}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '20px' }}>
              Scan using PhonePe, Google Pay, or Paytm to pay directly to {shop.name}.
            </p>

            <button 
              className="btn btn-success" 
              style={{ width: '100%' }}
              onClick={() => {
                alert("Simulated Payment Success!");
                setShowPayModal(false);
              }}
            >
              Simulate Successful Payment ✅
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
