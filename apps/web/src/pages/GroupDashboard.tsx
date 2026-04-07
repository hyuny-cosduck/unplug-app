import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Clock, Camera, Users, Loader2, Upload, X, Sparkles, Bell, ArrowLeft, Target, Calendar, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { groupService, type Nudge } from '../services/groupService'
import { showToast } from '../components/Toast'
import type { Group } from '../types'
import Tesseract from 'tesseract.js'

export default function GroupDashboard() {
  const navigate = useNavigate()

  const [group, setGroup] = useState<Group | null>(null)
  const [myMemberId, setMyMemberId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLogModal, setShowLogModal] = useState(false)
  const [logMinutes, setLogMinutes] = useState(60)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nudges, setNudges] = useState<Nudge[]>([])
  const [showNudgeModal, setShowNudgeModal] = useState(false)

  // Fetch group and nudges from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      const groupId = localStorage.getItem('dd-group-id')
      const memberId = localStorage.getItem('dd-my-member-id')

      if (!groupId) {
        setIsLoading(false)
        return
      }

      setMyMemberId(memberId)

      try {
        const fetchedGroup = await groupService.fetchGroup(groupId)
        if (fetchedGroup) {
          setGroup(fetchedGroup)
        }

        // Fetch nudges for this member
        if (memberId) {
          const fetchedNudges = await groupService.fetchNudges(memberId)
          if (fetchedNudges.length > 0) {
            setNudges(fetchedNudges)
            setShowNudgeModal(true)
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription
    const groupId = localStorage.getItem('dd-group-id')
    if (groupId && groupService.isCloudEnabled) {
      const unsubscribe = groupService.subscribe(groupId, (updatedGroup) => {
        setGroup(updatedGroup)
      })
      return unsubscribe
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No group yet</p>
          <button
            onClick={() => navigate('/group/create')}
            className="px-6 py-3 bg-primary text-white rounded-xl"
          >
            Create or Join Group
          </button>
        </div>
      </div>
    )
  }

  // Calculate today's leaderboard from progress data
  const today = new Date().toISOString().split('T')[0]
  const leaderboard = group.members.map(member => {
    const todayProgress = group.progress.find(
      p => p.memberId === member.id && p.date === today
    )
    return {
      member,
      minutes: todayProgress?.minutes ?? null,
    }
  }).sort((a, b) => {
    if (a.minutes === null) return 1
    if (b.minutes === null) return -1
    return a.minutes - b.minutes // Lower is better
  })

  // Calculate weekly stats with trend comparison
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0]

  const weeklyStats = group.members.map(member => {
    // This week
    const thisWeekProgress = group.progress.filter(
      p => p.memberId === member.id && p.date >= weekAgoStr
    )
    const totalMinutes = thisWeekProgress.reduce((sum, p) => sum + p.minutes, 0)
    const daysLogged = new Set(thisWeekProgress.map(p => p.date)).size

    // Last week (for trend calculation)
    const lastWeekProgress = group.progress.filter(
      p => p.memberId === member.id && p.date >= twoWeeksAgoStr && p.date < weekAgoStr
    )
    const lastWeekMinutes = lastWeekProgress.reduce((sum, p) => sum + p.minutes, 0)

    // Calculate trend (positive = increased usage = bad, negative = decreased = good)
    let trend: 'up' | 'down' | 'same' | null = null
    let trendPercent = 0
    if (lastWeekMinutes > 0) {
      const diff = totalMinutes - lastWeekMinutes
      trendPercent = Math.round((diff / lastWeekMinutes) * 100)
      if (trendPercent > 5) trend = 'up'
      else if (trendPercent < -5) trend = 'down'
      else trend = 'same'
    }

    return { member, totalMinutes, daysLogged, trend, trendPercent, lastWeekMinutes }
  }).sort((a, b) => a.totalMinutes - b.totalMinutes)

  const myStats = weeklyStats.find(s => s.member.id === myMemberId)
  const myRank = leaderboard.findIndex(l => l.member.id === myMemberId) + 1

  // Parse screen time from OCR text (handles various formats)
  const parseScreenTime = (text: string): number | null => {
    // Common patterns: "2h 30m", "2시간 30분", "150 min", "2:30", etc.
    const patterns = [
      /(\d+)\s*h(?:our)?s?\s*(\d+)?\s*m(?:in)?/i,  // 2h 30m, 2 hours 30 min
      /(\d+)\s*시간\s*(\d+)?\s*분/,                   // 2시간 30분
      /(\d+):(\d+)/,                                  // 2:30
      /(\d+)\s*m(?:in)?(?:ute)?s?/i,                 // 150 min, 150 minutes
      /(\d+)\s*분/,                                   // 150분
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        if (pattern.source.includes(':') || pattern.source.includes('h') || pattern.source.includes('시간')) {
          const hours = parseInt(match[1]) || 0
          const mins = parseInt(match[2]) || 0
          return hours * 60 + mins
        } else {
          return parseInt(match[1])
        }
      }
    }
    return null
  }

  // Handle screenshot upload and OCR
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = async (event) => {
      const imageData = event.target?.result as string
      setScreenshot(imageData)
      setIsProcessingOCR(true)
      setOcrConfidence(null)

      try {
        showToast('Analyzing screenshot...')
        const result = await Tesseract.recognize(imageData, 'eng+kor', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              // Progress update
            }
          }
        })

        const extractedTime = parseScreenTime(result.data.text)
        if (extractedTime !== null && extractedTime >= 0 && extractedTime <= 600) {
          setLogMinutes(extractedTime)
          setOcrConfidence(Math.round(result.data.confidence))
          showToast(`Detected: ${extractedTime} minutes`)
        } else {
          showToast('Could not detect time. Please adjust manually.')
        }
      } catch (err) {
        console.error('OCR error:', err)
        showToast('Failed to analyze screenshot')
      } finally {
        setIsProcessingOCR(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const clearScreenshot = () => {
    setScreenshot(null)
    setOcrConfidence(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleLog = async () => {
    if (!myMemberId) return

    setShowLogModal(false)
    const hadScreenshot = !!screenshot // Just track if screenshot was provided
    clearScreenshot()
    showToast(`Logging ${logMinutes} minutes...`)

    try {
      // Pass boolean for verified status (don't save large base64 to DB)
      const success = await groupService.logProgress(group.id, myMemberId, logMinutes, hadScreenshot)
      if (success) {
        showToast(`Logged ${logMinutes} minutes!`)
        // Refresh group data
        const updatedGroup = await groupService.fetchGroup(group.id)
        if (updatedGroup) setGroup(updatedGroup)
      } else {
        showToast('Failed to log progress')
      }
    } catch (err) {
      showToast('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate('/my-groups')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>My Groups</span>
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
            <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5">
              <Users className="w-4 h-4" />
              <span className="font-medium">{group.members.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
        {/* Active Challenge Progress */}
        {group.currentChallenge && (() => {
          const start = new Date(group.currentChallenge.startDate)
          const end = new Date(group.currentChallenge.endDate)
          const now = new Date()
          const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          const elapsedDays = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
          const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100))
          const isActive = now >= start && now <= end

          return (
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-5 text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span className="font-semibold">{group.currentChallenge.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActive ? 'bg-white/20' : 'bg-amber-400 text-amber-900'
                }`}>
                  {isActive ? `${daysRemaining}d left` : 'Ended'}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-white/80 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Day {Math.min(elapsedDays, totalDays)} of {totalDays}</span>
                </div>
                {group.currentChallenge.penalty && (
                  <span className="text-white/60">Penalty: {group.currentChallenge.penalty}</span>
                )}
              </div>
            </div>
          )
        })()}

        {/* Log Button - Primary Action */}
        <button
          onClick={() => setShowLogModal(true)}
          className="w-full py-4 bg-primary text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-primary-dark transition-colors"
        >
          <Camera className="w-5 h-5" />
          Log Today's Screen Time
        </button>

        {/* My Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Your Status</h2>
            {myRank > 0 && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                myRank === 1 ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                <Trophy className="w-4 h-4" />
                #{myRank}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {myStats?.totalMinutes || 0}
              </p>
              <p className="text-xs text-slate-500">This week (min)</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">
                {myStats?.daysLogged || 0}/7
              </p>
              <p className="text-xs text-slate-500">Days logged</p>
            </div>
          </div>
        </div>

        {/* Today's Leaderboard */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Today's Leaderboard
          </h2>

          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isNotLogged = entry.minutes === null
              const isOtherMember = entry.member.id !== myMemberId

              return (
                <div
                  key={entry.member.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    entry.member.id === myMemberId
                      ? 'bg-primary/5 border border-primary/20'
                      : isNotLogged
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isNotLogged ? 'bg-amber-100 text-amber-600' :
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-200 text-slate-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {isNotLogged ? '?' : index + 1}
                  </div>
                  <span className="text-2xl">{entry.member.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {entry.member.name}
                      {entry.member.id === myMemberId && ' (You)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.minutes !== null ? (
                      <p className={`font-bold ${
                        entry.minutes <= 60 ? 'text-accent' :
                        entry.minutes <= 120 ? 'text-warning' :
                        'text-danger'
                      }`}>
                        {entry.minutes}m
                      </p>
                    ) : isOtherMember ? (
                      <button
                        onClick={async () => {
                          if (!myMemberId || !group) return
                          const success = await groupService.sendNudge(group.id, myMemberId, entry.member.id)
                          if (success) {
                            showToast(`Nudged ${entry.member.name}!`)
                          } else {
                            showToast('Failed to send nudge')
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-full hover:bg-amber-600 transition-colors flex items-center gap-1"
                      >
                        <Bell className="w-3 h-3" />
                        Nudge
                      </button>
                    ) : (
                      <span className="text-amber-600 text-sm font-medium">Log now</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            This Week
          </h2>

          <div className="space-y-3">
            {weeklyStats.map((stat, index) => (
              <div
                key={stat.member.id}
                className="flex items-center gap-3"
              >
                <span className="text-xl">{stat.member.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {stat.member.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Trend indicator */}
                      {stat.trend && (
                        <span className={`flex items-center gap-0.5 text-xs font-medium ${
                          stat.trend === 'down' ? 'text-emerald-600' :
                          stat.trend === 'up' ? 'text-red-500' :
                          'text-slate-400'
                        }`}>
                          {stat.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                          {stat.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                          {stat.trend === 'same' && <Minus className="w-3 h-3" />}
                          {stat.trend !== 'same' && `${Math.abs(stat.trendPercent)}%`}
                        </span>
                      )}
                      <span className="text-sm text-slate-500">
                        {stat.totalMinutes}m
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-accent' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(100, (stat.totalMinutes / (weeklyStats[weeklyStats.length - 1]?.totalMinutes || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nudge Button */}
        <div className="bg-slate-100 rounded-2xl p-5">
          <h3 className="font-semibold text-slate-900 mb-2">
            Nudge a Friend
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            Send a friendly reminder
          </p>
          <div className="flex gap-2 flex-wrap">
            {group.members.filter(m => m.id !== myMemberId).map(member => (
              <button
                key={member.id}
                onClick={async () => {
                  if (!myMemberId || !group) return
                  const success = await groupService.sendNudge(group.id, myMemberId, member.id)
                  if (success) {
                    showToast(`Nudged ${member.name}!`)
                  } else {
                    showToast('Failed to send nudge')
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium hover:bg-primary/10 transition-colors border border-slate-200"
              >
                <span>{member.emoji}</span>
                <span className="text-slate-700">{member.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Log Today's SNS Time
            </h3>

            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-primary mb-2">{logMinutes}</p>
              <p className="text-slate-500">minutes</p>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex gap-2 justify-center mb-4">
              {[
                { label: '30m', value: 30 },
                { label: '1h', value: 60 },
                { label: '1.5h', value: 90 },
                { label: '2h', value: 120 },
                { label: '3h+', value: 180 },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setLogMinutes(value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    logMinutes === value
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              type="range"
              min={0}
              max={600}
              step={5}
              value={logMinutes}
              onChange={(e) => setLogMinutes(Number(e.target.value))}
              className="w-full mb-4 accent-primary"
            />

            <div className="flex justify-between text-xs text-slate-400 mb-4">
              <span>0m</span>
              <span>2h</span>
              <span>4h</span>
              <span>6h</span>
              <span>8h</span>
              <span>10h</span>
            </div>

            {/* Screenshot Upload */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="hidden"
                id="screenshot-upload"
              />

              {!screenshot ? (
                <label
                  htmlFor="screenshot-upload"
                  className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-sm text-slate-500">
                    Upload screenshot for auto-detect
                  </span>
                  <span className="text-xs text-slate-400">
                    (Screen Time / Digital Wellbeing)
                  </span>
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={screenshot}
                    alt="Screenshot"
                    className="w-full h-32 object-cover rounded-xl"
                  />
                  <button
                    onClick={clearScreenshot}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {isProcessingOCR && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                  {ocrConfidence !== null && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-accent text-white text-xs rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Auto-detected ({ocrConfidence}%)
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLogModal(false)
                  clearScreenshot()
                }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLog}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium"
              >
                Log Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nudge Notification Modal */}
      {showNudgeModal && nudges.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                You got nudged!
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              {nudges.map((nudge) => (
                <div
                  key={nudge.id}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{nudge.fromMemberEmoji || '👤'}</span>
                    <span className="font-medium text-slate-900">
                      {nudge.fromMemberName || 'Someone'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{nudge.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(nudge.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={async () => {
                const nudgeIds = nudges.map(n => n.id)
                await groupService.markNudgesRead(nudgeIds)
                setShowNudgeModal(false)
                setNudges([])
              }}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
