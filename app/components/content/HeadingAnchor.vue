<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{ id: string }>()

const route = useRoute()
const router = useRouter()

const href = `${route.path}#${props.id}`

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copyLink(e: MouseEvent) {
  // Plain left-click copies. Modifier clicks and right-click keep normal link
  // behaviour, so "open in new tab" and "copy link address" still work.
  if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
  e.preventDefault()

  // router.resolve applies the app's base URL, so the copied link is the public one.
  const absolute = new URL(router.resolve({ path: route.path, hash: `#${props.id}` }).href, window.location.href).href

  try {
    await navigator.clipboard.writeText(absolute)
  } catch {
    // Clipboard is unavailable on insecure origins; fall back to navigating so at
    // least the address bar shows the link to copy by hand.
    router.push(href)
    return
  }

  // Reflect the copied link in the address bar without scrolling.
  history.replaceState(history.state, '', absolute)

  copied.value = true
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <a :href="href" class="heading-anchor" :class="{ copied }"
     :aria-label="copied ? 'Link copied' : 'Copy link to this section'"
     :title="copied ? 'Link copied' : 'Copy link to this section'"
     @click="copyLink">
    <svg v-if="copied" aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" />
    </svg>
    <svg v-else aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
    </svg>
  </a>
</template>

<style scoped>
.heading-anchor {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  vertical-align: middle;
  color: var(--color-text-muted);
  opacity: 0;
  text-decoration: none;
  transition: opacity 0.15s, color 0.15s;
}

.heading-anchor:hover {
  color: var(--color-link);
}

.heading-anchor:focus-visible {
  opacity: 1;
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: 2px;
}

.heading-anchor.copied {
  opacity: 1;
  color: #2e9e5b;
}

@media (hover: none) {
  /* No hover on touch screens, so the icon is always visible there. */
  .heading-anchor {
    opacity: 0.55;
  }
}

@media print {
  .heading-anchor {
    display: none;
  }
}
</style>
