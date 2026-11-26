# 中文語境 Chinese Context

以成語、詞語、文化背景與情感脈絡，協助中文使用者及國際中文學習者探索中文。

網站：https://fishpka.github.io/chinese/

## 功能

- 搜尋、自動完成、分類瀏覽與分頁。
- 詞條解釋、原有例句及來源中已提供的中、英、法文內容。
- 每日詞語、隨機探索、語言切換與深淺色主題。
- 可直接閱讀的靜態教學頁面及 Umami Analytics。

不會自動生成翻譯，也不刪除 `src/data/Chinese-teaching.txt` 原始資料。缺少語言時介面可能沿用既有內容，但 parser 將原始翻譯欄位與顯示 fallback 分開。

## 技術架構

React 19、Vite 8、Tailwind CSS 4、Framer Motion、Lucide、ESLint。維持純靜態 GitHub Pages 部署，無需執行中的 SSR 伺服器。

- `src/App.jsx`：搜尋、路由、語言與互動狀態。
- `src/data/teachingParser.js`：前端與建置共用 parser。
- `src/data/entryPolicy.js`：已核對的詞名修正、排除規則及繁簡 aliases。
- `src/lib/search.js`：包含舊詞名 aliases 的搜尋比對。
- `src/lib/routes.js`：網址及 `/chinese/` base path。
- `src/entry-server.jsx`：建置時使用現有 React UI 預渲染。
- `scripts/seo-data.mjs`：canonical 資料與 metadata。
- `scripts/legacy-word-routes.json`：既有 653 個詞語網址相容清單。
- `scripts/generate-static-pages.mjs`：首頁、詞條、分類、相容頁及 404。
- `scripts/sync-dist-to-root.mjs`：將部署產出同步至 repository root。

## 開發與驗證

```bash
npm install
npm run dev
npm run build
npm run check:seo
npm run lint
npm run preview
```

先 build 再執行 SEO 檢查。Vite 來源根目錄為 `src/`，預覽入口為 `/chinese/`。Build 更新 `dist/` 與根目錄的 HTML、assets、word、emotion、sitemap；不要手動修改生成檔。部署時必須一起發布 HTML 與其引用資源。

## SEO 與內容政策

首頁、canonical 詞條及分類頁提供獨立 title、description、H1、canonical 與 JSON-LD。建置直接輸出現有 React UI 及原始教學內容，無 JavaScript 仍可閱讀。資料載入期間保留預渲染畫面，移除隱藏整頁的 app-loading；非必要網路字型採非阻塞載入。

Parser 修正已確認的截斷詞名，排除社群宣傳、非教學句子及缺少說明的內容。繁簡合併使用明確核對的對照表，避免全面轉換造成詞義誤合併。新增內容後請人工檢查 `.seo/report.json` 中的排除理由與 aliases；此檔是本機診斷產物，不提交。

本次基準：原有 653 個詞語 + 8 個分類 + 首頁，共 662 個 sitemap URL；整理後 631 個 canonical 詞語 + 8 個分類 + 首頁，共 640 個。合併 8 組繁簡重複，14 個舊詞語不符合索引條件。

653 個舊詞語網址全部保留。有效別名頁指向對應 canonical，仍可透過別名搜尋；排除頁保留來源內容並加上 noindex。GitHub Pages 不提供此處的伺服器 301，別名使用 canonical 提示整併。別名、排除頁及 404 不列入 sitemap。不以建置時間假裝內容更新日期。

`npm run check:seo` 驗證：

- sitemap 無重複，僅包含允許索引的 canonical URL。
- 所有舊網址存在；canonical、JSON-LD 與頁面一致。
- 排除頁具有 noindex，沒有不相關的首頁 canonical。
- title、description、H1、H2 與原始教學內容符合預期且非空白。
- HTML anchor、fragment、圖片、CSS、JS 有效且相容 `/chinese/`。
- aliases 搜尋、parser 回歸案例及舊路由呈現。
- 靜態內容不被整頁隱藏，Umami CSP、模擬載入與事件測試。

目前沒有獨立語言 HTML，故不宣告 hreflang。規則式 parser 仍需人工審閱新增資料。檢查通過不代表 Google 必然收錄或採用宣告的 canonical。

## GitHub Pages 部署

保持 `vite.config.js` 的 `base: '/chinese/'` 與路由設定同步。沿用目前 repository root 部署方式，將來源與建置產出一起發布至既有 Pages 來源分支。原有 `npm run deploy` 會發布 dist 至 gh-pages，僅在 Pages 已設定該分支時使用，不需為 SEO 更換部署方式。

部署後確認首頁、詞條、分類、舊網址與資源可讀取。robots.txt 允許索引並提供 sitemap。向 Google Search Console 提交：

`https://fishpka.github.io/chinese/sitemap.xml`

透過網址審查確認實際 HTML、Google 選用的 canonical 與收錄狀態。FCP/LCP 需要部署後 Lighthouse 或實際使用者資料，本機靜態檢查不代表已量測線上效能。

## Umami Analytics

`src/lib/analytics/umami.js` 只插入一次 script，保留 Umami 原生初次及 SPA history pageview，避免手動重複送出。既有事件名稱保留，追蹤失敗不阻擋閱讀。

公開的 Vite 環境變數：

- `VITE_UMAMI_SCRIPT_SRC`：預設 https://cloud.umami.is/script.js 。
- `VITE_UMAMI_WEBSITE_ID`：預設目前 ID `955da1bd-cc90-4cee-88ee-1ac182d6cb42`。
- `VITE_UMAMI_HOST_URL`：選填，自行代管時使用。

`src/index.html` CSP 的 script-src 允許 cloud.umami.is，connect-src 允許 gateway.umami.is；Cloud 追蹤請求送至 https://gateway.umami.is/api/send 。更換代管來源時需同步調整 CSP。

部署後以 Network 確認 script 與 /api/send 成功，再操作導覽並對照 Umami Realtime。自動檢查使用 mock，不污染正式流量，也不能證明正式收件成功。廣告阻擋或停用追蹤可能影響數據。不要將 dashboard API secret 放入前端環境變數。
