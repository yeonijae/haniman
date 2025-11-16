# 한의원 관리 시스템 (Hani-Man ver 1.0)

실시간 환자 관리, 예약, 진료, 치료, 수납을 통합 관리하는 한의원 전용 웹 애플리케이션입니다.

## 주요 기능

### 📋 환자 관리
- 환자 등록 (신규/기존)
- 환자 정보 수정 및 삭제
- 환자 검색 및 조회
- 차트 번호 자동 생성
- 환자별 기본 치료 설정

### 📅 예약 관리
- 달력 기반 예약 시스템
- 의료진별 시간대 관리
- Acting(시간단위) 기반 스케줄링
- 예약 수정/취소
- 예약 환자 내원 처리

### 🏥 진료실 관리
- 실시간 진료실 현황
- 진료 대기 목록
- 진료 완료 후 자동 이동
- 재진료 요청 처리

### 💊 치료실 관리
- 치료실 상태 모니터링
- 치료 항목별 타이머
- 치료 시작/일시정지/완료
- 환자별 치료 세션 관리
- 기본 치료 템플릿 저장

### 💰 수납 관리
- 수납 대기 목록
- 다양한 결제 수단 (현금, 카드, 보험 등)
- 비급여 항목 관리
- 미수금 처리
- 일일 수납 현황

### 👨‍⚕️ 대타(Acting) 관리
- 의사별 대기 큐 관리
- 예상 소요 시간 표시
- 순서 변경 (드래그 앤 드롭)
- 액팅 추가/삭제/수정

### ⚙️ 설정
- 의료진/스탭 관리
- 비급여 항목 관리
- 환자 일괄 등록 (Excel)
- 삭제된 환자 복구

## 기술 스택

### Frontend
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **TailwindCSS** - 스타일링 (CSS-in-JSX)

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL 데이터베이스
  - RESTful API 자동 생성
  - 실시간 구독 (Realtime)
  - 사용자 인증
- **Row Level Security (RLS)** - 데이터 보안

### Deployment
- **Vercel** - 프론트엔드 호스팅
- **GitHub** - 버전 관리
- **CI/CD** - 자동 배포

## 빠른 시작

### 사전 요구사항
- Node.js 18+ 설치
- npm 또는 yarn
- Supabase 계정
- GitHub 계정 (배포 시)

### 1. 로컬 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/hani-man-system.git
cd hani-man-system

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 Supabase 정보 입력
```

### 2. Supabase 설정

**상세 가이드**: [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)

간단 요약:
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase-setup.sql` 실행
3. Project Settings → API에서 URL과 Anon Key 확인
4. `.env.local` 파일에 추가:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 4. 로그인

기본 테스트 계정:
- ID: `admin`
- Password: `7582`

## 배포

### Vercel 배포

**상세 가이드**: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

간단 요약:
```bash
# GitHub에 푸시
git add .
git commit -m "Initial deployment"
git push origin main

# Vercel에서:
# 1. Import Git Repository
# 2. 환경 변수 설정 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
# 3. Deploy 클릭
```

배포 URL: `https://your-project.vercel.app`

## 프로젝트 구조

```
hani-man-ver1.0/
├── components/           # React 컴포넌트
│   ├── Header.tsx
│   ├── LoginScreen.tsx
│   ├── PatientSearch.tsx
│   ├── ReservationModal.tsx
│   ├── PaymentModal.tsx
│   └── ...
├── lib/                  # 라이브러리 및 유틸리티
│   ├── supabaseClient.ts    # Supabase 클라이언트 설정
│   ├── api.ts               # API 함수들
│   └── database.types.ts    # DB 타입 정의
├── types.ts             # TypeScript 타입 정의
├── constants.ts         # 상수 (의사 목록, 치료 항목 등)
├── App.tsx              # 메인 애플리케이션
├── index.tsx            # 엔트리 포인트
├── supabase-setup.sql   # 데이터베이스 스키마
├── .env.local           # 환경 변수 (Git 무시)
├── .env.example         # 환경 변수 예시
└── README.md            # 이 파일
```

## 데이터베이스 스키마

### 주요 테이블
- `patients` - 환자 정보
- `reservations` - 예약 정보
- `reservation_treatments` - 예약별 치료 항목
- `payments` - 결제 정보
- `patient_default_treatments` - 환자별 기본 치료
- `acting_queue_items` - 의사별 대기 큐
- `user_profiles` - 사용자 프로필

자세한 스키마: [supabase-setup.sql](./supabase-setup.sql) 참고

## 비용 예상 (15명 동시 접속, 100명/일)

### 초기 1-2년: **$0/월** 🎉
- Supabase Free: 500MB DB, 무제한 API
- Vercel Hobby: 100GB 대역폭

### 성장 후: **$25-45/월**
- Supabase Pro: $25/월 (8GB DB)
- Vercel Hobby: $0 (계속 무료)

## 보안

### 구현된 보안 기능
- ✅ Row Level Security (RLS) 활성화
- ✅ 환경 변수로 API Key 관리
- ✅ HTTPS 자동 적용 (Vercel)
- ✅ Soft Delete (환자 정보 복구 가능)
- ✅ SQL Injection 방지 (Supabase ORM)

### 보안 권장사항
- 🔐 강력한 비밀번호 사용
- 🔐 정기적인 데이터 백업
- 🔐 접근 권한 최소화
- 🔐 HTTPS만 사용
- 🔐 개인정보 처리방침 준수

## 브라우저 지원

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 문제 해결

### "Invalid API key" 오류
- `.env.local` 파일 확인
- Supabase 대시보드에서 키 재확인
- 개발 서버 재시작

### 데이터가 표시되지 않음
- Supabase Table Editor에서 데이터 확인
- 브라우저 콘솔에서 네트워크 오류 확인
- RLS 정책 확인

### 빌드 실패
```bash
# 캐시 삭제 후 재시도
rm -rf node_modules dist
npm install
npm run build
```

## 개발 로드맵

### v1.1 (계획 중)
- [ ] 통계 대시보드
- [ ] 진료 기록 상세 저장
- [ ] 문자 알림 (예약 확인)
- [ ] 모바일 최적화

### v1.2 (계획 중)
- [ ] 재고 관리 (약재)
- [ ] 직원 근태 관리
- [ ] Excel 보고서 내보내기
- [ ] 다국어 지원

## 라이선스

이 프로젝트는 개인/상업적 사용이 가능합니다.

## 지원 및 문의

- 📧 이메일: your-email@example.com
- 🐛 버그 리포트: [GitHub Issues](https://github.com/YOUR_USERNAME/hani-man-system/issues)
- 📖 문서: [Wiki](https://github.com/YOUR_USERNAME/hani-man-system/wiki)

## 기여

기여는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 감사의 말

- [Supabase](https://supabase.com) - 훌륭한 BaaS 플랫폼
- [Vercel](https://vercel.com) - 간편한 배포
- [React](https://react.dev) - UI 라이브러리
- [Vite](https://vitejs.dev) - 빠른 빌드 도구

---

**Made with ❤️ for 한의원**
