// MyToDoList - 主應用程式邏輯 (Firebase v10 Modular SDK)
import { 
  getFirebaseConfig, 
  saveFirebaseConfig, 
  resetFirebaseConfig, 
  isFirebaseConfigured, 
  DEFAULT_FIREBASE_CONFIG 
} from "./firebase-config.js";

// 動態載入 Firebase SDK 函式庫
let initializeApp, getApps, getApp;
let getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged;
let getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp;

// 應用程式狀態
let app = null;
let auth = null;
let db = null;
let currentUser = null;
let todos = [];
let unsubscribeTodos = null;
let currentFilter = 'all';
let currentPriorityFilter = 'all';
let searchQuery = '';

// 取得 URL 中的房間代碼，若無則預設為 "team-default"
const urlParams = new URLSearchParams(window.location.search);
let currentRoomId = urlParams.get('room') || 'team-default';

// DOM 元素引用
const syncDot = document.getElementById('sync-dot');
const syncStatus = document.getElementById('sync-status');
const configAlertBanner = document.getElementById('config-alert-banner');
const guestWelcomeCard = document.getElementById('guest-welcome-card');
const btnLogin = document.getElementById('btn-login');
const btnHeroLogin = document.getElementById('btn-hero-login');
const userProfileMenu = document.getElementById('user-profile-menu');
const btnUserAvatar = document.getElementById('btn-user-avatar');
const profileDropdown = document.getElementById('profile-dropdown');
const userAvatarImg = document.getElementById('user-avatar-img');
const userDisplayName = document.getElementById('user-display-name');
const dropdownUserName = document.getElementById('dropdown-user-name');
const dropdownUserEmail = document.getElementById('dropdown-user-email');
const btnLogout = document.getElementById('btn-logout');

const currentRoomLabel = document.getElementById('current-room-label');
const badgeRoomName = document.getElementById('badge-room-name');
const btnOpenRoomModal = document.getElementById('btn-open-room-modal');
const btnCopyRoomLink = document.getElementById('btn-copy-room-link');

const statCompleted = document.getElementById('stat-completed');
const statTotal = document.getElementById('stat-total');
const statPercent = document.getElementById('stat-percent');
const statProgressBar = document.getElementById('stat-progress-bar');

const formAddTodo = document.getElementById('form-add-todo');
const inputTodoText = document.getElementById('input-todo-text');
const selectPriority = document.getElementById('select-priority');
const inputTodoTag = document.getElementById('input-todo-tag');
const inputTodoDue = document.getElementById('input-todo-due');

const todosLoading = document.getElementById('todos-loading');
const todosItems = document.getElementById('todos-items');
const todosEmpty = document.getElementById('todos-empty');
const activityLogList = document.getElementById('activity-log-list');

const countAll = document.getElementById('count-all');
const countActive = document.getElementById('count-active');
const countCompleted = document.getElementById('count-completed');
const inputSearch = document.getElementById('input-search');
const selectFilterPriority = document.getElementById('select-filter-priority');
const filterButtons = document.querySelectorAll('.btn-filter');

// Modals
const modalConfig = document.getElementById('modal-config');
const btnOpenConfigModal = document.getElementById('btn-open-config-modal');
const btnCloseConfig = document.getElementById('btn-close-config');
const btnCancelConfig = document.getElementById('btn-cancel-config');
const btnBannerConfig = document.getElementById('btn-banner-config');
const btnFooterConfig = document.getElementById('btn-footer-config');
const btnSaveConfig = document.getElementById('btn-save-config');
const btnResetConfig = document.getElementById('btn-reset-config');
const cfgApiKey = document.getElementById('cfg-api-key');
const cfgProjectId = document.getElementById('cfg-project-id');
const cfgAuthDomain = document.getElementById('cfg-auth-domain');
const cfgAppId = document.getElementById('cfg-app-id');

const modalRoom = document.getElementById('modal-room');
const btnCloseRoom = document.getElementById('btn-close-room');
const btnCancelRoom = document.getElementById('btn-cancel-room');
const btnSwitchRoom = document.getElementById('btn-switch-room');
const inputRoomId = document.getElementById('input-room-id');

const modalEditTodo = document.getElementById('modal-edit-todo');
const btnCloseEditModal = document.getElementById('btn-close-edit-modal');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const formEditTodo = document.getElementById('form-edit-todo');
const editTodoId = document.getElementById('edit-todo-id');
const editTodoText = document.getElementById('edit-todo-text');
const editTodoPriority = document.getElementById('edit-todo-priority');
const editTodoTag = document.getElementById('edit-todo-tag');
const editTodoDue = document.getElementById('edit-todo-due');

const toastContainer = document.getElementById('toast-container');

// 初始化圖示
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 顯示浮動提示 Toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgColors = {
    info: 'bg-slate-800 text-slate-100 border-slate-700',
    success: 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60',
    error: 'bg-rose-950/90 text-rose-200 border-rose-700/60',
    warning: 'bg-amber-950/90 text-amber-200 border-amber-700/60'
  };
  
  toast.className = `toast-enter flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-medium shadow-xl pointer-events-auto transition ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 設置同步狀態指示燈
function setSyncStatus(state, text) {
  if (!syncDot || !syncStatus) return;
  syncStatus.textContent = text;
  syncDot.className = 'w-2 h-2 rounded-full inline-block ';
  if (state === 'connected') {
    syncDot.classList.add('bg-emerald-400', 'pulse-glow');
  } else if (state === 'syncing') {
    syncDot.classList.add('bg-amber-400');
  } else if (state === 'error') {
    syncDot.classList.add('bg-rose-400');
  } else {
    syncDot.classList.add('bg-slate-500');
  }
}

// 新增即時協作動態日誌
function logActivity(text, time = new Date()) {
  if (!activityLogList) return;
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const row = document.createElement('div');
  row.className = 'flex items-center justify-between py-1 border-b border-slate-800/40 text-slate-300';
  row.innerHTML = `
    <span class="truncate flex-1 pr-2">${text}</span>
    <span class="text-[10px] text-slate-500 whitespace-nowrap">${timeStr}</span>
  `;
  if (activityLogList.children.length === 1 && activityLogList.children[0].classList.contains('italic')) {
    activityLogList.innerHTML = '';
  }
  activityLogList.prepend(row);
  while (activityLogList.children.length > 20) {
    activityLogList.removeChild(activityLogList.lastChild);
  }
}

// 載入 Firebase 函式庫
async function loadFirebaseModules() {
  const appModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const authModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  const firestoreModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

  initializeApp = appModule.initializeApp;
  getApps = appModule.getApps;
  getApp = appModule.getApp;

  getAuth = authModule.getAuth;
  GoogleAuthProvider = authModule.GoogleAuthProvider;
  signInWithPopup = authModule.signInWithPopup;
  signOut = authModule.signOut;
  onAuthStateChanged = authModule.onAuthStateChanged;

  getFirestore = firestoreModule.getFirestore;
  collection = firestoreModule.collection;
  addDoc = firestoreModule.addDoc;
  updateDoc = firestoreModule.updateDoc;
  deleteDoc = firestoreModule.deleteDoc;
  doc = firestoreModule.doc;
  query = firestoreModule.query;
  where = firestoreModule.where;
  orderBy = firestoreModule.orderBy;
  onSnapshot = firestoreModule.onSnapshot;
  serverTimestamp = firestoreModule.serverTimestamp;
}

// 初始化 Firebase
async function initFirebase() {
  const config = getFirebaseConfig();
  
  if (!isFirebaseConfigured()) {
    configAlertBanner.classList.remove('hidden');
    setSyncStatus('idle', '尚未設定 API Key');
    todosLoading.classList.add('hidden');
    todosEmpty.classList.remove('hidden');
    return false;
  }

  configAlertBanner.classList.add('hidden');
  setSyncStatus('syncing', '連線 Firebase 中...');

  try {
    await loadFirebaseModules();

    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);

    // 監聽使用者登入狀態
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      updateAuthUI(user);
    });

    // 啟動 Firestore 即時任務監聽
    startTodosListener();
    return true;
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
    setSyncStatus('error', '連線失敗');
    showToast(`Firebase 連線失敗: ${error.message}`, 'error');
    return false;
  }
}

// 更新認證相關 UI
function updateAuthUI(user) {
  if (user) {
    btnLogin.classList.add('hidden');
    guestWelcomeCard.classList.add('hidden');
    userProfileMenu.classList.remove('hidden');

    const name = user.displayName || user.email.split('@')[0];
    const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
    
    userAvatarImg.src = avatar;
    userDisplayName.textContent = name;
    dropdownUserName.textContent = name;
    dropdownUserEmail.textContent = user.email || '';

    showToast(`歡迎回來，${name}！`, 'success');
  } else {
    btnLogin.classList.remove('hidden');
    guestWelcomeCard.classList.remove('hidden');
    userProfileMenu.classList.add('hidden');
    profileDropdown.classList.add('hidden');
  }
  refreshIcons();
}

// Google 登入
async function handleGoogleLogin() {
  if (!auth) {
    openConfigModal();
    showToast('請先填入 Firebase API Key 才能進行 Google 登入', 'warning');
    return;
  }

  const provider = new GoogleAuthProvider();
  try {
    setSyncStatus('syncing', 'Google 登入驗證中...');
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Google 登入失敗:", error);
    setSyncStatus('connected', '即時同步中');
    if (error.code === 'auth/popup-closed-by-user') {
      showToast('已取消登入視窗', 'info');
    } else if (error.code === 'auth/unauthorized-domain') {
      showToast('此網域未在 Firebase 控制台的 Authorized Domains 清單中', 'error');
    } else {
      showToast(`登入失敗: ${error.message}`, 'error');
    }
  }
}

// Google 登出
async function handleLogout() {
  if (!auth) return;
  try {
    await signOut(auth);
    profileDropdown.classList.add('hidden');
    showToast('已成功登出', 'info');
  } catch (error) {
    showToast(`登出失敗: ${error.message}`, 'error');
  }
}

// 啟動 Firestore 即時監聽器 (onSnapshot)
function startTodosListener() {
  if (!db) return;

  if (unsubscribeTodos) {
    unsubscribeTodos();
  }

  todosLoading.classList.remove('hidden');
  todosEmpty.classList.add('hidden');

  const todosRef = collection(db, "todos");
  // 查詢當前房間的待辦事項
  const q = query(
    todosRef, 
    where("roomId", "==", currentRoomId)
  );

  setSyncStatus('syncing', '載入即時待辦事項...');

  unsubscribeTodos = onSnapshot(q, (snapshot) => {
    todosLoading.classList.add('hidden');
    setSyncStatus('connected', '即時同步中');

    const loadedTodos = [];
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      const userName = data.createdBy?.name || '團隊成員';
      if (change.type === "added" && !snapshot.metadata.fromCache) {
        logActivity(`✨ ${userName} 新增了：「${data.text}」`);
      }
      if (change.type === "modified") {
        if (data.completed) {
          logActivity(`✅ ${data.completedBy?.name || userName} 完成了：「${data.text}」`);
        } else {
          logActivity(`🔄 更新了任務：「${data.text}」`);
        }
      }
      if (change.type === "removed") {
        logActivity(`🗑️ 移除了任務：「${data.text}」`);
      }
    });

    snapshot.forEach((docSnap) => {
      loadedTodos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    // 依建立時間排序 (前端補齊排序以防索引缺失)
    loadedTodos.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.localTimestamp || 0);
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.localTimestamp || 0);
      return tB - tA;
    });

    todos = loadedTodos;
    renderTodos();
  }, (error) => {
    console.error("Firestore 監聽錯誤:", error);
    todosLoading.classList.add('hidden');
    setSyncStatus('error', '同步受阻');
    showToast(`讀取資料錯誤: ${error.message}`, 'error');
  });
}

// 渲染待辦事項列表
function renderTodos() {
  // 計算總計統計
  const total = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const activeCount = total - completedCount;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  statTotal.textContent = total;
  statCompleted.textContent = completedCount;
  statPercent.textContent = percentage;
  statProgressBar.style.width = `${percentage}%`;

  countAll.textContent = total;
  countActive.textContent = activeCount;
  countCompleted.textContent = completedCount;

  // 依條件過濾
  let filtered = todos.filter(item => {
    if (currentFilter === 'active' && item.completed) return false;
    if (currentFilter === 'completed' && !item.completed) return false;
    if (currentPriorityFilter !== 'all' && item.priority !== currentPriorityFilter) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (item.text || '').toLowerCase().includes(q);
      const matchTag = (item.tag || '').toLowerCase().includes(q);
      const matchUser = (item.createdBy?.name || '').toLowerCase().includes(q);
      if (!matchText && !matchTag && !matchUser) return false;
    }
    return true;
  });

  todosItems.innerHTML = '';

  if (filtered.length === 0) {
    todosEmpty.classList.remove('hidden');
    return;
  }
  todosEmpty.classList.add('hidden');

  filtered.forEach(item => {
    const card = createTodoCard(item);
    todosItems.appendChild(card);
  });

  refreshIcons();
}

// 建立單一任務 DOM 卡片
function createTodoCard(item) {
  const div = document.createElement('div');
  div.className = `todo-item glass-card p-3.5 sm:p-4 rounded-xl flex items-start justify-between gap-3 border transition ${item.completed ? 'border-slate-800/50 bg-slate-900/40' : 'border-slate-800'}`;
  
  // 優先級徽章顏色
  const priorityBadge = {
    high: '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">高優先</span>',
    medium: '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">中優先</span>',
    low: '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">低優先</span>'
  }[item.priority || 'medium'];

  // 建立者與完成者資訊
  const creatorName = item.createdBy?.name || '匿名成員';
  const creatorAvatar = item.createdBy?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName)}&size=32`;

  const isChecked = Boolean(item.completed);

  div.innerHTML = `
    <div class="flex items-start gap-3 flex-1 min-w-0">
      <!-- 勾選框 -->
      <button 
        type="button" 
        data-action="toggle" 
        data-id="${item.id}"
        class="custom-checkbox mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600 hover:border-indigo-400 bg-slate-900/80'}">
        ${isChecked ? '<i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>' : ''}
      </button>

      <!-- 內容資訊 -->
      <div class="space-y-1.5 flex-1 min-w-0">
        <div class="flex items-center flex-wrap gap-2">
          ${priorityBadge}
          ${item.tag ? `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">#${item.tag}</span>` : ''}
          ${item.dueDate ? `<span class="flex items-center gap-1 text-[11px] text-slate-400"><i data-lucide="calendar" class="w-3 h-3"></i>${item.dueDate}</span>` : ''}
        </div>
        
        <p class="text-sm font-medium leading-relaxed break-words ${isChecked ? 'task-done-text' : 'text-slate-100'}">
          ${escapeHtml(item.text)}
        </p>

        <!-- 協作成員標註 -->
        <div class="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
          <div class="flex items-center gap-1">
            <img src="${creatorAvatar}" class="w-3.5 h-3.5 rounded-full object-cover" alt="creator">
            <span>${escapeHtml(creatorName)} 建立</span>
          </div>
          ${item.completed && item.completedBy ? `
            <span>&bull;</span>
            <span class="text-indigo-400 font-medium">由 ${escapeHtml(item.completedBy.name || '成員')} 完成</span>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- 操作按鈕群 -->
    <div class="flex items-center gap-1 opacity-80 hover:opacity-100 transition">
      <button 
        type="button" 
        data-action="edit" 
        data-id="${item.id}"
        title="編輯事項"
        class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition">
        <i data-lucide="edit-2" class="w-4 h-4"></i>
      </button>
      <button 
        type="button" 
        data-action="delete" 
        data-id="${item.id}"
        title="刪除事項"
        class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  `;

  return div;
}

// 輔助防 XSS
function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 新增待辦事項至 Firestore
async function handleAddTodo(e) {
  e.preventDefault();
  const text = inputTodoText.value.trim();
  if (!text) return;

  if (!db) {
    openConfigModal();
    showToast('請先填入 Firebase API Key 才能儲存待辦事項', 'warning');
    return;
  }

  const priority = selectPriority.value || 'medium';
  const tag = inputTodoTag.value.trim();
  const dueDate = inputTodoDue.value;

  const userMeta = currentUser ? {
    uid: currentUser.uid,
    name: currentUser.displayName || currentUser.email.split('@')[0],
    email: currentUser.email || '',
    photoURL: currentUser.photoURL || ''
  } : {
    uid: 'guest',
    name: '訪客成員',
    email: '',
    photoURL: ''
  };

  const newTodo = {
    roomId: currentRoomId,
    text: text,
    completed: false,
    priority: priority,
    tag: tag,
    dueDate: dueDate || null,
    createdBy: userMeta,
    completedBy: null,
    createdAt: serverTimestamp(),
    localTimestamp: Date.now()
  };

  try {
    inputTodoText.value = '';
    inputTodoTag.value = '';
    inputTodoDue.value = '';
    await addDoc(collection(db, "todos"), newTodo);
    showToast('已新增任務並同步至團隊！', 'success');
  } catch (error) {
    console.error("新增任務失敗:", error);
    showToast(`新增失敗: ${error.message}`, 'error');
  }
}

// 切換待辦事項完成狀態
async function toggleTodo(id) {
  if (!db) return;
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const nextStatus = !todo.completed;
  const todoRef = doc(db, "todos", id);

  try {
    const updateData = {
      completed: nextStatus,
      completedAt: nextStatus ? serverTimestamp() : null,
      completedBy: nextStatus ? {
        uid: currentUser?.uid || 'guest',
        name: currentUser?.displayName || '團隊成員'
      } : null
    };
    await updateDoc(todoRef, updateData);
  } catch (error) {
    showToast(`更新狀態失敗: ${error.message}`, 'error');
  }
}

// 開啟編輯 Modal
function openEditModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  editTodoId.value = todo.id;
  editTodoText.value = todo.text;
  editTodoPriority.value = todo.priority || 'medium';
  editTodoTag.value = todo.tag || '';
  editTodoDue.value = todo.dueDate || '';

  modalEditTodo.classList.remove('hidden');
  refreshIcons();
}

// 儲存編輯結果
async function handleSaveEdit(e) {
  e.preventDefault();
  const id = editTodoId.value;
  if (!db || !id) return;

  const updatedText = editTodoText.value.trim();
  if (!updatedText) return;

  try {
    const todoRef = doc(db, "todos", id);
    await updateDoc(todoRef, {
      text: updatedText,
      priority: editTodoPriority.value,
      tag: editTodoTag.value.trim(),
      dueDate: editTodoDue.value || null,
      updatedAt: serverTimestamp()
    });
    modalEditTodo.classList.add('hidden');
    showToast('任務已更新！', 'success');
  } catch (error) {
    showToast(`儲存失敗: ${error.message}`, 'error');
  }
}

// 刪除任務
async function deleteTodo(id) {
  if (!db) return;
  const todo = todos.find(t => t.id === id);
  const confirmMsg = todo ? `確定要刪除「${todo.text}」嗎？` : '確定要刪除此事項？';
  
  if (!window.confirm(confirmMsg)) return;

  try {
    await deleteDoc(doc(db, "todos", id));
    showToast('已刪除任務', 'info');
  } catch (error) {
    showToast(`刪除失敗: ${error.message}`, 'error');
  }
}

// 切換房間 (Room)
function switchRoom(newRoomId) {
  const cleanId = (newRoomId || 'team-default').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!cleanId) return;

  currentRoomId = cleanId;
  const url = new URL(window.location.href);
  url.searchParams.set('room', currentRoomId);
  window.history.pushState({}, '', url.toString());

  updateRoomUI();
  modalRoom.classList.add('hidden');
  showToast(`已切換至房間：${currentRoomId}`, 'info');

  if (db) {
    startTodosListener();
  }
}

function updateRoomUI() {
  currentRoomLabel.textContent = currentRoomId;
  badgeRoomName.textContent = currentRoomId;
}

// 複製房間邀請連結
function copyRoomLink() {
  const shareUrl = window.location.href;
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast('已複製協作邀請連結！傳送給朋友即可同步此清單。', 'success');
  }).catch(() => {
    prompt('請複製以下協作連結：', shareUrl);
  });
}

// 打開 Firebase 設定 Modal
function openConfigModal() {
  const cfg = getFirebaseConfig();
  cfgApiKey.value = cfg.apiKey || '';
  cfgProjectId.value = cfg.projectId || 'my-to-do-list-c05a3';
  cfgAuthDomain.value = cfg.authDomain || 'my-to-do-list-c05a3.firebaseapp.com';
  cfgAppId.value = cfg.appId || '';
  modalConfig.classList.remove('hidden');
  refreshIcons();
}

// 儲存 Firebase 設定
function handleSaveConfig() {
  const key = cfgApiKey.value.trim();
  if (!key) {
    alert('請填寫 Web API Key');
    return;
  }

  const updatedConfig = {
    apiKey: key,
    authDomain: cfgAuthDomain.value.trim() || 'my-to-do-list-c05a3.firebaseapp.com',
    projectId: 'my-to-do-list-c05a3',
    storageBucket: 'my-to-do-list-c05a3.firebasestorage.app',
    messagingSenderId: '',
    appId: cfgAppId.value.trim()
  };

  saveFirebaseConfig(updatedConfig);
  modalConfig.classList.add('hidden');
  showToast('設定已儲存，正在重新連線...', 'success');
  setTimeout(() => window.location.reload(), 600);
}

// 事件綁定
function setupEventListeners() {
  // 登入登出按鈕
  btnLogin?.addEventListener('click', handleGoogleLogin);
  btnHeroLogin?.addEventListener('click', handleGoogleLogin);
  btnLogout?.addEventListener('click', handleLogout);

  // 使用者頭像下拉選單
  btnUserAvatar?.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
  });

  window.addEventListener('click', () => {
    if (!profileDropdown.classList.contains('hidden')) {
      profileDropdown.classList.add('hidden');
    }
  });

  // 新增待辦
  formAddTodo?.addEventListener('submit', handleAddTodo);

  // 待辦列表點擊委派 (勾選 / 編輯 / 刪除)
  todosItems?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'toggle') toggleTodo(id);
    if (action === 'edit') openEditModal(id);
    if (action === 'delete') deleteTodo(id);
  });

  // 編輯待辦表單
  formEditTodo?.addEventListener('submit', handleSaveEdit);
  btnCloseEditModal?.addEventListener('click', () => modalEditTodo.classList.add('hidden'));
  btnCancelEdit?.addEventListener('click', () => modalEditTodo.classList.add('hidden'));

  // 篩選按鈕列
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.className = 'btn-filter px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition';
      });
      btn.className = 'btn-filter px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition';
      currentFilter = btn.dataset.filter;
      renderTodos();
    });
  });

  // 優先級過濾
  selectFilterPriority?.addEventListener('change', (e) => {
    currentPriorityFilter = e.target.value;
    renderTodos();
  });

  // 搜尋過濾
  inputSearch?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTodos();
  });

  // 房間與分享
  btnCopyRoomLink?.addEventListener('click', copyRoomLink);
  btnOpenRoomModal?.addEventListener('click', () => {
    inputRoomId.value = currentRoomId;
    modalRoom.classList.remove('hidden');
  });
  btnCloseRoom?.addEventListener('click', () => modalRoom.classList.add('hidden'));
  btnCancelRoom?.addEventListener('click', () => modalRoom.classList.add('hidden'));
  btnSwitchRoom?.addEventListener('click', () => {
    switchRoom(inputRoomId.value);
  });

  // 設定 Modal
  btnOpenConfigModal?.addEventListener('click', openConfigModal);
  btnBannerConfig?.addEventListener('click', openConfigModal);
  btnFooterConfig?.addEventListener('click', openConfigModal);
  btnCloseConfig?.addEventListener('click', () => modalConfig.classList.add('hidden'));
  btnCancelConfig?.addEventListener('click', () => modalConfig.classList.add('hidden'));
  btnSaveConfig?.addEventListener('click', handleSaveConfig);
  btnResetConfig?.addEventListener('click', () => {
    if (confirm('確定要清除自訂設定並還原為預設？')) {
      resetFirebaseConfig();
      window.location.reload();
    }
  });
}

// 頁面啟動進入點
window.addEventListener('DOMContentLoaded', async () => {
  updateRoomUI();
  setupEventListeners();
  refreshIcons();
  await initFirebase();
});

