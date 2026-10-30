import { LOOKUP_PRICE } from './vehicleInfo'

export const RTO_OFFLINE_PATH = '/rto-offline-software'

export const rtoOfflineFaqs = [
  {
    q: 'What is RTO offline software?',
    a: 'RTO offline software is desktop software for RTO agents that is installed on one computer and keeps all vehicle, client and payment data on that computer’s hard disk. It works without internet, but the data stays on that one PC.',
  },
  {
    q: 'Does RTO Sarthi work offline?',
    a: 'No. RTO Sarthi is online RTO software, so it needs an internet connection. It is light and works on normal broadband, mobile data or a phone hotspot. Because the data is online, it is backed up automatically, opens on your mobile too, and WhatsApp reminders go to clients even when your office computer is switched off.',
  },
  {
    q: 'Can I install RTO Sarthi on my computer like offline software?',
    a: 'Yes. RTO Sarthi has dedicated Windows software that our team installs on your office computers. It has its own desktop and taskbar icon and opens in its own window like any desktop software, while your data is safely backed up in the cloud. It also works on Mac and in the web browser.',
  },
  {
    q: 'What is the risk of keeping RTO data in offline software?',
    a: 'All your records live on one hard disk. A hard disk crash, virus, theft, Windows reinstall or a new computer can wipe years of vehicle and client records if there is no recent backup. You also cannot see the data on your mobile at the RTO, and staff on other computers cannot work on the same records.',
  },
  {
    q: 'Can offline RTO software send WhatsApp reminders?',
    a: 'Usually not automatically, because offline software only runs when the office computer is on and someone opens it. RTO Sarthi sends automatic WhatsApp reminders before tax, fitness, permit, PUC and insurance expiry from the server, whether your computer is on or off.',
  },
  {
    q: 'Can offline software search vehicle details by vehicle number?',
    a: `No. Vehicle details come from online records, so a search needs internet anyway. In RTO Sarthi you enter any vehicle number to get RC details, the RC and Vehicle Particulars PDF, and tax, fitness, PUC and insurance status at just ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'My internet is slow. Will RTO Sarthi work?',
    a: 'Yes. RTO Sarthi is built to be light. It works on normal office broadband, 4G mobile data or a hotspot from your phone. If the office internet goes down, you can keep working from the app on your mobile.',
  },
  {
    q: 'Is my data safe online?',
    a: 'Yes. Data is stored securely on the server and backed up, not on one PC, so a broken or stolen computer does not lose your records. Each staff member gets their own login.',
  },
  {
    q: 'Can I move my data from offline RTO software or Excel to RTO Sarthi?',
    a: 'Yes. PUC and insurance records can be imported in bulk from Excel with ready templates, and RC, insurance or permit copies can be uploaded so RTO Sarthi fills the details automatically. Our team helps you move your existing records.',
  },
  {
    q: 'Do I need to install updates?',
    a: 'No. Offline software usually needs a new setup file for every update. RTO Sarthi updates automatically, so you always use the latest version.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. Message us on WhatsApp or call. We create your free trial account the same day and help you install RTO Sarthi on your computer and mobile.',
  },
]
