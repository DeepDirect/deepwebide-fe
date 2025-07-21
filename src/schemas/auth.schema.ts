import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().nonempty('이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().nonempty('비밀번호를 입력해주세요.'),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
