const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const TicketIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V9Z" />
    <path d="M14 7v10" strokeDasharray="2 3" />
  </svg>
);

export const MusicIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
    <path d="M9 18V5l12-2v13" />
  </svg>
);

export const BriefcaseIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </svg>
);

export const FestivalIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <path d="M12 3v11" />
    <path d="M12 3l7 4-7 3-7-3 7-4Z" />
    <path d="M5 21c1.5-3 3.5-4 7-4s5.5 1 7 4" />
  </svg>
);

export const SportsIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3c2.5 2.5 2.5 15.5 0 18" />
    <path d="M3 12c2.5-2.5 15.5-2.5 18 0" />
  </svg>
);

export const MapPinIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.3" />
  </svg>
);

export const CalendarIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4M16 3v4" />
  </svg>
);

export const StarIcon = ({ filled, ...props }) => (
  <svg {...base} {...props} fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
    <path d="m12 3 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3Z" />
  </svg>
);

export const HeartIcon = ({ filled, ...props }) => (
  <svg {...base} {...props} fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
    <path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9Z" />
  </svg>
);

export const SearchIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const XIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const SeatIcon = (props) => (
  <svg {...base} {...props} aria-hidden="true">
    <path d="M5 11V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" />
    <path d="M4 11h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Z" />
    <path d="M6 17v2M18 17v2" />
  </svg>
);