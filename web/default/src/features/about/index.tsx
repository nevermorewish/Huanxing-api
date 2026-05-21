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
import { useQuery } from '@tanstack/react-query'
import { BarChart3, KeyRound, Route, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Markdown } from '@/components/ui/markdown'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout'
import { getAboutContent } from './api'

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isLikelyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function DefaultAboutContent() {
  const { t } = useTranslation()
  const capabilities = [
    {
      title: t('Unified model access'),
      description: t(
        'Connect mainstream text, vision, image, audio, and embedding models through one compatible gateway.'
      ),
      icon: Route,
    },
    {
      title: t('API key and quota control'),
      description: t(
        'Create independent tokens for users, teams, and applications with clear access scopes and quota limits.'
      ),
      icon: KeyRound,
    },
    {
      title: t('Usage and cost visibility'),
      description: t(
        'Track request volume, model usage, quota consumption, and billing records from a single console.'
      ),
      icon: BarChart3,
    },
    {
      title: t('Operational stability'),
      description: t(
        'Use routing, channel testing, retry policies, and monitoring to keep model access predictable.'
      ),
      icon: ShieldCheck,
    },
  ]

  const highlights = [
    {
      label: t('Compatible API'),
      value: t('OpenAI-style access'),
    },
    {
      label: t('Model operations'),
      value: t('Pricing, routing, logs'),
    },
    {
      label: t('Team management'),
      value: t('Users, groups, tokens'),
    },
  ]

  return (
    <div className='mx-auto max-w-7xl px-4 py-10 sm:py-14'>
      <section className='border-border bg-card rounded-lg border p-6 shadow-sm sm:p-8'>
        <div className='grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center'>
          <div className='space-y-5'>
            <p className='text-primary text-sm font-semibold tracking-wide uppercase'>
              {t('About')}
            </p>
            <div className='space-y-3'>
              <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
                {t('About Huanxing Yunke')}
              </h1>
              <p className='text-muted-foreground text-base leading-7'>
                {t('Huanxing Yunke Technology Co., Ltd')}
              </p>
            </div>
            <p className='text-muted-foreground max-w-3xl text-base leading-8'>
              {t(
                'Huanxing Yunke provides an AI model gateway for teams and products, helping developers connect multiple model providers through one interface while keeping keys, quotas, pricing, routing, and logs manageable.'
              )}
            </p>
          </div>

          <div className='grid gap-3'>
            {highlights.map((item) => (
              <div key={item.label} className='bg-muted/60 rounded-lg p-4'>
                <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  {item.label}
                </div>
                <div className='mt-1 text-base font-semibold'>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {capabilities.map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.title}
              className='border-border bg-card rounded-lg border p-5 shadow-sm'
            >
              <Icon className='text-primary size-6' />
              <h2 className='mt-4 text-lg font-semibold'>{item.title}</h2>
              <p className='text-muted-foreground mt-3 text-sm leading-7'>
                {item.description}
              </p>
            </article>
          )
        })}
      </section>

      <section className='border-border bg-card mt-6 rounded-lg border p-5 shadow-sm sm:p-6'>
        <div className='grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start'>
          <div>
            <h2 className='text-xl font-semibold'>
              {t('Built for everyday model operations')}
            </h2>
            <p className='text-muted-foreground mt-3 text-sm leading-7'>
              {t(
                'The platform focuses on the control plane around model usage: channel configuration, model pricing, token permissions, usage logs, and service health.'
              )}
            </p>
          </div>
          <div className='grid gap-3 sm:grid-cols-3'>
            <div className='bg-muted/60 rounded-lg p-4'>
              <div className='text-sm font-semibold'>{t('Channels')}</div>
              <p className='text-muted-foreground mt-2 text-sm'>
                {t('Connect and test upstream providers.')}
              </p>
            </div>
            <div className='bg-muted/60 rounded-lg p-4'>
              <div className='text-sm font-semibold'>{t('Pricing')}</div>
              <p className='text-muted-foreground mt-2 text-sm'>
                {t('Manage model ratios and billing rules.')}
              </p>
            </div>
            <div className='bg-muted/60 rounded-lg p-4'>
              <div className='text-sm font-semibold'>{t('Logs')}</div>
              <p className='text-muted-foreground mt-2 text-sm'>
                {t('Review requests, errors, and spend.')}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutContent,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isValidUrl(rawContent)
  const isHtml = hasContent && !isUrl && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto flex max-w-4xl flex-col gap-4 py-12'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout>
        <DefaultAboutContent />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('About')}
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='mx-auto max-w-6xl px-4 py-8'>
        {isHtml ? (
          <div
            className='prose prose-neutral dark:prose-invert max-w-none'
            dangerouslySetInnerHTML={{ __html: rawContent }}
          />
        ) : (
          <Markdown className='prose-neutral dark:prose-invert max-w-none'>
            {rawContent}
          </Markdown>
        )}
      </div>
    </PublicLayout>
  )
}
