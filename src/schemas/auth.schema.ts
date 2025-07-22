import { z } from 'zod';

// 공통 정규식
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\-])[A-Za-z\d!@#$%^&*()_+{}\[\]:;<>,.?~\-]{8,}$/; // eslint-disable-line no-useless-escape

// 공통 필드 스키마
const emailSchema = z
  .string()
  .nonempty('이메일을 입력해주세요.')
  .email('올바른 이메일 형식이 아닙니다.');

const passwordSchema = z
  .string()
  .nonempty('비밀번호를 입력해주세요.')
  .regex(passwordRegex, '비밀번호는 8자 이상, 대소문자/숫자/특수문자를 포함해야합니다.');

const phoneNumberSchema = z
  .string()
  .nonempty('전화번호를 입력해주세요.')
  .regex(/^010\d{7,8}$/, '010으로 시작하는 숫자 10~11자리를 입력해주세요.');

const phoneCodeSchema = z
  .string()
  .nonempty('인증번호를 입력해주세요')
  .length(6, '인증번호는 6자리여야합니다.');

// 로그인 스키마
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().nonempty('비밀번호를 입력해주세요.'),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

// 회원가입 스키마
export const signUpSchema = z
  .object({
    email: z.string().nonempty('이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.'),

    username: z.string().nonempty('이름을 입력해주세요.').min(2, '이름은 2자 이상이어야 합니다.'),

    password: passwordSchema,

    passwordCheck: z.string().nonempty('비밀번호 확인을 입력해주세요.'),

    phoneNumber: phoneNumberSchema,

    phoneCode: phoneCodeSchema,
  })
  .refine(data => data.password === data.passwordCheck, {
    path: ['passwordCheck'],
    message: '비밀번호가 일치하지 않습니다.',
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

// 아이디 찾기 스키마
export const findIdSchema = z.object({
  username: z.string().nonempty('이름을 입력해주세요.').min(2, '이름은 2자 이상이어야 합니다.'),

  phoneNumber: phoneNumberSchema,

  phoneCode: phoneCodeSchema,
});

export type FindIdFormValues = z.infer<typeof findIdSchema>;
