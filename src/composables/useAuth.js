import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth.js'

export function useAuth() {
  const store = useAuthStore()
  const { user, loading } = storeToRefs(store)
  return {
    user,
    loading,
    loginWithDiscord: store.loginWithDiscord,
    handleCallback: store.handleCallback,
    logout: store.logout,
  }
}
