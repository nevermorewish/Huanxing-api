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
import {
  ArrowRight,
  ChevronUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Markdown } from '@/components/ui/markdown'
import { PublicLayout } from '@/components/layout'
import { cn } from '@/lib/utils'
import { useHomePageContent } from './hooks'

const modelCards = [
  {
    name: 'Claude',
    vendor: 'Anthropic / Bedrock',
    version: 'claude opus 4.7',
    badge: '主推首选',
    featured: true,
    mark: 'C',
    description:
      '适合企业级知识库、合同财报解析、长文档处理和高可靠客服。可通过多供应商渠道实现稳定接入、弹性并发和成本治理。',
    tags: ['企业合规', '长上下文', '低幻觉', '高并发', '批量推理'],
  },
  {
    name: 'ChatGPT',
    vendor: 'OpenAI',
    version: 'GPT-5.5',
    badge: '',
    featured: false,
    mark: 'G',
    description:
      '通用交互体验成熟，工具生态完善，适合日常办公、内容创作、代码开发、智能问答和多模态业务入口。',
    tags: ['通用全能', '多模态', '工具生态', '代码开发'],
  },
  {
    name: 'Gemini',
    vendor: 'Google',
    version: 'Gemini Pro',
    badge: '',
    featured: false,
    mark: 'M',
    description:
      '适合复杂推理、长上下文、多模态理解、科研分析和视频图像解析，覆盖高阶数据处理与工程研发场景。',
    tags: ['推理能力', '多模态', '代码分析', '科研推演'],
  },
  {
    name: 'DeepSeek',
    vendor: 'DeepSeek',
    version: 'deepseekv4-pro / deepseekv4-flash',
    badge: '',
    featured: false,
    mark: 'D',
    description:
      '推理能力突出，中文能力稳定，成本友好。适合复杂问答、代码生成、数据分析、知识库和批量调用。',
    tags: ['推理突出', '中文稳定', '成本友好', '代码生成'],
  },
  {
    name: '混元',
    vendor: 'Tencent',
    version: 'Hunyuan',
    badge: '',
    featured: false,
    mark: 'H',
    description:
      '适合社交内容、企业协同、私域运营和隐私敏感场景，可结合企业微信、内容平台和业务系统集成。',
    tags: ['社交生态', '隐私安全', '企业协同', '内容运营'],
  },
  {
    name: '豆包',
    vendor: 'ByteDance',
    version: 'Doubao / Seed',
    badge: '',
    featured: false,
    mark: 'D',
    description:
      '中文网感和内容生成效率突出，适合短视频脚本、直播文案、自媒体选题和轻量化创作工作流。',
    tags: ['网感出众', '短视频', '内容创作', '低门槛'],
  },
] as const

const compareRows = [
  ['Claude', '企业合规、长文本、稳定低幻觉、高并发弹性', '金融医疗、合同财报、知识库、企业批量落地', '中高'],
  ['ChatGPT', '通用能力强、交互自然、工具生态完善', '日常办公、创意内容、代码开发、通用智能问答', '偏高'],
  ['Gemini', '推理能力强、多模态覆盖广、代码分析能力好', '科研推演、复杂代码、图纸视频解析、数据分析', '中高'],
  ['DeepSeek', '推理能力突出、中文稳定、成本优势明显', '复杂问答、代码生成、数据分析、知识库、批量调用', '低'],
  ['混元', '本土生态适配、隐私安全、协同场景友好', '私域运营、企业微信协同、内容审核、内部办公', '中等'],
  ['豆包', '内容表达自然、短视频适配、上手门槛低', '自媒体、短视频直播、流量文案、轻量创作', '低'],
] as const

const ecoCards = [
  {
    title: '企业级模型接入组合',
    description:
      '通过寰星云科统一网关，把海外旗舰模型、国产模型和多模态模型纳入同一套接入、计费、限流、日志和权限体系。团队不需要分别维护多套供应商账号、密钥和调用逻辑。',
    wide: true,
  },
  {
    title: '海外模型生态',
    wide: false,
    description:
      '覆盖 Claude、ChatGPT、Gemini 等海外前沿能力，帮助业务稳定使用强推理、多模态、代码和长文本能力，并通过路由策略降低单点不可用风险。',
  },
  {
    title: '国产模型生态',
    wide: false,
    description:
      '覆盖 DeepSeek、混元、豆包、Kimi、GLM 等国产模型，贴合中文语境、国内办公流程和数据主权要求，用更低成本承载规模化场景。',
  },
] as const

const advantages = [
  ['01', '全模型可选，按需调度', '一站聚合主流模型供应商，按业务场景选择最合适的模型组合，避免被单一模型能力和价格绑定。'],
  ['02', '统一接口，快速上线', '以兼容 API 对接现有应用，减少多供应商适配工作，让研发团队把精力放在产品体验和业务闭环上。'],
  ['03', '精细计费，成本透明', '支持模型倍率、动态定价、预付额度和用量日志，让每一次请求都有清楚的成本归因。'],
  ['04', '路由容灾，稳定交付', '支持权重、优先级、故障转移和渠道亲和策略，在供应商波动时保持服务连续性。'],
  ['05', '权限安全，集中治理', '统一管理 API Key、用户分组、速率限制、敏感词、SSRF 防护和审计能力，减少散落配置风险。'],
  ['06', '运营支持，持续优化', '从模型接入、用量监控、价格策略到日志分析，帮助团队持续优化 AI 应用的质量和成本。'],
] as const

function FadeIn(props: {
  children: React.ReactNode
  className?: string
  delay?: 'd1' | 'd2' | 'd3' | 'd4'
}) {
  return (
    <div className={cn('hx-fu', props.delay, props.className)}>
      {props.children}
    </div>
  )
}

function HeroSection() {
  return (
    <section id='hero' className='hx-hero relative flex min-h-[78vh] items-center overflow-hidden bg-[#0a0c10] pt-[88px] text-white'>
      <div className='relative z-10 mx-auto w-full max-w-[1240px] px-5 py-16 text-center md:px-12'>
        <FadeIn>
          <div className='mb-7 inline-flex items-center gap-2 rounded-full border border-[#ff9900]/25 bg-[#ff9900]/10 px-4 py-1.5 text-xs font-bold tracking-[0.12em] text-[#ff9900]'>
            <span className='text-[10px]'>◆</span>
            寰星云科 AI 聚合平台
          </div>
          <h1 className='mx-auto max-w-5xl text-4xl leading-[1.14] font-black tracking-normal text-white md:text-6xl'>
            一站式全品类
            <span className='hx-orange-gradient'> AI 大模型聚合服务</span>
          </h1>
          <p className='mx-auto mt-5 max-w-3xl text-base leading-8 text-[#9ba3af] md:text-lg'>
            聚合 Claude、ChatGPT、Gemini、DeepSeek、混元、豆包等主流模型，统一接口、统一计费、统一路由，
            为企业 AI 应用提供稳定、可控、可运营的接入底座。
          </p>
          <div className='mt-9 flex flex-wrap justify-center gap-3'>
            <a href='#models' className='hx-btn-primary'>
              浏览六大模型 <ArrowRight className='size-4' />
            </a>
            <a href='#compare' className='hx-btn-ghost'>
              快速选型对比
            </a>
          </div>
          <div className='mt-8 flex flex-wrap justify-center gap-2.5'>
            {['Claude', 'ChatGPT', 'Gemini', 'DeepSeek', 'Hunyuan', 'Doubao'].map((name, index) => (
              <span
                key={name}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  index === 0
                    ? 'border-[#ff9900]/25 bg-[#ff9900]/10 text-[#ff9900]'
                    : 'border-white/[0.06] bg-white/[0.035] text-[#9ba3af] hover:border-[#ff9900]/30 hover:text-white'
                )}
              >
                {name}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

function SectionHeader(props: {
  label: string
  title: React.ReactNode
  description: string
  centered?: boolean
}) {
  return (
    <FadeIn className={props.centered ? 'text-center' : undefined}>
      <div className={cn('hx-section-label', props.centered && 'justify-center')}>
        {props.label}
      </div>
      <h2 className='text-3xl leading-tight font-black tracking-normal text-white md:text-[42px]'>
        {props.title}
      </h2>
      <p
        className={cn(
          'mt-4 max-w-3xl text-base leading-8 text-[#9ba3af]',
          props.centered && 'mx-auto'
        )}
      >
        {props.description}
      </p>
    </FadeIn>
  )
}

function ModelsSection() {
  return (
    <section id='models' className='bg-[#0d1017] px-5 py-24 md:px-12'>
      <div className='mx-auto max-w-[1240px]'>
        <SectionHeader
          centered
          label='模型矩阵'
          title={<>六大主流 AI 大模型 <span className='text-[#ff9900]'>核心能力速览</span></>}
          description='持续跟进全球模型迭代，统一接入与治理，让团队优先享受前沿 AI 能力，并保持成本和稳定性可控。'
        />
        <div className='mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
          {modelCards.map((model, index) => (
            <FadeIn
              key={model.name}
              delay={index % 3 === 0 ? 'd1' : index % 3 === 1 ? 'd2' : 'd3'}
              className={cn(
                'relative flex min-h-[310px] flex-col overflow-hidden rounded-2xl border bg-[#111318] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#ff9900]/25 hover:shadow-2xl hover:shadow-black/35',
                model.featured
                  ? 'border-[#ff9900]/35 bg-[linear-gradient(180deg,rgba(255,153,0,0.06),#111318_42%)] before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[linear-gradient(90deg,#cc7a00,#ffb84d)]'
                  : 'border-white/[0.06]'
              )}
            >
              {model.badge && (
                <span className='absolute top-4 right-4 rounded border border-[#ff9900]/20 bg-[#ff9900]/10 px-2 py-1 text-[10px] font-bold tracking-[0.1em] text-[#ff9900]'>
                  {model.badge}
                </span>
              )}
              <div className='mb-5 flex items-center gap-4'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.05] text-lg font-black text-[#ff9900]'>
                  {model.mark}
                </div>
                <div>
                  <h3 className='text-lg font-extrabold text-white'>{model.name}</h3>
                  <p className='mt-0.5 text-xs tracking-wide text-[#6b7280]'>{model.vendor}</p>
                </div>
              </div>
              <div className='mb-3 inline-flex w-fit items-center gap-1.5 rounded border border-emerald-400/15 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-400'>
                <span className='text-[7px]'>●</span>
                {model.version}
              </div>
              <p className='mb-5 flex-1 text-sm leading-7 text-[#9ba3af]'>
                {model.description}
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {model.tags.map((tag, tagIndex) => (
                  <span
                    key={tag}
                    className={cn(
                      'rounded border px-2 py-1 text-xs font-semibold',
                      tagIndex < 2
                        ? 'border-[#ff9900]/15 bg-[#ff9900]/10 text-[#ff9900]'
                        : 'border-white/[0.06] bg-white/[0.04] text-[#9ba3af]'
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function CompareSection() {
  return (
    <section id='compare' className='bg-[#0a0c10] px-5 py-20 md:px-12'>
      <div className='mx-auto max-w-[1240px]'>
        <SectionHeader
          centered
          label='选型指南'
          title={<>六大模型 <span className='text-[#ff9900]'>快速选型对比</span></>}
          description='一张表看懂各模型核心优势与最佳适用场景，精准匹配您的业务需求。'
        />
        <FadeIn delay='d1' className='mt-12 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111318]'>
          <div className='overflow-x-auto'>
            <table className='min-w-[900px] w-full border-collapse text-left text-sm'>
              <thead>
                <tr className='border-b border-[#ff9900]/15 bg-[#ff9900]/10 text-xs font-bold tracking-[0.12em] text-[#ff9900] uppercase'>
                  <th className='px-5 py-4'>模型方案</th>
                  <th className='px-5 py-4'>核心优势</th>
                  <th className='px-5 py-4'>最佳适用场景</th>
                  <th className='px-5 py-4'>成本档位</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map(([name, strength, scenario, cost], index) => (
                  <tr
                    key={name}
                    className='border-b border-white/[0.06] transition last:border-0 hover:bg-[#ff9900]/[0.03]'
                  >
                    <td className='px-5 py-4 font-semibold text-white'>
                      <span className='mr-2 inline-flex size-5 items-center justify-center rounded bg-white/[0.06] text-[10px] text-[#ff9900]'>
                        {name[0]}
                      </span>
                      {name}
                      {index === 0 && (
                        <span className='ml-2 rounded border border-[#ff9900]/20 bg-[#ff9900]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#ff9900]'>
                          主推
                        </span>
                      )}
                    </td>
                    <td className='px-5 py-4 leading-7 text-[#9ba3af]'>{strength}</td>
                    <td className='px-5 py-4 leading-7 text-[#9ba3af]'>{scenario}</td>
                    <td className='px-5 py-4'>
                      <span
                        className={cn(
                          'rounded px-2 py-1 text-xs font-bold',
                          cost === '低'
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : cost === '偏高'
                              ? 'bg-red-400/10 text-red-400'
                              : 'bg-[#ff9900]/10 text-[#ff9900]'
                        )}
                      >
                        {cost}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

function EcosystemSection() {
  return (
    <section id='ecosystem' className='bg-[#0d1017] px-5 py-20 md:px-12'>
      <div className='mx-auto max-w-[1240px]'>
        <SectionHeader
          centered
          label='深度适配'
          title={<>模型 + 生态 + 场景 <span className='text-[#ff9900]'>核心价值拆解</span></>}
          description='不只是简单调用模型，而是把模型能力、供应商生态和真实业务场景放进同一套可运营体系。'
        />
        <div className='mt-12 grid gap-5 lg:grid-cols-2'>
          {ecoCards.map((card, index) => (
            <FadeIn
              key={card.title}
              delay={index === 0 ? 'd1' : index === 1 ? 'd2' : 'd3'}
              className={cn(
                'rounded-2xl border border-white/[0.06] bg-[#111318] p-7 transition hover:-translate-y-1 hover:border-[#ff9900]/25',
                card.wide && 'lg:col-span-2'
              )}
            >
              <h3 className='mb-3 flex items-center gap-3 text-lg font-extrabold text-white'>
                <span className='text-[#ff9900]'>◆</span>
                {card.title}
              </h3>
              <p className='text-sm leading-8 text-[#9ba3af]'>{card.description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function AdvantagesSection() {
  return (
    <section id='advantages' className='bg-[#0a0c10] px-5 py-20 md:px-12'>
      <div className='mx-auto max-w-[1240px]'>
        <SectionHeader
          centered
          label='核心优势'
          title={<>为什么选择 <span className='text-[#ff9900]'>寰星云科</span></>}
          description='区别于单一模型接口服务，我们提供多模型聚合、统一网关和全链路 AI 运营能力。'
        />
        <div className='mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
          {advantages.map(([num, title, description], index) => (
            <FadeIn
              key={num}
              delay={index % 3 === 0 ? 'd1' : index % 3 === 1 ? 'd2' : 'd3'}
              className='group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111318] p-7 transition hover:-translate-y-1 hover:border-[#ff9900]/25 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[linear-gradient(90deg,#cc7a00,#ffb84d)] before:opacity-0 before:transition group-hover:before:opacity-100'
            >
              <div className='mb-2 text-4xl leading-none font-black text-[#ff9900]/20'>
                {num}
              </div>
              <h3 className='mb-3 text-lg font-extrabold text-white'>{title}</h3>
              <p className='text-sm leading-7 text-[#9ba3af]'>{description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function HomeFooter() {
  return (
    <footer className='border-t border-white/[0.06] bg-[#0a0c10] px-5 py-12 text-[#9ba3af] md:px-12'>
      <div className='mx-auto grid max-w-[1240px] gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]'>
        <div>
          <div className='mb-3 text-xl font-black text-white'>
            寰星<span className='text-[#ff9900]'>云科</span>
          </div>
          <p className='max-w-sm text-sm leading-7 text-[#6b7280]'>
            面向企业和开发者的 AI 模型聚合网关，提供统一接入、计费、路由、安全和运营能力。
          </p>
          <div className='mt-3 text-xs font-bold tracking-[0.12em] text-[#ff9900]'>
            AI MODEL GATEWAY
          </div>
        </div>
        <div>
          <h4 className='mb-3 text-sm font-bold text-white'>产品专区</h4>
          <div className='grid gap-2 text-sm text-[#6b7280]'>
            <a href='#models' className='hover:text-[#ff9900]'>Claude</a>
            <a href='#models' className='hover:text-[#ff9900]'>ChatGPT</a>
            <a href='#models' className='hover:text-[#ff9900]'>Gemini</a>
            <a href='#models' className='hover:text-[#ff9900]'>DeepSeek</a>
          </div>
        </div>
        <div>
          <h4 className='mb-3 text-sm font-bold text-white'>解决方案</h4>
          <div className='grid gap-2 text-sm text-[#6b7280]'>
            <a href='#compare' className='hover:text-[#ff9900]'>模型选型</a>
            <a href='#ecosystem' className='hover:text-[#ff9900]'>企业接入</a>
            <a href='#advantages' className='hover:text-[#ff9900]'>成本治理</a>
          </div>
        </div>
        <div>
          <h4 className='mb-3 text-sm font-bold text-white'>联系方式</h4>
          <a className='text-sm text-[#6b7280] hover:text-[#ff9900]' href='mailto:support@huanxing.com'>
            support@huanxing.com
          </a>
        </div>
      </div>
      <div className='mx-auto mt-9 flex max-w-[1240px] flex-col justify-between gap-3 border-t border-white/[0.06] pt-5 text-xs text-[#6b7280] md:flex-row'>
        <span>© 2026 huanxing · All Rights Reserved · 以 AI 驱动的模型网关服务平台</span>
        <span className='flex gap-2'>
          <span className='rounded border border-white/[0.06] px-2 py-1'>统一网关 ✓</span>
          <span className='rounded border border-white/[0.06] px-2 py-1'>多模型聚合 ✓</span>
          <span className='rounded border border-white/[0.06] px-2 py-1'>7×24 监控 ✓</span>
        </span>
      </div>
    </footer>
  )
}

function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type='button'
      aria-label='Scroll to top'
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed right-7 bottom-7 z-50 flex size-11 items-center justify-center rounded-full bg-[#ff9900] text-black shadow-xl shadow-black/30 transition',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      )}
    >
      <ChevronUp className='size-5' />
    </button>
  )
}

function LandingStyles() {
  return (
    <style>{`
      html { scroll-behavior: smooth; }
      .hx-page {
        --hx-orange: #ff9900;
        --hx-orange-light: #ffb84d;
        font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
      }
      .hx-page ::selection { background: rgba(255, 153, 0, 0.28); }
      .hx-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,153,0,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,153,0,0.045) 1px, transparent 1px);
        background-size: 56px 56px;
        mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 10%, transparent 75%);
      }
      .hx-hero::after {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse 70% 55% at 65% 45%, rgba(255,153,0,0.07) 0%, transparent 65%),
          radial-gradient(ellipse 40% 30% at 15% 70%, rgba(255,153,0,0.04) 0%, transparent 55%);
      }
      .hx-orange-gradient {
        background: linear-gradient(90deg, #ff9900 0%, #ffb84d 60%, #ffd280 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .hx-btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 8px;
        background: #ff9900;
        color: #000;
        padding: 14px 32px;
        font-size: 16px;
        font-weight: 800;
        transition: all 0.25s ease;
      }
      .hx-btn-primary:hover {
        transform: translateY(-2px);
        background: #ffb84d;
        box-shadow: 0 10px 32px rgba(255,153,0,0.35);
      }
      .hx-btn-ghost {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.06);
        color: #f0f2f5;
        padding: 14px 32px;
        font-size: 16px;
        font-weight: 700;
        transition: all 0.25s ease;
      }
      .hx-btn-ghost:hover { border-color: rgba(255,153,0,0.4); color: #ff9900; }
      .hx-section-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        color: #ff9900;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      .hx-section-label::before {
        content: '';
        width: 18px;
        height: 2px;
        background: #ff9900;
      }
      .hx-fu {
        opacity: 0;
        transform: translateY(28px);
        animation: hxFadeUp 0.72s ease forwards;
      }
      .hx-fu.d1 { animation-delay: 0.1s; }
      .hx-fu.d2 { animation-delay: 0.2s; }
      .hx-fu.d3 { animation-delay: 0.3s; }
      .hx-fu.d4 { animation-delay: 0.4s; }
      @keyframes hxFadeUp {
        to { opacity: 1; transform: translateY(0); }
      }
      .hx-input {
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 8px;
        background: rgba(255,255,255,0.03);
        padding: 12px 14px;
        color: #f0f2f5;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s ease;
      }
      .hx-input::placeholder { color: #6b7280; }
      .hx-input:focus { border-color: rgba(255,153,0,0.45); }
      @media (prefers-reduced-motion: reduce) {
        .hx-fu { opacity: 1; transform: none; animation: none; }
        .hx-btn-primary:hover, .hx-btn-ghost:hover { transform: none; }
      }
    `}</style>
  )
}

function DefaultLanding() {
  return (
    <div className='hx-page min-h-screen overflow-x-hidden bg-[#0a0c10] text-[#f0f2f5]'>
      <LandingStyles />
      <main>
        <HeroSection />
        <ModelsSection />
        <CompareSection />
        <EcosystemSection />
        <AdvantagesSection />
      </main>
      <HomeFooter />
      <ScrollTopButton />
    </div>
  )
}

export function Home() {
  const { t } = useTranslation()
  const { content, isLoaded, isUrl } = useHomePageContent()

  if (!isLoaded) {
    return (
      <PublicLayout
        showMainContainer={false}
        headerProps={{ className: 'hidden' }}
      >
        <main className='flex min-h-screen items-center justify-center'>
          <div className='text-muted-foreground'>{t('Loading...')}</div>
        </main>
      </PublicLayout>
    )
  }

  if (content) {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='overflow-x-hidden'>
          {isUrl ? (
            <iframe
              src={content}
              className='h-screen w-full border-none'
              title={t('Custom Home Page')}
            />
          ) : (
            <div className='container mx-auto py-8'>
              <Markdown className='custom-home-content'>{content}</Markdown>
            </div>
          )}
        </main>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout
      showMainContainer={false}
      showAuthButtons={false}
      showThemeSwitch={false}
      showNotifications={false}
      headerProps={{
        className:
          'border-white/[0.06] bg-[#0a0c10]/90 text-white backdrop-blur-xl [&_.text-muted-foreground]:text-[#9ba3af]',
      }}
    >
      <DefaultLanding />
    </PublicLayout>
  )
}
