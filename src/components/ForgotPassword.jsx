import { useState } from 'react'

function ForgotPassword({ client }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSubmitting(true)

    try {
      const { error: requestError } = await client.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: new URL('/reset-password', window.location.origin).toString(),
        },
      )

      if (requestError) {
        throw requestError
      }

      setNotice(
        'If an account exists for this email, a password reset link has been sent.',
      )
    } catch (requestError) {
      setError(requestError.message || 'The reset link could not be requested.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="forgot-password-heading">
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1 id="forgot-password-heading">Forgot password?</h1>
        <p className="auth-description">
          Enter your account email and we&apos;ll send a link to reset your password.
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
          <label htmlFor="recovery-email">
            Email
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button
            className="button button-primary auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-switch">
          <a className="auth-link" href="/">
            Back to Login
          </a>
        </p>
      </section>
    </main>
  )
}

export default ForgotPassword
