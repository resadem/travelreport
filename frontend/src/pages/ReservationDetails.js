import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Save, Trash2, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import { formatDate, formatPrice } from '../utils/helpers';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SERVICE_TYPES = ['Flight', 'Hotel', 'Transfer', 'Train ticket', 'Additional flight service', 'Airport VIP Services', 'eSIM'];

const ReservationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const fetchReservation = async () => {
    try {
      const response = await axios.get(`${API}/reservations/${id}`);
      setReservation(response.data);
      setFormData(response.data);
    } catch (error) {
      toast.error(t('common.error'));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData };
      if (updateData.price && updateData.prepayment_amount !== undefined) {
        updateData.rest_amount_of_payment = parseFloat(updateData.price) - (parseFloat(updateData.prepayment_amount) || 0);
      }
      
      await axios.put(`${API}/reservations/${id}`, updateData);
      toast.success(t('common.success'));
      setEditing(false);
      fetchReservation();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleMarkAsPaid = async () => {
    if (!window.confirm('Отметить бронирование как полностью оплаченное?')) return;
    
    try {
      setMarking(true);
      await axios.post(`${API}/reservations/${id}/mark-paid`);
      toast.success('Бронирование отмечено как оплаченное');
      fetchReservation();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setMarking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить это бронирование?')) return;
    
    try {
      await axios.delete(`${API}/reservations/${id}`);
      toast.success(t('common.success'));
      navigate('/');
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-picton-blue"></div>
        </div>
      </Layout>
    );
  }

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin && editing;
  const isPaid = reservation.rest_amount_of_payment === 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('reservation.back')}
            </Button>
            <h1 className="text-3xl font-bold text-oxford-blue">{t('reservation.details')}</h1>
          </div>
          {isAdmin && (
            <div className="flex space-x-2">
              {!editing ? (
                <>
                  <Button onClick={() => setEditing(true)} className="bg-picton-blue hover:bg-picton-blue/90" data-testid="edit-button">
                    <Edit className="h-4 w-4 mr-2" />
                    {t('reservation.edit')}
                  </Button>
                  <Button onClick={handleDelete} variant="destructive" data-testid="delete-button">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('reservation.delete')}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setEditing(false)} variant="outline">
                    {t('reservation.cancel')}
                  </Button>
                  <Button onClick={handleUpdate} className="bg-safety-orange hover:bg-safety-orange/90" data-testid="save-button">
                    <Save className="h-4 w-4 mr-2" />
                    {t('reservation.save')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-oxford-blue">Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">{t('columns.agency')}</Label>
                    {canEdit ? (
                      <Input value={formData.agency_name || ''} onChange={(e) => setFormData({...formData, agency_name: e.target.value})} className="mt-1" />
                    ) : (
                      <div className="mt-1 text-lg font-semibold text-oxford-blue">{reservation.agency_name}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-600">{t('columns.serviceType')}</Label>
                    {canEdit ? (
                      <Select value={formData.service_type} onValueChange={(value) => setFormData({...formData, service_type: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{t(`serviceTypes.${type}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 text-lg font-semibold text-oxford-blue">{t(`serviceTypes.${reservation.service_type}`)}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-600">{t('columns.dateOfIssue')}</Label>
                    {canEdit ? (
                      <Input type="date" value={formData.date_of_issue?.split('T')[0] || ''} onChange={(e) => setFormData({...formData, date_of_issue: e.target.value})} className="mt-1" />
                    ) : (
                      <div className="mt-1 text-lg font-medium">{formatDate(reservation.date_of_issue)}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-600">{t('columns.dateOfService')}</Label>
                    {canEdit ? (
                      <Input type="date" value={formData.date_of_service?.split('T')[0] || ''} onChange={(e) => setFormData({...formData, date_of_service: e.target.value})} className="mt-1" />
                    ) : (
                      <div className="mt-1 text-lg font-medium">{formatDate(reservation.date_of_service)}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-600">{t('columns.lastDatePayment')}</Label>
                    {canEdit ? (
                      <Input type="date" value={formData.last_date_of_payment?.split('T')[0] || ''} onChange={(e) => setFormData({...formData, last_date_of_payment: e.target.value})} className="mt-1" />
                    ) : (
                      <div className="mt-1 text-lg font-medium">{formatDate(reservation.last_date_of_payment)}</div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">{t('columns.description')}</Label>
                  {canEdit ? (
                    <Input value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="mt-1" />
                  ) : (
                    <div className="mt-1 text-lg font-medium">{reservation.description}</div>
                  )}
                </div>

                <div>
                  <Label className="text-gray-600">{t('columns.touristNames')}</Label>
                  {canEdit ? (
                    <Input value={formData.tourist_names || ''} onChange={(e) => setFormData({...formData, tourist_names: e.target.value})} className="mt-1" />
                  ) : (
                    <div className="mt-1 text-lg font-medium">{reservation.tourist_names}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin Only - Supplier Info */}
            {isAdmin && reservation.supplier_name !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-oxford-blue">Информация о поставщике</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">{t('columns.supplier')}</Label>
                      {canEdit ? (
                        <Input value={formData.supplier_name || ''} onChange={(e) => setFormData({...formData, supplier_name: e.target.value})} className="mt-1" />
                      ) : (
                        <div className="mt-1 text-lg font-medium">{reservation.supplier_name || '—'}</div>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-600">{t('columns.supplierPrice')}</Label>
                      {canEdit ? (
                        <Input type="number" step="0.01" value={formData.supplier_price || ''} onChange={(e) => setFormData({...formData, supplier_price: e.target.value})} className="mt-1" />
                      ) : (
                        <div className="mt-1 text-xl font-bold text-picton-blue">{reservation.supplier_price?.toFixed(2) || '0.00'} ₽</div>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-600">{t('columns.supplierPrepayment')}</Label>
                      {canEdit ? (
                        <Input type="number" step="0.01" value={formData.supplier_prepayment_amount || ''} onChange={(e) => setFormData({...formData, supplier_prepayment_amount: e.target.value})} className="mt-1" />
                      ) : (
                        <div className="mt-1 text-lg font-medium">{reservation.supplier_prepayment_amount?.toFixed(2) || '0.00'} ₽</div>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-600">{t('columns.revenue')}</Label>
                      {canEdit ? (
                        <Input type="number" step="0.01" value={formData.revenue || ''} onChange={(e) => setFormData({...formData, revenue: e.target.value})} className="mt-1" />
                      ) : (
                        <div className="mt-1 text-xl font-bold text-green-600">{reservation.revenue?.toFixed(2) || '0.00'} ₽</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Payment Info */}
          <div className="space-y-6">
            <Card className="border-2 border-picton-blue">
              <CardHeader className="bg-gradient-to-r from-picton-blue/10 to-oxford-blue/10">
                <CardTitle className="text-xl text-oxford-blue">Финансовая информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label className="text-gray-600">{t('columns.price')}</Label>
                  {canEdit ? (
                    <Input type="number" step="0.01" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} className="mt-1" />
                  ) : (
                    <div className="mt-1 text-3xl font-bold text-picton-blue">{reservation.price?.toFixed(2)} ₽</div>
                  )}
                </div>

                <div>
                  <Label className="text-gray-600">{t('columns.prepaymentAmount')}</Label>
                  {canEdit ? (
                    <Input type="number" step="0.01" value={formData.prepayment_amount || ''} onChange={(e) => setFormData({...formData, prepayment_amount: e.target.value})} className="mt-1" />
                  ) : (
                    <div className="mt-1 text-2xl font-bold text-green-600">{reservation.prepayment_amount?.toFixed(2)} ₽</div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-gray-600">{t('columns.restAmount')}</Label>
                    {isAdmin && !isPaid && !editing && (
                      <Button 
                        size="sm" 
                        onClick={handleMarkAsPaid} 
                        disabled={marking}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid="mark-paid-button"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Оплачено
                      </Button>
                    )}
                  </div>
                  <div className={`text-3xl font-bold ${isPaid ? 'text-green-600' : 'text-safety-orange'}`}>
                    {reservation.rest_amount_of_payment?.toFixed(2)} ₽
                  </div>
                  {isPaid && (
                    <div className="mt-2 px-3 py-2 bg-green-100 rounded-lg">
                      <span className="text-green-800 font-semibold">✓ Оплачено полностью</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div>
                    <Label className="text-gray-600 text-sm">{t('columns.actualDatePrepayment')}</Label>
                    <div className="mt-1 text-base font-medium">
                      {reservation.actual_date_of_prepayment ? formatDate(reservation.actual_date_of_prepayment) : '—'}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-600 text-sm">{t('columns.actualDateFullPayment')}</Label>
                    <div className="mt-1 text-base font-medium">
                      {reservation.actual_date_of_full_payment ? formatDate(reservation.actual_date_of_full_payment) : '—'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReservationDetails;
