<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Progress through the article itself, not the whole document: the bar reaches the
// end when the article's bottom edge scrolls past the fold, so the footer and the
// previous/next links do not leave it stuck short of full.
const progress = ref(0)
const visible = ref(false)
let ticking = false

function measure() {
    const article = document.getElementById('main-content')
    if (!article) { visible.value = false; return }

    const rect = article.getBoundingClientRect()
    const top = rect.top + window.scrollY
    const total = rect.height - window.innerHeight

    // Nothing to track when the article fits on one screen.
    if (total <= 0) { visible.value = false; progress.value = 0; return }

    const scrolled = window.scrollY - top
    progress.value = Math.min(1, Math.max(0, scrolled / total))
    visible.value = true
}

function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
        measure()
        ticking = false
    })
}

onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    measure()
})

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
})
</script>

<template>
    <div v-show="visible" class="reading-progress print:hidden" role="progressbar" aria-label="Reading progress"
        aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(progress * 100)">
        <div class="reading-progress-bar" :style="{ transform: `scaleX(${progress})` }" />
    </div>
</template>

<style scoped>
.reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 1100;
    background: transparent;
    pointer-events: none;
}

.reading-progress-bar {
    height: 100%;
    width: 100%;
    transform-origin: 0 0;
    background: var(--color-link);
    will-change: transform;
}

@media (prefers-reduced-motion: no-preference) {
    .reading-progress-bar {
        transition: transform 0.08s linear;
    }
}
</style>
