import React, { useEffect, useState } from 'react'
import {
  CheckCircle2, Loader2, QrCode, PauseCircle, LogOut, RefreshCw, AlertTriangle,
  WifiOff, Smartphone, X, PlayCircle, Clock
} from 'lucide-react'

// Steps shown while the server connects to WhatsApp. Keys match the backend initStage / status.
const START_STEPS = [
  { key: 'waiting', label: 'Waiting for your turn' },
  { key: 'connecting', label: 'Connecting to WhatsApp' },
  { key: 'syncing', label: 'Finishing connection' },
]
// Stage names used by the older browser-based engine
const STAGE_ALIASES = { launching_browser: 'connecting', loading_wweb: 'connecting' }

function useNow(active) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])
  return now
}

const fmtSecs = (s) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`)

function Button({ onClick, busy, disabled, variant = 'primary', icon: Icon, children }) {
  const styles = {
    primary: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm',
    danger: 'bg-white hover:bg-red-50 text-red-600 border border-red-200',
  }
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      className={`w-full py-2.5 px-3 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {busy ? <Loader2 className='w-4 h-4 animate-spin' /> : Icon && <Icon className='w-4 h-4' />}
      {children}
    </button>
  )
}

function Badge({ tone, children }) {
  const tones = {
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${tones[tone]}`}>{children}</span>
}

function Notice({ tone = 'amber', icon = AlertTriangle, title, children }) {
  const Icon = icon
  const tones = {
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  }
  return (
    <div className={`flex gap-2.5 p-3 rounded-lg border text-sm ${tones[tone]}`}>
      <Icon className='w-4 h-4 mt-0.5 shrink-0' />
      <div className='min-w-0'>
        {title && <p className='font-semibold'>{title}</p>}
        {children && <div className='text-xs mt-0.5 opacity-90 break-words'>{children}</div>}
      </div>
    </div>
  )
}

function PendingNote({ count, connected = false }) {
  if (!count) return null
  const what = count === 1 ? '1 message is queued. It will be sent' : `${count} messages are queued. They will be sent`
  return (
    <p className='text-xs text-gray-500 flex items-center gap-1.5'>
      <Clock className='w-3.5 h-3.5 shrink-0' />
      {what} {connected ? 'automatically, within your hourly and daily limits.' : 'automatically once WhatsApp is connected.'}
    </p>
  )
}

function StartingView({ s, now, onCancel, busy }) {
  const stageKey = s.status === 'syncing' ? 'syncing' : (STAGE_ALIASES[s.initStage] || s.initStage || 'waiting')
  const current = Math.max(0, START_STEPS.findIndex(st => st.key === stageKey))
  const elapsed = s.startedAt ? Math.max(0, Math.floor((now - new Date(s.startedAt).getTime()) / 1000)) : 0
  return (
    <div className='space-y-4'>
      <ol className='space-y-2.5'>
        {START_STEPS.map((step, i) => (
          <li key={step.key} className='flex items-center gap-2.5 text-sm'>
            {i < current ? (
              <CheckCircle2 className='w-4 h-4 text-green-600 shrink-0' />
            ) : i === current ? (
              <Loader2 className='w-4 h-4 text-blue-600 animate-spin shrink-0' />
            ) : (
              <span className='w-4 h-4 rounded-full border-2 border-gray-200 shrink-0' />
            )}
            <span className={i === current ? 'font-semibold text-gray-900' : i < current ? 'text-gray-500' : 'text-gray-400'}>
              {step.label}
            </span>
            {i === current && elapsed > 0 && <span className='ml-auto text-xs text-gray-400 tabular-nums'>{fmtSecs(elapsed)}</span>}
          </li>
        ))}
      </ol>
      {stageKey === 'waiting' && (
        <Notice tone='blue' icon={Clock} title='Another account is sending right now'>
          WhatsApp connects one account at a time. Yours starts automatically in a moment.
        </Notice>
      )}
      {stageKey !== 'waiting' && elapsed > 30 && (
        <Notice tone='blue' icon={Clock} title='Taking longer than usual'>
          It keeps trying for up to 90 seconds, then shows what went wrong. You don't need to click anything.
        </Notice>
      )}
      <Button variant='secondary' icon={X} onClick={onCancel} busy={busy === 'cancel'}>Cancel</Button>
    </div>
  )
}

function QrView({ s, now, onRenew, onCancel, busy }) {
  const secsLeft = s.qrExpiresAt ? Math.max(0, Math.floor((new Date(s.qrExpiresAt).getTime() - now) / 1000)) : null
  return (
    <div className='space-y-4'>
      <div className='flex justify-center'>
        <div className='p-2 bg-white rounded-xl border-2 border-gray-100 shadow-sm'>
          <img src={s.qrCodeDataUrl} alt='WhatsApp QR code' className='w-56 h-56' />
        </div>
      </div>
      <ol className='text-xs text-gray-600 space-y-1.5 list-decimal list-inside'>
        <li>Open <b>WhatsApp</b> on your phone</li>
        <li>Tap <b>⋮ Menu</b> (Android) or <b>Settings</b> (iPhone) → <b>Linked devices</b></li>
        <li>Tap <b>Link a device</b> and point the camera at this code</li>
      </ol>
      <p className='text-[11px] text-gray-400 text-center'>
        The code refreshes by itself.{secsLeft !== null && ` Session closes in ${fmtSecs(secsLeft)} if not scanned.`}
      </p>
      <div className='grid grid-cols-2 gap-2'>
        <Button variant='secondary' icon={RefreshCw} onClick={onRenew} busy={busy === 'renew-qr'} disabled={!!busy}>New code</Button>
        <Button variant='secondary' icon={X} onClick={onCancel} busy={busy === 'cancel'} disabled={!!busy}>Cancel</Button>
      </div>
    </div>
  )
}

export default function ConnectionCard({ status: s, onAction, busy }) {
  const active = ['initializing', 'syncing', 'qr_ready'].includes(s?.status) || !!s?.nextReconnectAt
  const now = useNow(active)

  if (!s) {
    return (
      <div className='space-y-3 animate-pulse'>
        <div className='h-8 bg-gray-100 rounded-lg' />
        <div className='h-24 bg-gray-100 rounded-lg' />
        <div className='h-10 bg-gray-100 rounded-lg' />
      </div>
    )
  }

  const connect = () => onAction('connect')
  const cancel = () => onAction('cancel')
  const logout = () => {
    if (window.confirm('Log out of WhatsApp? The device will be unlinked and you will need to scan the QR code again.')) {
      onAction('logout')
    }
  }

  let badge, body
  switch (s.status) {
    case 'authenticated':
      badge = <Badge tone='green'>Connected</Badge>
      body = (
        <div className='space-y-4'>
          <div className='flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200'>
            <div className='w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shrink-0'>
              <Smartphone className='w-5 h-5 text-white' />
            </div>
            <div className='min-w-0'>
              <p className='text-sm font-bold text-green-900'>{s.phoneNumber ? `+${s.phoneNumber}` : 'WhatsApp connected'}</p>
              {s.lastConnectedAt && (
                <p className='text-xs text-green-700'>Since {new Date(s.lastConnectedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              )}
            </div>
          </div>
          <p className='text-xs text-gray-500'>
            {s.keepAlive
              ? 'Alerts are sent automatically between 7 AM and 9 PM. You can close this page.'
              : 'Pending messages are being sent. WhatsApp closes by itself when done; your login stays saved.'}
          </p>
          <PendingNote count={s.pendingCount} connected />
          <div className='space-y-2'>
            <Button variant='secondary' icon={PauseCircle} onClick={() => onAction('stop')} busy={busy === 'stop'} disabled={!!busy}>Pause sending</Button>
            <Button variant='danger' icon={LogOut} onClick={logout} busy={busy === 'logout'} disabled={!!busy}>Log out</Button>
          </div>
        </div>
      )
      break

    case 'initializing':
    case 'syncing':
      badge = <Badge tone='blue'>Connecting</Badge>
      body = <StartingView s={s} now={now} onCancel={cancel} busy={busy} />
      break

    case 'qr_ready':
      badge = <Badge tone='orange'>Scan QR code</Badge>
      body = s.qrCodeDataUrl
        ? <QrView s={s} now={now} onRenew={() => onAction('renew-qr')} onCancel={cancel} busy={busy} />
        : <StartingView s={s} now={now} onCancel={cancel} busy={busy} />
      break

    case 'needs_qr':
      badge = <Badge tone='amber'>Scan needed</Badge>
      body = (
        <div className='space-y-4'>
          <Notice title={s.hasSavedSession ? 'WhatsApp needs to be reconnected' : 'WhatsApp is not linked'}>
            {s.lastError || 'Scan the QR code with your phone to link WhatsApp.'}
          </Notice>
          <PendingNote count={s.pendingCount} />
          <Button icon={QrCode} onClick={connect} busy={busy === 'connect'} disabled={!!busy}>Scan QR code</Button>
        </div>
      )
      break

    case 'stopped':
      badge = <Badge tone='gray'>Paused</Badge>
      body = (
        <div className='space-y-4'>
          <Notice tone='gray' icon={PauseCircle} title='Sending is paused'>
            Your WhatsApp login is saved. Resume to continue sending alerts (no QR scan needed).
          </Notice>
          <PendingNote count={s.pendingCount} />
          <div className='space-y-2'>
            <Button icon={PlayCircle} onClick={connect} busy={busy === 'connect'} disabled={!!busy}>Resume</Button>
            <Button variant='danger' icon={LogOut} onClick={logout} busy={busy === 'logout'} disabled={!!busy}>Log out</Button>
          </div>
        </div>
      )
      break

    default: {
      // disconnected
      if (s.hasSavedSession && !s.lastError && !s.nextReconnectAt && !s.keepAlive) {
        // On-demand mode: linked and idle. This is the normal resting state.
        badge = <Badge tone='green'>Linked</Badge>
        body = (
          <div className='space-y-4'>
            <div className='flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200'>
              <div className='w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shrink-0'>
                <CheckCircle2 className='w-5 h-5 text-white' />
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-bold text-green-900'>{s.phoneNumber ? `+${s.phoneNumber}` : 'WhatsApp linked'}</p>
                <p className='text-xs text-green-700'>Ready. No QR scan needed.</p>
              </div>
            </div>
            <p className='text-xs text-gray-500'>
              WhatsApp opens by itself when a message is due (7 AM to 9 PM), sends it, and closes again.
            </p>
            <PendingNote count={s.pendingCount} connected />
            <div className='space-y-2'>
              <Button variant='secondary' icon={PlayCircle} onClick={connect} busy={busy === 'connect'} disabled={!!busy}>Send pending now</Button>
              <Button variant='danger' icon={LogOut} onClick={logout} busy={busy === 'logout'} disabled={!!busy}>Log out</Button>
            </div>
          </div>
        )
        break
      }
      const reconnectIn = s.nextReconnectAt ? Math.max(0, Math.ceil((new Date(s.nextReconnectAt).getTime() - now) / 1000)) : null
      badge = <Badge tone='gray'>{reconnectIn !== null ? 'Reconnecting' : 'Not connected'}</Badge>
      body = (
        <div className='space-y-4'>
          {reconnectIn !== null ? (
            <Notice tone='blue' icon={RefreshCw} title={`Reconnecting automatically in ${fmtSecs(reconnectIn)}`}>
              {s.lastError}
            </Notice>
          ) : s.lastError ? (
            <Notice tone='red' icon={WifiOff} title='Last connection attempt failed'>{s.lastError}</Notice>
          ) : !s.hasSavedSession ? (
            <div className='text-sm text-gray-600 space-y-2'>
              <p>Link your WhatsApp once and the system sends document expiry alerts to your clients automatically.</p>
              <p className='text-xs text-gray-500'>You stay connected. You don't need to scan again after server restarts.</p>
            </div>
          ) : null}
          <PendingNote count={s.pendingCount} />
          <Button icon={s.hasSavedSession ? PlayCircle : QrCode} onClick={connect} busy={busy === 'connect'} disabled={!!busy}>
            {s.hasSavedSession ? (reconnectIn !== null ? 'Reconnect now' : 'Connect') : 'Connect WhatsApp'}
          </Button>
          {s.hasSavedSession && reconnectIn === null && (
            <p className='text-[11px] text-gray-400 text-center'>Your login is saved. No QR scan needed.</p>
          )}
        </div>
      )
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-bold text-gray-800'>Connection</h2>
        {badge}
      </div>
      {body}
    </div>
  )
}
