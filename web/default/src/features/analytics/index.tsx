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
import { Activity, DollarSign, Loader2, UserCheck, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getRoleLabelKey } from '@/lib/roles'
import { Badge } from '@/components/ui/badge'
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
import { getUserAnalytics, type AnalyticsPeriod } from './api'

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
  const { t } = useTranslation()
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d')

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
        {isFetching && !isLoading ? (
          <Loader2 className='text-muted-foreground size-4 animate-spin' />
        ) : null}
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
                  <TableHead>{t('Username')}</TableHead>
                  <TableHead>{t('Email')}</TableHead>
                  <TableHead>{t('Role')}</TableHead>
                  <TableHead className='text-right'>
                    {t('Consumption ($)')}
                  </TableHead>
                  <TableHead className='text-right'>{t('Requests')}</TableHead>
                  <TableHead className='text-right'>{t('Tokens')}</TableHead>
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
                        {row.username || '-'}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {row.email || '-'}
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
