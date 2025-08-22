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
  const [recentActivity, setRecentActivity] = useState<string | null>(null);
  const [acceptanceHistory, setAcceptanceHistory] = useState<string[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchStats = async (year: number, month: number) => {
    if (!state.email) return;
    
    setLoading(true);
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      let response = await apiService.getStats({
        email: state.email,
        month: monthStr,
        category: 'all',
      });
      
      // If stats doesn't work, try alternative approaches
      if (!response.ok) {
        console.log('Trying alternative stats approach...');
        response = await apiService.request({
          action: 'getInviteHistory',
          email: state.email,
          month: monthStr
        });
      }
      
      if (response.ok && response.data) {
        setStats(response.data);
      } else {
        console.error('Failed to fetch stats:', response.error);
      }
    } catch (error) {
      console.error('Failed to fetch calendar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(year, month);
    fetchAcceptanceHistory();
  }, [year, month, state.email]);

  const fetchAcceptanceHistory = async () => {
    if (!state.email) return;
    
    try {
      let response = await apiService.getAcceptanceHistory(state.email);
      
      // Try alternative approaches if the main one fails
      if (!response.ok) {
        console.log('Trying alternative acceptance history approach...');
        response = await apiService.request({
          action: 'getInviteStatus', 
          email: state.email,
          column: 'H'
        });
      }
      
      if (response.ok && response.data) {
        setAcceptanceHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch acceptance history:', error);
    }
  };

  // React to successful invitations/pings/matches
  useEffect(() => {
    if (state.success?.includes('sent') || state.success?.includes('Ping') || state.success?.includes('Match')) {
      const today = new Date();
      const todayKey = formatDateKey(today);
      setRecentActivity(todayKey);
      
      // Clear the recent activity highlight after 3 seconds
      setTimeout(() => setRecentActivity(null), 3000);
      
      // Refresh stats and acceptance history to show new activity
      setTimeout(() => {
        fetchStats(year, month);
        fetchAcceptanceHistory();
      }, 1000);
    }
  }, [state.success, year, month]);

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
            const hasAcceptance = acceptanceHistory.includes(dateKey);

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "min-h-16 p-2 border rounded-lg transition-all duration-500 hover:scale-105",
                  isCurrentMonth(date)
                    ? "bg-background border-border"
                    : "bg-muted/30 border-muted text-muted-foreground",
                  isToday(date) && "ring-2 ring-primary bg-primary/5",
                  hasActivity && "bg-primary/5 border-primary/20",
                  hasAcceptance && "bg-green-100 border-green-300 ring-1 ring-green-200",
                  recentActivity === dateKey && "bg-green-50 border-green-200 ring-2 ring-green-300 animate-pulse"
                )}
              >
                <div className="text-xs font-medium">
                  {date.getDate()}
                </div>
                <div className="space-y-1 mt-1">
                  {hasActivity && (
                    <>
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
                    </>
                  )}
                  {hasAcceptance && (
                    <div className="flex items-center text-xs text-green-600">
                      <span className="mr-1">✅</span>
                      <span>Match</span>
                    </div>
                  )}
                </div>
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