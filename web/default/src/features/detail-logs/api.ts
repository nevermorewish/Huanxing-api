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
import type { DetailLogsParams, DetailLogsResponse } from './types'

function buildQueryParams(params: DetailLogsParams): URLSearchParams {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })
  return queryParams
}

export async function getDetailLogs(
  params: DetailLogsParams
): Promise<DetailLogsResponse> {
  const queryParams = buildQueryParams(params)
  const res = await api.get(`/api/detail-log/?${queryParams}`)
  return res.data
}
