/** @template {{id: string, data: {area: string}}} T @param {T[]} entries @param {import('./content-areas.mjs').Area[]} areas */
export function groupLabsByArea(entries, areas) {
  return areas
    .map((area) => ({
      area,
      labs: entries
        .filter((entry) => entry.data.area === area.id)
        .sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .filter((group) => group.labs.length > 0);
}
