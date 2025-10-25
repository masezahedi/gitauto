import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Modal, Form, Input, Select, message, Spin, Empty, Tag, Space } from 'antd'
import { DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons'
import api from '../utils/api'
import CronScheduler from './SimpleCronScheduler'

export default function Automations() {
  const [automations, setAutomations] = useState([])
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [selectedAutomation, setSelectedAutomation] = useState(null)
  const [logs, setLogs] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    fetchAutomations()
    fetchRepositories()
  }, [])

  const fetchAutomations = async () => {
    setLoading(true)
    try {
      const response = await api.get('/automations')
      setAutomations(response.data)
    } catch (error) {
      message.error('خطا در دریافت اتوماسیون‌ها')
    } finally {
      setLoading(false)
    }
  }

  const fetchRepositories = async () => {
    try {
      const response = await api.get('/repositories')
      setRepositories(response.data)
    } catch (error) {
      console.error('Error fetching repositories:', error)
    }
  }

  const handleAddAutomation = async (values) => {
    try {
      await api.post('/automations', {
        repositoryId: parseInt(values.repository),
        filePath: values.filePath,
        contentToAdd: values.content,
        cronExpression: values.cron,
      })
      message.success('اتوماسیون اضافه شد')
      form.resetFields()
      setIsModalOpen(false)
      fetchAutomations()
    } catch (error) {
      message.error('خطا در اضافه کردن اتوماسیون')
    }
  }

  const handleDeleteAutomation = async (id) => {
    try {
      await api.delete(`/automations/${id}`)
      message.success('اتوماسیون حذف شد')
      fetchAutomations()
    } catch (error) {
      message.error('خطا در حذف اتوماسیون')
    }
  }

  const handleViewLogs = async (automation) => {
    try {
      const response = await api.get(`/automations/${automation.id}/logs`)
      setLogs(response.data)
      setSelectedAutomation(automation)
      setLogsModalOpen(true)
    } catch (error) {
      message.error('خطا در دریافت لاگ‌ها')
    }
  }


  const columns = [
    { title: 'مخزن', dataIndex: 'repo_full_name', key: 'repo_full_name' },
    { title: 'فایل', dataIndex: 'file_path', key: 'file_path' },
    { title: 'برنامه زمانی', dataIndex: 'schedule_description', key: 'schedule_description' },
    {
      title: 'وضعیت',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'فعال' : 'غیرفعال'}</Tag>,
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewLogs(record)}>لاگ‌ها</Button>
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteAutomation(record.id)}>حذف</Button>
        </Space>
      ),
    },
  ]

  const logColumns = [
    { title: 'وضعیت', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'success' ? 'green' : 'red'}>{status}</Tag> },
    { title: 'پیام', dataIndex: 'message', key: 'message' },
    { title: 'زمان', dataIndex: 'executed_at', key: 'executed_at', render: (date) => new Date(date).toLocaleString('fa-IR') },
  ]

  return (
    <div>
      <Card 
        title="اتوماسیون‌های من" 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>اضافه کردن</Button>}
      >
        <Spin spinning={loading}>
          {automations.length === 0 ? (
            <Empty description="اتوماسیونی تعریف نشده" />
          ) : (
            <Table dataSource={automations} columns={columns} rowKey="id" pagination={false} />
          )}
        </Spin>
      </Card>

      <Modal title="اضافه کردن اتوماسیون" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} onFinish={handleAddAutomation} layout="vertical">
          <Form.Item name="repository" label="مخزن" rules={[{ required: true, message: 'مخزن را انتخاب کنید' }]}>
            <Select placeholder="یک مخزن انتخاب کنید">
              {repositories.map(r => <Select.Option key={r.id} value={r.id}>{r.repo_full_name}</Select.Option>)}
            </Select>
          </Form.Item>
          
          <Form.Item name="filePath" label="مسیر فایل" rules={[{ required: true, message: 'مسیر فایل را وارد کنید' }]}>
            <Input placeholder="مثال: logs/daily.txt" />
          </Form.Item>

          <Form.Item name="content" label="محتوای اضافه شونده" rules={[{ required: true, message: 'محتوا را وارد کنید' }]}>
            <Input.TextArea rows={4} placeholder="محتوایی که هر روز اضافه شود" />
          </Form.Item>

          <Form.Item name="cron" label="برنامه CRON" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject('برنامه CRON را وارد کنید') }]}>
            <div><CronScheduler onChange={(value) => form.setFieldValue('cron', value)} /></div>
          </Form.Item>

          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>ایجاد</Button>
        </Form>
      </Modal>

      <Modal title={`لاگ‌های ${selectedAutomation?.file_path}`} open={logsModalOpen} onCancel={() => setLogsModalOpen(false)} width={800}>
        <Table dataSource={logs} columns={logColumns} rowKey="id" pagination={false} />
      </Modal>
    </div>
  )
}
