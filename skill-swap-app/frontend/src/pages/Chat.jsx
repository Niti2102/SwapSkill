import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'

const Chat = () => {
  const { user } = useAuth()
  const { socket, updateNotificationCount } = useSocket()
  const [searchParams] = useSearchParams()
  const [matches, setMatches] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMatches()
    fetchUnreadCounts()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id)
      // Mark messages as read when selecting a conversation
      markMessagesAsRead(selectedUser._id)
    }
  }, [selectedUser])

  // Auto-select user from URL parameter
  useEffect(() => {
    const userIdFromUrl = searchParams.get('userId')
    if (userIdFromUrl && matches.length > 0) {
      const userFromUrl = matches.find(match => match._id === userIdFromUrl)
      if (userFromUrl) {
        setSelectedUser(userFromUrl)
      }
    }
  }, [searchParams, matches])
  
  // Update global notification count when chat page is opened
  useEffect(() => {
    if (user) {
      // Refresh notification counts when user enters chat page
      const updateGlobalNotificationCount = async () => {
        try {
          const response = await axios.get('/api/notifications/counts')
          console.log('Refreshed notification counts on chat page:', response.data)
          updateNotificationCount('messages', response.data.messages)
          updateNotificationCount('meetings', response.data.meetings)
        } catch (error) {
          console.error('Error updating global notification count:', error)
        }
      }
      updateGlobalNotificationCount()
    }
  }, [user])
  
  // Socket.IO listeners for real-time messages
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        const { message } = data
        
        // If the message is for the currently selected conversation, add it to messages
        if (selectedUser && 
            ((message.sender.id === selectedUser._id && message.receiver === user._id) ||
             (message.sender.id === user._id && message.receiver === selectedUser._id))) {
          setMessages(prev => [...prev, {
            _id: message.id,
            content: message.content,
            messageType: message.messageType,
            sender: message.sender,
            receiver: { _id: message.receiver },
            createdAt: message.createdAt
          }])
          
          // If the message is TO the current user and they're viewing the chat, mark as read immediately
          if (message.receiver === user._id && message.sender.id === selectedUser._id) {
            // Clear the unread count immediately for WhatsApp-like behavior
            setUnreadCounts(prev => ({
              ...prev,
              [selectedUser._id]: 0
            }))
            
            // Mark as read in the backend
            setTimeout(() => markMessagesAsRead(selectedUser._id), 100)
          }
        } else if (message.receiver === user._id) {
          // Update unread count for the sender only if message is TO current user
          setUnreadCounts(prev => ({
            ...prev,
            [message.sender.id]: (prev[message.sender.id] || 0) + 1
          }))
          
          // Immediately update global notification badge count
          updateNotificationCount('messages', notificationCounts.messages + 1)
          
          // Show enhanced toast notification with sender name and message preview
          toast.custom((t) => (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--bg-card)',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e5e5e5',
                maxWidth: '350px',
                minWidth: '280px'
              }}
            >
              {/* Sender Avatar */}
              <div style={{
                background: '#00a884',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {message.sender.name.charAt(0).toUpperCase()}
              </div>
              
              {/* Message Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '14px', 
                  marginBottom: '4px',
                  color: '#1f2937'
                }}>
                  {message.sender.name}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {message.content}
                </div>
              </div>
              
              {/* Message Icon */}
              <div style={{
                color: '#00a884',
                fontSize: '20px'
              }}>
                💬
              </div>
            </div>
          ), {
            duration: 4000,
            position: 'top-right'
          })
        }
      }
      
      socket.on('new_message', handleNewMessage)
      
      return () => {
        socket.off('new_message', handleNewMessage)
      }
    }
  }, [socket, selectedUser, user])
  
  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMatches = async () => {
    try {
      const response = await axios.get('/api/swipe/matches')
      setMatches(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching matches:', error)
      setLoading(false)
    }
  }

  const fetchUnreadCounts = async () => {
    try {
      const response = await axios.get('/api/chat/unread-count')
      const counts = {}
      response.data.forEach(item => {
        counts[item._id] = item.count
      })
      setUnreadCounts(counts)
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }

  const markMessagesAsRead = async (userId) => {
    try {
      // Get current unread count for this user before marking as read
      const currentUnreadForUser = unreadCounts[userId] || 0
      
      await axios.put(`/api/chat/mark-read/${userId}`)
      
      // Update local unread count immediately
      setUnreadCounts(prev => ({
        ...prev,
        [userId]: 0
      }))
      
      // Immediately decrease global badge count by the amount we just marked as read
      if (currentUnreadForUser > 0) {
        const newGlobalCount = Math.max(0, notificationCounts.messages - currentUnreadForUser)
        updateNotificationCount('messages', newGlobalCount)
      }
      
      // Update global notification count from backend as backup
      try {
        const response = await axios.get('/api/notifications/counts')
        updateNotificationCount('messages', response.data.messages)
      } catch (notifError) {
        console.error('Error updating message notification count:', notifError)
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(`/api/chat/conversation/${userId}`)
      setMessages(response.data)
      // Note: markMessagesAsRead is called separately in useEffect
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return

    try {
      const response = await axios.post('/api/chat/send', {
        receiverId: selectedUser._id,
        content: newMessage
      })
      
      setMessages(prev => [...prev, response.data.data])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading">Loading chat...</div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          <h1 style={{ 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px'
          }}>Chat 💬</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '16px' }}>
            Connect and exchange skills with your matched partners
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="card" style={{ 
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            padding: '60px 40px'
          }}>
            <div style={{ 
              fontSize: '5rem', 
              marginBottom: '24px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>🤝</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>No Matches to Chat With</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
              Start swiping to find people to chat with and share skills!
            </p>
            <button 
              className="btn"
              style={{ marginTop: '20px' }}
              onClick={() => window.location.href = '/swipe'}
            >
              Start Swiping
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', height: '600px' }}>
            {/* Modern Matches List */}
            <div style={{ 
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px',
              padding: '20px',
              height: '100%',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-md)'
            }}>
              <h3 style={{ 
                margin: '0 0 20px 0', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                <span style={{ fontSize: '20px' }}>💬</span> 
                <span>Your Matches</span>
                <span style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>({matches.length})</span>
              </h3>
              
              {matches.map((match) => {
                const unreadCount = unreadCounts[match._id] || 0
                const isSelected = selectedUser?._id === match._id
                
                return (
                  <div 
                    key={match._id}
                    onClick={() => {
                      // Immediately clear unread count for this user (WhatsApp behavior)
                      setUnreadCounts(prev => ({
                        ...prev,
                        [match._id]: 0
                      }))
                      
                      // Immediately update global badge count optimistically
                      if (unreadCount > 0) {
                        const newGlobalCount = Math.max(0, notificationCounts.messages - unreadCount)
                        updateNotificationCount('messages', newGlobalCount)
                      }
                      
                      // Select the user
                      setSelectedUser(match)
                      
                      // Mark messages as read (this will sync with backend)
                      if (unreadCount > 0) {
                        markMessagesAsRead(match._id)
                      }
                    }}
                    style={{
                      padding: '16px',
                      border: isSelected 
                        ? '2px solid var(--accent-primary)' 
                        : unreadCount > 0 
                          ? '2px solid var(--accent-error)' 
                          : '1px solid var(--border-primary)',
                      borderRadius: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))' 
                        : unreadCount > 0 
                          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))' 
                          : 'var(--bg-card-hover)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      boxShadow: unreadCount > 0 
                        ? '0 8px 25px rgba(239, 68, 68, 0.15)' 
                        : isSelected 
                          ? '0 8px 25px rgba(139, 92, 246, 0.2)' 
                          : 'var(--shadow-sm)',
                      transform: isSelected ? 'translateY(-2px)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Modern Avatar */}
                      <div style={{
                        background: unreadCount > 0 
                          ? 'linear-gradient(135deg, var(--accent-error), #dc2626)' 
                          : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        color: 'white',
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: '700',
                        border: unreadCount > 0 ? '3px solid var(--accent-error)' : 'none',
                        boxShadow: unreadCount > 0 
                          ? '0 0 0 4px rgba(239, 68, 68, 0.2), 0 8px 25px rgba(239, 68, 68, 0.3)' 
                          : '0 8px 25px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {match.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: '16px', 
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                          }}>{match.name}</h4>
                          {/* Notification Indicator */}
                          {unreadCount > 0 && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'var(--accent-error)',
                              animation: 'pulse 2s infinite',
                              flexShrink: 0,
                              boxShadow: '0 0 8px var(--accent-error)'
                            }} />
                          )}
                        </div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '13px', 
                          color: 'var(--text-muted)',
                          marginBottom: unreadCount > 0 ? '6px' : 0
                        }}>
                          {match.skillsKnown?.slice(0, 2).join(', ')}{match.skillsKnown?.length > 2 ? '...' : ''}
                        </p>
                        {/* New message indicator text */}
                        {unreadCount > 0 && (
                          <p style={{ 
                            margin: 0, 
                            fontSize: '11px', 
                            color: 'var(--accent-error)',
                            fontWeight: '600',
                            fontStyle: 'italic',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            display: 'inline-block'
                          }}>
                            {unreadCount === 1 ? 'New message' : `${unreadCount} new messages`}
                          </p>
                        )}
                      </div>
                      
                      {/* Status Indicators */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        {match.isPotentialMatch && (
                          <span style={{
                            background: '#ffc107',
                            color: '#000',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            Potential
                          </span>
                        )}
                        
                        {unreadCount > 0 && (
                          <span style={{
                            background: '#dc3545',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                        
                        {/* Online Status (simulated) */}
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: Math.random() > 0.5 ? '#28a745' : '#6c757d'
                        }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modern Chat Area */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {selectedUser ? (
                <>
                  {/* Modern Chat Header */}
                  <div style={{ 
                    borderBottom: '1px solid var(--border-primary)', 
                    padding: '20px 24px', 
                    background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      {/* Profile Avatar */}
                      <div style={{
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        color: 'white',
                        width: '48px',
                        height: '48px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '700',
                        boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)'
                      }}>
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Info */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '18px', 
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}>
                          {selectedUser.name}
                        </h3>
                        <div style={{ 
                          fontSize: '13px', 
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>Skills:</span>
                          {selectedUser.skillsKnown?.slice(0, 2).map((skill, index) => (
                            <span key={index} style={{
                              background: 'var(--accent-success)',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '6px 12px',
                        borderRadius: '20px'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--accent-success)',
                          animation: 'pulse 2s infinite'
                        }} />
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--accent-success)', 
                          fontWeight: '600'
                        }}>
                          Online
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '20px',
                    background: 'var(--bg-primary)',
                    backgroundImage: `
                      radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                      radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)
                    `
                  }}>
                    {messages.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        marginTop: '100px', 
                        color: 'var(--text-muted)',
                        background: 'var(--bg-card)',
                        padding: '40px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-primary)'
                      }}>
                        <div style={{ 
                          fontSize: '4rem', 
                          marginBottom: '20px',
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>💬</div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Start Your Conversation</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Send your first message to begin skill sharing!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMyMessage = message.sender._id === user._id
                        return (
                          <div 
                            key={message._id}
                            style={{
                              display: 'flex',
                              justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                              marginBottom: '8px',
                              padding: '0 12px'
                            }}
                          >
                            <div style={{
                              maxWidth: '70%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isMyMessage ? 'flex-end' : 'flex-start'
                            }}>
                              {/* Modern Message Bubble */}
                              <div style={{
                                background: isMyMessage 
                                  ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' 
                                  : 'var(--bg-card)',
                                color: isMyMessage ? 'white' : 'var(--text-primary)',
                                padding: '12px 16px',
                                borderRadius: isMyMessage 
                                  ? '20px 20px 6px 20px' 
                                  : '20px 20px 20px 6px',
                                border: isMyMessage ? 'none' : '1px solid var(--border-primary)',
                                boxShadow: isMyMessage 
                                  ? '0 4px 15px rgba(139, 92, 246, 0.3)' 
                                  : 'var(--shadow-md)',
                                position: 'relative',
                                wordBreak: 'break-word',
                                marginBottom: '4px',
                                maxWidth: '85%'
                              }}>
                                {/* Message content */}
                                <div style={{ 
                                  fontSize: '15px',
                                  lineHeight: '1.4',
                                  marginBottom: '6px',
                                  fontWeight: '400'
                                }}>
                                  {message.content}
                                </div>
                                
                                {/* Time and status */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: '6px',
                                  fontSize: '11px',
                                  color: isMyMessage ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)',
                                  marginTop: '4px'
                                }}>
                                  <span>
                                    {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                  {isMyMessage && (
                                    <span style={{ 
                                      color: 'rgba(255, 255, 255, 0.8)', 
                                      fontSize: '14px',
                                      filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))'
                                    }}>✓✓</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Sender name for received messages */}
                              {!isMyMessage && (
                                <span style={{
                                  fontSize: '11px',
                                  color: 'var(--accent-secondary)',
                                  marginLeft: '12px',
                                  marginTop: '4px',
                                  fontWeight: '600'
                                }}>
                                  {message.sender.name}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Modern Message Input */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px',
                    padding: '20px 24px',
                    background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-primary)'
                  }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={`Type a message to ${selectedUser.name}...`}
                      style={{ 
                        flex: 1,
                        border: '2px solid var(--border-primary)',
                        borderRadius: '24px',
                        padding: '14px 20px',
                        outline: 'none',
                        fontSize: '15px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent-primary)'
                        e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-primary)'
                        e.target.style.boxShadow = 'var(--shadow-sm)'
                      }}
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim()}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: newMessage.trim() 
                          ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' 
                          : 'var(--bg-card-hover)',
                        border: '2px solid var(--border-primary)',
                        color: newMessage.trim() ? 'white' : 'var(--text-muted)',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: '600',
                        boxShadow: newMessage.trim() ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
                      }}
                      onMouseEnter={(e) => {
                        if (newMessage.trim()) {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.boxShadow = 'var(--shadow-xl)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = newMessage.trim() ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
                      }}
                    >
                      {newMessage.trim() ? '➤' : '🎤'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '150px',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card)',
                  padding: '60px 40px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-primary)'
                }}>
                  <div style={{ 
                    fontSize: '5rem', 
                    marginBottom: '24px',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>💬</div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Select a Match to Start Chatting</h3>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Choose someone from your matches to begin an amazing skill exchange conversation
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
