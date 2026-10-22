import { matchesChallenge } from '../lib/challenge-search.mjs';
import {
  parseListState,
  serializeListState,
  orderChallengeRows,
} from '../lib/challenge-list-state.mjs';

const root = document.querySelector<HTMLElement>('[data-challenge-list]');
if (root) {
  const form = root.querySelector<HTMLFormElement>('form')!;
  const query = form.querySelector<HTMLInputElement>('[name=q]')!;
  const area = form.querySelector<HTMLSelectElement>('[name=area]')!;
  const difficulty =
    form.querySelector<HTMLSelectElement>('[name=difficulty]')!;
  const areas = Array.from(area.options)
    .filter((option) => option.value)
    .map((option) => ({ id: option.value }));
  const body = root.querySelector('tbody')!;
  const empty = root.querySelector<HTMLElement>('.empty-results')!;
  const count = root.querySelector<HTMLElement>('[data-result-count]')!;
  const sort = root.querySelector<HTMLSelectElement>('[name=sort]')!;
  const direction = root.querySelector<HTMLButtonElement>(
    '[data-sort-direction]',
  )!;
  const rows = Array.from(body.querySelectorAll<HTMLTableRowElement>('tr')).map(
    (element) => ({
      element,
      id: element.dataset.id!,
      title: element.dataset.title!,
      area: element.dataset.area!,
      difficulty: element.dataset.difficulty!,
      search: element.dataset.search!,
    }),
  );
  let state = parseListState(new URLSearchParams(location.search), areas);

  function render() {
    query.value = state.q;
    area.value = state.area;
    difficulty.value = state.difficulty;
    sort.value = state.sort;
    direction.textContent = state.direction === 'asc' ? '↓' : '↑';
    direction.setAttribute(
      'aria-label',
      state.direction === 'asc' ? 'Ordem decrescente' : 'Ordem crescente',
    );
    let found = 0;
    for (const row of orderChallengeRows(rows, state)) {
      const visible =
        (!state.area || row.area === state.area) &&
        (!state.difficulty || row.difficulty === state.difficulty) &&
        matchesChallenge(row.search, [], state.q, '');
      row.element.hidden = !visible;
      if (visible) found++;
      body.append(row.element);
    }
    count.textContent = `${found} ${found === 1 ? 'desafio encontrado' : 'desafios encontrados'}`;
    empty.hidden = found > 0;
    root!
      .querySelectorAll<HTMLElement>('[data-sort-heading]')
      .forEach((heading) => {
        const selected = heading.dataset.sortHeading === state.sort;
        if (selected)
          heading.setAttribute(
            'aria-sort',
            state.direction === 'asc' ? 'ascending' : 'descending',
          );
        else heading.removeAttribute('aria-sort');
        const arrow = heading.querySelector('button span');
        if (arrow)
          arrow.textContent = selected
            ? state.direction === 'asc'
              ? '↑'
              : '↓'
            : '↕';
      });
    document.dispatchEvent(new Event('catalogue:updated'));
  }

  function update(mode: 'push' | 'replace') {
    render();
    const url = new URL(location.href);
    url.search = serializeListState(state).toString();
    if (url.href !== location.href)
      history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url);
  }

  function clear() {
    if (empty.contains(document.activeElement))
      form
        .querySelector<HTMLButtonElement>('[type=reset]')!
        .focus({ preventScroll: true });
    state = { ...state, q: '', area: '', difficulty: '' };
    update('push');
  }

  form.addEventListener('submit', (event) => event.preventDefault());
  query.addEventListener('input', () => {
    state.q = query.value;
    update('replace');
  });
  area.addEventListener('change', () => {
    state.area = area.value;
    update('push');
  });
  difficulty.addEventListener('change', () => {
    state.difficulty = difficulty.value;
    update('push');
  });
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    clear();
  });
  root.querySelector('[data-clear-filters]')!.addEventListener('click', clear);
  root.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const key = button.dataset.sort as typeof state.sort;
      state.direction =
        state.sort === key && state.direction === 'asc' ? 'desc' : 'asc';
      state.sort = key;
      update('push');
    });
  });
  root
    .querySelectorAll<HTMLElement>('[data-sort-fallback]')
    .forEach((element) => {
      element.hidden = true;
    });
  sort.addEventListener('change', () => {
    state.sort = sort.value as typeof state.sort;
    state.direction = 'asc';
    update('push');
  });
  direction.addEventListener('click', () => {
    state.direction = state.direction === 'asc' ? 'desc' : 'asc';
    update('push');
  });
  window.addEventListener('popstate', () => {
    state = parseListState(new URLSearchParams(location.search), areas);
    render();
  });
  root.querySelector<HTMLElement>('[data-script-controls]')!.hidden = false;
  form.hidden = false;
  update('replace');
}
