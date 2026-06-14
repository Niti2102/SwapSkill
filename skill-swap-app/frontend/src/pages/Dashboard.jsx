import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import Navbar from '../components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const { notificationCounts } = useSocket()
  const [stats, setStats] = useState({
    matches: 0,
    completedExchanges: 0,
    skillsToTeach: 0,
    skillsToLearn: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  // Update skills count from user profile when user data changes
  useEffect(() => {
    if (user) {
      setStats(prev => ({
        ...prev,
        skillsToTeach: user.skillsKnown?.length || 0,
        skillsToLearn: user.skillsWanted?.length || 0
      }))
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching dashboard stats for user:', user?.name)
      console.log('📊 User ID:', user?._id)
      
      // Check if we have a valid JWT token
      const token = localStorage.getItem('token')
      console.log('🔑 Token exists:', !!token)
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.')
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }

      console.log('📡 Making API calls...')
      
      // Make API calls with proper error handling
      const promises = [
        axios.get('/api/swipe/matches', config).catch(err => {
          console.warn('Matches API failed:', err.response?.status, err.response?.data)
          return { data: [] }
        }),
        axios.get('/api/meetings/my-meetings', config).catch(err => {
          console.warn('Meetings API failed:', err.response?.status, err.response?.data)
          return { data: [] }
        })
      ]
      
      const [matchesRes, meetingsRes] = await Promise.all(promises)
      
      console.log('✅ API responses received:')
      console.log('📝 Matches response:', matchesRes.data)
      console.log('📝 Meetings response:', meetingsRes.data)
      
      const matches = Array.isArray(matchesRes.data) ? matchesRes.data : []
      const meetings = Array.isArray(meetingsRes.data) ? meetingsRes.data : []
      
      console.log('📊 Data Arrays:')
      console.log('- Total matches:', matches.length)
      console.log('- Total meetings:', meetings.length)
      
      // Calculate completed skill exchanges (meetings with status 'completed')
      const completedExchanges = meetings.filter(m => m.status === 'completed').length
      
      // Get skills count from user profile (already updated in useEffect)
      const skillsToTeach = user.skillsKnown?.length || 0
      const skillsToLearn = user.skillsWanted?.length || 0
      
      console.log('🔍 Statistics calculation:')
      console.log('- Completed exchanges:', completedExchanges)
      console.log('- Skills to teach:', skillsToTeach)
      console.log('- Skills to learn:', skillsToLearn)
      
      const newStats = {
        matches: matches.length,
        completedExchanges: completedExchanges,
        skillsToTeach: skillsToTeach,
        skillsToLearn: skillsToLearn
      }
      
      console.log('📊 Final calculated stats:', {
        matches: `${matches.length} (total active connections)`,
        completedExchanges: `${completedExchanges} (successful skill exchanges)`,
        skillsToTeach: `${skillsToTeach} (skills you can share)`,
        skillsToLearn: `${skillsToLearn} (skills you want to learn)`,
        debugInfo: {
          totalMeetings: meetings.length,
          userProfile: {
            name: user.name,
            skillsKnown: user.skillsKnown,
            skillsWanted: user.skillsWanted
          }
        }
      })
      setStats(newStats)
      
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      
      const errorMessage = error.response?.status === 401 
        ? 'Session expired. Please log in again.'
        : error.response?.data?.message || error.message || 'Failed to load dashboard data'
      
      setError(errorMessage)
      
      if (error.response?.status === 401) {
        // Token is invalid, redirect to login
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Find New Matches',
      description: 'Swipe through potential skill partners',
      icon: '👥',
      link: '/swipe',
      color: '#667eea'
    },
    {
      title: 'View Matches',
      description: 'See your current skill matches',
      icon: '💕',
      link: '/matches',
      color: '#e91e63'
    },
    {
      title: 'Start Chatting',
      description: 'Message your matched partners',
      icon: '💬',
      link: '/chat',
      color: '#4caf50'
    },
    {
      title: 'Schedule Meetings',
      description: 'Plan skill exchange sessions',
      icon: '📅',
      link: '/meetings',
      color: '#ff9800'
    }
  ]

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          {/* Loading Welcome Header */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '20px',
            padding: '30px',
            textAlign: 'center',
            marginBottom: '30px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              width: '60px',
              height: '20px',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              margin: '0 auto 15px',
              animation: 'pulse 2s infinite'
            }} />
            <div style={{
              width: '200px',
              height: '15px',
              background: 'var(--bg-secondary)',
              borderRadius: '7px',
              margin: '0 auto'
            }} />
          </div>
          
          {/* Loading Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
                opacity: 0.7
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--accent-primary)',
                  borderRadius: '50%',
                  margin: '0 auto 15px',
                  animation: 'pulse 2s infinite'
                }} />
                <div style={{
                  height: '20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  marginBottom: '10px'
                }} />
                <div style={{
                  height: '15px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '7px',
                  width: '60%',
                  margin: '0 auto'
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--accent-error)',
            borderRadius: '16px',
            padding: '30px',
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔐</div>
            <h3 style={{ color: 'var(--accent-error)', marginBottom: '10px' }}>Authentication Required</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn"
                onClick={() => window.location.href = '/login'}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                🔑 Go to Login
              </button>
              <button 
                className="btn"
                onClick={fetchStats}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-primary)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        {/* Welcome Header */}
        <div className="glass-panel animate-slideup" style={{
          padding: '40px 30px',
          textAlign: 'center',
          marginBottom: '30px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle glow circle */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            left: '-50px',
            width: '180px',
            height: '180px',
            background: 'var(--accent-primary)',
            filter: 'blur(90px)',
            opacity: 0.15,
            pointerEvents: 'none'
          }} />
          
          <button 
            onClick={fetchStats}
            disabled={loading}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '8px 16px',
              color: 'var(--text-primary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'none',
              letterSpacing: 'normal',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if(!loading) e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              if(!loading) e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            title="Refresh Stats"
          >
            🔄 {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <h1 className="shimmer-text" style={{
            marginBottom: '10px',
            fontSize: '2.8rem',
            fontWeight: '800',
            letterSpacing: '-0.5px'
          }}>
            Welcome back, {user?.name}!
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: 0, 
            fontSize: '18px',
            fontWeight: '500'
          }}>
            Ready to swap some skills today? Check out your connections below.
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {/* Total Matches */}
          <div className="glass-card animate-slideup" style={{
            padding: '30px',
            textAlign: 'center',
            borderLeft: '4px solid var(--accent-secondary)',
            animationDelay: '0.1s'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🤝</div>
            <h3 style={{ fontSize: '2.5rem', margin: '0', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.matches}</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Connections</p>
          </div>
          
          {/* Completed Exchanges */}
          <div className="glass-card animate-slideup" style={{
            padding: '30px',
            textAlign: 'center',
            borderLeft: '4px solid var(--accent-success)',
            animationDelay: '0.15s'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎯</div>
            <h3 style={{ fontSize: '2.5rem', margin: '0', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.completedExchanges}</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Swaps</p>
          </div>
          
          {/* Skills to Teach */}
          <div className="glass-card animate-slideup" style={{
            padding: '30px',
            textAlign: 'center',
            borderLeft: '4px solid var(--accent-primary)',
            animationDelay: '0.2s'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧠</div>
            <h3 style={{ fontSize: '2.5rem', margin: '0', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.skillsToTeach}</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills to Share</p>
          </div>
          
          {/* Skills to Learn */}
          <div className="glass-card animate-slideup" style={{
            padding: '30px',
            textAlign: 'center',
            borderLeft: '4px solid var(--accent-warning)',
            animationDelay: '0.25s'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📚</div>
            <h3 style={{ fontSize: '2.5rem', margin: '0', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.skillsToLearn}</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills to Learn</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel animate-slideup" style={{
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h2 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: '20px',
            fontSize: '1.6rem',
            fontWeight: '700',
            textAlign: 'left'
          }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {quickActions.map((action, index) => (
              <Link 
                key={index} 
                to={action.link} 
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  display: 'block'
                }}
              >
                <div 
                  className="glass-card"
                  style={{ 
                    padding: '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>
                    {action.icon}
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', color: action.color, fontSize: '1.2rem', fontWeight: '700' }}>
                    {action.title}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.4' }}>
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Skills Summary */}
        <div className="glass-panel animate-slideup" style={{
          padding: '30px'
        }}>
          <h2 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: '25px',
            fontSize: '1.6rem',
            fontWeight: '700',
            textAlign: 'left'
          }}>Your Skills Profile</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'start' }}>
            <div style={{ minHeight: '120px' }}>
              <h3 style={{ color: 'var(--accent-success)', marginBottom: '15px', fontSize: '1.2rem', fontWeight: '700', textAlign: 'left' }}>Skills You Can Teach</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                {user?.skillsKnown?.length > 0 ? user.skillsKnown.map((skill, index) => (
                  <span 
                    key={index}
                    className="pill-tag pill-success"
                  >
                    {skill}
                  </span>
                )) : (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0', textAlign: 'left' }}>
                    No skills added yet. Update your profile to add skills!
                  </p>
                )}
              </div>
            </div>
            
            <div style={{ minHeight: '120px' }}>
              <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '15px', fontSize: '1.2rem', fontWeight: '700', textAlign: 'left' }}>Skills You Want to Learn</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                {user?.skillsWanted?.length > 0 ? user.skillsWanted.map((skill, index) => (
                  <span 
                    key={index}
                    className="pill-tag pill-info"
                  >
                    {skill}
                  </span>
                )) : (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0', textAlign: 'left' }}>
                    No learning goals set. Update your profile to add skills!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard


