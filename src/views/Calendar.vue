<script setup lang="ts">
import { AnimeViewModel } from '@/AnimeViewModel';
import dayjs from 'dayjs';
import CustomParseFormat from 'dayjs/plugin/customParseFormat';
import { reactive } from 'vue';

const viewModel = AnimeViewModel.getInstance();

dayjs.extend(CustomParseFormat)

let today = dayjs().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)

// get weekday starting from today
let weekdays = Array(7).fill(0).map((_, i) => {
    return dayjs().add(i, 'day').format('dddd')
})

let dates = Array(7).fill(0).map((_, i) => {
    return dayjs().add(i, 'day').format('MM/DD')
})

interface AirInfo {
    animeItem: AnimeItem,
    episode: Episode
}

let airCalendars = reactive<AirInfo[][]>(Array(7).fill(0).map(() => []))

viewModel.allAnimeStates.forEach((animeState) => {
    viewModel.getAnimeEpisodes(animeState.anime_item.id).then((episodes) => {
        episodes.forEach((episode) => {
            // if episode is aired in a week, add it to the calendar
            const airDate = dayjs(episode.airdate, 'YYYY-MM-DD')
            if (!airDate.isBefore(today) && airDate.isBefore(today.add(7, 'day'))) {
                let dayFromToday = airDate.diff(today, 'day')
                console.log(dayFromToday,airDate, animeState.anime_item.name_cn)
                airCalendars[dayFromToday].push({
                    animeItem: animeState.anime_item,
                    episode: episode
                })
                console.log(airCalendars)
            }
        })
    })
})

function openBangumi(anime_id: number) {
    window.open(`https://bangumi.tv/subject/${anime_id}`, '_blank');
}

const isMobile = window.innerWidth < 670

const wrapperClass = isMobile ? 'wrapper_m' : 'wrapper'

const dayClass = isMobile ? 'day_m' : 'day'

</script>

<template>
    <div :class="wrapperClass">
        <v-card :class="dayClass" v-for="(day,index) in weekdays" :key="day">
            <v-card-title>
                <div class="date">{{dates[index]}}</div>
                <div>{{day}}</div>
            </v-card-title>
            <v-card-text>
                <v-list>
                    <v-list-item class="ep" v-for="airInfo in airCalendars[index]" :key="airInfo.episode.id" @click="openBangumi(airInfo.animeItem.id)">
                        <v-tooltip bottom>
                            <template v-slot:activator="{ props }">
                                <v-list-item-content v-bind="props">
                                    <img class="image" :src="airInfo.animeItem.images.medium" />
                                </v-list-item-content>
                            </template>
                            <div>
                                <div>{{airInfo.animeItem.name_cn + "#" + airInfo.episode.ep}}</div>
                                <div>{{airInfo.episode.name}}</div>
                            </div>
                        </v-tooltip>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>
    </div>
</template>

<style scoped>

.wrapper {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: start;
    width: 100%;
    margin-top: 3%;
}

.wrapper_m {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin-top: 3%;
}

.ep:hover {
    background-color: #e0e0e0;
    cursor: pointer;
}

.day {
    width: 14%;
}

.day_m {
    width: 90%;
}

.image {
    width: 100%;
}

.date {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: -7%;
}

</style>