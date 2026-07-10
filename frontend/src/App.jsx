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
import VehicleLedgerPage from './pages/VehicleRegistration/VehicleLedgerPage'
import Insurance from './pages/Insurance/Insurance'
import InsuranceReports from './pages/Insurance/InsuranceReports'
import Fitness from './pages/Fitness/Fitness'
import HpaHpt from './pages/HpaHpt/HpaHpt'
import VehicleTransfer from './pages/VehicleTransfer/VehicleTransfer'
import RegistrationRenewal from './pages/RegistrationRenewal/RegistrationRenewal'
import DealerBill from './pages/DealerBill'
import Tax from './pages/Tax/Tax'
import GreenTax from './pages/GreenTax/GreenTax'
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
import KycZone from './pages/KycZone/KycZone'
import WhatsApp from './pages/WhatsApp/WhatsApp'
import Javak from './pages/Javak/Javak'
import CashflowReport from './pages/Reports/CashflowReport'
import SpeedGovernor from './pages/SpeedGovernor/SpeedGovernor'
import PWAPrompt from './components/PWAPrompt'
// import { Agentation } from 'agentation'

function LegacyPartyDetailRedirect() {
  const { partyId } = useParams()
  return <Navigate to={`/party/${partyId}`} replace />
}

function ProtectedLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const isDeactivated = user && !user.isActive

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

        const vahanHubPages = ['/vahan', '/whatsapp', '/setting', '/javak', '/kyc'];
        const sarthiHubPages = ['/sarthi'];
        const sarthiSubPages = ['/driving', '/vehicle-transfer', '/noc', '/registration-renewal', '/hpa-hpt', '/cashflow-report'];

        const vahanSubPages = [
          '/vehicle-registration',
          '/vehicle-registartion',
          '/national-permit',
          '/cg-permit',
          '/bus-permit',
          '/temporary-permit',
          '/temporary-permit-other-state',
          '/insurance',
          '/insurance/reports',
          '/fitness',
          '/tax',
          '/green-tax',
          '/puc',
          '/gps',
          '/dealer-bill',
          '/party',
          '/speed-governor'
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
      <div className={`min-h-screen bg-gray-50 ${isDeactivated ? 'relative' : ''}`}>
        <div className={`min-h-screen w-full ${isDeactivated ? 'pointer-events-none select-none' : ''}`}>
          <div className={isDeactivated ? 'blur-sm' : ''}>
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
                <Route path='/vehicle-ledger/:registrationNumber' element={<VehicleLedgerPage />} />
                <Route path='/insurance' element={<Insurance />} />
                <Route path='/insurance/reports' element={<InsuranceReports />} />
                <Route path='/fitness' element={<Fitness />} />
                <Route path='/hpa-hpt' element={<HpaHpt />} />
                <Route path='/tax' element={<Tax />} />
                <Route path='/green-tax' element={<GreenTax />} />
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
                <Route path='/kyc' element={<KycZone />} />
                <Route path='/parties' element={<Navigate to='/party' replace />} />
                <Route path='/parties/:partyId' element={<LegacyPartyDetailRedirect />} />
                <Route path='/whatsapp' element={<WhatsApp />} />
                <Route path='/javak' element={<Javak />} />
                <Route path='/cashflow-report' element={<CashflowReport />} />
                <Route path='/speed-governor' element={<SpeedGovernor />} />
              </Routes>
            </main>
          </div>
        </div>

        {isDeactivated && (
          <div className='fixed inset-0 z-[200] flex items-center justify-center bg-black/40'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
                </svg>
              </div>
              <h2 className='text-xl font-bold text-gray-900 mb-2'>Account Deactivated</h2>
              <p className='text-gray-600 mb-6'>
                Your account has been deactivated. Please pay to continue using our services.
              </p>
              <button
                onClick={() => { logout(); navigate('/login') }}
                className='w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors cursor-pointer'
              >
                Go to Login
              </button>
              <p className='text-xs text-gray-400 mt-3'>
                Contact support: <span className='font-bold text-indigo-600'>rtosarthi@gmail.com</span> | <span className='font-bold text-indigo-600'>+91-6264682508</span>
              </p>
            </div>
          </div>
        )}
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
          <PWAPrompt />
          {/* {process.env.NODE_ENV === "development" && <Agentation />} */}
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
