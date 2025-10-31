import { useMemo } from 'react';
import { ElementCard } from './ElementCard';
import type { ElementCategory } from '../../types';
import { useAltarStore, useAvailableElements } from '../../store/useAltarStore';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { getCategoryDisplayName } from '../../data/elements';

/**
 * Element panel component
 * Displays available ofrenda elements with category filtering
 */
export function ElementPanel() {
  const {
    elements: { categories, selectedCategory },
    selectCategory,
    getElementUsageCount
  } = useAltarStore();

  const availableElements = useAvailableElements();
  const { handleDragStart, handleDragEnd } = useDragAndDrop();

  // Get all elements (including unavailable ones for display)
  const allElements = useAltarStore((state: { elements: { available: typeof import('../../data/elements').OFRENDA_ELEMENTS } }) => state.elements.available);

  // Filter elements by selected category
  const displayElements = useMemo(() => {
    if (!selectedCategory) {
      return allElements;
    }
    return allElements.filter((el: { category: ElementCategory }) => el.category === selectedCategory);
  }, [allElements, selectedCategory]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat: ElementCategory) => {
      counts[cat] = allElements.filter((el: { category: ElementCategory }) => el.category === cat).length;
    });
    return counts;
  }, [allElements, categories]);

  return (
    <div className="element-panel flex flex-col h-full bg-gray-900/50 border-l border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-orange-400 mb-2">
          Elementos
        </h2>
        <p className="text-sm text-gray-400">
          Arrastra elementos al altar
        </p>
      </div>

      {/* Category Filter */}
      <div className="p-4 border-b border-gray-800 overflow-x-auto">
        <div className="flex flex-wrap gap-2">
          {/* All categories button */}
          <button
            onClick={() => selectCategory(undefined)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${!selectedCategory
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
            aria-pressed={!selectedCategory}
          >
            Todos ({allElements.length})
          </button>

          {/* Category buttons */}
          {categories.map(category => (
            <button
              key={category}
              onClick={() => selectCategory(category)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                ${selectedCategory === category
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
              aria-pressed={selectedCategory === category}
            >
              {getCategoryDisplayName(category)} ({categoryCounts[category] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Elements Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayElements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="text-4xl mb-2">🪔</span>
            <p>No hay elementos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {displayElements.map((element) => {
              const usageCount = getElementUsageCount(element.type);
              const isAvailable = availableElements.some((el) => el.id === element.id);

              return (
                <ElementCard
                  key={element.id}
                  element={element}
                  usageCount={usageCount}
                  isAvailable={isAvailable}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/70">
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <span className="text-lg">💡</span>
          <div>
            <p className="font-medium text-gray-300 mb-1">
              Consejos:
            </p>
            <ul className="space-y-1">
              <li>• Arrastra elementos al espacio del altar</li>
              <li>• Cada elemento tiene un límite máximo</li>
              <li>• Algunos elementos tienen posiciones específicas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

ElementPanel.displayName = 'ElementPanel';
