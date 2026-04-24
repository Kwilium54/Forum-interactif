<script setup lang="ts">
const model = defineModel<boolean>()

const form = ref({ currentPassword: '', newPassword: '', confirm: '' })
const error = ref('')
const success = ref(false)
const loading = ref(false)

const submit = async () => {
  error.value = ''
  success.value = false
  if (form.value.newPassword !== form.value.confirm) {
    error.value = 'Les nouveaux mots de passe ne correspondent pas'
    return
  }
  loading.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: form.value.currentPassword,
        newPassword: form.value.newPassword,
      }
    })
    success.value = true
    form.value = { currentPassword: '', newPassword: '', confirm: '' }
    setTimeout(() => { model.value = false; success.value = false }, 1500)
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors du changement de mot de passe'
  } finally {
    loading.value = false
  }
}

const close = () => {
  model.value = false
  form.value = { currentPassword: '', newPassword: '', confirm: '' }
  error.value = ''
  success.value = false
}
</script>

<template>
  <v-dialog v-model="model" max-width="440" persistent>
    <v-card>
      <v-card-title class="text-h6 pa-4">Changer le mot de passe</v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
        <v-alert v-if="success" type="success" variant="tonal" class="mb-4">Mot de passe modifié !</v-alert>

        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="form.currentPassword"
            label="Mot de passe actuel"
            type="password"
            variant="outlined"
            class="mb-3"
            :disabled="loading"
          />
          <v-text-field
            v-model="form.newPassword"
            label="Nouveau mot de passe"
            type="password"
            variant="outlined"
            class="mb-3"
            :disabled="loading"
          />
          <v-text-field
            v-model="form.confirm"
            label="Confirmer le nouveau mot de passe"
            type="password"
            variant="outlined"
            :disabled="loading"
          />
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Annuler</v-btn>
        <v-btn color="primary" :loading="loading" @click="submit">Confirmer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
