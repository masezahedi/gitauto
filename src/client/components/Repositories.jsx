import React, { useState, useEffect } from 'react'
import { Card, Button, Table, message, Spin, Empty } from 'antd'
import { DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import api from '../utils/api'

export default function Repositories() {
  const [repos, setRepos] = useState([])
  const [githubRepos, setGithubRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingGithub, setLoadingGithub] = useState(false)

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    setLoading(true)
    try {
      const response = await api.get('/repositories')
      setRepos(response.data)
    } catch (error) {
      message.error('خطا در دریافت مخازن')
    } finally {
      setLoading(false)
    }
  }

  const fetchGithubRepositories = async () => {
    setLoadingGithub(true)
    try {
      const response = await api.get('/repositories/github')
      setGithubRepos(response.data)
    } catch (error) {
      message.error('خطا در دریافت مخازن GitHub')
    } finally {
      setLoadingGithub(false)
    }
  }

  const handleAddRepository = async (repo) => {
    try {
      await api.post('/repositories', {
        github_repo_id: repo.id,
        repo_name: repo.name,
        repo_full_name: repo.full_name,
        repo_url: repo.clone_url,
      })
      message.success('مخزن اضافه شد')
      fetchRepositories()
    } catch (error) {
      message.error('خطا در اضافه کردن مخزن')
    }
  }

  const handleDeleteRepository = async (id) => {
    try {
      await api.delete(`/repositories/${id}`)
      message.success('مخزن حذف شد')
      fetchRepositories()
    } catch (error) {
      message.error('خطا در حذف مخزن')
    }
  }

  const repoColumns = [
    { title: 'نام', dataIndex: 'repo_full_name', key: 'repo_full_name' },
    { title: 'آدرس', dataIndex: 'repo_url', key: 'repo_url', render: (url) => <a href={url} target="_blank" rel="noreferrer">بیش‌تر</a> },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => (
        <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteRepository(record.id)}>
          حذف
        </Button>
      ),
    },
  ]

  const githubColumns = [
    { title: 'نام', dataIndex: 'full_name', key: 'full_name' },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => {
        const isAdded = repos.some(r => r.repo_full_name === record.full_name)
        return (
          <Button 
            type={isAdded ? 'default' : 'primary'} 
            size="small" 
            onClick={() => !isAdded && handleAddRepository(record)}
            disabled={isAdded}
          >
            {isAdded ? 'اضافه شده' : 'اضافه کن'}
          </Button>
        )
      },
    },
  ]

  return (
    <div>
      <Card title="مخازن من" style={{ marginBottom: '20px' }}>
        <Spin spinning={loading}>
          {repos.length === 0 ? (
            <Empty description="مخزنی اضافه نشده" />
          ) : (
            <Table dataSource={repos} columns={repoColumns} rowKey="id" pagination={false} />
          )}
        </Spin>
      </Card>

      <Card title="مخازن GitHub" extra={<Button icon={<SyncOutlined />} onClick={fetchGithubRepositories}>بروزرسانی</Button>}>
        <Spin spinning={loadingGithub}>
          {githubRepos.length === 0 ? (
            <Button type="primary" onClick={fetchGithubRepositories}>
              نمایش مخازن GitHub
            </Button>
          ) : (
            <Table dataSource={githubRepos} columns={githubColumns} rowKey="id" pagination={false} />
          )}
        </Spin>
      </Card>
    </div>
  )
}
