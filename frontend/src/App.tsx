import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PostGenieAI from './components/PostGenieAI'
import Auth from './components/Auth'
import SettingsLayout from './components/Settings/SettingsLayout'
import Integrations from './components/Settings/Integrations'
import VoiceTrainer from './components/Settings/VoiceTrainer'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleAuthSuccess = (_token: string, _user: any) => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PostGenieAI onLogout={handleLogout} />} />
        <Route path="/settings" element={<SettingsLayout onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/settings/integrations" replace />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="train" element={<VoiceTrainer />} />
          <Route path="account" element={<div className="p-4 text-gray-500">Account settings coming soon...</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
