<script setup lang="ts">
import { bangumiClient, getTokenConfig, httpClient } from '@/ApiHelper';
import { onMounted, reactive, ref, watch } from 'vue';
import AnimeItem from '@/components/AnimeItem.vue'
import AnimeStateItem from '@/components/AnimeStateItem.vue';
import { AxiosRequestConfig } from 'axios';
import { useRouter } from 'vue-router';

const props = defineProps({
    title: {
        type: String
    }
})

const router = useRouter()

let tokenConfig: AxiosRequestConfig | undefined = undefined
const loggedIn = ref(false)

const animes = reactive<number[]>([])
const animeStates = reactive<AnimeState[]>([])

const animeSearch = ref('')
const searchResults = reactive<AnimeSearchResult[]>([])

getTokenConfig().then((config) => {
    tokenConfig = config
    loggedIn.value = true
})

onMounted(() => {
    fetchWatchListContent()
})

watch(props, () => {
    fetchWatchListContent()
})

watch(animes, async (newAnimes) => {
    httpClient.post<AnimeState[]>(`/anime/get_anime_states`, {
        anime_ids: newAnimes
    }, tokenConfig).then((response) => {
        animeStates.splice(0, animeStates.length, ...response.data)
    })
})

function processAddAnime(id: number) {
    // get AnimeItem from bangumi
    processing.value = true
    bangumiClient.get<AnimeItem>('v0/subjects/' + id).then((ret) => {
        const item = ret.data
        // add to database
        httpClient.post('anime/insert_anime_item', item, tokenConfig).then(() => {
            httpClient.post('anime/add_item_to_watch_list', {
                anime_id: id,
                watch_list_name: props.title
            }, tokenConfig).then(() => {
                processing.value = false
                sb('Anime added to watch list')
                fetchWatchListContent()
            }).catch((err) => {
                processing.value = false
                console.log(err)
                sb('Failed to add anime to watch list')
            })
        }).catch((err) => {
            processing.value = false
            console.log(err)
            sb('Failed to add anime to database')
        })
    }).catch((err) => {
        processing.value = false
        console.log(err)
        sb('Failed to get anime info from bangumi')
    })
}

function fetchWatchListContent() {
    loading.value = true
    httpClient.get<WatchList>('/anime/get_watch_list',{
        params: {
            watch_list_name: props.title
        },
        ...tokenConfig
    }).then((response) => {
        animes.splice(0, animes.length, ...response.data.animes)
    }).finally(() => {
        loading.value = false
    })
}

function changeWatchedState(animeId: number, ep: number) {
    if (loggedIn.value) {
        const watched = animeStates.find((state) => state.anime_id === animeId)?.watched_episodes.includes(ep) ?? false
        const nowWatched = !watched
        httpClient.post('anime/update_episode_watched_state', {
            anime_id: animeId,
            ep: ep,
            watched: nowWatched
        }, tokenConfig).then(() => {
            if (nowWatched) {
                animeStates.find((state) => state.anime_id === animeId)?.watched_episodes.push(ep)
            } else {
                const index = animeStates.find((state) => state.anime_id === animeId)?.watched_episodes.indexOf(ep)
                if (index !== undefined && index !== -1) {
                    animeStates.find((state) => state.anime_id === animeId)?.watched_episodes.splice(index, 1)
                }
            }
        })
    }
}

function searchForAnime() {
    bangumiClient.post('v0/search/subjects', {
        keyword: animeSearch.value,
        filter: {
            'type': [2]
        }
    }).then((response) => {
        const data = response.data.data
        searchResults.splice(0, searchResults.length, ...data)
    })
}

function deleteWatchList() {
    httpClient.post('anime/delete_watch_list', { watch_list_name: props.title }, tokenConfig).then(() => {
        router.push({
            name: 'home',
        })
        window.location.reload()
    })
}

const showSnackBar = ref(false)
const snackBarMsg = ref('')
function sb(msg: string) {
    snackBarMsg.value = msg
    showSnackBar.value = true
}

const processing = ref(false)

const showAddAnimeDrawer = ref(false)

const showDetails = ref(true)

const loading = ref(true)

</script>

<template>
    <v-layout class="vertical">
        <v-toolbar>
            <v-toolbar-title>{{ title }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="showDetails = !showDetails">
                <v-icon v-if="showDetails">mdi-eye</v-icon>
                <v-icon v-else>mdi-eye-off</v-icon>
            </v-btn>
            <v-dialog width="500">
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </template>

                <template v-slot:default="{ isActive }">
                    <v-card title="Delete Watch List">
                        <v-card-text>
                            <p>Are you sure you want to delete this watch list?</p>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn @click="deleteWatchList">Yes</v-btn>
                            <v-btn @click="isActive.value = false">No</v-btn>
                        </v-card-actions>
                    </v-card>
                </template>

            </v-dialog>
            <v-btn icon @click="showAddAnimeDrawer = true">
                <v-icon>mdi-plus</v-icon>
            </v-btn>
        </v-toolbar>
    </v-layout>

    <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

    <v-navigation-drawer v-model="showAddAnimeDrawer" location="right" temporary width="500">
        <template #prepend>
            <v-layout class="horizontal mx-4 mt-2">
                <v-text-field v-model="animeSearch" label="Search Anime" class="mr-2 rounded-xl" focused></v-text-field>
                <v-btn icon @click="searchForAnime">
                    <v-icon>mdi-magnify</v-icon>
                    <input @keyup.enter="searchForAnime" type="hidden">
                </v-btn>
            </v-layout>
        </template>
        <v-list>
            <v-list-item v-for="result in searchResults" :key="result.id">
                <anime-item :name_cn="result.name_cn" :name="result.name" :image="result.image" :summary="result.summary"
                    :id="result.id" :rank="result.rank" :score="result.score" :contained="animes.includes(result.id)"
                    @add="processAddAnime(result.id)"></anime-item>
            </v-list-item>
        </v-list>
    </v-navigation-drawer>

    <!--Detailed View-->

    <v-list v-if="showDetails">
        <v-list-item v-for="animeState in animeStates" :key="animeState.anime_id">
            <AnimeStateItem :state="animeState" v-if="animeState.visibility"
                @change-watched-state="(ep) => changeWatchedState(animeState.anime_id, ep)" />
        </v-list-item>
    </v-list>

    <!--Compact View-->

    <v-list v-else>
        <v-list-item v-for="animeState in animeStates" :key="animeState.anime_id">
            <div class="d-flex">
                <a :href="'https://bangumi.tv/subject/' + animeState.anime_id" target="_blank" rel="noopener noreferrer"
                class="title_cn">{{ animeState.anime_item.name_cn }}</a>
                <span v-if="animeState.rating" class="ml-2" style="color:blue">{{ animeState.rating }} / 5</span>
            </div>
            <v-divider></v-divider>
        </v-list-item>
    </v-list>

    <v-snackbar v-model="showSnackBar" timeout="3000">
        {{ snackBarMsg }}
    </v-snackbar>
</template>