import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Droplets, Target } from 'lucide-react'
import { useGardenStore } from '../stores/useStore'

const GROWTH_STAGES = [
  { emoji: '🌰', label: '씨앗' },
  { emoji: '🌱', label: '새싹' },
  { emoji: '🪴', label: '어린 식물' },
  { emoji: '🌿', label: '자라는 중' },
  { emoji: '🌻', label: '꽃 피움' },
  { emoji: '🌳', label: '완전 성장' },
]

// 식물 상태 판단
function getPlantStatus(plant: { waterLevel: number; health: number }) {
  if (plant.waterLevel < 20 || plant.health < 30) {
    return { status: 'danger', message: '목이 말라요! 물이 필요해요 💧', color: 'text-red-500' }
  }
  if (plant.waterLevel < 40 || plant.health < 50) {
    return { status: 'warning', message: '조금 지쳐 보여요', color: 'text-amber-500' }
  }
  if (plant.waterLevel > 80 && plant.health > 80) {
    return { status: 'thriving', message: '아주 건강해요! 🌟', color: 'text-green-500' }
  }
  return { status: 'normal', message: '잘 자라고 있어요', color: 'text-gray-500' }
}

export default function Garden() {
  const navigate = useNavigate()
  const { garden, waterPlant } = useGardenStore()

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-green-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      <header className="px-6 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">나의 정원</h1>
        <div className="ml-auto flex items-center gap-1 text-sm text-primary font-medium">
          <Droplets className="w-4 h-4" />
          {garden.waterDrops}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6">
        {/* Garden Stats */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-4 mb-6 border border-white/50 dark:border-gray-700">
          <div className="grid grid-cols-3 text-center divide-x divide-gray-200 dark:divide-gray-700">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{garden.plants.length}</p>
              <p className="text-xs text-gray-500">식물</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{garden.waterDrops}💧</p>
              <p className="text-xs text-gray-500">물방울</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{garden.totalTimeSaved}분</p>
              <p className="text-xs text-gray-500">절약한 시간</p>
            </div>
          </div>
        </div>

        {/* Danger alert */}
        {garden.plants.some(p => p.waterLevel < 20 || p.health < 30) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 mb-4 text-sm text-red-600 dark:text-red-400">
            🚨 식물이 목말라해요! 챌린지 미션을 완료해서 물방울을 얻어주세요.
          </div>
        )}

        {/* How to earn */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mb-6 text-sm text-primary">
          💡 SNS 대신 보낸 시간 10분마다 물방울 1개를 얻어요
        </div>

        {/* Plants */}
        <div className="space-y-4">
          {garden.plants.map((plant) => {
            const stage = GROWTH_STAGES[plant.stage] || GROWTH_STAGES[0]

            const plantStatus = getPlantStatus(plant)
            const isDanger = plantStatus.status === 'danger'

            return (
              <div
                key={plant.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border transition-colors ${
                  isDanger
                    ? 'border-red-300 dark:border-red-700 animate-pulse'
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-5xl">{plant.emoji || stage.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{plant.name}</h3>
                    <p className="text-sm text-gray-500">{stage.label} · Stage {plant.stage}/5</p>
                  </div>
                </div>

                {/* Status message */}
                <p className={`text-xs mb-3 ${plantStatus.color}`}>
                  {plantStatus.message}
                </p>

                {/* Bars */}
                <div className="space-y-2 mb-4">
                  <Bar label="물" value={plant.waterLevel} color={plant.waterLevel < 30 ? 'bg-red-400' : 'bg-blue-400'} emoji="💧" />
                  <Bar label="햇빛" value={plant.sunlight} color="bg-yellow-400" emoji="☀️" />
                  <Bar label="건강" value={plant.health} color={plant.health < 40 ? 'bg-red-400' : 'bg-green-400'} emoji="💚" />
                </div>

                <button
                  onClick={() => waterPlant(plant.id)}
                  disabled={garden.waterDrops <= 0}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    garden.waterDrops > 0
                      ? isDanger
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Droplets className="w-4 h-4" />
                  {isDanger ? '지금 물주기! (1💧)' : '물주기 (1💧)'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Empty garden - show encouraging CTA */}
        {garden.plants.length === 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 text-center border border-green-200 dark:border-green-700">
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              첫 번째 씨앗을 심어보세요
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              챌린지를 시작하면 씨앗이 심어지고,<br/>
              미션을 완료할 때마다 식물이 자라요.
            </p>
            <Link
              to="/challenges"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              <Target className="w-4 h-4" />
              첫 챌린지 시작하기
            </Link>
            <p className="text-xs text-gray-400 mt-4">
              💡 가장 쉬운 챌린지부터 시작해보세요
            </p>
          </div>
        )}

        {/* No water drops - show how to earn */}
        {garden.plants.length > 0 && garden.waterDrops === 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💧</span>
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  물방울이 필요해요
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300 mb-2">
                  챌린지 미션을 완료하면 물방울 3개를 얻어요
                </p>
                <Link
                  to="/challenges"
                  className="text-sm font-medium text-blue-700 dark:text-blue-200 underline"
                >
                  챌린지 보러가기 →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Bar({ value, color, emoji }: { label: string; value: number; color: string; emoji: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-6">{emoji}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
    </div>
  )
}
