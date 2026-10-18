import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Features from './pages/Features'
import About from './pages/About'
import Contact from './pages/Contact'
import Sitemap from './pages/Sitemap'
import PucAgent from './pages/PucAgent'
import RtoManagementSoftware from './pages/RtoManagementSoftware'
import VehicleInformationSoftware from './pages/VehicleInformationSoftware'
import VehicleInformationApi from './pages/VehicleInformationApi'
import VahanApi from './pages/VahanApi'
import RcDownloadSoftware from './pages/RcDownloadSoftware'
import RtoAgentSoftwareFreeDownload from './pages/RtoAgentSoftwareFreeDownload'
import RtoAgentApp from './pages/RtoAgentApp'
import RtoOfflineSoftware from './pages/RtoOfflineSoftware'
import DrivingSchoolSoftware from './pages/DrivingSchoolSoftware'
import DocumentExpiryReminderSoftware from './pages/DocumentExpiryReminderSoftware'
import ExpiryReminderSoftware from './pages/ExpiryReminderSoftware'
import RcVerificationSoftware from './pages/RcVerificationSoftware'
import NationalPermitSoftware from './pages/NationalPermitSoftware'
import DrivingLicenceSoftware from './pages/DrivingLicenceSoftware'
import LearningLicenceSoftware from './pages/LearningLicenceSoftware'
import DrivingLicenceManagementSystem from './pages/DrivingLicenceManagementSystem'
import DrivingSchoolManagementSoftware from './pages/DrivingSchoolManagementSoftware'
import DrivingSchoolManagementSystem from './pages/DrivingSchoolManagementSystem'
import BestDrivingSchoolSoftwareIndia from './pages/BestDrivingSchoolSoftwareIndia'
import DrivingSchoolCrm from './pages/DrivingSchoolCrm'
import RtoAgentCrmSoftware from './pages/RtoAgentCrmSoftware'
import RtoAgentLeadManagementSoftware from './pages/RtoAgentLeadManagementSoftware'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

// Shared by the browser (App.jsx, BrowserRouter) and the build-time prerender (prerender.jsx, StaticRouter)
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="features" element={<Features />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="puc-agent-software" element={<PucAgent />} />
        <Route path="rto-management-software" element={<RtoManagementSoftware />} />
        <Route path="vehicle-information-software" element={<VehicleInformationSoftware />} />
        <Route path="vehicle-information-api" element={<VehicleInformationApi />} />
        <Route path="vahan-api" element={<VahanApi />} />
        <Route path="rc-download-software" element={<RcDownloadSoftware />} />
        <Route path="rto-agent-software-free-download" element={<RtoAgentSoftwareFreeDownload />} />
        <Route path="rto-agent-app" element={<RtoAgentApp />} />
        <Route path="rto-offline-software" element={<RtoOfflineSoftware />} />
        <Route path="driving-school-software" element={<DrivingSchoolSoftware />} />
        <Route path="document-expiry-reminder-software" element={<DocumentExpiryReminderSoftware />} />
        <Route path="vehicle-document-expiry-reminder-software" element={<ExpiryReminderSoftware />} />
        <Route path="rc-verification-software" element={<RcVerificationSoftware />} />
        <Route path="national-permit-renewal-reminder-software" element={<NationalPermitSoftware />} />
        <Route path="driving-licence-software" element={<DrivingLicenceSoftware />} />
        <Route path="learning-licence-software" element={<LearningLicenceSoftware />} />
        <Route path="driving-licence-management-system" element={<DrivingLicenceManagementSystem />} />
        <Route path="driving-school-management-software" element={<DrivingSchoolManagementSoftware />} />
        <Route path="driving-school-management-system" element={<DrivingSchoolManagementSystem />} />
        <Route path="best-driving-school-software-india" element={<BestDrivingSchoolSoftwareIndia />} />
        <Route path="driving-school-crm" element={<DrivingSchoolCrm />} />
        <Route path="rto-agent-crm-software" element={<RtoAgentCrmSoftware />} />
        <Route path="rto-agent-lead-management-software" element={<RtoAgentLeadManagementSoftware />} />
        <Route path="sitemap" element={<Sitemap />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />
      </Route>
    </Routes>
  )
}
