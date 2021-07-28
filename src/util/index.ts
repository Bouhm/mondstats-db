export function getShortName(char: { name: string; element: string }) {
  const charName =
    char.name === 'Traveler'
      ? `${char.name}-${char.element}`.split(' ').join('').toLowerCase()
      : char.name.split(' ').join('').toLowerCase();
  return charName;
}
