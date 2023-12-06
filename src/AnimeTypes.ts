interface ImageSet {
    large: string;
    common: string;
    medium: string;
    small: string;
}

interface Tag {
    name: string;
    count: number;
}

interface Rating {
    rank: number;
    total: number;
    score: number;
}

interface AnimeItem {
    id: number;
    name: string;
    name_cn: string;
    summary: string;
    date: string;
    eps: number;
    total_episodes: number;
    images: ImageSet;
    tags: Tag[]|undefined;
    rating: Rating|undefined;
}

interface AnimeState {
    anime_id: number;
    anime_item: AnimeItem;
    favorite: boolean;
    watched_episodes: number[];
    visibility: boolean;
}

interface Episode {
    id: number;
    name: string;
    name_cn: string;
    ep: number;
    airdate: string;
}

interface WatchList {
    title: string;
    archived: boolean;
    animes: number[];
}

interface AnimeSearchResult {
    date: string;
    id: number;
    image: string;
    name: string;
    name_cn: string;
    rank: number;
    score: number;
    summary: string;
    tags: Tag[];
    
}