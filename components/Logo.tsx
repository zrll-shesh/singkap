export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2 30 16 16 30 2 16Z" fill="#3b4c8c" />
      <path d="M16 7 25 16 16 25 7 16Z" fill="#1f2a55" />
      <path d="M16 2 30 16 23 16 16 9Z" fill="#e8a93a" />
      <circle cx="16" cy="16" r="2.4" fill="#f6cf7d" />
    </svg>
  );
}
