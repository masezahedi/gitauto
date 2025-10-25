import React, { useState } from 'react'
import { Card, Select, Checkbox, Button, Space, Tag, Input, TimePicker } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'جمعه', 'شنبه']
const daysValue = [6, 0, 1, 2, 3, 4, 5]

export default function CronScheduler({ value, onChange }) {
  const [mode, setMode] = useState('simple')
  const [selectedDays, setSelectedDays] = useState([])
  const [hours, setHours] = useState([])
  const [customCron, setCustomCron] = useState('')

  const generateCron = (daysArray, hoursArray) => {
    if (daysArray.length === 0 || hoursArray.length === 0) return ''
    const daysStr = daysArray.sort((a, b) => a - b).join(',')
    const hoursStr = hoursArray.sort((a, b) => a - b).join(',')
    return `0 ${hoursStr} * * ${daysStr}`
  }

  const handleDayChange = (dayIndex) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
      
      const cron = generateCron(newDays.map(i => daysValue[i]), hours)
      onChange(cron)
      return newDays
    })
  }

  const handleHourToggle = (h) => {
    setHours(prev => {
      const newHours = prev.includes(h)
        ? prev.filter(x => x !== h)
        : [...prev, h]
      
      const cron = generateCron(selectedDays.map(i => daysValue[i]), newHours)
      onChange(cron)
      return newHours
    })
  }

  const handleCustomCron = (e) => {
    const cron = e.target.value
    setCustomCron(cron)
    onChange(cron)
  }

  const presets = [
    { label: 'هر روز صبح 9', cron: '0 9 * * *', desc: 'هر روز ساعت 9 صبح' },
    { label: 'هر روز بعدازظهر 14', cron: '0 14 * * *', desc: 'هر روز ساعت 14 (2 بعدازظهر)' },
    { label: 'روزهای کاری صبح', cron: '0 9 * * 1-5', desc: 'شنبه تا چهارشنبه ساعت 9' },
    { label: 'هر 6 ساعت', cron: '0 */6 * * *', desc: '0, 6, 12, 18' },
    { label: 'هر ساعت', cron: '0 * * * *', desc: 'تمام ساعت‌ها' },
  ]

  return (
    <div>
      <Select 
        value={mode} 
        onChange={setMode}
        style={{ width: '100%', marginBottom: '20px' }}
        options={[
          { label: 'ساده (تقویم)', value: 'simple' },
          { label: 'پیشنهادات', value: 'presets' },
          { label: 'CRON پیشرفته', value: 'advanced' },
        ]}
      />

      {mode === 'simple' && (
        <Card title="انتخاب برنامه‌زمانی">
          <div style={{ marginBottom: '20px' }}>
            <p>روزهای هفته را انتخاب کنید:</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {days.map((day, idx) => (
                <Checkbox
                  key={idx}
                  checked={selectedDays.includes(idx)}
                  onChange={() => handleDayChange(idx)}
                  style={{
                    padding: '10px 15px',
                    border: selectedDays.includes(idx) ? '2px solid #667eea' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: selectedDays.includes(idx) ? '#f0f5ff' : '#fff',
                  }}
                >
                  {day}
                </Checkbox>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p>ساعت و دقیقه:</p>
            <TimePicker
              format="HH:mm"
              value={dayjs().hour(hour).minute(minute)}
              onChange={handleTimeChange}
              style={{ width: '100%' }}
            />
          </div>

          {selectedDays.length > 0 && (
            <div>
              <p>CRON Expression:</p>
              <Tag color="blue">{generateCron(selectedDays.map(i => daysValue[i]), hour, minute)}</Tag>
            </div>
          )}
        </Card>
      )}

      {mode === 'presets' && (
        <Card title="برنامه‌های پیشنهادی">
          <Space direction="vertical" style={{ width: '100%' }}>
            {presets.map((preset, idx) => (
              <Button
                key={idx}
                block
                onClick={() => onChange(preset.cron)}
                style={{ 
                  padding: '20px',
                  height: 'auto',
                  textAlign: 'right',
                }}
              >
                <div><strong>{preset.label}</strong></div>
                <div style={{ fontSize: '12px', color: '#666' }}>{preset.desc}</div>
                <Tag style={{ marginTop: '5px' }}>{preset.cron}</Tag>
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {mode === 'advanced' && (
        <Card title="CRON پیشرفته">
          <div style={{ marginBottom: '20px' }}>
            <p>فرمت CRON:</p>
            <textarea
              value={customCron}
              onChange={handleCustomCron}
              placeholder="مثال: 0 9 * * 1-5"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace',
                minHeight: '60px',
              }}
            />
          </div>

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
            <p><strong>راهنما:</strong></p>
            <code style={{ display: 'block', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
{`* * * * *
│ │ │ │ │
│ │ │ │ └─ روز هفته (0-6): 0=یکشنبه
│ │ │ └─── ماه (1-12)
│ │ └───── روز ماه (1-31)
│ └─────── ساعت (0-23)
└───────── دقیقه (0-59)`}
            </code>
            <p><strong>مثال‌ها:</strong></p>
            <ul>
              <li>0 9 * * * = هر روز ساعت 9</li>
              <li>*/5 * * * * = هر 5 دقیقه</li>
              <li>0 9,14 * * * = ساعت 9 و 14</li>
              <li>0 0 * * 1-5 = روزهای کاری شب‌های 12</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  )
}
