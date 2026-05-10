import React, { useState, useEffect } from 'react';
import './MiniCalendar.css';

const MiniCalendar = ({ selectedDate, onChange, compact = false }) => {
  
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();

  const [currentMonth, setCurrentMonth] = useState(initialDate);

  
  useEffect(() => {
    if (selectedDate) {
      const parentDate = new Date(selectedDate);
      if (parentDate.getMonth() !== currentMonth.getMonth() || parentDate.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(parentDate);
      }
    }
  }, [selectedDate]);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${d}`;
    onChange(dateStr);
  };

  const renderGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const totalDays = daysInMonth(year, month);
    
    let startDay = firstDayOfMonth(year, month) - 1;
    if (startDay === -1) startDay = 6; 

    const days = [];

    
    const prevMonth = new Date(year, month - 1);
    const prevTotalDays = daysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="calendar-cell day outside-month">
          {prevTotalDays - i}
        </div>
      );
    }

    
    const today = new Date();
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

      days.push(
        <button
          key={`current-${d}`}
          className={`calendar-cell day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(d)}
        >
          {d}
        </button>
      );
    }

    
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push(
        <div key={`next-${i}`} className="calendar-cell day outside-month">
          {i}
        </div>
      );
    }

    return days;
  };

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  return (
    <div className={`mini-calendar dark-theme ${compact ? 'compact' : ''}`}>
      <div className="calendar-header">
        <div className="cal-month-year">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
        </div>
        <div className="cal-nav-group">
          <button type="button" onClick={handlePrevMonth} className="cal-nav-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </button>
          <button type="button" onClick={handleNextMonth} className="cal-nav-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        <div>จ</div>
        <div>อ</div>
        <div>พ</div>
        <div>พฤ</div>
        <div>ศ</div>
        <div>ส</div>
        <div>อา</div>
      </div>

      <div className="calendar-grid">
        {renderGrid()}
      </div>
    </div>
  );
};

export default MiniCalendar;
