# Supabase 설정 가이드

한의원 관리 시스템을 Supabase와 연동하는 단계별 가이드입니다.

## 1. Supabase 프로젝트 생성

### 1.1 회원가입 및 로그인
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인 (또는 이메일 회원가입)

### 1.2 새 프로젝트 생성
1. "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `hani-man` (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 생성 (저장해두기!)
   - **Region**: `Southeast Asia (Singapore)` 선택 (한국에서 가장 가까움)
   - **Pricing Plan**: `Free` 선택
3. "Create new project" 클릭
4. 프로젝트 생성 완료까지 2-3분 대기

## 2. 데이터베이스 테이블 생성

### 2.1 SQL Editor 열기
1. 왼쪽 사이드바에서 "SQL Editor" 클릭
2. "New query" 클릭

### 2.2 테이블 생성 SQL 실행
1. 프로젝트 루트의 `supabase-setup.sql` 파일 열기
2. 전체 내용 복사
3. Supabase SQL Editor에 붙여넣기
4. "Run" 버튼 클릭 (또는 Ctrl/Cmd + Enter)
5. 하단에 "Success. No rows returned" 메시지 확인

### 2.3 테이블 확인
1. 왼쪽 사이드바에서 "Table Editor" 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ patients
   - ✅ reservations
   - ✅ reservation_treatments
   - ✅ payments
   - ✅ patient_default_treatments
   - ✅ acting_queue_items
   - ✅ user_profiles

## 3. API 키 확인 및 설정

### 3.1 API 키 확인
1. 왼쪽 사이드바 하단 "Project Settings" (톱니바퀴 아이콘) 클릭
2. "API" 메뉴 클릭
3. 다음 정보 확인:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (매우 긴 문자열)

### 3.2 환경 변수 설정
1. 프로젝트 루트의 `.env.local` 파일 열기
2. 다음 내용 수정:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. `your-project.supabase.co`를 실제 Project URL로 변경
4. `eyJhbGciOi...`를 실제 anon public key로 변경
5. 파일 저장

⚠️ **중요**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

## 4. 사용자 인증 설정 (선택사항)

### 4.1 Authentication 설정
1. 왼쪽 사이드바에서 "Authentication" 클릭
2. "Users" 탭에서 "Add user" 클릭
3. 테스트 사용자 생성:
   - Email: `admin@haniman.com`
   - Password: 안전한 비밀번호
   - Auto Confirm User: ✅ 체크
4. "Create user" 클릭

### 4.2 Email 템플릿 설정 (운영 환경)
1. "Email Templates" 탭 클릭
2. 한국어로 변경 가능 (선택사항)

## 5. 로컬 테스트

### 5.1 개발 서버 실행
```bash
npm run dev
```

### 5.2 브라우저 열기
- http://localhost:5173 접속
- 로그인 화면 확인
- 테스트 계정으로 로그인
- 환자 데이터 확인

### 5.3 데이터베이스 확인
1. Supabase Table Editor로 이동
2. `patients` 테이블 클릭
3. 샘플 데이터 5개 확인

## 6. 문제 해결

### 환경 변수 인식 안 됨
```bash
# 개발 서버 재시작
npm run dev
```

### "Invalid API key" 오류
- `.env.local` 파일의 키가 올바른지 확인
- Supabase 대시보드에서 키 다시 복사
- 개발 서버 재시작

### 데이터 조회 안 됨
- Supabase Table Editor에서 테이블 확인
- Row Level Security (RLS) 정책 확인
- 브라우저 콘솔에서 에러 메시지 확인

### CORS 오류
- Supabase는 기본적으로 모든 origin 허용
- 문제 발생 시 Settings > API > CORS 설정 확인

## 7. 다음 단계

- ✅ Supabase 설정 완료
- ⏭️ Vercel 배포 (VERCEL_DEPLOYMENT_GUIDE.md 참고)
- ⏭️ 운영 환경 모니터링

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

## 비용 및 제한 사항

### Free 티어 제한
- ✅ 500MB 데이터베이스
- ✅ 1GB 파일 스토리지
- ✅ 50,000 월간 활성 사용자
- ✅ 무제한 API 요청
- ✅ 200 동시 연결

### 예상 사용량 (하루 100명)
- 데이터: ~1MB/일 = ~365MB/년
- **결론**: 1-2년은 무료 사용 가능

### 업그레이드가 필요한 경우
- Pro 플랜: $25/월
- 8GB DB, 100GB 스토리지
- 500 동시 연결
