import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useJournalStore } from '../stores/useStore'
import type { Mood } from '../types'

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: '매우 나쁨' },
  { value: 2, emoji: '😔', label: '나쁨' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '🙂', label: '좋음' },
  { value: 5, emoji: '😊', label: '매우 좋음' },
]

const CONTEXTS = [
  { id: 'pre-sns' as const, label: 'SNS 사용 전', emoji: '📱' },
  { id: 'post-sns' as const, label: 'SNS 사용 후', emoji: '📴' },
  { id: 'check-in' as const, label: '기분 체크인', emoji: '💭' },
]

export default function Journal() {
  const navigate = useNavigate()
  const { entries, addEntry } = useJournalStore()
  const [mode, setMode] = useState<'list' | 'new'>('list')
  const [context, setContext] = useState<'pre-sns' | 'post-sns' | 'check-in'>('check-in')
  const [mood, setMood] = useState<Mood>(3)
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    addEntry({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      mood,
      context,
      note: note.trim() || undefined,
    })
    setMode('list')
    setNote('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="bg-white dark:bg-gray-800 px-6 pt-12 pb-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">감정 기록</h1>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6">
        {mode === 'list' ? (
          <>
            <button
              onClick={() => setMode('new')}
              className="w-full py-3 bg-primary text-white rounded-2xl font-medium mb-6"
            >
              새 감정 기록하기
            </button>

            {entries.length === 0 ? (
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-pink-200 dark:border-pink-700">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">💭</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    감정을 기록하면 무엇이 좋을까요?
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-700/40 rounded-xl">
                    <span className="text-lg">🔍</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">패턴 발견</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">언제 SNS를 찾는지 알 수 있어요</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-700/40 rounded-xl">
                    <span className="text-lg">📊</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">기분 변화 추적</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">SNS 전후 기분이 어떻게 변하나요?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-700/40 rounded-xl">
                    <span className="text-lg">💡</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">맞춤 인사이트</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">데이터가 쌓이면 AI가 분석해드려요</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-400 mt-4">
                  ✨ 10초면 돼요. 위 버튼을 눌러 시작하세요!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{moodEmoji(entry.mood)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {contextLabel(entry.context)}
                          </p>
                          {entry.note && (
                            <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-8">
            {/* Context */}
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3">언제의 기분인가요?</h2>
              <div className="flex gap-2">
                {CONTEXTS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setContext(c.id)}
                    className={`flex-1 p-3 rounded-xl border text-center transition-colors ${
                      context === c.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="text-xl mb-1">{c.emoji}</div>
                    <div className="text-xs">{c.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood - 2 tap */}
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3">지금 기분은?</h2>
              <div className="flex justify-center gap-4">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      mood === m.value ? 'scale-110 bg-primary/10' : ''
                    }`}
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="text-xs text-gray-500">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional note */}
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3">한 줄 메모 (선택)</h2>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="지금 떠오르는 생각..."
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMode('list')}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium"
              >
                기록하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function moodEmoji(mood: number) {
  return ['', '😞', '😔', '😐', '🙂', '😊'][mood] || '😐'
}

function contextLabel(ctx: string) {
  return { 'pre-sns': 'SNS 사용 전', 'post-sns': 'SNS 사용 후', 'check-in': '기분 체크인' }[ctx] || ctx
}
