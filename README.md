# Petlio

Plataforma que conecta tutores de pets a passeadores, veterinários, pet sitters,
transporte e pet shops. Construído com **TanStack Start** e publicado em
**Cloudflare Workers**, com **Cloudflare D1** como banco de dados.

## Stack
- **Frontend/Backend:** TanStack Start (React full-stack, SSR)
- **Deploy:** Cloudflare Workers
- **Banco de dados:** Cloudflare D1 (SQLite) via Drizzle ORM
- **UI:** Tailwind CSS v4 + componentes estilo shadcn, tema custom da marca Petlio
- **Charts:** Recharts (seção "O mercado")

O banco `petlio-db` já existe na conta Cloudflare (id no `wrangler.jsonc`),
com o schema completo aplicado (users, pets, provider_profiles, services,
bookings, chat_messages, payments, wallets, reviews) e alguns dados de exemplo.

## Rodar localmente

```bash
npm install
npm run dev
```

## Deploy — via GitHub + Cloudflare (recomendado)

1. Crie um repositório novo no GitHub e suba este projeto:
   ```bash
   git init
   git add .
   git commit -m "Petlio inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/petlio.git
   git push -u origin main
   ```
2. No painel da Cloudflare → **Workers & Pages** → **Create** → **Connect to Git**.
3. Selecione o repositório `petlio`.
4. Configurações de build:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   (o Cloudflare detecta automaticamente o `wrangler.jsonc` do projeto)
5. Clique em **Save and Deploy**. A cada `git push`, o Cloudflare builda e publica
   automaticamente.

## Deploy — via linha de comando (alternativa)

```bash
npm install
npm run build
npx wrangler login
npx wrangler deploy
```

## Banco de dados

O binding `DB` já aponta para o D1 `petlio-db` existente. Para gerar e aplicar
novas migrations depois de alterar `src/db/schema.ts`:

```bash
npm run db:generate
npm run db:migrate:remote
```
# Pet-leo
