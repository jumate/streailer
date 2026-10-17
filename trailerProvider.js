/**
 * TMDB Trailer Provider with YouTube Fallback
 * Flow: TMDB (user language) → YouTube Search (validated) → TMDB en-US
 * Returns Stremio-compatible Stream objects
 */

const fetch = require('node-fetch');

// TMDB API configuration
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = process.env.TMDB_KEY;
const DEFAULT_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Multi-language translations for trailer provider
 * Tier 1: Dubbing-centric markets + Tier 2: Strategic Expansion
 */
const TRANSLATIONS = {
    // === TIER 1: Indispensabili (Mercati doppiaggio-centrici) ===

    'en-US': {
        trailer: 'trailer',
        season: 'Season',
        numberWords: {
            1: ['1', 'one', 'first'],
            2: ['2', 'two', 'second'],
            3: ['3', 'three', 'third'],
            4: ['4', 'four', 'fourth'],
            5: ['5', 'five', 'fifth'],
            6: ['6', 'six', 'sixth'],
            7: ['7', 'seven', 'seventh'],
            8: ['8', 'eight', 'eighth'],
            9: ['9', 'nine', 'ninth'],
            10: ['10', 'ten', 'tenth'],
        }
    },
    'es-MX': {
        trailer: 'trailer español latino',
        season: 'Temporada',
        numberWords: {
            1: ['1', 'uno', 'primera', 'first', 'one'],
            2: ['2', 'dos', 'segunda', 'second', 'two'],
            3: ['3', 'tres', 'tercera', 'third', 'three'],
            4: ['4', 'cuatro', 'cuarta', 'fourth', 'four'],
            5: ['5', 'cinco', 'quinta', 'fifth', 'five'],
            6: ['6', 'seis', 'sexta', 'sixth', 'six'],
            7: ['7', 'siete', 'séptima', 'seventh', 'seven'],
            8: ['8', 'ocho', 'octava', 'eighth', 'eight'],
            9: ['9', 'nueve', 'novena', 'ninth', 'nine'],
            10: ['10', 'diez', 'décima', 'tenth', 'ten'],
        }
    },
    'pt-BR': {
        trailer: 'trailer dublado',
        season: 'Temporada',
        numberWords: {
            1: ['1', 'um', 'primeira', 'first', 'one'],
            2: ['2', 'dois', 'segunda', 'second', 'two'],
            3: ['3', 'três', 'terceira', 'third', 'three'],
            4: ['4', 'quatro', 'quarta', 'fourth', 'four'],
            5: ['5', 'cinco', 'quinta', 'fifth', 'five'],
            6: ['6', 'seis', 'sexta', 'sixth', 'six'],
            7: ['7', 'sete', 'sétima', 'seventh', 'seven'],
            8: ['8', 'oito', 'oitava', 'eighth', 'eight'],
            9: ['9', 'nove', 'nona', 'ninth', 'nine'],
            10: ['10', 'dez', 'décima', 'tenth', 'ten'],
        }
    },
    'pt-PT': {
        trailer: 'trailer português',
        season: 'Temporada',
        numberWords: {
            1: ['1', 'um', 'primeira', 'first', 'one'],
            2: ['2', 'dois', 'segunda', 'second', 'two'],
            3: ['3', 'três', 'terceira', 'third', 'three'],
            4: ['4', 'quatro', 'quarta', 'fourth', 'four'],
            5: ['5', 'cinco', 'quinta', 'fifth', 'five'],
            6: ['6', 'seis', 'sexta', 'sixth', 'six'],
            7: ['7', 'sete', 'sétima', 'seventh', 'seven'],
            8: ['8', 'oito', 'oitava', 'eighth', 'eight'],
            9: ['9', 'nove', 'nona', 'ninth', 'nine'],
            10: ['10', 'dez', 'décima', 'tenth', 'ten'],
        }
    },
    'de-DE': {
        trailer: 'trailer deutsch',
        season: 'Staffel',
        numberWords: {
            1: ['1', 'eins', 'erste', 'first', 'one'],
            2: ['2', 'zwei', 'zweite', 'second', 'two'],
            3: ['3', 'drei', 'dritte', 'third', 'three'],
            4: ['4', 'vier', 'vierte', 'fourth', 'four'],
            5: ['5', 'fünf', 'fünfte', 'fifth', 'five'],
            6: ['6', 'sechs', 'sechste', 'sixth', 'six'],
            7: ['7', 'sieben', 'siebte', 'seventh', 'seven'],
            8: ['8', 'acht', 'achte', 'eighth', 'eight'],
            9: ['9', 'neun', 'neunte', 'ninth', 'nine'],
            10: ['10', 'zehn', 'zehnte', 'tenth', 'ten'],
        }
    },
    'fr-FR': {
        trailer: 'bande annonce vf',
        season: 'Saison',
        numberWords: {
            1: ['1', 'un', 'première', 'first', 'one'],
            2: ['2', 'deux', 'deuxième', 'second', 'two'],
            3: ['3', 'trois', 'troisième', 'third', 'three'],
            4: ['4', 'quatre', 'quatrième', 'fourth', 'four'],
            5: ['5', 'cinq', 'cinquième', 'fifth', 'five'],
            6: ['6', 'six', 'sixième', 'sixth'],
            7: ['7', 'sept', 'septième', 'seventh', 'seven'],
            8: ['8', 'huit', 'huitième', 'eighth', 'eight'],
            9: ['9', 'neuf', 'neuvième', 'ninth', 'nine'],
            10: ['10', 'dix', 'dixième', 'tenth', 'ten'],
        }
    },
    'es-ES': {
        trailer: 'tráiler castellano',
        season: 'Temporada',
        numberWords: {
            1: ['1', 'uno', 'primera', 'first', 'one'],
            2: ['2', 'dos', 'segunda', 'second', 'two'],
            3: ['3', 'tres', 'tercera', 'third', 'three'],
            4: ['4', 'cuatro', 'cuarta', 'fourth', 'four'],
            5: ['5', 'cinco', 'quinta', 'fifth', 'five'],
            6: ['6', 'seis', 'sexta', 'sixth', 'six'],
            7: ['7', 'siete', 'séptima', 'seventh', 'seven'],
            8: ['8', 'ocho', 'octava', 'eighth', 'eight'],
            9: ['9', 'nueve', 'novena', 'ninth', 'nine'],
            10: ['10', 'diez', 'décima', 'tenth', 'ten'],
        }
    },
    'it-IT': {
        trailer: 'trailer ita',
        season: 'Stagione',
        numberWords: {
            1: ['1', 'uno', 'prima', 'first', 'one'],
            2: ['2', 'due', 'seconda', 'second', 'two'],
            3: ['3', 'tre', 'terza', 'third', 'three'],
            4: ['4', 'quattro', 'quarta', 'fourth', 'four'],
            5: ['5', 'cinque', 'quinta', 'fifth', 'five'],
            6: ['6', 'sei', 'sesta', 'sixth', 'six'],
            7: ['7', 'sette', 'settima', 'seventh', 'seven'],
            8: ['8', 'otto', 'ottava', 'eighth', 'eight'],
            9: ['9', 'nove', 'nona', 'ninth', 'nine'],
            10: ['10', 'dieci', 'decima', 'tenth', 'ten'],
        }
    },

    // === TIER 2: Espansione Strategica ===

    'ru-RU': {
        trailer: 'трейлер русский',
        season: 'Сезон',
        numberWords: {
            1: ['1', 'один', 'первый', 'first', 'one'],
            2: ['2', 'два', 'второй', 'second', 'two'],
            3: ['3', 'три', 'третий', 'third', 'three'],
            4: ['4', 'четыре', 'четвёртый', 'fourth', 'four'],
            5: ['5', 'пять', 'пятый', 'fifth', 'five'],
            6: ['6', 'шесть', 'шестой', 'sixth', 'six'],
            7: ['7', 'семь', 'седьмой', 'seventh', 'seven'],
            8: ['8', 'восемь', 'восьмой', 'eighth', 'eight'],
            9: ['9', 'девять', 'девятый', 'ninth', 'nine'],
            10: ['10', 'десять', 'десятый', 'tenth', 'ten'],
        }
    },
    'ja-JP': {
        trailer: '予告編 日本語',
        season: 'シーズン',
        numberWords: {
            1: ['1', '一', 'first', 'one'],
            2: ['2', '二', 'second', 'two'],
            3: ['3', '三', 'third', 'three'],
            4: ['4', '四', 'fourth', 'four'],
            5: ['5', '五', 'fifth', 'five'],
            6: ['6', '六', 'sixth', 'six'],
            7: ['7', '七', 'seventh', 'seven'],
            8: ['8', '八', 'eighth', 'eight'],
            9: ['9', '九', 'ninth', 'nine'],
            10: ['10', '十', 'tenth', 'ten'],
        }
    },
    'hi-IN': {
        trailer: 'ट्रेलर हिंदी',
        season: 'सीज़न',
        numberWords: {
            1: ['1', 'एक', 'पहला', 'first', 'one'],
            2: ['2', 'दो', 'दूसरा', 'second', 'two'],
            3: ['3', 'तीन', 'तीसरा', 'third', 'three'],
            4: ['4', 'चार', 'चौथा', 'fourth', 'four'],
            5: ['5', 'पाँच', 'पाँचवाँ', 'fifth', 'five'],
            6: ['6', 'छह', 'छठा', 'sixth', 'six'],
            7: ['7', 'सात', 'सातवाँ', 'seventh', 'seven'],
            8: ['8', 'आठ', 'आठवाँ', 'eighth', 'eight'],
            9: ['9', 'नौ', 'नौवाँ', 'ninth', 'nine'],
            10: ['10', 'दस', 'दसवाँ', 'tenth', 'ten'],
        }
    },
    'ta-IN': {
        trailer: 'டிரெய்லர் தமிழ்',
        season: 'சீசன்',
        numberWords: {
            1: ['1', 'ஒன்று', 'முதல்', 'first', 'one'],
            2: ['2', 'இரண்டு', 'இரண்டாம்', 'second', 'two'],
            3: ['3', 'மூன்று', 'மூன்றாம்', 'third', 'three'],
            4: ['4', 'நான்கு', 'நான்காம்', 'fourth', 'four'],
            5: ['5', 'ஐந்து', 'ஐந்தாம்', 'fifth', 'five'],
            6: ['6', 'ஆறு', 'ஆறாம்', 'sixth', 'six'],
            7: ['7', 'ஏழு', 'ஏழாம்', 'seventh', 'seven'],
            8: ['8', 'எட்டு', 'எட்டாம்', 'eighth', 'eight'],
            9: ['9', 'ஒன்பது', 'ஒன்பதாம்', 'ninth', 'nine'],
            10: ['10', 'பத்து', 'பத்தாம்', 'tenth', 'ten'],
        }
    },
    'tr-TR': {
        trailer: 'fragman türkçe',
        season: 'Sezon',
        numberWords: {
            1: ['1', 'bir', 'birinci', 'first', 'one'],
            2: ['2', 'iki', 'ikinci', 'second', 'two'],
            3: ['3', 'üç', 'üçüncü', 'third', 'three'],
            4: ['4', 'dört', 'dördüncü', 'fourth', 'four'],
            5: ['5', 'beş', 'beşinci', 'fifth', 'five'],
            6: ['6', 'altı', 'altıncı', 'sixth', 'six'],
            7: ['7', 'yedi', 'yedinci', 'seventh', 'seven'],
            8: ['8', 'sekiz', 'sekizinci', 'eighth', 'eight'],
            9: ['9', 'dokuz', 'dokuzuncu', 'ninth', 'nine'],
            10: ['10', 'on', 'onuncu', 'tenth', 'ten'],
        }
    },
    'pl-PL': {
        trailer: 'zwiastun polski',
        season: 'Sezon',
        numberWords: {
            1: ['1', 'jeden', 'pierwszy', 'first', 'one'],
            2: ['2', 'dwa', 'drugi', 'second', 'two'],
            3: ['3', 'trzy', 'trzeci', 'third', 'three'],
            4: ['4', 'cztery', 'czwarty', 'fourth', 'four'],
            5: ['5', 'pięć', 'piąty', 'fifth', 'five'],
            6: ['6', 'sześć', 'szósty', 'sixth', 'six'],
            7: ['7', 'siedem', 'siódmy', 'seventh', 'seven'],
            8: ['8', 'osiem', 'ósmy', 'eighth', 'eight'],
            9: ['9', 'dziewięć', 'dziewiąty', 'ninth', 'nine'],
            10: ['10', 'dziesięć', 'dziesiąty', 'tenth', 'ten'],
        }
    },
    'nl-NL': {
        trailer: 'trailer nederlands',
        season: 'Seizoen',
        numberWords: {
            1: ['1', 'een', 'eerste', 'first', 'one'],
            2: ['2', 'twee', 'tweede', 'second', 'two'],
            3: ['3', 'drie', 'derde', 'third', 'three'],
            4: ['4', 'vier', 'vierde', 'fourth', 'four'],
            5: ['5', 'vijf', 'vijfde', 'fifth', 'five'],
            6: ['6', 'zes', 'zesde', 'sixth', 'six'],
            7: ['7', 'zeven', 'zevende', 'seventh', 'seven'],
            8: ['8', 'acht', 'achtste', 'eighth', 'eight'],
            9: ['9', 'negen', 'negende', 'ninth', 'nine'],
            10: ['10', 'tien', 'tiende', 'tenth', 'ten'],
        }
    },
    'hu-HU': {
        trailer: 'előzetes magyar',
        season: 'Évad',
        numberWords: {
            1: ['1', 'egy', 'első', 'first', 'one'],
            2: ['2', 'kettő', 'második', 'second', 'two'],
            3: ['3', 'három', 'harmadik', 'third', 'three'],
            4: ['4', 'négy', 'negyedik', 'fourth', 'four'],
            5: ['5', 'öt', 'ötödik', 'fifth', 'five'],
            6: ['6', 'hat', 'hatodik', 'sixth', 'six'],
            7: ['7', 'hét', 'hetedik', 'seventh', 'seven'],
            8: ['8', 'nyolc', 'nyolcadik', 'eighth', 'eight'],
            9: ['9', 'kilenc', 'kilencedik', 'ninth', 'nine'],
            10: ['10', 'tíz', 'tizedik', 'tenth', 'ten'],
        }
    },
};

// Helper to get translation with fallback to English
function getTranslation(language) {
    return TRANSLATIONS[language] || TRANSLATIONS['en-US'];
}

/**
 * Convert IMDb ID to TMDB ID and get title in specified language
 */
async function imdbToTmdbWithLanguage(imdbId, type, language) {
    if (!TMDB_KEY) return null;

    try {
        const url = `${TMDB_BASE}/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id&language=${language}`;
        const response = await fetchWithTimeout(url);
        const data = await response.json();

        const results = type === 'series' ? data.tv_results : data.movie_results;
        if (results && results.length > 0) {
            const item = results[0];
            const title = item.title || item.name || '';
            return { id: item.id, title };
        }
    } catch (e) {
        console.error('[TrailerProvider] Error converting IMDb to TMDB:', e);
    }

    return null;
}

/**
 * Fetch videos from TMDB for a movie, TV series, or season
 */
async function fetchTMDBVideos(tmdbId, type, language, season) {
    if (!TMDB_KEY) return [];

    try {
        let url;
        if (type === 'series' && season !== undefined && season > 0) {
            url = `${TMDB_BASE}/tv/${tmdbId}/season/${season}/videos?api_key=${TMDB_KEY}&language=${language}`;
        } else {
            const mediaType = type === 'series' ? 'tv' : 'movie';
            url = `${TMDB_BASE}/${mediaType}/${tmdbId}/videos?api_key=${TMDB_KEY}&language=${language}`;
        }
        const response = await fetchWithTimeout(url);
        const data = await response.json();

        return data.results || [];
    } catch (e) {
        console.error('[TrailerProvider] Error fetching TMDB videos:', e);
        return [];
    }
}

// ===== Selección del mejor tráiler (idioma + calidad) =====
// TRAILER_BEST=0 restaura el comportamiento antiguo (TMDB primero, YouTube solo si TMDB no tiene nada)
const BEST_MODE = process.env.TRAILER_BEST !== '0';
// Puntos que recibe un vídeo de TMDB por venir ya filtrado en el idioma pedido.
// Súbelo si prefieres que TMDB gane más a menudo; bájalo para favorecer YouTube.
const TMDB_LANG_BASE = 15;

const FOREIGN_MARKERS = /\b(italiano|deutsch|german|fran[cç]ais|francais|vostfr|portugu[eê]s|dublado|legendado)\b/i;

function qualityScore(text) {
    if (/\b(4k|2160p|uhd)\b/i.test(text || '')) return 12;
    if (/\b(1080p|full hd|hd)\b/i.test(text || '')) return 8;
    if (/\b720p\b/i.test(text || '')) return 4;
    return 0;
}

// Bonus/penalización según el idioma del título del vídeo (solo español; el resto devuelve 0)
function languageScore(title, language) {
    const t = title || '';
    let s = 0;
    if (language === 'es-ES') {
        if (/latino|latinoam[eé]rica/i.test(t)) s += 12;
        else if (/\b(espa[ñn]ol|castellano|doblad[oa])\b/i.test(t)) s += 30;
    } else if (language === 'es-MX') {
        if (/latino|latinoam[eé]rica|mexic/i.test(t)) s += 30;
        else if (/\b(espa[ñn]ol|castellano|doblad[oa])\b/i.test(t)) s += 12;
    } else {
        return 0;
    }
    if (FOREIGN_MARKERS.test(t)) s -= 40;
    return s;
}

// Puntuación de un vídeo de TMDB (sin el bonus de idioma). TMDB sí publica "size" (360/720/1080...),
// aunque no siempre es fiable.
function scoreTmdbVideo(video) {
    const typeScore = { Trailer: 5, Teaser: 0, Clip: -15 };
    const size = Number(video.size) || 0;
    const sizeScore = size >= 2160 ? 12 : size >= 1080 ? 8 : size >= 720 ? 4 : 0;
    return (typeScore[video.type] ?? -15) +
        (video.official ? 20 : 0) +
        Math.max(sizeScore, qualityScore(video.name));
}

/**
 * Select the best trailer from a list of TMDB videos
 */
function selectBestTrailer(videos) {
    if (!videos || videos.length === 0) return null;

    const youtubeVideos = videos.filter(v => v.site === 'YouTube');
    if (youtubeVideos.length === 0) return null;

    return youtubeVideos
        .map((video, index) => ({ video, index, score: scoreTmdbVideo(video) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)[0].video;
}

// Caché en memoria: evita repetir scraping de YouTube por cada petición de Stremio
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;      // resultados buenos
const CACHE_SHORT_TTL_MS = 30 * 60 * 1000;         // fallback inglés (por si YouTube falló un momento)
const CACHE_MAX = 2000;
const trailerCache = new Map();

function cacheGet(key) {
    const hit = trailerCache.get(key);
    if (!hit) return null;
    if (hit.expires < Date.now()) {
        trailerCache.delete(key);
        return null;
    }
    return hit.value;
}

function cacheSet(key, value, ttl) {
    if (trailerCache.size >= CACHE_MAX) {
        trailerCache.delete(trailerCache.keys().next().value);
    }
    trailerCache.set(key, { value, expires: Date.now() + ttl });
}

// Normaliza para comparar: minúsculas, sin acentos ni signos, espacios colapsados (vale para cualquier alfabeto)
function normalizeForMatch(text) {
    return (text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Quita subtítulos entre paréntesis/corchetes: "Sleepy Hollow (El Jinete sin Cabeza)" -> "Sleepy Hollow"
function primaryTitle(name) {
    const cleaned = (name || '').replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').replace(/\s+/g, ' ').trim();
    return cleaned || (name || '');
}

// Variantes aceptables del título: el completo y el principal sin paréntesis
function titleVariants(name) {
    const variants = new Set();
    const full = normalizeForMatch(name);
    if (full) variants.add(full);
    const main = normalizeForMatch(primaryTitle(name));
    if (main.length >= 3) variants.add(main);
    return [...variants];
}

/**
 * Validate YouTube video title against expected content
 * Uses language-specific validation
 */
function validateYouTubeTitle(videoTitle, contentName, season, language = 'en-US') {
    const titleNorm = normalizeForMatch(videoTitle);

    // Must contain the content name (movie/series title), full or without parenthetical subtitle
    if (!titleMatches(titleNorm, contentName)) {
        return false;
    }
    return true;
}

function titleMatches(titleNorm, contentName) {
    return titleVariants(contentName).some(v => titleNorm.includes(v));
}

/**
 * Search YouTube using HTML scraping
 */
async function searchYouTubeScraping(query, language = 'en-US') {
    try {
        const [lang, country] = language.split('-');
        const encodedQuery = encodeURIComponent(query);        
        const url = `https://www.youtube.com/results?search_query=${encodedQuery}&gl=${country || 'US'}&hl=${lang || 'en'}`;

        console.log(`[TrailerProvider] YouTube scraping search: ${query}`);

        const response = await fetchWithTimeout(url, {
            headers: {
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                 'Accept-Language': `${lang}-${country || 'US'},${lang};q=0.9,en;q=0.8`,
                 'Cookie': `PREF=hl=${lang}&gl=${country || 'US'}; CONSENT=YES+`
            }
        });

        if (response.status !== 200) {
            console.log('[TrailerProvider] YouTube scraping failed:', response.status);
            return [];
        }

        const html = await response.text();

        // YouTube devuelve varios videoRenderer; analizamos candidatos, no solo el primero.
        const rendererMarker = /"videoRenderer":\s*\{/g;
        const starts = [];
        let marker;
        while ((marker = rendererMarker.exec(html)) !== null) {
            starts.push(marker.index + marker[0].length - 1);
        }
        if (starts.length === 0) {
            console.log('[TrailerProvider] No video ID found in YouTube HTML');
            return [];
        }

        const results = [];
        const decodeText = value => value
            .replace(/\\u0026/g, '&')
            .replace(/\\u003c/g, '<')
            .replace(/\\u003e/g, '>')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');

        for (let i = 0; i < starts.length; i++) {
            const block = html.slice(starts[i], starts[i + 1] || html.length);
            const idMatch = block.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            if (!idMatch) continue;

            const titleMatch = block.match(/"title":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"((?:\\.|[^"\\])*)"/) ||
                block.match(/"title":\s*\{\s*"simpleText":\s*"((?:\\.|[^"\\])*)"/);
            if (!titleMatch) continue;

            const title = decodeText(titleMatch[1]);
            const channelMatch = block.match(/"ownerText":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"((?:\\.|[^"\\])*)"/);
            const channel = channelMatch ? decodeText(channelMatch[1]) : '';
            const combined = `${title} ${channel}`;
            let score = 0;
            if (/\b(official|warner bros|sony pictures|paramount pictures|universal pictures|20th century studios|disney|netflix)\b/i.test(combined)) score += 20;
            if (/\b(4k|2160p)\b/i.test(title)) score += 12;
            else if (/\b(1080p|full hd|hd)\b/i.test(title)) score += 8;
            if (/\b(trailer|official trailer|teaser)\b/i.test(title)) score += 5;
            if (/\b(clip|fan made|reaction|review|recap|gameplay)\b/i.test(title)) score -= 15;

            results.push({ ytId: idMatch[1], title, channel, score });
            if (results.length >= 20) break;
        }

        if (results.length === 0) {
            console.log('[TrailerProvider] Could not extract YouTube results');
            return [];
        }

        results.sort((a, b) => b.score - a.score);
        console.log(`[TrailerProvider] YouTube scraping found ${results.length} candidate(s); best: "${results[0].title}" (${results[0].ytId})`);
        return results;

    } catch (e) {
        console.error('[TrailerProvider] YouTube scraping error:', e);
        return [];
    }
}


/**
 * Search YouTube for a trailer and return video ID + title if valid
 */
async function searchYouTubeTrailer(contentName, type, season, language = 'en-US') {
    const t = getTranslation(language);

    // Build localized search query
    let query;
    if (type === 'series' && season !== undefined && season > 0) {
        query = `${primaryTitle(contentName)} ${t.season} ${season} ${t.trailer}`;
    } else {
        query = `${primaryTitle(contentName)} ${t.trailer}`;
    }

    console.log(`[TrailerProvider] YouTube search (${language}): ${query}`);

    const results = await searchYouTubeScraping(query, language);
    const validResults = results.filter(result =>
        validateYouTubeTitle(result.title, contentName, season, language)
    );
    if (validResults.length === 0) {
        console.log(`[TrailerProvider] No YouTube result matched "${contentName}"; first candidates:`);
        results.slice(0, 3).forEach(r => console.log(`[TrailerProvider]   - "${r.title}" (${r.ytId})`));
        return null;
    }

    // result.score ya incluye canal oficial, calidad (HD/4K) y penalizaciones; aquí solo
    // se añade el idioma y que el título empiece por el nombre buscado.
    const scoreCandidate = result => {
        let score = result.score || 0;
        const titleNorm = normalizeForMatch(result.title);
        if (titleVariants(contentName).some(v => titleNorm.startsWith(v))) score += 10;
        score += languageScore(result.title, language);
        return score;
    };
    validResults.forEach(r => { r.finalScore = scoreCandidate(r); });
    validResults.sort((a, b) => b.finalScore - a.finalScore);
    validResults.slice(0, 3).forEach(r =>
        console.log(`[TrailerProvider]   YouTube candidate ${r.finalScore}: "${r.title}" (${r.ytId})`));
    console.log(`[TrailerProvider] YouTube result accepted: "${validResults[0].title}"`);
    return { ...validResults[0], score: validResults[0].finalScore };
}

/**
 * Get trailer streams for a movie or TV series
 * Flow: TMDB (user language) → YouTube scraping (localized) → TMDB en-US
 * Note: Recaps are now handled by recapProvider.js
 */
async function getTrailerStreams(type, imdbId, contentName, season, tmdbId, language = process.env.DEFAULT_LANGUAGE || 'es-ES', useExternalLink = false) {
    if (!TMDB_KEY) {
        console.warn('[TrailerProvider] TMDB_KEY not set, skipping trailer fetch');
        return [];
    }

    const t = getTranslation(language);
    const isEnglish = language.startsWith('en');

    try {
        const cacheKey = `${type}:${imdbId || tmdbId}:${season || 0}:${language}`;
        let tmdbIdNum;
        let contentTitle = contentName || '';
        let trailerResult = cacheGet(cacheKey);

        if (trailerResult) {
            console.log(`[TrailerProvider] Cache hit ${cacheKey}: ${trailerResult.ytId} (${trailerResult.source})`);
        } else {
            // Get TMDB ID and title
            if (tmdbId) {
                // TMDB ID provided directly
                tmdbIdNum = tmdbId;
                // Fetch title from TMDB if not provided
                if (!contentTitle) {
                    const mediaType = type === 'series' ? 'tv' : 'movie';
                    try {
                        const url = `${TMDB_BASE}/${mediaType}/${tmdbId}?api_key=${TMDB_KEY}&language=${language}`;
                        const response = await fetchWithTimeout(url);
                        const data = await response.json();
                        contentTitle = data.title || data.name || '';
                    } catch (e) {
                        console.log(`[TrailerProvider] Could not fetch title for TMDB ${tmdbId}`);
                    }
                }
            } else if (imdbId) {
                // IMDb ID - convert to TMDB
                const tmdbResult = await imdbToTmdbWithLanguage(imdbId, type, language);
                if (!tmdbResult) {
                    console.log(`[TrailerProvider] Could not find TMDB ID for ${imdbId}`);
                    return [];
                }
                tmdbIdNum = tmdbResult.id;
                if (!contentTitle) {
                    contentTitle = tmdbResult.title;
                }
            } else {
                console.log('[TrailerProvider] No valid ID provided');
                return [];
            }


            // === STEP 1: TMDB in user's language ===
            console.log(`[TrailerProvider] Step 1: Trying TMDB ${language} for "${contentTitle}"`);

            let videos = [];

            if (type === 'series' && season !== undefined && season > 0) {
                videos = await fetchTMDBVideos(tmdbIdNum, type, language, season);
                if (!videos || videos.length === 0) {
                    videos = await fetchTMDBVideos(tmdbIdNum, type, language);
                }
            } else {
                videos = await fetchTMDBVideos(tmdbIdNum, type, language);
            }

            let tmdbCandidate = null;
            const tmdbLangTrailer = selectBestTrailer(videos);
            if (tmdbLangTrailer) {
                console.log(`[TrailerProvider] ✓ TMDB ${language} candidate: ${tmdbLangTrailer.name} (${tmdbLangTrailer.key})`);
                tmdbCandidate = {
                    ytId: tmdbLangTrailer.key,
                    title: type === 'series' && season ? `${contentTitle} ${t.season} ${season}` : contentTitle,
                    source: 'tmdb-lang',
                    score: TMDB_LANG_BASE + scoreTmdbVideo(tmdbLangTrailer)
                };
            }

            // === STEP 2: YouTube scraping (siempre en modo "mejor"; solo como fallback en modo antiguo) ===
            let ytCandidate = null;
            if (BEST_MODE || !tmdbCandidate) {
                console.log(`[TrailerProvider] Step 2: Trying YouTube (${language}) for "${contentTitle}"`);
                const ytResult = await searchYouTubeTrailer(contentTitle, type, season, language);
                if (ytResult) {
                    ytCandidate = {
                        ytId: ytResult.ytId,
                        title: ytResult.title,
                        source: 'youtube',
                        score: ytResult.score
                    };
                }
            }

            // Elegir el mejor; en empate gana TMDB
            const finalists = [tmdbCandidate, ytCandidate].filter(Boolean)
                .sort((x, y) => y.score - x.score || (x.source === 'tmdb-lang' ? -1 : 1));
            finalists.forEach(c =>
                console.log(`[TrailerProvider]   finalist ${c.source}: score ${c.score} (${c.ytId})`));
            trailerResult = finalists[0] || null;
        }

        // === STEP 3: TMDB English Fallback ===
        if (!trailerResult && !isEnglish) {
            console.log(`[TrailerProvider] Step 3: Trying TMDB en-US for "${contentTitle}"`);

            let enVideos = [];

            if (type === 'series' && season !== undefined && season > 0) {
                enVideos = await fetchTMDBVideos(tmdbIdNum, type, 'en-US', season);
                if (!enVideos || enVideos.length === 0) {
                    enVideos = await fetchTMDBVideos(tmdbIdNum, type, 'en-US');
                }
            } else {
                enVideos = await fetchTMDBVideos(tmdbIdNum, type, 'en-US');
            }

            const tmdbEnTrailer = selectBestTrailer(enVideos);
            if (tmdbEnTrailer) {
                console.log(`[TrailerProvider] ✓ Found TMDB en-US trailer: ${tmdbEnTrailer.name}`);
                trailerResult = {
                    ytId: tmdbEnTrailer.key,
                    title: type === 'series' && season ? `${contentTitle} ${t.season} ${season}` : contentTitle,
                    source: 'tmdb-en'
                };
            }
        }

        if (trailerResult && !cacheGet(cacheKey)) {
            cacheSet(cacheKey, trailerResult, trailerResult.source === 'tmdb-en' ? CACHE_SHORT_TTL_MS : CACHE_TTL_MS);
        }

        // No trailer found
        if (!trailerResult) {
            console.log(`[TrailerProvider] ✗ No trailer found for ${imdbId}`);
            return [];
        }

        // Build stream name based on source
        let streamName;
        switch (trailerResult.source) {
            case 'tmdb-lang':
                streamName = '🎬 Trailer';
                break;
            case 'youtube':
                streamName = '🎬▶️ Trailer';
                break;
            case 'tmdb-en':
                streamName = '🎬🇬🇧 Trailer';
                break;
            default:
                streamName = '🎬 Trailer';
        }

        // Add external link indicator if enabled
        if (useExternalLink) {
            streamName = '🔗 ' + streamName;
        }

        console.log(`[TrailerProvider] Final: ${streamName} | ${trailerResult.title} (${trailerResult.source})${useExternalLink ? ' [External]' : ''}`);

        const trailerStream = {
            name: streamName,
            title: trailerResult.title,
            behaviorHints: {
                notWebReady: true,
                bingeGroup: 'trailer'
            }
        };

        // Use externalUrl for external app, or ytId for internal player
        if (useExternalLink) {
            trailerStream.externalUrl = `https://www.youtube.com/watch?v=${trailerResult.ytId}`;
        } else {
            trailerStream.ytId = trailerResult.ytId;
        }

        return [trailerStream];

    } catch (e) {
        console.error('[TrailerProvider] Error getting trailer streams:', e);
        return [];
    }
}

/**
 * Check if trailer provider is available
 */
function isTrailerProviderAvailable() {
    return !!TMDB_KEY;
}

module.exports = {
    getTrailerStreams,
    isTrailerProviderAvailable,
    imdbToTmdbWithLanguage
};
