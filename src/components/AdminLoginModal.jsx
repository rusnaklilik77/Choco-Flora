import { useState } from 'react'
import { isFirebaseConfigured, auth } from '../firebase'

export default function AdminLoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isFirebaseConfigured) {
      setError('Firebase не настроен: вход в админку недоступен, пока не заданы ключи Firebase (см. .env).')
      return
    }

    setChecking(true)
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      await signInWithEmailAndPassword(auth, email.trim(), password)
      // Успешный вход возможен только для пользователя, заранее добавленного
      // в Firebase Console -> Authentication -> Users. Самостоятельная
      // регистрация в приложении не предусмотрена.
      onSuccess()
    } catch (err) {
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-email'
      ) {
        setError('Неверный e-mail или пароль')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Слишком много попыток. Попробуйте позже.')
      } else {
        setError('Не удалось выполнить вход. Попробуйте ещё раз.')
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="admin-login-overlay" onClick={onClose}>
      <form className="admin-login-card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>Админ-панель</h3>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          autoComplete="username"
        />
        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18" />
                <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                <path d="M9.88 4.63A10.9 10.9 0 0 1 12 4.5c5 0 9 4.5 10.5 7.5a12.7 12.7 0 0 1-2.6 3.4M6.6 6.6C4.4 8.1 2.7 10.2 1.5 12c1.5 3 5.5 7.5 10.5 7.5 1.6 0 3.1-.4 4.4-1.1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {error && <div className="admin-login-error">{error}</div>}
        <button type="submit" className="submit" disabled={checking}>
          {checking ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
