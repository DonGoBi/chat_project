import React, { useState, useEffect, useRef } from 'react';
import './ChatRoom.css';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { authFetch, getToken } from '../auth/auth';

function ChatRoom({ roomId, loginUser }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const chatBoxRef = useRef(null);
    const clientRef = useRef(null);

    // Effect for fetching historical messages and room info
    useEffect(() => {
        if (!roomId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch room info (for name)
                const roomResponse = await authFetch(`http://localhost:8087/api/chatRoom/${roomId}`);
                if (roomResponse.ok) {
                    const roomData = await roomResponse.json();
                    setRoomInfo(roomData);
                }

                // Fetch participants
                const partResponse = await authFetch(`http://localhost:8087/api/chatRoom/${roomId}/participants`);
                if (partResponse.ok) {
                    const partData = await partResponse.json();
                    setParticipants(partData);
                } else {
                    console.error("Failed to fetch participants");
                }

                // Fetch messages
                const msgResponse = await authFetch(`http://localhost:8087/api/chat/rooms/${roomId}/messages`);
                if (!msgResponse.ok) {
                    throw new Error('Failed to fetch messages.');
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
        setShowParticipants(false); // Reset dropdown when room changes
    }, [roomId]);

    // Effect for WebSocket connection
    useEffect(() => {
        if (!roomId || isNaN(roomId)) return;

        const connect = () => {
            const client = new Client({
                webSocketFactory: () => new SockJS(`http://localhost:8087/ws-stomp?token=${getToken()}`),
                onConnect: () => {
                    console.log('Connected to WebSocket');
                    client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                        const receivedMessage = JSON.parse(message.body);
                        setMessages(prevMessages => [...prevMessages, receivedMessage]);
                    });
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                },
            });

            client.activate();
            clientRef.current = client;
        };

        connect();

        // Cleanup function to disconnect on component unmount or roomId change
        return () => {
            if (clientRef.current) {
                console.log('Disconnecting from WebSocket');
                clientRef.current.deactivate();
            }
        };
    }, [roomId]);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);


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

    const renderChatBoxContent = () => {
        if (loading) return <p>Loading messages...</p>;
        if (error) return <p>Error: {error}</p>;
        
        const allMessages = messages.map((msg, index) => (
            <div 
                key={msg.id || `msg-${index}`} // Use message ID if available
                className={`chat-message-container ${msg.sender === loginUser.loginId ? 'self' : 'other'}`}
            >
                <span className="sender-name">{msg.senderName}</span>
                <div className="chat-message">
                    {msg.message}
                </div>
            </div>
        ));

        if (messages.length === 0) {
            allMessages.push(<p key="no-messages">대화를 시작하세요!</p>);
        }
        
        return allMessages;
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="room-info-section" onClick={() => setShowParticipants(!showParticipants)}>
                    <h2 className="room-title">{roomInfo?.roomName || 'Chat Room'}</h2>
                    <span className="participant-summary">({participants.length}명)</span>
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
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <button onClick={handleSendMessage} className="send-btn">Send</button>
            </div>
        </div>
    );
}

export default ChatRoom;
