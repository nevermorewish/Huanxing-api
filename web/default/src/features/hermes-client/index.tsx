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
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Apple,
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Layers3,
  MessageCircle,
  MonitorDown,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useStatus } from '@/hooks/use-status'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'

const DEFAULT_BRAND = 'Hermes Agent CN Desktop'
const ASSET_BASE = '/hermes-client/'

function image(name: string) {
  return `${ASSET_BASE}${name}`
}

const heroImage = image('workbench-light.B2uvzVV2.png')

const featureRows: Array<{
  icon: LucideIcon
  title: string
  description: string
  image: string
  alt: string
  reverse?: boolean
  items: Array<{ title: string; text: string }>
}> = [
  {
    icon: MessageCircle,
    title: '对话与工作流',
    description: '为 Agent 工作流打造的完整聊天体验。',
    image: image('chat-response.gbATp_sP.png'),
    alt: '聊天回复工作流',
    items: [
      {
        title: '流式对话',
        text: '实时流式输出，支持多轮上下文，响应即刻可见。',
      },
      {
        title: '对话历史',
        text: '完整的会话历史管理，随时回溯、继续未完的任务。',
      },
      {
        title: '附件支持',
        text: '拖拽文件直接加入对话，交给 Agent 一并处理。',
      },
      {
        title: 'LaTeX 与 Mermaid',
        text: '原生支持 LaTeX、Mermaid 等内容渲染，公式、流程图与结构化说明可直接展示。',
      },
    ],
  },
  {
    icon: Sparkles,
    title: 'Agent 能力',
    description: '让 Agent 真正能干活的核心能力集。',
    image: image('skills-library.BSyA6b3G.png'),
    alt: '内置 Skills 管理',
    reverse: true,
    items: [
      {
        title: 'Skills、记忆与 MCP',
        text: '统一管理内置技能、长期记忆与 MCP 工具服务，Agent 所需的能力上下文集中配置。',
      },
      {
        title: 'Profile 切换',
        text: '多套配置档位，一键切换不同工作场景。',
      },
      {
        title: '定时任务',
        text: '用自然语言描述，即可创建定时调度任务。',
      },
    ],
  },
  {
    icon: Layers3,
    title: '模型与部署',
    description: '兼容云端服务商与本地模型部署。',
    image: image('model-provider-setup.DYs_oeDy.png'),
    alt: '模型服务商配置',
    items: [
      {
        title: '云端与本地模型',
        text: '原生支持火山方舟、千帆、混元、百炼、智谱、MiniMax、Kimi，以及 Ollama、vLLM、LM Studio、llama.cpp 本地部署。',
      },
      {
        title: '模型配置与切换',
        text: '集中管理多家服务商的密钥与参数，随时切换。',
      },
      {
        title: '凭据与 OAuth',
        text: '支持 OAuth 登录与凭据集中管理。',
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: '运行时与安全',
    description: '把生产级的稳定与安全交给桌面端。',
    image: image('health.9YKoaWLy.png'),
    alt: '系统健康状态面板',
    reverse: true,
    items: [
      {
        title: '托管运行时',
        text: '预置 runtime，升级或修复时支持下载、更新与一键回滚。',
      },
      {
        title: '签名校验',
        text: 'Ed25519 签名验证，确保内核来源可信。',
      },
      {
        title: '诊断与日志',
        text: 'Dashboard、gateway、runtime 健康状态与日志查看，问题一目了然。',
      },
    ],
  },
]

const screenshots = [
  {
    label: '工作台',
    alt: '深色主题工作台',
    src: image('workbench-dark.C2bnPPRN.png'),
  },
  {
    label: '工作台',
    alt: '浅色主题工作台',
    src: image('workbench-light.B2uvzVV2.png'),
  },
  {
    label: '归档',
    alt: '深色主题归档工作台',
    src: image('dark-archive.NOR3lF99.png'),
  },
  {
    label: '归档',
    alt: '浅色主题归档工作台',
    src: image('light-archive.CqaPPFot.png'),
  },
  {
    label: '对话',
    alt: '聊天回复工作流',
    src: image('chat-response.gbATp_sP.png'),
  },
  {
    label: '对话',
    alt: '对话历史页面',
    src: image('chat-history.CODMUcSp.png'),
  },
  {
    label: 'LaTeX',
    alt: 'LaTeX 与 Markdown 渲染效果',
    src: image('latex.DCVdYYgD.png'),
  },
  {
    label: '控制台',
    alt: '任务控制台输出页面',
    src: image('console.7wkQ3PjP.png'),
  },
  {
    label: '飞书接入',
    alt: '飞书平台接入配置',
    src: image('feishu.DFPbpqIr.png'),
  },
  {
    label: '统计',
    alt: '用量统计与图表页面',
    src: image('stats.DBPnjt43.png'),
  },
  {
    label: '健康',
    alt: '系统健康状态面板',
    src: image('health.9YKoaWLy.png'),
  },
  {
    label: '配置',
    alt: '模型服务商配置',
    src: image('config.DrFJwAlv.png'),
  },
  {
    label: '运行时',
    alt: '运行时管理页面',
    src: image('runtime.BIRP3Mi2.png'),
  },
  {
    label: '日志',
    alt: '运行时日志页面',
    src: image('log.-IQcKruU.png'),
  },
  {
    label: 'Skills',
    alt: '内置 Skills 管理',
    src: image('skills-library.BSyA6b3G.png'),
  },
]

const faqs = [
  {
    question: '和 Web 版有什么区别？',
    answer:
      '桌面版补齐原生窗口、本地进程管理、系统文件对话框、托管 runtime、运行时诊断，以及生产模式下更安全的 REST / SSE 代理层。',
  },
  {
    question: '我的数据安全吗？',
    answer:
      '桌面版在本地运行内核与会话状态，模型调用直连你所配置的服务商。生产模式下 REST、上传与 SSE 流量经由本地代理集中处理鉴权。',
  },
  {
    question: '支持哪些模型？',
    answer:
      '原生适配火山方舟、百度千帆、腾讯混元、阿里云百炼、智谱 GLM、MiniMax、月之暗面 Kimi、SiliconFlow、ModelScope、优云智算等模型服务商，也支持 Ollama、vLLM、LM Studio、llama.cpp 等本地部署方案。',
  },
  {
    question: '支持哪些系统？',
    answer:
      '页面会显示管理员在系统设置中配置的 Windows x64、macOS Apple Silicon 与 macOS Intel 下载链接。',
  },
]

function normalizeSetting(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isDownloadUrl(value: string): boolean {
  if (!value) return false
  if (value === '#' || value.toLowerCase() === 'null') return false
  if (value.toLowerCase() === 'undefined') return false
  return /^https?:\/\//i.test(value) || value.startsWith('/')
}

function HermesLogo({ label }: { label: string }) {
  return (
    <div className='grid size-14 shrink-0 place-items-center rounded-[18px] bg-[#0a0a0a] shadow-[0_20px_56px_rgba(0,0,0,0.25)]'>
      <svg
        width='36'
        height='36'
        viewBox='0 0 80 80'
        role='img'
        aria-label={label}
      >
        <rect width='80' height='80' rx='18' fill='#0a0a0a' />
        <g transform='translate(-2,2)'>
          <polygon points='58,22 58,58 62,54 62,18' fill='#bab7af' />
          <polygon points='50,22 58,22 62,18 54,18' fill='#dbd8d0' />
          <polygon points='30,36 50,36 54,32 34,32' fill='#4aa8f0' />
          <polygon points='30,22 30,36 34,32 34,18' fill='#bab7af' />
          <polygon points='30,44 30,58 34,54 34,40' fill='#bab7af' />
          <polygon points='22,22 30,22 34,18 26,18' fill='#dbd8d0' />
          <path
            d='M22,22 H30 V36 H50 V22 H58 V58 H50 V44 H30 V58 H22 Z'
            fill='#fbfaf6'
          />
          <rect x='30' y='36' width='20' height='8' fill='#0076dc' />
        </g>
      </svg>
    </div>
  )
}

function WindowFrame({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        'overflow-hidden rounded-[22px] border border-[#d8d3ca] bg-[#141311] p-2 shadow-[0_30px_80px_rgba(20,19,17,0.18)]',
        className,
      ].join(' ')}
    >
      <div className='flex h-10 items-center gap-2 rounded-t-[16px] bg-[#24211e] px-4'>
        <span className='size-3 rounded-full bg-[#ff5f57]' />
        <span className='size-3 rounded-full bg-[#ffbd2e]' />
        <span className='size-3 rounded-full bg-[#28c840]' />
      </div>
      {children}
    </div>
  )
}

function DownloadButton({
  href,
  children,
  primary,
  block,
}: {
  href?: string
  children: ReactNode
  primary?: boolean
  block?: boolean
}) {
  const className = [
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition-all duration-200',
    block ? 'w-full' : '',
    primary
      ? 'bg-[#0076dc] text-white shadow-[0_16px_40px_rgba(0,118,220,0.28)] hover:bg-[#0067c0]'
      : 'border border-[#d8d3ca] bg-[#fbfaf6] text-[#141311] hover:border-[#0076dc] hover:text-[#0076dc] dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white dark:hover:border-[#4aa8f0] dark:hover:text-[#4aa8f0]',
  ].join(' ')

  if (!href || !isDownloadUrl(href)) {
    return (
      <button
        type='button'
        aria-disabled='true'
        className={`${className} cursor-default`}
      >
        {children}
      </button>
    )
  }

  return (
    <a href={href} target='_blank' rel='noreferrer' className={className}>
      {children}
    </a>
  )
}

export function HermesClient() {
  const { status, placeholder } = useStatus()
  const hasLiveStatus = !placeholder
  const brand =
    (hasLiveStatus && normalizeSetting(status?.hermes_brand_name)) ||
    DEFAULT_BRAND

  const downloads = [
    {
      os: 'Windows',
      arch: 'x64 · Windows 10 / 11',
      label: 'Windows',
      fileType: '.exe',
      href: hasLiveStatus ? normalizeSetting(status?.hermes_windows_url) : '',
      icon: MonitorDown,
      primary: true,
    },
    {
      os: 'macOS',
      arch: 'Apple Silicon · macOS 11+',
      label: 'macOS',
      fileType: '.dmg',
      href: hasLiveStatus ? normalizeSetting(status?.hermes_mac_arm_url) : '',
      icon: Apple,
      primary: false,
    },
    {
      os: 'macOS',
      arch: 'Intel · macOS 10.15+',
      label: 'macOS',
      fileType: '.dmg',
      href: hasLiveStatus ? normalizeSetting(status?.hermes_mac_intel_url) : '',
      icon: Apple,
      primary: false,
    },
  ]

  return (
    <PublicLayout
      showMainContainer={false}
      showThemeSwitch
      showNotifications={false}
    >
      <main className='min-h-screen overflow-hidden bg-[#fbfaf6] text-[#141311] dark:bg-[#0a0c10] dark:text-white'>
        <section className='relative border-b border-[#e7e2d8] px-5 pt-20 pb-16 sm:pt-24 lg:pt-28 dark:border-white/[0.08]'>
          <div className='absolute inset-0 bg-[linear-gradient(rgba(10,9,8,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(10,9,8,0.055)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)]' />
          <div className='absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_78%_14%,rgba(0,118,220,0.16),transparent_35%),radial-gradient(circle_at_24%_6%,rgba(186,183,175,0.32),transparent_32%)]' />

          <div className='relative mx-auto grid max-w-[1220px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center'>
            <div>
              <div className='mb-7 flex items-center gap-4'>
                <HermesLogo label={brand} />
                <div>
                  <div className='text-sm font-black tracking-[0.18em] text-[#0076dc] uppercase'>
                    {brand}
                  </div>
                  <div className='mt-1 text-base font-semibold text-[#6b665e] dark:text-[#9ba3af]'>
                    装上就能用的 AI Agent 桌面端
                  </div>
                </div>
              </div>

              <h1 className='max-w-3xl text-[44px] leading-[1.04] font-black tracking-normal text-[#0a0908] sm:text-[64px] lg:text-[76px] dark:text-white'>
                下载
                <span className='block text-[#0076dc]'>{brand}</span>
              </h1>
              <p className='mt-7 max-w-2xl text-lg leading-8 text-[#5f5a53] dark:text-[#9ba3af]'>
                原生 Windows 与 macOS 客户端，内置 {brand}{' '}
                runtime。下载安装后配置 API Key
                或本地模型端点，即可开始聊天、Skills、记忆、定时任务与 MCP
                工作流。
              </p>

              <div className='mt-9 flex flex-wrap gap-3'>
                {downloads.map((item) => {
                  const Icon = item.icon
                  return (
                    <DownloadButton
                      key={`${item.os}-${item.arch}`}
                      href={item.href}
                      primary={item.primary}
                    >
                      <Icon className='size-5' />
                      {item.os === 'macOS'
                        ? `${item.os} ${item.arch.split(' · ')[0]}`
                        : item.os}
                    </DownloadButton>
                  )
                })}
              </div>
            </div>

            <div className='relative'>
              <WindowFrame>
                <img
                  src={heroImage}
                  alt={`${brand} 工作台界面`}
                  className='aspect-[2624/1704] w-full rounded-b-[16px] object-cover'
                  loading='eager'
                />
              </WindowFrame>
            </div>
          </div>
        </section>

        <section
          id='features'
          className='bg-[#fbfaf6] px-5 py-20 dark:bg-[#0a0c10]'
        >
          <div className='mx-auto max-w-[1220px]'>
            <div className='mx-auto max-w-3xl text-center'>
              <div className='text-sm font-black tracking-[0.18em] text-[#0076dc] uppercase'>
                功能展示
              </div>
              <h2 className='mt-3 text-4xl leading-tight font-black text-[#0a0908] sm:text-5xl dark:text-white'>
                面向 Agent 的完整工作台
              </h2>
              <p className='mt-5 text-lg leading-8 text-[#6b665e] dark:text-[#9ba3af]'>
                聊天、流式输出、附件、MCP、Skills、Memory、Profiles、定时任务与运行时健康面板都已内置。
              </p>
            </div>

            <div className='mt-14 space-y-12'>
              {featureRows.map((row) => {
                const Icon = row.icon
                return (
                  <article
                    key={row.title}
                    className={[
                      'grid gap-8 rounded-[28px] border border-[#e2ddd4] bg-white p-5 shadow-[0_18px_60px_rgba(20,19,17,0.07)] lg:grid-cols-2 lg:items-center lg:p-8 dark:border-white/[0.08] dark:bg-[#111318] dark:shadow-none',
                      row.reverse ? 'lg:[&>.feature-text]:order-2' : '',
                    ].join(' ')}
                  >
                    <div className='feature-text p-2 lg:p-4'>
                      <div className='grid size-12 place-items-center rounded-xl bg-[#eaf4ff] text-[#0076dc] dark:bg-[#0f2740] dark:text-[#4aa8f0]'>
                        <Icon className='size-6' />
                      </div>
                      <h3 className='mt-6 text-3xl leading-tight font-black text-[#0a0908] dark:text-white'>
                        {row.title}
                      </h3>
                      <p className='mt-3 text-lg leading-8 text-[#6b665e] dark:text-[#9ba3af]'>
                        {row.description}
                      </p>
                      <ul className='mt-7 space-y-4'>
                        {row.items.map((item) => (
                          <li key={item.title} className='flex gap-3'>
                            <span className='mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-[#0076dc] text-white'>
                              <Check className='size-4' />
                            </span>
                            <div>
                              <strong className='block text-base font-black text-[#141311] dark:text-white'>
                                {item.title}
                              </strong>
                              <span className='mt-1 block leading-7 text-[#6b665e] dark:text-[#9ba3af]'>
                                {item.text}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <WindowFrame>
                      <img
                        src={row.image}
                        alt={row.alt}
                        className='aspect-[2888/1804] w-full rounded-b-[16px] object-cover'
                        loading='lazy'
                      />
                    </WindowFrame>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id='screenshots'
          className='bg-[#fbfaf6] px-5 py-20 text-[#141311] dark:bg-[#0d1017] dark:text-white'
        >
          <div className='mx-auto max-w-[1220px]'>
            <div className='mx-auto max-w-3xl text-center'>
              <div className='text-sm font-black tracking-[0.18em] text-[#0076dc] uppercase'>
                界面一览
              </div>
              <h2 className='mt-3 text-4xl leading-tight font-black text-[#0a0908] sm:text-5xl dark:text-white'>
                每个细节，都为生产力打磨
              </h2>
              <p className='mt-5 text-lg leading-8 text-[#6b665e] dark:text-[#9ba3af]'>
                工作台、归档、对话、LaTeX、控制台、飞书接入、统计、健康、配置、运行时与日志。
              </p>
            </div>

            <div className='mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
              {screenshots.map((shot) => (
                <a
                  key={`${shot.label}-${shot.alt}`}
                  href={shot.src}
                  target='_blank'
                  rel='noreferrer'
                  aria-label={`${shot.alt}，点击查看大图`}
                  className='group relative overflow-hidden rounded-[18px] border border-[#e2ddd4] bg-white p-2 shadow-[0_18px_56px_rgba(20,19,17,0.08)] dark:border-white/[0.08] dark:bg-[#111318] dark:shadow-none'
                >
                  <img
                    src={shot.src}
                    alt={shot.alt}
                    className='aspect-[2888/1804] w-full rounded-[12px] object-cover transition-transform duration-300 group-hover:scale-[1.025]'
                    loading='lazy'
                  />
                  <span className='absolute top-5 left-5 rounded-full bg-black/55 px-3 py-1 text-xs font-black text-white backdrop-blur'>
                    {shot.label}
                  </span>
                  <span className='absolute right-5 bottom-5 grid size-9 place-items-center rounded-full bg-white/90 text-[#141311] shadow-lg dark:bg-[#111318]/90 dark:text-white'>
                    <ExternalLink className='size-4' />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section
          id='download'
          className='relative bg-[#fbfaf6] px-5 py-20 dark:bg-[#0a0c10]'
        >
          <div className='absolute inset-0 bg-[linear-gradient(rgba(10,9,8,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(10,9,8,0.045)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]' />
          <div className='relative mx-auto max-w-[1220px]'>
            <div className='mx-auto max-w-3xl text-center'>
              <div className='text-sm font-black tracking-[0.18em] text-[#0076dc] uppercase'>
                立即开始
              </div>
              <h2 className='mt-3 text-4xl leading-tight font-black text-[#0a0908] sm:text-5xl dark:text-white'>
                下载 {brand}
              </h2>
              <p className='mt-5 text-lg leading-8 text-[#6b665e] dark:text-[#9ba3af]'>
                选择你的系统下载安装，下载地址由后台品牌设置统一配置。
              </p>
            </div>

            <div className='mt-12 grid gap-5 lg:grid-cols-3'>
              {downloads.map((item) => {
                const Icon = item.icon
                return (
                  <article
                    key={`${item.label}-${item.arch}`}
                    className={[
                      'relative rounded-[22px] border bg-white p-7 shadow-[0_16px_48px_rgba(20,19,17,0.08)] dark:bg-[#111318] dark:shadow-none',
                      item.primary
                        ? 'border-[#0076dc] bg-[#f4faff] dark:border-[#4aa8f0] dark:bg-[#0f1f2f]'
                        : 'border-[#e2ddd4] dark:border-white/[0.08]',
                    ].join(' ')}
                  >
                    <div className='grid size-14 place-items-center rounded-2xl bg-[#0a0908] text-white shadow-sm dark:bg-white/[0.08]'>
                      <Icon className='size-7' />
                    </div>
                    <h3 className='mt-7 text-3xl font-black text-[#0a0908] dark:text-white'>
                      {item.label}
                    </h3>
                    <p className='mt-2 text-sm font-semibold text-[#6b665e] dark:text-[#9ba3af]'>
                      {item.arch}
                    </p>
                    <div className='mt-7'>
                      <DownloadButton href={item.href} block primary>
                        <Download className='size-5' />
                        下载 {item.fileType}
                      </DownloadButton>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className='mx-auto mt-8 max-w-3xl space-y-3 text-center text-sm leading-7 text-[#6b665e] dark:text-[#9ba3af]'>
              <p>
                Windows 与 macOS 安装包预置 runtime，首次启动优先从包内 runtime
                初始化；托管下载与更新用于升级或兜底修复。
              </p>
              <p>
                macOS 首次打开：右键点击应用图标 →「打开」，或在「系统设置 →
                隐私与安全性」中允许。
              </p>
            </div>
          </div>
        </section>

        <section id='faq' className='bg-white px-5 py-20 dark:bg-[#0d1017]'>
          <div className='mx-auto max-w-[920px]'>
            <div className='text-center'>
              <div className='text-sm font-black tracking-[0.18em] text-[#0076dc] uppercase'>
                常见问题
              </div>
              <h2 className='mt-3 text-4xl leading-tight font-black text-[#0a0908] sm:text-5xl dark:text-white'>
                你可能想知道
              </h2>
            </div>
            <div className='mt-10 space-y-4'>
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className='group rounded-[18px] border border-[#e2ddd4] bg-[#fbfaf6] p-5 shadow-[0_10px_30px_rgba(20,19,17,0.05)] dark:border-white/[0.08] dark:bg-[#111318] dark:shadow-none'
                >
                  <summary className='flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black text-[#0a0908] dark:text-white'>
                    {faq.question}
                    <ChevronRight className='size-4 shrink-0 transition-transform group-open:rotate-90' />
                  </summary>
                  <p className='mt-4 leading-7 text-[#6b665e] dark:text-[#9ba3af]'>
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className='bg-[#0a0908] px-5 py-12 text-white'>
          <div className='mx-auto flex max-w-[1220px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-4'>
              <HermesLogo label={brand} />
              <div>
                <div className='text-xl font-black'>{brand}</div>
                <div className='mt-1 text-sm text-[#c8c2b8]'>
                  面向 Agent 的完整工作台
                </div>
              </div>
            </div>
            <a
              href='#download'
              className='inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#0076dc] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#0067c0]'
            >
              立即下载
              <ArrowRight className='size-4' />
            </a>
          </div>
        </section>
      </main>
      <Footer className='bg-white' />
    </PublicLayout>
  )
}
