import * as React from 'react';
import { IAnalysisResults } from '../../models/IAnalysisResults';
import { EPCurveChart } from './EPCurveChart';
import './ResultsDisplay.module.scss';

export interface IResultsDisplayProps {
  results: IAnalysisResults;
  onDownload: () => void;
}

export const ResultsDisplay: React.FC<IResultsDisplayProps> = ({
  results,
  onDownload
}) => {
  const drivingPerilData = results.perils[results.drivingPeril];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="results-display">
      <div className="results-header">
        <h3>Analysis Results</h3>
        <button 
          className="download-button"
          onClick={onDownload}
        >
          Download Excel Report
        </button>
      </div>

      <div className="driving-peril-section">
        <h4>Driving Peril: {results.drivingPeril}</h4>
        
        <div className="metrics-table">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current Year</th>
                {drivingPerilData.previousYear && <th>Previous Year</th>}
                {drivingPerilData.percentageChange && <th>% Change</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>AAL</td>
                <td>{formatCurrency(drivingPerilData.currentYear.aal)}</td>
                {drivingPerilData.previousYear && (
                  <td>{formatCurrency(drivingPerilData.previousYear.aal)}</td>
                )}
                {drivingPerilData.percentageChange && (
                  <td className={drivingPerilData.percentageChange.aal >= 10 ? 'high-change' : ''}>
                    {formatPercentage(drivingPerilData.percentageChange.aal)}
                  </td>
                )}
              </tr>
              <tr>
                <td>TIV</td>
                <td>{formatCurrency(drivingPerilData.currentYear.tiv)}</td>
                {drivingPerilData.previousYear && (
                  <td>{formatCurrency(drivingPerilData.previousYear.tiv)}</td>
                )}
                {drivingPerilData.percentageChange && (
                  <td className={drivingPerilData.percentageChange.tiv >= 10 ? 'high-change' : ''}>
                    {formatPercentage(drivingPerilData.percentageChange.tiv)}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ep-curve-section">
          <h5>Exceedance Probability Curve</h5>
          <EPCurveChart 
            currentYearData={drivingPerilData.currentYear.epCurve}
            previousYearData={drivingPerilData.previousYear?.epCurve}
          />
        </div>
      </div>

      {results.brokerComparisons && Object.keys(results.brokerComparisons).length > 0 && (
        <div className="broker-comparison-section">
          <h4>Broker Comparison</h4>
          {Object.entries(results.brokerComparisons).map(([perilName, comparison]) => (
            <div key={perilName} className="broker-comparison">
              <h5>{perilName}</h5>
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Company</th>
                    <th>Broker</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>AAL</td>
                    <td>{formatCurrency(comparison.company.aal)}</td>
                    <td>{formatCurrency(comparison.broker.aal)}</td>
                    <td className={Math.abs(comparison.percentageDifference.aal) >= 10 ? 'high-change' : ''}>
                      {formatPercentage(comparison.percentageDifference.aal)}
                    </td>
                  </tr>
                  <tr>
                    <td>TIV</td>
                    <td>{formatCurrency(comparison.company.tiv)}</td>
                    <td>{formatCurrency(comparison.broker.tiv)}</td>
                    <td className={Math.abs(comparison.percentageDifference.tiv) >= 10 ? 'high-change' : ''}>
                      {formatPercentage(comparison.percentageDifference.tiv)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <div className="summary-section">
        <h4>Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Total AAL:</label>
            <span>{formatCurrency(results.aggregatedMetrics.totalAAL)}</span>
          </div>
          <div className="summary-item">
            <label>Total TIV:</label>
            <span>{formatCurrency(results.aggregatedMetrics.totalTIV)}</span>
          </div>
          <div className="summary-item">
            <label>Main Factor:</label>
            <span>{results.aggregatedMetrics.mainDrivingFactor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 