<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Roughly one screen of scrolling before the button appears, so it never covers
// anything on a page that fits in the viewport.
const SHOW_AFTER = 400

const visible = ref(false)
let ticking = false

function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
        visible.value = window.scrollY > SHOW_AFTER
        ticking = false
    })
}

function scrollToTop() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
}

onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
})

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
})
</script>

<template>
    <Transition name="btt">
        <button v-show="visible" type="button" aria-label="Back to top" title="Back to top" @click="scrollToTop"
            class="fixed bottom-5 right-5 z-800 flex items-center justify-center w-9 h-9 rounded-full border border-border bg-content-bg text-text-muted shadow-md cursor-pointer hover:text-text hover:border-text-muted focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 transition-colors">
            <svg fill="none" height="16" viewBox="0 0 24 24" width="16" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
            </svg>
        </button>
    </Transition>
</template>

<style scoped>
.btt-enter-active,
.btt-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.btt-enter-from,
.btt-leave-to {
    opacity: 0;
    transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
    .btt-enter-active,
    .btt-leave-active {
        transition: none;
    }
}
</style>
