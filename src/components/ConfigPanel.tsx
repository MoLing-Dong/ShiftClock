import { type RestDayType, type StartTimeType } from '../utils/schedule';
import './ConfigPanel.css';

interface ConfigPanelProps {
    workHours: number;
    restHours: number;
    startDate: string;
    startTimeType: StartTimeType;
    restDayType: RestDayType;
    customRestDays: number[];
    onWorkHoursChange: (value: number) => void;
    onRestHoursChange: (value: number) => void;
    onStartDateChange: (value: string) => void;
    onStartTimeTypeChange: (value: StartTimeType) => void;
    onRestDayTypeChange: (value: RestDayType) => void;
    onCustomRestDayToggle: (day: number) => void;
    isTimeOnlyInput: boolean; // 新增prop
}

const weekDays = [
    { value: 0, label: '周日' },
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
];

export function ConfigPanel({
    workHours,
    restHours,
    startDate,
    startTimeType,
    restDayType,
    customRestDays,
    onWorkHoursChange,
    onRestHoursChange,
    onStartDateChange,
    onStartTimeTypeChange,
    onRestDayTypeChange,
    onCustomRestDayToggle,
    isTimeOnlyInput,
}: ConfigPanelProps) {
    return (
        <div className="config-panel">
            <h2>排班设置</h2>

            <div className="form-group">
                <label>休息日设置</label>
                <div className="radio-group">
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="restDayType"
                            value="none"
                            checked={restDayType === 'none'}
                            onChange={(e) => onRestDayTypeChange(e.target.value as RestDayType)}
                        />
                        <span>无休息日</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="restDayType"
                            value="single"
                            checked={restDayType === 'single'}
                            onChange={(e) => onRestDayTypeChange(e.target.value as RestDayType)}
                        />
                        <span>单休（周日）</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="restDayType"
                            value="double"
                            checked={restDayType === 'double'}
                            onChange={(e) => onRestDayTypeChange(e.target.value as RestDayType)}
                        />
                        <span>双休（周六、周日）</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="restDayType"
                            value="custom"
                            checked={restDayType === 'custom'}
                            onChange={(e) => onRestDayTypeChange(e.target.value as RestDayType)}
                        />
                        <span>自定义</span>
                    </label>
                </div>
            </div>

            {restDayType === 'custom' && (
                <div className="form-group">
                    <label>选择休息日</label>
                    <div className="day-selector">
                        {weekDays.map(day => (
                            <button
                                key={day.value}
                                type="button"
                                className={`day-button ${customRestDays.includes(day.value) ? 'selected' : ''}`}
                                onClick={() => onCustomRestDayToggle(day.value)}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="form-group">
                <label htmlFor="workHours">工作时长（小时）</label>
                <input
                    id="workHours"
                    type="number"
                    min="1"
                    max="24"
                    value={workHours}
                    onChange={(e) => onWorkHoursChange(Number(e.target.value))}
                />
            </div>

            <div className="form-group">
                <label htmlFor="restHours">休息时长（小时）</label>
                <input
                    id="restHours"
                    type="number"
                    min="1"
                    max="168"
                    value={restHours}
                    onChange={(e) => onRestHoursChange(Number(e.target.value))}
                    disabled={restDayType === 'single' || restDayType === 'double'}
                />
            </div>

            <div className="form-group">
                <label htmlFor="startDate">起始时间</label>
                <input
                    id="startDate"
                    type={isTimeOnlyInput ? 'time' : 'datetime-local'} /* 动态设置类型 */
                    value={isTimeOnlyInput ? startDate.slice(11, 16) : startDate} /* 动态设置值 */
                    onChange={(e) => onStartDateChange(e.target.value)}
                />
                <div className="radio-group" style={{ marginTop: '0.5rem' }}>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="startTimeType"
                            value="work"
                            checked={startTimeType === 'work'}
                            onChange={(e) => onStartTimeTypeChange(e.target.value as StartTimeType)}
                        />
                        <span>上班时间</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="startTimeType"
                            value="off"
                            checked={startTimeType === 'off'}
                            onChange={(e) => onStartTimeTypeChange(e.target.value as StartTimeType)}
                        />
                        <span>下班时间</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

