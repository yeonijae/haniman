import { useState, useEffect, useCallback } from 'react';
import { TreatmentItem } from '../types';
import * as api from '../lib/api';

export const useTreatmentItems = (currentUser: any) => {
  const [treatmentItems, setTreatmentItems] = useState<TreatmentItem[]>([]);

  // 초기 데이터 로드
  useEffect(() => {
    if (!currentUser) return;

    const loadTreatmentItems = async () => {
      try {
        const items = await api.fetchTreatmentItems();
        setTreatmentItems(items);
      } catch (error) {
        console.error('❌ 치료항목 데이터 로드 오류:', error);
      }
    };

    loadTreatmentItems();
  }, [currentUser]);

  // 치료항목 추가
  const addTreatmentItem = useCallback(async (newItem: Omit<TreatmentItem, 'id'>) => {
    try {
      const createdItem = await api.createTreatmentItem(newItem);
      setTreatmentItems(prev => [...prev, createdItem]);
      alert(`${createdItem.name} 치료항목이 추가되었습니다.`);
    } catch (error) {
      console.error('치료항목 추가 오류:', error);
      alert('치료항목 추가 중 오류가 발생했습니다.');
    }
  }, []);

  // 치료항목 수정
  const updateTreatmentItem = useCallback(async (id: number, updatedItem: Omit<TreatmentItem, 'id'>) => {
    try {
      const updated = await api.updateTreatmentItem(id, updatedItem);
      setTreatmentItems(prev => prev.map(item => item.id === id ? updated : item));
      alert(`${updated.name} 치료항목이 수정되었습니다.`);
    } catch (error) {
      console.error('치료항목 수정 오류:', error);
      alert('치료항목 수정 중 오류가 발생했습니다.');
    }
  }, []);

  // 치료항목 삭제
  const deleteTreatmentItem = useCallback(async (id: number) => {
    const itemToDelete = treatmentItems.find(item => item.id === id);
    if (!itemToDelete) {
      alert('삭제할 치료항목을 찾을 수 없습니다.');
      return;
    }

    try {
      // DB에서 먼저 삭제 시도
      await api.deleteTreatmentItem(id);

      // DB 삭제 성공 후 UI 업데이트
      setTreatmentItems(prev => prev.filter(item => item.id !== id));
      alert(`${itemToDelete.name} 치료항목이 삭제되었습니다.`);
    } catch (error) {
      console.error('❌ 치료항목 삭제 오류:', error);
      alert('치료항목 삭제 중 오류가 발생했습니다. 콘솔을 확인하세요.');
    }
  }, [treatmentItems]);

  return {
    treatmentItems,
    addTreatmentItem,
    updateTreatmentItem,
    deleteTreatmentItem,
  };
};
