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

const _openClawSchema = z.object({
  OpenClawBrandName: z.string().optional(),
  OpenClawWindowsUrl: z.string().optional(),
  OpenClawMacArmUrl: z.string().optional(),
  OpenClawMacIntelUrl: z.string().optional(),
})

type OpenClawFormValues = z.infer<typeof _openClawSchema>

type OpenClawSectionProps = {
  defaultValues: OpenClawFormValues
}

function normalizeValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  return typeof value === 'string' ? value : String(value)
}

export function OpenClawSection({ defaultValues }: OpenClawSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const normalizedDefaults: OpenClawFormValues = {
    OpenClawBrandName: normalizeValue(defaultValues.OpenClawBrandName),
    OpenClawWindowsUrl: normalizeValue(defaultValues.OpenClawWindowsUrl),
    OpenClawMacArmUrl: normalizeValue(defaultValues.OpenClawMacArmUrl),
    OpenClawMacIntelUrl: normalizeValue(defaultValues.OpenClawMacIntelUrl),
  }

  const { form, handleSubmit, handleReset, isDirty, isSubmitting } =
    useSettingsForm<OpenClawFormValues>({
      resolver: zodResolver(_openClawSchema) as Resolver<
        OpenClawFormValues,
        unknown,
        OpenClawFormValues
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
        title={t('OpenClaw Client')}
        description={t(
          'Configure the OpenClaw client brand name and download links shown on the public OpenClaw page. Download fields accept direct installer links or electron-builder latest.yml manifest links.'
        )}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <FormDirtyIndicator isDirty={isDirty} />

            <FormField
              control={form.control}
              name='OpenClawBrandName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Brand Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder='快码CLAW' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('Display name used across the OpenClaw page.')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='OpenClawWindowsUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Windows Download URL')}</FormLabel>
                  <FormControl>
                    <Input placeholder='' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Leave empty to disable the Windows download button. You can also enter a latest.yml manifest URL.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='OpenClawMacArmUrl'
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
                      'Leave empty to disable the macOS (Apple Silicon) download button. You can also enter a latest.yml manifest URL.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='OpenClawMacIntelUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('macOS (Intel) Download URL')}</FormLabel>
                  <FormControl>
                    <Input placeholder='' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Leave empty to disable the macOS (Intel) download button. You can also enter a latest.yml manifest URL.'
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
                <RotateCcw className='mr-2 h-4 w-4' />
                {t('Reset')}
              </Button>
            </div>
          </form>
        </Form>
      </SettingsSection>
    </>
  )
}
