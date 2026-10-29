import type { ApiResponse } from '../types/auth';

const BASE_URL = '/api/v1/owner';

export interface SignUploadParams {
  productId?: number;
  folder?: string;
}

export interface SignUploadResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
  isMock: boolean;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
}

export interface ProductImageDetail {
  id: number;
  variantId: number | null;
  imageUrl: string;
  storageKey?: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  fileSize?: number;
  width?: number;
  height?: number;
  format?: string;
}

export interface AddProductImagePayload {
  variantId?: number | null;
  imageUrl: string;
  storageKey?: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  fileSize?: number;
  width?: number;
  height?: number;
  format?: string;
}

export interface UpdateProductImagePayload {
  variantId?: number | null;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export async function signUploadApi(params: SignUploadParams = {}): Promise<SignUploadResponse> {
  const response = await fetch(`${BASE_URL}/media/sign-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });

  const body: ApiResponse<SignUploadResponse> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tạo chữ ký tải ảnh Cloudinary');
  }

  return body.data;
}

export async function uploadToCloudinaryApi(
  uploadUrl: string,
  formData: FormData
): Promise<CloudinaryUploadResult> {
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errMsg = `Upload failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errMsg = errJson.error.message;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errMsg);
  }

  const result = await response.json();
  // Support both Cloudinary native response and backend dev-mock-upload response (inside ApiResponse)
  if (result.data) {
    return result.data as CloudinaryUploadResult;
  }
  return result as CloudinaryUploadResult;
}

export async function getProductImagesApi(productId: number): Promise<ProductImageDetail[]> {
  const response = await fetch(`${BASE_URL}/products/${productId}/images`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const body: ApiResponse<ProductImageDetail[]> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải danh sách ảnh sản phẩm');
  }

  return body.data;
}

export async function addProductImageApi(
  productId: number,
  payload: AddProductImagePayload
): Promise<ProductImageDetail> {
  const response = await fetch(`${BASE_URL}/products/${productId}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body: ApiResponse<ProductImageDetail> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể thêm ảnh vào sản phẩm');
  }

  return body.data;
}

export async function updateProductImageApi(
  productId: number,
  imageId: number,
  payload: UpdateProductImagePayload
): Promise<ProductImageDetail> {
  const response = await fetch(`${BASE_URL}/products/${productId}/images/${imageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body: ApiResponse<ProductImageDetail> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể cập nhật thông tin ảnh');
  }

  return body.data;
}

export async function setPrimaryProductImageApi(
  productId: number,
  imageId: number
): Promise<ProductImageDetail> {
  const response = await fetch(`${BASE_URL}/products/${productId}/images/${imageId}/set-primary`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const body: ApiResponse<ProductImageDetail> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể đặt ảnh làm ảnh đại diện chính');
  }

  return body.data;
}

export async function reorderProductImagesApi(
  productId: number,
  imageIds: number[]
): Promise<ProductImageDetail[]> {
  const response = await fetch(`${BASE_URL}/products/${productId}/images/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ imageIds }),
  });

  const body: ApiResponse<ProductImageDetail[]> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể sắp xếp lại thứ tự ảnh');
  }

  return body.data;
}

export async function deleteProductImageApi(
  productId: number,
  imageId: number
): Promise<void> {
  const response = await fetch(`${BASE_URL}/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const body: ApiResponse<void> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể xóa ảnh sản phẩm');
  }
}
