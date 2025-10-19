import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Save, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';

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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) return;
    
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('reservation.back')}
              </Button>
              <h1 className="text-2xl font-bold text-oxford-blue">{t('reservation.details')}</h1>
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

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <Label>{t('columns.agency')}</Label>
                {canEdit ? (
                  <Input value={formData.agency_name || ''} onChange={(e) => setFormData({...formData, agency_name: e.target.value})} />
                ) : (
                  <div className="mt-1 text-lg font-medium">{reservation.agency_name}</div>
                )}
              </div>

              <div>
                <Label>{t('columns.serviceType')}</Label>
                {canEdit ? (
                  <Select value={formData.service_type} onValueChange={(value) => setFormData({...formData, service_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{t(`serviceTypes.${type}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 text-lg font-medium">{t(`serviceTypes.${reservation.service_type}`)}</div>
                )}
              </div>

              <div>
                <Label>{t('columns.dateOfIssue')}</Label>
                {canEdit ? (
                  <Input type="date" value={formData.date_of_issue?.split('T')[0] || ''} onChange={(e) => setFormData({...formData, date_of_issue: e.target.value})} />
                ) : (
                  <div className="mt-1 text-lg font-medium">{new Date(reservation.date_of_issue).toLocaleDateString()}</div>
                )}
              </div>

              <div>
                <Label>{t('columns.dateOfService')}</Label>
                {canEdit ? (
                  <Input type="date" value={formData.date_of_service?.split('T')[0] || ''} onChange={(e) => setFormData({...formData, date_of_service: e.target.value})} />
                ) : (
                  <div className="mt-1 text-lg font-medium">{new Date(reservation.date_of_service).toLocaleDateString()}</div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>{t('columns.description')}</Label>
                {canEdit ? (
                  <Input value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                ) : (
                  <div className="mt-1 text-lg font-medium">{reservation.description}</div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>{t('columns.touristNames')}</Label>
                {canEdit ? (
                  <Input value={formData.tourist_names || ''} onChange={(e) => setFormData({...formData, tourist_names: e.target.value})} />
                ) : (
                  <div className="mt-1 text-lg font-medium">{reservation.tourist_names}</div>
                )}
              </div>

              {/* Payment Information */}
              <div>
                <Label>{t('columns.price')}</Label>
                {canEdit ? (
                  <Input type="number" step="0.01" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                ) : (
                  <div className="mt-1 text-xl font-bold text-picton-blue">${reservation.price?.toFixed(2)}</div>
                )}
              </div>

              <div>
                <Label>{t('columns.prepaymentAmount')}</Label>
                {canEdit ? (
                  <Input type="number" step="0.01" value={formData.prepayment_amount || ''} onChange={(e) => setFormData({...formData, prepayment_amount: e.target.value})} />
                ) : (
                  <div className="mt-1 text-xl font-bold text-green-600">${reservation.prepayment_amount?.toFixed(2)}</div>
                )}
              </div>

              <div>
                <Label>{t('columns.restAmount')}</Label>
                <div className="mt-1 text-xl font-bold text-safety-orange">${reservation.rest_amount_of_payment?.toFixed(2)}</div>
              </div>

              <div>
                <Label>{t('columns.lastDatePayment')}</Label>
                {canEdit ? (
                  <Input type="date" value={formData.last_date_of_payment?.split('T')[0] || ''} onChange={(e) => setFormData({...formData, last_date_of_payment: e.target.value})} />
                ) : (
                  <div className="mt-1 text-lg font-medium">{new Date(reservation.last_date_of_payment).toLocaleDateString()}</div>
                )}
              </div>

              <div>
                <Label>{t('columns.actualDatePrepayment')}</Label>
                {canEdit ? (
                  <Input type="date" value={formData.actual_date_of_prepayment?.split('T')[0] || ''} onChange={(e) => setFormData({...formData, actual_date_of_prepayment: e.target.value})} />
                ) : (
                  <div className="mt-1 text-lg font-medium">{reservation.actual_date_of_prepayment ? new Date(reservation.actual_date_of_prepayment).toLocaleDateString() : '—'}</div>
                )}
              </div>

              <div>
                <Label>{t('columns.actualDateFullPayment')}</Label>
                {canEdit ? (
                  <Input type="date" value={formData.actual_date_of_full_payment?.split('T')[0] || ''} onChange={(e) => setFormData({...formData, actual_date_of_full_payment: e.target.value})} />
                ) : (
                  <div className="mt-1 text-lg font-medium">{reservation.actual_date_of_full_payment ? new Date(reservation.actual_date_of_full_payment).toLocaleDateString() : '—'}</div>
                )}
              </div>

              {/* Admin-only fields */}
              {isAdmin && reservation.supplier !== undefined && (
                <>
                  <div className="md:col-span-2">
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-semibold text-oxford-blue mb-4">Admin Information</h3>
                    </div>
                  </div>

                  <div>
                    <Label>{t('columns.supplier')}</Label>
                    {canEdit ? (
                      <Input value={formData.supplier || ''} onChange={(e) => setFormData({...formData, supplier: e.target.value})} />
                    ) : (
                      <div className="mt-1 text-lg font-medium">{reservation.supplier || '—'}</div>
                    )}
                  </div>

                  <div>
                    <Label>{t('columns.supplierPrice')}</Label>
                    {canEdit ? (
                      <Input type="number" step="0.01" value={formData.supplier_price || ''} onChange={(e) => setFormData({...formData, supplier_price: e.target.value})} />
                    ) : (
                      <div className="mt-1 text-lg font-medium">${reservation.supplier_price?.toFixed(2) || '0.00'}</div>
                    )}
                  </div>

                  <div>
                    <Label>{t('columns.supplierPrepayment')}</Label>
                    {canEdit ? (
                      <Input type="number" step="0.01" value={formData.supplier_prepayment_amount || ''} onChange={(e) => setFormData({...formData, supplier_prepayment_amount: e.target.value})} />
                    ) : (
                      <div className="mt-1 text-lg font-medium">${reservation.supplier_prepayment_amount?.toFixed(2) || '0.00'}</div>
                    )}
                  </div>

                  <div>
                    <Label>{t('columns.revenue')}</Label>
                    {canEdit ? (
                      <Input type="number" step="0.01" value={formData.revenue || ''} onChange={(e) => setFormData({...formData, revenue: e.target.value})} />
                    ) : (
                      <div className="mt-1 text-xl font-bold text-green-600">${reservation.revenue?.toFixed(2) || '0.00'}</div>
                    )}
                  </div>

                  <div>
                    <Label>{t('columns.revenuePercentage')}</Label>
                    {canEdit ? (
                      <Input type="number" step="0.01" value={formData.revenue_percentage || ''} onChange={(e) => setFormData({...formData, revenue_percentage: e.target.value})} />
                    ) : (
                      <div className="mt-1 text-xl font-bold text-green-600">{reservation.revenue_percentage?.toFixed(2) || '0.00'}%</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ReservationDetails;