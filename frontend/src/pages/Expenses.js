import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Trash2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { formatDate, formatPrice } from '../utils/helpers';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Expenses = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    agency_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchExpenses();
      if (user.role === 'admin') {
        fetchAgencies();
      }
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses`);
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setAgencies(response.data.filter(u => u.role === 'sub_agency'));
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses`, formData);
      toast.success(t('common.success'));
      setShowDialog(false);
      setFormData({
        agency_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('common.confirm'))) {
      try {
        await axios.delete(`${API}/expenses/${id}`);
        toast.success(t('common.success'));
        fetchExpenses();
      } catch (error) {
        toast.error(error.response?.data?.detail || t('common.error'));
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-oxford-blue">
            {user.role === 'admin' ? t('expenses.title') : t('expenses.myExpenses')}
          </h1>
          
          {user.role === 'admin' && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-safety-orange hover:bg-safety-orange/90 w-full sm:w-auto">
                  {t('expenses.add')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('expenses.add')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>{t('expenses.agency')} *</Label>
                    <Select 
                      value={formData.agency_id} 
                      onValueChange={(value) => setFormData({...formData, agency_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('expenses.agency')} />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.map(agency => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.agency_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('expenses.amount')} (₽) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>{t('expenses.date')} *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>{t('expenses.description')} *</Label>
                    <Input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                      placeholder={t('expenses.description')}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" className="bg-safety-orange hover:bg-safety-orange/90">
                      {t('common.save')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('expenses.date')}</TableHead>
                  {user.role === 'admin' && <TableHead>{t('expenses.agency')}</TableHead>}
                  <TableHead>{t('expenses.amount')}</TableHead>
                  <TableHead>{t('expenses.description')}</TableHead>
                  {user.role === 'admin' && <TableHead>{t('columns.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'admin' ? 5 : 3} className="text-center py-8">
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'admin' ? 5 : 3} className="text-center py-8">
                      {t('common.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense, idx) => (
                    <TableRow key={expense.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/50 hover:bg-blue-100/50'}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      {user.role === 'admin' && <TableCell className="font-medium">{expense.agency_name}</TableCell>}
                      <TableCell className="font-semibold text-red-600">{formatPrice(expense.amount)} ₽</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      {user.role === 'admin' && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Expenses;
