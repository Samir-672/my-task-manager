import { useState } from 'react'

const minimumPasswordLength = 8

function ResetPassword({ client, hasRecoverySession }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!hasRecoverySession) {
    return (
      <main className="auth-shell">
        <section className="auth-card" aria-labelledby="expired-link-heading">
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1 id="expired-link-heading">Reset link expired</h1>
          <p className="auth-description">
            This password reset link is invalid or has expired. Request a new link
            to continue.
          </p>
          <a className="button button-primary auth-link-button" href="/forgot-password">
            Request a new reset link
          </a>
          <p className="auth-switch">
            <a className="auth-link" href="/">
              Back to Login
            </a>
          </p>
        </section>
      </main>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < minimumPasswordLength) {
      setError(`Password must be at least ${minimumPasswordLength} characters.`)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await client.auth.updateUser({ password })
      if (updateError) {
        throw updateError
      }

      const { error: signOutError } = await client.auth.signOut({ scope: 'local' })
      if (signOutError) {
        throw signOutError
      }

      window.location.replace('/?password-reset=success')
    } catch (requestError) {
      setError(requestError.message || 'The password could not be updated.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="reset-password-heading">
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1 id="reset-password-heading">Choose a new password</h1>
        <p className="auth-description">
          Use at least {minimumPasswordLength} characters for your new password.
        </p>

        {error ? (
          <div className="message message-error" role="alert">
            {error}
          </div>
        ) : null}

        <form className="task-form" onSubmit={handleSubmit}>
          <label htmlFor="new-password">
            New Password
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={minimumPasswordLength}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <label htmlFor="confirm-password">
            Confirm Password
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={minimumPasswordLength}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          <button
            className="button button-primary auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default ResetPassword
