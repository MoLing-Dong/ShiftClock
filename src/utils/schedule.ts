export interface ShiftSchedule {
  startTime: Date;
  endTime: Date;
  type: "work" | "rest" | "weekend";
}

export type RestDayType = "none" | "single" | "double" | "custom";
export type StartTimeType = "work" | "off"; // 起始时间类型：上班时间或下班时间

export interface ScheduleConfig {
  workHours: number; // 工作小时数
  restHours: number; // 休息小时数
  startDate: Date; // 起始日期
  startTimeType: StartTimeType; // 起始时间类型
  restDayType: RestDayType; // 休息日类型
  customRestDays?: number[]; // 自定义休息日（0=周日, 1=周一, ..., 6=周六）
}

/**
 * 判断是否为休息日
 */
function isRestDay(date: Date, config: ScheduleConfig): boolean {
  const day = date.getDay();

  switch (config.restDayType) {
    case "none":
      return false;
    case "single":
      // 单休：周日休息
      return day === 0;
    case "double":
      // 双休：周六和周日休息
      return day === 0 || day === 6;
    case "custom":
      // 自定义休息日
      return config.customRestDays?.includes(day) || false;
    default:
      return false;
  }
}

/**
 * 计算排班表
 * @param config 排班配置
 * @param days 要计算的天数
 * @returns 排班表数组
 */
export function calculateSchedule(
  config: ScheduleConfig,
  days: number = 30
): ShiftSchedule[] {
  const schedule: ShiftSchedule[] = [];
  let currentTime = new Date(config.startDate);

  // Store the initial time of day from startDate for consistency on workdays
  const initialWorkHour = currentTime.getHours();
  const initialWorkMinute = currentTime.getMinutes();

  // If startTimeType is 'off', adjust currentTime backwards to find the actual work start time
  if (config.startTimeType === "off") {
    currentTime = new Date(
      currentTime.getTime() - config.workHours * 60 * 60 * 1000
    );
  }

  const endTimeHorizon = new Date(currentTime);
  endTimeHorizon.setDate(endTimeHorizon.getDate() + days);

  while (currentTime < endTimeHorizon) {
    // 1. Handle explicit rest days (weekend types)
    // This part will create a full 'weekend' shift for the day
    // and jump currentTime to the *next workday's 00:00*, then apply initial time
    if (isRestDay(currentTime, config)) {
      const restDayStart = new Date(currentTime);
      restDayStart.setHours(0, 0, 0, 0);
      let nextWorkDayStart = new Date(restDayStart);
      nextWorkDayStart.setDate(nextWorkDayStart.getDate() + 1);

      while (isRestDay(nextWorkDayStart, config)) {
        nextWorkDayStart.setDate(nextWorkDayStart.getDate() + 1);
      }
      // Set time to initial work hour for the next work day
      nextWorkDayStart.setHours(initialWorkHour, initialWorkMinute, 0, 0);

      schedule.push({
        startTime: new Date(currentTime),
        endTime: new Date(nextWorkDayStart.getTime()),
        type: "weekend",
      });

      currentTime = new Date(nextWorkDayStart.getTime());
      continue;
    }

    // 2. Handle work shifts on workdays
    const workStart = new Date(currentTime);
    const workEnd = new Date(workStart);
    workEnd.setTime(workEnd.getTime() + config.workHours * 60 * 60 * 1000);

    schedule.push({
      startTime: workStart,
      endTime: workEnd,
      type: "work",
    });

    // 3. Handle rest period after work shift (different for fixed rest days vs continuous cycles)
    let nextShiftStartTime = new Date(workEnd); // Default for continuous cycle if no specific rest days

    if (config.restDayType === "none" || config.restDayType === "custom") {
      // For continuous cycles, add config.restHours
      nextShiftStartTime.setTime(
        nextShiftStartTime.getTime() + config.restHours * 60 * 60 * 1000
      );

      // Ensure it's not a rest day, if it falls on one, maintaining the time of day
      const targetHour = nextShiftStartTime.getHours();
      const targetMinute = nextShiftStartTime.getMinutes();
      while (isRestDay(nextShiftStartTime, config)) {
        nextShiftStartTime.setDate(nextShiftStartTime.getDate() + 1);
        nextShiftStartTime.setHours(targetHour, targetMinute, 0, 0); // Keep original time of day
      }
    } else {
      // 'single' or 'double' restDayType: fixed work hours, next shift starts tomorrow at same time
      nextShiftStartTime = new Date(workStart); // Use the workStart as a base
      nextShiftStartTime.setDate(nextShiftStartTime.getDate() + 1); // Move to next day
      nextShiftStartTime.setHours(initialWorkHour, initialWorkMinute, 0, 0); // Set to initial work time of day

      // Ensure this nextShiftStartTime is a workday
      while (isRestDay(nextShiftStartTime, config)) {
        nextShiftStartTime.setDate(nextShiftStartTime.getDate() + 1);
        nextShiftStartTime.setHours(initialWorkHour, initialWorkMinute, 0, 0); // Keep original time of day
      }
    }

    // Create a 'rest' shift from workEnd to nextShiftStartTime
    schedule.push({
      startTime: new Date(workEnd),
      endTime: new Date(nextShiftStartTime),
      type: "rest",
    });

    currentTime = new Date(nextShiftStartTime);
  }

  return schedule;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化时间（只显示时分）
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 获取星期几的中文名称
 */
export function getDayName(day: number): string {
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return days[day] || "";
}

/**
 * 获取时间段的小时数
 */
export function getDurationHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}
