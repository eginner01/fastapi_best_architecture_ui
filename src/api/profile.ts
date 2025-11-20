import { ApiClient } from './client';

/**
 * 更新头像参数
 */
export interface UpdateAvatarParams {
  avatar: string;
}

/**
 * 更新昵称参数
 */
export interface UpdateNicknameParams {
  nickname: string;
}

/**
 * 更新手机号参数
 */
export interface UpdatePhoneParams {
  phone: string;
  captcha: string;
}

/**
 * 更新邮箱参数
 */
export interface UpdateEmailParams {
  email: string;
  captcha: string;
}

/**
 * 修改密码参数
 */
export interface UpdatePasswordParams {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * 在线设备信息
 */
export interface OnlineDevice {
  id: string;
  device_name: string;
  device_type: string;
  os: string;
  browser: string;
  ip: string;
  location?: string;
  last_active: string;
  is_current: boolean;
}

/**
 * 发送手机验证码
 */
export const sendPhoneCaptchaApi = (phone: string) => {
  return ApiClient.post('/v1/captcha/phone', { phone });
};

/**
 * 发送邮箱验证码
 */
export const sendEmailCaptchaApi = (email: string) => {
  return ApiClient.post('/v1/captcha/email', { email });
};

/**
 * 更新用户头像
 */
export const updateAvatarApi = (params: UpdateAvatarParams) => {
  return ApiClient.put('/v1/sys/users/me/avatar', params);
};

/**
 * 更新用户昵称
 */
export const updateNicknameApi = (params: UpdateNicknameParams) => {
  return ApiClient.put('/v1/sys/users/me/nickname', params);
};

/**
 * 绑定/更新手机号
 */
export const updatePhoneApi = (params: UpdatePhoneParams) => {
  return ApiClient.put('/v1/sys/users/me/phone', params);
};

/**
 * 绑定/更新邮箱
 */
export const updateEmailApi = (params: UpdateEmailParams) => {
  return ApiClient.put('/v1/sys/users/me/email', params);
};

/**
 * 修改密码
 */
export const updatePasswordApi = (params: UpdatePasswordParams) => {
  return ApiClient.put('/v1/sys/users/me/password', params);
};

/**
 * 获取在线设备列表
 */
export const getOnlineDevicesApi = () => {
  return ApiClient.get<OnlineDevice[]>('/v1/sys/users/me/devices');
};

/**
 * 强制设备下线
 */
export const logoutDeviceApi = (deviceId: string) => {
  return ApiClient.delete(`/v1/sys/users/me/devices/${deviceId}`);
};

/**
 * 绑定第三方账号
 */
export const bindAccountApi = (provider: string, code: string) => {
  return ApiClient.post(`/v1/auth/bind/${provider}`, { code });
};

/**
 * 解绑第三方账号
 */
export const unbindAccountApi = (provider: string) => {
  return ApiClient.delete(`/v1/auth/unbind/${provider}`);
};

/**
 * 发送重置密码邮件
 */
export const sendResetPasswordEmailApi = (email: string) => {
  return ApiClient.post('/v1/auth/reset-password-request', { email });
};

/**
 * 重置密码（通过邮件中的token）
 */
export const resetPasswordApi = (token: string, password: string) => {
  return ApiClient.post('/v1/auth/reset-password', { token, password });
};
