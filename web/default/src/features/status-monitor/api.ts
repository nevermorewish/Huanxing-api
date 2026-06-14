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

export type StatusCheckPoint = {
  status?: string
  latency_ms?: number
  ping_latency_ms?: number
  checked_at?: string
  message?: string
}

export type StatusStatistics = {
  successRate?: number
  operationalCount?: number
  totalChecks?: number
}

export type StatusProvider = {
  id: string
  name: string
  type: string
  model: string
  latest?: StatusCheckPoint
  statistics?: StatusStatistics
  timeline?: StatusCheckPoint[]
}

export type StatusMonitorData = {
  providers: StatusProvider[]
  summary: { total: number; operational: number }
  metadata: { generatedAt: string }
}

export async function getStatusMonitor() {
  const res = await api.get<{
    success: boolean
    message?: string
    data?: StatusMonitorData
  }>('/api/status_monitor')
  return res.data
}
