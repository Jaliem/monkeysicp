import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './landing';
import Login from './login';
import NameInput from './NameInput';
import './App.css';
import Chat from './chat';
import Doctor from './doctor';
import Pharmacy from './pharmacy';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/name-input" element={<NameInput />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
      </Routes>
    </Router>
  );
}

export default App;
