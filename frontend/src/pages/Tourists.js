import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { COUNTRIES, formatDate } from '../utils/helpers';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Tourists = () => {
  const { t } = useI18n();
  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTourist, setEditingTourist] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    citizenship: '',
    document_type: '',
    document_number: '',
    document_expiration: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchTourists();
  }, []);

  const fetchTourists = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/tourists`);
      setTourists(response.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTourist) {
        await axios.put(`${API}/tourists/${editingTourist.id}`, formData);
      } else {
        await axios.post(`${API}/tourists`, formData);
      }
      toast.success(t('common.success'));
      setShowDialog(false);
      setEditingTourist(null);
      resetForm();
      fetchTourists();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = (tourist) => {
    setEditingTourist(tourist);
    setFormData({
      first_name: tourist.first_name || '',
      last_name: tourist.last_name || '',
      date_of_birth: tourist.date_of_birth || '',
      gender: tourist.gender || '',
      citizenship: tourist.citizenship || '',
      document_type: tourist.document_type || '',
      document_number: tourist.document_number || '',
      document_expiration: tourist.document_expiration || '',
      phone: tourist.phone || '',
      email: tourist.email || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (touristId) => {
    if (!window.confirm('Are you sure you want to delete this tourist?')) return;
    
    try {
      await axios.delete(`${API}/tourists/${touristId}`);
      toast.success(t('common.success'));
      fetchTourists();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      citizenship: '',
      document_type: '',
      document_number: '',
      document_expiration: '',
      phone: '',
      email: ''
    });
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingTourist(null);
    resetForm();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-oxford-blue">Туристы</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-safety-orange hover:bg-safety-orange/90" data-testid="add-tourist-button">
                <Plus className="h-4 w-4 mr-2" />
                Добавить туриста
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTourist ? 'Редактировать туриста' : 'Добавить туриста'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-oxford-blue mb-4">Личная информация</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Имя *</Label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        required
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label>Фамилия *</Label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        required
                        placeholder="Smith"
                      />
                    </div>
                    <div>
                      <Label>Дата рождения</Label>
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Пол</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите пол" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Мужской</SelectItem>
                          <SelectItem value="F">Женский</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Document Information */}
                <div>
                  <h3 className="text-lg font-semibold text-oxford-blue mb-4">Паспортные данные</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Гражданство</Label>
                      <Select value={formData.citizenship} onValueChange={(value) => setFormData({...formData, citizenship: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите страну" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Тип документа</Label>
                      <Select value={formData.document_type} onValueChange={(value) => setFormData({...formData, document_type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Тип документа" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">National passport or ID card</SelectItem>
                          <SelectItem value="international">International passport</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Номер документа</Label>
                      <Input
                        value={formData.document_number}
                        onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                        placeholder="A0123456789"
                      />
                    </div>
                    <div>
                      <Label>Срок действия</Label>
                      <Input
                        type="date"
                        value={formData.document_expiration}
                        onChange={(e) => setFormData({...formData, document_expiration: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-oxford-blue mb-4">Контактная информация</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Телефон</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+11231234567"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="example@mail.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="bg-safety-orange hover:bg-safety-orange/90">
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Фамилия</TableHead>
                <TableHead>Дата рождения</TableHead>
                <TableHead>Документ</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">{t('common.loading')}</TableCell>
                </TableRow>
              ) : tourists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">{t('common.noData')}</TableCell>
                </TableRow>
              ) : (
                tourists.map((tourist, idx) => (
                  <TableRow key={tourist.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>{tourist.first_name}</TableCell>
                    <TableCell>{tourist.last_name}</TableCell>
                    <TableCell>{tourist.date_of_birth ? new Date(tourist.date_of_birth).toLocaleDateString('ru-RU') : '—'}</TableCell>
                    <TableCell>{tourist.document_number || '—'}</TableCell>
                    <TableCell>{tourist.phone || '—'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(tourist)}
                          data-testid={`edit-tourist-${tourist.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(tourist.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-tourist-${tourist.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Tourists;
