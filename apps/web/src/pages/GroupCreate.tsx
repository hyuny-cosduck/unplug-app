import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Copy, Check, ArrowLeft, Share2 } from 'lucide-react'
import { groupService } from '../services/groupService'
import { showToast } from '../components/Toast'
import type { Group } from '../types'

const EMOJIS = ['😀', '😎', '🤓', '🦊', '🐰', '🐻', '🦁', '🐯', '🐸', '🐵']

export default function GroupCreate() {
  const navigate = useNavigate()

  // Pre-fill name with username
  const storedUsername = localStorage.getItem('dd-username') || ''

  const [group, setGroup] = useState<Group | null>(null)
  const [step, setStep] = useState<'create' | 'invite' | 'waiting'>('create')
  const [isLoading, setIsLoading] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [myName, setMyName] = useState(storedUsername)
  const [myEmoji, setMyEmoji] = useState('😀')
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!groupName.trim() || !myName.trim()) return

    setIsLoading(true)
    try {
      const username = localStorage.getItem('dd-username') || undefined
      const dtiType = localStorage.getItem('dd-dti-type') || undefined
      const result = await groupService.createGroup(groupName.trim(), myName.trim(), myEmoji, dtiType, username)
      if (result) {
        setGroup(result.group)
        // Store group ID for later retrieval
        localStorage.setItem('dd-group-id', result.group.id)
        localStorage.setItem('dd-my-member-id', result.memberId)
        setStep('invite')
        showToast('Group created!')
      } else {
        showToast('Failed to create group')
      }
    } catch (err) {
      showToast('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const copyCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast('Copied!')
  }

  const shareInvite = async () => {
    if (!group) return
    const shareText = `Join my Unplug group "${group.name}"!

Code: ${group.code}

Take the DTI quiz and start your digital detox together:
https://unplug-together.vercel.app/onboarding`

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
      } catch {
        // User cancelled or error
        copyCode()
      }
    } else {
      navigator.clipboard.writeText(shareText)
      showToast('Invite message copied!')
    }
  }

  const handleStart = () => {
    navigate('/group')
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
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {step === 'create' && 'Create Your Group'}
            {step === 'invite' && 'Invite Friends'}
            {step === 'waiting' && 'Your Group'}
          </h1>
          <p className="text-slate-500">
            {step === 'create' && 'Start tracking screen time with friends'}
            {step === 'invite' && 'Share the code with your friends'}
            {step === 'waiting' && `${group?.members.length || 0} members`}
          </p>
        </div>

        {/* Step 1: Create Group */}
        {step === 'create' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Study Squad"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                />
              </div>

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

              <button
                onClick={handleCreate}
                disabled={!groupName.trim() || !myName.trim() || isLoading}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? 'Creating...' : 'Create Group'}
              </button>

              <div className="text-center mt-4 pt-4 border-t border-slate-100 space-y-2">
                <p className="text-sm text-slate-500">
                  Have an invite code?{' '}
                  <button
                    onClick={() => navigate('/group/join')}
                    className="text-primary font-medium hover:underline"
                  >
                    Join a Group
                  </button>
                </p>
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
        )}

        {/* Step 2: Invite Friends */}
        {(step === 'invite' || step === 'waiting') && group && (
          <div className="space-y-4">
            {/* Invite Code - Enhanced */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-sm font-medium text-white/80 mb-3 text-center">
                Share this code with friends
              </h3>
              <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-4 mb-4">
                <p className="font-mono text-3xl text-center tracking-[0.3em] font-bold">
                  {group.code}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyCode}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={shareInvite}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-violet-600 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share Invite
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 mb-3">
                Members ({group.members.length})
              </h3>
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                  >
                    <span className="text-2xl">{member.emoji}</span>
                    <span className="font-medium text-slate-900">
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
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              className="w-full py-4 bg-primary text-white rounded-2xl font-semibold text-lg"
            >
              Enter Group
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
