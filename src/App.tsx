import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import { DataProvider } from "./contexts/DataContext";
import WelcomeScreen from "./pages/WelcomeScreen";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import { Toaster } from '@/components/ui/toaster';

// Lazy load storyboard
const GoogleSheetsTestStoryboard = lazy(() => import("./tempobook/storyboards/9d2ead53-c5b1-4f02-ab30-02fd151d2717/index"));

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <DataProvider>
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/employee" element={<EmployeeDashboard />} />
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route 
                path="/tempobook/storyboards/9d2ead53-c5b1-4f02-ab30-02fd151d2717" 
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GoogleSheetsTestStoryboard />
                  </Suspense>
                } 
              />
            </Routes>
            <Toaster />
          </DataProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;