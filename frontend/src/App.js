import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetches users from the Spring Boot API
    fetch('http://localhost:8087/api/users')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.toString());
        setLoading(false);
      });
  }, []); // The empty dependency array makes this effect run once on mount

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2>Chat Project</h2>
        <ul>
          <li>My Profile</li>
          <li>Friends</li>
          <li>Chat Rooms</li>
        </ul>
      </nav>
      <main className="main-content">
        <header className="main-header">
          <h1>Welcome!</h1>
        </header>
        <div className="content-body">
          <h2>User List from API</h2>
          {loading && <p>Loading users...</p>}
          {error && <p>Error fetching users: {error}</p>}
          <ul>
            {users.map(user => (
              <li key={user.id}>{user.name} ({user.email})</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
