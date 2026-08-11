import React, { useState } from 'react';

export default function AttendanceCalendar({ attendanceData = {} }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate days in current month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Status Styling Map
  const getBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return { bg: '#dcfce7', color: '#15803d', label: 'P' };
      case 'absent':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'A' };
      case 'leave':
        return { bg: '#ffedd5', color: '#c2410c', label: 'L' };
      default:
        return null;
    }
  };

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '650px' }}>
      
      {/* Calendar Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={handlePrevMonth} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>
          ← Prev
        </button>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
          {monthNames[month]} {year}
        </h3>
        <button onClick={handleNextMonth} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>
          Next →
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
        <span style={{ color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>P = Present</span>
        <span style={{ color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>A = Absent</span>
        <span style={{ color: '#c2410c', background: '#ffedd5', padding: '2px 8px', borderRadius: '4px' }}>L = Leave</span>
      </div>

      {/* Weekday Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {blankDays.map((_, i) => (
          <div key={`blank-${i}`} style={{ height: '55px', background: '#f8fafc', borderRadius: '6px' }} />
        ))}

        {daysArray.map((day) => {
          // Format date key string to match Firestore key (YYYY-MM-DD)
          const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = attendanceData[formattedDate];
          const badge = getBadgeStyle(status);

          return (
            <div 
              key={day} 
              style={{ 
                height: '55px', 
                border: '1px solid #f1f5f9', 
                borderRadius: '6px', 
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                alignItems: 'center',
                background: badge ? badge.bg : '#fff'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{day}</span>
              {badge && (
                <span 
                  style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 800, 
                    color: badge.color,
                    padding: '2px 6px',
                    borderRadius: '50%'
                  }}
                >
                  {badge.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}