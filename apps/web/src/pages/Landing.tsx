import { useNavigate } from 'react-router-dom'
import { Users, Trophy, Bell, Target, Unplug as UnplugIcon } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero */}
      <section className="px-6 pt-20 pb-12 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <UnplugIcon className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          Unplug
        </h1>
        <p className="text-xl text-gray-700 mb-2 font-medium">
          Not alone. <span className="text-primary">Together.</span>
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Beat screen addiction with friends, not willpower
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="px-8 py-4 bg-primary text-white rounded-2xl text-lg font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
        >
          Start with Friends
        </button>
      </section>

      {/* Why it works */}
      <section className="px-6 py-8 max-w-lg mx-auto">
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 mb-8">
          <h3 className="font-bold text-gray-900 mb-2">
            Why solo apps don't work
          </h3>
          <p className="text-sm text-gray-600">
            Screen time limits? You disable them. Willpower? Dopamine wins.
            <strong className="text-gray-900"> Social accountability is the answer.</strong>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-lg mx-auto space-y-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          How it works
        </h2>
        <FeatureCard
          icon={<Users className="w-6 h-6 text-primary" />}
          title="Group Challenge"
          description="Create a group with 2+ friends. Set a shared goal like 'Max 2 hours SNS per day'."
        />
        <FeatureCard
          icon={<Trophy className="w-6 h-6 text-yellow-500" />}
          title="Leaderboard"
          description="Everyone's usage is visible. Top of the board? Bragging rights. Bottom? Social pressure."
        />
        <FeatureCard
          icon={<Bell className="w-6 h-6 text-accent" />}
          title="Friend Nudges"
          description="'Hey, you've been on Instagram for 40 minutes!' — Real-time alerts from friends."
        />
        <FeatureCard
          icon={<Target className="w-6 h-6 text-red-500" />}
          title="Stakes"
          description="Set real penalties (buy coffee) and rewards (group dinner). Skin in the game."
        />
      </section>

      {/* Social Proof */}
      <section className="px-6 pb-16 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-3xl font-bold text-primary">3x</p>
            <p className="text-xs text-gray-500">longer habit retention<br/>with groups</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-3xl font-bold text-accent">70%</p>
            <p className="text-xs text-gray-500">challenge completion<br/>rate in groups</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-2 bg-gray-50 rounded-xl shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}
