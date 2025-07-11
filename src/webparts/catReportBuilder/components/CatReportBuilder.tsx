import * as React from 'react';
import { ICatReportBuilderProps } from './ICatReportBuilderProps';
import { ICatReportBuilderState } from './ICatReportBuilderState';
import { DatabaseInput } from './DatabaseInput';
import { ResultsDisplay } from './ResultsDisplay';
import { ExcelGenerator } from './ExcelGenerator';
import { RiskModelerApiService } from '../../services/RiskModelerApiService';
import { MockRiskModelerApiService } from '../../services/MockRiskModelerApiService';
import './CatReportBuilder.module.scss';

export default class CatReportBuilder extends React.Component<ICatReportBuilderProps, ICatReportBuilderState> {
  private apiService: RiskModelerApiService;

  constructor(props: ICatReportBuilderProps) {
    super(props);
    
    // Use mock service for testing - replace with real service for production
    this.apiService = new MockRiskModelerApiService(props.apiEndpoint, props.apiVersion, props.context);
    
    this.state = {
      companyCurrentYear: [''],
      companyPreviousYear: [''],
      brokerCurrentYear: [''],
      brokerPreviousYear: [''],
      isLoading: false,
      results: null,
      error: null,
      showResults: false
    };
  }

  private handleDatabaseChange = (type: string, index: number, value: string) => {
    const newState = { ...this.state };
    newState[type][index] = value;
    this.setState(newState);
  };

  private handleAddDatabase = (type: string) => {
    const newState = { ...this.state };
    newState[type].push('');
    this.setState(newState);
  };

  private handleRemoveDatabase = (type: string, index: number) => {
    const newState = { ...this.state };
    newState[type].splice(index, 1);
    this.setState(newState);
  };

  private handleSubmit = async () => {
    // Validate inputs
    const currentYearDatabases = this.state.companyCurrentYear.filter(db => db.trim() !== '');
    if (currentYearDatabases.length === 0) {
      this.setState({ error: 'At least one current year company database is required.' });
      return;
    }

    this.setState({ isLoading: true, error: null, showResults: false });

    try {
      const results = await this.apiService.getAnalysisData({
        companyCurrentYear: currentYearDatabases,
        companyPreviousYear: this.state.companyPreviousYear.filter(db => db.trim() !== ''),
        brokerCurrentYear: this.state.brokerCurrentYear.filter(db => db.trim() !== ''),
        brokerPreviousYear: this.state.brokerPreviousYear.filter(db => db.trim() !== '')
      });

      this.setState({
        results,
        isLoading: false,
        showResults: true
      });
    } catch (error) {
      this.setState({
        error: error.message || 'An error occurred while fetching data.',
        isLoading: false
      });
    }
  };

  private handleDownloadExcel = () => {
    if (this.state.results) {
      ExcelGenerator.generateExcel(this.state.results);
    }
  };

  public render(): React.ReactElement<ICatReportBuilderProps> {
    return (
      <div className="cat-report-builder">
        <div className="header">
          <h2>CAT Report Builder</h2>
          <p>Generate catastrophe analysis reports from Moody's RiskModeler data</p>
        </div>

        {!this.state.showResults && (
          <div className="input-section">
            <div className="database-inputs">
              <div className="input-group">
                <h3>Company Databases</h3>
                <DatabaseInput
                  title="Current Year"
                  databases={this.state.companyCurrentYear}
                  onChange={(index, value) => this.handleDatabaseChange('companyCurrentYear', index, value)}
                  onAdd={() => this.handleAddDatabase('companyCurrentYear')}
                  onRemove={(index) => this.handleRemoveDatabase('companyCurrentYear', index)}
                  required={true}
                />
                <DatabaseInput
                  title="Previous Year (Optional)"
                  databases={this.state.companyPreviousYear}
                  onChange={(index, value) => this.handleDatabaseChange('companyPreviousYear', index, value)}
                  onAdd={() => this.handleAddDatabase('companyPreviousYear')}
                  onRemove={(index) => this.handleRemoveDatabase('companyPreviousYear', index)}
                  required={false}
                />
              </div>

              <div className="input-group">
                <h3>Broker Databases</h3>
                <DatabaseInput
                  title="Current Year (Optional)"
                  databases={this.state.brokerCurrentYear}
                  onChange={(index, value) => this.handleDatabaseChange('brokerCurrentYear', index, value)}
                  onAdd={() => this.handleAddDatabase('brokerCurrentYear')}
                  onRemove={(index) => this.handleRemoveDatabase('brokerCurrentYear', index)}
                  required={false}
                />
                <DatabaseInput
                  title="Previous Year (Optional)"
                  databases={this.state.brokerPreviousYear}
                  onChange={(index, value) => this.handleDatabaseChange('brokerPreviousYear', index, value)}
                  onAdd={() => this.handleAddDatabase('brokerPreviousYear')}
                  onRemove={(index) => this.handleRemoveDatabase('brokerPreviousYear', index)}
                  required={false}
                />
              </div>
            </div>

            <div className="submit-section">
              <button 
                className="submit-button"
                onClick={this.handleSubmit}
                disabled={this.state.isLoading}
              >
                {this.state.isLoading ? 'Processing...' : 'Submit'}
              </button>
            </div>

            {this.state.error && (
              <div className="error-message">
                {this.state.error}
              </div>
            )}
          </div>
        )}

        {this.state.showResults && this.state.results && (
          <div className="results-section">
            <ResultsDisplay 
              results={this.state.results}
              onDownload={this.handleDownloadExcel}
            />
          </div>
        )}

        {this.state.isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Fetching data from Moody's RiskModeler API...</p>
          </div>
        )}
      </div>
    );
  }
} 