import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/hooks/useAppState';

const UserProfile = () => {
  const { state, updateState, saveProfile } = useAppState();

  const handleSave = async () => {
    const success = await saveProfile();
    if (success) {
      // Add a subtle success animation
      const button = document.querySelector('[data-save-button]') as HTMLElement;
      if (button) {
        button.classList.add('animate-pulse');
        setTimeout(() => button.classList.remove('animate-pulse'), 1000);
      }
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>👤</span>
          <span>Your Profile</span>
          {state.email && state.name && (
            <Badge variant="secondary" className="animate-scale-in">
              Registered
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={state.email}
              onChange={(e) => updateState({ email: e.target.value })}
              placeholder="your.email@company.com"
              className="transition-all duration-300 focus:scale-[1.02]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={state.name}
              onChange={(e) => updateState({ name: e.target.value })}
              placeholder="Your Name"
              className="transition-all duration-300 focus:scale-[1.02]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min="16"
              max="80"
              value={state.age || ''}
              onChange={(e) => updateState({ age: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="28"
              className="transition-all duration-300 focus:scale-[1.02]"
            />
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <div className="flex space-x-2">
              {[
                { value: 'male', label: 'Male', emoji: '👨' },
                { value: 'female', label: 'Female', emoji: '👩' },
                { value: 'other', label: 'Other', emoji: '🧑' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateState({ gender: option.value })}
                  className={`flex-1 p-2 rounded-lg border transition-all duration-300 hover:scale-105 ${
                    state.gender === option.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg">{option.emoji}</span>
                  <div className="text-sm">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          className="w-full transition-all duration-300 hover:scale-[1.02]"
          disabled={state.loading}
          data-save-button
        >
          {state.loading ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>

        {state.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive animate-fade-in">
            {state.error}
          </div>
        )}
        
        {state.success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700 animate-fade-in">
            {state.success}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProfile;