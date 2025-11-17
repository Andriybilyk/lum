import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider } from "./contexts/AuthContext";
import { HoursProvider } from "./contexts/HoursContext";
import { ProcessProvider } from "./contexts/ProcessContext";
import { ReportProvider } from "./contexts/ReportContext";
import { MetaProvider } from "./contexts/MetaContext";
import { TelegramAppProvider } from "./contexts/TelegramAppContext";
import { NotificationProvider, useNotification } from "./contexts/NotificationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationContainer from "./components/providers/NotificationContainer";
import WelcomeScreen from "./pages/WelcomeScreen";
import LoadingScreen from "./components/LoadingScreen";
import { Toaster } from '@/components/ui/toaster';

const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const TelegramMiniApp = lazy(() => import("./pages/TelegramMiniApp"));
const TelegramApp = lazy(() => import("./pages/TelegramApp"));

function AppContent() {
  const { notifications } = useNotification();

  // Детектуємо, чи це Telegram Mini App
  const isTelegramMiniApp = () => {
    if (typeof window !== 'undefined') {
      return !!(window.Telegram?.WebApp);
    }
    return false;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={isTelegramMiniApp() ? (
          <TelegramAppProvider>
            <Suspense fallback={<LoadingScreen />}>
              <TelegramMiniApp />
            </Suspense>
          </TelegramAppProvider>
        ) : <WelcomeScreen />} />
        <Route
          path="/employee"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <EmployeeDashboard />
            </Suspense>
          }
        />
        <Route
          path="/manager"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <ManagerDashboard />
            </Suspense>
          }
        />
        <Route
          path="/telegram"
          element={
            <TelegramAppProvider>
              <Suspense fallback={<LoadingScreen />}>
                <TelegramApp />
              </Suspense>
            </TelegramAppProvider>
          }
        />
        <Route
          path="/telegram/quick"
          element={
            <TelegramAppProvider>
              <Suspense fallback={<LoadingScreen />}>
                <TelegramMiniApp />
              </Suspense>
            </TelegramAppProvider>
          }
        />
      </Routes>
      <NotificationContainer notifications={notifications} />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <NotificationProvider>
            <UserProvider>
              <AuthProvider>
                <DataProvider>
                  <MetaProvider>
                    <HoursProvider>
                      <ProcessProvider>
                        <ReportProvider>
                          <AppContent />
                        </ReportProvider>
                      </ProcessProvider>
                    </HoursProvider>
                  </MetaProvider>
                </DataProvider>
              </AuthProvider>
            </UserProvider>
          </NotificationProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;