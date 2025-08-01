import { z, ZodError } from 'zod';

// 파일명 스키마 - 확장자 필수
const baseFileNameSchema = z
  .string()
  // 1단계: 공백 검증 (trim 하기 전)
  .refine(name => !name.startsWith(' '), '이름은 공백으로 시작할 수 없습니다.')
  .refine(name => !name.endsWith(' '), '이름은 공백으로 끝날 수 없습니다.')
  .refine(name => !name.includes(' '), '이름에 공백을 사용할 수 없습니다.')
  // 2단계: 기본 검증
  .refine(name => name.trim().length > 0, '이름을 입력해주세요.')
  .refine(name => name.trim().length <= 255, '이름이 너무 깁니다. (최대 255자)')
  // 3단계: 문자 검증
  .refine(
    name => /^[a-zA-Z0-9._-]+$/.test(name.trim()),
    '영어, 숫자, 점(.), 하이픈(-), 언더스코어(_)만 사용 가능합니다.'
  )
  // 4단계: 점 관련 검증
  .refine(name => !/^\.+$/.test(name.trim()), '점(.)으로만 구성된 이름은 사용할 수 없습니다.')
  .refine(name => {
    const trimmedName = name.trim();
    if (trimmedName.startsWith('.') && !trimmedName.startsWith('..')) {
      return true; // 숨김 파일 허용
    }
    return !/\.{2,}/.test(trimmedName); // 연속된 점 금지
  }, '연속된 점(..)은 사용할 수 없습니다.')
  .refine(name => !name.trim().endsWith('.'), '이름의 끝에 점(.)은 올 수 없습니다.')
  // 5단계: Windows 예약어 검증
  .refine(name => {
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ];

    let nameToCheck = name.trim();
    if (nameToCheck.startsWith('.')) {
      nameToCheck = nameToCheck.substring(1);
    }

    const nameWithoutExt = nameToCheck.split('.')[0].toUpperCase();
    return !reservedNames.includes(nameWithoutExt);
  }, '이 이름은 시스템에서 예약된 이름입니다.')
  // 6단계: 금지된 문자 검증
  .refine(
    name => !/[<>:"/\\|?*]/.test(name),
    '파일명에는 < > : " / \\ | ? * 문자를 사용할 수 없습니다.'
  );

// 파일명 스키마 (확장자 필수)
export const fileNameSchema = baseFileNameSchema;

// 폴더명 스키마 - 점은 맨 앞(숨김 폴더)에만 허용
export const folderNameSchema = z
  .string()
  // 1단계: 공백 검증 (trim 하기 전)
  .refine(name => !name.startsWith(' '), '이름은 공백으로 시작할 수 없습니다.')
  .refine(name => !name.endsWith(' '), '이름은 공백으로 끝날 수 없습니다.')
  .refine(name => !name.includes(' '), '이름에 공백을 사용할 수 없습니다.')
  // 2단계: 기본 검증
  .refine(name => name.trim().length > 0, '폴더명을 입력해주세요.')
  .refine(name => name.trim().length <= 100, '폴더명이 너무 깁니다. (최대 100자)')
  // 3단계: 문자 검증
  .refine(
    name => /^[a-zA-Z0-9._-]+$/.test(name.trim()),
    '영어, 숫자, 점(.), 하이픈(-), 언더스코어(_)만 사용 가능합니다.'
  )
  // 4단계: 점 관련 검증 - 맨 앞에만 허용
  .refine(name => !/^\.+$/.test(name.trim()), '점(.)으로만 구성된 이름은 사용할 수 없습니다.')
  .refine(name => {
    const trimmedName = name.trim();
    // 숨김 폴더가 아닌 경우 점 사용 금지
    if (!trimmedName.startsWith('.')) {
      return !trimmedName.includes('.');
    }
    // 숨김 폴더인 경우 첫 번째 점 이후에는 점 사용 금지
    if (trimmedName.startsWith('.') && !trimmedName.startsWith('..')) {
      return !trimmedName.includes('.', 1);
    }
    return false; // .. 로 시작하는 것은 금지
  }, '폴더명에는 점(.)을 사용할 수 없습니다. 숨김 폴더만 맨 앞에 점 사용 가능합니다.')
  .refine(name => {
    const trimmedName = name.trim();
    return trimmedName !== '.' && trimmedName !== '..';
  }, '폴더명으로 "." 또는 ".."는 사용할 수 없습니다.')
  // 5단계: Windows 예약어 검증
  .refine(name => {
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ];

    let nameToCheck = name.trim();
    if (nameToCheck.startsWith('.')) {
      nameToCheck = nameToCheck.substring(1);
    }

    const nameWithoutExt = nameToCheck.split('.')[0].toUpperCase();
    return !reservedNames.includes(nameWithoutExt);
  }, '이 이름은 시스템에서 예약된 이름입니다.')
  // 6단계: 금지된 문자 검증
  .refine(
    name => !/[<>:"/\\|?*]/.test(name),
    '폴더명에는 < > : " / \\ | ? * 문자를 사용할 수 없습니다.'
  );

// 검증 함수들 - 경고 조건
export const validateFileName = (
  name: string
): {
  isValid: boolean;
  error?: string;
  warning?: string;
} => {
  try {
    // 1단계: 기본 스키마 검증
    fileNameSchema.parse(name);

    // 2단계: 파일명 세부 검증
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { isValid: false, error: '이름을 입력해주세요.' };
    }

    // 숨김 파일 체크
    const isHiddenFile = trimmedName.startsWith('.') && !trimmedName.startsWith('..');

    if (isHiddenFile) {
      // 숨김 파일은 점 다음에 문자가 있으면 승인
      if (trimmedName.length <= 1) {
        return { isValid: false, error: '점(.) 다음에 파일명을 입력해주세요.' };
      }
      return { isValid: true };
    } else {
      // 일반 파일: 확장자 필수
      if (!trimmedName.includes('.') || trimmedName.split('.').length < 2) {
        return { isValid: false, error: '파일은 확장자를 포함해야 합니다. (예: .js, .ts, .md)' };
      }

      // 확장자 길이 체크
      const parts = trimmedName.split('.');
      const extension = parts[parts.length - 1];
      if (extension.length < 1 || extension.length > 10) {
        return { isValid: false, error: '확장자는 1~10자 사이여야 합니다.' };
      }

      // 파일명 길이 체크
      const nameWithoutExt = trimmedName.substring(0, trimmedName.lastIndexOf('.'));
      if (nameWithoutExt.length < 1) {
        return { isValid: false, error: '파일명은 최소 1자 이상이어야 합니다.' };
      }

      // 실용적인 경고들
      const warnings = [];

      // 파일명이 긴 경우 (30자 이상)
      if (nameWithoutExt.length > 30) {
        warnings.push('파일명이 깁니다. 짧게 하는 것을 권장합니다');
      }

      // 전체 이름이 매우 긴 경우 (50자 이상)
      else if (trimmedName.length > 50) {
        warnings.push('파일명이 매우 깁니다. 일부 시스템에서 문제가 될 수 있습니다');
      }

      // 빈 확장자
      else if (extension.length === 0) {
        warnings.push('확장자가 비어있습니다');
      }

      // 매우 긴 확장자 (6자 이상)
      else if (extension.length > 7) {
        warnings.push('확장자가 깁니다. 일반적으로 2-6자를 사용합니다');
      }

      // 첫 번째 경고만 반환
      if (warnings.length > 0) {
        return { isValid: true, warning: warnings[0] };
      }

      return { isValid: true };
    }
  } catch (error) {
    console.log('파일명 검증 에러:', error);

    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      if (firstIssue && firstIssue.message) {
        return {
          isValid: false,
          error: firstIssue.message,
        };
      }
    }

    return {
      isValid: false,
      error: '유효하지 않은 파일명입니다.',
    };
  }
};

export const validateFolderName = (
  name: string
): {
  isValid: boolean;
  error?: string;
  warning?: string;
} => {
  try {
    folderNameSchema.parse(name);

    // 기본 검증을 통과했으면 추가 체크
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { isValid: false, error: '폴더명을 입력해주세요.' };
    }

    // 실용적인 경고들
    const warnings = [];

    // 폴더명이 긴 경우 (25자 이상)
    if (trimmedName.length > 25) {
      warnings.push('폴더명이 깁니다. 짧게 하는 것을 권장합니다');
    }

    // 첫 번째 경고만 반환
    if (warnings.length > 0) {
      return { isValid: true, warning: warnings[0] };
    }

    return { isValid: true };
  } catch (error) {
    console.log('폴더명 검증 에러:', error);

    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      if (firstIssue && firstIssue.message) {
        return {
          isValid: false,
          error: firstIssue.message,
        };
      }
    }

    return {
      isValid: false,
      error: '유효하지 않은 폴더명입니다.',
    };
  }
};

// 타입 정의
export type FileName = z.infer<typeof fileNameSchema>;
export type FolderName = z.infer<typeof folderNameSchema>;
