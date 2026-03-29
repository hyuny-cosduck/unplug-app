import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Copy, Check, UserPlus, ArrowLeft } from 'lucide-react'
import { useGroupStore } from '../stores/useStore'
import { showToast } from '../components/Toast'

const EMOJIS = ['😀', '😎', '🤓', '🦊', '🐰', '🐻', '🦁', '🐯', '🐸', '🐵']

export default function GroupCreate() {
  const navigate = useNavigate()
  const { group, createGroup, addFriend, canStart } = useGroupStore()

  const [step, setStep] = useState<'create' | 'invite' | 'waiting'>(group ? 'waiting' : 'create')
  const [groupName, setGroupName] = useState('')
  const [myName, setMyName] = useState('')
  const [myEmoji, setMyEmoji] = useState('😀')
  const [copied, setCopied] = useState(false)

  // Demo friends to add
  const [friendName, setFriendName] = useState('')
  const [friendEmoji, setFriendEmoji] = useState('🦊')

  const handleCreate = () => {
    if (!groupName.trim() || !myName.trim()) return
    createGroup(groupName.trim(), myName.trim(), myEmoji)
    setStep('invite')
  }

  const copyCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast('Copied!')
  }

  const handleAddFriend = () => {
    if (!friendName.trim()) return
    addFriend(friendName.trim(), friendEmoji)
    setFriendName('')
    showToast(`${friendEmoji} ${friendName} joined!`)
  }

  const handleStart = () => {
    if (canStart) {
      navigate('/group')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/landing')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 'create' && 'Create Your Group'}
            {step === 'invite' && 'Invite Friends'}
            {step === 'waiting' && 'Your Group'}
          </h1>
          <p className="text-gray-500">
            {step === 'create' && 'Start a detox challenge with friends'}
            {step === 'invite' && 'You need at least 2 people to start'}
            {step === 'waiting' && `${group?.members.length || 0} members`}
          </p>
        </div>

        {/* Step 1: Create Group */}
        {step === 'create' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Study Squad"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400"
                />
              </div>

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
                          ? 'border-primary bg-primary/10 scale-110'
                          : 'border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!groupName.trim() || !myName.trim()}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                Create Group
              </button>

              <div className="text-center mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Have an invite code?{' '}
                  <button
                    onClick={() => navigate('/group/join')}
                    className="text-accent font-medium hover:underline"
                  >
                    Join a Group
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Invite Friends */}
        {(step === 'invite' || step === 'waiting') && group && (
          <div className="space-y-4">
            {/* Invite Code */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Invite Code
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 font-mono text-xl text-center tracking-wider text-gray-900">
                  {group.code}
                </div>
                <button
                  onClick={copyCode}
                  className="p-3 bg-primary text-white rounded-xl"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Share this code with friends to join
              </p>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Members ({group.members.length})
              </h3>
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <span className="text-2xl">{member.emoji}</span>
                    <span className="font-medium text-gray-900">
                      {member.name}
                    </span>
                    {member.isMe && (
                      <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Demo: Add friend manually */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Demo: Add a friend</p>
                <div className="flex gap-2">
                  <select
                    value={friendEmoji}
                    onChange={(e) => setFriendEmoji(e.target.value)}
                    className="w-16 px-2 py-2 rounded-lg border border-gray-200 bg-white text-gray-900"
                  >
                    {EMOJIS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    placeholder="Friend's name"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400"
                  />
                  <button
                    onClick={handleAddFriend}
                    className="p-2 bg-accent text-white rounded-lg"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4">
              {canStart ? (
                <button
                  onClick={handleStart}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg"
                >
                  Start Challenge
                </button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    Need at least <strong>2 people</strong> to start
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {2 - group.members.length} more needed
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
