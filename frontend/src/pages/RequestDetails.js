import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Send, Upload, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatPrice } from '../utils/helpers';
import StatusIcons from '../components/StatusIcons';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [file, setFile] = useState(null);
  
  const [statusUpdate, setStatusUpdate] = useState({
    reservation_status: '',
    payment_status: '',
    document_status: ''
  });

  useEffect(() => {
    if (user && id) {
      fetchRequest();
      fetchComments();
      fetchDocuments();
    }
  }, [id, user]);

  const fetchRequest = async () => {
    try {
      const response = await axios.get(`${API}/requests/${id}`);
      setRequest(response.data);
      setStatusUpdate({
        reservation_status: response.data.reservation_status,
        payment_status: response.data.payment_status,
        document_status: response.data.document_status
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching request:', error);
      toast.error(t('common.error'));
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/requests/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/requests/${id}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      await axios.post(`${API}/requests/${id}/comments`, { text: newComment });
      setNewComment('');
      fetchComments();
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await axios.put(`${API}/requests/${id}`, statusUpdate);
      fetchRequest();
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post(`${API}/requests/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      fetchDocuments();
      // Document status is automatically updated on backend
      fetchRequest();
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await axios.get(`${API}/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-picton-blue"></div>
        </div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="text-center py-8">{t('common.noData')}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold text-oxford-blue">{t('requests.requestDetails')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Details */}
            <Card>
              <CardHeader>
                <CardTitle>Детали запроса</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">{t('requests.checkIn')}</Label>
                    <div className="font-semibold">{formatDate(request.check_in)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">{t('requests.checkOut')}</Label>
                    <div className="font-semibold">{formatDate(request.check_out)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">{t('requests.pax')}</Label>
                  <div className="font-semibold">
                    {request.adults} {t('requests.adults')}
                    {request.children > 0 && `, ${request.children} ${t('requests.children')} (${request.child_ages.join(', ')} лет)`}
                    {request.infants > 0 && `, ${request.infants} ${t('requests.infants')}`}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">{t('requests.flightNeeded')}</Label>
                    <div className="font-semibold">
                      {request.flight_needed ? `${t('requests.yes')} (${t(`requests.${request.flight_class}`)})` : t('requests.no')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">{t('requests.transferNeeded')}</Label>
                    <div className="font-semibold">{request.transfer_needed ? t('requests.yes') : t('requests.no')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">{t('requests.country')}</Label>
                    <div className="font-semibold">{request.country}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">{t('requests.location')}</Label>
                    <div className="font-semibold">{request.location}</div>
                  </div>
                </div>

                {request.hotel && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-600">{t('requests.hotel')}</Label>
                      <div className="font-semibold">{request.hotel}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">{t('requests.hotelCategory')}</Label>
                      <div className="font-semibold">{request.hotel_category} ⭐</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">{t('requests.meal')}</Label>
                      <div className="font-semibold">{request.meal}</div>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-600">{t('requests.description')}</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">{request.description}</div>
                </div>

                {request.target_price && (
                  <div>
                    <Label className="text-gray-600">{t('requests.targetPrice')}</Label>
                    <div className="font-semibold text-green-600">{formatPrice(request.target_price)} ₽</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversation Thread */}
            <Card>
              <CardHeader>
                <CardTitle>{t('requests.conversation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comments List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {comments.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">Нет сообщений</div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-lg ${
                          comment.user_role === 'admin'
                            ? 'bg-blue-50 ml-0 mr-8'
                            : 'bg-green-50 ml-8 mr-0'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-oxford-blue">{comment.user_name}</div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              comment.user_role === 'admin' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
                            }`}>
                              {comment.user_role === 'admin' ? 'Админ' : 'Агентство'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{formatDate(comment.created_at)}</div>
                        </div>
                        <div className="text-gray-700">{comment.text}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('requests.addComment')}
                    rows={2}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="bg-safety-orange hover:bg-safety-orange/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status & Documents */}
          <div className="space-y-6">
            {/* Status Section */}
            <Card>
              <CardHeader>
                <CardTitle>{t('requests.status')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center py-4">
                  <StatusIcons
                    reservationStatus={request.reservation_status}
                    paymentStatus={request.payment_status}
                    documentStatus={request.document_status}
                  />
                </div>

                {user.role === 'admin' && (
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <Label>{t('requests.reservationStatus')}</Label>
                      <Select
                        value={statusUpdate.reservation_status}
                        onValueChange={(value) => setStatusUpdate({...statusUpdate, reservation_status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">{t('requests.inProgress')}</SelectItem>
                          <SelectItem value="booked">{t('requests.booked')}</SelectItem>
                          <SelectItem value="confirmed">{t('requests.confirmed')}</SelectItem>
                          <SelectItem value="cancelled">{t('requests.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('requests.paymentStatus')}</Label>
                      <Select
                        value={statusUpdate.payment_status}
                        onValueChange={(value) => setStatusUpdate({...statusUpdate, payment_status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="awaiting_payment">{t('requests.awaitingPayment')}</SelectItem>
                          <SelectItem value="paid">{t('requests.paid')}</SelectItem>
                          <SelectItem value="partially_paid">{t('requests.partiallyPaid')}</SelectItem>
                          <SelectItem value="not_paid">{t('requests.notPaid')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('requests.documentStatus')}</Label>
                      <div className="mt-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                        {request.document_status === 'documents_ready' ? (
                          <span className="text-green-600 font-semibold">✓ {t('requests.documentsReady')}</span>
                        ) : (
                          <span className="text-gray-500">{t('requests.documentsNotReady')}</span>
                        )}
                        <div className="text-xs mt-1">Автоматически обновляется при загрузке документов</div>
                      </div>
                    </div>

                    <Button
                      onClick={handleStatusUpdate}
                      className="w-full bg-picton-blue hover:bg-picton-blue/90"
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle>{t('requests.documents')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload (Admin only) */}
                {user.role === 'admin' && (
                  <div className="space-y-2">
                    <Label>{t('requests.uploadDocument')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />
                      <Button
                        onClick={handleFileUpload}
                        disabled={!file}
                        size="icon"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Documents List */}
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 text-sm">
                      {t('common.noData')}
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-picton-blue flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{doc.filename}</div>
                            <div className="text-xs text-gray-500">{formatDate(doc.uploaded_at)}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc.id, doc.filename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RequestDetails;
