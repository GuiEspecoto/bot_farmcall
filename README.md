# Farm Call

Bot de Discord para deixar uma conta de bot conectada em um canal de voz e controlar tudo por um painel.

## Tem

- `/farm painel`
- iniciar e parar a conexão
- escolher o canal de voz
- status da conexão
- uptime
- modo de áudio
- título, descrição, cor, banner e rodapé editáveis
- configuração salva por servidor
- reconexão quando a call cai

## Instalação

Você precisa do Node.js 22 ou mais recente e de um bot criado no Discord Developer Portal.

1. Extraia o projeto.
2. Abra o terminal na pasta.
3. Rode `npm install`.
4. Copie `.env.example` para `.env`.
5. Coloque no `.env` o token do bot e o ID da aplicação.
6. Se quiser registrar o comando só em um servidor, coloque o ID dele em `GUILD_ID`.
7. Rode `npm start`.
8. No servidor, use `/farm painel`.

O bot precisa conseguir ver o canal, conectar nele e usar os comandos/mensagens necessários para o painel.

## Sobre token de conta pessoal

O projeto usa somente token de bot oficial. Não existe campo, endpoint ou código para receber ou usar token de conta pessoal. Automatizar uma conta normal por token é diferente de usar um bot oficial e não foi incluído aqui.

Se o token do bot vazar, gere outro no Discord Developer Portal.
