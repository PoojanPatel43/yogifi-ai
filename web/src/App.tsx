import { Routes, Route } from 'react-router-dom';
import Landing        from './pages/Landing';
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import Dashboard      from './pages/Dashboard';
import Session        from './pages/Session';
import Onboarding     from './pages/Onboarding';
import SessionSummary from './pages/SessionSummary';
import ProfileSettings from './pages/ProfileSettings';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import PosesView         from './pages/dashboard/PosesView';
import AIChatView        from './pages/dashboard/AIChatView';
import NutritionPlanView from './pages/dashboard/NutritionPlanView';
import FitnessPlanView   from './pages/dashboard/FitnessPlanView';

function App() {
  return (
    <div className="relative w-full min-h-screen font-sans overflow-x-hidden">
      <Routes>
        <Route path="/"                element={<Landing />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/onboarding"      element={<Onboarding />} />
        <Route path="/session/summary" element={<SessionSummary />} />
        <Route path="/profile"         element={<ProfileSettings />} />
        <Route path="/dashboard"       element={<Dashboard />}>
          <Route index                 element={<DashboardOverview />} />
          <Route path="poses"          element={<PosesView />} />
          <Route path="chat"           element={<AIChatView />} />
          <Route path="nutrition"      element={<NutritionPlanView />} />
          <Route path="fitness"        element={<FitnessPlanView />} />
        </Route>
        <Route path="/session" element={<Session />} />
      </Routes>
    </div>
  );
}

export default App;
