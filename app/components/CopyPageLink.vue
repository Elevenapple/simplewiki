<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const copied = ref(false)
const failed = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copyPageLink() {
    // router.resolve applies the app's base URL, so the copied link is the public
    // one rather than the internal route path. The hash is left off deliberately:
    // this shares the page, while the heading icons share a section.
    const absolute = new URL(router.resolve({ path: route.path }).href, window.location.href).href

    try {
        await navigator.clipboard.writeText(absolute)
        copied.value = true
        failed.value = false
    } catch {
        // Clipboard is unavailable on insecure origins, such as the Docker image
        // served over plain HTTP on a LAN.
        copied.value = false
        failed.value = true
    }

    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
        copied.value = false
        failed.value = false
    }, 2000)
}
</script>

<template>
    <button type="button" class="copy-page-link" :class="{ copied }" @click="copyPageLink"
        :aria-label="copied ? 'Page link copied' : 'Copy link to this page'"
        :title="failed ? 'Could not copy automatically' : 'Copy link to this page'">
        <svg v-if="copied" aria-hidden="true" fill="none" height="12" viewBox="0 0 24 24" width="12">
            <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" />
        </svg>
        <svg v-else aria-hidden="true" fill="none" height="12" viewBox="0 0 24 24" width="12">
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
        </svg>
        <span>{{ copied ? 'Link copied' : failed ? 'Press Ctrl+C to copy' : 'Copy link' }}</span>
    </button>
</template>

<style scoped>
.copy-page-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-family: var(--font-body);
    font-size: 12px;
    cursor: pointer;
    transition: color 0.15s;
}

.copy-page-link:hover {
    color: var(--color-link);
}

.copy-page-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
    border-radius: 2px;
}

.copy-page-link.copied {
    color: #2e9e5b;
}

@media print {
    .copy-page-link {
        display: none;
    }
}
</style>
