export type ChildId = 'julia' | 'oliwia'
export type ParentRole = 'Mama' | 'Tata'
export type View = 'dashboard' | 'board' | 'history' | 'settings'
export type TaskStatus = 'todo' | 'progress' | 'done'
export type TaskFrequency = 'once' | 'daily' | 'weekly'
export type HistoryKind =
  | 'task-added'
  | 'task-updated'
  | 'task-completed'
  | 'task-reactivated'
  | 'task-copied'
  | 'task-deleted'
  | 'plus'
  | 'minus'
  | 'reward'
  | 'achievement'
  | 'activity'
  | 'settings'
export type HistoryCategory = 'task' | 'plus' | 'minus' | 'reward' | 'system'
export type HistoryFilter = 'all' | ChildId | HistoryCategory

export interface Task {
  id: string
  childId: ChildId
  title: string
  description: string
  reward: number
  status: TaskStatus
  frequency: TaskFrequency
  rewardGranted: boolean
  createdAt: string
  updatedAt: string
  completedAt?: string
  recurrenceSeedId?: string
}

export interface SavingsEvent {
  id: string
  childId: ChildId
  title: string
  amount: number
  reason: string
  kind: 'task' | 'manual'
  createdAt: string
  taskId?: string
}

export interface HistoryEntry {
  id: string
  childId: ChildId
  title: string
  detail: string
  kind: HistoryKind
  category: HistoryCategory
  actorLabel?: string
  amount?: number
  createdAt: string
}

export interface ChildState {
  balance: number
  totalEarned: number
  pluses: number
  minuses: number
  activeDays: number
  lastActiveDate: string
  tasks: Task[]
  savings: SavingsEvent[]
  history: HistoryEntry[]
}

export interface AppState {
  version: 3
  children: Record<ChildId, ChildState>
}

export interface LegacyAppState {
  version: 1
  children: Record<
    ChildId,
    {
      balance: number
      pluses: number
      minuses: number
      tasks: Array<{
        id: string
        childId: ChildId
        title: string
        description: string
        reward: number
        status: 'todo' | 'progress' | 'done'
        recurring: boolean
        rewardGranted: boolean
        createdAt: string
        updatedAt: string
        completedAt?: string
      }>
      history: Array<{
        id: string
        childId: ChildId
        title: string
        detail: string
        kind:
          | 'task-added'
          | 'task-updated'
          | 'task-completed'
          | 'task-reactivated'
          | 'task-copied'
          | 'task-deleted'
          | 'plus'
          | 'minus'
          | 'balance'
          | 'settings'
        actorLabel?: string
        amount?: number
        createdAt: string
      }>
    }
  >
}

export interface ChildMeta {
  id: ChildId
  name: string
  description: string
  accent: string
  accentSoft: string
  accentStrong: string
  accentRing: string
}

export interface AchievementRule {
  id: string
  title: string
  description: string
  thresholdLabel: string
  unlocked: (child: ChildState) => boolean
}

export interface ActionPreset {
  id: string
  label: string
  detail: string
}

export const CHILDREN: Record<ChildId, ChildMeta> = {
  julia: {
    id: 'julia',
    name: 'Julcia',
    description: 'Spokojny rytm, ciepłe kolory i wyraźna skarbonka',
    accent: '#2bbd9f',
    accentSoft: '#e9fbf5',
    accentStrong: '#167f6d',
    accentRing: 'rgba(43, 189, 159, 0.24)',
  },
  oliwia: {
    id: 'oliwia',
    name: 'Oliwcia',
    description: 'Słoneczna karta, codzienne nawyki i szybkie nagrody',
    accent: '#f5a623',
    accentSoft: '#fff4de',
    accentStrong: '#b97709',
    accentRing: 'rgba(245, 166, 35, 0.24)',
  },
}

export const STORAGE_KEY = 'family-tasks-board:v3'

export const TASK_FREQUENCY_OPTIONS: Array<{
  value: TaskFrequency
  label: string
  detail: string
}> = [
  { value: 'once', label: 'Jednorazowe', detail: 'Wykonaj raz i zamknij.' },
  { value: 'daily', label: 'Codzienne', detail: 'Po wykonaniu tworzy nową instancję.' },
  { value: 'weekly', label: 'Tygodniowe', detail: 'Powraca po zakończeniu.' },
]

export const TASK_PRESETS: Array<{
  title: string
  description: string
  reward: number
  frequency: TaskFrequency
}> = [
  { title: 'Wypakowanie zmywarki', description: 'Wszystko na swoje miejsce.', reward: 5, frequency: 'daily' },
  { title: 'Karmienie psa', description: 'Miseczka i woda gotowe na czas.', reward: 4, frequency: 'daily' },
  { title: 'Sprzątanie pokoju', description: 'Porządek, podłoga i biurko.', reward: 6, frequency: 'daily' },
  { title: 'Spacer z psem', description: 'Krótka, aktywna trasa na świeżym powietrzu.', reward: 5, frequency: 'weekly' },
  { title: 'Układanie ubrań', description: 'Ubrania trafiają do właściwej szuflady.', reward: 4, frequency: 'weekly' },
  { title: 'Roznoszenie prania', description: 'Pranie wędruje do odpowiednich pokoi.', reward: 4, frequency: 'weekly' },
  { title: 'Segregowanie prania', description: 'Kolory, jasne i delikatne osobno.', reward: 5, frequency: 'weekly' },
]

export const PLUS_PRESETS: ActionPreset[] = [
  { id: 'help-home', label: 'Pomoc w domu', detail: 'Dodatkowe wsparcie przy codziennych obowiązkach.' },
  { id: 'independence', label: 'Samodzielność', detail: 'Zrobione bez przypominania.' },
  { id: 'good-behavior', label: 'Dobre zachowanie', detail: 'Spokojnie, uprzejmie i z uśmiechem.' },
]

export const MINUS_PRESETS: ActionPreset[] = [
  { id: 'mess', label: 'Bałagan', detail: 'Rzeczy nieodłożone na miejsce.' },
  { id: 'quarrel', label: 'Kłótnia', detail: 'Niepotrzebna sprzeczka z domownikami.' },
  { id: 'duty-miss', label: 'Niewykonanie obowiązku', detail: 'Zadanie zostało pominięte.' },
]

export const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    id: 'first-task',
    title: 'Pierwsze zadanie',
    description: 'Pierwsze wykonane zadanie zostało zaliczone.',
    thresholdLabel: '1 wykonane',
    unlocked: (child) => child.history.filter((entry) => entry.kind === 'task-completed').length >= 1,
  },
  {
    id: 'ten-tasks',
    title: '10 wykonanych zadań',
    description: 'Rodzina wchodzi na poziom regularności.',
    thresholdLabel: '10 wykonanych',
    unlocked: (child) => child.history.filter((entry) => entry.kind === 'task-completed').length >= 10,
  },
  {
    id: 'savings-50',
    title: '50 zł w skarbonce',
    description: 'Skarbonka rośnie i daje realną motywację.',
    thresholdLabel: '50 zł',
    unlocked: (child) => child.balance >= 50,
  },
  {
    id: 'active-7',
    title: '7 dni aktywności',
    description: 'Przez tydzień coś się działo każdego dnia.',
    thresholdLabel: '7 dni',
    unlocked: (child) => child.activeDays >= 7,
  },
]

export function createId(prefix: string) {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)

  return `${prefix}-${suffix}`
}

export function nowIso() {
  return new Date().toISOString()
}

export function isoDaysAgo(days: number, hour = 9) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value) + ' zł'
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

export function taskFrequencyLabel(value: TaskFrequency) {
  return TASK_FREQUENCY_OPTIONS.find((entry) => entry.value === value)?.label ?? value
}

export function historyCategoryLabel(value: HistoryCategory) {
  switch (value) {
    case 'task':
      return 'Zadania'
    case 'plus':
      return 'Plusy'
    case 'minus':
      return 'Minusy'
    case 'reward':
      return 'Nagrody'
    default:
      return 'Wszystko'
  }
}

function historyCategoryFor(kind: HistoryKind): HistoryCategory {
  if (kind === 'plus') {
    return 'plus'
  }

  if (kind === 'minus') {
    return 'minus'
  }

  if (kind === 'reward') {
    return 'reward'
  }

  if (kind === 'settings' || kind === 'activity' || kind === 'achievement') {
    return 'system'
  }

  return 'task'
}

export function createTask(
  childId: ChildId,
  title: string,
  description: string,
  reward: number,
  status: TaskStatus,
  frequency: TaskFrequency,
  createdAt: string = nowIso(),
  options?: { completedAt?: string; recurrenceSeedId?: string },
): Task {
  return {
    id: createId('task'),
    childId,
    title,
    description,
    reward,
    status,
    frequency,
    rewardGranted: status === 'done',
    createdAt,
    updatedAt: createdAt,
    completedAt: options?.completedAt,
    recurrenceSeedId: options?.recurrenceSeedId,
  }
}

export function createSavingsEvent(
  childId: ChildId,
  title: string,
  amount: number,
  reason: string,
  kind: 'task' | 'manual',
  createdAt: string = nowIso(),
  taskId?: string,
): SavingsEvent {
  return {
    id: createId('saving'),
    childId,
    title,
    amount,
    reason,
    kind,
    createdAt,
    taskId,
  }
}

export function createHistoryEntry(
  childId: ChildId,
  kind: HistoryKind,
  title: string,
  detail: string,
  actorLabel?: string,
  amount?: number,
  createdAt: string = nowIso(),
): HistoryEntry {
  return {
    id: createId('history'),
    childId,
    title,
    detail,
    kind,
    category: historyCategoryFor(kind),
    actorLabel,
    amount,
    createdAt,
  }
}

function buildChildState(args: {
    balance: number
    totalEarned: number
    pluses: number
    minuses: number
    activeDays: number
    lastActiveDate: string
    tasks: Task[]
    savings: SavingsEvent[]
    history: HistoryEntry[]
  },
): ChildState {
  return { ...args }
}

function seedJuliaState(): ChildState {
  const balance = 58
  const now = nowIso()
  const tasks = [
    createTask('julia', 'Wypakowanie zmywarki', 'Szybko na suszarkę i do szafek.', 5, 'todo', 'daily', isoDaysAgo(0, 8)),
    createTask('julia', 'Sprzątanie pokoju', 'Podłoga, biurko i łóżko.', 6, 'todo', 'daily', isoDaysAgo(1, 8)),
    createTask('julia', 'Karmienie psa', 'Miseczka rano i wieczorem.', 4, 'done', 'daily', isoDaysAgo(2, 8), { completedAt: isoDaysAgo(2, 9) }),
    createTask('julia', 'Spacer z psem', 'Krótka trasa po południu.', 5, 'todo', 'weekly', isoDaysAgo(3, 8)),
    createTask('julia', 'Segregowanie prania', 'Kolory osobno, delikatne osobno.', 5, 'todo', 'weekly', isoDaysAgo(4, 8)),
  ]

  const savings = [
    createSavingsEvent('julia', 'Karmienie psa', 4, 'Obowiązek zaliczony automatycznie po zatwierdzeniu.', 'task', isoDaysAgo(2, 9), tasks[2].id),
    createSavingsEvent('julia', 'Pomoc w domu', 10, 'Szybkie wsparcie bez przypominania.', 'manual', isoDaysAgo(2, 18)),
    createSavingsEvent('julia', 'Weekendowy bonus', 15, 'Dodatkowy plus od rodziców.', 'manual', isoDaysAgo(4, 12)),
    createSavingsEvent('julia', 'Samodzielność', 25, 'Tydzień dobrych nawyków.', 'manual', isoDaysAgo(6, 17)),
  ]

  const history = [
    createHistoryEntry('julia', 'task-added', 'Dodano zadanie', 'Wypakowanie zmywarki wraca codziennie.', 'Mama', 5, isoDaysAgo(7, 8)),
    createHistoryEntry('julia', 'task-completed', 'Zadanie wykonane', 'Julcia wykonała karmienie psa.', 'Rodzina', 4, isoDaysAgo(2, 9)),
    createHistoryEntry('julia', 'reward', 'Nagroda do skarbonki', 'Do salda trafiło 4 zł.', 'System', 4, isoDaysAgo(2, 9)),
    createHistoryEntry('julia', 'plus', 'Przyznano plus', 'Pomoc przy stole i samodzielne działanie.', 'Tata', undefined, isoDaysAgo(2, 18)),
    createHistoryEntry('julia', 'minus', 'Przyznano minus', 'Kłótnia przy wieczornym sprzątaniu pokoju.', 'Mama', undefined, isoDaysAgo(5, 18)),
    createHistoryEntry('julia', 'reward', 'Nagroda do skarbonki', 'Weekendowy bonus został dodany.', 'Mama', 15, isoDaysAgo(4, 12)),
  ]

  return buildChildState({
    balance,
    totalEarned: balance,
    pluses: 7,
    minuses: 1,
    activeDays: 7,
    lastActiveDate: now.slice(0, 10),
    tasks,
    savings,
    history,
  })
}

function seedOliwiaState(): ChildState {
  const balance = 41
  const now = nowIso()
  const tasks = [
    createTask('oliwia', 'Układanie ubrań', 'Złożone rzeczy trafiają do szuflad.', 4, 'todo', 'daily', isoDaysAgo(0, 8)),
    createTask('oliwia', 'Roznoszenie prania', 'Pranie wędruje do odpowiednich pokoi.', 4, 'done', 'weekly', isoDaysAgo(1, 8), { completedAt: isoDaysAgo(1, 10) }),
    createTask('oliwia', 'Segregowanie prania', 'Jasne, ciemne i delikatne osobno.', 5, 'todo', 'weekly', isoDaysAgo(2, 8)),
    createTask('oliwia', 'Karmienie psa', 'Rytuał poranny i wieczorny.', 4, 'todo', 'daily', isoDaysAgo(3, 8)),
    createTask('oliwia', 'Spacer z psem', 'Krótki spacer po obiedzie.', 5, 'todo', 'weekly', isoDaysAgo(4, 8)),
  ]

  const savings = [
    createSavingsEvent('oliwia', 'Roznoszenie prania', 4, 'Obowiązek wykonany po zatwierdzeniu.', 'task', isoDaysAgo(1, 10), tasks[1].id),
    createSavingsEvent('oliwia', 'Samodzielność', 5, 'Zrobione bez przypominania.', 'manual', isoDaysAgo(2, 15)),
    createSavingsEvent('oliwia', 'Pomoc w domu', 8, 'Pomoc przy stole i sprzątaniu.', 'manual', isoDaysAgo(3, 19)),
    createSavingsEvent('oliwia', 'Dobre zachowanie', 12, 'Spokojny tydzień w domu.', 'manual', isoDaysAgo(6, 13)),
  ]

  const history = [
    createHistoryEntry('oliwia', 'task-added', 'Dodano zadanie', 'Roznoszenie prania wraca co tydzień.', 'Tata', 4, isoDaysAgo(6, 8)),
    createHistoryEntry('oliwia', 'task-completed', 'Zadanie wykonane', 'Oliwcia zaliczyła roznoszenie prania.', 'Mama', 4, isoDaysAgo(1, 10)),
    createHistoryEntry('oliwia', 'reward', 'Nagroda do skarbonki', 'Do salda trafiło 4 zł.', 'System', 4, isoDaysAgo(1, 10)),
    createHistoryEntry('oliwia', 'plus', 'Przyznano plus', 'Samodzielne przygotowanie stołu.', 'Mama', undefined, isoDaysAgo(2, 15)),
    createHistoryEntry('oliwia', 'minus', 'Przyznano minus', 'Niewykonanie obowiązku przy porządkach.', 'Tata', undefined, isoDaysAgo(5, 16)),
    createHistoryEntry('oliwia', 'reward', 'Nagroda do skarbonki', 'Dodatkowa nagroda za dobre zachowanie.', 'Tata', 12, isoDaysAgo(6, 13)),
  ]

  return buildChildState({
    balance,
    totalEarned: balance,
    pluses: 5,
    minuses: 2,
    activeDays: 4,
    lastActiveDate: now.slice(0, 10),
    tasks,
    savings,
    history,
  })
}

export function createInitialState(): AppState {
  return {
    version: 3,
    children: {
      julia: seedJuliaState(),
      oliwia: seedOliwiaState(),
    },
  }
}

function migrateLegacyTask(task: LegacyAppState['children'][ChildId]['tasks'][number]): Task {
  const frequency: TaskFrequency = task.recurring ? 'daily' : 'once'

  return {
    id: task.id,
    childId: task.childId,
    title: task.title,
    description: task.description,
    reward: task.reward,
    status: task.status === 'done' ? 'done' : task.status === 'progress' ? 'progress' : 'todo',
    frequency,
    rewardGranted: task.rewardGranted,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
  }
}

function migrateLegacyHistory(entry: LegacyAppState['children'][ChildId]['history'][number]): HistoryEntry {
  const category = historyCategoryFor(entry.kind === 'balance' ? 'reward' : entry.kind)

  return {
    ...entry,
    kind: entry.kind === 'balance' ? 'reward' : entry.kind,
    category,
  }
}

export function migrateLegacyState(state: LegacyAppState): AppState {
  return {
    version: 3,
    children: {
      julia: {
        balance: state.children.julia.balance,
        totalEarned: state.children.julia.balance,
        pluses: state.children.julia.pluses,
        minuses: state.children.julia.minuses,
        activeDays: 5,
        lastActiveDate: nowIso().slice(0, 10),
        tasks: state.children.julia.tasks.map(migrateLegacyTask),
        savings: state.children.julia.tasks
          .filter((task) => task.rewardGranted)
          .map((task) =>
            createSavingsEvent(
              'julia',
              task.title,
              task.reward,
              'Migracja ze starszej wersji aplikacji.',
              'task',
              task.completedAt ?? task.updatedAt,
              task.id,
            ),
          ),
        history: state.children.julia.history.map(migrateLegacyHistory),
      },
      oliwia: {
        balance: state.children.oliwia.balance,
        totalEarned: state.children.oliwia.balance,
        pluses: state.children.oliwia.pluses,
        minuses: state.children.oliwia.minuses,
        activeDays: 4,
        lastActiveDate: nowIso().slice(0, 10),
        tasks: state.children.oliwia.tasks.map(migrateLegacyTask),
        savings: state.children.oliwia.tasks
          .filter((task) => task.rewardGranted)
          .map((task) =>
            createSavingsEvent(
              'oliwia',
              task.title,
              task.reward,
              'Migracja ze starszej wersji aplikacji.',
              'task',
              task.completedAt ?? task.updatedAt,
              task.id,
            ),
          ),
        history: state.children.oliwia.history.map(migrateLegacyHistory),
      },
    },
  }
}

export function loadPersistedState(raw: string | null): AppState {
  if (!raw) {
    return createInitialState()
  }

  try {
    const parsed = JSON.parse(raw) as AppState | LegacyAppState

    if ((parsed as AppState).version === 3 && (parsed as AppState).children?.julia?.tasks) {
      return parsed as AppState
    }

    if ((parsed as LegacyAppState).version === 1 && (parsed as LegacyAppState).children?.julia?.tasks) {
      return migrateLegacyState(parsed as LegacyAppState)
    }

    return createInitialState()
  } catch {
    return createInitialState()
  }
}

export function createRecentRewardFlash(childId: ChildId, amount: number, title: string) {
  return {
    childId,
    amount,
    title,
    id: createId('reward-flash'),
    createdAt: nowIso(),
  }
}
