import React, { useState, useEffect } from 'react';
import './SideNav.css';

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

    useEffect(() => {
        // We need a valid user to fetch data
        if (!loginUser || loginUser.id === 0) {
            setLoading(false);
            setError("Login user information is not available.");
            return;
        }

        const fetchSideNavData = async () => {
            setLoading(true);
            try {
                const [roomsResponse, friendsResponse] = await Promise.all([
                    fetch(`http://localhost:8087/api/chatRoom/list?userId=${loginUser.id}`),
                    fetch('http://localhost:8087/api/users')
                ]);

                if (!roomsResponse.ok || !friendsResponse.ok) {
                    throw new Error('Failed to fetch data from the server.');
                }

                const roomsData = await roomsResponse.json();
                const friendsData = await friendsResponse.json();

                setChatRooms(roomsData);
                // Filter out the current user from the friends list
                setFriends(friendsData.filter(friend => friend.id !== loginUser.id));
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSideNavData();
    }, [loginUser]); // Re-run effect if loginUser changes

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const renderList = (title, list, type) => {
        if (loading) return <p>Loading {title}...</p>;
        if (error) return <p>Error: {error}</p>;
        if (list.length === 0) return <p>No {title} found.</p>;

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
                        <span className="group-btn">
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
                    <a href="/logout">
                        <span className="icon">🔒</span>
                        <span className="menu-label">로그아웃</span>
                    </a>
                </div>
            </div>
        </nav>
    );
}

export default SideNav;
