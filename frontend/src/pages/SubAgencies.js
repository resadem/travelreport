import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubAgencies = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    agency_name: '',
    email: '',
    phone: '',
    password: '',
    locale: 'ru',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users`);
      setUsers(response.data.filter(u => u.role !== 'admin'));
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await axios.put(`${API}/users/${editingUser.id}`, updateData);
      } else {
        await axios.post(`${API}/auth/register`, {
          ...formData,
          role: 'sub_agency'
        });
      }
      toast.success(t('common.success'));
      setShowDialog(false);
      setEditingUser(null);
      setFormData({
        agency_name: '',
        email: '',
        phone: '',
        password: '',
        locale: 'ru',
        is_active: true
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      agency_name: user.agency_name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      locale: user.locale,
      is_active: user.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this sub-agency?')) return;
    
    try {
      await axios.delete(`${API}/users/${userId}`);
      toast.success(t('common.success'));
      fetchUsers();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`${API}/users/${userId}`, {
        is_active: !currentStatus
      });
      toast.success(t('common.success'));
      fetchUsers();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingUser(null);
    setFormData({
      agency_name: '',
      email: '',
      phone: '',
      password: '',
      locale: 'ru',
      is_active: true
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-oxford-blue">Агентства</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-safety-orange hover:bg-safety-orange/90 w-full sm:w-auto" data-testid="add-sub-agency-button">
                <Plus className="h-4 w-4 mr-2" />
                {t('subAgencies.add')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? t('subAgencies.edit') : t('subAgencies.add')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>{t('subAgencies.agencyName')} *</Label>
                  <Input
                    value={formData.agency_name}
                    onChange={(e) => setFormData({...formData, agency_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>{t('subAgencies.email')} *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Телефон</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+7 999 123 45 67"
                  />
                </div>
                <div>
                  <Label>{t('subAgencies.password')} {editingUser && '(оставьте пустым, чтобы не менять)'}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                    placeholder={editingUser ? 'Оставьте пустым' : ''}
                  />
                </div>
                <div>
                  <Label>{t('subAgencies.locale')}</Label>
                  <Select value={formData.locale} onValueChange={(value) => setFormData({...formData, locale: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label>{t('subAgencies.active')}</Label>
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
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('subAgencies.name')}</TableHead>
                <TableHead>{t('subAgencies.email')}</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>{t('subAgencies.locale')}</TableHead>
                <TableHead>{t('subAgencies.status')}</TableHead>
                <TableHead>{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">{t('common.loading')}</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">{t('common.noData')}</TableCell>
                </TableRow>
              ) : (
                users.map((user, idx) => (
                  <TableRow key={user.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <TableCell className="font-medium">{user.agency_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '—'}</TableCell>
                    <TableCell>{user.locale === 'ru' ? 'Русский' : 'English'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => handleToggleStatus(user.id, user.is_active)}
                          data-testid={`toggle-status-${user.id}`}
                        />
                        <span className={user.is_active ? 'text-green-600' : 'text-gray-400'}>
                          {user.is_active ? t('subAgencies.active') : t('subAgencies.inactive')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(user)}
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-user-${user.id}`}
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
      </div>
    </Layout>
  );
};

export default SubAgencies;
