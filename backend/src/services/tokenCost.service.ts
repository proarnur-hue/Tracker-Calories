// Логирование расхода токенов на анализ фото — для мониторинга нагрузки на
// бесплатную квоту Groq API (лимиты по запросам/токенам в минуту, а не по
// деньгам, см. https://console.groq.com/docs/rate-limits). Если проект
// перейдёт на платный тариф или другого провайдера, здесь же можно добавить
// расчёт стоимости по актуальным ценам.
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export function logRequestUsage(userId: string, usage: TokenUsage) {
  console.log(
    `[groq-usage] user=${userId} in=${usage.inputTokens} out=${usage.outputTokens} ` +
      `total=${usage.inputTokens + usage.outputTokens}`
  );
}
