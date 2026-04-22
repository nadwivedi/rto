import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminAccess from './pages/AdminAccess'
import Setting from './pages/Setting'
import DrivingLicence from './pages/DrivingLicence/DrivingLicence'
import NationalPermit from './pages/NationalPermit/NationalPermit'
import CgPermit from './pages/CgPermit/CgPermit'
import BusPermit from './pages/BusPermit/BusPermit'
import TemporaryPermit from './pages/TemporaryPermit/TemporaryPermit'
import TemporaryPermitOtherState from './pages/TemporaryPermitOtherState/TemporaryPermitOtherState'
import VehicleRegistration from './pages/VehicleRegistration/VehicleRegistration'
import Insurance from './pages/Insurance/Insurance'
import Fitness from './pages/Fitness/Fitness'
import VehicleTransfer from './pages/VehicleTransfer/VehicleTransfer'
import RegistrationRenewal from './pages/RegistrationRenewal/RegistrationRenewal'
import DealerBill from './pages/DealerBill'
import Tax from './pages/Tax/Tax'
import Forms from './pages/forms/Forms'
import Form20 from './pages/Form20'
import Puc from './pages/Puc/Puc'
import Gps from './pages/Gps/Gps'
import Home2 from './pages/home2'
import Party from './pages/Party/Party'
import PartyDetail from './pages/Party/PartyDetail'
import Noc from './pages/Noc/Noc'
import Vahan from './pages/Vahan'
import Sarthi from './pages/Sarthi'
import WhatsApp from './pages/WhatsApp/WhatsApp'
import Javak from './pages/Javak/Javak'

function LegacyPartyDetailRedirect() {
  const { partyId } = useParams()
  return <Navigate to={`/party/${partyId}`} replace />
}

function ProtectedLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.type === 'staff') {
      document.body.classList.add('is-staff');
      if (!user?.permissions?.edit) {
        document.body.classList.add('no-edit-permissions');
      } else {
        document.body.classList.remove('no-edit-permissions');
      }
      if (!user?.permissions?.add) {
        document.body.classList.add('no-add-permissions');
      } else {
        document.body.classList.remove('no-add-permissions');
      }
    } else {
      document.body.classList.remove('is-staff', 'no-edit-permissions', 'no-add-permissions');
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const isModalOpen = document.querySelector('.bg-slate-900\\/60, .fixed.inset-0, [role="dialog"]') !== null;
        if (isModalOpen) return;

        const vahanHubPages = ['/vahan', '/whatsapp', '/setting', '/javak'];
        const sarthiHubPages = ['/sarthi'];
        const sarthiSubPages = ['/driving', '/vehicle-transfer', '/noc', '/registration-renewal'];

        const vahanSubPages = [
          '/vehicle-registration',
          '/vehicle-registartion',
          '/national-permit',
          '/cg-permit',
          '/bus-permit',
          '/temporary-permit',
          '/temporary-permit-other-state',
          '/insurance',
          '/fitness',
          '/tax',
          '/puc',
          '/gps',
          '/dealer-bill',
          '/party'
        ];
        
        if (location.pathname.startsWith('/party/')) {
          navigate('/party');
        } else if (vahanHubPages.includes(location.pathname) || sarthiHubPages.includes(location.pathname)) {
          navigate('/');
        } else if (vahanSubPages.includes(location.pathname)) {
          navigate('/vahan');
        } else if (sarthiSubPages.includes(location.pathname)) {
          navigate('/sarthi');
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [location.pathname, navigate])

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50'>
        <div className='min-h-screen w-full'>
          <main>
            <Routes>
              <Route path='/' element={<Home2 />} />
              <Route path='/vahan' element={<Vahan />} />
              <Route path='/sarthi' element={<Sarthi />} />
              <Route path='/driving' element={<DrivingLicence />} />
              <Route path='/setting' element={<Setting />} />
              <Route path='/national-permit' element={<NationalPermit />} />
              <Route path='/cg-permit' element={<CgPermit />} />
              <Route path='/bus-permit' element={<BusPermit />} />
              <Route path='/temporary-permit' element={<TemporaryPermit />} />
              <Route path='/temporary-permit-other-state' element={<TemporaryPermitOtherState />} />
              <Route path='/vehicle-registartion' element={<VehicleRegistration />} />
              <Route path='/vehicle-registration' element={<VehicleRegistration />} />
              <Route path='/insurance' element={<Insurance />} />
              <Route path='/fitness' element={<Fitness />} />
              <Route path='/tax' element={<Tax />} />
              <Route path='/vehicle-transfer' element={<VehicleTransfer />} />
              <Route path='/noc' element={<Noc />} />
              <Route path='/registration-renewal' element={<RegistrationRenewal />} />
              <Route path='/forms' element={<Forms />} />
              <Route path='/forms/form-20' element={<Form20 />} />
              <Route path='/puc' element={<Puc />} />
              <Route path='/gps' element={<Gps />} />
              <Route path='/dealer-bill' element={<DealerBill />} />
              <Route path='/party' element={<Party />} />
              <Route path='/party/:partyId' element={<PartyDetail />} />
              <Route path='/parties' element={<Navigate to='/party' replace />} />
              <Route path='/parties/:partyId' element={<LegacyPartyDetailRedirect />} />
              <Route path='/whatsapp' element={<WhatsApp />} />
              <Route path='/javak' element={<Javak />} />
            </Routes>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ToastContainer />
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/admin-access' element={<AdminAccess />} />
            <Route path='/*' element={<ProtectedLayout />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
