import React, { useState } from 'react';
import './App.css';
import SideNav from './components/SideNav';
import ChatRoom from './components/ChatRoom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler'; // Import the redirect handler
import { Routes, Route } from 'react-router-dom';

function App() {
  const [currentView, setCurrentView] = useState({ type: 'welcome', id: null });

  // This will be fetched from an API in a future step, or stored in context
  const dummyUser = {
    id: 1, // Add user ID for API calls
    loginId: 'test', // Add loginId, which is used as sender
    name: 'JaeHyeong',
    profileImage: '/images/orgProfile.png'
  };

  const handleSelectRoom = (roomId) => {
    setCurrentView({ type: 'room', id: roomId });
  };

  const handleSelectFriend = async (friendLoginId) => {
    try {
      const response = await fetch('http://localhost:8087/api/chatRoom/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: dummyUser.loginId,
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
      // Optionally, show an error to the user
    }
  };


  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/redirect" element={<OAuth2RedirectHandler />} /> {/* Add route for redirect handler */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <div className="app-container">
              <SideNav 
                loginUser={dummyUser} 
                onSelectRoom={handleSelectRoom}
                onSelectFriend={handleSelectFriend}
              />

              <main className="main-content">
                <header className="main-header">
                  <h1>Welcome!</h1>
                </header>
                <div className="content-body">
                  {currentView.type === 'welcome' && <p>Main content area. Select a chat to begin.</p>}
                  {currentView.type === 'room' && <ChatRoom roomId={currentView.id} loginUser={dummyUser} />}
                  {currentView.type === 'friend' && <p>Selected Friend ID: {currentView.id}</p>}
                </div>
              </main>
            </div>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
