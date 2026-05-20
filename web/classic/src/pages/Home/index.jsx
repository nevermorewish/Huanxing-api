/*
Copyright (C) 2025 huanxing

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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Input, ScrollItem, ScrollList } from '@douyinfe/semi-ui';
import { marked } from 'marked';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Check,
  CircuitBoard,
  Code2,
  DatabaseZap,
  FileText,
  Gauge,
  GitBranch,
  Globe2,
  Headphones,
  Layers3,
  LockKeyhole,
  Network,
  Route,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { IconCopy, IconFile, IconPlay } from '@douyinfe/semi-icons';
import { API, copy, showError, showSuccess } from '../../helpers';
import { API_ENDPOINTS } from '../../constants/common.constant';
import NoticeModal from '../../components/layout/NoticeModal';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const navLinks = [
  { href: '#models', label: '模型接入' },
  { href: '#solutions', label: '解决方案' },
  { href: '#advantages', label: '核心优势' },
];

const modelGroups = [
  {
    title: '全球旗舰模型',
    models: ['GPT-5.5', 'Claude', 'Gemini', 'Grok', 'Llama', 'Mistral'],
  },
  {
    title: '国内模型生态',
    models: ['DeepSeek', 'DeepSeek Pro', 'Doubao', 'Kimi', 'GLM', 'MiniMax'],
  },
  {
    title: '多模态引擎',
    models: ['Sora', 'Midjourney', 'Jimeng', 'Kling', 'Suno', 'Flux'],
  },
];

const comparisonRows = [
  ['接入方式', '一个网关统一接入多家模型供应商', '每家供应商单独开户和对接'],
  ['成本控制', '预算、倍率、预付额度和账单统一管理', '人工汇总账单和额度'],
  ['路由策略', '支持故障转移、负载均衡和亲和路由', '业务代码自行处理'],
  ['运营能力', '日志、告警、状态和审计集中可见', '分散在多个后台'],
  ['上线速度', '面向生产环境快速集成', '重复开发适配层'],
];

const capabilityCards = [
  {
    icon: Route,
    title: '统一路由',
    description:
      '用一层稳定网关接入 OpenAI 兼容、Claude、Gemini、图像、音频、重排和异步任务接口。',
  },
  {
    icon: DatabaseZap,
    title: '用量与计费',
    description:
      '实时管理额度、模型倍率、动态定价、预付余额和结算记录，让成本清晰可控。',
  },
  {
    icon: ShieldCheck,
    title: '企业级控制',
    description:
      '统一管理密钥、分组、限流、敏感词、SSRF 防护和通行密钥认证，降低运维风险。',
  },
];

const advantages = [
  {
    icon: Zap,
    title: '快速接入',
    description: '已有应用只需要切换兼容接口地址，即可逐步接入多模型能力。',
  },
  {
    icon: Network,
    title: '供应商容灾',
    description: '通过 fallback 和权重路由降低单一模型供应商故障带来的影响。',
  },
  {
    icon: BarChart3,
    title: '透明用量',
    description: '管理员和用户都能清楚查看请求日志、成本和额度变化。',
  },
  {
    icon: LockKeyhole,
    title: '默认安全',
    description: '把令牌、权限和出站访问控制集中在平台层，减少散落配置。',
  },
  {
    icon: Code2,
    title: '开发友好',
    description: '兼容常用请求格式，同时保留高级模型和供应商特性的扩展空间。',
  },
  {
    icon: Headphones,
    title: '运营支撑',
    description: '为团队内部工具、客户产品和商业化交付准备稳定服务流程。',
  },
];

const processSteps = [
  ['01', '梳理场景', '明确应用、团队、流量、预算和模型能力需求。'],
  ['02', '连接供应商', '配置上游渠道、用户分组、密钥和故障转移策略。'],
  ['03', '稳定上线', '通过日志观测用量，控制额度，并持续优化模型路由。'],
];

const trustItems = [
  [Globe2, '多区域模型接入'],
  [Gauge, '延迟感知路由'],
  [FileText, '完整请求日志'],
  [GitBranch, '灵活模型映射'],
];

function HomeNav() {
  return (
    <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 pt-24'>
      {navLinks.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className='rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/75 transition hover:border-cyan-300/40 hover:text-white'
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

function HeroSection({ serverAddress, endpointItems, endpointIndex, setEndpointIndex, onCopyBaseURL, isMobile, docsLink }) {
  return (
    <section className='relative overflow-hidden bg-[#07111f] text-white'>
      <div
        aria-hidden='true'
        className='absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(45,212,191,0.22),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.2),transparent_26%),linear-gradient(135deg,rgba(14,165,233,0.12),transparent_48%)]'
      />
      <div
        aria-hidden='true'
        className='absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f7fafc] to-transparent'
      />
      <HomeNav />
      <div className='relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-24 md:grid-cols-[1.03fr_0.97fr] md:pt-20 md:pb-28'>
        <div>
          <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100'>
            <Sparkles className='h-4 w-4' />
            寰星云科 AI 模型网关
          </div>
          <h1 className='max-w-3xl text-4xl leading-tight font-semibold tracking-normal md:text-6xl'>
            用一层稳定模型接入能力，构建可运营的 AI 应用
          </h1>
          <p className='mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg'>
            寰星云科把主流大模型、多模态服务、计费、路由和运营能力整合为可控网关，帮助团队更快上线 AI 产品。
          </p>
          <div className='mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
            <div className='mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100'>
              <Activity className='h-4 w-4' />
              Base URL
            </div>
            <Input
              readonly
              value={serverAddress}
              className='!rounded-full'
              size={isMobile ? 'default' : 'large'}
              suffix={
                <div className='flex items-center gap-2'>
                  <ScrollList
                    bodyHeight={32}
                    style={{ border: 'unset', boxShadow: 'unset' }}
                  >
                    <ScrollItem
                      mode='wheel'
                      cycled={true}
                      list={endpointItems}
                      selectedIndex={endpointIndex}
                      onSelect={({ index }) => setEndpointIndex(index)}
                    />
                  </ScrollList>
                  <Button
                    type='primary'
                    onClick={onCopyBaseURL}
                    icon={<IconCopy />}
                    className='!rounded-full'
                  />
                </div>
              }
            />
          </div>
          <div className='mt-9 flex flex-col gap-3 sm:flex-row'>
            <Link to='/console'>
              <Button
                theme='solid'
                type='primary'
                size={isMobile ? 'default' : 'large'}
                className='!h-11 !rounded-full !bg-cyan-300 !px-6 !text-slate-950 hover:!bg-cyan-200'
                icon={<IconPlay />}
              >
                获取密钥
              </Button>
            </Link>
            {docsLink && (
              <Button
                size={isMobile ? 'default' : 'large'}
                className='!h-11 !rounded-full !border-white/20 !bg-white/5 !px-6 !text-white hover:!bg-white/10'
                icon={<IconFile />}
                onClick={() => window.open(docsLink, '_blank')}
              >
                查看文档
              </Button>
            )}
          </div>
          <div className='mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm text-slate-300'>
            {[
              ['40+', '供应商'],
              ['100+', '模型'],
              ['24/7', '监控'],
            ].map(([value, label]) => (
              <div
                key={label}
                className='rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3'
              >
                <div className='text-xl font-semibold text-white'>{value}</div>
                <div className='mt-1 text-xs'>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className='relative'>
          <div className='absolute -inset-5 rounded-[2rem] bg-cyan-300/10 blur-2xl' />
          <div className='relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1728]/90 p-5 shadow-2xl shadow-cyan-950/40'>
            <div className='flex items-center justify-between border-b border-white/10 pb-4'>
              <div>
                <p className='text-sm text-slate-400'>实时网关状态</p>
                <p className='mt-1 text-lg font-semibold'>全链路路由正常</p>
              </div>
              <div className='rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200'>
                健康
              </div>
            </div>
            <div className='mt-5 grid gap-3'>
              {[
                ['OpenAI', '42 ms', '99.98%'],
                ['Claude', '57 ms', '99.94%'],
                ['Gemini', '63 ms', '99.92%'],
                ['DeepSeek', '39 ms', '99.96%'],
              ].map(([name, latency, uptime]) => (
                <div
                  key={name}
                  className='grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-100'>
                      <Bot className='h-4 w-4' />
                    </div>
                    <span className='font-medium'>{name}</span>
                  </div>
                  <span className='text-sm text-slate-300'>{latency}</span>
                  <span className='text-sm text-emerald-200'>{uptime}</span>
                </div>
              ))}
            </div>
            <div className='mt-5 rounded-2xl bg-cyan-300 p-4 text-slate-950'>
              <div className='flex items-center gap-2 text-sm font-semibold'>
                <CircuitBoard className='h-4 w-4' />
                智能路由已启用
              </div>
              <p className='mt-2 text-sm leading-6 text-slate-800'>
                故障转移、额度校验和计费结算会在请求到达业务应用前完成。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, description, dark = false }) {
  return (
    <div className='mx-auto max-w-3xl text-center'>
      <div
        className={`mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
          dark ? 'bg-cyan-300/10 text-cyan-100' : 'bg-cyan-50 text-cyan-700'
        }`}
      >
        <BadgeCheck className='h-4 w-4' />
        {eyebrow}
      </div>
      <h2
        className={`text-3xl leading-tight font-semibold tracking-normal md:text-4xl ${
          dark ? 'text-white' : 'text-slate-950'
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-4 text-base leading-8 ${
          dark ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className='border-y border-slate-200 bg-white px-4 py-8'>
      <div className='mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {trustItems.map(([Icon, label]) => (
          <div
            key={label}
            className='flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700'
          >
            <Icon className='h-4 w-4 text-cyan-700' />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

function ModelSection() {
  return (
    <section id='models' className='bg-[#f7fafc] px-4 py-20'>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading
          eyebrow='AI 模型接入'
          title='一个平台覆盖主流模型生态'
          description='统一接入文本、图像、音频、视频、Embedding、Rerank 和任务模型，同时保留每个供应商的独立配置能力。'
        />
        <div className='mt-12 grid gap-5 md:grid-cols-3'>
          {modelGroups.map((group) => (
            <div
              key={group.title}
              className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'
            >
              <div className='mb-5 flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700'>
                  <Layers3 className='h-5 w-5' />
                </div>
                <h3 className='text-lg font-semibold text-slate-950'>
                  {group.title}
                </h3>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                {group.models.map((model) => (
                  <div
                    key={model}
                    className='rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700'
                  >
                    {model}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionsSection() {
  return (
    <section id='solutions' className='bg-white px-4 py-20'>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading
          eyebrow='为什么需要网关'
          title='用集中治理替代分散的供应商集成'
          description='应用代码保持简单，运营、财务和安全团队可以在一个平台里管理模型访问。'
        />
        <div className='mt-12 overflow-x-auto rounded-2xl border border-slate-200'>
          <div className='min-w-[760px]'>
            <div className='grid grid-cols-[1.1fr_1fr_1fr] bg-slate-950 text-sm font-semibold text-white'>
              <div className='px-4 py-4'>维度</div>
              <div className='px-4 py-4'>寰星云科网关</div>
              <div className='px-4 py-4'>直接对接供应商</div>
            </div>
            {comparisonRows.map(([dimension, gateway, direct], index) => (
              <div
                key={dimension}
                className={`grid grid-cols-[1.1fr_1fr_1fr] text-sm ${
                  index % 2 ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                <div className='border-t border-slate-200 px-4 py-4 font-medium text-slate-950'>
                  {dimension}
                </div>
                <div className='border-t border-slate-200 px-4 py-4 text-slate-700'>
                  <Check className='mr-2 inline h-4 w-4 text-cyan-600' />
                  {gateway}
                </div>
                <div className='border-t border-slate-200 px-4 py-4 text-slate-500'>
                  {direct}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section className='bg-[#07111f] px-4 py-20 text-white'>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading
          eyebrow='平台能力'
          title='从 API 接入到财务级运营'
          description='覆盖模型路由、额度、日志、安全和面向客户 AI 产品交付的完整控制面。'
          dark
        />
        <div className='mt-12 grid gap-5 md:grid-cols-3'>
          {capabilityCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className='rounded-2xl border border-white/10 bg-white/[0.04] p-6'
              >
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950'>
                  <Icon className='h-5 w-5' />
                </div>
                <h3 className='mt-6 text-xl font-semibold'>{card.title}</h3>
                <p className='mt-3 text-sm leading-7 text-slate-300'>
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AdvantagesSection() {
  return (
    <section id='advantages' className='bg-[#f7fafc] px-4 py-20'>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading
          eyebrow='核心优势'
          title='为可靠 AI 交付设计'
          description='让产品、研发、运营和财务团队共享同一套模型基础设施。'
        />
        <div className='mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {advantages.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'
              >
                <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-cyan-300'>
                  <Icon className='h-5 w-5' />
                </div>
                <h3 className='mt-5 text-lg font-semibold text-slate-950'>
                  {item.title}
                </h3>
                <p className='mt-2 text-sm leading-7 text-slate-600'>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className='bg-white px-4 py-20'>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading
          eyebrow='交付流程'
          title='从评估到生产接入快速落地'
          description='把寰星云科作为内部工具、客户产品、智能体和多模态应用的模型网关层。'
        />
        <div className='mt-12 grid gap-5 md:grid-cols-3'>
          {processSteps.map(([num, title, description]) => (
            <div key={num} className='relative rounded-2xl bg-slate-50 p-6'>
              <div className='text-4xl font-semibold text-cyan-600'>{num}</div>
              <h3 className='mt-6 text-xl font-semibold text-slate-950'>
                {title}
              </h3>
              <p className='mt-3 text-sm leading-7 text-slate-600'>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const docsLink = statusState?.status?.docs_link || '';
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
  const endpointItems = useMemo(
    () => API_ENDPOINTS.map((e) => ({ value: e })),
    [],
  );
  const [endpointIndex, setEndpointIndex] = useState(0);

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    try {
      const res = await API.get('/api/home_page_content');
      const { success, message, data } = res.data;
      if (success) {
        let content = data || '';
        if (content && !content.startsWith('https://')) {
          content = marked.parse(content);
        }
        setHomePageContent(content);
        localStorage.setItem('home_page_content', content);

        if (data?.startsWith('https://')) {
          const iframe = document.querySelector('iframe');
          if (iframe) {
            iframe.onload = () => {
              iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
              iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
            };
          }
        }
      } else {
        showError(message);
        setHomePageContent('加载首页内容失败...');
      }
    } catch (error) {
      showError('加载首页内容失败');
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  const handleCopyBaseURL = async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      showSuccess(t('已复制到剪贴板'));
    }
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEndpointIndex((prev) => (prev + 1) % endpointItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [endpointItems.length]);

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {!homePageContentLoaded ? (
        <main className='flex min-h-screen items-center justify-center bg-white pt-[72px] text-slate-500'>
          {t('加载中...')}
        </main>
      ) : homePageContent === '' ? (
        <main className='overflow-x-hidden bg-white'>
          <HeroSection
            serverAddress={serverAddress}
            endpointItems={endpointItems}
            endpointIndex={endpointIndex}
            setEndpointIndex={setEndpointIndex}
            onCopyBaseURL={handleCopyBaseURL}
            isMobile={isMobile}
            docsLink={docsLink}
          />
          <TrustStrip />
          <ModelSection />
          <SolutionsSection />
          <CapabilitiesSection />
          <AdvantagesSection />
          <ProcessSection />
        </main>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='h-screen w-full border-none'
              title='自定义首页'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
