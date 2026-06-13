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
  version: 2
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
    name: 'Julia',
    description: 'Więcej zadań, własna skarbonka i szybkie plusy',
    accent: '#ff8d7a',
    accentSoft: '#fff0eb',
    accentStrong: '#cf5b4a',
    accentRing: 'rgba(255, 141, 122, 0.28)',
  },
  oliwia: {
    id: 'oliwia',
    name: 'Oliwia',
    description: 'Codzienne nawyki, drobne nagrody i lepszy rytm',
    accent: '#59b7ff',
    accentSoft: '#eaf5ff',
    accentStrong: '#257bc4',
    accentRing: 'rgba(89, 183, 255, 0.28)',
  },
}

export const STORAGE_KEY = 'family-tasks-board:v2'

export const TASK_FREQUENCY_OPTIONS: Array<{
  value: TaskFrequency
  label: string
  detail: string
}> = [
  { value: 'once', label: 'Jednorazowe', detail: 'Wykonaj raz i zamknij.' },
  { value: 'daily', label: 'Codzienne', detail: 'Po wykonaniu tworzy nową instancję.' },
  { value: 'weekly', label: 'Tygodniowe', detail: 'Powraca po zakończeniu.' },
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
  const balance = 53
  const now = nowIso()
  const tasks = [
    createTask('julia', 'Posprzątanie pokoju', 'Odkurzenie podłogi i schowanie rzeczy.', 5, 'todo', 'daily', isoDaysAgo(0, 8)),
    createTask('julia', 'Ścielenie łóżka', 'Rano po śniadaniu.', 3, 'done', 'daily', isoDaysAgo(1, 8), { completedAt: isoDaysAgo(1, 9) }),
    createTask('julia', 'Karmienie kota', 'Miseczka rano i wieczorem.', 4, 'todo', 'daily', isoDaysAgo(2, 8)),
    createTask('julia', 'Wyniesienie śmieci', 'Jedna szybka trasa do kosza.', 6, 'todo', 'weekly', isoDaysAgo(3, 8)),
    createTask('julia', 'Przygotowanie plecaka', 'Zeszyty i bidon przed szkołą.', 6, 'todo', 'once', isoDaysAgo(4, 8)),
  ]

  const savings = [
    createSavingsEvent('julia', 'Ścielenie łóżka', 3, 'Codzienny obowiązek zaliczony.', 'task', isoDaysAgo(1, 9), tasks[1].id),
    createSavingsEvent('julia', 'Pomoc przy kolacji', 10, 'Szybka pomoc bez przypominania.', 'manual', isoDaysAgo(2, 18)),
    createSavingsEvent('julia', 'Weekendowy bonus', 15, 'Dodatkowy plus od rodziców.', 'manual', isoDaysAgo(4, 12)),
    createSavingsEvent('julia', 'Samodzielność', 25, 'Tydzień dobrych nawyków.', 'manual', isoDaysAgo(6, 17)),
  ]

  const history = [
    createHistoryEntry('julia', 'task-added', 'Dodano zadanie', 'Ścielenie łóżka jest teraz zadaniem cyklicznym.', 'Mama', 3, isoDaysAgo(7, 8)),
    createHistoryEntry('julia', 'task-completed', 'Zadanie wykonane', 'Julia wykonała ścielenie łóżka.', 'Rodzina', 3, isoDaysAgo(1, 9)),
    createHistoryEntry('julia', 'reward', 'Nagroda do skarbonki', 'Do salda trafiło 3 zł.', 'System', 3, isoDaysAgo(1, 9)),
    createHistoryEntry('julia', 'plus', 'Przyznano plus', 'Pomoc przy stole i samodzielne działanie.', 'Tata', undefined, isoDaysAgo(2, 18)),
    createHistoryEntry('julia', 'minus', 'Przyznano minus', 'Kłótnia przy wieczornym sprzątaniu pokoju.', 'Mama', undefined, isoDaysAgo(5, 18)),
    createHistoryEntry('julia', 'reward', 'Nagroda do skarbonki', 'Weekendowy bonus został dodany.', 'Mama', 15, isoDaysAgo(4, 12)),
  ]

  return buildChildState({
    balance,
    totalEarned: balance,
    pluses: 6,
    minuses: 1,
    activeDays: 7,
    lastActiveDate: now.slice(0, 10),
    tasks,
    savings,
    history,
  })
}

function seedOliwiaState(): ChildState {
  const balance = 28
  const now = nowIso()
  const tasks = [
    createTask('oliwia', 'Wyniesienie śmieci', 'Poranna trasa do kosza.', 4, 'todo', 'weekly', isoDaysAgo(0, 8)),
    createTask('oliwia', 'Ułożenie książek', 'Półka po prawej stronie.', 3, 'done', 'once', isoDaysAgo(1, 8), { completedAt: isoDaysAgo(1, 10) }),
    createTask('oliwia', 'Nakarmienie rybek', 'Karmienie po obiedzie.', 5, 'todo', 'daily', isoDaysAgo(2, 8)),
    createTask('oliwia', 'Pomoc przy stole', 'Nakrycie do kolacji.', 4, 'todo', 'daily', isoDaysAgo(3, 8)),
    createTask('oliwia', 'Mycie łazienki', 'Krótki reset po sobocie.', 7, 'todo', 'weekly', isoDaysAgo(4, 8)),
  ]

  const savings = [
    createSavingsEvent('oliwia', 'Ułożenie książek', 3, 'Pierwsze zadanie zostało zaliczone.', 'task', isoDaysAgo(1, 10), tasks[1].id),
    createSavingsEvent('oliwia', 'Samodzielność', 5, 'Zrobione bez przypominania.', 'manual', isoDaysAgo(2, 15)),
    createSavingsEvent('oliwia', 'Pomoc w domu', 8, 'Pomoc przy stole i sprzątaniu.', 'manual', isoDaysAgo(3, 19)),
    createSavingsEvent('oliwia', 'Dobre zachowanie', 12, 'Spokojny tydzień w domu.', 'manual', isoDaysAgo(6, 13)),
  ]

  const history = [
    createHistoryEntry('oliwia', 'task-added', 'Dodano zadanie', 'Wyniesienie śmieci wraca co tydzień.', 'Tata', 4, isoDaysAgo(6, 8)),
    createHistoryEntry('oliwia', 'task-completed', 'Zadanie wykonane', 'Ułożenie książek zostało zaliczone.', 'Mama', 3, isoDaysAgo(1, 10)),
    createHistoryEntry('oliwia', 'reward', 'Nagroda do skarbonki', 'Do salda trafiło 3 zł.', 'System', 3, isoDaysAgo(1, 10)),
    createHistoryEntry('oliwia', 'plus', 'Przyznano plus', 'Samodzielne przygotowanie stołu.', 'Mama', undefined, isoDaysAgo(2, 15)),
    createHistoryEntry('oliwia', 'minus', 'Przyznano minus', 'Niewykonanie obowiązku przy porządkach.', 'Tata', undefined, isoDaysAgo(5, 16)),
    createHistoryEntry('oliwia', 'reward', 'Nagroda do skarbonki', 'Dodatkowa nagroda za dobre zachowanie.', 'Tata', 12, isoDaysAgo(6, 13)),
  ]

  return buildChildState({
    balance,
    totalEarned: balance,
    pluses: 4,
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
    version: 2,
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
    version: 2,
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

    if ((parsed as AppState).version === 2 && (parsed as AppState).children?.julia?.tasks) {
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
