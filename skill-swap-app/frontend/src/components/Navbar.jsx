import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useState, useEffect } from 'react'
import axios from 'axios'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { notificationCounts, updateNotificationCount } = useSocket()
  const location = useLocation()

  useEffect(() => {
    if (user) {
      fetchNotificationCounts()
    }
  }, [user])

  const fetchNotificationCounts = async () => {
    try {
      const response = await axios.get('/api/notifications/counts')
      updateNotificationCount('messages', response.data.messages)
      updateNotificationCount('meetings', response.data.meetings)
    } catch (error) {
      // Notification fetch failed silently
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          Skill Swap
        </Link>
        
        <ul className="navbar-nav">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/swipe" className={isActive('/swipe') ? 'active' : ''}>
              Swipe
            </Link>
          </li>
          <li>
            <Link to="/matches" className={isActive('/matches') ? 'active' : ''}>
              Matches
            </Link>
          </li>
          <li>
            <Link to="/chat" className={isActive('/chat') ? 'active' : ''} style={{ position: 'relative' }}>
              Chat
              {notificationCounts.messages > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  animation: 'pulse 2s infinite',
                  boxShadow: '0 0 8px rgba(220, 53, 69, 0.5)'
                }}>
                  {notificationCounts.messages > 9 ? '9+' : notificationCounts.messages}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/meetings" className={isActive('/meetings') ? 'active' : ''} style={{ position: 'relative' }}>
              Meetings
              {notificationCounts.meetings > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ffc107',
                  color: '#000',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {notificationCounts.meetings > 9 ? '9+' : notificationCounts.meetings}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/profile" className={isActive('/profile') ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user?.profilePicture ? (
                <img 
                  src={`http://localhost:8000/api/users/profile-picture/${user.profilePicture}`}
                  alt="Profile"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--accent-primary)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              ) : (
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              Profile
            </Link>
          </li>
          <li>
            <button 
              onClick={logout} 
              className="btn btn-secondary"
              style={{ margin: 0 }}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar


