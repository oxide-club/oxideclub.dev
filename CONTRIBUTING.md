# Contribuir com o Oxide Club

Dúvidas, experimentos parciais e sugestões são bem-vindos. Siga o código de conduta. Você pode conversar no [Discord](https://discord.gg/cgFWUkgRfX); saber usar Git não é um requisito para participar ou propor um texto.

Para alterar o site, descreva o problema, a mudança e como a verificou. Rode `npm test`, `npm run check`, `npm run build` e os testes de navegador. Inclua verificações de teclado, tela pequena e contraste quando alterar a interface. Não adicione eventos, destinos ou atividades sem confirmação.

Nosso método é **Explorar → Experimentar → Explicar**. Para propor um desafio, envie a definição e os testes ao [repositório challenges](https://github.com/oxide-club/challenges). Defina objetivo, pré-requisitos, ambiente quando relevante, escopo mínimo, forma de verificação e extensões opcionais. O resultado pode ser código, medições, uma correção, uma explicação ou um relato técnico; um programa completo não é obrigatório para todo desafio.

Use uma ou mais categorias: **Construir** (`build`), **Investigar** (`investigate`), **Depurar** (`debug`), **Otimizar** (`optimize`) e **Experimentar** (`experiment`). Elas indicam atividades, não dificuldade. Qualquer categoria pode ser iniciante, intermediária ou avançada.

Em desafios de implementação, especifique o comportamento observável e os casos de erro. Em investigações e experimentos, explique hipóteses, evidências e limites da observação. Teste os exemplos. As discussões do Discord apontam para a especificação canônica no site.

Artigos e notas serão revisados antes de publicação. O autor mantém seus direitos. Registre separadamente sua permissão para publicar e qualquer licença de reutilização que ele escolher. O código original do site usa a [licença MIT](LICENSE), e contribuições de código destinadas à incorporação devem usar essa mesma licença. Textos editoriais e identidade visual ficam fora desse escopo, conforme [LICENSING.md](LICENSING.md). Nenhuma cessão de direitos é exigida.

Não inclua tokens, informações pessoais, conversas privadas ou material sem permissão. Relatos de moderação não devem ir em issues públicas. Envie relatos privados para [report@oxideclub.dev](mailto:report@oxideclub.dev).

O site busca o `main` de `challenges` antes de iniciar desenvolvimento, validação ou build. Não edite `.content/challenges/`: esse checkout é gerado. Notas técnicas continuam em `src/content/notes/`.
