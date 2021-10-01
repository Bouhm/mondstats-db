export function getShortName(item: { name: string; element?: string }) {
  const shortName =
    item.name === 'Traveler'
      ? `${item.name}-${item.element}`.split(' ').join('').toLowerCase()
      : item.name.split(' ').join('').toLowerCase();
  return shortName.replace(/[^\w\s]/gi, '');
}
