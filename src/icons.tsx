import type { ReactNode, SVGProps } from 'react'

function Svg({
  children,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
      <path d="M9.25 20v-5.5h5.5V20" />
    </Svg>
  )
}

export function TaskIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="4" y="5" width="16" height="14" rx="4" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
    </Svg>
  )
}

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 7v5l3 2" />
      <path d="M5 5v4h4" />
      <path d="M19 12a7 7 0 1 1-2-5" />
    </Svg>
  )
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="m19.4 13-.1-2 .1-2.1-2.1-.8-.7-1.7 1-1.9-1.4-1.4-1.9 1-1.7-.7-.8-2.1-2 .1-2.1-.1-.8 2.1-1.7.7-1.9-1-1.4 1.4 1 1.9-.7 1.7-2.1.8.1 2-.1 2.1 2.1.8.7 1.7-1 1.9 1.4 1.4 1.9-1 1.7.7.8 2.1 2-.1 2.1.1.8-2.1 1.7-.7 1.9 1 1.4-1.4-1-1.9.7-1.7z" />
    </Svg>
  )
}

export function PiggyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M8 8.5c1.1-1 2.5-1.5 4-1.5 3.9 0 7 3 7 6.8 0 2.2-1 4-2.6 5.3l.1 1.9H7.5l.1-1.9C6 18.2 5 16.4 5 14.2c0-1.8.7-3.4 1.9-4.6" />
      <circle cx="14.5" cy="11.8" r=".8" fill="currentColor" stroke="none" />
      <path d="M16.9 9.2h2.1" />
      <path d="M8.5 19.8v1.7" />
      <path d="M16.3 19.8v1.7" />
      <path d="M10.6 6.9c.2-1.2 1.1-2 2.2-2.4" />
    </Svg>
  )
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  )
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
    </Svg>
  )
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="m5.5 12.5 4.1 4L18.5 8" />
    </Svg>
  )
}

export function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="m5 19 4-.9 9.1-9.1-3.1-3.1L5.9 15 5 19Z" />
      <path d="m13.4 6.8 3.1 3.1" />
    </Svg>
  )
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4.5 7h15" />
      <path d="M9 7V5.8h6V7" />
      <path d="M8 7.2 8.8 19h6.4L16 7.2" />
      <path d="M10 10v6" />
      <path d="M14 10v6" />
    </Svg>
  )
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="8" y="8" width="10" height="11" rx="2.5" />
      <path d="M6 15V6.5A1.5 1.5 0 0 1 7.5 5H16" />
    </Svg>
  )
}

export function UndoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M9 8H5V4" />
      <path d="M5 8.2a8 8 0 1 1 1.7 8.4" />
    </Svg>
  )
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="3" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.2v2.2" />
    </Svg>
  )
}

export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="m12 4 1.8 4.2L18 10l-4.2 1.8L12 16l-1.8-4.2L6 10l4.2-1.8L12 4Z" />
      <path d="m18.5 3.5.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </Svg>
  )
}

export function ParentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M6 18c1.3-2.5 4-4 6-4s4.7 1.5 6 4" />
      <circle cx="12" cy="8" r="3.5" />
    </Svg>
  )
}

export function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M8 5h8v2.2A4 4 0 0 1 12 11a4 4 0 0 1-4-3.8V5Z" />
      <path d="M8 7H5a2 2 0 0 0 2 2h1" />
      <path d="M16 7h3a2 2 0 0 1-2 2h-1" />
      <path d="M12 11v4" />
      <path d="M9 19h6" />
      <path d="M10 15h4" />
    </Svg>
  )
}

export function CoinsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <ellipse cx="11" cy="8" rx="5.5" ry="2.6" />
      <path d="M5.5 8v6c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6V8" />
      <path d="M5.5 11c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6" />
      <ellipse cx="14" cy="12.5" rx="4.5" ry="2.2" />
      <path d="M9.5 12.5v4.2c0 1.2 2 2.2 4.5 2.2s4.5-1 4.5-2.2v-4.2" />
    </Svg>
  )
}

export function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </Svg>
  )
}
