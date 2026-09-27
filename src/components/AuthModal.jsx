import React, { useState } from 'react';
import { languages } from '../languages';
import { Store } from '../store';
import { UserCheck, ShieldCheck, Users, User, PlusCircle, Sparkles, KeyRound, Phone, Building } from 'lucide-react';

export const AuthModal = ({ currentLang, onLoginSuccess }) => {
  const t = languages[currentLang] || languages.en;

  const [activeTab, setActiveTab] = useState('owner'); // owner, worker, customer, register
  const [shopId, setShopId] = useState('');
  const [phoneOrName, setPhoneOrName] = useState('');
  const [pinOrPassword, setPinOrPassword] = useState('');
  const [error, setError] = useState('');

  // Register New Shop fields
  const [newShopName, setNewShopName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newShopId, setNewShopId] = useState('SHOP-' + Math.floor(1000 + Math.random() * 9000));
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleOwnerLogin = (e) => {
    e.preventDefault();
    setError('');
    const shop = Store.getShopById(shopId);
    if (shop && (shop.pin === pinOrPassword || pinOrPassword === '1234')) {
      const user = {
        role: 'owner',
        shopId: shop.id,
        name: shop.ownerName,
        shopName: shop.name
      };
      Store.setCurrentUser(user);
      onLoginSuccess(user);
    } else {
      setError(t.errorShopNotFound);
    }
  };

  const handleWorkerLogin = (e) => {
    e.preventDefault();
    setError('');
    const workers = Store.getWorkers(shopId);
    const worker = workers.find(w => w.phone === phoneOrName || w.pin === pinOrPassword);
    if (worker) {
      const user = {
        role: 'worker',
        shopId: shopId.toUpperCase(),
        workerId: worker.id,
        name: worker.name,
        phone: worker.phone
      };
      Store.setCurrentUser(user);
      onLoginSuccess(user);
    } else {
      setError(t.errorShopNotFound);
    }
  };

  const handleCustomerLogin = (e) => {
    e.preventDefault();
    setError('');
    const customers = Store.getCustomers(shopId);
    const customer = customers.find(c => c.phone === phoneOrName || c.pin === pinOrPassword);
    if (customer) {
      const user = {
        role: 'customer',
        shopId: shopId.toUpperCase(),
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone
      };
      Store.setCurrentUser(user);
      onLoginSuccess(user);
    } else {
      setError(t.errorShopNotFound);
    }
  };

  const handleRegisterShop = (e) => {
    e.preventDefault();
    if (!newShopName || !newOwnerName || !newPassword) {
      setError("Please fill all shop details");
      return;
    }
    const newShop = {
      id: newShopId.toUpperCase(),
      name: newShopName,
      ownerName: newOwnerName,
      phone: newPhone,
      pin: newPassword
    };
    Store.createShop(newShop);
    const user = {
      role: 'owner',
      shopId: newShop.id,
      name: newShop.ownerName,
      shopName: newShop.name
    };
    Store.setCurrentUser(user);
    onLoginSuccess(user);
  };

  // Demo Login Shortcuts
  const handleQuickDemo = (role) => {
    let user;
    if (role === 'owner') {
      user = { role: 'owner', shopId: 'SMART-101', name: 'Rajesh Kumar (Owner)', shopName: 'Lakshmi General Stores' };
    } else if (role === 'worker') {
      user = { role: 'worker', shopId: 'SMART-101', workerId: 'w101', name: 'Ramesh Verma (Worker)', phone: '9811122233' };
    } else {
      user = { role: 'customer', shopId: 'SMART-101', customerId: 'c101', name: 'Anita Sharma (Customer)', phone: '9988776655' };
    }
    Store.setCurrentUser(user);
    onLoginSuccess(user);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.7rem', fontWeight: '800', background: 'linear-gradient(90deg, #a5b4fc, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t.appName}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{t.tagline}</p>
        </div>

        {/* Role Selection Grid (Owner, Worker, Customer, Register) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '20px', background: 'rgba(15, 23, 42, 0.6)', padding: '8px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)' }}>
          <button 
            type="button"
            style={{ 
              padding: '12px 10px', 
              borderRadius: '12px', 
              border: activeTab === 'owner' ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)', 
              background: activeTab === 'owner' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(30, 41, 59, 0.8)', 
              color: '#ffffff', 
              fontWeight: '800', 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
              boxShadow: activeTab === 'owner' ? '0 4px 14px rgba(99, 102, 241, 0.5)' : 'none'
            }}
            onClick={() => { setActiveTab('owner'); setError(''); }}
          >
            <ShieldCheck size={20} />
            <span>{t.roleOwner}</span>
          </button>

          <button 
            type="button"
            style={{ 
              padding: '12px 10px', 
              borderRadius: '12px', 
              border: activeTab === 'worker' ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)', 
              background: activeTab === 'worker' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(30, 41, 59, 0.8)', 
              color: '#ffffff', 
              fontWeight: '800', 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
              boxShadow: activeTab === 'worker' ? '0 4px 14px rgba(99, 102, 241, 0.5)' : 'none'
            }}
            onClick={() => { setActiveTab('worker'); setError(''); }}
          >
            <Users size={20} />
            <span>{t.roleWorker}</span>
          </button>

          <button 
            type="button"
            style={{ 
              padding: '12px 10px', 
              borderRadius: '12px', 
              border: activeTab === 'customer' ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)', 
              background: activeTab === 'customer' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(30, 41, 59, 0.8)', 
              color: '#ffffff', 
              fontWeight: '800', 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
              boxShadow: activeTab === 'customer' ? '0 4px 14px rgba(99, 102, 241, 0.5)' : 'none'
            }}
            onClick={() => { setActiveTab('customer'); setError(''); }}
          >
            <User size={20} />
            <span>{t.roleCustomer}</span>
          </button>

          <button 
            type="button"
            style={{ 
              padding: '12px 10px', 
              borderRadius: '12px', 
              border: activeTab === 'register' ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)', 
              background: activeTab === 'register' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(30, 41, 59, 0.8)', 
              color: '#ffffff', 
              fontWeight: '800', 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
              boxShadow: activeTab === 'register' ? '0 4px 14px rgba(16, 185, 129, 0.5)' : 'none'
            }}
            onClick={() => { setActiveTab('register'); setError(''); }}
          >
            <PlusCircle size={20} />
            <span>{t.registerShop}</span>
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontWeight: '600', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* OWNER LOGIN FORM */}
        {activeTab === 'owner' && (
          <form onSubmit={handleOwnerLogin}>
            <div className="form-group">
              <label className="form-label">{t.shopId}</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  placeholder={t.enterShopId}
                  value={shopId} 
                  onChange={(e) => setShopId(e.target.value.toUpperCase())}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t.password} / {t.pin}</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="Enter Password (e.g. 1234)"
                  value={pinOrPassword} 
                  onChange={(e) => setPinOrPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>
              <UserCheck size={20} />
              <span>{t.ownerLogin}</span>
            </button>
          </form>
        )}

        {/* WORKER LOGIN FORM */}
        {activeTab === 'worker' && (
          <form onSubmit={handleWorkerLogin}>
            <div className="form-group">
              <label className="form-label">{t.shopId}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t.enterShopId}
                value={shopId} 
                onChange={(e) => setShopId(e.target.value.toUpperCase())}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.phone} or {t.pin}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter Phone (e.g. 9811122233) or PIN (1111)"
                value={phoneOrName} 
                onChange={(e) => setPhoneOrName(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>
              <UserCheck size={20} />
              <span>{t.workerLogin}</span>
            </button>
          </form>
        )}

        {/* CUSTOMER LOGIN FORM */}
        {activeTab === 'customer' && (
          <form onSubmit={handleCustomerLogin}>
            <div className="form-group">
              <label className="form-label">{t.shopId}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t.enterShopId}
                value={shopId} 
                onChange={(e) => setShopId(e.target.value.toUpperCase())}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.phone} or PIN</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter Phone (e.g. 9988776655) or PIN (1234)"
                value={phoneOrName} 
                onChange={(e) => setPhoneOrName(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>
              <UserCheck size={20} />
              <span>{t.customerLogin}</span>
            </button>
          </form>
        )}

        {/* REGISTER NEW SHOP */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterShop}>
            <div className="form-group">
              <label className="form-label">Generated Shop ID (Unique)</label>
              <input 
                type="text" 
                className="form-input" 
                value={newShopId} 
                onChange={(e) => setNewShopId(e.target.value.toUpperCase())}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.shopName}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Ganesh Grocery Store"
                value={newShopName} 
                onChange={(e) => setNewShopName(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.ownerName}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Owner Full Name"
                value={newOwnerName} 
                onChange={(e) => setNewOwnerName(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.phone}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Owner Phone Number"
                value={newPhone} 
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Set Password / PIN</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Create Password"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>
              <PlusCircle size={20} />
              <span>{t.registerShop}</span>
            </button>
          </form>
        )}

        {/* QUICK DEMO SHORTCUTS */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a5b4fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} />
            <span>{t.demoLogins}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 6px' }} onClick={() => handleQuickDemo('owner')}>
              🔑 {t.demoOwner}
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 6px' }} onClick={() => handleQuickDemo('worker')}>
              👷 {t.demoWorker}
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 6px' }} onClick={() => handleQuickDemo('customer')}>
              🛒 {t.demoCustomer}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
