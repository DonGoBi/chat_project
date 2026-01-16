import React, { useState, useEffect } from 'react';
import './SideNav.css';
import CreateGroupModal from './CreateGroupModal';
import { authFetch, logout } from '../auth/auth';
import { useNavigate } from 'react-router-dom';

// A placeholder user for development when loginUser prop is not available
const defaultUser = {
    id: 0,
    name: 'Guest',
    profileImage: '/images/orgProfile.png'
};

function SideNav({ 
    loginUser = defaultUser, 
    onSelectRoom = () => {}, // Default to an empty function
    onSelectFriend = () => {} // Default to an empty function
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [chatRooms, setChatRooms] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const navigate = useNavigate();

    const fetchSideNavData = async () => {
        // We need a valid user to fetch data
        if (!loginUser || !loginUser.loginId) {
            setLoading(false);
            setError("Login user information is not available.");
            return;
        }

        setLoading(true);
        try {
            const [roomsResponse, friendsResponse] = await Promise.all([
                authFetch(`http://localhost:8087/api/chatRoom/list?userId=${loginUser.loginId}`),
                authFetch('http://localhost:8087/api/users')
            ]);

            if (!roomsResponse.ok || !friendsResponse.ok) {
                throw new Error('Failed to fetch data from the server.');
            }

            const roomsData = await roomsResponse.json();
            const friendsData = await friendsResponse.json();

            setChatRooms(roomsData);
            // Filter out the current user from the friends list
            setFriends(friendsData.filter(friend => friend.loginId !== loginUser.loginId));
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSideNavData();
    }, [loginUser]); // Re-run effect if loginUser changes

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleRoomCreated = (roomId) => {
        fetchSideNavData(); // Refresh list
        onSelectRoom(roomId); // Open the new room
    };

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate('/login');
    };

    const renderList = (title, list, type) => {
        if (loading) return <p style={{padding: '0 10px', fontSize: '12px'}}>Loading {title}...</p>;
        if (error) return <p style={{padding: '0 10px', fontSize: '12px', color: '#ff6b6b'}}>Error: {error}</p>;
        if (list.length === 0) return <p style={{padding: '0 10px', fontSize: '12px', color: '#888'}}>No {title} found.</p>;

        return list.map(item => {
            if (type === 'chat') {
                return (
                    <div key={item.id} className="chatting-item" onDoubleClick={() => onSelectRoom(item.id)}>
                        <div className="chatting-display">
                            <span className="room-name">{item.roomName}</span>
                        </div>
                    </div>
                );
            }
            if (type === 'friend') {
                return (
                    <div key={item.id} className="friends-item" onDoubleClick={() => onSelectFriend(item.loginId)}>
                        <img src={item.profileImage || '/images/orgProfile.png'} alt={item.name} className="friends-profile-img" />
                        <span className="friends-name">{item.name}</span>
                    </div>
                );
            }
            return null;
        });
    };

    return (
        <nav className={`sidebar-nav ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="menu-toggle" onClick={toggleSidebar}>
                ☰
            </div>

            <div className="menu-items-container">
                <div className="menu-item">
                    <span className="icon">💬</span>
                    <span className="menu-label">채팅</span>
                    {!isCollapsed && (
                        <span className="group-btn" onClick={() => setIsGroupModalOpen(true)}>
                            <img src="/images/group.png" alt="Group Chat"/>
                        </span>
                    )}
                </div>
            </div>

            <div className="chatting-list">
                {renderList('chats', chatRooms, 'chat')}
            </div>

            <div className="menu-items-container">
                <div className="menu-item">
                    <span className="icon">🧑‍🤝‍🧑</span>
                    <span className="menu-label">친구</span>
                </div>
            </div>

            <div className="friends-list">
                {renderList('friends', friends, 'friend')}
            </div>

            <div className="user-section">
                <div className="user-info">
                    <img src={loginUser.profileImage || '/images/orgProfile.png'} alt="Profile" />
                    <span className="user-info-name">{loginUser.name}</span>
                </div>

                <div className="login-buttons">
                    <div onClick={handleLogout} className="logout-button" style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px'}}>
                        <span className="icon">🔒</span>
                        {!isCollapsed && <span className="menu-label">로그아웃</span>}
                    </div>
                </div>
            </div>

            <CreateGroupModal 
                isOpen={isGroupModalOpen} 
                onClose={() => setIsGroupModalOpen(false)}
                loginUser={loginUser}
                onRoomCreated={handleRoomCreated}
            />
        </nav>
    );
}

export default SideNav;