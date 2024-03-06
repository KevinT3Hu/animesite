<script setup lang="ts">
import { computed } from 'vue';


const props = defineProps({
    name_cn: {
        type: String
    },
    name: {
        type: String
    },
    image: {
        type: String
    },
    summary: {
        type: String
    },
    id: {
        type: Number
    },
    rank: {
        type: Number
    },
    score: {
        type: Number
    },
    contained: {
        type: Boolean
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const bangumiUrl = 'https://bangumi.tv/subject/' + props.id

const anime_name_primary = computed(() => {
    return props.name_cn === "" ? props.name : props.name_cn
})

</script>

<template>
    <div class="wrapper">
        <img class="image" :src="image"/>
        <div>
            <div class="title_bar">
                <div class="title_l">
                    <a :href="bangumiUrl" target="_blank" rel="noopener noreferrer" class="title_cn">{{ anime_name_primary }}</a>
                    <p class="rating">#{{ rank }}</p>
                    <p class="rating">{{ score }}</p>
                </div>
                <v-btn v-if="!contained" :disabled="loading" class="add_btn" type="primary" @click="$emit('add')" icon>
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-icon v-else>mdi-check</v-icon>
            </div>
            <p>{{ name }}</p>
            <p>{{ summary }}</p>
        </div>
    </div>
</template>

<style scoped>
.wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    padding: 10px;
}

.image {
    margin-right: 10px;
    width: 120px;
    align-self: flex-start;
}

.title_bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.title_l {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.rating {
    margin-left: 10px;
}

.title_cn {
    max-width: 180px;
}


</style>