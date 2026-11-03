<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Same key and shaping as Sidebar.vue, so this shares its cached result and the
// previous/next order is exactly the order a reader sees in the sidebar.
const { data: navigation } = await useAsyncData('navigation', async () => {
    const nav = await queryCollectionNavigation('content')

    const sortNavigation = (items: any[]) => {
        return items
            .filter(item => !item.hide)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map(item => ({
                ...item,
                children: item.children ? sortNavigation(item.children) : []
            }))
    }

    return sortNavigation(nav)
})

interface FlatPage {
    title: string
    path: string
    group: string
}

// Flattens groups into one reading order. Groups themselves are headings in the
// sidebar rather than pages, so only leaf items become stops.
const pages = computed<FlatPage[]>(() => {
    const out: FlatPage[] = []
    const walk = (items: any[], group: string) => {
        for (const item of items) {
            if (item.children && item.children.length > 0) {
                walk(item.children, item.title)
            } else if (item.path) {
                out.push({ title: item.title, path: item.path, group })
            }
        }
    }
    walk(navigation.value ?? [], '')
    return out
})

const normalize = (p: string) => p.replace(/\/+$/, '') || '/'

const currentIndex = computed(() =>
    pages.value.findIndex(p => normalize(p.path) === normalize(route.path))
)

const prev = computed(() => currentIndex.value > 0 ? pages.value[currentIndex.value - 1] : null)
const next = computed(() =>
    currentIndex.value >= 0 && currentIndex.value < pages.value.length - 1
        ? pages.value[currentIndex.value + 1]
        : null
)
</script>

<template>
    <nav v-if="prev || next" aria-label="Previous and next page"
        class="mt-10 pt-4 border-t border-border-light grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
        <NuxtLink v-if="prev" :to="prev.path"
            class="group flex flex-col gap-0.5 rounded-md border border-border-light bg-header-band px-3.5 py-2.5 no-underline hover:border-border transition-colors">
            <span class="text-[11px] uppercase tracking-[0.02em] text-text-muted font-bold flex items-center gap-1">
                <span aria-hidden="true">←</span> Previous
            </span>
            <span class="text-13 text-link group-hover:text-link-hover">{{ prev.title }}</span>
            <span v-if="prev.group" class="text-[11px] text-text-muted">{{ prev.group }}</span>
        </NuxtLink>
        <span v-else class="hidden sm:block" />

        <NuxtLink v-if="next" :to="next.path"
            class="group flex flex-col gap-0.5 items-end text-right rounded-md border border-border-light bg-header-band px-3.5 py-2.5 no-underline hover:border-border transition-colors sm:col-start-2">
            <span class="text-[11px] uppercase tracking-[0.02em] text-text-muted font-bold flex items-center gap-1">
                Next <span aria-hidden="true">→</span>
            </span>
            <span class="text-13 text-link group-hover:text-link-hover">{{ next.title }}</span>
            <span v-if="next.group" class="text-[11px] text-text-muted">{{ next.group }}</span>
        </NuxtLink>
    </nav>
</template>
