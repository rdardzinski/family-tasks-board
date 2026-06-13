import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ACHIEVEMENT_RULES,
  CHILDREN,
  MINUS_PRESETS,
  PLUS_PRESETS,
  STORAGE_KEY,
  TASK_FREQUENCY_OPTIONS,
  TASK_PRESETS,
  type ActionPreset,
  type AppState,
  type ChildId,
  type ChildMeta,
  type ChildState,
  type HistoryEntry,
  type HistoryFilter,
  type ParentRole,
  type Task,
  type TaskFrequency,
  type TaskStatus,
  createHistoryEntry,
  createId,
  createInitialState,
  createSavingsEvent,
  createTask,
  formatDateTime,
  formatMoney,
  formatShortDate,
  historyCategoryLabel,
  loadPersistedState,
  nowIso,
  taskFrequencyLabel,
} from './data'
import {
  CheckIcon,
  ChevronRightIcon,
  CoinsIcon,
  EditIcon,
  FilterIcon,
  HistoryIcon,
  HomeIcon,
  LockIcon,
  MinusIcon,
  ParentIcon,
  PiggyIcon,
  PlusIcon,
  SettingsIcon,
  SparkIcon,
  TaskIcon,
  TrophyIcon,
  UndoIcon,
} from './icons'

type View = 'dashboard' | 'board' | 'history' | 'settings'

type TaskDraft = {
  childId: ChildId
  mode: 'add' | 'edit'
  taskId?: string
  seed?: Partial<TaskFormValues>
}

type TaskFormValues = {
  title: string
  description: string
  reward: string
  frequency: TaskFrequency
  status: TaskStatus
}

type PendingAction =
  | { kind: 'open-task'; draft: TaskDraft }
  | { kind: 'complete-task'; childId: ChildId; taskId: string }
  | { kind: 'reactivate-task'; childId: ChildId; taskId: string }
  | { kind: 'preset'; childId: ChildId; action: 'plus' | 'minus'; presetId: string }

type ParentUiState = {
  role: ParentRole | null
  unlockedUntil: string | null
}

type ParentPrompt = {
  title: string
  description: string
  confirmLabel: string
}

type ConfirmDialog = {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}

type RewardFlash = {
  id: string
  childId: ChildId
  amount: number
  title: string
}

const UI_STORAGE_KEY = 'family-tasks-board:ui:v1'
const PARENT_UNLOCK_MS = 10 * 60 * 1000
const childOrder: ChildId[] = ['julia', 'oliwia']

const mainViews: Array<{ key: View; label: string; icon: typeof HomeIcon }> = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { key: 'board', label: 'Tablica', icon: TaskIcon },
  { key: 'history', label: 'Historia', icon: HistoryIcon },
  { key: 'settings', label: 'Ustawienia', icon: SettingsIcon },
]

const historyFilters: Array<{ value: HistoryFilter; label: string }> = [
  { value: 'all', label: 'Wszystko' },
  { value: 'julia', label: 'Julcia' },
  { value: 'oliwia', label: 'Oliwcia' },
  { value: 'task', label: 'Zadania' },
  { value: 'plus', label: 'Plusy' },
  { value: 'minus', label: 'Minusy' },
  { value: 'reward', label: 'Nagrody' },
]

const childThemes: Record<
  ChildId,
  { gradient: string; accent: string; accentSoft: string; accentStrong: string; ring: string; glow: string; badge: string }
> = {
  julia: {
    gradient: 'from-[#d8fbf1] via-[#f5fffb] to-white',
    accent: '#2bbd9f',
    accentSoft: '#e9fbf5',
    accentStrong: '#167f6d',
    ring: 'rgba(43, 189, 159, 0.24)',
    glow: 'rgba(43, 189, 159, 0.16)',
    badge: 'Rodzinna zielen',
  },
  oliwia: {
    gradient: 'from-[#fff0cf] via-[#fff9ec] to-white',
    accent: '#f5a623',
    accentSoft: '#fff4de',
    accentStrong: '#b97709',
    ring: 'rgba(245, 166, 35, 0.24)',
    glow: 'rgba(245, 166, 35, 0.16)',
    badge: 'Sloneczny rytm',
  },
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function todayKey(timestamp = nowIso()) {
  return timestamp.slice(0, 10)
}

function childDisplayName(childId: ChildId) {
  return childId === 'julia' ? 'Julcia' : 'Oliwcia'
}

function childGenitive(childId: ChildId) {
  return childId === 'julia' ? 'Julci' : 'Oliwci'
}

function taskCount(child: ChildState) {
  return child.tasks.filter((task) => task.status !== 'done').length
}

function completedTaskCount(child: ChildState) {
  return child.history.filter((entry) => entry.kind === 'task-completed').length
}

function getChildAchievements(child: ChildState) {
  return ACHIEVEMENT_RULES.map((rule) => ({
    ...rule,
    unlocked: rule.unlocked(child),
  }))
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const statusOrder = (task: Task) => (task.status === 'done' ? 2 : task.status === 'progress' ? 1 : 0)
    const delta = statusOrder(left) - statusOrder(right)

    if (delta !== 0) {
      return delta
    }

    return Date.parse(right.createdAt) - Date.parse(left.createdAt)
  })
}

function formatCountdown(ms: number) {
  const safe = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function loadParentUiState(): ParentUiState {
  if (typeof window === 'undefined') {
    return { role: null, unlockedUntil: null }
  }

  try {
    const raw = window.localStorage.getItem(UI_STORAGE_KEY)
    if (!raw) {
      return { role: null, unlockedUntil: null }
    }

    const parsed = JSON.parse(raw) as ParentUiState
    if (!parsed?.unlockedUntil || Date.parse(parsed.unlockedUntil) <= Date.now()) {
      return { role: null, unlockedUntil: null }
    }

    return {
      role: parsed.role === 'Tata' ? 'Tata' : 'Mama',
      unlockedUntil: parsed.unlockedUntil,
    }
  } catch {
    return { role: null, unlockedUntil: null }
  }
}

function taskStatusLabel(status: TaskStatus) {
  return status === 'done' ? 'Wykonane' : status === 'progress' ? 'W trakcie' : 'Do wykonania'
}

function taskStatusTone(status: TaskStatus) {
  if (status === 'done') return 'bg-brand-mintSoft text-brand-ink'
  if (status === 'progress') return 'bg-brand-skySoft text-brand-ink'
  return 'bg-brand-sunSoft text-brand-ink'
}

function taskFrequencyTone(frequency: TaskFrequency) {
  if (frequency === 'daily') return 'bg-brand-skySoft text-brand-ink'
  if (frequency === 'weekly') return 'bg-brand-mintSoft text-brand-ink'
  return 'bg-brand-page text-brand-ink'
}

function App() {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === 'undefined') {
      return createInitialState()
    }

    return loadPersistedState(window.localStorage.getItem(STORAGE_KEY))
  })
  const [uiState, setUiState] = useState<ParentUiState>(() => loadParentUiState())
  const [view, setView] = useState<View>('dashboard')
  const [activeChild, setActiveChild] = useState<ChildId>('julia')
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null)
  const [parentPrompt, setParentPrompt] = useState<ParentPrompt | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [rewardFlash, setRewardFlash] = useState<RewardFlash | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore storage failures
    }
  }, [state])

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(uiState))
    } catch {
      // ignore storage failures
    }
  }, [uiState])

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!uiState.unlockedUntil) {
      return
    }

    const remaining = Date.parse(uiState.unlockedUntil) - Date.now()
    const timer = window.setTimeout(() => {
      setUiState({ role: null, unlockedUntil: null })
      setToast('Tryb rodzica wygasł.')
    }, Math.max(0, remaining))

    return () => window.clearTimeout(timer)
  }, [uiState.unlockedUntil])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!rewardFlash) {
      return
    }

    const timeout = window.setTimeout(() => setRewardFlash(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [rewardFlash])

  const isParentUnlocked = Boolean(uiState.unlockedUntil && Date.parse(uiState.unlockedUntil) > nowMs)
  const parentRole = uiState.role ?? 'Mama'
  const parentRemaining = isParentUnlocked && uiState.unlockedUntil ? Date.parse(uiState.unlockedUntil) - nowMs : 0

  const childStats = useMemo(
    () =>
      childOrder.map((childId) => {
        const child = state.children[childId]
        const achievements = getChildAchievements(child)

        return {
          ...CHILDREN[childId],
          childId,
          activeTasks: taskCount(child),
          pluses: child.pluses,
          minuses: child.minuses,
          balance: child.balance,
          earned: child.totalEarned,
          completed: completedTaskCount(child),
          savings: [...child.savings].slice(0, 4),
          achievements,
        }
      }),
    [state],
  )

  const visibleHistory = useMemo(() => {
    const entries = childOrder
      .flatMap((childId) => state.children[childId].history.map((entry) => ({ ...entry, childId })))
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))

    return entries.filter((entry) => {
      if (historyFilter === 'all') {
        return true
      }

      if (historyFilter === 'julia' || historyFilter === 'oliwia') {
        return entry.childId === historyFilter
      }

      return entry.category === historyFilter
    })
  }, [historyFilter, state])

  const familySummary = useMemo(() => {
    return childOrder.reduce(
      (acc, childId) => {
        const child = state.children[childId]
        acc.balance += child.balance
        acc.active += taskCount(child)
        acc.pluses += child.pluses
        acc.minuses += child.minuses
        acc.earned += child.totalEarned
        acc.unlocked += getChildAchievements(child).filter((entry) => entry.unlocked).length
        return acc
      },
      { balance: 0, active: 0, pluses: 0, minuses: 0, earned: 0, unlocked: 0 },
    )
  }, [state])

  const activeChildState = state.children[activeChild]

  function pushToast(message: string) {
    setToast(message)
  }

  function updateChild(childId: ChildId, updater: (child: ChildState) => ChildState) {
    setState((current) => {
      const currentChild = current.children[childId]
      const nextChild = updater(currentChild)

      if (nextChild === currentChild) {
        return current
      }

      return {
        ...current,
        children: {
          ...current.children,
          [childId]: nextChild,
        },
      }
    })
  }

  function touchActivity(child: ChildState, timestamp = nowIso()) {
    const key = todayKey(timestamp)

    if (child.lastActiveDate === key) {
      return child
    }

    return {
      ...child,
      lastActiveDate: key,
      activeDays: child.activeDays + 1,
    }
  }

  function saveTaskNow(childId: ChildId, taskId: string | undefined, values: TaskFormValues, role: ParentRole) {
    const reward = Math.max(0, Number(values.reward) || 0)
    const title = values.title.trim()
    const description = values.description.trim()

    if (!title) {
      return
    }

    const now = nowIso()

    updateChild(childId, (child) => {
      const nextChild = touchActivity(child, now)

      if (!taskId) {
        const task = createTask(childId, title, description, reward, values.status, values.frequency, now, {
          completedAt: values.status === 'done' ? now : undefined,
        })

        const balanceDelta = values.status === 'done' ? reward : 0
        const savings = balanceDelta
          ? [createSavingsEvent(childId, title, balanceDelta, 'Zadanie dodane jako wykonane.', 'task', now, task.id), ...nextChild.savings]
          : nextChild.savings

        const history = [
          createHistoryEntry(childId, 'task-added', 'Dodano zadanie', `${title} (${taskFrequencyLabel(values.frequency)})`, role, reward, now),
          ...(balanceDelta
            ? [
                createHistoryEntry(childId, 'task-completed', 'Zadanie wykonane', `${title} zostało zapisane jako wykonane.`, role, reward, now),
                createHistoryEntry(childId, 'reward', 'Nagroda do skarbonki', `Do skarbonki trafiło ${formatMoney(reward)}.`, 'System', reward, now),
              ]
            : []),
          ...nextChild.history,
        ]

        return {
          ...nextChild,
          balance: nextChild.balance + balanceDelta,
          totalEarned: nextChild.totalEarned + balanceDelta,
          tasks: [task, ...nextChild.tasks],
          savings,
          history,
        }
      }

      const task = nextChild.tasks.find((entry) => entry.id === taskId)
      if (!task) {
        return nextChild
      }

      const nextRewardGranted = task.rewardGranted && task.status === 'done'
      const rewardDelta = nextRewardGranted ? reward - task.reward : 0
      const updatedTask: Task = {
        ...task,
        title,
        description,
        reward,
        frequency: values.frequency,
        status: values.status,
        rewardGranted: nextRewardGranted,
        completedAt: values.status === 'done' ? task.completedAt ?? now : undefined,
        updatedAt: now,
      }

      const becameDone = task.status !== 'done' && values.status === 'done'
      const becameTodo = task.status === 'done' && values.status !== 'done'
      const savings = rewardDelta
        ? [createSavingsEvent(childId, `${title} - korekta`, rewardDelta, 'Zmiana kwoty wykonanej nagrody.', 'manual', now, task.id), ...nextChild.savings]
        : nextChild.savings

      const history = [
        createHistoryEntry(childId, 'task-updated', 'Zadanie zapisane', `${title} zostało zaktualizowane.`, role, reward, now),
        ...(becameDone
          ? [
              createHistoryEntry(childId, 'task-completed', 'Zadanie wykonane', `${title} zostało oznaczone jako wykonane.`, role, reward, now),
              createHistoryEntry(childId, 'reward', 'Nagroda do skarbonki', `Do skarbonki trafiło ${formatMoney(reward)}.`, 'System', reward, now),
            ]
          : []),
        ...(becameTodo
          ? [
              createHistoryEntry(childId, 'task-reactivated', 'Zadanie przywrócone', `${title} wróciło do aktywnych zadań.`, role, undefined, now),
            ]
          : []),
        ...(rewardDelta
          ? [
              createHistoryEntry(
                childId,
                'reward',
                'Korekta nagrody',
                rewardDelta > 0 ? `Kwota wzrosła o ${formatMoney(rewardDelta)}.` : `Kwota zmalała o ${formatMoney(Math.abs(rewardDelta))}.`,
                role,
                rewardDelta,
                now,
              ),
            ]
          : []),
        ...nextChild.history,
      ]

      return {
        ...nextChild,
        balance: nextChild.balance + (becameDone ? reward : 0) + rewardDelta,
        totalEarned: nextChild.totalEarned + (becameDone ? reward : 0) + rewardDelta,
        tasks: nextChild.tasks.map((entry) => (entry.id === taskId ? updatedTask : entry)),
        savings,
        history,
      }
    })

    pushToast(taskId ? 'Zadanie zapisane.' : `Dodano ${title}.`)
  }

  function completeTaskNow(childId: ChildId, taskId: string, role: ParentRole) {
    const child = state.children[childId]
    const task = child.tasks.find((entry) => entry.id === taskId)

    if (!task || task.status === 'done') {
      return
    }

    const now = nowIso()
    const nextTask =
      task.frequency === 'once'
        ? null
        : createTask(childId, task.title, task.description, task.reward, 'todo', task.frequency, now, {
            recurrenceSeedId: task.recurrenceSeedId ?? task.id,
          })

    updateChild(childId, (currentChild) => {
      const nextChild = touchActivity(currentChild, now)
      const completedTask: Task = {
        ...task,
        status: 'done',
        rewardGranted: true,
        completedAt: now,
        updatedAt: now,
      }

      const tasks = [...(nextTask ? [nextTask] : []), ...nextChild.tasks.filter((entry) => entry.id !== taskId), completedTask]
      const savings = [createSavingsEvent(childId, task.title, task.reward, 'Zadanie wykonane.', 'task', now, task.id), ...nextChild.savings]
      const history = [
        createHistoryEntry(childId, 'task-completed', 'Zadanie wykonane', `${task.title} zakończone za ${formatMoney(task.reward)}.`, role, task.reward, now),
        createHistoryEntry(childId, 'reward', 'Nagroda do skarbonki', `Do skarbonki trafiło ${formatMoney(task.reward)}.`, 'System', task.reward, now),
        ...(nextTask
          ? [
              createHistoryEntry(
                childId,
                'task-added',
                'Nowa instancja',
                `${task.title} zostało odtworzone jako ${taskFrequencyLabel(task.frequency).toLowerCase()}.`,
                'System',
                undefined,
                now,
              ),
            ]
          : []),
        ...nextChild.history,
      ]

      return {
        ...nextChild,
        balance: nextChild.balance + task.reward,
        totalEarned: nextChild.totalEarned + task.reward,
        tasks,
        savings,
        history,
      }
    })

    setRewardFlash({
      id: createId('reward-flash'),
      childId,
      amount: task.reward,
      title: task.title,
    })
    pushToast(`+${formatMoney(task.reward)} za ${task.title}.`)
  }

  function reactivateTaskNow(childId: ChildId, taskId: string, role: ParentRole) {
    updateChild(childId, (child) => {
      const task = child.tasks.find((entry) => entry.id === taskId)

      if (!task || task.status !== 'done') {
        return child
      }

      const now = nowIso()
      const nextTask: Task = {
        ...task,
        status: 'todo',
        rewardGranted: false,
        completedAt: undefined,
        updatedAt: now,
      }

      return {
        ...touchActivity(child, now),
        tasks: child.tasks.map((entry) => (entry.id === taskId ? nextTask : entry)),
        history: [
          createHistoryEntry(childId, 'task-reactivated', 'Zadanie przywrócone', `${task.title} wróciło na listę aktywnych zadań.`, role, undefined, now),
          ...child.history,
        ],
      }
    })

    pushToast('Zadanie wróciło do aktywnych.')
  }

  function applyPresetNow(childId: ChildId, action: 'plus' | 'minus', preset: ActionPreset, role: ParentRole) {
    updateChild(childId, (child) => {
      const now = nowIso()
      const updated = touchActivity(child, now)
      const nextCount = action === 'plus' ? child.pluses + 1 : child.minuses + 1

      return {
        ...updated,
        pluses: action === 'plus' ? nextCount : child.pluses,
        minuses: action === 'minus' ? nextCount : child.minuses,
        history: [
          createHistoryEntry(
            childId,
            action,
            action === 'plus' ? 'Przyznano plus' : 'Przyznano minus',
            preset.detail,
            role,
            undefined,
            now,
          ),
          ...child.history,
        ],
      }
    })

    pushToast(action === 'plus' ? `Plus: ${preset.label}` : `Minus: ${preset.label}`)
  }

  function requestParentPrompt(prompt: ParentPrompt, action?: PendingAction | null) {
    setParentPrompt(prompt)
    setPendingAction(action ?? null)
  }

  function requestTaskDraft(draft: TaskDraft) {
    if (isParentUnlocked) {
      setTaskDraft(draft)
      return
    }

    requestParentPrompt(
      {
        title: 'Odblokuj rodzica',
        description: 'Podaj hasło Mama albo Tata, aby dodać, edytować lub zatwierdzać zadania.',
        confirmLabel: 'Odblokuj i kontynuuj',
      },
      { kind: 'open-task', draft },
    )
  }

  function requestCompleteTask(childId: ChildId, taskId: string) {
    if (isParentUnlocked) {
      completeTaskNow(childId, taskId, parentRole)
      return
    }

    requestParentPrompt(
      {
        title: 'Zatwierdzenie wymaga rodzica',
        description: 'Wykonanie zadania i wypłata do skarbonki są dostępne dopiero po odblokowaniu trybu rodzica.',
        confirmLabel: 'Odblokuj i zatwierdź',
      },
      { kind: 'complete-task', childId, taskId },
    )
  }

  function requestReactivateTask(childId: ChildId, taskId: string) {
    if (isParentUnlocked) {
      reactivateTaskNow(childId, taskId, parentRole)
      return
    }

    requestParentPrompt(
      {
        title: 'Przywrócenie wymaga rodzica',
        description: 'Tryb dziecka nie może cofać wykonanych zadań.',
        confirmLabel: 'Odblokuj i przywróć',
      },
      { kind: 'reactivate-task', childId, taskId },
    )
  }

  function requestPresetAction(childId: ChildId, action: 'plus' | 'minus', preset: ActionPreset) {
    if (isParentUnlocked) {
      applyPresetNow(childId, action, preset, parentRole)
      return
    }

    requestParentPrompt(
      {
        title: action === 'plus' ? 'Plus wymaga rodzica' : 'Minus wymaga rodzica',
        description: 'Plusy i minusy są dostępne wyłącznie po jednorazowym odblokowaniu trybu rodzica.',
        confirmLabel: 'Odblokuj i kontynuuj',
      },
      { kind: 'preset', childId, action, presetId: preset.id },
    )
  }

  function executePendingAction(action: PendingAction, role: ParentRole) {
    switch (action.kind) {
      case 'open-task':
        setTaskDraft(action.draft)
        break
      case 'complete-task':
        completeTaskNow(action.childId, action.taskId, role)
        break
      case 'reactivate-task':
        reactivateTaskNow(action.childId, action.taskId, role)
        break
      case 'preset': {
        const preset = [...PLUS_PRESETS, ...MINUS_PRESETS].find((entry) => entry.id === action.presetId)
        if (preset) {
          applyPresetNow(action.childId, action.action, preset, role)
        }
        break
      }
    }
  }

  function unlockParent(role: ParentRole) {
    const unlockedUntil = new Date(Date.now() + PARENT_UNLOCK_MS).toISOString()
    const queuedAction = pendingAction
    setUiState({ role, unlockedUntil })
    setParentPrompt(null)
    setPendingAction(null)
    pushToast(`Tryb rodzica aktywny jako ${role}.`)

    if (queuedAction) {
      executePendingAction(queuedAction, role)
    }
  }

  function lockParent() {
    setUiState({ role: null, unlockedUntil: null })
    setParentPrompt(null)
    setPendingAction(null)
    pushToast('Tryb rodzica zablokowany.')
  }

  function requestResetDemo() {
    if (!isParentUnlocked) {
      requestParentPrompt(
        {
          title: 'Reset wymaga trybu rodzica',
          description: 'Najpierw odblokuj rodzica, aby przywrócić dane demo.',
          confirmLabel: 'Odblokuj',
        },
        null,
      )
      return
    }

    setConfirmDialog({
      title: 'Przywrócić dane demo?',
      description: 'To wyczyści LocalStorage i przywróci wbudowany zestaw startowy.',
      confirmLabel: 'Przywróć',
      onConfirm: () => {
        setState(createInitialState())
        setView('dashboard')
        setActiveChild('julia')
        setHistoryFilter('all')
        setTaskDraft(null)
        setParentPrompt(null)
        setPendingAction(null)
        setUiState({ role: null, unlockedUntil: null })
        pushToast('Dane demo zostały przywrócone.')
      },
    })
  }

  function openParentUnlockOnly() {
    requestParentPrompt({
      title: 'Odblokuj rodzica',
      description: 'Podaj dokładnie hasło Mama albo Tata. Tryb rodzica będzie aktywny przez 10 minut.',
      confirmLabel: 'Odblokuj',
    })
  }

  function queuedOrSetTaskDraft(draft: TaskDraft) {
    requestTaskDraft(draft)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-page text-brand-ink">
      <DecorBackground />
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-3 pb-24 pt-3 sm:px-5 lg:px-8 lg:pb-8">
        <AppHeader
          view={view}
          onViewChange={setView}
          onOpenParentUnlock={openParentUnlockOnly}
          onLockParent={lockParent}
          isParentUnlocked={isParentUnlocked}
          parentRole={uiState.role}
          parentRemaining={parentRemaining}
        />

        {isParentUnlocked ? (
          <ParentModeBanner
            role={uiState.role ?? 'Mama'}
            remaining={parentRemaining}
            onLockParent={lockParent}
          />
        ) : null}

        <main className="flex-1 py-4 sm:py-5">
          {view === 'dashboard' ? (
            <DashboardView
              items={childStats}
              summary={familySummary}
              onOpenChild={(childId) => {
                setActiveChild(childId)
                setView('board')
              }}
            />
          ) : null}

          {view === 'board' ? (
            <ChildBoardView
              child={activeChildState}
              meta={CHILDREN[activeChild]}
              parentUnlocked={isParentUnlocked}
              onOpenParentUnlock={openParentUnlockOnly}
              onSwitchChild={(childId) => setActiveChild(childId)}
              onOpenTask={(mode, taskId, seed) => queuedOrSetTaskDraft({ childId: activeChild, mode, taskId, seed })}
              onCompleteTask={(taskId) => requestCompleteTask(activeChild, taskId)}
              onReactivateTask={(taskId) => requestReactivateTask(activeChild, taskId)}
              onPresetAction={(kind, preset) => requestPresetAction(activeChild, kind, preset)}
              onOpenHistory={() => setView('history')}
              onOpenSettings={() => setView('settings')}
            />
          ) : null}

          {view === 'history' ? (
            <HistoryView entries={visibleHistory} filter={historyFilter} onFilterChange={setHistoryFilter} />
          ) : null}

          {view === 'settings' ? (
            <SettingsView
              parentUnlocked={isParentUnlocked}
              parentRole={uiState.role}
              onOpenParentUnlock={openParentUnlockOnly}
              onReset={requestResetDemo}
            />
          ) : null}
        </main>
      </div>

      <BottomNav view={view} onViewChange={setView} />

      {taskDraft ? (
        <TaskModal
          state={state}
          draft={taskDraft}
          meta={CHILDREN[taskDraft.childId]}
          onClose={() => setTaskDraft(null)}
          onSubmit={(values) => {
            saveTaskNow(taskDraft.childId, taskDraft.taskId, values, parentRole)
            setTaskDraft(null)
          }}
        />
      ) : null}

      {parentPrompt ? (
        <ParentAuthModal
          prompt={parentPrompt}
          onClose={() => {
            setParentPrompt(null)
            setPendingAction(null)
          }}
          onUnlock={(role) => unlockParent(role)}
        />
      ) : null}

      {confirmDialog ? (
        <ConfirmModal
          dialog={confirmDialog}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => {
            confirmDialog.onConfirm()
            setConfirmDialog(null)
          }}
        />
      ) : null}

      {rewardFlash ? <RewardFlashBubble flash={rewardFlash} /> : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  )
}

function AppHeader({
  view,
  onViewChange,
  onOpenParentUnlock,
  onLockParent,
  isParentUnlocked,
  parentRole,
  parentRemaining,
}: {
  view: View
  onViewChange: (view: View) => void
  onOpenParentUnlock: () => void
  onLockParent: () => void
  isParentUnlocked: boolean
  parentRole: ParentRole | null
  parentRemaining: number
}) {
  return (
    <header className="rounded-[30px] border border-brand-border/70 bg-white/90 p-3 shadow-soft backdrop-blur sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-sun via-brand-coral to-brand-sky text-white shadow-pop">
              <div className="flex items-center gap-0.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
                <span className="h-3.5 w-3.5 rounded-full bg-white/92" />
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
              </div>
            </div>
            <div>
              <p className="font-display text-xl tracking-tight text-brand-ink sm:text-2xl">Family Tasks Board</p>
              <p className="text-xs text-brand-muted sm:text-sm">Julcia, Oliwcia, skarbonki i rodzinny rytm w jednym miejscu.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={isParentUnlocked ? onLockParent : onOpenParentUnlock}
            className={cx(
              'inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition',
              isParentUnlocked ? 'bg-brand-ink text-white shadow-pop' : 'bg-brand-page text-brand-ink hover:bg-white',
            )}
          >
            <LockIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{isParentUnlocked ? `${parentRole} · ${formatCountdown(parentRemaining)}` : 'Odblokuj rodzica'}</span>
            <span className="sm:hidden">{isParentUnlocked ? 'Rodzic' : 'Unlock'}</span>
          </button>
        </div>

        <nav className="hidden gap-2 rounded-full bg-brand-page/70 p-2 lg:flex">
          {mainViews.map((item) => {
            const Icon = item.icon
            const active = view === item.key

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onViewChange(item.key)}
                className={cx(
                  'inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition',
                  active ? 'bg-white text-brand-ink shadow-[0_8px_20px_rgba(30,82,62,0.12)]' : 'text-brand-muted hover:bg-white/70 hover:text-brand-ink',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

function ParentModeBanner({
  role,
  remaining,
  onLockParent,
}: {
  role: ParentRole
  remaining: number
  onLockParent: () => void
}) {
  return (
    <div className="mt-3 rounded-[28px] border border-brand-mint/30 bg-white/90 px-4 py-3 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-mintSoft p-3 text-brand-ink">
            <ParentIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Tryb rodzica aktywny</p>
            <p className="mt-1 font-display text-2xl tracking-tight text-brand-ink">
              {role} · {formatCountdown(remaining)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLockParent}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink px-4 py-3 text-sm font-bold text-white shadow-pop"
        >
          <LockIcon className="h-4 w-4" />
          Zablokuj
        </button>
      </div>
    </div>
  )
}

function BottomNav({
  view,
  onViewChange,
}: {
  view: View
  onViewChange: (view: View) => void
}) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-2 rounded-[24px] border border-brand-border/70 bg-white/92 p-2 shadow-[0_18px_40px_rgba(29,76,56,0.16)] backdrop-blur lg:hidden">
      {mainViews.map((item) => {
        const Icon = item.icon
        const active = view === item.key

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onViewChange(item.key)}
            className={cx(
              'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-extrabold transition',
              active ? 'bg-brand-ink text-white' : 'text-brand-muted',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

function DashboardView({
  items,
  summary,
  onOpenChild,
}: {
  items: Array<
    ChildMeta & {
      childId: ChildId
      activeTasks: number
      pluses: number
      minuses: number
      balance: number
      earned: number
      completed: number
      savings: ChildState['savings']
      achievements: Array<{ id: string; title: string; description: string; thresholdLabel: string; unlocked: boolean }>
    }
  >
  summary: {
    balance: number
    active: number
    pluses: number
    minuses: number
    earned: number
    unlocked: number
  }
  onOpenChild: (childId: ChildId) => void
}) {
  return (
    <section className="space-y-4 sm:space-y-5">
      <div className="rounded-[34px] border border-brand-border/70 bg-white/92 p-4 shadow-soft backdrop-blur sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-start">
          <div>
            <p className="inline-flex rounded-full bg-brand-sunSoft px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#8a6a00]">
              Rodzinny snapshot
            </p>
            <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-brand-ink sm:text-5xl">
              Dwie osobne historie. Jedna spokojna codzienność.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted sm:text-lg">
              Julcia i Oliwcia mają własne światy, własne skarbonki i własny rytm. Rodzic widzi wszystko w jednym miejscu, bez biurowego chaosu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatTile label="Saldo razem" value={formatMoney(summary.balance)} tone="mint" />
            <StatTile label="Aktywne" value={String(summary.active)} tone="sky" />
            <StatTile label="Osiągnięcia" value={String(summary.unlocked)} tone="sun" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <DashboardChildCard key={item.childId} item={item} onOpenChild={onOpenChild} />
        ))}
      </div>
    </section>
  )
}

function DashboardChildCard({
  item,
  onOpenChild,
}: {
  item: ChildMeta & {
    childId: ChildId
    activeTasks: number
    pluses: number
    minuses: number
    balance: number
    earned: number
    completed: number
    savings: ChildState['savings']
    achievements: Array<{ id: string; title: string; description: string; thresholdLabel: string; unlocked: boolean }>
  }
  onOpenChild: (childId: ChildId) => void
}) {
  const theme = childThemes[item.childId]
  const recentSavings = item.savings.slice(0, 3)

  return (
    <article className="overflow-hidden rounded-[36px] border border-brand-border/70 bg-white/96 shadow-soft">
      <div className={`grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)] bg-gradient-to-br ${theme.gradient}`}>
        <div className="relative flex min-h-[290px] flex-col justify-between overflow-hidden p-5 sm:p-6">
          <div className="absolute -left-10 top-10 h-32 w-32 rounded-full blur-3xl" style={{ background: theme.glow }} />
          <div className="absolute -right-5 bottom-4 h-24 w-24 rounded-full bg-white/50 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]" style={{ background: theme.accentSoft, color: theme.accentStrong }}>
              {item.name}
            </div>
            <div className="rounded-full bg-white/90 p-2 text-brand-ink shadow-soft">
              <SparkIcon className="h-4 w-4" />
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center py-6">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-[44px] bg-white shadow-soft">
              <div className="absolute -left-3 top-4 h-4 w-4 rounded-full bg-brand-sun opacity-80" />
              <div className="absolute right-4 top-5 h-3 w-3 rounded-full bg-brand-coral opacity-80" />
              <div className="absolute bottom-4 left-5 h-2.5 w-2.5 rounded-full bg-brand-sky opacity-80" />
              <div className="text-center">
                <div className="font-display text-6xl leading-none text-brand-ink">{item.name.startsWith('J') ? 'J' : 'O'}</div>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.22em]" style={{ color: theme.accentStrong }}>
                  {item.name}
                </p>
                <PiggyIcon className="mx-auto mt-3 h-11 w-11" style={{ color: theme.accentStrong }} />
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/85 px-3 py-3 shadow-soft">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">Saldo</p>
              <p className="mt-1 font-display text-xl text-brand-ink">{formatMoney(item.balance)}</p>
            </div>
            <div className="rounded-2xl bg-white/85 px-3 py-3 shadow-soft">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">Aktywne</p>
              <p className="mt-1 font-display text-xl text-brand-ink">{item.activeTasks}</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]" style={{ background: theme.accentSoft, color: theme.accentStrong }}>
                {theme.badge}
              </p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">{item.description}</p>
            </div>
            <div className="rounded-2xl bg-brand-page p-3 text-brand-ink">
              <PiggyIcon className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Saldo" value={formatMoney(item.balance)} tone="mint" />
            <StatTile label="Zadania" value={String(item.activeTasks)} tone="sky" />
            <StatTile label="Plusy" value={String(item.pluses)} tone="sun" />
            <StatTile label="Minusy" value={String(item.minuses)} tone="coral" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChild(item.childId)}
              className="inline-flex min-w-[190px] flex-1 items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white shadow-pop transition hover:translate-y-[-1px]"
            >
              Przejdź do świata {childGenitive(item.childId)}
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <div className="rounded-full bg-brand-page px-4 py-3 text-sm font-semibold text-brand-muted">
              {item.completed} wykonanych
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniListCard title="Historia wpływów" icon={<CoinsIcon className="h-4 w-4" />} compact={false}>
              {recentSavings.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-brand-muted">{event.title}</span>
                  <span className={cx('font-bold', event.amount >= 0 ? 'text-brand-ink' : 'text-brand-coral')}>
                    {event.amount >= 0 ? '+' : ''}
                    {formatMoney(event.amount)}
                  </span>
                </li>
              ))}
            </MiniListCard>
            <MiniListCard title="Osiągnięcia" icon={<TrophyIcon className="h-4 w-4" />} compact={false}>
              {item.achievements.filter((achievement) => achievement.unlocked).slice(0, 2).map((achievement) => (
                <li key={achievement.id} className="truncate text-sm text-brand-muted">
                  {achievement.title}
                </li>
              ))}
            </MiniListCard>
          </div>
        </div>
      </div>
    </article>
  )
}

function ChildBoardView({
  child,
  meta,
  parentUnlocked,
  onOpenParentUnlock,
  onSwitchChild,
  onOpenTask,
  onCompleteTask,
  onReactivateTask,
  onPresetAction,
  onOpenHistory,
  onOpenSettings,
}: {
  child: ChildState
  meta: ChildMeta
  parentUnlocked: boolean
  onOpenParentUnlock: () => void
  onSwitchChild: (childId: ChildId) => void
  onOpenTask: (mode: 'add' | 'edit', taskId?: string, seed?: Partial<TaskFormValues>) => void
  onCompleteTask: (taskId: string) => void
  onReactivateTask: (taskId: string) => void
  onPresetAction: (kind: 'plus' | 'minus', preset: ActionPreset) => void
  onOpenHistory: () => void
  onOpenSettings: () => void
}) {
  const activeTasks = sortTasks(child.tasks.filter((task) => task.status !== 'done'))
  const doneTasks = sortTasks(child.tasks.filter((task) => task.status === 'done'))
  const achievements = getChildAchievements(child)
  const theme = childThemes[meta.id]

  return (
    <section className="space-y-5">
      <article className="overflow-hidden rounded-[36px] border border-brand-border/70 bg-white/96 shadow-soft">
        <div className={`bg-gradient-to-br ${theme.gradient}`}>
          <div className="flex flex-col gap-4 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full bg-brand-coralSoft px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#b65b4f]">
                Świat dziecka
              </div>
              <div className="flex gap-2">
                {childOrder.map((childId) => {
                  const selected = childId === meta.id
                  return (
                    <button
                      key={childId}
                      type="button"
                      onClick={() => onSwitchChild(childId)}
                      className={cx(
                        'rounded-full px-4 py-2 text-sm font-bold transition',
                        selected ? 'bg-brand-ink text-white shadow-pop' : 'bg-white/85 text-brand-muted',
                      )}
                    >
                      {childDisplayName(childId)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex items-center justify-center">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-[44px] bg-white/90 shadow-soft">
                  <div className="absolute -left-4 top-5 h-4 w-4 rounded-full bg-brand-sun opacity-70" />
                  <div className="absolute right-5 top-5 h-3.5 w-3.5 rounded-full bg-brand-coral opacity-70" />
                  <div className="absolute bottom-5 left-5 h-2.5 w-2.5 rounded-full bg-brand-sky opacity-70" />
                  <div className="text-center">
                    <div className="font-display text-6xl leading-none text-brand-ink">{meta.id === 'julia' ? 'J' : 'O'}</div>
                    <p className="mt-2 text-sm font-black uppercase tracking-[0.22em]" style={{ color: theme.accentStrong }}>
                      {meta.name}
                    </p>
                    <PiggyIcon className="mx-auto mt-3 h-11 w-11" style={{ color: theme.accentStrong }} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]" style={{ background: theme.accentSoft, color: theme.accentStrong }}>
                {theme.badge}
                </div>
                <h2 className="font-display text-4xl tracking-tight text-brand-ink">W świecie {meta.name}</h2>
                <p className="max-w-2xl text-sm leading-6 text-brand-muted sm:text-lg">
                  Skarbonka jest tutaj najważniejsza. Zadania są kartami, a rodzic odblokowuje akcje tylko na chwilę.
                </p>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-[24px] bg-white/90 px-4 py-3 shadow-soft">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">Saldo skarbonki</p>
                    <p className="mt-2 font-display text-3xl tracking-tight text-brand-ink">{formatMoney(child.balance)}</p>
                  </div>
                  <div className="rounded-[24px] bg-white/90 px-4 py-3 shadow-soft">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">Aktywne zadania</p>
                    <p className="mt-2 font-display text-3xl tracking-tight text-brand-ink">{activeTasks.length}</p>
                  </div>
                  <div className="rounded-[24px] bg-white/90 px-4 py-3 shadow-soft">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">Plusy / minusy</p>
                    <p className="mt-2 font-display text-3xl tracking-tight text-brand-ink">
                      {child.pluses}/{child.minuses}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-white/90 px-4 py-3 shadow-soft">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">Dni aktywne</p>
                    <p className="mt-2 font-display text-3xl tracking-tight text-brand-ink">{child.activeDays}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[28px] bg-white/90 p-4 shadow-soft">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Skarbonka</p>
                    <div className="mt-3 rounded-[24px] bg-brand-ink p-4 text-white shadow-pop">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Aktualne saldo</p>
                      <p className="mt-2 font-display text-4xl tracking-tight">{formatMoney(child.balance)}</p>
                      <p className="mt-3 text-sm leading-6 text-white/78">Po zatwierdzeniu zadania kwota trafia bezpośrednio do salda Julci lub Oliwci.</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-brand-mintSoft px-3 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">Zarobione</p>
                        <p className="mt-1 font-display text-2xl text-brand-ink">{formatMoney(child.totalEarned)}</p>
                      </div>
                      <div className="rounded-2xl bg-brand-skySoft px-3 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">Dni aktywne</p>
                        <p className="mt-1 font-display text-2xl text-brand-ink">{child.activeDays}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-white/90 p-4 shadow-soft">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Progres</p>
                    <div className="mt-3 space-y-3">
                      <ProgressStrip label="Wykonane zadania" value={completedTaskCount(child)} max={10} tone="mint" />
                      <ProgressStrip label="Plusy" value={child.pluses} max={10} tone="sun" />
                      <ProgressStrip label="Minuty aktywności" value={child.activeDays} max={7} tone="sky" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-4">
          <section className="rounded-[36px] border border-brand-border/70 bg-white/96 p-4 shadow-soft sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Sterowanie</p>
                <h3 className="mt-1 font-display text-2xl text-brand-ink">Szybkie akcje rodzica</h3>
              </div>
              <div className="rounded-full bg-brand-page px-4 py-2 text-sm font-semibold text-brand-muted">
                {activeTasks.length} aktywnych, {doneTasks.length} wykonanych
              </div>
            </div>

            {parentUnlocked ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => onOpenTask('add')}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Dodaj zadanie
                  </button>
                  <button
                    type="button"
                    onClick={() => onPresetAction('plus', PLUS_PRESETS[0])}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-mintSoft px-5 py-3 text-sm font-bold text-brand-ink transition hover:-translate-y-0.5"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Przyznaj plus
                  </button>
                  <button
                    type="button"
                    onClick={() => onPresetAction('minus', MINUS_PRESETS[0])}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-coralSoft px-5 py-3 text-sm font-bold text-brand-ink transition hover:-translate-y-0.5"
                  >
                    <MinusIcon className="h-4 w-4" />
                    Przyznaj minus
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {TASK_PRESETS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() =>
                        onOpenTask('add', undefined, {
                          title: preset.title,
                          description: preset.description,
                          reward: String(preset.reward),
                          frequency: preset.frequency,
                          status: 'todo',
                        })
                      }
                      className="rounded-[24px] border border-brand-border/70 bg-white px-4 py-3 text-left shadow-soft transition hover:-translate-y-0.5"
                    >
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">Gotowe zadanie</p>
                      <p className="mt-1 font-display text-xl text-brand-ink">{preset.title}</p>
                      <p className="mt-2 text-sm text-brand-muted">{preset.reward} zł · {taskFrequencyLabel(preset.frequency).toLowerCase()}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[28px] border border-dashed border-brand-border bg-brand-page p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Tryb dziecka</p>
                    <h4 className="mt-1 font-display text-2xl text-brand-ink">Rodzic odblokowuje akcje na chwilę</h4>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">
                      Dodawanie, zatwierdzanie, plusy, minusy i przywracanie zadań są zablokowane, dopóki rodzic nie poda hasła.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenParentUnlock}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white shadow-pop"
                  >
                    <LockIcon className="h-4 w-4" />
                    Odblokuj rodzica
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[36px] border border-brand-border/70 bg-white/96 p-4 shadow-soft sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Zadania</p>
                <h3 className="mt-1 font-display text-2xl text-brand-ink">Kafelki zamiast listy administracyjnej</h3>
              </div>
              <div className="rounded-full bg-brand-page px-4 py-2 text-sm font-semibold text-brand-muted">
                {activeTasks.length} aktywnych
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenHistory}
                className="inline-flex items-center gap-2 rounded-full bg-brand-page px-4 py-2.5 text-sm font-bold text-brand-ink transition hover:-translate-y-0.5"
              >
                <HistoryIcon className="h-4 w-4" />
                Historia
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 rounded-full bg-brand-page px-4 py-2.5 text-sm font-bold text-brand-ink transition hover:-translate-y-0.5"
              >
                <SettingsIcon className="h-4 w-4" />
                Ustawienia
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {activeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  parentUnlocked={parentUnlocked}
                  onComplete={() => onCompleteTask(task.id)}
                  onReactivate={() => onReactivateTask(task.id)}
                  onEdit={() => onOpenTask('edit', task.id)}
                />
              ))}
            </div>

            {doneTasks.length ? (
              <div className="mt-5 rounded-[28px] bg-brand-page/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Wykonane</p>
                    <p className="mt-1 font-semibold text-brand-ink">{doneTasks.length} gotowych do przywrócenia</p>
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  {doneTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      parentUnlocked={parentUnlocked}
                      completed
                      onComplete={() => onCompleteTask(task.id)}
                      onReactivate={() => onReactivateTask(task.id)}
                      onEdit={() => onOpenTask('edit', task.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <article className="rounded-[36px] border border-brand-border/70 bg-white/96 p-4 shadow-soft sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Skarbonka</p>
            <h3 className="mt-1 font-display text-2xl tracking-tight text-brand-ink">Saldo i wzrost</h3>
            <div className="mt-4 rounded-[28px] bg-brand-ink p-5 text-white shadow-pop">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Aktualne saldo</p>
              <p className="mt-2 font-display text-4xl tracking-tight">{formatMoney(child.balance)}</p>
              <p className="mt-3 text-sm leading-6 text-white/75">Każde wykonane zadanie z automatu zasila skarbonkę dziecka.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-brand-mintSoft px-3 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">Zarobione</p>
                <p className="mt-1 font-display text-2xl text-brand-ink">{formatMoney(child.totalEarned)}</p>
              </div>
              <div className="rounded-2xl bg-brand-skySoft px-3 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">Aktywne dni</p>
                <p className="mt-1 font-display text-2xl text-brand-ink">{child.activeDays}</p>
              </div>
            </div>
          </article>

          <MiniListCard title="Historia wpływów" icon={<CoinsIcon className="h-4 w-4" />} compact={false}>
            {child.savings.slice(0, 5).map((entry) => (
              <li key={entry.id} className="rounded-2xl bg-brand-page px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-brand-ink">{entry.title}</span>
                  <span className={cx('font-display text-lg', entry.amount >= 0 ? 'text-brand-ink' : 'text-brand-coral')}>
                    {entry.amount >= 0 ? '+' : ''}
                    {formatMoney(entry.amount)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-muted">{entry.reason}</p>
              </li>
            ))}
          </MiniListCard>

          <MiniListCard title="Osiągnięcia" icon={<TrophyIcon className="h-4 w-4" />} compact={false}>
            {achievements.map((achievement) => (
              <li
                key={achievement.id}
                className={cx(
                  'rounded-2xl border px-3 py-3',
                  achievement.unlocked ? 'border-brand-mint/40 bg-brand-mintSoft' : 'border-brand-border bg-white',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-brand-ink">{achievement.title}</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">{achievement.thresholdLabel}</span>
                </div>
                <p className="mt-1 text-xs text-brand-muted">{achievement.description}</p>
              </li>
            ))}
          </MiniListCard>

          <MiniListCard title="Ostatnie nagrody" icon={<SparkIcon className="h-4 w-4" />} compact={false}>
            {child.history
              .filter((entry) => entry.category === 'reward')
              .slice(0, 4)
              .map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-ink">{entry.title}</p>
                    <p className="text-xs text-brand-muted">{entry.detail}</p>
                  </div>
                  <span className="font-display text-lg text-brand-ink">{typeof entry.amount === 'number' ? formatMoney(entry.amount) : '—'}</span>
                </li>
              ))}
          </MiniListCard>
        </aside>
      </div>
    </section>
  )
}

function TaskCard({
  task,
  completed,
  parentUnlocked,
  onComplete,
  onReactivate,
  onEdit,
}: {
  task: Task
  completed?: boolean
  parentUnlocked: boolean
  onComplete: () => void
  onReactivate: () => void
  onEdit: () => void
}) {
  const statusClass = taskStatusTone(task.status)
  const chipClass = taskFrequencyTone(task.frequency)

  return (
    <article className={cx('rounded-[30px] border p-4 shadow-[0_8px_20px_rgba(29,76,56,0.06)]', completed ? 'border-brand-border bg-white' : 'border-brand-border/70 bg-white/95')}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cx('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]', statusClass)}>{taskStatusLabel(task.status)}</span>
            <span className={cx('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]', chipClass)}>
              {taskFrequencyLabel(task.frequency)}
            </span>
            {task.frequency !== 'once' ? (
              <span className="rounded-full bg-brand-page px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">
                Cykliczne
              </span>
            ) : null}
          </div>

          <div className="flex gap-3">
            <div className={cx('flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl', completed ? 'bg-brand-page' : 'bg-brand-mintSoft')}>
              <TaskIcon className="h-6 w-6 text-brand-ink" />
            </div>
            <div className="min-w-0">
              <h4 className={cx('font-display text-2xl tracking-tight', completed ? 'text-brand-muted line-through decoration-brand-coral/60' : 'text-brand-ink')}>
                {task.title}
              </h4>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">{task.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-brand-muted">
            <span className="rounded-full bg-brand-page px-3 py-1.5 font-semibold">Nagroda {formatMoney(task.reward)}</span>
            <span className="rounded-full bg-brand-page px-3 py-1.5 font-semibold">Utworzono {formatShortDate(task.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          {task.status === 'done' ? (
            <button type="button" onClick={onReactivate} className="inline-flex items-center gap-2 rounded-full bg-brand-skySoft px-4 py-2.5 text-sm font-bold text-brand-ink">
              <UndoIcon className="h-4 w-4" />
              {parentUnlocked ? 'Przywróć' : 'Odblokuj rodzica'}
            </button>
          ) : (
            <button type="button" onClick={onComplete} className="inline-flex items-center gap-2 rounded-full bg-brand-mintSoft px-4 py-2.5 text-sm font-bold text-brand-ink">
              <CheckIcon className="h-4 w-4" />
              {parentUnlocked ? 'Zatwierdź' : 'Zablokowane'}
            </button>
          )}

          {parentUnlocked ? (
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-full bg-brand-page px-4 py-2.5 text-sm font-bold text-brand-ink">
              <EditIcon className="h-4 w-4" />
              Edytuj
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-page px-4 py-2.5 text-sm font-bold text-brand-muted">
              <LockIcon className="h-4 w-4" />
              Tylko rodzic
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function ProgressStrip({
  label,
  value,
  max,
  tone,
}: {
  label: string
  value: number
  max: number
  tone: 'mint' | 'sky' | 'sun'
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const track = tone === 'mint' ? 'bg-brand-mintSoft' : tone === 'sky' ? 'bg-brand-skySoft' : 'bg-brand-sunSoft'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-brand-ink">{label}</p>
        <p className="text-sm font-bold text-brand-muted">
          {value}/{max}
        </p>
      </div>
      <div className={cx('h-3 overflow-hidden rounded-full', track)}>
        <div className={cx('h-full rounded-full', tone === 'mint' ? 'bg-brand-mint' : tone === 'sky' ? 'bg-brand-sky' : 'bg-brand-sun')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function HistoryView({
  entries,
  filter,
  onFilterChange,
}: {
  entries: Array<HistoryEntry & { childId: ChildId }>
  filter: HistoryFilter
  onFilterChange: (filter: HistoryFilter) => void
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="rounded-[34px] border border-brand-border/70 bg-white/90 p-4 shadow-soft sm:p-5">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-skySoft px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#165d94]">
            <FilterIcon className="h-4 w-4" />
            Historia
          </p>
          <h1 className="font-display text-3xl tracking-tight text-brand-ink sm:text-5xl">Filtruj to, co ważne.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted sm:text-lg">
            Szybko przełączasz dzieci, zadania, plusy, minusy i nagrody bez ściany tekstu.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {historyFilters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onFilterChange(item.value)}
                className={cx(
                  'rounded-full px-4 py-3 text-sm font-bold transition',
                  filter === item.value ? 'bg-brand-ink text-white shadow-pop' : 'bg-brand-page text-brand-muted hover:text-brand-ink',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {entries.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      <aside className="space-y-4">
        <MiniListCard title="Podsumowanie" icon={<SparkIcon className="h-4 w-4" />} compact={false}>
          <li className="rounded-2xl bg-brand-mintSoft px-3 py-3 text-sm text-brand-ink">{entries.filter((entry) => entry.category === 'reward').length} nagród</li>
          <li className="rounded-2xl bg-brand-skySoft px-3 py-3 text-sm text-brand-ink">{entries.filter((entry) => entry.category === 'task').length} zdarzeń zadaniowych</li>
          <li className="rounded-2xl bg-brand-sunSoft px-3 py-3 text-sm text-brand-ink">{entries.filter((entry) => entry.category === 'plus').length} plusów</li>
          <li className="rounded-2xl bg-brand-coralSoft px-3 py-3 text-sm text-brand-ink">{entries.filter((entry) => entry.category === 'minus').length} minusów</li>
        </MiniListCard>
      </aside>
    </section>
  )
}

function HistoryRow({
  entry,
}: {
  entry: HistoryEntry & { childId: ChildId }
}) {
  const tone =
    entry.category === 'reward'
      ? 'bg-brand-mintSoft text-brand-ink'
      : entry.category === 'plus'
        ? 'bg-brand-sunSoft text-brand-ink'
        : entry.category === 'minus'
          ? 'bg-brand-coralSoft text-brand-ink'
          : 'bg-brand-skySoft text-brand-ink'

  return (
    <article className="rounded-[30px] border border-brand-border/70 bg-white/95 p-4 shadow-[0_8px_20px_rgba(29,76,56,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className={cx('mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tone)}>
            <SparkIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-brand-ink">{entry.title}</h3>
              <span className="rounded-full bg-brand-page px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">
                {entry.childId === 'julia' ? 'Julcia' : 'Oliwcia'}
              </span>
              <span className="rounded-full bg-brand-page px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">
                {historyCategoryLabel(entry.category)}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-brand-muted">{entry.detail}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-muted">
          <span>{formatDateTime(entry.createdAt)}</span>
          {typeof entry.amount === 'number' ? <span>{formatMoney(entry.amount)}</span> : null}
        </div>
      </div>
    </article>
  )
}

function SettingsView({
  parentUnlocked,
  parentRole,
  onOpenParentUnlock,
  onReset,
}: {
  parentUnlocked: boolean
  parentRole: ParentRole | null
  onOpenParentUnlock: () => void
  onReset: () => void
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="rounded-[34px] border border-brand-border/70 bg-white/90 p-4 shadow-soft sm:p-5">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-coralSoft px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#a64a39]">
            <SettingsIcon className="h-4 w-4" />
            Ustawienia rodzica
          </p>
          <h1 className="font-display text-3xl tracking-tight text-brand-ink sm:text-5xl">Tryb rodzica i LocalStorage.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted sm:text-lg">
            Działania administracyjne są widoczne i bezpieczne. Jednorazowe odblokowanie trwa 10 minut i można je zatrzymać ręcznie.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Mama" value="Hasło" tone="coral" />
          <StatTile label="Tata" value="Hasło" tone="sky" />
          <StatTile label="LocalStorage" value="V3" tone="mint" />
        </div>

        <div className="rounded-[34px] border border-brand-border/70 bg-white/90 p-4 shadow-soft sm:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-page p-3">
              <ParentIcon className="h-6 w-6 text-brand-ink" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-brand-ink">Co jest chronione?</h2>
              <p className="text-sm text-brand-muted">Dodawanie, zatwierdzanie, plusy, minusy i przywracanie zadań.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniListCard title="Akcje" icon={<LockIcon className="h-4 w-4" />}>
              <li>Dodawanie i edycja zadania</li>
              <li>Zatwierdzanie wykonania</li>
              <li>Plusy i minusy</li>
              <li>Przywracanie wykonanych zadań</li>
            </MiniListCard>
            <MiniListCard title="Dane" icon={<SparkIcon className="h-4 w-4" />}>
              <li>LocalStorage</li>
              <li>Odświeżenie zachowuje stan</li>
              <li>Wersjonowany model danych</li>
            </MiniListCard>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        {parentUnlocked ? (
          <div className="rounded-[34px] border border-brand-mint/30 bg-brand-ink p-4 text-white shadow-pop sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">Tryb aktywny</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{parentRole ?? 'Mama'}</p>
            <p className="mt-2 text-sm leading-6 text-white/75">Możesz dodać zadanie, zatwierdzić wykonanie lub przyznać plus i minus.</p>
            <button
              type="button"
              onClick={onReset}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-coralSoft px-5 py-4 text-sm font-bold text-brand-ink"
            >
              <UndoIcon className="h-4 w-4" />
              Przywróć dane demo
            </button>
          </div>
        ) : (
          <div className="rounded-[34px] border border-brand-border/70 bg-white/90 p-4 shadow-soft sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Tryb dziecka</p>
            <p className="mt-2 font-display text-3xl tracking-tight text-brand-ink">Najpierw odblokuj rodzica.</p>
            <p className="mt-2 text-sm leading-6 text-brand-muted">Bez aktywnego rodzica nie da się zatwierdzać zadań ani zmieniać wartości nagród.</p>
            <button
              type="button"
              onClick={onOpenParentUnlock}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-4 text-sm font-bold text-white shadow-pop"
            >
              <LockIcon className="h-4 w-4" />
              Odblokuj rodzica
            </button>
          </div>
        )}
      </aside>
    </section>
  )
}

function TaskModal({
  state,
  draft,
  meta,
  onClose,
  onSubmit,
}: {
  state: AppState
  draft: TaskDraft
  meta: ChildMeta
  onClose: () => void
  onSubmit: (values: TaskFormValues) => void
}) {
  const task = draft.taskId ? state.children[draft.childId].tasks.find((entry) => entry.id === draft.taskId) ?? null : null
  const [values, setValues] = useState<TaskFormValues>(() => {
    const base = {
      title: task?.title ?? '',
      description: task?.description ?? '',
      reward: task ? String(task.reward) : '5',
      frequency: task?.frequency ?? 'daily',
      status: task?.status ?? 'todo',
    }

    return {
      ...base,
      ...draft.seed,
      reward: draft.seed?.reward ?? base.reward,
      frequency: draft.seed?.frequency ?? base.frequency,
      status: draft.seed?.status ?? base.status,
      title: draft.seed?.title ?? base.title,
      description: draft.seed?.description ?? base.description,
    }
  })

  return (
    <ModalShell title={draft.mode === 'add' ? 'Dodaj zadanie' : 'Edytuj zadanie'} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <section className="space-y-4">
          {draft.mode === 'add' ? (
            <div className="rounded-[28px] bg-brand-page p-4">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Gotowe propozycje</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {TASK_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() =>
                      setValues({
                        title: preset.title,
                        description: preset.description,
                        reward: String(preset.reward),
                        frequency: preset.frequency,
                        status: 'todo',
                      })
                    }
                    className="rounded-2xl bg-white px-3 py-3 text-left shadow-soft transition hover:-translate-y-0.5"
                  >
                    <p className="font-semibold text-brand-ink">{preset.title}</p>
                    <p className="mt-1 text-xs text-brand-muted">{preset.reward} zł · {taskFrequencyLabel(preset.frequency).toLowerCase()}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Field>
            <FieldLabel>Nazwa</FieldLabel>
            <FieldInput value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} placeholder="Posprzątanie pokoju" />
          </Field>

          <Field>
            <FieldLabel>Opis</FieldLabel>
            <FieldTextarea
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              placeholder="Krótki opis"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Nagroda</FieldLabel>
              <FieldInput
                type="number"
                min="0"
                step="1"
                value={values.reward}
                onChange={(event) => setValues((current) => ({ ...current, reward: event.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel>Częstotliwość</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {TASK_FREQUENCY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValues((current) => ({ ...current, frequency: option.value }))}
                    className={cx(
                      'rounded-2xl px-3 py-3 text-sm font-bold transition',
                      values.frequency === option.value ? 'bg-brand-ink text-white shadow-pop' : 'bg-brand-page text-brand-muted hover:text-brand-ink',
                    )}
                    title={option.detail}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field>
            <FieldLabel>Status</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {(['todo', 'progress', 'done'] as TaskStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setValues((current) => ({ ...current, status }))}
                  className={cx(
                    'rounded-2xl px-4 py-3 text-sm font-bold transition',
                    values.status === status ? 'bg-brand-ink text-white shadow-pop' : 'bg-brand-page text-brand-muted hover:text-brand-ink',
                  )}
                >
                  {taskStatusLabel(status)}
                </button>
              ))}
            </div>
          </Field>
        </section>

        <section className="space-y-4">
          <div className="rounded-[28px] bg-brand-page p-4">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Dziecko</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 shadow-soft">
                <PiggyIcon className="h-6 w-6 text-brand-ink" />
              </div>
              <div>
                <p className="font-display text-2xl text-brand-ink">{meta.name}</p>
                <p className="text-sm text-brand-muted">{draft.mode === 'add' ? 'Nowe zadanie' : 'Edytowanie zadania'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-brand-border/70 bg-white p-4 shadow-soft">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Podgląd</p>
            <div className="mt-3 rounded-[24px] bg-brand-ink p-4 text-white">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">{taskStatusLabel(values.status)}</p>
              <p className="mt-2 font-display text-3xl tracking-tight">{values.title || 'Nowe zadanie'}</p>
              <p className="mt-2 text-sm leading-6 text-white/75">{values.description || 'Krótki opis zadania.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold">{values.reward || '0'} zł</span>
                <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold">{taskFrequencyLabel(values.frequency)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onSubmit(values)
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-4 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5"
            >
              <CheckIcon className="h-4 w-4" />
              {draft.mode === 'add' ? 'Dodaj zadanie' : 'Zapisz zmiany'}
            </button>
            <p className="mt-3 text-xs leading-5 text-brand-muted">
              Zadania cykliczne po wykonaniu automatycznie tworzą kolejną instancję.
            </p>
          </div>
        </section>
      </div>
    </ModalShell>
  )
}

function ParentAuthModal({
  prompt,
  onClose,
  onUnlock,
}: {
  prompt: ParentPrompt
  onClose: () => void
  onUnlock: (role: ParentRole) => void
}) {
  const [role, setRole] = useState<ParentRole>('Mama')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <ModalShell title={prompt.title} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <p className="text-sm leading-6 text-brand-muted sm:text-base">{prompt.description}</p>
          <div className="grid grid-cols-2 gap-2">
            {(['Mama', 'Tata'] as ParentRole[]).map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setRole(entry)}
                className={cx(
                  'rounded-2xl px-4 py-3 text-sm font-bold transition',
                  role === entry ? 'bg-brand-ink text-white shadow-pop' : 'bg-brand-page text-brand-ink',
                )}
              >
                {entry}
              </button>
            ))}
          </div>
          <Field>
            <FieldLabel>Hasło rodzica</FieldLabel>
            <FieldInput
              type="password"
              value={secret}
              onChange={(event) => {
                setSecret(event.target.value)
                setError(null)
              }}
              placeholder={`Wpisz ${role}`}
            />
            {error ? <p className="mt-2 text-xs font-semibold text-brand-coral">{error}</p> : null}
          </Field>
          <button
            type="button"
            onClick={() => {
              if (secret.trim() !== role) {
                setError('Wpisz dokładnie hasło Mama albo Tata.')
                return
              }

              onUnlock(role)
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-4 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5"
          >
            <LockIcon className="h-4 w-4" />
            {prompt.confirmLabel}
          </button>
        </section>

        <aside className="rounded-[28px] bg-brand-page p-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Tryb rodzica</p>
          <div className="mt-3 rounded-[24px] bg-white p-4 shadow-soft">
            <p className="font-display text-3xl text-brand-ink">10 minut bezpiecznego dostępu</p>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Po aktywacji możesz zatwierdzać zadania, dodawać plusy i minusy oraz edytować wartości.
            </p>
          </div>
          <div className="mt-3 grid gap-2">
            <div className="rounded-2xl bg-white px-3 py-3 text-sm text-brand-ink shadow-soft">Dodawanie i edycja zadań</div>
            <div className="rounded-2xl bg-white px-3 py-3 text-sm text-brand-ink shadow-soft">Zatwierdzanie wykonania</div>
            <div className="rounded-2xl bg-white px-3 py-3 text-sm text-brand-ink shadow-soft">Plusy, minusy, przywracanie</div>
          </div>
        </aside>
      </div>
    </ModalShell>
  )
}

function ConfirmModal({
  dialog,
  onClose,
  onConfirm,
}: {
  dialog: ConfirmDialog
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <ModalShell title={dialog.title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-brand-muted sm:text-base">{dialog.description}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onClose} className="rounded-full bg-brand-page px-4 py-3 text-sm font-bold text-brand-ink">
            Anuluj
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white shadow-pop">
            <UndoIcon className="h-4 w-4" />
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/36 p-3 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] border border-brand-border/70 bg-white p-4 shadow-[0_30px_90px_rgba(13,32,25,0.3)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Family Tasks Board</p>
            <h2 className="mt-1 font-display text-3xl tracking-tight text-brand-ink">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-brand-page px-4 py-2 text-sm font-bold text-brand-ink">
            Zamknij
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function MiniListCard({
  title,
  icon,
  children,
  compact = true,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div className={cx('rounded-[28px] border border-brand-border/70 bg-white/92 p-4 shadow-soft', compact ? 'sm:p-4' : 'sm:p-5')}>
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-brand-page p-2 text-brand-ink">{icon}</div>
        <h3 className="font-display text-2xl text-brand-ink">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  )
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'mint' | 'sky' | 'sun' | 'coral'
}) {
  const toneClass =
    tone === 'mint'
      ? 'bg-brand-mintSoft'
      : tone === 'sky'
        ? 'bg-brand-skySoft'
        : tone === 'sun'
          ? 'bg-brand-sunSoft'
          : 'bg-brand-coralSoft'

  return (
    <div className={cx('rounded-[24px] border border-brand-border/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]', toneClass)}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">{label}</p>
      <p className="mt-2 font-display text-2xl tracking-tight text-brand-ink">{value}</p>
    </div>
  )
}

function Field({ children }: { children: ReactNode }) {
  return <div className="block">{children}</div>
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-sm font-bold text-brand-ink">{children}</span>
}

function FieldInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        'h-12 w-full rounded-2xl border border-brand-border bg-white px-4 text-sm font-semibold text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-ink',
        className,
      )}
    />
  )
}

function FieldTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        'min-h-28 w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm font-semibold text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-ink',
        className,
      )}
    />
  )
}

function RewardFlashBubble({ flash }: { flash: RewardFlash }) {
  const theme = childThemes[flash.childId]

  return (
    <div
      className="fixed right-4 top-4 z-50 rounded-[28px] border px-5 py-4 text-white shadow-pop animate-bounce"
      style={{ background: `linear-gradient(135deg, ${theme.accentStrong}, #123020)`, borderColor: theme.accent }}
    >
      <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">Nagroda</p>
      <p className="mt-1 font-display text-3xl tracking-tight">+{formatMoney(flash.amount)}</p>
      <p className="mt-1 text-sm text-white/75">{flash.title}</p>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white shadow-pop lg:bottom-6">
      {message}
    </div>
  )
}

function DecorBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[-8rem] top-[-6rem] h-[26rem] w-[26rem] rounded-full bg-brand-sky/18 blur-3xl animate-float-slow" />
      <div className="absolute right-[-6rem] top-[10rem] h-[24rem] w-[24rem] rounded-full bg-brand-coral/16 blur-3xl animate-float-medium" />
      <div className="absolute bottom-[-8rem] left-[42%] h-[26rem] w-[26rem] rounded-full bg-brand-mint/18 blur-3xl animate-float-slow" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(89,183,255,0.12),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(255,141,122,0.12),_transparent_22%),radial-gradient(circle_at_bottom,_rgba(60,207,145,0.14),_transparent_30%)]" />
    </div>
  )
}

export default App
