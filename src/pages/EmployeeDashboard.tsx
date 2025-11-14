import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import EmployeeRegistration from '@/components/employee/EmployeeRegistration';
import EmployeeNav from '@/components/employee/EmployeeNav';
import EmployeeStats from '@/components/employee/EmployeeStats';
import EmployeeReports from '@/components/employee/EmployeeReports';
import Settings from '@/components/Settings';
import LoadingScreen from '@/components/LoadingScreen';

export default function EmployeeDashboard() {
  const { user, isRegistered } = useUser();
  const { isLoading } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const showRegistration = searchParams.get('register') === 'true';

  useEffect(() => {
    if (!isRegistered && !showRegistration) {
      navigate('/');
    } else if (isRegistered && user?.role !== 'employee') {
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
    return <EmployeeRegistration />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md mx-auto pb-20">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md mx-auto pb-20">
        {activeTab === 'dashboard' && <EmployeeStats />}
        {activeTab === 'reports' && <EmployeeReports />}
        {activeTab === 'settings' && <Settings />}
      </div>
      <EmployeeNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}