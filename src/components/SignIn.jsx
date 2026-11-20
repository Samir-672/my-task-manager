import { useState } from 'react'

function SignIn({ client }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(() =>
    new URLSearchParams(window.location.search).get('password-reset') === 'success'
      ? 'Your password was updated. Sign in with your new password.'
      : '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        const { data, error: authError } = await client.auth.signUp({
          email,
          password,
        })
        if (authError) {
          throw authError
        }
        if (!data.session) {
          setNotice('Check your email to confirm your new account.')
        }
      } else {
        const { error: authError } = await client.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) {
          throw authError
        }
      }
    } catch (requestError) {
      setError(requestError.message || 'Authentication could not be completed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleMode() {
    setIsSignUp((currentMode) => !currentMode)
    setError('')
    setNotice('')
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-heading">
        <p className="eyebrow">PERSONAL WORKSPACE</p>
        <h1 id="auth-heading">My Task Manager</h1>
        <p className="auth-description">
          {isSignUp
            ? 'Create an account to keep your tasks private.'
            : 'Sign in to see and manage your tasks.'}
        </p>

        {error ? (
          <div className="message message-error" role="alert">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="message message-success" role="status">
            {notice}
          </div>
        ) : null}

        <form className="task-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">
            Email
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label htmlFor="auth-password">
            Password
            <input
              id="auth-password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {!isSignUp ? (
            <a className="forgot-password-link" href="/forgot-password">
              Forgot password?
            </a>
          ) : null}
          <button
            className="button button-primary auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Please wait...'
              : isSignUp
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? 'Already have an account?' : 'New to the task manager?'}
          <button className="text-button" type="button" onClick={toggleMode}>
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </section>
    </main>
  )
}

export default SignIn
