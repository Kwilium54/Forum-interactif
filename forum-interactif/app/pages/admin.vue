<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useHead({ title: 'Administration — Forum Interactif' })

//  Forums 
const { data, refresh } = await useFetch<{ forums: { id: number; name: string; topic_count: number }[] }>('/api/forums')
const forums = computed(() => data.value?.forums ?? [])

const newForumName = ref('')
const newForumError = ref('')
const newForumLoading = ref(false)

const createForum = async () => {
  newForumError.value = ''
  if (!newForumName.value.trim()) return
  newForumLoading.value = true
  try {
    await $fetch('/api/forums', { method: 'POST', body: { name: newForumName.value.trim() } })
    newForumName.value = ''
    await refresh()
  } catch (e: any) {
    newForumError.value = e?.data?.message || 'Erreur lors de la création'
  } finally {
    newForumLoading.value = false
  }
}

// Renommage
const renameDialog = ref(false)
const renameTarget = ref<{ id: number; name: string } | null>(null)
const renameName = ref('')
const renameError = ref('')
const renameLoading = ref(false)

const openRename = (forum: { id: number; name: string }) => {
  renameTarget.value = forum
  renameName.value = forum.name
  renameError.value = ''
  renameDialog.value = true
}

const submitRename = async () => {
  if (!renameTarget.value || !renameName.value.trim()) return
  renameError.value = ''
  renameLoading.value = true
  try {
    await $fetch(`/api/forums/${renameTarget.value.id}`, { method: 'PUT', body: { name: renameName.value.trim() } })
    renameDialog.value = false
    await refresh()
  } catch (e: any) {
    renameError.value = e?.data?.message || 'Erreur lors du renommage'
  } finally {
    renameLoading.value = false
  }
}

// Suppression
const deleteDialog = ref(false)
const deleteTarget = ref<{ id: number; name: string } | null>(null)
const deleteLoading = ref(false)

const openDelete = (forum: { id: number; name: string }) => {
  deleteTarget.value = forum
  deleteDialog.value = true
}

const submitDelete = async () => {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/forums/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteDialog.value = false
    await refresh()
  } catch (e: any) {
    // ignore
  } finally {
    deleteLoading.value = false
  }
}

//  Créer un compte admin 
const adminForm = ref({ username: '', password: '' })
const adminError = ref('')
const adminSuccess = ref('')
const adminLoading = ref(false)

const createAdmin = async () => {
  adminError.value = ''
  adminSuccess.value = ''
  if (!adminForm.value.username.trim() || !adminForm.value.password) return
  adminLoading.value = true
  try {
    await $fetch('/api/admin/create-admin', {
      method: 'POST',
      body: { username: adminForm.value.username.trim(), password: adminForm.value.password },
    })
    adminSuccess.value = `Compte administrateur "${adminForm.value.username}" créé.`
    adminForm.value = { username: '', password: '' }
  } catch (e: any) {
    adminError.value = e?.data?.message || 'Erreur lors de la création'
  } finally {
    adminLoading.value = false
  }
}
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" md="9">
      <h1 class="text-h4 font-weight-bold mb-6">Espace administrateur</h1>

      <!-- ── Gestion des forums ── -->
      <v-card class="mb-8" variant="outlined">
        <v-card-title class="pa-4">Gestion des forums</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <!-- Créer un forum -->
          <v-form @submit.prevent="createForum" class="d-flex gap-2 mb-4">
            <v-text-field
              v-model="newForumName"
              label="Nom du nouveau forum"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="newForumLoading"
              class="flex-grow-1"
            />
            <v-btn type="submit" color="primary" :loading="newForumLoading" prepend-icon="mdi-plus">
              Créer
            </v-btn>
          </v-form>
          <v-alert v-if="newForumError" type="error" variant="tonal" class="mb-4">{{ newForumError }}</v-alert>

          <!-- Liste des forums -->
          <v-list v-if="forums.length > 0" lines="one" variant="outlined" rounded="lg">
            <template v-for="(forum, index) in forums" :key="forum.id">
              <v-divider v-if="index > 0" />
              <v-list-item :title="forum.name" :subtitle="`${forum.topic_count} sujet(s)`">
                <template #prepend>
                  <v-icon color="primary">mdi-forum</v-icon>
                </template>
                <template #append>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="openRename(forum)" />
                  <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="openDelete(forum)" />
                </template>
              </v-list-item>
            </template>
          </v-list>
          <div v-else class="text-medium-emphasis text-body-2">Aucun forum créé.</div>
        </v-card-text>
      </v-card>

      <!-- ── Créer un compte admin ── -->
      <v-card variant="outlined">
        <v-card-title class="pa-4">Créer un compte administrateur</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-alert v-if="adminError" type="error" variant="tonal" class="mb-4">{{ adminError }}</v-alert>
          <v-alert v-if="adminSuccess" type="success" variant="tonal" class="mb-4">{{ adminSuccess }}</v-alert>
          <v-form @submit.prevent="createAdmin">
            <v-text-field
              v-model="adminForm.username"
              label="Nom d'utilisateur"
              variant="outlined"
              class="mb-3"
              :disabled="adminLoading"
            />
            <v-text-field
              v-model="adminForm.password"
              label="Mot de passe"
              type="password"
              variant="outlined"
              class="mb-3"
              :disabled="adminLoading"
            />
            <v-btn type="submit" color="primary" :loading="adminLoading" prepend-icon="mdi-account-plus">
              Créer l'administrateur
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Dialog renommage -->
  <v-dialog v-model="renameDialog" max-width="400" persistent>
    <v-card>
      <v-card-title class="pa-4">Renommer le forum</v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-alert v-if="renameError" type="error" variant="tonal" class="mb-3">{{ renameError }}</v-alert>
        <v-text-field v-model="renameName" label="Nouveau nom" variant="outlined" :disabled="renameLoading" />
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="renameDialog = false">Annuler</v-btn>
        <v-btn color="primary" :loading="renameLoading" @click="submitRename">Renommer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog suppression -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="pa-4">Supprimer le forum</v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        Supprimer <strong>{{ deleteTarget?.name }}</strong> ? Tous les sujets et messages seront supprimés.
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog = false">Annuler</v-btn>
        <v-btn color="error" :loading="deleteLoading" @click="submitDelete">Supprimer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
