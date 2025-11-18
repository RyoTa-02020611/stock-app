'use client'

import { useEffect, useState } from 'react'

interface ImpactScoreCardProps {
  symbol: string
  currentPrice: number
}

export default function ImpactScoreCard({ symbol, currentPrice }: ImpactScoreCardProps) {
  const [impactScore, setImpactScore] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/ai/predict-impact?symbol=${symbol}&timeframes=short`)
        
        if (response.ok) {
          const data = await response.json()
          setImpactScore(data.summary.overallImpact)
          setConfidence(data.summary.overallConfidence)
        }
      } catch (error) {
        console.error('Error fetching impact score:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchImpact()
  }, [symbol])

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (impactScore === null) {
    return null
  }

  const getColor = (score: number) => {
    if (score > 30) return 'text-[#00c853] bg-green-50'
    if (score < -30) return 'text-[#e53935] bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getRecommendation = (score: number) => {
    if (score > 30) return { text: '買い推奨', color: 'bg-[#00c853]' }
    if (score < -30) return { text: '売り推奨', color: 'bg-[#e53935]' }
    return { text: '保持', color: 'bg-gray-500' }
  }

  const recommendation = getRecommendation(impactScore)

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-lg font-semibold mb-4">影響スコア</h3>
      
      <div className={`rounded-lg p-6 text-center ${getColor(impactScore)}`}>
        <p className="text-gray-600 text-sm mb-2">総合影響スコア</p>
        <p className="text-4xl font-bold mb-2">
          {impactScore > 0 ? '+' : ''}{impactScore.toFixed(1)}
        </p>
        <p className="text-gray-600 text-sm">信頼度: {confidence?.toFixed(0) || 0}%</p>
      </div>

      <div className="mt-4">
        <div className={`px-4 py-2 rounded-md text-center text-white font-medium ${recommendation.color}`}>
          {recommendation.text}
        </div>
      </div>
    </div>
  )
}

