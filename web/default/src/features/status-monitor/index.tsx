/*
Copyright (C) 2023-2026 huanxing

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@huanxing.com
*/
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, RefreshCw, Loader2, Zap, Radio, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { SectionPageLayout } from '@/components/layout'
import {
  getStatusMonitor,
  type StatusCheckPoint,
  type StatusProvider,
} from './api'

const STATUS_CONFIG: Record<
  string,
  {
    labelKey: string
    color: string
    text: string
    border: string
    bg: string
    badge: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  operational: {
    labelKey: 'Operational',
    color: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    badge: 'default',
  },
  degraded: {
    labelKey: 'Degraded',
    color: 'bg-yellow-500',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
    bg: 'bg-yellow-50',
    badge: 'secondary',
  },
  failed: {
    labelKey: 'Failed',
    color: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    badge: 'destructive',
  },
  error: {
    labelKey: 'Error',
    color: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    badge: 'destructive',
  },
  validation_failed: {
    labelKey: 'Validation failed',
    color: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    badge: 'destructive',
  },
}

const getStatus = (s?: string) =>
  STATUS_CONFIG[s || 'error'] || STATUS_CONFIG.error

const TIMELINE_LENGTH = 60

const TIMELINE_COLOR: Record<string, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  failed: 'bg-red-500',
  error: 'bg-red-500',
  validation_failed: 'bg-orange-500',
  empty: 'bg-gray-300 dark:bg-muted',
}

const formatLatency = (value?: number | null) =>
  typeof value === 'number' ? `${value} ms` : '—'

const formatCheckedAt = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function Timeline({
  timeline,
  t,
}: {
  timeline?: StatusCheckPoint[]
  t: ReturnType<typeof useTranslation>['t']
}) {
  const segments = Array.from(
    { length: TIMELINE_LENGTH },
    (_, index) => timeline?.[index] ?? null
  )

  return (
    <div className='bg-muted/20 relative h-8 w-full overflow-hidden rounded-sm'>
      <div className='flex h-full w-full flex-row-reverse gap-[2px] p-[2px]'>
        {segments.map((segment, index) => {
          if (!segment) {
            return (
              <div
                key={`placeholder-${index}`}
                className='bg-muted/10 flex-1 rounded-[1px]'
                aria-label={t('No data')}
              />
            )
          }
          const color =
            TIMELINE_COLOR[segment.status || 'empty'] ?? TIMELINE_COLOR.empty
          const status = getStatus(segment.status)
          const statusLabel = t(status.labelKey)
          return (
            <HoverCard key={`${segment.checked_at ?? index}-${index}`}>
              <HoverCardTrigger
                render={
                  <button
                    type='button'
                    className={`relative block h-full w-full flex-1 rounded-[1px] transition-all duration-200 hover:z-10 hover:scale-y-110 hover:opacity-80 ${color}`}
                    aria-label={`${formatCheckedAt(segment.checked_at)} · ${statusLabel}`}
                  />
                }
              />
              <HoverCardContent
                side='top'
                className='border-border/50 bg-background/95 w-64 space-y-3 rounded-xl p-4 shadow-xl backdrop-blur-xl'
              >
                <div className='border-border/50 flex items-center justify-between border-b pb-2'>
                  <Badge
                    variant={status.badge}
                    className='h-5 px-1.5 text-[10px]'
                  >
                    {statusLabel}
                  </Badge>
                  <span className='text-muted-foreground font-mono text-[10px]'>
                    {formatCheckedAt(segment.checked_at)}
                  </span>
                </div>

                <div className='grid gap-2 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>
                      {t('Latency')}
                    </span>
                    <span className='font-mono font-medium'>
                      {formatLatency(segment.latency_ms)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>{t('Ping')}</span>
                    <span className='font-mono font-medium'>
                      {formatLatency(segment.ping_latency_ms)}
                    </span>
                  </div>
                </div>

                {segment.message && (
                  <div className='bg-muted/30 text-muted-foreground rounded p-2 text-[10px] break-words'>
                    {segment.message}
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
          )
        })}
      </div>
    </div>
  )
}

function TimelineSection({
  timeline,
  countdown,
  t,
}: {
  timeline?: StatusCheckPoint[]
  countdown: number
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='text-muted-foreground flex items-center justify-between text-[10px] font-medium tracking-wider uppercase'>
        <span>
          {(timeline?.length ?? 0) <= 1
            ? t('History (latest)')
            : t('History ({{count}} points)', {
                count: timeline?.length ?? 0,
              })}
        </span>
        <span className='text-primary flex items-center gap-1.5'>
          <Clock className='h-3 w-3' />
          {t('Next update {{time}}', { time: formatCountdown(countdown) })}
        </span>
      </div>
      <Timeline timeline={timeline} t={t} />
      <div className='text-muted-foreground/50 flex justify-between text-[9px] font-medium tracking-widest uppercase'>
        <span>{t('Past')}</span>
        <span>{t('Now')}</span>
      </div>
    </div>
  )
}

const formatCountdown = (s: number) => `${Math.floor(s / 60)}M ${s % 60}S`

export function StatusMonitor() {
  const { t } = useTranslation()
  const [countdown, setCountdown] = useState(300)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['status-monitor'],
    queryFn: getStatusMonitor,
    refetchInterval: 300000,
  })

  useEffect(() => {
    setCountdown(300)
  }, [data])

  useEffect(() => {
    const timer = setInterval(
      () => setCountdown((c) => Math.max(0, c - 1)),
      1000
    )
    return () => clearInterval(timer)
  }, [])

  const payload = data?.data
  const providers = payload?.providers ?? []
  const summary = payload?.summary ?? { total: 0, operational: 0 }
  const allOk = summary.operational === summary.total && summary.total > 0

  const renderCard = (provider: StatusProvider) => {
    const latest = provider.latest
    const status = getStatus(latest?.status)
    const stats = provider.statistics
    const availability =
      stats?.successRate != null ? stats.successRate.toFixed(2) : '0.00'
    return (
      <Card key={provider.id} className='overflow-hidden border shadow-sm'>
        <div className='p-3.5'>
          <div className='mb-3 flex items-start justify-between gap-3'>
            <div>
              <h3 className='text-foreground text-sm font-bold'>
                {provider.name}
              </h3>
              <p className='text-muted-foreground text-xs'>
                <span className='capitalize'>{provider.type}</span>
                <span className='mx-1.5 opacity-40'>·</span>
                <span className='font-mono text-[11px]'>{provider.model}</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${status.bg} ${status.text} ${status.border}`}
            >
              {t(status.labelKey)}
            </span>
          </div>

          <div className='mb-3 grid grid-cols-2 gap-2'>
            <div className='bg-muted/40 rounded-md px-2.5 py-2'>
              <div className='mb-0.5 flex items-center gap-1.5'>
                <Zap size={12} className='text-muted-foreground' />
                <span className='text-muted-foreground text-[11px]'>
                  {t('Chat Latency')}
                </span>
              </div>
              <span className='text-foreground text-base font-bold'>
                {latest?.latency_ms ?? '—'}
                {latest?.latency_ms != null && (
                  <span className='text-muted-foreground ml-1 text-xs font-normal'>
                    ms
                  </span>
                )}
              </span>
            </div>
            <div className='bg-muted/40 rounded-md px-2.5 py-2'>
              <div className='mb-0.5 flex items-center gap-1.5'>
                <Radio size={12} className='text-muted-foreground' />
                <span className='text-muted-foreground text-[11px]'>
                  {t('Endpoint PING')}
                </span>
              </div>
              <span className='text-foreground text-base font-bold'>
                {latest?.ping_latency_ms ?? '—'}
                {latest?.ping_latency_ms != null && (
                  <span className='text-muted-foreground ml-1 text-xs font-normal'>
                    ms
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className='mb-3'>
            <div className='mb-1 flex items-center justify-between'>
              <span className='text-muted-foreground text-xs'>
                {t('Availability (7d)')}
              </span>
              <span
                className={`text-sm font-bold ${
                  parseFloat(availability) >= 90
                    ? 'text-emerald-600'
                    : parseFloat(availability) >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {availability}%
              </span>
            </div>
            <div className='text-muted-foreground text-[10px]'>
              {stats?.operationalCount ?? 0}/{stats?.totalChecks ?? 0}{' '}
              {t('Success')}
            </div>
          </div>
        </div>
        <div className='border-border/40 bg-muted/10 border-t px-3.5 py-3'>
          <TimelineSection
            timeline={provider.timeline}
            countdown={countdown}
            t={t}
          />
        </div>
      </Card>
    )
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <span className='inline-flex items-center gap-2'>
          <Activity className='text-primary h-5 w-5' />
          {t('Status Monitor')}
        </span>
      </SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('API availability monitoring for each model')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Actions>
        <div className='flex items-center gap-3'>
          {payload && (
            <div className='flex items-center gap-2'>
              <div
                className={`h-2.5 w-2.5 animate-pulse rounded-full ${
                  allOk ? 'bg-emerald-500' : 'bg-yellow-500'
                }`}
              />
              <span className='text-muted-foreground text-xs'>
                {allOk
                  ? t('All services operational')
                  : `${summary.operational}/${summary.total} ${t('Operational')}`}
              </span>
            </div>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isFetching}
            className='gap-2'
          >
            {isFetching ? (
              <Loader2 size={14} className='animate-spin' />
            ) : (
              <RefreshCw size={14} />
            )}
            {t('Refresh')}
          </Button>
        </div>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        {isLoading ? (
          <div className='flex justify-center py-16'>
            <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
          </div>
        ) : providers.length > 0 ? (
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
            {providers.map(renderCard)}
          </div>
        ) : (
          <Card className='text-muted-foreground p-12 text-center'>
            <Activity className='mx-auto mb-3 h-10 w-10 opacity-20' />
            <p>{t('No monitoring data')}</p>
          </Card>
        )}
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
