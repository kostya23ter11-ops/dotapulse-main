# DotaPulse

**DotaPulse** — аналитическая платформа для игроков Dota 2: мета, сборки, профили, новости и AI-помощник.

## Функционал

| Раздел | Описание |
|--------|----------|
| **Главная** | Популярные герои по рангам, карусель новостей, поиск игрока |
| **Мета** (`/meta`) | Винрейт и пикрейт всех героев из OpenDota, фильтры по ролям |
| **Сборки** (`/builds`) | Билды ~127 героев: предметы, скиллы, таланты |
| **Лидерборд** (`/leaderboard`) | Рейтинг героев по рангам + про-игроки |
| **Обновления** (`/updates`) | История патчей из OpenDota |
| **Профиль** (`/players/[id]`) | Steam ID → матчи, KDA, топ героев, ранг |
| **AI-помощник** | Чат с контекстом меты (Groq / OpenAI), fallback без ключа |
| **Steam Login** | OpenID + JWT-сессия в httpOnly cookie |
| **i18n** | Русский и английский |

При недоступности API используются локальные fallback-данные — сайт не падает.

## Технологии

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **OpenDota API**, **Steam Web API**, локальные JSON-данные
- **Auth**: Steam OpenID + JWT (`jose`)
- **Кэш / rate limit**: Upstash Redis / Vercel KV (`@upstash/redis`) с in-memory fallback для dev
- **Стили**: CSS Modules, glassmorphism, canvas-эффекты
- **Тесты**: Jest (66 тестов)

## Быстрый старт

```bash
npm install
npm run setup:env            # создаёт .env.local + генерирует AUTH_SECRET и CRON_SECRET
npm run setup:env:vercel     # то же + пушит секреты на Vercel
npm run check:env            # проверка переменных
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000).

### Скрипты

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production-сборка |
| `npm run start` | Запуск собранного приложения |
| `npm run typecheck` | Проверка TypeScript |
| `npm test` | Jest-тесты |
| `npm run lint` | ESLint |

## Переменные окружения

Полный список — в [`.env.example`](.env.example).

### Обязательные для продакшена

| Переменная | Назначение |
|------------|------------|
| `AUTH_SECRET` | Секрет для JWT (≥32 символов). Без него Steam Login не работает |
| `NEXT_PUBLIC_BASE_URL` | Точный URL сайта с `https://` — критично для Steam OpenID |

Сгенерировать `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### Рекомендуемые

| Переменная | Назначение |
|------------|------------|
| `STEAM_API_KEY` | Имена и аватары игроков ([получить ключ](https://steamcommunity.com/dev/apikey)) |
| `GROQ_API_KEY` | AI для новостей и чата ([бесплатный ключ](https://console.groq.com/keys)) |
| `CRON_SECRET` | Защита эндпоинта `/api/cron/refresh-news` |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Vercel KV — общий кэш и rate limit между инстансами |

Альтернатива KV: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.

Без Redis/KV проект работает локально через in-memory fallback. На Vercel без KV rate limit и кэш не разделяются между serverless-инстансами.

## Деплой на Vercel

1. Импортируй проект в [Vercel](https://vercel.com/new).
2. Запусти `npm run setup:env:vercel` — сгенерирует `AUTH_SECRET`, `CRON_SECRET` и задаст `NEXT_PUBLIC_BASE_URL=https://dotapulse-main.vercel.app`.
3. Вручную добавь в Vercel → Settings → Environment Variables: `STEAM_API_KEY`, `GROQ_API_KEY`.
4. (Рекомендуется) Подключи **Vercel KV**: Storage → Create → KV — `KV_REST_API_*` подставятся автоматически.
5. `npm run deploy` (или Redeploy в дашборде).

### Steam Login: «перекидывает на чужой сайт»

Причина — неверный `NEXT_PUBLIC_BASE_URL`.

1. Vercel → Settings → Environment Variables
2. Укажи **твой** production URL с `https://`, без слэша в конце
3. Redeploy, войди в инкогнито

Без `AUTH_SECRET` при логине будет редирект на `/?error=auth_not_configured`.

## News AI Bot

Автоматический сбор новостей из Steam API Valve (`ISteamNews/GetNewsForApp`).

- **Cron** — раз в сутки в 10:00 UTC (`vercel.json`)
- **Кэш** — Redis/KV на 3 часа (не дергает LLM на каждый запрос)
- **ИИ-обогащение** — при `GROQ_API_KEY` или `OPENAI_API_KEY`: заголовок, excerpt, описание на русском
- **Без ключа** — rule-based fallback + категории и картинки героев

### Ручное обновление

```
GET /api/news?refresh=1          — свежие новости (форс-обновление кэша)
GET /api/cron/refresh-news       — cron handler (нужен заголовок Authorization: Bearer CRON_SECRET)
```

### Файлы

- `lib/dotaNews.ts` — сбор и обогащение новостей
- `lib/serverCache.ts` — ключи кэша в KV
- `app/api/news/route.ts` — API для карусели
- `app/api/cron/refresh-news/route.ts` — cron handler

## AI-помощник

Эндпоинт `POST /api/ai` с контекстом актуальной меты (топ герои, винрейты).

- С `GROQ_API_KEY` или `OPENAI_API_KEY` — полноценные ответы через LLM
- Без ключа — keyword-fallback
- Rate limit: 15 запросов / мин / IP (через Redis/KV на продакшене)

## Архитектура кэша

| Данные | Ключ KV | TTL |
|--------|---------|-----|
| Hero stats (OpenDota) | `dota:cache:hero-stats` | 5 мин |
| Новости | `dota:cache:news:latest` | 3 ч |
| Pro leaderboard | `dota:cache:pro-leaderboard` | 1 ч |
| AI rate limit | `ai:{ip}` | 60 сек |

Реализация: `lib/kv.ts`, `lib/rateLimit.ts`, `lib/serverCache.ts`.

## Структура проекта

```
app/           — страницы и API routes (Next.js App Router)
lib/           — API-клиенты, кэш, i18n, типы
types/         — декларации (openid)
__tests__/     — Jest-тесты
public/        — статика, ранги, иконки
```

## Лицензия

Private project. Dota 2 — зарегистрированный товарный знак Valve Corporation.