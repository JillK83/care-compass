/** Derives display initials from a caregiver name string.
 *  Used when constructing OverlayPin.label — initials only, never full name.
 *  "Maria Rodriguez" → "M.R."
 *  "Lee" → "L." */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(part => part[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .join('.') + '.'
}
