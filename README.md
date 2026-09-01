# Meu Guarda-Roupa

Aplicação web para catalogar as roupas que você tem em casa, com autenticação e dados persistidos no Supabase.

## Stack

- React + TypeScript + Vite
- Supabase Auth + PostgreSQL + RLS
- Lucide React
- CSS responsivo sem framework visual

## Configuração

1. Crie um projeto no Supabase.
2. No SQL Editor, execute `supabase/migrations/001_initial.sql`.
3. Copie `.env.example` para `.env.local`.
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` usando as credenciais públicas do projeto.
5. Instale as dependências com `npm install`.
6. Rode `npm run dev`.

A chave `anon` é usada somente no frontend e deve estar protegida pelas políticas RLS. Nunca coloque uma `service_role` key no `.env` do navegador.

## Funcionalidades

- Cadastro e login com e-mail e senha
- Cadastro, edição e exclusão de peças
- Nome, categoria, tamanho, cor, marca, estação, foto por URL e observações
- Busca por nome, marca ou cor
- Filtro por categoria
- Indicadores de quantidade de peças, categorias e peças com foto
- Layout responsivo e interface limpa
- RLS para que cada conta visualize e altere somente as próprias peças
