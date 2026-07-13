import type { NewsItem, SteamNewsRawItem } from './types';
import { CACHE_KEYS, CACHE_TTL, cacheGet, cacheSet } from './serverCache';

/**
 * Dota Pulse News Bot / AI Collector
 * 
 * Этот модуль реализует "пассивный" сбор новостей:
 * - Берёт официальные новости Valve через Steam Web API (GetNewsForApp)
 * - Очищает и структурирует данные
 * - При наличии LLM-ключа (GROQ_API_KEY или OPENAI_API_KEY) использует ИИ для генерации красивого заголовка, excerpt и полного описания на русском
 * - Назначает категорию и подходящее изображение
 *
 * Как это работает "пассивно":
 * - API /api/news вызывает эту функцию с кэшем (revalidate)
 * - Можно настроить Vercel Cron, который периодически "прогревает" кэш или вызывает refresh
 * - Для максимальной автономности: настроить cron на /api/cron/refresh-news
 */

const STEAM_NEWS_URL = 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/';

const HERO_IMAGES = {
  patch: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/earthshaker.png',
  tournament: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/juggernaut.png',
  hero: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/crystal_maiden.png',
  update: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/invoker.png',
  default: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png',
};

/**
 * Простая эвристика для категории
 */
function detectCategory(title: string, contents: string) {
  const text = (title + ' ' + contents).toLowerCase();
  if (text.includes('patch') || text.includes('баланс') || text.includes('update') || text.includes('7.')) {
    return 'Патч';
  }
  if (text.includes('ti') || text.includes('international') || text.includes('турнир') || text.includes('квалиф')) {
    return 'Турниры';
  }
  if (text.includes('hero') || text.includes('герой') || text.includes('аркан') || text.includes('скин')) {
    return 'Герои';
  }
  return 'Обновление';
}

/**
 * Пытается извлечь реальное изображение из HTML содержимого новости Steam
 */
function extractImageFromContents(contents: string) {
  if (!contents) return null;
  // Ищем <img src="..."> 
  const imgMatch = contents.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    let url = imgMatch[1];
    // Steam часто использует относительные или clan images; приводим к полному если нужно
    if (url.startsWith('//')) url = 'https:' + url;
    if (url.startsWith('/')) url = 'https://cdn.cloudflare.steamstatic.com' + url;
    // Пропускаем маленькие иконки/аватары если возможно
    if (url.includes('icon') || url.includes('avatar') || url.length < 50) return null;
    return url;
  }
  // Ищем {STEAM_CLAN_IMAGE} плейсхолдеры
  const clanMatch = contents.match(/\{STEAM_CLAN_IMAGE\}([a-f0-9\/]+)/i);
  if (clanMatch && clanMatch[1]) {
    return `https://clan.cloudflare.steamstatic.com/images/${clanMatch[1]}.png`;
  }
  return null;
}

/**
 * Выбирает изображение для новости: приоритет реальному из контента, затем по ключевым словам героя, затем по категории
 */
function getNewsImage(title: string, contents: string, category: string) {
  // 1. Пробуем реальное изображение из новости
  const realImage = extractImageFromContents(contents);
  if (realImage) return realImage;

  const text = (title + ' ' + contents).toLowerCase();

  // 2. По упоминанию конкретного героя (чтобы не всегда одни и те же)
  const heroKeywords = {
    pudge: 'pudge',
    earthshaker: 'earthshaker',
    juggernaut: 'juggernaut',
    'crystal maiden': 'crystal_maiden',
    invoker: 'invoker',
    antimage: 'antimage',
    axe: 'axe',
    sniper: 'sniper',
    'phantom assassin': 'phantom_assassin',
    'shadow fiend': 'nevermore',
    lina: 'lina',
    lion: 'lion',
    tidehunter: 'tidehunter',
  };
  for (const [keyword, heroFile] of Object.entries(heroKeywords)) {
    if (text.includes(keyword)) {
      return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroFile}.png`;
    }
  }

  // 3. По категории
  if (text.includes('patch') || text.includes('баланс') || category === 'Патч') return HERO_IMAGES.patch;
  if (text.includes('ti') || text.includes('international') || category === 'Турниры') return HERO_IMAGES.tournament;
  if (text.includes('hero') || text.includes('аркан') || category === 'Герои') return HERO_IMAGES.hero;
  if (text.includes('update') || category === 'Обновление') return HERO_IMAGES.update;
  return HERO_IMAGES.default;
}

/**
 * Очищает HTML и обрезает текст
 */
function cleanText(html: string, maxLength = 300) {
  if (!html) return '';
  // Убираем HTML теги и Steam плейсхолдеры изображений
  let text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{STEAM_CLAN_IMAGE\}[^\s]*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  return text;
}

/**
 * Использует ИИ (Groq / OpenAI) для генерации красивого контента на русском
 * Если ключа нет — возвращает базовую версию
 */
async function enrichWithAI(rawItem: SteamNewsRawItem): Promise<NewsItem> {
  const { title: rawTitle, contents, feedlabel, date } = rawItem;

  const category = detectCategory(rawTitle, contents);
  const baseExcerpt = cleanText(contents, 160);
  const baseFull = cleanText(contents, 800);

  // Пробуем реальную картинку из содержимого Steam новости
  let image = extractImageFromContents(contents);

  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  const isGroq = !!process.env.GROQ_API_KEY;

  if (!apiKey) {
    // Fallback без ИИ
    if (!image) {
      // Для фоллбэка тоже сделаем тематический поиск фото с интернета (loremflickr)
      const keywords = `${rawTitle} ${category} dota2`.substring(0, 100).replace(/,/g, ' ').trim();
      image = `https://loremflickr.com/800/450/${encodeURIComponent(keywords)}`;
    }
    return {
      id: rawItem.gid || Date.now(),
      title: rawTitle,
      date: new Date(date * 1000).toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      image,
      category,
      excerpt: baseExcerpt,
      fullContent: baseFull,
      externalLink: rawItem.url || 'https://www.dota2.com/news',
    };
  }

  // === ИИ-часть ===
  const systemPrompt = `Ты — умный редактор новостей Dota 2. 
Твоя задача — превратить сырую новость от Valve в красивый, информативный и дружелюбный пост на русском языке для сайта Dota Pulse.

Верни строго JSON в формате:
{
  "title": "Короткий привлекательный заголовок (до 70 символов)",
  "excerpt": "Краткое описание 1-2 предложения (до 160 символов)",
  "fullContent": "Полное описание новости 4-8 предложений. Можно использовать маркированные списки если уместно. На русском.",
  "image_search_query": "5-8 английских ключевых слов через запятую для поиска высококачественного релевантного фото или арта с интернета, например 'dota 2 7.37 patch notes fantasy illustration epic battle' или 'dota 2 international 2026 esports tournament crowd arena stage lights'. Сделай максимально описательным и по теме новости, чтобы фото было подходящим и красивым. Добавь 'high quality' или 'digital art' если уместно."
}

Сохраняй ключевые факты. Делай язык живым и экспертным. image_search_query должен быть на английском для хороших результатов поиска фото.`;

  const userPrompt = `Сырая новость:
Заголовок: ${rawTitle}
Содержание: ${contents.substring(0, 1200)}
Категория (примерная): ${category}
Источник: ${feedlabel || 'Valve'}`;

  try {
    const baseUrl = isGroq 
      ? 'https://api.groq.com/openai/v1/chat/completions' 
      : 'https://api.openai.com/v1/chat/completions';

    const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');

      if (response.status === 429) {
        await sleep(2000);
        const retryRes = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.6,
            max_tokens: 900,
            response_format: { type: "json_object" },
          }),
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryAiContent = JSON.parse(retryData.choices?.[0]?.message?.content || '{}');

          let retryImage = image;
          if (!retryImage && retryAiContent.image_search_query) {
            const keywords = (retryAiContent.image_search_query + ' dota2 game').replace(/,/g, ' ').trim();
            retryImage = `https://loremflickr.com/800/450/${encodeURIComponent(keywords)}`;
          }
          if (!retryImage) {
            retryImage = getNewsImage(rawTitle, contents, category);
          }

          return {
            id: rawItem.gid || Date.now(),
            title: retryAiContent.title || rawTitle,
            date: new Date(date * 1000).toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }),
            image: retryImage,
            category,
            excerpt: retryAiContent.excerpt || baseExcerpt,
            fullContent: retryAiContent.fullContent || baseFull,
            externalLink: rawItem.url || 'https://www.dota2.com/news',
          };
        }
      }

      throw new Error(`LLM request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    if (!image && aiContent.image_search_query) {
      const keywords = (aiContent.image_search_query + ' dota2 game').replace(/,/g, ' ').trim();
      image = `https://loremflickr.com/800/450/${encodeURIComponent(keywords)}`;
    }
    if (!image) {
      image = getNewsImage(rawTitle, contents, category);
    }

    return {
      id: rawItem.gid || Date.now(),
      title: aiContent.title || rawTitle,
      date: new Date(date * 1000).toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      image,
      category,
      excerpt: aiContent.excerpt || baseExcerpt,
      fullContent: aiContent.fullContent || baseFull,
      externalLink: rawItem.url || 'https://www.dota2.com/news',
    };
  } catch {
    return {
      id: rawItem.gid || Date.now(),
      title: rawTitle,
      date: new Date(date * 1000).toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      image: image || getNewsImage(rawTitle, contents, category),
      category,
      excerpt: baseExcerpt,
      fullContent: baseFull,
      externalLink: rawItem.url || 'https://www.dota2.com/news',
    };
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAndProcessNews(limit: number): Promise<NewsItem[]> {
  try {
    const params = new URLSearchParams({
      appid: '570',
      count: String(Math.min(limit, 10)),
      maxlength: '1200',
      format: 'json',
    });

    const fetchOptions: RequestInit = {
      cache: 'no-store',
      headers: {
        'User-Agent': 'DotaPulse/1.0 (https://github.com/kostya23ter11-ops/dotapulse)',
      },
    };

    const res = await fetch(`${STEAM_NEWS_URL}?${params.toString()}`, fetchOptions);

    if (!res.ok) throw new Error('Failed to fetch Steam news');

    const data = await res.json();
    const rawItems = data?.appnews?.newsitems || [];

    // Обрабатываем батчами по 3 для параллельной обработки с учётом rate limits Groq
    const processed: NewsItem[] = [];
    const BATCH_SIZE = 3;
    for (let i = 0; i < rawItems.length; i += BATCH_SIZE) {
      const batch = rawItems.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map((item: SteamNewsRawItem) => enrichWithAI(item)));
      processed.push(...batchResults);
      if (i + BATCH_SIZE < rawItems.length) {
        await sleep(1500); // 1.5s между батчами
      }
    }

    // Фильтруем совсем старые и дубликаты, гарантируем наличие картинки
    return processed
      .filter(item => item.title && item.excerpt)
      .map(item => ({
        ...item,
        image: item.image || HERO_IMAGES.default,
      }))
      .slice(0, limit);
  } catch {
    return getFallbackNews();
  }
}

export async function getLatestDotaNews(limit = 6, forceRefresh = false): Promise<NewsItem[]> {
  if (!forceRefresh) {
    const cached = await cacheGet<NewsItem[]>(CACHE_KEYS.newsLatest);
    if (cached?.length) {
      return cached.slice(0, limit);
    }
  }

  const news = await fetchAndProcessNews(limit);
  if (news.length > 0) {
    await cacheSet(CACHE_KEYS.newsLatest, news, CACHE_TTL.newsLatest);
  }
  return news;
}

/**
 * Фоллбэк, если Steam API недоступен
 */
function getFallbackNews(): NewsItem[] {
  return [
    {
      id: 1,
      title: 'Патч 7.41d: Новые механики и баланс',
      date: '4 июня 2026',
      image: HERO_IMAGES.patch,
      category: 'Патч',
      excerpt: 'Вышел крупный геймплейный патч 7.41d с изменениями в карте и героях.',
      fullContent: 'Valve выпустила патч 7.41d. Добавлены корректировки карты, баланс героев и исправления. Полные детали доступны на официальном сайте.',
      externalLink: 'https://www.dota2.com/patches/7.41d',
    },
    {
      id: 2,
      title: 'The International 2026: Квалификации в разгаре',
      date: '2 июня 2026',
      image: HERO_IMAGES.tournament,
      category: 'Турниры',
      excerpt: 'Открытые и региональные квалификации на главный турнир года идут полным ходом.',
      fullContent: 'Региональные квалификации TI2026 в самом разгаре. Следи за результатами и трансляциями на официальном сайте.',
      externalLink: 'https://www.dota2.com/news',
    },
    {
      id: 3,
      title: 'Обновления баланса и ролей',
      date: '1 июня 2026',
      image: HERO_IMAGES.hero,
      category: 'Герои',
      excerpt: 'Саппорты получили больше инструментов для контроля и золота.',
      fullContent: 'В последнем обновлении сильно изменился баланс между ролями. Саппорты теперь активнее участвуют в мидгейме.',
      externalLink: 'https://www.dota2.com/news',
    },
    {
      id: 4,
      title: 'Новая коллекция скинов и арокан',
      date: '30 мая 2026',
      image: HERO_IMAGES.update,
      category: 'Обновление',
      excerpt: 'Valve выпустила новые Immortal и Arcana для популярных героев.',
      fullContent: 'Доступна новая коллекция косметических предметов в Battle Pass TI2026.',
      externalLink: 'https://www.dota2.com/news',
    },
  ];
}
