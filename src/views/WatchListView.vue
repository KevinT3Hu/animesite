<script setup lang="ts">
import { bangumiClient } from '@/ApiHelper';
import { reactive, ref } from 'vue';
import AnimeItem from '@/components/AnimeItem.vue'
import AnimeStateItem from '@/components/AnimeStateItem.vue';
import { useRouter } from 'vue-router';
import { AnimeViewModel } from '@/AnimeViewModel';
import { computed } from 'vue';

const props = defineProps({
    title: {
        type: String
    }
})

const viewModel = AnimeViewModel.getInstance()

const router = useRouter()

const animeStates = computed(()=>{
    return viewModel.allAnimes.get(props.title!!)!![1].map(id => {
        return viewModel.allAnimeStates.get(id)!!
    })
})

const animeSearch = ref('')
const searchResults = reactive<AnimeSearchResult[]>([])

function processAddAnime(id: number) {
    // get AnimeItem from bangumi
    processing.value = true
    viewModel.addAnime(id,props.title!!).finally(() => {
        processing.value = false
        showAddAnimeDrawer.value = false
    })
}

function changeWatchedState(animeId: number, ep: number) {
    viewModel.changeWatchedState(animeId, ep)
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
    viewModel.deleteWatchList(props.title!!).then(() => {
        router.push({
            name: 'home',
        })
        window.location.reload()
    })
}

function updateWatchListArchived() {
    viewModel.changeWatchListArchived(props.title!!).then(() => {
        router.push({
            name: 'home',
        })
        window.location.reload()
    })
}

const processing = ref(false)

const showAddAnimeDrawer = ref(false)

const showDetails = ref(true)

</script>

<template>
    <v-layout class="vertical">
        <v-toolbar>
            <v-toolbar-title>{{ title }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <div>
                <v-btn icon @click="updateWatchListArchived">
                    <v-icon>mdi-archive</v-icon>
                </v-btn>
                <v-btn icon @click="showDetails = !showDetails">
                    <v-icon v-if="showDetails">mdi-eye</v-icon>
                    <v-icon v-else>mdi-eye-off</v-icon>
                </v-btn>
                <v-dialog width="500">
                    <template v-slot:activator="{ props }">
                        <v-btn v-if="viewModel.loggedIn.value" icon v-bind="props">
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
                <v-btn v-if="viewModel.loggedIn.value" icon @click="showAddAnimeDrawer = true">
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
            </div>
        </v-toolbar>
    </v-layout>

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
                    :id="result.id" :rank="result.rank" :score="result.score" :contained="viewModel.allAnimes.get(props.title!!)!![1].includes(result.id)"
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
</template>