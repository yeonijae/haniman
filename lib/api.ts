import { supabase } from './supabaseClient';
import { Patient, Reservation, Payment, DefaultTreatment, Acting, CompletedPayment, MedicalStaff, Staff, UncoveredCategories, TreatmentRoom, SessionTreatment, TreatmentItem } from '../types';

/**
 * 환자 관련 API
 */

// 모든 환자 조회 (삭제되지 않은)
export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .is('deletion_date', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('환자 조회 오류:', error);
    throw error;
  }

  // DB 데이터를 앱의 Patient 타입으로 변환
  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    chartNumber: p.chart_number || '',
    status: 'COMPLETED' as any, // 상태는 런타임에서 관리
    time: '',
    details: '',
    dob: p.dob || undefined,
    gender: p.gender as 'male' | 'female' | undefined,
    phone: p.phone || undefined,
    address: p.address || undefined,
    referralPath: p.referral_path || undefined,
    registrationDate: p.registration_date || undefined,
  }));
}

// 삭제된 환자 조회
export async function fetchDeletedPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .not('deletion_date', 'is', null)
    .order('deletion_date', { ascending: false });

  if (error) {
    console.error('삭제된 환자 조회 오류:', error);
    throw error;
  }

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    chartNumber: p.chart_number || '',
    status: 'COMPLETED' as any,
    time: '',
    details: '',
    dob: p.dob || undefined,
    gender: p.gender as 'male' | 'female' | undefined,
    phone: p.phone || undefined,
    address: p.address || undefined,
    referralPath: p.referral_path || undefined,
    registrationDate: p.registration_date || undefined,
    deletionDate: p.deletion_date || undefined,
  }));
}

// 환자 생성
export async function createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert({
      name: patient.name,
      chart_number: patient.chartNumber || null,
      dob: patient.dob || null,
      gender: patient.gender || null,
      phone: patient.phone || null,
      address: patient.address || null,
      referral_path: patient.referralPath || null,
      registration_date: patient.registrationDate || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    console.error('환자 생성 오류:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    chartNumber: data.chart_number || '',
    status: patient.status,
    time: patient.time,
    details: patient.details,
    dob: data.dob || undefined,
    gender: data.gender as 'male' | 'female' | undefined,
    phone: data.phone || undefined,
    address: data.address || undefined,
    referralPath: data.referral_path || undefined,
    registrationDate: data.registration_date || undefined,
  };
}

// 환자 정보 수정
export async function updatePatient(patientId: number, updates: Partial<Patient>): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({
      name: updates.name,
      chart_number: updates.chartNumber || null,
      dob: updates.dob || null,
      gender: updates.gender || null,
      phone: updates.phone || null,
      address: updates.address || null,
      referral_path: updates.referralPath || null,
    })
    .eq('id', patientId);

  if (error) {
    console.error('환자 정보 수정 오류:', error);
    throw error;
  }
}

// 환자 삭제 (soft delete)
export async function deletePatient(patientId: number): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ deletion_date: new Date().toISOString() })
    .eq('id', patientId);

  if (error) {
    console.error('환자 삭제 오류:', error);
    throw error;
  }
}

// 환자 복구
export async function restorePatient(patientId: number): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ deletion_date: null })
    .eq('id', patientId);

  if (error) {
    console.error('환자 복구 오류:', error);
    throw error;
  }
}

/**
 * 환자 기본 치료 관련 API
 */

// 환자의 기본 치료 조회
export async function fetchPatientDefaultTreatments(patientId: number): Promise<DefaultTreatment[]> {
  const { data, error } = await supabase
    .from('patient_default_treatments')
    .select('*')
    .eq('patient_id', patientId);

  if (error) {
    console.error('기본 치료 조회 오류:', error);
    throw error;
  }

  return (data || []).map((t) => ({
    name: t.treatment_name,
    duration: t.duration,
    memo: t.memo || '',
  }));
}

// 환자 기본 치료 저장
export async function savePatientDefaultTreatments(
  patientId: number,
  treatments: DefaultTreatment[]
): Promise<void> {
  // 기존 기본 치료 삭제
  await supabase.from('patient_default_treatments').delete().eq('patient_id', patientId);

  // 새로운 기본 치료 추가
  if (treatments.length > 0) {
    const { error } = await supabase.from('patient_default_treatments').insert(
      treatments.map((t) => ({
        patient_id: patientId,
        treatment_name: t.name,
        duration: t.duration,
        memo: t.memo || null,
      }))
    );

    if (error) {
      console.error('기본 치료 저장 오류:', error);
      throw error;
    }
  }
}

/**
 * 예약 관련 API
 */

// 예약 조회 (특정 기간)
export async function fetchReservations(params: { startDate: string; endDate: string }): Promise<any[]> {
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('*')
    .gte('reservation_date', params.startDate)
    .lte('reservation_date', params.endDate)
    .order('reservation_date', { ascending: true });

  if (resError) {
    console.error('예약 조회 오류:', resError);
    throw resError;
  }

  return reservations || [];
}

// 예약 생성
export async function createReservation(reservation: any): Promise<string> {
  console.log('🔍 예약 생성 시도:', reservation);

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      patient_id: reservation.patientId,
      doctor: reservation.doctor,
      reservation_date: reservation.reservationDate,
      reservation_time: reservation.reservationTime,
      status: reservation.status || 'confirmed',
      memo: reservation.memo || null,
    })
    .select()
    .single();

  if (error) {
    console.error('예약 생성 오류:', error);
    console.error('예약 생성 상세 오류:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('✅ 예약 생성 성공, ID:', data.id);
  return data.id;
}

// 예약 상태 변경
export async function updateReservationStatus(reservationId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', reservationId);

  if (error) {
    console.error('예약 상태 변경 오류:', error);
    throw error;
  }
}

// 예약 삭제
export async function deleteReservation(reservationId: string): Promise<void> {
  // 치료 항목 먼저 삭제
  await supabase.from('reservation_treatments').delete().eq('reservation_id', reservationId);

  // 예약 삭제
  const { error } = await supabase.from('reservations').delete().eq('id', reservationId);

  if (error) {
    console.error('예약 삭제 오류:', error);
    throw error;
  }
}

// 예약 업데이트 (일반)
export async function updateReservation(reservationId: string, updates: any): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', reservationId);

  if (error) {
    console.error('예약 업데이트 오류:', error);
    throw error;
  }
}

// 예약의 치료 항목 조회
export async function fetchReservationTreatments(reservationId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('reservation_treatments')
    .select('*')
    .eq('reservation_id', reservationId)
    .order('id', { ascending: true });

  if (error) {
    console.error('예약 치료 항목 조회 오류:', error);
    throw error;
  }

  return data.map(item => ({
    name: item.treatment_name,
    acting: item.acting || 0,
  }));
}

// 예약에 치료 항목 추가
export async function addReservationTreatments(reservationId: string, treatments: any[]): Promise<void> {
  console.log('🔍 치료 항목 추가 시도:', reservationId, treatments);

  const treatmentData = treatments.map(t => ({
    reservation_id: reservationId,
    treatment_name: t.name,
    acting: t.acting,
  }));

  const { error } = await supabase
    .from('reservation_treatments')
    .insert(treatmentData);

  if (error) {
    console.error('예약 치료 항목 추가 오류:', error);
    console.error('예약 치료 항목 상세 오류:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('✅ 치료 항목 추가 성공');
}

// 예약의 치료 항목 삭제
export async function deleteReservationTreatments(reservationId: string): Promise<void> {
  const { error } = await supabase
    .from('reservation_treatments')
    .delete()
    .eq('reservation_id', reservationId);

  if (error) {
    console.error('예약 치료 항목 삭제 오류:', error);
    throw error;
  }
}

/**
 * 결제 관련 API
 */

// 대기 중인 결제 조회
export async function fetchPendingPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*, patients(name, chart_number)')
    .eq('is_completed', false)
    .order('payment_date', { ascending: true });

  if (error) {
    console.error('대기 결제 조회 오류:', error);
    throw error;
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    patientId: p.patient_id,
    patientName: p.patients.name,
    patientChartNumber: p.patients.chart_number || '',
    details: '진료비',
    isPaid: false,
    reservationId: p.reservation_id || undefined,
  }));
}

// 완료된 결제 조회
export async function fetchCompletedPayments(): Promise<CompletedPayment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*, patients(name, chart_number)')
    .eq('is_completed', true)
    .order('payment_date', { ascending: false })
    .limit(100);

  if (error) {
    console.error('완료 결제 조회 오류:', error);
    throw error;
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    paymentId: p.id,
    patientId: p.patient_id,
    patientName: p.patients.name,
    patientChartNumber: p.patients.chart_number || '',
    treatmentItems: p.treatment_items || [],
    totalAmount: p.total_amount || 0,
    paidAmount: p.paid_amount || 0,
    remainingAmount: p.remaining_amount || 0,
    paymentMethods: p.payment_methods || [],
    timestamp: p.payment_date,
  }));
}

// 결제 생성 (대기)
export async function createPayment(payment: Omit<Payment, 'id'>): Promise<number> {
  console.log('🔍 결제 생성 시도 - patientId:', payment.patientId);

  // 환자가 실제로 존재하는지 확인
  const { data: existingPatient, error: patientError } = await supabase
    .from('patients')
    .select('id, name')
    .eq('id', payment.patientId)
    .single();

  if (patientError || !existingPatient) {
    console.error('❌ 환자를 찾을 수 없습니다. patientId:', payment.patientId);
    console.error('환자 조회 오류:', patientError);
    throw new Error(`환자 ID ${payment.patientId}를 찾을 수 없습니다.`);
  }

  console.log('✅ 환자 확인됨:', existingPatient);

  const { data, error } = await supabase
    .from('payments')
    .insert({
      patient_id: payment.patientId,
      reservation_id: payment.reservationId || null,
      total_amount: 0,
      paid_amount: 0,
      remaining_amount: 0,
      payment_methods: [],
      treatment_items: [],
      is_completed: false,
      payment_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('결제 생성 오류:', error);
    console.error('결제 생성 상세 오류:', JSON.stringify(error, null, 2));
    throw error;
  }

  return data.id;
}

// 결제 완료 처리
export async function completePayment(
  paymentId: number,
  details: {
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentMethods: any[];
    treatmentItems: any[];
  }
): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .update({
      total_amount: details.totalAmount,
      paid_amount: details.paidAmount,
      remaining_amount: details.remainingAmount,
      payment_methods: details.paymentMethods,
      treatment_items: details.treatmentItems,
      is_completed: true,
      payment_date: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (error) {
    console.error('결제 완료 처리 오류:', error);
    throw error;
  }
}

/**
 * Acting Queue 관련 API
 */

// 특정 의사의 Acting Queue 조회
export async function fetchActingQueue(doctor: string): Promise<Acting[]> {
  const { data, error } = await supabase
    .from('acting_queue_items')
    .select('*')
    .eq('doctor', doctor)
    .order('position', { ascending: true });

  if (error) {
    console.error('Acting Queue 조회 오류:', error);
    throw error;
  }

  return (data || []).map((a) => ({
    id: a.id,
    patientId: a.patient_id,
    patientName: '', // 별도로 조회 필요하면 join
    type: a.acting_type as any,
    duration: a.duration,
    source: a.source as any,
    memo: a.memo || undefined,
  }));
}

// Acting 추가
export async function addActing(doctor: string, acting: Omit<Acting, 'id'>): Promise<string> {
  // 현재 최대 position 조회
  const { data: maxData } = await supabase
    .from('acting_queue_items')
    .select('position')
    .eq('doctor', doctor)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = maxData && maxData.length > 0 ? maxData[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('acting_queue_items')
    .insert({
      doctor,
      patient_id: acting.patientId,
      acting_type: acting.type,
      duration: acting.duration,
      source: acting.source,
      memo: acting.memo || null,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    console.error('Acting 추가 오류:', error);
    throw error;
  }

  return data.id;
}

// Acting 삭제
export async function deleteActing(actingId: string): Promise<void> {
  const { error } = await supabase.from('acting_queue_items').delete().eq('id', actingId);

  if (error) {
    console.error('Acting 삭제 오류:', error);
    throw error;
  }
}

// Acting 순서 재정렬
export async function reorderActingQueue(doctor: string, actingIds: string[]): Promise<void> {
  // 각 acting의 position 업데이트
  for (let i = 0; i < actingIds.length; i++) {
    await supabase
      .from('acting_queue_items')
      .update({ position: i })
      .eq('id', actingIds[i]);
  }
}

/**
 * 의료진 관리 API
 */

// 모든 의료진 조회
export async function fetchMedicalStaff(): Promise<MedicalStaff[]> {
  const { data, error } = await supabase
    .from('medical_staff')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('의료진 조회 오류:', error);
    throw error;
  }

  // DB의 snake_case를 camelCase로 변환
  return data.map(staff => ({
    id: staff.id,
    name: staff.name,
    dob: staff.dob,
    gender: staff.gender,
    hireDate: staff.hire_date,
    fireDate: staff.fire_date,
    status: staff.status,
    permissions: staff.permissions,
    workPatterns: staff.work_patterns,
    consultationRoom: staff.consultation_room,
  }));
}

// 의료진 추가
export async function createMedicalStaff(staff: Omit<MedicalStaff, 'id'>): Promise<MedicalStaff> {
  const { data, error } = await supabase
    .from('medical_staff')
    .insert({
      name: staff.name,
      dob: staff.dob || null,
      gender: staff.gender,
      hire_date: staff.hireDate || null,
      fire_date: staff.fireDate || null,
      status: staff.status,
      permissions: staff.permissions,
      work_patterns: staff.workPatterns,
      consultation_room: staff.consultationRoom || null,
    })
    .select()
    .single();

  if (error) {
    console.error('의료진 추가 오류:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    dob: data.dob,
    gender: data.gender,
    hireDate: data.hire_date,
    fireDate: data.fire_date,
    status: data.status,
    permissions: data.permissions,
    workPatterns: data.work_patterns,
    consultationRoom: data.consultation_room,
  };
}

// 의료진 수정
export async function updateMedicalStaff(staffId: number, updates: Partial<MedicalStaff>): Promise<void> {
  const dbUpdates: any = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.dob !== undefined) dbUpdates.dob = updates.dob || null;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.hireDate !== undefined) dbUpdates.hire_date = updates.hireDate || null;
  if (updates.fireDate !== undefined) dbUpdates.fire_date = updates.fireDate || null;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions;
  if (updates.workPatterns !== undefined) dbUpdates.work_patterns = updates.workPatterns;
  if (updates.consultationRoom !== undefined) dbUpdates.consultation_room = updates.consultationRoom || null;

  const { error } = await supabase
    .from('medical_staff')
    .update(dbUpdates)
    .eq('id', staffId);

  if (error) {
    console.error('의료진 수정 오류:', error);
    throw error;
  }
}

// 의료진 삭제
export async function deleteMedicalStaff(staffId: number): Promise<void> {
  const { error } = await supabase
    .from('medical_staff')
    .delete()
    .eq('id', staffId);

  if (error) {
    console.error('의료진 삭제 오류:', error);
    throw error;
  }
}

/**
 * 스태프 관리 API
 */

// 모든 스태프 조회
export async function fetchStaff(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('스태프 조회 오류:', error);
    throw error;
  }

  // DB의 snake_case를 camelCase로 변환
  return data.map(staff => ({
    id: staff.id,
    name: staff.name,
    dob: staff.dob,
    gender: staff.gender,
    hireDate: staff.hire_date,
    fireDate: staff.fire_date,
    status: staff.status,
    rank: staff.rank,
    department: staff.department,
    permissions: staff.permissions,
  }));
}

// 스태프 추가
export async function createStaff(staff: Omit<Staff, 'id'>): Promise<Staff> {
  const { data, error } = await supabase
    .from('staff')
    .insert({
      name: staff.name,
      dob: staff.dob || null,
      gender: staff.gender,
      hire_date: staff.hireDate || null,
      fire_date: staff.fireDate || null,
      status: staff.status,
      rank: staff.rank,
      department: staff.department,
      permissions: staff.permissions,
    })
    .select()
    .single();

  if (error) {
    console.error('스태프 추가 오류:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    dob: data.dob,
    gender: data.gender,
    hireDate: data.hire_date,
    fireDate: data.fire_date,
    status: data.status,
    rank: data.rank,
    department: data.department,
    permissions: data.permissions,
  };
}

// 스태프 수정
export async function updateStaff(staffId: number, updates: Partial<Staff>): Promise<void> {
  const dbUpdates: any = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.dob !== undefined) dbUpdates.dob = updates.dob || null;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.hireDate !== undefined) dbUpdates.hire_date = updates.hireDate || null;
  if (updates.fireDate !== undefined) dbUpdates.fire_date = updates.fireDate || null;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.rank !== undefined) dbUpdates.rank = updates.rank;
  if (updates.department !== undefined) dbUpdates.department = updates.department;
  if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions;

  const { error } = await supabase
    .from('staff')
    .update(dbUpdates)
    .eq('id', staffId);

  if (error) {
    console.error('스태프 수정 오류:', error);
    throw error;
  }
}

// 스태프 삭제
export async function deleteStaff(staffId: number): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', staffId);

  if (error) {
    console.error('스태프 삭제 오류:', error);
    throw error;
  }
}

/**
 * 비급여 카테고리 관리 API
 */

// 모든 비급여 카테고리 조회
export async function fetchUncoveredCategories(): Promise<UncoveredCategories> {
  const { data, error } = await supabase
    .from('uncovered_categories')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('비급여 카테고리 조회 오류:', error);
    throw error;
  }

  // DB 데이터를 UncoveredCategories 형식으로 변환
  const categories: UncoveredCategories = {};
  data.forEach(row => {
    categories[row.category_name] = row.items;
  });

  return categories;
}

// 비급여 카테고리 저장 (전체 업데이트)
export async function saveUncoveredCategories(categories: UncoveredCategories): Promise<void> {
  // 기존 데이터 모두 삭제
  const { error: deleteError } = await supabase
    .from('uncovered_categories')
    .delete()
    .neq('id', 0); // 모든 행 삭제

  if (deleteError) {
    console.error('비급여 카테고리 삭제 오류:', deleteError);
    throw deleteError;
  }

  // 새 데이터 삽입
  const insertData = Object.entries(categories).map(([categoryName, items]) => ({
    category_name: categoryName,
    items: items,
  }));

  if (insertData.length > 0) {
    const { error: insertError } = await supabase
      .from('uncovered_categories')
      .insert(insertData);

    if (insertError) {
      console.error('비급여 카테고리 추가 오류:', insertError);
      throw insertError;
    }
  }
}

/**
 * 치료실 관리 API
 */

// 모든 치료실 조회
export async function fetchTreatmentRooms(): Promise<TreatmentRoom[]> {
  const { data: rooms, error: roomsError } = await supabase
    .from('treatment_rooms')
    .select('*')
    .order('id', { ascending: true });

  if (roomsError) {
    console.error('치료실 조회 오류:', roomsError);
    throw roomsError;
  }

  // 각 치료실의 세션 치료 항목 조회
  const roomsWithTreatments = await Promise.all(
    rooms.map(async (room) => {
      const sessionTreatments = room.session_id
        ? await fetchSessionTreatments(room.session_id)
        : [];

      return {
        id: room.id,
        name: room.name,
        status: room.status,
        sessionId: room.session_id,
        patientId: room.patient_id,
        patientName: room.patient_name,
        patientChartNumber: room.patient_chart_number,
        doctorName: room.doctor_name,
        inTime: room.in_time,
        sessionTreatments,
      };
    })
  );

  return roomsWithTreatments;
}

// 세션 치료 항목 조회
export async function fetchSessionTreatments(sessionId: string): Promise<SessionTreatment[]> {
  const { data, error } = await supabase
    .from('session_treatments')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('세션 치료 항목 조회 오류:', error);
    throw error;
  }

  return data.map(item => ({
    id: item.id,
    name: item.name,
    status: item.status,
    duration: item.duration,
    startTime: item.start_time,
    // 타이머 원칙:
    // - running 상태: startTime + 이전 누적된 elapsedSeconds
    // - paused 상태: elapsedSeconds 보존 (startTime은 null)
    // - pending/completed: elapsedSeconds는 0
    elapsedSeconds: item.elapsed_seconds || 0,
    memo: item.memo,
  }));
}

// 치료실 업데이트 (전체)
export async function updateTreatmentRoom(roomId: number, room: Partial<TreatmentRoom>): Promise<void> {
  const startTime = Date.now();

  // treatment_rooms 테이블 업데이트 준비
  const dbUpdates: any = {};
  let hasRoomUpdate = false;

  if (room.name !== undefined) { dbUpdates.name = room.name; hasRoomUpdate = true; }
  if (room.status !== undefined) { dbUpdates.status = room.status; hasRoomUpdate = true; }
  if (room.sessionId !== undefined) { dbUpdates.session_id = room.sessionId; hasRoomUpdate = true; }
  if (room.patientId !== undefined) { dbUpdates.patient_id = room.patientId; hasRoomUpdate = true; }
  if (room.patientName !== undefined) { dbUpdates.patient_name = room.patientName; hasRoomUpdate = true; }
  if (room.patientChartNumber !== undefined) { dbUpdates.patient_chart_number = room.patientChartNumber; hasRoomUpdate = true; }
  if (room.doctorName !== undefined) { dbUpdates.doctor_name = room.doctorName; hasRoomUpdate = true; }
  if (room.inTime !== undefined) { dbUpdates.in_time = room.inTime; hasRoomUpdate = true; }

  if (hasRoomUpdate) {
    dbUpdates.updated_at = new Date().toISOString();
  }

  // 병렬 실행: treatment_rooms와 session_treatments 동시 업데이트
  const promises: Promise<any>[] = [];

  // 1. treatment_rooms 업데이트 (변경사항이 있을 때만)
  if (hasRoomUpdate) {
    const roomUpdatePromise = supabase
      .from('treatment_rooms')
      .update(dbUpdates)
      .eq('id', roomId);
    promises.push(roomUpdatePromise);
  }

  // 2. session_treatments 업데이트 (있을 때만)
  if (room.sessionTreatments !== undefined && room.sessionId) {
    const treatmentsUpdatePromise = updateSessionTreatments(room.sessionId, roomId, room.sessionTreatments);
    promises.push(treatmentsUpdatePromise);
  }

  // 병렬 실행 및 에러 처리
  if (promises.length > 0) {
    const results = await Promise.allSettled(promises);

    // 에러 확인
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        console.error(`DB 업데이트 오류 (${i}):`, result.reason);
        throw result.reason;
      } else if (result.status === 'fulfilled' && i === 0 && hasRoomUpdate) {
        // treatment_rooms 업데이트 결과
        const { error } = result.value;
        if (error) {
          console.error('치료실 업데이트 오류:', error);
          throw error;
        }
      }
    }
  }
}

// 세션 치료 항목 업데이트 (UPSERT 사용으로 성능 개선)
async function updateSessionTreatments(sessionId: string, roomId: number, treatments: SessionTreatment[]): Promise<void> {
  const startTime = Date.now();

  if (treatments.length === 0) {
    // 치료 항목이 없으면 모두 삭제
    const { error: deleteError } = await supabase
      .from('session_treatments')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError) {
      console.error('세션 치료 항목 삭제 오류:', deleteError);
      throw deleteError;
    }
    return;
  }

  // 치료 항목 데이터 준비
  const treatmentData = treatments.map(t => ({
    id: t.id,
    session_id: sessionId,
    room_id: roomId,
    name: t.name,
    status: t.status,
    duration: t.duration,
    start_time: t.startTime || null,
    // DB는 integer 타입이므로 반올림
    elapsed_seconds: Math.round(t.elapsedSeconds || 0),
    memo: t.memo || null,
  }));

  // UPSERT 사용: 존재하면 업데이트, 없으면 삽입 (한 번의 쿼리로 처리)
  const { error: upsertError } = await supabase
    .from('session_treatments')
    .upsert(treatmentData, {
      onConflict: 'id',  // id 기준으로 중복 확인
      ignoreDuplicates: false  // 중복 시 업데이트
    });

  if (upsertError) {
    console.error('세션 치료 항목 UPSERT 오류:', upsertError);
    throw upsertError;
  }

  // 삭제된 항목 처리 (DB에는 있지만 treatments에는 없는 항목)
  const treatmentIds = treatments.map(t => t.id);
  const { error: deleteError } = await supabase
    .from('session_treatments')
    .delete()
    .eq('session_id', sessionId)
    .not('id', 'in', `(${treatmentIds.join(',')})`);

  if (deleteError) {
    console.error('세션 치료 항목 정리 오류:', deleteError);
    // 에러가 나도 계속 진행 (삭제된 항목이 없을 수 있음)
  }
}

// 치료실 초기화 (환자 배정 해제)
export async function clearTreatmentRoom(roomId: number): Promise<void> {
  const { data: room, error: fetchError } = await supabase
    .from('treatment_rooms')
    .select('session_id')
    .eq('id', roomId)
    .single();

  if (fetchError) {
    console.error('치료실 조회 오류:', fetchError);
    throw fetchError;
  }

  // 세션 치료 항목 삭제
  if (room.session_id) {
    const { error: deleteError } = await supabase
      .from('session_treatments')
      .delete()
      .eq('session_id', room.session_id);

    if (deleteError) {
      console.error('세션 치료 항목 삭제 오류:', deleteError);
      throw deleteError;
    }
  }

  // 치료실 초기화
  const { error: updateError } = await supabase
    .from('treatment_rooms')
    .update({
      status: '사용가능',
      session_id: null,
      patient_id: null,
      patient_name: null,
      patient_chart_number: null,
      doctor_name: null,
      in_time: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId);

  if (updateError) {
    console.error('치료실 초기화 오류:', updateError);
    throw updateError;
  }
}

// 치료실 추가 (초기 설정용)
export async function createTreatmentRoom(name: string): Promise<TreatmentRoom> {
  const { data, error } = await supabase
    .from('treatment_rooms')
    .insert({
      name,
      status: '사용가능',
    })
    .select()
    .single();

  if (error) {
    console.error('치료실 추가 오류:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    status: data.status,
    sessionTreatments: [],
  };
}

// 치료실 삭제
export async function deleteTreatmentRoom(roomId: number): Promise<void> {
  const { error } = await supabase
    .from('treatment_rooms')
    .delete()
    .eq('id', roomId);

  if (error) {
    console.error('치료실 삭제 오류:', error);
    throw error;
  }
}

/**
 * 치료항목 관리 API
 */

// 치료항목 조회
export async function fetchTreatmentItems(): Promise<TreatmentItem[]> {
  const { data, error } = await supabase
    .from('treatment_items')
    .select('*')
    .order('display_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('치료항목 조회 오류:', error);
    throw error;
  }

  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    defaultDuration: item.default_duration,
    displayOrder: item.display_order ?? 0
  }));
}

// 치료항목 생성
export async function createTreatmentItem(item: Omit<TreatmentItem, 'id'>): Promise<TreatmentItem> {
  const { data, error } = await supabase
    .from('treatment_items')
    .insert({
      name: item.name,
      default_duration: item.defaultDuration,
      display_order: item.displayOrder
    })
    .select()
    .single();

  if (error) {
    console.error('치료항목 추가 오류:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    defaultDuration: data.default_duration,
    displayOrder: data.display_order ?? 0
  };
}

// 치료항목 수정
export async function updateTreatmentItem(id: number, item: Omit<TreatmentItem, 'id'>): Promise<TreatmentItem> {
  const { data, error } = await supabase
    .from('treatment_items')
    .update({
      name: item.name,
      default_duration: item.defaultDuration,
      display_order: item.displayOrder
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('치료항목 수정 오류:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    defaultDuration: data.default_duration,
    displayOrder: data.display_order ?? 0
  };
}

// 치료항목 삭제
export async function deleteTreatmentItem(id: number): Promise<void> {
  const { data, error, count } = await supabase
    .from('treatment_items')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    console.error('❌ 치료항목 삭제 오류:', error);
    throw error;
  }

  // 삭제된 행이 없으면 에러 발생
  if (!data || data.length === 0) {
    const permissionError = new Error('치료항목 삭제 권한이 없거나 해당 항목이 존재하지 않습니다. Supabase RLS 정책을 확인하세요.');
    console.error('❌ 삭제 실패:', permissionError.message);
    throw permissionError;
  }
}

// 치료항목 순서 일괄 업데이트
export async function updateTreatmentItemsOrder(items: Array<{ id: number; displayOrder: number }>): Promise<void> {
  // 각 항목을 순차적으로 업데이트
  const updatePromises = items.map(item =>
    supabase
      .from('treatment_items')
      .update({ display_order: item.displayOrder })
      .eq('id', item.id)
  );

  const results = await Promise.all(updatePromises);

  const errors = results.filter(r => r.error).map(r => r.error);
  if (errors.length > 0) {
    console.error('❌ 치료항목 순서 업데이트 오류:', errors);
    throw errors[0];
  }
}
