<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, toRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { firstHeadingId, readingMinutes } from '~/util/readingTime.ts'
import { highlightTerms, parseTerms } from '~/util/highlightTerms.ts'

const props = defineProps({
    data: {
        type: [Object, null],
        required: true,
    }
})

const data = toRef(props, 'data')
const route = useRoute()

// Search results link here with ?q=<query>; the terms are painted onto the article
// once it has rendered. Navigating anywhere without ?q= removes them again.
const highlightQuery = computed(() => parseTerms(route.query.q))
const highlightCount = ref(0)
// Template ref to the ContentRenderer component; its root element is read via $el.
const rendererRef = ref<any>(null)

let clearHighlight: (() => void) | null = null

async function applyHighlight() {
    clearHighlight?.()
    clearHighlight = null
    highlightCount.value = 0

    if (!highlightQuery.value.length || !data.value) return
    await nextTick()

    const root = rendererRef.value?.$el ?? rendererRef.value
    if (!(root instanceof HTMLElement)) return

    const result = highlightTerms(root, highlightQuery.value)
    clearHighlight = result.clear
    highlightCount.value = result.count

    // Bring the first hit into view unless the link already targets a heading.
    if (result.first && !route.hash) {
        const el = result.first instanceof Range
            ? (result.first.startContainer.parentElement ?? null)
            : result.first
        el?.scrollIntoView({ block: 'center' })
    }
}

onMounted(applyHighlight)
watch([highlightQuery, data], applyHighlight)
onBeforeUnmount(() => clearHighlight?.())

// Same page without the query, so "Clear" removes the highlight in place.
const clearTarget = computed(() => ({ path: route.path, hash: route.hash }))

// ProseH1 renders the description and reading time, but only under the page title:
// several pages use further h1s lower down, so the title is identified by the id of
// the first one.
provide('pageMeta', {
    description: computed(() => (data.value?.description ?? '').trim()),
    minutes: computed(() => data.value ? readingMinutes(data.value.body) : 0),
    titleId: computed(() => data.value ? firstHeadingId(data.value.body) : null),
})
</script>

<template>
    <div id="main-content" tabindex="-1"
        class="bg-content-bg pt-4.5 px-6.5 pb-10 border-r border-l border-border min-h-screen min-w-0 scroll-mt-[calc(var(--header-height)+1rem)] focus:outline-none print:border-0 print:px-0 print:pt-0 print:min-h-0">
        <div v-if="data && highlightQuery.length" data-no-highlight
            class="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xs border border-border-light bg-header-band px-3 py-1.5 text-[12px] text-text-muted print:hidden">
            <span>
                <template v-if="highlightCount > 0">
                    Highlighting {{ highlightCount }} {{ highlightCount === 1 ? 'match' : 'matches' }} for
                </template>
                <template v-else>
                    No matches on this page for
                </template>
                <strong class="text-text">&ldquo;{{ highlightQuery.join(' ') }}&rdquo;</strong>
            </span>
            <NuxtLink :to="clearTarget" class="text-link hover:underline ml-auto">Clear</NuxtLink>
        </div>

        <ContentRenderer v-if="data" ref="rendererRef" :value="data" class="renderer" :components="{
            h1: 'ProseH1',
            h2: 'ProseH2',
            h3: 'ProseH3',
            h4: 'ProseH4',
            pre: 'ProsePre',
            a: 'ProseA',
            FieldTable: 'FieldTable',
            Badge: 'Badge',
            Accordion: 'Accordion',
            Timeline: 'Timeline',
            Collapsible: 'Collapsible',
            Diff: 'Diff',
            Steps: 'Steps',
            Keyboard: 'Keyboard',
            Hatnote: 'Hatnote',
            PullQuote: 'PullQuote',
            CategoryList: 'CategoryList',
            ReferenceList: 'ReferenceList',
            SeeAlso: 'SeeAlso',
            LinkCard: 'LinkCard',
        }" />
        <NotFound v-else />

        <EditLink v-if="data" :page="data" />
        <PageNav v-if="data" />
    </div>
</template>

<style scoped lang="scss">
.renderer :deep([align="left"]) {
    text-align: left;
}

.renderer :deep([align="center"]) {
    text-align: center;
}

.renderer :deep([align="right"]) {
    text-align: right;
}

.renderer :deep(h1) {
    font-family: var(--font-heading);
    font-size: 24px;
    font-weight: normal;
    margin: 0 0 4px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-light);
}

.renderer :deep(h2) {
    font-family: var(--font-heading);
    font-size: 20px;
    font-weight: normal;
    margin: 20px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border-light);
}

.renderer :deep(h2 > a) {
    color: var(--text);
}

.renderer :deep(h3) {
    font-size: 15px;
    font-weight: bold;
    margin: 14px 0 6px;
}

.renderer :deep(h3 > a) {
    color: var(--text);
}

.renderer :deep(h4) {
    font-size: 13px;
    font-weight: bold;
    margin: 12px 0 6px;
}

.renderer :deep(h4 > a) {
    color: var(--text);
}

.renderer :deep(br) {
    content: "";
    display: block;
    margin: 8px 0;
}
    
.renderer :deep(h5) {
    font-size: 12px;
    font-weight: bold;
    margin: 10px 0 4px;
}

.renderer :deep(h5 > a) {
    color: var(--text);
}

.renderer :deep(ul) {
    list-style-type: disc;
    margin: 6px 0 12px;
    padding-left: 28px;
}

.renderer :deep(li) {
    margin: 1px 0;
}

.renderer :deep(ol) {
    list-style-type: decimal;
    margin: 6px 0 12px;
    padding-left: 28px;
}

.renderer :deep(pre) {
    background-color: #f6f8fa !important;
    border: 1px solid var(--border-light, #e1e4e8);
    border-radius: 6px;
    padding: 16px;
    margin: 16px 0;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: auto;
    white-space: pre;
    word-break: normal;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    font-size: 13.5px;
    line-height: 1.5;

    .dark & {
        background-color: #0d1117 !important;
        border-color: var(--border-dark, #30363d);
    }
}


.renderer :deep(pre code) {
    background: none !important;
    padding: 0 !important;
    border: none !important;
    font-family: inherit;
    color: inherit;
}

.renderer :deep(.highlight) {
    background-color: #fffbdd;
    display: block;
    margin: 0 -16px;
    padding: 0 16px;
    border-left: 3px solid #ffd33d;

    .dark & {
        background-color: #1a1c1e;
        border-color: #ffd33d;
    }
}

.renderer :deep(hr) {
    border: none;
    border-top: 1px solid var(--border-light);
    margin: 20px 0;
}

.renderer :deep(blockquote) {
    border-left: 4px solid var(--border-light);
    padding-left: 12px;
    margin: 12px 0;
    color: var(--text-muted);
}

.renderer :deep(table) {
    border-collapse: collapse;
    width: 100%;
    max-width: 560px;
    margin: 6px 0 16px;
    font-size: 13px;
    background: var(--content-bg);
}

.renderer :deep(th),
.renderer :deep(td) {
    border: 1px solid var(--border);
    padding: 5px 10px;
    text-align: left;
}

.renderer :deep(th) {
    background: var(--header-band);
    font-weight: bold;
}

.renderer :deep(tr:hover td) {
    background: var(--row-hover-bg);
}

.renderer :deep(img) {
    max-width: 100%;
    height: auto;
}
</style>
