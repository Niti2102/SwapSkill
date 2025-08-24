import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'

const Matches = () => {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await axios.get('/api/swipe/matches')
      setMatches(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast.error('Failed to load matches')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading">Loading matches...</div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          <h1>Your Matches 💕</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            These are your skill swap partners! Start chatting and schedule meetings.
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>No Matches Yet</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Start swiping to find your skill partners!
            </p>
            <Link to="/swipe" className="btn">
              Start Swiping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {matches.map((match) => (
              <div key={match._id} className="card">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👤</div>
                  <h3>{match.name}</h3>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#28a745', marginBottom: '10px' }}>Can Teach:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {match.skillsKnown?.map((skill, index) => (
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
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#007bff', marginBottom: '10px' }}>Wants to Learn:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {match.skillsWanted?.map((skill, index) => (
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
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link 
                    to={`/chat?userId=${match._id}`} 
                    className="btn btn-success"
                    style={{ flex: 1 }}
                  >
                    💬 Chat
                  </Link>
                  <Link 
                    to={`/meetings?userId=${match._id}`} 
                    className="btn"
                    style={{ flex: 1 }}
                  >
                    📅 Schedule Meeting
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Matches


