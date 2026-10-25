# Design system do Oxide Club

O sistema mantém a identidade grafite e cobre, a leitura em Inter e os metadados em IBM Plex Mono. A implementação usa Astro, HTML nativo e CSS, sem biblioteca externa ou hidratação adicional.

## Referência visual

Execute `npm run dev` e abra `/internal/design-system`. A página usa os componentes reais e apresenta ações, estados desabilitados, campos, dificuldade, tags, avisos e seção de catálogo. Não gera uma rota no build e não entra no sitemap. Não use esse endereço em links públicos.

## Fundamentos

`src/styles/tokens.css` é a fonte dos valores compartilhados:

- `--color-*`: fundo, superfície, texto, texto secundário, destaque, texto sobre destaque, borda e foco; estados hover e borda forte têm nomes próprios.
- `--space-*`: escala em múltiplos de 4px, de 4 a 80px. O sufixo representa a quantidade de unidades de 4px.
- `--text-*`: papéis de texto, de metadados a títulos de cards e seções. Títulos fluidos de página continuam específicos do layout.
- `--radius-sm`, `--radius-control`, `--radius`: tags, controles e cards.
- `--control-height`, `--action-height`: alvos de 44px e ações principais de 48px.
- `--reading-width`: largura de leitura de 72ch; `--container`: limite de página de 1120px.
- `--motion-fast`, `--motion-easing`: transições; respeitar `prefers-reduced-motion`.

Os breakpoints são orientados ao conteúdo: 650px para catálogos/campos, 700px para seções gerais, 800px para leitura. O cabeçalho conserva seus próprios pontos de quebra. Variáveis CSS comuns não são usadas em condições de media queries.

Use o token quando o valor representar uma decisão compartilhada. Valores de ilustrações, alinhamentos ópticos e layouts específicos podem permanecer locais.

## Componentes

As primitivas ficam em `src/components/ui/`. Atributos HTML, incluindo `aria-*`, `data-*`, `class`, `download`, `name` e `disabled`, são encaminhados ao elemento nativo correspondente.

| Componente         | Contrato e uso                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`           | Ação local. `type="button"` por padrão; declarar `submit` ou `reset` quando necessário. Variantes `primary`, `secondary`, `quiet`.               |
| `ButtonLink`       | Navegação com aparência de botão. Informar `href`; aceita as mesmas variantes. Não simular desabilitação com `disabled` em links.                |
| `TextLink`         | Navegação editorial com área de toque e decoração compartilhadas. Conteúdo no slot.                                                              |
| `Input`            | Campo nativo, com estilo e foco compartilhados. Associar a um label por `id`/`for` ou aninhamento.                                               |
| `Select`           | Seleção nativa; opções no slot. Mesmo contrato de label do Input.                                                                                |
| `DifficultyBadge`  | `level`: `beginner`, `intermediate`, `advanced`; `variant`: `text` (padrão) ou `badge`; `context` opcional. O nome traduzido é sempre visível.   |
| `CatalogueSection` | `area: { id, slug, title, description }`, `count`, `singular`, `plural`. Agrupa itens no slot, com h2 e âncora estável.                          |
| `ReadingLayout`    | `label`, `variant: challenge \| lab`. Conteúdo no slot padrão, índice no slot `index`. Renderiza o índice em disclosure móvel e sidebar desktop. |

O slot `index` é renderizado duas vezes: não inserir IDs fixos nele. Cada versão é exibida conforme a largura da tela. A variante de laboratório mantém a navegação numerada e sidebar sticky; os índices de domínio continuam responsáveis por seus links e nomes acessíveis.

```astro
---
import Button from '../components/ui/Button.astro';
import ButtonLink from '../components/ui/ButtonLink.astro';
import Select from '../components/ui/Select.astro';
---

<ButtonLink href="/desafios" variant="secondary">
  Explorar desafios
</ButtonLink>
<label for="area">Área</label>
<Select id="area" name="area">
  <option value="">Todas as áreas</option>
</Select>
<Button type="reset" variant="quiet">
  Limpar filtros
</Button>
```

As classes globais `.tag`, `.notice`, `.eyebrow`, `.prose`, `.section`, `.section-heading`, `.page-intro`, `.actions` e `.container` são padrões de composição. Não exigem wrappers Astro quando não há comportamento ou contrato adicional. `.button`, `.text-link` e `.field-control` implementam as primitivas; novos consumidores devem preferir seus componentes.

## Padrões editoriais

- Cards de destaque e itens compactos são variantes diferentes de conteúdo, não um componente universal.
- `ChallengeCard`, `LabCard` e as seções de domínio compõem os elementos comuns e preservam metadados próprios.
- A dificuldade usa o mesmo texto e tratamento nos catálogos. Iniciante recebe destaque cobre; a variante com borda é usada nos cards. Não depender somente de cor para comunicar nível.
- Filtros usam campos nativos e a ação `quiet` de limpeza. A lógica de busca, ordenação e URL permanece nos scripts de domínio.
- O cabeçalho de um laboratório pode destacar a pergunta central e usar título menor. Não confundir consistência com identidade de todos os layouts.

## Manutenção e validação

Antes de adicionar uma variante, procure um padrão existente. Quando houver repetição real, extraia a regra e atualize esta referência; evite parâmetros para necessidades hipotéticas. Mantenha o sistema no repositório enquanto houver apenas este consumidor.

Preserve foco visível, labels, ordem de títulos, nomes acessíveis, reduced motion, forced colors e navegação sem JavaScript. Alterações visuais devem ser conferidas com texto longo, 320px de largura e texto ampliado, além dos tamanhos usuais.

Validação normal: `npm test`, `npm run check`, `npm run build` e `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser`. Para a referência em desenvolvimento, com o servidor já iniciado:

```sh
SITE_TEST_URL=http://127.0.0.1:4321 DESIGN_SYSTEM_PREVIEW=true PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npx playwright test tests/browser/design-system.spec.ts
```

A suíte normal testa que a referência não é publicada; a execução de desenvolvimento testa seu uso e reflow.

## Bibliotecas externas

A consolidação não introduz dependências. Reavaliar uma biblioteca quando houver um componente interativo complexo que justifique seu custo: comportamento de teclado, manutenção, personalização, integração com Astro e JavaScript enviado ao navegador. Não migrar o sistema inteiro apenas para obter estilos de botões ou cards.
