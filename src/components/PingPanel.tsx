import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/hooks/useAppState';
import DualRangeSlider from './DualRangeSlider';

const PingPanel = () => {
  const { state, updateState, sendPing, categoryConfig } = useAppState();
  
  const currentCategory = categoryConfig[state.category];
  const showGroupSize = state.category !== 'coffee';

  const handlePing = async () => {
    const success = await sendPing();
    if (success) {
      // Add success animation
      const button = document.querySelector('[data-ping-button]') as HTMLElement;
      if (button) {
        button.classList.add('animate-pulse');
        setTimeout(() => button.classList.remove('animate-pulse'), 2000);
      }
    }
  };

  const peopleEmojis = ['🧑🏻', '🧑🏽', '🧑🏿', '🧑🏼', '👩🏻', '👩🏽', '👨🏻', '👨🏽'];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>{currentCategory.emoji}</span>
          <span>{currentCategory.word} Now</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Same-sex toggle for this ping */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-secondary text-secondary-foreground">
              🎯
            </div>
            <div>
              <Label htmlFor="same-sex-yap" className="text-base font-medium">
                Same-sex only (this ping)
              </Label>
              <p className="text-sm text-muted-foreground">Override your default preference</p>
            </div>
          </div>
          <Switch
            id="same-sex-yap"
            checked={state.sameSexYap}
            onCheckedChange={(checked) => updateState({ sameSexYap: checked })}
          />
        </div>

        {/* Age range for this ping */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Age range for this ping</Label>
          <DualRangeSlider
            min={16}
            max={80}
            value={[state.ageMinYap, state.ageMaxYap]}
            onValueChange={([min, max]) => updateState({ ageMinYap: min, ageMaxYap: max })}
            className="py-4"
          />
          <p className="text-sm text-muted-foreground text-center">
            Ages {state.ageMinYap}–{state.ageMaxYap} years
          </p>
        </div>

        {/* Group size (lunch/zanpan only) */}
        {showGroupSize && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Group size</Label>
            <DualRangeSlider
              min={1}
              max={8}
              value={[state.groupMin, state.groupMax]}
              onValueChange={([min, max]) => updateState({ groupMin: min, groupMax: max })}
              className="py-4"
              showTicks={true}
              tickLabels={peopleEmojis}
            />
            <div className="flex justify-center space-x-1">
              {peopleEmojis.map((emoji, index) => (
                <span
                  key={index}
                  className={`text-lg transition-all duration-200 ${
                    index + 1 >= state.groupMin && index + 1 <= state.groupMax
                      ? 'scale-110 opacity-100'
                      : 'opacity-30'
                  }`}
                >
                  {emoji}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {state.groupMin}–{state.groupMax} people
            </p>
          </div>
        )}

        <Button 
          onClick={handlePing}
          className="w-full text-lg py-6 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
          disabled={state.loading || !state.email || !state.name}
          data-ping-button
        >
          {state.loading ? (
            <>
              <div className="animate-spin h-5 w-5 mr-3 border-2 border-current border-t-transparent rounded-full" />
              Sending Ping...
            </>
          ) : (
            <>
              <span className="text-2xl mr-2">{currentCategory.emoji}</span>
              Ping Now!
            </>
          )}
        </Button>

        {!state.email || !state.name ? (
          <p className="text-sm text-muted-foreground text-center animate-fade-in">
            Please fill in your email and name first
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PingPanel;