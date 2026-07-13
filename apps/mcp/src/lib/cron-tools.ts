import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

export function cronToHumanReadable(expression: string): string {
  return cronstrue.toString(expression.trim().replace(/\s+/g, ' '), { use24HourTimeFormat: true });
}

export function cronNextExecutions(expression: string, count = 5): string[] {
  const interval = CronExpressionParser.parse(expression.trim().replace(/\s+/g, ' '));
  const dates: string[] = [];
  for (let i = 0; i < count; i++) dates.push(interval.next().toString());
  return dates;
}

export interface CronBuilderSpec {
  minute?: { type: 'every' } | { type: 'interval'; start: number; interval: number } | { type: 'specific'; values: number[] };
  hour?: { type: 'every' } | { type: 'interval'; start: number; interval: number } | { type: 'specific'; values: number[] };
  dayOfMonth?: { type: 'every' } | { type: 'specific'; values: number[] };
  month?: { type: 'every' } | { type: 'specific'; values: number[] };
  dayOfWeek?: { type: 'every' } | { type: 'specific'; values: number[] };
}

function buildField(spec: CronBuilderSpec['minute'] | CronBuilderSpec['dayOfMonth']): string {
  if (!spec || spec.type === 'every') return '*';
  if (spec.type === 'interval') return `${spec.start}/${spec.interval}`;
  return spec.values.length > 0 ? [...spec.values].sort((a, b) => a - b).join(',') : '*';
}

export function buildCronExpression(spec: CronBuilderSpec): string {
  return [buildField(spec.minute), buildField(spec.hour), buildField(spec.dayOfMonth), buildField(spec.month), buildField(spec.dayOfWeek)].join(' ');
}
