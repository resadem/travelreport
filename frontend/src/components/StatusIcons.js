import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const StatusIcon = ({ status, label }) => {
  const getIcon = () => {
    // Reservation status
    if (status === 'in_progress') {
      return <Clock className="w-6 h-6 text-yellow-600" />;
    } else if (status === 'booked' || status === 'partially_paid') {
      return <AlertCircle className="w-6 h-6 text-blue-600" />;
    } else if (status === 'confirmed' || status === 'paid' || status === 'documents_ready') {
      return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    } else if (status === 'cancelled' || status === 'not_paid') {
      return <XCircle className="w-6 h-6 text-red-600" />;
    } else if (status === 'awaiting_payment' || status === 'documents_not_ready') {
      return <Clock className="w-6 h-6 text-gray-500" />;
    } else {
      return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getTooltipText = () => {
    const statusMap = {
      // Reservation statuses
      'in_progress': 'В работе / Working on',
      'booked': 'Забронирована / Booked',
      'confirmed': 'Подтверждено / Confirmed',
      'cancelled': 'Аннулировано / Canceled',
      // Payment statuses
      'awaiting_payment': 'Ожидание оплаты / Waiting payment',
      'paid': 'Оплачено / Paid',
      'partially_paid': 'Частично оплачено / Partly paid',
      'not_paid': 'Не оплачено / Not paid',
      // Document statuses
      'documents_ready': 'Документы готовы / Documents Ready',
      'documents_not_ready': 'Документы не готовы / Documents Not Ready'
    };
    
    return `${label}: ${statusMap[status] || status}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center cursor-help">
            {getIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-sm">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StatusIcons = ({ reservationStatus, paymentStatus, documentStatus, horizontal = false }) => {
  return (
    <div className={`flex ${horizontal ? 'flex-row' : 'flex-col'} gap-2 items-center`}>
      <StatusIcon status={reservationStatus} label="Бронь" />
      <StatusIcon status={paymentStatus} label="Оплата" />
      <StatusIcon status={documentStatus} label="Документ" />
    </div>
  );
};

export default StatusIcons;
