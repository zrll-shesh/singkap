// Tanda SINGKAP: motif kawung, empat kelopak buah aren yang mengelilingi satu inti.
// Satu kelopak berwarna kunyit dan sedikit terangkat: warisan yang tersingkap.
export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <g transform="translate(20 20)">
        <ellipse cx="-8.2" cy="-8.2" rx="5.2" ry="9.6" transform="rotate(-45 -8.2 -8.2)" fill="#3b4c8c" />
        <ellipse cx="8.2" cy="8.2" rx="5.2" ry="9.6" transform="rotate(-45 8.2 8.2)" fill="#3b4c8c" />
        <ellipse cx="-8.2" cy="8.2" rx="5.2" ry="9.6" transform="rotate(45 -8.2 8.2)" fill="#6f7fc0" />
        <ellipse cx="9.6" cy="-9.6" rx="5.2" ry="9.6" transform="rotate(45 9.6 -9.6)" fill="#e8a93a" />
        <rect x="-2.6" y="-2.6" width="5.2" height="5.2" transform="rotate(45)" fill="#f6cf7d" />
      </g>
    </svg>
  );
}
