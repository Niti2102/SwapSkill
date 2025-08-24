import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    skillsKnown: '',
    skillsWanted: ''
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Convert comma-separated skills to arrays
    const userData = {
      ...formData,
      skillsKnown: formData.skillsKnown.split(',').map(skill => skill.trim()).filter(skill => skill),
      skillsWanted: formData.skillsWanted.split(',').map(skill => skill.trim()).filter(skill => skill)
    }
    
    const success = await register(userData)
    if (success) {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '50px auto' }}>
        <h2>Join Skill Swap!</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Create your account and start swapping skills with others
        </p>
        
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
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="skillsKnown">Skills You Can Teach</label>
            <input
              type="text"
              id="skillsKnown"
              name="skillsKnown"
              value={formData.skillsKnown}
              onChange={handleChange}
              required
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
              required
              placeholder="e.g., Python, Painting, Spanish (comma-separated)"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#667eea', fontWeight: '600' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register


