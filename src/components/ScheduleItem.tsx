import { formatDateTime, getDayName, type ShiftSchedule } from '../utils/schedule';
import './ScheduleItem.css';

interface ScheduleItemProps {
  shift: ShiftSchedule;
  isActive: boolean;
}

export function ScheduleItem({ shift, isActive }: ScheduleItemProps) {
  const isWork = shift.type === 'work';
  const isWeekend = shift.type === 'weekend';
  const dayName = getDayName(shift.startTime.getDay());

  return (
    <div
      className={`schedule-item ${isWork ? 'work' : isWeekend ? 'weekend' : 'rest'} ${isActive ? 'active' : ''}`}
    >
      <div className="schedule-type">
        <span className="type-icon">
          {isWork ? '💼' : '😴'}
        </span>
        <span className="type-label">
          {isWork ? '上班' : '休息'}
        </span>
        <span className="day-name">{dayName}</span>
      </div>
      <div className="schedule-time">
        <div className="time-row">
          <span className="time-label">开始：</span>
          <span className="time-value">{formatDateTime(shift.startTime)}</span>
        </div>
        <div className="time-row">
          <span className="time-label">结束：</span>
          <span className="time-value">{formatDateTime(shift.endTime)}</span>
        </div>
      </div>
      {isActive && <div className="active-badge">进行中</div>}
    </div>
  );
}

