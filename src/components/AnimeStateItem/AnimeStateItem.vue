<script setup lang="ts">
import { PropType, onMounted, ref } from 'vue';
import AnimeStateItemDesktop from './AnimeStateItemDesktop.vue'
import AnimeStateItemMobile from './AnimeStateItemMobile.vue'

const props = defineProps({
    state: {
        type: Object as PropType<AnimeState>,
        required: true,
    },
    showAll: {
        type: Boolean,
        default: true,
    }
})

const isMobile = ref(false)

onMounted(() => {
    isMobile.value = window.innerWidth < 768
})

window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
})

</script>

<template>
    <div class="wrapper">
        <component :is="isMobile ? AnimeStateItemMobile : AnimeStateItemDesktop" v-bind="props"/>
    </div>
</template>

<style scoped>

.wrapper {
    width: 100%;
}

</style>