import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LessonContent, NavigationNode } from '../data/school-content.service';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly siteName = 'Fulldev School';
  private readonly siteDescription =
    'Guia completo para entrar na area de tecnologia com base digital, trilhas, carreira, portfolio, IA aplicada e curadoria editorial.';
  private readonly siteKeywords = [
    'guia de tecnologia',
    'como entrar na area de tecnologia',
    'aprender programacao',
    'carreira em tecnologia',
    'fundamentos de tecnologia',
    'trilhas de tecnologia',
    'ia para estudo',
    'portfolio de tecnologia',
    'fulldev school'
  ];

  updatePageSeo(
    lesson: LessonContent | null,
    navTree: NavigationNode[],
    currentPath: string,
    readingMinutes: number
  ): void {
    const normalizedPath = this.normalizePath(currentPath, lesson?.meta.slug, navTree[0]?.slug);
    const canonicalUrl = this.resolveCanonicalUrl(normalizedPath);
    const seoTitle = this.buildTitle(lesson);
    const description = this.buildDescription(lesson);
    const keywords = this.buildKeywords(lesson);
    const imageUrl = this.resolveAbsoluteAssetUrl('/logo-completa-preta.png');

    this.document.documentElement.lang = 'pt-BR';
    this.title.setTitle(seoTitle);
    this.setCanonical(canonicalUrl);
    this.setMetaTag('name', 'description', description);
    this.setMetaTag('name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    this.setMetaTag('name', 'googlebot', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    this.setMetaTag('name', 'author', 'Fulldev School');
    this.setMetaTag('name', 'application-name', this.siteName);
    this.setMetaTag('name', 'apple-mobile-web-app-title', this.siteName);
    this.setMetaTag('name', 'theme-color', '#111111');
    this.setMetaTag('name', 'keywords', keywords.join(', '));
    this.setMetaTag('property', 'og:locale', 'pt_BR');
    this.setMetaTag('property', 'og:site_name', this.siteName);
    this.setMetaTag('property', 'og:type', lesson ? 'article' : 'website');
    this.setMetaTag('property', 'og:title', seoTitle);
    this.setMetaTag('property', 'og:description', description);
    this.setMetaTag('property', 'og:url', canonicalUrl);
    this.setMetaTag('property', 'og:image', imageUrl);
    this.setMetaTag('property', 'og:image:alt', 'Logo Fulldev School');
    this.setMetaTag('name', 'twitter:card', 'summary_large_image');
    this.setMetaTag('name', 'twitter:title', seoTitle);
    this.setMetaTag('name', 'twitter:description', description);
    this.setMetaTag('name', 'twitter:image', imageUrl);

    if (lesson) {
      this.setMetaTag('property', 'article:section', lesson.meta.section);
    }

    this.setStructuredData(
      this.buildStructuredData(lesson, navTree, canonicalUrl, imageUrl, description, readingMinutes)
    );
  }

  private buildTitle(lesson: LessonContent | null): string {
    if (!lesson) {
      return `${this.siteName} | Guia completo para entrar na area de tecnologia`;
    }

    const title = lesson.meta.title.trim();
    const section = lesson.meta.section.trim();

    if (this.normalizeText(title) === this.normalizeText(section)) {
      return `${title} | ${this.siteName}`;
    }

    return `${title} | ${section} | ${this.siteName}`;
  }

  private buildDescription(lesson: LessonContent | null): string {
    if (!lesson) {
      return this.siteDescription;
    }

    const plainText = lesson.markdown
      .replace(/^---[\s\S]*?---/m, ' ')
      .replace(/^#.+$/gm, ' ')
      .replace(/^##.+$/gm, ' ')
      .replace(/[`*_>#-]/g, ' ')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    return this.truncateText(
      plainText || `${lesson.meta.title} na Fulldev School.`,
      170
    );
  }

  private buildKeywords(lesson: LessonContent | null): string[] {
    const dynamicKeywords = lesson
      ? [
          lesson.meta.title,
          lesson.meta.section,
          `${lesson.meta.title} guia`,
          `${lesson.meta.section} tecnologia`
        ]
      : [];

    return [...new Set([...this.siteKeywords, ...dynamicKeywords])];
  }

  private buildStructuredData(
    lesson: LessonContent | null,
    navTree: NavigationNode[],
    canonicalUrl: string,
    imageUrl: string,
    description: string,
    readingMinutes: number
  ): object[] {
    const website = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url: this.resolveCanonicalUrl('/'),
      inLanguage: 'pt-BR',
      description: this.siteDescription
    };

    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: this.siteName,
        item: this.resolveCanonicalUrl('/')
      }
    ];

    if (lesson) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: lesson.meta.title,
        item: canonicalUrl
      });
    }

    const breadcrumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems
    };

    if (!lesson) {
      return [
        website,
        breadcrumbs,
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: this.siteName,
          url: canonicalUrl,
          description,
          image: imageUrl,
          inLanguage: 'pt-BR'
        }
      ];
    }

    const relatedLinks = navTree
      .filter((node) => node.section === navTree.find((item) => item.slug === lesson.meta.slug)?.section)
      .slice(0, 8)
      .map((node) => ({
        '@type': 'Thing',
        name: node.title,
        url: this.resolveCanonicalUrl(node.slug === navTree[0]?.slug ? '/' : `/${node.slug}`)
      }));

    return [
      website,
      breadcrumbs,
      {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: lesson.meta.title,
        headline: lesson.meta.title,
        description,
        url: canonicalUrl,
        image: imageUrl,
        inLanguage: 'pt-BR',
        learningResourceType: 'Guia de estudo',
        educationalLevel: 'Iniciante',
        timeRequired: `PT${Math.max(1, readingMinutes)}M`,
        isPartOf: {
          '@type': 'WebSite',
          name: this.siteName,
          url: this.resolveCanonicalUrl('/')
        },
        about: relatedLinks
      }
    ];
  }

  private normalizePath(currentPath: string, slug: string | undefined, firstSlug: string | undefined): string {
    if (!currentPath || currentPath === '/') {
      return '/';
    }

    if (slug && firstSlug && slug === firstSlug) {
      return '/';
    }

    return currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
  }

  private resolveCanonicalUrl(path: string): string {
    const origin =
      this.document.location?.origin && this.document.location.origin !== 'null'
        ? this.document.location.origin
        : 'http://localhost:4200';

    return new URL(path, `${origin}/`).toString();
  }

  private resolveAbsoluteAssetUrl(path: string): string {
    return this.resolveCanonicalUrl(path);
  }

  private setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content });
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private setStructuredData(data: object[]): void {
    const id = 'fulldev-school-structured-data';
    let script = this.document.getElementById(id) as HTMLScriptElement | null;

    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);
  }

  private truncateText(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
}
