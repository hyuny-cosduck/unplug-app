import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, UserPlus, Loader2, LogOut, Sparkles } from 'lucide-react'
import { groupService } from '../services/groupService'
import type { Group } from '../types'

export default function MyGroups() {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUsernameInput, setShowUsernameInput] = useState(false)
  const [inputUsername, setInputUsername] = useState('')
  const [showNewUsernameConfirm, setShowNewUsernameConfirm] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  useEffect(() => {
    const storedUsername = localStorage.getItem('dd-username')
    if (storedUsername) {
      setUsername(storedUsername)
      loadGroups(storedUsername)
    } else {
      setShowUsernameInput(true)
      setIsLoading(false)
    }
  }, [])

  const loadGroups = async (user: string) => {
    setIsLoading(true)
    try {
      const fetchedGroups = await groupService.fetchMyGroups(user)
      setGroups(fetchedGroups)
    } catch (err) {
      console.error('Error loading groups:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetUsername = async () => {
    const trimmed = inputUsername.trim()
    if (!trimmed) return

    const normalizedUsername = trimmed.toLowerCase()

    // Check if username exists
    setIsCheckingUsername(true)
    try {
      const exists = await groupService.checkUsernameExists(normalizedUsername)
      if (!exists) {
        // Show confirmation for new username
        setShowNewUsernameConfirm(true)
        setIsCheckingUsername(false)
        return
      }
      // Username exists, proceed
      confirmUsername(normalizedUsername, trimmed)
    } catch (err) {
      // On error, just proceed
      confirmUsername(normalizedUsername, trimmed)
    }
    setIsCheckingUsername(false)
  }

  const confirmUsername = (normalizedUsername: string, displayUsername: string) => {
    localStorage.setItem('dd-username', normalizedUsername)
    setUsername(displayUsername)
    setShowUsernameInput(false)
    setShowNewUsernameConfirm(false)
    loadGroups(normalizedUsername)
  }

  const handleLogout = () => {
    localStorage.removeItem('dd-username')
    localStorage.removeItem('dd-group-id')
    localStorage.removeItem('dd-my-member-id')
    setUsername(null)
    setGroups([])
    setShowUsernameInput(true)
  }

  const handleSelectGroup = (group: Group) => {
    localStorage.setItem('dd-group-id', group.id)
    // Find my member ID in this group
    const myMember = group.members.find(m => m.isMe)
    if (myMember) {
      localStorage.setItem('dd-my-member-id', myMember.id)
    }
    navigate('/group')
  }

  // Username entry screen
  if (showUsernameInput) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome to Unplug
            </h1>
            <p className="text-slate-500">
              Enter a username to access your groups from any device
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="e.g., Hyuny123"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
              />
              <p className="text-xs text-slate-400 mt-1">
                Letters, numbers, and underscores only
              </p>
            </div>

            <button
              onClick={handleSetUsername}
              disabled={!inputUsername.trim() || isCheckingUsername}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
            >
              {isCheckingUsername ? 'Checking...' : 'Continue'}
            </button>
          </div>

          {/* New Username Confirmation Modal */}
          {showNewUsernameConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Create new account?
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  <strong>@{inputUsername.toLowerCase()}</strong> doesn't exist yet.
                  Do you want to create a new account with this username?
                </p>
                <p className="text-slate-400 text-xs mb-4">
                  If you already have an account, go back and enter your existing username.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => confirmUsername(inputUsername.toLowerCase(), inputUsername)}
                    className="w-full py-3 bg-primary text-white rounded-xl font-medium"
                  >
                    Yes, create @{inputUsername.toLowerCase()}
                  </button>
                  <button
                    onClick={() => setShowNewUsernameConfirm(false)}
                    className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl font-medium"
                  >
                    Go back, I have an account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500">Logged in as</p>
            <h1 className="text-2xl font-bold text-slate-900">@{username}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/onboarding')}
              className="p-2 text-slate-400 hover:text-primary"
              title="Take DTI Quiz"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600"
              title="Switch user"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            My Groups ({groups.length})
          </h2>

          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-4">No groups yet</p>
              <p className="text-sm text-slate-400">
                Create a new group or join one with an invite code
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group)}
                  className="w-full bg-white rounded-2xl p-4 border border-slate-200 hover:border-primary/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{group.name}</h3>
                      <p className="text-sm text-slate-500">
                        {group.members.length} members
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 4).map((member) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-sm"
                        >
                          {member.emoji}
                        </div>
                      ))}
                      {group.members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs text-slate-600">
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={() => navigate('/group/create')}
              className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Group
            </button>
            <button
              onClick={() => navigate('/group/join')}
              className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserPlus className="w-5 h-5" />
              Join Group
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
