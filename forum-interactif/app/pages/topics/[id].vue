<script setup lang="ts">
const route = useRoute()
const topicId = route.params.id as string
const { loggedIn, user } = useUserSession()

//  Types 
interface Topic {
  id: number; title: string; locked: number
  forum_id: number; forum_name: string; author: string; created_at: string
}
interface Message {
  id: number; content: string; created_at: string; updated_at: string
  user_id: number; username: string
}
interface Pagination { page: number; totalPages: number; total: number }

//  Données 
const page = ref(Number(route.query.page) || 1)

const [topicRes, messagesRes] = await Promise.all([
  useFetch<{ topic: Topic }>(`/api/topics/${topicId}`),
  useFetch<{ messages: Message[]; pagination: Pagination }>(
    () => `/api/topics/${topicId}/messages?page=${page.value}`
  ),
])

const topic = computed(() => topicRes.data.value?.topic)
const messages = computed(() => messagesRes.data.value?.messages ?? [])
const pagination = computed(() => messagesRes.data.value?.pagination)

useHead(() => ({ title: `${topic.value?.title ?? 'Sujet'} — Forum Interactif` }))

watch(page, async (newPage) => {
  await navigateTo({ query: { page: newPage } }, { replace: true })
  await messagesRes.refresh()
})

//  WebSocket temps réel 
onMounted(() => {
  const isSecure = location.protocol === 'https:'
  const url = (isSecure ? 'wss://' : 'ws://') + location.host + '/_ws'
  const ws = new WebSocket(url)

  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'new-message' && String(data.topicId) === topicId) {
        messagesRes.refresh()
      }
    } catch {}
  })

  onUnmounted(() => ws.close())
})

const refreshMessages = () => messagesRes.refresh()

//  Répondre 
const replyContent = ref('')
const replyError = ref('')
const replyLoading = ref(false)

const submitReply = async () => {
  replyError.value = ''
  if (!replyContent.value.trim()) return
  replyLoading.value = true
  try {
    await $fetch(`/api/topics/${topicId}/messages`, {
      method: 'POST',
      body: { content: replyContent.value.trim() },
    })
    replyContent.value = ''
    // Aller à la dernière page après réponse
    if (pagination.value) {
      const newTotal = pagination.value.total + 1
      const lastPage = Math.ceil(newTotal / pagination.value.limit)
      page.value = lastPage
    }
    await refreshMessages()
  } catch (e: any) {
    replyError.value = e?.data?.message || 'Erreur lors de l\'envoi'
  } finally {
    replyLoading.value = false
  }
}

//  Modifier message 
const editDialog = ref(false)
const editTarget = ref<Message | null>(null)
const editContent = ref('')
const editError = ref('')
const editLoading = ref(false)

const openEdit = (msg: Message) => {
  editTarget.value = msg
  editContent.value = msg.content
  editError.value = ''
  editDialog.value = true
}

const submitEdit = async () => {
  if (!editTarget.value) return
  editError.value = ''
  editLoading.value = true
  try {
    await $fetch(`/api/messages/${editTarget.value.id}`, {
      method: 'PUT',
      body: { content: editContent.value.trim() },
    })
    editDialog.value = false
    await refreshMessages()
  } catch (e: any) {
    editError.value = e?.data?.message || 'Erreur lors de la modification'
  } finally {
    editLoading.value = false
  }
}

//  Supprimer message 
const deleteMessageDialog = ref(false)
const deleteMessageTarget = ref<Message | null>(null)
const deleteMessageLoading = ref(false)

const openDeleteMessage = (msg: Message) => {
  deleteMessageTarget.value = msg
  deleteMessageDialog.value = true
}

const submitDeleteMessage = async () => {
  if (!deleteMessageTarget.value) return
  deleteMessageLoading.value = true
  try {
    await $fetch(`/api/messages/${deleteMessageTarget.value.id}`, { method: 'DELETE' })
    deleteMessageDialog.value = false
    await refreshMessages()
  } catch {
    // ignore
  } finally {
    deleteMessageLoading.value = false
  }
}

//  Supprimer sujet 
const deleteTopicDialog = ref(false)
const deleteTopicLoading = ref(false)

const submitDeleteTopic = async () => {
  deleteTopicLoading.value = true
  try {
    await $fetch(`/api/topics/${topicId}`, { method: 'DELETE' })
    await navigateTo(`/forums/${topic.value?.forum_id}`)
  } catch {
    // ignore
  } finally {
    deleteTopicLoading.value = false
  }
}

//  Helpers 
const canEdit = (msg: Message) =>
  loggedIn.value && (msg.user_id === user.value?.id || user.value?.role === 'admin')

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" md="9">
      <!-- Fil d'ariane -->
      <v-breadcrumbs
        :items="[
          { title: 'Accueil', to: '/' },
          { title: topic?.forum_name ?? '...', to: `/forums/${topic?.forum_id}` },
          { title: topic?.title ?? '...' },
        ]"
        class="pa-0 mb-4"
      />

      <!-- Titre + actions admin -->
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-2">
        <div class="d-flex align-center gap-2">
          <h1 class="text-h5 font-weight-bold">{{ topic?.title }}</h1>
          <v-chip v-if="topic?.locked" color="warning" size="small" prepend-icon="mdi-lock">Verrouillé</v-chip>
        </div>
        <v-btn
          v-if="user?.role === 'admin'"
          color="error"
          variant="outlined"
          size="small"
          prepend-icon="mdi-delete"
          @click="deleteTopicDialog = true"
        >
          Supprimer le sujet
        </v-btn>
      </div>

      <!-- Messages -->
      <div class="d-flex flex-column gap-3 mb-4">
        <v-card
          v-for="msg in messages"
          :key="msg.id"
          variant="outlined"
        >
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-start mb-2">
              <div>
                <span class="font-weight-bold">{{ msg.username }}</span>
                <span class="text-medium-emphasis text-body-2 ml-2">{{ formatDate(msg.created_at) }}</span>
                <span v-if="msg.updated_at !== msg.created_at" class="text-caption text-medium-emphasis ml-1">(modifié)</span>
              </div>
              <div v-if="canEdit(msg)" class="d-flex gap-1">
                <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(msg)" />
                <v-btn
                  v-if="user?.role === 'admin'"
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="openDeleteMessage(msg)"
                />
              </div>
            </div>
            <div class="text-body-1" style="white-space: pre-wrap">{{ msg.content }}</div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Pagination -->
      <v-pagination
        v-if="pagination && pagination.totalPages > 1"
        v-model="page"
        :length="pagination.totalPages"
        rounded="circle"
        class="mb-6"
      />

      <!-- Zone de réponse -->
      <v-card v-if="loggedIn && !topic?.locked" variant="outlined" class="mt-4">
        <v-card-title class="pa-4">Répondre</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-alert v-if="replyError" type="error" variant="tonal" class="mb-3">{{ replyError }}</v-alert>
          <v-textarea
            v-model="replyContent"
            label="Votre réponse"
            variant="outlined"
            rows="4"
            :disabled="replyLoading"
          />
          <v-btn
            color="primary"
            :loading="replyLoading"
            :disabled="!replyContent.trim()"
            prepend-icon="mdi-send"
            @click="submitReply"
          >
            Envoyer
          </v-btn>
        </v-card-text>
      </v-card>

      <v-alert v-else-if="!loggedIn" type="info" variant="tonal" class="mt-4">
        <NuxtLink to="/auth/login">Connectez-vous</NuxtLink> pour répondre.
      </v-alert>

      <v-alert v-else-if="topic?.locked" type="warning" variant="tonal" class="mt-4">
        Ce sujet est verrouillé, aucune nouvelle réponse n'est possible.
      </v-alert>
    </v-col>
  </v-row>

  <!-- Dialog modifier message -->
  <v-dialog v-model="editDialog" max-width="560" persistent>
    <v-card>
      <v-card-title class="pa-4">Modifier le message</v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-alert v-if="editError" type="error" variant="tonal" class="mb-3">{{ editError }}</v-alert>
        <v-textarea v-model="editContent" label="Message" variant="outlined" rows="5" :disabled="editLoading" />
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="editDialog = false">Annuler</v-btn>
        <v-btn color="primary" :loading="editLoading" @click="submitEdit">Enregistrer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog supprimer message -->
  <v-dialog v-model="deleteMessageDialog" max-width="400">
    <v-card>
      <v-card-title class="pa-4">Supprimer le message</v-card-title>
      <v-divider />
      <v-card-text class="pa-4">Cette action est irréversible.</v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="deleteMessageDialog = false">Annuler</v-btn>
        <v-btn color="error" :loading="deleteMessageLoading" @click="submitDeleteMessage">Supprimer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog supprimer sujet -->
  <v-dialog v-model="deleteTopicDialog" max-width="400">
    <v-card>
      <v-card-title class="pa-4">Supprimer le sujet</v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        Supprimer <strong>{{ topic?.title }}</strong> et tous ses messages ? Action irréversible.
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="deleteTopicDialog = false">Annuler</v-btn>
        <v-btn color="error" :loading="deleteTopicLoading" @click="submitDeleteTopic">Supprimer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
