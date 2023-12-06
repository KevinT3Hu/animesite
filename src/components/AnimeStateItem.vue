<script setup lang="ts">
import { bangumiClient } from '@/ApiHelper';
import { reactive, type PropType, onMounted, computed } from 'vue';


const props = defineProps({
    state: {
        type: Object as PropType<AnimeState>,
    },
    showAll: {
        type: Boolean,
        default: true,
    }
})

const emits = defineEmits<{
    changeWatchedState: [ep: number],
    changeArchivedState: [archived: boolean],
}>()

const episodes = reactive<Episode[]>([])

const episodesToShow = computed(() => {
    if (props.showAll) {
        return episodes
    } else {
        return episodes.filter((episode) => {
            return (!episodeWatched(episode.ep)) && (episodeAired(episode.airdate))
        })
    }
})

onMounted(() => {
    bangumiClient.get(`/v0/episodes`, {
        params: {
            subject_id: props.state?.anime_item.id,
            type: 0,
        }
    }).then((response) => {
        episodes.splice(0, episodes.length, ...response.data.data)
    })
})

function episodeWatched(ep: number) {
    return props.state?.watched_episodes.includes(ep) ?? false
}

function episodeAired(date: string) {
    return new Date(date) < new Date()
}

function changeWatchedState(ep: number, date: string) {
    if (episodeAired(date)) {
        emits('changeWatchedState', ep)
    }
}

function changeArchivedState(archived: boolean) {
    emits('changeArchivedState', archived)
}

</script>

<template>
    <div class="s_wrapper">
        <img class="image" :src="state?.anime_item.images.common" />
        <div class="anime_content">
            <a :href="'https://bangumi.tv/subject/' + state?.anime_item.id" target="_blank" rel="noopener noreferrer"
                class="title_cn">{{ state?.anime_item.name_cn }}</a>
            <p>{{ state?.anime_item.name }}</p>
            <div class="episodes">
                <div v-ripple class="episode rounded" v-for="episode in episodesToShow" :key="episode.id"
                    :class="{ not_aired: !episodeAired(episode.airdate), watched: episodeWatched(episode.ep) }"
                    @click="changeWatchedState(episode.ep, episode.airdate)">
                    <p class="no_select">{{ episode.ep }}</p>
                    <v-tooltip activator="parent" location="top">
                        <p>{{ episode.name_cn }}</p>
                        <p class="name_jp">{{ episode.name }}</p>
                        <p>{{ episode.airdate }}</p>
                        <p v-if="episodeWatched(episode.ep)">Watched</p>
                    </v-tooltip>
                </div>
            </div>
            <p>{{ state?.anime_item.summary }}</p>
        </div>
    </div>
</template>

<style scoped>
.s_wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    margin-left: 10px;
    margin-right: 10px;
}

.image {
    margin-right: 10px;
    width: 120px;
    align-self: flex-start;
}

.anime_content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
}

.episodes {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex-flow: wrap;
}

.title_cn {
    font-size: 1.2rem;
    font-weight: bold;
}

.episode {
    margin: 5px;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d8eee4;
}

.not_aired {
    border: none;
    color: gray;
}

.watched {
    background-color: #d8eee4;
}

.name_jp {
    font-size: 0.6rem;
}
</style>