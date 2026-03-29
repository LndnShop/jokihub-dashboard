export interface BaseRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
}

export interface Order extends BaseRecord {
  nama_customer: string;
  customer_phone: string;
  jenis_joki: string;
  deadline: string;
  total_harga: number;
  detail_joki: string;
  jumlah: number;
  catatan?: string;
  worker?: string;
  completed?: boolean;
}

export interface Ticket extends Order {
  completed_by?: string;
  chat_history?: string;
}
