import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
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
import Dashboard from './pages/Dashboard/Dashboard'
import Dashboard2 from './pages/Dashboard/Dashboard2'
import Party from './pages/Party/Party'
import PartyDetail from './pages/Party/PartyDetail'
import Noc from './pages/Noc/Noc'
import Home2 from './pages/home2'
import Vahan from './pages/Vahan'

function ProtectedLayout() {
  const location = useLocation()
  const hideNavbar = ['/home2', '/vahan'].includes(location.pathname)

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50'>
        {!hideNavbar && <Navbar />}

        <div className='min-h-screen w-full'>
          <main>
            <Routes>
              <Route path='/' element={<Dashboard />} />
              <Route path='/home2' element={<Home2 />} />
              <Route path='/vahan' element={<Vahan />} />
              <Route path='/dashboard2' element={<Dashboard2 />} />
              <Route path='/driving' element={<DrivingLicence />} />
              <Route path='/setting' element={<Setting />} />
              <Route path='/national-permit' element={<NationalPermit />} />
              <Route path='/cg-permit' element={<CgPermit />} />
              <Route path='/bus-permit' element={<BusPermit />} />
              <Route path='/temporary-permit' element={<TemporaryPermit />} />
              <Route path='/temporary-permit-other-state' element={<TemporaryPermitOtherState />} />
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
              <Route path='/parties' element={<Party />} />
              <Route path='/parties/:partyId' element={<PartyDetail />} />
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
          {/* Public Routes */}
          <Route path='/login' element={<Login />} />

          {/* Protected Routes */}
          <Route
            path='/*'
            element={<ProtectedLayout />}
          />
        </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

