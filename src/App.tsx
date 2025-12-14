import { useState, useEffect, useMemo } from 'react';
import { calculateSchedule, type ShiftSchedule, type RestDayType, type StartTimeType } from './utils/schedule';
import { StatusCard } from './components/StatusCard';
import { Calendar } from './components/Calendar';
import { ConfigPanel } from './components/ConfigPanel';
import './App.css';

function App() {
    const [workHours, setWorkHours] = useState<number>(12);
    const [restHours, setRestHours] = useState<number>(24);
    const [startDate, setStartDate] = useState<string>(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:00`;
    });
    const [startTimeType, setStartTimeType] = useState<StartTimeType>('work');
    const [restDayType, setRestDayType] = useState<RestDayType>('none');
    const [customRestDays, setCustomRestDays] = useState<number[]>([]);
    const [schedule, setSchedule] = useState<ShiftSchedule[]>([]);

    // 自动计算排班 - 计算到当前月份结束
    useEffect(() => {
        const start = new Date(startDate);
        const now = new Date();

        // 计算到当前月份结束的天数
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const daysUntilMonthEnd = Math.max(0, Math.ceil((currentMonthEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // 至少计算60天，确保能覆盖当前月份
        const daysToCalculate = Math.max(daysUntilMonthEnd + 7, 60);

        const currentScheduleConfig = {
            workHours,
            restHours,
            startDate: start,
            startTimeType,
            restDayType,
            customRestDays: restDayType === 'custom' ? customRestDays : undefined,
        };
        const result = calculateSchedule(currentScheduleConfig, daysToCalculate);
        setSchedule(result);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workHours, restHours, startDate, startTimeType, restDayType, customRestDays]);

    const scheduleConfig = useMemo(() => ({
        workHours,
        restHours,
        startDate: new Date(startDate),
        startTimeType,
        restDayType,
        customRestDays: restDayType === 'custom' ? customRestDays : undefined,
    }), [workHours, restHours, startDate, startTimeType, restDayType, customRestDays]);

    // 根据restDayType和startTimeType判断startDate输入框是否只显示时间
    const isTimeOnlyInput = useMemo(() => {
        return (restDayType === 'single' || restDayType === 'double') && startTimeType === 'work';
    }, [restDayType, startTimeType]);

    // 将Date对象格式化为本地时间的datetime-local格式字符串
    const formatLocalDateTime = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleStartDateChange = (value: string) => {
        if (isTimeOnlyInput) {
            // 如果是时间模式，将选定的时间与当前日期合并
            const now = new Date();
            const [hours, minutes] = value.split(':').map(Number);
            now.setHours(hours, minutes, 0, 0);
            setStartDate(formatLocalDateTime(now));
        } else {
            setStartDate(value);
        }
    };

    const handleRestDayTypeChange = (newType: RestDayType) => {
        setRestDayType(newType);
        if (newType === 'single' || newType === 'double') {
            setWorkHours(8);
            setStartTimeType('work');
            const currentStartDate = new Date(startDate);
            currentStartDate.setHours(8, 0, 0, 0);
            setStartDate(formatLocalDateTime(currentStartDate));
        }
    };

    const handleCustomRestDayToggle = (day: number) => {
        setCustomRestDays(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day);
            } else {
                return [...prev, day].sort((a, b) => a - b);
            }
        });
    };

    const getCurrentStatus = (): { type: 'work' | 'rest' | 'weekend' | 'unknown'; message: string } | null => {
        if (schedule.length === 0) return null;

        const now = new Date();
        for (const shift of schedule) {
            if (now >= shift.startTime && now < shift.endTime) {
                if (shift.type === 'weekend') {
                    return { type: 'weekend', message: '当前是休息日' };
                }
                return {
                    type: shift.type,
                    message: shift.type === 'work' ? '当前正在上班' : '当前正在休息',
                };
            }
        }
        return { type: 'unknown', message: '未在排班时间段内' };
    };

    const currentStatus = getCurrentStatus();

    return (
        <div className="app">
            <header className="app-header">
                <h1>排班查看器</h1>
                <p className="subtitle">轻松查看您的上班和休息时间</p>
            </header>

            <div className="main-container">
                {/* 左侧：排班表 */}
                <div className="schedule-section">
                    {currentStatus && (
                        <StatusCard type={currentStatus.type} message={currentStatus.message} />
                    )}

                    {schedule.length > 0 ? (
                        <Calendar schedule={schedule} startDate={new Date(startDate)} scheduleConfig={scheduleConfig} />
                    ) : (
                        <div className="schedule-panel empty">
                            <p>请设置排班参数并点击计算</p>
                        </div>
                    )}
                </div>

                {/* 右侧：设置面板 */}
                <div className="config-section">
                    <ConfigPanel
                        workHours={workHours}
                        restHours={restHours}
                        startDate={startDate}
                        startTimeType={startTimeType}
                        restDayType={restDayType}
                        customRestDays={customRestDays}
                        onWorkHoursChange={setWorkHours}
                        onRestHoursChange={setRestHours}
                        onStartDateChange={handleStartDateChange}
                        onStartTimeTypeChange={setStartTimeType}
                        onRestDayTypeChange={handleRestDayTypeChange}
                        onCustomRestDayToggle={handleCustomRestDayToggle}
                        isTimeOnlyInput={isTimeOnlyInput}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
