import { type ShiftSchedule } from '../utils/schedule';
import { ScheduleItem } from './ScheduleItem';
import './ScheduleList.css';

interface ScheduleListProps {
  schedule: ShiftSchedule[];
}

export function ScheduleList({ schedule }: ScheduleListProps) {
  const now = new Date();

  return (
    <div className="schedule-panel">
      <h2>排班表</h2>
      <div className="schedule-list">
        {schedule.map((shift, index) => {
          const isActive = now >= shift.startTime && now < shift.endTime;
          return <ScheduleItem key={index} shift={shift} isActive={isActive} />;
        })}
      </div>
    </div>
  );
}

