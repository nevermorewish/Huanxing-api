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
export type DetailLog = {
  id: number
  model: string
  user_id: number
  username: string
  data: string
  created_at: number
  result_str: string
  log_id: number
  token_key: string
  token_name: string
  request_id?: string
  upstream_request_id?: string
  response_content_type?: string
}

export type DetailLogsPage = {
  page: number
  page_size: number
  total: number
  items: DetailLog[]
}

export type DetailLogsResponse = {
  success: boolean
  message: string
  data?: DetailLogsPage
}

export type DetailLogsParams = {
  p?: number
  page_size?: number
  username?: string
  model_name?: string
  token_name?: string
  request_id?: string
  log_id?: number
  start_timestamp?: number
  end_timestamp?: number
}
