import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './landing';
import Login from './login';
import NameInput from './NameInput';
import './App.css';
import Chat from './chat';
import Doctor from './doctor';
import Pharmacy from './pharmacy';
import Wellness from './wellness';
import Profile from './profile';

function App() {
  return (
    <div className="h-screen w-screen">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/name-input" element={<NameInput />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
