import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/hooks/useAppState';
import { Shuffle, Users, Clock } from 'lucide-react';

const AutoMatchPanel = () => {
  const { state, autoMatch, categoryConfig } = useAppState();
  
  const currentCategory = categoryConfig[state.category];
  const availableCount = state.counts[state.category] || 0;

  const handleAutoMatch = async () => {
    const success = await autoMatch();
    if (success) {
      // Add success animation
      const button = document.querySelector('[data-auto-match-button]') as HTMLElement;
      if (button) {
        button.classList.add('animate-bounce');
        setTimeout(() => button.classList.remove('animate-bounce'), 1000);
      }
    }
  };

  return (
    <Card className="animate-fade-in border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <Shuffle className="h-5 w-5" />
          <span>Auto Match</span>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            <Users className="h-3 w-3 mr-1" />
            {availableCount} available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Let the system automatically find and match you with people for {currentCategory.word.toLowerCase()}!</p>
          <p className="text-xs mt-1">The system will randomly select and invite available people up to your group size.</p>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <Clock className="h-4 w-4 text-orange-600" />
          <span className="text-muted-foreground">
            Age range: {state.ageMinYap}-{state.ageMaxYap}
          </span>
        </div>

        {state.category !== 'coffee' && (
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-orange-600" />
            <span className="text-muted-foreground">
              Group size: {state.groupMin}-{state.groupMax} people
            </span>
          </div>
        )}

        <Button
          onClick={handleAutoMatch}
          disabled={state.loading || availableCount === 0}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white transition-all duration-200"
          data-auto-match-button
        >
          {state.loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Finding matches...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Shuffle className="h-4 w-4" />
              <span>Auto Match {currentCategory.emoji}</span>
            </div>
          )}
        </Button>

        {availableCount === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            No one is currently available for {currentCategory.word.toLowerCase()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoMatchPanel;