import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Clock, Camera, Users, Target, Loader2, Upload, X, Sparkles, Bell } from 'lucide-react'
// import { useGroupStore } from '../stores/useStore'
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

  // Calculate weekly stats
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const weeklyStats = group.members.map(member => {
    const memberProgress = group.progress.filter(
      p => p.memberId === member.id && p.date >= weekAgoStr
    )
    const totalMinutes = memberProgress.reduce((sum, p) => sum + p.minutes, 0)
    const daysLogged = new Set(memberProgress.map(p => p.date)).size
    return { member, totalMinutes, daysLogged }
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
    clearScreenshot()
    showToast(`Logging ${logMinutes} minutes...`)

    try {
      const success = await groupService.logProgress(group.id, myMemberId, logMinutes)
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm">Your Group</p>
              <h1 className="text-2xl font-bold">{group.name}</h1>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <Users className="w-4 h-4" />
              <span className="font-medium">{group.members.length}</span>
            </div>
          </div>

          {/* Challenge Info */}
          {group.currentChallenge ? (
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" />
                <span className="font-medium">{group.currentChallenge.title}</span>
              </div>
              <p className="text-sm text-white/70">{group.currentChallenge.description}</p>
              {group.currentChallenge.penalty && (
                <p className="text-sm mt-2">
                  Penalty: <strong>{group.currentChallenge.penalty}</strong>
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/group/challenge')}
              className="w-full bg-white/20 hover:bg-white/30 rounded-xl p-4 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span className="font-medium">Set up a challenge</span>
              </div>
              <p className="text-sm text-white/70 mt-1">
                Create a group goal with rewards and penalties
              </p>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        {/* My Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Your Status</h2>
            {myRank > 0 && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                myRank === 1 ? 'bg-yellow-100 text-yellow-700' :
                myRank === leaderboard.length ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                <Trophy className="w-4 h-4" />
                #{myRank}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {myStats?.totalMinutes || 0}
              </p>
              <p className="text-xs text-gray-500">This week (min)</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">
                {myStats?.daysLogged || 0}/7
              </p>
              <p className="text-xs text-gray-500">Days logged</p>
            </div>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Log Today's Screen Time
          </button>
        </div>

        {/* Today's Leaderboard */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Today's Leaderboard
          </h2>

          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.member.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  entry.member.id === myMemberId
                    ? 'bg-primary/5 border border-primary/20'
                    : 'bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-200 text-gray-600' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <span className="text-2xl">{entry.member.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {entry.member.name}
                    {entry.member.id === myMemberId && ' (You)'}
                  </p>
                </div>
                <div className="text-right">
                  {entry.minutes !== null ? (
                    <p className={`font-bold ${
                      entry.minutes <= 60 ? 'text-accent' :
                      entry.minutes <= 120 ? 'text-warning' :
                      'text-danger'
                    }`}>
                      {entry.minutes}m
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm">Not logged</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                    <span className="text-sm font-medium text-gray-700">
                      {stat.member.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {stat.totalMinutes}m total
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
          <h3 className="font-bold text-gray-900 mb-2">
            Nudge a Friend
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Send a friendly reminder to someone who's been on SNS too long
          </p>
          <div className="flex gap-2">
            {group.members.filter(m => !m.isMe).map(member => (
              <button
                key={member.id}
                onClick={async () => {
                  if (!myMemberId || !group) return
                  const success = await groupService.sendNudge(group.id, myMemberId, member.id)
                  if (success) {
                    showToast(`Nudged ${member.name}! 👋`)
                  } else {
                    showToast('Failed to send nudge')
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium hover:bg-amber-100 transition-colors"
              >
                <span>{member.emoji}</span>
                <span className="text-gray-700">{member.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Log Today's SNS Time
            </h3>

            <div className="text-center mb-6">
              <p className="text-5xl font-bold text-primary mb-2">{logMinutes}</p>
              <p className="text-gray-500">minutes</p>
            </div>

            <input
              type="range"
              min={0}
              max={300}
              step={5}
              value={logMinutes}
              onChange={(e) => setLogMinutes(Number(e.target.value))}
              className="w-full mb-4 accent-primary"
            />

            <div className="flex justify-between text-xs text-gray-400 mb-6">
              <span>0m</span>
              <span>1h</span>
              <span>2h</span>
              <span>3h</span>
              <span>4h</span>
              <span>5h</span>
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
                  className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Upload screenshot for auto-detect
                  </span>
                  <span className="text-xs text-gray-400">
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
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Auto-detected ({ocrConfidence}% confidence)
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
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                You got nudged! 👋
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              {nudges.map((nudge) => (
                <div
                  key={nudge.id}
                  className="bg-amber-50 rounded-xl p-4 border border-amber-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{nudge.fromMemberEmoji || '👤'}</span>
                    <span className="font-medium text-gray-900">
                      {nudge.fromMemberName || 'Someone'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{nudge.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(nudge.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={async () => {
                // Mark nudges as read
                const nudgeIds = nudges.map(n => n.id)
                await groupService.markNudgesRead(nudgeIds)
                setShowNudgeModal(false)
                setNudges([])
              }}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium"
            >
              Got it! I'll put my phone down 📱
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
