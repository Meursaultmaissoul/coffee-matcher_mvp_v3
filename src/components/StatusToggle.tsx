import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/hooks/useAppState';
import DualRangeSlider from './DualRangeSlider';

const StatusToggle = () => {
  const { state, updateState, saveProfile, categoryConfig } = useAppState();
  
  const currentCategory = categoryConfig[state.category];

  const handleOpenToggle = async (open: boolean) => {
    updateState({ open });
    await saveProfile();
  };

  const handleSameSexToggle = async (sameSex: boolean) => {
    updateState({ sameSexPref: sameSex });
    await saveProfile();
  };

  const handleAgeRangeChange = async (min: number, max: number) => {
    updateState({ ageMin: min, ageMax: max });
    await saveProfile();
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>{currentCategory.emoji}</span>
          <span>Status ({currentCategory.word})</span>
          {state.open && (
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-600 font-medium">OPEN</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-all duration-300 hover:bg-muted/70">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full transition-all duration-300 ${
                state.open ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {currentCategory.emoji}
              </div>
              <div>
                <Label htmlFor="open-toggle" className="text-base font-medium">
                  Open for {currentCategory.word}
                </Label>
                <p className="text-sm text-muted-foreground">Available for matching today</p>
              </div>
            </div>
            <Switch
              id="open-toggle"
              checked={state.open}
              onCheckedChange={handleOpenToggle}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-all duration-300 hover:bg-muted/70">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                🚻
              </div>
              <div>
                <Label htmlFor="same-sex-toggle" className="text-base font-medium">
                  Same-sex preference
                </Label>
                <p className="text-sm text-muted-foreground">Only match with same gender</p>
              </div>
            </div>
            <Switch
              id="same-sex-toggle"
              checked={state.sameSexPref}
              onCheckedChange={handleSameSexToggle}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">Preferred age range</Label>
          <DualRangeSlider
            min={16}
            max={80}
            value={[state.ageMin, state.ageMax]}
            onValueChange={([min, max]) => handleAgeRangeChange(min, max)}
            className="py-4"
          />
          <p className="text-sm text-muted-foreground text-center">
            Ages {state.ageMin}–{state.ageMax} years
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusToggle;