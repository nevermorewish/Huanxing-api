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
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  DollarSign,
  Download,
  Loader2,
  UserCheck,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getRoleLabelKey } from '@/lib/roles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionPageLayout } from '@/components/layout'
import { CompactDateTimeRangePicker } from '@/features/usage-logs/components/compact-date-time-range-picker'
import {
  exportUserAnalytics,
  getUserAnalytics,
  type AnalyticsPeriod,
  type AnalyticsRanking,
} from './api'

const PERIODS: { value: AnalyticsPeriod; labelKey: string }[] = [
  { value: '7d', labelKey: '7 Days' },
  { value: 'today', labelKey: 'Today' },
  { value: '30d', labelKey: '30 Days' },
  { value: 'all', labelKey: 'All Time' },
]

function formatNumber(value?: number) {
  return (value ?? 0).toLocaleString()
}

function formatCurrency(value?: number) {
  return `$${(value ?? 0).toFixed(2)}`
}

function ModelUsageCell({ models }: { models?: AnalyticsRanking['models'] }) {
  const { t } = useTranslation()
  const list = models ?? []

  if (list.length === 0) {
    return <span className='text-muted-foreground'>-</span>
  }

  return (
    <div className='flex flex-col gap-1 py-1'>
      {list.map((m, i) => (
        <span
          key={`${m.model_name ?? 'model'}-${i}`}
          className='text-foreground/90 font-mono text-xs leading-relaxed whitespace-nowrap'
        >
          <span className='font-medium'>{m.model_name || '-'}</span>
          <span className='text-muted-foreground'> / </span>
          {formatNumber(m.request_count)}
          <span className='text-muted-foreground'>{t('times')} / </span>
          {formatCurrency(m.consumption)}
        </span>
      ))}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string
  value: string
  icon: typeof Users
  description?: string
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='text-muted-foreground size-4' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {description && (
          <p className='text-muted-foreground mt-1 text-xs'>{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function Analytics() {
  const { t, i18n } = useTranslation()
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d')
  const [exportRange, setExportRange] = useState<{
    start?: Date
    end?: Date
  }>({})
  const [isExporting, setIsExporting] = useState(false)

  const {
    data: res,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['user-analytics', period],
    queryFn: () => getUserAnalytics(period),
  })

  const data = res?.data
  const periodLabel =
    t(PERIODS.find((item) => item.value === period)?.labelKey ?? '') || ''
  const rankings = data?.rankings ?? []

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en'
      const blob = await exportUserAnalytics({
        start: exportRange.start
          ? Math.floor(exportRange.start.getTime() / 1000)
          : undefined,
        end: exportRange.end
          ? Math.floor(exportRange.end.getTime() / 1000)
          : undefined,
        lang,
      })
      const url = URL.createObjectURL(
        blob instanceof Blob ? blob : new Blob([blob], { type: 'text/csv' })
      )
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `user-analytics-${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success(t('Export successful'))
    } catch (_error) {
      toast.error(t('Export failed'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <span className='inline-flex items-center gap-2'>
          <Users className='text-primary size-5' />
          {t('User Analytics')}
        </span>
      </SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('View user usage rankings and identify active users')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Actions>
        <div className='flex flex-wrap items-center gap-2'>
          {isFetching && !isLoading ? (
            <Loader2 className='text-muted-foreground size-4 animate-spin' />
          ) : null}
          <CompactDateTimeRangePicker
            start={exportRange.start}
            end={exportRange.end}
            onChange={setExportRange}
            dateOnly
            className='w-auto min-w-[200px]'
          />
          <Button
            variant='outline'
            size='sm'
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className='mr-1.5 size-4 animate-spin' />
            ) : (
              <Download className='mr-1.5 size-4' />
            )}
            {t('Export Excel')}
          </Button>
        </div>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <StatCard
            title={t('Total Users')}
            value={formatNumber(data?.total_users)}
            icon={Users}
          />
          <StatCard
            title={t('Active Today')}
            value={formatNumber(data?.active_today)}
            icon={UserCheck}
          />
          <StatCard
            title={t('Active Users')}
            value={formatNumber(data?.active_period)}
            icon={Activity}
            description={periodLabel}
          />
          <StatCard
            title={`${periodLabel} ${t('Total Consumption')}`}
            value={formatCurrency(data?.total_consumption)}
            icon={DollarSign}
          />
        </div>

        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as AnalyticsPeriod)}
          className='mt-6'
        >
          <TabsList>
            {PERIODS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {t(item.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card className='mt-4 overflow-hidden'>
          {isLoading ? (
            <div className='flex items-center justify-center py-16'>
              <Loader2 className='text-muted-foreground size-6 animate-spin' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='w-16'>{t('Rank')}</TableHead>
                  <TableHead>{t('Display Name')}</TableHead>
                  <TableHead>{t('Role')}</TableHead>
                  <TableHead className='text-right'>
                    {t('Consumption ($)')}
                  </TableHead>
                  <TableHead className='text-right'>{t('Requests')}</TableHead>
                  <TableHead className='text-right'>{t('Tokens')}</TableHead>
                  <TableHead className='min-w-[220px]'>
                    {t('Model Usage')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.length > 0 ? (
                  rankings.map((row, index) => (
                    <TableRow key={`${row.username ?? 'user'}-${index}`}>
                      <TableCell>
                        <Badge
                          variant={index < 3 ? 'default' : 'secondary'}
                          className='min-w-7 justify-center'
                        >
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className='font-medium'>
                        <div className='flex flex-col gap-0.5'>
                          <span>{row.display_name || row.username || '-'}</span>
                          {row.remark ? (
                            <span className='text-muted-foreground text-xs font-normal'>
                              {row.remark}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {t(getRoleLabelKey(row.role))}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        {formatCurrency(row.consumption)}
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        {formatNumber(row.request_count)}
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        {formatNumber(row.token_count)}
                      </TableCell>
                      <TableCell className='align-top'>
                        <ModelUsageCell models={row.models} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className='text-muted-foreground h-32 text-center'
                    >
                      {t('No data')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
