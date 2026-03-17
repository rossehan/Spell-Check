# rossehan-projects - 전체 프로젝트 메모리

## 레포 정보
- **레포명**: rossehan/rossehan-projects (구 Spell-Check)
- **구조**: main 브랜치에 모든 프로젝트 보관
- **로컬 경로**: C:\Users\admin\Desktop\rossehan-projects

---

## 프로젝트 1: TextScan (광고 소재 맞춤법 검사기)

### 파일
- `/index.html` - 단일 파일 SPA

### 설명
광고 소재(이미지/영상)의 맞춤법, 문법, 광고 정책 위반을 AI로 분석하는 도구.
TikTok, Meta(Facebook/Instagram) 등 플랫폼 광고 기준에 맞춰 검사.

### 주요 기능
- Google Drive 폴더/파일 링크 연동
- 직접 파일 업로드 (드래그앤드롭, JPG/PNG/WEBP/MP4/MOV)
- 멀티 플랫폼 선택 (TikTok, Meta, YouTube, Naver, Kakao)
- 이슈 카드: 원문, 수정문, 마케팅 제안
- 심각도별 분류 (error, warning, suggestion)
- 리포트 다운로드 (TXT)

### 기술 스택
- HTML5 + Vanilla JavaScript
- Anthropic Claude API (claude-sonnet-4-20250514)
- 다크 테마 (#0a0a0a 배경, #e8ff47 라임 액센트)

---

## 프로젝트 2: OEM Scheduler (OEM 제조 일정 관리)

### 파일
- `/oem-scheduler.html` - 단일 파일 SPA

### 설명
OEM 제조 생산 일정 관리 및 타임라인 추적 도구.
다단계 제조 공정을 병렬 트랙으로 관리하고 AI 분석 제공.

### 주요 기능
- 프로젝트 카드 인터페이스
- 단계별 워크플로우 (병렬 실행 트랙 지원)
- 간트 차트 시각화
- AI 분석: 핵심 인사이트, 경고, 추천
- 진행률 바 및 체크리스트
- 제조사 자동완성 드롭다운
- 조절 가능한 단계별 일수

### 기술 스택
- HTML5 + Vanilla JavaScript
- 커스텀 CSS (블루 그라데이션 헤더 #1a73e8)
- 한국어/영어 이중 인터페이스

---

## 프로젝트 3: VitaView (아마존 건강기능식품 시장 인텔리전스)

### 파일
- `/vitaview/dashboard.html` - React SPA (Babel standalone)
- `/vitaview/server.js` - Express 백엔드
- `/vitaview/App.js` - React 컴포넌트
- `/vitaview/package.json` - 의존성
- `/render.yaml` - Render 배포 설정

### 설명
Amazon SP-API를 활용한 건강기능식품 시장 분석 대시보드.
실시간 제품 데이터, 시장 트렌드, 경쟁 분석 제공.

### 주요 기능
- 100+ 보충제 카테고리
- 실시간 Amazon 데이터 (SP-API)
- Top 100 제품 (판매 순위별, 스크롤 컨테이너)
- 제품 상세 모달 (가격, 순위, ASIN, 이미지, Amazon 링크)
- 일일 판매량 추정 (BSR 기반)
- 30분 자동 새로고침
- Demo 모드 폴백
- Market Intelligence BI: 카테고리 매출 순위, 경쟁 분석 (HHI), 시장 기회 점수
- 제형 분석 (Gummy, Capsule, Softgel 등)
- 성분 추출 및 키워드 필터링
- 트렌드 해시태그 롤링 배너

### 서버 엔드포인트
- `GET /` - 대시보드 서빙
- `GET /api/health` - 연결 상태
- `GET /api/trends` - 전체 카테고리 데이터
- `GET /api/search?q=keyword` - 제품 검색
- `GET /api/product/:asin` - 제품 상세
- `GET /api/products/:categoryId` - 카테고리별 제품
- `GET /api/categories` - 카테고리 목록
- `GET /api/debug` - SP-API 디버그

### 기술 스택
- **프론트엔드**: React 18 (CDN + Babel), CSS-in-JS
- **백엔드**: Node.js, Express 5.2.1, Better-SQLite3, Node-cron
- **API**: Amazon SP-API, Google Trends API
- **배포**: Render (Node.js 런타임)

### SP-API 데이터 구조 (중요!)
- **가격**: `list_price[0].value` → 숫자(NUMBER), `{amount: "xx.xx"}` 아님
- **순위**: `salesRanks[0].classificationRanks[0].rank` (NOT `ranks[0].rank`)
- **이미지**: `images[0].images[0].link` → Amazon CDN URL
- **브랜드**: `attributes.brand[0].value`
- **제목**: `summaries[0].itemName`

### 일일 판매량 추정 (BSR 기반)
- rank ≤ 5: ~300-700/일
- rank ≤ 50: ~60-200/일
- rank ≤ 500: ~20-80/일
- rank ≤ 5,000: ~8-25/일
- rank ≤ 50,000: ~3-8/일
- rank > 50,000: ~1-3/일

### 카테고리 키워드 (100개)
vitamins, protein, omega, probiotics, collagen, magnesium, vitaminD, vitaminC, zinc, iron, calcium, biotin, melatonin, ashwagandha, creatine, turmeric, elderberry, fiber, multivitamin, bcaa, glutamine, coq10, vitaminB, vitaminE, vitaminK, potassium, selenium, manganese, lysine, glucosamine, spirulina, chlorella, echinacea, ginseng, garlic, greenTea, appleCiderVinegar, maca, saw_palmetto, milk_thistle, rhodiola, valerian, fenugreek, black_seed_oil, quercetin, resveratrol, lions_mane, reishi, berberine, digestive_enzymes, lutein, astaxanthin, dhea, five_htp, l_theanine, l_carnitine, alpha_lipoic_acid, nac, dim, tribulus, tongkat_ali, shilajit, cordyceps, chaga, turkey_tail, moringa, sea_moss, olive_leaf, oregano_oil, vitamin_a, folate, chromium, iodine, boron, copper, inositol, pqq, nmn, hyaluronic_acid, keratin, msm, chondroitin, bromelain, psyllium_husk, bovine_colostrum, beta_alanine, citrulline, electrolytes, whey_protein, casein, pea_protein, hemp_protein, fish_oil, krill_oil, evening_primrose, black_cohosh, st_johns_wort, bilberry

---

## SP-API 설정
- Marketplace: ATVPDKIKX0DER (US)
- .env 키: SP_API_CLIENT_ID, SP_API_CLIENT_SECRET, SP_API_REFRESH_TOKEN, MARKETPLACE_ID
- .env는 절대 git에 포함하지 않음

## 로컬 개발 환경
- **로컬 경로**: C:\Users\admin\Desktop\rossehan-projects
- **VitaView 실행**: vitaview 폴더에서 `node server.js` → http://localhost:3001
- **파일 업데이트**: GitHub에서 iwr로 다운로드
- **브라우저**: Ctrl+Shift+R로 하드 리프레시

## 로컬 파일 업데이트 방법
```powershell
cd C:\Users\admin\Desktop\rossehan-projects
git pull origin main
# VitaView 실행
cd vitaview
node server.js
```
브라우저에서 Ctrl+Shift+R

## 사용자 환경설정
- 한국어로 소통
- 30분 자동 새로고침 선호
- 제품 이미지 + Amazon 링크 Top 100에 표시
- SP-API 실시간 LIVE 모드 선호
- Top 100은 대시보드 상단, 가격 섹션은 하단
- Top 100은 자체 컨테이너 내 스크롤 (페이지 스크롤 X)
- 텍스트와 이미지는 크게 (읽기 쉽게)
- 일일 판매 추정치 제품별 표시

## 잃어버린 파일 (복구 필요)
- `spellcheck-app.html` - 맞춤법 검사 앱 (별도 버전)
- `React App.html` + `React App_files/` - React 앱
- `dashboard.html` 최신 버전 (301KB) - claude 폴더에서 삭제됨
- `server.js` 최신 버전 (152KB) - claude 폴더에서 삭제됨
- `db.js` - 데이터베이스 헬퍼

## Git 정보
- **레포**: rossehan/rossehan-projects
- **메인 브랜치**: main
- **이전 작업 브랜치**: claude/setup-supplemint-5e6W6, claude/oem-production-scheduler-9IIJp
