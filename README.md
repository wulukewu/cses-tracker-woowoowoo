# CSES Tracker

固定三位同伴每週共同挑戰一組 CSES 題目，網頁即時顯示三人在該週題組上的完成進度。技術細節與決策脈絡見 `~/Documents/ai-memory/reference/cses-tracker-project-plan.md`。

## 架構

- Nuxt 4，`server/api/*` 由 Nitro 的 `netlify` preset 自動轉為 Netlify Functions
- 使用者清單：`shared/users.ts`（寫死 name + csesId，不是秘密）
- CSES 全題庫清單：`server/data/problems.json`（從 `/problemset/list` 手動抓取產生的靜態快照，題目變動不頻繁，需要更新時重新抓取覆蓋此檔即可）
- 週次資料（題目 + 截止日期）：Netlify Blobs，即時讀寫
- 進度資料：即時向 CSES 個人統計頁抓取解題狀態，不落地儲存，API 內建 7 分鐘記憶體快取

## 本機開發

```bash
npm install
npm run dev
```

`server/api/weeks*` 依賴 Netlify Blobs，純 `nuxt dev` 沒有 Netlify context 會回傳 500（前端已處理成空狀態，不會整頁壞掉）。要在本機測完整功能，改用：

```bash
npx netlify-cli dev
```

並先跑過一次 `netlify link`/`netlify init` 連結到你的 Netlify site。

## 部署到 Netlify（需要你自己動手的部分）

以下步驟屬於帳號建立、金鑰保管與雲端環境設定，不是我能代為執行的操作，需要你自己完成：

1. 在 Netlify 建立一個新 site，連接這個 repo（repo 設為 private）
2. 開一支**專用 CSES 帳號**（不要用個人帳號),登入 https://cses.fi 後，用瀏覽器開發者工具複製該帳號的 session cookie 字串
3. 到 Netlify site 的 Environment variables 設定 `CSES_SESSION_COOKIE`,值就是完整的 cookie header 字串（例如 `PHPSESSID=xxxxx`）
4. 確認 Netlify site 已啟用 Netlify Blobs（免費方案內建，通常不需要額外設定；本機以外的正式站台會自動取得 site-scoped 存取）
5. 觸發部署。之後 session 過期（每隔幾週）時,重新登入該專用帳號、更新 `CSES_SESSION_COOKIE` 環境變數即可,網站會自動顯示「資料自 X 月 X 日起未更新」

## 功能

- `/`：進度總覽（每人已完成 X / 該週總題數 + 進度條）、逐題狀態表格（列＝題目、欄＝每個人，打勾即已解，可點題目連到 CSES 題目頁）、週次切換、可連到編輯該週的頁面
- `/plan`：規劃下週 — 瀏覽/搜尋全題庫、已用過的題目自動標記停用、勾選 + 填寫顯示用截止日期、存檔寫入 Netlify Blobs、匯出所有週次資料成 JSON 下載；也可編輯任一已建立的週次（從首頁點「編輯這一週」進入,或帶 `?edit=<週次id>` 查詢參數）
