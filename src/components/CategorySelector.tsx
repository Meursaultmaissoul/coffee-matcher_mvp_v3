import { Card, CardContent } from '@/components/ui/card';
import { type Category } from '@/hooks/useAppState';

interface CategorySelectorProps {
  selected: Category;
  onSelect: (category: Category) => void;
  counts: { coffee: number; lunch: number; zanpan: number };
}

const CategorySelector = ({ selected, onSelect, counts }: CategorySelectorProps) => {
  const handleCategorySelect = (category: Category) => {
    if (category !== selected) {
      // Save the new category first
      localStorage.setItem('cm_category', category);
      // Then reload the entire page
      window.location.reload();
    }
  };
  const categories = [
    {
      id: 'coffee' as Category,
      title: 'Coffee Break',
      emoji: '☕',
      description: '1-on-1 coffee chat',
      gradient: 'from-amber-400 to-orange-500',
      hoverGradient: 'hover:from-amber-500 hover:to-orange-600',
      count: counts.coffee,
    },
    {
      id: 'lunch' as Category,
      title: 'Lunch Break',
      emoji: '🍱',
      description: 'Group lunch gathering',
      gradient: 'from-green-400 to-emerald-500',
      hoverGradient: 'hover:from-green-500 hover:to-emerald-600',
      count: counts.lunch,
    },
    {
      id: 'zanpan' as Category,
      title: '残飯',
      emoji: '🍚',
      description: '残業ごはん time',
      gradient: 'from-purple-400 to-pink-500',
      hoverGradient: 'hover:from-purple-500 hover:to-pink-600',
      count: counts.zanpan,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {categories.map((category) => (
        <Card
          key={category.id}
          className={`cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-xl border-2 ${
            selected === category.id
              ? 'border-primary shadow-lg ring-4 ring-primary/20 scale-105'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleCategorySelect(category.id)}
        >
          <CardContent className="p-6 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${category.gradient} ${category.hoverGradient} transition-all duration-500 mb-4 text-3xl ${
              selected === category.id ? 'animate-bounce-gentle' : ''
            }`}>
              {category.emoji}
            </div>
            <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
            <p className="text-muted-foreground text-sm mb-3">{category.description}</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-lg font-bold text-primary">{category.count}</span>
              <span className="text-sm text-muted-foreground">open now</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CategorySelector;