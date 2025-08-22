import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/hooks/useAppState';
import { apiService } from '@/services/api';

interface CalendarStats {
  [date: string]: {
    coffee: number;
    lunch: number;
    zanpan: number;
    total: number;
  };
}

const Calendar = () => {
  const { state } = useAppState();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<CalendarStats>({});
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchStats = async (year: number, month: number) => {
    if (!state.email) return;
    
    setLoading(true);
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const response = await apiService.getStats({
        email: state.email,
        month: monthStr,
        category: 'all',
      });
      
      if (response.ok && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(year, month);
  }, [year, month, state.email]);

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const days = getDaysInMonth(year, month);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(month - 1);
    } else {
      newDate.setMonth(month + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>📅</span>
            <span>Activity Calendar</span>
          </div>
          {loading && (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          )}
        </CardTitle>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {monthNames[month]} {year}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="transition-all duration-200 hover:scale-105"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date) => {
            const dateKey = formatDateKey(date);
            const dayStats = stats[dateKey];
            const hasActivity = dayStats && dayStats.total > 0;

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "min-h-16 p-2 border rounded-lg transition-all duration-200 hover:scale-105",
                  isCurrentMonth(date)
                    ? "bg-background border-border"
                    : "bg-muted/30 border-muted text-muted-foreground",
                  isToday(date) && "ring-2 ring-primary bg-primary/5",
                  hasActivity && "bg-primary/5 border-primary/20"
                )}
              >
                <div className="text-xs font-medium">
                  {date.getDate()}
                </div>
                {hasActivity && (
                  <div className="space-y-1 mt-1">
                    {dayStats.coffee > 0 && (
                      <div className="flex items-center text-xs">
                        <span className="mr-1">☕</span>
                        <span>{Math.min(dayStats.coffee, 9)}</span>
                      </div>
                    )}
                    {dayStats.lunch > 0 && (
                      <div className="flex items-center text-xs">
                        <span className="mr-1">🍱</span>
                        <span>{Math.min(dayStats.lunch, 9)}</span>
                      </div>
                    )}
                    {dayStats.zanpan > 0 && (
                      <div className="flex items-center text-xs">
                        <span className="mr-1">🍚</span>
                        <span>{Math.min(dayStats.zanpan, 9)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <span>☕</span>
            <span>Coffee</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🍱</span>
            <span>Lunch</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🍚</span>
            <span>残飯</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Calendar;