import { z } from 'zod';
import type { ApiResponse } from '@/types/common/api';

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

const usernameSchema = z
  .string()
  .nonempty('이름을 입력해주세요.')
  .min(2, '이름은 2자 이상이어야 합니다.');

// 로그인 스키마
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().nonempty('비밀번호를 입력해주세요.'),
});

// 회원가입 스키마
export const signUpSchema = z
  .object({
    email: emailSchema,

    username: usernameSchema,

    password: passwordSchema,

    passwordCheck: z.string().nonempty('비밀번호 확인을 입력해주세요.'),

    phoneNumber: phoneNumberSchema,

    phoneCode: phoneCodeSchema,
  })
  .refine(data => data.password === data.passwordCheck, {
    path: ['passwordCheck'],
    message: '비밀번호가 일치하지 않습니다.',
  });

// 아이디 찾기 스키마
export const findIdSchema = z.object({
  username: usernameSchema,

  phoneNumber: phoneNumberSchema,

  phoneCode: phoneCodeSchema,
});

// 비밀번호 찾기 스키마
export const findPasswordSchema = z.object({
  username: usernameSchema,

  email: emailSchema,

  phoneNumber: phoneNumberSchema,

  phoneCode: phoneCodeSchema,
});

// 비밀번호 변경 스키마
export const changePasswordSchema = z
  .object({
    newPassword: passwordSchema,
    passwordCheck: z.string().nonempty('비밀번호 확인을 입력해주세요.'),
  })
  .refine(data => data.newPassword === data.passwordCheck, {
    path: ['passwordCheck'],
    message: '비밀번호가 일치하지 않습니다.',
  });

// request 스키마
export const SignInRequestSchema = signInSchema;

export const SignUpRequestSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: z.string(),
  passwordCheck: z.string(),
  phoneNumber: z.string(),
});

export const CheckEmailRequestSchema = z.object({
  email: emailSchema,
});

export const SendPhoneCodeRequestSchema = z.object({
  phoneNumber: z.string(),
  username: z.string(),
  authType: z.enum(['SIGN_UP', 'FIND_ID', 'FIND_PASSWORD']),
});

export const VerifyPhoneCodeRequestSchema = z.object({
  phoneNumber: z.string(),
  phoneCode: z.string(),
});

export const FindIdRequestSchema = z.object({
  username: z.string(),
  phoneNumber: z.string(),
  phoneCode: z.string(),
});

export const VerifyUserRequestSchema = z.object({
  username: z.string(),
  email: emailSchema,
  phoneNumber: z.string(),
  phoneCode: z.string(),
});

export const ResetPasswordRequestSchema = z.object({
  reauthToken: z.string(),
  newPassword: z.string(),
  passwordCheck: z.string(),
});

// response 스키마
const BaseResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
});

export const UserDataSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  nickname: z.string(),
  profileImageUrl: z.string(),
});

export const SignInResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    accessToken: z.string(),
    user: UserDataSchema,
  }),
});

export const SignUpResponseSchema = BaseResponseSchema.extend({
  data: UserDataSchema.pick({ id: true, username: true, nickname: true, profileImageUrl: true }),
});

export const SignOutResponseSchema = BaseResponseSchema.extend({
  data: z.object({}),
});

export const CheckEmailResponseSchema = BaseResponseSchema.extend({
  data: z.object({ isAvailable: z.boolean() }),
});

export const SendPhoneCodeResponseSchema = BaseResponseSchema.extend({
  data: z.object({ expiresIn: z.number() }),
});

export const VerifyPhoneCodeResponseSchema = BaseResponseSchema.extend({
  data: z.object({ verified: z.boolean() }),
});

export const FindIdResponseSchema = BaseResponseSchema.extend({
  data: z.object({ email: z.string() }),
});

export const VerifyUserResponseSchema = BaseResponseSchema.extend({
  data: z.object({ reauthToken: z.string() }),
});

export const ResetPasswordResponseSchema = BaseResponseSchema.extend({
  data: z.object({}),
});

export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
export type CheckEmailRequest = z.infer<typeof CheckEmailRequestSchema>;
export type SendPhoneCodeRequest = z.infer<typeof SendPhoneCodeRequestSchema>;
export type VerifyPhoneCodeRequest = z.infer<typeof VerifyPhoneCodeRequestSchema>;
export type FindIdRequest = z.infer<typeof FindIdRequestSchema>;
export type VerifyUserRequest = z.infer<typeof VerifyUserRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export type SignInResponse = z.infer<typeof SignInResponseSchema>;
export type SignUpResponse = z.infer<typeof SignUpResponseSchema>;
export type SignOutResponse = z.infer<typeof SignOutResponseSchema>;
export type CheckEmailResponse = z.infer<typeof CheckEmailResponseSchema>;
export type SendPhoneCodeResponse = z.infer<typeof SendPhoneCodeResponseSchema>;
export type VerifyPhoneCodeResponse = z.infer<typeof VerifyPhoneCodeResponseSchema>;
export type FindIdResponse = z.infer<typeof FindIdResponseSchema>;
export type VerifyUserResponse = z.infer<typeof VerifyUserResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type FindIdFormValues = z.infer<typeof findIdSchema>;
export type FindPasswordFormValues = z.infer<typeof findPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export type SignInApiResponse = ApiResponse<SignInResponse>;
export type SignUpApiResponse = ApiResponse<SignUpResponse>;
export type SignOutApiResponse = ApiResponse<SignOutResponse>;
export type CheckEmailApiResponse = ApiResponse<CheckEmailResponse>;
export type SendPhoneCodeApiResponse = ApiResponse<SendPhoneCodeResponse>;
export type VerifyPhoneCodeApiResponse = ApiResponse<VerifyPhoneCodeResponse>;
export type FindIdApiResponse = ApiResponse<FindIdResponse>;
export type VerifyUserApiResponse = ApiResponse<VerifyUserResponse>;
export type ResetPasswordApiResponse = ApiResponse<ResetPasswordResponse>;
