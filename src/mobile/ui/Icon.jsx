// STP Mobile — shared icon set.
// Union of every icon referenced across the five STP Mobil prototypes.
// Stroke icons on a 24×24 viewBox, currentColor by default.
import React from "react";

const PATHS = {
  pin: <path d="M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z" />,
  check: <polyline points="4 12 10 18 20 6" />,
  check2: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 11 15 16 9" />
    </>
  ),
  edit: <path d="M14 4l6 6-12 12H2v-6z" />,
  arrow: (
    <>
      <polyline points="13 5 19 12 13 19" />
      <line x1="19" y1="12" x2="3" y2="12" />
    </>
  ),
  arrowLeft: (
    <>
      <polyline points="11 5 5 12 11 19" />
      <line x1="5" y1="12" x2="21" y2="12" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 004 0" />
    </>
  ),
  msg: <path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-3.7-.84L3 21l1.84-5.8A8.5 8.5 0 1121 11.5z" />,
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  minus: <line x1="5" y1="12" x2="19" y2="12" />,
  x: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  alert: (
    <>
      <path d="M12 9v4" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
      <path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <circle cx="12" cy="8.5" r="0.5" fill="currentColor" />
    </>
  ),
  cal: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  truck: (
    <>
      <rect x="1" y="6" width="14" height="11" rx="1" />
      <polygon points="15 9 19 9 22 13 22 17 15 17 15 9" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <line x1="9" y1="22" x2="9" y2="18" />
      <line x1="15" y1="22" x2="15" y2="18" />
      <line x1="9" y1="6" x2="9.01" y2="6" />
      <line x1="15" y1="6" x2="15.01" y2="6" />
      <line x1="9" y1="10" x2="9.01" y2="10" />
      <line x1="15" y1="10" x2="15.01" y2="10" />
      <line x1="9" y1="14" x2="9.01" y2="14" />
      <line x1="15" y1="14" x2="15.01" y2="14" />
    </>
  ),
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-7-11-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
      <path d="M9.9 9.9a3 3 0 004.2 4.2" />
    </>
  ),
  chevRight: <polyline points="9 6 15 12 9 18" />,
  chevLeft: <polyline points="15 18 9 12 15 6" />,
  chevDown: <polyline points="6 9 12 15 18 9" />,
  phone: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />,
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22 6 12 13 2 6" />
    </>
  ),
  send: (
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 7 12 12 15 14" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  sliders: (
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </>
  ),
  bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />,
  money: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </>
  ),
  home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z" />,
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
  refresh: (
    <>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  doc: (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </>
  ),
  spark: <path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7z" />,
  bolt: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  forward: (
    <>
      <polyline points="15 17 20 12 15 7" />
      <path d="M4 18v-2a4 4 0 014-4h12" />
    </>
  ),
  link: (
    <>
      <path d="M9 15l6-6" />
      <path d="M10 5l-3 3a4 4 0 105.66 5.66l3-3" />
      <path d="M14 19l3-3a4 4 0 10-5.66-5.66l-3 3" />
    </>
  ),
  menu: (
    <>
      <line x1="3.5" y1="7" x2="20.5" y2="7" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <line x1="3.5" y1="17" x2="14" y2="17" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" />
      <polyline points="9 12 11 14 15 10" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </>
  ),
  cap: (
    <>
      <path d="M2 8l10-4 10 4-10 4z" />
      <path d="M6 10v5c0 1 3 3 6 3s6-2 6-3v-5" />
    </>
  ),
};

export default function Icon({ name, size = 16, color = "currentColor", stroke = 1.8, style }) {
  const path = PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {path || null}
    </svg>
  );
}
