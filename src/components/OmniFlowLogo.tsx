interface OmniFlowLogoProps {
  width?: number
  height?: number
}

export function OmniFlowLogo({ width = 174, height = 44 }: OmniFlowLogoProps) {
  return (
    <svg
      role="img"
      aria-label="OmniFlow"
      viewBox="0 0 190 48"
      width={width}
      height={height}
      style={{ display: 'block', flex: '0 0 auto' }}
    >
      <path
        d="M5.0 15.1 A21 21 0 0 1 41.2 12.0"
        fill="none"
        stroke="#F97316"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M45.2 17.7 L45.0 9.3 L37.4 14.6 Z"
        fill="#F97316"
        stroke="#F97316"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M43.0 32.9 A21 21 0 0 1 6.8 36.0"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M2.8 30.3 L3.0 38.7 L10.6 33.4 Z"
        fill="#F59E0B"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="14.5" fill="#12161F" />
      <rect x="16" y="26" width="4.2" height="6" rx="1" fill="#FBBF24" />
      <rect x="21.9" y="22" width="4.2" height="10" rx="1" fill="#F59E0B" />
      <rect x="27.8" y="18" width="4.2" height="14" rx="1" fill="#F97316" />
      <path
        d="M16 21.5 L22.5 16 L26 18.5 L32.5 12.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M29 12 L33.2 12 L33.2 16.2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="58"
        y="33"
        fontFamily="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif"
        fontSize="27"
        fontWeight="800"
        letterSpacing="-0.5"
      >
        <tspan fill="#FFFFFF">Omni</tspan>
        <tspan fill="#F97316">Flow</tspan>
      </text>
    </svg>
  )
}
