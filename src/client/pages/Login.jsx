import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, message } from 'antd'
import { GithubOutlined } from '@ant-design/icons'
import api from '../utils/api'

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if token in URL (from OAuth callback)
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    
    if (token) {
      localStorage.setItem('token', token)
      navigate('/dashboard')
    }
  }, [navigate])

  const handleGitHubLogin = async () => {
    try {
      const response = await api.get('/auth/github/url')
      window.location.href = response.data.authUrl
    } catch (error) {
      message.error('خطا در دریافت URL لاگین')
    }
  }

  const isLoggedIn = localStorage.getItem('token')

  if (isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>درحال بارگذاری...</h1>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ marginBottom: '30px' }}>اتوماسیون GitHub</h1>
        <p style={{ marginBottom: '30px', color: '#666' }}>
          اتوماسیون عملیات Git را با یک روش ساده و قدرتمند انجام دهید
        </p>
        <Button 
          type="primary" 
          size="large" 
          icon={<GithubOutlined />}
          onClick={handleGitHubLogin}
          style={{ width: '100%' }}
        >
          ورود با GitHub
        </Button>
      </div>
    </div>
  )
}
