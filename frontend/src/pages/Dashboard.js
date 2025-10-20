import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Search, Download, Plus, Eye } from 'lucide-react';
import Layout from '../components/Layout';
import { formatDate, formatPrice } from '../utils/helpers';
import * as XLSX from 'xlsx';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVICE_TYPES = ['Flight', 'Hotel', 'Transfer', 'Train ticket', 'Additional flight service', 'Airport VIP Services', 'eSIM'];

const Dashboard = () => {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [thresholdDays, setThresholdDays] = useState(7);
  const [agencies, setAgencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [touristNames, setTouristNames] = useState([]);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    agency_id: null,
    agency_name: '',
    date_of_issue: today,
    service_type: 'Flight',
    date_of_service: '',
    description: '',
    tourist_names: '',
    price: '',
    prepayment_amount: '',
    last_date_of_payment: today,
    supplier_id: null,
    supplier_name: '',
    supplier_price: '',
    supplier_prepayment_amount: ''
  });

  useEffect(() => {
    fetchReservations();
    fetchStatistics();
    fetchSettings();
    if (user?.role === 'admin') {
      fetchAgencies();
      fetchSuppliers();
      fetchTouristNames();
    }
  }, [page, search, serviceType, paymentStatus]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setThresholdDays(response.data.upcoming_due_threshold_days || 7);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setAgencies(response.data.filter(u => u.role === 'sub_agency'));
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchTouristNames = async () => {
    try {
      const response = await axios.get(`${API}/tourist-names`);
      setTouristNames(response.data.names || []);
    } catch (error) {
      console.error('Failed to fetch tourist names:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 25 };
      if (search) params.search = search;
      if (serviceType && serviceType !== 'all') params.service_type = serviceType;
      if (paymentStatus && paymentStatus !== 'all') params.payment_status = paymentStatus;

      const response = await axios.get(`${API}/reservations`, { params });
      setReservations(response.data.reservations);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API}/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) return;
    try {
      const response = await axios.post(`${API}/suppliers`, { name: newSupplierName });
      setSuppliers([...suppliers, response.data]);
      setFormData({ ...formData, supplier_id: response.data.id, supplier_name: response.data.name });
      setNewSupplierName('');
      setShowSupplierDialog(false);
      toast.success('Поставщик добавлен');
    } catch (error) {
      toast.error('Ошибка добавления поставщика');
    }
  };

  const handleAddReservation = async (e) => {
    e.preventDefault();
    try {
      const restAmount = parseFloat(formData.price) - (parseFloat(formData.prepayment_amount) || 0);
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        prepayment_amount: parseFloat(formData.prepayment_amount || 0),
        rest_amount_of_payment: restAmount,
        supplier_price: parseFloat(formData.supplier_price || 0),
        supplier_prepayment_amount: parseFloat(formData.supplier_prepayment_amount || 0)
      };

      await axios.post(`${API}/reservations`, data);
      toast.success(t('common.success'));
      setShowAddDialog(false);
      fetchReservations();
      fetchStatistics();
      fetchTouristNames();
      setFormData({
        agency_id: null,
        agency_name: '',
        date_of_issue: today,
        service_type: 'Flight',
        date_of_service: '',
        description: '',
        tourist_names: '',
        price: '',
        prepayment_amount: '',
        last_date_of_payment: today,
        supplier_id: null,
        supplier_name: '',
        supplier_price: '',
        supplier_prepayment_amount: ''
      });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const exportToCSV = () => {
    const headers = [
      t('columns.id'),
      t('columns.agency'),
      t('columns.dateOfIssue'),
      t('columns.serviceType'),
      t('columns.dateOfService'),
      t('columns.description'),
      t('columns.touristNames'),
      t('columns.price'),
      t('columns.actualDateFullPayment'),
      t('columns.actualDatePrepayment'),
      t('columns.prepaymentAmount'),
      t('columns.restAmount'),
      t('columns.lastDatePayment')
    ];

    if (user.role === 'admin') {
      headers.push(
        t('columns.supplier'),
        t('columns.supplierPrice'),
        t('columns.supplierPrepayment'),
        t('columns.revenue'),
        t('columns.revenuePercentage')
      );
    }

    const rows = reservations.map((r, idx) => {
      const row = [
        idx + 1,
        r.agency_name,
        formatDate(r.date_of_issue),
        r.service_type,
        formatDate(r.date_of_service),
        r.description,
        r.tourist_names,
        formatPrice(r.price),
        r.actual_date_of_full_payment ? formatDate(r.actual_date_of_full_payment) : '—',
        r.actual_date_of_prepayment ? formatDate(r.actual_date_of_prepayment) : '—',
        formatPrice(r.prepayment_amount),
        formatPrice(r.rest_amount_of_payment),
        formatDate(r.last_date_of_payment)
      ];

      if (user.role === 'admin') {
        row.push(
          r.supplier_name || '',
          formatPrice(r.supplier_price),
          formatPrice(r.supplier_prepayment_amount),
          formatPrice(r.revenue),
          r.revenue_percentage || 0
        );
      }

      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservations');
    
    // Save file
    XLSX.writeFile(wb, `reservations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getPaymentBadge = (reservation) => {
    const rest = reservation.rest_amount_of_payment || 0;
    const prepayment = reservation.prepayment_amount || 0;
    const lastDate = reservation.last_date_of_payment;

    if (rest === 0) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">{t('paymentStatus.paid')}</span>;
    }

    if (lastDate) {
      const lastDateObj = new Date(lastDate);
      const today = new Date();
      const diffDays = Math.ceil((lastDateObj - today) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">{t('paymentStatus.overdue')}</span>;
      }

      if (diffDays <= thresholdDays) {
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{t('paymentStatus.upcoming')}: {diffDays} {t('paymentStatus.days')}</span>;
      }
    }

    if (prepayment > 0) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{t('paymentStatus.prepaid')}</span>;
    }

    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{t('paymentStatus.unpaid')}</span>;
  };

  const handleAgencyChange = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    if (agency) {
      setFormData({
        ...formData,
        agency_id: agency.id,
        agency_name: agency.agency_name
      });
    }
  };

  const handleSupplierChange = (supplierId) => {
    if (!supplierId) {
      setFormData({
        ...formData,
        supplier_id: null,
        supplier_name: ''
      });
      return;
    }
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setFormData({
        ...formData,
        supplier_id: supplier.id,
        supplier_name: supplier.name
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">{t('dashboard.totalReservations')}</div>
            <div className="text-3xl font-bold text-oxford-blue">{statistics.total_reservations || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">{t('dashboard.totalPrice')}</div>
            <div className="text-3xl font-bold text-picton-blue">{formatPrice(statistics.total_price)} ₽</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">{t('dashboard.totalPrepayment')}</div>
            <div className="text-3xl font-bold text-green-600">{formatPrice(statistics.total_prepayment)} ₽</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">{t('dashboard.totalRest')}</div>
            <div className="text-3xl font-bold text-safety-orange">{formatPrice(statistics.total_rest)} ₽</div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={t('dashboard.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="w-full lg:w-48" data-testid="service-type-filter">
                <SelectValue placeholder={t('dashboard.serviceType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('serviceTypes.all')}</SelectItem>
                {SERVICE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{t(`serviceTypes.${type}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-full lg:w-48" data-testid="payment-status-filter">
                <SelectValue placeholder={t('dashboard.paymentStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('paymentStatus.all')}</SelectItem>
                <SelectItem value="paid">{t('paymentStatus.paid')}</SelectItem>
                <SelectItem value="prepaid">{t('paymentStatus.prepaid')}</SelectItem>
                <SelectItem value="overdue">{t('paymentStatus.overdue')}</SelectItem>
                <SelectItem value="upcoming">{t('paymentStatus.upcoming')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" data-testid="export-button">
                <Download className="h-4 w-4 mr-2" />
                {t('dashboard.export')}
              </Button>
              {user.role === 'admin' && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-safety-orange hover:bg-safety-orange/90" data-testid="add-reservation-button">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dashboard.addReservation')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t('dashboard.addReservation')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddReservation} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>{t('columns.agency')} *</Label>
                          <Select value={formData.agency_id || ''} onValueChange={handleAgencyChange} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите агентство" />
                            </SelectTrigger>
                            <SelectContent>
                              {agencies.map(agency => (
                                <SelectItem key={agency.id} value={agency.id}>{agency.agency_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{t('columns.serviceType')} *</Label>
                          <Select value={formData.service_type || ''} onValueChange={(value) => setFormData({...formData, service_type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{t(`serviceTypes.${type}`)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{t('columns.dateOfIssue')} *</Label>
                          <Input type="date" value={formData.date_of_issue} onChange={(e) => setFormData({...formData, date_of_issue: e.target.value})} required />
                        </div>
                        <div>
                          <Label>{t('columns.dateOfService')} *</Label>
                          <Input type="date" value={formData.date_of_service} onChange={(e) => setFormData({...formData, date_of_service: e.target.value})} required />
                        </div>
                        <div className="col-span-2">
                          <Label>{t('columns.description')} *</Label>
                          <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                        </div>
                        <div className="col-span-2">
                          <Label>{t('columns.touristNames')} *</Label>
                          <Input 
                            value={formData.tourist_names} 
                            onChange={(e) => setFormData({...formData, tourist_names: e.target.value})} 
                            required 
                            list="tourist-names-list"
                            placeholder="John Doe, Jane Smith"
                          />
                          <datalist id="tourist-names-list">
                            {touristNames.map((name, idx) => (
                              <option key={idx} value={name} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <Label>{t('columns.price')} (₽) *</Label>
                          <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                        </div>
                        <div>
                          <Label>{t('columns.prepaymentAmount')} (₽)</Label>
                          <Input type="number" step="0.01" value={formData.prepayment_amount} onChange={(e) => setFormData({...formData, prepayment_amount: e.target.value})} />
                        </div>
                        <div>
                          <Label>{t('columns.lastDatePayment')} *</Label>
                          <Input type="date" value={formData.last_date_of_payment} onChange={(e) => setFormData({...formData, last_date_of_payment: e.target.value})} required />
                        </div>
                        <div>
                          <Label>{t('columns.supplier')}</Label>
                          <div className="flex gap-2">
                            <Select value={formData.supplier_id || ''} onValueChange={handleSupplierChange}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Выберите поставщика" />
                              </SelectTrigger>
                              <SelectContent>
                                {suppliers.map(supplier => (
                                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button type="button" size="icon" variant="outline" onClick={() => setShowSupplierDialog(true)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>{t('columns.supplierPrice')} (₽)</Label>
                          <Input type="number" step="0.01" value={formData.supplier_price} onChange={(e) => setFormData({...formData, supplier_price: e.target.value})} />
                        </div>
                        <div>
                          <Label>{t('columns.supplierPrepayment')} (₽)</Label>
                          <Input type="number" step="0.01" value={formData.supplier_prepayment_amount} onChange={(e) => setFormData({...formData, supplier_prepayment_amount: e.target.value})} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>{t('common.cancel')}</Button>
                        <Button type="submit" className="bg-safety-orange hover:bg-safety-orange/90">{t('common.add')}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.id')}</TableHead>
                  <TableHead>{t('columns.agency')}</TableHead>
                  <TableHead>{t('columns.dateOfIssue')}</TableHead>
                  <TableHead>{t('columns.serviceType')}</TableHead>
                  <TableHead>{t('columns.dateOfService')}</TableHead>
                  <TableHead>{t('columns.touristNames')}</TableHead>
                  <TableHead>{t('columns.price')}</TableHead>
                  <TableHead>{t('columns.prepaymentAmount')}</TableHead>
                  <TableHead>{t('columns.restAmount')}</TableHead>
                  <TableHead>{t('dashboard.paymentStatus')}</TableHead>
                  <TableHead>{t('columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">{t('common.loading')}</TableCell>
                  </TableRow>
                ) : reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">{t('common.noData')}</TableCell>
                  </TableRow>
                ) : (
                  reservations.map((reservation, idx) => (
                    <TableRow key={reservation.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <TableCell className="font-medium">{idx + 1 + (page - 1) * 25}</TableCell>
                      <TableCell>{reservation.agency_name}</TableCell>
                      <TableCell>{formatDate(reservation.date_of_issue)}</TableCell>
                      <TableCell>{t(`serviceTypes.${reservation.service_type}`)}</TableCell>
                      <TableCell>{formatDate(reservation.date_of_service)}</TableCell>
                      <TableCell>{reservation.tourist_names}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(reservation.price)} ₽</TableCell>
                      <TableCell>{formatPrice(reservation.prepayment_amount)} ₽</TableCell>
                      <TableCell className="font-semibold text-safety-orange">{formatPrice(reservation.rest_amount_of_payment)} ₽</TableCell>
                      <TableCell>{getPaymentBadge(reservation)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/reservations/${reservation.id}`)}
                          data-testid={`view-reservation-${idx}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                {t('dashboard.showing')} {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} {t('dashboard.of')} {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить поставщика</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Введите название поставщика"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddSupplier} className="bg-safety-orange hover:bg-safety-orange/90">
                Добавить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;
