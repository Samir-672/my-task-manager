import { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import ForgotPassword from './components/ForgotPassword.jsx'
import ResetPassword from './components/ResetPassword.jsx'
import SignIn from './components/SignIn.jsx'
import {
  supabase,
  supabaseConfigMissing,
  supabaseKeyInvalid,
} from './services/supabaseClient.js'
import './App.css'

function App() {
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
  const recoveryParams = new URLSearchParams(
    `${window.location.search.slice(1)}&${window.location.hash.slice(1)}`,
  )
  const hasRecoveryError =
    recoveryParams.has('error') || recoveryParams.has('error_code')
  const [session, setSession] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(!supabaseConfigMissing)
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession)
        setIsCheckingSession(false)
        setSessionError('')
      }
    })

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (isMounted) {
          setSession(data.session)
          setSessionError(error?.message || '')
          setIsCheckingSession(false)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setSessionError(error.message || 'Could not restore the sign-in session.')
          setIsCheckingSession(false)
        }
      })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (supabaseConfigMissing || supabaseKeyInvalid) {
    return (
      <main className="auth-shell">
        <section className="auth-card" role="alert">
          <p className="eyebrow">
            {supabaseKeyInvalid ? 'INVALID PUBLIC KEY' : 'SETUP REQUIRED'}
          </p>
          <h1>My Task Manager</h1>
          <p className="auth-description">
            {supabaseKeyInvalid
              ? 'Use only a Supabase anon or publishable key in VITE_SUPABASE_ANON_KEY. Never use a service-role or secret key.'
              : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the local frontend environment, then restart Vite.'}
          </p>
        </section>
      </main>
    )
  }

  if (isCheckingSession) {
    return (
      <main className="auth-shell">
        <div className="loading-spinner" role="status" aria-label="Loading sign-in" />
      </main>
    )
  }

  if (currentPath === '/forgot-password') {
    return <ForgotPassword client={supabase} />
  }

  if (currentPath === '/reset-password') {
    return (
      <ResetPassword
        client={supabase}
        hasRecoverySession={Boolean(session) && !hasRecoveryError}
      />
    )
  }

  if (!session) {
    return (
      <>
        {sessionError ? (
          <p className="auth-session-error" role="alert">
            {sessionError}
          </p>
        ) : null}
        <SignIn client={supabase} />
      </>
    )
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setSessionError(error.message)
    }
  }

  return (
    <Dashboard
      key={session.user.id}
      accessToken={session.access_token}
      userEmail={session.user.email}
      onSignOut={handleSignOut}
      signOutError={sessionError}
    />
  )
}

export default App
