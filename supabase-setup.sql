-- =====================================================
-- 한의원 관리 시스템 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. patients 테이블 (환자 정보)
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  chart_number VARCHAR(50) UNIQUE,
  dob DATE,
  gender VARCHAR(10),
  phone VARCHAR(20),
  address TEXT,
  referral_path VARCHAR(100),
  registration_date DATE DEFAULT CURRENT_DATE,
  deletion_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_patients_chart_number ON patients(chart_number);
CREATE INDEX idx_patients_deletion_date ON patients(deletion_date);

-- 2. reservations 테이블 (예약)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  doctor VARCHAR(50) NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_patient ON reservations(patient_id);
CREATE INDEX idx_reservations_doctor ON reservations(doctor, reservation_date);

-- 3. reservation_treatments 테이블 (예약별 치료 항목)
CREATE TABLE IF NOT EXISTS reservation_treatments (
  id SERIAL PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  treatment_name VARCHAR(50) NOT NULL,
  acting INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_reservation_treatments_reservation ON reservation_treatments(reservation_id);

-- 4. payments 테이블 (결제)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  total_amount INTEGER,
  paid_amount INTEGER,
  remaining_amount INTEGER,
  payment_methods JSONB,
  treatment_items JSONB,
  payment_date TIMESTAMP DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_completed ON payments(is_completed);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- 5. patient_default_treatments 테이블 (환자별 기본 치료)
CREATE TABLE IF NOT EXISTS patient_default_treatments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  treatment_name VARCHAR(50) NOT NULL,
  duration INTEGER NOT NULL,
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_default_treatments_patient ON patient_default_treatments(patient_id);

-- 6. acting_queue_items 테이블 (대타 관리)
CREATE TABLE IF NOT EXISTS acting_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor VARCHAR(50) NOT NULL,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  acting_type VARCHAR(20) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  source VARCHAR(20) NOT NULL,
  memo TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_acting_queue_doctor ON acting_queue_items(doctor, position);

-- 7. users 테이블 (사용자/직원 - Supabase Auth와 연동)
-- Supabase Auth를 사용하면 auth.users 테이블이 자동으로 생성되므로
-- 추가 정보만 별도 테이블로 관리
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  affiliation VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS) 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_default_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE acting_queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 모든 데이터 읽기/쓰기 가능 (기본 정책)
-- 실제 운영 시에는 더 세밀한 권한 설정 필요

CREATE POLICY "Enable read access for authenticated users" ON patients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON patients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON patients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON patients
  FOR DELETE TO authenticated USING (true);

-- reservations 정책
CREATE POLICY "Enable all access for authenticated users" ON reservations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- reservation_treatments 정책
CREATE POLICY "Enable all access for authenticated users" ON reservation_treatments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- payments 정책
CREATE POLICY "Enable all access for authenticated users" ON payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- patient_default_treatments 정책
CREATE POLICY "Enable all access for authenticated users" ON patient_default_treatments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- acting_queue_items 정책
CREATE POLICY "Enable all access for authenticated users" ON acting_queue_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- user_profiles 정책
CREATE POLICY "Enable read access for authenticated users" ON user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for own profile" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =====================================================
-- 샘플 데이터 삽입 (테스트용)
-- =====================================================

-- 환자 샘플 데이터
INSERT INTO patients (name, chart_number, dob, gender, phone, address, referral_path, registration_date) VALUES
('김민준', 'C001', '1985-03-15', 'male', '010-1111-2222', '서울시 강남구 테헤란로 123', '인터넷 검색', '2023-01-10'),
('이서연', 'C002', '1992-07-22', 'female', '010-3333-4444', '서울시 서초구 서초대로 456', '지인소개', '2023-02-20'),
('박하준', 'C003', '1978-11-02', 'male', '010-5555-6666', '경기도 성남시 분당구 판교역로 789', '블로그', '2023-03-05'),
('최지우', 'C004', '2001-01-20', 'female', '010-7777-8888', '인천광역시 연수구 송도국제대로 123', '인스타그램', '2023-04-12'),
('정시우', 'C005', '1995-05-10', 'male', '010-9999-0000', '서울시 마포구 월드컵북로 456', '지인소개', '2023-05-18')
ON CONFLICT DO NOTHING;

-- 기본 치료 샘플 데이터
INSERT INTO patient_default_treatments (patient_id, treatment_name, duration, memo) VALUES
(4, '견인', 10, '목 디스크'),
(4, '초음파', 5, '오른쪽 손목'),
(4, '충격파', 20, '어깨 회전근')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 관리자 페이지 테이블 추가
-- =====================================================

-- 8. medical_staff 테이블 (의료진 관리)
CREATE TABLE IF NOT EXISTS medical_staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(10) NOT NULL,
  hire_date DATE NOT NULL,
  fire_date DATE,
  status VARCHAR(20) DEFAULT 'working',
  permissions JSONB NOT NULL DEFAULT '{"prescription": false, "chart": false, "payment": false, "statistics": false}',
  work_patterns JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_medical_staff_status ON medical_staff(status);
CREATE INDEX idx_medical_staff_name ON medical_staff(name);

-- 9. staff 테이블 (스태프 관리)
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(10) NOT NULL,
  hire_date DATE NOT NULL,
  fire_date DATE,
  status VARCHAR(20) DEFAULT 'working',
  rank VARCHAR(20) NOT NULL,
  department VARCHAR(20) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"decoction": false, "patient": false, "herbalMedicine": false, "payment": false, "inventory": false, "board": false, "treatmentRoom": false}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_department ON staff(department);

-- 10. uncovered_categories 테이블 (비급여 진료 카테고리)
CREATE TABLE IF NOT EXISTS uncovered_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_uncovered_categories_name ON uncovered_categories(category_name);

-- RLS 활성화
ALTER TABLE medical_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE uncovered_categories ENABLE ROW LEVEL SECURITY;

-- medical_staff 정책
CREATE POLICY "Enable all access for authenticated users" ON medical_staff
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- staff 정책
CREATE POLICY "Enable all access for authenticated users" ON staff
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- uncovered_categories 정책
CREATE POLICY "Enable all access for authenticated users" ON uncovered_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- anon 사용자를 위한 정책 (개발 환경용)
CREATE POLICY "Enable all access for anon users" ON medical_staff
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON staff
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON uncovered_categories
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================
-- 치료실 관리 테이블 추가
-- =====================================================

-- 11. treatment_rooms 테이블 (치료실 관리)
CREATE TABLE IF NOT EXISTS treatment_rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT '사용가능',
  session_id VARCHAR(50),
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  patient_name VARCHAR(100),
  patient_chart_number VARCHAR(50),
  doctor_name VARCHAR(50),
  in_time TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_treatment_rooms_status ON treatment_rooms(status);
CREATE INDEX IF NOT EXISTS idx_treatment_rooms_patient ON treatment_rooms(patient_id);

-- 12. session_treatments 테이블 (세션별 치료 항목)
CREATE TABLE IF NOT EXISTS session_treatments (
  id VARCHAR(50) PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  room_id INTEGER REFERENCES treatment_rooms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  duration INTEGER NOT NULL,
  start_time TIMESTAMP,
  elapsed_seconds INTEGER DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_session_treatments_session ON session_treatments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_treatments_room ON session_treatments(room_id);

-- RLS 활성화
ALTER TABLE treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_treatments ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON treatment_rooms;
DROP POLICY IF EXISTS "Enable all access for anon users" ON treatment_rooms;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON session_treatments;
DROP POLICY IF EXISTS "Enable all access for anon users" ON session_treatments;

-- treatment_rooms 정책
CREATE POLICY "Enable all access for authenticated users" ON treatment_rooms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON treatment_rooms
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- session_treatments 정책
CREATE POLICY "Enable all access for authenticated users" ON session_treatments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON session_treatments
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Realtime 활성화 (실시간 동기화를 위해)
-- Supabase 대시보드에서 수동으로 활성화해야 합니다:
-- Database > Publications > supabase_realtime 에서 treatment_rooms, session_treatments 테이블 추가

-- 초기 치료실 데이터 삽입
INSERT INTO treatment_rooms (id, name, status) VALUES
(1, '1-1', '사용가능'),
(2, '1-2', '사용가능'),
(3, '1-3', '사용가능'),
(4, '1-4', '사용가능'),
(5, '1-5', '사용가능'),
(6, '2-1', '사용가능'),
(7, '2-2', '사용가능'),
(8, '2-3', '사용가능'),
(9, '2-4', '사용가능'),
(10, '2-5', '사용가능'),
(11, '2-6', '사용가능'),
(12, '2-7', '사용가능'),
(13, '2-8', '사용가능'),
(14, '3-1', '사용가능'),
(15, '3-2', '사용가능'),
(16, '4-1', '사용가능'),
(17, '4-2', '사용가능')
ON CONFLICT DO NOTHING;

-- id 시퀀스 재설정 (다음 자동 생성 ID가 18부터 시작하도록)
SELECT setval('treatment_rooms_id_seq', 17, true);

-- =====================================================
-- 차트 관리 테이블 추가 (초진차트, 진단기록, 경과기록)
-- =====================================================

-- 13. initial_charts 테이블 (초진차트)
CREATE TABLE IF NOT EXISTS initial_charts (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name VARCHAR(100),
  chart_date TIMESTAMP NOT NULL DEFAULT NOW(),
  chief_complaint TEXT,
  present_illness TEXT,
  past_medical_history TEXT,
  past_surgical_history TEXT,
  family_history TEXT,
  social_history TEXT,
  medications TEXT,
  allergies TEXT,
  review_of_systems JSONB,
  physical_examination JSONB,
  initial_diagnosis TEXT,
  initial_plan TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_initial_charts_patient ON initial_charts(patient_id);

-- 14. diagnoses 테이블 (진단기록 - 누적)
CREATE TABLE IF NOT EXISTS diagnoses (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name VARCHAR(100),
  diagnosis_date TIMESTAMP NOT NULL DEFAULT NOW(),
  icd_code VARCHAR(20),
  diagnosis_name VARCHAR(255) NOT NULL,
  diagnosis_type VARCHAR(50) CHECK (diagnosis_type IN ('primary', 'secondary', 'differential')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic', 'ruled-out')),
  onset_date DATE,
  resolved_date DATE,
  severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_status ON diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_diagnoses_date ON diagnoses(diagnosis_date);

-- 15. progress_notes 테이블 (경과기록 - SOAP 형식)
CREATE TABLE IF NOT EXISTS progress_notes (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name VARCHAR(100),
  note_date TIMESTAMP NOT NULL DEFAULT NOW(),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  vital_signs JSONB,
  follow_up_plan TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_progress_notes_patient ON progress_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_date ON progress_notes(note_date);

-- RLS 활성화
ALTER TABLE initial_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_notes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON initial_charts;
DROP POLICY IF EXISTS "Enable all access for anon users" ON initial_charts;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON diagnoses;
DROP POLICY IF EXISTS "Enable all access for anon users" ON diagnoses;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON progress_notes;
DROP POLICY IF EXISTS "Enable all access for anon users" ON progress_notes;

-- initial_charts 정책
CREATE POLICY "Enable all access for authenticated users" ON initial_charts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON initial_charts
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- diagnoses 정책
CREATE POLICY "Enable all access for authenticated users" ON diagnoses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON diagnoses
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- progress_notes 정책
CREATE POLICY "Enable all access for authenticated users" ON progress_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON progress_notes
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_initial_charts_updated_at ON initial_charts;
CREATE TRIGGER update_initial_charts_updated_at
  BEFORE UPDATE ON initial_charts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diagnoses_updated_at ON diagnoses;
CREATE TRIGGER update_diagnoses_updated_at
  BEFORE UPDATE ON diagnoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_progress_notes_updated_at ON progress_notes;
CREATE TRIGGER update_progress_notes_updated_at
  BEFORE UPDATE ON progress_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 완료!
-- =====================================================

-- 확인 쿼리
SELECT 'patients' as table_name, COUNT(*) as count FROM patients
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'initial_charts', COUNT(*) FROM initial_charts
UNION ALL
SELECT 'diagnoses', COUNT(*) FROM diagnoses
UNION ALL
SELECT 'progress_notes', COUNT(*) FROM progress_notes;
