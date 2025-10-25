import React, { useState } from 'react'
import { Card, Select, Tag, Button } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'

const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'جمعه', 'شنبه']
const daysValue = [6, 0, 1, 2, 3, 4, 5]

export default function CronScheduler({ onChange }) {
  const [mode, setMode] = useState('advanced')
  const [schedule, setSchedule] = useState({}) // { dayIndex: { hour: minute } }
  const [customCron, setCustomCron] = useState('')

  const generateCron = () => {
    const expressions = []
    
    Object.entries(schedule).forEach(([dayIdx, times]) => {
      if (Object.keys(times).length > 0) {
        const dayValue = daysValue[parseInt(dayIdx)]
        const timeEntries = Object.entries(times).sort((a, b) => {
          const [h1, m1] = a[0].split(':').map(Number)
          const [h2, m2] = b[0].split(':').map(Number)
          return h1 === h2 ? m1 - m2 : h1 - h2
        })
        
        timeEntries.forEach(([time, _]) => {
          const [hour, minute] = time.split(':').map(Number)
          expressions.push(`${minute} ${hour} * * ${dayValue}`)
        })
      }
    })
    
    return expressions
  }

  const handleDaySelection = (dayIdx) => {
    setSchedule(prev => {
      const newSchedule = { ...prev }
      if (newSchedule[dayIdx]) {
        delete newSchedule[dayIdx]
      } else {
        newSchedule[dayIdx] = {}
      }
      
      const crons = generateCron()
      onChange(crons.length > 0 ? crons.join('\n') : '')
      
      return newSchedule
    })
  }

  const handleAddTime = (dayIdx, hour, minute) => {
    setSchedule(prev => {
      const newSchedule = { ...prev }
      if (!newSchedule[dayIdx]) {
        newSchedule[dayIdx] = {}
      }
      
      const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      newSchedule[dayIdx][timeKey] = true
      
      const crons = generateCron()
      onChange(crons.length > 0 ? crons.join('\n') : '')
      
      return newSchedule
    })
  }

  const handleRemoveTime = (dayIdx, timeKey) => {
    setSchedule(prev => {
      const newSchedule = { ...prev }
      if (newSchedule[dayIdx]) {
        delete newSchedule[dayIdx][timeKey]
        if (Object.keys(newSchedule[dayIdx]).length === 0) {
          delete newSchedule[dayIdx]
        }
      }
      
      const crons = generateCron()
      onChange(crons.length > 0 ? crons.join('\n') : '')
      
      return newSchedule
    })
  }

  const handleCustomCron = (e) => {
    const cron = e.target.value
    setCustomCron(cron)
    onChange(cron)
  }

  const DayTimeSelector = ({ dayIdx, day }) => {
    const [hour, setHour] = useState(0)
    const [minute, setMinute] = useState(0)
    const times = schedule[dayIdx] || {}

    return (
      <div
        style={{
          padding: '15px',
          border: Object.keys(times).length > 0 ? '2px solid #667eea' : '1px solid #ddd',
          borderRadius: '4px',
          background: Object.keys(times).length > 0 ? '#f0f5ff' : '#fff',
        }}
      >
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => handleDaySelection(dayIdx)}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              background: Object.keys(times).length > 0 ? '#667eea' : '#f0f0f0',
              color: Object.keys(times).length > 0 ? '#fff' : '#000',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {day}
          </button>
        </div>

        {Object.keys(times).length > 0 && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ marginBottom: '10px', fontSize: '12px' }}>
                <strong>اوقات انتخاب شده:</strong>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.keys(times)
                  .sort()
                  .map(timeKey => (
                    <div
                      key={timeKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 10px',
                        background: '#52c41a',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {timeKey}
                      <button
                        onClick={() => handleRemoveTime(dayIdx, timeKey)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          padding: '0',
                          fontSize: '12px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  ساعت
                </label>
                <select
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  دقیقه
                </label>
                <select
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {Array.from({ length: 60 }, (_, i) => i).map(m => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleAddTime(dayIdx, hour, minute)}
                style={{
                  padding: '6px 12px',
                  background: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                اضافه
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <Select 
        value={mode} 
        onChange={setMode}
        style={{ width: '100%', marginBottom: '20px' }}
        options={[
          { label: 'روز به روز (ساعت و دقیقه)', value: 'advanced' },
          { label: 'CRON کاملا آزاد', value: 'custom' },
        ]}
      />

      {mode === 'advanced' && (
        <Card title="برنامه‌زمانی روز به روز">
          <div style={{ display: 'grid', gap: '15px' }}>
            {days.map((day, dayIdx) => (
              <DayTimeSelector key={dayIdx} dayIdx={dayIdx} day={day} />
            ))}
          </div>

          {Object.keys(schedule).length > 0 && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
              <p><strong>خلاصه برنامه:</strong></p>
              {Object.entries(schedule).map(([dayIdx, times]) => (
                Object.keys(times).length > 0 && (
                  <div key={dayIdx} style={{ fontSize: '12px', marginBottom: '5px' }}>
                    <strong>{days[dayIdx]}:</strong> {Object.keys(times).sort().join(', ')}
                  </div>
                )
              ))}
              <div style={{ marginTop: '10px' }}>
                <p><strong>CRON Expression(s):</strong></p>
                {generateCron().map((cron, idx) => (
                  <Tag key={idx} color="blue" style={{ marginRight: '5px', marginBottom: '5px', fontSize: '11px' }}>
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
              placeholder="هر خط یک CRON&#10;45 11 * * 6  (شنبه 11:45)&#10;53 11 * * 6  (شنبه 11:53)"
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
{`فرمت: دقیقه ساعت * * روز

روز هفته:
0 = یکشنبه
1 = دوشنبه
2 = سه‌شنبه
3 = چهارشنبه
4 = پنجشنبه
5 = جمعه
6 = شنبه

مثال:
45 11 * * 6  = شنبه ساعت 11:45
53 11 * * 6  = شنبه ساعت 11:53
0 8 * * 1    = یکشنبه ساعت 08:00
30 14 * * *  = هر روز ساعت 14:30`}
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}
