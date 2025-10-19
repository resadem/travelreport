import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Globe } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, locale, toggleLocale } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      toast.error(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #14213d 0%, #45abe1 100%)' }}>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex-1">
                <img
                  src="https://customer-assets.emergentagent.com/job_reservflow/artifacts/kw3ia7jq_%D0%91%D0%B5%D0%B7%D1%8B%D0%BC%D1%8F%D0%BD%D0%BD%D1%8B%D0%B9-2.png"
                  alt="4Travels Logo"
                  className="h-16 mb-6"
                />
                <h1 className="text-3xl font-bold text-oxford-blue mb-2">{t('login.title')}</h1>
              </div>
              <button
                onClick={toggleLocale}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="language-toggle"
              >
                <Globe className="h-5 w-5 text-picton-blue" />
                <span className="text-xs font-medium text-oxford-blue ml-1">{locale.toUpperCase()}</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-oxford-blue">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 border-gray-300 focus:border-picton-blue focus:ring-picton-blue"
                  data-testid="login-email-input"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-oxford-blue">{t('login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 border-gray-300 focus:border-picton-blue focus:ring-picton-blue"
                  data-testid="login-password-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-safety-orange hover:bg-safety-orange/90 text-white py-6 text-lg font-semibold rounded-xl transition-all"
                data-testid="login-submit-button"
              >
                {loading ? t('common.loading') : t('login.submit')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;