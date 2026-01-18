export const MONTH_ARRAY = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
];

const VIEW_NAMES = [
  "SessionLoginView",
  "GameplayView",
  "ResultView",
];
export const APP_VIEWS = Object.freeze(
  Object.fromEntries(VIEW_NAMES.map((name) => [name, Symbol(name)]))
);

export const INIT_PLAYER_ANSWER = {
  year: "2024",
  month: "3",
  day: "1",
};
