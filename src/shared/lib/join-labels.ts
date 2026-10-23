/** "A3", "A3 and A4", "A3, A4 and A5". */
export function joinSeatLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}
