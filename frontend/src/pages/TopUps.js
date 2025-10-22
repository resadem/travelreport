import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ButtonSelector } from '../components/ui/button-selector';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

const TopUps = () => {
  const { t, locale } = useI18n();
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedTopup, setSelectedTopup] = useState(null);
  const [editForm, setEditForm] = useState({ amount: '', type: 'cash' });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  const typeOptions = [
    { value: 'cash', label: locale === 'ru' ? 'Наличные' : 'Cash' },
    { value: 'other', label: locale === 'ru' ? 'Другое' : 'Other' }
  ];

  const fetchTopups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/topups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTopups(data);
      }
    } catch (error) {
      console.error('Error fetching topups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopups();
  }, []);

  const handleEdit = (topup) => {
    setSelectedTopup(topup);
    setEditForm({ amount: topup.amount, type: topup.type });
    setEditDialog(true);
  };

  const handleDelete = (topup) => {
    setSelectedTopup(topup);
    setDeleteDialog(true);
  };

  const submitEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/topups/${selectedTopup.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          type: editForm.type
        })
      });
      
      if (response.ok) {
        setEditDialog(false);
        fetchTopups();
      }
    } catch (error) {
      console.error('Error updating topup:', error);
    }
  };

  const submitDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/topups/${selectedTopup.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setDeleteDialog(false);
        fetchTopups();
      }
    } catch (error) {
      console.error('Error deleting topup:', error);
    }
  };

  // Calculate this month's total
  const thisMonthTotal = topups
    .filter(topup => {
      const topupDate = new Date(topup.date);
      const now = new Date();
      return topupDate.getMonth() === now.getMonth() && 
             topupDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, topup) => sum + topup.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">{locale === 'ru' ? 'Загрузка...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.topUps.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.topUps.allTopUps}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-sm text-gray-600">{t.topUps.thisMonth}</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(thisMonthTotal)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.topUps.agency}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.topUps.amount}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.topUps.type}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.topUps.date}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.common.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topups.map((topup, index) => (
                <tr key={topup.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {topup.agency_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(topup.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {topup.type === 'cash' 
                      ? (locale === 'ru' ? 'Наличные' : 'Cash')
                      : (locale === 'ru' ? 'Другое' : 'Other')
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(topup.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(topup)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(topup)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {locale === 'ru' ? 'Пополнения не найдены' : 'No top-ups found'}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.topUps.editTopUp}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.topUps.amount}</Label>
              <Input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                step="0.01"
              />
            </div>
            <ButtonSelector
              label={t.topUps.type}
              options={typeOptions}
              value={editForm.type}
              onChange={(value) => setEditForm({ ...editForm, type: value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={submitEdit}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'ru' ? 'Удалить пополнение?' : 'Delete Top-up?'}
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">
            {locale === 'ru' 
              ? 'Вы уверены, что хотите удалить это пополнение? Баланс агентства будет скорректирован.'
              : 'Are you sure you want to delete this top-up? The agency balance will be adjusted.'
            }
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={submitDelete}>
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopUps;
