# Notificações de contribuições e publicações no Discord

## Objetivo e decisão aprovada

Divulgar propostas de novos desafios e notas em `#contribuicoes` e divulgar
o conteúdo disponível no site em `#novidades`. O anúncio exige merge e
publicação bem-sucedida, conforme confirmado pelo mantenedor.

O site Astro está em `oxide-club/oxideclub.dev`. Os conteúdos são mantidos
separadamente em `oxide-club/challenges` e `oxide-club/notes`. Ambos já
disparam `.github/workflows/deploy.yml` do site após mudanças em `main`.
Soluções e encontros ficam fora deste fluxo.

## Abordagem

Usar GitHub Actions e dois incoming webhooks do Discord. Essa opção aproveita
o pipeline existente e permite controlar filtros e mensagens. A integração
nativa GitHub/Discord oferece menos controle editorial; um bot ou serviço
próprio acrescentaria infraestrutura desnecessária para este escopo.

## Propostas em #contribuicoes

- Adicionar um workflow em cada repositório de conteúdo.
- Observar abertura, passagem de draft para pronto e atualizações de PRs
  destinados a `main`. Uma atualização também pode adicionar uma proposta
  a um PR que inicialmente não continha conteúdo novo.
- Consultar a API paginada de arquivos do PR e selecionar somente adições de
  `<id>/index.md`, excluindo `docs` e `templates`. Renomeações, modificações
  de páginas existentes, testes e anexos isolados não são novas propostas.
- Aguardar o PR deixar de ser draft. Publicar uma mensagem por PR, contendo
  autor, título do PR, identificadores propostos e link do PR. O título clicável
  e o link principal da mensagem devem direcionar ao PR no GitHub.
- Registrar o PR como notificado; atualizações, reaberturas e novas execuções
  não devem gerar outro aviso para o mesmo PR.
- Executar apenas lógica confiável da branch padrão. Para acesso ao webhook
  em PRs de forks, usar `pull_request_target` sem checkout ou execução do código
  do PR, com permissões explícitas. Verificar as políticas de eventos da
  organização durante a configuração.

## Publicações em #novidades

- Gerar no build de produção um manifesto com tipo, ID, título, resumo e URL
  de cada desafio e nota efetivamente incluído nas rotas publicadas.
- Usar o mesmo snapshot de conteúdo e o mesmo artefato implantado. Não buscar
  novamente `main` para decidir quais conteúdos foram publicados.
- Após o deploy bem-sucedido, verificar que as páginas novas estão acessíveis
  no domínio de produção, com tentativas limitadas para propagação.
- Comparar o manifesto com o registro persistente. Anunciar cada ID publicado
  pela primeira vez e registrar o envio após confirmação do Discord.
- URLs: `https://oxideclub.dev/desafios/<id>` e
  `https://oxideclub.dev/notas/<id>`.
- O título clicável e o link principal da mensagem devem direcionar à página
  publicada no site. Essa mensagem não deve usar o PR como destino.
- Excluir drafts. A passagem de draft para publicado conta como primeira
  publicação; alterações posteriores, renomeações detectadas no histórico e
  restauração de um ID já anunciado não geram novo anúncio.
- A regra editorial pressupõe que publicações em `main` entram por PR e merge.
  O detector usa o catálogo publicado como fonte de verdade; um push direto
  com conteúdo novo também seria anunciado. Não impor novas proteções de branch.

## Estado, concorrência e recuperação

Manter um arquivo JSON versionado em uma branch dedicada `discord-state` de
cada repositório, fora de `main`. Nos repositórios de conteúdo, registrar os
números dos PRs notificados; no site, registrar os pares tipo/ID publicados e
os IDs das mensagens retornados pelo Discord. Não usar cache ou artifacts
temporários como registro permanente.

Serializar os notificadores de cada repositório e usar atualização condicional
da referência ao gravar estado. O site deve manter deploy e anúncio ordenados
pela mesma fila de produção existente, sem cancelar execuções em andamento.
Os workflows de notificação devem ignorar pushes na branch de estado.

Antes de habilitar anúncios, executar uma inicialização explícita usando o
catálogo atualmente publicado como baseline, sem enviar mensagens antigas.
PRs abertos anteriormente não são varridos automaticamente; podem ser
notificados quando receberem um evento elegível. Documentar a inicialização
e a recuperação de falhas.

Enviar webhooks com `wait=true`, desabilitar menções e respeitar rate limits.
Uma falha de envio deve aparecer no workflow e permitir nova tentativa sem
refazer a publicação. Se houver falha entre a confirmação do Discord e a
gravação do estado, existe risco residual de duplicação: os dois serviços não
oferecem uma transação conjunta. Documentar a reconciliação manual desse caso,
sem prometer entrega exatamente uma vez.

Uma falha no notificador não desfaz um deploy concluído. Identificar o estágio
que falhou nos logs, sem revelar URLs de webhook ou outros tokens.

## Configuração e permissões

- Criar um webhook no canal `#contribuicoes` e armazenar a URL em
  `DISCORD_CONTRIBUTIONS_WEBHOOK_URL`, disponível somente a challenges e notes.
- Criar outro no canal `#novidades` e armazenar a URL em
  `DISCORD_ANNOUNCEMENTS_WEBHOOK_URL`, disponível somente a oxideclub.dev.
- Armazenar ambas as URLs em Actions Secrets e disponibilizá-las aos scripts
  como variáveis de ambiente com esses mesmos nomes.
- Preservar o `WEBSITE_DEPLOY_TOKEN` já usado no disparo entre repositórios.
- Conceder `contents: write` somente aos jobs confiáveis que atualizam o
  registro; os notificadores de PR também precisam de `pull-requests: read`.
  Isolar os jobs com credenciais de qualquer execução de código de PR.
- Não criar webhooks, publicar mensagens reais ou alterar configurações remotas
  durante a preparação local. A ativação exige configuração no Discord/GitHub.

## Validação e entregáveis

Preparar workflows, scripts e instruções nos três repositórios. Verificar com
fixtures e HTTP simulado: PR de fork, draft, novo conteúdo, edição, renomeação,
múltiplas páginas, paginação, reexecução, baseline, publicação de draft,
falha de deploy, indisponibilidade da página, erro/rate limit do Discord e
falha na gravação do estado. Garantir que nenhum teste envie mensagens reais.
Verificar também os destinos dos links e dos títulos clicáveis: PR do GitHub
em contribuições e página de produção do site em novidades.

Executar os testes e checks relevantes do site e validar a sintaxe dos
workflows. Incluir exemplos das mensagens e instruções de ativação e retomada
na documentação de contribuição/publicação existente.

## Ativação pelos mantenedores

A implementação usa Node.js 24 e não exige instalar um bot no servidor.
Configure URLs de webhooks como **Actions Secrets de repositório**, ou secrets
organizacionais liberados somente para os repositórios indicados. Não use
variáveis públicas do GitHub nem coloque essas URLs em arquivos versionados.
O job de anúncio não usa o environment `production`; seu secret deve estar
no escopo do repositório/organização.

1. Incorpore primeiro as alterações de `oxideclub.dev` em `main` e aguarde
   **Deploy production** concluir o job `deploy`. Sem o secret de anúncios,
   o job `announce` apenas informa que a integração está inativa.
2. Abra **Actions → Manage Discord announcements → Run workflow**, em `main`.
   Escolha `operation: initialize` e informe em `run_id` o número da execução
   de produção recém-concluída (o número na URL `/actions/runs/<numero>`).
   O workflow confere o deploy, baixa seu manifesto e verifica a produção
   antes de registrar o catálogo atual. Não envia mensagens.
3. Crie um webhook em `#novidades` e configure
   `DISCORD_ANNOUNCEMENTS_WEBHOOK_URL` em `oxide-club/oxideclub.dev`.
   Os próximos deploys anunciarão os IDs publicados que não estão no baseline.
4. Crie um webhook em `#contribuicoes` e configure
   `DISCORD_CONTRIBUTIONS_WEBHOOK_URL` em `oxide-club/challenges` e
   `oxide-club/notes`. A mesma URL pode ser compartilhada nesses dois
   repositórios. Configure o secret antes de incorporar seus workflows em `main`.
5. Incorpore as alterações de `challenges` e `notes`. Os próximos eventos
   elegíveis de PR passam a gerar avisos. Confira se a organização permite
   `pull_request_target`, o uso de webhooks externos e `contents: write` para
   esses jobs. O token precisa escrever na branch `discord-state`; não precisa
   poder fazer push em `main`.

O `WEBSITE_DEPLOY_TOKEN` continua sendo necessário para disparar o deploy do
site entre repositórios. As credenciais Cloudflare continuam apenas no site.
O teste real de ativação deve usar uma contribuição real, após a configuração;
os testes automatizados usam respostas HTTP simuladas e não publicam mensagens.

## Mensagens e regras de publicação

Exemplo de contribuição:

> Proposta de nota pronta para revisão: https://github.com/oxide-club/notes/pull/42
>
> **Investigando alocadores** — título clicável apontando ao mesmo PR.

Exemplo de novidade:

> Nova nota no Oxide Club: https://oxideclub.dev/notas/investigando-alocadores
>
> **Investigando alocadores** — título clicável apontando à página do site,
> acompanhado do resumo da nota.

Ambos os envios desabilitam menções. Um PR com vários arquivos novos recebe
um aviso; uma publicação com várias páginas novas recebe um anúncio por página.
Um PR em draft não gera aviso até ficar pronto para revisão. Uma nota com
`draft: true` não entra no manifesto: só sua primeira publicação gera anúncio.
Correções e páginas restauradas com o mesmo ID não são anunciadas novamente.

`publication-manifest.json` é um endpoint público com metadados já publicados,
sem URLs de webhooks ou tokens. Ele identifica as revisões dos repositórios
usadas naquele build. O notificador exige um manifesto de produção idêntico
ao artefato implantado e páginas acessíveis antes de enviar qualquer anúncio.
São feitas até seis verificações com dez segundos entre elas.

Mantenha IDs publicados estáveis. Quando o GitHub identifica uma renomeação
canônica entre as revisões registradas e publicadas, o notificador guarda um
alias e não repete o anúncio. Comparações com 300 arquivos ou mais, histórico
divergente e revisões indisponíveis interrompem o notificador; a API do GitHub
limita a lista de arquivos da comparação, mesmo com commits paginados. Nesse
caso, confira as renomeações e recupere o estado com um mantenedor antes de
retomar. Renomeações não detectadas pelo GitHub podem aparecer como novas
páginas; mudar um ID publicado requer essa revisão editorial.

## Retomada e entregas pendentes

O registro `state.json` na branch órfã `discord-state` é permanente. Não o
apague, não expire seu histórico e não o substitua por um cache. Preserve-o
nas configurações de limpeza de branches. Essa branch não deriva de `main` e
não contém workflows. Cópias do notificador nos repositórios de conteúdo devem
ser atualizadas junto com os módulos correspondentes em `oxideclub.dev`.

Antes de cada POST, o notificador grava `{url, pending: true}`. Quando o Discord
confirma a mensagem, grava seu `messageId` e remove `pending`. Uma falha de
rede, configuração ou persistência deixa a tentativa pendente e impede o
reenvio automático. Isso também protege o caso em que a mensagem foi aceita,
mas a resposta se perdeu. Respostas 429 com espera de até 60 segundos podem
ser repetidas até três tentativas; respostas ambíguas não são repetidas.

Antes de reconciliar uma entrega, aguarde a execução do notificador terminar.
Para anúncios, use **Manage Discord announcements**, sempre em `main`:

- `operation: announce`, com o `run_id` da produção atual: retoma o envio
  usando o manifesto preservado, sem executar deploy. Itens já confirmados
  ficam de fora. O workflow aceita uma execução com resultado geral de falha
  se seu job `deploy` concluiu com sucesso; isso permite retomar falhas do
  próprio notificador. Manifestos antigos que não correspondem à produção
  atual são recusadas. Os artifacts ficam disponíveis por até 90 dias, sujeito
  ao limite de retenção da organização; se expirarem, faça um novo deploy.
- `operation: record`, com `key` (por exemplo, `note:memoria`) e `message_id`:
  após conferir a mensagem no Discord, confirma uma entrega pendente.
- `operation: release`, com `key`: use **somente após confirmar no Discord
  que a mensagem não foi enviada**. Remove apenas uma tentativa pendente,
  permitindo uma nova tentativa posterior.

Uma falha na verificação de propagação ocorre antes de qualquer POST e não
cria pendências. Nesse caso basta retomar após a produção ficar disponível.
Uma falha entre confirmação e persistência requer `record`. Depois de
reconciliar, execute `announce` para o deploy atual. Não reinicialize o baseline
para contornar erros: isso apagaria a distinção entre itens novos e antigos.

Para propostas, mantenedores podem executar, no checkout confiável de `main`
do repositório de conteúdo, com Node.js 24 e `GH_TOKEN` já configurado:

```sh
export GITHUB_REPOSITORY=oxide-club/notes
node scripts/discord/state.mjs record pr:42 1234567890123456789
```

Ou, após confirmar que não houve mensagem:

```sh
node scripts/discord/state.mjs release pr:42
```

Em `challenges`, use `GITHUB_REPOSITORY=oxide-club/challenges`. Depois, reexecute
**Notify Discord contributions**. Nunca execute esses comandos a partir de
código do PR ou de um fork com acesso às credenciais.

## Verificação local

No site: `node --test tests/discord-*.test.mjs`, `npm test`, `npm run check`,
`npm run build` e `npm run test:notes`. A integração de notas verifica que o
manifesto e as rotas expõem as mesmas notas publicadas. Os testes de paridade
entre repositórios também rodam quando os checkouts irmãos estão disponíveis;
um clone isolado do site não depende deles.

Em cada repositório de conteúdo: `node --test tests/discord-*.test.mjs`.
O workflow **Check Discord notifications** executa esses testes em Node.js 24,
sem secrets, em pushes e PRs. Em `challenges`, execute também `make check`.
