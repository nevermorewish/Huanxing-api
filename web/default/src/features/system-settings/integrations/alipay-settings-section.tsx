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
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

export interface AlipaySettingsValues {
  AlipayAppId: string
  AlipayPrivateKey: string
  AlipayPublicKey: string
  AlipaySandboxEnabled: boolean
}

interface Props {
  defaultValues: AlipaySettingsValues
}

export function AlipaySettingsSection(props: Props) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [loading, setLoading] = useState(false)
  const form = useForm<AlipaySettingsValues>({
    defaultValues: props.defaultValues,
  })

  useEffect(() => {
    form.reset(props.defaultValues)
  }, [props.defaultValues, form])

  const handleSave = async () => {
    setLoading(true)
    try {
      const values = form.getValues()
      const updates: { key: string; value: string | boolean }[] = [
        { key: 'AlipaySandboxEnabled', value: values.AlipaySandboxEnabled },
      ]

      const appId = values.AlipayAppId.trim()
      const privateKey = values.AlipayPrivateKey.trim()
      const publicKey = values.AlipayPublicKey.trim()

      if (appId) {
        updates.push({ key: 'AlipayAppId', value: appId })
      }
      if (privateKey) {
        updates.push({ key: 'AlipayPrivateKey', value: privateKey })
      }
      if (publicKey) {
        updates.push({ key: 'AlipayPublicKey', value: publicKey })
      }

      for (const update of updates) {
        await updateOption.mutateAsync(update)
      }
      toast.success(t('Updated successfully'))
    } catch {
      toast.error(t('Update failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsSection
      title={t('Official Alipay')}
      description={t('Configure official Alipay page payment integration')}
    >
      <div className='space-y-4'>
        <Alert>
          <AlertDescription>
            {t(
              'Alipay private/public keys are sensitive and are not returned when loading settings. Leave key fields blank to keep the existing values.'
            )}
          </AlertDescription>
        </Alert>

        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label>{t('Alipay App ID')}</Label>
            <Input {...form.register('AlipayAppId')} />
          </div>
          <div className='flex items-center justify-between rounded-lg border p-3'>
            <div>
              <Label>{t('Sandbox mode')}</Label>
              <p className='text-muted-foreground text-sm'>
                {t('Use Alipay sandbox gateway for testing')}
              </p>
            </div>
            <Switch
              checked={form.watch('AlipaySandboxEnabled')}
              onCheckedChange={(checked) =>
                form.setValue('AlipaySandboxEnabled', checked)
              }
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label>{t('Alipay App Private Key')}</Label>
          <Input
            type='password'
            autoComplete='new-password'
            placeholder={t('Enter a new key to update; leave blank to keep')}
            {...form.register('AlipayPrivateKey')}
          />
        </div>

        <div className='space-y-2'>
          <Label>{t('Alipay Public Key')}</Label>
          <Input
            type='password'
            autoComplete='new-password'
            placeholder={t('Enter a new key to update; leave blank to keep')}
            {...form.register('AlipayPublicKey')}
          />
        </div>

        <div className='text-muted-foreground space-y-1 rounded-lg border p-3 text-sm'>
          <div>{t('Top-up notify URL')}: /api/user/alipay/notify</div>
          <div>{t('Subscription notify URL')}: /api/subscription/alipay/notify</div>
          <div>{t('Subscription return URL')}: /api/subscription/alipay/return</div>
        </div>

        <div className='flex justify-end'>
          <Button type='button' onClick={handleSave} disabled={loading}>
            {loading ? t('Saving...') : t('Save Official Alipay')}
          </Button>
        </div>
      </div>
    </SettingsSection>
  )
}
