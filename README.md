# Oxide Club

O Oxide Club é um clube independente de computação com foco em sistemas. Estudamos C, Rust, arquitetura de computadores e sistemas operacionais. Compartilhamos perguntas, experimentos e projetos. Os participantes podem propor outras frentes de estudo.

Este repositório contém o código-fonte do [oxideclub.dev](https://oxideclub.dev), o site da comunidade. O site reúne desafios, laboratórios, links para implementações da comunidade, notas técnicas, pautas de encontros e uma biblioteca de estudo. O conteúdo está em português brasileiro e segue a proposta **Explorar → Experimentar → Explicar**.

O projeto usa Astro, TypeScript, coleções de conteúdo em Markdown e CSS. O Astro gera arquivos estáticos, que o Cloudflare Workers Static Assets hospeda. O site não executa um backend para atender às requisições.

## Catálogo de desafios

`/desafios` agrupa os exercícios publicados por área. Cada desafio pertence a uma única área principal. `/desafios/lista` apresenta uma lista compacta com busca, filtros de área e dificuldade e opções de ordenação. A URL registra essas escolhas para permitir o compartilhamento. As duas páginas incluem retorno ao topo.

O repositório `challenges` mantém o registro ordenado `areas.json` e o campo `area` de cada `index.md`. Os títulos não incluem o número do desafio. Os slugs, usados nos endereços das páginas, e as URLs permanecem estáveis. Áreas sem desafios publicados não aparecem no catálogo.

Ao integrar o catálogo por áreas, publique primeiro o conteúdo com `areas.json` e `area`. Depois, publique a versão do site que exige esses metadados. Antes do deploy, confira o commit selecionado pela sincronização. Alterações no registro de áreas também acionam o workflow da fonte, que solicita uma nova publicação do site.

## Como contribuir

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) e siga o [código de conduta](https://oxideclub.dev/codigo-de-conduta/). Este repositório recebe alterações no código, nos estilos e nas configurações do site. O conteúdo editorial é mantido em repositórios separados:

| Contribuição                                                   | Repositório                                            |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| Enunciados de desafios e testes públicos                       | [challenges](https://github.com/oxide-club/challenges) |
| Soluções oficiais e referências a implementações da comunidade | [solutions](https://github.com/oxide-club/solutions)   |
| Notas técnicas                                                 | [notes](https://github.com/oxide-club/notes)           |
| Pautas, registros e materiais de encontros                     | [meetings](https://github.com/oxide-club/meetings)     |
| Roteiros, materiais e verificações de laboratórios             | [labs](https://github.com/oxide-club/labs)             |

Não publique credenciais, conversas privadas ou dados pessoais privados em issues ou pull requests. Envie relatos sensíveis de moderação para [report@oxideclub.dev](mailto:report@oxideclub.dev).

## Desenvolvimento local

Instale Node.js 24, npm e Git. A integração contínua (CI) também usa Node.js 24.

Os comandos de desenvolvimento, testes unitários, validação e build sincronizam os cinco repositórios públicos de conteúdo antes de iniciar. Essa sincronização exige acesso à rede. As credenciais do Cloudflare são necessárias somente para publicar o site.

Para clonar o repositório, instalar as dependências e iniciar o servidor de desenvolvimento:

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

O build gera os arquivos estáticos do site. Por padrão, esses arquivos formam uma prévia que instrui os mecanismos de busca a não indexar as páginas. O build de produção verifica os requisitos de publicação e permite a indexação. Consulte [Deploy](#deploy) para executar esse comando.

## Como executar as verificações

Execute os comandos nesta ordem:

```sh
npm test
npm run check
npm run build
npx playwright install chromium
npm run test:browser
npm run test:community
npm run test:notes
npm run test:meetings
npm run test:labs
```

- `npm test` sincroniza o conteúdo e verifica sua seleção, as URLs, os requisitos de produção, a taxonomia dos desafios e a sincronização. O comando funciona em um clone novo, sem cache em `.content/`. A sincronização exige rede, e os testes usam Git para criar repositórios temporários. Na CI, o comando reutiliza as revisões já selecionadas para o job.
- `npm run check` executa as verificações do Astro e do TypeScript.
- `npm run test:browser` verifica o site gerado com Playwright e axe, incluindo navegação, links internos, teclado, reorganização do conteúdo em telas estreitas, texto ampliado, cores forçadas e redução de movimento.
- `npm run test:community` verifica os catálogos de implementações da comunidade, o escape de conteúdo e a apresentação responsiva e acessível em builds isolados.
- `npm run test:notes` gera catálogos temporários vazios, publicados e com rascunhos para verificar visibilidade, renderização e integração das notas com a página inicial.
- `npm run test:meetings` verifica páginas de encontros, anexos, calendários e acessibilidade em diferentes tamanhos de tela. Os dados sintéticos dos testes de integração ficam fora do diretório de conteúdo de trabalho.
- `npm run test:labs` verifica a publicação de laboratórios, os arquivos distribuídos e a remoção de páginas e materiais de rascunhos.

A suíte de navegador e as quatro suítes de integração exigem Chromium e conteúdo sincronizado. Execute-as depois de `npm run build`, como no exemplo acima. Para usar uma instalação existente no Linux, acrescente `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` antes do comando.

Para verificar um servidor de desenvolvimento já em execução, use a URL efetivamente informada por ele:

```sh
SITE_TEST_URL=http://127.0.0.1:4322 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

Os schemas definem os campos e as regras de validação das coleções. Se alterar um schema ou um validador importado por ele, reinicie o servidor de desenvolvimento. Confira a página no servidor reiniciado e em um build novo. Um processo que já estava em execução pode manter o schema anterior em memória.

As verificações automatizadas não substituem a revisão manual de acessibilidade. Consulte o [registro das verificações de acessibilidade](docs/ACCESSIBILITY.md).

## Estrutura do repositório

| Caminho                                          | Finalidade                                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/`                                     | Página inicial, desafios, laboratórios, notas, encontros, calendários, biblioteca, código de conduta, página 404 e `robots.txt` |
| `src/content.config.ts`                          | Schemas e validação das coleções de conteúdo                                                                                    |
| `src/components/`, `src/layouts/`, `src/styles/` | Componentes, layouts e estilos compartilhados                                                                                   |
| `src/config/`                                    | Metadados do site, links da comunidade e registros de revisão para produção                                                     |
| `src/lib/`                                       | Seleção de conteúdo, taxonomia e validação para produção                                                                        |
| `public/`                                        | Arquivos estáticos, identidade visual e avisos de licença das fontes                                                            |
| `scripts/`, `tests/`                             | Scripts de manutenção e testes automatizados                                                                                    |
| `.github/workflows/`                             | CI e deploy automático de produção                                                                                              |

## Biblioteca

Edite `src/lib/library.ts` para alterar o catálogo de `/biblioteca`. Cada categoria tem um tipo definido em TypeScript e uma lista ordenada de recursos.

Os dados incluem autores e tipos de recurso. A página apresenta títulos, idioma, disponibilidade e notas editoriais, quando houver. A indicação `gratuito` se refere ao material no destino do link. Uma edição impressa ou um equipamento opcional pode estar à venda sem alterar essa indicação.

Ao propor um recurso, confira título, autoria, idioma, disponibilidade e destino. Prefira fontes oficiais e confira as permissões de publicação antes de indicar cópias hospedadas em outros locais.

## Publicação de conteúdo

Os repositórios de conteúdo mantêm os desafios, laboratórios, notas e encontros em Markdown. As referências a implementações da comunidade usam YAML.

Proponha alterações editoriais no repositório de origem. Não edite os checkouts gerados em `.content/`: eles são cópias locais que o site usa para ler o conteúdo. Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para conhecer o processo de contribuição e as orientações editoriais.

Desafios e notas exigem `title` e `summary`. Desafios também exigem `slug`, `draft` e `publishedAt`. As notas usam o nome do diretório como identificador e não aceitam `slug`. Para notas, `draft` tem valor padrão `false`, e `publishedAt` é obrigatório somente quando a nota está publicada.

Use datas reais no formato `YYYY-MM-DD`. Os campos `updatedAt` e `featured` são opcionais nos desafios e nas notas. O valor padrão de `featured` é `false`.

Rascunhos ficam fora das listagens, rotas geradas, sitemaps e destaques da página inicial, inclusive nas prévias. Encontros e laboratórios têm metadados próprios, descritos nas respectivas seções.

### Destaques e publicações recentes da home

Edite `src/config/home.json` para escolher até três destaques, em ordem. O primeiro é o principal; os demais são secundários. Use referências `labs:<id>`, `challenges:<id>` ou `notes:<id>`, sempre com o identificador do diretório do conteúdo. Por exemplo:

```json
{
  "featured": [
    "labs:003-memory-safety-lab",
    "challenges:004-hexdump",
    "challenges:009-triangle"
  ]
}
```

O build rejeita referências duplicadas, inexistentes, em rascunho ou listas com mais de três itens. Para remover ou tornar um destaque rascunho na fonte, retire primeiro sua referência desta configuração. Uma lista vazia omite a seção. O card principal usa título, resumo e, quando disponíveis, assuntos e dificuldade do conteúdo; não exige ilustrações específicas. O campo `featured` das fontes continua aceito por compatibilidade, mas não controla a seleção da home.

As publicações recentes são calculadas automaticamente a cada build: até seis laboratórios, desafios ou notas, ordenados por `publishedAt` decrescente, sem repetir os destaques. Empates usam a referência do conteúdo em ordem alfabética. Alterações em `updatedAt` não reposicionam conteúdos. As datas são exibidas em português e UTC. Sem itens elegíveis, a seção é omitida. Os fluxos de publicação existentes atualizam a lista; não há consulta ao vivo no navegador.

### Desafios

Enunciados e testes públicos são mantidos em [oxide-club/challenges](https://github.com/oxide-club/challenges). Envie alterações para esse repositório, seguindo seu guia de contribuição. Cada definição fica em `<id>/index.md`; o diretório e o campo `slug` compartilham um identificador estável no formato `NNN-nome`.

O site lê apenas esses arquivos de definição a partir de `.content/challenges/`, um checkout ignorado pelo Git. READMEs, testes e dados de teste do repositório de origem não viram páginas. Não edite esse checkout gerado. Os metadados são validados pelo [schema de conteúdo](src/content.config.ts).

#### Linguagens e apresentação do catálogo

O frontmatter é o bloco de metadados no início do arquivo Markdown. Ele pode declarar `acceptedLanguages`, uma lista não vazia e sem repetições. O campo `recommendedLanguage` indica uma sugestão. Se os dois campos estiverem presentes, a linguagem recomendada deve pertencer à lista.

Se `acceptedLanguages` estiver ausente, a interface usa a linguagem recomendada, quando declarada. O site não deduz as linguagens aceitas a partir das implementações oficiais em `github.solutions`.

`cardTopics` pode destacar até três conceitos no cartão do desafio. `topics` mantém a lista completa de assuntos para apresentação e busca. `difficultyContext` explica o nível de dificuldade sem alterar sua classificação.

A busca considera identificador, título, área, resumo, assuntos, conceitos destacados, categorias, linguagens aceitas e linguagem recomendada. Também considera a dificuldade, tanto pelo nome em português quanto pelo identificador, e o texto de `difficultyContext`.

Para revisar alterações ainda não publicadas na fonte, execute:

```sh
CHALLENGES_SOURCE=/caminho/absoluto/para/challenges npm run build
```

Você também pode usar `CHALLENGES_SOURCE` com `npm run dev` e `npm run check`. A prévia lê a fonte local diretamente, valida sua estrutura e preserva o cache sincronizado.

A CI e a produção rejeitam fontes locais, inclusive nas outras coleções. A produção usa o conteúdo sincronizado do repositório de origem. Publique os metadados nesse repositório antes de publicar a versão do site que depende deles.

#### Recursos no GitHub

Os metadados opcionais em `github` controlam a seção **Recursos e implementações**. O campo `challenge` aceita um booleano, com valor padrão `false`. O campo `solutions` aceita uma lista de identificadores de linguagens oficiais, vazia por padrão. Se não houver recursos oficiais, o site omite a seção. O booleano legado `community` ainda é aceito por compatibilidade, mas não controla mais a apresentação das implementações da comunidade.

Declare `github` no frontmatter de `<id-canônico>/index.md` em [oxide-club/challenges](https://github.com/oxide-club/challenges). O Markdown sincronizado determina a disponibilidade dos recursos oficiais, com validação pelo schema do Astro. O site não mantém configurações separadas para substituir esses metadados nem mapear identificadores de recursos.

Antes de configurar um recurso, confira se ele está publicado. Por exemplo, `001-wc/index.md` declara:

```yaml
github:
  challenge: true
  solutions: [c]
```

A organização, os nomes dos repositórios e as branches padrão ficam em `src/config/github.mjs`. A função `challengeResources()` monta as URLs de enunciados como `<challenges>/tree/<branch>/<entry.id>` e as de implementações como `<solutions>/tree/<branch>/<entry.id>/<linguagem>`. A linguagem recomendada nunca é tratada como prova de que existe uma implementação.

Para adicionar uma implementação publicada:

1. Confira se a linguagem está registrada em `languageLabels`, em `src/lib/challenge-resources.mjs`. Se estiver ausente, adicione o identificador e o nome legível, como `python: 'Python'`.
2. Inclua o identificador do diretório da linguagem na lista `solutions` do desafio.
3. Publique os metadados no repositório de desafios. A próxima sincronização do site deve incorporá-los.
4. Se alterar o schema, reinicie o servidor de desenvolvimento.

O schema usa `languageLabels` para definir os identificadores permitidos. O componente não exige alterações. Identificadores duplicados ou desconhecidos causam falha na validação.

#### Implementações da comunidade

[oxide-club/solutions](https://github.com/oxide-club/solutions) é a fonte das referências a soluções. Implementações externas são registradas somente em `<id-canônico>/community.yaml`, sem catálogos locais no site ou referências no frontmatter dos desafios. O Git ignora o checkout `.content/solutions/`. A sincronização só substitui a cópia anterior depois de validar a nova, como nas demais fontes.

O módulo `src/lib/community.ts` lê o `community.schema.json` compartilhado nessa revisão, converte-o para Zod e valida o YAML. Também exige URLs HTTPS, URLs únicas de implementação e ordenação por autor e depois linguagem, conforme os pontos de código Unicode.

Se faltar um catálogo obrigatório ou houver campos desconhecidos, arquivos fora do local previsto ou dados inválidos, a validação interrompe a sincronização e o build. A mensagem identifica o arquivo e a entrada. O site não baixa nem executa os projetos indicados pelos links.

A rota estática de desafios associa os catálogos pelo identificador canônico do diretório. Um desafio publicado sem diretório em `solutions` não recebe entradas. Todos os catálogos presentes são validados, inclusive os que não correspondem a uma rota publicada. Links de linguagens oficiais continuam sendo definidos pelo frontmatter, com destinos em `<id-do-desafio>/<linguagem>`.

O componente `CommunityImplementations.astro` apresenta **Implementações da comunidade** abaixo dos recursos oficiais. Cada entrada exibe autor, linguagem, estado e link **Código-fonte**. O link do autor e as notas em texto simples são opcionais. O Astro escapa caracteres especiais das notas para que o navegador não as interprete como HTML.

Os participantes declaram o estado **Concluída** ou **Parcial**. Essa declaração não é uma certificação técnica. Se o catálogo estiver vazio, o componente omite a lista e mantém **Compartilhe sua implementação**, com link para `solutions/CONTRIBUTING.md`.

O Astro gera todo o HTML dessa seção. A seção não faz consultas no navegador nem usa formulários ou frameworks adicionais de interface.

Para visualizar metadados locais sem copiá-los para este repositório:

```sh
SOLUTIONS_SOURCE=/caminho/absoluto/para/solutions npm run dev
SOLUTIONS_SOURCE=/caminho/absoluto/para/solutions npm run check
SOLUTIONS_SOURCE=/caminho/absoluto/para/solutions npm run build
```

A variável `SOLUTIONS_SOURCE` permite usar uma fonte local somente fora da CI e da produção. A mesma variável pode ser usada em testes unitários e de integração com metadados locais. `npm run test:community` verifica builds vazios, preenchidos e inválidos, escape de notas, funcionamento sem JavaScript e acessibilidade em larguras de 360 e 1280 pixels. As capturas ficam em `test-results/community-*.png`.

### Notas técnicas

[oxide-club/notes](https://github.com/oxide-club/notes) é a fonte canônica das notas. Seu README, guia de contribuição, licença CC BY 4.0 e modelo de rascunho descrevem o processo editorial. As notas podem tratar de Ciência da Computação em geral, sem precisar estar relacionadas a um desafio.

Cada nota fica em `<id-da-nota>/index.md`. Use um nome de diretório em letras minúsculas, com palavras separadas por hífens (kebab-case). Esse nome define a rota `/notas/<id-da-nota>/`. Não adicione `slug`.

Arquivos de documentação e os diretórios `docs/`, `templates/`, `scripts/` e `tests/` ficam fora da coleção.

O schema exige `title` e `summary` não vazios, além de `publishedAt` para notas publicadas. `draft` tem valor padrão `false`; `updatedAt`, `topics`, `authors` e `featured` são opcionais. Se declarar `authors`, use uma lista não vazia. O site não gera páginas públicas nem rotas de anexos para rascunhos.

Para escrever e visualizar uma nota antes de enviá-la:

```sh
# No checkout do repositório notes:
mkdir -p minha-investigacao
cp templates/note.md minha-investigacao/index.md
# Edite o modelo mantendo draft: true durante a escrita.

# No checkout do site:
NOTES_SOURCE=/caminho/absoluto/para/notes npm run dev
```

Rascunhos são validados, mas não geram rotas nem nas prévias locais. Para inspecionar o artigo renderizado, defina temporariamente `draft: false` e um `publishedAt` válido no checkout local. Antes de enviar um texto inacabado, restaure `draft: true`.

`NOTES_SOURCE` lê o checkout diretamente, incluindo alterações sem commit, sem copiar nem modificar os arquivos. A variável é proibida na CI e em produção. Use-a também com `npm run check` ou `npm run build` para testar notas locais. Builds de produção sempre usam a revisão do repositório público.

Use títulos Markdown a partir de `##`, blocos de código, tabelas, links e imagens com texto alternativo descritivo. O layout do artigo fornece título, índice, realce de código, atribuição, link para a fonte e aviso CC BY 4.0. Não há plugin específico para renderizar notação matemática.

Coloque imagens e arquivos complementares em `<id-da-nota>/assets/`. Use `![Descrição](./assets/diagrama.png)` e `[Dados](./assets/resultados.csv)`. Os tipos aceitos são PNG, JPEG, WebP, GIF, AVIF, PDF, TXT, CSV e JSON. Você pode usar subdiretórios. Os nomes devem usar letras sem acentos, dígitos, pontos, sublinhados e hífens. Diagramas podem ser exportados para PNG ou WebP.

A validação rejeita arquivos SVG, HTML e JavaScript, links simbólicos e HTML embutido nas notas. O site exibe os blocos de código sem executá-los.

Links relativos como `../outra-nota/index.md#secao` viram links do site. O site também aceita caminhos a partir da própria raiz e links HTTPS. Revise fontes externas, conteúdo dos anexos, licenças e afirmações técnicas antes do merge.

Apenas anexos de notas publicadas recebem rotas estáticas em `/notas/<id-da-nota>/assets/<arquivo>`. O build não copia `.git` nem o checkout completo de conteúdo para a saída. O plugin Markdown das notas usa o processador Sätteri do Astro, declarado diretamente como dependência para configurar sua API nativa.

Notas publicadas aparecem em `/notas/`, das mais recentes para as mais antigas, e podem integrar o destaque da página inicial. Se o repositório estiver vazio, a página informa que ainda não há notas. O site não publica artigos de exemplo para preencher o catálogo.

### Encontros

[oxide-club/meetings](https://github.com/oxide-club/meetings) é a fonte de `/encontros/` e das páginas permanentes `/encontros/<id>/`. Cada definição fica em `meetings/NNN-titulo.md`. O nome do arquivo determina o identificador canônico. Não adicione `slug` nem renomeie um arquivo publicado.

A listagem ordena os encontros por `startsAt`, do mais recente para o mais antigo. Ela inclui datas futuras e passadas na mesma sequência. O site não calcula estados com base no relógio nem usa JavaScript no navegador para ordenar a lista.

Copie `templates/meeting.md` do repositório de origem. Substitua as datas ilustrativas e escreva a pauta em Markdown.

Os campos obrigatórios são `title`, `summary`, `startsAt`, `endsAt`, `timeZone`, `format` e `createdAt`. Datas com horário devem declarar o deslocamento em relação ao UTC. O término deve ocorrer depois do início. A apresentação usa o fuso IANA declarado e mostra também a data final quando o encontro atravessa a meia-noite.

`format` aceita `online`, `presencial` e `hibrido`. Se houver presença física, declare `location`. `platform` e `participationUrl` são opcionais. Os autores definem os links de acesso. O site não os remove com base no relógio do navegador. Encontros cancelados não exibem o botão de participação.

Use `draft: true` durante a preparação. Rascunhos são validados, mas não geram páginas, anexos nem entradas no calendário. Um repositório documentado e vazio é válido e produz a agenda e o calendário vazios. Modelos ficam fora da coleção.

Para visualizar conteúdo local ainda sem commit:

```sh
MEETINGS_SOURCE=/caminho/absoluto/para/meetings npm run dev
```

`MEETINGS_SOURCE` lê o checkout diretamente, sem copiá-lo. A CI e a produção rejeitam essa variável. Assim como nas notas, use temporariamente `draft: false` apenas no checkout local quando precisar inspecionar um artigo. A produção sempre busca uma revisão da `main` pública.

Guarde anexos pequenos em `assets/<id>/` no repositório de origem. Para incluir um link no roteiro, use `../assets/<id>/arquivo.pdf`. Os anexos seguem as mesmas regras das notas: arquivos regulares nos formatos PNG, JPEG, WebP, GIF, AVIF, PDF, TXT, CSV e JSON. A validação rejeita links simbólicos, HTML executável e HTML embutido. Imagens em Markdown exigem texto alternativo.

Para incluir um link para outro encontro, use `./NNN-titulo.md#secao`. Use links externos para gravações e arquivos grandes. O código pode permanecer versionado no repositório de origem, com link para o GitHub.

Apenas anexos de encontros publicados recebem rotas em `/encontros/<id>/assets/<arquivo>`.

O campo opcional `materials` contém objetos `{title, type, url}`. Os tipos são `slides`, `document`, `code`, `recording`, `transcript` e `reference`. As URLs devem usar HTTPS sem credenciais ou apontar para anexos do próprio encontro. Se `materials` estiver ausente ou vazio, o site omite a seção inteira.

O Markdown também pode conter referências comentadas. Evite repetir a mesma lista nos dois lugares. O índice contém links para as seções Markdown e para o bloco de materiais, quando presente.

#### Revisões e cancelamentos no calendário

Cada encontro gera `/encontros/<id>/calendario.ics`. O endereço de assinatura é `https://oxideclub.dev/encontros/calendario.ics`. Importar um arquivo individual não garante atualizações. Para recebê-las, assine a URL em um aplicativo de calendário compatível. A frequência de consulta e a apresentação de cancelamentos dependem do aplicativo.

A geração segue o [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html): instantes em UTC, UID estável derivado do nome canônico do arquivo, registros de horário baseados nos metadados, `SEQUENCE`, escape de texto, CRLF e quebra de linhas que preserva os caracteres UTF-8.

`createdAt` é obrigatório e não deve mudar após a publicação. A cada edição publicada, incremente `sequence` e defina `updatedAt`. Esses campos registram revisões editoriais reais. Repetir o build não altera os horários do calendário. O calendário inclui encontros cancelados com `STATUS:CANCELLED`. Para cancelar um encontro publicado, não exclua seu arquivo nem o transforme em rascunho.

Para reagendar um encontro:

1. Preserve o identificador.
2. Registre o início anterior em `previousStartsAt`.
3. Altere `startsAt` e `endsAt`.
4. Explique a mudança em `changeNotice`.
5. Incremente `sequence` e defina `updatedAt`.

Para cancelar, defina `cancelled: true`, explique o motivo em `changeNotice`, incremente `sequence` e defina `updatedAt`. Mantenha o registro e os materiais disponíveis. Para adiamentos sem nova data, siga o guia de contribuição do repositório de origem.

`public/_headers` também define os cabeçalhos HTTP das rotas estáticas de calendário. Essas regras são necessárias porque o Cloudflare entrega os arquivos após o build do Astro. Não há API de calendário nem serviço em tempo de execução.

Execute `npm run test:meetings` para verificar builds isolados vazios, publicados e com rascunhos, além dos calendários, anexos, acessibilidade e apresentação em telas grandes e pequenas. Os testes usam conteúdo sintético temporário, nunca publicado. Para usar o Chromium do sistema, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. A suíte de integração de notas também precisa da revisão de encontros sincronizada.

### Laboratórios

O catálogo `/labs/` lê o conteúdo de [oxide-club/labs](https://github.com/oxide-club/labs), sincronizado em `.content/labs/`. Cada roteiro fica em `NNN-nome/index.md`. Use exatamente estes oito títulos de seção, nesta ordem:

1. `O que vamos investigar`
2. `Antes de começar`
3. `Materiais`
4. `Etapas da investigação`
5. `Critérios de conclusão`
6. `Extensões opcionais`
7. `Participação no clube`
8. `Referências e atividades relacionadas`

Os diretórios auxiliares `templates`, `scripts`, `tests`, `docs` e `licenses` não geram páginas. Rascunhos não geram rotas, arquivos para download ou entradas no sitemap.

Para visualizar uma fonte local:

```sh
LABS_SOURCE=/caminho/absoluto/labs npm run dev
```

A CI e a produção rejeitam `LABS_SOURCE`. A variável `LABS_COMMIT` identifica a revisão sincronizada que as etapas seguintes devem reutilizar.

A página inicial inclui laboratórios nos destaques editoriais e nas publicações recentes, além dos links para o catálogo. Consulte a seção de configuração da home acima.

O build gera `/labs/<slug>/materiais.zip` com roteiro, materiais, verificações, modelo de relato, licenças e `SOURCE.txt`. O pacote usa a mesma fonte da página. Ele não inclui soluções de referência nem executáveis compilados.

Os arquivos individuais ficam em `/labs/<slug>/assets/`. Consulte o guia do repositório de conteúdo para preparar o modelo de relato e incluir as licenças necessárias.

Depois de sincronizar as fontes, execute `npm run test:labs`. Os testes de navegador também verificam navegação, acessibilidade, apresentação em telas estreitas e downloads de laboratórios.

#### Ordem de ativação

1. Publique o conteúdo validado na branch `main` de `oxide-club/labs`.
2. Sincronize o site sem `LABS_SOURCE`.
3. Confira o commit selecionado e integre a versão do site que lê essa fonte.
4. Após o deploy, confira as rotas dos laboratórios, o sitemap, o ZIP e `publication-manifest.json` na hospedagem.

Não publique a versão do site que depende dos laboratórios antes de disponibilizar a fonte remota. Os laboratórios publicados também entram em `#novidades`. Consulte a [ativação dos anúncios de laboratórios](docs/DISCORD-NOTIFICATIONS.md#laboratórios-em-novidades).

### Links da comunidade

Os destinos da comunidade e dos canais de relato ficam em `src/config/links.json`. Destinos ausentes não são exibidos na interface; só adicione links para destinos existentes.

## Sincronização do conteúdo canônico

`npm run dev`, `npm test`, `npm run check`, `npm run build` e `npm run build:production` sincronizam o conteúdo antes de executar. Por padrão, buscam a `main` mais recente de cinco repositórios públicos: `challenges`, `solutions`, `notes`, `meetings` e `labs`.

Há duas exceções: as fontes locais permitidas e as revisões já selecionadas para o job da CI. Cada job é uma sequência de etapas do workflow executada no mesmo ambiente.

Para sincronizar o conteúdo sem iniciar outro comando:

```sh
npm run content:sync
```

O script informa o commit de cada fonte. O Git ignora os checkouts gerados:

| Fonte        | Checkout               | Variável que identifica a revisão selecionada |
| ------------ | ---------------------- | --------------------------------------------- |
| `challenges` | `.content/challenges/` | `CHALLENGES_COMMIT`                           |
| `solutions`  | `.content/solutions/`  | `SOLUTIONS_COMMIT`                            |
| `notes`      | `.content/notes/`      | `NOTES_COMMIT`                                |
| `meetings`   | `.content/meetings/`   | `MEETINGS_COMMIT`                             |
| `labs`       | `.content/labs/`       | `LABS_COMMIT`                                 |

Esses checkouts não são cópias para edição. Se a busca falhar, o comando termina com erro, sem usar silenciosamente uma versão anterior em cache. Se houver alterações locais no checkout gerado, a sincronização é interrompida para preservá-las.

O job de verificação sincroniza o conteúdo no início e exporta as variáveis da tabela para as etapas seguintes. Assim, a validação, os testes e o build usam as mesmas revisões. No workflow de produção, esse job gera e testa a versão de produção. O job de deploy recebe o `dist/` como artefato da mesma execução e publica esses arquivos, sem sincronizar o conteúdo ou gerar outro build.

Uma nova execução busca novamente a `main` mais recente. Comandos locais independentes também buscam a versão mais recente por padrão.

Pushes para a `main` das fontes acionam **Deploy production** quando alteram arquivos previstos nos filtros de publicação:

- **challenges:** `*/index.md` e `areas.json`.
- **notes:** `*/index.md` e `*/assets/**`, exceto `docs/**` e `templates/**`.
- **meetings:** `meetings/*.md` e `assets/**`, sem documentação e modelos.
- **solutions:** `*/community.yaml` e `community.schema.json`. O site lê somente os metadados; o código dos participantes permanece externo.
- **labs:** roteiros, materiais, verificações, modelos de relato e licenças. Consulte `.github/workflows/deploy-website.yml` na revisão da fonte para conferir a lista de caminhos que acionam a publicação.

Os filtros cobrem adições, edições, exclusões e renomeações. Documentação, testes e dados de teste dos desafios não acionam o deploy. Alterações em rascunhos de notas acionam a validação, mas não tornam esses rascunhos públicos. Pull requests e pushes para outras branches das fontes não acionam o deploy de produção.

### Configuração inicial do disparo

Para permitir que os repositórios de conteúdo solicitem a publicação do site:

1. Crie um token de acesso pessoal com permissões granulares. Use uma conta com acesso a `oxide-club/oxideclub.dev`.
2. Restrinja o token a esse repositório e conceda a permissão **Actions: read and write**.
3. Se a organização exigir aprovação, conclua essa etapa.
4. Salve o token como secret do Actions com o nome `WEBSITE_DEPLOY_TOKEN` em `challenges`, `solutions`, `notes`, `meetings` e `labs`. Você também pode usar um secret da organização disponível somente para esses repositórios.
5. Renove o token antes de expirar.

O `GITHUB_TOKEN` padrão das fontes não pode acionar workflows em outro repositório. Os repositórios de conteúdo não precisam de credenciais do Cloudflare.

Mantenha `.github/workflows/deploy-website.yml` na `main` de cada fonte. No repositório do site, `deploy.yml` deve permanecer na `main`, com `workflow_dispatch` habilitado. Se as credenciais de disparo estiverem ausentes ou inválidas, o workflow da fonte falha.

O workflow da fonte informa se o GitHub aceitou a solicitação. Isso não confirma que o site foi publicado. Acompanhe **Deploy production** neste repositório para conferir os testes e o deploy. As regras do ambiente de produção e o controle de concorrência continuam valendo.

Cada execução busca o conteúdo mais recente. Essa revisão pode incluir merges posteriores ao commit que solicitou a publicação. Se o disparo ou o deploy falhar, um mantenedor pode executar **Deploy production** manualmente.

A revisão de `solutions` deve conter `community.schema.json` e catálogos válidos para seus diretórios de desafios. Se esses contratos estiverem ausentes ou os metadados forem inválidos, a sincronização termina com erro.

Os testes com repositórios Git temporários verificam a reutilização de revisões, a incorporação de novos commits e a preservação de alterações nos caches. Esses testes não verificam secrets remotos nem o disparo real entre repositórios.

O Cloudflare redireciona URLs antigas conforme `public/_redirects`. A prévia local do Astro não simula essas regras.

## Deploy

A produção é hospedada em **https://oxideclub.dev**. O arquivo [wrangler.jsonc](wrangler.jsonc) configura o Worker `oxideclub-dev`, o domínio personalizado e os arquivos estáticos de `dist/`, incluindo a página 404.

Pushes para a `main`, inclusive merges de pull requests, acionam **Deploy production**. A exceção ocorre quando todas as alterações se limitam a `README.md`, `CONTRIBUTING.md`, `LICENSING.md`, `LICENSE` ou `docs/`. Se o push alterar qualquer outro arquivo, o workflow executa.

Pull requests e pushes para outras branches executam **Check website** separadamente. Isso inclui alterações somente de documentação, para permitir a conclusão das verificações obrigatórias.

Mantenedores e repositórios de conteúdo também podem acionar **Deploy production** por `workflow_dispatch`. Esse disparo ignora os filtros de caminho, mas mantém as verificações exigidas.

O workflow de produção segue esta sequência:

1. Executa **Check website**, definido em `.github/workflows/check.yml`, com a opção `production` ativada.
2. No job de verificação, sincroniza o conteúdo, executa os testes unitários e as verificações do Astro, valida os requisitos de publicação e gera o build de produção.
3. Executa os testes de navegador sobre esse build e as quatro suítes de integração em diretórios isolados.
4. Se todas as verificações passarem, disponibiliza `dist/` no artefato `tested-site`, com retenção de sete dias.
5. O job de deploy baixa esse artefato da mesma execução e publica com o Wrangler. Não sincroniza conteúdo, repete testes ou gera outro build.
6. Compara as respostas públicas com os arquivos recebidos em `dist/`. Se a verificação falhar, o job falha e os anúncios no Discord não executam.

As etapas seguintes à sincronização reutilizam os commits selecionados no início do job de verificação. Em PRs e pushes para outras branches, **Check website** gera uma prévia e não disponibiliza o artefato de produção. O artefato serve à transferência entre jobs; não é um arquivo permanente de publicações.

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

Os dois comandos executam `scripts/release-check.mjs`. Esse script valida a configuração dos links obrigatórios e os registros de revisão em `src/config/release.json`. Ele não testa se os destinos estão acessíveis.

O comando de deploy gera novamente a saída que permite indexação antes de chamar o Wrangler. Use o workflow ou `npm run deploy` para evitar publicar uma prévia por engano.

O deploy local não executa a suíte completa de testes. Antes de publicar localmente, execute as [verificações](#como-executar-as-verificações).

### Verificação após o deploy

O workflow executa `npm run verify:deployment` depois da publicação. A checagem usa o `dist/` gerado para aquele deploy e verifica:

- Página inicial e manifesto de publicação.
- Índice do sitemap e seus arquivos gerados.
- Catálogos de desafios e laboratórios.
- Primeiro desafio e primeiro laboratório publicados, por identificador, incluindo o ZIP do laboratório.
- Resposta HTTP 404 e conteúdo da página de erro em uma URL inexistente.

Se uma coleção estiver vazia, a checagem verifica somente seu catálogo e informa a ausência de itens. Para cada rota, compara o status HTTP e os bytes da resposta com o arquivo local. Assim, uma resposta HTTP 200 com conteúdo antigo ou com HTML no lugar de um ZIP também falha.

A checagem faz até quatro tentativas por rota, com timeout de dez segundos e intervalo de cinco segundos. Ela repete somente as requisições que falharam. Não executa rollback: uma falha depois da publicação exige verificar a produção e corrigir o problema antes de solicitar outro deploy.

Para repetir a checagem após um deploy local, preserve o `dist/` que foi publicado e execute:

```sh
npm run verify:deployment
```

Não gere outro build para usar como referência: os conteúdos ou a configuração editorial podem mudar. O comando rejeita builds de prévia e consulta `https://oxideclub.dev` sem credenciais de deploy. Ele verifica uma amostra das páginas, não todos os links externos nem toda a experiência de navegação.

Mantenha os registros de revisão fiéis ao que foi verificado. As revisões manuais de acessibilidade foram confirmadas pelo responsável em 25 de outubro de 2026; a exceção `manualAccessibilityReviewDeferred` está desativada. A confirmação e o histórico estão registrados em [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Design system

Consulte [o guia de componentes, tokens e padrões](docs/DESIGN-SYSTEM.md). A referência visual está em `/internal/design-system` durante `npm run dev` e não é incluída no build publicado.

## Identidade visual

O arquivo vetorial original é `oxide-club.svg`. Cabeçalho e rodapé usam `public/branding/oxide-core.svg`, cujo `viewBox` remove margens externas preservando os caminhos e as cores originais. Os arquivos gerados incluem ícones PNG, um ICO e uma imagem de compartilhamento de 1200 × 630 pixels.

Para gerar novamente esses arquivos, instale librsvg, com `rsvg-convert`, e ImageMagick, com `magick`, e execute:

```sh
node scripts/build-branding.mjs
```

Os arquivos gerados são versionados junto com a fonte. Gerá-los novamente é uma tarefa de manutenção, não um requisito da CI. Os avisos de licença das fontes ficam em `public/licenses/`.

## Notificações no Discord

Quando as notificações estão ativas, o Discord divulga propostas de desafios e notas em `#contribuicoes`, com link para o pull request. Após o merge, a publicação e a verificação pós-deploy, `#novidades` recebe os links de desafios, notas e laboratórios publicados.

Para ativar as notificações, configure estes secrets do Actions:

- `DISCORD_CONTRIBUTIONS_WEBHOOK_URL` nos repositórios de desafios e notas.
- `DISCORD_ANNOUNCEMENTS_WEBHOOK_URL` neste repositório.

Antes de habilitar os anúncios, registre o catálogo já publicado como baseline. Esse registro evita anunciar retroativamente o conteúdo existente na ativação inicial. Ao adicionar laboratórios a uma instalação já ativa, os laboratórios publicados ainda sem registro serão anunciados no primeiro deploy. Siga o [guia de configuração, baseline e recuperação](docs/DISCORD-NOTIFICATIONS.md#ativação-pelos-mantenedores).

## Licenças

O código original do site usa a [licença MIT](LICENSE).

Os textos e a documentação originais de `oxide-club/notes` e `oxide-club/meetings` usam CC BY 4.0. Essa licença também se aplica aos textos educacionais de `oxide-club/challenges`, conforme os avisos do repositório de origem. Os dados de teste dos desafios usam CC0 1.0, e seu código executável usa MIT.

Outros textos editoriais, logos e ilustrações ficam fora do escopo da licença MIT do código do site. Materiais de terceiros mantêm suas próprias licenças. Consulte [LICENSING.md](LICENSING.md) para conferir o escopo completo.

### Áreas dos laboratórios

`labs/areas.json` define a ordem editorial, IDs, slugs, títulos e descrições.
Cada roteiro, inclusive draft, exige `area` conhecida. O catálogo agrupa apenas
publicados, ordena por ID e omite áreas vazias. Os cards mostram título compacto,
dificuldade e pergunta; a página individual preserva os detalhes.
Publique primeiro o registro e os metadados em labs; depois atualize o website
que exige esse contrato. Não edite `.content/labs` manualmente.
