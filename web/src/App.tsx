
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

function App() {
  
  // Custom cursor smooth scroll implementation could go here for "cinematic" feel,
  // but standard GSAP ScrollTrigger integrates well with native scroll.

  return (
    <div className="relative w-full bg-cream min-h-screen text-charcoal font-sans selection:bg-clay selection:text-cream overflow-x-hidden">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;
