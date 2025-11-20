import { useState, useEffect } from 'react';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

// 支持的语言
export type Locale = 'zh-CN' | 'en-US';

// 翻译文本类型
export type Translations = {
  [key: string]: string | Translations;
};

// 语言配置
const locales: Record<Locale, { name: string; translations: Translations }> = {
  'zh-CN': {
    name: '简体中文',
    translations: zhCN,
  },
  'en-US': {
    name: 'English',
    translations: enUS,
  },
};

// 当前语言
let currentLocale: Locale = 'zh-CN';

// 监听器
const listeners: Set<() => void> = new Set();

/**
 * 获取当前语言
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * 设置当前语言
 */
export function setLocale(locale: Locale) {
  if (locales[locale]) {
    currentLocale = locale;
    localStorage.setItem('locale', locale);
    // 通知所有监听器
    listeners.forEach(listener => listener());
  }
}

/**
 * 初始化语言
 */
export function initLocale() {
  const savedLocale = localStorage.getItem('locale') as Locale;
  if (savedLocale && locales[savedLocale]) {
    currentLocale = savedLocale;
  } else {
    // 检测浏览器语言
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
      currentLocale = 'zh-CN';
    } else {
      currentLocale = 'en-US';
    }
  }
}

/**
 * 注册翻译
 */
export function registerTranslations(locale: Locale, translations: Translations) {
  locales[locale].translations = {
    ...locales[locale].translations,
    ...translations,
  };
}

/**
 * 获取翻译文本
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = locales[currentLocale].translations;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }

  let result = typeof value === 'string' ? value : key;

  // 替换参数
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, String(v));
    });
  }

  return result;
}

/**
 * React Hook: 使用多语言
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState(currentLocale);

  useEffect(() => {
    const listener = () => setLocaleState(currentLocale);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    t,
    locale,
    setLocale,
    getLocale,
  };
}

// 初始化
initLocale();
