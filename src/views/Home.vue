<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import AnimeStateItem from '@/components/AnimeStateItem.vue';
import { AnimeViewModel } from '@/AnimeViewModel';
import { onMounted } from 'vue';

const animesToday = reactive<number[]>([]);

const episodesNotWatched = reactive<Map<number, Episode[]>>(new Map());

const viewModel = AnimeViewModel.getInstance();

const isLoading = ref(false)

onMounted(() => {
    loadData(viewModel.visibleAnimeStates.value);
});

watch(viewModel.visibleAnimeStates, (newValue) => {
    loadData(newValue);
});

function loadData(animeStates: Map<number, AnimeState>) {
    isLoading.value = true;
    animeStates.forEach((animeState) => {
        episodesNotWatched.clear()
        animesToday.splice(0, animesToday.length);
        viewModel.getAnimeEpisodes(animeState.anime_item.id).then((episodes) => {
            // update not watched
            const notWatched = episodes.filter((episode) => {
                return (!animeState.watched_episodes.includes(episode.ep)) && (new Date(episode.airdate) < new Date());
            });
            if (notWatched.length > 0) {
                episodesNotWatched.set(animeState.anime_id, notWatched);
            } else {
                episodesNotWatched.delete(animeState.anime_id);
            }
            // update animesToday
            const today = dayjs().format('YYYY-MM-DD');
            const todayEpisodes = episodes.filter((episode) => {
                return episode.airdate === today;
            });
            // clear animesToday and add new anime
            if (todayEpisodes.length > 0) {
                if (!animesToday.includes(animeState.anime_id)) {
                    animesToday.push(animeState.anime_id);
                }
            }
        }).finally(() => {
            isLoading.value = false;
        });
    });
}

function openBangumi(anime_id: number) {
    window.open(`https://bangumi.tv/subject/${anime_id}`, '_blank');
}

function changeWatchedState(animeId: number, ep: number) {
    viewModel.changeWatchedState(animeId, ep);
}

</script>

<template>
    <v-progress-linear v-if="isLoading" indeterminate></v-progress-linear>

    <div class="wrapper">
        <div class="today">
            <span class="title">Air Today</span>
            <div class="today_list">
                <div class="anime_card" v-for="animeId in animesToday" :key="animeId">
                    <img class="anime_img" :src="viewModel.allAnimeStates.get(animeId)?.anime_item.images.medium"
                        @click="openBangumi(animeId)" />
                    <span class="anime_name">{{ viewModel.allAnimeStates.get(animeId)?.anime_item.name_cn }}</span>
                </div>
            </div>
        </div>
        <span class="title">Not Watched</span>
        <div class="notwatched_list">
            <v-list>
                <v-list-item>
                    <AnimeStateItem class="anime_item" v-for="anime_id in episodesNotWatched.keys()" :key="anime_id"
                        :state="viewModel.allAnimeStates.get(anime_id)" :show-all="false"
                        @change-watched-state="(ep) => changeWatchedState(anime_id, ep)" />
                </v-list-item>
            </v-list>
        </div>
    </div>
</template>

<style scoped>
.skeleton {
    width: 90%;
    margin-top: 1rem;
    margin-left: 1rem;
    margin-right: 1rem;
}

.wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    margin-left: 10px;
    margin-right: 10px;
    overflow-x: hidden;
}

.today {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    margin-right: 10px;
}

.today_list {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

.anime_item {
    margin-bottom: 1rem;
}

.anime_card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    margin-right: 10px;
}

.anime_img {
    width: 150px;
    margin-left: 10px;
    margin-right: 10px;
}

.anime_img:hover {
    background-color: #e0e0e0;
    cursor: pointer;
}

.title {
    font-size: 35px;
    font-weight: bold;
    text-align: start;
}

.anime_name {
    font-size: 20px;
    text-align: center;
    text-overflow: ellipsis;
    max-width: 150px;
    max-lines: 1;
    line-clamp: 1;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.notwatched_list {
    display: flex;
    flex-direction: column;
}
</style>