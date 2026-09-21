import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { AuthProvider } from '../context/AuthContext'
import { CalendarPage } from '../pages/CalendarPage'
import { GroupPage } from '../pages/GroupPage'
import { ImportPage } from '../pages/ImportPage'
import { LandingPage } from '../pages/LandingPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ShortlistPage } from '../pages/ShortlistPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="shortlist" element={<ShortlistPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="group" element={<GroupPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

