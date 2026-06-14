import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'

const Swipe = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchedUser, setMatchedUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/swipe/users')
      setUsers(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
      setLoading(false)
    }
  }

  const handleSwipe = async (direction) => {
    if (swiping || currentIndex >= users.length) return
    
    setSwiping(true)
    const currentUser = users[currentIndex]
    
    try {
      console.log('🔄 Starting swipe...')
      console.log('Direction:', direction)
      console.log('Target user:', currentUser.name)
      console.log('Target user ID:', currentUser._id)
      console.log('Target skills known:', currentUser.skillsKnown)
      console.log('Target skills wanted:', currentUser.skillsWanted)
      console.log('My skills known:', user?.skillsKnown)
      console.log('My skills wanted:', user?.skillsWanted)
      
      const response = await axios.post('/api/swipe/swipe', {
        targetUserId: currentUser._id,
        direction
      })
      
      console.log('✅ Swipe response received:', response.data)
      
      if (response.data.isMatch) {
        console.log('🎉 IT\'S A MATCH!')
        console.log('Matched user data:', response.data.matchedUser)
        setMatchedUser(response.data.matchedUser)
        setShowMatchModal(true)
        toast.success(`It's a match with ${currentUser.name}! 🎉`)
      } else {
        console.log('👍 Swipe registered, no match')
        if (direction === 'right') {
          toast.success(`You liked ${currentUser.name}`)
        } else {
          toast.success(`Passed on ${currentUser.name}`)
        }
      }
      
      setCurrentIndex(prev => prev + 1)
    } catch (error) {
      console.error('❌ Error swiping:', error)
      console.error('Error response:', error.response?.data)
      toast.error('Failed to swipe. Please try again.')
    } finally {
      setSwiping(false)
    }
  }

  const handleMatchAction = (action) => {
    console.log('🎯 Match action triggered:', action)
    console.log('Matched user:', matchedUser)
    
    if (!matchedUser?.id) {
      console.error('❌ No matched user ID found')
      toast.error('Error: User information not available')
      return
    }
    
    console.log('✅ Navigating with user ID:', matchedUser.id)
    setShowMatchModal(false)
    
    // Add a small delay to ensure modal closes before navigation
    setTimeout(() => {
      if (action === 'chat') {
        console.log('🗨️ Navigating to chat...')
        navigate(`/chat?userId=${matchedUser.id}`)
      } else if (action === 'meeting') {
        console.log('📅 Navigating to meetings...')
        navigate(`/meetings?userId=${matchedUser.id}`)
      }
    }, 100)
  }

  const getSkillMatchScore = (displayedUser) => {
    if (!displayedUser || !displayedUser.skillsKnown || !displayedUser.skillsWanted) return 0
    if (!user || !user.skillsKnown || !user.skillsWanted) return 0
    
    const displayedUserSkills = displayedUser.skillsKnown || []
    const displayedUserWanted = displayedUser.skillsWanted || []
    const mySkills = user.skillsKnown || []
    const myWanted = user.skillsWanted || []
    
    // I can teach them what they want to learn
    const iCanTeachThem = displayedUserWanted.filter(skill => mySkills.includes(skill)).length
    // They can teach me what I want to learn
    const theyCanTeachMe = myWanted.filter(skill => displayedUserSkills.includes(skill)).length
    
    console.log('Match Score Debug:', {
      displayedUser: displayedUser.name,
      displayedUserSkills,
      displayedUserWanted,
      mySkills,
      myWanted,
      iCanTeachThem,
      theyCanTeachMe,
      totalScore: iCanTeachThem + theyCanTeachMe
    })
    
    return Math.min(iCanTeachThem + theyCanTeachMe, 10)
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading">Loading users...</div>
      </div>
    )
  }

  if (currentIndex >= users.length) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card" style={{ textAlign: 'center', maxWidth: '500px', margin: '100px auto' }}>
            <h2>No More Users! 🎉</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              You've swiped through all available users. Check back later for new skill partners!
            </p>
            <button 
              className="btn" 
              onClick={() => {
                setCurrentIndex(0)
                fetchUsers()
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentUser = users[currentIndex]
  const matchScore = getSkillMatchScore(currentUser)

  return (
    <div>
      <Navbar />
      <div className="container animate-slideup" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 className="shimmer-text" style={{ 
          textAlign: 'center', 
          marginBottom: '35px',
          fontSize: '2.4rem',
          fontWeight: '800',
          letterSpacing: '-0.5px'
        }}>
          Find Your Skill Partner
        </h2>
        
        {/* Main Swipe Wrapper */}
        <div className="glass-panel animate-float" style={{ 
          width: '100%',
          maxWidth: '430px', 
          padding: '30px',
          boxShadow: 'var(--shadow-xl), var(--glow-accent)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glowing backdrop circle */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '180px',
            height: '180px',
            background: 'var(--accent-secondary)',
            filter: 'blur(95px)',
            opacity: 0.12,
            pointerEvents: 'none'
          }} />

          {/* User Card */}
          <div 
            className="glass-card" 
            style={{ 
              position: 'relative',
              minHeight: '420px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '24px',
              background: 'rgba(20, 20, 35, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            {/* Match Score */}
            <div className="pill-tag pill-primary animate-glow" style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px',
              background: 'rgba(139, 92, 246, 0.2)',
              fontSize: '12px'
            }}>
              🔥 Match: {matchScore * 10}%
            </div>
            
            {/* User Info */}
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {/* Profile Avatar Frame */}
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                {currentUser.profilePicture ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/profile-picture/${currentUser.profilePicture}`}
                    alt={currentUser.name}
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--accent-primary)',
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.45)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    color: 'white',
                    fontWeight: '800',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.35)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {currentUser.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {currentUser.name}
              </h3>
              
              {/* Skills Section */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', opacity: 0.9, fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-success)' }}>Can Teach</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {currentUser.skillsKnown?.map((skill, index) => (
                    <span 
                      key={index}
                      className="pill-tag pill-success"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 8px 0', opacity: 0.9, fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-secondary)' }}>Wants to Learn</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {currentUser.skillsWanted?.map((skill, index) => (
                    <span 
                      key={index}
                      className="pill-tag pill-info"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Swipe Buttons (Tinder Style Circular Buttons) */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '25px',
            gap: '24px',
            alignItems: 'center'
          }}>
            <button 
              className="btn btn-secondary animate-glow" 
              onClick={() => handleSwipe('left')}
              disabled={swiping}
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '22px',
                padding: 0,
                border: '1px solid rgba(239, 68, 68, 0.35)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--accent-error)',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1) rotate(-8deg)';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
              }}
              title="Pass (Left)"
            >
              ❌
            </button>
            
            <button 
              className="btn animate-glow" 
              onClick={() => handleSwipe('right')}
              disabled={swiping}
              style={{ 
                width: '74px', 
                height: '74px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '32px',
                padding: 0,
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                boxShadow: '0 8px 25px rgba(139, 92, 246, 0.45)',
                border: 'none',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.45)';
              }}
              title="Like (Right)"
            >
              ❤️
            </button>
          </div>
          
          {/* Progress */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px', fontWeight: '500' }}>
              Profile {currentIndex + 1} of {users.length} available partners
            </p>
          </div>
        </div>
      </div>

      {/* Match Modal */}
      {showMatchModal && matchedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 12, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel animate-bouncein" style={{ 
            width: '100%',
            maxWidth: '460px', 
            textAlign: 'center',
            padding: '40px 30px',
            border: '2px solid rgba(139, 92, 246, 0.45)',
            boxShadow: '0 20px 50px rgba(139, 92, 246, 0.3)'
          }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.5))' }}>🎉</div>
            <h2 className="shimmer-text" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>It's a Match!</h2>
            <h3 style={{ marginBottom: '24px', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '500' }}>
              You and <strong style={{ color: 'var(--accent-secondary)' }}>{matchedUser.name}</strong> can teach each other!
            </h3>
            
            {/* Mutual Exchange Breakdown */}
            <div style={{ 
              marginBottom: '30px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '16px', 
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.06)' 
            }}>
              <h4 style={{ color: 'var(--accent-success)', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                You can teach {matchedUser.name}:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                {user.skillsKnown?.filter(skill => matchedUser.skillsWanted?.includes(skill)).map((skill, index) => (
                  <span key={index} className="pill-tag pill-success" style={{ fontSize: '11px' }}>
                    {skill}
                  </span>
                ))}
              </div>
              
              <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {matchedUser.name} can teach you:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {matchedUser.skillsKnown?.filter(skill => user.skillsWanted?.includes(skill)).map((skill, index) => (
                  <span key={index} className="pill-tag pill-info" style={{ fontSize: '11px' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Match Action Options */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="btn btn-success"
                onClick={() => handleMatchAction('chat')}
                style={{ flex: 1, textTransform: 'none', fontSize: '15px', padding: '12px 16px' }}
              >
                💬 Start Chatting
              </button>
              <button 
                className="btn"
                onClick={() => handleMatchAction('meeting')}
                style={{ flex: 1, textTransform: 'none', fontSize: '15px', padding: '12px 16px' }}
              >
                📅 Schedule Meeting
              </button>
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={() => setShowMatchModal(false)}
              style={{ marginTop: '14px', width: '100%', textTransform: 'none', fontSize: '14px' }}
            >
              Continue Swiping
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Swipe
