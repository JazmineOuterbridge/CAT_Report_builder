import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IAnalysisResults, IPerilData, IEPCurve } from '../models/IAnalysisResults';
import { IDatabaseRequest } from './RiskModelerApiService';

export class MockRiskModelerApiService {
  private apiEndpoint: string;
  private apiVersion: string;
  private context: WebPartContext;

  constructor(apiEndpoint: string, apiVersion: string, context: WebPartContext) {
    this.apiEndpoint = apiEndpoint;
    this.apiVersion = apiVersion;
    this.context = context;
  }

  public async getAnalysisData(request: IDatabaseRequest): Promise<IAnalysisResults> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock data based on database names
    const companyCurrentData = this.generateMockDatabaseData(request.companyCurrentYear, 'current');
    const companyPreviousData = request.companyPreviousYear.length > 0 
      ? this.generateMockDatabaseData(request.companyPreviousYear, 'previous')
      : null;
    const brokerCurrentData = request.brokerCurrentYear.length > 0
      ? this.generateMockDatabaseData(request.brokerCurrentYear, 'broker-current')
      : null;
    const brokerPreviousData = request.brokerPreviousYear.length > 0
      ? this.generateMockDatabaseData(request.brokerPreviousYear, 'broker-previous')
      : null;

    // Process and aggregate data
    const results = this.processAnalysisData(
      companyCurrentData,
      companyPreviousData,
      brokerCurrentData,
      brokerPreviousData,
      request
    );

    return results;
  }

  private generateMockDatabaseData(databases: string[], type: string): any[] {
    const results = [];
    
    databases.forEach((database, index) => {
      const baseMultiplier = type.includes('previous') ? 0.9 : 1.0;
      const brokerMultiplier = type.includes('broker') ? 0.95 : 1.0;
      const finalMultiplier = baseMultiplier * brokerMultiplier;

      results.push({
        database,
        data: {
          version: `v6.${Math.floor(Math.random() * 5) + 1}`,
          perils: [
            {
              name: 'Hurricane',
              aal: 15000000 * finalMultiplier,
              tiv: 500000000 * finalMultiplier,
              epCurve: this.generateMockEPCurve(15000000 * finalMultiplier)
            },
            {
              name: 'Earthquake',
              aal: 8000000 * finalMultiplier,
              tiv: 300000000 * finalMultiplier,
              epCurve: this.generateMockEPCurve(8000000 * finalMultiplier)
            },
            {
              name: 'Flood',
              aal: 5000000 * finalMultiplier,
              tiv: 200000000 * finalMultiplier,
              epCurve: this.generateMockEPCurve(5000000 * finalMultiplier)
            },
            {
              name: 'Tornado',
              aal: 3000000 * finalMultiplier,
              tiv: 150000000 * finalMultiplier,
              epCurve: this.generateMockEPCurve(3000000 * finalMultiplier)
            }
          ]
        },
        type
      });
    });

    return results;
  }

  private generateMockEPCurve(maxLoss: number): IEPCurve[] {
    const probabilities = [1, 2, 5, 10, 20, 50, 100];
    return probabilities.map(prob => ({
      probability: prob,
      lossAmount: maxLoss * (prob / 100) * (0.8 + Math.random() * 0.4)
    }));
  }

  private processAnalysisData(
    companyCurrent: any[],
    companyPrevious: any[] | null,
    brokerCurrent: any[] | null,
    brokerPrevious: any[] | null,
    request: IDatabaseRequest
  ): IAnalysisResults {
    // Aggregate current year company data
    const aggregatedCurrent = this.aggregatePerilData(companyCurrent);
    
    // Aggregate previous year company data
    const aggregatedPrevious = companyPrevious ? this.aggregatePerilData(companyPrevious) : null;
    
    // Aggregate broker data
    const aggregatedBrokerCurrent = brokerCurrent ? this.aggregatePerilData(brokerCurrent) : null;
    const aggregatedBrokerPrevious = brokerPrevious ? this.aggregatePerilData(brokerPrevious) : null;

    // Find driving peril (highest AAL)
    const drivingPeril = this.findDrivingPeril(aggregatedCurrent);

    // Create comparison data for each peril
    const perils: { [perilName: string]: any } = {};
    Object.keys(aggregatedCurrent).forEach(perilName => {
      const currentData = aggregatedCurrent[perilName];
      const previousData = aggregatedPrevious?.[perilName];
      
      perils[perilName] = {
        currentYear: currentData,
        previousYear: previousData,
        percentageChange: previousData ? this.calculatePercentageChange(currentData, previousData) : null
      };
    });

    // Create broker comparisons
    const brokerComparisons: { [perilName: string]: any } = {};
    if (aggregatedBrokerCurrent) {
      Object.keys(aggregatedCurrent).forEach(perilName => {
        const companyData = aggregatedCurrent[perilName];
        const brokerData = aggregatedBrokerCurrent[perilName];
        
        if (brokerData) {
          brokerComparisons[perilName] = {
            company: companyData,
            broker: brokerData,
            percentageDifference: this.calculatePercentageDifference(companyData, brokerData)
          };
        }
      });
    }

    // Calculate aggregated metrics
    const totalAAL = Object.values(aggregatedCurrent).reduce((sum: number, peril: any) => sum + peril.aal, 0);
    const totalTIV = Object.values(aggregatedCurrent).reduce((sum: number, peril: any) => sum + peril.tiv, 0);

    // Generate notes
    const notes = this.generateNotes(
      drivingPeril,
      perils[drivingPeril],
      brokerComparisons,
      request,
      aggregatedCurrent,
      aggregatedPrevious
    );

    return {
      drivingPeril,
      perils,
      brokerComparisons: Object.keys(brokerComparisons).length > 0 ? brokerComparisons : undefined,
      aggregatedMetrics: {
        totalAAL,
        totalTIV,
        mainDrivingFactor: drivingPeril
      },
      databaseInfo: {
        currentYear: request.companyCurrentYear,
        previousYear: request.companyPreviousYear.length > 0 ? request.companyPreviousYear : undefined,
        brokerCurrentYear: request.brokerCurrentYear.length > 0 ? request.brokerCurrentYear : undefined,
        brokerPreviousYear: request.brokerPreviousYear.length > 0 ? request.brokerPreviousYear : undefined,
        versions: this.extractVersions(companyCurrent, companyPrevious, brokerCurrent, brokerPrevious)
      },
      notes
    };
  }

  private aggregatePerilData(databases: any[]): { [perilName: string]: IPerilData } {
    const aggregated: { [perilName: string]: IPerilData } = {};
    
    databases.forEach(db => {
      db.data.perils.forEach((peril: any) => {
        if (!aggregated[peril.name]) {
          aggregated[peril.name] = {
            perilName: peril.name,
            epCurve: peril.epCurve,
            aal: 0,
            tiv: 0,
            databaseVersion: db.data.version
          };
        }
        
        // Aggregate AAL and TIV (sum across databases)
        aggregated[peril.name].aal += peril.aal;
        aggregated[peril.name].tiv += peril.tiv;
      });
    });

    return aggregated;
  }

  private findDrivingPeril(aggregatedData: { [perilName: string]: IPerilData }): string {
    let maxAAL = 0;
    let drivingPeril = '';

    Object.entries(aggregatedData).forEach(([perilName, perilData]) => {
      if (perilData.aal > maxAAL) {
        maxAAL = perilData.aal;
        drivingPeril = perilName;
      }
    });

    return drivingPeril;
  }

  private calculatePercentageChange(current: IPerilData, previous: IPerilData): any {
    return {
      aal: ((current.aal - previous.aal) / previous.aal) * 100,
      tiv: ((current.tiv - previous.tiv) / previous.tiv) * 100,
      epCurve: current.epCurve.map((point, index) => ({
        probability: point.probability,
        lossAmount: previous.epCurve[index] ? 
          ((point.lossAmount - previous.epCurve[index].lossAmount) / previous.epCurve[index].lossAmount) * 100 : 0
      }))
    };
  }

  private calculatePercentageDifference(company: IPerilData, broker: IPerilData): any {
    return {
      aal: ((company.aal - broker.aal) / broker.aal) * 100,
      tiv: ((company.tiv - broker.tiv) / broker.tiv) * 100,
      epCurve: company.epCurve.map((point, index) => ({
        probability: point.probability,
        lossAmount: broker.epCurve[index] ? 
          ((point.lossAmount - broker.epCurve[index].lossAmount) / broker.epCurve[index].lossAmount) * 100 : 0
      }))
    };
  }

  private generateNotes(
    drivingPeril: string,
    drivingPerilData: any,
    brokerComparisons: any,
    request: IDatabaseRequest,
    aggregatedCurrent: any,
    aggregatedPrevious: any
  ): any {
    const aalPercentageChange = drivingPerilData.percentageChange?.aal || 0;
    
    // Generate exposure change analysis
    let exposureChangeAnalysis = 'No previous year data available for comparison.';
    if (aggregatedPrevious) {
      const totalTIVCurrent = Object.values(aggregatedCurrent).reduce((sum: number, peril: any) => sum + peril.tiv, 0);
      const totalTIVPrevious = Object.values(aggregatedPrevious).reduce((sum: number, peril: any) => sum + peril.tiv, 0);
      const tivChange = ((totalTIVCurrent - totalTIVPrevious) / totalTIVPrevious) * 100;
      exposureChangeAnalysis = `Total TIV ${tivChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(tivChange).toFixed(1)}% compared to previous year.`;
    }

    // Generate broker comparison notes
    let brokerComparisonNotes = '';
    if (Object.keys(brokerComparisons).length > 0) {
      const mainPerilComparison = brokerComparisons[drivingPeril];
      if (mainPerilComparison) {
        const aalDiff = mainPerilComparison.percentageDifference.aal;
        brokerComparisonNotes = `Company AAL is ${Math.abs(aalDiff).toFixed(1)}% ${aalDiff >= 0 ? 'higher' : 'lower'} than broker AAL for ${drivingPeril}.`;
      }
    }

    // Generate reinsurance details
    const reinsuranceDetails = 'Mock reinsurance details: 50% quota share on hurricane (2025), 40% on earthquake (2025).';

    return {
      mainDrivingPeril: drivingPeril,
      aalPercentageChange,
      exposureChangeAnalysis,
      brokerComparisonNotes: brokerComparisonNotes || undefined,
      reinsuranceDetails
    };
  }

  private extractVersions(companyCurrent: any[], companyPrevious: any[] | null, brokerCurrent: any[] | null, brokerPrevious: any[] | null): { [databaseName: string]: string } {
    const versions: { [databaseName: string]: string } = {};
    
    [...companyCurrent, ...(companyPrevious || []), ...(brokerCurrent || []), ...(brokerPrevious || [])].forEach(db => {
      versions[db.database] = db.data.version || 'Unknown';
    });

    return versions;
  }
} 