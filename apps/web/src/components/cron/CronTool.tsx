'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Play, FileText, CheckSquare, Sliders, Info, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import cronstrue from 'cronstrue';
import parser from 'cron-parser';
import { toast } from 'sonner';

export function CronTool() {
  const [cronExpression, setCronExpression] = useState<string>('*/5 * * * *');
  const [translation, setTranslation] = useState<string>('');
  const [nextDates, setNextDates] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Visual Builder States
  const [minuteType, setMinuteType] = useState<string>('every'); // every, interval, specific
  const [minuteInterval, setMinuteInterval] = useState<string>('5');
  const [minuteStart, setMinuteStart] = useState<string>('0');
  const [specificMinutes, setSpecificMinutes] = useState<number[]>([]);

  const [hourType, setHourType] = useState<string>('every'); // every, interval, specific
  const [hourInterval, setHourInterval] = useState<string>('1');
  const [hourStart, setHourStart] = useState<string>('0');
  const [specificHours, setSpecificHours] = useState<number[]>([]);

  const [dayType, setDayType] = useState<string>('every'); // every, specific
  const [specificDays, setSpecificDays] = useState<number[]>([]);

  const [monthType, setMonthType] = useState<string>('every'); // every, specific
  const [specificMonths, setSpecificMonths] = useState<number[]>([]);

  const [weekType, setWeekType] = useState<string>('every'); // every, specific
  const [specificWeeks, setSpecificWeeks] = useState<number[]>([]); // 0-6 (Sun-Sat)

  // 1. Process and Parse Cron Expression
  useEffect(() => {
    try {
      const cleanExpr = cronExpression.trim().replace(/\s+/g, ' ');
      
      // Get human-readable description
      const desc = cronstrue.toString(cleanExpr, { use24HourTimeFormat: true });
      setTranslation(desc);
      setParseError(null);

      // Get next 5 occurrences
      const interval = parser.parse(cleanExpr);
      const dates: string[] = [];
      for (let i = 0; i < 5; i++) {
        dates.push(interval.next().toString());
      }
      setNextDates(dates);
    } catch (e: any) {
      setTranslation('');
      setNextDates([]);
      setParseError(e.message || 'Invalid cron expression');
    }
  }, [cronExpression]);

  // 2. Compile Visual Settings into Cron Expression
  useEffect(() => {
    let min = '*';
    if (minuteType === 'interval') {
      min = `${minuteStart}/${minuteInterval}`;
    } else if (minuteType === 'specific') {
      min = specificMinutes.length > 0 ? specificMinutes.sort((a, b) => a - b).join(',') : '*';
    }

    let hr = '*';
    if (hourType === 'interval') {
      hr = `${hourStart}/${hourInterval}`;
    } else if (hourType === 'specific') {
      hr = specificHours.length > 0 ? specificHours.sort((a, b) => a - b).join(',') : '*';
    }

    let day = '*';
    if (dayType === 'specific') {
      day = specificDays.length > 0 ? specificDays.sort((a, b) => a - b).join(',') : '*';
    }

    let mon = '*';
    if (monthType === 'specific') {
      mon = specificMonths.length > 0 ? specificMonths.sort((a, b) => a - b).join(',') : '*';
    }

    let wk = '*';
    if (weekType === 'specific') {
      wk = specificWeeks.length > 0 ? specificWeeks.sort((a, b) => a - b).join(',') : '*';
    }

    // Compose cron (5 fields)
    const expr = `${min} ${hr} ${day} ${mon} ${wk}`;
    setCronExpression(expr);
  }, [
    minuteType, minuteInterval, minuteStart, specificMinutes,
    hourType, hourInterval, hourStart, specificHours,
    dayType, specificDays,
    monthType, specificMonths,
    weekType, specificWeeks
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cronExpression);
    toast.success('Cron expression copied!');
  };

  const toggleSpecific = (val: number, list: number[], setter: React.Dispatch<React.SetStateAction<number[]>>) => {
    if (list.includes(val)) {
      setter(list.filter((x) => x !== val));
    } else {
      setter([...list, val]);
    }
  };

  // Preset Cron Expressions
  const PRESETS = [
    { label: 'Every minute', expr: '* * * * *' },
    { label: 'Every 5 minutes', expr: '*/5 * * * *' },
    { label: 'Every hour', expr: '0 * * * *' },
    { label: 'Every day at midnight', expr: '0 0 * * *' },
    { label: 'Every Sunday at noon', expr: '0 12 * * 0' },
    { label: 'Mon-Fri at 9 AM', expr: '0 9 * * 1-5' },
    { label: '1st of every month', expr: '0 0 1 * *' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Visual Builder Column */}
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Sliders className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Visual Cron Builder</h3>
            </div>

            <Tabs defaultValue="minutes" className="space-y-4">
              <TabsList className="grid grid-cols-5 text-xs">
                <TabsTrigger value="minutes">Minutes</TabsTrigger>
                <TabsTrigger value="hours">Hours</TabsTrigger>
                <TabsTrigger value="days">Day</TabsTrigger>
                <TabsTrigger value="months">Month</TabsTrigger>
                <TabsTrigger value="weeks">Week</TabsTrigger>
              </TabsList>

              {/* MINUTES BUILDER */}
              <TabsContent value="minutes" className="space-y-3 text-sm">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="minute-radio"
                      checked={minuteType === 'every'}
                      onChange={() => setMinuteType('every')}
                    />
                    Every minute (`*`)
                  </label>

                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="minute-radio"
                      checked={minuteType === 'interval'}
                      onChange={() => setMinuteType('interval')}
                    />
                    Every interval
                  </label>

                  {minuteType === 'interval' && (
                    <div className="flex items-center gap-2 pl-6 text-xs mt-1">
                      <span>Every</span>
                      <Select value={minuteInterval} onValueChange={setMinuteInterval}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['2', '5', '10', '15', '20', '30'].map((m) => (
                            <SelectItem key={m} value={m}>{m}m</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>starting at minute</span>
                      <Select value={minuteStart} onValueChange={setMinuteStart}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['0', '5', '10', '15', '20', '30', '45'].map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="minute-radio"
                      checked={minuteType === 'specific'}
                      onChange={() => setMinuteType('specific')}
                    />
                    Specific minutes (choose multiple)
                  </label>

                  {minuteType === 'specific' && (
                    <div className="grid grid-cols-10 gap-1.5 pl-6 mt-1.5">
                      {Array.from({ length: 60 }, (_, i) => (
                        <Button
                          key={i}
                          variant={specificMinutes.includes(i) ? 'default' : 'outline'}
                          size="icon-sm"
                          className="h-7 w-7 text-[10px]"
                          onClick={() => toggleSpecific(i, specificMinutes, setSpecificMinutes)}
                        >
                          {i}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* HOURS BUILDER */}
              <TabsContent value="hours" className="space-y-3 text-sm">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="hour-radio"
                      checked={hourType === 'every'}
                      onChange={() => setHourType('every')}
                    />
                    Every hour (`*`)
                  </label>

                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="hour-radio"
                      checked={hourType === 'interval'}
                      onChange={() => setHourType('interval')}
                    />
                    Every interval
                  </label>

                  {hourType === 'interval' && (
                    <div className="flex items-center gap-2 pl-6 text-xs mt-1">
                      <span>Every</span>
                      <Select value={hourInterval} onValueChange={setHourInterval}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['2', '3', '4', '6', '8', '12'].map((h) => (
                            <SelectItem key={h} value={h}>{h} hrs</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>starting at hour</span>
                      <Select value={hourStart} onValueChange={setHourStart}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="hour-radio"
                      checked={hourType === 'specific'}
                      onChange={() => setHourType('specific')}
                    />
                    Specific hours
                  </label>

                  {hourType === 'specific' && (
                    <div className="grid grid-cols-8 gap-1.5 pl-6 mt-1.5">
                      {Array.from({ length: 24 }, (_, i) => (
                        <Button
                          key={i}
                          variant={specificHours.includes(i) ? 'default' : 'outline'}
                          size="icon-sm"
                          className="h-7 w-7 text-[10px]"
                          onClick={() => toggleSpecific(i, specificHours, setSpecificHours)}
                        >
                          {i}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* DAYS BUILDER */}
              <TabsContent value="days" className="space-y-3 text-sm">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="day-radio"
                      checked={dayType === 'every'}
                      onChange={() => setDayType('every')}
                    />
                    Every day of the month (`*`)
                  </label>

                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="day-radio"
                      checked={dayType === 'specific'}
                      onChange={() => setDayType('specific')}
                    />
                    Specific days of the month
                  </label>

                  {dayType === 'specific' && (
                    <div className="grid grid-cols-8 gap-1.5 pl-6 mt-1.5">
                      {Array.from({ length: 31 }, (_, i) => (
                        <Button
                          key={i + 1}
                          variant={specificDays.includes(i + 1) ? 'default' : 'outline'}
                          size="icon-sm"
                          className="h-7 w-7 text-[10px]"
                          onClick={() => toggleSpecific(i + 1, specificDays, setSpecificDays)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* MONTHS BUILDER */}
              <TabsContent value="months" className="space-y-3 text-sm">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="month-radio"
                      checked={monthType === 'every'}
                      onChange={() => setMonthType('every')}
                    />
                    Every month (`*`)
                  </label>

                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="month-radio"
                      checked={monthType === 'specific'}
                      onChange={() => setMonthType('specific')}
                    />
                    Specific months
                  </label>

                  {monthType === 'specific' && (
                    <div className="grid grid-cols-4 gap-2 pl-6 mt-1.5">
                      {[
                        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                      ].map((name, i) => (
                        <Button
                          key={name}
                          variant={specificMonths.includes(i + 1) ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs py-1"
                          onClick={() => toggleSpecific(i + 1, specificMonths, setSpecificMonths)}
                        >
                          {name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* WEEKS BUILDER */}
              <TabsContent value="weeks" className="space-y-3 text-sm">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="week-radio"
                      checked={weekType === 'every'}
                      onChange={() => setWeekType('every')}
                    />
                    Every day of the week (`*`)
                  </label>

                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="week-radio"
                      checked={weekType === 'specific'}
                      onChange={() => setWeekType('specific')}
                    />
                    Specific days of the week
                  </label>

                  {weekType === 'specific' && (
                    <div className="grid grid-cols-7 gap-1.5 pl-6 mt-1.5">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, i) => (
                        <Button
                          key={name}
                          variant={specificWeeks.includes(i) ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleSpecific(i, specificWeeks, setSpecificWeeks)}
                        >
                          {name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Presets Card */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Popular Presets</h3>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(({ label, expr }) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setCronExpression(expr)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parser & Output Column */}
      <div className="space-y-4">
        {/* Output Box */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold">Cron Expression</span>
              <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs">
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            
            <Input
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="font-mono text-center text-lg font-semibold text-primary"
            />
            
            {parseError && (
              <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2.5 rounded-md">
                {parseError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Explanation Box */}
        <Card className="bg-gradient-to-tr from-background to-muted/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
              <Info className="h-3.5 w-3.5" />
              Human Explanation
            </div>
            {translation ? (
              <p className="text-sm font-semibold leading-relaxed text-foreground">
                “{translation}”
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">Provide a valid expression to explain.</p>
            )}
          </CardContent>
        </Card>

        {/* Next occurrences */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase border-b pb-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Next 5 Executions (Local)
            </div>
            {nextDates.length > 0 ? (
              <ul className="space-y-1.5 font-mono text-xs text-muted-foreground">
                {nextDates.map((date, i) => (
                  <li key={date} className="flex items-center gap-2">
                    <span className="text-primary/70 select-none">[{i + 1}]</span>
                    <span className="text-foreground">{new Date(date).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">No upcoming executions calculated.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
