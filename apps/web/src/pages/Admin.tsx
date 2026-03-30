import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Users, UsersRound, Brain, ArrowLeft, Loader2, X } from 'lucide-react'
import { getSupabase } from '../lib/supabase'

const ADMIN_PASSWORD = 'unplug2024'  // Simple password for MVP

interface Member {
  id: string
  name: string
  emoji: string
  username: string | null
  dti_type: string | null
  joined_at: string
  group_name?: string
}

interface Group {
  id: string
  name: string
  code: string
  created_at: string
  member_count: number
}

interface Stats {
  totalUsers: number
  totalGroups: number
  totalWithDti: number
  dtiBreakdown: Record<string, number>
}

export default function Admin() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Detail views
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showGroupsModal, setShowGroupsModal] = useState(false)
  const [showDtiModal, setShowDtiModal] = useState(false)
  const [users, setUsers] = useState<Member[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [dtiUsers, setDtiUsers] = useState<Member[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setError('')
      fetchStats()
    } else {
      setError('Incorrect password')
    }
  }

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabase()

      // Get total users (members)
      const { count: totalUsers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })

      // Get total groups
      const { count: totalGroups } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })

      // Get users with DTI type
      const { data: dtiData } = await supabase
        .from('members')
        .select('dti_type')
        .not('dti_type', 'is', null)

      const totalWithDti = dtiData?.length || 0

      // Count by DTI type
      const dtiBreakdown: Record<string, number> = {}
      dtiData?.forEach((member) => {
        if (member.dti_type) {
          dtiBreakdown[member.dti_type] = (dtiBreakdown[member.dti_type] || 0) + 1
        }
      })

      setStats({
        totalUsers: totalUsers || 0,
        totalGroups: totalGroups || 0,
        totalWithDti,
        dtiBreakdown,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingDetail(true)
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('members')
        .select('*, groups(name)')
        .order('joined_at', { ascending: false })

      setUsers(
        (data || []).map((m: any) => ({
          ...m,
          group_name: m.groups?.name,
        }))
      )
      setShowUsersModal(true)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const fetchGroups = async () => {
    setLoadingDetail(true)
    try {
      const supabase = getSupabase()
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (g: any) => {
          const { count } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', g.id)
          return { ...g, member_count: count || 0 }
        })
      )

      setGroups(groupsWithCounts)
      setShowGroupsModal(true)
    } catch (err) {
      console.error('Error fetching groups:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const fetchDtiUsers = async () => {
    setLoadingDetail(true)
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('members')
        .select('*, groups(name)')
        .not('dti_type', 'is', null)
        .order('joined_at', { ascending: false })

      setDtiUsers(
        (data || []).map((m: any) => ({
          ...m,
          group_name: m.groups?.name,
        }))
      )
      setShowDtiModal(true)
    } catch (err) {
      console.error('Error fetching DTI users:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // DTI type labels
  const dtiLabels: Record<string, string> = {
    'mindful-minimalist': 'Mindful Minimalist',
    'social-connector': 'Social Connector',
    'productivity-seeker': 'Productivity Seeker',
    'doom-scroller': 'Doom Scroller',
    'fomo-fighter': 'FOMO Fighter',
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-slate-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
            <p className="text-slate-500 text-sm mt-1">Enter password to view stats</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/my-groups')}
              className="w-full py-2 text-slate-500 text-sm"
            >
              Back to App
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/my-groups')}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {isLoading && !stats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview Stats - Clickable */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={fetchUsers}
                disabled={loadingDetail}
                className="bg-white rounded-2xl p-6 border border-slate-200 text-center hover:border-primary hover:shadow-md transition-all"
              >
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-xs text-primary mt-1">Click to view</p>
              </button>
              <button
                onClick={fetchGroups}
                disabled={loadingDetail}
                className="bg-white rounded-2xl p-6 border border-slate-200 text-center hover:border-accent hover:shadow-md transition-all"
              >
                <UsersRound className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-900">{stats.totalGroups}</p>
                <p className="text-sm text-slate-500">Total Groups</p>
                <p className="text-xs text-accent mt-1">Click to view</p>
              </button>
              <button
                onClick={fetchDtiUsers}
                disabled={loadingDetail}
                className="bg-white rounded-2xl p-6 border border-slate-200 text-center hover:border-purple-500 hover:shadow-md transition-all"
              >
                <Brain className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-slate-900">{stats.totalWithDti}</p>
                <p className="text-sm text-slate-500">Took DTI Test</p>
                <p className="text-xs text-purple-500 mt-1">Click to view</p>
              </button>
            </div>

            {/* DTI Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h2 className="font-semibold text-slate-900 mb-4">DTI Type Breakdown</h2>
              {Object.keys(stats.dtiBreakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.dtiBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-slate-700">
                          {dtiLabels[type] || type}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(count / stats.totalWithDti) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-900 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No DTI data yet</p>
              )}
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h2 className="font-semibold text-slate-900 mb-2">DTI Completion Rate</h2>
              <p className="text-3xl font-bold text-primary">
                {stats.totalUsers > 0
                  ? Math.round((stats.totalWithDti / stats.totalUsers) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-slate-500">
                {stats.totalWithDti} of {stats.totalUsers} users completed DTI
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">All Users ({users.length})</h3>
              <button onClick={() => setShowUsersModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {users.map((user) => (
                <div key={user.id} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{user.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">
                        @{user.username || 'no username'} · {user.group_name || 'no group'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(user.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Groups Modal */}
      {showGroupsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">All Groups ({groups.length})</h3>
              <button onClick={() => setShowGroupsModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {groups.map((group) => (
                <div key={group.id} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-500">
                        Code: <span className="font-mono">{group.code}</span> · {group.member_count} members
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(group.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DTI Users Modal */}
      {showDtiModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">DTI Test Takers ({dtiUsers.length})</h3>
              <button onClick={() => setShowDtiModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {dtiUsers.map((user) => (
                <div key={user.id} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{user.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">
                        @{user.username || 'no username'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-purple-600">
                        {dtiLabels[user.dti_type || ''] || user.dti_type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loadingDetail && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}
