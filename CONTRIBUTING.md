# Contribuir com o Oxide Club

Dúvidas, experimentos parciais e sugestões são bem-vindos. Siga o [código de conduta](https://oxideclub.dev/codigo-de-conduta/). Você pode conversar no [Discord](https://discord.gg/cgFWUkgRfX) sem saber usar Git. Git também não é um requisito para propor um texto.

## Onde propor uma alteração

| Contribuição                                                | Repositório                                            |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| Código, estilos e configurações do site                     | Este repositório                                       |
| Enunciados de desafios e testes públicos                    | [challenges](https://github.com/oxide-club/challenges) |
| Soluções oficiais e links para implementações da comunidade | [solutions](https://github.com/oxide-club/solutions)   |
| Notas e textos técnicos                                     | [notes](https://github.com/oxide-club/notes)           |
| Pautas, registros e materiais de encontros                  | [meetings](https://github.com/oxide-club/meetings)     |
| Roteiros e materiais de laboratórios                        | [labs](https://github.com/oxide-club/labs)             |
| Trilhas de aprendizagem                                     | [roadmaps](https://github.com/oxide-club/roadmaps)     |

Siga o modelo e o guia de contribuição do repositório de origem. Não inclua tokens, dados pessoais privados, conversas privadas ou material sem permissão. Não envie relatos de moderação em issues públicas. Use [report@oxideclub.dev](mailto:report@oxideclub.dev) para relatos privados.

## Alterações no site

No pull request, descreva o problema, a mudança e como você a verificou.

1. Execute `npm test` e `npm run check`.
2. Gere o site com `npm run build`.
3. Execute `npm run test:browser`.
4. Execute as suítes de integração relacionadas à mudança: `test:community`, `test:notes`, `test:meetings`, `test:labs` ou `test:roadmaps`, com `npm run`.
5. Se alterar a interface, confira o uso por teclado, a apresentação em tela pequena e o contraste.

Consulte os [pré-requisitos e comandos de verificação](README.md#como-executar-as-verificações), incluindo a instalação do Chromium. Não adicione eventos, destinos ou atividades sem confirmação.

A verificação pós-deploy é uma etapa do workflow de produção. Ela compara as respostas públicas com o build publicado e impede anúncios se falhar. Essa etapa não substitui os testes anteriores ao deploy nem exige credenciais de produção de quem envia um pull request.

## Desafios

Nosso método é **Explorar → Experimentar → Explicar**. Envie o enunciado e os testes ao [repositório challenges](https://github.com/oxide-club/challenges).

Defina o objetivo, os pré-requisitos, o escopo mínimo e a forma de verificação. Declare o ambiente quando o resultado depender dele. Separe as extensões opcionais dos requisitos obrigatórios.

O resultado pode ser código, medições, uma correção, uma explicação ou um relato técnico. Nem todo desafio exige um programa completo.

Use uma ou mais categorias:

- **Construir** (`build`).
- **Investigar** (`investigate`).
- **Depurar** (`debug`).
- **Otimizar** (`optimize`).
- **Experimentar** (`experiment`).

As categorias indicam atividades, não dificuldade. Qualquer categoria pode ter dificuldade iniciante, intermediária ou avançada. Declare também a área principal conforme o registro `areas.json` do repositório de desafios.

Em desafios de implementação, especifique o comportamento observável e os casos de erro. Em investigações e experimentos, diferencie hipóteses, evidências e limites da observação. Teste os exemplos. Nas discussões do Discord, use links para a especificação canônica no site.

## Implementações da comunidade

Para incluir sua implementação no catálogo, siga o [guia de solutions](https://github.com/oxide-club/solutions/blob/main/CONTRIBUTING.md). O código permanece no seu repositório. O catálogo registra o link e os metadados da contribuição.

Não adicione esses registros ao frontmatter dos desafios nem crie um catálogo separado neste repositório. Use o arquivo `community.yaml` do desafio no repositório `solutions`, conforme o guia da fonte.

## Notas técnicas

Proponha notas no [repositório notes](https://github.com/oxide-club/notes), seguindo seu modelo e guia de contribuição. Os textos podem tratar de Ciência da Computação em geral; não precisam estar relacionados a um desafio.

A prosa e a documentação originais das notas são contribuídas sob CC BY 4.0, na medida dos direitos do autor. A publicação preserva a atribuição e depende de revisão. O autor mantém seus direitos; não se exige cessão de direitos autorais.

## Encontros

Proponha pautas, registros e materiais em [oxide-club/meetings](https://github.com/oxide-club/meetings). Siga o modelo e o guia desse repositório.

Cada arquivo `meetings/NNN-titulo.md` define uma página permanente. O site não mantém cópias para edição. Consulte o [README](README.md#encontros) para calendário, revisões, cancelamentos e publicação automática.

A prosa e a documentação originais dos encontros seguem CC BY 4.0, na medida dos direitos de seus autores e conforme os avisos da fonte. Preserve atribuições, referencie a licença e indique alterações.

Código substancial que possa ser reutilizado como software independente exige uma licença de software separada. Anexos e materiais de terceiros mantêm seus próprios termos. Consulte [LICENSING.md](LICENSING.md).

## Laboratórios

Proponha roteiros e materiais em [oxide-club/labs](https://github.com/oxide-club/labs). O site exige título no formato “Laboratório de X”, pergunta central, resumo, pré-requisitos, ferramentas, ambiente, assuntos, dificuldade e estado de publicação.

O campo `slug` deve coincidir com o nome do diretório `NNN-nome`. Se o laboratório estiver publicado, declare `publishedAt`. Use as oito seções do modelo, na ordem estabelecida.

Para relacionar atividades, use os identificadores em `relatedLabs` e `relatedChallenges`. Os destinos devem estar publicados.

Coloque materiais em `materials/` e verificações em `checks/`. Na raiz, o pacote inclui o roteiro `index.md` e pode incluir `report-template.md`. Os formatos aceitos são `.md`, `.txt`, `.c`, `.h`, `.py`, `.json` e `.csv`. Consulte as [regras de arquivos distribuídos](src/lib/lab-files.mjs).

Não inclua links simbólicos, artefatos compilados ou diretórios de dependências. O site valida os links relativos e os converte em links para download.

Os blocos expansíveis aceitam somente `details` e `summary`, sem atributos. Mantenha as instruções essenciais fora desses blocos.

## Como visualizar conteúdo local

Antes de iniciar o desenvolvimento, os testes unitários, a validação ou o build, o site sincroniza as seis fontes: `challenges`, `solutions`, `notes`, `meetings`, `labs` e `roadmaps`. Por padrão, usa a branch `main`; na CI, as etapas reutilizam as revisões selecionadas para o job.

Não edite os checkouts em `.content/`. Eles são cópias geradas pela sincronização. Faça as alterações no repositório de origem e indique seu caminho ao iniciar o site.

Para visualizar uma nota local, execute no diretório do site:

```sh
NOTES_SOURCE=/caminho/absoluto/para/notes npm run dev
```

Para visualizar encontros locais:

```sh
MEETINGS_SOURCE=/caminho/absoluto/para/meetings npm run dev
```

Use `CHALLENGES_SOURCE`, `SOLUTIONS_SOURCE`, `LABS_SOURCE` ou `ROADMAPS_SOURCE` para as outras fontes. Essas variáveis são permitidas somente fora da CI e da produção.

Rascunhos são validados, mas não geram páginas, inclusive nas prévias locais. Consulte o [README](README.md#publicação-de-conteúdo) para visualizar rascunhos, incluir anexos e solicitar publicação pelo workflow existente.

## Licenças

O código original do site usa a [licença MIT](LICENSE). Contribuições de código destinadas à incorporação devem usar essa mesma licença. Nenhuma cessão de direitos autorais é exigida.

As notas e os encontros seguem os termos descritos nas respectivas seções. Os laboratórios seguem os avisos do repositório de origem. Outros textos editoriais e a identidade visual ficam fora do escopo da licença MIT do código do site. Consulte [LICENSING.md](LICENSING.md) para conferir o escopo de cada licença.

## Divulgação das contribuições

Quando as notificações estão ativas, pull requests prontos para revisão que adicionam desafios ou notas são divulgados em `#contribuicoes`, com link para a proposta.

Após o merge, a publicação e a verificação pós-deploy, a primeira publicação de cada página é anunciada em `#novidades`, com link para o site. Correções em conteúdo existente não geram novos anúncios de publicação. Os anúncios de publicação também incluem laboratórios em `/labs/<id>`.

Consulte o [guia de operação das notificações](docs/DISCORD-NOTIFICATIONS.md) para configuração e recuperação de falhas.

## Roadmaps

As trilhas conectam desafios, laboratórios e notas técnicas. O conteúdo curricular fica em [oxide-club/roadmaps](https://github.com/oxide-club/roadmaps); o site calcula os diagramas e preserva os destinos canônicos. Consulte [a documentação de roadmaps](docs/ROADMAPS.md) para formato, prévia local, validação e ordem de ativação da fonte remota.

Use `ROADMAPS_SOURCE=/caminho/absoluto/roadmaps` na prévia local. A sincronização fixa a revisão em `ROADMAPS_COMMIT` e mantém o checkout gerado em `.content/roadmaps/`. CI e produção devem usar a fonte remota.
