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
import { useState } from 'react'
import { Apple, MonitorDown } from 'lucide-react'
import { useStatus } from '@/hooks/use-status'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'

const DEFAULT_BRAND = '快码CLAW'

const features = [
  {
    tag: '核心优势',
    icon: '🔥',
    title: '100% 满血版 OpenClaw',
    description:
      '完整 OpenClaw 底层架构，跟随官方更新，享受最新技术和海量技能生态',
  },
  {
    tag: '快速上手',
    icon: '⚡',
    title: '一键安装 开箱即用',
    description:
      '告别繁杂的命令行环境配置。精美 GUI 客户端，双击即用，3 分钟快速上手',
  },
  {
    tag: '远程操控',
    icon: '📱',
    title: '微信/企业微信/QQ/飞书/钉钉',
    description: '完美打通主流通讯工具，远程指挥AI干活，全自动出结果',
  },
  {
    tag: '功能强大',
    icon: '🔒',
    title: '本地部署 更全能',
    description:
      '本地部署让AI拥有操控电脑的能力，远非云端可比，生成内容留存电脑磁盘',
  },
  {
    tag: '智能进化',
    icon: '🧠',
    title: '长记忆系统',
    description: '内置专属长记忆系统，AI 能记住历史语境和你的偏好，越用越懂你',
  },
  {
    tag: '全天候运行',
    icon: '⏰',
    title: '7×24h 不间断托管',
    description:
      '从单次指令到复杂计划，自然语言下发任务即可，系统自动执行，完成后汇报结果',
  },
]

const localDeployReasons = [
  {
    icon: '🔐',
    title: '操控电脑更全能',
    description:
      '直接接管本地任务：文件批量整理、软件自动化运行、跨程序协同操作，让电脑做的事，它都能精准落地，AI变成真正生产力。',
  },
  {
    icon: '⚡',
    title: '响应更迅速',
    description: '本地处理减少网络传输，指令执行更迅速，体验更流畅。',
  },
  {
    icon: '🎯',
    title: '降低成本',
    description: '无需云端复杂的服务器配置和管理工作，也无需服务器费用',
  },
  {
    icon: '🛡️',
    title: '安全少担忧',
    description:
      '聊天记录、生成结果、操作历史全部本地保存，无需担忧服务器中毒等问题',
  },
]

const scenarios = [
  {
    id: 'work',
    tab: '💼 工作效率',
    items: [
      {
        icon: '📰',
        title: '热点资讯自动汇总',
        description:
          '还在一条条刷资讯？每日自动整理，不用费心查找，快速看懂当天重点',
      },
      {
        icon: '🧾',
        title: '发票/单据智能归档',
        description:
          '一到月末报销就火急火燎？把你桌面上那堆发票烂摊子全甩给我吧',
      },
      {
        icon: '📅',
        title: '日程安排/任务跟踪与提醒',
        description:
          '每天任务太多，安排不过来怎么办？帮你管日程、盯进度、到点喊你',
      },
      {
        icon: '💡',
        title: '创业点子可行性验证',
        description: '有想法不敢下手？帮你快速验证可行性，零成本少踩坑',
      },
      {
        icon: '📊',
        title: '市场调研：痛点自动挖掘分析',
        description: '立项没方向？自动深挖市场痛点，一份报告帮你稳过评审',
      },
      {
        icon: '📁',
        title: '把一堆资料整理成结构化文档',
        description:
          '收藏夹塞满了却从没看？把资料链接发给我，帮你提炼出有用的东西',
      },
    ],
  },
  {
    id: 'learning',
    tab: '📚 学习成长',
    items: [
      {
        icon: '📋',
        title: '制定轻量学习规划',
        description: '一到备考就头大？把你的学习计划烂摊子全甩给我吧',
      },
      {
        icon: '✅',
        title: '拆解学习目标与督促打卡',
        description: '单词背了就忘？每天帮你盯进度，到点就催你学',
      },
      {
        icon: '🧠',
        title: '知识点框架梳理',
        description: '看书越看越乱？帮你把知识点理成一张清晰骨架图',
      },
      {
        icon: '📖',
        title: '深度内容讲解',
        description: '遇到难题卡壳想放弃？帮你拆解卡点，找到破局思路',
      },
      {
        icon: '📑',
        title: '每日研究简报',
        description: '漏掉重要论文和行业报告？每天帮你盯着，关键信息一条不漏',
      },
    ],
  },
  {
    id: 'life',
    tab: '🎬 生活娱乐',
    items: [
      {
        icon: '✈️',
        title: '懒人出游规划',
        description: '周末不知道去哪玩？直接喂到你嘴边',
      },
      {
        icon: '🌙',
        title: '深夜情绪疏导与陪伴',
        description: '深夜孤独感爆发，想说话却怕打扰人？我陪你聊到天亮',
      },
      {
        icon: '⭐',
        title: '每日星座行动建议',
        description: '每日星座专属指引，规划当日行动',
      },
      {
        icon: '🔮',
        title: '趣味塔罗小指引',
        description: '心中有小纠结？塔罗趣味抽牌，给你轻松小参考',
      },
      {
        icon: '☯️',
        title: '生辰趣味解读',
        description: '输入生辰，解锁传统命理文化趣味解读',
      },
      {
        icon: '💕',
        title: 'MBTI 配对分析',
        description: '想知道合不合？帮你分析性格契合度',
      },
      {
        icon: '🎬',
        title: '影视推荐小助手',
        description: '周末不知道看啥？按口味精准推荐，片源直接给到',
      },
    ],
  },
  {
    id: 'health',
    tab: '💪 健康管理',
    items: [
      {
        icon: '🏀',
        title: '明日运动计划',
        description: '想运动又怕坚持不下来？每天帮你排好计划，到点喊你动起来',
      },
      {
        icon: '🍜',
        title: '每日吃什么推荐',
        description: '饭点不知道吃啥？报口味定位，健康餐单连店带路喂到嘴边',
      },
      {
        icon: '🏋️',
        title: '锻炼任务调整',
        description: '锻炼计划乱了？帮你重新安排锻炼节奏',
      },
    ],
  },
]

function normalizeSetting(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function DownloadLink({
  href,
  children,
  primary,
}: {
  href?: string
  children: React.ReactNode
  primary?: boolean
}) {
  const className = [
    'inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold shadow-[0_8px_25px_rgba(224,86,69,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(224,86,69,0.36)]',
    primary
      ? 'bg-[#e05645] text-white hover:bg-[#c94536]'
      : 'border-2 border-[#e05645] bg-white text-[#e05645] hover:bg-[#e05645] hover:text-white dark:bg-[#111318] dark:hover:bg-[#e05645]',
  ].join(' ')

  if (!href) {
    return (
      <button type='button' aria-disabled='true' className={className}>
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

export function OpenClaw() {
  const { status } = useStatus()
  const [activeScenario, setActiveScenario] = useState(scenarios[0].id)

  const brand = normalizeSetting(status?.openclaw_brand_name) || DEFAULT_BRAND
  const windowsUrl = normalizeSetting(status?.openclaw_windows_url)
  const macArmUrl = normalizeSetting(status?.openclaw_mac_arm_url)
  const macIntelUrl = normalizeSetting(status?.openclaw_mac_intel_url)
  const activeScenarioData =
    scenarios.find((scenario) => scenario.id === activeScenario) ?? scenarios[0]

  return (
    <PublicLayout
      showMainContainer={false}
      showThemeSwitch
      showNotifications={false}
    >
      <main className='min-h-screen overflow-hidden bg-[#faf8f6] font-sans text-[#1a1a1a] dark:bg-[#0a0c10] dark:text-white'>
        <section className='relative px-6 pt-20 pb-20 sm:pt-24 lg:pt-28'>
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,168,108,0.22),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(224,86,69,0.16),transparent_26%)]' />
          <div className='relative mx-auto max-w-[1200px] text-center'>
            <div className='mb-8 inline-flex items-center rounded-full border border-[#e8ddd4] bg-white/80 px-5 py-2.5 text-sm font-semibold text-[#e05645] shadow-[0_6px_24px_rgba(90,61,45,0.08)] backdrop-blur dark:border-white/[0.08] dark:bg-white/[0.06] dark:shadow-none'>
              🔥 一键安装的 AI 助手，直接操控你的电脑
            </div>
            <h1 className='mx-auto max-w-5xl text-[44px] leading-[1.08] font-black text-[#1a1a1a] sm:text-[64px] lg:text-[88px] dark:text-white'>
              3 分钟用上
              <span className='block bg-gradient-to-r from-[#e05645] via-[#f57b6c] to-[#f9a86c] bg-clip-text text-transparent'>
                小龙虾
              </span>
            </h1>
            <p className='mx-auto mt-8 max-w-3xl text-lg leading-8 text-[#5f5752] sm:text-xl dark:text-[#9ba3af]'>
              一键安装 OpenClaw，本地部署直接干活。专为职场用户打造的 AI
              牛马，OpenClaw 技能生态，7×24 小时不间断运行。
            </p>

            <div className='mt-10 flex flex-wrap justify-center gap-4'>
              <DownloadLink href={windowsUrl} primary>
                <MonitorDown className='size-5' />
                Windows 下载
              </DownloadLink>
              <DownloadLink href={macArmUrl}>
                <Apple className='size-5' />
                Mac M系列 下载
              </DownloadLink>
              <DownloadLink href={macIntelUrl}>
                <Apple className='size-5' />
                Mac Intel 下载
              </DownloadLink>
            </div>

            <div className='mx-auto mt-16 grid max-w-4xl gap-5 sm:grid-cols-3'>
              {[
                ['100%', 'OpenClaw 内核'],
                ['3 分钟', '快速上手'],
                ['本地部署', '直接操控电脑'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className='rounded-2xl border border-[#eee5dc] bg-white/85 px-6 py-7 shadow-[0_10px_35px_rgba(90,61,45,0.08)] dark:border-white/[0.08] dark:bg-[#111318]/85 dark:shadow-none'
                >
                  <div className='text-4xl font-black text-[#e05645]'>
                    {value}
                  </div>
                  <div className='mt-2 text-sm font-semibold text-[#6c625c] dark:text-[#9ba3af]'>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='bg-white px-6 py-20 dark:bg-[#0d1017]'>
          <div className='mx-auto max-w-[1200px]'>
            <div className='mx-auto mb-14 max-w-3xl text-center'>
              <h2 className='text-4xl leading-tight font-black sm:text-5xl'>
                为什么选择 {brand}
              </h2>
              <p className='mt-4 text-lg text-[#6c625c] dark:text-[#9ba3af]'>
                100% 满血版 OpenClaw，更多本地化优化
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className='rounded-2xl border border-[#eee5dc] bg-white p-7 shadow-[0_8px_30px_rgba(90,61,45,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(90,61,45,0.12)] dark:border-white/[0.08] dark:bg-[#111318] dark:shadow-none'
                >
                  <div className='mb-5 flex items-center gap-4'>
                    <div className='grid size-14 place-items-center rounded-2xl bg-[#fff2ec] text-3xl dark:bg-[#321b17]'>
                      {feature.icon}
                    </div>
                    <span className='rounded-full bg-[#fff2ec] px-3 py-1 text-xs font-bold text-[#e05645] dark:bg-[#321b17]'>
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className='text-xl font-black text-[#1a1a1a] dark:text-white'>
                    {feature.title}
                  </h3>
                  <p className='mt-4 text-[15px] leading-7 text-[#6c625c] dark:text-[#9ba3af]'>
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='bg-[#f0ebe5] px-6 py-20 dark:bg-[#0a0c10]'>
          <div className='mx-auto max-w-[1200px]'>
            <div className='mx-auto mb-14 max-w-3xl text-center'>
              <h2 className='text-4xl leading-tight font-black sm:text-5xl'>
                本地部署 OpenClaw 小龙虾
              </h2>
              <p className='mt-4 text-lg text-[#6c625c] dark:text-[#9ba3af]'>
                解锁电脑操控新体验，效率翻倍更便捷
              </p>
            </div>

            <div className='grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center'>
              <div className='rounded-2xl bg-white p-8 shadow-[0_12px_40px_rgba(90,61,45,0.08)] sm:p-10 dark:bg-[#111318] dark:shadow-none'>
                <h3 className='mb-8 text-3xl font-black'>
                  为什么选择本地部署？
                </h3>
                <div className='space-y-6'>
                  {localDeployReasons.map((reason) => (
                    <div key={reason.title} className='flex gap-4'>
                      <div className='grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff2ec] text-2xl dark:bg-[#321b17]'>
                        {reason.icon}
                      </div>
                      <div>
                        <h4 className='text-lg font-black text-[#1a1a1a] dark:text-white'>
                          {reason.title}
                        </h4>
                        <p className='mt-2 leading-7 text-[#6c625c] dark:text-[#9ba3af]'>
                          {reason.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='rounded-[28px] bg-gradient-to-br from-[#e05645] via-[#f57b6c] to-[#f9a86c] p-1 shadow-[0_20px_60px_rgba(224,86,69,0.25)]'>
                <div className='rounded-[24px] bg-white/95 p-8 sm:p-10 dark:bg-[#111318]/95'>
                  <div className='mx-auto grid size-24 place-items-center rounded-3xl bg-[#fff2ec] text-5xl dark:bg-[#321b17]'>
                    💻
                  </div>
                  <h3 className='mt-6 text-center text-3xl font-black'>
                    你的电脑
                  </h3>
                  <div className='mt-8 grid grid-cols-2 gap-4'>
                    {['📄 文档', '📧 邮件', '💬 聊天记录', '🔑 账号信息'].map(
                      (item) => (
                        <div
                          key={item}
                          className='rounded-2xl bg-[#f5f0eb] px-4 py-4 text-center font-bold text-[#4b423d] dark:bg-white/[0.06] dark:text-[#d8d3ca]'
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                  <div className='mx-auto mt-8 w-fit rounded-full bg-[#e05645] px-5 py-2 text-sm font-black text-white'>
                    🛡️ 本地保存
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='bg-white px-6 py-20 dark:bg-[#0d1017]'>
          <div className='mx-auto max-w-[1200px]'>
            <div className='mx-auto mb-10 max-w-3xl text-center'>
              <h2 className='text-4xl leading-tight font-black sm:text-5xl'>
                应用场景
              </h2>
              <p className='mt-4 text-lg text-[#6c625c] dark:text-[#9ba3af]'>
                覆盖工作、学习、生活多种场景，提升效率
              </p>
            </div>

            <div className='mb-10 flex flex-wrap justify-center gap-3'>
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type='button'
                  onClick={() => setActiveScenario(scenario.id)}
                  className={[
                    'rounded-full px-5 py-3 text-sm font-black transition-all duration-300 sm:text-base',
                    activeScenario === scenario.id
                      ? 'bg-[#e05645] text-white shadow-[0_8px_24px_rgba(224,86,69,0.28)]'
                      : 'bg-[#f5f0eb] text-[#4b423d] hover:bg-[#fff2ec] hover:text-[#e05645] dark:bg-white/[0.06] dark:text-[#d8d3ca] dark:hover:bg-[#321b17] dark:hover:text-[#f57b6c]',
                  ].join(' ')}
                >
                  {scenario.tab}
                </button>
              ))}
            </div>

            <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
              {activeScenarioData.items.map((item) => (
                <article
                  key={item.title}
                  className='rounded-2xl border border-[#eee5dc] bg-white p-6 shadow-[0_8px_28px_rgba(90,61,45,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(90,61,45,0.12)] dark:border-white/[0.08] dark:bg-[#111318] dark:shadow-none'
                >
                  <div className='mb-4 text-4xl'>{item.icon}</div>
                  <h3 className='text-lg font-black text-[#1a1a1a] dark:text-white'>
                    {item.title}
                  </h3>
                  <p className='mt-3 text-[15px] leading-7 text-[#6c625c] dark:text-[#9ba3af]'>
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer className='bg-white' />
    </PublicLayout>
  )
}
