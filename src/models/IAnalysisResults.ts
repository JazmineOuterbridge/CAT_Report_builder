export interface IEPCurve {
  probability: number;
  lossAmount: number;
}

export interface IPerilData {
  perilName: string;
  epCurve: IEPCurve[];
  aal: number;
  tiv: number;
  databaseVersion?: string;
  reinsuranceDetails?: string;
}

export interface IComparisonData {
  currentYear: IPerilData;
  previousYear?: IPerilData;
  percentageChange?: {
    aal: number;
    tiv: number;
    epCurve: IEPCurve[];
  };
}

export interface IBrokerComparison {
  company: IPerilData;
  broker: IPerilData;
  percentageDifference: {
    aal: number;
    tiv: number;
    epCurve: IEPCurve[];
  };
}

export interface IAnalysisResults {
  drivingPeril: string;
  perils: {
    [perilName: string]: IComparisonData;
  };
  brokerComparisons?: {
    [perilName: string]: IBrokerComparison;
  };
  aggregatedMetrics: {
    totalAAL: number;
    totalTIV: number;
    mainDrivingFactor: string;
  };
  databaseInfo: {
    currentYear: string[];
    previousYear?: string[];
    brokerCurrentYear?: string[];
    brokerPreviousYear?: string[];
    versions: { [databaseName: string]: string };
  };
  notes: {
    mainDrivingPeril: string;
    aalPercentageChange: number;
    exposureChangeAnalysis: string;
    brokerComparisonNotes?: string;
    reinsuranceDetails: string;
  };
} 