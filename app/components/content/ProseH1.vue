<script setup lang="ts">
import { computed, inject } from 'vue'

const route = useRoute()

const props = defineProps<{
  id?: string
}>()
const href = computed(() => `${route.path}#${props.id}`)

const pageMeta = inject<{ description: any, minutes: any, titleId: any } | null>('pageMeta', null)

// Only the page title carries this, not later h1s in the body.
const isPageTitle = computed(() =>
    !!pageMeta && !!props.id && pageMeta.titleId.value === props.id,
)

const description = computed(() => isPageTitle.value ? pageMeta!.description.value : '')
const showReadingTime = computed(() => isPageTitle.value && pageMeta!.minutes.value > 0)
</script>

<template>
  <h1 :id="id" class="has-anchor">
    <NuxtLink v-if="id" :to="href" class="text-text!">
      <slot />
    </NuxtLink>
    <slot v-else />
    <HeadingAnchor v-if="id" :id="id" />
  </h1>

  <p v-if="description" class="page-description">
    {{ description }}
  </p>

  <div v-if="isPageTitle" class="page-meta">
    <span v-if="showReadingTime" class="reading-time">
      <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 24 24" width="12">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
        <path d="M12 7v5l3 2" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
      </svg>
      {{ pageMeta.minutes.value }} min read
    </span>

    <span v-if="showReadingTime" aria-hidden="true" class="page-meta-sep">·</span>

    <CopyPageLink />
  </div>
</template>

<style scoped>
.page-description {
  margin: 7px 0 0;
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.45;
  max-width: 62ch;
}

.page-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-top: 5px;
}

.reading-time {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 12px;
}

.page-meta-sep {
  color: var(--color-text-muted);
  font-size: 12px;
  opacity: 0.6;
}

@media print {
  .page-meta {
    margin-top: 4px;
  }
}
</style>
