# CLAUDE.md - Instructions for Claude Code

## Project: rossehan-projects
개인 프로젝트 모음 레포. TextScan, OEM Scheduler, VitaView 포함.

## IMPORTANT: Always Read memory.md First
Before starting any work, read `/memory.md` for:
- 전체 프로젝트 목록 및 현재 상태
- SP-API 데이터 구조 (price, rank, image 형식)
- 사용자 환경설정 및 로컬 설정
- 모든 헬퍼 함수 (extractPrice, extractRank, estimateDailySales)

## Key Rules
1. **Language**: Always communicate in Korean (한국어)
2. **SP-API price**: `list_price[0].value` is a NUMBER, not `{amount: "xx.xx"}`
3. **SP-API rank**: Use `classificationRanks[0].rank`, NOT `ranks[0].rank`
4. **Never commit .env** or any secrets to git
5. **Update memory.md** after every significant change

## Projects
- **TextScan**: `/index.html` - 광고 소재 맞춤법 검사기
- **OEM Scheduler**: `/oem-scheduler.html` - OEM 제조 일정 관리
- **VitaView**: `/vitaview/` - 아마존 건강기능식품 시장 분석 대시보드

## File Locations
- TextScan: `/index.html`
- OEM Scheduler: `/oem-scheduler.html`
- VitaView Backend: `/vitaview/server.js`
- VitaView Frontend: `/vitaview/dashboard.html`
- Memory: `/memory.md`
- User's local: `C:\Users\admin\Desktop\rossehan-projects`
