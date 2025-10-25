import React, { useState } from 'react'
import { Card, Select, Tag, Button, Input, Space } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'

const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'جمعه', 'شنبه']
const daysValue = [6, 0, 1, 2, 3, 4, 5]

export default function SimpleCronScheduler({ onChange }) {
  const [mode, setMode] = useState('simple')
  const [times, setTimes] = useState([]) // [{ day: 0, hour: 11, minute: 45 }, ...]
  const [tempHour, setTempHour] = useState('09')
  const [tempMinute, setTempMinute] = useState('00')
  const [tempDay, setTempDay] = useState(0)
  const [customCron, setCustomCron] = useState('')

  const generateCron = () => {
    if (times.length === 0) return ''
    
    const expressions = times.map(t => `${t.minute} ${t.hour} * * ${daysValue[t.day]}`)
    return expressions.join('\n')
  }

  const handleAddTime = () => {
    const hour = parseInt(tempHour)
    const minute = parseInt(tempMinute)
    
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      alert('ساعت یا دقیقه نامعتبر')
      return
    }

    const newTime = { day: tempDay, hour, minute }
    const newTimes = [...times, newTime]
    setTimes(newTimes)
    
    const cron = generateCron()
    onChange(cron)
    
    setTempHour('09')
    setTempMinute('00')
  }

  const handleRemoveTime = (idx) => {
    const newTimes = times.filter((_, i) => i !== idx)
    setTimes(newTimes)
    
    if (newTimes.length > 0) {
      const cron = newTimes.map(t => `${t.minute} ${t.hour} * * ${daysValue[t.day]}`).join('\n')
      onChange(cron)
    } else {
      onChange('')
    }
  }

  const handleCustomCron = (e) => {
    const cron = e.target.value
    setCustomCron(cron)
    onChange(cron)
  }

  return (
    <div>
      <Select 
        value={mode} 
        onChange={setMode}
        style={{ width: '100%', marginBottom: '20px' }}
        options={[
          { label: 'روز و ساعت و دقیقه', value: 'simple' },
          { label: 'CRON آزاد', value: 'custom' },
        ]}
      />

      {mode === 'simple' && (
        <Card title="اضافه کردن برنامه‌زمانی">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                روز
              </label>
              <Select
                value={tempDay}
                onChange={setTempDay}
                style={{ width: '100%' }}
                options={days.map((day, idx) => ({ label: day, value: idx }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  ساعت (0-23)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={tempHour}
                  onChange={(e) => setTempHour(e.target.value)}
                  placeholder="00"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  دقیقه (0-59)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={tempMinute}
                  onChange={(e) => setTempMinute(e.target.value)}
                  placeholder="00"
                />
              </div>
            </div>

            <Button 
              type="primary" 
              onClick={handleAddTime}
              style={{ width: '100%' }}
              icon={<PlusOutlined />}
            >
              اضافه کردن
            </Button>

            {times.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <p><strong>برنامه‌های اضافه شده:</strong></p>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {times.map((time, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        background: '#f0f5ff',
                        borderRadius: '4px',
                        border: '1px solid #667eea',
                      }}
                    >
                      <span>
                        <strong>{days[time.day]}</strong> - {time.hour.toString().padStart(2, '0')}:{time.minute.toString().padStart(2, '0')}
                      </span>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveTime(idx)}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <p><strong>CRON Expression:</strong></p>
                  {times.map((time, idx) => (
                    <Tag key={idx} color="blue" style={{ marginRight: '5px', marginBottom: '5px' }}>
                      {time.minute} {time.hour} * * {daysValue[time.day]}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Space>
        </Card>
      )}

      {mode === 'custom' && (
        <Card title="CRON پیشرفته">
          <textarea
            value={customCron}
            onChange={handleCustomCron}
            placeholder="هر خط یک CRON&#10;45 11 * * 6&#10;53 11 * * 6"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'monospace',
              minHeight: '100px',
            }}
          />
          <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <pre style={{ fontSize: '12px' }}>
{`فرمت: دقیقه ساعت * * روز

روز هفته:
0=یکشنبه، 1=دوشنبه، 2=سه‌شنبه
3=چهارشنبه، 4=پنجشنبه، 5=جمعه، 6=شنبه

مثال:
45 11 * * 6  → شنبه 11:45
53 11 * * 6  → شنبه 11:53
0 8 * * 1    → یکشنبه 08:00`}
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}
