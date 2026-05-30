import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../pages/DashboardPage.vue') },
  { path: '/book', component: () => import('../pages/BookPage.vue') },
  { path: '/suggestions', component: () => import('../pages/SuggestionsPage.vue') },
  { path: '/past-books', component: () => import('../pages/PastBooksPage.vue') },
  {
    path: '/admin',
    component: () => import('../pages/AdminPage.vue'),
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Phase 3: auth store must expose a `loading` flag; guard must await auth
// resolution before checking user, or hard-reload to /admin will redirect
// authenticated users (Firebase Auth is async on cold start).
router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth) {
    const { useAuthStore } = await import('../stores/auth.js')
    const authStore = useAuthStore()
    if (!authStore.user) {
      next('/')
      return
    }
  }
  next()
})

export default router
