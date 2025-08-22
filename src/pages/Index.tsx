import { useState, useEffect } from 'react';
import { useAppState } from '@/hooks/useAppState';
import LoadingAnimation from '@/components/LoadingAnimation';
import CategorySelector from '@/components/CategorySelector';
import UserProfile from '@/components/UserProfile';
import StatusToggle from '@/components/StatusToggle';
import PingPanel from '@/components/PingPanel';
import Calendar from '@/components/Calendar';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { state, updateState, categoryConfig } = useAppState();
  const { toast } = useToast();
  const [initialLoading, setInitialLoading] = useState(true);

  // Show loading animation on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Show toast notifications for errors and success messages
  useEffect(() => {
    if (state.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state.error, toast]);

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success",
        description: state.success,
      });
    }
  }, [state.success, toast]);

  if (initialLoading) {
    return <LoadingAnimation category={state.category} message="Loading your meal matcher..." />;
  }

  const currentCategory = categoryConfig[state.category];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <span className="text-4xl animate-bounce-gentle">{currentCategory.emoji}</span>
                <span>{currentCategory.title}</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-6 text-sm animate-slide-up">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">Open now:</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span>☕</span>
                  <span className="font-bold text-primary">{state.counts.coffee}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🍱</span>
                  <span className="font-bold text-primary">{state.counts.lunch}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🍚</span>
                  <span className="font-bold text-primary">{state.counts.zanpan}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Category Selector */}
          <CategorySelector
            selected={state.category}
            onSelect={(category) => updateState({ category })}
            counts={state.counts}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              <UserProfile />
              
              <StatusToggle />
              
              <PingPanel />
            </div>

            {/* Right Column - Calendar */}
            <div className="lg:col-span-1">
              <Calendar />
            </div>
          </div>
        </div>
      </main>

      {/* Loading overlay for actions */}
      {state.loading && (
        <LoadingAnimation category={state.category} message="Processing..." />
      )}
    </div>
  );
};

export default Index;
