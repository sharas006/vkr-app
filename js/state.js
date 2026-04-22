let db = null;

function seedDB(){
  const db = {
    version: 1,
session: {
  opLang: 'lt',
  userId: null,
  currentUser: null,
  adminView: 'dashboard',
  opView: 'home',
  mechView: 'tasks',
  opEquipId: null,
  deviceEquipId: null,
  deviceId: null,
  taskExpanded: {},
  adminCollapsed:{},
  adminNotesEquip:'',
  adminNotesUser:'',
  adminNotesDateFrom:'',
  adminNotesDateTo:'',
  adminNotesOpen:true,
  adminNotesDone:true,
  adminHistoryQuery:'',
  adminHistoryEquip:'',
  adminHistoryBy:'',
  adminHistoryDateFrom:'',
  adminHistoryDateTo:'',
  adminChecksQuery:'',
  adminChecksEquip:'',
  adminChecksUser:'',
  adminChecksDateFrom:'',
  adminChecksDateTo:'',
  adminChecksOpen:true,
  adminChecksDone:true,
  adminAnalyticsUser:'',
  adminAnalyticsDateFrom:'',
  adminAnalyticsDateTo:''
},

    users: [],
    equipment: [],
    grabs: [],
    tasks: [],
    taskFiles: [],
    approvals: [],
    notes: [],
    completed: [],
    lube: {},
    dailyChecks: [],
    devices: [],
    equipmentChecklists: {}
  };

  return db;
}

const OP_I18N = {
  lt: {
    operator: 'operatorius',
    operator_label: 'Operatorius',

    back: '← Atgal',

    all: 'Visi',
    quick_notes: 'Trūkumai',
    checks: 'Patikra',
    open: 'Atviri',

    history: 'Istorija / pastabos',
    history_notes: 'Istorija / pastabos',
    history_all_records: 'Čia rodomi visi šios technikos įrašai.',

    password: 'Slaptažodis',

    no_records: 'Įrašų nerasta.',
    no_device: 'Planšetė nepriskirta technikai.',
    device_not_linked_desc: 'Ši planšetė dar nesusieta su technikos vienetu.',

    check_note: 'Patikros pastaba',
    check_summary: 'Patikra',
    quick_note: 'Trūkumas',
    record: 'Įrašas',

    done: 'Baigta',
    approved: 'Patvirtinta',
    in_progress: 'Vykdoma',
    active: 'Atvira',

    show: 'Rodyti',
    hide: 'Slėpti',

    point: 'Punktas',
    entered_by: 'Įrašė',

    home: 'Pradžia',

    today_check: 'Šiandienos patikra',
    done_short: 'Atlikta',
    not_done_short: 'Neatlikta',
    last_check: 'Paskutinė',
    no_record_yet: 'Dar nėra įrašo',

    check_done: 'Patikra atlikta',
    need_check: 'Reikia patikros',

    open_notes: 'Atviri įrašai',

    today_check_not_done: 'Šiandienos patikra neatlikta',
    start_with_daily_check: 'Pradėkite darbą nuo kasdienės patikros.',

    machine_check: 'Mašinos patikra',
    daily_check: 'Kasdienė patikra',
    all_points_required: 'Visi punktai turi būti pažymėti. Jei pasirinksite NOT OK, komentaras privalomas.',
    marked: 'pažymėta',
    remaining: 'Liko',
    save_check: 'Išsaugoti patikrą',

    report_defect: 'Pranešti trūkumą',
    add_note: 'Įrašyti trūkumą',
    save_defect: 'Išsaugoti trūkumą',
    defect_description: 'Trūkumo aprašymas',
    defect_desc_help: 'Trumpai ir aiškiai aprašykite problemą. Įrašas bus matomas istorijoje kaip atviras trūkumas.',
    defect_placeholder: 'Pvz.: bėga tepalas, neveikia apšvietimas, girdisi pašalinis garsas...',

    enter_defect: 'Įrašyk trūkumą.',
    saving: 'Saugoma...',
    failed_save_defect: 'Nepavyko išsaugoti trūkumo.',
    defect_saved_but_file_failed: 'Trūkumas išsaugotas, bet nuotraukos įkelti nepavyko.',
    defect_saved: 'Trūkumas išsaugotas.',

    comment_required_if_nok: 'Komentaras (privaloma jei NOT OK)',
    not_ok: 'NOT OK',
    unknown_point: 'Nežinomas punktas',

    today_check_already_saved: 'Šiandienos patikra šiai technikai jau išsaugota.',
    cannot_save_check_validation: 'Negalima išsaugoti: visi punktai turi būti pažymėti, o NOT OK turi turėti komentarą.',
    failed_save_daily_check: 'Nepavyko išsaugoti dienos patikros.',
    check_saved: 'Patikra išsaugota.'
  },

  ru: {
    operator: 'оператор',
    operator_label: 'Оператор',

    back: '← Назад',

    all: 'Все',
    quick_notes: 'Недостатки',
    checks: 'Проверка',
    open: 'Открытые',

    history: 'История / записи',
    history_notes: 'История / записи',
    history_all_records: 'Здесь показаны все записи по этой технике.',

    password: 'Пароль',

    no_records: 'Записей не найдено.',
    no_device: 'Планшет не назначен технике.',
    device_not_linked_desc: 'Этот планшет ещё не привязан к единице техники.',

    check_note: 'Замечание проверки',
    check_summary: 'Проверка',
    quick_note: 'Недостаток',
    record: 'Запись',

    done: 'Завершено',
    approved: 'Подтверждено',
    in_progress: 'Выполняется',
    active: 'Открыто',

    show: 'Показать',
    hide: 'Скрыть',

    point: 'Пункт',
    entered_by: 'Записал',

    home: 'Главная',

    today_check: 'Сегодняшняя проверка',
    done_short: 'Выполнена',
    not_done_short: 'Не выполнена',
    last_check: 'Последняя',
    no_record_yet: 'Записей пока нет',

    check_done: 'Проверка выполнена',
    need_check: 'Требуется проверка',

    open_notes: 'Открытые записи',

    today_check_not_done: 'Сегодняшняя проверка не выполнена',
    start_with_daily_check: 'Начните работу с ежедневной проверки.',

    machine_check: 'ПРОВЕРКА МАШИНЫ',
    daily_check: 'Ежедневная проверка',
    all_points_required: 'Все пункты должны быть отмечены. Если выбрано NOT OK, комментарий обязателен.',
    marked: 'отмечено',
    remaining: 'Осталось',
    save_check: 'Сохранить проверку',

    report_defect: 'СООБЩИТЬ О НЕДОСТАТКЕ',
    add_note: 'Добавить недостаток',
    save_defect: 'Сохранить недостаток',
    defect_description: 'Описание недостатка',
    defect_desc_help: 'Кратко и понятно опишите проблему. Запись будет видна в истории как открытый недостаток.',
    defect_placeholder: 'Напр.: течет масло, не работает освещение, слышен посторонний звук...',

    enter_defect: 'Введите недостаток.',
    saving: 'Сохранение...',
    failed_save_defect: 'Не удалось сохранить недостаток.',
    defect_saved_but_file_failed: 'Недостаток сохранён, но фото загрузить не удалось.',
    defect_saved: 'Недостаток сохранён.',

    comment_required_if_nok: 'Комментарий (обязательно если НЕ OK)',
    not_ok: 'НЕ OK',
    unknown_point: 'Неизвестный пункт',

    today_check_already_saved: 'Сегодняшняя проверка для этой техники уже сохранена.',
    cannot_save_check_validation: 'Сохранить нельзя: все пункты должны быть отмечены, а для НЕ OK обязателен комментарий.',
    failed_save_daily_check: 'Не удалось сохранить ежедневную проверку.',
    check_saved: 'Проверка сохранена.'
  }
};

function getOpLang(){
  const lang = safeTrim(db.session?.opLang || 'lt').toLowerCase();
  return lang === 'ru' ? 'ru' : 'lt';
}

function setOpLang(lang){
  if(!db.session) db.session = {};
  db.session.opLang = (lang === 'ru') ? 'ru' : 'lt';
  saveDB_local(db);
}

function t(key){
  const lang = getOpLang();
  return OP_I18N[lang]?.[key] || OP_I18N.lt?.[key] || key;
}

function checklistItemLabel(item){
  const lang = getOpLang();
  if(typeof item === 'string') return item;
  if(!item) return '';
  return lang === 'ru'
    ? (item.textRu || item.textLt || item.text || '')
    : (item.textLt || item.textRu || item.text || '');
}

function defaultChecklistTemplate(){
  return [
    { textLt: 'Variklio tepalas', textRu: 'Моторное масло' },
    { textLt: 'Hidraulikos tepalas', textRu: 'Гидравлическое масло' },
    { textLt: 'Greičių dėžės tepalas', textRu: 'Масло коробки передач' },
    { textLt: 'Aušinimo skystis', textRu: 'Охлаждающая жидкость' },
    { textLt: 'Langų apiplovimo skystis', textRu: 'Жидкость омывателя стекла' },
    { textLt: 'Tepimo bakelio papildymas', textRu: 'Пополнение бака смазки' },
    { textLt: 'Vizualinė apžiūra: mašinos', textRu: 'Визуальный осмотр машины' },
    { textLt: 'Vizualinė apžiūra: hidraulinių žarnų', textRu: 'Визуальный осмотр гидравлических шлангов' },
    { textLt: 'Vizualinė apžiūra: ratų', textRu: 'Визуальный осмотр колёс' },
    { textLt: 'Rankinis tepimo taškų pratepimas', textRu: 'Ручная смазка точек смазки' },
    { textLt: 'Pridėti nuo savęs', textRu: 'Добавить от себя' }
  ];
}

function currentUser(){
  if(!db) return null;

  if(db.session && db.session.currentUser && db.session.currentUser.id === db.session.userId){
    return db.session.currentUser;
  }

  return (db.users || []).find(u => u.id === db.session.userId) || null;
}

function saveDB_local(dbObj){
  try{
    localStorage.setItem(APP_CONFIG.DB_KEY, JSON.stringify(dbObj));
  }catch(err){
    console.error('Nepavyko išsaugoti local state:', err);
  }
}

function loadDB_local(){
  try{
    const raw = localStorage.getItem(APP_CONFIG.DB_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(err){
    console.error('Nepavyko užkrauti local state:', err);
    return null;
  }
}