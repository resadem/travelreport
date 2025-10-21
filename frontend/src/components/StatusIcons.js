import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const StatusIcon = ({ status, label }) => {
  const getIcon = () => {
    if (status === 'confirmed' || status === 'paid' || status === 'ready') {
      return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    } else if (status === 'cancelled' || status === 'not_confirmed' || status === 'not_paid' || status === 'not_ready') {
      return <XCircle className="w-6 h-6 text-red-600" />;
    } else {
      return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getTooltipText = () => {
    if (status === 'confirmed') return label + ': Подтверждено / Confirmed';
    if (status === 'not_confirmed') return label + ': Не подтверждено / Not Confirmed';
    if (status === 'paid') return label + ': Оплачено / Paid';
    if (status === 'not_paid') return label + ': Не оплачено / Not Paid';
    if (status === 'ready') return label + ': Готов / Ready';
    if (status === 'not_ready') return label + ': Не готов / Not Ready';
    return label + ': ' + status;
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

const StatusIcons = ({ reservationStatus, paymentStatus, documentStatus }) => {
  return (
    <div className="flex flex-col gap-2 items-center md:flex-col">
      <StatusIcon status={reservationStatus} label="Бронь" />
      <StatusIcon status={paymentStatus} label="Оплата" />
      <StatusIcon status={documentStatus} label="Документ" />
    </div>
  );
};

export default StatusIcons;
