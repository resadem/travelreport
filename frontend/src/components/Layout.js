import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { LogOut, Users, Settings, FileText, Globe, Key, Truck, UserCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

const Layout = ({ children }) => {
  const { user, logout, changePassword } = useAuth();
  const { t, locale, toggleLocale } = useI18n();
  const location = useLocation();
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await changePassword(oldPassword, newPassword);
      toast.success(t('common.success'));
      setShowPasswordDialog(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-oxford-blue shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <img
                  src="/logo-full.png"
                  alt="4Travels"
                  className="h-12"
                />
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'bg-picton-blue text-white'
                      : 'text-gray-300 hover:text-white hover:bg-oxford-blue/50'
                  }`}
                  data-testid="nav-reservations"
                >
                  <FileText className="inline h-4 w-4 mr-2" />
                  {t('nav.reservations')}
                </Link>
                {user?.role === 'admin' && (
                  <>
                    <Link
                      to="/sub-agencies"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/sub-agencies'
                          ? 'bg-picton-blue text-white'
                          : 'text-gray-300 hover:text-white hover:bg-oxford-blue/50'
                      }`}
                      data-testid="nav-sub-agencies"
                    >
                      <Users className="inline h-4 w-4 mr-2" />
                      {t('nav.subAgencies')}
                    </Link>
                    <Link
                      to="/settings"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/settings'
                          ? 'bg-picton-blue text-white'
                          : 'text-gray-300 hover:text-white hover:bg-oxford-blue/50'
                      }`}
                      data-testid="nav-settings"
                    >
                      <Settings className="inline h-4 w-4 mr-2" />
                      {t('nav.settings')}
                    </Link>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLocale}
                className="p-2 rounded-lg hover:bg-oxford-blue/50 transition-colors"
                data-testid="header-language-toggle"
              >
                <Globe className="h-5 w-5 text-white" />
                <span className="text-xs font-medium text-white ml-1">{locale.toUpperCase()}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-oxford-blue/50" data-testid="user-menu">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-picton-blue rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{user?.agency_name?.[0] || 'U'}</span>
                      </div>
                      <span className="hidden sm:inline">{user?.agency_name}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 border-b">
                    <p className="text-sm font-medium">{user?.agency_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => setShowPasswordDialog(true)} data-testid="change-password-menu">
                    <Key className="mr-2 h-4 w-4" />
                    {t('nav.changePassword')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600" data-testid="logout-menu">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('nav.changePassword')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="old-password">{t('login.password')} ({t('common.edit')})</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="new-password">{t('login.password')} (New)</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
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
  );
};

export default Layout;