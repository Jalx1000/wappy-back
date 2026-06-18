import { DateTime } from 'luxon';
import { ReportFrequencyEnum } from './domain/report-frequency.enum';
import { ReportSchedule } from './domain/report-schedule';

const DEFAULT_TZ = 'America/La_Paz';

// luxon weekday: 1=Mon … 7=Sun. Our dayOfWeek uses JS convention 0=Sun … 6=Sat.
function jsWeekday(dt: DateTime): number {
  return dt.weekday % 7;
}

function matches(
  schedule: Pick<ReportSchedule, 'frequency' | 'dayOfWeek' | 'dayOfMonth'>,
  cand: DateTime,
): boolean {
  switch (schedule.frequency) {
    case ReportFrequencyEnum.daily:
      return true;
    case ReportFrequencyEnum.weekdays:
      return cand.weekday >= 1 && cand.weekday <= 5;
    case ReportFrequencyEnum.weekly:
    case ReportFrequencyEnum.biweekly:
      return jsWeekday(cand) === (schedule.dayOfWeek ?? 1);
    case ReportFrequencyEnum.monthly:
      return cand.day === (schedule.dayOfMonth ?? 1);
    case ReportFrequencyEnum.quarterly:
      return (
        cand.day === (schedule.dayOfMonth ?? 1) &&
        [1, 4, 7, 10].includes(cand.month)
      );
    default:
      return false;
  }
}

/**
 * Next UTC instant a schedule should run, strictly after `after`.
 * Brute-forces day by day at the configured hour in the schedule timezone.
 */
export function computeNextRun(
  schedule: Pick<
    ReportSchedule,
    'frequency' | 'dayOfWeek' | 'dayOfMonth' | 'hour' | 'timezone' | 'lastRunAt'
  >,
  after: Date = new Date(),
): Date {
  const tz = schedule.timezone || DEFAULT_TZ;
  const start = DateTime.fromJSDate(after).setZone(tz);
  let cand = start.set({
    hour: schedule.hour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  const lastRun = schedule.lastRunAt
    ? DateTime.fromJSDate(new Date(schedule.lastRunAt)).setZone(tz)
    : null;

  for (let i = 0; i < 800; i++) {
    if (cand > start && matches(schedule, cand)) {
      // biweekly: enforce a ~14-day gap from the last run.
      if (
        schedule.frequency === ReportFrequencyEnum.biweekly &&
        lastRun &&
        cand.diff(lastRun, 'days').days < 13
      ) {
        cand = cand.plus({ days: 1 }).set({
          hour: schedule.hour,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        continue;
      }
      return cand.toUTC().toJSDate();
    }
    cand = cand.plus({ days: 1 }).set({
      hour: schedule.hour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
  }
  // Fallback: tomorrow at hour.
  return start
    .plus({ days: 1 })
    .set({ hour: schedule.hour, minute: 0, second: 0, millisecond: 0 })
    .toUTC()
    .toJSDate();
}

/**
 * Report period (from/to ISO dates) covered by a scheduled run, based on its
 * frequency. The window ends "now" and reaches back by one cadence.
 */
export function periodForFrequency(
  frequency: ReportFrequencyEnum,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = now;
  let fromMs: number;
  const day = 86400000;
  switch (frequency) {
    case ReportFrequencyEnum.daily:
    case ReportFrequencyEnum.weekdays:
      fromMs = to.getTime() - day;
      break;
    case ReportFrequencyEnum.weekly:
      fromMs = to.getTime() - 7 * day;
      break;
    case ReportFrequencyEnum.biweekly:
      fromMs = to.getTime() - 14 * day;
      break;
    case ReportFrequencyEnum.monthly:
      fromMs = to.getTime() - 30 * day;
      break;
    case ReportFrequencyEnum.quarterly:
      fromMs = to.getTime() - 90 * day;
      break;
    default:
      fromMs = to.getTime() - 30 * day;
  }
  return {
    from: new Date(fromMs).toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}
