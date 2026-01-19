import React, { useState, useEffect } from 'react';
import './SideNav.css';
import CreateGroupModal from './CreateGroupModal';
import { authFetch, logout } from '../auth/auth';
import { useNavigate } from 'react-router-dom';

// 개발 중 로그인 유저 정보가 없을 때 사용할 기본값
const defaultUser = {
    id: 0,
    name: 'Guest',
    profileImage: '/images/orgProfile.png'
};

function SideNav({ 
    loginUser = defaultUser, 
    onSelectRoom = () => {}, 
    onSelectFriend = () => {},
    refreshKey = 0 // 새로고침 트리거용 키
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [chatRooms, setChatRooms] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const navigate = useNavigate();

    const fetchSideNavData = async () => {
        // 유효한 사용자 정보가 필요함
        if (!loginUser || !loginUser.loginId) {
            setLoading(false);
            setError("로그인 사용자 정보가 없습니다.");
            return;
        }

        setLoading(true);
        try {
            const [roomsResponse, friendsResponse] = await Promise.all([
                authFetch(`http://localhost:8087/api/chatRoom/list?userId=${loginUser.loginId}`),
                authFetch('http://localhost:8087/api/users')
            ]);

            if (!roomsResponse.ok || !friendsResponse.ok) {
                throw new Error('서버에서 데이터를 불러오는데 실패했습니다.');
            }

            const roomsData = await roomsResponse.json();
            const friendsData = await friendsResponse.json();

            setChatRooms(roomsData);
            // 친구 목록에서 본인은 제외
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
    }, [loginUser, refreshKey]); // 로그인 유저 변경 또는 refreshKey 변경 시 재실행

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleRoomCreated = (roomId) => {
        fetchSideNavData(); // 목록 새로고침
        onSelectRoom(roomId); // 생성된 방 열기
    };

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate('/login');
    };

    const renderList = (title, list, type) => {
        if (loading) return <p style={{padding: '0 10px', fontSize: '12px'}}>{title} 불러오는 중...</p>;
        if (error) return <p style={{padding: '0 10px', fontSize: '12px', color: '#ff6b6b'}}>오류: {error}</p>;
        if (list.length === 0) return <p style={{padding: '0 10px', fontSize: '12px', color: '#888'}}>{title} 없음.</p>;

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
                            <img src="/images/group.png" alt="그룹 채팅 생성"/>
                        </span>
                    )}
                </div>
            </div>

            <div className="chatting-list">
                {renderList('채팅방', chatRooms, 'chat')}
            </div>

            <div className="menu-items-container">
                <div className="menu-item">
                    <span className="icon">🧑‍🤝‍🧑</span>
                    <span className="menu-label">친구</span>
                </div>
            </div>

            <div className="friends-list">
                {renderList('친구', friends, 'friend')}
            </div>

            <div className="user-section">
                <div className="user-info">
                    <img src={loginUser.profileImage || '/images/orgProfile.png'} alt="프로필" />
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