import React, { useState, useEffect } from 'react';
import './App.css';
import SideNav from './components/SideNav';
import ChatRoom from './components/ChatRoom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { authFetch, getToken } from './auth/auth';

function App() {
  const [currentView, setCurrentView] = useState({ type: 'welcome', id: null });
  const [loginUser, setLoginUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      // 토큰이 없으면 시도하지 않음
      if (!getToken()) {
        setLoading(false);
        return;
      }

      try {
        const response = await authFetch('http://localhost:8087/api/users/me');
        if (response.ok) {
          const user = await response.json();
          setLoginUser(user);
        } else {
             console.error("Failed to fetch user");
             if (location.pathname !== '/login') navigate('/login');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        if (location.pathname !== '/login') navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, location.pathname]);

  const handleSelectRoom = (roomId) => {
    setCurrentView({ type: 'room', id: roomId });
  };

  const handleSelectFriend = async (friendLoginId) => {
    try {
      if (!loginUser) return;
      const response = await authFetch('http://localhost:8087/api/chatRoom/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: loginUser.loginId,
          friendId: friendLoginId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find or create a private chat room.');
      }

      const room = await response.json();
      setCurrentView({ type: 'room', id: room.id });

    } catch (error) {
      console.error("Error opening chat with friend:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/redirect" element={<OAuth2RedirectHandler />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <div className="app-container">
              {loginUser && (
                  <>
                  <SideNav 
                    loginUser={loginUser} 
                    onSelectRoom={handleSelectRoom}
                    onSelectFriend={handleSelectFriend}
                  />

                  <main className="main-content">
                    <header className="main-header">
                      <h1>Welcome, {loginUser.name}!</h1>
                    </header>
                    <div className="content-body">
                      {currentView.type === 'welcome' && <p>Select a chat to begin.</p>}
                      {currentView.type === 'room' && <ChatRoom roomId={currentView.id} loginUser={loginUser} />}
                      {currentView.type === 'friend' && <p>Selected Friend ID: {currentView.id}</p>}
                    </div>
                  </main>
                  </>
              )}
            </div>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
