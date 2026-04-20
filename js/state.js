let db = null;

function seedDB(){
  const db = {
    version: 1,
session: {
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