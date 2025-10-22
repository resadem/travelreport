import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { LogOut, Users, Settings, FileText, Globe, Key, Truck, UserCircle, Menu, X, DollarSign, Send, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

const Layout = ({ children }) => {
  const { user, logout, changePassword } = useAuth();
  const { t, locale, toggleLocale } = useI18n();
  const location = useLocation();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const navItems = [
    { path: '/', icon: FileText, label: t('nav.reservations'), show: true },
    { path: '/expenses', icon: DollarSign, label: t('nav.expenses'), show: true },
    { path: '/requests', icon: Send, label: t('nav.requests'), show: true },
    { path: '/topups', icon: Wallet, label: t('nav.topUps'), show: user?.role === 'admin' },
    { path: '/sub-agencies', icon: Users, label: t('nav.subAgencies'), show: user?.role === 'admin' },
    { path: '/suppliers', icon: Truck, label: t('nav.suppliers'), show: user?.role === 'admin' },
    { path: '/tourists', icon: UserCircle, label: t('nav.tourists'), show: user?.role === 'admin' },
    { path: '/settings', icon: Settings, label: t('nav.settings'), show: user?.role === 'admin' },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-oxford-blue shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            {/* Mobile: Hamburger + Logo */}
            <div className="flex items-center space-x-3 md:space-x-8">
              {/* Mobile Hamburger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="text-white">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-oxford-blue text-white border-r border-picton-blue/30">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <img src="/logo-white.png" alt="4Travels" className="h-10" />
                      <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <nav className="flex-1 space-y-2">
                      {navItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            location.pathname === item.path
                              ? 'bg-picton-blue text-white'
                              : 'text-gray-300 hover:bg-oxford-blue/50 hover:text-white'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </nav>

                    <div className="border-t border-picton-blue/30 pt-4 space-y-2">
                      <button
                        onClick={() => {
                          toggleLocale();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-oxford-blue/50 hover:text-white transition-colors"
                      >
                        <Globe className="h-5 w-5" />
                        <span>{locale === 'ru' ? 'Русский' : 'English'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordDialog(true);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-oxford-blue/50 hover:text-white transition-colors"
                      >
                        <Key className="h-5 w-5" />
                        <span>{t('nav.changePassword')}</span>
                      </button>
                      <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo */}
              <Link to="/" className="flex items-center">
                <img src="/logo-white.png" alt="4Travels" className="h-8 md:h-12" />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-picton-blue text-white'
                        : 'text-gray-300 hover:text-white hover:bg-oxford-blue/50'
                    }`}
                  >
                    <item.icon className="inline h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side: Language + Profile */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Desktop Language Toggle */}
              <button
                onClick={toggleLocale}
                className="hidden md:flex p-2 rounded-lg hover:bg-oxford-blue/50 transition-colors"
              >
                <Globe className="h-5 w-5 text-white" />
                <span className="text-xs font-medium text-white ml-1">{locale.toUpperCase()}</span>
              </button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-oxford-blue/50 p-1 md:p-2" data-testid="user-menu">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-picton-blue to-safety-orange rounded-full flex items-center justify-center ring-2 ring-white/20">
                        <span className="text-white font-bold text-sm">{getInitials(user?.agency_name)}</span>
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">{user?.agency_name}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 border-b">
                    <p className="text-sm font-medium">{user?.agency_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => setShowPasswordDialog(true)} data-testid="change-password-menu" className="md:flex hidden">
                    <Key className="mr-2 h-4 w-4" />
                    {t('nav.changePassword')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600 md:flex hidden" data-testid="logout-menu">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                location.pathname === item.path
                  ? 'text-picton-blue bg-picton-blue/5'
                  : 'text-gray-600 hover:text-picton-blue'
              }`}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </nav>

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