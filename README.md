# MyToDoList - 多人即時協作待辦清單 (Firebase)

這是一個專為團隊與多人協作設計的現代化待辦事項網頁應用程式，以 **Firebase** (`my-to-do-list-c05a3`) 作為後端雲端架構，支援 **Google 帳號登入**、**Firestore 即時同步 (Real-time Sync)**、**多房間分流**與**協作動態追蹤**。

---

## 🌟 功能亮點

1. **Google 帳號登入與身分識別**：
   - 使用 Firebase Authentication (Google 登入提供者)。
   - 記錄每項任務由誰建立、由誰完成，顯示成員大頭貼與名稱。

2. **多人即時協作 (Real-time Collaboration)**：
   - 採用 Firestore `onSnapshot` 即時監聽機制，任何成員新增、勾選完成、編輯或刪除任務時，其他成員的畫面皆**即時毫秒級同步**，無需手動重新整理。
   - **即時協作動態饋給 (Activity Feed)**：即時顯示各成員的操作事件。

3. **協作房間分流 (Room / Workspace)**：
   - 支援依專案或團隊劃分房間（例如 `team-marketing`、`project-alpha`）。
   - 具備**一鍵複製邀請連結**功能，任何點開連結的成員即可立即加入同一清單共同協作。

4. **進階任務管理**：
   - 優先級分類（高優先、中優先、低優先）與專屬色彩標籤。
   - 支援標籤（Tag）與到期日設定。
   - 支援狀態篩選（全部、進行中、已完成）、優先級篩選與關鍵字即時搜尋。
   - 完成進度即時統計長條圖。

5. **極致美觀的現代化 UI**：
   - 深色模式現代設計（Tailwind CSS + Lucide Icons + 毛玻璃擬態效果）。
   - 支援響應式設計（電腦與手機瀏覽皆完美適配）。

6. **免安裝執行環境**：
   - 內建 PowerShell 原生 HTTP 伺服器，直接雙擊 `start.bat` 即可啟動，電腦無需預先安裝 Node.js 或 Python！

---

## 🚀 快速啟動方式

1. 進入 `MyToDoList` 資料夾。
2. 雙擊執行 **`start.bat`**。
3. 系統會自動啟動本機伺服器並在瀏覽器中開啟 `http://localhost:5000`。
   > 也可以在 PowerShell 中手動執行：`.\server.ps1`

---

## ⚙️ Firebase 專案設定教學 (`my-to-do-list-c05a3`)

首次開啟應用程式時，若尚未填入 Firebase Web API Key，網頁上方會顯示設定提醒。您可以直接在網頁右上角的 **「⚙️ 設定」** 彈出視窗中填入 API Key（系統會儲存於瀏覽器），或在 `firebase-config.js` 檔案中填寫。

請依照下列步驟確認 Firebase 控制台已啟用必要服務：

### 步驟 1：取得 Web API Key
1. 前往 [Firebase Console 控制台](https://console.firebase.google.com/)。
2. 點選專案 **`my-to-do-list-c05a3`**。
3. 點選左上角齒輪 **「專案設定」 (Project Settings)** &gt; **「一般」 (General)**。
4. 向下滾動至 **「您的應用程式」 (Your apps)**：
   - 若尚未建立 Web 應用程式，請點選 `</>` (Web) 圖示註冊一個（應用程式暱稱可填 `MyToDoList`）。
   - 在產生的 Firebase SDK 設定程式碼中複製 `apiKey` 與 `appId`。
5. 在 `MyToDoList` 網頁介面上點選右上角 **「⚙️ 設定」**，將 `apiKey` 貼上並按儲存。

### 步驟 2：啟用 Google 登入驗證
1. 在 Firebase Console 左側選單點選 **「Authentication」 (驗證)**。
2. 切換至 **「Sign-in method」 (登入方式)** 分頁。
3. 在「其他提供者」中點選 **「Google」**。
4. 將開關切換為 **啟用 (Enable)**，設定支援電子郵件後儲存。
5. 切換至 **「Settings」 (設定)** &gt; **「Authorized domains」 (已獲授權的網域)**，確認列表中有包含 `localhost`（預設已有）。

### 步驟 3：啟用 Cloud Firestore 資料庫
1. 在 Firebase Console 左側選單點選 **「Firestore Database」**。
2. 點選 **「建立資料庫」 (Create database)**。
3. 地點可選擇預設或 `asia-east1` (台灣) / 鄰近區域。
4. 安全性規則可先選擇 **「以測試模式啟動」 (Test mode)** 方便快速測試。
5. 建立完成後，若要套用更嚴格的安全性規則，可在「規則 (Rules)」分頁貼上本專案提供的 `firestore.rules` 內容：
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /todos/{todoId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

---

## 📂 專案檔案架構

```
MyToDoList/
├── index.html            # 主頁面結構與 UI 元素
├── app.js                # 核心應用程式邏輯 (Firebase v10 模組化整合)
├── firebase-config.js    # Firebase 設定檔 (專案: my-to-do-list-c05a3)
├── style.css             # 樣式、毛玻璃效果、動畫與捲軸自訂
├── firestore.rules       # Firestore 雲端資料庫安全規則設定檔
├── server.ps1            # Windows 原生 PowerShell HTTP 伺服器
├── start.bat             # 一鍵雙擊啟動腳本
└── README.md             # 專案說明與設定手冊
```

