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
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          padding: '30px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}>
          <button 
            onClick={fetchStats}
            disabled={loading}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.3s ease'
            }}
            title="Refresh Stats"
          >
            🔄 {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <h1 style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
            fontSize: '2.5rem',
            fontWeight: '700'
          }}>Welcome back, {user?.name}! </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: 0, 
            fontSize: '18px'
          }}>
            Ready to swap some skills today?
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {/* Total Matches */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-secondary), #0891b2)',
            color: 'white',
            borderRadius: '16px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{ fontSize: '3.5rem', marginBottom: '10px', position: 'relative' }}>🤝</div>
            <h3 style={{ fontSize: '2.5rem', margin: '0', fontWeight: 'bold' }}>{stats.matches}</h3>
            <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>Active Connections</p>
          </div>
          
          {/* Completed Exchanges */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-success), #059669)',
            color: 'white',
            borderRadius: '16px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{ fontSize: '3.5rem', marginBottom: '10px', position: 'relative' }}>🎯</div>
            <h3 style={{ fontSize: '2.5rem', margin: '0', fontWeight: 'bold' }}>{stats.completedExchanges}</h3>
            <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>Completed Exchanges</p>
          </div>
          
          {/* Skills to Teach */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)',
            color: 'white',
            borderRadius: '16px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{ fontSize: '3.5rem', marginBottom: '10px', position: 'relative' }}>🧠</div>
            <h3 style={{ fontSize: '2.5rem', margin: '0', fontWeight: 'bold' }}>{stats.skillsToTeach}</h3>
            <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>Skills to Teach</p>
          </div>
          
          {/* Skills to Learn */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-warning), #d97706)',
            color: 'white',
            borderRadius: '16px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{ fontSize: '3.5rem', marginBottom: '10px', position: 'relative' }}>📚</div>
            <h3 style={{ fontSize: '2.5rem', margin: '0', fontWeight: 'bold' }}>{stats.skillsToLearn}</h3>
            <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>Skills to Learn</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h2 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: '25px',
            fontSize: '1.8rem',
            fontWeight: '600'
          }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
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
                  style={{ 
                    background: 'var(--bg-secondary)',
                    border: `2px solid ${action.color}`,
                    borderRadius: '16px',
                    padding: '25px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.boxShadow = `0 10px 25px ${action.color}40`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
                    {action.icon}
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', color: action.color, fontSize: '1.3rem', fontWeight: '600' }}>
                    {action.title}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Skills Summary */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h2 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: '25px',
            fontSize: '1.8rem',
            fontWeight: '600'
          }}>Your Skills Profile</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'start' }}>
            <div style={{ minHeight: '120px' }}>
              <h3 style={{ color: 'var(--accent-success)', marginBottom: '15px', fontSize: '1.3rem', textAlign: 'left' }}>Skills You Can Teach</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                {user?.skillsKnown?.length > 0 ? user.skillsKnown.map((skill, index) => (
                  <span 
                    key={index}
                    style={{
                      background: 'var(--accent-success)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      textAlign: 'center'
                    }}
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
              <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '15px', fontSize: '1.3rem', textAlign: 'left' }}>Skills You Want to Learn</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                {user?.skillsWanted?.length > 0 ? user.skillsWanted.map((skill, index) => (
                  <span 
                    key={index}
                    style={{
                      background: 'var(--accent-secondary)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      textAlign: 'center'
                    }}
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


