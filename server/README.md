# Ranking local da cobra

Requer Node 24 e Docker Desktop em execução. Na raiz do projeto:

1. Copie .env.example para .env e defina uma senha local (a instalação inicial já criou .env).
2. npm install
3. npm run db:up
4. npm run db:generate
5. npm run db:migrate
6. npm run api (terminal separado)
7. npm run dev -- --host 127.0.0.1

Frontend: http://127.0.0.1:5173. API: 127.0.0.1:4001. PostgreSQL: 127.0.0.1:55433.
O volume Docker portfolio-ranking_ranking-data persiste os registros ao reiniciar. Não remova o volume se quiser manter o ranking.

GET /api/ranking retorna os 10 melhores resultados. POST recebe nickname (2–24 caracteres), score (múltiplo de 10 entre 0 e 3970), runId (UUID v4 por partida). Reenvios idênticos não duplicam pontuações. Empates favorecem a pontuação mais antiga.

O jogo é uma interação local em JavaScript, iniciada com snake ou bash snake.sh no terminal simulado. Nenhum comando do sistema é executado.

Esta versão recebe a pontuação calculada pelo navegador; não verifica a partida no servidor e não impede pontuações forjadas. Antes de publicar um ranking competitivo, adicionar validação de partidas e rever limites de acesso e origens da API.
