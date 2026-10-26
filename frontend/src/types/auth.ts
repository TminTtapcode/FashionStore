export interface WelcomeCoupon {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  roles: string[];
  welcomeCoupon?: WelcomeCoupon | null;
}

export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string>;
      path?: string;
    };
  } | null;
}
