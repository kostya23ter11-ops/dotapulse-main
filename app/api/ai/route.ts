import { NextRequest } from 'next/server';
import { getHeroStats, getAllHeroesStats } from '@/lib/api';
import { checkRateLimit } from '@/lib/rateLimit';
import type { HeroStats } from '@/lib/types';

const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').replace(/["']/g, '').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').replace(/["']/g, '').trim();

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;
const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_MAX = 15;

function getLLMConfig() {
  if (GROQ_API_KEY) {
    return {
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      apiKey: GROQ_API_KEY,
      provider: 'Groq',
    };
  }
  if (OPENAI_API_KEY) {
    return {
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      apiKey: OPENAI_API_KEY,
      provider: 'OpenAI',
    };
  }
  return null;
}

async function buildMetaContext() {
  try {
    const [topHeroes, allHeroes] = await Promise.all([
      getHeroStats(10),
      getAllHeroesStats(),
    ]);

    const topList = topHeroes
      .map(h => `${h.name} — winrate ${h.winrate}, picks ${h.pickrate?.toLocaleString()}, roles: ${h.roles?.join(', ') || 'N/A'}`)
      .join('\n');

    const sorted = [...allHeroes].sort((a, b) => b.winrateNum - a.winrateNum);
    const highWinrate = sorted
      .filter(h => h.winrateNum >= 52)
      .slice(0, 10)
      .map(h => `${h.name} — ${h.winrate} (${h.attack_type || 'N/A'}, ${h.roles?.join(', ') || 'N/A'})`)
      .join('\n');

    const lowWinrate = sorted
      .filter(h => h.winrateNum < 48)
      .slice(0, 5)
      .map(h => `${h.name} — ${h.winrate}`)
      .join('\n');

    return `
## Текущая мета (данные с сервера, обновляются автоматически)

### Топ по популярности в про-матчах:
${topList || 'Нет данных'}

### Самые высокие винрейты (≥52%):
${highWinrate || 'Нет данных'}

### Самые низкие винрейты (<48%) — можно избегать:
${lowWinrate || 'Нет данных'}

Всего героев в базе: ${allHeroes.length}
`;
  } catch {
    return '';
  }
}

function buildSystemPrompt(metaContext: string) {
  return `Ты — Dota Pulse AI, эксперт-аналитик по Dota 2. Твоя задача — отвечать на вопросы игроков о мете, героях, предметах, стратегиях и советах по улучшению игры.

## Правила
1. Отвечай на русском языке, если вопрос на русском. Если на английском — на английском.
2. Будь конкретным: используй имена героев, цифры винрейтов, названия предметов.
3. Давай практичные советы, а не общие слова.
4. Если спрашивают про конкретного героя — расскажи о его сильных/слабых сторонах, лучших предметах, с кем хорошо/плохо играет.
5. Если данных о герое нет в контексте — честно скажи, что у тебя нет актуальных цифр, но дай общие советы.
6. Не выдумывай винрейты или статистику — используй только то, что есть в контексте.
7. Отвечай кратко и по существу, 2-5 абзацев. Без воды.
8. Если вопрос не про Dota 2 — вежливо перенаправь на тему Dota.

${metaContext}`;
}

function buildFallbackResponse(userMessage: string, heroes: HeroStats[]) {
  const lower = userMessage.toLowerCase();

  if (lower.includes('мета') || lower.includes('meta') || lower.includes('сейчас сильны') || lower.includes('топ герои')) {
    if (heroes?.length) {
      const top = heroes.slice(0, 6).map(h => `${h.name} (${h.winrate})`).join(', ');
      return `Сейчас в про-мете лидируют: ${top}. Самые высокие винрейты обычно у героев с сильным контролем и аурами. Подробнее в разделе Мета.`;
    }
    return 'В текущей мете сильны герои с аурами и командным контролем. Загляни в раздел Мета для актуальных данных.';
  }

  if (lower.includes('привет') || lower.includes('hello') || lower.includes('здравствуй')) {
    return 'Привет! Я твой ИИ-помощник Dota Pulse. Могу подсказать по текущей мете, контрпикам или популярным героям. Что хочешь узнать?';
  }

  if (lower.includes('контрпик') || lower.includes('контр') || lower.includes('против')) {
    return 'Для хорошего контрпика важно понимать ролевой состав команды. Напиши конкретного героя, и я подскажу, кого брать против него.';
  }

  if (lower.includes('винрейт') || lower.includes('winrate')) {
    if (heroes?.length) {
      return `Топ по винрейту: ${heroes.slice(0, 3).map(h => `${h.name} — ${h.winrate}`).join(' | ')}. Но помни: винрейт в про-матчах ≠ лёгкая победа в пабе.`;
    }
    return 'Винрейт зависит от патча и региона. Посмотри раздел Мета для актуальных данных.';
  }

  if (heroes?.length) {
    const names = heroes.slice(0, 4).map(h => h.name).join(', ');
    return `Сейчас популярны: ${names}. Задай конкретный вопрос — расскажу подробнее.`;
  }

  return 'Я могу помочь с вопросами по Dota 2: мета, герои, предметы, стратегии. Спроси что-нибудь!';
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : null) || 'unknown';
    const rateLimit = await checkRateLimit(`ai:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        },
      );
    }

    const body = await req.json();
    const rawMessages = body.messages || [];

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return Response.json({ message: 'Привет! Чем могу помочь?' });
    }

    if (rawMessages.length > MAX_MESSAGES) {
      return Response.json({ error: 'Too many messages' }, { status: 400 });
    }

    const messages = rawMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content || '').slice(0, MAX_CONTENT_LENGTH),
    }));

    const lastMsg = messages[messages.length - 1].content;
    if (!lastMsg.trim()) {
      return Response.json({ message: 'Задай вопрос по Dota 2!' });
    }

    const llm = getLLMConfig();

    if (!llm) {
      let heroes: HeroStats[] = [];
      try { heroes = await getHeroStats(6); } catch { /* use empty fallback */ }
      return Response.json({ message: buildFallbackResponse(lastMsg, heroes) });
    }

    const metaContext = await buildMetaContext();
    const systemPrompt = buildSystemPrompt(metaContext);

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(llm.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llm.apiKey}`,
      },
      body: JSON.stringify({
        model: llm.model,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 2000));
        const retry = await fetch(llm.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llm.apiKey}`,
          },
          body: JSON.stringify({
            model: llm.model,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 800,
          }),
        });
        if (retry.ok) {
          const retryData = await retry.json();
          const content = retryData.choices?.[0]?.message?.content;
          if (content) return Response.json({ message: content });
        }
      }

      let heroes: HeroStats[] = [];
      try { heroes = await getHeroStats(6); } catch { /* use empty fallback */ }
      return Response.json({ message: buildFallbackResponse(lastMsg, heroes) });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      let heroes: HeroStats[] = [];
      try { heroes = await getHeroStats(6); } catch { /* use empty fallback */ }
      return Response.json({ message: buildFallbackResponse(lastMsg, heroes) });
    }

    return Response.json({ message: content });
  } catch {
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
