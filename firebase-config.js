// Firebase 設定模組 - 專案: my-to-do-list-c05a3
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD-dhf_6y7gwuk0KZQkG23EglrqSqOHwyE",
  authDomain: "my-to-do-list-c05a3.firebaseapp.com",
  projectId: "my-to-do-list-c05a3",
  storageBucket: "my-to-do-list-c05a3.firebasestorage.app",
  messagingSenderId: "480419783475",
  appId: "1:480419783475:web:134df4f549e79aafb15446"
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
      const merged = { ...DEFAULT_FIREBASE_CONFIG };
      for (const key in parsed) {
        if (parsed[key] && typeof parsed[key] === "string" && parsed[key].trim()) {
          merged[key] = parsed[key].trim();
        }
      }
      return merged;
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
 * 檢查當前設定是否有效
 */
export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.apiKey.trim().length > 10);
}
