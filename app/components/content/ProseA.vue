<script setup lang="ts">
import { computed } from 'vue'
import { isExternalLink } from '~/util/externalLink.ts'

const props = defineProps<{
    href?: string
    target?: string
}>()

const isExternal = computed(() => isExternalLink(props.href))

// An explicit target in the markdown wins over the automatic one.
const linkTarget = computed(() => props.target ?? (isExternal.value ? '_blank' : undefined))
const linkRel = computed(() => linkTarget.value === '_blank' ? 'noopener noreferrer' : undefined)
</script>

<template>
    <NuxtLink :to="href" :target="linkTarget" :rel="linkRel">
        <slot />
        <svg v-if="isExternal" aria-hidden="true" class="external-icon" fill="none" height="10" viewBox="0 0 24 24" width="10">
            <path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" />
            <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" />
        </svg>
    </NuxtLink>
</template>

<style scoped>
.external-icon {
    display: inline-block;
    margin-left: 2px;
    vertical-align: baseline;
    opacity: 0.65;
}
</style>
