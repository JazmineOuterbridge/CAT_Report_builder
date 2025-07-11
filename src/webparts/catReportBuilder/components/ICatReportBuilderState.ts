import { IAnalysisResults } from '../../models/IAnalysisResults';

export interface ICatReportBuilderState {
  companyCurrentYear: string[];
  companyPreviousYear: string[];
  brokerCurrentYear: string[];
  brokerPreviousYear: string[];
  isLoading: boolean;
  results: IAnalysisResults | null;
  error: string | null;
  showResults: boolean;
} 