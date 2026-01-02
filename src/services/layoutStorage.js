const STORAGE_KEY = "orcasimples_layout";

export function saveLayout(layout) {
  localStorage.setItem(STORAGE_KEY, layout);
}

export function getLayout() {
  return localStorage.getItem(STORAGE_KEY) || "classic";
}
