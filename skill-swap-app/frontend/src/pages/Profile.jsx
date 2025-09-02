import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [profilePictureFile, setProfilePictureFile] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
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

  // Profile picture upload functions
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      setProfilePictureFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadProfilePicture = async () => {
    if (!profilePictureFile) {
      toast.error('Please select an image first')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('profilePicture', profilePictureFile)

      const token = localStorage.getItem('token')
      const response = await axios.post('/api/users/profile-picture', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      toast.success('Profile picture updated successfully!')
      
      // Update user context
      await updateProfile({ ...user, profilePicture: response.data.user.profilePicture })
      
      // Reset states
      setProfilePictureFile(null)
      setProfilePicturePreview(null)
      
      // Reset file input
      const fileInput = document.getElementById('profilePictureInput')
      if (fileInput) fileInput.value = ''
      
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      toast.error(error.response?.data?.message || 'Failed to upload profile picture')
    } finally {
      setUploadingImage(false)
    }
  }

  const deleteProfilePicture = async () => {
    if (!user?.profilePicture) {
      toast.error('No profile picture to delete')
      return
    }

    setUploadingImage(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete('/api/users/profile-picture', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      toast.success('Profile picture deleted successfully!')
      
      // Update user context
      await updateProfile({ ...user, profilePicture: null })
      
    } catch (error) {
      console.error('Error deleting profile picture:', error)
      toast.error(error.response?.data?.message || 'Failed to delete profile picture')
    } finally {
      setUploadingImage(false)
    }
  }

  const getProfilePictureUrl = () => {
    if (profilePicturePreview) {
      return profilePicturePreview
    }
    if (user?.profilePicture) {
      return `/api/users/profile-picture/${user.profilePicture}`
    }
    return null
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ 
              color: 'var(--text-primary)', 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              margin: 0,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '-0.5px'
            }}>Profile 👤</h1>
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
                <small style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: 0.8
                }}>Email cannot be changed</small>
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
                  padding: '30px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                  {/* Profile Picture Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                      position: 'relative', 
                      display: 'inline-block',
                      marginBottom: '15px'
                    }}>
                      {getProfilePictureUrl() ? (
                        <img 
                          src={getProfilePictureUrl()}
                          alt="Profile"
                          style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '4px solid rgba(255,255,255,0.3)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem',
                          border: '4px solid rgba(255,255,255,0.3)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                          👤
                        </div>
                      )}
                    </div>
                    
                    {/* Profile Picture Upload Controls */}
                    <div style={{ marginBottom: '15px' }}>
                      <input
                        type="file"
                        id="profilePictureInput"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                      />
                      
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => document.getElementById('profilePictureInput').click()}
                          disabled={uploadingImage}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: 'white',
                            cursor: uploadingImage ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            opacity: uploadingImage ? 0.7 : 1
                          }}
                        >
                          📷 Select Image
                        </button>
                        
                        {profilePictureFile && (
                          <button
                            type="button"
                            onClick={uploadProfilePicture}
                            disabled={uploadingImage}
                            style={{
                              background: 'rgba(76, 175, 80, 0.8)',
                              border: '2px solid rgba(76, 175, 80, 0.9)',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              color: 'white',
                              cursor: uploadingImage ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}
                          >
                            {uploadingImage ? '⏳ Uploading...' : '✅ Upload'}
                          </button>
                        )}
                        
                        {user?.profilePicture && !profilePictureFile && (
                          <button
                            type="button"
                            onClick={deleteProfilePicture}
                            disabled={uploadingImage}
                            style={{
                              background: 'rgba(244, 67, 54, 0.8)',
                              border: '2px solid rgba(244, 67, 54, 0.9)',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              color: 'white',
                              cursor: uploadingImage ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    fontSize: '1.6rem', 
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>Personal Info</h3>
                  <p style={{ 
                    margin: '12px 0', 
                    fontSize: '16px', 
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    lineHeight: '1.5'
                  }}><strong style={{ fontSize: '17px' }}>Name:</strong> {user?.name}</p>
                  <p style={{ 
                    margin: '12px 0', 
                    fontSize: '16px', 
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    lineHeight: '1.5'
                  }}><strong style={{ fontSize: '17px' }}>Email:</strong> {user?.email}</p>
                  <p style={{ 
                    margin: '12px 0', 
                    fontSize: '16px', 
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    lineHeight: '1.5'
                  }}>
                    <strong style={{ fontSize: '17px' }}>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  color: 'white',
                  padding: '30px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    fontSize: '1.6rem', 
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>Activity Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      padding: '15px', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>{stats.totalMatches}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>Total Matches</div>
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      padding: '15px', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>{stats.totalMeetings}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>Total Meetings</div>
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      padding: '15px', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>{stats.pendingMeetings}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>Pending</div>
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      padding: '15px', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>{stats.acceptedMeetings}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>Accepted</div>
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      padding: '15px', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>{stats.completedMeetings}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>Completed</div>
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      padding: '15px', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>{user?.skillsKnown?.length + user?.skillsWanted?.length || 0}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>Total Skills</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, var(--bg-card), var(--bg-card-hover))',
                  padding: '30px',
                  borderRadius: '15px',
                  border: '3px solid var(--accent-success)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    color: 'var(--accent-success)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    fontSize: '1.4rem', 
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <span>🎓</span> Skills You Can Teach ({user?.skillsKnown?.length || 0})
                  </h3>
                  {user?.skillsKnown?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {user.skillsKnown.map((skill, index) => (
                        <span 
                          key={index}
                          style={{
                            background: 'var(--accent-success)',
                            color: 'white',
                            padding: '10px 18px',
                            borderRadius: '25px',
                            fontSize: '15px',
                            fontWeight: '600',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ 
                      color: 'var(--text-primary)', 
                      fontStyle: 'italic', 
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '1.6'
                    }}>No skills added yet. Add some skills to help others find you!</p>
                  )}
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, var(--bg-card), var(--bg-card-hover))',
                  padding: '30px',
                  borderRadius: '15px',
                  border: '3px solid var(--accent-secondary)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    color: 'var(--accent-secondary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    fontSize: '1.4rem', 
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <span>📚</span> Skills You Want to Learn ({user?.skillsWanted?.length || 0})
                  </h3>
                  {user?.skillsWanted?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {user.skillsWanted.map((skill, index) => (
                        <span 
                          key={index}
                          style={{
                            background: 'var(--accent-secondary)',
                            color: 'white',
                            padding: '10px 18px',
                            borderRadius: '25px',
                            fontSize: '15px',
                            fontWeight: '600',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ 
                      color: 'var(--text-primary)', 
                      fontStyle: 'italic', 
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '1.6'
                    }}>No learning goals set. Add skills you want to learn!</p>
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


