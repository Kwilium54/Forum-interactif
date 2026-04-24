<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const showChangePassword = ref(false)

const logout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  navigateTo('/')
}
</script>

<template>
  <v-app>
    <!-- Barre de navigation principale -->
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-title>
        <NuxtLink to="/" class="text-white text-decoration-none">
          Forum Interactif
        </NuxtLink>
      </v-app-bar-title>

      <template #append>
        <!-- Utilisateur connecté -->
        <template v-if="loggedIn">
          <v-btn variant="text" color="white" prepend-icon="mdi-account">
            {{ user?.username }}
            <v-chip v-if="user?.role === 'admin'" size="x-small" color="warning" class="ml-1">admin</v-chip>
          </v-btn>
          <v-btn v-if="user?.role === 'admin'" variant="text" color="white" to="/admin" icon="mdi-shield-crown" />
          <v-btn variant="text" color="white" icon="mdi-lock-reset" @click="showChangePassword = true" />
          <v-btn variant="outlined" color="white" @click="logout">Déconnexion</v-btn>
        </template>

        <!-- Utilisateur non connecté -->
        <template v-else>
          <v-btn variant="text" color="white" to="/auth/login">Connexion</v-btn>
          <v-btn variant="outlined" color="white" to="/auth/register">Inscription</v-btn>
        </template>
      </template>
    </v-app-bar>

    <!-- Contenu principal -->
    <v-main>
      <v-container class="py-6">
        <NuxtPage />
      </v-container>
    </v-main>

    <!-- Pied de page -->
    <v-footer color="grey-lighten-3" class="text-center">
      <div class="w-100 text-caption text-medium-emphasis">Forum Interactif — Nuxt.js + Vuetify 3</div>
    </v-footer>

    <!-- Dialog changement de mot de passe -->
    <ChangePasswordDialog v-model="showChangePassword" />
  </v-app>
</template>
