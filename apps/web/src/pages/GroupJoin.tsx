import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ArrowLeft, Cloud, HardDrive } from 'lucide-react'
import { useGroupStore } from '../stores/useStore'
import { groupService } from '../services/groupService'
import { showToast } from '../components/Toast'

const EMOJIS = ['😀', '😎', '🤓', '🦊', '🐰', '🐻', '🦁', '🐯', '🐸', '🐵']

export default function GroupJoin() {
  const navigate = useNavigate()
  const { joinGroup } = useGroupStore()

  const [inviteCode, setInviteCode] = useState('')
  const [myName, setMyName] = useState('')
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/my-groups')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join a Group
          </h1>
          <p className="text-gray-500">
            Enter the invite code from your friend
          </p>
        </div>

        {/* Join Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-4">
            {/* Invite Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 font-mono text-xl text-center tracking-wider uppercase"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            {/* Your Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                placeholder="Your nickname"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setMyEmoji(emoji)}
                    className={`w-12 h-12 text-2xl rounded-full border-2 transition-all ${
                      myEmoji === emoji
                        ? 'border-accent bg-accent/10 scale-110'
                        : 'border-gray-200'
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
              className="w-full py-3 bg-accent text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className={`mt-6 p-4 rounded-xl border ${
          groupService.isCloudEnabled
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            {groupService.isCloudEnabled ? (
              <>
                <Cloud className="w-5 h-5 text-emerald-600" />
                <p className="text-sm text-emerald-800">
                  <strong>Cloud Sync:</strong> Join groups from any device
                </p>
              </>
            ) : (
              <>
                <HardDrive className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  <strong>Local Mode:</strong> Share device or browser to test
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
