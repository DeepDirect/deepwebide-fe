import { useEffect } from 'react';

/**
 * 모달이나 오버레이가 열렸을 때 배경 스크롤을 차단하고
 * 스크롤바 사라짐으로 인한 레이아웃 이동을 방지하는 훅
 */
export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (isLocked) {
      // 스크롤바 너비 계산
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // body 스크롤 방지 + 스크롤바 공간 보정
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      // fixed 요소들(헤더 등)에도 패딩 적용
      const headerSelectors = [
        'header',
        '[class*="Header"]',
        '[class*="header"]',
        // CSS Modules 해시가 포함된 클래스도 찾기
        '[class*="Header_header"]',
        '[class*="header_header"]',
      ];

      const fixedElements: HTMLElement[] = [];
      headerSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (!fixedElements.includes(el as HTMLElement)) {
            fixedElements.push(el as HTMLElement);
          }
        });
      });

      fixedElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        el.dataset.originalPaddingRight =
          el.style.paddingRight || computedStyle.paddingRight || '0px';

        const currentPadding = parseInt(computedStyle.paddingRight) || 0;
        el.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      });

      return () => {
        // 모든 스타일 복원
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        fixedElements.forEach(element => {
          const el = element as HTMLElement;
          const originalPadding = el.dataset.originalPaddingRight || '0px';
          el.style.paddingRight = originalPadding;
          delete el.dataset.originalPaddingRight;
        });
      };
    }
  }, [isLocked]);
};
