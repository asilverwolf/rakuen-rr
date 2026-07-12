# CLAUDE.md — rakuen-rr 官網 repo 指令檔

RakuenɒuyɘЯ（R.R）官方網站。純靜態 HTML/CSS/JS，無框架、無 build step。
品牌命題：虛構的，所以真實。Aida 永久隱身，Luna / Ari / Irene 三位 AI 角色是唯一公開面孔。

## 部署

- main 分支 push → Cloudflare Pages 自動部署 rakuen-rr.com（無需手動）
- repo 在 iCloud 掛載目錄下，git 常有 lock 檔問題。commit 前先跑：
  ```python
  import os, glob
  for f in glob.glob('.git/*.lock*') + glob.glob('.git/*.gone'):
      try: os.rename(f, f + '.x')
      except: pass
  ```
- 若 rename 也失敗，請 Aida 在 Mac Terminal 手動 `rm .git/*.lock`

## 檔案慣例

| 內容 | 位置／命名 |
|------|-----------|
| 歌曲頁 | `music-{slug}.html`（slug 全小寫羅馬字：noproof / signal / jiexian / between / heydirtyboy / jiyuu / stillhere / areyousure / sayit / matane / rainnight / aida / kingyo / youmetsu / kyouhan） |
| 音檔 | `audio/{slug}.mp3` |
| 封面圖 | `cover-{slug}.jpg`（根目錄） |
| IG 封面影片 | `cover-{slug}.mp4`（封面圖＋完整音頻，Buffer 用） |
| IG Reel 影片 | `reel-{slug}.mp4` |
| BTS 網頁圖 | `bts/`（web 壓縮 JPG，50–400KB） |
| 商品頁 | `shop/`（jersey-01.html、complete.html；worker.js 為棄用的 Stripe 遺留，待汰換） |
| 客戶案例頁 | `client-*.html` |

- MP4 一律加 `-movflags +faststart`（Buffer 讀 metadata 需要）
- 壓縮參考：`ffmpeg -y -i in.mp4 -c:v libx264 -crf 45 -preset ultrafast -tune stillimage -movflags +faststart -c:a aac -b:a 128k out.mp4`

## 播放器與歌曲陣列（重要）

- `index.html`、`what-we-do.html`、`take.html`、每個 `music-*.html` 各自有一份歌曲陣列（TRACKS/playlist）
- **新增或移除歌曲時，所有頁面的陣列都要同步改**，並確認 `audio/{slug}.mp3` 已存在——陣列裡有、檔案不在 = 隨機播放會壞
- 未完成的歌不上陣列、不給播放鍵（take 頁可留卡片標 "in the making"）
- take.html 的 `gpLoad(n,true)` 以陣列 index 對應，動陣列順序時要同步檢查
- 隨機播放預設開啟；全站不自動播放（手動觸發）

## 視覺與文案規則

- 色彩：黑／灰／白低彩度；英文為主，中日韓文只作 accent
- footer tagline：FICTIONAL, THEREFORE REAL.
- 對外視覺必壓 RakuenɒuyɘЯ 基礎版 Logo
- 不解釋、不教育、不強推；不自我宣示是 AI
- 音樂下載免費（Free to keep, free to share — not for commercial use）
- 對外時間承諾（如出貨時程）未確定前一律寫 Coming Soon，不寫具體週數

## 金流（現況）

- Lemon Squeezy＝數位內容（訂閱／單曲買斷），store：rakuen-rr.lemonsqueezy.com，等 Identity verification 通過才可 Live
- 綠界＝實體商品（暫緩，等有實體商品再啟動）
- 定價：贊助 US$3/月、完整 US$8/月、單曲 US$2、年度包 US$25、折扣碼 RAKUEN10

## 相關文件

核心設定：Setting Doc/（characters_bible.md / brand_core.md / workspace_map.md / progress_snapshot.md）
IG 工作流程：Setting Doc/rakuen_rr_IG_workflow.md
改完官網記得回報，由 Ari 更新 progress_snapshot.md。
