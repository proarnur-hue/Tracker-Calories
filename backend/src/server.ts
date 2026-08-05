import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Backend запущен на порту ${env.port} (модель Groq: ${env.groqModel})`);
});
