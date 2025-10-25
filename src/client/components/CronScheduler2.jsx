import React, { useState } from 'react'
import { Card, Select, Tag } from 'antd'

const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'جمعه', 'شنبه']
const daysValue = [6, 0, 1, 2, 3, 4, 5]

export default function CronScheduler({ onChange }) {
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
    { label: 'هر روز بعدازظهر 14', cron: '0 14 * * *', desc: 'هر روز ساعت 14' },
    { label: 'روزهای کاری صبح', cron: '0 9 * * 1-5', desc: 'شنبه تا چهارشنبه ساعت 9' },
    { label: 'هر 6 ساعت', cron: '0 */6 * * *', desc: '0, 6, 12, 18' },
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
            <p><strong>روزهای هفته:</strong></p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {days.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDayChange(idx)}
                  style={{
                    padding: '10px 15px',
                    border: selectedDays.includes(idx) ? '2px solid #667eea' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: selectedDays.includes(idx) ? '#667eea' : '#fff',
                    color: selectedDays.includes(idx) ? '#fff' : '#000',
                    fontWeight: selectedDays.includes(idx) ? 'bold' : 'normal',
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p><strong>ساعات (0-23):</strong></p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <button
                  key={h}
                  onClick={() => handleHourToggle(h)}
                  style={{
                    padding: '10px',
                    border: hours.includes(h) ? '2px solid #52c41a' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: hours.includes(h) ? '#52c41a' : '#fff',
                    color: hours.includes(h) ? '#fff' : '#000',
                    fontWeight: hours.includes(h) ? 'bold' : 'normal',
                  }}
                >
                  {h.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          {selectedDays.length > 0 && hours.length > 0 && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
              <p><strong>CRON Expression:</strong></p>
              <Tag color="blue">{generateCron(selectedDays.map(i => daysValue[i]), hours)}</Tag>
              <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                روزها: {selectedDays.map(i => days[i]).join(', ')} | ساعات: {hours.join(', ')}
              </p>
            </div>
          )}
        </Card>
      )}

      {mode === 'presets' && (
        <Card title="برنامه‌های پیشنهادی">
          <div style={{ display: 'grid', gap: '10px' }}>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => onChange(preset.cron)}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: '#fff',
                  textAlign: 'right',
                  transition: 'all 0.3s',
                }}
                onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
                onMouseOut={(e) => e.target.style.background = '#fff'}
              >
                <div><strong>{preset.label}</strong></div>
                <div style={{ fontSize: '12px', color: '#666' }}>{preset.desc}</div>
                <Tag style={{ marginTop: '5px' }}>{preset.cron}</Tag>
              </button>
            ))}
          </div>
        </Card>
      )}

      {mode === 'advanced' && (
        <Card title="CRON پیشرفته">
          <div style={{ marginBottom: '20px' }}>
            <p><strong>CRON Expression:</strong></p>
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
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
{`* * * * *
│ │ │ │ │
│ │ │ │ └─ روز هفته (0-6)
│ │ │ └─── ماه (1-12)
│ │ └───── روز ماه (1-31)
│ └─────── ساعت (0-23)
└───────── دقیقه (0-59)`}
            </pre>
            <p><strong>مثال‌ها:</strong></p>
            <ul style={{ fontSize: '12px' }}>
              <li>0 9 * * * = هر روز ساعت 9</li>
              <li>0 9,14,23 * * * = ساعات 9، 14، 23</li>
              <li>0 9,14 * * 0,6 = جمعه و شنبه ساعات 9 و 14</li>
              <li>*/5 * * * * = هر 5 دقیقه</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  )
}
