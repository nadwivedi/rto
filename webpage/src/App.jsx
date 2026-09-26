import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Features from './pages/Features'
import About from './pages/About'
import Contact from './pages/Contact'
import Sitemap from './pages/Sitemap'
import PucAgent from './pages/PucAgent'
import RtoManagementSoftware from './pages/RtoManagementSoftware'
import VehicleInformationSoftware from './pages/VehicleInformationSoftware'
import RcDownloadSoftware from './pages/RcDownloadSoftware'
import RtoAgentSoftwareFreeDownload from './pages/RtoAgentSoftwareFreeDownload'
import DrivingSchoolSoftware from './pages/DrivingSchoolSoftware'
import DocumentExpiryReminderSoftware from './pages/DocumentExpiryReminderSoftware'
import ExpiryReminderSoftware from './pages/ExpiryReminderSoftware'
import RcVerificationSoftware from './pages/RcVerificationSoftware'
import NationalPermitSoftware from './pages/NationalPermitSoftware'
import DrivingLicenceSoftware from './pages/DrivingLicenceSoftware'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="features" element={<Features />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="puc-agent-software" element={<PucAgent />} />
          <Route path="rto-management-software" element={<RtoManagementSoftware />} />
          <Route path="vehicle-information-software" element={<VehicleInformationSoftware />} />
          <Route path="rc-download-software" element={<RcDownloadSoftware />} />
          <Route path="rto-agent-software-free-download" element={<RtoAgentSoftwareFreeDownload />} />
          <Route path="driving-school-software" element={<DrivingSchoolSoftware />} />
          <Route path="document-expiry-reminder-software" element={<DocumentExpiryReminderSoftware />} />
          <Route path="vehicle-document-expiry-reminder-software" element={<ExpiryReminderSoftware />} />
          <Route path="rc-verification-software" element={<RcVerificationSoftware />} />
          <Route path="national-permit-renewal-reminder-software" element={<NationalPermitSoftware />} />
          <Route path="driving-licence-software" element={<DrivingLicenceSoftware />} />
          <Route path="sitemap" element={<Sitemap />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
