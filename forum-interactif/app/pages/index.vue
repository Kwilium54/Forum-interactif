<script setup lang="ts">
useHead({ title: 'Accueil — Forum Interactif' })

const { data, refresh } = await useFetch<{ forums: { id: number; name: string; topic_count: number }[] }>('/api/forums')
const forums = computed(() => data.value?.forums ?? [])
</script>

<template>
  <div>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <h1 class="text-h4 font-weight-bold mb-6">Forums</h1>

        <v-card v-if="forums.length === 0" class="pa-6 text-center text-medium-emphasis" variant="outlined">
          <v-icon size="64" class="mb-4">mdi-forum-outline</v-icon>
          <div class="text-h6">Aucun forum disponible</div>
        </v-card>

        <v-list v-else lines="two" variant="outlined" rounded="lg">
          <template v-for="(forum, index) in forums" :key="forum.id">
            <v-divider v-if="index > 0" />
            <v-list-item
              :to="`/forums/${forum.id}`"
              :title="forum.name"
              :subtitle="`${forum.topic_count} sujet${forum.topic_count !== 1 ? 's' : ''}`"
              rounded="lg"
            >
              <template #prepend>
                <v-icon color="primary" class="mr-2">mdi-forum</v-icon>
              </template>
              <template #append>
                <v-icon color="medium-emphasis">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </template>
        </v-list>
      </v-col>
    </v-row>
  </div>
</template>
