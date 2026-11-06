# 品牌交付物確認清單

提供設計師與業主確認專案交付範圍的繁體中文響應式網站，涵蓋品牌書、品牌視覺書、品牌插畫、品牌花邊、品牌相片、品牌影像與品牌文案。品牌書處理定位、價值、受眾與故事，品牌視覺書處理標誌、色彩、字體與版面規範。

## 填寫與交接

1. 填入專案名稱、業主／品牌名稱、確認人、日期與總備註。
2. 逐類選擇「需要」「不需要」或「待討論」。展開「子項與備註」，勾選子項並補上細節。未作答的類別會保留為「尚未選擇」。
3. 在「確認摘要」檢查各類別狀態，再下載 JSON、下載 JPG，或透過瀏覽器列印／儲存 PDF。JSON 保留所有勾選與備註，以及每個類別的需求狀態。JPG 為便於傳閱的單張圖片，超長摘要可改用 JSON 或 PDF。
4. 將下載的檔案交給對方。填寫下一案前，可以先匯出結果，再按頁尾的「清除本機草稿」。

網站以瀏覽器的 `localStorage` 保存一份草稿。資料保留於目前的瀏覽器及網站來源，無跨裝置同步。下載與列印皆在本機完成，檔案可能包含客戶資訊，請以雙方約定的管道傳送。公開部署只發布空白清單的程式檔，請將真實客戶資料和匯出檔放在儲存庫之外。

## 本機開啟

可直接開啟 `index.html` 試用，無須安裝套件。各瀏覽器對直接開啟本機檔案時的草稿儲存支援有所差異，可在本目錄啟動本機預覽，然後開啟 `http://localhost:8000`。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

## 調整內容

在 `catalog.js` 修改類別名稱、用途及子項。保留原有類別與子項 `id` 可以沿用已有的草稿。專案欄位與頁面文字可於 `index.html` 調整，視覺樣式位於 `styles.css`。若新增或移除專案欄位，請同步更新 `app.js` 的 `fields`。

## 部署到 GitHub Pages

GitHub Free 的 Pages 需要公開儲存庫。網站和原始碼都可由網路存取。只有取得公開許可後才啟用 Pages。私人儲存庫支援的 Pages 方案與網站存取權，請參閱 [GitHub Pages 發布來源說明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)與[網站可見度說明](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)。

1. 將本目錄的原始碼上傳至 GitHub，包含隱藏目錄 `.github`。
2. 在儲存庫的 **Settings → Pages → Build and deployment**，將 **Source** 設成 **GitHub Actions**。
3. 在 **Actions** 選擇 **Publish checklist to GitHub Pages**，按 **Run workflow** 並選擇主要分支。部署成功後，從工作流程或 Pages 設定取得網址。每次更新檔案後可手動重跑。

部署流程只打包 `index.html`、`styles.css`、`catalog.js` 與 `app.js`。資源使用相對路徑，因此可在 GitHub Pages 專案子路徑運作。
