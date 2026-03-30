import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from './components/Toast'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import ResultShare from './pages/ResultShare'
import MyGroups from './pages/MyGroups'
import GroupCreate from './pages/GroupCreate'
import GroupJoin from './pages/GroupJoin'
import GroupDashboard from './pages/GroupDashboard'
import Admin from './pages/Admin'

function AppRoutes() {
  // Default to Onboarding for viral sharing
  const getDefaultRoute = () => {
    return <Navigate to="/onboarding" />
  }

  return (
    <Routes>
      <Route path="/" element={getDefaultRoute()} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/result/:type" element={<ResultShare />} />

      {/* Main flow */}
      <Route path="/my-groups" element={<MyGroups />} />
      <Route path="/group/create" element={<GroupCreate />} />
      <Route path="/group/join" element={<GroupJoin />} />
      <Route path="/group" element={<GroupDashboard />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
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
