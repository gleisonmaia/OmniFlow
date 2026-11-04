export function Spinner({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      className="giro"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  )
}
