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
      <div className="container">
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
            Find Your Skill Partner
          </h2>
          
          {/* User Card */}
          <div 
            className="card" 
            style={{ 
              position: 'relative',
              minHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            {/* Match Score */}
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              Match Score: {matchScore}/10
            </div>
            
            {/* User Info */}
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                👤
              </div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>
                {currentUser.name}
              </h2>
              
              {/* Skills */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>Can Teach:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {currentUser.skillsKnown?.map((skill, index) => (
                    <span 
                      key={index}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '4px 12px',
                        borderRadius: '15px',
                        fontSize: '12px'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>Wants to Learn:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {currentUser.skillsWanted?.map((skill, index) => (
                    <span 
                      key={index}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '4px 12px',
                        borderRadius: '15px',
                        fontSize: '12px'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Swipe Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '20px',
            gap: '20px'
          }}>
            <button 
              className="btn btn-danger" 
              onClick={() => handleSwipe('left')}
              disabled={swiping}
              style={{ flex: 1, fontSize: '18px' }}
            >
              ❌ Pass
            </button>
            <button 
              className="btn btn-success" 
              onClick={() => handleSwipe('right')}
              disabled={swiping}
              style={{ flex: 1, fontSize: '18px' }}
            >
              ❤️ Like
            </button>
          </div>
          
          {/* Progress */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: '#666', margin: 0 }}>
              {currentIndex + 1} of {users.length} users
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
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ 
            maxWidth: '500px', 
            textAlign: 'center',
            background: 'var(--bg-card)',
            padding: '40px'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ color: '#667eea', marginBottom: '10px' }}>It's a Match!</h2>
            <h3 style={{ marginBottom: '20px' }}>You and {matchedUser.name} can teach each other!</h3>
            
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ color: '#28a745', marginBottom: '10px' }}>You can teach {matchedUser.name}:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                {user.skillsKnown?.filter(skill => matchedUser.skillsWanted?.includes(skill)).map((skill, index) => (
                  <span 
                    key={index}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '15px',
                      fontSize: '12px'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
              
              <h4 style={{ color: '#007bff', marginBottom: '10px' }}>{matchedUser.name} can teach you:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {matchedUser.skillsKnown?.filter(skill => user.skillsWanted?.includes(skill)).map((skill, index) => (
                  <span 
                    key={index}
                    style={{
                      background: '#007bff',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '15px',
                      fontSize: '12px'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                className="btn btn-success"
                onClick={() => handleMatchAction('chat')}
                style={{ flex: 1 }}
              >
                💬 Start Chatting
              </button>
              <button 
                className="btn"
                onClick={() => handleMatchAction('meeting')}
                style={{ flex: 1 }}
              >
                📅 Schedule Meeting
              </button>
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={() => setShowMatchModal(false)}
              style={{ marginTop: '15px' }}
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
