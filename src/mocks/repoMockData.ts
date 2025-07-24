export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileSystemItem[];
}

export const repoMockData = {
  repoId: '2',
  name: 'project-name',
  fileTree: [
    {
      id: 'section01',
      name: 'section01',
      type: 'folder' as const,
      children: [
        {
          id: 'section01/chapter01.ts',
          name: 'chapter01.ts',
          type: 'file' as const,
        },
        {
          id: 'section01/chapter02.ts',
          name: 'chapter02.ts',
          type: 'file' as const,
        },
      ],
    },
    {
      id: 'section02',
      name: 'section02',
      type: 'folder' as const,
      children: [
        {
          id: 'section02/index.ts',
          name: 'index.ts',
          type: 'file' as const,
        },
      ],
    },
    {
      id: 'README.md',
      name: 'README.md',
      type: 'file' as const,
    },
  ],
  fileContents: {
    'section01/chapter01.ts': `// Chapter 01 - TypeScript Basics
console.log('Hello, TypeScript!');

interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: 'John Doe', 
  email: 'john@example.com'
};`,
    'section01/chapter02.ts': `// Chapter 02 - Advanced Types
type Status = 'pending' | 'completed' | 'failed';

interface Task {
  id: string;
  title: string;
  status: Status;
  createdAt: Date;
}

const createTask = (title: string): Task => ({
  id: Math.random().toString(36),
  title,
  status: 'pending',
  createdAt: new Date()
});`,
    'section02/index.ts': `// Section 02 - Main Entry Point
export * from './utils';
export * from './types';

console.log('Section 02 initialized');`,
    'README.md': `# Project Name

이것은 웹 IDE 테스트 프로젝트입니다.

## 구조
- section01/ - TypeScript 기초
- section02/ - 고급 타입들

## 사용법
각 섹션의 파일들을 열어서 코드를 확인해보세요.`,
  },

  initialTabs: [
    {
      id: '2/section01/chapter01.ts',
      name: 'chapter01.ts',
      path: 'section01/chapter01.ts',
      isActive: true,
      isDirty: false,
      content: `// Chapter 01 - TypeScript Basics
console.log('Hello, TypeScript!');

interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: 'John Doe', 
  email: 'john@example.com'
};`,
    },
    {
      id: '2/section01/chapter02.ts',
      name: 'chapter02.ts',
      path: 'section01/chapter02.ts',
      isActive: false,
      isDirty: true, // 더티 상태 테스트
      content: `// Chapter 02 - Advanced Types
type Status = 'pending' | 'completed' | 'failed';

interface Task {
  id: string;
  title: string;
  status: Status;
  createdAt: Date;
}

const createTask = (title: string): Task => ({
  id: Math.random().toString(36),
  title,
  status: 'pending',
  createdAt: new Date()
});`,
    },
    {
      id: '2/README.md',
      name: 'README.md',
      path: 'README.md',
      isActive: false,
      isDirty: false,
      content: `# Project Name

이것은 웹 IDE 테스트 프로젝트입니다.

## 구조
- section01/ - TypeScript 기초
- section02/ - 고급 타입들

## 사용법
각 섹션의 파일들을 열어서 코드를 확인해보세요.`,
    },
  ],
};
