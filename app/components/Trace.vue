<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
    title?: string
}>()

const route = useRoute()
const separator = "›"

const { wikiName } = useAppConfig()

// Same key and shaping as Sidebar.vue and PageNav.vue, so this shares their cached
// result and the section names match the sidebar headings exactly.
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

interface Crumb {
    title: string
    path?: string
}

const normalize = (p: string) => p.replace(/\/+$/, '') || '/'

// Walks the navigation tree to the current page, collecting the groups passed on
// the way. Groups are headings in the sidebar, so they link to their first page.
function findTrail(items: any[], target: string, trail: Crumb[]): Crumb[] | null {
    for (const item of items) {
        if (item.children && item.children.length > 0) {
            const firstLeaf = firstPage(item)
            const found = findTrail(item.children, target, [
                ...trail,
                { title: item.title, path: firstLeaf?.path },
            ])
            if (found) return found
        } else if (item.path && normalize(item.path) === target) {
            return trail
        }
    }
    return null
}

function firstPage(item: any): any | null {
    if (!item.children || item.children.length === 0) return item.path ? item : null
    for (const child of item.children) {
        const leaf = firstPage(child)
        if (leaf) return leaf
    }
    return null
}

const startPath = computed(() => firstPage({ children: navigation.value ?? [] })?.path ?? '/')

const sections = computed<Crumb[]>(() =>
    findTrail(navigation.value ?? [], normalize(route.path), []) ?? []
)

const formatSlug = (path: string) => {
    if (path === "/") return "Home"
    const lastSegment = path.split("/").filter(Boolean).pop() || ""
    return lastSegment
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase())
}

const currentTitle = computed(() => props.title || formatSlug(route.path))
</script>

<template>
    <nav aria-label="Breadcrumb" class="bg-header-band border-b border-border print:hidden">
        <ol class="max-w-275 mx-auto py-1 px-5 text-[11.5px] leading-none text-text-muted flex flex-wrap items-center list-none m-0">

            <li class="flex items-center">
                <NuxtLink :to="startPath" class="text-link hover:underline">
                    {{ wikiName }}
                </NuxtLink>
                <span aria-hidden="true" class="text-[#72777d] select-none mx-0.75">{{ separator }}</span>
            </li>

            <li v-for="crumb in sections" :key="crumb.title" class="flex items-center">
                <NuxtLink v-if="crumb.path" :to="crumb.path" class="text-link hover:underline">
                    {{ crumb.title }}
                </NuxtLink>
                <span v-else>{{ crumb.title }}</span>
                <span aria-hidden="true" class="text-[#72777d] select-none mx-0.75">{{ separator }}</span>
            </li>

            <li class="text-text font-bold" aria-current="page">
                {{ currentTitle }}
            </li>

        </ol>
    </nav>
</template>
