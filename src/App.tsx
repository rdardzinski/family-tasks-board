import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ACHIEVEMENT_RULES,
  CHILDREN,
  MINUS_PRESETS,
  PLUS_PRESETS,
  STORAGE_KEY,
  TASK_FREQUENCY_OPTIONS,
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
  CoinsIcon,
  CopyIcon,
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
  TrashIcon,
  UndoIcon,
} from './icons'
import juliaPortrait from './assets/julia-portrait.png'
import oliwiaPortrait from './assets/oliwia-portrait.png'

type View = 'dashboard' | 'board' | 'history' | 'settings'

type TaskDraft = {
  childId: ChildId
  mode: 'add' | 'edit'
  taskId?: string
}

type ActionDialog = {
  title: string
  description: string
  confirmLabel: string
  action: (role: ParentRole) => void
}

type TaskFormValues = {
  title: string
  description: string
  reward: string
  frequency: TaskFrequency
  status: TaskStatus
}

type RewardFlash = {
  id: string
  childId: ChildId
  amount: number
  title: string
}

const mainViews: Array<{ key: View; label: string; icon: typeof HomeIcon }> = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { key: 'board', label: 'Tablica', icon: TaskIcon },
  { key: 'history', label: 'Historia', icon: HistoryIcon },
  { key: 'settings', label: 'Ustawienia', icon: SettingsIcon },
]

const childOrder: ChildId[] = ['julia', 'oliwia']

const historyFilters: Array<{ value: HistoryFilter; label: string }> = [
  { value: 'all', label: 'Wszystko' },
  { value: 'julia', label: 'Julia' },
  { value: 'oliwia', label: 'Oliwia' },
  { value: 'task', label: 'Zadania' },
  { value: 'plus', label: 'Plusy' },
  { value: 'minus', label: 'Minusy' },
  { value: 'reward', label: 'Nagrody' },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function todayKey(timestamp = nowIso()) {
  return timestamp.slice(0, 10)
}

function touchActivity(child: ChildState, timestamp = nowIso()): ChildState {
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

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const statusOrder = (task: Task) => (task.status === 'done' ? 2 : task.status === 'progress' ? 1 : 0)
    const statusDelta = statusOrder(left) - statusOrder(right)

    if (statusDelta !== 0) {
      return statusDelta
    }

    return Date.parse(right.createdAt) - Date.parse(left.createdAt)
  })
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

function App() {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === 'undefined') {
      return createInitialState()
    }

    return loadPersistedState(window.localStorage.getItem(STORAGE_KEY))
  })
  const [view, setView] = useState<View>('dashboard')
  const [activeChild, setActiveChild] = useState<ChildId>('julia')
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null)
  const [actionDialog, setActionDialog] = useState<ActionDialog | null>(null)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [rewardFlash, setRewardFlash] = useState<RewardFlash | null>(null)
  const [settingsTick, setSettingsTick] = useState(0)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore storage failures in constrained browser modes.
    }
  }, [state])

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

  const childStats = useMemo(() => {
    return childOrder.map((childId) => {
      const child = state.children[childId]
      return {
        ...CHILDREN[childId],
        activeTasks: taskCount(child),
        pluses: child.pluses,
        minuses: child.minuses,
        balance: child.balance,
        earned: child.totalEarned,
        completed: completedTaskCount(child),
        achievements: getChildAchievements(child),
        savings: [...child.savings].slice(0, 4),
      }
    })
  }, [state])

  const activeChildState = state.children[activeChild]

  const visibleHistory = useMemo(() => {
    const combined = childOrder
      .flatMap((childId) => state.children[childId].history.map((entry) => ({ ...entry, childId })))
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))

    return combined.filter((entry) => {
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
    const totals = childOrder.reduce(
      (acc, childId) => {
        const child = state.children[childId]
        acc.balance += child.balance
        acc.active += taskCount(child)
        acc.pluses += child.pluses
        acc.minuses += child.minuses
        acc.earned += child.totalEarned
        acc.unlocked += getChildAchievements(child).filter((achievement) => achievement.unlocked).length
        return acc
      },
      {
        balance: 0,
        active: 0,
        pluses: 0,
        minuses: 0,
        earned: 0,
        unlocked: 0,
      },
    )

    return totals
  }, [state])

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

  function openTaskDraft(childId: ChildId, mode: 'add' | 'edit', taskId?: string) {
    setTaskDraft({ childId, mode, taskId })
  }

  function openActionDialog(title: string, description: string, confirmLabel: string, action: (role: ParentRole) => void) {
    setActionDialog({ title, description, confirmLabel, action })
  }

  function saveTask(childId: ChildId, taskId: string | undefined, values: TaskFormValues, role: ParentRole) {
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
          createHistoryEntry(
            childId,
            'task-added',
            'Dodano zadanie',
            `${title} (${taskFrequencyLabel(values.frequency)})`,
            role,
            reward,
            now,
          ),
          ...(balanceDelta
            ? [
                createHistoryEntry(
                  childId,
                  'task-completed',
                  'Zadanie wykonane',
                  `${title} zostało zapisane jako wykonane.`,
                  role,
                  reward,
                  now,
                ),
                createHistoryEntry(
                  childId,
                  'reward',
                  'Nagroda do skarbonki',
                  `Do skarbonki trafiło ${formatMoney(reward)}.`,
                  'System',
                  reward,
                  now,
                ),
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
        createHistoryEntry(
          childId,
          'task-updated',
          'Zadanie zapisane',
          `${title} zostało zaktualizowane.`,
          role,
          reward,
          now,
        ),
        ...(becameDone
          ? [
              createHistoryEntry(
                childId,
                'task-completed',
                'Zadanie wykonane',
                `${title} zostało oznaczone jako wykonane.`,
                role,
                reward,
                now,
              ),
              createHistoryEntry(
                childId,
                'reward',
                'Nagroda do skarbonki',
                `Do skarbonki trafiło ${formatMoney(reward)}.`,
                'System',
                reward,
                now,
              ),
            ]
          : []),
        ...(becameTodo
          ? [
              createHistoryEntry(
                childId,
                'task-reactivated',
                'Zadanie przywrócone',
                `${title} wróciło do aktywnych zadań.`,
                role,
                undefined,
                now,
              ),
            ]
          : []),
        ...(rewardDelta
          ? [
              createHistoryEntry(
                childId,
                'reward',
                'Korekta nagrody',
                rewardDelta > 0
                  ? `Kwota wzrosła o ${formatMoney(rewardDelta)}.`
                  : `Kwota zmalała o ${formatMoney(Math.abs(rewardDelta))}.`,
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

  function completeTask(childId: ChildId, taskId: string) {
    const child = state.children[childId]
    const task = child.tasks.find((entry) => entry.id === taskId)

    if (!task || task.status === 'done') {
      return
    }

    const now = nowIso()
    const nextTask = task.frequency === 'once'
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

      const tasks = [
        ...(nextTask ? [nextTask] : []),
        ...nextChild.tasks.filter((entry) => entry.id !== taskId),
        completedTask,
      ]

      const savings = [createSavingsEvent(childId, task.title, task.reward, 'Zadanie wykonane.', 'task', now, task.id), ...nextChild.savings]
      const history = [
        createHistoryEntry(
          childId,
          'task-completed',
          'Zadanie wykonane',
          `${task.title} zakończone za ${formatMoney(task.reward)}.`,
          'Rodzina',
          task.reward,
          now,
        ),
        createHistoryEntry(
          childId,
          'reward',
          'Nagroda do skarbonki',
          `Do skarbonki trafiło ${formatMoney(task.reward)}.`,
          'System',
          task.reward,
          now,
        ),
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

  function reactivateTask(childId: ChildId, taskId: string) {
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
          createHistoryEntry(
            childId,
            'task-reactivated',
            'Zadanie przywrócone',
            `${task.title} wróciło na listę aktywnych zadań.`,
            'Mama',
            undefined,
            now,
          ),
          ...child.history,
        ],
      }
    })

    pushToast('Zadanie wróciło do aktywnych.')
  }

  function copyTask(childId: ChildId, taskId: string) {
    updateChild(childId, (child) => {
      const task = child.tasks.find((entry) => entry.id === taskId)

      if (!task) {
        return child
      }

      const now = nowIso()
      const duplicate = createTask(childId, `${task.title} - kopia`, task.description, task.reward, 'todo', task.frequency, now, {
        recurrenceSeedId: task.recurrenceSeedId ?? task.id,
      })

      return {
        ...touchActivity(child, now),
        tasks: [duplicate, ...child.tasks],
        history: [
          createHistoryEntry(
            childId,
            'task-copied',
            'Skopiowano zadanie',
            `${task.title} skopiowano jako nową pozycję.`,
            'Mama',
            undefined,
            now,
          ),
          ...child.history,
        ],
      }
    })

    pushToast('Utworzono kopię zadania.')
  }

  function deleteTask(childId: ChildId, taskId: string, role: ParentRole) {
    updateChild(childId, (child) => {
      const task = child.tasks.find((entry) => entry.id === taskId)

      if (!task) {
        return child
      }

      const now = nowIso()
      const balanceDelta = task.rewardGranted ? -task.reward : 0

      return {
        ...touchActivity(child, now),
        balance: child.balance + balanceDelta,
        totalEarned: child.totalEarned + balanceDelta,
        tasks: child.tasks.filter((entry) => entry.id !== taskId),
        savings: balanceDelta
          ? [createSavingsEvent(childId, `${task.title} - usunięcie`, balanceDelta, 'Korekta po usunięciu zadania.', 'manual', now, task.id), ...child.savings]
          : child.savings,
        history: [
          createHistoryEntry(
            childId,
            'task-deleted',
            'Zadanie usunięte',
            `${task.title} usunięto z tablicy.`,
            role,
            undefined,
            now,
          ),
          ...(balanceDelta
            ? [
                createHistoryEntry(
                  childId,
                  'reward',
                  'Korekta salda',
                  `Saldo skorygowano o ${formatMoney(Math.abs(balanceDelta))}.`,
                  role,
                  balanceDelta,
                  now,
                ),
              ]
            : []),
          ...child.history,
        ],
      }
    })

    pushToast('Zadanie usunięte.')
  }

  function applyPreset(childId: ChildId, kind: 'plus' | 'minus', preset: ActionPreset, role: ParentRole) {
    updateChild(childId, (child) => {
      const now = nowIso()
      const updated = touchActivity(child, now)
      const nextCount = kind === 'plus' ? child.pluses + 1 : child.minuses + 1

      return {
        ...updated,
        pluses: kind === 'plus' ? nextCount : child.pluses,
        minuses: kind === 'minus' ? nextCount : child.minuses,
        history: [
          createHistoryEntry(
            childId,
            kind,
            kind === 'plus' ? 'Przyznano plus' : 'Przyznano minus',
            preset.detail,
            role,
            undefined,
            now,
          ),
          ...child.history,
        ],
      }
    })

    pushToast(kind === 'plus' ? `Plus: ${preset.label}` : `Minus: ${preset.label}`)
  }

  function resetDemo() {
    setState(createInitialState())
    setView('dashboard')
    setActiveChild('julia')
    setHistoryFilter('all')
    setTaskDraft(null)
    setActionDialog(null)
    setSettingsTick((current) => current + 1)
    pushToast('Dane demo zostały przywrócone.')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-page text-brand-ink">
      <DecorBackground />
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-3 pb-24 pt-3 sm:px-5 lg:px-8 lg:pb-8">
        <AppHeader view={view} onViewChange={setView} />

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
              activeChild={activeChild}
              onSwitchChild={(childId) => setActiveChild(childId)}
              onOpenTask={(mode, taskId) => openTaskDraft(activeChild, mode, taskId)}
              onCompleteTask={(taskId) => completeTask(activeChild, taskId)}
              onReactivateTask={(taskId) => reactivateTask(activeChild, taskId)}
              onCopyTask={(taskId) => copyTask(activeChild, taskId)}
              onDeleteTask={(taskId) =>
                openActionDialog('Usunąć zadanie?', 'Ta operacja usunie zadanie z tablicy i zapisze korektę w historii.', 'Usuń', (role) =>
                  deleteTask(activeChild, taskId, role),
                )
              }
              onPresetAction={(kind, preset) =>
                openActionDialog(
                  kind === 'plus' ? 'Przyznać plus?' : 'Przyznać minus?',
                  preset.detail,
                  kind === 'plus' ? 'Dodaj plus' : 'Dodaj minus',
                  (role) => applyPreset(activeChild, kind, preset, role),
                )
              }
              onOpenHistory={() => setView('history')}
              onOpenSettings={() => setView('settings')}
            />
          ) : null}

          {view === 'history' ? (
            <HistoryView
              entries={visibleHistory}
              filter={historyFilter}
              onFilterChange={setHistoryFilter}
            />
          ) : null}

          {view === 'settings' ? (
            <SettingsView
              settingsTick={settingsTick}
              onReset={() =>
                openActionDialog('Przywrócić dane demo?', 'To wyczyści LocalStorage i przywróci wbudowany zestaw startowy.', 'Przywróć', () => {
                  resetDemo()
                })
              }
            />
          ) : null}
        </main>
      </div>

      <BottomNav view={view} onViewChange={setView} />

      {taskDraft ? (
        <TaskModal
          state={state}
          draft={taskDraft}
          onClose={() => setTaskDraft(null)}
          onSubmit={(values, role) => {
            saveTask(taskDraft.childId, taskDraft.taskId, values, role)
            setTaskDraft(null)
          }}
        />
      ) : null}

      {actionDialog ? (
        <ActionDialogModal
          dialog={actionDialog}
          onClose={() => setActionDialog(null)}
          onConfirm={(role) => {
            actionDialog.action(role)
            setActionDialog(null)
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
}: {
  view: View
  onViewChange: (view: View) => void
}) {
  return (
    <header className="rounded-[30px] border border-brand-border/70 bg-white/82 p-3 shadow-soft backdrop-blur sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-sun via-brand-coral to-brand-sky text-white shadow-pop">
            <SparkIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl tracking-tight text-brand-ink sm:text-2xl">Family Tasks Board</p>
            <p className="text-xs text-brand-muted sm:text-sm">Rodzinne zadania, nagrody i skarbonki.</p>
          </div>
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
      activeTasks: number
      pluses: number
      minuses: number
      balance: number
      earned: number
      completed: number
      achievements: Array<{ id: string; title: string; description: string; thresholdLabel: string; unlocked: boolean }>
      savings: ChildState['savings']
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
      <div className="rounded-[30px] border border-brand-border/70 bg-white/84 p-4 shadow-soft backdrop-blur sm:p-5">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-sunSoft px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#8a6a00]">
          Rodzinny dashboard
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl leading-tight tracking-tight text-brand-ink sm:text-5xl">Szybki podgląd rodziny.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted sm:text-lg">
              Jednym rzutem oka widać saldo, aktywne zadania, plusy i minusy dla Julii i Oliwii.
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
          <DashboardChildCard key={item.id} item={item} onOpenChild={onOpenChild} />
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
    activeTasks: number
    pluses: number
    minuses: number
    balance: number
    earned: number
    completed: number
    achievements: Array<{ id: string; title: string; description: string; thresholdLabel: string; unlocked: boolean }>
    savings: ChildState['savings']
  }
  onOpenChild: (childId: ChildId) => void
}) {
  const portrait = item.id === 'julia' ? juliaPortrait : oliwiaPortrait
  const recentSavings = item.savings.slice(0, 2)

  return (
    <article className="overflow-hidden rounded-[32px] border border-brand-border/70 bg-white/90 shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative min-h-[240px] bg-brand-page">
          <img src={portrait} alt={item.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0)_42%,rgba(255,255,255,0.2))]" />
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]" style={{ background: item.accentSoft, color: item.accentStrong }}>
                {item.name}
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
              onClick={() => onOpenChild(item.id)}
              className="inline-flex min-w-[180px] flex-1 items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white shadow-pop transition hover:translate-y-[-1px]"
            >
              Przejdź do tablicy {item.id === 'julia' ? 'Julii' : 'Oliwii'}
            </button>
            <div className="rounded-full bg-brand-page px-4 py-3 text-sm font-semibold text-brand-muted">
              {item.completed} wykonanych
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniListCard title="Historia wpływów" icon={<CoinsIcon className="h-4 w-4" />}>
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
            <MiniListCard title="Cele" icon={<TrophyIcon className="h-4 w-4" />}>
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
  activeChild,
  onSwitchChild,
  onOpenTask,
  onCompleteTask,
  onReactivateTask,
  onCopyTask,
  onDeleteTask,
  onPresetAction,
  onOpenHistory,
  onOpenSettings,
}: {
  child: ChildState
  meta: ChildMeta
  activeChild: ChildId
  onSwitchChild: (childId: ChildId) => void
  onOpenTask: (mode: 'add' | 'edit', taskId?: string) => void
  onCompleteTask: (taskId: string) => void
  onReactivateTask: (taskId: string) => void
  onCopyTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onPresetAction: (kind: 'plus' | 'minus', preset: ActionPreset) => void
  onOpenHistory: () => void
  onOpenSettings: () => void
}) {
  const portrait = meta.id === 'julia' ? juliaPortrait : oliwiaPortrait
  const activeTasks = sortTasks(child.tasks.filter((task) => task.status !== 'done'))
  const doneTasks = sortTasks(child.tasks.filter((task) => task.status === 'done'))
  const achievements = getChildAchievements(child)
  const balanceFlash = false

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_380px]">
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <article className="relative overflow-hidden rounded-[34px] border border-brand-border/70 bg-white/90 shadow-soft">
            <img src={portrait} alt={meta.name} className="h-[280px] w-full object-cover sm:h-[320px]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.24)_74%,rgba(255,255,255,0.38))]" />
            <div className="absolute left-4 top-4 flex gap-2">
              {childOrder.map((childId) => {
                const childMeta = CHILDREN[childId]
                const selected = childId === activeChild
                return (
                  <button
                    key={childId}
                    type="button"
                    onClick={() => onSwitchChild(childId)}
                    className={cx(
                      'rounded-full px-4 py-2 text-sm font-bold shadow-soft transition',
                      selected ? 'bg-brand-ink text-white' : 'bg-white/90 text-brand-muted',
                    )}
                  >
                    {childMeta.name}
                  </button>
                )
              })}
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-[28px] bg-white/92 p-4 shadow-soft backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Saldo skarbonki</p>
                  <p className={cx('mt-1 font-display text-4xl tracking-tight', balanceFlash ? 'animate-pulse' : '')} style={{ color: meta.accentStrong }}>
                    {formatMoney(child.balance)}
                  </p>
                </div>
                <PiggyIcon className="h-12 w-12 text-brand-ink" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-2xl bg-brand-mintSoft px-3 py-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">Zarabione</p>
                  <p className="font-display text-xl text-brand-ink">{formatMoney(child.totalEarned)}</p>
                </div>
                <div className="rounded-2xl bg-brand-skySoft px-3 py-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">Dni aktywne</p>
                  <p className="font-display text-xl text-brand-ink">{child.activeDays}</p>
                </div>
                <div className="rounded-2xl bg-brand-sunSoft px-3 py-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">Punkty</p>
                  <p className="font-display text-xl text-brand-ink">{child.pluses - child.minuses}</p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[34px] border border-brand-border/70 bg-white/90 p-4 shadow-soft sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]" style={{ background: meta.accentSoft, color: meta.accentStrong }}>
                  {meta.name}
                </p>
                <h2 className="mt-2 font-display text-4xl tracking-tight text-brand-ink">{meta.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
                  Krótsze komunikaty, większe przyciski, bardziej mobilne karty i szybkie akcje jednym kliknięciem.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onOpenHistory} className="rounded-full bg-brand-page px-4 py-3 text-sm font-bold text-brand-ink">
                  Historia
                </button>
                <button type="button" onClick={onOpenSettings} className="rounded-full bg-brand-page px-4 py-3 text-sm font-bold text-brand-ink">
                  Ustawienia
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Saldo" value={formatMoney(child.balance)} tone="mint" />
              <StatTile label="Aktywne" value={String(activeTasks.length)} tone="sky" />
              <StatTile label="Plusy" value={String(child.pluses)} tone="sun" />
              <StatTile label="Minusy" value={String(child.minuses)} tone="coral" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onOpenTask('add')}
                className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5"
              >
                <PlusIcon className="h-4 w-4" />
                Dodaj zadanie
              </button>
              <button
                type="button"
                onClick={() => onPresetAction('plus', PLUS_PRESETS[0])}
                className="inline-flex items-center gap-2 rounded-full bg-brand-mintSoft px-5 py-3 text-sm font-bold text-brand-ink transition hover:-translate-y-0.5"
              >
                <PlusIcon className="h-4 w-4" />
                Plus jednym kliknięciem
              </button>
              <button
                type="button"
                onClick={() => onPresetAction('minus', MINUS_PRESETS[0])}
                className="inline-flex items-center gap-2 rounded-full bg-brand-coralSoft px-5 py-3 text-sm font-bold text-brand-ink transition hover:-translate-y-0.5"
              >
                <MinusIcon className="h-4 w-4" />
                Minus jednym kliknięciem
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PLUS_PRESETS.map((preset) => (
                <ActionPresetButton
                  key={preset.id}
                  kind="plus"
                  preset={preset}
                  onClick={() => onPresetAction('plus', preset)}
                />
              ))}
              {MINUS_PRESETS.map((preset) => (
                <ActionPresetButton
                  key={preset.id}
                  kind="minus"
                  preset={preset}
                  onClick={() => onPresetAction('minus', preset)}
                />
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <section className="rounded-[34px] border border-brand-border/70 bg-white/90 p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Zadania</p>
              <h3 className="mt-1 font-display text-2xl text-brand-ink">Aktywne i wykonane</h3>
            </div>
            <div className="rounded-full bg-brand-page px-4 py-2 text-sm font-semibold text-brand-muted">
              {activeTasks.length} aktywnych, {doneTasks.length} wykonanych
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => onCompleteTask(task.id)}
                onReactivate={() => onReactivateTask(task.id)}
                onCopy={() => onCopyTask(task.id)}
                onEdit={() => onOpenTask('edit', task.id)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
          </div>

          {doneTasks.length ? (
            <div className="mt-5 rounded-[28px] bg-brand-page/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Wykonane</p>
                  <p className="mt-1 font-semibold text-brand-ink">{doneTasks.length} gotowych do przywrócenia lub kopiowania</p>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {doneTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    completed
                    onComplete={() => onCompleteTask(task.id)}
                    onReactivate={() => onReactivateTask(task.id)}
                    onCopy={() => onCopyTask(task.id)}
                    onEdit={() => onOpenTask('edit', task.id)}
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="space-y-4">
        <MiniListCard title="Szybki bilans" icon={<SparkIcon className="h-4 w-4" />} compact={false}>
          <li className="rounded-2xl bg-brand-mintSoft px-3 py-3 text-sm text-brand-ink">Julii i Oliwii rośnie saldo po każdym wykonanym zadaniu.</li>
          <li className="rounded-2xl bg-brand-skySoft px-3 py-3 text-sm text-brand-ink">Cykliczne zadania tworzą kolejną instancję automatycznie.</li>
          <li className="rounded-2xl bg-brand-sunSoft px-3 py-3 text-sm text-brand-ink">Plusy i minusy dodajesz z gotowych presetów.</li>
        </MiniListCard>

        <MiniListCard title="Zadania dziecka" icon={<TaskIcon className="h-4 w-4" />} compact={false}>
          {child.tasks.slice(0, 4).map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-brand-ink">{task.title}</p>
                <p className="text-xs text-brand-muted">{taskFrequencyLabel(task.frequency)} · {formatMoney(task.reward)}</p>
              </div>
              <span className={cx('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]', task.status === 'done' ? 'bg-brand-mintSoft text-brand-ink' : task.status === 'progress' ? 'bg-brand-skySoft text-brand-ink' : 'bg-brand-sunSoft text-brand-ink')}>
                {task.status === 'done' ? 'Wykonane' : task.status === 'progress' ? 'W trakcie' : 'Do wykonania'}
              </span>
            </li>
          ))}
        </MiniListCard>
      </aside>
    </section>
  )
}

function TaskCard({
  task,
  completed,
  onComplete,
  onReactivate,
  onCopy,
  onEdit,
  onDelete,
}: {
  task: Task
  completed?: boolean
  onComplete: () => void
  onReactivate: () => void
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const statusClass =
    task.status === 'done'
      ? 'bg-brand-mintSoft text-brand-ink'
      : task.status === 'progress'
        ? 'bg-brand-skySoft text-brand-ink'
        : 'bg-brand-sunSoft text-brand-ink'

  return (
    <article className={cx('rounded-[28px] border p-4 shadow-[0_8px_20px_rgba(29,76,56,0.06)]', completed ? 'border-brand-border bg-white' : 'border-brand-border/70 bg-white/95')}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cx('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]', statusClass)}>
              {task.status === 'done' ? 'Wykonane' : task.status === 'progress' ? 'W trakcie' : 'Do wykonania'}
            </span>
            <span className="rounded-full bg-brand-page px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">
              {taskFrequencyLabel(task.frequency)}
            </span>
            {task.frequency !== 'once' ? (
              <span className="rounded-full bg-brand-page px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-brand-muted">
                Cykliczne
              </span>
            ) : null}
          </div>

          <div>
            <h4 className={cx('font-display text-2xl tracking-tight', completed ? 'text-brand-muted line-through decoration-brand-coral/60' : 'text-brand-ink')}>
              {task.title}
            </h4>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">{task.description}</p>
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
              Przywróć
            </button>
          ) : (
            <button type="button" onClick={onComplete} className="inline-flex items-center gap-2 rounded-full bg-brand-mintSoft px-4 py-2.5 text-sm font-bold text-brand-ink">
              <CheckIcon className="h-4 w-4" />
              Wykonane
            </button>
          )}
          <button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-full bg-brand-page px-4 py-2.5 text-sm font-bold text-brand-ink">
            <CopyIcon className="h-4 w-4" />
            Kopiuj
          </button>
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-full bg-brand-page px-4 py-2.5 text-sm font-bold text-brand-ink">
            <EditIcon className="h-4 w-4" />
            Edytuj
          </button>
          <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-full bg-brand-coralSoft px-4 py-2.5 text-sm font-bold text-brand-ink">
            <TrashIcon className="h-4 w-4" />
            Usuń
          </button>
        </div>
      </div>
    </article>
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
        <div className="rounded-[30px] border border-brand-border/70 bg-white/90 p-4 shadow-soft sm:p-5">
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
    <article className="rounded-[28px] border border-brand-border/70 bg-white/95 p-4 shadow-[0_8px_20px_rgba(29,76,56,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className={cx('mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tone)}>
            <SparkIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-brand-ink">{entry.title}</h3>
              <span className="rounded-full bg-brand-page px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">
                {entry.childId === 'julia' ? 'Julia' : 'Oliwia'}
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
  settingsTick,
  onReset,
}: {
  settingsTick: number
  onReset: () => void
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="rounded-[30px] border border-brand-border/70 bg-white/90 p-4 shadow-soft sm:p-5">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-coralSoft px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#a64a39]">
            <SettingsIcon className="h-4 w-4" />
            Ustawienia rodzica
          </p>
          <h1 className="font-display text-3xl tracking-tight text-brand-ink sm:text-5xl">Potwierdzanie nadal działa.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted sm:text-lg">
            Działania administracyjne wymagają potwierdzenia hasłem Mama albo Tata. Dane zapisują się lokalnie w przeglądarce.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Mama" value="Hasło" tone="coral" />
          <StatTile label="Tata" value="Hasło" tone="sky" />
          <StatTile label="LocalStorage" value={`V2 · ${settingsTick}`} tone="mint" />
        </div>

        <div className="rounded-[30px] border border-brand-border/70 bg-white/90 p-4 shadow-soft sm:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-page p-3">
              <ParentIcon className="h-6 w-6 text-brand-ink" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-brand-ink">Co jest chronione?</h2>
              <p className="text-sm text-brand-muted">Dodawanie, usuwanie i korekty finansowe.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniListCard title="Akcje" icon={<LockIcon className="h-4 w-4" />}>
              <li>Dodawanie i edycja zadania</li>
              <li>Usuwanie zadania</li>
              <li>Plusy i minusy</li>
            </MiniListCard>
            <MiniListCard title="Dane" icon={<SparkIcon className="h-4 w-4" />}>
              <li>LocalStorage</li>
              <li>Synchronizacja po odświeżeniu</li>
              <li>Migracja z v1</li>
            </MiniListCard>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[30px] border border-brand-border/70 bg-brand-ink p-4 text-white shadow-pop sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">Reset</p>
          <p className="mt-2 font-display text-3xl tracking-tight">Gotowe do odświeżenia danych demo.</p>
          <p className="mt-2 text-sm leading-6 text-white/75">Przywrócenie nie wymaga ręcznego czyszczenia LocalStorage.</p>
          <button
            type="button"
            onClick={onReset}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-coralSoft px-5 py-4 text-sm font-bold text-brand-ink"
          >
            <UndoIcon className="h-4 w-4" />
            Przywróć dane demo
          </button>
        </div>
      </aside>
    </section>
  )
}

function TaskModal({
  state,
  draft,
  onClose,
  onSubmit,
}: {
  state: AppState
  draft: TaskDraft
  onClose: () => void
  onSubmit: (values: TaskFormValues, role: ParentRole) => void
}) {
  const task = draft.taskId ? state.children[draft.childId].tasks.find((entry) => entry.id === draft.taskId) ?? null : null
  const [role, setRole] = useState<ParentRole>('Mama')
  const [values, setValues] = useState<TaskFormValues>(() => ({
    title: task?.title ?? '',
    description: task?.description ?? '',
    reward: task ? String(task.reward) : '5',
    frequency: task?.frequency ?? 'daily',
    status: task?.status ?? 'todo',
  }))

  return (
    <ModalShell
      title={draft.mode === 'add' ? 'Dodaj zadanie' : 'Edytuj zadanie'}
      onClose={onClose}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <section className="space-y-4">
          <Field>
            <FieldLabel>Nazwa</FieldLabel>
            <FieldInput
              value={values.title}
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
              placeholder="Posprzątanie pokoju"
            />
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
              <select
                value={values.frequency}
                onChange={(event) => setValues((current) => ({ ...current, frequency: event.target.value as TaskFrequency }))}
                className="h-12 w-full rounded-2xl border border-brand-border bg-white px-4 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-ink"
              >
                {TASK_FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                  {status === 'todo' ? 'Do wykonania' : status === 'progress' ? 'W trakcie' : 'Wykonane'}
                </button>
              ))}
            </div>
          </Field>
        </section>

        <section className="space-y-4">
          <div className="rounded-[28px] bg-brand-page p-4">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Potwierdzenie</p>
            <p className="mt-2 text-sm leading-6 text-brand-muted">Wybierz hasło rodzica przed zapisem.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(['Mama', 'Tata'] as ParentRole[]).map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setRole(entry)}
                  className={cx(
                    'rounded-2xl px-4 py-3 text-sm font-bold transition',
                    role === entry ? 'bg-brand-ink text-white shadow-pop' : 'bg-white text-brand-ink',
                  )}
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSubmit(values, role)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-4 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5"
          >
            <LockIcon className="h-4 w-4" />
            {draft.mode === 'add' ? 'Dodaj zadanie' : 'Zapisz zmiany'}
          </button>
          <p className="text-xs leading-5 text-brand-muted">
            Zadania cykliczne po wykonaniu automatycznie tworzą kolejną instancję.
          </p>
        </section>
      </div>
    </ModalShell>
  )
}

function ActionDialogModal({
  dialog,
  onClose,
  onConfirm,
}: {
  dialog: ActionDialog
  onClose: () => void
  onConfirm: (role: ParentRole) => void
}) {
  const [role, setRole] = useState<ParentRole>('Mama')

  return (
    <ModalShell title={dialog.title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-brand-muted sm:text-base">{dialog.description}</p>
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
        <button
          type="button"
          onClick={() => onConfirm(role)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-coral px-5 py-4 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5"
        >
          <LockIcon className="h-4 w-4" />
          {dialog.confirmLabel}
        </button>
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

function RewardFlashBubble({ flash }: { flash: RewardFlash }) {
  return (
    <div className="fixed right-4 top-4 z-50 rounded-[28px] border border-brand-mint/30 bg-brand-ink px-5 py-4 text-white shadow-pop animate-bounce">
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

function AppBodyList({ children }: { children: ReactNode }) {
  return <ul className="space-y-2">{children}</ul>
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
      <AppBodyList>{children}</AppBodyList>
    </div>
  )
}

function ActionPresetButton({
  kind,
  preset,
  onClick,
}: {
  kind: 'plus' | 'minus'
  preset: ActionPreset
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-[24px] border px-4 py-3 text-left transition hover:-translate-y-0.5',
        kind === 'plus' ? 'border-brand-mint/30 bg-brand-mintSoft' : 'border-brand-coral/30 bg-brand-coralSoft',
      )}
    >
      <p className="text-sm font-black uppercase tracking-[0.22em] text-brand-ink">{preset.label}</p>
      <p className="mt-1 text-xs leading-5 text-brand-muted">{preset.detail}</p>
    </button>
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
  return <label className="block">{children}</label>
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
