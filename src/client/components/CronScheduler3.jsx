import React, { useState } from 'react'
import { Card, Select, Tag, Button, Space } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'جمعه', 'شنبه']
const daysValue = [6, 0, 1, 2, 3, 4, 5]

export default function CronScheduler({ onChange }) {
  const [mode, setMode] = useState('advanced')
  const [schedule, setSchedule] = useState({}) // { dayIndex: [hours] }
  const [customCron, setCustomCron] = useState('')

  const generateCron = () => {
    const cronParts = {}
    
    Object.entries(schedule).forEach(([dayIdx, hours]) => {
      if (hours.length > 0) {
        const dayValue = daysValue[parseInt(dayIdx)]
        hours.forEach(h => {
          const key = `${h},${dayValue}`
          if (!cronParts[key]) {
            cronParts[key] = []
          }
        })
      }
    })

    // Convert to proper CRON format
    const hoursToDays = {}
    Object.entries(schedule).forEach(([dayIdx, hours]) => {
      if (hours.length > 0) {
        const dayValue = daysValue[parseInt(dayIdx)]
        hours.forEach(h => {
          if (!hoursToDays[h]) {
            hoursToDays[h] = []
          }
          hoursToDays[h].push(dayValue)
        })
      }
    })

    // Generate multiple cron expressions or single one if possible
    const expressions = []
    Object.entries(hoursToDays).forEach(([hour, daysList]) => {
      const uniqueDays = [...new Set(daysList)].sort((a, b) => a - b)
      expressions.push(`0 ${hour} * * ${uniqueDays.join(',')}`)
    })

    return expressions.length > 0 ? expressions : []
  }

  const handleDaySelection = (dayIdx) => {
    setSchedule(prev => {
      const newSchedule = { ...prev }
      if (newSchedule[dayIdx]) {
        delete newSchedule[dayIdx]
      } else {
        newSchedule[dayIdx] = []
      }
      
      const crons = generateCron()
      onChange(crons.length > 0 ? crons[0] : '')
      
      return newSchedule
    })
  }

  const handleHourToggle = (dayIdx, hour) => {
    setSchedule(prev => {
      const newSchedule = { ...prev }
      if (!newSchedule[dayIdx]) {
        newSchedule[dayIdx] = []
      }
      
      if (newSchedule[dayIdx].includes(hour)) {
        newSchedule[dayIdx] = newSchedule[dayIdx].filter(h => h !== hour)
        if (newSchedule[dayIdx].length === 0) {
          delete newSchedule[dayIdx]
        }
      } else {
        newSchedule[dayIdx] = [...newSchedule[dayIdx], hour]
      }
      
      const crons = generateCron()
      onChange(crons.length > 0 ? crons[0] : '')
      
      return newSchedule
    })
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
          { label: 'روز به روز (متقدم)', value: 'advanced' },
          { label: 'CRON کاملا آزاد', value: 'custom' },
        ]}
      />

      {mode === 'advanced' && (
        <Card title="برنامه‌زمانی روز به روز">
          <div style={{ display: 'grid', gap: '20px' }}>
            {days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                style={{
                  padding: '15px',
                  border: schedule[dayIdx] ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '4px',
                  background: schedule[dayIdx] ? '#f0f5ff' : '#fff',
                }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <button
                    onClick={() => handleDaySelection(dayIdx)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      background: schedule[dayIdx] ? '#667eea' : '#f0f0f0',
                      color: schedule[dayIdx] ? '#fff' : '#000',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {day}
                  </button>
                  {schedule[dayIdx] && (
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                      ساعات: {schedule[dayIdx].sort((a, b) => a - b).join(', ')}
                    </span>
                  )}
                </div>

                {schedule[dayIdx] && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                    {Array.from({ length: 24 }, (_, i) => i).map(h => (
                      <button
                        key={h}
                        onClick={() => handleHourToggle(dayIdx, h)}
                        style={{
                          padding: '8px',
                          border: schedule[dayIdx].includes(h) ? '2px solid #52c41a' : '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          background: schedule[dayIdx].includes(h) ? '#52c41a' : '#fff',
                          color: schedule[dayIdx].includes(h) ? '#fff' : '#000',
                          fontWeight: schedule[dayIdx].includes(h) ? 'bold' : 'normal',
                          fontSize: '12px',
                        }}
                      >
                        {h.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {Object.keys(schedule).length > 0 && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
              <p><strong>خلاصه برنامه:</strong></p>
              {Object.entries(schedule).map(([dayIdx, hours]) => (
                hours.length > 0 && (
                  <div key={dayIdx} style={{ fontSize: '12px', marginBottom: '5px' }}>
                    <strong>{days[dayIdx]}:</strong> ساعات {hours.sort((a, b) => a - b).join(', ')}
                  </div>
                )
              ))}
              <div style={{ marginTop: '10px' }}>
                <p><strong>CRON:</strong></p>
                {generateCron().map((cron, idx) => (
                  <Tag key={idx} color="blue" style={{ marginRight: '5px', marginBottom: '5px' }}>
                    {cron}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {mode === 'custom' && (
        <Card title="CRON کاملا آزاد">
          <div style={{ marginBottom: '20px' }}>
            <p><strong>CRON Expression(s):</strong></p>
            <textarea
              value={customCron}
              onChange={handleCustomCron}
              placeholder="مثال:&#10;0 11,13,23 * * 6&#10;0 8 * * 1&#10;0 9 * * 5"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace',
                minHeight: '100px',
              }}
            />
          </div>

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
            <p><strong>راهنما:</strong></p>
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
{`هر خط یک CRON expression

مثال:
0 11,13,23 * * 6  = شنبه ساعات 11, 13, 23
0 8 * * 1         = یکشنبه ساعت 8
0 9 * * 5         = پنجشنبه ساعت 9

فرمت:
* * * * *
│ │ │ │ │
│ │ │ │ └─ روز هفته (0=یکشنبه، 6=شنبه)
│ │ │ └─── ماه (1-12)
│ │ └───── روز ماه (1-31)
│ └─────── ساعت (0-23)
└───────── دقیقه (0-59)`}
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}
