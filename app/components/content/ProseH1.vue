<script setup lang="ts">
import { computed, inject } from 'vue'

const route = useRoute()

const props = defineProps<{
  id?: string
}>()
const href = computed(() => `${route.path}#${props.id}`)

const readingTime = inject<{ minutes: any, titleId: any } | null>('readingTime', null)

// Only the page title carries the note, not later h1s in the body.
const showReadingTime = computed(() =>
    !!readingTime && !!props.id && readingTime.titleId.value === props.id && readingTime.minutes.value > 0,
)
</script>

<template>
  <h1 :id="id" >
    <NuxtLink v-if="id" :to="href" class="text-text!">
      <slot />
    </NuxtLink>
    <slot v-else />
  </h1>

  <p v-if="showReadingTime" class="reading-time">
    <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 24 24" width="12">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
    </svg>
    {{ readingTime.minutes.value }} min read
  </p>
</template>

<style scoped>
.reading-time {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 5px 0 0;
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 12px;
}
</style>
