'use client';

import React, { useState, useEffect } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, Plus, Trash2, Download, Search, Sparkles, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: 'meeting' | 'personal' | 'deadline' | 'task';
  description: string;
}

export function CalendarTool() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Event Form States
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventTime, setNewEventTime] = useState<string>('09:00');
  const [newEventCategory, setNewEventCategory] = useState<'meeting' | 'personal' | 'deadline' | 'task'>('task');
  const [newEventDesc, setNewEventDesc] = useState<string>('');

  // Load events from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('devkits-calendar-events');
    if (stored) {
      try {
        setEvents(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse calendar events', e);
      }
    } else {
      // Default sample events
      const today = new Date().toISOString().split('T')[0];
      const samples: CalendarEvent[] = [
        {
          id: '1',
          title: 'Daily Standup Sync',
          date: today,
          time: '10:00',
          category: 'meeting',
          description: 'Sync up with engineering team on task deliveries'
        },
        {
          id: '2',
          title: 'Project Submission Deadline',
          date: today,
          time: '18:00',
          category: 'deadline',
          description: 'Final release and bundle submission'
        }
      ];
      setEvents(samples);
      localStorage.setItem('devkits-calendar-events', JSON.stringify(samples));
    }
  }, []);

  // Save events helper
  const saveEvents = (updated: CalendarEvent[]) => {
    setEvents(updated);
    localStorage.setItem('devkits-calendar-events', JSON.stringify(updated));
  };

  // Navigations
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Add event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      toast.error('Event title is required');
      return;
    }

    const event: CalendarEvent = {
      id: Math.random().toString(36).substring(2, 9),
      title: newEventTitle.trim(),
      date: selectedDate,
      time: newEventTime,
      category: newEventCategory,
      description: newEventDesc.trim()
    };

    const updated = [...events, event];
    saveEvents(updated);
    
    // Clear inputs
    setNewEventTitle('');
    setNewEventDesc('');
    toast.success('Event scheduled successfully');
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    saveEvents(updated);
    toast.success('Event deleted');
  };

  // Calendar Math Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // Day of week (0-6)
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // Total days
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Generate days array (including padding for previous month offset)
  const calendarCells = [];
  
  // Previous month padding days
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonthDate = new Date(year, month - 1, dayNum);
    calendarCells.push({
      dateStr: prevMonthDate.toISOString().split('T')[0],
      dayNum,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const cellDate = new Date(year, month, i);
    // Correct timezone shift offset
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: true
    });
  }

  // Next month padding days to make grid grid multiples of 7 (usually 35 or 42 cells)
  const totalCellsNeeded = calendarCells.length <= 35 ? 35 : 42;
  const nextMonthPadding = totalCellsNeeded - calendarCells.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    calendarCells.push({
      dateStr: nextMonthDate.toISOString().split('T')[0],
      dayNum: i,
      isCurrentMonth: false
    });
  }

  // Category styling
  const getCategoryStyles = (category: CalendarEvent['category']) => {
    switch (category) {
      case 'meeting':
        return {
          badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20',
          dot: 'bg-blue-500',
          border: 'border-l-blue-500'
        };
      case 'deadline':
        return {
          badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20',
          dot: 'bg-amber-500',
          border: 'border-l-amber-500'
        };
      case 'personal':
        return {
          badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20',
          dot: 'bg-purple-500',
          border: 'border-l-purple-500'
        };
      case 'task':
      default:
        return {
          badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20',
          dot: 'bg-emerald-500',
          border: 'border-l-emerald-500'
        };
    }
  };

  // Exporters
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('JSON backup exported successfully');
  };

  const handleExportIcs = () => {
    if (events.length === 0) {
      toast.error('No events scheduled to export.');
      return;
    }

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DevToolkit//CalendarPlanner//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    events.forEach(ev => {
      const cleanDate = ev.date.replace(/-/g, '');
      const cleanTime = ev.time.replace(/:/g, '') + '00';
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:event-${ev.id}@devkits`);
      icsContent.push(`DTSTAMP:${timestamp}`);
      icsContent.push(`DTSTART:${cleanDate}T${cleanTime}`);
      // assume 1 hour duration by default
      const hourEnd = String(Number(ev.time.split(':')[0]) + 1).padStart(2, '0');
      const cleanTimeEnd = `${hourEnd}${ev.time.split(':')[1]}00`;
      icsContent.push(`DTEND:${cleanDate}T${cleanTimeEnd}`);
      icsContent.push(`SUMMARY:${ev.title.replace(/[,;]/g, '\\$&')}`);
      icsContent.push(`DESCRIPTION:${ev.description.replace(/[,;]/g, '\\$&')}`);
      icsContent.push(`CATEGORIES:${ev.category.toUpperCase()}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule_${Date.now()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('iCalendar (.ics) file exported! Double click to add to Outlook/Google Calendar.');
  };

  // Filtered lists
  const filteredEvents = events.filter(e => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query);
  });

  const selectedDateEvents = events.filter(e => e.date === selectedDate);
  const upcomingEvents = events
    .filter(e => e.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Visual Calendar grid */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="bg-card/45 border-border/80 shadow-md backdrop-blur-sm relative overflow-hidden">
          <CardContent className="p-6">
            
            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-extrabold text-sm min-w-[120px] text-center capitalize">
                  {monthName} {year}
                </h3>
                <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={handleGoToday} className="h-8 text-xs font-bold ml-1">
                  Today
                </Button>
              </div>

              {/* Toolbar search & exports */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8.5 h-8 text-xs w-full sm:w-44 bg-background/40"
                  />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon-sm" onClick={handleExportIcs} className="h-8 w-8 border-dashed shrink-0">
                      <Download className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to Google Calendar / Outlook (.ics)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon-sm" onClick={handleExportJson} className="h-8 w-8 border-dashed shrink-0">
                      <Download className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Backup Events (.json)</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Weekdays indicator header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 min-h-[340px]">
              {calendarCells.map((cell, idx) => {
                const cellEvents = filteredEvents.filter(e => e.date === cell.dateStr);
                const isSelected = selectedDate === cell.dateStr;
                const isToday = new Date().toISOString().split('T')[0] === cell.dateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={cn(
                      "min-h-[64px] border rounded-xl p-1.5 flex flex-col justify-between cursor-pointer transition-all hover:bg-muted/15 relative select-none",
                      cell.isCurrentMonth ? "bg-card/25 border-border/60" : "bg-muted/5 border-border/30 opacity-40",
                      isSelected && "border-primary bg-primary/5 shadow-inner scale-[0.98]",
                      isToday && "ring-1 ring-primary ring-offset-1"
                    )}
                  >
                    {/* Header: day number and relative label */}
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md",
                        isToday ? "bg-primary text-primary-foreground font-black" : "text-foreground/80"
                      )}>
                        {cell.dayNum}
                      </span>
                      {cellEvents.length > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>

                    {/* Micro event bullets list preview */}
                    <div className="mt-1 space-y-0.5 max-h-[44px] overflow-hidden">
                      {cellEvents.slice(0, 2).map(ev => {
                        const style = getCategoryStyles(ev.category);
                        return (
                          <div
                            key={ev.id}
                            className={cn(
                              "text-[8px] font-semibold truncate px-1 rounded border-l-2 py-0.5 leading-none bg-background/50",
                              style.border
                            )}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {cellEvents.length > 2 && (
                        <div className="text-[7px] text-muted-foreground text-center font-bold">
                          +{cellEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Scheduler Form and Details pane */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Scheduled List for selected Date */}
        <Card className="border bg-card/60 backdrop-blur-sm shadow-md">
          <CardContent className="p-4 space-y-4">
            <div className="border-b pb-2 flex justify-between items-center">
              <div>
                <Label className="font-extrabold text-sm block">Scheduled Agenda</Label>
                <span className="text-[10px] text-muted-foreground font-mono font-bold mt-0.5 block">{selectedDate}</span>
              </div>
              <Badge variant="outline" className="text-[9px] font-bold font-mono">
                {selectedDateEvents.length} Events
              </Badge>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(ev => {
                  const style = getCategoryStyles(ev.category);
                  return (
                    <div key={ev.id} className="flex justify-between items-start gap-2 p-2.5 border rounded-xl bg-background/40 hover:bg-background/80 transition-colors">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />
                          <span className="font-mono text-[9.5px] font-black text-muted-foreground">{ev.time}</span>
                          <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-wider h-4 px-1 rounded-sm shrink-0", style.badge)}>
                            {ev.category}
                          </Badge>
                        </div>
                        <h4 className="font-extrabold text-xs text-foreground leading-normal truncate">{ev.title}</h4>
                        {ev.description && (
                          <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{ev.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="text-destructive shrink-0 h-6 w-6 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground/40 italic border border-dashed rounded-xl bg-background/10">
                  No scheduled agenda for this day.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Event Form */}
        <Card className="border bg-card/60 backdrop-blur-sm shadow-md">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-extrabold text-sm border-b pb-2 flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5 text-primary" /> Schedule New Event
            </h4>

            <form onSubmit={handleAddEvent} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="event-title">Event Title</Label>
                <Input
                  id="event-title"
                  type="text"
                  placeholder="e.g. Design Sync / Deadline"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="h-8.5 text-xs bg-background/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-time">Time</Label>
                  <Input
                    id="event-time"
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="h-8.5 text-xs font-mono bg-background/50"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-cat">Category</Label>
                  <Select value={newEventCategory} onValueChange={(v: any) => setNewEventCategory(v)}>
                    <SelectTrigger id="event-cat" className="h-8.5 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting 🔵</SelectItem>
                      <SelectItem value="deadline">Deadline 🟡</SelectItem>
                      <SelectItem value="personal">Personal 🟣</SelectItem>
                      <SelectItem value="task">Task 🟢</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-desc">Description (Optional)</Label>
                <Input
                  id="event-desc"
                  type="text"
                  placeholder="Notes, links, details..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="h-8.5 text-xs bg-background/50"
                />
              </div>

              <Button type="submit" className="w-full text-xs font-bold gap-1 h-8.5">
                Add to Schedule
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Side summary of monthly upcoming events */}
        <Card className="border bg-card/60 backdrop-blur-sm shadow-md">
          <CardContent className="p-4 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Upcoming Tasks
            </h4>
            <div className="space-y-2">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(ev => {
                  const style = getCategoryStyles(ev.category);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedDate(ev.date);
                        // Shift calendar view to match the event year/month if different
                        const evDate = new Date(ev.date);
                        if (evDate.getMonth() !== currentDate.getMonth() || evDate.getFullYear() !== currentDate.getFullYear()) {
                          setCurrentDate(new Date(evDate.getFullYear(), evDate.getMonth(), 1));
                        }
                      }}
                      className="text-[10px] leading-normal flex justify-between items-center p-2 rounded-lg border bg-background/25 cursor-pointer hover:border-primary/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-extrabold text-foreground leading-normal block truncate">{ev.title}</span>
                        <span className="text-[8.5px] text-muted-foreground font-mono font-bold mt-0.5 block">{ev.date} @ {ev.time}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-[7.5px] font-black uppercase tracking-wider rounded-sm shrink-0", style.badge)}>
                        {ev.category}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-[10px] text-muted-foreground/35 italic">
                  No upcoming deadlines found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
