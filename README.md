# Oxide Club

Código-fonte do [oxideclub.dev](https://oxideclub.dev), o site da comunidade Oxide Club. Publicado em português brasileiro, o site reúne desafios de programação, implementações da comunidade, notas técnicas, pautas de encontros e uma biblioteca de recursos de estudo em torno de **Explorar → Experimentar → Explicar**.

O projeto usa Astro, TypeScript, coleções de conteúdo em Markdown e CSS. As páginas são geradas como arquivos estáticos e hospedadas no Cloudflare Workers Static Assets; o site não tem backend em tempo de execução.

## Como contribuir

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) e siga o [código de conduta](https://oxideclub.dev/codigo-de-conduta/). Este repositório recebe alterações no código, nos estilos e nas configurações do site. O conteúdo editorial é mantido em repositórios separados:

| Contribuição                                                   | Repositório                                            |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| Enunciados de desafios e testes públicos                       | [challenges](https://github.com/oxide-club/challenges) |
| Soluções oficiais e referências a implementações da comunidade | [solutions](https://github.com/oxide-club/solutions)   |
| Notas técnicas                                                 | [notes](https://github.com/oxide-club/notes)           |
| Pautas, registros e materiais de encontros                     | [meetings](https://github.com/oxide-club/meetings)     |

Não publique credenciais, conversas privadas ou dados pessoais privados em issues ou pull requests. Envie relatos sensíveis de moderação para [report@oxideclub.dev](mailto:report@oxideclub.dev).

## Desenvolvimento local

Use Node.js 24, como na CI, além de npm e Git. Os comandos de desenvolvimento, testes unitários, validação e build sincronizam os quatro repositórios públicos de conteúdo antes de iniciar e precisam de acesso à rede. Credenciais do Cloudflare só são necessárias para o deploy.

```sh
git clone https://github.com/oxide-club/oxideclub.dev.git
cd oxideclub.dev
npm ci
npm run dev
```

O Astro informa a URL local de desenvolvimento. Para gerar e visualizar o site estático:

```sh
npm run build
npm run preview
```

Os builds padrão geram prévias que impedem a indexação por mecanismos de busca. O build de produção usa um comando separado, que verifica os requisitos de publicação e habilita a indexação.

## Verificações

```sh
npm test
npm run check
npm run build
npx playwright install chromium
npm run test:browser
npm run test:community
npm run test:notes
npm run test:meetings
```

- `npm test` sincroniza o conteúdo antes de verificar seleção de conteúdo, validação de URLs, requisitos de produção, taxonomia dos desafios e sincronização dos repositórios. Funciona em um clone novo, sem cache em `.content/`. A sincronização precisa de rede; os repositórios temporários usados nos testes precisam de Git. Na CI, o comando reutiliza as revisões de conteúdo já selecionadas para o job.
- `npm run check` executa as verificações do Astro e do TypeScript.
- `npm run test:browser` verifica o site gerado com Playwright e axe, incluindo navegação, links internos, teclado, reorganização do conteúdo em telas estreitas, texto ampliado, cores forçadas e redução de movimento.
- `npm run test:community` verifica os catálogos de implementações da comunidade, o escape de conteúdo e a apresentação responsiva e acessível em builds isolados.
- `npm run test:notes` gera catálogos temporários vazios, publicados e com rascunhos para verificar visibilidade, renderização e integração das notas com a página inicial.
- `npm run test:meetings` verifica páginas de encontros, anexos, calendários e acessibilidade em diferentes tamanhos de tela. Os dados sintéticos dos testes de integração ficam fora do diretório de conteúdo de trabalho.

A suíte de navegador e as três suítes de integração precisam de Chromium e do conteúdo sincronizado. Execute-as depois de `npm run build`, como no exemplo acima. Para usar uma instalação existente no Linux, acrescente `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` antes do comando.

Para verificar um servidor de desenvolvimento já em execução, use a URL efetivamente informada por ele:

```sh
SITE_TEST_URL=http://127.0.0.1:4322 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

Reinicie o servidor de desenvolvimento depois de alterar os schemas das coleções ou os validadores importados por eles. Confira tanto essa URL quanto um build novo: um processo de desenvolvimento em execução pode manter um schema anterior em memória.

As verificações automatizadas não substituem a revisão manual de acessibilidade. Consulte os [testes de acessibilidade e as revisões pendentes](docs/ACCESSIBILITY.md).

## Estrutura do repositório

| Caminho                                          | Finalidade                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `src/pages/`                                     | Página inicial, desafios, notas, encontros e calendários, biblioteca, código de conduta, 404 e robots.txt |
| `src/content.config.ts`                          | Schemas e validação das coleções de conteúdo                                                              |
| `src/components/`, `src/layouts/`, `src/styles/` | Componentes, layouts e estilos compartilhados                                                             |
| `src/config/`                                    | Metadados do site, links da comunidade e registros de revisão para produção                               |
| `src/lib/`                                       | Seleção de conteúdo, taxonomia e validação para produção                                                  |
| `public/`                                        | Arquivos estáticos, identidade visual e avisos de licença das fontes                                      |
| `scripts/`, `tests/`                             | Scripts de manutenção e testes automatizados                                                              |
| `.github/workflows/`                             | CI e deploy automático de produção                                                                        |

## Biblioteca

O catálogo estático em `/biblioteca` é mantido em `src/lib/library.ts`. Cada categoria tipada define sua lista ordenada de recursos. Autores e tipos de recurso permanecem nos dados; a página apresenta títulos, idioma, disponibilidade e eventuais notas editoriais. A indicação `gratuito` se refere ao material no destino do link, mesmo quando há uma edição impressa ou equipamento opcional à venda.

Ao propor um recurso, confira título, autoria, idioma, disponibilidade e destino. Prefira fontes oficiais e confira as permissões de publicação antes de indicar cópias hospedadas em outros locais.

## Publicação de conteúdo

Markdown é a fonte canônica de desafios, notas e encontros; as referências a implementações da comunidade usam YAML. Proponha alterações editoriais no repositório correspondente, sem editar os checkouts gerados em `.content/`. Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para conhecer o processo de contribuição e as orientações editoriais.

Desafios e notas exigem `title` e `summary`. Desafios também exigem `slug`, `draft` e `publishedAt`. Notas derivam o identificador do diretório, não aceitam `slug`, usam `draft: false` por padrão e exigem `publishedAt` somente quando publicadas. Use datas reais no formato `YYYY-MM-DD`. Os campos compartilhados opcionais são `updatedAt` e `featured`, que tem valor padrão `false`. Rascunhos ficam fora das listagens, rotas geradas, sitemaps e destaques da página inicial, inclusive nas prévias. Encontros têm metadados próprios, descritos adiante.

A página inicial escolhe um desafio ou uma nota publicada durante o build, por sorteio entre os itens com `featured: true`; se nenhum estiver marcado, todos os itens publicados são elegíveis. A seleção permanece fixa até o próximo build. Um catálogo vazio não exibe a seção.

### Desafios

Enunciados e testes públicos são mantidos em [oxide-club/challenges](https://github.com/oxide-club/challenges). Envie alterações para esse repositório, seguindo seu guia de contribuição. Cada definição fica em `<id>/index.md`; o diretório e o campo `slug` compartilham um identificador estável no formato `NNN-nome`.

O site lê apenas esses arquivos de definição a partir de `.content/challenges/`, um checkout ignorado pelo Git. READMEs, testes e dados de teste do repositório de origem não viram páginas. Não edite esse checkout gerado. Os metadados são validados pelo [schema de conteúdo](src/content.config.ts).

#### Recursos no GitHub

Os metadados opcionais em `github` controlam a seção **Recursos e implementações**. Eles aceitam `challenge` como booleano e `solutions` como lista de identificadores de linguagens oficiais. Quando omitidos, os valores são `false` e uma lista vazia. Sem recursos oficiais, essa seção não é exibida. O booleano legado `community` ainda é aceito por compatibilidade, mas não controla mais a apresentação das implementações da comunidade.

Declare `github` no frontmatter de `<id-canônico>/index.md` em [oxide-club/challenges](https://github.com/oxide-club/challenges). O Markdown sincronizado determina a disponibilidade dos recursos oficiais, com validação pelo schema do Astro. Não há sobrescritas locais nem mapeamentos de identificadores no site.

Antes de configurar um recurso, confira se ele está publicado. Por exemplo, `001-wc/index.md` declara:

```yaml
github:
  challenge: true
  solutions: [c]
```

A organização, os nomes dos repositórios e as branches padrão ficam em `src/config/github.mjs`. A função `challengeResources()` monta as URLs de enunciados como `<challenges>/tree/<branch>/<entry.id>` e as de implementações como `<solutions>/tree/<branch>/<entry.id>/<linguagem>`. A linguagem recomendada nunca é tratada como prova de que existe uma implementação.

Para adicionar uma implementação publicada, inclua o identificador de seu diretório na lista `solutions` do desafio. Para uma linguagem ainda não registrada, adicione primeiro o identificador e o nome legível em `languageLabels`, em `src/lib/challenge-resources.mjs`, como `python: 'Python'`. O schema deriva os identificadores permitidos desse registro; o componente não precisa mudar. Identificadores duplicados ou desconhecidos causam falha na validação. Publique os metadados no repositório de desafios; a próxima sincronização do site os incorpora. Reinicie o servidor de desenvolvimento após mudanças de schema.

#### Implementações da comunidade

[oxide-club/solutions](https://github.com/oxide-club/solutions) é a fonte das referências a soluções. Implementações externas são registradas somente em `<id-canônico>/community.yaml`, sem catálogos locais no site ou referências no frontmatter dos desafios. O checkout ignorado `.content/solutions/` usa a mesma infraestrutura de sincronização atômica das demais fontes.

O módulo `src/lib/community.ts` lê o `community.schema.json` compartilhado nessa revisão, converte-o para Zod e valida o YAML. Também exige URLs HTTPS, URLs únicas de implementação e ordenação por autor e depois linguagem, conforme os pontos de código Unicode. Catálogos obrigatórios ausentes, campos desconhecidos, arquivos fora do local previsto ou dados inválidos interrompem a sincronização e o build, com indicação do arquivo e da entrada. Nenhum projeto indicado pelos links é baixado ou executado.

A rota estática de desafios associa os catálogos pelo identificador canônico do diretório. Um desafio publicado sem diretório em `solutions` não recebe entradas. Todos os catálogos presentes são validados, inclusive os que não correspondem a uma rota publicada. Links de linguagens oficiais continuam sendo definidos pelo frontmatter, com destinos em `<id-do-desafio>/<linguagem>`.

O componente `CommunityImplementations.astro` apresenta **Implementações da comunidade** abaixo dos recursos oficiais. Cada entrada exibe autor, com link opcional, linguagem, estado **Concluída** ou **Parcial**, notas opcionais em texto simples e **Código-fonte**. O Astro escapa as notas. Os estados são declarações dos participantes, sem certificação técnica. Catálogos vazios omitem a lista e mantêm **Compartilhe sua implementação**, com link para `solutions/CONTRIBUTING.md`. Todo esse HTML é gerado pelo Astro, sem consultas no cliente, formulários ou frameworks adicionais de interface.

Para visualizar metadados locais sem copiá-los para este repositório:

```sh
SOLUTIONS_SOURCE=/caminho/absoluto/para/solutions npm run dev
SOLUTIONS_SOURCE=/caminho/absoluto/para/solutions npm run check
SOLUTIONS_SOURCE=/caminho/absoluto/para/solutions npm run build
```

A sobrescrita é permitida apenas localmente, sendo proibida na CI e em produção. A mesma variável pode ser usada em testes unitários e de integração com metadados locais. `npm run test:community` verifica builds vazios, preenchidos e inválidos, escape de notas, funcionamento sem JavaScript e acessibilidade em larguras de 360 e 1280 pixels. As capturas ficam em `test-results/community-*.png`.

### Notas técnicas

[oxide-club/notes](https://github.com/oxide-club/notes) é a fonte canônica das notas. Seu README, guia de contribuição, licença CC BY 4.0 e modelo de rascunho descrevem o processo editorial. As notas podem tratar de Ciência da Computação em geral, sem precisar estar relacionadas a um desafio.

Cada nota fica em `<id-da-nota>/index.md`; o diretório em kebab-case minúsculo define `/notas/<id-da-nota>/`. Não adicione `slug`. Arquivos de documentação e os diretórios `docs/`, `templates/`, `scripts/` e `tests/` ficam fora da coleção. O schema exige `title` e `summary` não vazios, além de `publishedAt` para notas publicadas. `draft` tem valor padrão `false`; `updatedAt`, `topics`, `authors` e `featured` são opcionais. Quando presente, `authors` precisa ser uma lista não vazia. Rascunhos nunca recebem páginas públicas nem rotas de anexos.

Para escrever e visualizar uma nota antes de enviá-la:

```sh
# No checkout do repositório notes:
mkdir -p minha-investigacao
cp templates/note.md minha-investigacao/index.md
# Edite o modelo mantendo draft: true durante a escrita.

# No checkout do site:
NOTES_SOURCE=/caminho/absoluto/para/notes npm run dev
```

Rascunhos são validados, mas não geram rotas nem nas prévias locais. Para inspecionar o artigo renderizado, use temporariamente `draft: false` com um `publishedAt` válido no checkout local; restaure `draft: true` antes de enviar um texto inacabado. `NOTES_SOURCE` lê o checkout diretamente, incluindo alterações sem commit, sem copiar nem modificar os arquivos. A variável é proibida na CI e em produção. Use-a também com `npm run check` ou `npm run build` para testar notas locais. Builds de produção sempre usam a revisão do repositório público.

Use títulos Markdown a partir de `##`, blocos de código, tabelas, links e imagens com texto alternativo descritivo. O layout do artigo fornece título, índice, realce de código, atribuição, link para a fonte e aviso CC BY 4.0. Não há plugin específico para renderizar notação matemática.

Coloque imagens e arquivos complementares em `<id-da-nota>/assets/`. Use `![Descrição](./assets/diagrama.png)` e `[Dados](./assets/resultados.csv)`. Os tipos aceitos são PNG, JPEG, WebP, GIF, AVIF, PDF, TXT, CSV e JSON. Subdiretórios são permitidos; nomes devem usar letras sem acentos, dígitos, pontos, sublinhados e hífens. Diagramas podem ser exportados para PNG ou WebP. SVG, HTML, JavaScript, links simbólicos e HTML embutido nas notas são rejeitados. Blocos de código são exibidos, nunca executados. Links relativos como `../outra-nota/index.md#secao` viram links do site; caminhos a partir da raiz do site e links HTTPS também são aceitos. Revise fontes externas, conteúdo dos anexos, licenças e afirmações técnicas antes do merge.

Apenas anexos de notas publicadas recebem rotas estáticas em `/notas/<id-da-nota>/assets/<arquivo>`. Nem `.git` nem o checkout completo de conteúdo são copiados para a saída. O plugin Markdown das notas usa o processador Sätteri do Astro, declarado diretamente como dependência para configurar sua API nativa.

Notas publicadas aparecem em `/notas/`, das mais recentes para as mais antigas, e podem integrar o destaque da página inicial. Um repositório vazio é válido e apresenta a mensagem de ausência de notas, sem artigos de exemplo publicados.

### Encontros

[oxide-club/meetings](https://github.com/oxide-club/meetings) é a fonte de `/encontros/` e das páginas permanentes `/encontros/<id>/`. Cada definição fica em `meetings/NNN-titulo.md`; o nome do arquivo determina o identificador canônico. Não adicione `slug` nem renomeie um arquivo publicado. A listagem ordena os encontros por `startsAt`, do mais recente para o mais antigo, incluindo datas futuras e passadas na mesma sequência, sem estados derivados do relógio nem JavaScript no cliente.

Copie `templates/meeting.md` do repositório de origem, substitua as datas ilustrativas e escreva a pauta em Markdown. Os campos obrigatórios são `title`, `summary`, `startsAt`, `endsAt`, `timeZone`, `format` e `createdAt`. Datas com horário precisam de um deslocamento explícito em relação ao UTC; o término deve ocorrer depois do início. A apresentação usa o fuso IANA declarado e mostra também a data final quando o encontro atravessa a meia-noite. `format` aceita `online`, `presencial` e `hibrido`; formatos com presença física exigem `location`. `platform` e `participationUrl` são opcionais. Links de acesso são editoriais e não desaparecem com base no relógio do navegador. Encontros cancelados não exibem o botão de participação.

Use `draft: true` durante a preparação. Rascunhos são validados, mas não geram páginas, anexos nem entradas no calendário. Um repositório documentado e vazio é válido e produz a agenda e o calendário vazios. Modelos ficam fora da coleção.

Para visualizar conteúdo local ainda sem commit:

```sh
MEETINGS_SOURCE=/caminho/absoluto/para/meetings npm run dev
```

A sobrescrita lê o checkout diretamente, sem copiá-lo, e é proibida na CI e em produção. Assim como nas notas, use temporariamente `draft: false` apenas no checkout local quando precisar inspecionar um artigo. A produção sempre busca uma revisão da `main` pública.

Guarde anexos pequenos em `assets/<id>/` no repositório de origem e referencie-os com `../assets/<id>/arquivo.pdf`. Os tipos aceitos e as proteções para arquivos regulares seguem as notas: PNG, JPEG, WebP, GIF, AVIF, PDF, TXT, CSV e JSON, sem links simbólicos ou HTML executável. Imagens em Markdown exigem texto alternativo. HTML embutido é rejeitado. Links para outro encontro usam `./NNN-titulo.md#secao`. Gravações e arquivos grandes usam links externos. Código pode permanecer versionado no repositório de origem, com link para o GitHub. Apenas anexos de encontros publicados recebem rotas em `/encontros/<id>/assets/<arquivo>`.

O campo opcional `materials` contém objetos `{title, type, url}`. Os tipos são `slides`, `document`, `code`, `recording`, `transcript` e `reference`. URLs devem usar HTTPS sem credenciais ou apontar para anexos do próprio encontro. Listas ausentes ou vazias omitem a seção inteira. O Markdown também pode conter referências comentadas; evite repetir a mesma lista nos dois lugares. Um índice de âncoras aponta para as seções Markdown existentes e para o bloco de materiais, quando presente.

#### Revisões e cancelamentos no calendário

Cada encontro gera `/encontros/<id>/calendario.ics`. O endereço de assinatura é `https://oxideclub.dev/encontros/calendario.ics`. Importar um arquivo individual não garante atualizações; assine a URL em um aplicativo de calendário compatível. A frequência de consulta e a apresentação de cancelamentos dependem do aplicativo.

A geração segue o [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html): instantes em UTC, UID estável derivado do nome canônico do arquivo, registros de horário baseados nos metadados, `SEQUENCE`, escape de texto, CRLF e quebra de linhas que preserva os caracteres UTF-8. `createdAt` é obrigatório e imutável. Cada edição publicada deve incrementar `sequence` e definir `updatedAt`. Esses campos registram revisões editoriais reais. Repetir o build não altera os horários do calendário. O calendário inclui encontros cancelados com `STATUS:CANCELLED`; não exclua encontros publicados nem os transforme em rascunhos para cancelá-los.

Para reagendar, preserve o identificador, altere `startsAt` e `endsAt`, registre `previousStartsAt` e explique a mudança em `changeNotice`. Incremente `sequence` e defina `updatedAt`. Para cancelar, use `cancelled: true`, com `changeNotice` e uma nova revisão. Mantenha o registro e os materiais disponíveis. Para adiamentos sem nova data, siga o guia de contribuição da fonte.

Os cabeçalhos dos endpoints estáticos também são definidos em `public/_headers`, pois o Cloudflare serve os arquivos após o build do Astro. Não há API de calendário nem serviço em tempo de execução.

Execute `npm run test:meetings` para verificar builds isolados vazios, publicados e com rascunhos, além dos calendários, anexos, acessibilidade e apresentação em telas grandes e pequenas. Os testes usam conteúdo sintético temporário, nunca publicado. Para usar o Chromium do sistema, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. A suíte de integração de notas também precisa da revisão de encontros sincronizada.

### Links da comunidade

Os destinos da comunidade e dos canais de relato ficam em `src/config/links.json`. Destinos ausentes não são exibidos na interface; só adicione links para destinos existentes.

## Sincronização do conteúdo canônico

`npm run dev`, `npm test`, `npm run check`, `npm run build` e `npm run build:production` buscam a `main` mais recente dos quatro repositórios públicos de conteúdo: `challenges`, `solutions`, `notes` e `meetings`. As exceções são as sobrescritas locais permitidas e as revisões já selecionadas para o job da CI. Para sincronizar explicitamente:

```sh
npm run content:sync
```

O script informa o commit exato de cada fonte. Os checkouts gerados e ignorados ficam em `.content/challenges/`, `.content/solutions/`, `.content/notes/` e `.content/meetings/`; não são cópias editoriais mantidas separadamente. Uma falha ao buscar o conteúdo interrompe o comando, sem substituir silenciosamente a revisão por uma versão anterior em cache. Alterações locais nos checkouts gerados também interrompem a sincronização, para que nenhum trabalho seja descartado.

A CI e o workflow de deploy sincronizam uma vez no início e exportam `CHALLENGES_COMMIT`, `SOLUTIONS_COMMIT`, `NOTES_COMMIT` e `MEETINGS_COMMIT` para as etapas seguintes. Essas variáveis identificam as revisões daquela execução, sem exigir manutenção manual de versões fixas. Validação, testes de navegador e build de produção de um mesmo job usam o conteúdo selecionado. Uma nova execução busca novamente a `main` mais recente. Comandos locais independentes também buscam a versão mais recente por padrão.

Pushes para a `main` dos repositórios de conteúdo disparam o workflow **Deploy production** deste repositório quando mudam arquivos consumidos pelo site:

- **challenges:** `*/index.md`, com as definições diretamente dentro de cada diretório de desafio.
- **notes:** `*/index.md` e `*/assets/**`, excluindo `docs/**` e `templates/**`.
- **meetings:** `meetings/*.md` e `assets/**`, sem documentação e modelos.
- **solutions:** `*/community.yaml` e `community.schema.json`. Apenas metadados são consumidos; o código dos participantes permanece externo.

Os filtros cobrem adições, edições, exclusões e renomeações. Documentação, testes e dados de teste dos desafios não disparam deploy. Alterações em rascunhos de notas também disparam validação, mas os rascunhos continuam fora do site publicado. Pull requests e pushes para outras branches das fontes não disparam deploy de produção.

### Configuração inicial do disparo

Crie um token de acesso pessoal com permissões granulares, pertencente a uma conta com acesso a `oxide-club/oxideclub.dev`, restrito a esse repositório e com permissão **Actions: read and write**. Conclua a aprovação pela organização, se exigida. Armazene-o como secret do Actions com o nome `WEBSITE_DEPLOY_TOKEN` em `oxide-club/challenges`, `oxide-club/solutions`, `oxide-club/notes` e `oxide-club/meetings`, ou como secret da organização disponível apenas para esses repositórios. O `GITHUB_TOKEN` padrão das fontes não pode disparar workflows em outro repositório. Renove o token antes de expirar.

Mantenha `.github/workflows/deploy-website.yml` na `main` de cada fonte. O `deploy.yml` de destino deve permanecer na `main`, com `workflow_dispatch` habilitado. As fontes não precisam de credenciais do Cloudflare. Credenciais de disparo ausentes ou inválidas causam falha no workflow da fonte, em vez de ignorar a publicação silenciosamente.

O workflow da fonte informa se a solicitação de disparo foi aceita. Acompanhe **Deploy production** neste repositório para conferir a validação e o deploy. Continuam valendo os testes, as regras do ambiente de produção e a concorrência de deploy. Cada execução busca o conteúdo mais recente, que pode incluir merges posteriores ao commit que a disparou. Mantenedores também podem executar **Deploy production** manualmente para repetir um disparo ou deploy que falhou.

A revisão de `solutions` deve fornecer `community.schema.json` e catálogos válidos para seus diretórios de desafios. Contratos ausentes ou metadados inválidos interrompem a sincronização. Os testes com repositórios Git temporários verificam reutilização de revisões, incorporação de novos commits e preservação de alterações nos caches. Eles não verificam secrets remotos nem o disparo real entre repositórios.

URLs antigas de desafios são redirecionadas pelo Cloudflare conforme `public/_redirects`. A prévia local do Astro não simula essas regras.

## Deploy

A produção é hospedada em **https://oxideclub.dev**. O arquivo [wrangler.jsonc](wrangler.jsonc) configura o Worker `oxideclub-dev`, o domínio personalizado e os arquivos estáticos de `dist/`, incluindo a página 404.

Pushes para a `main`, inclusive merges de pull requests, executam **Deploy production**, exceto quando todos os arquivos alterados são `README.md`, `CONTRIBUTING.md`, `LICENSING.md`, `LICENSE` ou estão em `docs/`. Um push que também altere qualquer outro arquivo continua disparando deploy. O workflow primeiro chama **Check website**, definido em `.github/workflows/check.yml`; o job de produção só inicia após a aprovação dessas verificações. Pull requests e pushes para outras branches executam **Check website** separadamente, inclusive em alterações apenas de documentação, para permitir a conclusão dos checks obrigatórios. Mantenedores e repositórios de conteúdo podem disparar **Deploy production** manualmente, independentemente dos filtros de caminho, com as mesmas verificações exigidas. O job de deploy também valida seu conteúdo recém-sincronizado com testes unitários, verificações do Astro, build de prévia, testes de navegador e suítes de integração antes de gerar e publicar a produção.

O workflow usa o ambiente `production` do GitHub com estes secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Para gerar um build de produção sem publicar:

```sh
npm run build:production
```

Para fazer um deploy local com credenciais do Cloudflare configuradas:

```sh
npm run deploy
```

Os dois comandos executam `scripts/release-check.mjs`, que valida links obrigatórios e registros de revisão em `src/config/release.json`. O comando de deploy gera novamente a saída indexável antes de chamar o Wrangler. Use o workflow ou `npm run deploy` para evitar publicar uma prévia por engano. O deploy local não executa a suíte completa de testes; rode as verificações descritas acima antes de publicar.

Mantenha os registros de revisão fiéis ao que foi verificado. A exceção `manualAccessibilityReviewDeferred` permite publicação enquanto as três revisões manuais de acessibilidade permanecem marcadas como pendentes. A autorização e o trabalho restante estão registrados em [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Identidade visual

O arquivo vetorial original é `oxide-club.svg`. Cabeçalho e rodapé usam `public/branding/oxide-core.svg`, cujo `viewBox` remove margens externas preservando os caminhos e as cores originais. Os arquivos gerados incluem ícones PNG, um ICO e uma imagem de compartilhamento de 1200 × 630 pixels.

Para gerar novamente esses arquivos, instale librsvg, com `rsvg-convert`, e ImageMagick, com `magick`, e execute:

```sh
node scripts/build-branding.mjs
```

Os arquivos gerados são versionados junto com a fonte. Gerá-los novamente é uma tarefa de manutenção, não um requisito da CI. Os avisos de licença das fontes ficam em `public/licenses/`.

## Notificações no Discord

Propostas de desafios e notas são divulgadas em `#contribuicoes`, com link do PR.
Após merge e publicação bem-sucedida, `#novidades` recebe o link da página no site.
A ativação exige os Actions Secrets `DISCORD_CONTRIBUTIONS_WEBHOOK_URL` nos
repositórios de conteúdo e `DISCORD_ANNOUNCEMENTS_WEBHOOK_URL` neste repositório.
Siga a [configuração, baseline e recuperação](docs/DISCORD-NOTIFICATIONS.md#ativação-pelos-mantenedores)
antes de habilitar anúncios, para não divulgar retroativamente o catálogo atual.

## Licenças

O código original do site usa a [licença MIT](LICENSE). A prosa e a documentação originais de `oxide-club/notes` e `oxide-club/meetings`, assim como os textos educacionais de `oxide-club/challenges`, usam CC BY 4.0, sujeitos aos avisos de suas fontes. Dados de teste dos desafios usam CC0 1.0; código executável dos desafios usa MIT. Outros textos editoriais, logos e ilustrações ficam fora do escopo MIT do código do site. Consulte [LICENSING.md](LICENSING.md) para o escopo completo. Materiais de terceiros mantêm suas próprias licenças.
