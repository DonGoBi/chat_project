import React, { useState, useEffect, useRef } from 'react';
import './ChatRoom.css';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { authFetch, getToken } from '../auth/auth';

function ChatRoom({ roomId, loginUser, onExitRoom }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [showParticipants, setShowParticipants] = useState(false);
    
    const chatBoxRef = useRef(null);
    const clientRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- 유틸리티 ---
    const linkify = (text) => {
        if (!text) return text;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="chat-link">
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // --- 생명주기 및 효과 (Effects) ---
    // 이전 메시지 및 방 정보 조회
    useEffect(() => {
        if (!roomId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 방 정보 조회 (이름 등)
                const roomResponse = await authFetch(`http://localhost:8087/api/chatRoom/${roomId}`);    
                if (roomResponse.ok) {
                    const roomData = await roomResponse.json();
                    setRoomInfo(roomData);
                }

                // 참여자 목록 조회
                const partResponse = await authFetch(`http://localhost:8087/api/chatRoom/${roomId}/participants`);
                if (partResponse.ok) {
                    const partData = await partResponse.json();
                    setParticipants(partData);
                } else {
                    console.error("참여자 목록을 불러오지 못했습니다.");
                }

                // 메시지 목록 조회
                const msgResponse = await authFetch(`http://localhost:8087/api/chat/rooms/${roomId}/messages`);
                if (!msgResponse.ok) {
                    throw new Error('메시지 목록을 불러오지 못했습니다.');
                }
                const msgData = await msgResponse.json();
                setMessages(msgData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        setShowParticipants(false); 
    }, [roomId]);

    // 웹소켓 연결 설정
    useEffect(() => {
        if (!roomId || isNaN(roomId)) return;

        const connect = () => {
            const client = new Client({
                webSocketFactory: () => new SockJS(`http://localhost:8087/ws-stomp?token=${getToken()}`),
                onConnect: () => {
                    console.log('웹소켓 연결 성공');
                    client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                        const receivedMessage = JSON.parse(message.body);
                        
                        // 타이핑 상태 등 추가 기능 처리 가능
                        if (receivedMessage.type === 'TYPING') {
                             // TODO: 타이핑 인디케이터 로직 구현 예정
                             return;
                        }

                        setMessages(prevMessages => [...prevMessages, receivedMessage]);
                    });
                },
                onStompError: (frame) => {
                    console.error('브로커 오류 보고: ' + frame.headers['message']);
                    console.error('상세 내용: ' + frame.body);
                },
            });

            client.activate();
            clientRef.current = client;
        };

        connect();

        // 컴포넌트 언마운트 또는 방 변경 시 연결 해제
        return () => {
            if (clientRef.current) {
                console.log('웹소켓 연결 종료');
                clientRef.current.deactivate();
            }
        };
    }, [roomId]);

    // 자동 스크롤 하단 이동
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);


    // --- 이벤트 핸들러 ---
    const handleSendMessage = () => {
        if (newMessage.trim() === '' || !clientRef.current || !clientRef.current.connected) {
            return;
        }

        const chatMessage = {
            type: 'TALK',
            roomId: roomId,
            sender: loginUser.loginId,
            senderName: loginUser.name,
            message: newMessage,
        };

        clientRef.current.publish({
            destination: '/pub/chat/message',
            body: JSON.stringify(chatMessage),
        });

        setNewMessage('');
    };

    const handleFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("chatFile", file);
        formData.append("roomId", roomId);
        formData.append("sender", loginUser.loginId);

        try {
            const token = getToken();
            const uploadRes = await fetch('http://localhost:8087/api/chat/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type은 브라우저가 자동 설정(boundary 포함)하도록 제외
                },
                body: formData
            });

            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                throw new Error(errText || '파일 업로드에 실패했습니다.');
            }

            const messageDto = await uploadRes.json();
            
            // 웹소켓을 통해 파일 메시지 발행
            if (clientRef.current && clientRef.current.connected) {
                clientRef.current.publish({
                    destination: '/pub/chat/message',
                    body: JSON.stringify(messageDto)
                });
            }

        } catch (err) {
            alert(`파일 업로드 오류: ${err.message}`);
        } finally {
            event.target.value = ''; // 입력창 초기화
        }
    };

    const handleExitRoom = async () => {
        if (!window.confirm("정말로 채팅방을 나가시겠습니까?")) return;

        try {
            const response = await authFetch('http://localhost:8087/api/chatRoom', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    userId: loginUser.loginId,
                    type: roomInfo?.type
                })
            });

            if (response.ok) {
                // 퇴장 메시지 전송 (그룹 채팅방인 경우에만)
                if (roomInfo?.type !== 'PRIVATE' && clientRef.current && clientRef.current.connected) {
                    const leaveMessage = {
                        type: 'LEAVE',
                        roomId: roomId,
                        sender: loginUser.loginId,
                        senderName: loginUser.name,
                        roomType: roomInfo?.type,
                        message: `${loginUser.name} 님이 채팅방에 나가셨습니다.`
                    };
                    clientRef.current.publish({
                        destination: '/pub/chat/message',
                        body: JSON.stringify(leaveMessage),
                    });
                }
                
                // 페이지 새로고침 대신 부모에게 알림 (목록 갱신 및 뷰 초기화)
                if (onExitRoom) onExitRoom();
            } else {
                alert("방 나가기에 실패했습니다.");
            }
        } catch (err) {
            console.error(err);
        }
    }


    // --- 렌더러 (UI 출력) ---
    const renderChatBoxContent = () => {
        if (loading) return <p>메시지를 불러오는 중...</p>;
        if (error) return <p>오류 발생: {error}</p>;
        
        const allMessages = messages.map((msg, index) => {
            // 시스템 메시지 처리 (퇴장, 초대)
            if (msg.type === 'LEAVE' || msg.type === 'INVITE') {
                return (
                    <div key={msg.id || `msg-${index}`} className="chat-event-message">
                        {msg.message}
                    </div>
                );
            }

            // 일반 메시지 및 파일 메시지 처리
            const isSelf = msg.sender === loginUser.loginId;
            
            // 파일 상대 경로를 절대 경로로 수정
            const fullFileUrl = msg.fileUrl && !msg.fileUrl.startsWith('http') 
                ? `http://localhost:8087${msg.fileUrl}` 
                : msg.fileUrl;

            return (
                <div 
                    key={msg.id || `msg-${index}`} 
                    className={`chat-message-container ${isSelf ? 'self' : 'other'}`}
                >
                    {!isSelf && <span className="sender-name">{msg.senderName}</span>}
                    
                    <div className="chat-message">
                        {msg.type === 'FILE' ? (
                            msg.fileType && msg.fileType.startsWith('image/') ? (
                                <img 
                                    src={fullFileUrl} 
                                    alt="업로드 이미지" 
                                    className="chat-image" 
                                    onClick={() => window.open(fullFileUrl, '_blank')}
                                />
                            ) : (
                                <a href={fullFileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                                    📁 {msg.fileName || '파일 다운로드'}
                                </a>
                            )
                        ) : (
                            linkify(msg.message)
                        )}
                    </div>
                </div>
            );
        });

        if (messages.length === 0) {
            allMessages.push(<p key="no-messages" style={{textAlign:'center', color:'#888', marginTop:'20px'}}>대화를 시작하세요!</p>);
        }
        
        return allMessages;
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="room-info-section" onClick={() => setShowParticipants(!showParticipants)}>
                    <h2 className="room-title">{roomInfo?.roomName || '채팅방'}</h2>
                    <span className="participant-summary">({participants.length}명)</span>
                </div>

                <div className="header-actions">
                     <button className="exit-btn" onClick={handleExitRoom} title="나가기">
                        🗑️
                     </button>
                </div>
                
                {showParticipants && (
                    <div className="participants-dropdown">
                        <div className="dropdown-header">참여자 목록</div>
                        <ul className="participant-list">
                            {participants.map(p => (
                                <li key={p.loginId} className="participant-item">
                                    <img src={p.profileImage || '/images/orgProfile.png'} alt={p.name} className="participant-img" />
                                    <span className="participant-name">
                                        {p.name} {p.loginId === loginUser.loginId && '(나)'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="chat-box" ref={chatBoxRef}>
                {renderChatBoxContent()}
            </div>
            
            <div className="chat-input-area">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    style={{display: 'none'}} 
                />
                <button className="file-btn" onClick={handleFileSelect} title="파일 전송">
                    📎
                </button>
                
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <button onClick={handleSendMessage} className="send-btn">전송</button>
            </div>
        </div>
    );
}

export default ChatRoom;
