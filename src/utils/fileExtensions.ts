import codeIcon from '@/assets/icons/code.svg';
import scriptIcon from '@/assets/icons/script.svg';
import fileAltIcon from '@/assets/icons/file-alt.svg';
import notesIcon from '@/assets/icons/notes.svg';
import fileOffIcon from '@/assets/icons/file-off.svg';
import colorsSwatchIcon from '@/assets/icons/colors-swatch.svg';
import articleIcon from '@/assets/icons/article.svg';
import slidersIcon from '@/assets/icons/sliders.svg';

export const getLanguageFromFile = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  const extensionMap: Record<string, string> = {
    // Java/Spring Boot
    java: 'java',
    xml: 'xml',
    properties: 'properties',
    yaml: 'yaml',
    yml: 'yaml',

    // React/TypeScript
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    scss: 'scss',

    // Python/FastAPI
    py: 'python',
    pyi: 'python',
    pyx: 'python',

    // 기타 - Monaco Editor 언어 ID에 맞춰 수정
    md: 'markdown',
    txt: 'plaintext',
    html: 'html',
    dockerfile: 'dockerfile',
    gitignore: 'plaintext',
  };

  return extensionMap[extension || ''] || 'plaintext';
};

export const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    // Java/Spring Boot
    java: codeIcon,
    xml: scriptIcon,
    properties: slidersIcon,
    yaml: fileAltIcon,
    yml: fileAltIcon,

    // React/TypeScript
    ts: codeIcon,
    tsx: codeIcon,
    js: scriptIcon,
    jsx: scriptIcon,
    json: fileAltIcon,
    css: colorsSwatchIcon,
    scss: colorsSwatchIcon,

    // Python/FastAPI
    py: scriptIcon,

    // 기타
    md: articleIcon,
    txt: notesIcon,
    html: codeIcon,
  };

  return iconMap[extension || ''] || fileOffIcon;
};
