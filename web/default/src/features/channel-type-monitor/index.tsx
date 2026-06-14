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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  History,
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SectionPageLayout } from '@/components/layout'
import { CHANNEL_TYPE_OPTIONS } from '@/features/channels/constants'
import {
  createChannelTypeMonitor,
  deleteChannelTypeMonitor,
  listChannelTypeMonitorHistory,
  listChannelTypeMonitors,
  runChannelTypeMonitor,
  updateChannelTypeMonitor,
  type ChannelTypeMonitor,
  type ChannelTypeMonitorPayload,
} from './api'

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  operational: 'default',
  degraded: 'secondary',
  failed: 'destructive',
  error: 'destructive',
}

const formatTime = (value?: number | null) => {
  if (!value) return '-'
  return new Date(value * 1000).toLocaleString()
}

const formatLatency = (value?: number | null) =>
  value && value > 0 ? `${value} ms` : '-'

const defaultPayload: ChannelTypeMonitorPayload = {
  channel_type: 1,
  group_name: '',
  api_url: '',
  api_key: '',
  test_model: '',
  enabled: true,
  interval_seconds: 600,
}

const statusLabelKey = (status?: string) => {
  switch (status) {
    case 'operational':
      return 'Operational'
    case 'degraded':
      return 'Degraded'
    case 'failed':
      return 'Failed'
    case 'error':
      return 'Error'
    default:
      return 'Pending check'
  }
}

export function ChannelTypeMonitorPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ChannelTypeMonitor | null>(null)
  const [payload, setPayload] =
    useState<ChannelTypeMonitorPayload>(defaultPayload)
  const [historyTarget, setHistoryTarget] = useState<ChannelTypeMonitor | null>(
    null
  )

  const monitorsQuery = useQuery({
    queryKey: ['channel-type-monitors'],
    queryFn: () => listChannelTypeMonitors({ p: 1, page_size: 100 }),
  })

  const historyQuery = useQuery({
    queryKey: ['channel-type-monitor-history', historyTarget?.id],
    queryFn: () => listChannelTypeMonitorHistory(historyTarget!.id, 30),
    enabled: Boolean(historyTarget),
  })

  const monitors = monitorsQuery.data?.data?.items ?? []
  const usedTypes = useMemo(
    () => new Set(monitors.map((item) => item.channel_type)),
    [monitors]
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const normalized = {
        ...payload,
        group_name: payload.group_name.trim(),
        api_url: payload.api_url.trim().replace(/\/+$/, ''),
        api_key: payload.api_key?.trim(),
        test_model: payload.test_model.trim(),
        interval_seconds: Number(payload.interval_seconds),
      }
      if (!normalized.api_key) {
        delete normalized.api_key
      }
      return editing
        ? updateChannelTypeMonitor(editing.id, normalized)
        : createChannelTypeMonitor(normalized)
    },
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || t('Failed to save monitor'))
        return
      }
      if (res.data) {
        queryClient.setQueryData(
          ['channel-type-monitors'],
          (
            current:
              | Awaited<ReturnType<typeof listChannelTypeMonitors>>
              | undefined
          ) => {
            if (!current?.data) return current
            const exists = current.data.items.some(
              (item) => item.id === res.data!.id
            )
            return {
              ...current,
              data: {
                ...current.data,
                items: exists
                  ? current.data.items.map((item) =>
                      item.id === res.data!.id ? res.data! : item
                    )
                  : [res.data, ...current.data.items],
                total: exists ? current.data.total : current.data.total + 1,
              },
            }
          }
        )
      }
      toast.success(t('Monitor saved'))
      setFormOpen(false)
      void queryClient.invalidateQueries({
        queryKey: ['channel-type-monitors'],
      })
      void queryClient.invalidateQueries({ queryKey: ['status-monitor'] })
    },
  })

  const toggleEnabledMutation = useMutation({
    mutationFn: (monitor: ChannelTypeMonitor) => {
      const payload: ChannelTypeMonitorPayload = {
        channel_type: monitor.channel_type,
        group_name: monitor.group_name,
        api_url: monitor.api_url,
        test_model: monitor.test_model,
        enabled: !monitor.enabled,
        interval_seconds: monitor.interval_seconds,
      }
      return updateChannelTypeMonitor(monitor.id, payload)
    },
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || t('Failed to update monitor status'))
        return
      }
      void queryClient.invalidateQueries({
        queryKey: ['channel-type-monitors'],
      })
      void queryClient.invalidateQueries({ queryKey: ['status-monitor'] })
      toast.success(t('Monitor status updated'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteChannelTypeMonitor,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || t('Failed to delete monitor'))
        return
      }
      toast.success(t('Monitor deleted'))
      void queryClient.invalidateQueries({
        queryKey: ['channel-type-monitors'],
      })
      void queryClient.invalidateQueries({ queryKey: ['status-monitor'] })
    },
  })

  const runMutation = useMutation({
    mutationFn: runChannelTypeMonitor,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || t('Monitor check failed'))
        return
      }
      const status = res.data?.result?.status
      toast.success(
        status === 'operational'
          ? t('Monitor check passed')
          : t('Monitor check completed')
      )
      void queryClient.invalidateQueries({
        queryKey: ['channel-type-monitors'],
      })
      void queryClient.invalidateQueries({ queryKey: ['status-monitor'] })
      if (historyTarget) {
        void queryClient.invalidateQueries({
          queryKey: ['channel-type-monitor-history', historyTarget.id],
        })
      }
    },
  })

  const prepareCreate = () => {
    const firstAvailable =
      CHANNEL_TYPE_OPTIONS.find((option) => !usedTypes.has(option.value))
        ?.value ?? 1
    setEditing(null)
    setPayload({
      ...defaultPayload,
      channel_type: firstAvailable,
      api_key: '',
      interval_seconds: defaultPayload.interval_seconds,
    })
  }

  const openCreate = () => {
    prepareCreate()
    setFormOpen(true)
  }

  const openEdit = (monitor: ChannelTypeMonitor) => {
    setEditing(monitor)
    setPayload({
      channel_type: monitor.channel_type,
      group_name: monitor.group_name,
      api_url: monitor.api_url,
      api_key: '',
      test_model: monitor.test_model,
      enabled: monitor.enabled,
      interval_seconds: monitor.interval_seconds,
    })
    setFormOpen(true)
  }

  const submitDisabled =
    saveMutation.isPending ||
    !payload.channel_type ||
    Number(payload.interval_seconds) < 60

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>
          <span className='inline-flex items-center gap-2'>
            <Activity className='text-primary h-5 w-5' />
            {t('Channel Monitor')}
          </span>
        </SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => monitorsQuery.refetch()}
              disabled={monitorsQuery.isFetching}
            >
              {monitorsQuery.isFetching ? (
                <Loader2 data-icon='inline-start' className='animate-spin' />
              ) : (
                <RefreshCw data-icon='inline-start' />
              )}
              {t('Refresh')}
            </Button>
            <Button size='sm' onClick={openCreate}>
              <Plus data-icon='inline-start' />
              {t('New Monitor')}
            </Button>
          </div>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <Card className='overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Channel Type')}</TableHead>
                  <TableHead>{t('Group Name')}</TableHead>
                  <TableHead>API URL</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>{t('Test Model')}</TableHead>
                  <TableHead>{t('Interval')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead>{t('Last Check')}</TableHead>
                  <TableHead>{t('Latency')}</TableHead>
                  <TableHead className='w-[220px]'>{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitorsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className='h-24 text-center'>
                      <Loader2 className='text-muted-foreground mx-auto h-5 w-5 animate-spin' />
                    </TableCell>
                  </TableRow>
                ) : monitors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className='text-muted-foreground h-24 text-center'
                    >
                      {t('No monitoring data')}
                    </TableCell>
                  </TableRow>
                ) : (
                  monitors.map((monitor) => (
                    <TableRow key={monitor.id}>
                      <TableCell className='font-medium'>
                        {t(monitor.channel_type_name)}
                      </TableCell>
                      <TableCell>{monitor.group_name}</TableCell>
                      <TableCell className='max-w-[220px] truncate'>
                        {monitor.api_url || t('Use channel default')}
                      </TableCell>
                      <TableCell>
                        {monitor.has_api_key
                          ? t('Configured')
                          : t('Use channel default')}
                      </TableCell>
                      <TableCell className='max-w-[180px] truncate'>
                        {monitor.test_model || t('Use channel default')}
                      </TableCell>
                      <TableCell>{monitor.interval_seconds}s</TableCell>
                      <TableCell>
                        <Switch
                          className='mr-2 align-middle'
                          size='sm'
                          checked={monitor.enabled}
                          onCheckedChange={() =>
                            toggleEnabledMutation.mutate(monitor)
                          }
                          disabled={toggleEnabledMutation.isPending}
                        />
                        <Badge
                          variant={
                            monitor.enabled
                              ? statusVariant[monitor.last_status] || 'outline'
                              : 'outline'
                          }
                        >
                          {monitor.enabled
                            ? t(statusLabelKey(monitor.last_status))
                            : t('Disabled')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatTime(monitor.last_checked_at)}
                      </TableCell>
                      <TableCell>
                        {formatLatency(monitor.last_latency_ms)}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-2'>
                          <Button
                            size='icon-sm'
                            variant='outline'
                            title={t('Run check now')}
                            onClick={() => runMutation.mutate(monitor.id)}
                            disabled={runMutation.isPending}
                          >
                            <Play />
                          </Button>
                          <Button
                            size='icon-sm'
                            variant='outline'
                            title={t('History')}
                            onClick={() => setHistoryTarget(monitor)}
                          >
                            <History />
                          </Button>
                          <Button
                            size='icon-sm'
                            variant='outline'
                            title={t('Edit')}
                            onClick={() => openEdit(monitor)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size='icon-sm'
                            variant='outline'
                            title={t('Delete')}
                            onClick={() => deleteMutation.mutate(monitor.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>
              {editing ? t('Edit Monitor') : t('New Monitor')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Select a channel type and optionally override the API URL, API key, and test model.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <Label>{t('Channel Type')}</Label>
              <Select
                value={String(payload.channel_type)}
                onValueChange={(value) =>
                  setPayload((current) => ({
                    ...current,
                    channel_type: Number(value),
                  }))
                }
                disabled={Boolean(editing)}
                items={CHANNEL_TYPE_OPTIONS.map((option) => ({
                  value: String(option.value),
                  label: t(option.label),
                }))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue>
                    {t(
                      CHANNEL_TYPE_OPTIONS.find(
                        (option) => option.value === payload.channel_type
                      )?.label ?? 'Unknown'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {CHANNEL_TYPE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                        disabled={!editing && usedTypes.has(option.value)}
                      >
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-2'>
              <Label>API URL</Label>
              <Input
                value={payload.api_url}
                placeholder={t(
                  'Leave empty to use the default channel URL for this channel type'
                )}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    api_url: event.target.value,
                  }))
                }
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label>API Key</Label>
              <Input
                type='password'
                value={payload.api_key ?? ''}
                placeholder={
                  editing?.has_api_key
                    ? t('Configured; leave empty to keep the existing key')
                    : t(
                        'Leave empty to use the default channel key for this channel type'
                      )
                }
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    api_key: event.target.value,
                  }))
                }
              />
              <p className='text-muted-foreground text-xs'>
                {t(
                  'API keys are not returned in plain text after saving. Enter a new value while editing to replace the existing key, or leave it blank to keep it.'
                )}
              </p>
            </div>
            <div className='flex flex-col gap-2'>
              <Label>{t('Test Model Name')}</Label>
              <Input
                value={payload.test_model}
                placeholder={t(
                  'Leave empty to use the channel test model or the first model'
                )}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    test_model: event.target.value,
                  }))
                }
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label>{t('Group Name')}</Label>
              <Input
                value={payload.group_name}
                placeholder={t('Leave empty to use the channel type name')}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    group_name: event.target.value,
                  }))
                }
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label>{t('Interval (seconds)')}</Label>
              <Input
                type='number'
                min={60}
                step={30}
                value={payload.interval_seconds}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    interval_seconds: event.target.valueAsNumber || 60,
                  }))
                }
              />
              <p className='text-muted-foreground text-xs'>
                {t(
                  'Scheduled checks run for this monitor when it is enabled and this interval has elapsed.'
                )}
              </p>
            </div>
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div>
                <Label>{t('Enable')}</Label>
                <p className='text-muted-foreground text-xs'>
                  {t(
                    'Disabling keeps the configuration, excludes it from scheduled checks, and hides it from the status monitor page.'
                  )}
                </p>
              </div>
              <Switch
                checked={payload.enabled}
                onCheckedChange={(checked) =>
                  setPayload((current) => ({ ...current, enabled: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setFormOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              type='button'
              disabled={submitDisabled}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? t('Saving...') : t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(historyTarget)}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
      >
        <DialogContent className='sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{t('Monitor History')}</DialogTitle>
            <DialogDescription>{historyTarget?.group_name}</DialogDescription>
          </DialogHeader>
          <div className='max-h-[480px] overflow-auto rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Time')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead>{t('Channel')}</TableHead>
                  <TableHead>{t('Model')}</TableHead>
                  <TableHead>{t('Latency')}</TableHead>
                  <TableHead>{t('Message')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-20 text-center'>
                      <Loader2 className='text-muted-foreground mx-auto h-5 w-5 animate-spin' />
                    </TableCell>
                  </TableRow>
                ) : (historyQuery.data?.data?.items ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-muted-foreground h-20 text-center'
                    >
                      {t('No monitoring data')}
                    </TableCell>
                  </TableRow>
                ) : (
                  historyQuery.data?.data?.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatTime(item.checked_at)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[item.status] || 'outline'}
                        >
                          {t(statusLabelKey(item.status))}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.channel_name || '-'}</TableCell>
                      <TableCell className='font-mono text-xs'>
                        {item.model || '-'}
                      </TableCell>
                      <TableCell>{formatLatency(item.latency_ms)}</TableCell>
                      <TableCell className='max-w-[260px] truncate'>
                        {item.message}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
