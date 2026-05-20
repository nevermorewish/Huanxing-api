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
      '具备业界顶尖的逻辑推理与长上下文代码库理解力，完美胜任核心系统全栈生成、庞大老旧系统架构重构、深层复杂 Bug 溯源及自动化工程文档输出，是企业研发团队全栈提效的超级工程师。',
    tags: ['全栈开发', '架构重构', '深层排障', '系统迁移', '研发提效'],
  },
  {
    name: 'ChatGPT',
    vendor: 'OpenAI',
    version: 'GPT-5.5',
    badge: '',
    featured: false,
    mark: 'G',
    description:
      '综合指令跟随、外部工具调度与多模态交互能力极度均衡，作为业界标杆级的全能引擎，适合充当平台级智能中枢，驱动复杂业务逻辑自动化执行与跨系统生产力闭环。',
    tags: ['指令遵循', '工具调用', '多模交互', '业务闭环', '智能中枢'],
  },
  {
    name: 'Gemini',
    vendor: 'Google',
    version: 'Gemini Pro',
    badge: '',
    featured: false,
    mark: 'M',
    description:
      '依托原生多模态架构与超大容量上下文窗口，彻底打破文本与视音频的边界，极其擅长复杂视频流深度解析、多维商业图表交叉推理以及海量资料的跨文件跨维度检索推演。',
    tags: ['原生多模', '视听解析', '长窗检索', '图表推理', '跨维协同'],
  },
  {
    name: 'DeepSeek',
    vendor: 'DeepSeek',
    version: 'deepseekv4-pro / deepseekv4-flash',
    badge: '',
    featured: false,
    mark: 'D',
    description:
      '兼具硬核数理逻辑与极致的算力消耗性价比，在处理大规模并发任务时表现极佳，是支撑企业级 RAG 知识库构建、高阶逻辑计算、海量文本批量结构化分类的首选底座。',
    tags: ['深度推理', '高阶计算', 'RAG 增强', '批量分类', '高性价比'],
  },
  {
    name: '混元',
    vendor: 'Tencent',
    version: 'Hunyuan',
    badge: '',
    featured: false,
    mark: 'H',
    description:
      '拥有深度定制的中文语境理解力与极高的合规标准，能够以极低成本无缝打通企业微信庞大生态，完美适配高标准业务内容安全审核、私域金牌客服与企业内部智能办公助理场景。',
    tags: ['中文办公', '私域运营', '合规审核', '生态集成', '营销裂变'],
  },
  {
    name: '豆包',
    vendor: 'ByteDance',
    version: 'Doubao / Seed',
    badge: '',
    featured: false,
    mark: 'D',
    description:
      '具备极速灵动的响应效率与网感极佳的自然语言交互体验，专为短平快的内容井喷时代设计，极其适合爆款短视频脚本生成、高转化直播话术输出与电商平台的高频种草场景。',
    tags: ['极速响应', '爆款脚本', '直播话术', '电商种草', '高频创作'],
  },
] as const

const compareRows = [
  ['Claude', '具备顶尖的复杂工程推理与长篇代码洞察力，全栈攻坚表现优异', '核心业务系统研发、老旧架构无缝重构、底层深层排障与全栈代码生成', '偏高'],
  ['ChatGPT', '综合能力底座，指令遵循与外部工具调度高度均衡，稳居业界标杆', '驱动复杂业务自动化流转、高难度数据洞察中枢与全能型智能助理', '中高'],
  ['Gemini', '依托强大原生多模态引擎，音视频解析与超大视窗跨维处理能力出众', '复杂音视频流深度解析、商业图表交叉推理与海量跨文件综合推演', '中高'],
  ['DeepSeek', '硬核数理与逻辑推演能力，从容应对大规模高并发请求，兼顾极优性价比', '高并发企业级 RAG 知识库搭建、深度逻辑计算与海量数据批量分类', '中等'],
  ['混元', '极高标准契合企业合规要求，深度理解中文业务语境，原生打通企微链路', '腾讯生态无缝集成、企业级智能办公协同、私域金牌客服与内容审核', '中等'],
  ['豆包', '极速的内容生成响应效率，自然交互网感极佳，高度契合短平快新媒体', '爆款短视频脚本撰写、高转化电商直播话术、高频矩阵式轻量化种草', '低'],
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
    <section id='hero' className='hx-hero relative flex min-h-[78vh] items-center overflow-hidden bg-[#f7f8fb] pt-[88px] text-[#111318] dark:bg-[#0a0c10] dark:text-white'>
      <div className='relative z-10 mx-auto w-full max-w-[1240px] px-5 py-16 text-center md:px-12'>
        <FadeIn>
          <div className='mb-7 inline-flex items-center gap-2 rounded-full border border-[#ff9900]/25 bg-[#ff9900]/10 px-4 py-1.5 text-xs font-bold tracking-[0.12em] text-[#ff9900]'>
            <span className='text-[10px]'>◆</span>
            寰星云科 AI 聚合平台
          </div>
          <h1 className='mx-auto max-w-5xl text-4xl leading-[1.14] font-black tracking-normal text-[#111318] md:text-6xl dark:text-white'>
            一站式全品类
            <span className='hx-orange-gradient'> AI 大模型聚合服务</span>
          </h1>
          <p className='mx-auto mt-5 max-w-3xl text-base leading-8 text-[#4b5563] md:text-lg dark:text-[#9ba3af]'>
            聚合 Claude、ChatGPT、Gemini、DeepSeek、混元、豆包等主流模型，统一接口、统一计费、统一路由，
            为企业 AI 应用提供稳定、可控、可运营的接入底座。
          </p>
          <div className='mt-9 flex flex-wrap justify-center gap-3'>
            <a href='/dashboard/overview' className='hx-btn-primary'>
              进入控制台 <ArrowRight className='size-4' />
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
                    : 'border-slate-200 bg-white text-[#4b5563] hover:border-[#ff9900]/30 hover:text-[#111318] dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-[#9ba3af] dark:hover:text-white'
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
      <h2 className='text-3xl leading-tight font-black tracking-normal text-[#111318] dark:text-white md:text-[42px]'>
        {props.title}
      </h2>
      <p
        className={cn(
          'mt-4 max-w-3xl text-base leading-8 text-[#4b5563] dark:text-[#9ba3af]',
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
    <section id='models' className='bg-[#ffffff] px-5 py-24 dark:bg-[#0d1017] md:px-12'>
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
                'relative flex min-h-[310px] flex-col overflow-hidden rounded-2xl border bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#ff9900]/25 hover:shadow-2xl hover:shadow-slate-200/70 dark:bg-[#111318] dark:shadow-none dark:hover:shadow-black/35',
                model.featured
                  ? 'border-[#ff9900]/35 bg-[linear-gradient(180deg,rgba(255,153,0,0.08),#fff_42%)] before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[linear-gradient(90deg,#cc7a00,#ffb84d)] dark:bg-[linear-gradient(180deg,rgba(255,153,0,0.06),#111318_42%)]'
                  : 'border-slate-200 dark:border-white/[0.06]'
              )}
            >
              {model.badge && (
                <span className='absolute top-4 right-4 rounded border border-[#ff9900]/20 bg-[#ff9900]/10 px-2 py-1 text-[10px] font-bold tracking-[0.1em] text-[#ff9900]'>
                  {model.badge}
                </span>
              )}
              <div className='mb-5 flex items-center gap-4'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#fff7ed] text-lg font-black text-[#ff9900] dark:border-white/[0.06] dark:bg-white/[0.05]'>
                  {model.mark}
                </div>
                <div>
                  <h3 className='text-lg font-extrabold text-[#111318] dark:text-white'>{model.name}</h3>
                  <p className='mt-0.5 text-xs tracking-wide text-[#6b7280] dark:text-[#6b7280]'>{model.vendor}</p>
                </div>
              </div>
              <div className='mb-3 inline-flex w-fit items-center gap-1.5 rounded border border-emerald-400/15 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-400'>
                <span className='text-[7px]'>●</span>
                {model.version}
              </div>
              <p className='mb-5 flex-1 text-sm leading-7 text-[#4b5563] dark:text-[#9ba3af]'>
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
                        : 'border-slate-200 bg-slate-50 text-[#4b5563] dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-[#9ba3af]'
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
    <section id='compare' className='bg-[#f7f8fb] px-5 py-20 dark:bg-[#0a0c10] md:px-12'>
      <div className='mx-auto max-w-[1240px]'>
        <SectionHeader
          centered
          label='选型指南'
          title={<>六大模型 <span className='text-[#ff9900]'>快速选型对比</span></>}
          description='一张表看懂各模型核心优势与最佳适用场景，精准匹配您的业务需求。'
        />
        <FadeIn delay='d1' className='mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111318] dark:shadow-none'>
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
                    className='border-b border-slate-200 transition last:border-0 hover:bg-[#ff9900]/[0.03] dark:border-white/[0.06]'
                  >
                    <td className='px-5 py-4 font-semibold text-[#111318] dark:text-white'>
                      <span className='mr-2 inline-flex size-5 items-center justify-center rounded bg-slate-100 text-[10px] text-[#ff9900] dark:bg-white/[0.06]'>
                        {name[0]}
                      </span>
                      {name}
                      {index === 0 && (
                        <span className='ml-2 rounded border border-[#ff9900]/20 bg-[#ff9900]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#ff9900]'>
                          主推
                        </span>
                      )}
                    </td>
                    <td className='px-5 py-4 leading-7 text-[#4b5563] dark:text-[#9ba3af]'>{strength}</td>
                    <td className='px-5 py-4 leading-7 text-[#4b5563] dark:text-[#9ba3af]'>{scenario}</td>
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
    <section id='ecosystem' className='bg-[#ffffff] px-5 py-20 dark:bg-[#0d1017] md:px-12'>
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
                'rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[#ff9900]/25 dark:border-white/[0.06] dark:bg-[#111318] dark:shadow-none',
                card.wide && 'lg:col-span-2'
              )}
            >
              <h3 className='mb-3 flex items-center gap-3 text-lg font-extrabold text-[#111318] dark:text-white'>
                <span className='text-[#ff9900]'>◆</span>
                {card.title}
              </h3>
              <p className='text-sm leading-8 text-[#4b5563] dark:text-[#9ba3af]'>{card.description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function AdvantagesSection() {
  return (
    <section id='advantages' className='bg-[#f7f8fb] px-5 py-20 dark:bg-[#0a0c10] md:px-12'>
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
              className='group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[#ff9900]/25 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[linear-gradient(90deg,#cc7a00,#ffb84d)] before:opacity-0 before:transition group-hover:before:opacity-100 dark:border-white/[0.06] dark:bg-[#111318] dark:shadow-none'
            >
              <div className='mb-2 text-4xl leading-none font-black text-[#ff9900]/20'>
                {num}
              </div>
              <h3 className='mb-3 text-lg font-extrabold text-[#111318] dark:text-white'>{title}</h3>
              <p className='text-sm leading-7 text-[#4b5563] dark:text-[#9ba3af]'>{description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function HomeFooter() {
  return (
    <footer className='border-t border-slate-200 bg-white px-5 py-12 text-[#4b5563] dark:border-white/[0.06] dark:bg-[#0a0c10] dark:text-[#9ba3af] md:px-12'>
      <div className='mx-auto max-w-[1240px] text-center'>
        <div>
          <div className='mb-3 text-xl font-black text-[#111318] dark:text-white'>
            寰星<span className='text-[#ff9900]'>云科</span>
          </div>
          <p className='mx-auto max-w-sm text-sm leading-7 text-[#4b5563] dark:text-[#6b7280]'>
            面向企业和开发者的 AI 模型聚合网关，提供统一接入、计费、路由、安全和运营能力。
          </p>
          <div className='mt-3 text-xs font-bold tracking-[0.12em] text-[#ff9900]'>
            AI MODEL GATEWAY
          </div>
        </div>
      </div>
      <div className='mx-auto mt-9 flex max-w-[1240px] flex-col justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-[#6b7280] dark:border-white/[0.06] md:flex-row'>
        <span>© 2026 huanxing · All Rights Reserved · 以 AI 驱动的模型网关服务平台</span>
        <span className='flex gap-2'>
          <span className='rounded border border-slate-200 px-2 py-1 dark:border-white/[0.06]'>统一网关 ✓</span>
          <span className='rounded border border-slate-200 px-2 py-1 dark:border-white/[0.06]'>多模型聚合 ✓</span>
          <span className='rounded border border-slate-200 px-2 py-1 dark:border-white/[0.06]'>7×24 监控 ✓</span>
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
        border: 1px solid rgba(17,19,24,0.16);
        background: rgba(255,255,255,0.72);
        color: #111318;
        padding: 14px 32px;
        font-size: 16px;
        font-weight: 700;
        box-shadow: 0 8px 28px rgba(15,23,42,0.08);
        transition: all 0.25s ease;
      }
      .dark .hx-btn-ghost {
        border-color: rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.035);
        color: #f0f2f5;
        box-shadow: none;
      }
      .hx-btn-ghost:hover {
        border-color: rgba(255,153,0,0.45);
        background: rgba(255,153,0,0.08);
        color: #cc7a00;
        transform: translateY(-2px);
      }
      .dark .hx-btn-ghost:hover { color: #ff9900; }
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
    <div className='hx-page min-h-screen overflow-x-hidden bg-[#f7f8fb] text-[#111318] dark:bg-[#0a0c10] dark:text-[#f0f2f5]'>
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
      showThemeSwitch
      showNotifications={false}
    >
      <DefaultLanding />
    </PublicLayout>
  )
}
