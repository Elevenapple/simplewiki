<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Same key and first-page logic as Header.vue and the index redirect, so "back to
// the wiki" lands wherever the sidebar's first entry points.
const { data: navigation } = await useAsyncData('root-redirect', () =>
    queryCollectionNavigation('content')
)

const startPath = ref('/')

const firstGroup = navigation.value?.[0]
if (firstGroup) {
    if (firstGroup.children && firstGroup.children.length > 0) {
        startPath.value = firstGroup.children?.[0]?.path ?? '/'
    } else if (firstGroup.path) {
        startPath.value = firstGroup.path
    }
}
</script>

<template>
    <div class="py-10 max-w-150">
        <p class="text-[11.5px] uppercase tracking-[0.02em] text-text-muted font-bold mb-1.5">
            Error 404
        </p>

        <h1 class="font-heading text-[24px] font-normal m-0 pb-1.5 border-b border-border-light">
            This page does not exist
        </h1>

        <p class="text-13 text-text-muted mt-3">
            There is no wiki page at
            <code class="font-mono text-[12.5px] px-1 py-0.5 rounded-xs bg-header-band border border-border-light">{{ route.path }}</code>.
            The address may be mistyped, or the page may have been renamed or removed.
        </p>

        <ul class="text-13 text-text-muted mt-3 list-disc pl-6">
            <li>Check the spelling of the address.</li>
            <li>Use the search box at the top to look for the page by name.</li>
            <li>Browse the navigation to find the section you wanted.</li>
        </ul>

        <div class="mt-5 flex flex-wrap gap-2.5">
            <NuxtLink :to="startPath"
                class="text-13 no-underline rounded-md border border-border-light bg-header-band px-3.5 py-2 text-link hover:text-link-hover hover:border-border transition-colors">
                ← Back to the wiki
            </NuxtLink>
        </div>
    </div>
</template>
