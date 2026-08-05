import Groq from "groq-sdk";
import { env } from "../config/env";
import { mealAnalysisSchema, MealAnalysisResult } from "../validators/mealAnalysis.schema";
import { logRequestUsage } from "./tokenCost.service";
import { ApiError } from "../middleware/errorHandler.middleware";

const groq = new Groq({ apiKey: env.groqApiKey });

// Системный промпт учитывает все нюансы из ТЗ: разбивка на компоненты,
// оценка веса по визуальным подсказкам, метод приготовления, раздельная
// уверенность для блюда и веса, явная обработка нераспознаваемых фото,
// несколько блюд/напитков как отдельные элементы массива.
//
// В отличие от Claude (forced tool use) и Gemini (responseSchema), Groq
// в JSON-режиме (response_format: json_object) гарантирует только
// СИНТАКСИЧЕСКИ валидный JSON, но не соответствие конкретной схеме —
// поэтому точная структура здесь прописана в самом промпте максимально
// явно, а итоговый результат всё равно проходит через zod-валидацию
// с повтором запроса при несоответствии (см. isRetryableError ниже).
const SYSTEM_PROMPT = `Ты — эксперт-нутрициолог, который анализирует фотографии еды и оценивает их пищевую ценность.

Тебе показывают фотографию блюда или нескольких блюд. Верни результат СТРОГО в виде одного JSON-объекта, без markdown-разметки (без \`\`\`), без пояснений вне JSON, ровно со следующими полями:

{
  "recognized": boolean,
  "overall_confidence": "high" | "medium" | "low",
  "items": [
    {
      "name": string,
      "estimated_weight_g": number,
      "weight_confidence": "high" | "medium" | "low",
      "cooking_method": string,
      "calories_kcal": number,
      "protein_g": number,
      "fat_g": number,
      "carbs_g": number
    }
  ],
  "totals": {
    "calories_kcal": number,
    "protein_g": number,
    "fat_g": number,
    "carbs_g": number
  },
  "notes": string | null,
  "needs_clarification": boolean,
  "clarification_reason": string | null
}

Правила анализа:
1. Перечисли КАЖДЫЙ отдельный продукт/компонент блюда отдельным элементом массива items (например: "рис", "куриная грудка", "овощной салат"), а не только общее название блюда целиком.
2. Если на фото несколько блюд или напитков (например, суп и напиток, или два разных блюда) — каждое из них тоже должно быть отдельным элементом массива items, не смешивай их в одну запись.
3. Оцени вес каждого компонента в граммах (estimated_weight_g), ориентируясь на визуальные подсказки: размер и тип тарелки/посуды, столовые приборы, руки в кадре, другие предметы известного размера. Это ВСЕГДА приблизительная оценка, а не точное измерение.
4. Укажи метод приготовления для каждого компонента (cooking_method): например "жареное", "варёное", "на пару", "сырое", "запечённое", "тушёное" и т.д. Жарка на масле существенно повышает калорийность по сравнению с варкой или приготовлением на пару — учитывай это при расчёте calories_kcal и fat_g.
5. Для каждого компонента укажи weight_confidence (high/medium/low) — уверенность именно в оценке ВЕСА порции.
6. Укажи overall_confidence (high/medium/low) — общую уверенность в РАСПОЗНАВАНИИ блюда в целом.
7. Рассчитай calories_kcal, protein_g, fat_g, carbs_g для каждого компонента на основе его типа, веса и метода приготовления.
8. В totals верни сумму по всем items — сервер всё равно пересчитает эту сумму самостоятельно, поэтому просто верни корректную сумму по своим items.
9. Если что-то важное не видно на фото (например, соус, заправка, добавленное масло) — упомяни это в notes, это может повлиять на реальную калорийность. Если писать нечего — верни null, а не пустую строку.
10. Если на фото НЕ еда, фото слишком размыто, плохое освещение, или блюдо невозможно достоверно распознать — НЕ придумывай цифры. Верни recognized: false, needs_clarification: true, заполни clarification_reason понятным объяснением (например: "На фото не видно еды" или "Изображение слишком размыто для анализа"), а items оставь пустым массивом [], totals — нулевыми (0).
11. Все текстовые поля (name, cooking_method, notes, clarification_reason) пиши на русском языке.
12. Верни ТОЛЬКО JSON-объект, указанный выше, — ни слова текста до или после него.`;

export interface AnalyzeImageParams {
  base64Image: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  userId: string;
}

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof Groq.APIConnectionError) return true;
  if (err instanceof Groq.APIError) {
    // 429 (rate limit) и 5xx имеет смысл повторить, 4xx (кроме 429) — нет
    return err.status === 429 || (err.status !== undefined && err.status >= 500);
  }
  // Ответ пришёл, но не прошёл нашу схему (JSON-режим Groq не гарантирует
  // структуру) — стоит попробовать ещё раз, модель может ответить иначе
  if (err instanceof SyntaxError) return true;
  return false;
}

export async function analyzeFoodImage(params: AnalyzeImageParams): Promise<MealAnalysisResult> {
  const { base64Image, mediaType, userId } = params;

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: env.groqModel,
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Проанализируй это фото еды и верни результат в заданном JSON-формате.",
              },
              {
                type: "image_url",
                image_url: { url: `data:${mediaType};base64,${base64Image}` },
              },
            ],
          },
        ],
        // qwen3.6 — reasoning-модель: без этого она уходит в цепочку рассуждений
        // (message.reasoning) вместо прямого ответа и на неоднозначных фото может
        // зациклиться и упереться в max_tokens, ни разу не дойдя до JSON (ошибка
        // Groq "json_validate_failed" с пустым failed_generation). У бесплатного
        // тарифа к тому же лимит 8000 токенов/минуту — reasoning легко его съедает.
        // Параметр специфичен для reasoning-моделей Groq и пока не описан в типах
        // groq-sdk, отсюда точечный каст вместо правки всего объекта параметров.
        ...({ reasoning_effort: "none" } as Record<string, unknown>),
      });

      if (completion.usage) {
        logRequestUsage(userId, {
          inputTokens: completion.usage.prompt_tokens ?? 0,
          outputTokens: completion.usage.completion_tokens ?? 0,
        });
      }

      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new ApiError(502, "Groq не вернул содержимое ответа");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new SyntaxError("Groq вернул невалидный JSON");
      }

      // Валидация zod — не доверяем слепо тому, что вернула модель
      return mealAnalysisSchema.parse(parsed);
    } catch (err) {
      lastError = err;

      // Реальная причина иначе нигде не видна — без этого лога "не удалось
      // получить ответ" ничем не отличается от невалидного ключа, нехватки
      // квоты на аккаунте, неверного имени модели и т.д.
      console.error(
        `[groq] попытка ${attempt + 1}/${MAX_RETRIES + 1} не удалась:`,
        err instanceof Groq.APIError ? `${err.status} ${err.message}` : err
      );

      if (!isRetryableError(err) || attempt === MAX_RETRIES) {
        break;
      }

      const delay = BASE_DELAY_MS * 2 ** attempt;
      await sleep(delay);
    }
  }

  if (lastError instanceof ApiError) throw lastError;

  if (lastError instanceof Groq.APIError) {
    throw new ApiError(502, `Groq API вернул ошибку: ${lastError.message}`);
  }
  throw new ApiError(502, "Не удалось получить ответ от Groq API после нескольких попыток");
}
