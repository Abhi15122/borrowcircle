import { describe, expect, it } from 'vitest';
import {
  calendarDays,
  communityToday,
  durationInDays,
  isAllowedDuration,
  isCalendarDate,
} from './dates.js';

describe('date-only borrowing rules', () => {
  it('includes both dates across a month boundary', () => {
    const days = calendarDays('2028-02-28', '2028-03-01');
    expect(days).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
  });
  it('rejects impossible dates and reversed ranges', () => {
    expect(isCalendarDate('2027-02-29')).toBe(false);
    expect(() => calendarDays('2028-03-02', '2028-03-01')).toThrow('Invalid borrowing dates');
  });
  it('accepts the inclusive minimum and maximum durations', () => {
    expect(isAllowedDuration(1)).toBe(true);
    expect(isAllowedDuration(14)).toBe(true);
    expect(isAllowedDuration(1.5)).toBe(false);
    expect(durationInDays('2028-04-01', '2028-04-01')).toBe(1);
  });
  it('uses the community date when UTC is still on the previous day', () => {
    expect(communityToday(new Date('2028-04-01T19:00:00Z'))).toBe('2028-04-02');
  });
  // Learner checkpoint: add your own test for isAllowedDuration(15).
});
