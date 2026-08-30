import { useState } from 'react'
import { isFirebaseConfigured, auth } from '../firebase'

export default function AdminLoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

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
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <div className="admin-login-error">{error}</div>}
        <button type="submit" className="submit" disabled={checking}>
          {checking ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
