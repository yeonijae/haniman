# 차트 관리 기능 통합 가이드

hani-man 시스템에 **초진차트, 진단기록, 경과기록** 기능이 추가되었습니다.

## ✅ 이미 완료된 작업

### 1. 데이터베이스 스키마 추가
- `supabase-setup.sql`에 3개 테이블 추가됨:
  - `initial_charts` (초진차트)
  - `diagnoses` (진단기록)
  - `progress_notes` (경과기록 - SOAP 형식)

### 2. TypeScript 타입 정의
- `types.ts`에 차트 관련 인터페이스 추가됨:
  - `InitialChart`, `Diagnosis`, `ProgressNote`
  - `VitalSigns`, `ReviewOfSystems`, `PhysicalExamination`

### 3. React 컴포넌트 생성
- `components/InitialChartView.tsx` - 초진차트 보기/작성/수정
- `components/DiagnosisListView.tsx` - 진단기록 목록 관리
- `components/ProgressNoteView.tsx` - SOAP 노트 작성/조회

---

## 📋 다음 단계: Supabase에 테이블 생성

### 1. Supabase 대시보드 접속
1. [Supabase](https://supabase.com) 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2. SQL 스크립트 실행
`supabase-setup.sql` 파일의 **365번째 줄부터 끝까지** 복사하여 SQL Editor에 붙여넣기:

```sql
-- 차트 관리 테이블 추가 섹션 (365줄~514줄)
-- 13. initial_charts 테이블
-- 14. diagnoses 테이블
-- 15. progress_notes 테이블
```

**Run 버튼** 클릭하여 실행합니다.

### 3. 테이블 생성 확인
- Table Editor에서 `initial_charts`, `diagnoses`, `progress_notes` 테이블 확인
- 각 테이블에 RLS 정책이 활성화되어 있는지 확인

---

## 🔌 App.tsx에 차트 기능 통합하기

### 방법 1: 환자 검색에 차트 버튼 추가 (추천)

`components/PatientSearch.tsx` 파일 수정:

#### 1단계: import 추가
```typescript
import InitialChartView from './InitialChartView';
import DiagnosisListView from './DiagnosisListView';
import ProgressNoteView from './ProgressNoteView';
```

#### 2단계: state 추가 (약 24번째 줄 근처)
```typescript
const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
const [chartView, setChartView] = useState<'initial' | 'diagnosis' | 'progress' | null>(null);
```

#### 3단계: 환자 상세 보기에 버튼 추가
환자 상세 화면에서 "진료 대기 추가", "치료 대기 추가" 버튼 근처에 다음 코드 추가:

```typescript
{/* 차트 관리 버튼 */}
<div className="flex gap-2 mt-4">
  <button
    onClick={() => setChartView('initial')}
    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    📋 초진차트
  </button>
  <button
    onClick={() => setChartView('diagnosis')}
    className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
  >
    🩺 진단기록
  </button>
  <button
    onClick={() => setChartView('progress')}
    className="flex-1 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
  >
    📝 경과기록
  </button>
</div>
```

#### 4단계: 컴포넌트 렌더링 (return 문 끝에 추가)
```typescript
{/* 차트 모달 */}
{chartView === 'initial' && selectedPatient && (
  <InitialChartView
    patientId={selectedPatient.id}
    patientName={selectedPatient.name}
    onClose={() => setChartView(null)}
  />
)}

{chartView === 'diagnosis' && selectedPatient && (
  <DiagnosisListView
    patientId={selectedPatient.id}
    patientName={selectedPatient.name}
    onClose={() => setChartView(null)}
  />
)}

{chartView === 'progress' && selectedPatient && (
  <ProgressNoteView
    patientId={selectedPatient.id}
    patientName={selectedPatient.name}
    onClose={() => setChartView(null)}
  />
)}
```

---

### 방법 2: Header에 메뉴 추가

`components/Header.tsx`에 "차트관리" 메뉴를 추가하고 싶다면:

#### 1단계: ViewType 수정
```typescript
export type ViewType = 'dashboard' | 'treatment' | 'acting' | 'chart';
```

#### 2단계: 메뉴 버튼 추가
```typescript
<button
  onClick={() => handleViewChange('chart')}
  className={/* 스타일링 */}
>
  📋 차트관리
</button>
```

#### 3단계: App.tsx에 차트 뷰 추가
```typescript
{currentView === 'chart' && (
  <div>
    {/* 환자 선택 UI + 차트 컴포넌트 */}
  </div>
)}
```

---

## 📊 기능 설명

### 1. 초진차트 (InitialChartView)
- **환자당 1개만** 생성 가능
- 주호소, 현병력, 과거력, 가족력, 사회력 등 상세 기록
- 작성/조회/수정 기능

### 2. 진단기록 (DiagnosisListView)
- 환자별로 **여러 진단 누적** 가능
- ICD 코드, 진단명, 상태(활성/완치/만성), 심각도
- 목록 보기, 추가, 수정, 삭제 기능

### 3. 경과기록 (ProgressNoteView)
- **SOAP 형식** (Subjective, Objective, Assessment, Plan)
- 날짜별 경과 관찰 및 치료 계획
- 좌측 목록, 우측 상세 보기 레이아웃

---

## 🎨 UI 특징

- **모달 방식**: 기존 hani-man 스타일 유지
- **실시간 동기화**: Supabase Realtime (필요시 활성화)
- **반응형 디자인**: 모바일/태블릿 대응
- **색상 구분**: SOAP 노트는 색상으로 섹션 구분

---

## 🔧 추가 커스터마이징

### 의사 이름 자동 입력
현재 `doctor_name` 필드는 수동 입력입니다. 자동화하려면:

```typescript
const formData = {
  ...formData,
  doctor_name: currentUser?.name || '담당의'
};
```

### Realtime 동기화
여러 사용자가 동시에 사용하는 경우, Supabase Realtime 활성화:

1. Supabase 대시보드 → Database → Replication
2. `initial_charts`, `diagnoses`, `progress_notes` 테이블 활성화
3. 컴포넌트에서 구독:

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('diagnoses-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'diagnoses',
      filter: `patient_id=eq.${patientId}`
    }, loadDiagnoses)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [patientId]);
```

---

## 🚀 빠른 테스트

1. 환자 검색에서 아무 환자 선택
2. "초진차트" 버튼 클릭
3. 초진차트 작성 후 저장
4. "진단기록" 버튼 클릭하여 진단 추가
5. "경과기록" 버튼 클릭하여 SOAP 노트 작성

---

## 📝 참고사항

- 모든 차트 데이터는 Supabase PostgreSQL에 저장됩니다
- RLS 정책으로 보안이 적용되어 있습니다
- `patient_id`로 환자와 연결되므로, 환자 삭제 시 관련 차트도 자동 삭제됩니다 (CASCADE)

---

## 문제 해결

### 에러: "relation 'initial_charts' does not exist"
→ Supabase SQL Editor에서 스키마를 실행하지 않았습니다. 위의 "다음 단계" 참조

### 차트가 저장되지 않음
→ 브라우저 콘솔(F12)에서 에러 확인
→ Supabase 대시보드 → Table Editor에서 RLS 정책 확인

### 타입 오류
→ `npm install` 또는 `yarn install` 실행
→ 개발 서버 재시작

---

작업이 완료되었습니다! 차트 관리 기능을 사용하려면 위의 통합 단계를 따라주세요.
