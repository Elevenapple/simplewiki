<script setup lang="ts">
import { useRoute } from 'vue-router'
import { onBeforeUnmount, watch } from 'vue'

const route = useRoute()

const props = defineProps<{
    isOpen: boolean
}>()

const emit = defineEmits(['close'])

// Escape closes the drawer. The listener is only attached while it is open, so it
// never intercepts Escape elsewhere, such as closing the search results.
function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape' || e.defaultPrevented) return
    e.preventDefault()
    emit('close')
}

watch(() => props.isOpen, (open) => {
    if (!import.meta.client) return
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
}, { immediate: true })

onBeforeUnmount(() => {
    if (import.meta.client) window.removeEventListener('keydown', onKeydown)
})

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

watch(() => route.path, () => {
    emit('close')
})

import { onMounted, ref } from 'vue'

const COLLAPSED_KEY = 'simplewiki-sidebar-collapsed'

const collapsedGroups = ref<Record<string, boolean>>({})

// Restored after hydration rather than during setup: the server has no access to
// localStorage, so reading it earlier would make the first client render disagree
// with the markup it is hydrating.
onMounted(() => {
    try {
        const saved = localStorage.getItem(COLLAPSED_KEY)
        if (!saved) return
        const paths = JSON.parse(saved)
        if (!Array.isArray(paths)) return
        collapsedGroups.value = Object.fromEntries(
            paths.filter((p: unknown) => typeof p === 'string').map((p: string) => [p, true]),
        )
    } catch {
        // Unreadable or malformed entry, or storage blocked; start with everything open.
    }
})

function persist() {
    try {
        // Only the collapsed paths are stored, so the entry stays small and does not
        // accumulate groups that have since been expanded or renamed.
        const collapsed = Object.keys(collapsedGroups.value).filter(p => collapsedGroups.value[p])
        if (collapsed.length) localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed))
        else localStorage.removeItem(COLLAPSED_KEY)
    } catch {
        // Storage can be full or blocked; the sidebar still works for this visit.
    }
}

function toggleGroup(path: string) {
    collapsedGroups.value[path] = !collapsedGroups.value[path]
    persist()
}

function isGroupOpen(path: string) {
    return collapsedGroups.value[path] !== true
}
</script>

<template>
    <aside class="hidden sm:block sticky top-2 h-[calc(100dvh-0.5rem)] overflow-y-auto pt-3 min-h-0 pb-16 print:hidden">
        <div v-for="group in navigation" :key="group.path" class="mb-3.5 px-3">
            <h3 v-if="group.children.length > 0" @click="toggleGroup(group.path)"
                class="cursor-pointer flex items-center select-none justify-between text-[11.5px] uppercase tracking-[0.02em] text-text-muted mb-1 font-bold border-b border-border-light pb-0.75">
                {{ group.title }}

                <span class="text-[10px]">
                    {{ isGroupOpen(group.path) ? '−' : '+' }}
                </span>
            </h3>

            <ul v-if="group.children && isGroupOpen(group.path)" class="list-none m-0 p-0">
                <li v-for="item in group.children" :key="item.path"
                    :class="{ 'pl-1.5 border-l-2 border-link -ml-0.5': route.path === item.path }"
                    class="relative pl-2 py-1">
                    <NuxtLink :to="item.path" class="text-13 text-text-muted hover:text-text dynamic-link"
                        :class="{ 'font-bold text-text': route.path === item.path }">
                        {{ item.title }}
                    </NuxtLink>
                </li>
            </ul>
        </div>
    </aside>

    <div class="sm:hidden print:hidden">
        <Transition name="fade">
            <div v-if="isOpen" @click="emit('close')" class="fixed inset-0 bg-black/40 z-850 backdrop-blur-xs" />
        </Transition>

        <Transition name="slide">
            <div v-if="isOpen" role="dialog" aria-modal="true" aria-label="Navigation"
                class="bg-sidebar-bg h-dvh z-900 w-5/6 fixed top-0 left-0 border-r border-border shadow-2xl flex flex-col">

                <div class="flex items-center justify-between px-3 py-2 border-b border-border-light shrink-0">
                    <h3 class="text-[11.5px] uppercase tracking-[0.02em] text-text-muted font-bold">
                        Navigation
                    </h3>
                    <button @click="emit('close')" class="text-text-muted hover:text-text p-1" aria-label="Close navigation">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div class="overflow-y-auto flex-1 min-h-0 py-3">
                    <div v-for="group in navigation" :key="group.path" class="mb-3.5 px-3">
                        <h3 class="text-[11.5px] uppercase tracking-[0.02em] text-text-muted mb-1 font-bold border-b border-border-light pb-0.75"
                            v-if="group.children.length > 0">
                            {{ group.title }}
                        </h3>

                        <ul v-if="group.children" class="list-none m-0 p-0">
                            <li v-for="item in group.children" :key="item.path"
                                :class="{ 'pl-1.5 border-l-2 border-link -ml-0.5': route.path === item.path }"
                                class="relative pl-2 py-1">
                                <NuxtLink :to="item.path"
                                    class="text-13 text-text-muted hover:text-text dynamic-link block w-full"
                                    :class="{ 'font-bold text-text': route.path === item.path }">
                                    {{ item.title }}
                                </NuxtLink>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </Transition>
    </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s linear;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>