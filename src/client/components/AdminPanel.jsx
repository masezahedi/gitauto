import React, { useState, useEffect } from 'react'
import { Card, Table, Statistic, Row, Col, Spin, message } from 'antd'
import { UserOutlined, CodeOutlined, BarsOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import api from '../utils/api'

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [automations, setAutomations] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, autosRes, logsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/automations'),
        api.get('/admin/logs'),
      ])
      
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setAutomations(autosRes.data)
      setLogs(logsRes.data)
    } catch (error) {
      message.error('خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const userColumns = [
    { title: 'نام کاربری', dataIndex: 'github_username', key: 'github_username' },
    { title: 'ایمیل', dataIndex: 'email', key: 'email' },
    { title: 'نام', dataIndex: 'name', key: 'name' },
    { title: 'تاریخ عضویت', dataIndex: 'created_at', key: 'created_at', render: (date) => new Date(date).toLocaleDateString('fa-IR') },
  ]

  const automationColumns = [
    { title: 'کاربر', dataIndex: 'github_username', key: 'github_username' },
    { title: 'مخزن', dataIndex: 'repo_full_name', key: 'repo_full_name' },
    { title: 'فایل', dataIndex: 'file_path', key: 'file_path' },
    { title: 'برنامه', dataIndex: 'schedule_description', key: 'schedule_description' },
  ]

  const logColumns = [
    { title: 'کاربر', dataIndex: 'github_username', key: 'github_username' },
    { title: 'مخزن', dataIndex: 'repo_name', key: 'repo_name' },
    { title: 'فایل', dataIndex: 'file_path', key: 'file_path' },
    { title: 'وضعیت', dataIndex: 'status', key: 'status', render: (status) => status === 'success' ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} /> },
    { title: 'زمان', dataIndex: 'executed_at', key: 'executed_at', render: (date) => new Date(date).toLocaleString('fa-IR') },
  ]

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center' }} />
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="کل کاربران" value={stats?.total_users} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="مخازن" value={stats?.total_repositories} prefix={<CodeOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="اتوماسیون‌ها" value={stats?.total_automations} prefix={<BarsOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="اجراهای موفق" value={stats?.successful_executions} prefix={<CheckOutlined />} style={{ color: 'green' }} />
          </Card>
        </Col>
      </Row>

      <Card title="کاربران" style={{ marginBottom: '20px' }}>
        <Table dataSource={users} columns={userColumns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Card title="اتوماسیون‌ها" style={{ marginBottom: '20px' }}>
        <Table dataSource={automations} columns={automationColumns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Card title="لاگ‌های اجرا">
        <Table dataSource={logs} columns={logColumns} rowKey="id" pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  )
}
