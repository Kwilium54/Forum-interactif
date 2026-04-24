<script setup lang="ts">
const route = useRoute()
const forumId = route.params.id as string
const { loggedIn } = useUserSession()

//  Types 
interface Topic {
  id: number
  title: string
  author: string
  created_at: string
  last_message_at: string
  last_message_author: string | null
  last_message_date: string | null
  message_count: number
  locked: number
}
interface Forum { id: number; name: string }
interface Pagination { page: number; totalPages: number; total: number }
interface ApiResponse { forum: Forum; topics: Topic[]; pagination: Pagination }

//  Données 
const page = ref(Number(route.query.page) || 1)

const { data, refresh } = await useFetch<ApiResponse>(
  () => `/api/forums/${forumId}/topics?page=${page.value}`
)

const forum = computed(() => data.value?.forum)
const topics = computed(() => data.value?.topics ?? [])

//  WebSocket temps réel 
onMounted(() => {
  const isSecure = location.protocol === 'https:'
  const url = (isSecure ? 'wss://' : 'ws://') + location.host + '/_ws'
  const ws = new WebSocket(url)

  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'new-topic' && String(data.forumId) === forumId) {
        refresh()
      }
    } catch {}
  })

  onUnmounted(() => ws.close())
})
const pagination = computed(() => data.value?.pagination)

useHead(() => ({ title: `${forum.value?.name ?? 'Forum'} — Forum Interactif` }))

watch(page, async (newPage) => {
  await navigateTo({ query: { page: newPage } }, { replace: true })
  await refresh()
})

//  Nouveau sujet 
const newTopicDialog = ref(false)
const newTopicForm = ref({ title: '', message: '' })
const newTopicError = ref('')
const newTopicLoading = ref(false)

const openNewTopic = () => {
  newTopicForm.value = { title: '', message: '' }
  newTopicError.value = ''
  newTopicDialog.value = true
}

const submitNewTopic = async () => {
  newTopicError.value = ''
  if (!newTopicForm.value.title.trim() || !newTopicForm.value.message.trim()) {
    newTopicError.value = 'Le titre et le message sont requis'
    return
  }
  newTopicLoading.value = true
  try {
    const result = await $fetch<{ id: number }>(`/api/forums/${forumId}/topics`, {
      method: 'POST',
      body: newTopicForm.value,
    })
    newTopicDialog.value = false
    await navigateTo(`/topics/${result.id}`)
  } catch (e: any) {
    newTopicError.value = e?.data?.message || 'Erreur lors de la création du sujet'
  } finally {
    newTopicLoading.value = false
  }
}

//  Formatage date 
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" md="9">
      <!-- Fil d'ariane -->
      <v-breadcrumbs :items="[{ title: 'Accueil', to: '/' }, { title: forum?.name ?? '...' }]" class="pa-0 mb-4" />

      <div class="d-flex align-center justify-space-between mb-4">
        <h1 class="text-h4 font-weight-bold">{{ forum?.name }}</h1>
        <v-btn v-if="loggedIn" color="primary" prepend-icon="mdi-plus" @click="openNewTopic">
          Nouveau sujet
        </v-btn>
      </div>

      <!-- Message si non connecté -->
      <v-alert v-if="!loggedIn" type="info" variant="tonal" class="mb-4">
        <NuxtLink to="/auth/login">Connectez-vous</NuxtLink> ou
        <NuxtLink to="/auth/register">créez un compte</NuxtLink> pour créer un sujet.
      </v-alert>

      <!-- Liste vide -->
      <v-card v-if="topics.length === 0" class="pa-6 text-center text-medium-emphasis" variant="outlined">
        <v-icon size="48" class="mb-3">mdi-comment-outline</v-icon>
        <div class="text-h6">Aucun sujet dans ce forum</div>
      </v-card>

      <!-- Liste des sujets -->
      <v-list v-else lines="two" variant="outlined" rounded="lg" class="mb-4">
        <template v-for="(topic, index) in topics" :key="topic.id">
          <v-divider v-if="index > 0" />
          <v-list-item :to="`/topics/${topic.id}`" rounded="lg">
            <template #prepend>
              <v-icon :color="topic.locked ? 'warning' : 'primary'" class="mr-2">
                {{ topic.locked ? 'mdi-lock' : 'mdi-comment-text-outline' }}
              </v-icon>
            </template>
            <v-list-item-title class="font-weight-medium">{{ topic.title }}</v-list-item-title>
            <v-list-item-subtitle>
              Par <strong>{{ topic.author }}</strong> · {{ formatDate(topic.created_at) }}
              <span v-if="topic.last_message_author" class="ml-2 text-medium-emphasis">
                · Dernier message par <strong>{{ topic.last_message_author }}</strong>
                le {{ formatDate(topic.last_message_date!) }}
              </span>
            </v-list-item-subtitle>
            <template #append>
              <div class="text-body-2 text-medium-emphasis text-right">
                <div>{{ topic.message_count }} msg</div>
              </div>
            </template>
          </v-list-item>
        </template>
      </v-list>

      <!-- Pagination -->
      <v-pagination
        v-if="pagination && pagination.totalPages > 1"
        v-model="page"
        :length="pagination.totalPages"
        rounded="circle"
      />
    </v-col>
  </v-row>

  <!-- Dialog nouveau sujet -->
  <v-dialog v-model="newTopicDialog" max-width="560" persistent>
    <v-card>
      <v-card-title class="pa-4">Nouveau sujet</v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-alert v-if="newTopicError" type="error" variant="tonal" class="mb-4">{{ newTopicError }}</v-alert>
        <v-form @submit.prevent="submitNewTopic">
          <v-text-field
            v-model="newTopicForm.title"
            label="Titre du sujet"
            variant="outlined"
            class="mb-3"
            :disabled="newTopicLoading"
          />
          <v-textarea
            v-model="newTopicForm.message"
            label="Premier message"
            variant="outlined"
            rows="5"
            :disabled="newTopicLoading"
          />
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="newTopicDialog = false">Annuler</v-btn>
        <v-btn color="primary" :loading="newTopicLoading" @click="submitNewTopic">Créer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
