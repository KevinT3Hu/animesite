<script setup lang="ts">
import { AnimeViewModel } from '@/AnimeViewModel';
import { useClipboard } from '@vueuse/core';
import { reactive, type PropType, onMounted, computed, ref } from 'vue';

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

const viewModel = AnimeViewModel.getInstance()

const { copy } = useClipboard()

const episodes = reactive<Episode[]>([])
const rating = ref<number>(props.state.rating ?? 0)

const episodesToShow = computed(() => {
    if (props.showAll) {
        return episodes
    } else {
        let showedEpisodes: Episode[] = []
        let containOne = true
        episodes.forEach((episode) => {
            if (!episodeWatched(episode.ep)) {
                if (episodeAired(episode.airdate)) {
                    showedEpisodes.push(episode)
                } else if (containOne) {
                    showedEpisodes.push(episode)
                    containOne = false
                }
            }
        })
        return showedEpisodes
    }
})

onMounted(() => {
    viewModel.getAnimeEpisodes(props.state.anime_item.id).then((res) => {
        episodes.splice(0, episodes.length, ...res)
    })
})

function episodeWatched(ep: number) {
    return props.state.watched_episodes.includes(ep) ?? false
}

function episodeAired(date: string) {
    return new Date(date) < new Date()
}

function changeWatchedState(ep: number, date: string) {
    if (episodeAired(date)) {
        viewModel.changeWatchedState(props.state.anime_item.id, ep)
    }
}

function changeVisibility(visibility: boolean) {
    viewModel.changeVisibility(props.state.anime_item.id, visibility)
}

const ratingProcessing = ref(false)

function updateRating() {
    ratingProcessing.value = true
    viewModel.updateRating(props.state.anime_item.id, rating.value).then(() => {
        ratingProcessing.value = false
        showRatingDialog.value = false
    })
}

function copyTitle() {
    copy(props.state.anime_item.name_cn)
}

const showRatingDialog = ref(false)

function showRating() {
    showRatingDialog.value = true
}

const anime_name_primary = computed(() => {
    return props.state.anime_item.name_cn === "" ? props.state.anime_item.name : props.state.anime_item.name_cn
})

</script>

<template>
    <div class="s_wrapper">
        <img class="image" :src="state.anime_item.images.common" />
        <div class="anime_content">
            <div class="title_bar">
                <div class="title_wrapper">
                    <a :href="'https://bangumi.tv/subject/' + state.anime_item.id" target="_blank"
                        rel="noopener noreferrer" class="title_cn">{{ anime_name_primary }}</a>
                    <v-btn variant="text" icon="mdi-content-copy" @click="copyTitle" class="h-25"></v-btn>
                    <span v-if="state.rating" class="ml-2" style="color:blue">{{ state.rating }} / 5</span>
                </div>
                <div v-if="viewModel.loggedIn.value" class="anime_actions">
                    <v-btn icon @click="changeVisibility(!state.visibility)">
                        <v-icon>{{ state.visibility ? 'mdi-archive' : 'mdi-unarchive' }}</v-icon>
                    </v-btn>
                    <v-btn icon @click="showRating">
                        <v-icon>mdi-thumbs-up-down</v-icon>
                    </v-btn>
                </div>
            </div>

            <p>{{ state.anime_item.name }}</p>
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
            <p>{{ state.anime_item.summary }}</p>
        </div>
    </div>

    <v-divider class="mt-2 mb-2"></v-divider>

    <v-dialog width="500" v-model="showRatingDialog">
        <v-card>
            <v-card-title>Rating {{ state.anime_item.name_cn }}</v-card-title>
            <v-card-text class="d-flex justify-center">
                <v-rating v-model="rating" active-color="primary"></v-rating>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="showRatingDialog = false">Cancel</v-btn>
                <v-btn @click="updateRating" :loading="ratingProcessing">OK</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
    @import "./AnimeStateItem.scss";

.s_wrapper {
    flex-direction: row;
}
</style>