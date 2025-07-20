import { z } from 'zod';

// 로그인 스키마
export const signInSchema = z.object({
  email: z.string().nonempty('이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().nonempty('비밀번호를 입력해주세요.'),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

// 회원가입 스키마

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\-])[A-Za-z\d!@#$%^&*()_+{}\[\]:;<>,.?~\-]{8,}$/; // eslint-disable-line no-useless-escape

export const signUpSchema = z
  .object({
    email: z.string().nonempty('이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.'),

    username: z.string().nonempty('이름을 입력해주세요.').min(2, '이름은 2자 이상이어야 합니다.'),

    password: z
      .string()
      .nonempty('비밀번호를 입력해주세요.')
      .regex(passwordRegex, '비밀번호는 8자 이상, 대소문자/숫자/특수문자를 포함해야 합니다.'),

    passwordCheck: z.string().nonempty('비밀번호 확인을 입력해주세요.'),

    phoneNumber: z
      .string()
      .nonempty('전화번호를 입력해주세요.')
      .regex(/^010\d{7,8}$/, '010으로 시작하는 숫자 10~11자리를 입력해주세요.'),

    phoneCode: z
      .string()
      .nonempty('인증번호를 입력해주세요.')
      .length(6, '인증번호는 6자리여야 합니다.'),
  })
  .refine(data => data.password === data.passwordCheck, {
    path: ['passwordCheck'],
    message: '비밀번호가 일치하지 않습니다.',
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;
