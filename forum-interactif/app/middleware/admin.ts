// Middleware pour les pages réservées aux admins
// Usage dans une page : definePageMeta({ middleware: 'admin' })
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }
  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
