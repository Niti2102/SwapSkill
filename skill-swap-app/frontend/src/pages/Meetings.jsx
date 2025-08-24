import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'

const Meetings = () => {
  const { user } = useAuth()
  const { updateNotificationCount, socket } = useSocket()
  const [searchParams] = useSearchParams()
  const [meetings, setMeetings] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skillToTeach: '',
    skillToLearn: '',
    scheduledDate: '',
    duration: 60,
    meetingType: 'video_call',
    location: ''
  })

  // Debug logging
  console.log('Meetings component rendering, user:', user, 'loading:', loading, 'error:', error)
  console.log('Current meetings:', meetings)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setError('Please log in to view meetings')
      return
    }
    
    const loadData = async () => {
      try {
        await Promise.all([fetchMeetings(), fetchMatches()])
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load meeting data')
        setLoading(false)
      }
    }
    
    loadData()
  }, [user])
  
  // Mark meeting notifications as read when meetings are loaded and user sees them
  useEffect(() => {
    if (!loading && meetings.length >= 0 && user) {
      const markNotificationsRead = async () => {
        try {
          await axios.put('/api/notifications/meetings/read')
          // Update notification count based on actual pending meetings for current user
          const pendingMeetings = meetings.filter(meeting => 
            meeting.participant?._id === user._id && meeting.status === 'pending'
          ).length
          updateNotificationCount('meetings', pendingMeetings)
        } catch (error) {
          console.error('Error marking meeting notifications as read:', error)
        }
      }
      markNotificationsRead()
    }
  }, [loading, meetings, user])
  
  // Socket.IO listeners for real-time updates
  useEffect(() => {
    if (socket) {
      const handleMeetingRequest = (data) => {
        toast.success(
          `📅 ${data.meeting.initiator.name} has requested a meeting with you!`,
          {
            duration: 5000,
            icon: '📅',
            style: {
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #ffeaa7',
              color: '#856404'
            }
          }
        )
        fetchMeetings() // Refresh meetings list
        // Note: notification count will be updated by the notification_update event
      }
      
      const handleMeetingAccepted = (data) => {
        toast.success(
          `✅ ${data.meeting.title} was accepted! Time to skill swap!`,
          {
            duration: 4000,
            icon: '✅'
          }
        )
        fetchMeetings() // Refresh meetings list
      }
      
      const handleMeetingDeclined = (data) => {
        toast.error(
          `❌ ${data.meeting.title} was declined. Don't worry, keep trying!`,
          {
            duration: 4000,
            icon: '❌'
          }
        )
        fetchMeetings() // Refresh meetings list
      }
      
      const handleMeetingCancelled = (data) => {
        toast.warning(
          `🚫 ${data.meeting.title} was cancelled.`,
          {
            duration: 4000,
            icon: '🚫'
          }
        )
        fetchMeetings() // Refresh meetings list
      }
      
      socket.on('meeting_request', handleMeetingRequest)
      socket.on('meeting_accepted', handleMeetingAccepted)
      socket.on('meeting_declined', handleMeetingDeclined)
      socket.on('meeting_cancelled', handleMeetingCancelled)
      
      return () => {
        socket.off('meeting_request', handleMeetingRequest)
        socket.off('meeting_accepted', handleMeetingAccepted)
        socket.off('meeting_declined', handleMeetingDeclined)
        socket.off('meeting_cancelled', handleMeetingCancelled)
      }
    }
  }, [socket])

  // Auto-select user from URL parameter
  useEffect(() => {
    const userIdFromUrl = searchParams.get('userId')
    if (userIdFromUrl && matches.length > 0) {
      const userFromUrl = matches.find(match => match._id === userIdFromUrl)
      if (userFromUrl) {
        setSelectedUser(userFromUrl)
        setShowCreateForm(true)
      }
    }
  }, [searchParams, matches])

  const fetchMeetings = async () => {
    try {
      console.log('Fetching meetings for user:', user?._id) // Debug log
      const response = await axios.get('/api/meetings/my-meetings')
      console.log('Meetings response:', response.data) // Debug log
      
      // Validate each meeting has proper structure
      const validMeetings = (response.data || []).filter(meeting => {
        const isValid = meeting && meeting._id && meeting.initiator && meeting.participant
        if (!isValid) {
          console.warn('Invalid meeting found:', meeting)
        }
        return isValid
      })
      
      console.log('Valid meetings after filtering:', validMeetings.length)
      setMeetings(validMeetings)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching meetings:', error)
      toast.error('Failed to load meetings')
      setMeetings([])
      setLoading(false)
    }
  }

  const fetchMatches = async () => {
    try {
      const response = await axios.get('/api/swipe/matches')
      console.log('Matches response:', response.data) // Debug log
      setMatches(response.data || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast.error('Failed to load matches')
      setMatches([])
    }
  }

  const handleMeetingAction = async (meetingId, action) => {
    try {
      await axios.put(`/api/meetings/${action}/${meetingId}`)
      toast.success(`Meeting ${action}ed successfully`)
      fetchMeetings()
      
      // Update notification count immediately after action
      setTimeout(async () => {
        try {
          const response = await axios.get('/api/notifications/counts')
          updateNotificationCount('meetings', response.data.meetings)
        } catch (error) {
          console.error('Error updating meeting notification count:', error)
        }
      }, 500) // Small delay to ensure backend has processed the change
    } catch (error) {
      console.error(`Error ${action}ing meeting:`, error)
      toast.error(`Failed to ${action} meeting`)
    }
  }

  const handleCreateMeeting = async (e) => {
    e.preventDefault()
    if (!selectedUser) {
      toast.error('Please select a user to schedule a meeting with')
      return
    }

    try {
      await axios.post('/api/meetings/create', {
        participantId: selectedUser._id,
        ...formData
      })
      
      toast.success('Meeting request sent successfully!')
      setShowCreateForm(false)
      setSelectedUser(null)
      setFormData({
        title: '',
        description: '',
        skillToTeach: '',
        skillToLearn: '',
        scheduledDate: '',
        duration: 60,
        meetingType: 'video_call',
        location: ''
      })
      fetchMeetings()
      
      // Update notification counts after creating meeting
      setTimeout(async () => {
        try {
          const response = await axios.get('/api/notifications/counts')
          updateNotificationCount('meetings', response.data.meetings)
        } catch (error) {
          console.error('Error updating notification count after meeting creation:', error)
        }
      }, 500)
    } catch (error) {
      console.error('Error creating meeting:', error)
      toast.error('Failed to create meeting')
    }
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="loading">Loading meetings...</div>
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
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: '#dc3545', fontSize: '1.2rem', padding: '20px' }}>
              ⚠️ {error}
            </div>
            <button 
              className="btn" 
              onClick={() => {
                setError(null)
                setLoading(true)
                if (user) {
                  fetchMeetings()
                  fetchMatches()
                }
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: '#dc3545', fontSize: '1.2rem', padding: '20px' }}>
              🔒 Please log in to access meetings
            </div>
          </div>
        </div>
      </div>
    )
  }

  try {
    return (
      <div>
        <Navbar />
        <div className="container">
        <div className="card" style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '8px',
                fontSize: '2.5rem',
                fontWeight: '700'
              }}>Meetings 📅</h1>
              <p style={{ 
                color: 'var(--text-secondary)', 
                margin: 0, 
                fontSize: '18px',
                fontWeight: '500'
              }}>
                Schedule and manage your skill exchange sessions
              </p>
            </div>
            <button 
              className="btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                background: showCreateForm 
                  ? 'linear-gradient(135deg, var(--accent-error), #dc2626)' 
                  : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>{showCreateForm ? '❌' : '➕'}</span>
              {showCreateForm ? 'Cancel' : 'Schedule New Meeting'}
            </button>
          </div>
        </div>

        {/* Modern Create Meeting Form */}
        {showCreateForm && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)',
            border: '2px solid var(--accent-primary)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: 'white',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                📅
              </div>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  color: 'var(--text-primary)',
                  fontSize: '1.5rem',
                  fontWeight: '600'
                }}>Schedule a New Meeting</h3>
                <p style={{ 
                  margin: 0, 
                  color: 'var(--text-secondary)',
                  fontSize: '16px'
                }}>Create a skill exchange session with your match</p>
              </div>
            </div>
            <form onSubmit={handleCreateMeeting} style={{ marginTop: '0' }}>
              {/* Partner Selection */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label htmlFor="participant" style={{
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>Select Partner 🤝</label>
                <select
                  id="participant"
                  value={selectedUser?._id || ''}
                  onChange={(e) => {
                    const user = matches.find(m => m._id === e.target.value)
                    setSelectedUser(user)
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-primary)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    Choose a matched partner...
                  </option>
                  {matches.map((match) => (
                    <option key={match._id} value={match._id} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {match.name} - {(match.skillsKnown || []).slice(0, 2).join(', ') || 'No skills listed'}
                      {match.isPotentialMatch ? ' (Potential Match)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Meeting Title */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label htmlFor="title" style={{
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>Meeting Title 🏷️</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., JavaScript for Python Session"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-primary)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label htmlFor="description" style={{
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>Description 📝</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe what you'll be teaching/learning..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '100px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-primary)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Skills Exchange Section */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px',
                marginBottom: '25px',
                padding: '20px',
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="skillToTeach" style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}>Skill You'll Teach 🎓</label>
                  <input
                    type="text"
                    id="skillToTeach"
                    name="skillToTeach"
                    value={formData.skillToTeach}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g., JavaScript"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-success)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="skillToLearn" style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}>Skill You'll Learn 📚</label>
                  <input
                    type="text"
                    id="skillToLearn"
                    name="skillToLearn"
                    value={formData.skillToLearn}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g., Python"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-secondary)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Meeting Details Section */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '20px',
                marginBottom: '25px'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="scheduledDate" style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}>Date & Time 🗺</label>
                  <input
                    type="datetime-local"
                    id="scheduledDate"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      colorScheme: 'dark'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-primary)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="duration" style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}>Duration (minutes) ⏱️</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleFormChange}
                    min="15"
                    max="240"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-primary)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="meetingType" style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}>Meeting Type 📹</label>
                  <select
                    id="meetingType"
                    name="meetingType"
                    value={formData.meetingType}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-primary)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value="video_call" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>📹 Video Call</option>
                    <option value="in_person" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🏢 In Person</option>
                    <option value="chat_session" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>💬 Chat Session</option>
                  </select>
                </div>
              </div>

              {/* Location Field (conditional) */}
              {formData.meetingType === 'in_person' && (
                <div className="form-group" style={{ marginBottom: '25px' }}>
                  <label htmlFor="location" style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}>Location 📍</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="e.g., Coffee Shop, Library, etc."
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-primary)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '15px',
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-primary)'
              }}>
                <button 
                  type="submit" 
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-success), #059669)',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'var(--shadow-lg)'
                  }}
                >
                  <span>📅</span>
                  Schedule Meeting
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateForm(false)
                    setSelectedUser(null)
                  }}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-primary)',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--accent-error)'
                    e.target.style.color = 'var(--accent-error)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)'
                    e.target.style.color = 'var(--text-secondary)'
                  }}
                >
                  <span>❌</span>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Meetings */}
        {!meetings || meetings.length === 0 ? (
          <div className="card" style={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)',
            border: '1px solid var(--border-primary)',
            borderRadius: '20px',
            padding: '60px 40px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ 
              fontSize: '5rem', 
              marginBottom: '24px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>📅</div>
            <h2 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: '16px',
              fontSize: '1.8rem',
              fontWeight: '600'
            }}>No Meetings Scheduled</h2>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '16px', 
              lineHeight: '1.6',
              maxWidth: '400px',
              margin: '0 auto 30px'
            }}>
              Start connecting with your matches to schedule productive skill exchange sessions!
            </p>
            <button 
              className="btn"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'var(--shadow-lg)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => window.location.href = '/chat'}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'var(--shadow-lg)'
              }}
            >
              <span>💬</span>
              Start Chatting
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {meetings.map((meeting) => {
              // Validate meeting data
              if (!meeting || !meeting._id) {
                console.error('Invalid meeting data:', meeting)
                return null
              }
              
              console.log('Processing meeting:', meeting) // Debug log
              
              // The backend uses "initiator" and "participant", not "organizer"
              const isInitiator = meeting.initiator?._id === user?._id
              const otherUser = isInitiator ? meeting.participant : meeting.initiator
              
              // Validate other user data
              if (!otherUser) {
                console.error('Missing user data for meeting:', meeting._id, {
                  initiator: meeting.initiator,
                  participant: meeting.participant,
                  currentUserId: user?._id
                })
                return (
                  <div key={meeting._id} style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                    <p>Meeting data incomplete - please refresh the page</p>
                    <small>Debug: Missing {isInitiator ? 'participant' : 'initiator'} data</small>
                  </div>
                )
              }
              
              return (
                <div key={meeting._id} style={{
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)',
                  border: `2px solid ${(meeting.status || 'pending') === 'accepted' ? 'var(--accent-success)' : 
                          (meeting.status || 'pending') === 'pending' ? 'var(--accent-warning)' :
                          (meeting.status || 'pending') === 'declined' ? 'var(--accent-error)' : 'var(--border-primary)'}`,
                  borderRadius: '20px',
                  padding: '30px',
                  marginBottom: '25px',
                  boxShadow: `0 10px 30px ${(meeting.status || 'pending') === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : 
                              (meeting.status || 'pending') === 'pending' ? 'rgba(245, 158, 11, 0.15)' :
                              (meeting.status || 'pending') === 'declined' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Status Glow Effect */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${(meeting.status || 'pending') === 'accepted' ? 'var(--accent-success)' : 
                                (meeting.status || 'pending') === 'pending' ? 'var(--accent-warning)' :
                                (meeting.status || 'pending') === 'declined' ? 'var(--accent-error)' : 'var(--border-primary)'}, transparent)`
                  }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '25px' }}>
                    {/* Meeting Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                        <div style={{
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                          color: 'white',
                          width: '70px',
                          height: '70px',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          boxShadow: 'var(--shadow-lg)'
                        }}>
                          👤
                        </div>
                        <div>
                          <h3 style={{ 
                            margin: '0 0 8px 0', 
                            color: 'var(--text-primary)',
                            fontSize: '1.4rem',
                            fontWeight: '600'
                          }}>{meeting.title || 'Untitled Meeting'}</h3>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '16px', 
                            fontWeight: '500',
                            color: 'var(--text-secondary)'
                          }}>
                            {isInitiator ? 'Meeting with' : 'Organized by'} <strong style={{ color: 'var(--text-primary)' }}>{otherUser.name || 'Unknown User'}</strong>
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ background: 'var(--bg-secondary)', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid var(--border-primary)' }}>
                        <p style={{ margin: '0 0 10px 0', color: '#666' }}>{meeting.description || 'No description provided'}</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' }}>
                          <div>
                            <strong>🎓 Teaching:</strong> {meeting.skillToTeach || 'Not specified'}
                          </div>
                          <div>
                            <strong>📚 Learning:</strong> {meeting.skillToLearn || 'Not specified'}
                          </div>
                          <div>
                            <strong>📅 Date:</strong> {meeting.scheduledDate ? new Date(meeting.scheduledDate).toLocaleDateString() : 'Not set'}
                          </div>
                          <div>
                            <strong>⏰ Time:</strong> {meeting.scheduledDate ? new Date(meeting.scheduledDate).toLocaleTimeString() : 'Not set'}
                          </div>
                          <div>
                            <strong>⏱️ Duration:</strong> {meeting.duration || 60} minutes
                          </div>
                          <div>
                            <strong>📹 Type:</strong> {(meeting.meetingType || 'video_call').replace('_', ' ')}
                          </div>
                        </div>
                        
                        {meeting.location && (
                          <p style={{ margin: '10px 0 0 0' }}>
                            <strong>📍 Location:</strong> {meeting.location}
                          </p>
                        )}
                      </div>
                      
                      {/* Participant Skills */}
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{otherUser.name || 'User'}'s Skills:</h4>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ fontSize: '12px', color: '#666', marginRight: '5px' }}>Can teach:</span>
                            {(otherUser.skillsKnown || []).slice(0, 3).map((skill, index) => (
                              <span key={index} style={{
                                background: '#28a745',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                marginRight: '5px'
                              }}>
                                {skill}
                              </span>
                            ))}
                            {(!otherUser.skillsKnown || otherUser.skillsKnown.length === 0) && (
                              <span style={{ fontSize: '12px', color: '#999' }}>No skills listed</span>
                            )}
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: '#666', marginRight: '5px' }}>Wants to learn:</span>
                            {(otherUser.skillsWanted || []).slice(0, 3).map((skill, index) => (
                              <span key={index} style={{
                                background: '#007bff',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                marginRight: '5px'
                              }}>
                                {skill}
                              </span>
                            ))}
                            {(!otherUser.skillsWanted || otherUser.skillsWanted.length === 0) && (
                              <span style={{ fontSize: '12px', color: '#999' }}>No skills listed</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '15px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: (meeting.status || 'pending') === 'accepted' ? '#28a745' : 
                                     (meeting.status || 'pending') === 'pending' ? '#ffc107' : 
                                     (meeting.status || 'pending') === 'declined' ? '#dc3545' : '#6c757d',
                          color: (meeting.status || 'pending') === 'pending' ? '#000' : 'white'
                        }}>
                          {(meeting.status || 'pending').toUpperCase()}
                        </span>
                        
                        {isInitiator && (
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '15px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: '#17a2b8',
                            color: 'white'
                          }}>
                            INITIATOR
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '120px' }}>
                      {(meeting.status || 'pending') === 'pending' && !isInitiator && (
                        <>
                          <button 
                            className="btn btn-success"
                            onClick={() => handleMeetingAction(meeting._id, 'accept')}
                            style={{ fontSize: '14px', padding: '8px 16px' }}
                          >
                            ✓ Accept
                          </button>
                          <button 
                            className="btn btn-danger"
                            onClick={() => handleMeetingAction(meeting._id, 'decline')}
                            style={{ fontSize: '14px', padding: '8px 16px' }}
                          >
                            ✗ Decline
                          </button>
                        </>
                      )}
                      
                      {((meeting.status || 'pending') === 'pending' || (meeting.status || 'pending') === 'accepted') && (
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleMeetingAction(meeting._id, 'cancel')}
                          style={{ fontSize: '14px', padding: '8px 16px' }}
                        >
                          🚫 Cancel
                        </button>
                      )}
                      
                      {(meeting.status || 'pending') === 'accepted' && (
                        <button 
                          className="btn btn-success"
                          onClick={() => handleMeetingAction(meeting._id, 'complete')}
                          style={{ fontSize: '14px', padding: '8px 16px' }}
                        >
                          ✓ Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
  } catch (renderError) {
    console.error('Error rendering Meetings component:', renderError)
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: '#dc3545', fontSize: '1.2rem', padding: '20px' }}>
              ⚠️ Something went wrong while loading the meetings page
            </div>
            <p style={{ color: '#666' }}>Please refresh the page or try again later.</p>
            <button 
              className="btn" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default Meetings
