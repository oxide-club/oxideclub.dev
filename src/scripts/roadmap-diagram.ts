import { layoutRoadmap } from '../lib/roadmap-layout.mjs';
import { relationLabel } from '../lib/roadmap-relations.mjs';
import type { RoadmapData } from '../lib/roadmap-types';

const svgNS = 'http://www.w3.org/2000/svg';
function initialize(viewer: HTMLElement, index: number) {
  const graph = viewer.querySelector<HTMLElement>('[data-roadmap-diagram]')!;
  const list = viewer.querySelector<HTMLElement>('[data-roadmap-list]')!;
  const controls = viewer.querySelector<HTMLElement>(
    '[data-roadmap-controls]',
  )!;
  const message = viewer.querySelector<HTMLElement>('[data-layout-message]')!;
  const data = JSON.parse(viewer.dataset.graph!) as Pick<
    RoadmapData,
    'nodes' | 'edges' | 'layout' | 'groups'
  >;
  const cards = [...list.querySelectorAll<HTMLElement>('[data-material]')].map(
    (source, i) => {
      const card = document.createElement('div');
      card.className = source.className;
      card.dataset.ref = source.dataset.ref;
      card.dataset.material = '';
      card.append(source.querySelector('article')!.cloneNode(true));
      card.dataset.roadmapNode = '';
      card.id = `roadmap-${index}-node-${i}`;
      card.setAttribute('role', 'group');
      graph.append(card);
      return card;
    },
  );
  const byRef = new Map(cards.map((card) => [card.dataset.ref!, card]));
  let frame = 0,
    revision = 0,
    mode = 'diagram',
    ready = false,
    signature = '',
    forceCompactWidth = -1;
  function activate() {
    graph.hidden = mode !== 'diagram';
    list.hidden = mode !== 'list';
    controls
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.view === mode)),
      );
  }
  controls.querySelectorAll<HTMLButtonElement>('button').forEach((button) =>
    button.addEventListener('click', () => {
      mode = button.dataset.view!;
      activate();
      if (mode === 'diagram') schedule();
    }),
  );
  const edgeText = relationLabel;
  function makeSvg(paths: { d: string; preparation: boolean }[]) {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    const defs = document.createElementNS(svgNS, 'defs');
    for (const type of ['normal', 'preparation']) {
      const marker = document.createElementNS(svgNS, 'marker');
      marker.id = `roadmap-${index}-arrow-${type}`;
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '7');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('orient', 'auto');
      const shape = document.createElementNS(svgNS, 'path');
      shape.setAttribute('d', 'M0 0L10 5L0 10Z');
      shape.style.fill =
        type === 'preparation'
          ? 'var(--color-muted)'
          : 'var(--color-accent-text)';
      marker.append(shape);
      defs.append(marker);
    }
    svg.append(defs);
    for (const p of paths) {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', p.d);
      path.setAttribute(
        'class',
        `roadmap-edge${p.preparation ? ' preparation' : ''}`,
      );
      path.setAttribute(
        'marker-end',
        `url(#roadmap-${index}-arrow-${p.preparation ? 'preparation' : 'normal'})`,
      );
      svg.append(path);
    }
    graph.prepend(svg);
  }
  function clearDrawing() {
    graph
      .querySelectorAll('svg,.roadmap-edge-label')
      .forEach((n) => n.remove());
  }
  async function draw() {
    const width = viewer.clientWidth;
    if (width < 100 || (ready && mode === 'list')) return;
    const compact = width < 760 || Math.abs(forceCompactWidth - width) < 1;
    graph.classList.toggle('compact', compact);
    graph.hidden = false;
    if (!ready) graph.classList.add('measuring');
    const sizes = Object.fromEntries(
      cards.map((card) => [
        card.dataset.ref!,
        {
          width: card.getBoundingClientRect().width,
          height: card.getBoundingClientRect().height,
        },
      ]),
    );
    const key = JSON.stringify([width, compact, sizes]);
    if (key === signature) {
      if (ready) activate();
      return;
    }
    signature = key;
    const ownRevision = ++revision;
    try {
      if (compact) {
        clearDrawing();
        let y = 24;
        const positions = new Map<
          string,
          { x: number; y: number; height: number }
        >();
        for (const card of cards) {
          const height = sizes[card.dataset.ref!].height;
          card.style.left = '48px';
          card.style.top = `${y}px`;
          positions.set(card.dataset.ref!, { x: 48, y, height });
          y += height + 36;
        }
        graph.style.height = `${y}px`;
        makeSvg(
          data.edges.map((edge, i) => {
            const a = positions.get(edge.from)!,
              b = positions.get(edge.to)!,
              lane = 10 + (i % 3) * 10;
            return {
              d: `M${a.x},${a.y + a.height - 18} H${lane} V${b.y + 18} H${b.x - 3}`,
              preparation: edge.type === 'suggested_preparation',
            };
          }),
        );
      } else {
        const labelSizes: Record<string, { width: number; height: number }> =
          {};
        for (const [i, edge] of data.edges.entries()) {
          const text = edgeText(edge);
          if (!text) continue;
          const label = document.createElement('span');
          label.className = 'roadmap-edge-label';
          label.textContent = text;
          label.style.visibility = 'hidden';
          graph.append(label);
          const rect = label.getBoundingClientRect();
          labelSizes[`edge-${i}`] = {
            width: Math.ceil(rect.width),
            height: Math.ceil(rect.height),
          };
          label.remove();
        }
        const result = await layoutRoadmap({ ...data, sizes, labelSizes });
        if (ownRevision !== revision) return;
        if (result.width > width) {
          forceCompactWidth = width;
          signature = '';
          schedule();
          return;
        }
        clearDrawing();
        const offset = (width - result.width) / 2;
        for (const node of result.nodes) {
          const card = byRef.get(node.ref)!;
          card.style.left = `${node.x + offset}px`;
          card.style.top = `${node.y}px`;
        }
        graph.style.height = `${result.height}px`;
        makeSvg(
          result.edges.flatMap((edge) =>
            edge.sections.map((section) => {
              const points = [
                section.startPoint,
                ...(section.bendPoints ?? []),
                section.endPoint,
              ];
              return {
                d: points
                  .map((p, i) => `${i ? 'L' : 'M'}${p.x + offset},${p.y}`)
                  .join(' '),
                preparation: edge.type === 'suggested_preparation',
              };
            }),
          ),
        );
        result.edges.forEach((edge, i) => {
          const text = edgeText(data.edges[i]);
          for (const label of edge.labels) {
            if (!text) continue;
            const element = document.createElement('span');
            element.className = 'roadmap-edge-label';
            element.textContent = text;
            element.setAttribute('aria-hidden', 'true');
            element.style.left = `${label.x + offset}px`;
            element.style.top = `${label.y}px`;
            graph.append(element);
          }
        });
      }
      graph.classList.remove('measuring');
      graph.dataset.ready = 'true';
      controls.hidden = false;
      if (!ready && list.contains(document.activeElement)) mode = 'list';
      ready = true;
      message.textContent = '';
      activate();
    } catch (error) {
      if (ownRevision !== revision) return;
      console.error('Roadmap layout failed', error);
      graph.hidden = true;
      graph.classList.remove('measuring');
      list.hidden = false;
      controls.hidden = true;
      ready = false;
      message.textContent =
        'O diagrama não pôde ser organizado. Todos os materiais e suas conexões estão disponíveis na lista.';
    }
  }
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      void draw();
    });
  }
  const observer = new ResizeObserver(schedule);
  observer.observe(viewer);
  cards.forEach((card) => observer.observe(card));
  void document.fonts.ready.then(schedule);
  document.fonts.addEventListener('loadingdone', schedule);
  window.addEventListener('resize', schedule);
}
document
  .querySelectorAll<HTMLElement>('[data-roadmap-viewer]')
  .forEach(initialize);
