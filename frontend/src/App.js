import React, { useState } from 'react';
import './App.css';
import SideNav from './components/SideNav';
import ChatRoom from './components/ChatRoom'; // Import the new component

function App() {
  const [currentView, setCurrentView] = useState({ type: 'welcome', id: null });

  // This will be fetched from an API in a future step
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
    <div className="app-container">
      {/* Pass down the event handlers to the SideNav component */}
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
          {/* Display content based on the current view state */}
          {currentView.type === 'welcome' && <p>Main content area. Select a chat to begin.</p>}
          {currentView.type === 'room' && <ChatRoom roomId={currentView.id} loginUser={dummyUser} />}
          {currentView.type === 'friend' && <p>Selected Friend ID: {currentView.id}</p>}
        </div>
      </main>
    </div>
  );
}

export default App;
