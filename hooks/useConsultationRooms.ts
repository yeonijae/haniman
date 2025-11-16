import { useState } from 'react';
import { ConsultationRoom, Patient } from '../types';
import { CONSULTATION_ROOMS } from '../constants';

export const useConsultationRooms = () => {
  const [consultationRooms, setConsultationRooms] = useState<ConsultationRoom[]>(CONSULTATION_ROOMS);

  const handleFinishConsultation = (patientId: number, onMoveToTreatment: (patient: Patient) => void, onMoveToPayment: (patient: Patient) => void) => {
    // 진료실을 사용 가능 상태로 변경
    setConsultationRooms(prevRooms =>
      prevRooms.map(room =>
        room.patientId === patientId
          ? { ...room, status: 'available', patientId: undefined, patientName: undefined, patientDetails: undefined }
          : room
      )
    );
  };

  const handleAssignPatientToRoom = (patientId: number, roomId: number) => {
    const targetRoom = consultationRooms.find(r => r.id === roomId);

    if (!targetRoom) {
      alert('진료실 정보를 찾을 수 없습니다.');
      return false;
    }
    if (targetRoom.status !== 'available') {
      alert(`${targetRoom.roomName}은 현재 사용 중입니다.`);
      return false;
    }

    return true;
  };

  const assignPatientToRoom = (roomId: number, patientId: number, patientName: string, patientDetails: string) => {
    setConsultationRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          status: 'in_consultation',
          patientId,
          patientName,
          patientDetails,
        };
      }
      return room;
    }));
  };

  return {
    consultationRooms,
    setConsultationRooms,
    handleFinishConsultation,
    handleAssignPatientToRoom,
    assignPatientToRoom,
  };
};
