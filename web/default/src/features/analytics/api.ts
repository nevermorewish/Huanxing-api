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

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'all'

export type AnalyticsRanking = {
  username?: string
  email?: string
  role?: number
  consumption?: number
  request_count?: number
  token_count?: number
}

export type AnalyticsData = {
  total_users?: number
  active_today?: number
  active_period?: number
  total_consumption?: number
  rankings?: AnalyticsRanking[]
}

export async function getUserAnalytics(period: AnalyticsPeriod) {
  const res = await api.get<{
    success: boolean
    message?: string
    data?: AnalyticsData
  }>('/api/admin/user-analytics', { params: { period } })
  return res.data
}
