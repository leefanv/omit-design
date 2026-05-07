/**
 * preset-mobile 组件目录 —— 主题编辑器 WYSIWYG 预览用。
 * 这个文件不受 ESLint whitelist 约束(属于 preset,不是业务稿)。
 */

import { cartOutline, gridOutline, personOutline } from "ionicons/icons";
import type { CatalogGroup } from "@omit-design/engine/registry";
import {
  OmButton,
  OmCard,
  OmTag,
  OmListRow,
  OmInput,
  OmSearchBar,
  OmStatCard,
  OmProductCard,
  OmMenuCard,
  OmTabBar,
  OmEmptyState,
  OmSettingRow,
  OmOrderFooter,
  OmCouponCard,
} from "./components";

export const catalog: CatalogGroup[] = [
  // ─── 基础 ────────────────────────────────────────────────────────────────
  {
    id: "foundation",
    label: "基础",
    icon: "🎨",
    items: [
      {
        id: "colors",
        name: "颜色 / Colors",
        description: "当前主题的语义色",
        render: () => (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { key: "primary",   cssVar: "--ion-color-primary"   },
              { key: "secondary", cssVar: "--ion-color-secondary" },
              { key: "success",   cssVar: "--ion-color-success"   },
              { key: "warning",   cssVar: "--ion-color-warning"   },
              { key: "danger",    cssVar: "--ion-color-danger"    },
              { key: "dark",      cssVar: "--ion-color-dark"      },
              { key: "medium",    cssVar: "--ion-color-medium"    },
              { key: "light",     cssVar: "--ion-color-light"     },
            ].map((c) => (
              <div key={c.key} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--om-radius-full)",
                    background: `var(${c.cssVar})`,
                    border: "1px solid rgba(0,0,0,0.1)",
                    marginBottom: 4,
                  }}
                />
                <div style={{ fontSize: 10, color: "#999" }}>{c.key}</div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "spacing",
        name: "间距 / Spacing",
        description: "spacing token 视觉参考",
        render: () => (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            {[
              { key: "xs", cssVar: "--om-spacing-xs" },
              { key: "sm", cssVar: "--om-spacing-sm" },
              { key: "md", cssVar: "--om-spacing-md" },
              { key: "lg", cssVar: "--om-spacing-lg" },
              { key: "xl", cssVar: "--om-spacing-xl" },
              { key: "2xl", cssVar: "--om-spacing-2xl" },
            ].map((s) => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    height: 12,
                    width: `var(${s.cssVar})`,
                    minWidth: `var(${s.cssVar})`,
                    background: "var(--ion-color-primary)",
                    borderRadius: 2,
                    opacity: 0.7,
                  }}
                />
                <span style={{ fontSize: 11, color: "#999" }}>{s.key}</span>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  // ─── 按钮 ────────────────────────────────────────────────────────────────
  {
    id: "button",
    label: "按钮",
    icon: "🔲",
    items: [
      {
        id: "button-variants",
        name: "OmButton",
        description: "solid / outline / clear × 颜色",
        render: () => (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <OmButton color="primary">Primary</OmButton>
              <OmButton color="primary" variant="outline">Outline</OmButton>
              <OmButton color="primary" variant="clear">Clear</OmButton>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <OmButton color="secondary">Secondary</OmButton>
              <OmButton color="danger">Danger</OmButton>
              <OmButton color="primary" disabled>Disabled</OmButton>
            </div>
            <OmButton color="primary" expand="block">Block 按钮</OmButton>
          </div>
        ),
      },
    ],
  },

  // ─── 输入 ────────────────────────────────────────────────────────────────
  {
    id: "input",
    label: "输入",
    icon: "✏️",
    items: [
      {
        id: "input-basic",
        name: "OmInput",
        description: "文本输入框（正常 + 错误态）",
        render: () => (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <OmInput label="商品名称" placeholder="请输入商品名称" />
            <OmInput label="价格" placeholder="0.00" type="number" />
            <OmInput label="手机号" value="138****8888" errorText="格式不正确" />
          </div>
        ),
      },
      {
        id: "search-bar",
        name: "OmSearchBar",
        description: "圆角胶囊搜索框",
        render: () => (
          <div style={{ width: "100%" }}>
            <OmSearchBar placeholder="搜索商品名称…" />
          </div>
        ),
      },
    ],
  },

  // ─── 卡片 ────────────────────────────────────────────────────────────────
  {
    id: "card",
    label: "卡片",
    icon: "🃏",
    items: [
      {
        id: "card-basic",
        name: "OmCard",
        description: "通用内容卡片",
        render: () => (
          <OmCard title="今日营业额" subtitle="含 2 笔待支付">
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--ion-color-primary)" }}>
              ¥ 12,480.50
            </div>
          </OmCard>
        ),
      },
      {
        id: "stat-card",
        name: "OmStatCard",
        description: "核心数字指标卡",
        render: () => (
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <OmStatCard label="今日订单" value="128" caption="+12 较昨日" />
            <OmStatCard label="客单价" value="¥97.5" caption="↑ 3.2%" />
          </div>
        ),
      },
      {
        id: "product-card",
        name: "OmProductCard",
        description: "商品卡（含加购按钮）",
        render: () => (
          <OmProductCard
            name="奥利奥饼干 256g"
            sku="SKU-001"
            price={12.5}
            unit="件"
            stock={208}
          />
        ),
      },
      {
        id: "menu-card",
        name: "OmMenuCard",
        description: "宫格快捷入口卡",
        render: () => (
          <div style={{ display: "flex", gap: 8 }}>
            <OmMenuCard icon={cartOutline} label="收银" />
            <OmMenuCard icon={personOutline} label="会员" />
            <OmMenuCard icon={gridOutline} label="商品" badge={3} />
          </div>
        ),
      },
      {
        id: "coupon-card",
        name: "OmCouponCard",
        description: "优惠券 / 奖励卡片",
        render: () => (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <OmCouponCard
              valueLabel="¥20"
              unitLabel="代金券"
              title="满 100 减 20"
              condition="全场通用"
              expireDate="2026-12-31"
            />
            <OmCouponCard
              valueLabel="8.5"
              unitLabel="折"
              title="85折优惠"
              selected
            />
          </div>
        ),
      },
    ],
  },

  // ─── 列表 ────────────────────────────────────────────────────────────────
  {
    id: "list",
    label: "列表",
    icon: "📋",
    items: [
      {
        id: "list-row",
        name: "OmListRow",
        description: "通用列表行（左右 slot）",
        render: () => (
          <div style={{ width: "100%" }}>
            <OmListRow title="桌号 A01" detail="2人 · 30 min" trailing="已点" />
            <OmListRow title="会员手机号" trailing="138****8888" />
            <OmListRow title="收银员" trailing="张三" />
          </div>
        ),
      },
      {
        id: "setting-row",
        name: "OmSettingRow",
        description: "设置行（toggle / navigate）",
        render: () => (
          <div style={{ width: "100%" }}>
            <OmSettingRow label="打印小票" kind="toggle" enabled={true} />
            <OmSettingRow label="结账方式" kind="navigate" />
            <OmSettingRow label="声音提示" kind="toggle" enabled={false} description="结账完成时播放提示音" />
          </div>
        ),
      },
    ],
  },

  // ─── 标签 ────────────────────────────────────────────────────────────────
  {
    id: "badge",
    label: "标签",
    icon: "🏷️",
    items: [
      {
        id: "tag-colors",
        name: "OmTag",
        description: "状态标签 —— 语义色",
        render: () => (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <OmTag color="primary">已完成</OmTag>
            <OmTag color="secondary">进行中</OmTag>
            <OmTag color="success">已支付</OmTag>
            <OmTag color="warning">待处理</OmTag>
            <OmTag color="danger">已取消</OmTag>
            <OmTag color="medium">草稿</OmTag>
          </div>
        ),
      },
    ],
  },

  // ─── 导航 ────────────────────────────────────────────────────────────────
  {
    id: "nav",
    label: "导航",
    icon: "🧭",
    items: [
      {
        id: "tab-bar",
        name: "OmTabBar",
        description: "底部 Tab 导航条",
        render: () => (
          <div style={{ width: "100%" }}>
            <OmTabBar
              items={[
                { tab: "sales",      href: "#", label: "销售",  icon: cartOutline   },
                { tab: "workstation", href: "#", label: "工作台", icon: gridOutline   },
                { tab: "member",     href: "#", label: "会员",  icon: personOutline },
              ]}
            />
          </div>
        ),
      },
    ],
  },

  // ─── 操作 ────────────────────────────────────────────────────────────────
  {
    id: "action",
    label: "操作",
    icon: "⚡",
    items: [
      {
        id: "order-footer",
        name: "OmOrderFooter",
        description: "购物车 / 结账底部操作栏",
        render: () => (
          <div style={{ width: "100%" }}>
            <OmOrderFooter
              primaryAmount="¥128.50"
              ctaLabel="结算 (3)"
              cartCount={3}
              layout="amount-split"
            />
          </div>
        ),
      },
    ],
  },

  // ─── 空态 ────────────────────────────────────────────────────────────────
  {
    id: "empty",
    label: "空态",
    icon: "🫙",
    items: [
      {
        id: "empty-state",
        name: "OmEmptyState",
        description: "无数据 / 搜索结果为空",
        render: () => (
          <OmEmptyState
            icon="🔍"
            title="没有找到商品"
            description="请尝试其他关键词"
          />
        ),
      },
    ],
  },
];
