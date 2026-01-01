import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProductFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  categories: string[];
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  categoryCounts?: Record<string, number>;
  totalProducts?: number;
}

// Helper function to ensure category is always a string
function ensureStringCategory(cat: unknown, index: number): string {
  if (typeof cat === 'string' && cat.trim() !== '') {
    return cat;
  }
  if (typeof cat === 'object' && cat !== null && 'name' in cat) {
    return String((cat as { name: unknown }).name || `category-${index}`);
  }
  return String(cat || `category-${index}`);
}

export function ProductFilters({
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
  categoryCounts = {},
  totalProducts = 0,
}: ProductFiltersProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+F or Cmd+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="mb-3 md:mb-4 space-y-2 md:space-y-3 sticky top-0 z-10 bg-background/95 backdrop-blur pb-2">
      <div className="relative w-full max-w-2xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Search products... (Ctrl+F)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-10 md:h-11 text-sm md:text-base"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>F
          </kbd>
        </div>
      </div>
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('all')}
          className={cn(
            "text-xs md:text-sm shrink-0 h-9 md:h-10 px-3 md:px-4 touch-manipulation",
            selectedCategory === 'all' && "bg-primary text-primary-foreground font-semibold"
          )}
        >
          All
          {totalProducts > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {totalProducts}
            </Badge>
          )}
        </Button>
        {categories.map((cat, index) => {
          const categoryName = ensureStringCategory(cat, index);
          const uniqueKey = `category-btn-${index}-${categoryName}`;
          const count = categoryCounts[categoryName] || 0;
          const isActive = selectedCategory === categoryName;
          
          return (
            <Button
              key={uniqueKey}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(categoryName)}
              className={cn(
                "text-xs md:text-sm shrink-0 h-9 md:h-10 px-3 md:px-4 touch-manipulation",
                isActive && "bg-primary text-primary-foreground font-semibold"
              )}
            >
              {categoryName}
              {count > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

