import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const services = [
  { key: 'fitness', label: 'Fitness' },
  { key: 'tax', label: 'Tax' },
  { key: 'puc', label: 'PUC' },
  { key: 'gps', label: 'GPS' },
  { key: 'nationalPermit', label: 'NP' },
  { key: 'statePermit', label: 'State Permit' },
  { key: 'busPermit', label: 'Bus Permit' },
  { key: 'temporaryPermit', label: 'Temp Permit' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'llEligible', label: 'LL Eligible for DL' }
]

const languageOptions = [
  { value: 'both', label: 'Both (English + Hindi)' },
  { value: 'english', label: 'English only' },
  { value: 'hindi', label: 'Hindi only' }
]

const defaultRule = {
  enabled: true,
  beforeDays: [7],
  sendOnExpiryDay: true,
  sendAfterExpiry: false,
  afterDays: [7, 10],
  customMessage: ''
}

const previewSample = {
  serviceName: 'Fitness',
  vehicleNo: 'CG04 AB 1234',
  expiryDate: '15-08-2026',
  alertLabel: 'expires in 7 days',
  signature: 'RTO Services',
  address: 'Shop No. 1, Main Road, Raipur'
}

const applySampleTemplate = (template) => {
  let msg = template || ''
  msg = msg.replace(/\{serviceName\}/g, previewSample.serviceName)
  msg = msg.replace(/\{vehicleNo\}/g, previewSample.vehicleNo)
  msg = msg.replace(/\{expiryDate\}/g, previewSample.expiryDate)
  msg = msg.replace(/\{alertLabel\}/g, previewSample.alertLabel)
  msg = msg.replace(/\{signature\}/g, previewSample.signature)
  msg = msg.replace(/\{address\}/g, `📍 ${previewSample.address}`)
  return msg
}

const buildDefaultPreview = (language, serviceLabel) => {
  const signature = previewSample.signature
  const address = previewSample.address
  const footer = `\n\n────────────────\n*${signature}*\n\n📍 ${address}`
  const english = `Dear Customer,\n\n📄 *${serviceLabel}* · 🚗 *${previewSample.vehicleNo}*\n📅 Expires on *${previewSample.expiryDate}* _(${previewSample.alertLabel})_\n\n⚠️ Please visit for renewal to avoid penalties.${footer}`
  const hindi = `प्रिय ग्राहक,\n\n📄 *${serviceLabel}* · 🚗 *${previewSample.vehicleNo}*\n📅 *${previewSample.expiryDate}* को समाप्त होगा _(${previewSample.alertLabel})_\n\n⚠️ कृपया जुर्माने से बचने के लिए नवीनीकरण करवाएं।${footer}`

  if (language === 'english') return english
  if (language === 'hindi') return hindi
  return `${english}\n\n${hindi}`
}

const beforeDayOptions = [30, 15, 10, 7, 5, 3, 1]
const afterDayOptions = [1, 3, 5, 7, 10, 15, 30]

const parseDays = (value) => {
  const parsed = String(value || '')
    .split(/[,\s]+/)
    .map(item => Number(item.trim()))
    .filter(item => Number.isInteger(item) && item > 0 && item <= 365)

  return [...new Set(parsed)].sort((a, b) => a - b)
}

const normalizeBeforeInput = (value, keepExpiryDay) => {
  const cleaned = String(value || '')
    .replace(/expiry\s*day/ig, '')
    .replace(/expiryday/ig, '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .join(', ')

  return keepExpiryDay
    ? [cleaned, 'expiryday'].filter(Boolean).join(', ')
    : cleaned
}

const formatBeforeDays = (rule, isFocused = false) => [
  ...(rule.beforeDays || []),
  ...(!isFocused && rule.sendOnExpiryDay ? ['expiryday'] : [])
].join(', ')

const formatDays = (days = []) => days.join(', ')

const normalizeRules = (rules = {}) => {
  const normalized = {}
  services.forEach(service => {
    normalized[service.key] = {
      ...defaultRule,
      ...(rules[service.key] || {}),
      beforeDays: rules[service.key]?.beforeDays?.length ? parseDays(rules[service.key].beforeDays.join(',')) : defaultRule.beforeDays,
      afterDays: rules[service.key]?.afterDays?.length ? parseDays(rules[service.key].afterDays.join(',')) : defaultRule.afterDays
    }
  })
  return normalized
}

const WhatsAppSettings = () => {
  const [settings, setSettings] = useState({
    alertRules: normalizeRules(),
    maxMessagesPerDay: 30,
    maxMessagesPerHour: 5,
    messageLanguage: 'both',
    welcomeMessageEnabled: false,
    welcomeMessageTemplate: 'Welcome to RTO Services! We are glad to serve you.',
    welcomeMessageTemplateHi: 'आरटीओ सेवाओं में आपका स्वागत है! हम आपकी सेवा करने के लिए तत्पर हैं।',
    autoSendInsurancePolicy: false,
    insurancePolicyMessageTemplate: ''
  })
  const [draftInputs, setDraftInputs] = useState({})
  const [focusedInputs, setFocusedInputs] = useState({})
  const [previewFor, setPreviewFor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/whatsapp-settings`, { withCredentials: true })
      setSettings({
        ...res.data,
        alertRules: normalizeRules(res.data?.alertRules)
      })
      setDraftInputs({})
    } catch (error) {
      toast.error('Failed to load WhatsApp settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const updateRule = (serviceKey, patch) => {
    setSettings(prev => ({
      ...prev,
      alertRules: {
        ...prev.alertRules,
        [serviceKey]: {
          ...prev.alertRules[serviceKey],
          ...patch
        }
      }
    }))
  }

  const toggleDay = (serviceKey, field, day) => {
    const rule = settings.alertRules[serviceKey]
    const selected = new Set(rule[field] || [])
    if (selected.has(day)) {
      selected.delete(day)
    } else {
      selected.add(day)
    }
    updateRule(serviceKey, { [field]: [...selected].sort((a, b) => a - b) })
  }

  const toggleExpiryDay = (serviceKey, beforeInputKey, currentRule) => {
    const nextValue = !currentRule.sendOnExpiryDay
    updateRule(serviceKey, { sendOnExpiryDay: nextValue })
    setDraftInputs(prev => ({
      ...prev,
      [beforeInputKey]: formatBeforeDays({ ...currentRule, sendOnExpiryDay: nextValue }, focusedInputs[beforeInputKey])
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...settings,
        alertRules: normalizeRules(settings.alertRules)
      }
      const response = await axios.put(`${API_URL}/api/whatsapp-settings`, payload, { withCredentials: true })
      setSettings({
        ...response.data,
        alertRules: normalizeRules(response.data?.alertRules)
      })
      setDraftInputs({})
      toast.success('WhatsApp settings updated successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='bg-white rounded-xl p-6 shadow-lg border border-green-200 mt-4'>
        <p className='text-sm font-semibold text-gray-600'>Loading WhatsApp settings...</p>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-xl p-6 shadow-lg border border-green-200 mt-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-xl'>
            WA
          </div>
          <div>
            <h2 className='text-base font-bold text-gray-800'>WhatsApp Automated Settings</h2>
            <p className='text-[11px] text-gray-500'>Choose which expiry alerts and automated messages should be sent.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className='px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition text-sm disabled:opacity-60'
        >
          {saving ? 'Saving...' : 'Save WhatsApp Settings'}
        </button>
      </div>

      {/* Feature 1: Welcome Message Feature (Off by Default) */}
      <div className='mb-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4'>
        <div className='flex items-center justify-between mb-2'>
          <div>
            <h3 className='text-sm font-bold text-blue-900'>1. Welcome WhatsApp Message to Client</h3>
            <p className='text-[11px] text-blue-700'>Automatically sends 1 welcome message to new clients when created. Keeps record in DB so repeat messages are never sent.</p>
          </div>
          <label className='relative inline-flex items-center cursor-pointer'>
            <input
              type='checkbox'
              checked={settings.welcomeMessageEnabled || false}
              onChange={e => setSettings(prev => ({ ...prev, welcomeMessageEnabled: e.target.checked }))}
              className='sr-only peer'
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.welcomeMessageEnabled && (
          <div className='mt-3 space-y-3 pt-3 border-t border-blue-200'>
            <div>
              <label className='text-xs font-semibold text-gray-700 block mb-1'>Welcome Message Template (English)</label>
              <textarea
                value={settings.welcomeMessageTemplate || ''}
                onChange={e => setSettings(prev => ({ ...prev, welcomeMessageTemplate: e.target.value }))}
                rows={2}
                placeholder="Dear {partyName}, welcome to RTO Services! We are glad to serve you."
                className='w-full rounded-lg border border-gray-300 p-2 text-xs focus:ring-1 focus:ring-blue-500'
              />
              <span className='text-[10px] text-gray-500'>Available variables: {"{partyName}"}, {"{mobileNumber}"}</span>
            </div>

            <div>
              <label className='text-xs font-semibold text-gray-700 block mb-1'>Welcome Message Template (Hindi Optional)</label>
              <textarea
                value={settings.welcomeMessageTemplateHi || ''}
                onChange={e => setSettings(prev => ({ ...prev, welcomeMessageTemplateHi: e.target.value }))}
                rows={2}
                placeholder="प्रिय {partyName}, आरटीओ सेवाओं में आपका स्वागत है!"
                className='w-full rounded-lg border border-gray-300 p-2 text-xs focus:ring-1 focus:ring-blue-500'
              />
            </div>
          </div>
        )}
      </div>

      {/* Feature 2: Insurance Policy Document Auto-Send Feature (Off by Default) */}
      <div className='mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4'>
        <div className='flex items-center justify-between mb-2'>
          <div>
            <h3 className='text-sm font-bold text-emerald-900'>2. Automated Insurance Policy PDF & Message Send</h3>
            <p className='text-[11px] text-emerald-700'>Default setting for sending policy details and attached PDF document when creating an insurance policy record.</p>
          </div>
          <label className='relative inline-flex items-center cursor-pointer'>
            <input
              type='checkbox'
              checked={settings.autoSendInsurancePolicy || false}
              onChange={e => setSettings(prev => ({ ...prev, autoSendInsurancePolicy: e.target.checked }))}
              className='sr-only peer'
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {settings.autoSendInsurancePolicy && (
          <div className='mt-3 space-y-2 pt-3 border-t border-emerald-200'>
            <label className='text-xs font-semibold text-gray-700 block mb-1'>Policy Message Template</label>
            <textarea
              value={settings.insurancePolicyMessageTemplate || ''}
              onChange={e => setSettings(prev => ({ ...prev, insurancePolicyMessageTemplate: e.target.value }))}
              rows={4}
              placeholder={`Dear {policyHolderName}, here is your Insurance Policy for Vehicle {vehicleNumber}.\nPolicy No: {policyNumber}, Valid From: {validFrom} To {validTo}.\n\n📄 Download PDF: {pdfLink}`}
              className='w-full rounded-lg border border-gray-300 p-2 text-xs focus:ring-1 focus:ring-emerald-500'
            />
            <span className='text-[10px] text-gray-500'>
              Available variables: {"{policyHolderName}"}, {"{vehicleNumber}"}, {"{policyNumber}"}, {"{insuranceCompany}"}, {"{validFrom}"}, {"{validTo}"}, {"{pdfLink}"} (auto PDF download link)
              <br />
              <span className='text-emerald-700 font-semibold'>💡 Tip: If template is left empty, a default message with the PDF link is sent automatically.</span>
            </span>
          </div>
        )}
      </div>

      <div className='mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4'>
        <label className='text-xs font-semibold text-gray-700 block mb-1'>Message Language</label>
        <p className='text-[10px] text-gray-500 mb-2'>Choose the language for auto alerts. When "Both" is selected, English and Hindi are sent together in one message. A custom template, if written, is always sent as one message.</p>
        <div className='flex flex-wrap gap-2'>
          {languageOptions.map(option => (
            <button
              key={option.value}
              type='button'
              onClick={() => setSettings(prev => ({ ...prev, messageLanguage: option.value }))}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition ${
                settings.messageLanguage === option.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-green-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className='mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4'>
        <div>
          <label className='text-xs font-semibold text-gray-700 block mb-1'>Max Messages Per Day</label>
          <input
            type='number'
            min='1'
            value={settings.maxMessagesPerDay || 30}
            onChange={(e) => setSettings(prev => ({ ...prev, maxMessagesPerDay: Number(e.target.value) || 1 }))}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xs'
          />
        </div>
        <div>
          <label className='text-xs font-semibold text-gray-700 block mb-1'>Max Messages Per Hour</label>
          <input
            type='number'
            min='1'
            value={settings.maxMessagesPerHour || 5}
            onChange={(e) => setSettings(prev => ({ ...prev, maxMessagesPerHour: Number(e.target.value) || 1 }))}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xs'
          />
        </div>
      </div>

      <div className='space-y-3'>
        {services.map(service => {
          const rule = settings.alertRules[service.key] || defaultRule
          const beforeInputKey = `${service.key}.beforeDays`
          const afterInputKey = `${service.key}.afterDays`
          return (
            <div key={service.key} className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                <div className='min-w-[150px]'>
                  <label className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={rule.enabled}
                      onChange={(e) => updateRule(service.key, { enabled: e.target.checked })}
                      className='w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500'
                    />
                    <span className='text-xs font-black text-gray-800'>{service.label}</span>
                  </label>
                  <p className='mt-1 text-[10px] text-gray-500'>{rule.enabled ? 'Messages enabled' : 'Messages disabled'}</p>
                </div>

                <div className='grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12'>
                  <div className='flex flex-col gap-4 lg:col-span-5 xl:col-span-4'>
                    <div className={!rule.enabled ? 'opacity-50 pointer-events-none' : ''}>
                    <label className='block text-[10px] font-bold uppercase text-gray-600 mb-2'>Before Expiry Days</label>
                    <div className='flex flex-wrap gap-2'>
                      {beforeDayOptions.map(day => (
                        <button
                          key={day}
                          type='button'
                          onClick={() => toggleDay(service.key, 'beforeDays', day)}
                          className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold transition ${
                            rule.beforeDays.includes(day)
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-green-300'
                          }`}
                        >
                          {day}d
                        </button>
                      ))}
                      <button
                        type='button'
                        onClick={() => toggleExpiryDay(service.key, beforeInputKey, rule)}
                        className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold transition ${
                          rule.sendOnExpiryDay
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-green-300'
                        }`}
                      >
                        Expiry Day
                      </button>
                    </div>
                    <input
                      type='text'
                      value={draftInputs[beforeInputKey] ?? formatBeforeDays(rule, focusedInputs[beforeInputKey])}
                      onFocus={() => {
                        setFocusedInputs(prev => ({ ...prev, [beforeInputKey]: true }))
                        setDraftInputs(prev => ({
                          ...prev,
                          [beforeInputKey]: normalizeBeforeInput(prev[beforeInputKey] ?? formatBeforeDays(rule, false), false)
                        }))
                      }}
                      onBlur={() => {
                        setFocusedInputs(prev => ({ ...prev, [beforeInputKey]: false }))
                        setDraftInputs(prev => ({
                          ...prev,
                          [beforeInputKey]: formatBeforeDays(settings.alertRules[service.key] || defaultRule, false)
                        }))
                      }}
                      onChange={(e) => {
                        const value = e.target.value
                        const shouldSendOnExpiryDay = /expiry\s*day|expiryday|0/i.test(value) || rule.sendOnExpiryDay
                        setDraftInputs(prev => ({ ...prev, [beforeInputKey]: value }))
                        updateRule(service.key, {
                          beforeDays: parseDays(value),
                          sendOnExpiryDay: shouldSendOnExpiryDay
                        })
                      }}
                      placeholder='e.g. 30, 15, 7, expiryday'
                      className='mt-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-green-500'
                    />
                  </div>

                  <div className={!rule.enabled ? 'opacity-50 pointer-events-none' : ''}>
                    <label className='mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-gray-600'>
                      <span>After Expiry Days</span>
                      <span className='inline-flex items-center rounded border border-gray-200 bg-gray-50 p-0.5'>
                        <input
                          type='checkbox'
                          checked={rule.sendAfterExpiry}
                          onChange={(e) => updateRule(service.key, { sendAfterExpiry: e.target.checked })}
                          className='w-2.5 h-2.5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                        />
                      </span>
                    </label>
                    <div className={`space-y-2 ${!rule.sendAfterExpiry ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className='flex flex-wrap gap-2'>
                        {afterDayOptions.map(day => (
                          <button
                            key={day}
                            type='button'
                            onClick={() => toggleDay(service.key, 'afterDays', day)}
                            className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold transition ${
                              rule.afterDays.includes(day)
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-red-300'
                            }`}
                          >
                            {day}d
                          </button>
                        ))}
                      </div>
                      <input
                        type='text'
                        value={draftInputs[afterInputKey] ?? formatDays(rule.afterDays)}
                        onChange={(e) => {
                          const value = e.target.value
                          setDraftInputs(prev => ({ ...prev, [afterInputKey]: value }))
                          updateRule(service.key, { afterDays: parseDays(value) })
                        }}
                        placeholder='e.g. 7, 10'
                        className='w-full rounded-lg border border-gray-300 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-green-500'
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Message Editor */}
                <div className={`flex flex-col lg:col-span-7 xl:col-span-8 ${!rule.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className='mb-1 flex items-center justify-between'>
                      <label className='block text-[10px] font-bold uppercase text-gray-600'>Custom Message Template (optional)</label>
                      <button
                        type='button'
                        onClick={() => setPreviewFor(service.key)}
                        className='inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-bold text-gray-600 hover:border-green-300 hover:text-green-700'
                      >
                        <span className='inline-flex items-center justify-center w-3 h-3 rounded-full bg-green-100 text-green-700 text-[8px] font-black'>i</span>
                        Preview Message
                      </button>
                    </div>
                    <div className='text-[9px] text-gray-500 font-medium mb-2 leading-tight'>
                      Leave empty to send the auto alert in the selected language. Write your own message to send it exactly as written — you can include both English and Hindi in one message.
                      Variables: <code className='bg-gray-100 px-1 py-0.5 rounded'>{"{serviceName}"}</code>, <code className='bg-gray-100 px-1 py-0.5 rounded'>{"{vehicleNo}"}</code>, <code className='bg-gray-100 px-1 py-0.5 rounded'>{"{expiryDate}"}</code>, <code className='bg-gray-100 px-1 py-0.5 rounded'>{"{alertLabel}"}</code>, <code className='bg-gray-100 px-1 py-0.5 rounded'>{"{signature}"}</code>, <code className='bg-gray-100 px-1 py-0.5 rounded'>{"{address}"}</code>
                    </div>
                    <textarea
                      value={draftInputs[`${service.key}.customMessage`] ?? rule.customMessage}
                      onChange={(e) => {
                        const value = e.target.value
                        setDraftInputs(prev => ({ ...prev, [`${service.key}.customMessage`]: value }))
                        updateRule(service.key, { customMessage: value })
                      }}
                      rows={5}
                      className='w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-green-500 font-mono resize-y min-h-[110px]'
                      placeholder='e.g. Dear Customer, ... 🚗 *{vehicleNo}* expires on *{expiryDate}* ... प्रिय ग्राहक, ... कृपया नवीनीकरण हेतु संपर्क करें ...'
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {previewFor && (() => {
        const rule = settings.alertRules[previewFor] || defaultRule
        const serviceLabel = services.find(s => s.key === previewFor)?.label || previewFor
        const language = settings.messageLanguage
        const text = rule.customMessage && rule.customMessage.trim() !== ''
          ? applySampleTemplate(rule.customMessage)
          : buildDefaultPreview(language, serviceLabel)
        return (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' onClick={() => setPreviewFor(null)}>
            <div className='w-full max-w-md rounded-xl bg-white p-5 shadow-2xl' onClick={(e) => e.stopPropagation()}>
              <div className='mb-3 flex items-center justify-between'>
                <div>
                  <h3 className='text-sm font-bold text-gray-800'>Message Preview</h3>
                  <p className='text-[10px] text-gray-500'>{serviceLabel} · {language === 'both' ? 'English + Hindi' : language === 'hindi' ? 'Hindi only' : 'English only'} · {rule.customMessage && rule.customMessage.trim() !== '' ? 'Custom message' : 'Auto alert'}</p>
                </div>
                <button
                  type='button'
                  onClick={() => setPreviewFor(null)}
                  className='inline-flex items-center justify-center w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100'
                >
                  ✕
                </button>
              </div>
              <div className='max-h-[55vh] overflow-y-auto rounded-lg bg-[#DCF8C6] p-3'>
                <pre className='whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-gray-800'>{text}</pre>
                <div className='mt-1 text-right text-[8px] text-gray-500'>SAMPLE</div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default WhatsAppSettings
