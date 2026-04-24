<script setup lang="ts">
useHead({ title: 'Connexion — Forum Interactif' })

const { loggedIn, fetch: refreshSession } = useUserSession()
if (loggedIn.value) navigateTo('/')

const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: form.value })
    await refreshSession()
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" sm="8" md="5">
      <v-card class="pa-6" elevation="2">
        <v-card-title class="text-h5 font-weight-bold mb-4">Connexion</v-card-title>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="form.username"
            label="Nom d'utilisateur"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            class="mb-3"
            :disabled="loading"
          />
          <v-text-field
            v-model="form.password"
            label="Mot de passe"
            type="password"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            class="mb-4"
            :disabled="loading"
          />
          <v-btn type="submit" color="primary" block size="large" :loading="loading">
            Se connecter
          </v-btn>
        </v-form>

        <div class="text-center mt-4 text-body-2">
          Pas encore de compte ?
          <NuxtLink to="/auth/register" class="text-primary">S'inscrire</NuxtLink>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>
