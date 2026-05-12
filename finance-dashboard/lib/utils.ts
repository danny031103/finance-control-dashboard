const MEMBER_COLORS = ['#6366f1', '#0891b2', '#059669', '#d97706', '#dc2626'];

// Trello labels used for person assignment instead of the Trello member feature.
// Add or rename entries here if label names change.
const PERSON_LABEL_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /^dany$/i, name: 'Dany' },
  { pattern: /^bill$/i, name: 'Bill' },
  { pattern: /^liss$/i, name: 'Liss' },
  { pattern: /^yagnesh$/i, name: 'Yagnesh' },
  { pattern: /^manoel$/i, name: 'Manoel' },
  { pattern: /^anubov$/i, name: 'Anubov' },
];

export interface LabelAssignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export function getLabelAssignees(
  labels: { id: string; name: string; color: string }[]
): LabelAssignee[] {
  const assignees: LabelAssignee[] = [];
  for (const label of labels) {
    for (const { pattern, name } of PERSON_LABEL_PATTERNS) {
      if (pattern.test(label.name.trim())) {
        assignees.push({
          id: `label-person-${name.toLowerCase()}`,
          name,
          initials: getInitials(name),
          color: getMemberColor(name),
        });
        break;
      }
    }
  }
  return assignees;
}

// All known person names for the workload view, in display order.
export const PERSON_NAMES = PERSON_LABEL_PATTERNS.map((p) => p.name);

export function getMemberColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function stalenessColor(days: number): string {
  if (days <= 3) return '#16a34a';
  if (days <= 7) return '#ca8a04';
  return '#dc2626';
}

export function labelHexColor(trelloColor: string): string {
  const map: Record<string, string> = {
    green: '#16a34a',
    yellow: '#ca8a04',
    orange: '#ea580c',
    red: '#dc2626',
    purple: '#9333ea',
    blue: '#2563eb',
    sky: '#0ea5e9',
    lime: '#84cc16',
    pink: '#ec4899',
    black: '#374151',
  };
  return map[trelloColor] ?? '#6b7280';
}
