# Contribuir com o Oxide Club

Dúvidas, experimentos parciais e sugestões são bem-vindos. Siga o código de conduta. Você pode conversar no [Discord](https://discord.gg/cgFWUkgRfX); saber usar Git não é um requisito para participar ou propor um texto.

Para alterar o site, descreva o problema, a mudança e como a verificou. Rode `npm test`, `npm run check`, `npm run build` e os testes de navegador. Inclua verificações de teclado, tela pequena e contraste quando alterar a interface. Não adicione eventos, destinos ou atividades sem confirmação.

Nosso método é **Explorar → Experimentar → Explicar**. Para propor um desafio, envie a definição e os testes ao [repositório challenges](https://github.com/oxide-club/challenges). Defina objetivo, pré-requisitos, ambiente quando relevante, escopo mínimo, forma de verificação e extensões opcionais. O resultado pode ser código, medições, uma correção, uma explicação ou um relato técnico; um programa completo não é obrigatório para todo desafio.

Use uma ou mais categorias: **Construir** (`build`), **Investigar** (`investigate`), **Depurar** (`debug`), **Otimizar** (`optimize`) e **Experimentar** (`experiment`). Elas indicam atividades, não dificuldade. Qualquer categoria pode ser iniciante, intermediária ou avançada.

Em desafios de implementação, especifique o comportamento observável e os casos de erro. Em investigações e experimentos, explique hipóteses, evidências e limites da observação. Teste os exemplos. As discussões do Discord apontam para a especificação canônica no site.

Proponha notas técnicas no [repositório notes](https://github.com/oxide-club/notes), seguindo seu guia de contribuição. A prosa e a documentação originais são contribuídas sob CC BY 4.0, na medida dos direitos do autor, com atribuição preservada e revisão antes da publicação. O autor mantém seus direitos. O código original do site usa a [licença MIT](LICENSE), e contribuições de código destinadas à incorporação devem usar essa mesma licença. As notas usam o escopo CC BY 4.0 descrito acima; outros textos editoriais e a identidade visual ficam fora do escopo MIT, conforme [LICENSING.md](LICENSING.md). Nenhuma cessão de direitos é exigida.

Não inclua tokens, informações pessoais, conversas privadas ou material sem permissão. Relatos de moderação não devem ir em issues públicas. Envie relatos privados para [report@oxideclub.dev](mailto:report@oxideclub.dev).

O site busca o `main` de `challenges`, `notes` e `meetings` antes de iniciar desenvolvimento, validação ou build. Não edite `.content/challenges/`, `.content/notes/` nem `.content/meetings/`: são checkouts gerados. Para uma prévia de notas locais, use `NOTES_SOURCE=/caminho/absoluto/para/notes npm run dev` no site. Consulte o README para rascunhos, anexos e publicação manual pelo workflow existente.

## Encontros

Proponha pautas, registros e materiais em [oxide-club/meetings](https://github.com/oxide-club/meetings), seguindo o modelo e o guia desse repositório. Cada arquivo em `meetings/NNN-titulo.md` define uma página permanente; o website não mantém cópias editoriais. Para uma prévia local use `MEETINGS_SOURCE=/caminho/absoluto/para/meetings npm run dev`. Consulte o README para calendário, revisões, cancelamentos e publicação automática.
