import React, { useState, useMemo } from 'react';
import { CompletedPayment, PaymentMethod } from '../types';

interface DailyPaymentSummaryProps {
    completedPayments: CompletedPayment[];
}

const SummaryCard: React.FC<{ title: string; amount: number; colorClass: string; icon: string }> = ({ title, amount, colorClass, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-current" style={{ color: colorClass }}>
        <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-full mr-4">
                <i className={`${icon} text-lg`} style={{ color: colorClass }}></i>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold">{amount.toLocaleString()}원</p>
            </div>
        </div>
    </div>
);

const getPaymentMethodName = (method: PaymentMethod) => {
    switch(method) {
        case 'card': return '카드';
        case 'cash': return '현금';
        case 'transfer': return '계좌이체';
    }
};

const DailyPaymentSummary: React.FC<DailyPaymentSummaryProps> = ({ completedPayments }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateString = e.target.value;
        if (dateString) {
            // Using replace to avoid timezone issues with new Date('YYYY-MM-DD')
            setSelectedDate(new Date(dateString.replace(/-/g, '/')));
        }
    };

    const changeDay = (amount: number) => {
        setSelectedDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + amount);
            return newDate;
        });
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const formattedSelectedDate = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, [selectedDate]);

    const paymentsForSelectedDate = useMemo(() => {
        return completedPayments.filter(p => {
            const paymentDate = new Date(p.timestamp);
            const paymentDateString = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${String(paymentDate.getDate()).padStart(2, '0')}`;
            return paymentDateString === formattedSelectedDate;
        });
    }, [completedPayments, formattedSelectedDate]);

    const summary = useMemo(() => {
        let totalRevenue = 0;
        let totalPaid = 0;
        let totalUnpaid = 0;
        const totalsByMethod = { card: 0, cash: 0, transfer: 0 };

        for (const p of paymentsForSelectedDate) {
            totalRevenue += p.totalAmount;
            totalPaid += p.paidAmount;
            totalUnpaid += p.remainingAmount;
            for (const method of p.paymentMethods) {
                totalsByMethod[method.method] += method.amount;
            }
        }
        return { totalRevenue, totalPaid, totalUnpaid, totalsByMethod };
    }, [paymentsForSelectedDate]);
    
    const sortedPayments = [...paymentsForSelectedDate].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="flex flex-col space-y-6 max-h-[75vh]">
             <div className="flex items-center justify-center space-x-4 p-2 bg-gray-50 rounded-lg border">
                <button onClick={() => changeDay(-1)} className="px-3 py-1 rounded-md hover:bg-gray-200 transition-colors" aria-label="이전 날짜">
                    <i className="fa-solid fa-chevron-left"></i>
                </button>
                <input
                    type="date"
                    value={formattedSelectedDate}
                    onChange={handleDateChange}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-clinic-secondary"
                />
                <button onClick={() => changeDay(1)} className="px-3 py-1 rounded-md hover:bg-gray-200 transition-colors" aria-label="다음 날짜">
                    <i className="fa-solid fa-chevron-right"></i>
                </button>
                <button onClick={goToToday} className="px-4 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-semibold">
                    오늘
                </button>
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard title="총 매출" amount={summary.totalRevenue} colorClass="#1E3A8A" icon="fa-solid fa-chart-pie" />
                <SummaryCard title="총 수납액" amount={summary.totalPaid} colorClass="#10B981" icon="fa-solid fa-hand-holding-dollar" />
                <SummaryCard title="총 미수금" amount={summary.totalUnpaid} colorClass="#EF4444" icon="fa-solid fa-file-invoice-dollar" />
                
                <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col justify-center space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-600">카드</span>
                        <span className="font-bold">{summary.totalsByMethod.card.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-600">현금</span>
                        <span className="font-bold">{summary.totalsByMethod.cash.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-600">계좌이체</span>
                        <span className="font-bold">{summary.totalsByMethod.transfer.toLocaleString()}원</span>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="flex-grow overflow-y-auto border border-gray-200 rounded-lg bg-white">
                <div className="sticky top-0 bg-gray-50 z-10">
                    <div className="grid grid-cols-8 gap-4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-1">시간</div>
                        <div className="col-span-1">환자명</div>
                        <div className="col-span-3">치료 항목</div>
                        <div className="col-span-1">결제 방식</div>
                        <div className="col-span-1 text-right">총 금액</div>
                        <div className="col-span-1 text-right">미수금</div>
                    </div>
                </div>
                <div className="divide-y divide-gray-200">
                    {sortedPayments.length > 0 ? (
                        sortedPayments.map(p => (
                            <div key={p.id} className="grid grid-cols-8 gap-4 px-4 py-3 items-start">
                                <div className="col-span-1 text-sm text-gray-900 pt-1">{new Date(p.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="col-span-1 text-sm font-semibold text-gray-900 pt-1">{p.patientName}</div>
                                <div className="col-span-3 text-xs text-gray-600 space-y-1">
                                    {p.treatmentItems.map(item => (
                                        <div key={item.id}>
                                            <div className="flex justify-between items-center">
                                                <div className="truncate">
                                                    <span className={`font-semibold text-xs py-0.5 px-1.5 rounded-full mr-2 ${item.category === 'covered' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                        {item.category === 'covered' ? '급여' : '비급여'}
                                                    </span>
                                                    <span title={item.name}>{item.name}</span>
                                                </div>
                                                <span className="flex-shrink-0 ml-2">{item.amount.toLocaleString()}원</span>
                                            </div>
                                            {item.memo && (
                                                <div className="text-xs text-gray-500 mt-0.5 pl-2" title={item.memo}>
                                                    <i className="fa-regular fa-note-sticky mr-1.5 text-gray-400"></i>
                                                    <span className="italic">{item.memo}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="col-span-1 text-xs text-gray-500 pt-1">
                                    {p.paymentMethods.length > 0 ? (
                                        p.paymentMethods.map((pm, index) => (
                                            <div key={index} className="flex justify-between">
                                                <span>{getPaymentMethodName(pm.method)}:</span>
                                                <span className="font-semibold">{pm.amount.toLocaleString()}원</span>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-gray-400">결제 없음</span>
                                    )}
                                </div>
                                <div className="col-span-1 text-right text-sm font-medium text-gray-900 pt-1">{p.totalAmount.toLocaleString()}원</div>
                                <div className={`col-span-1 text-right text-sm font-bold pt-1 ${p.remainingAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                    {p.remainingAmount.toLocaleString()}원
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            해당 날짜에 완료된 수납 내역이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyPaymentSummary;
