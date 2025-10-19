import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import Layout from '../components/Layout';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Settings = () => {
  const { t } = useI18n();
  const [thresholdDays, setThresholdDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setThresholdDays(response.data.upcoming_due_threshold_days);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/settings`, {
        upcoming_due_threshold_days: parseInt(thresholdDays)
      });
      toast.success(t('common.success'));
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-3xl font-bold text-oxford-blue mb-6">{t('settings.title')}</h1>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <Label htmlFor="threshold-days">{t('settings.thresholdDays')}</Label>
              <Input
                id="threshold-days"
                type="number"
                min="1"
                max="365"
                value={thresholdDays}
                onChange={(e) => setThresholdDays(e.target.value)}
                className="mt-2"
                data-testid="threshold-days-input"
              />
              <p className="text-sm text-gray-500 mt-2">{t('settings.thresholdDescription')}</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-safety-orange hover:bg-safety-orange/90" data-testid="save-settings-button">
                <Save className="h-4 w-4 mr-2" />
                {t('settings.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;