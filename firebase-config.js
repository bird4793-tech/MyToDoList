// Firebase 設定模組 - 專案: my-to-do-list-c05a3
// 支援從 localStorage 讀取自訂 API Key，或直接使用此檔案中的預設設定

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD-dhf_6y7gwuk0KZQkG23EglrqSqOHwyE",
  authDomain: "my-to-do-list-c05a3.firebaseapp.com",
  projectId: "my-to-do-list-c05a3",
  storageBucket: "my-to-do-list-c05a3.firebasestorage.app",
  messagingSenderId: "",
  appId: ""
};

const STORAGE_KEY = "mytodolist_firebase_config";

/**
 * 取得當前有效的 Firebase 設定
 */
export function getFirebaseConfig() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
    } catch (e) {
      console.warn("無法解析儲存的 Firebase 設定，使用預設值", e);
    }
  }
  return { ...DEFAULT_FIREBASE_CONFIG };
}

/**
 * 儲存使用者的 Firebase 設定到 localStorage
 */
export function saveFirebaseConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * 清除儲存的設定並恢復預設
 */
export function resetFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 檢查當前設定是否有效（是否有填寫 apiKey）
 */
export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.apiKey.trim().length > 10);
}

