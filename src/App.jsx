import React, { useState, useEffect } from 'react';
import { initStore, Store } from './store';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { OwnerDashboard } from './components/OwnerDashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';

export function App() {
  const [currentLang, setLang] = useState('en');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initStore();
    const user = Store.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    Store.logout();
    setCurrentUser(null);
  };

  return (
    <div className="app-container">
      <Header 
        currentLang={currentLang} 
        setLang={setLang} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />

      <main style={{ flex: 1 }}>
        {!currentUser ? (
          <AuthModal 
            currentLang={currentLang} 
            onLoginSuccess={handleLoginSuccess} 
          />
        ) : (
          <>
            {currentUser.role === 'owner' && (
              <OwnerDashboard currentUser={currentUser} currentLang={currentLang} />
            )}
            {currentUser.role === 'worker' && (
              <WorkerDashboard currentUser={currentUser} currentLang={currentLang} />
            )}
            {currentUser.role === 'customer' && (
              <CustomerDashboard currentUser={currentUser} currentLang={currentLang} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
