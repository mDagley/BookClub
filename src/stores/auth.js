import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth } from '../firebase.js'
import { signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)       // null = not logged in; object = logged in
  const loading = ref(true)    // true until Firebase Auth resolves on cold start

  // Populate user from Firebase Auth on startup
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      user.value = {
        uid: firebaseUser.uid,
        discordUsername: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        // custom claims are in the ID token; we'll use what firebase gives us
      }
    } else {
      user.value = null
    }
    loading.value = false
  })

  function loginWithDiscord() {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID
    const redirectUri = import.meta.env.VITE_DISCORD_REDIRECT_URI || `${window.location.origin}/admin`
    const scope = 'identify guilds'
    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`
    window.location.href = url
  }

  async function handleCallback(code) {
    loading.value = true
    try {
      const redirectUri = import.meta.env.VITE_DISCORD_REDIRECT_URI || `${window.location.origin}/admin`
      const functions = getFunctions()
      const discordAuth = httpsCallable(functions, 'discordAuth')
      const result = await discordAuth({ code, redirectUri })
      await signInWithCustomToken(auth, result.data.token)
      // onAuthStateChanged will fire and set user.value
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await signOut(auth)
    user.value = null
  }

  return { user, loading, loginWithDiscord, handleCallback, logout }
})
