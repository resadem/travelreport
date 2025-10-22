import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Suppliers = () => {
  const { t } = useI18n();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [supplierName, setSupplierName] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/suppliers`, { name: supplierName });
      toast.success(t('common.success'));
      setShowDialog(false);
      setSupplierName('');
      fetchSuppliers();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await axios.delete(`${API}/suppliers/${supplierId}`);
      toast.success(t('common.success'));
      fetchSuppliers();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-oxford-blue">{t('suppliers.title')}</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-safety-orange hover:bg-safety-orange/90 w-full sm:w-auto" data-testid="add-supplier-button">
                <Plus className="h-4 w-4 mr-2" />
                {t('suppliers.add')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('suppliers.add')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSupplier} className="space-y-4">
                <div>
                  <Label>{t('suppliers.name')}</Label>
                  <Input
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    required
                    placeholder={t('suppliers.enterName')}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="bg-safety-orange hover:bg-safety-orange/90">
                    {t('common.add')}
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
                <TableHead>№</TableHead>
                <TableHead>{t('suppliers.name')}</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead>{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">{t('common.loading')}</TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">{t('common.noData')}</TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier, idx) => (
                  <TableRow key={supplier.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/50 hover:bg-blue-100/50'}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{new Date(supplier.created_at).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`delete-supplier-${supplier.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
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
    </Layout>
  );
};

export default Suppliers;
