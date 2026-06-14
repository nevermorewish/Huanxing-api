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
import * as z from 'zod'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { Input } from '@/components/ui/input'
import { FormDirtyIndicator } from '../components/form-dirty-indicator'
import { FormNavigationGuard } from '../components/form-navigation-guard'
import { SettingsSection } from '../components/settings-section'
import { useSettingsForm } from '../hooks/use-settings-form'
import { useUpdateOption } from '../hooks/use-update-option'

const hermesSchema = z.object({
  HermesBrandName: z.string().optional(),
  HermesWindowsUrl: z.string().optional(),
  HermesMacArmUrl: z.string().optional(),
  HermesMacIntelUrl: z.string().optional(),
})

type HermesFormValues = z.infer<typeof hermesSchema>

type HermesSectionProps = {
  defaultValues: HermesFormValues
}

function normalizeValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  return typeof value === 'string' ? value : String(value)
}

export function HermesSection({ defaultValues }: HermesSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const normalizedDefaults: HermesFormValues = {
    HermesBrandName: normalizeValue(defaultValues.HermesBrandName),
    HermesWindowsUrl: normalizeValue(defaultValues.HermesWindowsUrl),
    HermesMacArmUrl: normalizeValue(defaultValues.HermesMacArmUrl),
    HermesMacIntelUrl: normalizeValue(defaultValues.HermesMacIntelUrl),
  }

  const { form, handleSubmit, handleReset, isDirty, isSubmitting } =
    useSettingsForm<HermesFormValues>({
      resolver: zodResolver(hermesSchema) as Resolver<
        HermesFormValues,
        unknown,
        HermesFormValues
      >,
      defaultValues: normalizedDefaults,
      onSubmit: async (_data, changedFields) => {
        for (const [key, value] of Object.entries(changedFields)) {
          await updateOption.mutateAsync({
            key,
            value: normalizeValue(value),
          })
        }
      },
    })

  return (
    <>
      <FormNavigationGuard when={isDirty} />

      <SettingsSection
        title={t('Hermes Client')}
        description={t(
          'Configure the Hermes client download links shown on the public Hermes page.'
        )}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
            <FormDirtyIndicator isDirty={isDirty} />

            <FormField
              control={form.control}
              name='HermesBrandName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Brand Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder='Hermes Agent CN Desktop' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('Display name used across the Hermes page.')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='HermesWindowsUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Windows Download URL')}</FormLabel>
                  <FormControl>
                    <Input placeholder='' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('Leave empty to disable the Windows download button.')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='HermesMacArmUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('macOS (Apple Silicon) Download URL')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Leave empty to disable the macOS (Apple Silicon) download button.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='HermesMacIntelUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('macOS (Intel) Download URL')}</FormLabel>
                  <FormControl>
                    <Input placeholder='' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Leave empty to disable the macOS (Intel) download button.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex gap-2'>
              <Button
                type='submit'
                disabled={isSubmitting || updateOption.isPending}
              >
                {updateOption.isPending ? t('Saving...') : t('Save Changes')}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={handleReset}
                disabled={!isDirty || updateOption.isPending || isSubmitting}
              >
                <RotateCcw data-icon='inline-start' />
                {t('Reset')}
              </Button>
            </div>
          </form>
        </Form>
      </SettingsSection>
    </>
  )
}
