import { useState, useEffect } from 'react';
import { TreatmentRoom, RoomStatus } from '../types';
import * as api from '../lib/api';
import { supabase } from '../lib/supabaseClient';

export const useTreatmentRooms = (currentUser: any) => {
  const [treatmentRooms, setTreatmentRooms] = useState<TreatmentRoom[]>([]);

  // 초기 치료실 데이터 로드
  useEffect(() => {
    if (!currentUser) return;

    const loadTreatmentRooms = async () => {
      try {
        const roomsData = await api.fetchTreatmentRooms();

        // DB의 running 상태는 그대로 유지하되, startTime을 현재 시간으로 재설정
        const processedRooms = roomsData.map(room => ({
          ...room,
          sessionTreatments: room.sessionTreatments.map(tx => {
            if (tx.status === 'running' && tx.startTime) {
              // 다른 클라이언트에서 시작한 타이머: running 상태 유지, startTime만 현재로 갱신
              const newStartTime = new Date().toISOString();

              return {
                ...tx,
                status: 'running' as const,
                startTime: newStartTime,
                elapsedSeconds: tx.elapsedSeconds // DB 값 그대로 사용
              };
            }
            return tx;
          })
        }));

        setTreatmentRooms(processedRooms);
      } catch (error) {
        console.error('❌ 치료실 데이터 로드 오류:', error);
      }
    };

    loadTreatmentRooms();
  }, [currentUser]);

  // 실시간 구독
  useEffect(() => {
    if (!currentUser) return;

    const treatmentRoomsSubscription = supabase
      .channel('treatment-rooms-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'treatment_rooms' },
        async (payload) => {
          try {
            const roomsData = await api.fetchTreatmentRooms();

            // 로컬 running 타이머는 보존, DB의 running은 startTime만 현재 시간으로 갱신
            setTreatmentRooms(prevRooms => {
              return roomsData.map(newRoom => {
                const oldRoom = prevRooms.find(r => r.id === newRoom.id);

                return {
                  ...newRoom,
                  sessionTreatments: newRoom.sessionTreatments.map(newTx => {
                    const oldTx = oldRoom?.sessionTreatments.find(t => t.id === newTx.id);

                    // 로컬 running + DB도 running → 로컬 상태 유지 (자신이 실행 중)
                    if (oldTx?.status === 'running' && oldTx.startTime && newTx.status === 'running') {
                      return oldTx;
                    }

                    // 로컬 running + DB는 paused/completed → DB 상태 우선 (다른 클라이언트가 변경)
                    if (oldTx?.status === 'running' && (newTx.status === 'paused' || newTx.status === 'completed')) {
                      return newTx;
                    }

                    // DB에서 running으로 온 데이터는 running 상태 유지, startTime만 현재로 갱신
                    if (newTx.status === 'running' && newTx.startTime) {
                      const newStartTime = new Date().toISOString();

                      return {
                        ...newTx,
                        status: 'running' as const,
                        startTime: newStartTime,
                        elapsedSeconds: newTx.elapsedSeconds // DB 값 그대로 사용
                      };
                    }

                    return newTx;
                  })
                };
              });
            });
          } catch (error) {
            console.error('❌ 실시간 치료실 데이터 로드 오류:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(treatmentRoomsSubscription);
    };
  }, [currentUser]);

  // 치료 타이머 관리
  useEffect(() => {
    const timer = setInterval(() => {
      setTreatmentRooms(currentRooms => {
        let hasChanged = false;
        const updatedRooms = currentRooms.map(room => {
          if (room.status !== RoomStatus.IN_USE) return room;

          const newTreatments = room.sessionTreatments.map(tx => {
            if (tx.status === 'running' && tx.startTime) {
              // 타이머가 running일 때만 경과 시간 계산
              // 이렇게 하면 UI가 매초 업데이트됨
              hasChanged = true;

              const elapsed = (Date.now() - new Date(tx.startTime).getTime()) / 1000 + (tx.elapsedSeconds || 0);

              // 시간이 지나도 자동으로 completed로 변경하지 않음
              // UI에서 "완료" 표시만 하고, 사용자가 수동으로 완료 처리
              return tx;
            }
            return tx;
          });

          if (hasChanged) {
            return { ...room, sessionTreatments: newTreatments };
          }
          return room;
        });

        return hasChanged ? updatedRooms : currentRooms;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleUpdateTreatmentRooms = async (updatedRooms: TreatmentRoom[]) => {
    // 로컬 상태만 업데이트 (타이머 클릭 등)
    setTreatmentRooms(updatedRooms);
  };

  const saveTreatmentRoomToDB = async (roomId: number, room: TreatmentRoom) => {
    // 중요한 변경사항만 DB에 저장 (환자 입실/퇴실, 치료 완료 등)
    const startTime = Date.now();
    try {
      await api.updateTreatmentRoom(roomId, room);
    } catch (error) {
      console.error('❌ 치료실 DB 저장 오류:', error);
    }
  };

  return {
    treatmentRooms,
    setTreatmentRooms,
    handleUpdateTreatmentRooms,
    saveTreatmentRoomToDB,
  };
};
