import { useState, useEffect, useMemo, useCallback } from 'react';
import { Patient, PatientStatus, DefaultTreatment, Acting } from '../types';
import { NewPatientData } from '../components/NewPatientForm';
import { BulkPatientData } from '../components/Settings';
import * as api from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { DOCTORS } from '../constants';

interface BulkAddFailure {
  name: string;
  chartNumber?: string;
  reason: string;
}

export const usePatients = (currentUser: any) => {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [consultationWaitingList, setConsultationWaitingList] = useState<Patient[]>([]);
  const [treatmentWaitingList, setTreatmentWaitingList] = useState<Patient[]>([]);

  // 초기 환자 데이터 로드
  useEffect(() => {
    if (!currentUser) return;

    const loadInitialData = async () => {
      try {
        const patients = await api.fetchPatients();
        setAllPatients(patients);

        // 각 환자의 기본 치료 로드
        for (const patient of patients) {
          const defaultTreatments = await api.fetchPatientDefaultTreatments(patient.id);
          if (defaultTreatments.length > 0) {
            setAllPatients(prev => prev.map(p =>
              p.id === patient.id ? { ...p, defaultTreatments } : p
            ));
          }
        }
      } catch (error) {
        console.error('❌ 데이터 로드 오류:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다. Supabase 설정을 확인해주세요.');
      }
    };

    loadInitialData();
  }, [currentUser]);

  // 실시간 구독
  useEffect(() => {
    if (!currentUser) return;

    const patientsSubscription = supabase
      .channel('patients-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPatient = payload.new as any;
            const treatments = await api.fetchPatientDefaultTreatments(newPatient.id);
            setAllPatients(prev => [...prev, { ...newPatient, defaultTreatments: treatments }]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedPatient = payload.new as any;
            const treatments = await api.fetchPatientDefaultTreatments(updatedPatient.id);
            setAllPatients(prev => prev.map(p =>
              p.id === updatedPatient.id ? { ...updatedPatient, defaultTreatments: treatments } : p
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setAllPatients(prev => prev.filter(p => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(patientsSubscription);
    };
  }, [currentUser]);

  // 활성/삭제된 환자 필터
  const activePatients = useMemo(() => allPatients.filter(p => !p.deletionDate), [allPatients]);
  const deletedPatients = useMemo(() => allPatients.filter(p => !!p.deletionDate), [allPatients]);

  // 환자 추가
  const addNewPatient = useCallback(async (formData: NewPatientData, onAddActing?: (doctor: string, acting: Acting) => void) => {
    try {
      const tempPatient: Patient = {
        id: 0,
        name: formData.name,
        chartNumber: formData.chartNumber || '',
        status: PatientStatus.WAITING_CONSULTATION,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        details: `신규 | ${formData.treatmentType || '희망치료 미지정'}`,
        dob: formData.dob,
        gender: formData.gender === '' ? undefined : formData.gender,
        phone: formData.phone,
        address: formData.address,
        referralPath: formData.referral,
        registrationDate: new Date().toISOString().split('T')[0],
      };

      const savedPatient = await api.createPatient(tempPatient);

      const newPatient: Patient = {
        ...tempPatient,
        id: savedPatient.id,
        chartNumber: savedPatient.chartNumber || tempPatient.chartNumber,
      };

      setAllPatients(prev => [...prev, newPatient]);
      setConsultationWaitingList(prevList => [newPatient, ...prevList]);

      // Add '초진' acting
      const doctor = formData.doctor;
      if (doctor && DOCTORS.includes(doctor) && onAddActing) {
        const newActing: Acting = {
          id: `act-${newPatient.id}-${Date.now()}-0`,
          patientId: newPatient.id,
          patientName: newPatient.name,
          type: '초진',
          duration: 30,
          source: 'new_patient',
        };
        onAddActing(doctor, newActing);
      }

      alert(`${newPatient.name}님을 신규 환자로 등록하고 진료 대기 목록에 추가했습니다.`);
      return newPatient;
    } catch (error) {
      console.error('❌ 환자 등록 오류:', error);
      alert('환자 등록 중 오류가 발생했습니다.');
      throw error;
    }
  }, []);

  // 환자 정보 수정
  const updatePatientInfo = useCallback(async (updatedPatientData: Patient) => {
    try {
      await api.updatePatient(updatedPatientData.id, updatedPatientData);

      setAllPatients(prev => prev.map(p => p.id === updatedPatientData.id ? updatedPatientData : p));
      setConsultationWaitingList(prev => prev.map(p => p.id === updatedPatientData.id ? { ...p, ...updatedPatientData } : p));
      setTreatmentWaitingList(prev => prev.map(p => p.id === updatedPatientData.id ? { ...p, ...updatedPatientData } : p));

      alert(`${updatedPatientData.name}님의 정보가 수정되었습니다.`);
      return { name: updatedPatientData.name, chartNumber: updatedPatientData.chartNumber || '' };
    } catch (error) {
      console.error('❌ 환자 정보 수정 오류:', error);
      alert('환자 정보 수정 중 오류가 발생했습니다.');
      throw error;
    }
  }, []);

  // 환자 기본 치료 수정
  const updatePatientDefaultTreatments = useCallback(async (patientId: number, treatments: DefaultTreatment[]) => {
    try {
      await api.savePatientDefaultTreatments(patientId, treatments);

      const updateTreatments = (p: Patient) => {
        if (p.id === patientId) {
          return { ...p, defaultTreatments: treatments };
        }
        return p;
      };
      setAllPatients(prev => prev.map(updateTreatments));
      setTreatmentWaitingList(prev => prev.map(updateTreatments));
      setConsultationWaitingList(prev => prev.map(updateTreatments));
    } catch (error) {
      console.error('❌ 기본 치료 저장 오류:', error);
      alert('기본 치료 저장 중 오류가 발생했습니다.');
      throw error;
    }
  }, []);

  // 환자 삭제
  const deletePatient = useCallback(async (patientId: number) => {
    let patientToDelete: Patient | undefined;

    setAllPatients(prev => {
      patientToDelete = prev.find(p => p.id === patientId);
      if (!patientToDelete) {
        return prev;
      }
      return prev.map(p =>
        p.id === patientId
          ? { ...p, deletionDate: new Date().toISOString() }
          : p
      );
    });

    if (!patientToDelete) {
      console.error("삭제할 환자를 찾을 수 없습니다.");
      return;
    }

    try {
      await api.deletePatient(patientId);

      setConsultationWaitingList(prev => prev.filter(p => p.id !== patientId));
      setTreatmentWaitingList(prev => prev.filter(p => p.id !== patientId));

      alert(`${patientToDelete.name}(${patientToDelete.chartNumber}) 님의 정보가 삭제 처리되었습니다.`);
    } catch (error) {
      console.error('❌ 환자 삭제 오류:', error);
      alert('환자 삭제 중 오류가 발생했습니다.');

      // Rollback on error
      setAllPatients(prev => prev.map(p =>
        p.id === patientId ? { ...p, deletionDate: undefined } : p
      ));

      throw error;
    }
  }, []);

  // 환자 복구
  const restorePatient = useCallback(async (patientId: number) => {
    let patientToRestore: Patient | undefined;
    let previousDeletionDate: string | undefined;

    setAllPatients(prev => {
      patientToRestore = prev.find(p => p.id === patientId);
      if (!patientToRestore) {
        return prev;
      }
      previousDeletionDate = patientToRestore.deletionDate;

      return prev.map(p => {
        if (p.id === patientId) {
          const { deletionDate, ...restoredPatient } = p;
          return restoredPatient;
        }
        return p;
      });
    });

    if (!patientToRestore) {
      alert("복구할 환자 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      await api.restorePatient(patientId);
      alert(`${patientToRestore.name} 님의 정보가 복구되었습니다.`);
    } catch (error) {
      console.error('❌ 환자 복구 오류:', error);
      alert('환자 복구 중 오류가 발생했습니다.');

      // Rollback on error
      if (previousDeletionDate) {
        setAllPatients(prev => prev.map(p =>
          p.id === patientId ? { ...p, deletionDate: previousDeletionDate } : p
        ));
      }

      throw error;
    }
  }, []);

  // 일괄 등록
  const addBulkPatients = useCallback(async (newPatientsData: BulkPatientData[]) => {
    const updatedPatients: Patient[] = [];
    const newPatients: Patient[] = [];
    const failures: BulkAddFailure[] = [];
    const chartNumbersInFile = new Set<string>();

    // Get current patients snapshot using updater function
    let existingPatientMapByChartNumber: Map<string, Patient>;
    setAllPatients(prev => {
      existingPatientMapByChartNumber = new Map(prev.map(p => [p.chartNumber, p]));
      return prev;
    });

    try {
      for (const data of newPatientsData) {
        const name = String(data.name || '').trim();
        const chartNumber = data.chartNumber ? String(data.chartNumber).trim() : '';

        if (!name) {
          failures.push({ name: '(이름 없음)', chartNumber, reason: '환자 이름이 비어있습니다.' });
          continue;
        }

        if (chartNumber) {
          if (chartNumbersInFile.has(chartNumber)) {
            failures.push({ name, chartNumber, reason: '엑셀 파일 내 중복된 차트번호입니다.' });
            continue;
          }
          chartNumbersInFile.add(chartNumber);
        }

        const existingPatient = chartNumber ? existingPatientMapByChartNumber!.get(chartNumber) : undefined;

        if (existingPatient) {
          const updatedPatient = { ...existingPatient };
          if (data.name) updatedPatient.name = data.name;
          if (data.dob) updatedPatient.dob = data.dob;
          if (data.gender !== undefined) updatedPatient.gender = data.gender;
          if (data.address !== undefined) updatedPatient.address = data.address;
          if (data.phone !== undefined) updatedPatient.phone = data.phone;
          if (data.details !== undefined) updatedPatient.referralPath = data.details;
          if (data.registrationDate) updatedPatient.registrationDate = data.registrationDate;
          updatedPatients.push(updatedPatient);
        } else {
          const tempPatient: Patient = {
            id: 0,
            name,
            chartNumber: chartNumber || '',
            status: PatientStatus.COMPLETED,
            time: '',
            details: '일괄등록',
            dob: data.dob,
            gender: data.gender,
            address: data.address,
            phone: data.phone,
            referralPath: data.details || '',
            registrationDate: data.registrationDate || new Date().toISOString().split('T')[0],
          };
          newPatients.push(tempPatient);
        }
      }

      const savedNewPatients: Patient[] = [];

      for (const patient of newPatients) {
        try {
          const saved = await api.createPatient(patient);
          savedNewPatients.push(saved);
        } catch (error) {
          console.error(`환자 저장 실패: ${patient.name}`, error);
          failures.push({ name: patient.name, chartNumber: patient.chartNumber, reason: '데이터베이스 저장 오류' });
        }
      }

      for (const patient of updatedPatients) {
        try {
          await api.updatePatient(patient.id, patient);
        } catch (error) {
          console.error(`환자 업데이트 실패: ${patient.name}`, error);
          failures.push({ name: patient.name, chartNumber: patient.chartNumber || '', reason: '데이터베이스 업데이트 오류' });
        }
      }

      if (savedNewPatients.length > 0 || updatedPatients.length > 0) {
        setAllPatients(prevPatients => {
          const updatedPatientMap = new Map(updatedPatients.map(p => [p.id, p]));
          const processedPatients = prevPatients.map(p => updatedPatientMap.get(p.id) || p);
          return [...processedPatients, ...savedNewPatients];
        });
      }

      return { new: savedNewPatients.length, updated: updatedPatients.length, failures };
    } catch (error) {
      console.error('❌ 일괄 등록 오류:', error);
      alert('일괄 등록 중 오류가 발생했습니다.');
      throw error;
    }
  }, []);

  // 대기 목록 추가
  const addPatientToConsultation = useCallback((patient: Patient) => {
    let alreadyExists = false;

    setConsultationWaitingList(prevList => {
      if (prevList.some(p => p.id === patient.id)) {
        alreadyExists = true;
        return prevList;
      }

      const newPatient: Patient = {
        ...patient,
        status: PatientStatus.WAITING_CONSULTATION,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        details: '검색 추가',
      };

      return [...prevList, newPatient];
    });

    if (alreadyExists) {
      alert(`${patient.name}님은 이미 진료 대기 목록에 있습니다.`);
      return false;
    }

    alert(`${patient.name}님을 진료 대기 목록에 추가했습니다.`);
    return true;
  }, []);

  const addPatientToTreatment = useCallback((patient: Patient) => {
    let alreadyExists = false;

    setTreatmentWaitingList(prevList => {
      if (prevList.some(p => p.id === patient.id)) {
        alreadyExists = true;
        return prevList;
      }

      const newPatient: Patient = {
        ...patient,
        status: PatientStatus.WAITING_TREATMENT,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        details: '검색 추가',
      };

      return [...prevList, newPatient];
    });

    if (alreadyExists) {
      alert(`${patient.name}님은 이미 치료 대기 목록에 있습니다.`);
      return false;
    }

    alert(`${patient.name}님을 치료 대기 목록에 추가했습니다.`);
    return true;
  }, []);

  // 환자 이동
  const movePatient = useCallback((patientToMove: Patient) => {
    const currentTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (patientToMove.status === PatientStatus.WAITING_CONSULTATION) {
      setConsultationWaitingList(prev => prev.filter(p => p.id !== patientToMove.id));
      const updatedPatient = {
        ...patientToMove,
        status: PatientStatus.WAITING_TREATMENT,
        time: currentTime,
        details: '진료완료',
      };
      setTreatmentWaitingList(prev => [...prev, updatedPatient]);
    } else if (patientToMove.status === PatientStatus.WAITING_TREATMENT) {
      setTreatmentWaitingList(prev => prev.filter(p => p.id !== patientToMove.id));
      const updatedPatient = {
        ...patientToMove,
        status: PatientStatus.WAITING_CONSULTATION,
        time: currentTime,
        details: '재진료요청',
      };
      setConsultationWaitingList(prev => [...prev, updatedPatient]);
    }
  }, []);

  // 드래그 앤 드롭
  const handlePatientDrop = useCallback((
    draggedPatientId: number,
    sourceListType: 'consultation' | 'treatment',
    destinationListType: 'consultation' | 'treatment',
    targetPatientId: number | null
  ) => {
    if (sourceListType !== destinationListType) return;

    const setSourceList = sourceListType === 'consultation' ? setConsultationWaitingList : setTreatmentWaitingList;

    setSourceList(prevList => {
      const draggedPatient = prevList.find(p => p.id === draggedPatientId);
      if (!draggedPatient) return prevList;

      const list = [...prevList];
      const draggedIndex = list.findIndex(p => p.id === draggedPatientId);
      list.splice(draggedIndex, 1);
      const targetIndex = targetPatientId !== null ? list.findIndex(p => p.id === targetPatientId) : list.length;
      list.splice(targetIndex, 0, draggedPatient);

      return list;
    });
  }, []);

  // 환자를 대기 목록에서 제거
  const removeFromConsultationList = useCallback((patientId: number) => {
    setConsultationWaitingList(prev => prev.filter(p => p.id !== patientId));
  }, []);

  const removeFromTreatmentList = useCallback((patientId: number) => {
    setTreatmentWaitingList(prev => prev.filter(p => p.id !== patientId));
  }, []);

  // 환자를 특정 대기 목록에 추가
  const addToConsultationList = useCallback((patient: Patient, details: string) => {
    const currentTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const patientForList: Patient = {
      ...patient,
      status: PatientStatus.WAITING_CONSULTATION,
      time: currentTime,
      details,
    };
    setConsultationWaitingList(prev => [...prev, patientForList]);
  }, []);

  const addToTreatmentList = useCallback((patient: Patient, details: string) => {
    const currentTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const patientForList: Patient = {
      ...patient,
      status: PatientStatus.WAITING_TREATMENT,
      time: currentTime,
      details,
    };
    setTreatmentWaitingList(prev => [...prev, patientForList]);
  }, []);

  return useMemo(() => ({
    allPatients,
    activePatients,
    deletedPatients,
    consultationWaitingList,
    treatmentWaitingList,
    setConsultationWaitingList,
    setTreatmentWaitingList,
    addNewPatient,
    updatePatientInfo,
    updatePatientDefaultTreatments,
    deletePatient,
    restorePatient,
    addBulkPatients,
    addPatientToConsultation,
    addPatientToTreatment,
    movePatient,
    handlePatientDrop,
    removeFromConsultationList,
    removeFromTreatmentList,
    addToConsultationList,
    addToTreatmentList,
  }), [
    allPatients,
    activePatients,
    deletedPatients,
    consultationWaitingList,
    treatmentWaitingList,
    addNewPatient,
    updatePatientInfo,
    updatePatientDefaultTreatments,
    deletePatient,
    restorePatient,
    addBulkPatients,
    addPatientToConsultation,
    addPatientToTreatment,
    movePatient,
    handlePatientDrop,
    removeFromConsultationList,
    removeFromTreatmentList,
    addToConsultationList,
    addToTreatmentList,
  ]);
};
