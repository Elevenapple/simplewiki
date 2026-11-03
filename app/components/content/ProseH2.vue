<script setup lang="ts">
const route = useRoute()

const props = defineProps<{
  id?: string
}>()
const href = computed(() => `${route.path}#${props.id}`)
</script>

<template>
  <h2 :id="id" class="has-anchor">
    <NuxtLink v-if="id" :to="href">
      <slot />
    </NuxtLink>
    <slot v-else />
    <HeadingAnchor v-if="id" :id="id" />
  </h2>
</template>
