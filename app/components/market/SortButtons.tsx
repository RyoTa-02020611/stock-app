'use client'

type SortType = 'gainers' | 'losers' | 'volume' | 'marketcap'

interface SortButtonsProps {
  activeSort: { type: SortType; direction: 'asc' | 'desc' }
  onSortChange: (type: SortType, direction: 'asc' | 'desc') => void
}

export default function SortButtons({ activeSort, onSortChange }: SortButtonsProps) {
  const sortOptions: Array<{ id: SortType; label: string }> = [
    { id: 'gainers', label: '値上がり率' },
    { id: 'losers', label: '値下がり率' },
    { id: 'volume', label: '出来高' },
    { id: 'marketcap', label: '時価総額' },
  ]

  const handleClick = (type: SortType) => {
    // 同じタイプをクリックした場合は方向を切り替え
    if (activeSort.type === type) {
      onSortChange(type, activeSort.direction === 'asc' ? 'desc' : 'asc')
    } else {
      // 新しいタイプの場合は降順で開始
      onSortChange(type, 'desc')
    }
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <span className="text-gray-600 text-sm">並び替え:</span>
      {sortOptions.map((sort) => {
        const isActive = activeSort.type === sort.id
        return (
          <button
            key={sort.id}
            onClick={() => handleClick(sort.id)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all
              flex items-center gap-2
              ${
                isActive
                  ? 'bg-[#0066cc] text-white border-b-2 border-[#0052a3] shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <span>{sort.label}</span>
            {isActive && (
              <span className="text-xs">
                {activeSort.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

