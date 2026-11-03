<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    // The Nuxt Content page document; `stem` and `extension` locate its source file.
    page: Record<string, any>
}>()

const { github } = useAppConfig()

const editUrl = computed(() => {
    if (!github?.repo) return null
    const stem = props.page.stem as string | undefined
    const ext = props.page.extension as string | undefined
    if (!stem || !ext) return null

    const dir = (github.contentDir ?? 'content').replace(/^\/+|\/+$/g, '')
    const file = `${dir}/${stem}.${ext}`.split('/').map(encodeURIComponent).join('/')
    return `https://github.com/${github.repo}/edit/${github.branch ?? 'main'}/${file}`
})
</script>

<template>
    <div v-if="editUrl" class="mt-8 flex justify-end print:hidden">
        <a :href="editUrl" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-[12px] text-text-muted hover:text-link no-underline hover:underline">
            <svg fill="none" height="13" viewBox="0 0 24 24" width="13" aria-hidden="true">
                <path d="M12 20h9" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-linejoin="round" stroke-width="2" />
            </svg>
            Edit this page on GitHub
        </a>
    </div>
</template>
