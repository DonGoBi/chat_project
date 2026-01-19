import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import SideNav from './components/SideNav';
import ChatRoom from './components/ChatRoom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { authFetch, getToken } from './auth/auth';

// 알림 기능 추가
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function App() {
  const [currentView, setCurrentView] = useState({ type: 'welcome', id: null });
  const [loginUser, setLoginUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // 사이드바 새로고침 트리거용 키
  const navigate = useNavigate();
  const location = useLocation();
  const clientRef = useRef(null); // 알림용 전역 소켓

  const handleSelectRoom = useCallback((roomId) => {
    setCurrentView({ type: 'room', id: roomId });
  }, []);
  
  const handleExitRoom = useCallback(() => {
    setCurrentView({ type: 'welcome', id: null });
    setRefreshKey(prev => prev + 1);
  }, []);

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
             console.error("사용자 정보 조회 실패");
             if (location.pathname !== '/login') navigate('/login');
        }
      } catch (error) {
        console.error("사용자 정보 조회 오류:", error);
        if (location.pathname !== '/login') navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, location.pathname]);

  // 전역 알림 소켓 연결 (로그인 유저가 있을 때)
  useEffect(() => {
    if (!loginUser) return;

    const connectGlobalSocket = () => {
      const client = new Client({
        webSocketFactory: () => new SockJS(`http://localhost:8087/ws-stomp?token=${getToken()}`),
        onConnect: () => {
          console.log('전역 웹소켓 연결 성공');
          // 알림 구독
          client.subscribe("/user/queue/alarm", (message) => {
            const alarm = JSON.parse(message.body);
            
            // 본인이 보낸 알림은 제외
            if (alarm.senderName === loginUser.name) return;

            toast.info(
              <div style={{ cursor: 'pointer' }}>
                <strong>{alarm.senderName}</strong>: {alarm.content}
                <div style={{ fontSize: '0.8em', color: '#555', marginTop: '4px' }}>👆 클릭하여 이동</div>
              </div>, 
              { 
                position: "bottom-right",
                onClick: () => handleSelectRoom(alarm.roomId)
              }
            );
          });
        },
        onStompError: (frame) => {
          console.error('전역 소켓 오류: ' + frame.headers['message']);
        },
      });

      client.activate();
      clientRef.current = client;
    };

    connectGlobalSocket();

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [loginUser, handleSelectRoom]); 


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
        throw new Error('1:1 채팅방 찾기 또는 생성 실패');
      }

      const room = await response.json();
      setCurrentView({ type: 'room', id: room.id });

    } catch (error) {
      console.error("친구 채팅방 열기 오류:", error);
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
                    refreshKey={refreshKey}
                  />

                  <main className="main-content">
                    {currentView.type === 'welcome' && (
                      <header className="main-header">
                        <h1>반갑습니다, {loginUser.name}님!</h1>
                      </header>
                    )}
                    <div className="content-body">
                      {currentView.type === 'welcome' && <p>채팅을 시작하려면 목록에서 선택하세요.</p>}
                      {currentView.type === 'room' && 
                        <ChatRoom 
                          roomId={currentView.id} 
                          loginUser={loginUser} 
                          onExitRoom={handleExitRoom}
                        />
                      }
                      {currentView.type === 'friend' && <p>선택된 친구 ID: {currentView.id}</p>}
                    </div>
                  </main>
                  </>
              )}
              {/* 전역 알림 컨테이너 */}
              <ToastContainer />
            </div>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
