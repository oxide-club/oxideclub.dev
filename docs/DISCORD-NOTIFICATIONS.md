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
