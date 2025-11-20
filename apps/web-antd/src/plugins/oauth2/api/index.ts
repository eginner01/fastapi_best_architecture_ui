import { requestClient } from '#/api/request';

export interface OAuth2BindingParams {
  source: string;
}

export async function getOAuth2Github() {
  return requestClient.get<string>('/api/v1/oauth2/github');
}

export async function getOAuth2Google() {
  return requestClient.get<string>('/api/v1/oauth2/google');
}

export async function getOAuth2LinuxDo() {
  return requestClient.get<string>('/api/v1/oauth2/linux-do');
}

export async function getOAuth2Bindings() {
  return requestClient.get<string[]>('/api/v1/oauth2/bindings');
}

export async function getOAuth2BindingAuthUrl(params: OAuth2BindingParams) {
  return requestClient.get<string>(
    `/api/v1/oauth2/binding/${params.source.toLowerCase()}`,
  );
}

export async function deleteOAuth2Binding(params: OAuth2BindingParams) {
  return requestClient.delete(
    `/api/v1/oauth2/binding/${params.source.toLowerCase()}`,
  );
}
