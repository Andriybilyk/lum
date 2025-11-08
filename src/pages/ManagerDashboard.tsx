import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import ManagerRegistration from '@/components/manager/ManagerRegistration';
import ManagerNav from '@/components/manager/ManagerNav';
import ManagerStats from '@/components/manager/ManagerStats';
import ManagerEmployees from '@/components/manager/ManagerEmployees';
import ManagerReports from '@/components/manager/ManagerReports';
import Settings from '@/components/Settings';

export default function ManagerDashboard() {
  const { user, isRegistered } = useUser();
  const { isLoading } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const showRegistration = searchParams.get('register') === 'true';

  useEffect(() => {
    if (!isRegistered && !showRegistration) {
      navigate('/');
    } else if (isRegistered && user?.role !== 'manager') {
      navigate('/');
    }
  }, [isRegistered, user, navigate, showRegistration]);

  useEffect(() => {
    const handleChangeTab = (event: any) => {
      setActiveTab(event.detail);
    };
    window.addEventListener('changeTab', handleChangeTab);
    return () => window.removeEventListener('changeTab', handleChangeTab);
  }, []);

  if (!isRegistered || showRegistration) {
    return <ManagerRegistration />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md mx-auto pb-20">
        {activeTab === 'dashboard' && <ManagerStats setActiveTab={setActiveTab} />}
        {activeTab === 'employees' && <ManagerEmployees />}
        {activeTab === 'reports' && <ManagerReports />}
        {activeTab === 'settings' && <Settings />}
      </div>
      <ManagerNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}