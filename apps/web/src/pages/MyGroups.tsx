import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, UserPlus, Loader2, LogOut } from 'lucide-react'
import { groupService } from '../services/groupService'
import type { Group } from '../types'

export default function MyGroups() {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUsernameInput, setShowUsernameInput] = useState(false)
  const [inputUsername, setInputUsername] = useState('')

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

  const handleSetUsername = () => {
    const trimmed = inputUsername.trim().toLowerCase()
    if (!trimmed) return

    localStorage.setItem('dd-username', trimmed)
    setUsername(trimmed)
    setShowUsernameInput(false)
    loadGroups(trimmed)
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
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-primary/10 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Unplug
            </h1>
            <p className="text-gray-500">
              Enter a username to access your groups from any device
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g., hyuny123"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
              />
              <p className="text-xs text-gray-400 mt-1">
                Letters, numbers, and underscores only
              </p>
            </div>

            <button
              onClick={handleSetUsername}
              disabled={!inputUsername.trim()}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-gray-500">Logged in as</p>
            <h1 className="text-2xl font-bold text-gray-900">@{username}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Switch user"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Groups List */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            My Groups ({groups.length})
          </h2>

          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No groups yet</p>
              <p className="text-sm text-gray-400">
                Create a new group or join one with an invite code
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group)}
                  className="w-full bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/30 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500">
                        {group.members.length} members
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 4).map((member) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-sm"
                        >
                          {member.emoji}
                        </div>
                      ))}
                      {group.members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
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
              className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
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
