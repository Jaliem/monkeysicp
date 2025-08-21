import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Login from './login';
import Datas from './datas';
import './App.css';
import Home from './home';
import Chat from './chat';
import Doctor from './doctor';
import Pharmacy from './pharmacy';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/datas" element={<Datas />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/pharmacy" element={<Pharmacy />} />

      </Routes>
    </Router>
  );
}

export default App;
