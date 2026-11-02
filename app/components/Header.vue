<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const { wikiName } = useAppConfig()

const { status, search } = useSearchCollection('content')

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searchError = ref('')
const isDropdownOpen = ref(false)

// The dropdown opens for any non-empty query so an empty result set shows a
// "nothing found" message instead of leaving the box silent.
const hasQuery = computed(() => searchQuery.value.trim().length > 0)

watch(searchQuery, async (value) => {
    const term = value.trim()
    if (!term) {
        searchResults.value = []
        searchError.value = ''
        isDropdownOpen.value = false
        return
    }

    try {
        const results = await search(value, {
            snippet: {
                columns: ['content'],
                around: 40
            }
        })

        // Ignore a late response for a query the reader has since changed.
        if (searchQuery.value.trim() !== term) return

        searchResults.value = results.slice(0, 6)
        searchError.value = ''
    } catch (e) {
        console.error('Error while searching:', e)
        searchResults.value = []
        searchError.value = 'Search is unavailable right now.'
    }
    isDropdownOpen.value = true
})

const closeSearch = () => {
    setTimeout(() => {
        isDropdownOpen.value = false
        searchQuery.value = ''
    }, 150)
}

const { data: navigation } = await useAsyncData('root-redirect', () =>
    queryCollectionNavigation('content')
)

const redirectPath = ref('/')

const firstGroup = navigation.value?.[0]
if (firstGroup) {
    if (firstGroup.children && firstGroup.children.length > 0) {
        redirectPath.value = firstGroup.children?.[0]?.path ?? '/'
    } else if (firstGroup.path) {
        redirectPath.value = firstGroup.path
    }
}

const colorMode = useColorMode()

const setTheme = (theme: 'light' | 'dark') => {
    colorMode.preference = theme
}
</script>

<template>
    <header class="bg-content-bg border-b border-border relative z-50">
        <div
            class="max-w-275 mx-auto pt-2.25 pb-2 px-5 flex flex-col sm:flex-row sm:items-center justify-between sm:gap-6 flex-wrap w-full">
            <div class="flex items-baseline gap-2 justify-center sm:justify-start">
                <NuxtLink :to="redirectPath" class="hover:opacity-90">
                    <h1 class="font-heading text-[1.375rem] font-normal text-text">{{ wikiName }}</h1>
                </NuxtLink>
                <button class="sm:hidden text-text-muted hover:text-text" @click="$emit('open-sidebar')"
                    aria-label="Open navigation">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>

                <p class="text-xs text-text-muted italic hidden sm:block">Documentation</p>
            </div>


            <div class="flex flex-row items-center justify-center gap-4">
                <div class="flex flex-col relative">
                    <ClientOnly>
                        <div class="flex gap-1.5 text-[11px] font-body items-end text-center mx-auto sm:mx-0">
                            <span class="text-text-muted hidden sm:block">Design:</span>
                            <button class="cursor-pointer" @click="setTheme('light')"
                                :class="colorMode.value === 'light' ? 'text-focus font-medium' : 'text-link hover:underline'">
                                [ Light ]
                            </button>
                            <button class="cursor-pointer" @click="setTheme('dark')"
                                :class="colorMode.value === 'dark' ? 'text-focus font-medium' : 'text-link hover:underline'">
                                [ Dark ]
                            </button>
                        </div>
                    </ClientOnly>


                    <div class="flex items-stretch relative">
                        <input v-model="searchQuery" @blur="closeSearch"
                            @focus="isDropdownOpen = hasQuery" :disabled="status !== 'ready'"
                            type="text" :placeholder="status === 'ready' ? 'Search wiki...' : 'Indexing...'"
                            class="w-full sm:w-56 py-1 px-2 border border-border rounded-xs bg-white dark:bg-sidebar-bg font-body text-sm text-text focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus disabled:opacity-50">
                    </div>

                    <div v-if="isDropdownOpen" role="status" aria-live="polite"
                        class="absolute top-full right-0 mt-1 w-72 bg-white dark:bg-sidebar-bg border border-border rounded-xs shadow-lg overflow-hidden max-h-72 overflow-y-auto z-50">
                        <div v-if="searchError" class="p-3 text-xs text-text-muted">
                            {{ searchError }}
                        </div>

                        <div v-else-if="searchResults.length === 0" class="p-3 text-xs text-text-muted">
                            <div class="font-bold text-text">
                                No results for &ldquo;{{ searchQuery.trim() }}&rdquo;
                            </div>
                            <div class="mt-1">
                                Check the spelling, try a shorter word, or browse the navigation.
                            </div>
                        </div>

                        <ul v-else class="list-none m-0 p-0">
                            <li v-for="result in searchResults" :key="result.id"
                                class="border-b border-border-light last:border-0">
                                <NuxtLink :to="result.id"
                                    class="block p-2 hover:bg-[#f6f8fa] dark:hover:bg-[#2d333b] text-left no-underline">
                                    <div class="text-xs font-bold text-link truncate">{{ result.title }}</div>

                                    <div v-if="result.snippets?.content"
                                        class="text-[11px] text-text-muted mt-0.5 line-clamp-2 search-snippet"
                                        v-html="result.snippets.content" />
                                </NuxtLink>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    </header>
</template>

<style>
.search-snippet mark {
    background-color: #fff5b8;
    color: #24292e;
    font-weight: 600;
    padding: 0 2px;
    border-radius: 2px;
}
</style>