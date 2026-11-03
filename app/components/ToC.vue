<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
    isMobile: {
        type: Boolean,
        required: true,
    },
    tocLinks: {
        type: Array as PropType<any[]>,
        required: true,
    }
})

const route = useRoute()

// Heading ids in document order, including sub-headings, so the "current section"
// is simply the last heading that has scrolled past the top of the viewport.
const headingIds = computed<string[]>(() => {
    const ids: string[] = []
    for (const link of props.tocLinks) {
        ids.push(link.id)
        for (const sub of link.children ?? []) ids.push(sub.id)
    }
    return ids
})

const activeId = ref<string>('')

// Headings sit this far below the top edge before they count as "current", so a
// heading you just jumped to is highlighted rather than the one above it.
const OFFSET = 96

function updateActive() {
    const ids = headingIds.value
    if (!ids.length) { activeId.value = ''; return }

    // At the very bottom the last heading may never reach the top edge; treat the
    // end of the page as being in the last section.
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    if (atBottom) { activeId.value = ids[ids.length - 1]!; return }

    let current = ids[0]!
    for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top - OFFSET <= 0) current = id
        else break
    }
    activeId.value = current
}

let ticking = false
function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
        updateActive()
        ticking = false
    })
}

onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateActive()
})

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
})

// New page or new headings: recompute once the DOM has the new content.
watch([() => route.path, headingIds], () => nextTick(updateActive))

// On phones the ToC is a collapsible panel above the article. Closing it as soon
// as an entry is tapped (before the hash scroll runs) means the panel's height is
// gone by the time the browser positions the heading, so the jump lands cleanly.
const mobilePanel = ref<HTMLDetailsElement | null>(null)

function closeMobilePanel() {
    if (mobilePanel.value) mobilePanel.value.open = false
}

// A top-level entry is highlighted when it, or any of its sub-headings, is current.
function isActiveGroup(link: any): boolean {
    if (link.id === activeId.value) return true
    return (link.children ?? []).some((sub: any) => sub.id === activeId.value)
}
</script>

<template>
    <div class="sm:ml-4 sm:mt-4 sm:my-0 pt-2 px-3.5 pb-2.5 bg-toc-bg border border-border rounded-xs text-13 [counter-reset:toc-main] sticky top-4 my-8 print:hidden"
        v-if="tocLinks.length && !isMobile">
        <div class="font-bold mx-0 mt-0 mb-1.5 pb-1.25 border-b border-border-light tracking-[0.01em] text-text!">
            Table of Contents
        </div>

        <ol v-if="tocLinks.length" class="m-0 pl-4 list-decimal list-outside">
            <li v-for="link in tocLinks" :key="link.id"
                class="mt-1 mb-1 [counter-increment:toc-main] [counter-reset:toc-sub]">
                <NuxtLink :to="`#${link.id}`"
                    :aria-current="activeId === link.id ? 'location' : undefined"
                    class="toc-link text-text! hover:text-link-hover! no-underline"
                    :class="{ 'toc-active': activeId === link.id, 'toc-active-group': isActiveGroup(link) }">
                    <span class="text-text-muted! mr-1 [content:counter(toc-main)_'.']"></span>{{ link.text }}
                </NuxtLink>

                <ol v-if="link.children && link.children.length" class="pl-4.5 mt-0.5 mb-1 list-inside list-decimal">
                    <li v-for="subLink in link.children" :key="subLink.id"
                        class="mt-0.75 mb-0.75 [counter-increment:toc-sub]">
                        <NuxtLink :to="`#${subLink.id}`"
                            :aria-current="activeId === subLink.id ? 'location' : undefined"
                            class="toc-link text-text! hover:text-link-hover! no-underline"
                            :class="{ 'toc-active': activeId === subLink.id }">
                            <span
                                class="text-text-muted! mr-1 [font-variant-numeric:tabular-nums] [content:counter(toc-main)_'.'_counter(toc-sub)]"></span>{{
                                    subLink.text }}
                        </NuxtLink>
                    </li>
                </ol>
            </li>
        </ol>
    </div>
    <div v-if="tocLinks.length && isMobile" class="sm:hidden my-3 px-2 print:hidden">
        <details ref="mobilePanel" class="bg-toc-bg border border-border rounded-xs">
            <summary
                class="cursor-pointer select-none px-3 py-2 text-[13px] font-bold text-text flex items-center justify-between list-none">
                <span>Table of Contents</span>
                <span class="text-text-muted text-[11px]">▼</span>
            </summary>

            <div class="px-3 py-2 border-t border-border-light">
                <ol class="m-0 pl-4 list-decimal list-outside [counter-reset:toc-main]">
                    <li v-for="link in tocLinks" :key="link.id"
                        class="mt-1 mb-1 [counter-increment:toc-main] [counter-reset:toc-sub]">

                        <NuxtLink :to="`#${link.id}`" @click="closeMobilePanel"
                            :aria-current="activeId === link.id ? 'location' : undefined"
                            class="toc-link text-text hover:text-link-hover no-underline block"
                            :class="{ 'toc-active': activeId === link.id, 'toc-active-group': isActiveGroup(link) }">
                            {{ link.text }}
                        </NuxtLink>

                        <ol v-if="link.children?.length" class="pl-4 mt-1 list-decimal list-outside">
                            <li v-for="subLink in link.children" :key="subLink.id"
                                class="my-1 [counter-increment:toc-sub]">
                                <NuxtLink :to="`#${subLink.id}`" @click="closeMobilePanel"
                                    :aria-current="activeId === subLink.id ? 'location' : undefined"
                                    class="toc-link text-text-muted hover:text-link-hover no-underline block"
                                    :class="{ 'toc-active': activeId === subLink.id }">
                                    {{ subLink.text }}
                                </NuxtLink>
                            </li>
                        </ol>
                    </li>
                </ol>
            </div>
        </details>
    </div>
</template>

<style scoped>
.toc-link {
    /* Reserve the marker's space so the text does not shift when it appears. */
    position: relative;
    padding-left: 8px;
    margin-left: -8px;
    border-radius: 2px;
    transition: color 0.15s, background-color 0.15s;
}

.toc-active-group {
    font-weight: 600;
}

.toc-active {
    /* Tailwind's `!` colour utilities set !important, so this must too. */
    color: var(--color-link) !important;
    background: color-mix(in srgb, var(--color-link) 10%, transparent);
}

.toc-active::before {
    content: "";
    position: absolute;
    left: 0;
    top: 2px;
    bottom: 2px;
    width: 2px;
    border-radius: 1px;
    background: var(--color-link);
}
</style>
