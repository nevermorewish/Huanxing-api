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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import i18next from 'i18next'
import { toast } from 'sonner'
import { updateSystemOption } from '../api'
import type { UpdateOptionRequest } from '../types'

// Configuration keys that require status refresh
const STATUS_RELATED_KEYS = [
  'theme.frontend',
  'HeaderNavModules',
  'SidebarModulesAdmin',
  'Notice',
  'LogConsumeEnabled',
  'QuotaPerUnit',
  'USDExchangeRate',
  'DisplayInCurrencyEnabled',
  'DisplayTokenStatEnabled',
  'general_setting.quota_display_type',
  'general_setting.custom_currency_symbol',
  'general_setting.custom_currency_exchange_rate',
  'OpenClawBrandName',
  'OpenClawWindowsUrl',
  'OpenClawMacArmUrl',
  'OpenClawMacIntelUrl',
  'HermesBrandName',
  'HermesWindowsUrl',
  'HermesMacArmUrl',
  'HermesMacIntelUrl',
]

const STATUS_FIELD_MAP: Record<string, string> = {
  OpenClawBrandName: 'openclaw_brand_name',
  OpenClawWindowsUrl: 'openclaw_windows_url',
  OpenClawMacArmUrl: 'openclaw_mac_arm_url',
  OpenClawMacIntelUrl: 'openclaw_mac_intel_url',
  HermesBrandName: 'hermes_brand_name',
  HermesWindowsUrl: 'hermes_windows_url',
  HermesMacArmUrl: 'hermes_mac_arm_url',
  HermesMacIntelUrl: 'hermes_mac_intel_url',
}

const STATUS_SERVER_DERIVED_KEYS = new Set([
  'OpenClawWindowsUrl',
  'OpenClawMacArmUrl',
  'OpenClawMacIntelUrl',
  'HermesWindowsUrl',
  'HermesMacArmUrl',
  'HermesMacIntelUrl',
])

function updateCachedStatusOption(
  key: string,
  value: string | boolean | number
) {
  const statusField = STATUS_FIELD_MAP[key]
  if (!statusField || typeof window === 'undefined') return

  try {
    const raw = window.localStorage.getItem('status')
    if (!raw) return

    const status = JSON.parse(raw) as Record<string, unknown>
    status[statusField] = value
    window.localStorage.setItem('status', JSON.stringify(status))
  } catch {
    window.localStorage.removeItem('status')
  }
}

export function useUpdateOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateOptionRequest) => updateSystemOption(request),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Always refresh system-options
        queryClient.invalidateQueries({ queryKey: ['system-options'] })

        // If updating frontend-display-related config, also refresh status
        if (STATUS_RELATED_KEYS.includes(variables.key)) {
          const statusField = STATUS_FIELD_MAP[variables.key]
          if (statusField && !STATUS_SERVER_DERIVED_KEYS.has(variables.key)) {
            queryClient.setQueryData<Record<string, unknown> | null>(
              ['status'],
              (current) =>
                current
                  ? { ...current, [statusField]: variables.value }
                  : current
            )
            updateCachedStatusOption(variables.key, variables.value)
          }
          queryClient.invalidateQueries({ queryKey: ['status'] })
        }

        toast.success(i18next.t('Setting updated successfully'))
      } else {
        toast.error(data.message || i18next.t('Failed to update setting'))
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || i18next.t('Failed to update setting'))
    },
  })
}
