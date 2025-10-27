import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Menu, Button, Spin, message } from 'antd'
import { LogoutOutlined, SettingOutlined, BarsOutlined } from '@ant-design/icons'
import api from '../utils/api'
import Automations from '../components/Automations'
import Repositories from '../components/Repositories'
import AdminPanel from '../components/AdminPanel'

const { Header, Sider, Content } = Layout

export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedMenu, setSelectedMenu] = useState('automations')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
      setLoading(false)
    } catch (error) {
      message.error('خطا در دریافت اطلاعات کاربر')
      localStorage.removeItem('token')
      navigate('/')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  const isAdmin = user?.is_admin === true

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  const menuItems = [
    { key: 'automations', label: 'اتوماسیون‌ها', icon: <BarsOutlined /> },
    { key: 'repositories', label: 'مخازن', icon: <BarsOutlined /> },
  ]

  if (isAdmin) {
    menuItems.push({ key: 'admin', label: 'مدیریت', icon: <SettingOutlined /> })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ color: 'white', padding: '20px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          {!collapsed && 'اتوماسیون GitHub'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['automations']}
          selectedKeys={[selectedMenu]}
          items={menuItems}
          onClick={(e) => setSelectedMenu(e.key)}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Button type="text" onClick={() => setCollapsed(!collapsed)}>
            ☰
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {user && <span>{user.github_username}</span>}
            <Button type="primary" danger onClick={handleLogout} icon={<LogoutOutlined />}>
              خروج
            </Button>
          </div>
        </Header>

        <Content style={{ padding: '20px' }}>
          {selectedMenu === 'automations' && <Automations user={user} />}
          {selectedMenu === 'repositories' && <Repositories user={user} />}
          {selectedMenu === 'admin' && isAdmin && <AdminPanel />}
        </Content>
      </Layout>
    </Layout>
  )
}
