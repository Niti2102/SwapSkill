import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

const DebugPanel = () => {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState(null)
  const [testing, setTesting] = useState(false)

  const runDiagnostics = async () => {
    setTesting(true)
    const results = {
      timestamp: new Date().toISOString(),
      user: !!user,
      token: !!localStorage.getItem('token'),
      baseURL: axios.defaults.baseURL,
      tests: {}
    }

    // Test basic API connectivity
    try {
      const response = await axios.get('/')
      results.tests.apiConnectivity = {
        status: 'success',
        message: 'API server is reachable',
        data: response.data
      }
    } catch (error) {
      results.tests.apiConnectivity = {
        status: 'error',
        message: 'Cannot reach API server',
        error: error.message
      }
    }

    // Test authentication endpoint
    try {
      const response = await axios.get('/api/auth/profile')
      results.tests.authEndpoint = {
        status: 'success',
        message: 'Authentication working',
        data: response.data
      }
    } catch (error) {
      results.tests.authEndpoint = {
        status: 'error',
        message: 'Authentication failed',
        error: error.response?.data || error.message,
        status_code: error.response?.status
      }
    }

    // Test matches endpoint
    try {
      const response = await axios.get('/api/swipe/matches')
      results.tests.matchesEndpoint = {
        status: 'success',
        message: 'Matches endpoint working',
        count: Array.isArray(response.data) ? response.data.length : 'N/A'
      }
    } catch (error) {
      results.tests.matchesEndpoint = {
        status: 'error',
        message: 'Matches endpoint failed',
        error: error.response?.data || error.message,
        status_code: error.response?.status
      }
    }

    // Test meetings endpoint
    try {
      const response = await axios.get('/api/meetings/my-meetings')
      const meetings = Array.isArray(response.data) ? response.data : []
      const completedMeetings = meetings.filter(m => m.status === 'completed')
      
      results.tests.meetingsEndpoint = {
        status: 'success',
        message: 'Meetings endpoint working',
        count: meetings.length,
        completed: completedMeetings.length
      }
    } catch (error) {
      results.tests.meetingsEndpoint = {
        status: 'error',
        message: 'Meetings endpoint failed',
        error: error.response?.data || error.message,
        status_code: error.response?.status
      }
    }

    setDebugInfo(results)
    setTesting(false)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-primary)',
      borderRadius: '12px',
      padding: '15px',
      maxWidth: '300px',
      fontSize: '12px',
      zIndex: 1000,
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Debug Panel</h4>
        <button
          onClick={runDiagnostics}
          disabled={testing}
          style={{
            background: 'var(--accent-primary)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            color: 'white',
            cursor: testing ? 'not-allowed' : 'pointer',
            fontSize: '10px'
          }}
        >
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
      </div>
      
      <div style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
        <div>👤 User: {user ? '✅ Logged in' : '❌ Not logged in'}</div>
        <div>🔑 Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</div>
        <div>🌐 API: {axios.defaults.baseURL}</div>
      </div>

      {debugInfo && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px',
          background: 'var(--bg-secondary)',
          borderRadius: '6px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-primary)' }}>
            Test Results:
          </div>
          {Object.entries(debugInfo.tests).map(([key, result]) => (
            <div key={key} style={{ marginBottom: '5px' }}>
              <span style={{ 
                color: result.status === 'success' ? 'var(--accent-success)' : 'var(--accent-error)' 
              }}>
                {result.status === 'success' ? '✅' : '❌'}
              </span>
              <span style={{ marginLeft: '5px', color: 'var(--text-secondary)' }}>
                {key}: {result.message}
              </span>
              {result.count !== undefined && (
                <span style={{ color: 'var(--text-muted)' }}> 
                  ({result.count}{result.completed !== undefined ? `, ${result.completed} completed` : ''})
                </span>
              )}
              {result.status_code && (
                <span style={{ color: 'var(--accent-error)' }}> [{result.status_code}]</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DebugPanel