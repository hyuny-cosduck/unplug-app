import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ArrowLeft } from 'lucide-react'
import { useGroupStore } from '../stores/useStore'
import { groupService } from '../services/groupService'
import { showToast } from '../components/Toast'

const EMOJIS = ['😀', '😎', '🤓', '🦊', '🐰', '🐻', '🦁', '🐯', '🐸', '🐵']

export default function GroupJoin() {
  const navigate = useNavigate()
  const { joinGroup } = useGroupStore()

  // Pre-fill name with username
  const storedUsername = localStorage.getItem('dd-username') || ''

  const [inviteCode, setInviteCode] = useState('')
  const [myName, setMyName] = useState(storedUsername)
  const [myEmoji, setMyEmoji] = useState('😎')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async () => {
    if (!inviteCode.trim() || !myName.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const code = inviteCode.trim().toUpperCase()

      if (groupService.isCloudEnabled) {
        // Use Supabase
        const username = localStorage.getItem('dd-username') || undefined
        const result = await groupService.joinGroup(code, myName.trim(), myEmoji, undefined, username)
        if (result.success && result.group && result.memberId) {
          // Store group ID for later retrieval
          localStorage.setItem('dd-group-id', result.group.id)
          localStorage.setItem('dd-my-member-id', result.memberId)
          showToast('Successfully joined the group!')
          navigate('/group')
        } else {
          setError(result.error || 'Invalid invite code. Please check and try again.')
        }
      } else {
        // Fallback to localStorage
        const result = joinGroup(code, myName.trim(), myEmoji)
        if (result.success) {
          showToast('Successfully joined the group!')
          navigate('/group')
        } else {
          setError('Invalid invite code. Please check and try again.')
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/my-groups')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Join a Group
          </h1>
          <p className="text-slate-500">
            Enter the invite code from your friend
          </p>
        </div>

        {/* Join Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="space-y-4">
            {/* Invite Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 font-mono text-xl text-center tracking-wider uppercase"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            {/* Your Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                placeholder="Your nickname"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setMyEmoji(emoji)}
                    className={`w-12 h-12 text-2xl rounded-full border-2 transition-all ${
                      myEmoji === emoji
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={!inviteCode.trim() || !myName.trim() || isLoading}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Joining...' : 'Join Group'}
            </button>

            <div className="text-center mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Already in a group?{' '}
                <button
                  onClick={() => navigate('/my-groups')}
                  className="text-primary font-medium hover:underline"
                >
                  View My Groups
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
