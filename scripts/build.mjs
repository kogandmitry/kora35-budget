// Генерирует статический index.html из data/budget.json и таблицы current ниже.
// Логика и разметка повторяют src/page.tsx один в один.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const budget = JSON.parse(readFileSync(join(root, "data/budget.json"), "utf8"));

const current = {
  animators: ["3 детских аниматора", "2 человека", 22500],
  kids_contest_prizes: ["5 призов детям за творческий конкурс", "5 призов", 5000],
  kids_gifts_other: ["Сувенирная игрушка для детей — йо-йо с логотипами", "50 шт.", 14500],
  "children-excursion-direct-actuals": ["Детская экскурсия 24 июня — прямые расходы", "1", 26950.59],
  candidate_teen_volunteers: ["Волонтёрство старших детей на мероприятии", "", 0],
  sports: ["Спорт инвентарь наличка (йога коврики, мячи, ракетки, настолки)", "1", 12000],
  yoga_trainer: ["Йога-тренер: вознаграждение и трансфер", "1", 6200],
  workshops: ["Мастер-классы (растения, кулинария, ...)", "2", 15000],
  hosts: ["Основной ведущий торжественной части", "1", 15000],
  ops: ["Оформление, фотографии, вывески и другое на самой базе", "1", 5000],
  venue: ["Аренда базы «Литейщик»", "1", 112000],
  medic: ["Медик, безопасность и санитария", "1", 15000],
  raincoats: ["Дождевики на случай осадков", "100 шт.", 11700],
  buses: ["Три автобуса по 20 мест, туда и обратно", "3 автобуса", 10000],
  welcome: ["Банан и коржик утром на 120 человек, вода, помпы, чай", "120 человек", 15000],
  adult_lunch_supplier_1: ["Поставщик питания 1 — обед", "1", 123750],
  unestimated_3: ["Дополнительный трансфер: такси и бензин личного транспорта", "1", 5000],
  korachki: ["КОРАчки для действующих и бывших сотрудников", "230 шт. × 412 ₽", 103000],
  sound: ["LED-экран и музыкальное оборудование", "1", 105000],
  photozone_logistics: ["Логистика фотозоны газелью", "4 000 ₽ туда + 4 000 ₽ обратно", 8000],
  photozone_finishing_option: ["Дооформление фотозоны — по отдельному решению", "решение отдельно", 0],
  photo_video_event: ["Фото- и видеофиксация на выезде: 2 фотографа-видеографа", "2 человека", 20000],
  interviews: ["Видеонарезки и интервью, около 5 выпусков", "около 5 выпусков", 150000],
  website: ["QR-страница, сайт-афиша 35.kopa.ru и рабочие мониторы проекта", "15 000 + 5 000 ₽", 20000],
  pm: ["Руководство проектом и остальные задачи", "1", 55000],
  coordinators: ["Координаторы блоков", "3 человека", 45000],
  kpi: ["Премиальный фонд организаторов по результатам", "1", 15000],
  post: ["Постсобытийная работа", "1", 10000],
  "management-ai-infrastructure": ["Инфраструктура управления: Claude и ChatGPT", "1", 15000],
  reserve: ["Защищённый резерв", "1", 30000],
  unestimated_8: ["Сверхурочная работа команды и питание персонала", "1", 2000],
};

const money = (value) => value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
const amountOf = (line) => Number(line.amounts?.["Основной бюджет"] || line.candidateAmount || 0);
const statusOf = (line) =>
  line.activationStatus === "inactive"
    ? "Неактивно"
    : line.activationStatus === "potential" || line.priceStatus === "дополнительный бюджет"
      ? "Дополнительно"
      : line.type === "неоценено"
        ? "Не оценено"
        : "Основной";
const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const additionalIds = ["raincoats", "unestimated_3", "photozone_finishing_option", "reserve", "unestimated_8"];
const lines = budget.lines
  .filter((line) => line.id in current)
  .map((line) => {
    const value = current[line.id];
    const isAdditional = additionalIds.includes(line.id);
    return {
      ...line,
      item: value[0],
      quantities: { "Основной бюджет": value[1] },
      amounts: { "Основной бюджет": value[2] },
      candidateAmount: isAdditional ? value[2] : undefined,
      activationStatus: isAdditional ? "potential" : undefined,
      priceStatus: isAdditional ? "дополнительный бюджет" : "основной бюджет",
    };
  });

// Итоги считаются из строк и сверяются с ожидаемыми значениями,
// чтобы сводка не разошлась с таблицей после правок.
const expected = { main: 943900.59, additional: 48700 };
const sumOf = (ids) => Math.round(lines.filter((line) => ids(line.id)).reduce((sum, line) => sum + amountOf(line), 0) * 100) / 100;
const main = sumOf((id) => !additionalIds.includes(id));
const additional = sumOf((id) => additionalIds.includes(id));
if (main !== expected.main) throw new Error(`Основной бюджет: посчитано ${main}, ожидалось ${expected.main}`);
if (additional !== expected.additional) throw new Error(`Дополнительно: посчитано ${additional}, ожидалось ${expected.additional}`);
const maximum = main + additional;
const overLimit = Math.round((maximum - budget.meta.ceiling) * 100) / 100;
const blockNames = {
  "Дети": "Детский и семейный трек",
  "Предъюбилейные события": "Детский и семейный трек",
  "Дополнительно (пересмотреть)": "Активности и мастер-классы",
  "Программа": "Активности и мастер-классы",
  "Площадка и операционка": "Выезд 15 августа · Литейщик",
  "Транспорт": "Выезд 15 августа · Литейщик",
  "Питание": "Выезд 15 августа · Литейщик",
  "Подарки": "Подарки",
  "Медиа и цифровой контур": "Коммуникации и медиа",
  "Управление, премии и инфраструктура": "Управление и инфраструктура",
  "Резерв": "Управление и инфраструктура",
};
const groupOrder = [
  "Детский и семейный трек",
  "Активности и мастер-классы",
  "Выезд 15 августа · Литейщик",
  "Подарки",
  "Коммуникации и медиа",
  "Управление и инфраструктура",
];
const groups = groupOrder
  .map((title) => ({ title, lines: lines.filter((line) => blockNames[line.block] === title) }))
  .filter((block) => block.lines.length);

const missing = Object.keys(current).filter((id) => !lines.some((line) => line.id === id));
const ungrouped = lines.filter((line) => !groups.some((block) => block.lines.includes(line)));
if (missing.length) throw new Error("Нет строк в budget.json: " + missing.join(", "));
if (ungrouped.length) throw new Error("Строки не попали ни в один блок: " + ungrouped.map((l) => l.id).join(", "));

const row = (line) => {
  const quantity = line.quantities["Основной бюджет"];
  const note = quantity && quantity !== "—" ? `<small>${esc(quantity)}</small>` : "";
  const status = statusOf(line);
  return `<div class="row"><div><p>${esc(line.item)}</p>${note}</div><span class="tag ${esc(status.toLowerCase().replace(" ", "-"))}">${esc(status)}</span><strong>${amountOf(line) ? money(amountOf(line)) : "—"}</strong></div>`;
};

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<title>Бюджет КОРА 35</title>
<link rel="icon" href="./favicon.svg">
<link rel="stylesheet" href="./styles.css">
</head>
<body>
<main>
<header><p class="eyebrow">КОРА 35 · бюджет заказчиков</p><h1>Бюджет юбилейного проекта</h1><p class="date">Актуальный черновик пульта · 12 августа 2026</p></header>
<section class="summary" aria-label="Итоги бюджета">
<article><span>Основной бюджет</span><strong>${money(main)}</strong><small>${money(budget.meta.ceiling - main)} до лимита</small></article>
<article><span>Дополнительно</span><strong>${money(additional)}</strong><small>требует отдельного решения</small></article>
<article${overLimit > 0 ? ' class="over"' : ""}><span>Максимум</span><strong>${money(maximum)}</strong><small>${overLimit > 0 ? `${money(overLimit)} сверх лимита` : `${money(-overLimit)} запас до лимита`}</small></article>
<article><span>Лимит</span><strong>${money(budget.meta.ceiling)}</strong><small>300 участников · до ${money(maximum / 300)} на человека</small></article>
</section>
<nav><span>Основной</span><span>Дополнительно</span><span>Не оценено</span><span>Неактивно</span></nav>
<section class="budget">${groups
  .map(
    (block) =>
      `<article class="block"><div class="block-title"><h2>${esc(block.title)}</h2><strong>${money(block.lines.reduce((sum, line) => sum + amountOf(line), 0))}</strong></div><div class="rows">${block.lines.map(row).join("")}</div></article>`,
  )
  .join("")}</section>
<footer>Рабочая оценка для согласования. Неоценённые и неактивные позиции не входят в максимум.</footer>
</main>
</body>
</html>
`;

writeFileSync(join(root, "index.html"), html);
console.log(`index.html: ${lines.length} строк, ${groups.length} блоков, ${html.length} байт`);
