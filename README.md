# ChatGPT Conversation & Project Manager

> 批次管理 ChatGPT 對話與專案的 Chrome 擴充功能：一次勾選多個對話或專案，批次移動、釘選、取消釘選、封存、刪除。

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome)
![Version](https://img.shields.io/badge/version-2.0-brightgreen)
![Platform](https://img.shields.io/badge/platform-chatgpt.com-412991)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

本專案改自 [kayuling/chat-organizer-extension](https://github.com/kayuling/chat-organizer-extension)（MIT 授權，原作者 Ka Yu）。原專案提供 ChatGPT／Claude 的批次移動與刪除；本專案專注於 ChatGPT，修正了在新版 ChatGPT 與中文介面下的問題，並新增專案管理、釘選、封存等功能。修改內容請見下方「與原專案的差異」與 Git 紀錄。

---

## 功能

面板分成兩個分頁：

| 功能 | 對話管理 | 專案管理 |
|---|---|---|
| 勾選框（含 Shift 連續勾選） | 一般對話、已釘選對話、專案內的對話 | 側邊欄的專案 |
| 全選／全不選 | ✅ | ✅ |
| 批次移到專案 | ✅ | — |
| 批次釘選／取消釘選 | ✅ | ✅ |
| 批次封存 | ✅ | —（ChatGPT 專案不能封存） |
| 批次刪除（會先跳確認視窗） | ✅ | ✅（專案內的對話會一併刪除） |

- **不重新整理頁面**：所有動作都在同一頁面內逐一處理。
- **支援中文介面**：繁體中文、英文的選單文字都能辨識。
- **自動跳過**：已經釘選的不會重複釘選、找不到的項目會略過並在狀態列顯示原因，不會中斷整批工作。
- **面板預設關閉**：點工具列圖示切到 On 才會出現。

---

## 安裝

1. 下載或 clone 這個 repository。
2. 在 Chrome 開啟 **`chrome://extensions`**。
3. 開啟右上角的 **開發人員模式**。
4. 點 **載入未封裝項目**，選擇本專案資料夾。
5. 把擴充功能圖示釘選到工具列，方便開關面板。

---

## 使用方式

1. 前往 [https://chatgpt.com](https://chatgpt.com)。
2. 點工具列的擴充功能圖示，把 **Panel** 切到 **On**。
3. 選擇面板上方的 **對話管理** 或 **專案管理**。
4. 在側邊欄勾選要處理的項目（按住 Shift 可一次勾選一整段）。
5. 按下要執行的動作，進度會顯示在面板最下方的狀態列。

> ⚠️ 刪除無法復原。刪除專案時，專案內的所有對話也會一起刪除。封存的對話可在 ChatGPT「設定 → 個人 → 已封存的對話」找回。

---

## 與原專案的差異

| 項目 | 原專案 | 本專案 |
|---|---|---|
| 中文介面刪除 | 只認英文「Delete」，中文介面無法刪除 | 用 `data-testid` 與多語系文字辨識 |
| 刪除流程 | 每刪一個就重新整理，可能出現「ChatGPT 遇到問題」 | 同一頁面內逐一刪除，刪除前先彈出確認視窗預防誤刪 |
| 「⋯」選單按鈕 | 新版 ChatGPT 找不到 | 從連結往外層尋找並重試 |
| 勾選框 | 把 ChatGPT 的元素搬進自製容器，造成 React 出錯、捲動載入的對話沒有勾選框 | 勾選框放在連結內部，不搬動任何原生元素 |
| 專案內的對話 | 無法勾選 | 可勾選 |
| 專案清單 | 讀瀏覽器舊快取，可能包含已刪除的專案 | 向 ChatGPT 取得最新清單 |
| 釘選、取消釘選、封存 | 無 | 新增 |
| 專案管理 | 無 | 新增分頁，可批次釘選、取消釘選、刪除專案 |
| 支援網站 | ChatGPT、Claude | 僅 ChatGPT |

---

## 檔案結構

```
├── manifest.json    # 擴充功能設定、權限
├── popup.html       # 工具列彈出視窗
├── popup.js         # 面板開關
├── content.js       # 側邊欄勾選框、面板與批次處理流程
└── icons/           # 圖示
```

## 權限

| 權限 | 用途 |
|---|---|
| `activeTab` | 從彈出視窗操作目前分頁 |
| `scripting` | 在分頁中開關面板 |
| `host_permissions` → `chatgpt.com/*` | 在 ChatGPT 頁面上執行 |

---

## 已知限制

- **依賴 ChatGPT 的網頁結構**：ChatGPT 改版後，部分選擇器可能失效，需要更新 `content.js`。
- 只會處理側邊欄**已經載入**的項目；請先展開「專案」區塊、往下捲動載入更多對話。
- 非 OpenAI 官方產品，使用風險自負。

---

## 開發

1. 修改 `manifest.json`、`popup.html`、`popup.js`、`content.js` 或 `lib/core.js`。
2. 到 `chrome://extensions` 按擴充功能卡片上的重新載入 ↻。
3. 重新整理 ChatGPT 頁面；可用 DevTools 檢查側邊欄結構與錯誤訊息。

### 程式架構

| 檔案 | 內容 |
|---|---|
| `lib/core.js` | 不依賴實際網頁的純邏輯：多語系選單文字比對、網址與專案 ID 解析、ChatGPT 選擇器、刪除確認訊息 |
| `content.js` | 操作 ChatGPT 頁面：插入勾選框、面板、開啟選單並逐一執行批次動作 |

`manifest.json` 會先載入 `lib/core.js`，`content.js` 再透過 `BCM3Core` 使用它。

### 測試

使用 [Jest](https://jestjs.io/) 與 jsdom（在 Node.js 中模擬網頁），不需要開啟 ChatGPT。

```bash
npm install
npm test
```

- `tests/core.test.js`：`lib/core.js` 的單元測試。以 `regression:` 開頭的測試，對應開發過程中修過的 bug，避免同樣的問題再次發生。
- `tests/content.test.js`：整合測試。以實際擷取的 ChatGPT 側邊欄 HTML 結構建立假頁面，載入真正的 `content.js`，驗證勾選框位置、分頁切換、刪除確認等行為。

每次 push 或開 Pull Request 時，GitHub Actions（`.github/workflows/test.yml`）會自動執行語法檢查與所有測試。

> 實際對 ChatGPT 執行刪除、釘選等操作仍需手動測試，因為測試環境無法登入 ChatGPT。

## 授權

MIT。原始程式碼著作權屬於原作者 Ka Yu，本專案的修改同樣以 MIT 授權釋出。
