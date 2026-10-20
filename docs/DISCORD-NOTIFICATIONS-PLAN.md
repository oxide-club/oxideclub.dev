# Discord Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Avisar sobre propostas de desafios/notas no Discord e anunciar suas páginas após publicação bem-sucedida.

**Architecture:** Workflows nos dois repositórios de conteúdo notificam propostas usando somente metadados da API do GitHub. O build Astro gera um manifesto público; um job posterior ao deploy compara esse manifesto com o registro persistente e publica novidades. Cada repositório guarda seu registro em `discord-state`.

**Tech Stack:** Node.js 24, ESM, `node:test`, Astro, GitHub Actions/REST e Discord incoming webhooks; sem novas dependências de runtime.

**Spec:** [DISCORD-NOTIFICATIONS.md](DISCORD-NOTIFICATIONS.md).

## Global Constraints

- `DISCORD_CONTRIBUTIONS_WEBHOOK_URL`: mensagens em `#contribuicoes`, título e link direcionados ao PR.
- `DISCORD_ANNOUNCEMENTS_WEBHOOK_URL`: mensagens em `#novidades`, título e link direcionados à página no site.
- Merge e publicação bem-sucedida são condições para anunciar; usar o snapshot efetivamente implantado.
- Excluir drafts e registrar primeira publicação por tipo/ID; excluir soluções e encontros.
- Inicialização explícita sem mensagens retroativas; estado permanente na branch `discord-state`.
- Nenhum código de PR deve executar com acesso aos secrets. Não enviar mensagens reais em testes.
- Não modificar configurações remotas nem ativar integrações durante a preparação local.

## Review Focus

- Resposta HTTP 200 de uma página antiga não comprova propagação: conferir também o manifesto publicado contra o artefato local (tarefa 4).
- Textos e links fornecidos por contribuidores não podem provocar menções, injeção em shell ou requisições a hosts arbitrários (tarefas 1–3).
- Duas propostas simultâneas não podem sobrescrever o registro uma da outra; reexecução não pode repetir envio confirmado (tarefas 1 e 2).
- Mudança de ID por renomeação não deve disparar primeira publicação: preservar aliases detectados no histórico entre snapshots (tarefas 3 e 4).
- O webhook pode aceitar uma mensagem cuja resposta se perde; não repetir automaticamente requisições com resultado ambíguo (tarefas 1 e 5).

## Arquivos e contratos

Caminhos abaixo são relativos à raiz de cada repositório, indicado pelo prefixo.

- `oxideclub.dev/scripts/discord/client.mjs`: HTTP do GitHub e Discord, validação de destinos, paginação e rate limits.
- `oxideclub.dev/scripts/discord/state.mjs`: leitura e gravação condicional de `state.json` em `discord-state` via API GitHub.
- `oxideclub.dev/scripts/discord/contributions.mjs`: seleção de arquivos e notificação de PR; executar apenas na branch confiável.
- Copiar esses três módulos para `challenges/scripts/discord/` e `notes/scripts/discord/`. Testar igualdade das cópias; documentar atualização conjunta. Não baixar código de outro repositório em runtime.
- `oxideclub.dev/src/lib/publication-manifest.mjs` e `src/pages/publication-manifest.json.ts`: manifesto ordenado e determinístico das coleções publicadas, sem secrets.
- `oxideclub.dev/scripts/discord/announcements.mjs`: CLI de baseline, anúncio e recuperação usando manifesto local/implantado.
- Novos testes `oxideclub.dev/tests/discord-{client,state,contributions,manifest,announcements,workflows}.test.mjs`.
- Novos workflows `challenges/.github/workflows/discord-contributions.yml`, `notes/.github/workflows/discord-contributions.yml` e `oxideclub.dev/.github/workflows/discord-announcements.yml`; alterar `oxideclub.dev/.github/workflows/deploy.yml`.
- Atualizar os três `README.md`, os guias `CONTRIBUTING.md` pertinentes e esta documentação com ativação/recuperação.

Tipos JSON: `Entry={type:'challenge'|'note',id,title,summary,url}`;
`Manifest={version:1,revisions:{challenges,notes},entries:Entry[]}`;
`State={version:1,initialized:boolean,records:Record<string,Record>,revisions:{challenges?,notes?}}`;
`Record={messageId?:string,url:string,baseline?:boolean,aliasOf?:string}`.
Chaves: `pr:<numero>` nas contribuições e `<type>:<id>` nos anúncios.
Cada SHA de revisão deve ter 40 dígitos hexadecimais em produção.

### Task 1: Transporte e estado persistente

**Interfaces:** `createClient({fetch,sleep,token,webhookUrl})` retorna
`github(path,options)`, `paginate(path)` e `send(payload): Promise<{id:string}>`.
`readState(client,repository): Promise<{state,sha:string|null}>` e
`updateState(client,repository,mutate): Promise<State>` encapsulam o arquivo,
inicialização da branch e atualização condicional, preservando registros existentes.

- [ ] Escrever testes: paginação de 101 arquivos; webhook `wait=true`; `allowed_mentions.parse=[]`; timeout/erro sem URL sensível; 429 respeita `retry_after` com limite de tentativas; 5xx/erro de rede no POST interrompe sem repetição automática; rejeitar webhook fora de HTTPS/Discord e redirecionamento para outro host.
- [ ] Escrever testes de estado: ausente, inválido, schema desconhecido, 403, criação concorrente da branch e conflito 409. Duas atualizações em chaves distintas preservam ambas; erro de permissão nunca vira estado vazio.
- [ ] Executar `node --test tests/discord-client.test.mjs tests/discord-state.test.mjs` e confirmar falha pela ausência dos módulos.
- [ ] Implementar módulos usando `fetch` com timeout, erros sanitizados e REST GitHub. Criar branch de estado sem checkout; Contents API usa SHA do arquivo como condição de gravação. Em conflito, reler e reaplicar somente a mutação de estado; nunca repetir o webhook dentro da mutação.
- [ ] Reexecutar os testes e confirmar sucesso; criar commit com módulos e testes.

### Task 2: Propostas nos dois repositórios

**Interfaces:** `selectProposals(files,kind): string[]` seleciona IDs adicionados.
`notifyContribution({client,repository,pullRequest}): Promise<void>` consulta o
PR atual e os arquivos paginados, verifica estado, envia e registra o ID da mensagem.
O ponto de entrada CLI lê `GITHUB_EVENT_PATH`, `GITHUB_REPOSITORY`, `GH_TOKEN` e
`DISCORD_CONTRIBUTIONS_WEBHOOK_URL`; nunca interpola título/body em shell.

- [ ] Testar PR de fork, draft/pronto, branch diferente de `main`, novo desafio/nota, edição, renomeação, docs/templates, assets, múltiplos IDs e atualização que adiciona proposta. Confirmar `embeds[0].url` e link principal iguais ao `html_url` canônico do PR.
- [ ] Testar PR já registrado e PR fechado: nenhum envio. Confinar repositórios a `oxide-club/challenges` e `oxide-club/notes`; truncar campos nos limites do Discord e desabilitar menções mesmo para títulos com `@everyone`.
- [ ] Executar `node --test tests/discord-contributions.test.mjs` e confirmar falha; implementar seleção e notificador; reexecutar até passar.
- [ ] Criar workflows `pull_request_target` com `opened`, `ready_for_review`, `synchronize` e `reopened`; checkout somente do repositório base e SHA confiável do evento, `persist-credentials: false`, Node 24, permissões `contents: write` e `pull-requests: read` somente no job confiável.
- [ ] Serializar por PR com `cancel-in-progress: false`; permitir PRs distintos simultâneos com gravação condicional do estado. Validar presença do webhook somente após detectar proposta elegível.
- [ ] Copiar os módulos para os repositórios de conteúdo; testar igualdade das cópias e configuração dos workflows. Criar commits separados por repositório.

### Task 3: Manifesto do conteúdo publicado

**Interfaces:** `createManifest({challenges,notes,revisions}): Manifest` recebe
as coleções já filtradas por `publishedChallenges()`/`publishedNotes()`.
O endpoint estático retorna esse JSON; o resultado local é
`dist/publication-manifest.json`. URLs são construídas com origem fixa
`https://oxideclub.dev`, nunca aceitas do frontmatter.

- [ ] Testar IDs, URLs exatas, título/resumo, ordenação, catálogo vazio, caracteres especiais, IDs duplicados e exclusão de drafts pelas coleções. Snapshot de produção exige revisões válidas; builds de preview permitem revisões ausentes e não são fontes de anúncio.
- [ ] Executar `node --test tests/discord-manifest.test.mjs` e confirmar falha; implementar módulo e endpoint; reexecutar até passar.
- [ ] Acrescentar à integração existente de notas a verificação de que o manifesto e as rotas contêm os mesmos IDs publicados.
- [ ] Verificar que `npm run deploy` gera e implanta o mesmo `dist` cujo manifesto será consumido. Não usar o build de preview anterior como fonte do anúncio. Criar commit.

### Task 4: Anúncios, baseline e integração do deploy

**Interfaces:** `announce({client,repository,manifest,fetchPublished,renames}): Promise<void>`
e `initialize({client,repository,manifest}): Promise<void>`; ambos injetáveis para testes.
`findRenames({repository,before,after,github}): Promise<Array<{from,to}>>` usa comparação
paginada entre revisões dos repositórios canônicos; interrompe se o histórico
estiver incompleto, em vez de tratar renomeações como adições.
CLI suporta `initialize`, `announce` e `record --key ... --message-id ... --url ...`.

- [ ] Testar baseline sem POSTs, baseline repetida recusada, ausência de baseline interrompendo anúncios, catálogo novo após baseline, draft publicado, edição sem envio, restauração, renomeação sem envio e vários itens com persistência após cada envio.
- [ ] Testar que manifesto remoto divergente, página 404 ou redirecionamento externo impedem envio; propagação tardia permite envio dentro do limite. Usar no máximo seis verificações com intervalo de dez segundos; permitir injeção de relógio nos testes.
- [ ] Testar falha parcial e retomada: itens confirmados não repetem, item sem confirmação exige reconciliação; título/link vão ao site. Testar conflito de estado, compare truncado, revisão anterior indisponível e recuperação manual por ID de mensagem.
- [ ] Executar `node --test tests/discord-announcements.test.mjs` e confirmar falha; implementar CLI, detector e verificação; reexecutar até passar.
- [ ] Alterar deploy: após sucesso, disponibilizar o manifesto de produção como artifact e chamar job confiável de anúncio com `needs: deploy`, na mesma execução/fila `production`. Job recebe apenas manifesto/dados, sem executar código proveniente de artifacts ou conteúdo de PR.
- [ ] Criar workflow manual de inicialização/retomada: selecionar execução de produção bem-sucedida, baixar seu manifesto e confirmar correspondência com produção. Compartilhar grupo `production`; não refazer deploy para retomar anúncio. Validar execução, workflow, branch e conclusão usando API GitHub.
- [ ] Testar configuração: falha/skip no deploy impede job, permissões de escrita restritas ao notificador, secrets com nomes exatos e ramo `discord-state` fora dos gatilhos de produção. Criar commit.

### Task 5: Operação e verificação final

- [ ] Documentar configuração dos Actions Secrets, políticas de forks/`pull_request_target`, permissões da branch de estado e ordem de ativação: implantar manifesto, inicializar baseline, habilitar webhook e notificações.
- [ ] Documentar exemplos em português e retomada após 429, indisponibilidade, falha de gravação ou resposta ambígua. Para confirmação perdida, conferir manualmente a mensagem no Discord e registrar seu ID antes de repetir. Não apresentar garantia de entrega exatamente uma vez.
- [ ] Executar `node --test tests/discord-*.test.mjs`; validar YAML e sintaxe Node dos scripts nos três repositórios, sem chamadas externas.
- [ ] Executar `npm test`, `npm run check`, `npm run build` e a integração de notas alterada, usando os procedimentos existentes de sincronização. Inspecionar manifesto gerado e rodar `git diff --check` nos três repositórios.
- [ ] Revisar todos os diffs contra a especificação, especialmente isolamento de secrets, identidade dos links, baseline, aliases e gravação de estado. Registrar resultados e limitações; criar commits finais e apresentar instruções de ativação. Não fazer push nem enviar mensagens reais nesta etapa.
