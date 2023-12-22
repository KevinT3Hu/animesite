<script setup lang="ts">
import { bangumiClient, getTokenConfig, httpClient } from '@/ApiHelper';
import { onMounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import AnimeStateItem from '@/components/AnimeStateItem.vue';
import type { AxiosRequestConfig } from 'axios';

const animeStates = reactive<Map<number, AnimeState>>(new Map());

const allEpisodes = reactive<Episode[]>([]);

const isLoading = ref(true);

let tokenConfig: AxiosRequestConfig | undefined = undefined
const loggedIn = ref(false)

getTokenConfig().then((config) => {
    tokenConfig = config
    loggedIn.value = true
})


onMounted(() => {
    httpClient.get('/anime/all').then((response) => {
        const data = response.data as AnimeState[];
        data.forEach((animeState) => {
            animeStates.set(animeState.anime_id, animeState);
        });
        isLoading.value = false;
    });
});

const animesToday = reactive<number[]>([]);

const episodesNotWatched = reactive<Map<number, Episode[]>>(new Map());

watch(animeStates, (newValue) => {
    newValue.forEach((animeState) => {
        bangumiClient.get('/v0/episodes', {
            params: {
                subject_id: animeState.anime_id,
                type: 0
            }
        }).then((response) => {
            const data = response.data.data as Episode[];
            // clear allEpisodes and add new episodes
            allEpisodes.splice(0, allEpisodes.length, ...data);
            // update not watched
            const notWatched = data.filter((episode) => {
                return (!animeState.watched_episodes.includes(episode.ep)) && (new Date(episode.airdate) < new Date());
            });
            if (notWatched.length > 0) {
                episodesNotWatched.set(animeState.anime_id, notWatched);
            }
            
            // update animesToday
            const today = dayjs().format('YYYY-MM-DD');
            const todayEpisodes = data.filter((episode) => {
                return episode.airdate === today;
            });
            // clear animesToday and add new anime
            if (todayEpisodes.length > 0) {
                if (!animesToday.includes(animeState.anime_id)) {
                    animesToday.push(animeState.anime_id);
                }
            }
        });
    });
});

function openBangumi(anime_id: number) {
    window.open(`https://bangumi.tv/subject/${anime_id}`, '_blank');
}

function changeWatchedState(animeId: number, ep: number) {
    if(loggedIn.value){
        const watched = animeStates.get(animeId)?.watched_episodes.includes(ep) ?? false
        const nowWatched = !watched
        httpClient.post('anime/update_episode_watched_state', {
            anime_id: animeId,
            ep: ep,
            watched: nowWatched
        }, tokenConfig).then(() => {
            if(nowWatched){
                animeStates.get(animeId)?.watched_episodes.push(ep)
            }else{
                const index = animeStates.get(animeId)?.watched_episodes.indexOf(ep)
                if(index !== undefined && index !== -1){
                    animeStates.get(animeId)?.watched_episodes.splice(index,1)
                }
            }
        })
    }
}

</script>

<template>
    <v-progress-linear v-if="isLoading" indeterminate></v-progress-linear>
    <div class="wrapper">
        <div class="today">
            <span class="title">Air Today</span>
            <div class="today_list">
                <div class="anime_card" v-for="animeId in animesToday" :key="animeId">
                    <img class="anime_img" :src="animeStates.get(animeId)?.anime_item.images.medium"
                        @click="openBangumi(animeId)" />
                    <span class="anime_name">{{ animeStates.get(animeId)?.anime_item.name_cn }}</span>
                </div>
            </div>
        </div>
        <span class="title">Not Watched</span>
        <div class="notwatched_list">
            <v-list>
                <v-list-item>
                    <AnimeStateItem class="anime_item" v-for="anime_id in episodesNotWatched.keys()" :key="anime_id"
                        :state="animeStates.get(anime_id)" :show-all="false" @change-watched-state="(ep)=>changeWatchedState(anime_id,ep)"/>
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