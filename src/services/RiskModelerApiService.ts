import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IAnalysisResults, IPerilData, IEPCurve } from '../models/IAnalysisResults';

export interface IDatabaseRequest {
  companyCurrentYear: string[];
  companyPreviousYear: string[];
  brokerCurrentYear: string[];
  brokerPreviousYear: string[];
}

export class RiskModelerApiService {
  private apiEndpoint: string;
  private apiVersion: string;
  private context: WebPartContext;

  constructor(apiEndpoint: string, apiVersion: string, context: WebPartContext) {
    this.apiEndpoint = apiEndpoint;
    this.apiVersion = apiVersion;
    this.context = context;
  }

  public async getAnalysisData(request: IDatabaseRequest): Promise<IAnalysisResults> {
    try {
      // Get authentication token
      const token = await this.getAuthToken();
      
      // Fetch data for all databases
      const companyCurrentData = await this.fetchDatabaseData(request.companyCurrentYear, token, 'current');
      const companyPreviousData = request.companyPreviousYear.length > 0 
        ? await this.fetchDatabaseData(request.companyPreviousYear, token, 'previous')
        : null;
      const brokerCurrentData = request.brokerCurrentYear.length > 0
        ? await this.fetchDatabaseData(request.brokerCurrentYear, token, 'broker-current')
        : null;
      const brokerPreviousData = request.brokerPreviousYear.length > 0
        ? await this.fetchDatabaseData(request.brokerPreviousYear, token, 'broker-previous')
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
    } catch (error) {
      console.warn("Moody's API failed, falling back to SQL:", error);
      // Fallback: fetch from SQL database
      const companyCurrentData = await this.fetchDatabaseDataFromSQL(request.companyCurrentYear, 'current');
      const companyPreviousData = request.companyPreviousYear.length > 0 
        ? await this.fetchDatabaseDataFromSQL(request.companyPreviousYear, 'previous')
        : null;
      const brokerCurrentData = request.brokerCurrentYear.length > 0
        ? await this.fetchDatabaseDataFromSQL(request.brokerCurrentYear, 'broker-current')
        : null;
      const brokerPreviousData = request.brokerPreviousYear.length > 0
        ? await this.fetchDatabaseDataFromSQL(request.brokerPreviousYear, 'broker-previous')
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
  }

  private async getAuthToken(): Promise<string> {
    // Use SharePoint's authentication to get token for Moody's API
    const token = await this.context.aadTokenProviderFactory.getTokenProvider();
    return await token.getToken(this.apiEndpoint);
  }

  private async fetchDatabaseData(databases: string[], token: string, type: string): Promise<any[]> {
    const results = [];
    
    for (const database of databases) {
      try {
        const response = await fetch(`${this.apiEndpoint}/riskmodeler/${this.apiVersion}/perils`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Database': database
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data for database ${database}: ${response.statusText}`);
        }

        const data = await response.json();
        results.push({
          database,
          data,
          type
        });
      } catch (error) {
        console.error(`Error fetching data for database ${database}:`, error);
        throw error;
      }
    }

    return results;
  }

  // Fallback: Fetch data from SQL database (to be implemented)
  private async fetchDatabaseDataFromSQL(databases: string[], type: string): Promise<any[]> {
    // TODO: Implement actual SQL fetch logic here
    // This should return an array of objects in the same format as fetchDatabaseData
    // Example placeholder:
    return databases.map(database => ({
      database,
      data: {
        version: 'SQL_v1',
        perils: [] // Populate with actual peril data from SQL
      },
      type
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
    const reinsuranceDetails = 'Reinsurance details to be populated from API data or manual input.';

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