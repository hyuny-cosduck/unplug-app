import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Lock, Droplets, Sprout } from 'lucide-react'
import { useRewardedChallengeStore } from '../stores/useStore'
import { CHALLENGES, CHALLENGE_REWARDS, CHALLENGE_SEEDS, CHALLENGE_BENEFITS } from '../services/challenges'
import { showToast } from '../components/Toast'

const DIFFICULTY_COLORS = {
  easy: 'bg-accent/10 text-accent border-accent/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  hard: 'bg-danger/10 text-danger border-danger/20',
}

const DIFFICULTY_LABELS = { easy: '쉬움', medium: '보통', hard: '도전' }

export default function Challenges() {
  const navigate = useNavigate()
  const { progress, startChallengeWithSeed, completeMissionWithReward } = useRewardedChallengeStore()

  const getProgress = (challengeId: string) =>
    progress.find((p) => p.challengeId === challengeId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="bg-white dark:bg-gray-800 px-6 pt-12 pb-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">챌린지</h1>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        {CHALLENGES.map((challenge) => {
          const prog = getProgress(challenge.id)
          const completedCount = prog
            ? Object.values(prog.missions).filter(Boolean).length
            : 0
          const isActive = !!prog

          return (
            <div
              key={challenge.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {challenge.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      DIFFICULTY_COLORS[challenge.difficulty]
                    }`}
                  >
                    {DIFFICULTY_LABELS[challenge.difficulty]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {challenge.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  <span className="text-blue-500 flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    미션당 +3💧
                  </span>
                  {CHALLENGE_REWARDS[challenge.id] && (
                    <span className="text-green-500 flex items-center gap-1">
                      <Sprout className="w-3 h-3" />
                      완료 시 {CHALLENGE_REWARDS[challenge.id].emoji} 획득
                    </span>
                  )}
                </div>

                {/* Expected Benefits */}
                {CHALLENGE_BENEFITS[challenge.id] && !isActive && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">✨ 예상 효과</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CHALLENGE_BENEFITS[challenge.id].map((benefit, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white dark:bg-gray-600 rounded-full text-xs text-gray-700 dark:text-gray-300"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${(completedCount / challenge.durationDays) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {completedCount}/{challenge.durationDays}
                  </span>
                </div>

                {!isActive && (
                  <button
                    onClick={() => {
                      const seed = CHALLENGE_SEEDS[challenge.id]
                      const result = startChallengeWithSeed(challenge.id, seed)
                      if (result.seedPlanted) {
                        showToast(`🌱 "${result.seedName}" 씨앗을 심었어요! 미션을 완료해서 키워보세요.`)
                      } else {
                        showToast('챌린지를 시작했어요!')
                      }
                    }}
                    className="mt-4 w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium"
                  >
                    시작하기
                  </button>
                )}
              </div>

              {/* Missions */}
              {isActive && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 space-y-2">
                  {challenge.dailyMissions.map((mission) => {
                    const done = prog?.missions[mission.day]
                    const isToday = mission.day === (prog?.currentDay || 1)
                    const locked = mission.day > (prog?.currentDay || 1)

                    return (
                      <div
                        key={mission.day}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          done ? 'opacity-60' : isToday ? 'bg-primary/5' : ''
                        }`}
                      >
                        <button
                          onClick={() => {
                            if (!done && !locked) {
                              const seed = CHALLENGE_SEEDS[challenge.id]
                              const reward = CHALLENGE_REWARDS[challenge.id]
                              const result = completeMissionWithReward(
                                challenge.id,
                                mission.day,
                                challenge.durationDays,
                                seed?.name,
                                reward
                              )
                              if (result.challengeCompleted && result.plantName) {
                                showToast(`🎊 챌린지 완료! ${reward.emoji} "${result.plantName}"(으)로 성장했어요!`)
                              } else {
                                showToast(`🎉 미션 완료! +3💧`)
                              }
                            }
                          }}
                          disabled={done || locked}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            done
                              ? 'bg-primary border-primary text-white'
                              : locked
                                ? 'border-gray-200 dark:border-gray-600 text-gray-300'
                                : 'border-primary hover:bg-primary/10'
                          }`}
                        >
                          {done && <Check className="w-3 h-3" />}
                          {locked && <Lock className="w-3 h-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            Day {mission.day}: {mission.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{mission.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
