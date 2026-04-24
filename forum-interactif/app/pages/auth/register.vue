<script setup lang="ts">
useHead({ title: 'Inscription — Forum Interactif' })

const { loggedIn, fetch: refreshSession } = useUserSession()
if (loggedIn.value) navigateTo('/')

const form = ref({ username: '', password: '', confirm: '' })
const error = ref('')
const loading = ref(false)

const submit = async () => {
  error.value = ''
  if (form.value.password !== form.value.confirm) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }
  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { username: form.value.username, password: form.value.password }
    })
    await refreshSession()
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors de l\'inscription'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" sm="8" md="5">
      <v-card class="pa-6" elevation="2">
        <v-card-title class="text-h5 font-weight-bold mb-4">Créer un compte</v-card-title>

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
            class="mb-3"
            :disabled="loading"
          />
          <v-text-field
            v-model="form.confirm"
            label="Confirmer le mot de passe"
            type="password"
            prepend-inner-icon="mdi-lock-check"
            variant="outlined"
            class="mb-4"
            :disabled="loading"
          />
          <v-btn type="submit" color="primary" block size="large" :loading="loading">
            S'inscrire
          </v-btn>
        </v-form>

        <div class="text-center mt-4 text-body-2">
          Déjà un compte ?
          <NuxtLink to="/auth/login" class="text-primary">Se connecter</NuxtLink>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>
