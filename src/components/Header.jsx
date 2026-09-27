import React from 'react';
import { languages } from '../languages';
import { Store as StoreIcon, Globe, LogOut, UserCheck } from 'lucide-react';

export const Header = ({ currentLang, setLang, currentUser, onLogout }) => {
  const t = languages[currentLang] || languages.en;

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon">
          <StoreIcon size={22} />
        </div>
        <div>
          <div className="brand-title">{t.appName}</div>
          <div className="brand-subtitle">{t.tagline}</div>
        </div>
      </div>

      <div className="header-actions">
        {/* Language Selector */}
        <div className="lang-container" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={16} color="#a5b4fc" />
          <select 
            className="lang-select" 
            value={currentLang} 
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="hi">हिंदी</option>
            <option value="te">తెలుగు</option>
          </select>
        </div>

        {/* Current User & Shop ID Badge */}
        {currentUser && (
          <div className="user-header-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="shop-badge">
              <span>
                {currentUser.role === 'owner' && '👑 '}
                {currentUser.role === 'worker' && '👨‍🔧 '}
                {currentUser.role === 'customer' && '👤 '}
                {currentUser.shopId}
              </span>
            </div>

            <button className="btn btn-secondary logout-btn" onClick={onLogout} title={t.logout}>
              <LogOut size={16} />
              <span className="logout-text">{t.logout}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
