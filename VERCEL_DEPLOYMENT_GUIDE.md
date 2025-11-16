# Vercel 배포 가이드

한의원 관리 시스템을 Vercel에 배포하는 단계별 가이드입니다.

## 사전 준비사항

- ✅ Supabase 프로젝트 생성 완료 (SUPABASE_SETUP_GUIDE.md 참고)
- ✅ GitHub 계정
- ✅ 로컬에서 정상 작동 확인

## 1. GitHub 저장소 생성 및 푸시

### 1.1 Git 초기화 (처음인 경우)

```bash
# 프로젝트 디렉토리로 이동
cd C:\Users\crimm\Documents\project\hani-man-ver1.0

# Git 초기화
git init

# 모든 파일 스테이징
git add .

# 첫 커밋
git commit -m "Initial commit: 한의원 관리 시스템 with Supabase integration"
```

### 1.2 GitHub 저장소 생성

1. https://github.com 로그인
2. 우측 상단 "+" 클릭 → "New repository" 선택
3. 저장소 정보 입력:
   - **Repository name**: `hani-man-system` (또는 원하는 이름)
   - **Description**: "한의원 환자 관리 시스템"
   - **Privacy**: Private 선택 (환자 정보 보호)
   - ⚠️ **Initialize this repository** 체크하지 않기
4. "Create repository" 클릭

### 1.3 GitHub에 푸시

```bash
# GitHub 저장소 연결 (URL은 본인 저장소로 변경)
git remote add origin https://github.com/YOUR_USERNAME/hani-man-system.git

# main 브랜치로 푸시
git branch -M main
git push -u origin main
```

## 2. Vercel 배포

### 2.1 Vercel 계정 생성
1. https://vercel.com 접속
2. "Start Deploying" 클릭
3. "Continue with GitHub" 선택
4. GitHub 계정으로 로그인

### 2.2 새 프로젝트 Import
1. Vercel 대시보드에서 "Add New..." → "Project" 클릭
2. "Import Git Repository" 섹션에서 GitHub 저장소 찾기
3. `hani-man-system` 저장소 옆 "Import" 클릭

### 2.3 프로젝트 설정

#### Build and Output Settings
- **Framework Preset**: Vite (자동 감지됨)
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `dist` (기본값)
- **Install Command**: `npm install` (기본값)

#### Environment Variables
"Environment Variables" 섹션을 펼치고 다음 추가:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Supabase Project URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key (매우 긴 문자열) |

⚠️ **중요**: 값은 `.env.local` 파일에서 복사하세요!

#### Root Directory
- 그대로 두기 (프로젝트 루트)

### 2.4 배포 시작
1. "Deploy" 버튼 클릭
2. 배포 진행 상황 확인 (1-2분 소요)
3. "Congratulations!" 메시지 확인

### 2.5 배포 완료
- 배포 URL 확인: `https://your-project.vercel.app`
- "Visit" 버튼 클릭하여 사이트 열기

## 3. 도메인 설정 (선택사항)

### 3.1 Vercel 무료 도메인
- 기본 제공: `your-project.vercel.app`
- Project Settings → Domains에서 변경 가능

### 3.2 커스텀 도메인 연결
1. 도메인 구입 (예: `haniman.com`)
2. Vercel Project Settings → Domains 이동
3. "Add" 클릭, 도메인 입력
4. DNS 레코드 설정 (Vercel 안내 따라하기)
   - Type: `A` Record
   - Name: `@` (또는 subdomain)
   - Value: Vercel IP (화면에 표시됨)

## 4. 자동 배포 설정

Vercel은 GitHub와 자동 연동되어 있습니다:

### 4.1 자동 배포 트리거
```bash
# 코드 수정 후
git add .
git commit -m "환자 검색 기능 개선"
git push origin main
```

→ Vercel이 자동으로 새 버전 배포 (1-2분 소요)

### 4.2 배포 상태 확인
1. Vercel 대시보드 → Deployments 탭
2. 최신 배포 상태 확인
3. Preview 링크로 확인 가능

### 4.3 브랜치별 배포
- `main` 브랜치: Production (실제 사용)
- 다른 브랜치: Preview (테스트용)

```bash
# 개발 브랜치 생성
git checkout -b feature/new-feature

# 커밋 & 푸시
git add .
git commit -m "새 기능 개발"
git push origin feature/new-feature
```

→ Vercel이 Preview URL 생성 (테스트 후 main에 병합)

## 5. 환경 변수 관리

### 5.1 환경 변수 추가/수정
1. Vercel Project Settings → Environment Variables
2. 변수 추가 또는 수정
3. "Save" 클릭
4. ⚠️ **중요**: Redeploy 필요!
   - Deployments 탭 → 최신 배포 → "⋯" → "Redeploy"

### 5.2 개발/프로덕션 분리
- Development: 로컬 개발용
- Preview: 테스트용
- Production: 실제 사용자용

각 환경별로 다른 Supabase 프로젝트 사용 가능

## 6. 모니터링 및 성능

### 6.1 Analytics 활성화
1. Vercel Project Settings → Analytics
2. "Enable Analytics" 클릭 (무료)
3. 사용자 트래픽, 페이지 로드 속도 확인

### 6.2 로그 확인
1. Vercel Deployments → 특정 배포 클릭
2. "Functions" 탭에서 서버 로그 확인
3. 오류 발생 시 여기서 디버깅

### 6.3 속도 최적화
- Vercel은 자동으로 CDN 캐싱
- 이미지 최적화 자동 적용
- Edge Network로 전 세계 빠른 접속

## 7. 문제 해결

### 배포 실패 시
1. Build Logs 확인
   - Deployments → 실패한 배포 → "Building" 로그
2. 일반적인 원인:
   - TypeScript 오류
   - 환경 변수 누락
   - 빌드 명령어 오류

### "This page could not be found"
- Output Directory가 `dist`인지 확인
- `npm run build`가 로컬에서 성공하는지 테스트

### 환경 변수 인식 안 됨
- Vercel에서 환경 변수 이름 확인 (`VITE_` 접두사 필수)
- Redeploy 실행
- 브라우저 캐시 삭제

### API 호출 실패
- Supabase URL과 Key 확인
- Supabase Row Level Security 정책 확인
- 브라우저 콘솔에서 네트워크 탭 확인

## 8. 보안 체크리스트

- ✅ `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- ✅ GitHub 저장소가 Private인지 확인
- ✅ Supabase Anon Key만 사용 (Service Key는 절대 노출 금지)
- ✅ Row Level Security (RLS) 정책 활성화 확인

## 9. 운영 팁

### 9.1 데이터 백업
```bash
# Supabase에서 주기적으로 백업 (Dashboard → Database → Backups)
```

### 9.2 성능 모니터링
- Vercel Analytics로 페이지 속도 확인
- Supabase Dashboard → Reports로 DB 쿼리 성능 확인

### 9.3 사용자 피드백
- 오류 발생 시 Vercel 로그와 Supabase 로그 동시 확인
- 브라우저 콘솔 오류 요청

## 10. 비용 안내

### Vercel Hobby (무료)
- ✅ 무제한 사이트
- ✅ 100GB 대역폭/월
- ✅ Git 자동 배포
- ✅ HTTPS 자동 적용
- ✅ 글로벌 CDN

**예상 사용량**: 15명 × 8시간 × 20MB = ~72GB/월
→ **무료 티어로 충분**

### 업그레이드 필요 시
- Pro 플랜: $20/월
- 1TB 대역폭
- 팀 협업 기능

## 11. 다음 단계

- ✅ Vercel 배포 완료
- ⏭️ 직원 교육 및 테스트
- ⏭️ 실제 환자 데이터 마이그레이션

## 지원 및 문의

- [Vercel 문서](https://vercel.com/docs)
- [Vercel 커뮤니티](https://github.com/vercel/vercel/discussions)
- [Supabase Discord](https://discord.supabase.com)

---

**축하합니다! 🎉**
한의원 관리 시스템이 성공적으로 배포되었습니다.
