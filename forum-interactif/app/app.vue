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
        <!-- Boutons à remplir aux étapes suivantes -->
        <v-btn variant="text" color="white" to="/auth/login">Connexion</v-btn>
        <v-btn variant="outlined" color="white" to="/auth/register">Inscription</v-btn>
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
  </v-app>
</template>
