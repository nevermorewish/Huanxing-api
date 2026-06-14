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
import { api } from '@/lib/api'

export type ChannelTypeMonitor = {
  id: number
  channel_type: number
  channel_type_name: string
  group_name: string
  api_url: string
  has_api_key: boolean
  test_model: string
  enabled: boolean
  interval_seconds: number
  last_status: string
  last_message: string
  last_latency_ms: number | null
  last_checked_at: number | null
  created_at: number
  updated_at: number
}

export type ChannelTypeMonitorHistory = {
  id: number
  monitor_id: number
  channel_id: number
  channel_name: string
  model: string
  status: string
  latency_ms: number | null
  message: string
  checked_at: number
}

export type ChannelTypeMonitorPayload = {
  channel_type: number
  group_name: string
  api_url: string
  api_key?: string
  test_model: string
  enabled: boolean
  interval_seconds: number
}

export type ChannelTypeMonitorListResponse = {
  success: boolean
  message?: string
  data?: {
    items: ChannelTypeMonitor[]
    total: number
    page: number
    page_size: number
  }
}

export async function listChannelTypeMonitors(params: {
  p?: number
  page_size?: number
  search?: string
  channel_type?: number
  enabled?: boolean
}) {
  const res = await api.get<ChannelTypeMonitorListResponse>(
    '/api/admin/channel-type-monitors',
    { params }
  )
  return res.data
}

export async function createChannelTypeMonitor(
  payload: ChannelTypeMonitorPayload
) {
  const res = await api.post<{
    success: boolean
    message?: string
    data?: ChannelTypeMonitor
  }>('/api/admin/channel-type-monitors', payload)
  return res.data
}

export async function updateChannelTypeMonitor(
  id: number,
  payload: ChannelTypeMonitorPayload
) {
  const res = await api.put<{
    success: boolean
    message?: string
    data?: ChannelTypeMonitor
  }>(`/api/admin/channel-type-monitors/${id}`, payload)
  return res.data
}

export async function deleteChannelTypeMonitor(id: number) {
  const res = await api.delete<{ success: boolean; message?: string }>(
    `/api/admin/channel-type-monitors/${id}`
  )
  return res.data
}

export async function runChannelTypeMonitor(id: number) {
  const res = await api.post<{
    success: boolean
    message?: string
    data?: {
      monitor: ChannelTypeMonitor
      result: ChannelTypeMonitorHistory
    }
  }>(`/api/admin/channel-type-monitors/${id}/run`)
  return res.data
}

export async function listChannelTypeMonitorHistory(id: number, limit = 20) {
  const res = await api.get<{
    success: boolean
    message?: string
    data?: { items: ChannelTypeMonitorHistory[] }
  }>(`/api/admin/channel-type-monitors/${id}/history`, {
    params: { limit },
  })
  return res.data
}
