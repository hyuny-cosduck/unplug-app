import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useOnboarding } from './stores/useStore'
import BottomNav from './components/BottomNav'
import { ToastContainer } from './components/Toast'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import UsageLog from './pages/UsageLog'
import Journal from './pages/Journal'
import Challenges from './pages/Challenges'
import Garden from './pages/Garden'
import MyGroups from './pages/MyGroups'
import GroupCreate from './pages/GroupCreate'
import GroupJoin from './pages/GroupJoin'
import GroupDashboard from './pages/GroupDashboard'
import GroupChallenge from './pages/GroupChallenge'

function AppRoutes() {
  const { onboarded } = useOnboarding()

  // Main flow: Landing -> Onboarding -> MyGroups -> GroupDashboard
  const getDefaultRoute = () => {
    if (!onboarded) return <Landing />
    return <Navigate to="/my-groups" />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={getDefaultRoute()} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Group-based routes (main flow) */}
        <Route path="/my-groups" element={<MyGroups />} />
        <Route path="/group/create" element={<GroupCreate />} />
        <Route path="/group/join" element={<GroupJoin />} />
        <Route path="/group" element={<GroupDashboard />} />
        <Route path="/group/challenge" element={<GroupChallenge />} />

        {/* Individual tools (secondary) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/log" element={<UsageLog />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/garden" element={<Garden />} />
      </Routes>
      {onboarded && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <AppRoutes />
    </BrowserRouter>
  )
}
