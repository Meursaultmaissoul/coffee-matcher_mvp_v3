import { type Category } from '@/hooks/useAppState';

interface LoadingAnimationProps {
  category: Category;
  message?: string;
}

const LoadingAnimation = ({ category, message = 'Loading...' }: LoadingAnimationProps) => {
  const animations = {
    coffee: {
      emoji: '☕',
      animation: 'animate-bounce',
      bgClass: 'from-amber-50 to-orange-50',
      textClass: 'text-amber-800',
    },
    lunch: {
      emoji: '🍱',
      animation: 'animate-pulse',
      bgClass: 'from-green-50 to-emerald-50',
      textClass: 'text-green-800',
    },
    zanpan: {
      emoji: '🍚',
      animation: 'animate-spin',
      bgClass: 'from-purple-50 to-pink-50',
      textClass: 'text-purple-800',
    },
  };

  const config = animations[category];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br ${config.bgClass} backdrop-blur-sm`}>
      <div className="text-center space-y-6 p-8 rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/50">
        <div className={`text-8xl ${config.animation}`} style={{ animationDuration: '1.5s' }}>
          {config.emoji}
        </div>
        <div className="space-y-2">
          <h3 className={`text-2xl font-semibold ${config.textClass}`}>
            {message}
          </h3>
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${config.textClass.replace('text-', 'bg-')} animate-pulse`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;