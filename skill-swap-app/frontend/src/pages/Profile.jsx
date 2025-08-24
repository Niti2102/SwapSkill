import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalMeetings: 0,
    completedMeetings: 0,
    pendingMeetings: 0,
    acceptedMeetings: 0,
    totalMessages: 0
  })
  const [formData, setFormData] = useState({
    name: user?.name || '',
    skillsKnown: user?.skillsKnown?.join(', ') || '',
    skillsWanted: user?.skillsWanted?.join(', ') || ''
  })

  useEffect(() => {
    fetchUserStats()
  }, [])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        skillsKnown: user.skillsKnown?.join(', ') || '',
        skillsWanted: user.skillsWanted?.join(', ') || ''
      })
    }
  }, [user])

  const fetchUserStats = async () => {
    try {
      console.log('Fetching user stats...')
      
      const [matchesRes, meetingsRes] = await Promise.all([
        axios.get('/api/swipe/matches'),
        axios.get('/api/meetings/my-meetings')
      ])
      
      console.log('Matches response:', matchesRes.data)
      console.log('Meetings response:', meetingsRes.data)
      
      const matches = Array.isArray(matchesRes.data) ? matchesRes.data : []
      const meetings = Array.isArray(meetingsRes.data) ? meetingsRes.data : []
      const completedMeetings = meetings.filter(m => m.status === 'completed')
      const pendingMeetings = meetings.filter(m => m.status === 'pending')
      const acceptedMeetings = meetings.filter(m => m.status === 'accepted')
      
      const newStats = {
        totalMatches: matches.length,
        totalMeetings: meetings.length,
        completedMeetings: completedMeetings.length,
        pendingMeetings: pendingMeetings.length,
        acceptedMeetings: acceptedMeetings.length,
        totalMessages: 0 // Will be updated when we implement message count
      }
      
      console.log('Updated stats:', newStats)
      setStats(newStats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      console.error('Error details:', error.response?.data || error.message)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const profileData = {
      ...formData,
      skillsKnown: formData.skillsKnown.split(',').map(skill => skill.trim()).filter(skill => skill),
      skillsWanted: formData.skillsWanted.split(',').map(skill => skill.trim()).filter(skill => skill)
    }
    
    const success = await updateProfile(profileData)
    if (success) {
      setEditing(false)
    }
    setLoading(false)
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1>Profile 👤</h1>
            <button 
              className="btn"
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="card">
          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={user?.email || ''}
                  disabled
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                />
                <small style={{ color: '#666' }}>Email cannot be changed</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="skillsKnown">Skills You Can Teach</label>
                <input
                  type="text"
                  id="skillsKnown"
                  name="skillsKnown"
                  value={formData.skillsKnown}
                  onChange={handleChange}
                  placeholder="e.g., JavaScript, Cooking, Guitar (comma-separated)"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="skillsWanted">Skills You Want to Learn</label>
                <input
                  type="text"
                  id="skillsWanted"
                  name="skillsWanted"
                  value={formData.skillsWanted}
                  onChange={handleChange}
                  placeholder="e.g., Python, Painting, Spanish (comma-separated)"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit" 
                  className="btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👤</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Personal Info</h3>
                  <p style={{ margin: '5px 0', opacity: 0.9 }}><strong>Name:</strong> {user?.name}</p>
                  <p style={{ margin: '5px 0', opacity: 0.9 }}><strong>Email:</strong> {user?.email}</p>
                  <p style={{ margin: '5px 0', opacity: 0.9 }}>
                    <strong>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📊</div>
                  <h3 style={{ margin: '0 0 15px 0' }}>Activity Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.totalMatches}</div>
                      <div style={{ opacity: 0.9 }}>Total Matches</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.totalMeetings}</div>
                      <div style={{ opacity: 0.9 }}>Total Meetings</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.pendingMeetings}</div>
                      <div style={{ opacity: 0.9 }}>Pending</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.acceptedMeetings}</div>
                      <div style={{ opacity: 0.9 }}>Accepted</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.completedMeetings}</div>
                      <div style={{ opacity: 0.9 }}>Completed</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{user?.skillsKnown?.length + user?.skillsWanted?.length || 0}</div>
                      <div style={{ opacity: 0.9 }}>Total Skills</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '25px',
                  borderRadius: '15px',
                  border: '2px solid var(--accent-success)'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🎓</span> Skills You Can Teach ({user?.skillsKnown?.length || 0})
                  </h3>
                  {user?.skillsKnown?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {user.skillsKnown.map((skill, index) => (
                        <span 
                          key={index}
                          style={{
                            background: 'var(--accent-success)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No skills added yet. Add some skills to help others find you!</p>
                  )}
                </div>
                
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '25px',
                  borderRadius: '15px',
                  border: '2px solid var(--accent-secondary)'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>📚</span> Skills You Want to Learn ({user?.skillsWanted?.length || 0})
                  </h3>
                  {user?.skillsWanted?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {user.skillsWanted.map((skill, index) => (
                        <span 
                          key={index}
                          style={{
                            background: 'var(--accent-secondary)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No learning goals set. Add skills you want to learn!</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile


