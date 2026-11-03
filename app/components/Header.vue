<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
        activeIndex.value = -1
    } catch (e) {
        console.error('Error while searching:', e)
        searchResults.value = []
        searchError.value = 'Search is unavailable right now.'
    }
    isDropdownOpen.value = true
})

// Index of the keyboard-highlighted result; -1 means nothing is highlighted yet.
const activeIndex = ref(-1)
const resultRefs = ref<HTMLElement[]>([])

const closeSearch = () => {
    setTimeout(() => {
        isDropdownOpen.value = false
        searchQuery.value = ''
    }, 150)
}

function moveActive(delta: number) {
    const count = searchResults.value.length
    if (!count) return
    // Wrap around at both ends so Down from the last match returns to the first.
    activeIndex.value = (activeIndex.value + delta + count) % count
    nextTick(() => resultRefs.value[activeIndex.value]?.scrollIntoView({ block: 'nearest' }))
}

function onSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
        isDropdownOpen.value = false
        return
    }

    if (!isDropdownOpen.value || searchResults.value.length === 0) {
        if (e.key === 'ArrowDown' && hasQuery.value) isDropdownOpen.value = true
        return
    }

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault()
            moveActive(1)
            break
        case 'ArrowUp':
            e.preventDefault()
            moveActive(-1)
            break
        case 'Home':
            e.preventDefault()
            activeIndex.value = 0
            break
        case 'End':
            e.preventDefault()
            activeIndex.value = searchResults.value.length - 1
            break
        case 'Enter': {
            // Enter with nothing highlighted opens the first match, so a quick
            // type-and-Enter still works.
            const target = searchResults.value[activeIndex.value] ?? searchResults.value[0]
            if (!target) return
            e.preventDefault()
            isDropdownOpen.value = false
            searchQuery.value = ''
            navigateTo(target.id)
            break
        }
    }
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

const searchInput = ref<HTMLInputElement | null>(null)

// "/" focuses the search box from anywhere on the page, unless the reader is already
// typing into a field or holding a modifier (so browser shortcuts still work).
function onGlobalKeydown(e: KeyboardEvent) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return

    const target = e.target as HTMLElement | null
    const tag = target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return

    const input = searchInput.value
    if (!input || input.disabled) return

    e.preventDefault()
    input.focus()
    input.select()
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))

const colorMode = useColorMode()

const setTheme = (theme: 'light' | 'dark') => {
    colorMode.preference = theme
}
</script>

<template>
    <header class="bg-content-bg border-b border-border relative z-50 print:hidden">
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
                        <input ref="searchInput" v-model="searchQuery" @blur="closeSearch" @keydown="onSearchKeydown"
                            @focus="isDropdownOpen = hasQuery" :disabled="status !== 'ready'"
                            type="text" :placeholder="status === 'ready' ? 'Search wiki...  /' : 'Indexing...'"
                            role="combobox" aria-autocomplete="list" aria-controls="wiki-search-results"
                            :aria-expanded="isDropdownOpen"
                            :aria-activedescendant="activeIndex >= 0 ? `wiki-search-result-${activeIndex}` : undefined"
                            class="w-full sm:w-56 py-1 px-2 border border-border rounded-xs bg-white dark:bg-sidebar-bg font-body text-sm text-text focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus disabled:opacity-50">
                    </div>

                    <div v-if="isDropdownOpen"
                        class="absolute top-full right-0 mt-1 w-72 bg-white dark:bg-sidebar-bg border border-border rounded-xs shadow-lg overflow-hidden max-h-72 overflow-y-auto z-50">
                        <div v-if="searchError" role="status" aria-live="polite" class="p-3 text-xs text-text-muted">
                            {{ searchError }}
                        </div>

                        <div v-else-if="searchResults.length === 0" role="status" aria-live="polite" class="p-3 text-xs text-text-muted">
                            <div class="font-bold text-text">
                                No results for &ldquo;{{ searchQuery.trim() }}&rdquo;
                            </div>
                            <div class="mt-1">
                                Check the spelling, try a shorter word, or browse the navigation.
                            </div>
                        </div>

                        <ul v-else id="wiki-search-results" role="listbox" class="list-none m-0 p-0">
                            <li v-for="(result, index) in searchResults" :key="result.id"
                                :id="`wiki-search-result-${index}`" role="option"
                                :aria-selected="index === activeIndex"
                                :ref="el => { if (el) resultRefs[index] = el as HTMLElement }"
                                class="border-b border-border-light last:border-0"
                                @mouseenter="activeIndex = index">
                                <NuxtLink :to="result.id" tabindex="-1"
                                    :class="index === activeIndex ? 'bg-[#f6f8fa] dark:bg-[#2d333b]' : ''"
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