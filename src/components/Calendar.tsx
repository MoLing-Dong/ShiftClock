import { useState, useMemo, useEffect } from 'react';
import { type ShiftSchedule, formatDate, formatTime } from '../utils/schedule';
import './Calendar.css';

interface CalendarProps {
    schedule: ShiftSchedule[];
    startDate: Date;
    scheduleConfig: any; // Add scheduleConfig here
}

interface DayInfo {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    shifts: ShiftSchedule[];
    primaryType: 'work' | 'rest' | 'weekend' | null;
    workShiftStartDisplay: Date | null; // 当天开始的工作班次的开始时间
    workShiftEndDisplay: Date | null;   // 当天结束的工作班次的结束时间
}

export function Calendar({ schedule, startDate, scheduleConfig }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(startDate));

    // 当起始日期改变时，更新当前月份
    useEffect(() => {
        setCurrentMonth(new Date(startDate));
    }, [startDate]);

    // 获取月份的第一天和最后一天
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 将排班数据按日期组织
    const scheduleByDate = useMemo(() => {
        const map = new Map<string, ShiftSchedule[]>();

        schedule.forEach(shift => {
            const start = new Date(shift.startTime);
            const end = new Date(shift.endTime);

            // 遍历这个时间段内的每一天
            const current = new Date(start);
            current.setHours(0, 0, 0, 0);

            while (current <= end) {
                const dateKey = formatDate(current);
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey)!.push(shift);
                current.setDate(current.getDate() + 1);
            }
        });

        return map;
    }, [schedule]);

    // Helper to determine if a date is the same day as another
    const isSameDay = (d1: Date, d2: Date) => formatDate(d1) === formatDate(d2);

    // 获取某一天的主要状态和工作时间
    const getDayInfoLogic = (
        date: Date,
        shifts: ShiftSchedule[]
    ): {
        primaryType: 'work' | 'rest' | 'weekend' | null;
        workShiftStartDisplay: Date | null; // 当天开始的工作班次的开始时间
        workShiftEndDisplay: Date | null;   // 当天结束的工作班次的结束时间
    } => {
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

        let primaryType: 'work' | 'rest' | 'weekend' | null = null;
        let workShiftStartDisplay: Date | null = null;
        let workShiftEndDisplay: Date | null = null;
        let hasWorkShiftStartingOnThisDay = false; // 标记当天是否有工作班次开始
        let hasWorkShiftEndingOnThisDay = false;   // 标记当天是否有工作班次结束

        let hasWeekendShift = false;

        shifts.forEach(shift => {
            // 1. Track weekend shifts (but don't set primaryType yet)
            if (shift.type === 'weekend') {
                hasWeekendShift = true;
            }

            // 2. Extract specific start/end times for display, and track work/rest activity
            if (shift.type === 'work') {
                // 记录工作时间：如果工作时间在当天开始，记录开始时间
                if (shift.startTime >= dayStart && shift.startTime <= dayEnd) {
                    hasWorkShiftStartingOnThisDay = true;
                    if (!workShiftStartDisplay || shift.startTime < workShiftStartDisplay) {
                        workShiftStartDisplay = new Date(shift.startTime);
                    }
                }

                // 如果工作时间在当天结束，记录结束时间
                // 注意：如果endTime跨天，endTime可能会大于dayEnd，但仍然是当天的工作结束
                const shiftEndForDay = (shift.endTime > dayEnd && shift.startTime <= dayEnd) ? dayEnd : shift.endTime; // 如果跨天，算到当天23:59:59

                if (shiftEndForDay >= dayStart && shift.startTime <= dayEnd) { // 确保班次在当天有部分或全部
                    hasWorkShiftEndingOnThisDay = true;
                    if (!workShiftEndDisplay || shift.endTime > workShiftEndDisplay) { // 记录实际的结束时间，可能跨天
                        workShiftEndDisplay = new Date(shift.endTime);
                    }
                }
            }
        });

        // 3. 根据优先级设置 primaryType
        // 优先级：工作 > 休息日 > 休息
        // 如果当天有工作班次，优先显示工作状态，即使也有休息日标记
        if (hasWorkShiftStartingOnThisDay || hasWorkShiftEndingOnThisDay) {
            // 有工作班次，优先显示工作状态
            // 特殊逻辑：无休息日模式下，如果下班时间在12点之前，显示为休息日icon
            if (scheduleConfig?.restDayType === 'none' && workShiftEndDisplay !== null) {
                // 检查下班时间是否在同一天且在12点之前
                const endTime: Date = workShiftEndDisplay;
                if (isSameDay(endTime, date) && endTime.getHours() < 12) {
                    primaryType = 'weekend';
                } else {
                    primaryType = 'work';
                }
            } else {
                primaryType = 'work';
            }
        } else if (hasWeekendShift) {
            // 没有工作班次，但有休息日标记，显示为休息日
            primaryType = 'weekend';
        } else {
            // 当天没有任何工作班次和休息日标记，视为休息
            primaryType = 'rest';
        }

        return { primaryType, workShiftStartDisplay, workShiftEndDisplay };
    };

    // 生成日历天数数组
    const calendarDays = useMemo(() => {
        const days: DayInfo[] = [];

        // 获取月份第一天是星期几（0=周日）
        const firstDayOfMonth = monthStart.getDay();

        // 添加上个月的末尾几天（用于填充第一周）
        const prevMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const date = new Date(prevMonthEnd);
            date.setDate(prevMonthEnd.getDate() - i);
            const dateKey = formatDate(date);
            const shifts = scheduleByDate.get(dateKey) || [];
            const { primaryType, workShiftStartDisplay, workShiftEndDisplay } = getDayInfoLogic(date, shifts);

            days.push({
                date: new Date(date),
                day: date.getDate(),
                isCurrentMonth: false,
                isToday: isSameDay(date, today),
                shifts,
                primaryType,
                workShiftStartDisplay,
                workShiftEndDisplay,
            });
        }

        // 添加当前月的所有天数
        for (let day = 1; day <= monthEnd.getDate(); day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateKey = formatDate(date);
            const shifts = scheduleByDate.get(dateKey) || [];
            const { primaryType, workShiftStartDisplay, workShiftEndDisplay } = getDayInfoLogic(date, shifts);

            days.push({
                date: new Date(date),
                day,
                isCurrentMonth: true,
                isToday: isSameDay(date, today),
                shifts,
                primaryType,
                workShiftStartDisplay,
                workShiftEndDisplay,
            });
        }

        // 添加下个月的开头几天（用于填充最后一周）
        const remainingDays = 42 - days.length; // 6周 * 7天 = 42
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day);
            const dateKey = formatDate(date);
            const shifts = scheduleByDate.get(dateKey) || [];
            const { primaryType, workShiftStartDisplay, workShiftEndDisplay } = getDayInfoLogic(date, shifts);

            days.push({
                date: new Date(date),
                day,
                isCurrentMonth: false,
                isToday: isSameDay(date, today),
                shifts,
                primaryType,
                workShiftStartDisplay,
                workShiftEndDisplay,
            });
        }

        return days;
    }, [currentMonth, scheduleByDate, today, scheduleConfig]); // Add scheduleConfig to dependencies

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentMonth(new Date(today));
    };

    const monthName = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

    return (
        <div className="calendar-panel">
            <div className="calendar-header">
                <h2>排班日历</h2>
                <div className="calendar-controls">
                    <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                        ← 上个月
                    </button>
                    <button className="calendar-month-btn" onClick={handleToday}>
                        {monthName}
                    </button>
                    <button className="calendar-nav-btn" onClick={handleNextMonth}>
                        下个月 →
                    </button>
                </div>
            </div>

            <div className="calendar-grid">
                {/* 星期标题 */}
                <div className="calendar-weekdays">
                    {weekDays.map((day, index) => (
                        <div key={index} className="calendar-weekday">
                            {day}
                        </div>
                    ))}
                </div>

                {/* 日期网格 */}
                <div className="calendar-days">
                    {calendarDays.map((dayInfo, index) => {
                        const { date, day, isCurrentMonth, isToday, primaryType, workShiftStartDisplay, workShiftEndDisplay } = dayInfo;

                        return (
                            <div
                                key={index}
                                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${primaryType ? `type-${primaryType}` : ''}`}
                            >
                                <div className="calendar-day-number">{day}</div>
                                {primaryType && (
                                    <div className="calendar-day-status">
                                        {primaryType === 'work' && <span className="status-icon">💼</span>}
                                        {(primaryType === 'rest' || primaryType === 'weekend') && <span className="status-icon">😴</span>}
                                    </div>
                                )}
                                {(workShiftStartDisplay || workShiftEndDisplay) && ( // 只要有开始或结束时间就显示
                                    <div className="calendar-work-time">
                                        {workShiftStartDisplay && (
                                            <div className="work-time-row">
                                                <span className="work-time-label">上</span>
                                                <span className="work-time-value">{formatTime(workShiftStartDisplay)}</span>
                                            </div>
                                        )}
                                        {workShiftEndDisplay && (
                                            <div className="work-time-row">
                                                <span className="work-time-label">下</span>
                                                <span className="work-time-value">
                                                    {isSameDay(workShiftEndDisplay, date) ? formatTime(workShiftEndDisplay) : `${workShiftEndDisplay.getDate()}日${formatTime(workShiftEndDisplay)}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isToday && <div className="today-indicator">今天</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 图例 */}
            <div className="calendar-legend">
                <div className="legend-item">
                    <div className="legend-color type-work"></div>
                    <span>上班</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color type-rest"></div>
                    <span>休息</span>
                </div>
            </div>
        </div>
    );
}

