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
import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { StatusBadge } from '@/components/status-badge'
import type { RatioType } from '../types'
import {
  getOrderedRatioTypes,
  getPreferredSyncField,
  getSyncFieldLabel,
  isSelectableUpstreamValue,
  type ModelRow,
  type ResolutionsMap,
} from './upstream-ratio-sync-helpers'

function getSelectedSyncValue(
  row: ModelRow,
  ratioType: RatioType,
  upstreamName: string,
  resolutions: ResolutionsMap
): number | string | undefined {
  const preferredField = getPreferredSyncField(
    row.ratioTypes,
    ratioType,
    upstreamName
  )
  const selectedType = preferredField === ratioType ? ratioType : preferredField
  return resolutions[row.model]?.[selectedType]
}

function getSelectableSyncValue(
  row: ModelRow,
  ratioType: RatioType,
  upstreamName: string
): number | string | undefined {
  const preferredField = getPreferredSyncField(
    row.ratioTypes,
    ratioType,
    upstreamName
  )
  const upstreamVal =
    preferredField === ratioType
      ? row.ratioTypes[ratioType]?.upstreams?.[upstreamName]
      : row.ratioTypes[preferredField]?.upstreams?.[upstreamName]

  return isSelectableUpstreamValue(upstreamVal)
    ? (upstreamVal as number | string)
    : undefined
}

function getSelectableSyncField(
  row: ModelRow,
  ratioType: RatioType,
  upstreamName: string
): RatioType {
  return getPreferredSyncField(row.ratioTypes, ratioType, upstreamName)
}

export function useUpstreamRatioSyncColumns(
  upstreamNames: string[],
  resolutions: ResolutionsMap,
  ratioTypeFilter: string,
  isDisabled: boolean,
  onSelectValue: (
    model: string,
    ratioType: RatioType,
    value: number | string,
    sourceName: string
  ) => void,
  onUnselectValue: (model: string, ratioType: RatioType) => void,
  onBulkSelect: (upstreamName: string, rows: ModelRow[]) => void,
  onBulkUnselect: (upstreamName: string, rows: ModelRow[]) => void
): ColumnDef<ModelRow>[] {
  const { t } = useTranslation()

  return useMemo<ColumnDef<ModelRow>[]>(() => {
    const baseColumns: ColumnDef<ModelRow>[] = [
      {
        accessorKey: 'model',
        header: t('Model'),
        cell: ({ row }) => {
          const model = row.original.model
          return (
            <div className='flex min-w-[180px] items-center gap-2'>
              <span className='font-medium'>{model}</span>
              {row.original.billingConflict && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className='h-3.5 w-3.5 shrink-0 text-amber-500' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {t(
                          'This model has both fixed price and ratio billing conflicts'
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )
        },
      },
      {
        id: 'current',
        header: t('Current Price'),
        cell: ({ row }) => {
          const fields = getOrderedRatioTypes(
            row.original.ratioTypes,
            ratioTypeFilter
          )
          return (
            <div className='flex min-w-[260px] flex-col gap-2'>
              {fields.map((ratioType) => {
                const current = row.original.ratioTypes[ratioType]?.current
                return (
                  <div
                    key={ratioType}
                    className='flex min-w-0 flex-wrap items-center gap-2'
                  >
                    <StatusBadge
                      label={getSyncFieldLabel(ratioType, t)}
                      autoColor={ratioType}
                      size='sm'
                      copyable={false}
                    />
                    {current === null || current === undefined ? (
                      <StatusBadge
                        label={t('Not Set')}
                        variant='neutral'
                        size='sm'
                        copyable={false}
                      />
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <StatusBadge
                                label={String(current)}
                                variant='info'
                                size='sm'
                                className='max-w-[200px] truncate'
                              />
                            }
                          ></TooltipTrigger>
                          <TooltipContent>
                            <p className='max-w-xs text-xs break-all'>
                              {String(current)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )
              })}
            </div>
          )
        },
      },
    ]

    const upstreamColumns: ColumnDef<ModelRow>[] = upstreamNames.map(
      (upstreamName) => ({
        id: `upstream_${upstreamName}`,
        header: ({ table }) => {
          const rows = table.getFilteredRowModel().rows.map((r) => r.original)

          let selectableCount = 0
          let selectedCount = 0

          rows.forEach((row) => {
            getOrderedRatioTypes(row.ratioTypes, ratioTypeFilter).forEach(
              (ratioType) => {
                const selectableVal = getSelectableSyncValue(
                  row,
                  ratioType,
                  upstreamName
                )
                if (selectableVal !== undefined) {
                  selectableCount++
                  if (
                    getSelectedSyncValue(
                      row,
                      ratioType,
                      upstreamName,
                      resolutions
                    ) === selectableVal
                  ) {
                    selectedCount++
                  }
                }
              }
            )
          })

          const allSelected =
            selectableCount > 0 && selectedCount === selectableCount
          const someSelected =
            selectedCount > 0 && selectedCount < selectableCount
          return (
            <div className='flex items-center gap-2'>
              {selectableCount > 0 && (
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  disabled={isDisabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onBulkSelect(upstreamName, rows)
                    } else {
                      onBulkUnselect(upstreamName, rows)
                    }
                  }}
                />
              )}
              <span className='font-medium'>{upstreamName}</span>
            </div>
          )
        },
        cell: ({ row }) => {
          const fields = getOrderedRatioTypes(
            row.original.ratioTypes,
            ratioTypeFilter
          )

          return (
            <div className='flex min-w-[280px] flex-col gap-2'>
              {fields.map((ratioType) => {
                const diff = row.original.ratioTypes[ratioType]
                const upstreamVal = diff?.upstreams?.[upstreamName]
                const isConfident = diff?.confidence?.[upstreamName] !== false
                const selectableVal = getSelectableSyncValue(
                  row.original,
                  ratioType,
                  upstreamName
                )

                return (
                  <div
                    key={ratioType}
                    className='flex min-w-0 items-start gap-2'
                  >
                    <StatusBadge
                      label={getSyncFieldLabel(ratioType, t)}
                      autoColor={ratioType}
                      size='sm'
                      copyable={false}
                      className='shrink-0'
                    />
                    <div className='min-w-0 flex-1'>
                      {renderUpstreamValue({
                        upstreamVal,
                        isConfident,
                        isSelected:
                          selectableVal !== undefined &&
                          getSelectedSyncValue(
                            row.original,
                            ratioType,
                            upstreamName,
                            resolutions
                          ) === selectableVal,
                        isDisabled,
                        t,
                        onSelect:
                          selectableVal === undefined
                            ? undefined
                            : () =>
                                onSelectValue(
                                  row.original.model,
                                  ratioType,
                                  upstreamVal as number | string,
                                  upstreamName
                                ),
                        onUnselect: () =>
                          onUnselectValue(
                            row.original.model,
                            getSelectableSyncField(
                              row.original,
                              ratioType,
                              upstreamName
                            )
                          ),
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        },
      })
    )

    return [...baseColumns, ...upstreamColumns]
  }, [
    upstreamNames,
    resolutions,
    ratioTypeFilter,
    isDisabled,
    onSelectValue,
    onUnselectValue,
    onBulkSelect,
    onBulkUnselect,
    t,
  ])
}

type RenderUpstreamValueArgs = {
  upstreamVal: number | string | 'same' | null | undefined
  isConfident: boolean
  isSelected: boolean
  isDisabled: boolean
  t: (key: string) => string
  onSelect?: () => void
  onUnselect: () => void
}

function renderUpstreamValue(args: RenderUpstreamValueArgs) {
  const { upstreamVal, isConfident, isSelected, isDisabled, t } = args

  if (upstreamVal === null || upstreamVal === undefined) {
    return (
      <StatusBadge
        label={t('Not Set')}
        variant='neutral'
        size='sm'
        copyable={false}
      />
    )
  }

  if (upstreamVal === 'same') {
    return (
      <StatusBadge
        label={t('Same as Local')}
        variant='info'
        size='sm'
        copyable={false}
      />
    )
  }

  const text = String(upstreamVal)
  const isSelectable = args.onSelect !== undefined

  return (
    <div className='flex min-w-0 items-center gap-2'>
      {isSelectable && (
        <Checkbox
          checked={isSelected}
          disabled={isDisabled}
          onCheckedChange={(checked) => {
            if (checked) {
              args.onSelect?.()
            } else {
              args.onUnselect()
            }
          }}
        />
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <span className='inline-block max-w-[240px] cursor-default truncate font-mono text-sm' />
            }
          >
            {text}
          </TooltipTrigger>
          <TooltipContent>
            <p className='max-w-xs text-xs break-all'>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {!isConfident && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className='h-3.5 w-3.5 shrink-0 text-amber-500' />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('This data may be unreliable, use with caution')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
