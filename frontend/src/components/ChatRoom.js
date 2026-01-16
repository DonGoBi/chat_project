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
    const chatBoxRef = useRef(null);
    const clientRef = useRef(null); // useRef to hold the STOMP client

    // Effect for fetching historical messages
    useEffect(() => {
        if (!roomId) return;

        const fetchMessages = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await authFetch(`http://localhost:8087/api/chat/rooms/${roomId}/messages`);
                if (!response.ok) {
                    throw new Error('Failed to fetch messages.');
                }
                const data = await response.json();
                setMessages(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [roomId]);

    // Effect for WebSocket connection
    useEffect(() => {
        if (!roomId) return;

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
            allMessages.push(<p key="no-messages">No messages yet. Start the conversation!</p>);
        }
        
        return allMessages;
    };

    return (
        <div className="chat-container">
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
