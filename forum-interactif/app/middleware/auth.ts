// Middleware utilisé sur les pages nécessitant une connexion
// Usage dans une page : definePageMeta({ middleware: 'auth' })
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }
})
