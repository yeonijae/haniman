# 빠른 시작 가이드 - 웹 서비스 배포하기

15분 만에 한의원 관리 시스템을 웹에 배포하는 가이드입니다.

## ✅ 체크리스트

배포 전 확인:
- [ ] Node.js 설치됨
- [ ] 이메일 계정 준비 (Supabase, Vercel, GitHub)
- [ ] 프로젝트가 로컬에서 정상 작동

## 🚀 3단계 배포

### Step 1: Supabase 설정 (5분)

1. **Supabase 가입 및 프로젝트 생성**
   ```
   1. https://supabase.com 접속
   2. "Start your project" → GitHub로 로그인
   3. "New Project" 클릭
   4. 정보 입력:
      - Name: hani-man
      - Password: [강력한 비밀번호 - 저장해두세요!]
      - Region: Southeast Asia (Singapore)
      - Plan: Free
   5. "Create new project" 클릭
   6. 2분 대기...
   ```

2. **데이터베이스 테이블 생성**
   ```
   1. 왼쪽 사이드바 "SQL Editor" 클릭
   2. "New query" 클릭
   3. 프로젝트 폴더의 supabase-setup.sql 파일 열기
   4. 전체 복사하여 SQL Editor에 붙여넣기
   5. "Run" 버튼 클릭
   6. "Success" 메시지 확인
   ```

3. **API 키 복사**
   ```
   1. 왼쪽 하단 톱니바퀴 아이콘 (Settings) 클릭
   2. "API" 메뉴 클릭
   3. 다음 2개 정보 복사:
      - Project URL: https://xxxxx.supabase.co
      - anon public key: eyJhbGci...
   ```

4. **환경 변수 설정**
   ```
   프로젝트의 .env.local 파일 열기:

   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...

   위에서 복사한 값으로 변경 후 저장
   ```

### Step 2: GitHub에 업로드 (3분)

1. **GitHub 저장소 생성**
   ```
   1. https://github.com 로그인
   2. 우측 상단 "+" → "New repository"
   3. 정보 입력:
      - Name: hani-man-system
      - Privacy: Private (중요!)
      - Initialize 체크 안 함
   4. "Create repository" 클릭
   ```

2. **Git 업로드**
   ```bash
   # 터미널/명령 프롬프트에서 프로젝트 폴더로 이동
   cd C:\Users\crimm\Documents\project\hani-man-ver1.0

   # Git 초기화
   git init
   git add .
   git commit -m "Initial commit: Supabase integration"

   # GitHub 연결 (YOUR_USERNAME을 본인 계정으로 변경)
   git remote add origin https://github.com/YOUR_USERNAME/hani-man-system.git
   git branch -M main
   git push -u origin main
   ```

   💡 **Git 처음 사용하시나요?**
   ```bash
   # Git 사용자 정보 설정 (처음 한 번만)
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### Step 3: Vercel 배포 (7분)

1. **Vercel 가입**
   ```
   1. https://vercel.com 접속
   2. "Start Deploying" 클릭
   3. "Continue with GitHub" 선택
   4. GitHub 계정으로 로그인
   5. Vercel에 GitHub 접근 권한 허용
   ```

2. **프로젝트 Import**
   ```
   1. Vercel 대시보드에서 "Add New..." → "Project"
   2. GitHub 저장소 목록에서 "hani-man-system" 찾기
   3. "Import" 클릭
   ```

3. **배포 설정**
   ```
   Configure Project 화면에서:

   ✅ Framework Preset: Vite (자동 감지)

   📝 Environment Variables 클릭하여 추가:

   Name: VITE_SUPABASE_URL
   Value: [.env.local의 URL 복사]

   Name: VITE_SUPABASE_ANON_KEY
   Value: [.env.local의 KEY 복사]
   ```

4. **배포 시작**
   ```
   1. "Deploy" 버튼 클릭
   2. 1-2분 대기 (빌드 진행 상황 확인)
   3. "Congratulations!" 화면 확인
   4. 배포 URL 클릭: https://your-project.vercel.app
   ```

## 🎉 완료!

웹사이트가 배포되었습니다!

### 배포 URL
```
https://your-project.vercel.app
```

### 로그인 정보
```
ID: admin
Password: 7582
```

## ⚡ 빠른 테스트

1. 배포된 사이트 접속
2. 위 로그인 정보로 로그인
3. 환자 검색 → 샘플 데이터 확인
4. 새 환자 등록 테스트
5. 브라우저 새로고침 → 데이터 유지 확인 ✅

## 🔄 코드 업데이트 방법

코드를 수정한 후:
```bash
git add .
git commit -m "수정 내용 설명"
git push origin main
```

→ Vercel이 자동으로 재배포 (1-2분 소요)

## 📊 다음 단계

### 1. 실제 사용자 등록
- Supabase Dashboard → Authentication → Users
- "Add user" 클릭하여 직원 계정 생성

### 2. 샘플 데이터 삭제
- Supabase Dashboard → Table Editor
- patients 테이블에서 샘플 데이터 삭제

### 3. 도메인 연결 (선택)
- Vercel Project Settings → Domains
- 커스텀 도메인 추가 (예: clinic.com)

### 4. 데이터 백업 설정
- Supabase Dashboard → Database → Backups
- 자동 백업 활성화

## ❓ 문제 발생 시

### "Invalid API key" 오류
→ Vercel 환경 변수 재확인 후 Redeploy

### 로그인 안 됨
→ 브라우저 콘솔(F12) 확인, Supabase 테이블 확인

### 빌드 실패
→ Vercel Deployment 로그 확인

## 📞 도움이 필요하신가요?

- 📖 [상세 Supabase 가이드](./SUPABASE_SETUP_GUIDE.md)
- 📖 [상세 Vercel 가이드](./VERCEL_DEPLOYMENT_GUIDE.md)
- 📖 [전체 README](./README.md)

---

**소요 시간**: 총 ~15분
**비용**: $0/월 (무료!)
**동시 접속**: 15명 가능
**데이터**: 하루 100명 환자 처리 가능
