export const relationNames = {
  recommended_next: 'Progressão sugerida',
  suggested_preparation: 'Preparação ou contexto',
  branch: 'Aprofundamento opcional',
  convergence: 'Convergência',
};
export function relationLabel(edge) {
  return (
    edge.label ??
    (edge.type === 'recommended_next' ? '' : relationNames[edge.type])
  );
}
