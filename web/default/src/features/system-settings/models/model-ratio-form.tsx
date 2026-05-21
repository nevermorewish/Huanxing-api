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
import { memo, useCallback, useRef, useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Code2, Download, Eye, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ModelRatioVisualEditor } from './model-ratio-visual-editor'
import { formatJsonForTextarea } from './utils'

type ModelFormValues = {
  ModelPrice: string
  ModelRatio: string
  CacheRatio: string
  CreateCacheRatio: string
  CompletionRatio: string
  ImageRatio: string
  AudioRatio: string
  AudioCompletionRatio: string
  ExposeRatioEnabled: boolean
  BillingMode: string
  BillingExpr: string
}

type ModelRatioFormProps = {
  form: UseFormReturn<ModelFormValues>
  onSave: (values: ModelFormValues) => Promise<void>
  onReset: () => void
  isSaving: boolean
  isResetting: boolean
}

const MODEL_PRICING_FIELDS = [
  'ModelPrice',
  'ModelRatio',
  'CacheRatio',
  'CreateCacheRatio',
  'CompletionRatio',
  'ImageRatio',
  'AudioRatio',
  'AudioCompletionRatio',
  'BillingMode',
  'BillingExpr',
] as const satisfies ReadonlyArray<keyof ModelFormValues>

type ModelPricingField = (typeof MODEL_PRICING_FIELDS)[number]

type ModelPricingExport = {
  type: 'huanxing-model-pricing'
  version: 1
  exported_at: string
  data: Record<ModelPricingField, unknown>
}

function parseJsonValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return {}
  return JSON.parse(trimmed)
}

function stringifyImportedJsonValue(value: unknown): string {
  if (typeof value === 'string') {
    return formatJsonForTextarea(value)
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value, null, 2)
  }
  return JSON.stringify(value ?? {}, null, 2)
}

function getImportedPricingData(parsed: unknown): Partial<
  Record<ModelPricingField, unknown>
> {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid model pricing import file')
  }

  const record = parsed as Record<string, unknown>
  const nested = record.data ?? record.pricing ?? record.model_pricing
  const source =
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : record

  const result: Partial<Record<ModelPricingField, unknown>> = {}

  for (const field of MODEL_PRICING_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field]
      continue
    }

    if (
      field === 'BillingMode' &&
      Object.prototype.hasOwnProperty.call(source, 'billing_setting.billing_mode')
    ) {
      result[field] = source['billing_setting.billing_mode']
    }

    if (
      field === 'BillingExpr' &&
      Object.prototype.hasOwnProperty.call(source, 'billing_setting.billing_expr')
    ) {
      result[field] = source['billing_setting.billing_expr']
    }
  }

  if (Object.keys(result).length === 0) {
    throw new Error('Import file does not contain model pricing data')
  }

  return result
}

export const ModelRatioForm = memo(function ModelRatioForm({
  form,
  onSave,
  onReset,
  isSaving,
  isResetting,
}: ModelRatioFormProps) {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual')
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const handleFieldChange = useCallback(
    (field: keyof ModelFormValues, value: string) => {
      form.setValue(field, value, {
        shouldValidate: true,
        shouldDirty: true,
      })
    },
    [form]
  )

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => (prev === 'visual' ? 'json' : 'visual'))
  }, [])

  const handleExportModelPricing = useCallback(() => {
    try {
      const data = Object.fromEntries(
        MODEL_PRICING_FIELDS.map((field) => [
          field,
          parseJsonValue(form.getValues(field)),
        ])
      ) as Record<ModelPricingField, unknown>

      const payload: ModelPricingExport = {
        type: 'huanxing-model-pricing',
        version: 1,
        exported_at: new Date().toISOString(),
        data,
      }

      const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `model-pricing-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success(t('Model pricing exported successfully'))
    } catch (error) {
      toast.error(
        error instanceof Error
          ? t(error.message)
          : t('Failed to export model pricing')
      )
    }
  }, [form, t])

  const handleImportModelPricing = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        const imported = getImportedPricingData(parsed)

        for (const field of MODEL_PRICING_FIELDS) {
          if (!Object.prototype.hasOwnProperty.call(imported, field)) continue
          form.setValue(field, stringifyImportedJsonValue(imported[field]), {
            shouldDirty: true,
            shouldValidate: true,
          })
        }

        toast.success(t('Model pricing imported into the draft'))
      } catch (error) {
        toast.error(
          error instanceof Error
            ? t(error.message)
            : t('Failed to import model pricing')
        )
      } finally {
        if (importInputRef.current) {
          importInputRef.current.value = ''
        }
      }
    },
    [form, t]
  )

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap justify-end gap-2'>
        <input
          ref={importInputRef}
          type='file'
          accept='application/json,.json'
          className='hidden'
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleImportModelPricing(file)
          }}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => importInputRef.current?.click()}
        >
          <Upload className='mr-2 h-4 w-4' />
          {t('Import model pricing')}
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleExportModelPricing}
        >
          <Download className='mr-2 h-4 w-4' />
          {t('Export model pricing')}
        </Button>
        <Button variant='outline' size='sm' onClick={toggleEditMode}>
          {editMode === 'visual' ? (
            <>
              <Code2 className='mr-2 h-4 w-4' />
              {t('Switch to JSON')}
            </>
          ) : (
            <>
              <Eye className='mr-2 h-4 w-4' />
              {t('Switch to Visual')}
            </>
          )}
        </Button>
      </div>

      <Form {...form}>
        {editMode === 'visual' ? (
          <div className='space-y-6'>
            <ModelRatioVisualEditor
              modelPrice={form.watch('ModelPrice')}
              modelRatio={form.watch('ModelRatio')}
              cacheRatio={form.watch('CacheRatio')}
              createCacheRatio={form.watch('CreateCacheRatio')}
              completionRatio={form.watch('CompletionRatio')}
              imageRatio={form.watch('ImageRatio')}
              audioRatio={form.watch('AudioRatio')}
              audioCompletionRatio={form.watch('AudioCompletionRatio')}
              billingMode={form.watch('BillingMode')}
              billingExpr={form.watch('BillingExpr')}
              onChange={(field, value) => {
                const fieldMap: Record<string, keyof ModelFormValues> = {
                  'billing_setting.billing_mode': 'BillingMode',
                  'billing_setting.billing_expr': 'BillingExpr',
                }
                const formField =
                  fieldMap[field] || (field as keyof ModelFormValues)
                handleFieldChange(formField, value)
              }}
            />

            <FormField
              control={form.control}
              name='ExposeRatioEnabled'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      {t('Expose ratio API')}
                    </FormLabel>
                    <FormDescription>
                      {t(
                        'Allow clients to query configured ratios via `/api/ratio`.'
                      )}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className='flex flex-wrap gap-4'>
              <Button onClick={form.handleSubmit(onSave)} disabled={isSaving}>
                {isSaving ? t('Saving...') : t('Save model prices')}
              </Button>
              <Button
                type='button'
                variant='destructive'
                onClick={onReset}
                disabled={isResetting}
              >
                {t('Reset prices')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSave)} className='space-y-6'>
            <FormField
              control={form.control}
              name='ModelPrice'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Model fixed pricing')}</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'JSON map of model → USD cost per request. Takes precedence over ratio based billing.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ModelRatio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Model ratio')}</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'JSON map of model → multiplier applied to quota billing.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='CacheRatio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Prompt cache ratio')}</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('Optional ratio used when upstream cache hits occur.')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='CreateCacheRatio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Create cache ratio')}</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Ratio applied when creating cache entries for supported models.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='CompletionRatio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Completion ratio')}</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Applies to custom completion endpoints. JSON map of model → ratio.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ImageRatio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Image ratio')}</FormLabel>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Configure per-model ratio for image inputs or outputs.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='AudioRatio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Audio ratio')}</FormLabel>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Ratio applied to audio inputs where supported by the upstream model.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='AudioCompletionRatio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Audio completion ratio')}</FormLabel>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Ratio applied to audio completions for streaming models.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ExposeRatioEnabled'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      {t('Expose ratio API')}
                    </FormLabel>
                    <FormDescription>
                      {t(
                        'Allow clients to query configured ratios via `/api/ratio`.'
                      )}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className='flex flex-wrap gap-4'>
              <Button type='submit' disabled={isSaving}>
                {isSaving ? t('Saving...') : t('Save model prices')}
              </Button>
              <Button
                type='button'
                variant='destructive'
                onClick={onReset}
                disabled={isResetting}
              >
                {t('Reset prices')}
              </Button>
            </div>
          </form>
        )}
      </Form>
    </div>
  )
})
