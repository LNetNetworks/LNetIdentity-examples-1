import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { useExpiryWatcher, useSession } from './auth/useSession'
import { CredentialDetail } from './routes/CredentialDetail'
import { Credentials } from './routes/Credentials'
import { Login } from './routes/Login'
import { Profile } from './routes/Profile'
import { RequestCredential } from './routes/RequestCredential'
import { Scan } from './routes/Scan'
import { Share } from './routes/Share'

export function App() {
  return (
    <BrowserRouter>
      <SessionGuard />
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<GuestOnly />}>
          <Route index element={<Login />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/" element={<Credentials />} />
          <Route path="/credential/:id" element={<CredentialDetail />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/share" element={<Share />} />
          <Route path="/request" element={<RequestCredential />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

/** Cierra la sesión cuando el token vence, esté donde esté el usuario. */
function SessionGuard() {
  useExpiryWatcher()
  return null
}

function RequireAuth() {
  const session = useSession()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

function GuestOnly() {
  const session = useSession()
  return session ? <Navigate to="/" replace /> : <Outlet />
}

/** Cada navegación arranca desde arriba, como en una app nativa. */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
