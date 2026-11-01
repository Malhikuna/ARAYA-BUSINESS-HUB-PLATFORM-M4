export interface Customer {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  isNew?: boolean;
  createdAt?: string;
}

export interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
}

