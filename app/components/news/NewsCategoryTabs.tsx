'use client'

interface Category {
  id: string
  label: string
  icon: string
}

interface NewsCategoryTabsProps {
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export default function NewsCategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: NewsCategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            selectedCategory === category.id
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <span className="mr-2">{category.icon}</span>
          {category.label}
        </button>
      ))}
    </div>
  )
}

