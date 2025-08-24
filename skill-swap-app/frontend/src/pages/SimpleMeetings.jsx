import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

const SimpleMeetings = () => {
  const { user } = useAuth()
  
  console.log('SimpleMeetings rendering, user:', user)
  
  return (
    <div style={{ background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h1 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0' }}>Meetings 📅</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
            This is a test version of the meetings page.
          </p>
          
          {user ? (
            <div>
              <p style={{ color: 'var(--accent-success)' }}>✅ User is logged in: {user.name}</p>
              <p style={{ color: 'var(--text-primary)' }}>If you can see this, the basic routing and authentication work.</p>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--accent-error)' }}>❌ No user found</p>
            </div>
          )}
          
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: '15px', 
            borderRadius: '12px',
            marginTop: '20px',
            border: '1px solid var(--border-primary)'
          }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Debug Info:</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Component rendered successfully</p>
            <p style={{ color: 'var(--text-secondary)' }}>Current URL: {window.location.pathname}</p>
            <p style={{ color: 'var(--text-secondary)' }}>Timestamp: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleMeetings