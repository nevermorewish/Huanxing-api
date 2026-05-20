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
import i18next from 'i18next'
import { DEFAULT_SYSTEM_NAME, DEFAULT_SYSTEM_NAME_EN } from '@/lib/constants'

type BrandingSource = {
  system_name?: unknown
  system_name_en?: unknown
}

function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function isEnglishLanguage(language?: string): boolean {
  return (language || i18next.resolvedLanguage || i18next.language || '')
    .toLowerCase()
    .startsWith('en')
}

export function getLocalizedSystemName(
  source: BrandingSource | undefined,
  language?: string
): string {
  const zhName = normalizeName(source?.system_name) || DEFAULT_SYSTEM_NAME
  const enName = normalizeName(source?.system_name_en) || DEFAULT_SYSTEM_NAME_EN
  return isEnglishLanguage(language) ? enName : zhName
}
