# Trilhas de aprendizagem no site

Os roadmaps conectam desafios, laboratórios e notas técnicas em caminhos de aprendizagem. A fonte curricular fica em `oxide-club/roadmaps`; este repositório resolve referências, gera páginas e organiza os diagramas.

## Conteúdo e identidade

Cada trilha usa `<slug>/index.md`. O diretório define `/roadmaps/<slug>/`. O catálogo fica em `/roadmaps/`, com destaques editoriais antes das demais trilhas. Todas as trilhas publicadas continuam acessíveis diretamente.

O frontmatter declara público, pergunta, resumo, conhecimentos de entrada, objetivos e estado de publicação. `nodes` referencia materiais por `challenges:<id>`, `labs:<id>` ou `notes:<id>`. O site obtém título, resumo, dificuldade e destino das coleções canônicas. Notas usam o nome do diretório, sem exigir prefixo numérico ou dificuldade.

Uma trilha pode conter qualquer combinação das três modalidades, incluindo apenas notas. Não há distinção de papel curricular por modalidade. `context` explica a participação de um material nesta trilha; `relatedRoadmap` permite indicar uma preparação estudada em outra trilha publicada.

O schema JSON da fonte valida o formato dos metadados. O site valida também o grafo e os destinos. Referências inexistentes, em rascunho ou a laboratórios substituídos interrompem o build, com identificação do material e da trilha. Para remover uma página canônica ou torná-la rascunho, atualize primeiro as trilhas que a referenciam.

Rascunhos de trilhas têm metadados e grafo validados, mas não geram páginas ou entradas de sitemap. Os destinos canônicos são resolvidos para trilhas publicadas; um modelo em preparação pode conter referências ainda não publicadas.

## Relações e layout

As relações são progressão recomendada (`recommended_next`), preparação ou contexto (`suggested_preparation`), aprofundamento opcional (`branch`) e convergência (`convergence`). São recomendações editoriais; não existe desbloqueio de etapas. Posição no desenho não define dificuldade nem requisito obrigatório.

`layout.primaryPath` destaca um percurso já conectado. `layout.branchOrder` orienta a ordem das ramificações. `groups` identifica caminhos paralelos. Essas orientações não acrescentam arestas. O organizador pode ajustar a composição para reduzir cruzamentos; não há garantia de coluna central fixa para o percurso principal.

O HTML estático contém a lista completa de materiais e relações. O diagrama é um aprimoramento progressivo: mede os blocos, aguarda as fontes e usa [ELK Layered](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html) com direção descendente e roteamento ortogonal. O módulo [elkjs](https://github.com/kieler/elkjs) é carregado sob demanda nas páginas de trilhas. As posições não são mantidas no conteúdo curricular.

O `ResizeObserver` solicita novo cálculo quando os blocos mudam de tamanho. Resultados assíncronos antigos são descartados. Em telas estreitas ou quando o grafo excede a largura disponível, os blocos são empilhados em ordem compatível com as relações, com contexto textual e setas laterais. O texto não é reduzido para fazer o desenho caber.

A alternância entre diagrama e lista preserva os destinos e o foco no controle acionado. A lista permanece disponível se JavaScript estiver desativado ou o cálculo falhar. Relações essenciais têm representação textual; os traçados não dependem somente da cor. Os links mantêm o comportamento normal do navegador, incluindo abertura em outra aba por escolha do visitante.

## Fonte local e verificações

Use Node.js 24 e instale as dependências com `npm ci`. Para conferir alterações locais da fonte:

```sh
ROADMAPS_SOURCE=/caminho/absoluto/roadmaps npm run dev
ROADMAPS_SOURCE=/caminho/absoluto/roadmaps npm run check
ROADMAPS_SOURCE=/caminho/absoluto/roadmaps npm run build
```

`ROADMAPS_SOURCE` também pode selecionar a fonte antes dos testes unitários. Outras fontes locais podem exigir isolar as variáveis do ambiente dos testes que criam repositórios sintéticos; os cenários de integração mantêm fontes temporárias próprias.

Execute `npm test`, `npm run check`, `npm run build`, `npm run test:browser` e `npm run test:roadmaps`. A integração verifica notas em vários papéis curriculares, destinos canônicos, rascunhos, remoção de material e atualização de título entre builds. As suítes existentes de notas, encontros, laboratórios e implementações da comunidade usam uma fonte vazia de roadmaps para preservar a independência de seus cenários.

As verificações automatizadas incluem teclado, lista sem JavaScript, axe, telas estreitas e texto ampliado. Elas não substituem revisão manual com leitor de tela.

## Sincronização e ativação

`content:sync` busca `oxide-club/roadmaps`, branch `main`, para `.content/roadmaps/`. Esse checkout é gerado e não deve receber edições manuais. `ROADMAPS_COMMIT` fixa a revisão selecionada no início do job. Uma fonte indisponível ou inválida causa erro, sem usar silenciosamente uma cópia antiga. CI e produção rejeitam `ROADMAPS_SOURCE`.

Ative nesta ordem:

1. Disponibilize a fonte remota com licença, documentação, schema e trilhas validadas.
2. Confira a branch `main` e a revisão que o site sincronizará.
3. Integre a versão do site que exige essa sexta fonte e execute suas verificações.
4. Configure `WEBSITE_DEPLOY_TOKEN` no repositório da fonte para solicitar o workflow de publicação do site.
5. Após a publicação, confira catálogo, páginas, sitemap e destinos das três modalidades.

O token segue o padrão das outras fontes: acesso apenas ao repositório do site, com Actions read and write. O disparo aceito pelo GitHub não confirma que o site foi publicado. Alterações na `main` das trilhas ou no schema podem disparar deploy depois da configuração. Os roadmaps não são acrescentados automaticamente aos anúncios do Discord.
