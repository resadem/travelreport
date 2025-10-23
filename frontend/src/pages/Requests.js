import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { formatDate } from '../utils/helpers';
import StatusIcons from '../components/StatusIcons';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COUNTRIES = ['Россия', 'Турция', 'ОАЭ', 'Египет', 'Таиланд', 'Мальдивы', 'Индия', 'Вьетнам', 'Шри-Ланка', 'Грузия', 'Армения', 'Узбекистан', 'Другое'];
const FLIGHT_CLASSES = ['economy', 'business', 'first'];
const HOTEL_CATEGORIES = [1, 2, 3, 4, 5];
const MEAL_TYPES = ['BB', 'HB', 'FB', 'AI', 'UAI'];

const Requests = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  
  // Filters
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterReservationStatus, setFilterReservationStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    check_in: '',
    check_out: '',
    adults: 1,
    children: 0,
    child_ages: [],
    infants: 0,
    flight_needed: false,
    flight_class: 'economy',
    transfer_needed: false,
    country: '',
    location: '',
    hotel: '',
    hotel_category: 3,
    meal: 'BB',
    description: '',
    target_price: ''
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [requests, filterCountry, filterReservationStatus, filterPaymentStatus]);

  const applyFilters = () => {
    let filtered = [...requests];

    if (filterCountry !== 'all') {
      filtered = filtered.filter(req => req.country === filterCountry);
    }

    if (filterReservationStatus !== 'all') {
      filtered = filtered.filter(req => req.reservation_status === filterReservationStatus);
    }

    if (filterPaymentStatus !== 'all') {
      filtered = filtered.filter(req => req.payment_status === filterPaymentStatus);
    }

    setFilteredRequests(filtered);
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API}/requests`);
      setRequests(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/requests`, {
        ...formData,
        target_price: formData.target_price ? parseFloat(formData.target_price) : null
      });
      
      const requestId = response.data.id;
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          await axios.post(`${API}/requests/${requestId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }
      
      toast.success(t('common.success'));
      setShowDialog(false);
      setSelectedFiles([]);
      setFormData({
        check_in: '',
        check_out: '',
        adults: 1,
        children: 0,
        child_ages: [],
        infants: 0,
        flight_needed: false,
        flight_class: 'economy',
        transfer_needed: false,
        country: '',
        location: '',
        hotel: '',
        hotel_category: 3,
        meal: 'BB',
        description: '',
        target_price: ''
      });
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleChildrenChange = (value) => {
    const numChildren = parseInt(value) || 0;
    setFormData({
      ...formData,
      children: numChildren,
      child_ages: Array(numChildren).fill(0)
    });
  };

  const handleChildAgeChange = (index, age) => {
    const newAges = [...formData.child_ages];
    newAges[index] = parseInt(age) || 0;
    setFormData({ ...formData, child_ages: newAges });
  };

  const getTotalPax = (request) => {
    return request.adults + request.children + request.infants;
  };

  return (
    <Layout>
      {!user ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-picton-blue"></div>
        </div>
      ) : (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-oxford-blue">
            {user.role === 'admin' ? t('requests.allRequests') : t('requests.myRequests')}
          </h1>
          
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-safety-orange hover:bg-safety-orange/90 w-full sm:w-auto">
                {t('requests.addRequest')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('requests.addRequest')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('requests.checkIn')} *</Label>
                    <Input
                      type="date"
                      value={formData.check_in}
                      onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>{t('requests.checkOut')} *</Label>
                    <Input
                      type="date"
                      value={formData.check_out}
                      onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">{t('requests.pax')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>{t('requests.adults')} *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.adults}
                        onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div>
                      <Label>{t('requests.children')}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.children}
                        onChange={(e) => handleChildrenChange(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>{t('requests.infants')}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.infants}
                        onChange={(e) => setFormData({...formData, infants: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  {formData.children > 0 && (
                    <div className="mt-3">
                      <Label>{t('requests.childAge')}</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {formData.child_ages.map((age, idx) => (
                          <Input
                            key={idx}
                            type="number"
                            min="0"
                            max="17"
                            placeholder={`Ребенок ${idx + 1}`}
                            value={age}
                            onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="flight"
                        checked={formData.flight_needed}
                        onCheckedChange={(checked) => setFormData({...formData, flight_needed: checked})}
                      />
                      <Label htmlFor="flight" className="cursor-pointer">{t('requests.flightNeeded')}</Label>
                    </div>
                    {formData.flight_needed && (
                      <Select
                        value={formData.flight_class}
                        onValueChange={(value) => setFormData({...formData, flight_class: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FLIGHT_CLASSES.map(fc => (
                            <SelectItem key={fc} value={fc}>{t(`requests.${fc}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="transfer"
                        checked={formData.transfer_needed}
                        onCheckedChange={(checked) => setFormData({...formData, transfer_needed: checked})}
                      />
                      <Label htmlFor="transfer" className="cursor-pointer">{t('requests.transferNeeded')}</Label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t('requests.country')} *</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({...formData, country: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('requests.country')} />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('requests.location')} *</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        required
                        placeholder={t('requests.location')}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('requests.hotel')}</Label>
                    <Input
                      value={formData.hotel}
                      onChange={(e) => setFormData({...formData, hotel: e.target.value})}
                      placeholder={t('requests.hotel')}
                    />
                  </div>
                  <div>
                    <Label>{t('requests.hotelCategory')}</Label>
                    <Select
                      value={formData.hotel_category?.toString()}
                      onValueChange={(value) => setFormData({...formData, hotel_category: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOTEL_CATEGORIES.map(star => (
                          <SelectItem key={star} value={star.toString()}>{star} ⭐</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('requests.meal')}</Label>
                    <Select
                      value={formData.meal}
                      onValueChange={(value) => setFormData({...formData, meal: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_TYPES.map(meal => (
                          <SelectItem key={meal} value={meal}>{meal}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>{t('requests.description')} *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={3}
                    placeholder={t('requests.description')}
                  />
                </div>

                <div>
                  <Label>{t('requests.targetPrice')} (₽)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.target_price}
                    onChange={(e) => setFormData({...formData, target_price: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
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
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm text-gray-600 mb-2">{t('requests.country')}</Label>
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('serviceTypes.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('serviceTypes.all')}</SelectItem>
                  {COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label className="text-sm text-gray-600 mb-2">{t('requests.reservationStatus')}</Label>
              <Select value={filterReservationStatus} onValueChange={setFilterReservationStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('serviceTypes.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('serviceTypes.all')}</SelectItem>
                  <SelectItem value="in_progress">{t('requests.inProgress')}</SelectItem>
                  <SelectItem value="booked">{t('requests.booked')}</SelectItem>
                  <SelectItem value="confirmed">{t('requests.confirmed')}</SelectItem>
                  <SelectItem value="cancelled">{t('requests.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label className="text-sm text-gray-600 mb-2">{t('requests.paymentStatus')}</Label>
              <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('serviceTypes.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('serviceTypes.all')}</SelectItem>
                  <SelectItem value="awaiting_payment">{t('requests.awaitingPayment')}</SelectItem>
                  <SelectItem value="paid">{t('requests.paid')}</SelectItem>
                  <SelectItem value="partially_paid">{t('requests.partiallyPaid')}</SelectItem>
                  <SelectItem value="not_paid">{t('requests.notPaid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('requests.dateColumn')}</TableHead>
                  {user.role === 'admin' && <TableHead>{t('expenses.agency')}</TableHead>}
                  <TableHead>{t('requests.country')}</TableHead>
                  <TableHead>{t('requests.location')}</TableHead>
                  <TableHead>{t('requests.pax')}</TableHead>
                  <TableHead>{t('requests.status')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'admin' ? 7 : 6} className="text-center py-8">
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'admin' ? 7 : 6} className="text-center py-8">
                      {t('common.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request, idx) => (
                    <TableRow
                      key={request.id}
                      className={`cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/50 hover:bg-blue-100/50'}`}
                      onClick={() => navigate(`/requests/${request.id}`)}
                    >
                      <TableCell>{formatDate(request.check_in)}</TableCell>
                      {user.role === 'admin' && <TableCell className="font-medium">{request.agency_name}</TableCell>}
                      <TableCell>{request.country}</TableCell>
                      <TableCell>{request.location}</TableCell>
                      <TableCell>{getTotalPax(request)} PAX</TableCell>
                      <TableCell>
                        <StatusIcons
                          reservationStatus={request.reservation_status}
                          paymentStatus={request.payment_status}
                          documentStatus={request.document_status}
                          horizontal={true}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          →
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      )}
    </Layout>
  );
};

export default Requests;