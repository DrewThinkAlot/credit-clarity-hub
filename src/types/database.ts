export interface Report {
  id: string;
  user_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  potential_score_increase: number;
  total_discrepancies: number;
  total_letters: number;
  experian_file_path: string | null;
  equifax_file_path: string | null;
  transunion_file_path: string | null;
  raw_analysis: any;
  created_at: string;
  updated_at: string;
}

export interface Discrepancy {
  id: string;
  report_id: string;
  user_id: string;
  account_name: string;
  equifax_status: string | null;
  experian_status: string | null;
  transunion_status: string | null;
  has_conflict: boolean;
  severity: "low" | "medium" | "high";
  recommended_action: string | null;
  discrepancy_type: "dispute" | "pay-for-delete" | "validation" | null;
  success_probability: number | null;
  amount: number | null;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Letter {
  id: string;
  report_id: string | null;
  discrepancy_id: string | null;
  user_id: string;
  title: string;
  bureau: "experian" | "equifax" | "transunion";
  status: "draft" | "sent" | "response";
  content: string;
  account_name: string | null;
  sent_date: string | null;
  response_due_date: string | null;
  resolution_status: string | null;
  response_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  address: string | null;
  phone: string | null;
  ssn_last_four: string | null;
  notification_email_enabled: boolean;
  notification_analysis_complete: boolean;
  notification_response_received: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  file: File;
  bureau: "experian" | "equifax" | "transunion" | "unknown";
}

export interface AnalysisResult {
  success: boolean;
  reportId?: string;
  potential_score_increase?: number;
  discrepancies_count?: number;
  error?: string;
}

export interface GenerateLetterResult {
  success: boolean;
  letter?: {
    id: string;
    title: string;
    bureau: string;
    content: string;
    status: string;
    created_at: string;
  };
  error?: string;
}
