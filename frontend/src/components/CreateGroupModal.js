import React, { useState, useEffect } from 'react';
import './CreateGroupModal.css';
import { authFetch } from '../auth/auth';

const CreateGroupModal = ({ isOpen, onClose, loginUser, onRoomCreated }) => {
    const [step, setStep] = useState(1); // 1: Select Users, 2: Check Duplicates, 3: Set Name
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [existingRooms, setExistingRooms] = useState([]);
    const [roomName, setRoomName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            resetState();
        }
    }, [isOpen]);

    const resetState = () => {
        setStep(1);
        setSelectedUsers([]);
        setSearchTerm("");
        setExistingRooms([]);
        setRoomName("");
    };

    const fetchUsers = async () => {
        try {
            const response = await authFetch('http://localhost:8087/api/users');
            if (response.ok) {
                const data = await response.json();
                // Filter out current user
                setUsers(data.filter(u => u.loginId !== loginUser.loginId));
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleUserSelect = (user) => {
        if (selectedUsers.some(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleRemoveUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    };

    const handleNext = async () => {
        if (selectedUsers.length === 0) {
            alert("Please select at least one friend.");
            return;
        }

        setLoading(true);
        try {
            const response = await authFetch('http://localhost:8087/api/chatRoom/userIds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: loginUser.loginId,
                    userIds: selectedUsers.map(u => u.loginId)
                })
            });

            if (response.ok) {
                const rooms = await response.json();
                if (rooms && rooms.length > 0) {
                    setExistingRooms(rooms);
                    setStep(2);
                } else {
                    setStep(3);
                }
            } else {
                // Fallback if API fails or returns unexpected
                setStep(3);
            }
        } catch (error) {
            console.error("Error checking existing rooms", error);
            setStep(3);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const response = await authFetch('http://localhost:8087/api/chatRoom/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: loginUser.loginId,
                    userIds: selectedUsers.map(u => u.loginId),
                    roomName: roomName
                })
            });

            if (response.ok) {
                const room = await response.json();
                onRoomCreated(room.id);
                onClose();
            } else {
                alert("Failed to create room.");
            }
        } catch (error) {
            console.error("Error creating room", error);
            alert("Error creating room.");
        } finally {
            setLoading(false);
        }
    };

    const handleEnterExistingRoom = (roomId) => {
        onRoomCreated(roomId);
        onClose();
    };

    if (!isOpen) return null;

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h5 className="modal-title">
                        {step === 1 && "Select Friends"}
                        {step === 2 && "Existing Rooms Found"}
                        {step === 3 && "Create Group Chat"}
                    </h5>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {step === 1 && (
                        <>
                            <div className="selected-users-preview">
                                {selectedUsers.map(user => (
                                    <span key={user.id} className="selected-user-tag">
                                        {user.name}
                                        <span className="remove-tag-btn" onClick={() => handleRemoveUser(user.id)}>&times;</span>
                                    </span>
                                ))}
                            </div>
                            <input 
                                type="text" 
                                className="search-bar" 
                                placeholder="Search friends..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="user-list">
                                {filteredUsers.map(user => (
                                    <div key={user.id} className="user-item" onClick={() => handleUserSelect(user)}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedUsers.some(u => u.id === user.id)}
                                            readOnly
                                        />
                                        <img src={user.profileImage || '/images/orgProfile.png'} alt={user.name} className="user-avatar" />
                                        <span className="user-name">{user.name}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="existing-rooms-list">
                            <p>Similar group chats already exist:</p>
                            {existingRooms.map(room => (
                                <div key={room.roomId} className="existing-room-item">
                                    <div className="existing-room-info">
                                        <span className="existing-room-name">{room.roomName || "Group Chat"}</span>
                                        <span className="existing-room-members">{room.memberCount} members</span>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => handleEnterExistingRoom(room.roomId)}>Enter</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="room-name-section">
                            <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Room Name (Optional)</label>
                            <input 
                                type="text" 
                                className="room-name-input"
                                placeholder="Enter room name..."
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                            />
                            <div style={{marginTop: '20px'}}>
                                <p>Members: {loginUser.name}, {selectedUsers.map(u => u.name).join(", ")}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    {step === 1 && (
                        <button className="btn btn-primary" onClick={handleNext} disabled={selectedUsers.length === 0}>
                            Next
                        </button>
                    )}
                    {step === 2 && (
                        <button className="btn btn-primary" onClick={() => setStep(3)}>
                            Create New Anyway
                        </button>
                    )}
                    {step === 3 && (
                        <button className="btn btn-primary" onClick={handleCreateRoom} disabled={loading}>
                            {loading ? "Creating..." : "Create"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
