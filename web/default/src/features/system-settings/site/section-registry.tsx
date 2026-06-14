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
import { SystemInfoSection } from '../general/system-info-section'
import {
  parseHeaderNavModules,
  parseSidebarModulesAdmin,
  serializeHeaderNavModules,
  serializeSidebarModulesAdmin,
} from '../maintenance/config'
import { HeaderNavigationSection } from '../maintenance/header-navigation-section'
import { HermesSection } from '../maintenance/hermes-section'
import { NoticeSection } from '../maintenance/notice-section'
import { OpenClawSection } from '../maintenance/openclaw-section'
import { SidebarModulesSection } from '../maintenance/sidebar-modules-section'
import type { SiteSettings } from '../types'
import { createSectionRegistry } from '../utils/section-registry'

const SITE_SECTIONS = [
  {
    id: 'system-info',
    titleKey: 'System Information',
    descriptionKey: 'Configure basic system information and branding',
    build: (settings: SiteSettings) => (
      <SystemInfoSection
        defaultValues={{
          theme: {
            frontend: 'default',
          },
          SystemName: settings.SystemName,
          SystemNameEn: settings.SystemNameEn,
          Logo: settings.Logo,
          Footer: settings.Footer,
          About: settings.About,
          HomePageContent: settings.HomePageContent,
          ServerAddress: settings.ServerAddress,
          general_setting: {
            docs_link: settings['general_setting.docs_link'],
          },
          legal: {
            user_agreement: settings['legal.user_agreement'],
            privacy_policy: settings['legal.privacy_policy'],
          },
        }}
      />
    ),
  },
  {
    id: 'notice',
    titleKey: 'System Notice',
    descriptionKey: 'Configure system maintenance notice',
    build: (settings: SiteSettings) => (
      <NoticeSection defaultValue={settings.Notice ?? ''} />
    ),
  },
  {
    id: 'header-navigation',
    titleKey: 'Header navigation',
    descriptionKey: 'Configure header navigation modules',
    build: (settings: SiteSettings) => {
      const headerNavConfig = parseHeaderNavModules(settings.HeaderNavModules)
      const headerNavSerialized = serializeHeaderNavModules(headerNavConfig)
      return (
        <HeaderNavigationSection
          config={headerNavConfig}
          initialSerialized={headerNavSerialized}
        />
      )
    },
  },
  {
    id: 'sidebar-modules',
    titleKey: 'Sidebar modules',
    descriptionKey: 'Configure sidebar modules for admin',
    build: (settings: SiteSettings) => {
      const sidebarConfig = parseSidebarModulesAdmin(
        settings.SidebarModulesAdmin
      )
      const sidebarSerialized = serializeSidebarModulesAdmin(sidebarConfig)
      return (
        <SidebarModulesSection
          config={sidebarConfig}
          initialSerialized={sidebarSerialized}
        />
      )
    },
  },
  {
    id: 'openclaw',
    titleKey: 'OpenClaw Client',
    descriptionKey: 'Configure OpenClaw client brand and download links',
    build: (settings: SiteSettings) => (
      <OpenClawSection
        defaultValues={{
          OpenClawBrandName: settings.OpenClawBrandName,
          OpenClawWindowsUrl: settings.OpenClawWindowsUrl,
          OpenClawMacArmUrl: settings.OpenClawMacArmUrl,
          OpenClawMacIntelUrl: settings.OpenClawMacIntelUrl,
        }}
      />
    ),
  },
  {
    id: 'hermes',
    titleKey: 'Hermes Client',
    descriptionKey: 'Configure Hermes client download links',
    build: (settings: SiteSettings) => (
      <HermesSection
        defaultValues={{
          HermesBrandName: settings.HermesBrandName,
          HermesWindowsUrl: settings.HermesWindowsUrl,
          HermesMacArmUrl: settings.HermesMacArmUrl,
          HermesMacIntelUrl: settings.HermesMacIntelUrl,
        }}
      />
    ),
  },
] as const

export type SiteSectionId = (typeof SITE_SECTIONS)[number]['id']

const siteRegistry = createSectionRegistry<SiteSectionId, SiteSettings>({
  sections: SITE_SECTIONS,
  defaultSection: 'system-info',
  basePath: '/system-settings/site',
  urlStyle: 'path',
})

export const SITE_SECTION_IDS = siteRegistry.sectionIds
export const SITE_DEFAULT_SECTION = siteRegistry.defaultSection
export const getSiteSectionNavItems = siteRegistry.getSectionNavItems
export const getSiteSectionContent = siteRegistry.getSectionContent
