// Each item has a soft grey outline at rest and a hard black, aliased
// version (shape-rendering: crispEdges) once it is hovered or opened.

const svg = (cls, w, h, body) =>
  `<svg class="icon ${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${body}</svg>`;

const FOLDER = '<path d="M3.5 13V7.5a3 3 0 0 1 3-3h8a3 3 0 0 1 2.3 1.1L19 8"/><rect x="3.5" y="8.5" width="27" height="20" rx="3"/>';
const FOLDER_HARD = '<path d="M4 13V5h12l3 4"/><rect x="4" y="9" width="26" height="19"/>';
const FOLDER_OPEN = '<path d="M3 25V4h10l3 3h4"/><path d="M3 25 9 8h31l-6 17z"/>';

const PAGE = '<path d="M5.5 2.5h10l6 6v19a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-23a2 2 0 0 1 2-2z"/><path d="M15.5 2.5v6h6"/>';
const PAGE_HARD = '<path d="M4 3h13l7 7v24H4z"/><path d="M17 3v7h7"/>';
const LINES = '<path d="M8 13.5h10M8 17h11M8 20.5h11M8 24h7"/>';
const LINES_HARD = '<path d="M8 12h6M8 17h12M8 22h12M8 27h12M8 31h9" stroke-width="2.6"/>';

export const icons = {
  folder: svg('icon--rest', 34, 32, FOLDER) + svg('icon--hover icon--hard', 34, 32, FOLDER_HARD) + svg('icon--open icon--hard', 43, 28, FOLDER_OPEN),
  text: svg('icon--rest', 26, 32, PAGE + LINES) + svg('icon--hover icon--hard', 28, 37, PAGE_HARD + LINES_HARD),
  blank: svg('icon--rest', 26, 32, PAGE) + svg('icon--hover icon--hard', 28, 37, PAGE_HARD),
};
