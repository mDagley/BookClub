import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../pages/DashboardPage.vue') },
  { path: '/book', component: () => import('../pages/BookPage.vue') },
  { path: '/suggestions', component: () => import('../pages/SuggestionsPage.vue') },
  { path: '/past-books', component: () => import('../pages/PastBooksPage.vue') },
  { path: '/past-books/:id', component: () => import('../pages/PastBookDetailPage.vue') },
  { path: '/changelog', component: () => import('../pages/ChangelogPage.vue') },
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

router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth) {
    const { useAuthStore } = await import('../stores/auth.js')
    const authStore = useAuthStore()
    // Wait for Firebase Auth to resolve (handles hard refresh to /admin).
    // Re-check after subscribe in case loading flipped before subscribe registered.
    if (authStore.loading) {
      await new Promise(resolve => {
        const unwatch = authStore.$subscribe(() => {
          if (!authStore.loading) { unwatch(); resolve() }
        })
        if (!authStore.loading) { unwatch(); resolve() }
      })
    }
    // Allow the OAuth callback through so AdminPage can exchange the code.
    // Without this, the guard redirects to / and the ?code= param is lost.
    if (!authStore.user && !to.query.code) {
      next('/')
      return
    }
  }
  next()
})

export default router
