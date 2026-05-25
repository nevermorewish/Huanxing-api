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
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Eye, RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatTimestampToDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionPageLayout } from '@/components/layout'
import { getDetailLogs } from './api'
import type { DetailLog, DetailLogsParams } from './types'

const route = getRouteApi('/_authenticated/detail-logs/')

const DEFAULT_PAGE_SIZE = 20

function secondsFromMilliseconds(value?: number) {
  if (!value) return undefined
  return Math.floor(value / 1000)
}

function preview(value: string, max = 160) {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= max) return compact
  return `${compact.slice(0, max)}...`
}

function maskToken(value: string) {
  if (!value) return ''
  if (value.length <= 10) return '******'
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function CodeBlock({ value }: { value: string }) {
  return (
    <ScrollArea className='h-[58dvh] rounded-md border bg-muted/20'>
      <pre className='whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed'>
        {value || '-'}
      </pre>
    </ScrollArea>
  )
}

function DetailDialog({
  log,
  open,
  onOpenChange,
}: {
  log: DetailLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90dvh] max-w-5xl overflow-hidden'>
        <DialogHeader>
          <DialogTitle>{t('Detailed Log')}</DialogTitle>
          <DialogDescription>
            {log
              ? t('Log #{{id}} · {{user}} · {{model}}', {
                  id: log.id,
                  user: log.username || `#${log.user_id}`,
                  model: log.model || '-',
                })
              : ''}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue='request'>
          <TabsList>
            <TabsTrigger value='request'>{t('Request')}</TabsTrigger>
            <TabsTrigger value='response'>{t('Response')}</TabsTrigger>
          </TabsList>
          <TabsContent value='request'>
            <CodeBlock value={log?.data ?? ''} />
          </TabsContent>
          <TabsContent value='response'>
            <CodeBlock value={log?.result_str ?? ''} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function DetailLogs() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [selectedLog, setSelectedLog] = useState<DetailLog | null>(null)
  const [draft, setDraft] = useState({
    username: search.username ?? '',
    model: search.model ?? '',
    token: search.token ?? '',
    requestId: search.requestId ?? '',
    logId: search.logId ? String(search.logId) : '',
  })

  const page = search.page ?? 1
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE

  const params = useMemo<DetailLogsParams>(
    () => ({
      p: page,
      page_size: pageSize,
      username: search.username,
      model_name: search.model,
      token_name: search.token,
      request_id: search.requestId,
      log_id: search.logId,
      start_timestamp: secondsFromMilliseconds(search.startTime),
      end_timestamp: secondsFromMilliseconds(search.endTime),
    }),
    [page, pageSize, search]
  )

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['detail-logs', params],
    queryFn: async () => {
      const result = await getDetailLogs(params)
      if (!result.success) {
        toast.error(result.message || t('Failed to load detailed logs'))
        return { page, page_size: pageSize, total: 0, items: [] }
      }
      return (
        result.data ?? {
          page,
          page_size: pageSize,
          total: 0,
          items: [],
        }
      )
    },
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const loading = isLoading || (isFetching && !data)

  const applyFilters = () => {
    void navigate({
      search: () => ({
        ...search,
        page: 1,
        username: draft.username || undefined,
        model: draft.model || undefined,
        token: draft.token || undefined,
        requestId: draft.requestId || undefined,
        logId: draft.logId ? Number(draft.logId) || undefined : undefined,
      }),
    })
  }

  const clearFilters = () => {
    setDraft({
      username: '',
      model: '',
      token: '',
      requestId: '',
      logId: '',
    })
    void navigate({
      search: () => ({
        page: 1,
        pageSize,
      }),
    })
  }

  const goToPage = (nextPage: number) => {
    void navigate({
      search: () => ({
        ...search,
        page: Math.min(Math.max(nextPage, 1), totalPages),
      }),
    })
  }

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Detailed Logs')}</SectionPageLayout.Title>
        <SectionPageLayout.Description>
          {t('View stored request payloads and upstream responses.')}
        </SectionPageLayout.Description>
        <SectionPageLayout.Content>
          <div className='space-y-4'>
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-6'>
              <Input
                value={draft.username}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                placeholder={t('Username')}
              />
              <Input
                value={draft.model}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    model: event.target.value,
                  }))
                }
                placeholder={t('Model')}
              />
              <Input
                value={draft.token}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    token: event.target.value,
                  }))
                }
                placeholder={t('Token name')}
              />
              <Input
                value={draft.requestId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    requestId: event.target.value,
                  }))
                }
                placeholder={t('Request ID')}
              />
              <Input
                value={draft.logId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    logId: event.target.value,
                  }))
                }
                placeholder={t('Log ID')}
                inputMode='numeric'
              />
              <div className='flex gap-2'>
                <Button type='button' onClick={applyFilters}>
                  {t('Filter')}
                </Button>
                <Button type='button' variant='outline' onClick={clearFilters}>
                  {t('Reset')}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  onClick={() => void refetch()}
                  aria-label={t('Refresh')}
                >
                  <RotateCw className='size-4' />
                </Button>
              </div>
            </div>

            <div className='overflow-hidden rounded-md border'>
              <div className='max-h-[calc(100dvh-16rem)] overflow-auto'>
                <Table>
                  <TableHeader className='bg-muted/30 sticky top-0 z-10'>
                    <TableRow>
                      <TableHead>{t('Time')}</TableHead>
                      <TableHead>{t('User')}</TableHead>
                      <TableHead>{t('Model')}</TableHead>
                      <TableHead>{t('Token')}</TableHead>
                      <TableHead>{t('Log ID')}</TableHead>
                      <TableHead>{t('Request ID')}</TableHead>
                      <TableHead>{t('Request')}</TableHead>
                      <TableHead>{t('Response')}</TableHead>
                      <TableHead className='text-right'>
                        {t('Actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className='h-28 text-center'>
                          {t('Loading detailed logs...')}
                        </TableCell>
                      </TableRow>
                    ) : items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className='h-28 text-center'>
                          {t('No detailed logs found')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className='whitespace-nowrap'>
                            {formatTimestampToDate(item.created_at)}
                          </TableCell>
                          <TableCell>
                            {item.username || `#${item.user_id}`}
                          </TableCell>
                          <TableCell className='max-w-[12rem] truncate'>
                            {item.model || '-'}
                          </TableCell>
                          <TableCell className='max-w-[12rem] truncate'>
                            {item.token_name || maskToken(item.token_key) || '-'}
                          </TableCell>
                          <TableCell>{item.log_id || '-'}</TableCell>
                          <TableCell className='max-w-[12rem] truncate'>
                            {item.request_id || '-'}
                          </TableCell>
                          <TableCell className='max-w-[18rem] text-xs text-muted-foreground'>
                            {preview(item.data)}
                          </TableCell>
                          <TableCell className='max-w-[18rem] text-xs text-muted-foreground'>
                            {preview(item.result_str)}
                          </TableCell>
                          <TableCell className='text-right'>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => setSelectedLog(item)}
                            >
                              <Eye className='me-2 size-4' />
                              {t('View')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className='flex items-center justify-between gap-3'>
              <div className='text-muted-foreground text-sm'>
                {t('{{total}} records', { total })}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  {t('Previous')}
                </Button>
                <span className='text-muted-foreground text-sm'>
                  {t('Page {{page}} of {{totalPages}}', {
                    page,
                    totalPages,
                  })}
                </span>
                <Button
                  type='button'
                  variant='outline'
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  {t('Next')}
                </Button>
              </div>
            </div>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>
      <DetailDialog
        log={selectedLog}
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null)
        }}
      />
    </>
  )
}
