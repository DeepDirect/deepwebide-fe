import codeIcon from '@/assets/icons/code.svg';
import scriptIcon from '@/assets/icons/script.svg';
import fileAltIcon from '@/assets/icons/file-alt.svg';
import notesIcon from '@/assets/icons/notes.svg';
import fileOffIcon from '@/assets/icons/file-off.svg';
import colorsSwatchIcon from '@/assets/icons/colors-swatch.svg';
import articleIcon from '@/assets/icons/article.svg';
import slidersIcon from '@/assets/icons/sliders.svg';
import folderClosedIcon from '@/assets/icons/folder-closed.svg';
import folderOpenIcon from '@/assets/icons/folder-open.svg';
import chartIcon from '@/assets/icons/chart.svg';
import noteIcon from '@/assets/icons/note.svg';
import lockIcon from '@/assets/icons/lock.svg';
import archiveIcon from '@/assets/icons/archive.svg';
import bookIcon from '@/assets/icons/book.svg';
import imageIcon from '@/assets/icons/image.svg';
import gitIcon from '@/assets/icons/git-merge.svg';

export const getLanguageFromFile = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  const extensionMap: Record<string, string> = {
    // Java/Spring Boot
    java: 'java',
    xml: 'xml',
    properties: 'properties',
    yaml: 'yaml',
    yml: 'yaml',
    gradle: 'groovy',
    kts: 'kotlin',
    sql: 'sql',
    jsp: 'html',
    jspx: 'xml',
    ftl: 'html',
    vm: 'html',
    groovy: 'groovy',
    kt: 'kotlin',
    conf: 'ini',
    toml: 'toml',

    // React/TypeScript
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',
    stylus: 'stylus',
    postcss: 'css',
    vue: 'html',
    svelte: 'html',
    mjs: 'javascript',
    cjs: 'javascript',
    mdx: 'markdown',
    htm: 'html',
    env: 'properties',

    // Python/FastAPI
    py: 'python',
    pyi: 'python',
    pyx: 'python',
    pyc: 'python',
    pyo: 'python',
    pyw: 'python',
    ipynb: 'json',
    cfg: 'ini',
    ini: 'ini',
    lock: 'yaml',
    pipfile: 'toml',
    dockerignore: 'plaintext',
    jinja: 'html',
    jinja2: 'html',
    j2: 'html',
    iml: 'xml',
    http: 'plaintext',

    // 기타 - Monaco Editor 언어 ID에 맞춰 수정
    md: 'markdown',
    txt: 'plaintext',
    html: 'html',
    dockerfile: 'dockerfile',
    gitignore: 'plaintext',
    log: 'plaintext',
    eslintrc: 'json',
    prettierrc: 'json',
    editorconfig: 'ini',
    nvmrc: 'plaintext',
    npmrc: 'ini',
    svg: 'xml',
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
    gradle: scriptIcon,
    kts: scriptIcon,
    sql: chartIcon,
    jsp: codeIcon,
    jspx: codeIcon,
    ftl: noteIcon,
    vm: noteIcon,
    groovy: scriptIcon,
    kt: codeIcon,
    conf: slidersIcon,
    toml: slidersIcon,

    // React/TypeScript
    ts: codeIcon,
    tsx: codeIcon,
    js: scriptIcon,
    jsx: scriptIcon,
    json: fileAltIcon,
    css: colorsSwatchIcon,
    scss: colorsSwatchIcon,
    sass: colorsSwatchIcon,
    less: colorsSwatchIcon,
    stylus: colorsSwatchIcon,
    postcss: colorsSwatchIcon,
    vue: codeIcon,
    svelte: codeIcon,
    mjs: scriptIcon,
    cjs: scriptIcon,
    mdx: articleIcon,
    htm: codeIcon,
    env: lockIcon,

    // Python/FastAPI
    py: scriptIcon,
    pyc: archiveIcon,
    pyo: archiveIcon,
    pyw: scriptIcon,
    ipynb: bookIcon,
    cfg: slidersIcon,
    ini: slidersIcon,
    lock: lockIcon,
    pipfile: fileAltIcon,
    dockerignore: fileOffIcon,
    jinja: noteIcon,
    jinja2: noteIcon,
    j2: noteIcon,
    iml: slidersIcon,
    http: scriptIcon,

    // 기타
    md: articleIcon,
    txt: notesIcon,
    html: codeIcon,
    log: notesIcon,
    eslintrc: slidersIcon,
    prettierrc: slidersIcon,
    editorconfig: slidersIcon,
    nvmrc: fileAltIcon,
    npmrc: slidersIcon,
    gitignore: gitIcon,
    svg: imageIcon,
  };

  return iconMap[extension || ''] || fileOffIcon;
};

/**
 * 폴더 아이콘을 반환하는 함수
 */
export const getFolderIcon = (isExpanded: boolean): string => {
  return isExpanded ? folderOpenIcon : folderClosedIcon;
};
